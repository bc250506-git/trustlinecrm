"use client";

import React, { useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { Deal, Currency, DealSharingType } from "@/lib/types";
import {
  X,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Building,
  User,
  DollarSign,
  Users,
  Eye,
  Loader2,
  RefreshCw,
  HelpCircle,
  Clock,
  ArrowRight,
} from "lucide-react";

interface AddHistoricalDealModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROPERTY_TYPES = ["Daire", "Villa", "Ofis", "Apartman", "Arsa", "Dükkan"];
const LEAD_CHANNELS = [
  "Branda",
  "Telefon",
  "Tavsiye",
  "Web",
  "Sosyal medya",
  "Saha çalışması",
  "İlan siteleri",
  "YouTube",
  "Yüz yüze sunum",
  "Etkinlik",
  "Portföy videosu",
  "Reklam alanları",
];

export function AddHistoricalDealModal({
  isOpen,
  onClose,
}: AddHistoricalDealModalProps) {
  const { users, currentUser, isBroker, addDeal } = useStore();

  // Fotoğraf & AI Tarama Durumları
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccessMsg, setScanSuccessMsg] = useState("");
  const [scanErrorMsg, setScanErrorMsg] = useState("");
  const [previewZoom, setPreviewZoom] = useState(false);

  // Form Alanları (%100 Manuel Düzenlenebilir)
  // Header
  const [advisorName, setAdvisorName] = useState("");
  const [advisorId, setAdvisorId] = useState(currentUser.id);
  const [portfolioNo, setPortfolioNo] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [closingDate, setClosingDate] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split("T")[0];
      if (!reportDate) setReportDate(today);
      if (!closingDate) setClosingDate(today);
    }
  }, [isOpen]);

  // 01 Gayrimenkul
  const [dealType, setDealType] = useState<"sale" | "rent">("sale");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyType, setPropertyType] = useState("Daire");
  const [landArea, setLandArea] = useState("");
  const [landType, setLandType] = useState<"commercial" | "residential">("residential");

  // 02 Taraflar
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [mandateDate, setMandateDate] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [depositDate, setDepositDate] = useState("");
  const [dealDuration, setDealDuration] = useState("");

  // 03 Kanal
  const [leadChannel, setLeadChannel] = useState("");

  // 04 İşlem Bilgileri
  const [currency, setCurrency] = useState<Currency>("GBP");
  const [listingPrice, setListingPrice] = useState<string>("");
  const [closingPrice, setClosingPrice] = useState<string>("");
  const [commissionAmount, setCommissionAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("Nakit");
  const [notes, setNotes] = useState("");

  // 05 Portföy Türü & Paylaşım
  const [portfolioOrigin, setPortfolioOrigin] = useState<"advisor" | "office">("advisor");
  const [sharingType, setSharingType] = useState<DealSharingType>("none");
  const [partnerName, setPartnerName] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [advisorShareRate, setAdvisorShareRate] = useState<number>(100);
  const [advisorShareAmount, setAdvisorShareAmount] = useState<number>(0);
  const [partnerShareRate, setPartnerShareRate] = useState<number>(0);
  const [partnerShareAmount, setPartnerShareAmount] = useState<number>(0);
  const [officeShareRate, setOfficeShareRate] = useState<number>(0);
  const [officeShareAmount, setOfficeShareAmount] = useState<number>(0);

  if (!isOpen) return null;

  // Görsel Yükleme İşlemi
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Görsel boyutu en fazla 10MB olabilir.");
      return;
    }

    setImageFile(file);
    setImageName(file.name);
    setScanSuccessMsg("");
    setScanErrorMsg("");

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageBase64(reader.result);
        // Otomatik taramayı başlat
        scanImageWithAI(reader.result, file.type || "image/jpeg");
      }
    };
    reader.readAsDataURL(file);
  };

  // Yapay Zeka ile Formu Tara
  const scanImageWithAI = async (base64Data: string, mimeType: string) => {
    setIsScanning(true);
    setScanSuccessMsg("");
    setScanErrorMsg("");

    try {
      const res = await fetch("/api/parse-deal-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Data, mimeType }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Form okunamadı.");
      }

      const d = json.data;
      // Alanları yapay zeka verileriyle doldur
      if (d.advisorName) {
        setAdvisorName(d.advisorName);
        // Sistemdeki kullanıcılarla eşleştir
        const matched = users.find(
          (u) =>
            u.name.toLowerCase().includes(d.advisorName.toLowerCase()) ||
            d.advisorName.toLowerCase().includes(u.name.toLowerCase())
        );
        if (matched) {
          setAdvisorId(matched.id);
        }
      }
      const toISODate = (val?: string) => {
        if (!val) return "";
        const parts = val.trim().split(/[./-]/);
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
          }
          if (parts[0].length === 4) {
            return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
          }
        }
        return val;
      };

      if (d.portfolioNo) setPortfolioNo(d.portfolioNo);
      if (d.reportDate) setReportDate(toISODate(d.reportDate));
      if (d.closingDate) setClosingDate(toISODate(d.closingDate));
      if (d.dealType) {
        const dt = String(d.dealType).toLowerCase();
        setDealType(dt.includes("kira") || dt === "rent" ? "rent" : "sale");
      }
      if (d.propertyAddress) setPropertyAddress(d.propertyAddress);
      if (d.propertyType) {
        const pt = String(d.propertyType);
        const match = PROPERTY_TYPES.find((t) => t.toLowerCase() === pt.toLowerCase());
        if (match) setPropertyType(match);
      }
      if (d.landArea) setLandArea(String(d.landArea));
      if (d.sellerName) setSellerName(d.sellerName);
      if (d.sellerPhone) setSellerPhone(d.sellerPhone);
      if (d.mandateDate) setMandateDate(toISODate(d.mandateDate));
      if (d.buyerName) setBuyerName(d.buyerName);
      if (d.buyerPhone) setBuyerPhone(d.buyerPhone);
      if (d.depositDate) setDepositDate(toISODate(d.depositDate));
      if (d.dealDuration) setDealDuration(d.dealDuration);
      if (d.leadSource) {
        const ls = String(d.leadSource);
        const match = LEAD_CHANNELS.find((c) => c.toLowerCase() === ls.toLowerCase());
        setLeadChannel(match || ls);
      }
      if (d.currency) {
        const c = String(d.currency).toUpperCase().trim();
        if (["GBP", "TRY", "USD", "EUR"].includes(c)) setCurrency(c as Currency);
      }
      if (d.listingPrice) setListingPrice(String(d.listingPrice).replace(/[^0-9.]/g, ""));
      if (d.closingPrice) setClosingPrice(String(d.closingPrice).replace(/[^0-9.]/g, ""));
      if (d.commissionAmount) {
        const cleanComm = String(d.commissionAmount).replace(/[^0-9.]/g, "");
        setCommissionAmount(cleanComm);
        calculateCommissionShares(parseFloat(cleanComm) || 0, sharingType, portfolioOrigin);
      }
      if (d.collectionDateMethod) setPaymentMethod(d.collectionDateMethod);
      if (d.notes) setNotes(d.notes);
      if (d.partnerAdvisorName) {
        setPartnerName(d.partnerAdvisorName);
        setSharingType("external");
      }
      if (d.partnerPhone) setPartnerPhone(d.partnerPhone);

      setScanSuccessMsg("Form yapay zeka ile başarıyla tarandı ve kutucuklara aktarıldı. Sağ taraftan kontrol edip dilediğiniz gibi düzenleyebilirsiniz!");
    } catch (err: any) {
      setScanErrorMsg(
        err.message || "Yapay zeka okuma yapamadı. Bilgileri aşağıdaki kutucuklara elle yazarak da kaydedebilirsiniz."
      );
    } finally {
      setIsScanning(false);
    }
  };

  // Komisyon Dağılımını Otomatik Hesapla
  const calculateCommissionShares = (
    totalComm: number,
    shareType: DealSharingType,
    origin: "advisor" | "office"
  ) => {
    if (!totalComm || totalComm <= 0) return;

    if (shareType === "external") {
      // Dış Ortaklık: %50 dış ofis, kalan %50 danışman/ofis
      const half = totalComm * 0.5;
      const advRate = origin === "advisor" ? 0.6 : 0.5;
      const advAmount = half * advRate;
      const offAmount = half * (1 - advRate);

      setPartnerShareRate(50);
      setPartnerShareAmount(half);
      setAdvisorShareRate(advRate * 50);
      setAdvisorShareAmount(advAmount);
      setOfficeShareRate((1 - advRate) * 50);
      setOfficeShareAmount(offAmount);
    } else if (shareType === "internal") {
      // İç Ortaklık: %25 2. danışman, kalan %75
      const partnerAmt = totalComm * 0.25;
      const remaining = totalComm * 0.75;
      const advRate = origin === "advisor" ? 0.6 : 0.5;
      const advAmount = remaining * advRate;
      const offAmount = remaining * (1 - advRate);

      setPartnerShareRate(25);
      setPartnerShareAmount(partnerAmt);
      setAdvisorShareRate(advRate * 75);
      setAdvisorShareAmount(advAmount);
      setOfficeShareRate((1 - advRate) * 75);
      setOfficeShareAmount(offAmount);
    } else {
      // Solo İşlem
      const advRate = origin === "advisor" ? 0.6 : 0.5;
      const advAmt = totalComm * advRate;
      const offAmt = totalComm * (1 - advRate);

      setPartnerShareRate(0);
      setPartnerShareAmount(0);
      setAdvisorShareRate(advRate * 100);
      setAdvisorShareAmount(advAmt);
      setOfficeShareRate((1 - advRate) * 100);
      setOfficeShareAmount(offAmt);
    }
  };

  const handleClosingPriceOrCommChange = (val: string, type: "closing" | "comm") => {
    if (type === "comm") {
      setCommissionAmount(val);
      calculateCommissionShares(parseFloat(val) || 0, sharingType, portfolioOrigin);
    } else {
      setClosingPrice(val);
      // Satış ise %5, kiralama ise 1 kira komisyon tahmini
      const num = parseFloat(val) || 0;
      if (num > 0 && !commissionAmount) {
        const estComm = dealType === "sale" ? num * 0.05 : num;
        setCommissionAmount(String(estComm));
        calculateCommissionShares(estComm, sharingType, portfolioOrigin);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const priceNum = parseFloat(closingPrice) || parseFloat(listingPrice) || 0;
    const commNum = parseFloat(commissionAmount) || 0;

    if (!propertyAddress.trim()) {
      alert("Lütfen en azından gayrimenkul adresini veya başlığını yazın.");
      return;
    }

    if (commNum <= 0) {
      alert("Lütfen geçerli bir hizmet bedeli (komisyon tutarı) girin.");
      return;
    }

    const assignedUser = users.find((u) => u.id === advisorId);
    const finalAdvisorName = advisorName.trim() || assignedUser?.name || currentUser.name;

    const histDeal: Deal = {
      id: `hist-deal-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      title: propertyAddress.trim(),
      dealNumber: portfolioNo.trim() || `TRL-${new Date(closingDate || reportDate).getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      dealType,
      customerId: `hist-cust-${Date.now()}`,
      customerName: buyerName.trim() || "Geçmiş Müşteri",
      customerPhone: buyerPhone.trim() || "",
      propertyId: `hist-prop-${Date.now()}`,
      propertyTitle: propertyAddress.trim(),
      address: propertyAddress.trim(),
      propertyType,
      area: parseFloat(landArea) || undefined,
      landType,
      landlordName: sellerName.trim() || "Mülk Sahibi",
      landlordPhone: sellerPhone.trim() || "",
      mandateDate: mandateDate || undefined,
      depositDate: depositDate || undefined,
      durationText: dealDuration.trim() || undefined,
      leadChannel: leadChannel || undefined,
      currency,
      stage: "won",
      askingPrice: parseFloat(listingPrice) || priceNum,
      offeredPrice: priceNum,
      agreedPrice: priceNum,
      deposit: 0,
      commissionExpected: commNum,
      commissionReceived: commNum,
      paymentMethod,
      collectionDate: closingDate || reportDate,
      portfolioOrigin,
      sharingType,
      partnerName: partnerName.trim() || undefined,
      partnerPhone: partnerPhone.trim() || undefined,
      partnerShareRate,
      partnerShareAmount,
      advisorShareRate,
      advisorShareAmount,
      officeShareRate,
      officeShareAmount,
      brokerApproval: true,
      brokerApprovedAt: closingDate || reportDate,
      brokerApprovedBy: "Volkan Affan Kanıgür (Ofis Yönetimi Arşiv)",
      closingDate: closingDate || reportDate,
      reportDate: reportDate || closingDate,
      isHistorical: true,
      archiveDocumentUrl: imageBase64 || undefined,
      archiveDocumentName: imageName || undefined,
      notes: notes.trim() || undefined,
      createdById: advisorId,
      createdByName: finalAdvisorName,
      createdAt: new Date(closingDate || reportDate || new Date()).toISOString(),
    };

    addDeal(histDeal);
    alert("Geçmiş işlem başarıyla dijital arşive ve finans sistemine kaydedildi!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-[#1d2566] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-white/10 flex items-center justify-center font-bold">
              <Sparkles className="w-4.5 h-4.5 text-[#00adb5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight">
                  Geçmiş İşlem Girişi • Fiziki Rapor Dijitalleştirme
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#00adb5] text-[#1d2566]">
                  AI Vision Destekli
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono">
                Portföy veya müşteri havuzunu kirletmeden fiziki kağıt formları doğrudan finans & ciro arşivine aktarın
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Çift Ekran (Split Screen) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* SOL PANEL: Fiziki Form Fotoğrafı & AI Tarayıcı (5 Kolon) */}
          <div className="lg:col-span-5 bg-slate-50/70 p-4 sm:p-5 flex flex-col overflow-y-auto space-y-4">
            <div className="border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#1d2566] text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>Fiziki Formun Fotoğrafı / Taraması</span>
                </label>
                {imageBase64 && (
                  <button
                    type="button"
                    onClick={() => scanImageWithAI(imageBase64, imageFile?.type || "image/jpeg")}
                    disabled={isScanning}
                    className="text-[11px] font-bold text-[#00adb5] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isScanning ? "animate-spin" : ""}`} />
                    <span>Yeniden Tara</span>
                  </button>
                )}
              </div>

              {!imageBase64 ? (
                <label className="border-2 border-dashed border-slate-300 hover:border-[#00adb5] bg-slate-50/80 hover:bg-slate-100/60 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition">
                  <UploadCloud className="w-8 h-8 text-[#00adb5] mb-2" />
                  <span className="font-bold text-xs text-slate-800">
                    Kağıt Formun Fotoğrafını Seçin veya Buraya Sürükleyin
                  </span>
                  <span className="text-[10.5px] text-slate-500 font-mono mt-1">
                    Telefonla çekilmiş net bir fotoğraf veya CamScanner taraması (JPG, PNG)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-2">
                  <div className="relative border border-slate-300 bg-slate-900 overflow-hidden max-h-[380px] flex items-center justify-center group">
                    <img
                      src={imageBase64}
                      alt="Fiziki Form Taraması"
                      className="max-h-[380px] w-auto object-contain cursor-pointer"
                      onClick={() => setPreviewZoom(true)}
                    />
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewZoom(true)}
                        className="px-2 py-1 bg-black/70 hover:bg-black text-white text-[10.5px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Büyüt</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span className="truncate max-w-[200px]">📎 {imageName}</span>
                    <label className="text-[#00adb5] font-bold hover:underline cursor-pointer">
                      Başka Fotoğraf Seç
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* AI Tarama Bildirimleri */}
              {isScanning && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2 font-mono">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                  <span>Google Gemini Vision formu satır satır inceliyor, alanlar çıkartılıyor...</span>
                </div>
              )}

              {scanSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-mono text-[11px] leading-tight">{scanSuccessMsg}</span>
                </div>
              )}

              {scanErrorMsg && (
                <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="font-mono text-[11px] leading-tight">{scanErrorMsg}</span>
                </div>
              )}
            </div>

            {/* Bilgilendirme Kartı */}
            <div className="p-3.5 bg-white border border-slate-200 text-[11px] font-mono text-slate-600 space-y-1.5">
              <div className="font-bold text-[#1d2566] flex items-center gap-1 text-xs">
                <HelpCircle className="w-3.5 h-3.5 text-[#00adb5]" />
                <span>Geçmiş İşlem Giriş Mantığı:</span>
              </div>
              <p>
                • Fotoğraf attığınızda veriler sağdaki kutucuklara otomatik işlenir.
              </p>
              <p>
                • <strong>İstediğiniz kutucuğa tıklayıp elle düzeltebilirsiniz.</strong>
              </p>
              <p>
                • Yüklenen form görseli kalıcı dijital arşiv olarak işlemin arkasında saklanır.
              </p>
            </div>
          </div>

          {/* SAĞ PANEL: Düzenlenebilir Form Alanları (7 Kolon) */}
          <div className="lg:col-span-7 bg-white p-5 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Form Üst Bilgileri */}
              <div className="p-3 bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                    Danışman (Satış GD) *
                  </label>
                  <select
                    value={advisorId}
                    onChange={(e) => {
                      setAdvisorId(e.target.value);
                      const u = users.find((user) => user.id === e.target.value);
                      if (u) setAdvisorName(u.name);
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 bg-white font-bold text-xs focus:outline-none focus:border-[#00adb5]"
                  >
                    {users.filter((u) => u.active).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                    İşlem / Portföy No
                  </label>
                  <input
                    type="text"
                    value={portfolioNo}
                    onChange={(e) => setPortfolioNo(e.target.value)}
                    placeholder="TRL-24-..."
                    className="w-full px-2.5 py-1.5 border border-slate-300 bg-white font-mono text-xs focus:outline-none focus:border-[#00adb5]"
                  />
                </div>

                <div>
                  <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                    İşlem / Kapanış Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 bg-white font-mono font-bold text-xs focus:outline-none focus:border-[#00adb5]"
                  />
                </div>
              </div>

              {/* 01 GAYRİMENKUL BİLGİLERİ */}
              <div className="space-y-2.5 p-3.5 border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h3 className="font-bold text-[#1d2566] text-xs flex items-center gap-1.5 uppercase font-mono">
                    <Building className="w-3.5 h-3.5 text-[#00adb5]" />
                    <span>01 Gayrimenkul Bilgileri</span>
                  </h3>
                  {/* Satış / Kiralama Seçici */}
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer font-bold font-mono text-xs">
                      <input
                        type="radio"
                        name="dealType"
                        checked={dealType === "sale"}
                        onChange={() => setDealType("sale")}
                        className="accent-[#1d2566]"
                      />
                      <span>Satış</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer font-bold font-mono text-xs">
                      <input
                        type="radio"
                        name="dealType"
                        checked={dealType === "rent"}
                        onChange={() => setDealType("rent")}
                        className="accent-[#1d2566]"
                      />
                      <span>Kiralama</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                    Gayrimenkul Adresi / Tanımı *
                  </label>
                  <input
                    type="text"
                    required
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    placeholder="Örn: Girne Alsancak Green Park Sitesi No:14"
                    className="w-full px-2.5 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#00adb5]"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                      Mülk Türü
                    </label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 text-xs focus:outline-none"
                    >
                      {PROPERTY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                      Arazi / Net m²
                    </label>
                    <input
                      type="text"
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value)}
                      placeholder="Örn: 120 m²"
                      className="w-full px-2 py-1.5 border border-slate-300 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                      Arsa Türü (Arsa İse)
                    </label>
                    <select
                      value={landType}
                      onChange={(e) => setLandType(e.target.value as any)}
                      className="w-full px-2 py-1.5 border border-slate-300 text-xs focus:outline-none"
                    >
                      <option value="residential">Villalık / Konut</option>
                      <option value="commercial">Ticari</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 02 TARAFLAR VE İŞLEM TARİHLERİ */}
              <div className="space-y-2.5 p-3.5 border border-slate-200">
                <h3 className="font-bold text-[#1d2566] text-xs border-b border-slate-200 pb-1.5 uppercase font-mono flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>02 Taraflar ve İşlem Tarihleri</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                      Mülk Sahibi (Satıcı) Adı
                    </label>
                    <input
                      type="text"
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      placeholder="Ad Soyad"
                      className="w-full px-2.5 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#00adb5]"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                      Mülk Sahibi Telefonu
                    </label>
                    <input
                      type="text"
                      value={sellerPhone}
                      onChange={(e) => setSellerPhone(e.target.value)}
                      placeholder="+90 533 ..."
                      className="w-full px-2.5 py-1.5 border border-slate-300 font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                      Yetki Belgesi Tarihi
                    </label>
                    <input
                      type="date"
                      value={mandateDate}
                      onChange={(e) => setMandateDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                      Alıcı / Kiracı Adı
                    </label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Ad Soyad"
                      className="w-full px-2.5 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#00adb5]"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                      Alıcı / Kiracı Telefonu
                    </label>
                    <input
                      type="text"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="+90 533 ..."
                      className="w-full px-2.5 py-1.5 border border-slate-300 font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                      Depozito / Kapora Tarihi
                    </label>
                    <input
                      type="date"
                      value={depositDate}
                      onChange={(e) => setDepositDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 03 ALICININ ULAŞTIĞI KANAL */}
              <div className="p-3 border border-slate-200 space-y-1.5">
                <label className="font-bold text-[#1d2566] text-xs uppercase font-mono block">
                  03 Alıcının Ulaştığı Kanal
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {LEAD_CHANNELS.map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setLeadChannel(leadChannel === ch ? "" : ch)}
                      className={`px-2.5 py-1 border text-[10.5px] font-mono transition cursor-pointer ${
                        leadChannel === ch
                          ? "bg-[#1d2566] text-white border-[#1d2566] font-bold"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              {/* 04 İŞLEM BİLGİLERİ (FİYAT VE KOMİSYON) */}
              <div className="space-y-2.5 p-3.5 border border-slate-200 bg-slate-50/50">
                <h3 className="font-bold text-[#1d2566] text-xs border-b border-slate-200 pb-1.5 uppercase font-mono flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>04 İşlem Bilgileri & Komisyon</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                      Para Birimi
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 bg-white font-mono font-bold text-xs focus:outline-none"
                    >
                      <option value="GBP">GBP (£)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="TRY">TRY (₺)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                      İlan Fiyatı
                    </label>
                    <input
                      type="number"
                      value={listingPrice}
                      onChange={(e) => setListingPrice(e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 border border-slate-300 bg-white font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                      Kaça Satıldı / Kiralandı *
                    </label>
                    <input
                      type="number"
                      required
                      value={closingPrice}
                      onChange={(e) => handleClosingPriceOrCommChange(e.target.value, "closing")}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 border border-slate-300 bg-white font-mono font-bold text-xs focus:outline-none focus:border-[#00adb5]"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-emerald-800 block mb-1">
                      Anlaşılan Hizmet Bedeli *
                    </label>
                    <input
                      type="number"
                      required
                      value={commissionAmount}
                      onChange={(e) => handleClosingPriceOrCommChange(e.target.value, "comm")}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 border-2 border-emerald-500 bg-emerald-50/50 font-mono font-black text-xs text-emerald-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                      Tahsilat Yöntemi
                    </label>
                    <input
                      type="text"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      placeholder="Nakit / Havale / Çek"
                      className="w-full px-2.5 py-1.5 border border-slate-300 bg-white text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                      Satış / Kiralama Süresi
                    </label>
                    <input
                      type="text"
                      value={dealDuration}
                      onChange={(e) => setDealDuration(e.target.value)}
                      placeholder="Örn: 45 Gün"
                      className="w-full px-2.5 py-1.5 border border-slate-300 bg-white text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 05 PORTFÖY TÜRÜ VE PAYLAŞIM */}
              <div className="space-y-2.5 p-3.5 border border-slate-200">
                <h3 className="font-bold text-[#1d2566] text-xs border-b border-slate-200 pb-1.5 uppercase font-mono flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>05 Portföy Türü ve Paylaşım</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">
                      Portföy Kaynağı
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPortfolioOrigin("advisor");
                          calculateCommissionShares(parseFloat(commissionAmount) || 0, sharingType, "advisor");
                        }}
                        className={`flex-1 py-1.5 text-xs font-mono font-bold border cursor-pointer ${
                          portfolioOrigin === "advisor"
                            ? "bg-[#1d2566] text-white border-[#1d2566]"
                            : "bg-white text-slate-700 border-slate-300"
                        }`}
                      >
                        Kendi Portföyü
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPortfolioOrigin("office");
                          calculateCommissionShares(parseFloat(commissionAmount) || 0, sharingType, "office");
                        }}
                        className={`flex-1 py-1.5 text-xs font-mono font-bold border cursor-pointer ${
                          portfolioOrigin === "office"
                            ? "bg-[#1d2566] text-white border-[#1d2566]"
                            : "bg-white text-slate-700 border-slate-300"
                        }`}
                      >
                        Ofis Portföyü
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">
                      İşlem Paylaşımı
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSharingType("none");
                          calculateCommissionShares(parseFloat(commissionAmount) || 0, "none", portfolioOrigin);
                        }}
                        className={`flex-1 py-1.5 text-xs font-mono font-bold border cursor-pointer ${
                          sharingType === "none"
                            ? "bg-[#1d2566] text-white border-[#1d2566]"
                            : "bg-white text-slate-700 border-slate-300"
                        }`}
                      >
                        Solo (Tek GD)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSharingType("external");
                          calculateCommissionShares(parseFloat(commissionAmount) || 0, "external", portfolioOrigin);
                        }}
                        className={`flex-1 py-1.5 text-xs font-mono font-bold border cursor-pointer ${
                          sharingType === "external"
                            ? "bg-[#1d2566] text-white border-[#1d2566]"
                            : "bg-white text-slate-700 border-slate-300"
                        }`}
                      >
                        Dış Ortak
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSharingType("internal");
                          calculateCommissionShares(parseFloat(commissionAmount) || 0, "internal", portfolioOrigin);
                        }}
                        className={`flex-1 py-1.5 text-xs font-mono font-bold border cursor-pointer ${
                          sharingType === "internal"
                            ? "bg-[#1d2566] text-white border-[#1d2566]"
                            : "bg-white text-slate-700 border-slate-300"
                        }`}
                      >
                        İç Ortak (2. GD)
                      </button>
                    </div>
                  </div>
                </div>

                {sharingType !== "none" && (
                  <div className="grid grid-cols-2 gap-2 pt-1 bg-slate-50 p-2 border border-slate-200">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                        Ortak Danışman / Ofis Adı
                      </label>
                      <input
                        type="text"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        placeholder="Örn: Ahmet Bey (Re/Max)"
                        className="w-full px-2 py-1 border border-slate-300 bg-white text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                        Ortak Telefon / İletişim
                      </label>
                      <input
                        type="text"
                        value={partnerPhone}
                        onChange={(e) => setPartnerPhone(e.target.value)}
                        placeholder="+90 533 ..."
                        className="w-full px-2 py-1 border border-slate-300 bg-white font-mono text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Komisyon Dağılım Tablosu (Manuel Değiştirilebilir) */}
                <div className="pt-1">
                  <div className="text-[10.5px] font-mono font-bold text-slate-600 mb-1">
                    Hesaplanan Komisyon Hak Ediş Dağılımı:
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-2 bg-emerald-50 border border-emerald-200">
                      <div className="text-[10px] text-emerald-800 font-bold">Satış GD Payı</div>
                      <div className="text-xs font-black text-emerald-900 mt-0.5">
                        {advisorShareAmount.toLocaleString("tr-TR")} {currency}
                      </div>
                      <div className="text-[9.5px] text-emerald-700">(%{advisorShareRate})</div>
                    </div>

                    {sharingType !== "none" ? (
                      <div className="p-2 bg-blue-50 border border-blue-200">
                        <div className="text-[10px] text-blue-800 font-bold">Ortak Payı</div>
                        <div className="text-xs font-black text-blue-900 mt-0.5">
                          {partnerShareAmount.toLocaleString("tr-TR")} {currency}
                        </div>
                        <div className="text-[9.5px] text-blue-700">(%{partnerShareRate})</div>
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-50 border border-slate-200 opacity-50">
                        <div className="text-[10px] text-slate-500">Ortak Payı</div>
                        <div className="text-xs font-bold text-slate-400 mt-0.5">Yok (%0)</div>
                      </div>
                    )}

                    <div className="p-2 bg-indigo-50 border border-indigo-200">
                      <div className="text-[10px] text-indigo-800 font-bold">Ofis Payı</div>
                      <div className="text-xs font-black text-indigo-900 mt-0.5">
                        {officeShareAmount.toLocaleString("tr-TR")} {currency}
                      </div>
                      <div className="text-[9.5px] text-indigo-700">(%{officeShareRate})</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Notları */}
              <div>
                <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                  Ek Notlar & Açıklamalar
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Form üzerinde varsa ek notlar..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#00adb5]"
                />
              </div>

              {/* Kaydet Butonları */}
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
                  className="px-5 py-2 bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Geçmiş İşlemi Arşive Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Büyük Fotoğraf Önizleme Modalı */}
      {previewZoom && imageBase64 && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs cursor-pointer"
          onClick={() => setPreviewZoom(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={imageBase64}
              alt="Büyük Önizleme"
              className="max-h-[85vh] w-auto object-contain border border-white/20 shadow-2xl"
            />
            <button
              onClick={() => setPreviewZoom(false)}
              className="absolute top-2 right-2 p-2 bg-white/20 hover:bg-white text-black rounded-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
