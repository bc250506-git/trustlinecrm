"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { MandateContract } from "@/lib/types";
import {
  FileCheck,
  X,
  Building,
  User,
  Award,
} from "lucide-react";

interface AddMandateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newMandate: MandateContract) => void;
}

export function AddMandateModal({ isOpen, onClose, onSuccess }: AddMandateModalProps) {
  const {
    currentUser,
    properties,
    customers,
    addMandateContract,
  } = useStore();

  const [formPropertyId, setFormPropertyId] = useState("");
  const [formOwnerCustomerId, setFormOwnerCustomerId] = useState("");
  const [formMandateType, setFormMandateType] = useState<"exclusive" | "open">("exclusive");
  const [formCommissionRate, setFormCommissionRate] = useState<number>(5);
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formContractNumber, setFormContractNumber] = useState("");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const startStr = now.toISOString().split("T")[0];
      const end = new Date(now);
      end.setMonth(end.getMonth() + 6); // 6 aylık varsayılan yetki
      const endStr = end.toISOString().split("T")[0];

      setFormPropertyId("");
      setFormOwnerCustomerId("");
      setFormMandateType("exclusive");
      setFormCommissionRate(5);
      setFormStartDate(startStr);
      setFormEndDate(endStr);
      setFormContractNumber(`TL-YET-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setFormNotes("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPropertyId || !formOwnerCustomerId || !formStartDate || !formEndDate) return;

    const selectedProp = properties.find((p) => p.id === formPropertyId);
    const selectedOwner = customers.find((c) => c.id === formOwnerCustomerId);

    const newMandate = addMandateContract({
      propertyId: formPropertyId,
      propertyTitle: selectedProp ? selectedProp.title : "Belirtilmedi",
      propertyType: selectedProp ? selectedProp.propertyType : "Daire",
      region: selectedProp ? selectedProp.region : "KKTC",
      listingPrice: selectedProp ? selectedProp.price : 0,
      currency: selectedProp ? selectedProp.currency : "GBP",
      ownerCustomerId: formOwnerCustomerId,
      ownerName: selectedOwner ? selectedOwner.fullName : "Bilinmiyor",
      ownerPhone: selectedOwner ? selectedOwner.phone : "",
      mandateType: formMandateType,
      commissionRate: formCommissionRate,
      startDate: formStartDate,
      endDate: formEndDate,
      status: "active",
      contractNumber: formContractNumber,
      notes: formNotes,
      assignedToId: currentUser.id,
      assignedToName: currentUser.name,
    });

    onClose();
    if (onSuccess) onSuccess(newMandate);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="sharp-card w-full max-w-xl max-h-[92vh] overflow-y-auto border border-slate-300 bg-white shadow-2xl my-auto">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#00adb5]" />
            <h2 className="text-sm font-bold text-[#1d2566]">
              Yeni Yetki Sözleşmesi Kaydı
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
          {/* 1. Mülk / Portföy Seçimi */}
          <div>
            <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-[#00adb5]" />
              Yetki Alınan Portföy *
            </label>
            <select
              required
              value={formPropertyId}
              onChange={(e) => {
                const pid = e.target.value;
                setFormPropertyId(pid);
                const prop = properties.find((p) => p.id === pid);
                if (prop && prop.ownerCustomerId) {
                  setFormOwnerCustomerId(prop.ownerCustomerId);
                }
              }}
              className="sharp-input w-full p-2 bg-white font-mono"
            >
              <option value="">-- Portföy Seçin --</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.region}) - {p.price.toLocaleString("tr-TR")} {p.currency}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Mal Sahibi Seçimi */}
          <div>
            <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#00adb5]" />
              Mal Sahibi (Müşteri Havuzundan) *
            </label>
            <select
              required
              value={formOwnerCustomerId}
              onChange={(e) => setFormOwnerCustomerId(e.target.value)}
              className="sharp-input w-full p-2 bg-white font-mono"
            >
              <option value="">-- Mal Sahibi Seçin --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.phone || c.whatsapp}) - {c.category === "SELLER" ? "Satıcı" : "Müşteri"}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Yetki Tipi & Komisyon Oranı */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#1d2566]" />
                Yetki Türü *
              </label>
              <select
                value={formMandateType}
                onChange={(e) => setFormMandateType(e.target.value as any)}
                className="sharp-input w-full p-2 bg-white font-bold text-[#1d2566]"
              >
                <option value="exclusive">Tek Yetkili (Exclusive)</option>
                <option value="open">Genel Yetki (Açık)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                Komisyon Oranı (%) *
              </label>
              <select
                value={formCommissionRate}
                onChange={(e) => setFormCommissionRate(Number(e.target.value))}
                className="sharp-input w-full p-2 bg-white font-mono font-bold text-emerald-700"
              >
                <option value={2}>%2</option>
                <option value={3}>%3</option>
                <option value={4}>%4</option>
                <option value={5}>%5 (Standart KKTC)</option>
                <option value={6}>%6</option>
                <option value={8}>%8</option>
                <option value={10}>%10</option>
              </select>
            </div>
          </div>

          {/* 4. Başlangıç & Bitiş Tarihleri */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                Başlangıç Tarihi *
              </label>
              <input
                type="date"
                required
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="sharp-input w-full p-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                Bitiş Tarihi *
              </label>
              <input
                type="date"
                required
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                className="sharp-input w-full p-2 font-mono"
              />
            </div>
          </div>

          {/* 5. Sözleşme Numarası */}
          <div>
            <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
              Sözleşme / Dosya No (Opsiyonel)
            </label>
            <input
              type="text"
              value={formContractNumber}
              onChange={(e) => setFormContractNumber(e.target.value)}
              placeholder="Örn: TL-YET-2026-041"
              className="sharp-input w-full p-2 font-mono"
            />
          </div>

          {/* 6. Sözleşme Notları */}
          <div>
            <label className="block text-slate-600 font-mono text-[11px] mb-1">
              Özel Şartlar & Sözleşme Notları
            </label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Anahtar teslim tutanağı, afiş asma izni, mal sahibi özel talepleri..."
              className="sharp-input w-full p-2"
            />
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
              Yetki Sözleşmesini Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
