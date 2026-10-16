"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Customer, Currency, CustomerCategory } from "@/lib/types";
import { KKTC_DISTRICTS, getRegionsByDistrict } from "@/lib/kktcLocations";
import {
  Users,
  X,
  Share2,
  Star,
  AlertTriangle,
  Plus,
  MapPin,
  Cake,
} from "lucide-react";
import { PhoneInput } from "@/components/common/PhoneInput";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newCustomer: Customer) => void;
  zIndex?: number;
  initialCategory?: CustomerCategory;
}

export function AddCustomerModal({
  isOpen,
  onClose,
  onSuccess,
  zIndex,
  initialCategory,
}: AddCustomerModalProps) {
  const {
    currentUser,
    isBroker,
    customers,
    users,
    addCustomer,
  } = useStore();

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formWhatsapp, setFormWhatsapp] = useState("");
  const [formInstagram, setFormInstagram] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formBirthDate, setFormBirthDate] = useState("");
  const [formCategory, setFormCategory] = useState<CustomerCategory>("BUYER");
  const [formTemperature, setFormTemperature] = useState<"hot" | "warm" | "cold">("warm");
  const [customerDistrict, setCustomerDistrict] = useState(KKTC_DISTRICTS[0]);
  const [customerSubRegion, setCustomerSubRegion] = useState(getRegionsByDistrict(KKTC_DISTRICTS[0])[0] || "");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([
    `${KKTC_DISTRICTS[0]} / ${getRegionsByDistrict(KKTC_DISTRICTS[0])[0]}`,
  ]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Daire"]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>(["2+1"]);
  const [formBudget, setFormBudget] = useState("");
  const [formCurrency, setFormCurrency] = useState<Currency>("GBP");
  const [formNotes, setFormNotes] = useState("");
  const [formIsShared, setFormIsShared] = useState(false);
  const [formVip, setFormVip] = useState(false);
  const [formAssigneeId, setFormAssigneeId] = useState(currentUser.id);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const prevIsOpenRef = React.useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setFormName("");
      setFormPhone("");
      setFormWhatsapp("");
      setFormInstagram("");
      setFormEmail("");
      setFormBirthDate("");
      setFormCategory(initialCategory || "BUYER");
      setFormTemperature("warm");
      setCustomerDistrict(KKTC_DISTRICTS[0]);
      setCustomerSubRegion(getRegionsByDistrict(KKTC_DISTRICTS[0])[0] || "");
      setSelectedRegions([
        `${KKTC_DISTRICTS[0]} / ${getRegionsByDistrict(KKTC_DISTRICTS[0])[0]}`,
      ]);
      setSelectedTypes(["Daire"]);
      setSelectedRooms(["2+1"]);
      setFormBudget("");
      setFormCurrency("GBP");
      setFormNotes("");
      setFormIsShared(false);
      setFormVip(false);
      setFormAssigneeId(currentUser.id);
      setDuplicateError(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  const handleDistrictChange = (d: string) => {
    setCustomerDistrict(d);
    const subs = getRegionsByDistrict(d);
    setCustomerSubRegion(subs[0] || "");
  };

  const handleAddRegion = () => {
    const full = `${customerDistrict} / ${customerSubRegion}`;
    if (!selectedRegions.includes(full)) {
      setSelectedRegions((prev) => [...prev, full]);
    }
  };

  const handleRemoveRegion = (reg: string) => {
    setSelectedRegions((prev) => prev.filter((r) => r !== reg));
  };

  const handleAddType = (type: string) => {
    if (type && !selectedTypes.includes(type)) {
      setSelectedTypes((prev) => [...prev, type]);
    }
  };

  const handleRemoveType = (type: string) => {
    setSelectedTypes((prev) => prev.filter((t) => t !== type));
  };

  const handleAddRoom = (room: string) => {
    if (room && !selectedRooms.includes(room)) {
      setSelectedRooms((prev) => [...prev, room]);
    }
  };

  const handleRemoveRoom = (room: string) => {
    setSelectedRooms((prev) => prev.filter((r) => r !== room));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone) return;

    // Telefon no duplikasyon kontrolü
    const cleanPhone = formPhone.replace(/\s+/g, "");
    const existing = customers.find(
      (c) => c.phone.replace(/\s+/g, "") === cleanPhone
    );
    if (existing) {
      setDuplicateError(`Bu telefon numarası (${formPhone}) zaten "${existing.fullName}" adına sistemde kayıtlıdır.`);
      return;
    }

    const assignedUser = users.find((u) => u.id === formAssigneeId) || currentUser;

    const finalRegion =
      selectedRegions.length > 0
        ? selectedRegions.join(", ")
        : `${customerDistrict} / ${customerSubRegion}`;
    const finalType =
      selectedTypes.length > 0 ? selectedTypes.join(", ") : "Daire";
    const finalRooms = selectedRooms.join(", ");

    const newCust = addCustomer({
      fullName: formName,
      phone: formPhone,
      whatsapp: formWhatsapp || formPhone,
      instagramHandle: formInstagram || undefined,
      email: formEmail,
      birthDate: formBirthDate || undefined,
      source: "manual",
      category: formCategory,
      temperature: formTemperature,
      isVip: formVip,
      region: finalRegion,
      propertyType: finalType,
      rooms: finalRooms,
      regions: selectedRegions,
      propertyTypes: selectedTypes,
      roomsList: selectedRooms,
      budget: Number(formBudget) || 0,
      budgetCurrency: formCurrency,
      notes: formNotes,
      stage: "NEW",
      assignedToId: assignedUser.id,
      assignedToName: assignedUser.name,
      isShared: formIsShared,
      lastContactAt: new Date().toISOString(),
    });

    onClose();
    if (onSuccess) onSuccess(newCust);
  };

  return (
    <div
      style={{ zIndex: zIndex || 70 }}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="sharp-card w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-300 bg-white shadow-2xl my-auto">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00adb5]" />
            <h2 className="text-sm font-bold text-[#1d2566]">
              Yeni Müşteri Kaydı
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {duplicateError && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2 font-mono">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{duplicateError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                Ad Soyad *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Örn: Selim Karadağ"
                className="sharp-input w-full p-2"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                Telefon Numarası *
              </label>
              <PhoneInput
                required
                value={formPhone}
                onChange={setFormPhone}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1">
                WhatsApp (Aynı ise boş)
              </label>
              <PhoneInput
                value={formWhatsapp}
                onChange={setFormWhatsapp}
                placeholder="Boşsa telefon kullanılır"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1">
                Instagram
              </label>
              <input
                type="text"
                value={formInstagram}
                onChange={(e) => setFormInstagram(e.target.value)}
                placeholder="@kullanici"
                className="sharp-input w-full p-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1">
                E-Posta
              </label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="ad@soyad.com"
                className="sharp-input w-full p-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 flex items-center gap-1 font-semibold text-[#1d2566]">
                <Cake className="w-3 h-3 text-pink-500" />
                <span>Doğum Tarihi (Ops.)</span>
              </label>
              <input
                type="date"
                lang="tr-TR"
                value={formBirthDate}
                onChange={(e) => setFormBirthDate(e.target.value)}
                className="sharp-input w-full p-2 font-mono bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                Müşteri Kategorisi
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as any)}
                className="sharp-input w-full p-2 bg-white"
              >
                <option value="BUYER">Alıcı Adayı</option>
                <option value="SELLER">Satıcı</option>
                <option value="TENANT">Kiracı</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                Sıcaklık Derecesi
              </label>
              <select
                value={formTemperature}
                onChange={(e) => setFormTemperature(e.target.value as any)}
                className="sharp-input w-full p-2 bg-white"
              >
                <option value="hot">Sıcak (Acil Alıcı)</option>
                <option value="warm">Ilık (Takipte)</option>
                <option value="cold">Soğuk (Pasif)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                Sorumlu Danışman
              </label>
              <select
                value={formAssigneeId}
                onChange={(e) => setFormAssigneeId(e.target.value)}
                className="sharp-input w-full p-2 bg-white"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === "ADMIN" ? "Broker" : "Danışman"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tercih Edilen Bölgeler (Çoklu Seçim & Tag Sistemi) */}
          <div className="bg-slate-50 p-3 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-700 font-mono text-[11px] font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#00adb5]" />
                <span>Tercih Edilen Bölgeler</span>
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                {selectedRegions.length} bölge seçili
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5">
                <select
                  value={customerDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="sharp-input w-full p-1.5 bg-white font-mono text-xs"
                >
                  {KKTC_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5">
                <select
                  value={customerSubRegion}
                  onChange={(e) => setCustomerSubRegion(e.target.value)}
                  className="sharp-input w-full p-1.5 bg-white font-mono text-xs"
                >
                  {getRegionsByDistrict(customerDistrict).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddRegion}
                  className="sharp-btn-primary w-full p-1.5 text-xs font-mono font-bold flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  title="Seçili bölgeyi ekle"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ekle</span>
                </button>
              </div>
            </div>

            {/* Seçilen Bölge Tag'leri */}
            <div className="flex flex-wrap gap-1.5 pt-1 min-h-[26px]">
              {selectedRegions.map((reg) => (
                <span
                  key={reg}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-[#00adb5]/40 text-[#1d2566] text-[11px] font-mono font-semibold shadow-2xs"
                >
                  <span>{reg}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRegion(reg)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer transition p-0.5"
                    title="Kaldır"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedRegions.length === 0 && (
                <span className="text-[10px] text-slate-400 font-mono italic">
                  Henüz bölge eklenmedi (Tüm KKTC geçerli sayılır)
                </span>
              )}
            </div>
          </div>

          {/* Gayrimenkul Tipleri & Oda Sayıları (Çoklu Tag Kutuları) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Gayrimenkul Tipleri */}
            <div className="bg-slate-50 p-2.5 border border-slate-200 space-y-1.5">
              <label className="block text-slate-700 font-mono text-[11px] font-bold flex items-center justify-between">
                <span>Gayrimenkul Tipleri</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  ({selectedTypes.length} seçili)
                </span>
              </label>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddType(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="sharp-input w-full p-1.5 bg-white text-xs"
              >
                <option value="">+ Tip Ekle...</option>
                <option value="Daire">Daire</option>
                <option value="Villa">Villa</option>
                <option value="Ticari / Dükkan">Ticari / Dükkan</option>
                <option value="Arsa">Arsa</option>
                <option value="Yalı / Köşk">Yalı / Köşk</option>
                <option value="Müstakil Ev">Müstakil Ev</option>
              </select>

              {/* Seçilen Tip Tag'leri */}
              <div className="flex flex-wrap gap-1.5 pt-1 min-h-[26px]">
                {selectedTypes.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-300 text-slate-800 text-[11px] font-medium shadow-2xs"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveType(t)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer transition p-0.5"
                      title="Kaldır"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedTypes.length === 0 && (
                  <span className="text-[10px] text-slate-400 font-mono italic">
                    Tip seçilmedi (Tümü)
                  </span>
                )}
              </div>
            </div>

            {/* 2. Oda Sayıları */}
            <div className="bg-slate-50 p-2.5 border border-slate-200 space-y-1.5">
              <label className="block text-slate-700 font-mono text-[11px] font-bold flex items-center justify-between">
                <span>Oda Sayıları</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  ({selectedRooms.length} seçili)
                </span>
              </label>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddRoom(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="sharp-input w-full p-1.5 bg-white font-mono text-xs"
              >
                <option value="">+ Oda Sayısı Ekle...</option>
                <option value="Stüdyo (1+0)">Stüdyo (1+0)</option>
                <option value="1+1">1+1</option>
                <option value="2+1">2+1</option>
                <option value="3+1">3+1</option>
                <option value="4+1">4+1</option>
                <option value="5+1">5+1</option>
                <option value="5+2 ve Üzeri">5+2 ve Üzeri</option>
                <option value="Dubleks / Çatı Dubleksi">Dubleks / Çatı Dubleksi</option>
                <option value="Müstakil Villa">Müstakil Villa</option>
              </select>

              {/* Seçilen Oda Tag'leri */}
              <div className="flex flex-wrap gap-1.5 pt-1 min-h-[26px]">
                {selectedRooms.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-mono font-bold shadow-2xs"
                  >
                    <span>{r}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRoom(r)}
                      className="text-emerald-600 hover:text-rose-600 cursor-pointer transition p-0.5"
                      title="Kaldır"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedRooms.length === 0 && (
                  <span className="text-[10px] text-slate-400 font-mono italic">
                    Oda seçilmedi (Farketmez)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bütçe ve Para Birimi */}
          <div>
            <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
              Bütçe ve Para Birimi *
            </label>
            <div className="flex gap-1.5">
              <input
                type="number"
                required
                value={formBudget}
                onChange={(e) => setFormBudget(e.target.value)}
                placeholder="Örn: 150000"
                className="sharp-input flex-1 p-2 font-mono font-bold"
              />
              <select
                value={formCurrency}
                onChange={(e) => setFormCurrency(e.target.value as any)}
                className="sharp-input w-28 p-2 font-mono bg-white font-bold text-[#1d2566]"
              >
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="TRY">TRY (₺)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-mono text-[11px] mb-1">
              Özel Notlar & Talep Detayları
            </label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Müşterinin özel istekleri, ödeme koşulları, kredi durumu vb."
              className="sharp-input w-full p-2"
            />
          </div>

          {/* Paylaşım & VIP Seçenekleri */}
          <div className="space-y-2 pt-1 border-t border-slate-200">
            <div className="p-3 bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="modalCustomerShare"
                checked={formIsShared}
                onChange={(e) => setFormIsShared(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-[#00adb5] rounded-none cursor-pointer"
              />
              <label htmlFor="modalCustomerShare" className="cursor-pointer">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-[#00adb5]" />
                  Diğer Danışmanlara Paylaş
                </span>
                <span className="text-[11px] text-slate-500 block font-mono mt-0.5">
                  İşaretlenirse bu talep diğer danışmanların &quot;Paylaşılan Müşteriler&quot; havuzunda da listelenir.
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2 p-1">
              <input
                type="checkbox"
                id="modalCustomerVip"
                checked={formVip}
                onChange={(e) => setFormVip(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded-none cursor-pointer"
              />
              <label
                htmlFor="modalCustomerVip"
                className="text-xs text-amber-800 font-mono flex items-center gap-1 cursor-pointer font-semibold"
              >
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                Bu müşteriyi VIP Adayı olarak işaretle
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              className="sharp-btn-primary px-4 py-1.5 font-bold text-white shadow-2xs cursor-pointer"
            >
              Müşteriyi Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
