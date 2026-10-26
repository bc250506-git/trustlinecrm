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
  Check,
} from "lucide-react";
import { PhoneInput } from "@/components/common/PhoneInput";
import { DateInput } from "@/components/common/DateInput";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (savedCustomer: Customer) => void;
  zIndex?: number;
  initialCategory?: CustomerCategory;
  customerToEdit?: Customer | null;
}

export function AddCustomerModal({
  isOpen,
  onClose,
  onSuccess,
  zIndex,
  initialCategory,
  customerToEdit,
}: AddCustomerModalProps) {
  const {
    currentUser,
    isBroker,
    customers,
    users,
    addCustomer,
    updateCustomer,
  } = useStore();

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formWhatsapp, setFormWhatsapp] = useState("");
  const [formInstagram, setFormInstagram] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formBirthDate, setFormBirthDate] = useState("");
  const [formCategory, setFormCategory] = useState<CustomerCategory>("BUYER");
  const [formTemperature, setFormTemperature] = useState<"hot" | "warm" | "cold">("warm");
  const [isAlsoBuyer, setIsAlsoBuyer] = useState(false);
  const [customerDistrict, setCustomerDistrict] = useState(KKTC_DISTRICTS[0] || "Girne");
  const [customerSubRegion, setCustomerSubRegion] = useState(getRegionsByDistrict(KKTC_DISTRICTS[0] || "Girne")[0] || "");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [formBudget, setFormBudget] = useState("");
  const [formCurrency, setFormCurrency] = useState<Currency>("GBP");
  const [formNotes, setFormNotes] = useState("");
  const [formIsShared, setFormIsShared] = useState(false);
  const [formVip, setFormVip] = useState(false);
  const [formAssigneeId, setFormAssigneeId] = useState(currentUser.id);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const isBuyerCandidate = formCategory === "BUYER" || isAlsoBuyer;

  const prevIsOpenRef = React.useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (customerToEdit) {
        setFormName(customerToEdit.fullName || "");
        setFormPhone(customerToEdit.phone || "");
        setFormWhatsapp(customerToEdit.whatsapp || "");
        setFormInstagram(customerToEdit.instagramHandle || "");
        setFormEmail(customerToEdit.email || "");
        setFormBirthDate(customerToEdit.birthDate || "");

        const isDualSeller =
          customerToEdit.category === "SELLER_AND_BUYER" ||
          (customerToEdit.category === "SELLER" && Boolean(customerToEdit.isAlsoBuyer));
        const isDualTenant =
          customerToEdit.category === "TENANT_AND_BUYER" ||
          (customerToEdit.category === "TENANT" && Boolean(customerToEdit.isAlsoBuyer));

        if (isDualSeller) {
          setFormCategory("SELLER");
          setIsAlsoBuyer(true);
        } else if (isDualTenant) {
          setFormCategory("TENANT");
          setIsAlsoBuyer(true);
        } else {
          setFormCategory(customerToEdit.category || "BUYER");
          setIsAlsoBuyer(Boolean(customerToEdit.isAlsoBuyer));
        }
        setFormTemperature(customerToEdit.temperature || "warm");

        const parsedRegs =
          customerToEdit.regions && customerToEdit.regions.length > 0
            ? customerToEdit.regions
            : customerToEdit.region
            ? customerToEdit.region.split(",").map((s) => s.trim()).filter(Boolean)
            : [];
        setSelectedRegions(parsedRegs);

        const parsedTypes =
          customerToEdit.propertyTypes && customerToEdit.propertyTypes.length > 0
            ? customerToEdit.propertyTypes
            : customerToEdit.propertyType
            ? customerToEdit.propertyType.split(",").map((s) => s.trim()).filter(Boolean)
            : [];
        setSelectedTypes(parsedTypes);

        const parsedRooms =
          customerToEdit.roomsList && customerToEdit.roomsList.length > 0
            ? customerToEdit.roomsList
            : customerToEdit.rooms
            ? customerToEdit.rooms.split(",").map((s) => s.trim()).filter(Boolean)
            : [];
        setSelectedRooms(parsedRooms);

        setFormBudget(customerToEdit.budget ? String(customerToEdit.budget) : "");
        setFormCurrency(customerToEdit.budgetCurrency || "GBP");
        setFormNotes(customerToEdit.notes || "");
        setFormIsShared(!!customerToEdit.isShared);
        setFormVip(!!customerToEdit.isVip);
        setFormAssigneeId(customerToEdit.assignedToId || currentUser.id);
        setDuplicateError(null);
      } else if (!prevIsOpenRef.current) {
        setFormName("");
        setFormPhone("");
        setFormWhatsapp("");
        setFormInstagram("");
        setFormEmail("");
        setFormBirthDate("");
        setFormCategory(initialCategory || "BUYER");
        setIsAlsoBuyer(false);
        setFormTemperature("warm");
        setCustomerDistrict(KKTC_DISTRICTS[0] || "Girne");
        setCustomerSubRegion(getRegionsByDistrict(KKTC_DISTRICTS[0] || "Girne")[0] || "");
        setSelectedRegions([]);
        setSelectedTypes([]);
        setSelectedRooms([]);
        setFormBudget("");
        setFormCurrency("GBP");
        setFormNotes("");
        setFormIsShared(false);
        setFormVip(false);
        setFormAssigneeId(currentUser.id);
        setDuplicateError(null);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialCategory, customerToEdit, currentUser.id]);

  if (!isOpen) return null;

  const handleDistrictChange = (d: string) => {
    setCustomerDistrict(d);
    const subs = getRegionsByDistrict(d);
    setCustomerSubRegion(subs[0] || "");
  };

  const handleAddRegion = () => {
    const full = `${customerDistrict} / ${customerSubRegion}`;
    if (!selectedRegions.includes(full)) {
      setSelectedRegions((prev) => [...prev, full].sort((a, b) => a.localeCompare(b, "tr-TR")));
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

    // Telefon no duplikasyon kontrolü (kendi telefon numarasını düzenlerken hata vermemeli)
    const cleanPhone = formPhone.replace(/\s+/g, "");
    const existing = customers.find(
      (c) => c.phone.replace(/\s+/g, "") === cleanPhone && c.id !== customerToEdit?.id
    );
    if (existing) {
      setDuplicateError(`Bu telefon numarası (${formPhone}) zaten "${existing.fullName}" adına sistemde kayıtlıdır.`);
      return;
    }

    const finalAssigneeId = isBroker
      ? formAssigneeId
      : (customerToEdit ? (customerToEdit.assignedToId || currentUser.id) : currentUser.id);
    const assignedUser = users.find((u) => u.id === finalAssigneeId) || currentUser;

    const isSeller = formCategory === "SELLER";
    const isTenant = formCategory === "TENANT";
    const shouldSaveCriteria = isBuyerCandidate;

    let finalCategory: CustomerCategory = formCategory;
    if (isSeller && isAlsoBuyer) {
      finalCategory = "SELLER_AND_BUYER";
    } else if (isTenant && isAlsoBuyer) {
      finalCategory = "TENANT_AND_BUYER";
    }
    const finalIsAlsoBuyer = (isSeller || isTenant) && isAlsoBuyer;

    const finalRegion = shouldSaveCriteria && selectedRegions.length > 0 ? selectedRegions.join(", ") : "";
    const finalType = shouldSaveCriteria && selectedTypes.length > 0 ? selectedTypes.join(", ") : "";
    const finalRooms = shouldSaveCriteria ? selectedRooms.join(", ") : "";
    const finalBudget = shouldSaveCriteria ? Number(formBudget) || 0 : 0;
    const finalRegionsList = shouldSaveCriteria ? selectedRegions : [];
    const finalTypesList = shouldSaveCriteria ? selectedTypes : [];
    const finalRoomsList = shouldSaveCriteria ? selectedRooms : [];

    if (customerToEdit) {
      const updatedFields: Partial<Customer> = {
        fullName: formName,
        phone: formPhone,
        whatsapp: formWhatsapp || formPhone,
        instagramHandle: formInstagram || undefined,
        email: formEmail,
        birthDate: formBirthDate || undefined,
        category: finalCategory,
        isAlsoBuyer: finalIsAlsoBuyer,
        temperature: isBuyerCandidate ? formTemperature : "warm",
        isVip: formVip,
        region: finalRegion,
        propertyType: finalType,
        rooms: finalRooms,
        regions: finalRegionsList,
        propertyTypes: finalTypesList,
        roomsList: finalRoomsList,
        budget: finalBudget,
        budgetCurrency: formCurrency || "GBP",
        notes: formNotes,
        assignedToId: assignedUser.id,
        assignedToName: assignedUser.name,
        isShared: formIsShared,
      };

      updateCustomer(customerToEdit.id, updatedFields);

      const savedCust: Customer = {
        ...customerToEdit,
        ...updatedFields,
        updatedAt: new Date().toISOString(),
      };

      onClose();
      if (onSuccess) onSuccess(savedCust);
      return;
    }

    const newCust = addCustomer({
      fullName: formName,
      phone: formPhone,
      whatsapp: formWhatsapp || formPhone,
      instagramHandle: formInstagram || undefined,
      email: formEmail,
      birthDate: formBirthDate || undefined,
      source: "manual",
      category: finalCategory,
      isAlsoBuyer: finalIsAlsoBuyer,
      temperature: isBuyerCandidate ? formTemperature : "warm",
      isVip: formVip,
      region: finalRegion,
      propertyType: finalType,
      rooms: finalRooms,
      regions: finalRegionsList,
      propertyTypes: finalTypesList,
      roomsList: finalRoomsList,
      budget: finalBudget,
      budgetCurrency: formCurrency || "GBP",
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
      style={{ zIndex: zIndex || 120 }}
      className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-y-auto"
    >
      <div className="sharp-card w-full h-full sm:h-auto sm:max-h-[90vh] max-w-2xl flex flex-col overflow-hidden border-0 sm:border border-slate-300 bg-white shadow-2xl rounded-none sm:rounded-lg sm:my-auto">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00adb5]" />
            <h2 className="text-sm font-bold text-[#1d2566]">
              {customerToEdit ? "Müşteri Bilgilerini Düzenle" : "Yeni Müşteri Kaydı"}
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

          {/* Ad Soyad & Telefon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div className="flex flex-col justify-end">
              <label className="text-slate-600 font-mono text-[11px] mb-1 font-semibold min-h-[18px] flex items-end">
                Ad Soyad *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Örn: Selim Karadağ"
                className="sharp-input w-full px-2.5 h-[38px] text-xs font-medium"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="text-slate-600 font-mono text-[11px] mb-1 font-semibold min-h-[18px] flex items-end">
                Telefon Numarası *
              </label>
              <PhoneInput
                required
                value={formPhone}
                onChange={setFormPhone}
              />
            </div>
          </div>

          {/* WhatsApp & Instagram */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div className="flex flex-col justify-end">
              <label className="text-slate-600 font-mono text-[11px] mb-1 font-semibold min-h-[18px] flex items-end">
                WhatsApp (Aynı ise boş)
              </label>
              <PhoneInput
                value={formWhatsapp}
                onChange={setFormWhatsapp}
                placeholder="Boşsa telefon kullanılır"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="text-slate-600 font-mono text-[11px] mb-1 font-semibold min-h-[18px] flex items-end">
                Instagram
              </label>
              <input
                type="text"
                value={formInstagram}
                onChange={(e) => setFormInstagram(e.target.value)}
                placeholder="@kullanici"
                className="sharp-input w-full px-2.5 h-[38px] font-mono text-xs"
              />
            </div>
          </div>

          {/* E-Posta & Doğum Tarihi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div className="flex flex-col justify-end">
              <label className="text-slate-600 font-mono text-[11px] mb-1 font-semibold min-h-[18px] flex items-end">
                E-Posta
              </label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="ad@soyad.com"
                className="sharp-input w-full px-2.5 h-[38px] font-mono text-xs"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="text-slate-600 font-mono text-[11px] mb-1 font-semibold min-h-[18px] flex items-end gap-1 text-[#1d2566]">
                <Cake className="w-3.5 h-3.5 text-pink-500 shrink-0 mb-0.5" />
                <span>Doğum Tarihi (Ops.)</span>
              </label>
              <DateInput
                value={formBirthDate}
                onChange={(val) => setFormBirthDate(val)}
                className="w-full"
              />
            </div>
          </div>

          {/* Kategori, Sıcaklık Derecesi (Sadece Alıcıda) & Sorumlu Danışman */}
          <div className={`grid gap-3 ${isBuyerCandidate ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
            <div className="flex flex-col justify-end">
              <label className="text-slate-600 font-mono text-[11px] mb-1 font-semibold min-h-[18px] flex items-end">
                Müşteri Kategorisi
              </label>
              <select
                value={formCategory}
                onChange={(e) => {
                  const newCat = e.target.value as CustomerCategory;
                  setFormCategory(newCat);
                  if (newCat === "BUYER") {
                    setIsAlsoBuyer(false);
                  }
                }}
                className="sharp-input w-full px-2.5 h-[38px] bg-white text-xs font-mono font-medium"
              >
                <option value="BUYER">Alıcı Adayı</option>
                <option value="SELLER">Mal Sahibi</option>
                <option value="TENANT">Kiracı</option>
              </select>
            </div>

            {isBuyerCandidate && (
              <div className="flex flex-col justify-end">
                <label className="text-slate-600 font-mono text-[11px] mb-1 font-semibold min-h-[18px] flex items-end">
                  Sıcaklık Derecesi
                </label>
                <select
                  value={formTemperature}
                  onChange={(e) => setFormTemperature(e.target.value as any)}
                  className="sharp-input w-full px-2.5 h-[38px] bg-white text-xs font-mono font-medium"
                >
                  <option value="hot">Sıcak (Acil Alıcı)</option>
                  <option value="warm">Ilık (Takipte)</option>
                  <option value="cold">Soğuk (Pasif)</option>
                </select>
              </div>
            )}

            <div className="flex flex-col justify-end">
              <label className="text-slate-600 font-mono text-[11px] mb-1 font-semibold min-h-[18px] flex items-end">
                Sorumlu Danışman
              </label>
              {isBroker ? (
                <select
                  value={formAssigneeId}
                  onChange={(e) => setFormAssigneeId(e.target.value)}
                  className="sharp-input w-full px-2.5 h-[38px] bg-white text-xs font-mono font-medium"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === "ADMIN" ? "Broker" : "Danışman"})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="sharp-input w-full px-2.5 h-[38px] bg-slate-100 border border-slate-300 text-slate-700 text-xs font-mono font-semibold flex items-center justify-between cursor-not-allowed select-none">
                  <span className="truncate">{customerToEdit?.assignedToName || currentUser.name}</span>
                  <span className="text-[10px] text-slate-500 font-normal shrink-0 ml-1">🔒 Kilitli</span>
                </div>
              )}
            </div>
          </div>

          {/* Mal Sahibi ve Kiracı İçin: Aynı Zamanda Alıcı Adayı Seçeneği */}
          {(formCategory === "SELLER" || formCategory === "TENANT") && (
            <div className="p-3 bg-amber-50/80 border border-amber-300 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-[#1d2566] text-xs flex items-center gap-1.5">
                  <span>Aynı Zamanda Alıcı Adayı mı?</span>
                </span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {formCategory === "SELLER"
                    ? "Müşteri mal sahibi olmanın yanında yeni bir gayrimenkul / konut satın almak istiyorsa işaretleyin."
                    : "Kiracı kiralamanın yanında yeni bir gayrimenkul / konut satın almak istiyorsa işaretleyin."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAlsoBuyer(!isAlsoBuyer)}
                className={`px-3 py-1.5 text-xs font-mono font-bold border transition cursor-pointer shrink-0 shadow-2xs ${
                  isAlsoBuyer
                    ? "bg-[#1d2566] text-white border-[#1d2566]"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                {isAlsoBuyer ? "✓ Evet (Alıcı Kriterleri Açık)" : "+ Alıcı Adayı Olarak da Ekle"}
              </button>
            </div>
          )}

          {/* Kiracı Bilgilendirme Notu */}
          {formCategory === "TENANT" && !isAlsoBuyer && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 text-blue-900 text-xs font-mono">
              ℹ️ Kiracı için detaylı mülk arama kriter formu kapatılmıştır. Kiracının özel istek ve detaylarını aşağıdaki &quot;Özel Notlar &amp; Talep Detayları&quot; kutusuna yazabilirsiniz. Kiracı aynı zamanda konut/mülk arıyorsa yukarıdan &quot;+ Alıcı Adayı Olarak da Ekle&quot; seçeneğini aktifleştirebilirsiniz.
            </div>
          )}

          {/* Mal Sahibi Bilgilendirme Notu */}
          {formCategory === "SELLER" && !isAlsoBuyer && (
            <div className="p-3 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono">
              ℹ️ Mal sahibinin mülk bilgileri Portföyler bölümünden &quot;Yeni Portföy Ekle&quot; ile girildiğinde otomatik olarak eşleşecektir. Mal sahibi aynı zamanda konut/mülk arıyorsa yukarıdan &quot;+ Alıcı Adayı Olarak da Ekle&quot; seçeneğini aktifleştirebilirsiniz.
            </div>
          )}

          {/* Sadece Alıcı Adayı ve Alıcı Olarak İşaretlenen (Mal Sahibi / Kiracı) Müşteriler İçin Kriter Bilgileri */}
          {isBuyerCandidate && (
            <>
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
            </>
          )}

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

          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs p-3.5 border-t border-slate-200 mt-auto flex justify-end gap-2 -mx-5 -mb-5 z-20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              className="sharp-btn-primary px-5 py-2 font-bold text-white shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{customerToEdit ? "Değişiklikleri Kaydet" : "Müşteriyi Kaydet"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
