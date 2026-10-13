"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Currency } from "@/lib/types";
import {
  Calculator,
  X,
  Users,
  Building,
  CheckCircle2,
  UserPlus,
  Calendar,
} from "lucide-react";
import { AddCustomerModal } from "./AddCustomerModal";
import { AddPropertyModal } from "./AddPropertyModal";

interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddDealModal({ isOpen, onClose, onSuccess }: AddDealModalProps) {
  const {
    currentUser,
    isBroker,
    customers,
    properties,
    users,
    addDeal,
  } = useStore();

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const [formTitle, setFormTitle] = useState("");
  const [formAdvisorId, setFormAdvisorId] = useState(currentUser.id);
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formPropertyId, setFormPropertyId] = useState("");
  const [formDealDate, setFormDealDate] = useState<string>(getTodayStr());
  const [formStage, setFormStage] = useState<"offer" | "won" | "lost">("won");
  const [formCurrency, setFormCurrency] = useState<Currency>("GBP");
  const [formAgreedPrice, setFormAgreedPrice] = useState("");
  const [formOrigin, setFormOrigin] = useState<"advisor" | "office">("advisor");
  const [formCommissionRate, setFormCommissionRate] = useState<number>(5);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormTitle("");
      setFormAdvisorId(currentUser.id);
      setFormCustomerId("");
      setFormPropertyId("");
      setFormDealDate(getTodayStr());
      setFormStage("won");
      setFormCurrency("GBP");
      setFormAgreedPrice("");
      setFormOrigin("advisor");
      setFormCommissionRate(5);
    }
  }, [isOpen, currentUser.id]);

  if (!isOpen) return null;

  // Komisyon Hesaplama
  const numericPrice = Number(formAgreedPrice) || 0;
  const calculatedCommission =
    formCommissionRate === 100
      ? numericPrice
      : (numericPrice * formCommissionRate) / 100;

  const assignedUser = users.find((u) => u.id === formAdvisorId) || currentUser;
  const userRatio = assignedUser.commissionSplitRatio !== undefined ? assignedUser.commissionSplitRatio : 0.6;
  const splitRatio = formOrigin === "advisor" ? userRatio : Math.min(userRatio, 0.5);

  const calculatedAdvisorShare = calculatedCommission * splitRatio;
  const calculatedOfficeShare = calculatedCommission - calculatedAdvisorShare;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formAgreedPrice) return;

    const selectedProp = properties.find((p) => p.id === formPropertyId);
    const selectedCust = customers.find((c) => c.id === formCustomerId);

    const dealDate = formDealDate || getTodayStr();

    addDeal({
      title: formTitle,
      customerId: formCustomerId,
      customerName: selectedCust ? selectedCust.fullName : undefined,
      propertyId: formPropertyId,
      propertyTitle: selectedProp ? selectedProp.title : undefined,
      currency: formCurrency,
      stage: formStage,
      askingPrice: selectedProp ? selectedProp.price : numericPrice,
      offeredPrice: numericPrice,
      agreedPrice: numericPrice,
      deposit: 0,
      commissionExpected: calculatedCommission,
      commissionReceived: formStage === "won" ? calculatedCommission : 0,
      portfolioOrigin: formOrigin,
      closingDate: dealDate,
      paymentDue: dealDate,
      createdById: formAdvisorId,
      createdByName: assignedUser.name,
      notes: "İşlem kapama / kayıt modalından oluşturuldu.",
    });

    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="sharp-card w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-300 bg-white shadow-2xl my-auto">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#00adb5]" />
            <h2 className="text-sm font-bold text-[#1d2566]">
              Yeni Satış / Komisyon Anlaşması Ekle
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
          {/* İşlem Başlığı & Danışman Seçimi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                İşlem Başlığı *
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Örn: Bebek Dubleksi Satış Anlaşması"
                className="sharp-input w-full p-2"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#00adb5]" />
                İşlemi Yapan Danışman {isBroker ? "*" : ""}
              </label>
              {isBroker ? (
                <select
                  value={formAdvisorId}
                  onChange={(e) => setFormAdvisorId(e.target.value)}
                  className="sharp-input w-full p-2 bg-white font-medium text-slate-800"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.role === "ADMIN" ? "(Ofis / Broker)" : "(Danışman)"}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="sharp-input w-full p-2 bg-slate-50 font-medium text-slate-700 flex items-center justify-between">
                  <span className="font-bold text-[#1d2566]">{currentUser.name}</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-[#00adb5]/10 text-[#00adb5] border border-[#00adb5]/30 font-bold">
                    Kendi Hesabınız
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-600 font-mono text-[11px] font-semibold">
                  İlgili Müşteri *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddCustomerModalOpen(true)}
                  className="px-2 py-0.5 bg-[#00adb5] hover:bg-[#00939a] text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition"
                  title="Hızlıca yeni müşteri ekleyin"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ Yeni Müşteri Ekle</span>
                </button>
              </div>
              <select
                required
                value={formCustomerId}
                onChange={(e) => setFormCustomerId(e.target.value)}
                className="sharp-input w-full p-2 bg-white"
              >
                <option value="">-- Müşteri havuzundan seçin --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.phone || "Tel yok"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-600 font-mono text-[11px] font-semibold">
                  İlgili Portföy *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddPropertyModalOpen(true)}
                  className="px-2 py-0.5 bg-[#00adb5] hover:bg-[#00939a] text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition"
                  title="Hızlıca yeni portföy ekleyin"
                >
                  <Building className="w-3 h-3" />
                  <span>+ Yeni Portföy Ekle</span>
                </button>
              </div>
              <select
                required
                value={formPropertyId}
                onChange={(e) => {
                  const pid = e.target.value;
                  setFormPropertyId(pid);
                  const prop = properties.find((p) => p.id === pid);
                  if (prop) {
                    if (!formAgreedPrice || formAgreedPrice === "0") {
                      setFormAgreedPrice(prop.price.toString());
                    }
                    setFormCurrency(prop.currency);
                  }
                }}
                className="sharp-input w-full p-2 bg-white"
              >
                <option value="">-- Portföy havuzundan seçin --</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.price.toLocaleString("tr-TR")} {p.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* İşlem Tarihi & Anlaşma Aşaması */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#00adb5]" />
                  İşlem Tarihi *
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Geriye dönük seçilebilir)
                </span>
              </label>
              <input
                type="date"
                required
                value={formDealDate}
                onChange={(e) => setFormDealDate(e.target.value)}
                className="sharp-input w-full p-2 bg-white font-mono font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                İşlem Aşaması
              </label>
              <select
                value={formStage}
                onChange={(e) => setFormStage(e.target.value as any)}
                className="sharp-input w-full p-2 bg-white font-medium text-slate-800"
              >
                <option value="won">Tamamlandı / Kazanıldı (Tahsil Edildi)</option>
                <option value="offer">Teklif / Sözleşme Aşamasında</option>
                <option value="lost">İptal / Kaybedildi</option>
              </select>
            </div>
          </div>

          {/* Para Birimi, Anlaşılan Bedel */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                Para Birimi
              </label>
              <select
                value={formCurrency}
                onChange={(e) => setFormCurrency(e.target.value as any)}
                className="sharp-input w-full p-2 bg-white font-mono font-bold text-[#1d2566]"
              >
                <option value="GBP">GBP (£ - Sterlin)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="USD">USD ($ - Dolar)</option>
                <option value="TRY">TRY (₺ - TL)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                Anlaşılan Bedel *
              </label>
              <input
                type="number"
                required
                value={formAgreedPrice}
                onChange={(e) => setFormAgreedPrice(e.target.value)}
                placeholder="Örn: 150000"
                className="sharp-input w-full p-2 font-mono font-bold"
              />
            </div>
          </div>

          {/* Komisyon Menşei ve Komisyon Oranı */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                Portföy Menşei (Komisyon Kuralı) *
              </label>
              <select
                value={formOrigin}
                onChange={(e) => setFormOrigin(e.target.value as any)}
                className="sharp-input w-full p-2 bg-white font-medium"
              >
                <option value="advisor">
                  Danışman Kendi Portföyü (%60 Danışman / %40 Ofis)
                </option>
                <option value="office">
                  Ofis Portföyü (%50 Danışman / %50 Ofis)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                Komisyon Oranı (%)
              </label>
              <select
                value={formCommissionRate}
                onChange={(e) => setFormCommissionRate(Number(e.target.value))}
                className="sharp-input w-full p-2 bg-white font-mono font-bold"
              >
                <option value={1}>%1</option>
                <option value={2}>%2</option>
                <option value={3}>%3</option>
                <option value={4}>%4</option>
                <option value={5}>%5</option>
                <option value={10}>%10</option>
                <option value={15}>%15</option>
                <option value={100}>%100 (Kiralık)</option>
              </select>
            </div>
          </div>

          {/* Sistem Tarafından Otomatik Hesaplanan Komisyon Bilgi Kartı */}
          <div className="bg-[#1d2566]/5 border border-[#1d2566]/15 p-3 rounded-none space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#1d2566] flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#00adb5]" />
                Sistem Otomatik Hesaplanan Komisyon:
              </span>
              <span className="font-bold text-sm text-[#1d2566]">
                {calculatedCommission.toLocaleString("tr-TR")} {formCurrency}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1d2566]/10 text-[11px] font-mono">
              <div className="text-[#00adb5] font-bold">
                Danışman Payı ({Math.round(splitRatio * 100)}%):{" "}
                {calculatedAdvisorShare.toLocaleString("tr-TR")} {formCurrency}
              </div>
              <div className="text-[#1d2566] font-bold text-right">
                Ofis Payı ({Math.round((1 - splitRatio) * 100)}%):{" "}
                {calculatedOfficeShare.toLocaleString("tr-TR")} {formCurrency}
              </div>
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
              İşlemi Kaydet
            </button>
          </div>
        </form>
      </div>

      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
      />

      <AddPropertyModal
        isOpen={isAddPropertyModalOpen}
        onClose={() => setIsAddPropertyModalOpen(false)}
      />
    </div>
  );
}
