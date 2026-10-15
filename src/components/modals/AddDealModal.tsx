"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Currency, DealSharingType } from "@/lib/types";
import {
  Calculator,
  X,
  Users,
  Building,
  CheckCircle2,
  Calendar,
  FileText,
  MapPin,
  Phone,
  ShieldCheck,
  CheckSquare,
  Square,
  Clock,
} from "lucide-react";
import { AddCustomerModal } from "./AddCustomerModal";
import { AddPropertyModal } from "./AddPropertyModal";

interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const LEAD_CHANNELS = [
  "Branda",
  "Telefon",
  "Tavsiye",
  "Web",
  "Sosyal medya",
  "Saha çalışması",
  "YouTube",
  "Yüz yüze sunum",
  "Etkinlik",
  "İlan siteleri",
  "Portföy videosu",
  "Reklam alanları",
];

const PROPERTY_TYPES = ["Daire", "Villa", "Ofis", "Apartman", "Arsa", "Dükkan"];

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

  // Üst Meta Bilgileri
  const [formDealNumber, setFormDealNumber] = useState("");
  const [formReportDate, setFormReportDate] = useState(getTodayStr());
  const [formAdvisorId, setFormAdvisorId] = useState(currentUser.id);
  const [formTitle, setFormTitle] = useState("");

  // 01 Gayrimenkul Bilgileri
  const [formDealType, setFormDealType] = useState<"sale" | "rent">("sale");
  const [formPropertyId, setFormPropertyId] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPropertyType, setFormPropertyType] = useState("Daire");
  const [formArea, setFormArea] = useState("");
  const [formLandType, setFormLandType] = useState<"commercial" | "residential">("residential");

  // 02 Taraflar ve İşlem Tarihleri
  const [formLandlordId, setFormLandlordId] = useState("");
  const [formLandlordName, setFormLandlordName] = useState("");
  const [formLandlordPhone, setFormLandlordPhone] = useState("");
  const [formMandateDate, setFormMandateDate] = useState("");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formCustomerName, setFormCustomerName] = useState("");
  const [formCustomerPhone, setFormCustomerPhone] = useState("");
  const [formDepositDate, setFormDepositDate] = useState("");
  const [formClosingDate, setFormClosingDate] = useState(getTodayStr());
  const [formDurationText, setFormDurationText] = useState("");

  // Sub-modal hedefi (Alıcı mı eklenecek, Mülk Sahibi mi?)
  const [customerModalTarget, setCustomerModalTarget] = useState<"buyer" | "landlord">("buyer");

  // 03 Alıcının Ulaştığı Kanal (Opsiyonel)
  const [formLeadChannel, setFormLeadChannel] = useState("");

  // 04 İşlem Bilgileri & Bedeller
  const [formCurrency, setFormCurrency] = useState<Currency>("GBP");
  const [formAskingPrice, setFormAskingPrice] = useState("");
  const [formAgreedPrice, setFormAgreedPrice] = useState("");
  const [formCommissionRate, setFormCommissionRate] = useState<number>(5);
  const [formPaymentMethod, setFormPaymentMethod] = useState("Banka Havalesi / EFT");
  const [formCollectionDate, setFormCollectionDate] = useState(getTodayStr());
  const [formNotes, setFormNotes] = useState("");
  const [formStage, setFormStage] = useState<"offer" | "won" | "lost">("won");

  // 05 Portföy Türü & Komisyon Paylaşımı
  const [formOrigin, setFormOrigin] = useState<"advisor" | "office">("advisor");
  const [formSharingType, setFormSharingType] = useState<DealSharingType>("none");

  // Ortak Bilgileri (Dışarı veya İçeri)
  const [formPartnerCompany, setFormPartnerCompany] = useState("");
  const [formPartnerName, setFormPartnerName] = useState("");
  const [formPartnerPhone, setFormPartnerPhone] = useState("");
  const [formPartnerAdvisorId, setFormPartnerAdvisorId] = useState("");

  // Broker Onayı
  const [formBrokerApproval, setFormBrokerApproval] = useState(isBroker);

  // Sub-Modallar
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const today = getTodayStr();
      const autoDealNo = `TRL-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;

      // Modal açıldığında form değerlerini sıfırlayıp hazırlar
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormDealNumber(autoDealNo);
      setFormReportDate(today);
      setFormAdvisorId(currentUser.id);
      setFormTitle("");
      setFormDealType("sale");
      setFormPropertyId("");
      setFormAddress("");
      setFormPropertyType("Daire");
      setFormArea("");
      setFormLandType("residential");
      setFormLandlordId("");
      setFormLandlordName("");
      setFormLandlordPhone("");
      setFormMandateDate("");
      setFormCustomerId("");
      setFormCustomerName("");
      setFormCustomerPhone("");
      setFormDepositDate("");
      setFormClosingDate(today);
      setFormDurationText("");
      setFormLeadChannel("");
      setFormCurrency("GBP");
      setFormAskingPrice("");
      setFormAgreedPrice("");
      setFormCommissionRate(5);
      setFormPaymentMethod("Banka Havalesi / EFT");
      setFormCollectionDate(today);
      setFormNotes("");
      setFormStage("won");
      setFormOrigin("advisor");
      setFormSharingType("none");
      setFormPartnerCompany("");
      setFormPartnerName("");
      setFormPartnerPhone("");
      const otherAdvisors = users.filter((u) => u.id !== currentUser.id);
      setFormPartnerAdvisorId(otherAdvisors[0]?.id || "");
      setFormBrokerApproval(isBroker);
    }
  }, [isOpen, currentUser.id, isBroker, users]);

  // Portföy Seçimi Yapıldığında Otomatik Doldurma
  const handleSelectProperty = (pid: string) => {
    setFormPropertyId(pid);
    if (!pid) return;

    const prop = properties.find((p) => p.id === pid);
    if (prop) {
      if (!formTitle) {
        setFormTitle(`${prop.title} İşlem Kapama`);
      }
      setFormAddress(prop.address || prop.region || "");
      if (prop.propertyType) {
        setFormPropertyType(prop.propertyType);
      }
      if (prop.area) {
        setFormArea(prop.area.toString());
      }
      if (prop.price) {
        setFormAskingPrice(prop.price.toString());
        if (!formAgreedPrice) {
          setFormAgreedPrice(prop.price.toString());
        }
      }
      if (prop.currency) {
        setFormCurrency(prop.currency);
      }
      if (prop.listingType) {
        setFormDealType(prop.listingType === "rent" ? "rent" : "sale");
        if (prop.listingType === "rent") {
          setFormCommissionRate(100);
        } else {
          setFormCommissionRate(5);
        }
      }
      if (prop.ownerName) {
        setFormLandlordName(prop.ownerName);
        // Havuzda eşleşen mülk sahibi var mı kontrol et
        const matchedLandlord = customers.find(
          (c) =>
            c.fullName.trim().toLowerCase() === prop.ownerName?.trim().toLowerCase() ||
            (prop.ownerPhone && c.phone && c.phone.replace(/\D/g, "") === prop.ownerPhone.replace(/\D/g, ""))
        );
        if (matchedLandlord) {
          setFormLandlordId(matchedLandlord.id);
          if (matchedLandlord.phone) setFormLandlordPhone(matchedLandlord.phone);
        } else {
          setFormLandlordId("");
        }
      }
      if (prop.ownerPhone) {
        setFormLandlordPhone(prop.ownerPhone);
      }
      // Portföy oluşturulma tarihine göre tahmini işlem süresi
      if (prop.createdAt) {
        try {
          const createDate = new Date(prop.createdAt);
          const now = new Date();
          const diffDays = Math.max(1, Math.ceil((now.getTime() - createDate.getTime()) / (1000 * 3600 * 24)));
          setFormDurationText(`${diffDays} Gün`);
        } catch {
          // ignore
        }
      }
    }
  };

  // Mülk Sahibi Seçimi
  const handleSelectLandlord = (cid: string) => {
    setFormLandlordId(cid);
    if (!cid) {
      setFormLandlordName("");
      setFormLandlordPhone("");
      return;
    }
    const cust = customers.find((c) => c.id === cid);
    if (cust) {
      setFormLandlordName(cust.fullName);
      setFormLandlordPhone(cust.phone || "");
    }
  };

  // Müşteri (Alıcı / Kiracı) Seçimi
  const handleSelectCustomer = (cid: string) => {
    setFormCustomerId(cid);
    if (!cid) {
      setFormCustomerName("");
      setFormCustomerPhone("");
      return;
    }
    const cust = customers.find((c) => c.id === cid);
    if (cust) {
      setFormCustomerName(cust.fullName);
      setFormCustomerPhone(cust.phone || "");
    }
  };

  // ==============================================================
  // HASSAS KOMİSYON VE PAYLAŞIM BÖLÜŞÜM MOTORU (RESMİ TRUSTLINE KURALI)
  // ==============================================================
  // Örnek 1.000 GBP komisyonda:
  // 1) DIŞ OFİS PAYLAŞIMI: Dış Ofis 500 GBP (%50). Kalan 500 GBP:
  //    - Danışman Kendi Portföyü ise: Danışman 300 GBP (%30), Ofis 200 GBP (%20)
  //    - Ofis Portföyü ise: Danışman 250 GBP (%25), Ofis 250 GBP (%25)
  // 2) OFİS İÇİ PAYLAŞIM: Danışman A ve B 500 GBP 500 GBP bölüşür:
  //    - Danışman A (Portföy Sahibi): Kendi portföyü ise %40 ofis kesintisi (200 GBP) -> Net 300 GBP (%30)
  //                                   Ofis portföyü ise %50 ofis kesintisi (250 GBP) -> Net 250 GBP (%25)
  //    - Danışman B (Müşteriyi Getiren): %50 ofis kesintisi (250 GBP) -> Net 250 GBP (%25)
  //    - Ofis: Danışman A'dan 200 GBP + Danışman B'den 250 GBP = 450 GBP (%45)
  //            (Ofis portföyü ise: 250 + 250 = 500 GBP (%50))
  // 3) TEK DANIŞMAN:
  //    - Kendi Portföyü: Danışman %60 (600 GBP), Ofis %40 (400 GBP)
  //    - Ofis Portföyü: Danışman %50 (500 GBP), Ofis %50 (500 GBP)
  // ==============================================================
  const numericPrice = Number(formAgreedPrice) || 0;
  const calculatedCommission =
    formCommissionRate === 100
      ? numericPrice
      : Math.round((numericPrice * formCommissionRate) / 100);

  let advisorShareRate = 0; // Danışman A (Satış GD / Portföy Sahibi GD)
  let partnerShareRate = 0; // Ortak (Dış Ofis veya Danışman B)
  let officeShareRate = 0;  // Trustline Ofis

  if (formSharingType === "none") {
    // Tek Danışman
    if (formOrigin === "advisor") {
      advisorShareRate = 60;
      officeShareRate = 40;
      partnerShareRate = 0;
    } else {
      advisorShareRate = 50;
      officeShareRate = 50;
      partnerShareRate = 0;
    }
  } else if (formSharingType === "external") {
    // Dış Ofis Paylaşımı
    partnerShareRate = 50; // Dış Emlak Ofisi
    if (formOrigin === "advisor") {
      advisorShareRate = 30; // Trustline GD
      officeShareRate = 20;  // Trustline Ofis
    } else {
      advisorShareRate = 25; // Trustline GD
      officeShareRate = 25;  // Trustline Ofis
    }
  } else if (formSharingType === "internal") {
    // Şirket İçi 2 Danışman Paylaşımı
    partnerShareRate = 25; // Danışman B (Müşteri Bacağı: %50 Brüt - %50 Ofis Payı = Net %25)
    if (formOrigin === "advisor") {
      // Danışman A (Portföy Sahibi GD: %50 Brüt - %40 Ofis Payı = Net %30)
      advisorShareRate = 30;
      // Ofis: Danışman A'dan %20 (200 GBP) + Danışman B'den %25 (250 GBP) = Toplam %45 (450 GBP)
      officeShareRate = 45;
    } else {
      // Ofis Portföyü: Her iki danışman da %50 brüt - %50 ofis payı = Net %25'er
      advisorShareRate = 25;
      // Ofis: %25 + %25 = Toplam %50 (500 GBP)
      officeShareRate = 50;
    }
  }

  const calculatedAdvisorShare = Math.round((calculatedCommission * advisorShareRate) / 100);
  const calculatedPartnerShare = Math.round((calculatedCommission * partnerShareRate) / 100);
  const calculatedOfficeShare = calculatedCommission - calculatedAdvisorShare - calculatedPartnerShare;

  const assignedUser = users.find((u) => u.id === formAdvisorId) || currentUser;
  const internalPartnerUser = users.find((u) => u.id === formPartnerAdvisorId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAgreedPrice || numericPrice <= 0) {
      alert("Lütfen geçerli bir işlem bedeli girin.");
      return;
    }

    if (!formCustomerId && !formCustomerName) {
      alert("Lütfen kayıtlı müşteri havuzundan bir alıcı/kiracı seçin veya '+ Yeni Müşteri' butonuyla ekleyin.");
      return;
    }

    const finalCustomer = customers.find((c) => c.id === formCustomerId);
    const finalCustomerName = formCustomerName || finalCustomer?.fullName || "Müşteri";
    const finalCustomerPhone = formCustomerPhone || finalCustomer?.phone || undefined;

    const finalLandlord = customers.find((c) => c.id === formLandlordId);
    const finalLandlordName = formLandlordName || finalLandlord?.fullName || undefined;
    const finalLandlordPhone = formLandlordPhone || finalLandlord?.phone || undefined;

    const titleToUse =
      formTitle.trim() ||
      `${formAddress || formPropertyType} — ${finalCustomerName} İşlem Kapama`;

    const selectedProp = properties.find((p) => p.id === formPropertyId);

    addDeal({
      title: titleToUse,
      dealNumber: formDealNumber || undefined,
      dealType: formDealType,
      customerId: formCustomerId || "custom-cst",
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      propertyId: formPropertyId,
      propertyTitle: selectedProp ? selectedProp.title : formAddress || "Gayrimenkul",
      address: formAddress,
      propertyType: formPropertyType,
      area: Number(formArea) || undefined,
      landType: formPropertyType === "Arsa" ? formLandType : undefined,
      landlordName: finalLandlordName,
      landlordPhone: finalLandlordPhone,
      mandateDate: formMandateDate || undefined,
      depositDate: formDepositDate || undefined,
      durationText: formDurationText || undefined,
      leadChannel: formLeadChannel || undefined,
      currency: formCurrency,
      stage: formStage,
      askingPrice: Number(formAskingPrice) || numericPrice,
      offeredPrice: numericPrice,
      agreedPrice: numericPrice,
      deposit: 0,
      commissionRate: formCommissionRate,
      commissionExpected: calculatedCommission,
      commissionReceived: formStage === "won" ? calculatedCommission : 0,
      paymentMethod: formPaymentMethod,
      collectionDate: formCollectionDate,
      portfolioOrigin: formOrigin,
      sharingType: formSharingType,
      partnerCompany: formSharingType === "external" ? formPartnerCompany : undefined,
      partnerName:
        formSharingType === "external"
          ? formPartnerName
          : formSharingType === "internal"
          ? internalPartnerUser?.name
          : undefined,
      partnerPhone: formSharingType === "external" ? formPartnerPhone : undefined,
      partnerAdvisorId: formSharingType === "internal" ? formPartnerAdvisorId : undefined,
      partnerAdvisorName: formSharingType === "internal" ? internalPartnerUser?.name : undefined,
      partnerShareRate: partnerShareRate,
      partnerShareAmount: calculatedPartnerShare,
      advisorShareRate: advisorShareRate,
      advisorShareAmount: calculatedAdvisorShare,
      officeShareRate: officeShareRate,
      officeShareAmount: calculatedOfficeShare,
      brokerApproval: formBrokerApproval,
      brokerApprovedAt: formBrokerApproval ? getTodayStr() : undefined,
      brokerApprovedBy: formBrokerApproval ? "Volkan Affan Kanıgür" : undefined,
      closingDate: formClosingDate || getTodayStr(),
      paymentDue: formCollectionDate || getTodayStr(),
      createdById: formAdvisorId,
      createdByName: assignedUser.name,
      notes: formNotes || "İşlem kapama formu üzerinden kaydedildi.",
    });

    onClose();
    if (onSuccess) onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="sharp-card w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-slate-300 bg-white shadow-2xl my-auto">
        {/* ÜST RESMİ OFİS FORMU BAŞLIĞI */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-widest text-[#00adb5] uppercase font-bold">
                TRUSTLINE REAL ESTATE
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] font-mono text-slate-500 italic">
                by Volkan Affan Kanıgür
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#1d2566] tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>İŞLEM KAPAMA (İŞLEM SONRASI OFİS RAPORU)</span>
            </h2>
            <p className="text-[11px] text-slate-500 font-mono">
              Resmi komisyon bölüşümü, müşteri/portföy bilgileri ve broker onay formu
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 cursor-pointer transition hover:bg-slate-200/50"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 text-xs">
          {/* ÜST REFERANS VE DANIŞMAN ŞERİDİ */}
          <div className="bg-slate-50/80 p-3.5 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#00adb5]" />
                <span>GD ADI SOYADI *</span>
              </label>
              {isBroker ? (
                <select
                  value={formAdvisorId}
                  onChange={(e) => setFormAdvisorId(e.target.value)}
                  className="sharp-input w-full p-2 bg-white font-medium text-slate-800"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.role === "ADMIN" ? "(Broker / Yönetici)" : "(Danışman)"}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="sharp-input w-full p-2 bg-white font-medium text-slate-800 flex items-center justify-between">
                  <span className="font-bold text-[#1d2566]">{currentUser.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold">
                    Satış GD
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-bold">
                İŞLEM / PORTFÖY NO
              </label>
              <input
                type="text"
                value={formDealNumber}
                onChange={(e) => setFormDealNumber(e.target.value)}
                placeholder="Örn: TRL-2610-842"
                className="sharp-input w-full p-2 font-mono font-bold text-[#1d2566]"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-mono text-[11px] mb-1 font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#00adb5]" />
                <span>RAPOR TARİHİ</span>
              </label>
              <input
                type="date"
                required
                value={formReportDate}
                onChange={(e) => setFormReportDate(e.target.value)}
                className="sharp-input w-full p-2 bg-white font-mono"
              />
            </div>
          </div>

          {/* 01 GAYRİMENKUL BİLGİLERİ */}
          <div className="space-y-3 p-4 border border-slate-200 bg-white shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white bg-[#1d2566] px-1.5 py-0.5">
                  01
                </span>
                <span className="font-mono font-bold text-slate-800 uppercase tracking-wider">
                  GAYRİMENKUL BİLGİLERİ
                </span>
              </div>

              {/* Satış / Kiralama Seçimi */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormDealType("sale");
                    if (formCommissionRate === 100) setFormCommissionRate(5);
                  }}
                  className={`px-3 py-1 font-mono text-[11px] font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                    formDealType === "sale"
                      ? "bg-[#1d2566] text-white border-[#1d2566]"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-300"
                  }`}
                >
                  {formDealType === "sale" ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  <span>Satış</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormDealType("rent");
                    setFormCommissionRate(100);
                  }}
                  className={`px-3 py-1 font-mono text-[11px] font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                    formDealType === "rent"
                      ? "bg-[#00adb5] text-white border-[#00adb5]"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-300"
                  }`}
                >
                  {formDealType === "rent" ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  <span>Kiralama</span>
                </button>
              </div>
            </div>

            {/* Portföy Seçimi veya Elle Giriş */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-mono text-[11px] font-bold">
                    Kayıtlı Portföyden Çek (Otomatik Doldurur):
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddPropertyModalOpen(true)}
                    className="px-2 py-0.5 bg-[#00adb5] hover:bg-[#00939a] text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  >
                    <Building className="w-3 h-3" />
                    <span>+ Yeni Portföy</span>
                  </button>
                </div>
                <select
                  value={formPropertyId}
                  onChange={(e) => handleSelectProperty(e.target.value)}
                  className="sharp-input w-full p-2 bg-white"
                >
                  <option value="">-- Portföy havuzundan seçin veya aşağıya yazın --</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.price.toLocaleString("tr-TR")} {p.currency}) - {p.region}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                  İşlem Başlığı / Portföy Tanımı *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Örn: Girne Alsancak 2+1 Lüks Bahçeli Daire Satışı"
                  className="sharp-input w-full p-2"
                />
              </div>
            </div>

            {/* Adres */}
            <div>
              <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#00adb5]" />
                <span>ADRES</span>
              </label>
              <input
                type="text"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Örn: Girne / Alsancak, Deniz Cad. No: 14 Daire: 3"
                className="sharp-input w-full p-2"
              />
            </div>

            {/* Gayrimenkul Türü & Arazi m² & Arsa Türü */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                  Gayrimenkul Türü
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {PROPERTY_TYPES.map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setFormPropertyType(pt)}
                      className={`p-1 text-center font-mono text-[10px] font-bold border transition cursor-pointer ${
                        formPropertyType === pt
                          ? "bg-[#1d2566] text-white border-[#1d2566]"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                  Arazi / Net m²
                </label>
                <input
                  type="number"
                  value={formArea}
                  onChange={(e) => setFormArea(e.target.value)}
                  placeholder="Örn: 145"
                  className="sharp-input w-full p-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                  Arsa Türü (Arsa İse)
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer font-mono text-[11px]">
                    <input
                      type="radio"
                      name="landType"
                      disabled={formPropertyType !== "Arsa"}
                      checked={formLandType === "commercial"}
                      onChange={() => setFormLandType("commercial")}
                      className="accent-[#00adb5]"
                    />
                    <span>Ticari</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-mono text-[11px]">
                    <input
                      type="radio"
                      name="landType"
                      disabled={formPropertyType !== "Arsa"}
                      checked={formLandType === "residential"}
                      onChange={() => setFormLandType("residential")}
                      className="accent-[#00adb5]"
                    />
                    <span>Villalık</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 02 TARAFLAR VE İŞLEM TARİHLERİ */}
          <div className="space-y-3 p-4 border border-slate-200 bg-white shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="font-mono text-xs font-bold text-white bg-[#1d2566] px-1.5 py-0.5">
                02
              </span>
              <span className="font-mono font-bold text-slate-800 uppercase tracking-wider">
                TARAFLAR VE İŞLEM TARİHLERİ
              </span>
            </div>

            {/* Mülk Sahibi & Yetki Tarihi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/60 p-3 border border-slate-200">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-mono text-[11px] font-bold">
                    MÜLK SAHİBİ (HAVUZDAN SEÇ)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerModalTarget("landlord");
                      setIsAddCustomerModalOpen(true);
                    }}
                    className="text-[10px] text-[#00adb5] font-mono font-bold hover:underline cursor-pointer"
                  >
                    + Yeni Müşteri
                  </button>
                </div>
                <select
                  value={formLandlordId}
                  onChange={(e) => handleSelectLandlord(e.target.value)}
                  className="sharp-input w-full h-9 p-2 bg-white text-xs font-mono font-medium text-slate-800"
                >
                  <option value="">-- Müşteri havuzundan mülk sahibi seçin --</option>
                  {formLandlordName && !customers.some((c) => c.id === formLandlordId) && (
                    <option value="__prop_owner__">
                      {formLandlordName} (Portföy Kaydından)
                    </option>
                  )}
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} {c.phone ? `(${c.phone})` : ""} {c.category === "SELLER" ? "• Satıcı/Ev Sahibi" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#00adb5]" />
                  <span>TELEFON</span>
                </label>
                <input
                  type="text"
                  value={formLandlordPhone}
                  onChange={(e) => setFormLandlordPhone(e.target.value)}
                  placeholder="+90 533 ..."
                  className="sharp-input w-full h-9 p-2 bg-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                  YETKİ BELGESİ ALINAN TARİH
                </label>
                <input
                  type="date"
                  value={formMandateDate}
                  onChange={(e) => setFormMandateDate(e.target.value)}
                  className="sharp-input w-full h-9 p-2 bg-white font-mono text-xs"
                />
              </div>
            </div>

            {/* Alıcı / Kiracı & Depozito Tarihi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/60 p-3 border border-slate-200">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-mono text-[11px] font-bold">
                    ALICI / KİRACI (HAVUZDAN SEÇ) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerModalTarget("buyer");
                      setIsAddCustomerModalOpen(true);
                    }}
                    className="text-[10px] text-[#00adb5] font-mono font-bold hover:underline cursor-pointer"
                  >
                    + Yeni Müşteri
                  </button>
                </div>
                <select
                  required
                  value={formCustomerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="sharp-input w-full h-9 p-2 bg-white text-xs font-mono font-medium text-slate-800"
                >
                  <option value="">-- Müşteri havuzundan alıcı seçin * --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} {c.phone ? `(${c.phone})` : ""} {c.category === "BUYER" || c.category === "TENANT" ? "• Alıcı/Kiracı" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#00adb5]" />
                  <span>TELEFON</span>
                </label>
                <input
                  type="text"
                  value={formCustomerPhone}
                  onChange={(e) => setFormCustomerPhone(e.target.value)}
                  placeholder="+90 548 ..."
                  className="sharp-input w-full h-9 p-2 bg-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                  DEPOZİTO TARİHİ
                </label>
                <input
                  type="date"
                  value={formDepositDate}
                  onChange={(e) => setFormDepositDate(e.target.value)}
                  className="sharp-input w-full h-9 p-2 bg-white font-mono text-xs"
                />
              </div>
            </div>

            {/* İşlem Kapatma Tarihi & Süre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>İŞLEM KAPATMA TARİHİ *</span>
                </label>
                <input
                  type="date"
                  required
                  value={formClosingDate}
                  onChange={(e) => setFormClosingDate(e.target.value)}
                  className="sharp-input w-full h-9 p-2 font-mono font-bold text-[#1d2566] text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>SATIŞ / KİRALAMA SÜRESİ (GÜN / HAFTA / AY)</span>
                </label>
                <input
                  type="text"
                  value={formDurationText}
                  onChange={(e) => setFormDurationText(e.target.value)}
                  placeholder="Örn: 24 Gün, 6 Hafta, 3 Ay"
                  className="sharp-input w-full h-9 p-2 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* 03 ALICININ ULAŞTIĞI KANAL */}
          <div className="space-y-3 p-4 border border-slate-200 bg-white shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white bg-[#1d2566] px-1.5 py-0.5">
                  03
                </span>
                <span className="font-mono font-bold text-slate-800 uppercase tracking-wider">
                  ALICININ ULAŞTIĞI KANAL (MÜŞTERİ KAYNAĞI)
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5">
                Opsiyonel
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {LEAD_CHANNELS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setFormLeadChannel(formLeadChannel === ch ? "" : ch)}
                  className={`p-2 font-mono text-[11px] font-bold border transition text-left flex items-center gap-2 cursor-pointer ${
                    formLeadChannel === ch
                      ? "bg-cyan-50 border-[#00adb5] text-[#1d2566] shadow-2xs"
                      : "bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {formLeadChannel === ch ? (
                    <CheckSquare className="w-3.5 h-3.5 text-[#00adb5] shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span>{ch}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 04 İŞLEM BİLGİLERİ & BEDELLER */}
          <div className="space-y-3 p-4 border border-slate-200 bg-white shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="font-mono text-xs font-bold text-white bg-[#1d2566] px-1.5 py-0.5">
                04
              </span>
              <span className="font-mono font-bold text-slate-800 uppercase tracking-wider">
                İŞLEM BİLGİLERİ VE BEDELLER
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                  Para Birimi
                </label>
                <select
                  value={formCurrency}
                  onChange={(e) => setFormCurrency(e.target.value as Currency)}
                  className="sharp-input w-full h-9 p-2 bg-white font-mono font-bold text-xs text-[#1d2566]"
                >
                  <option value="GBP">GBP (£ - Sterlin)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="USD">USD ($ - Dolar)</option>
                  <option value="TRY">TRY (₺ - TL)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                  SATIŞ / KİRA LİSTE FİYATI
                </label>
                <input
                  type="number"
                  value={formAskingPrice}
                  onChange={(e) => setFormAskingPrice(e.target.value)}
                  placeholder="Örn: 160000"
                  className="sharp-input w-full h-9 p-2 font-mono text-xs text-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold text-[#00adb5]">
                  KAÇA SATILDI / KİRALANDI *
                </label>
                <input
                  type="number"
                  required
                  value={formAgreedPrice}
                  onChange={(e) => setFormAgreedPrice(e.target.value)}
                  placeholder="Örn: 150000"
                  className="sharp-input w-full h-9 p-2 font-mono font-bold text-xs text-[#1d2566]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                  HİZMET BEDELİ (KOMİSYON %)
                </label>
                <select
                  value={formCommissionRate}
                  onChange={(e) => setFormCommissionRate(Number(e.target.value))}
                  className="sharp-input w-full h-9 p-2 bg-white font-mono font-bold text-xs"
                >
                  <option value={1}>%1</option>
                  <option value={2}>%2</option>
                  <option value={3}>%3</option>
                  <option value={4}>%4</option>
                  <option value={5}>%5 (Standart Satış)</option>
                  <option value={6}>%6</option>
                  <option value={10}>%10</option>
                  <option value={100}>%100 (1 Kira Bedeli)</option>
                </select>
              </div>
            </div>

            {/* Tahsilat Tarihi & Yöntemi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                  TAHSİLAT TARİHİ
                </label>
                <input
                  type="date"
                  value={formCollectionDate}
                  onChange={(e) => setFormCollectionDate(e.target.value)}
                  className="sharp-input w-full p-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                  TAHSİLAT YÖNTEMİ
                </label>
                <select
                  value={formPaymentMethod}
                  onChange={(e) => setFormPaymentMethod(e.target.value)}
                  className="sharp-input w-full p-2 bg-white font-medium"
                >
                  <option value="Banka Havalesi / EFT">Banka Havalesi / EFT (Trustline Ofis Hesabı)</option>
                  <option value="Nakit Tahsilat">Nakit Tahsilat (Ofis Veznesi)</option>
                  <option value="Banka Çeki">Banka Çeki</option>
                  <option value="Kredi Kartı / POS">Kredi Kartı / POS</option>
                </select>
              </div>
            </div>

            {/* Notlar */}
            <div>
              <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                İŞLEM NOTLARI
              </label>
              <textarea
                rows={2}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Ödeme şartları, tapu devir detayları, özel anlaşmalar..."
                className="sharp-input w-full p-2"
              />
            </div>
          </div>

          {/* 05 PORTFÖY TÜRÜ VE KOMİSYON PAYLAŞIMI */}
          <div className="space-y-4 p-4 border-2 border-emerald-500/40 bg-emerald-50/20 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white bg-emerald-700 px-1.5 py-0.5">
                  05
                </span>
                <span className="font-mono font-bold text-[#1d2566] uppercase tracking-wider">
                  PORTFÖY TÜRÜ VE KOMİSYON BÖLÜŞÜMÜ
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5">
                Kural Bazlı Otomatik Hesaplama
              </span>
            </div>

            {/* Portföy Menşei & Paylaşım Seçicileri */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Menşei */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-mono text-[11px] font-bold">
                  A. Portföy Menşei *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormOrigin("advisor")}
                    className={`p-2.5 font-mono text-[11px] font-bold border transition text-center cursor-pointer ${
                      formOrigin === "advisor"
                        ? "bg-[#1d2566] text-white border-[#1d2566] shadow-2xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Danışman Kendi Portföyü
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormOrigin("office")}
                    className={`p-2.5 font-mono text-[11px] font-bold border transition text-center cursor-pointer ${
                      formOrigin === "office"
                        ? "bg-[#1d2566] text-white border-[#1d2566] shadow-2xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Ofis Portföyü (Ofis Havuzu)
                  </button>
                </div>
              </div>

              {/* Paylaşım Durumu */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-mono text-[11px] font-bold">
                  B. Paylaşım Durumu *
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFormSharingType("none")}
                    className={`p-2 font-mono text-[10px] font-bold border transition text-center cursor-pointer ${
                      formSharingType === "none"
                        ? "bg-[#00adb5] text-white border-[#00adb5] shadow-2xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Tek Danışman (Paylaşım Yok)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormSharingType("external")}
                    className={`p-2 font-mono text-[10px] font-bold border transition text-center cursor-pointer ${
                      formSharingType === "external"
                        ? "bg-[#00adb5] text-white border-[#00adb5] shadow-2xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Dışarı ile Paylaşım (Dış Ofis)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormSharingType("internal")}
                    className={`p-2 font-mono text-[10px] font-bold border transition text-center cursor-pointer ${
                      formSharingType === "internal"
                        ? "bg-[#00adb5] text-white border-[#00adb5] shadow-2xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    İçeri ile Paylaşım (2. Danışman)
                  </button>
                </div>
              </div>
            </div>

            {/* Dışarı ile Paylaşım Alanları */}
            {formSharingType === "external" && (
              <div className="p-3 bg-cyan-50/70 border border-cyan-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-mono text-[10px] mb-1 font-bold">
                    ORTAK DIŞ OFİS / ŞİRKET ADI *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPartnerCompany}
                    onChange={(e) => setFormPartnerCompany(e.target.value)}
                    placeholder="Örn: Coldwell Banker, Remax vb."
                    className="sharp-input w-full p-1.5 bg-white text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-mono text-[10px] mb-1 font-bold">
                    ORTAK DANIŞMAN ADI SOYADI *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPartnerName}
                    onChange={(e) => setFormPartnerName(e.target.value)}
                    placeholder="Örn: Mehmet Yılmaz"
                    className="sharp-input w-full p-1.5 bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-mono text-[10px] mb-1 font-bold">
                    ORTAK İLETİŞİM BİLGİSİ
                  </label>
                  <input
                    type="text"
                    value={formPartnerPhone}
                    onChange={(e) => setFormPartnerPhone(e.target.value)}
                    placeholder="+90 533 ..."
                    className="sharp-input w-full p-1.5 bg-white text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* İçeri ile Paylaşım Alanları */}
            {formSharingType === "internal" && (
              <div className="p-3 bg-cyan-50/70 border border-cyan-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-mono text-[10px] mb-1 font-bold">
                    ŞİRKET İÇİ ORTAK 2. DANIŞMAN (MÜŞTERİ BACAĞI) *
                  </label>
                  <select
                    value={formPartnerAdvisorId}
                    onChange={(e) => setFormPartnerAdvisorId(e.target.value)}
                    className="sharp-input w-full p-1.5 bg-white text-xs font-bold text-slate-800"
                  >
                    {users
                      .filter((u) => u.id !== formAdvisorId)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role === "ADMIN" ? "Broker" : "Danışman"})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center text-[11px] font-mono text-cyan-950 bg-white/90 p-2.5 border border-cyan-300">
                  <span>
                    İç Paylaşım Kuralı: Komisyon 50/50 brüt bölüşülür. Her danışmandan ofis kendi payını keser (Portföy sahibi Danışman A&apos;dan %{formOrigin === "advisor" ? "40 ofis kesintisi (net %30)" : "50 ofis kesintisi (net %25)"}, Müşteri getiren Danışman B&apos;den %50 ofis kesintisi (net %25)).
                  </span>
                </div>
              </div>
            )}

            {/* CANLI KOMİSYON VE PAY BÖLÜŞÜM TABLOSU */}
            <div className="border border-slate-300 bg-white shadow-xs">
              <div className="p-2.5 bg-slate-100 border-b border-slate-300 flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[#1d2566] flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  TOPLAM KOMİSYON HİZMET BEDELİ:
                </span>
                <span className="font-bold text-base text-emerald-700">
                  {calculatedCommission.toLocaleString("tr-TR")} {formCurrency}
                </span>
              </div>

              <div className="p-3">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                      <th className="py-1.5 px-2">PAY SAHİBİ</th>
                      <th className="py-1.5 px-2 text-center w-28">ORAN (%)</th>
                      <th className="py-1.5 px-2 text-right">TUTAR ({formCurrency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Dış Ofis Payı (Eğer Dışarı ile Paylaşım Varsa) */}
                    {formSharingType === "external" && (
                      <tr className="bg-purple-50/50">
                        <td className="py-2.5 px-2">
                          <div className="font-bold text-purple-900">
                            Dış Emlak Ofisi ({formPartnerCompany || formPartnerName || "Dış Ortak"})
                          </div>
                          <div className="text-[10px] text-purple-700">
                            Dış Ofis Brüt Paylaşım Payı (%50)
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="px-2.5 py-1 bg-white border border-purple-300 font-bold text-purple-900 inline-block w-16">
                            %{partnerShareRate}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-purple-900 text-sm">
                          {calculatedPartnerShare.toLocaleString("tr-TR")} {formCurrency}
                        </td>
                      </tr>
                    )}

                    {/* Satış Danışmanı (Danışman A / GD 1) */}
                    <tr className="bg-slate-50/50">
                      <td className="py-2.5 px-2">
                        <div className="font-bold text-[#1d2566]">
                          {formSharingType === "internal" ? "Danışman A — Portföy Sahibi" : "Satış GD"} ({assignedUser.name})
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formSharingType === "internal"
                            ? formOrigin === "advisor"
                              ? "Kendi Portföyü: %50 Brüt Paylaşım — %40 Ofis Kesintisi = Net %30"
                              : "Ofis Portföyü: %50 Brüt Paylaşım — %50 Ofis Kesintisi = Net %25"
                            : formSharingType === "external"
                            ? formOrigin === "advisor"
                              ? "Trustline GD (Kalan %50'nin %60'ı = %30)"
                              : "Trustline GD (Kalan %50'nin %50'si = %25)"
                            : formOrigin === "advisor"
                            ? "Danışman Kendi Portföyü (%60)"
                            : "Ofis Portföyü (%50)"}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="px-2.5 py-1 bg-white border border-slate-300 font-bold text-slate-800 inline-block w-16">
                          %{advisorShareRate}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-[#1d2566] text-sm">
                        {calculatedAdvisorShare.toLocaleString("tr-TR")} {formCurrency}
                      </td>
                    </tr>

                    {/* Şirket İçi Ortak Danışman B (Müşteri Bacağı) */}
                    {formSharingType === "internal" && (
                      <tr className="bg-cyan-50/50">
                        <td className="py-2.5 px-2">
                          <div className="font-bold text-cyan-900">
                            Danışman B — Müşteriyi Getiren ({internalPartnerUser?.name || "2. Danışman"})
                          </div>
                          <div className="text-[10px] text-cyan-700">
                            Müşteri Bacağı: %50 Brüt Paylaşım — %50 Ofis Kesintisi = Net %25
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="px-2.5 py-1 bg-white border border-cyan-300 font-bold text-cyan-900 inline-block w-16">
                            %{partnerShareRate}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-cyan-900 text-sm">
                          {calculatedPartnerShare.toLocaleString("tr-TR")} {formCurrency}
                        </td>
                      </tr>
                    )}

                    {/* OFİS PAYI */}
                    <tr className="bg-emerald-50/50">
                      <td className="py-2.5 px-2">
                        <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>OFİS PAYI (Trustline Real Estate)</span>
                        </div>
                        <div className="text-[10px] text-emerald-700">
                          {formSharingType === "internal"
                            ? formOrigin === "advisor"
                              ? "Danışman A'dan %20 (200 GBP) + Danışman B'den %25 (250 GBP) = Toplam %45"
                              : "Danışman A'dan %25 (250 GBP) + Danışman B'den %25 (250 GBP) = Toplam %50"
                            : formSharingType === "external"
                            ? formOrigin === "advisor"
                              ? "Trustline Ofis (Kalan %50'nin %40'ı = %20)"
                              : "Trustline Ofis (Kalan %50'nin %50'si = %25)"
                            : formOrigin === "advisor"
                            ? "Merkez Ofis Payı (%40)"
                            : "Merkez Ofis Payı (%50)"}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="px-2.5 py-1 bg-white border border-emerald-300 font-bold text-emerald-900 inline-block w-16">
                          %{officeShareRate}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-emerald-800 text-sm">
                        {calculatedOfficeShare.toLocaleString("tr-TR")} {formCurrency}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* İMZALAR & BROKER ONAYI */}
            <div className="bg-white p-3 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <span className="text-[10px] font-mono text-slate-500 block">SATIŞ GD BEYANI:</span>
                <span className="font-bold text-slate-800 text-xs">
                  {assignedUser.name} — Beyan Edildi ({formReportDate})
                </span>
              </div>

              <div className="flex items-center justify-end gap-3">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 border border-slate-200 hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={formBrokerApproval}
                    onChange={(e) => setFormBrokerApproval(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 accent-emerald-600 rounded-none cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-[#1d2566] text-xs block">
                      BROKER ONAYI (Volkan Affan Kanıgür)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formBrokerApproval ? "✓ Onaylandı" : "Onay Bekliyor"}
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* İPTAL VE KAYIT BUTONLARI */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer font-mono font-bold"
            >
              İptal
            </button>

            <button
              type="submit"
              className="sharp-btn-primary px-6 py-2.5 font-bold text-white shadow-sm cursor-pointer flex items-center gap-2 text-xs uppercase tracking-wider"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>İşlemi Kapat ve Raporu Kaydet</span>
            </button>
          </div>
        </form>
      </div>

      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        onSuccess={(newCust) => {
          if (customerModalTarget === "landlord") {
            setFormLandlordId(newCust.id);
            setFormLandlordName(newCust.fullName);
            setFormLandlordPhone(newCust.phone || "");
          } else {
            setFormCustomerId(newCust.id);
            setFormCustomerName(newCust.fullName);
            setFormCustomerPhone(newCust.phone || "");
          }
          setIsAddCustomerModalOpen(false);
        }}
      />

      <AddPropertyModal
        isOpen={isAddPropertyModalOpen}
        onClose={() => setIsAddPropertyModalOpen(false)}
        onSuccess={(newProperty) => {
          handleSelectProperty(newProperty.id);
          setIsAddPropertyModalOpen(false);
        }}
      />
    </div>
  );
}
