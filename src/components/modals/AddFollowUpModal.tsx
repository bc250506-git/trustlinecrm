"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import {
  CalendarDays,
  X,
  Users,
  Plus,
  RotateCw,
} from "lucide-react";
import { AddCustomerModal } from "./AddCustomerModal";
import { AddPropertyModal } from "./AddPropertyModal";
import { DateInput } from "@/components/common/DateInput";
import { formatPhoneWithPrefix, combineLocalDateAndTimeToIso } from "@/lib/formatters";
import { SearchableSelect, SearchableOption } from "@/components/common/SearchableSelect";
import { RecurrenceRule } from "@/lib/types";

interface AddFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialDate?: string;
}

export function AddFollowUpModal({ isOpen, onClose, onSuccess, initialDate }: AddFollowUpModalProps) {
  const {
    currentUser,
    isBroker,
    customers,
    properties,
    addFollowUp,
    notifications,
  } = useStore();

  const [formTitle, setFormTitle] = useState("");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formPropertyId, setFormPropertyId] = useState("");
  const [formKind, setFormKind] = useState<any>("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formIsOfficeEvent, setFormIsOfficeEvent] = useState(false);
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [formRecurrenceRule, setFormRecurrenceRule] = useState<RecurrenceRule>("monthly");

  // Standart Modal Entegrasyonu
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);

  const prevIsOpenRef = React.useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const now = new Date();
      const localDate = initialDate || now.toISOString().split("T")[0];
      setFormTitle("");
      setFormCustomerId("");
      setFormPropertyId("");
      setFormKind("");
      setFormDate(localDate);
      setFormTime("");
      setFormIsOfficeEvent(false);
      setFormIsRecurring(false);
      setFormRecurrenceRule("monthly");
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialDate]);

  const customerOptions = React.useMemo<SearchableOption[]>(() => {
    return customers
      .filter((c) => !c.deletedAt)
      .map((c) => ({
        value: c.id,
        label: c.fullName,
        sublabel: `${formatPhoneWithPrefix(c.phone) || c.phone || "Telefon yok"} • ${c.region || "KKTC"}`,
        badge: c.category === "BUYER" ? "Alıcı" : c.category === "SELLER" ? "Mal Sahibi" : "Kiracı",
        keywords: `${c.fullName} ${c.phone || ""} ${c.region || ""}`,
      }));
  }, [customers]);

  const propertyOptions = React.useMemo<SearchableOption[]>(() => {
    return properties
      .filter((p) => !p.deletedAt)
      .map((p) => ({
        value: p.id,
        label: p.title,
        sublabel: `${p.region || "KKTC"} • ${p.price.toLocaleString("tr-TR")} ${p.currency}`,
        badge: p.listingType === "rent" ? "KİRALIK" : "SATILIK",
        keywords: `${p.title} ${p.region || ""} ${p.propertyType || ""}`,
      }));
  }, [properties]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDate) return;

    const selectedCustomer = customers.find((c) => c.id === formCustomerId);
    const selectedProperty = properties.find((p) => p.id === formPropertyId);

    const isOffice = isBroker && formIsOfficeEvent;
    const finalKind = (formKind as any) || (isOffice ? "office_event" : "call");
    const hasSpecificTime = !!formTime.trim();
    const dueAt = combineLocalDateAndTimeToIso(formDate, hasSpecificTime ? formTime : undefined);

    addFollowUp({
      title: formTitle.trim(),
      customerId: formCustomerId || undefined,
      customerName: selectedCustomer ? selectedCustomer.fullName : undefined,
      customerPhone: selectedCustomer ? selectedCustomer.phone : undefined,
      propertyId: formPropertyId || undefined,
      propertyTitle: selectedProperty ? selectedProperty.title : undefined,
      kind: finalKind,
      dueAt,
      hasSpecificTime,
      isOfficeEvent: isOffice,
      status: "open",
      outcome: "pending",
      feedback: "",
      assignedToId: isOffice ? undefined : currentUser.id,
      assignedToName: isOffice ? "Tüm Ofis Ekibi" : currentUser.name,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      isRecurring: formIsRecurring,
      recurrenceRule: formIsRecurring ? formRecurrenceRule : undefined,
    });

    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="sharp-card w-full h-full sm:h-auto sm:max-h-[90vh] max-w-lg flex flex-col overflow-hidden border-0 sm:border border-slate-300 bg-white shadow-2xl rounded-none sm:rounded-lg sm:my-auto">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#00adb5]" />
            <h3 className="text-sm font-bold text-[#1d2566]">
              Yeni Takip & Randevu Oluştur
            </h3>
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
          <div>
            <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
              Randevu / Takip Başlığı *
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Örn: Bebek Dubleksi 2. Yer Gösterimi veya Haftalık Ofis Toplantısı"
              className="sharp-input w-full p-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-600 font-mono text-[11px] font-semibold">
                  İlgili Müşteri (Opsiyonel)
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddCustomerModalOpen(true)}
                  className="text-[#00adb5] hover:text-[#00969d] font-mono font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  + Yeni
                </button>
              </div>
              <SearchableSelect
                options={customerOptions}
                value={formCustomerId}
                onChange={setFormCustomerId}
                placeholder="-- Müşteri Seçilmedi (Arayın veya Seçin) --"
                searchPlaceholder="Müşteri isim, telefon ara..."
              />
            </div>

            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                İşlem Türü (Opsiyonel)
              </label>
              <select
                value={formKind}
                onChange={(e) => setFormKind(e.target.value)}
                className="sharp-input w-full p-2 bg-white"
              >
                <option value="">-- Tür Seçilmedi (Genel Görev) --</option>
                <option value="showing">Yer Gösterme</option>
                <option value="meeting">Yüz Yüze Görüşme</option>
                <option value="call">Telefon Araması</option>
                <option value="office_event">Ofis Toplantısı / Etkinlik</option>
                <option value="other">Diğer</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-600 font-mono text-[11px] font-semibold">
                İlgili Portföy (Opsiyonel)
              </label>
              <button
                type="button"
                onClick={() => setIsAddPropertyModalOpen(true)}
                className="text-[#00adb5] hover:text-[#00969d] font-mono font-bold text-[10px] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                + Yeni
              </button>
            </div>
            <SearchableSelect
              options={propertyOptions}
              value={formPropertyId}
              onChange={setFormPropertyId}
              placeholder="-- Portföy Seçilmedi (Arayın veya Seçin) --"
              searchPlaceholder="Portföy adı, bölge ara..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                Tarih *
              </label>
              <DateInput
                required
                value={formDate}
                onChange={(val) => setFormDate(val)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                Saat (Opsiyonel)
              </label>
              <input
                type="time"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                className="sharp-input w-full p-2 font-mono"
              />
            </div>
          </div>

          {/* 🔄 TEKRARLAYAN RUTİN GÖREV (OTOMATİK TAKVİM İŞLEME) */}
          <div className="p-3 bg-cyan-50/70 border border-cyan-200 space-y-2.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsRecurring}
                onChange={(e) => setFormIsRecurring(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#00adb5] rounded-none border-cyan-300 focus:ring-[#00adb5] cursor-pointer"
              />
              <div>
                <span className="font-bold text-[#1d2566] text-xs flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-[#00adb5]" />
                  Bu görevi sürekli tekrarla (Takvime otomatik işle)
                </span>
                <p className="text-[11px] text-cyan-900 mt-0.5 leading-normal">
                  İşaretlendiğinde önümüzdeki 12 periyot boyunca ajanda ve takviminize otomatik olarak işlenir.
                </p>
              </div>
            </label>

            {formIsRecurring && (
              <div className="pl-6 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-cyan-200">
                <div>
                  <label className="block text-slate-700 font-mono text-[10.5px] font-bold mb-1">
                    Tekrarlama Sıklığı
                  </label>
                  <select
                    value={formRecurrenceRule}
                    onChange={(e) => setFormRecurrenceRule(e.target.value as any)}
                    className="sharp-input w-full p-1.5 bg-white font-mono text-xs font-semibold"
                  >
                    <option value="monthly">🗓️ Aylık (Her ayın aynı günü)</option>
                    <option value="weekly">📅 Haftalık (Her haftanın aynı günü)</option>
                    <option value="yearly">🎂 Yıllık (Yılda bir kez aynı gün)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-mono text-[10.5px] font-bold mb-1">
                    İşlenecek Süre
                  </label>
                  <div className="sharp-input w-full p-1.5 bg-white text-xs font-mono text-slate-700 flex items-center justify-between">
                    <span>Gelecek 12 Periyot</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 border border-emerald-200">
                      ✓ Otomatik Planlanır
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Yalnızca Ofis Kullanıcısı (Broker / Admin) İçin Ofis Etkinliği Checkbox */}
          {isBroker && (
            <div className="p-3 bg-purple-50/80 border border-purple-200">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsOfficeEvent}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormIsOfficeEvent(checked);
                    if (checked && !formKind) {
                      setFormKind("office_event");
                    }
                  }}
                  className="mt-0.5 w-4 h-4 text-purple-600 rounded-none border-purple-300 focus:ring-purple-500 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-600" />
                    Ofis Etkinliği (Tüm Ekibin Ajandasına Ekle & Duyur)
                  </span>
                  <p className="text-[11px] text-purple-700 mt-0.5 leading-normal">
                    İşaretlendiğinde bu kayıt (ofis toplantısı, saha gezisi, eğitim vs.) tüm danışmanların ajandasına ortak olarak eklenir.
                  </p>
                </div>
              </label>
            </div>
          )}

          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs p-3.5 border-t border-slate-200 mt-auto flex justify-end gap-2 -mx-5 -mb-5 z-20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer text-xs font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              className="sharp-btn-primary px-5 py-2 font-bold text-white shadow-2xs cursor-pointer text-xs"
            >
              Takvim ve Ajandaya Kaydet
            </button>
          </div>
        </form>
      </div>

      {/* STANDART MÜŞTERİ EKLEME MODALI */}
      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        zIndex={80}
        onSuccess={(newCust) => {
          setIsAddCustomerModalOpen(false);
          if (newCust) {
            setFormCustomerId(newCust.id);
          }
        }}
      />

      {/* STANDART PORTFÖY EKLEME MODALI */}
      <AddPropertyModal
        isOpen={isAddPropertyModalOpen}
        onClose={() => setIsAddPropertyModalOpen(false)}
        zIndex={80}
        onSuccess={(newProp) => {
          setIsAddPropertyModalOpen(false);
          if (newProp) {
            setFormPropertyId(newProp.id);
          }
        }}
      />
    </div>
  );
}
