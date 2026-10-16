"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import {
  CalendarDays,
  X,
  Users,
  Plus,
} from "lucide-react";
import { AddCustomerModal } from "./AddCustomerModal";
import { AddPropertyModal } from "./AddPropertyModal";
import { formatPhoneWithPrefix } from "@/lib/formatters";

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
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDate) return;

    const selectedCustomer = customers.find((c) => c.id === formCustomerId);
    const selectedProperty = properties.find((p) => p.id === formPropertyId);

    const isOffice = isBroker && formIsOfficeEvent;
    const finalKind = (formKind as any) || (isOffice ? "office_event" : "call");
    const hasSpecificTime = !!formTime.trim();
    const dueAt = hasSpecificTime ? `${formDate}T${formTime}:00` : `${formDate}T00:00:00`;

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
    });

    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="sharp-card w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-300 bg-white shadow-2xl my-auto">
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
              <select
                value={formCustomerId}
                onChange={(e) => setFormCustomerId(e.target.value)}
                className="sharp-input w-full p-2 bg-white"
              >
                <option value="">-- Müşteri Seçilmedi (Boş) --</option>
                {customers.filter((c) => !c.deletedAt).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} {c.phone ? `(${formatPhoneWithPrefix(c.phone) || c.phone})` : ""}
                  </option>
                ))}
              </select>
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
            <select
              value={formPropertyId}
              onChange={(e) => setFormPropertyId(e.target.value)}
              className="sharp-input w-full p-2 bg-white"
            >
              <option value="">Portföy Seçilmedi</option>
              {properties.filter((p) => !p.deletedAt).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                Tarih *
              </label>
              <input
                type="date"
                lang="tr-TR"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="sharp-input w-full p-2 font-mono"
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
