"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Trust360Contract, Currency } from "@/lib/types";
import { SearchableSelect, SearchableOption } from "@/components/common/SearchableSelect";
import { AddCustomerModal } from "@/components/modals/AddCustomerModal";
import { AddPropertyModal } from "@/components/modals/AddPropertyModal";
import { X, Plus, ShieldCheck, Calendar, User, Building, AlertCircle } from "lucide-react";

interface AddTrust360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractToEdit?: Trust360Contract | null;
}

export function AddTrust360Modal({
  isOpen,
  onClose,
  contractToEdit,
}: AddTrust360ModalProps) {
  const {
    properties,
    customers,
    currentUser,
    users,
    isBroker,
    addTrust360Contract,
    updateTrust360Contract,
  } = useStore();

  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedOwnerCustomerId, setSelectedOwnerCustomerId] = useState("");
  const [propertyTitle, setPropertyTitle] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [region, setRegion] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerWhatsapp, setOwnerWhatsapp] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [annualFee, setAnnualFee] = useState<number>(450);
  const [currency, setCurrency] = useState<Currency>("GBP");
  const [feePaymentStatus, setFeePaymentStatus] = useState<"paid" | "pending">("pending");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [assignedToId, setAssignedToId] = useState(currentUser.id);
  const [notes, setNotes] = useState("");

  // İkincil modal durumları (Mevcutta olmayan portföy veya müşteriyi anında eklemek için)
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Düzenleme veya yeni oluşturma başlangıç değerleri (Next.js SSR uyumlu)
  useEffect(() => {
    if (!isOpen) return;

    if (contractToEdit) {
      setSelectedPropertyId(contractToEdit.propertyId || "");
      setSelectedOwnerCustomerId(contractToEdit.ownerCustomerId || "");
      setPropertyTitle(contractToEdit.propertyTitle || "");
      setPropertyType(contractToEdit.propertyType || "");
      setRegion(contractToEdit.region || "");
      setOwnerName(contractToEdit.ownerName || "");
      setOwnerPhone(contractToEdit.ownerPhone || "");
      setOwnerWhatsapp(contractToEdit.ownerWhatsapp || "");
      setTenantName(contractToEdit.tenantName || "");
      setTenantPhone(contractToEdit.tenantPhone || "");
      setAnnualFee(contractToEdit.annualFee || 450);
      setCurrency(contractToEdit.currency || "GBP");
      setFeePaymentStatus(contractToEdit.feePaymentStatus || "pending");
      setStartDate(contractToEdit.startDate || "");
      setEndDate(contractToEdit.endDate || "");
      setContractNumber(contractToEdit.contractNumber || "");
      setAssignedToId(contractToEdit.assignedToId || currentUser.id);
      setNotes(contractToEdit.notes || "");
    } else {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const nextYear = new Date(now);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const nextYearStr = nextYear.toISOString().split("T")[0];

      setSelectedPropertyId("");
      setSelectedOwnerCustomerId("");
      setPropertyTitle("");
      setPropertyType("");
      setRegion("");
      setOwnerName("");
      setOwnerPhone("");
      setOwnerWhatsapp("");
      setTenantName("");
      setTenantPhone("");
      setAnnualFee(450);
      setCurrency("GBP");
      setFeePaymentStatus("pending");
      setStartDate(todayStr);
      setEndDate(nextYearStr);
      setContractNumber(`T360-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setAssignedToId(currentUser.id);
      setNotes("");
    }
    setErrorMsg("");
  }, [isOpen, contractToEdit, currentUser.id]);

  // Portföy Seçimi Seçenekleri (Arama Motoru Uyumlu)
  const propertyOptions = useMemo<SearchableOption[]>(() => {
    return properties
      .filter((p) => !p.deletedAt)
      .map((p) => ({
        value: p.id,
        label: p.title,
        sublabel: `${p.region || "KKTC"} • ${p.price.toLocaleString("tr-TR")} ${p.currency} • ${p.propertyType || "Gayrimenkul"}`,
        group: p.listingType === "rent" ? "📋 Kiralık Portföyler" : "🏢 Satılık Portföyler",
        badge: p.listingType === "rent" ? "Kiralık" : "Satılık",
      }));
  }, [properties]);

  // Müşteri Seçimi Seçenekleri (Arama Motoru Uyumlu)
  const customerOptions = useMemo<SearchableOption[]>(() => {
    return customers
      .filter((c) => !c.deletedAt)
      .map((c) => ({
        value: c.id,
        label: c.fullName,
        sublabel: `${c.phone || "Telefon yok"} • ${c.category === "SELLER" ? "Mal Sahibi" : c.category === "TENANT" ? "Kiracı" : "Alıcı / Müşteri"}`,
        group: c.category === "SELLER" || c.category === "SELLER_AND_BUYER" ? "Mülk Sahipleri" : "Diğer Müşteriler",
        badge: c.category === "SELLER" ? "Mal Sahibi" : undefined,
      }));
  }, [customers]);

  // Danışman Listesi (Broker için)
  const agentOptions = useMemo(() => {
    return users.filter((u) => u.active);
  }, [users]);

  // Portföy seçildiğinde otomatik alan doldurma
  const handleSelectProperty = (propId: string) => {
    setSelectedPropertyId(propId);
    if (!propId) return;

    const prop = properties.find((p) => p.id === propId);
    if (prop) {
      setPropertyTitle(prop.title);
      setPropertyType(prop.propertyType || "");
      setRegion(prop.region || "");

      if (prop.ownerCustomerId) {
        setSelectedOwnerCustomerId(prop.ownerCustomerId);
        const ownerCust = customers.find((c) => c.id === prop.ownerCustomerId);
        if (ownerCust) {
          setOwnerName(ownerCust.fullName);
          setOwnerPhone(ownerCust.phone);
          setOwnerWhatsapp(ownerCust.whatsapp || ownerCust.phone);
        }
      } else if (prop.ownerName) {
        setOwnerName(prop.ownerName);
        setOwnerPhone(prop.ownerPhone || "");
        setOwnerWhatsapp(prop.ownerPhone || "");
      }
    }
  };

  // Müşteri seçildiğinde otomatik alan doldurma
  const handleSelectCustomer = (custId: string) => {
    setSelectedOwnerCustomerId(custId);
    if (!custId) return;

    const cust = customers.find((c) => c.id === custId);
    if (cust) {
      setOwnerName(cust.fullName);
      setOwnerPhone(cust.phone);
      setOwnerWhatsapp(cust.whatsapp || cust.phone);
    }
  };

  // Başlangıç tarihi değiştiğinde bitiş tarihini otomatik +1 yıl yap
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (!newStart) return;
    try {
      const dt = new Date(newStart);
      if (!isNaN(dt.getTime())) {
        dt.setFullYear(dt.getFullYear() + 1);
        setEndDate(dt.toISOString().split("T")[0]);
      }
    } catch {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!propertyTitle.trim()) {
      setErrorMsg("Lütfen portföy bilgisini seçin veya bir mülk adı yazın.");
      return;
    }

    if (!ownerName.trim()) {
      setErrorMsg("Lütfen mülk sahibi müşteriyi seçin veya adını girin.");
      return;
    }

    if (!startDate || !endDate) {
      setErrorMsg("Lütfen sözleşme başlangıç ve bitiş tarihlerini belirleyin.");
      return;
    }

    const assignedUser = users.find((u) => u.id === assignedToId);
    const finalAssignedName = assignedUser?.name || currentUser.name;

    if (contractToEdit) {
      const success = updateTrust360Contract(contractToEdit.id, {
        propertyId: selectedPropertyId || undefined,
        propertyTitle: propertyTitle.trim(),
        propertyType: propertyType.trim(),
        region: region.trim(),
        ownerCustomerId: selectedOwnerCustomerId || undefined,
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        ownerWhatsapp: ownerWhatsapp.trim(),
        tenantName: tenantName.trim(),
        tenantPhone: tenantPhone.trim(),
        annualFee: Number(annualFee) || 450,
        currency,
        feePaymentStatus,
        feePaidDate: feePaymentStatus === "paid" ? (contractToEdit.feePaidDate || new Date().toISOString().split("T")[0]) : undefined,
        startDate,
        endDate,
        contractNumber: contractNumber.trim(),
        assignedToId,
        assignedToName: finalAssignedName,
        notes: notes.trim(),
      });
      if (success) {
        onClose();
      }
    } else {
      addTrust360Contract({
        propertyId: selectedPropertyId || undefined,
        propertyTitle: propertyTitle.trim(),
        propertyType: propertyType.trim(),
        region: region.trim(),
        ownerCustomerId: selectedOwnerCustomerId || undefined,
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        ownerWhatsapp: ownerWhatsapp.trim(),
        tenantName: tenantName.trim(),
        tenantPhone: tenantPhone.trim(),
        annualFee: Number(annualFee) || 450,
        currency,
        feePaymentStatus,
        feePaidDate: feePaymentStatus === "paid" ? new Date().toISOString().split("T")[0] : undefined,
        startDate,
        endDate,
        active: true,
        status: "active",
        contractNumber: contractNumber.trim(),
        assignedToId,
        assignedToName: finalAssignedName,
        notes: notes.trim(),
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-none bg-[#1d2566] text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4 text-[#00adb5]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1d2566] tracking-tight">
                  {contractToEdit ? "Trust 360 Sözleşmesini Düzenle" : "Yeni Trust 360 Mülk Yönetimi Ekle"}
                </h2>
                <p className="text-[11px] text-slate-500 font-mono">
                  Yıllık sabit ücretli profesyonel kiralık mülk takip ve organizasyon sözleşmesi
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Portföy Seçimi & Ekleme */}
            <div className="space-y-1.5 p-3.5 bg-slate-50/70 border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#1d2566] flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>Kayıtlı Portföy Seçimi (Otomatik Bilgi Çeker)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddPropertyOpen(true)}
                  className="text-[11px] font-bold text-[#00adb5] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Yeni Portföy Ekle
                </button>
              </div>

              <SearchableSelect
                options={propertyOptions}
                value={selectedPropertyId}
                onChange={handleSelectProperty}
                placeholder="-- Portföy havuzundan mülk ara veya seçin --"
                searchPlaceholder="İlan başlığı, bölge veya fiyata göre ara..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200">
                <div className="sm:col-span-2">
                  <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                    Mülk / Portföy Başlığı *
                  </label>
                  <input
                    type="text"
                    required
                    value={propertyTitle}
                    onChange={(e) => setPropertyTitle(e.target.value)}
                    placeholder="Örn: Girne Merkez Nusmar Bölgesinde 2+1 Daire"
                    className="w-full px-2.5 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#00adb5]"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                    Bölge / Konum
                  </label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Örn: Girne / Esentepe"
                    className="w-full px-2.5 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#00adb5]"
                  />
                </div>
              </div>
            </div>

            {/* 2. Mülk Sahibi (Müşteri) Seçimi & Ekleme */}
            <div className="space-y-1.5 p-3.5 bg-slate-50/70 border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#1d2566] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>Mülk Sahibi Müşteri Seçimi</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(true)}
                  className="text-[11px] font-bold text-[#00adb5] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Yeni Müşteri Ekle
                </button>
              </div>

              <SearchableSelect
                options={customerOptions}
                value={selectedOwnerCustomerId}
                onChange={handleSelectCustomer}
                placeholder="-- Müşteri havuzundan mülk sahibi ara veya seçin --"
                searchPlaceholder="İsim, telefon veya müşteri tipine göre ara..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200">
                <div>
                  <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                    Mülk Sahibi Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Ad Soyad"
                    className="w-full px-2.5 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#00adb5]"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                    Telefon Numarası
                  </label>
                  <input
                    type="text"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="+90 533 ..."
                    className="w-full px-2.5 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#00adb5]"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                    WhatsApp Numarası
                  </label>
                  <input
                    type="text"
                    value={ownerWhatsapp}
                    onChange={(e) => setOwnerWhatsapp(e.target.value)}
                    placeholder="90533..."
                    className="w-full px-2.5 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#00adb5]"
                  />
                </div>
              </div>
            </div>

            {/* 3. Sözleşme & Yıllık Hizmet Bedeli Parametreleri */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Yıllık Hizmet Bedeli *
                </label>
                <div className="flex">
                  <input
                    type="number"
                    required
                    min={0}
                    value={annualFee}
                    onChange={(e) => setAnnualFee(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 font-mono font-bold text-xs focus:outline-none focus:border-[#00adb5]"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="bg-slate-100 border border-l-0 border-slate-300 px-2 py-1.5 font-bold font-mono text-xs focus:outline-none"
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="TRY">TRY (₺)</option>
                  </select>
                </div>
                <span className="text-[9.5px] text-slate-500 font-mono mt-0.5 block">
                  Standart Trust 360 bedeli £450/yıldır
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Yıllık Bedel Tahsilat Durumu
                </label>
                <select
                  value={feePaymentStatus}
                  onChange={(e) => setFeePaymentStatus(e.target.value as "paid" | "pending")}
                  className={`w-full px-2.5 py-1.5 border text-xs font-bold font-mono focus:outline-none ${
                    feePaymentStatus === "paid"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : "bg-amber-50 text-amber-800 border-amber-300"
                  }`}
                >
                  <option value="paid">✓ Tahsil Edildi (Peşin)</option>
                  <option value="pending">⏳ Ödeme Bekliyor</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Sözleşme / Takip Kodu
                </label>
                <input
                  type="text"
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  placeholder="T360-2026-..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 font-mono text-xs focus:outline-none focus:border-[#00adb5]"
                />
              </div>
            </div>

            {/* 4. Tarih Aralığı (1 Yıl) & Kiracı Bilgisi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Yönetim Başlangıç Tarihi *</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 font-mono text-xs focus:outline-none focus:border-[#00adb5]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Yönetim Bitiş Tarihi (+1 Yıl) *</span>
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 font-mono text-xs focus:outline-none focus:border-[#00adb5]"
                />
              </div>
            </div>

            {/* 5. Kiracı Bilgisi (Opsiyonel) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Mevcut Kiracı Adı (Varsa)
                </label>
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="Kiracı Ad Soyad"
                  className="w-full px-2.5 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#00adb5]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Kiracı Telefon Numarası
                </label>
                <input
                  type="text"
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value)}
                  placeholder="+90 533 ..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#00adb5]"
                />
              </div>
            </div>

            {/* 6. Atanan Danışman & Notlar */}
            {isBroker && (
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Sorumlu Danışman (Ofis Yönetimi / Broker Yetkisi)
                </label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#00adb5]"
                >
                  {agentOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.title || (u.role === "ADMIN" ? "Broker" : "Danışman")})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Özel Sözleşme Notları & Talimatlar
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Örn: Havuz temizliği haftada 2 kez yapılacak. Mülk sahibine aylık dekont özeti iletilecek..."
                className="w-full px-2.5 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#00adb5]"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#1d2566] text-white font-bold hover:bg-[#151a47] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-[#00adb5]" />
                <span>{contractToEdit ? "Değişiklikleri Kaydet" : "Sözleşmeyi Başlat"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* İkincil Portföy ve Müşteri Ekleme Modalları */}
      {isAddCustomerOpen && (
        <AddCustomerModal
          isOpen={isAddCustomerOpen}
          onClose={() => setIsAddCustomerOpen(false)}
        />
      )}

      {isAddPropertyOpen && (
        <AddPropertyModal
          isOpen={isAddPropertyOpen}
          onClose={() => setIsAddPropertyOpen(false)}
        />
      )}
    </>
  );
}

