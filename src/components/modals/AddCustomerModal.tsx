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
} from "lucide-react";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newCustomer: Customer) => void;
}

export function AddCustomerModal({ isOpen, onClose, onSuccess }: AddCustomerModalProps) {
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
  const [formCategory, setFormCategory] = useState<CustomerCategory>("BUYER");
  const [formTemperature, setFormTemperature] = useState<"hot" | "warm" | "cold">("warm");
  const [customerDistrict, setCustomerDistrict] = useState(KKTC_DISTRICTS[0]);
  const [customerSubRegion, setCustomerSubRegion] = useState(getRegionsByDistrict(KKTC_DISTRICTS[0])[0] || "");
  const [formType, setFormType] = useState("Daire");
  const [formBudget, setFormBudget] = useState("");
  const [formCurrency, setFormCurrency] = useState<Currency>("GBP");
  const [formNotes, setFormNotes] = useState("");
  const [formIsShared, setFormIsShared] = useState(false);
  const [formVip, setFormVip] = useState(false);
  const [formAssigneeId, setFormAssigneeId] = useState(currentUser.id);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormName("");
      setFormPhone("");
      setFormWhatsapp("");
      setFormInstagram("");
      setFormEmail("");
      setFormCategory("BUYER");
      setFormTemperature("warm");
      setCustomerDistrict(KKTC_DISTRICTS[0]);
      setCustomerSubRegion(getRegionsByDistrict(KKTC_DISTRICTS[0])[0] || "");
      setFormType("Daire");
      setFormBudget("");
      setFormCurrency("GBP");
      setFormNotes("");
      setFormIsShared(false);
      setFormVip(false);
      setFormAssigneeId(currentUser.id);
      setDuplicateError(null);
    }
  }, [isOpen, currentUser.id]);

  if (!isOpen) return null;

  const handleDistrictChange = (d: string) => {
    setCustomerDistrict(d);
    const subs = getRegionsByDistrict(d);
    setCustomerSubRegion(subs[0] || "");
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

    const newCust = addCustomer({
      fullName: formName,
      phone: formPhone,
      whatsapp: formWhatsapp || formPhone,
      instagramHandle: formInstagram || undefined,
      email: formEmail,
      source: "manual",
      category: formCategory,
      temperature: formTemperature,
      isVip: formVip,
      region: `${customerDistrict} / ${customerSubRegion}`,
      propertyType: formType,
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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="sharp-card w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-300 bg-white shadow-2xl my-auto">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00adb5]" />
            <h2 className="text-sm font-bold text-[#1d2566]">
              Yeni Müşteri Kaydı
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
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
              <input
                type="text"
                required
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+90 532 000 00 00"
                className="sharp-input w-full p-2 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1">
                WhatsApp
              </label>
              <input
                type="text"
                value={formWhatsapp}
                onChange={(e) => setFormWhatsapp(e.target.value)}
                placeholder="Boşsa telefon alınır"
                className="sharp-input w-full p-2 font-mono"
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

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 border border-slate-200">
            <div>
              <label className="block text-slate-600 font-mono text-[10px] mb-1 font-bold">
                KKTC Tercih Edilen İlçe
              </label>
              <select
                value={customerDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="sharp-input w-full p-2 bg-white font-mono text-xs"
              >
                {KKTC_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-mono text-[10px] mb-1 font-bold">
                Bölge / Mahalle / Belde
              </label>
              <select
                value={customerSubRegion}
                onChange={(e) => setCustomerSubRegion(e.target.value)}
                className="sharp-input w-full p-2 bg-white font-mono text-xs"
              >
                {getRegionsByDistrict(customerDistrict).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                Gayrimenkul Tipi
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="sharp-input w-full p-2 bg-white"
              >
                <option value="Daire">Daire</option>
                <option value="Villa">Villa</option>
                <option value="Ticari">Ticari / Dükkan</option>
                <option value="Arsa">Arsa</option>
                <option value="Yalı / Köşk">Yalı / Köşk</option>
              </select>
            </div>

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
                  placeholder="Tutar"
                  className="sharp-input flex-1 p-2 font-mono"
                />
                <select
                  value={formCurrency}
                  onChange={(e) => setFormCurrency(e.target.value as any)}
                  className="sharp-input w-24 p-2 font-mono bg-white font-bold text-[#1d2566]"
                >
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="TRY">TRY (₺)</option>
                </select>
              </div>
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
