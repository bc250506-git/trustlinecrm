"use client";

import React, { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Deal, Currency, DealSharingType } from "@/lib/types";
import { DateInput } from "@/components/common/DateInput";
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
  Layers,
  ListChecks,
  Play,
  Pause,
  Trash2,
  CheckSquare,
  Square,
  ZoomIn,
  Edit3,
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

// Akıllı Danışman Eşleştirici
function findMatchingAdvisor(rawName: string, users: any[]): any | undefined {
  if (!rawName) return undefined;
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]/g, " ")
      .trim();

  const cleanRaw = normalize(rawName);
  const rawWords = cleanRaw.split(/\s+/).filter(Boolean);

  let bestMatch: any = null;
  let highestScore = 0;

  for (const u of users) {
    const cleanUserName = normalize(u.name);
    const userWords = cleanUserName.split(/\s+/).filter(Boolean);

    if (
      cleanUserName === cleanRaw ||
      cleanRaw.includes(cleanUserName) ||
      cleanUserName.includes(cleanRaw)
    ) {
      return u;
    }

    let matchedWordCount = 0;
    for (const uw of userWords) {
      if (rawWords.some((rw) => rw === uw || rw.startsWith(uw) || uw.startsWith(rw))) {
        matchedWordCount++;
      }
    }

    if (userWords.length > 0 && matchedWordCount >= 1) {
      const score = matchedWordCount / userWords.length;
      if (score > highestScore) {
        highestScore = score;
        bestMatch = u;
      }
    }
  }

  return bestMatch;
}

// Tarih Formatlayıcı (Türkiye formatı GG.AA.YYYY veya GG/AA/YYYY -> ISO YYYY-MM-DD)
function toISODate(val?: string): string {
  if (!val) return "";
  const trimmed = val.trim();
  // Zaten YYYY-MM-DD ise doğrudan döndür
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const parts = trimmed.split(/[./-]/);
  if (parts.length === 3) {
    // DD.MM.YYYY veya DD/MM/YYYY (Türkiye/KKTC formatı: parts[0]=Gün, parts[1]=Ay, parts[2]=Yıl)
    if (parts[2].length === 4) {
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    // YYYY.MM.DD
    if (parts[0].length === 4) {
      const year = parts[0];
      const month = parts[1].padStart(2, "0");
      const day = parts[2].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }
  return trimmed;
}

// İstemci Tarafında Akıllı Boyutlandırma ve Sıkıştırma
// 10MB+ telefon fotoğraflarını 1600px JPEG (~250KB) seviyesine indirerek Vercel 4.5MB ve Timeout hatasını kesin olarak önler.
function compressImageForOcr(file: File, maxDimension = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", quality));
          } else {
            resolve(e.target?.result as string);
          }
        } catch {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

// AI'dan Dönen Ham Veriyi Tam Bir Deal Nesnesine Dönüştürme
function parseAiDataToDeal(
  d: any,
  imageBase64: string,
  imageName: string,
  users: any[],
  currentUser: any
): Deal {
  const closingPrice =
    parseFloat(String(d.closingPrice || d.listingPrice || 0).replace(/[^0-9.]/g, "")) || 0;
  const listingPrice =
    parseFloat(String(d.listingPrice || closingPrice).replace(/[^0-9.]/g, "")) || closingPrice;
  const rawComm = parseFloat(String(d.commissionAmount || 0).replace(/[^0-9.]/g, "")) || 0;
  const dealType: "sale" | "rent" =
    String(d.dealType || "").toLowerCase().includes("kira") || String(d.dealType || "") === "rent"
      ? "rent"
      : "sale";
  const commExpected =
    rawComm > 0 ? rawComm : dealType === "sale" ? closingPrice * 0.05 : closingPrice;

  const matchedAdvisor = findMatchingAdvisor(d.advisorName || "", users);
  const finalAdvisorId = matchedAdvisor?.id || currentUser.id;
  const finalAdvisorName = matchedAdvisor?.name || d.advisorName || currentUser.name;

  let sharingType: DealSharingType = "none";
  let partnerAdvisorId: string | undefined = undefined;
  let partnerAdvisorName: string | undefined = undefined;
  let partnerCompany: string | undefined = undefined;
  const partnerPhone = d.partnerPhone || undefined;

  if (d.partnerAdvisorName) {
    const matchedPartner = findMatchingAdvisor(d.partnerAdvisorName, users);
    if (matchedPartner) {
      sharingType = "internal";
      partnerAdvisorId = matchedPartner.id;
      partnerAdvisorName = matchedPartner.name;
    } else {
      sharingType = d.portfolioOrigin === "partner" ? "external" : "internal";
      partnerCompany = d.partnerAdvisorName;
      partnerAdvisorName = d.partnerAdvisorName;
    }
  }

  // Komisyon Dağılım Oranları
  const origin: "advisor" | "office" = d.portfolioOrigin === "office" ? "office" : "advisor";
  let advRate = 100;
  let partRate = 0;
  let offRate = 0;
  let advAmt = commExpected;
  let partAmt = 0;
  let offAmt = 0;

  if (d.advisorAmount && Number(d.advisorAmount) > 0) {
    advAmt = Number(d.advisorAmount);
    advRate = commExpected > 0 ? Math.round((advAmt / commExpected) * 100) : 60;
  }
  if (d.partnerAmount && Number(d.partnerAmount) > 0) {
    partAmt = Number(d.partnerAmount);
    partRate = commExpected > 0 ? Math.round((partAmt / commExpected) * 100) : 25;
  }
  if (d.officeAmount && Number(d.officeAmount) > 0) {
    offAmt = Number(d.officeAmount);
    offRate = commExpected > 0 ? Math.round((offAmt / commExpected) * 100) : 40;
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const closingDateIso = toISODate(d.closingDate) || toISODate(d.reportDate) || todayStr;
  const reportDateIso = toISODate(d.reportDate) || closingDateIso;

  const priceCurrVal: Currency = ["GBP", "TRY", "USD", "EUR"].includes(
    String(d.closingCurrency || d.listingCurrency || "").toUpperCase()
  )
    ? (String(d.closingCurrency || d.listingCurrency).toUpperCase() as Currency)
    : ["GBP", "TRY", "USD", "EUR"].includes(String(d.currency || "").toUpperCase())
    ? (String(d.currency).toUpperCase() as Currency)
    : "GBP";

  const commCurrVal: Currency = ["GBP", "TRY", "USD", "EUR"].includes(
    String(d.commissionCurrency || "").toUpperCase()
  )
    ? (String(d.commissionCurrency).toUpperCase() as Currency)
    : ["GBP", "TRY", "USD", "EUR"].includes(String(d.currency || "").toUpperCase())
    ? (String(d.currency).toUpperCase() as Currency)
    : priceCurrVal;

  return {
    id: `hist-deal-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    title: (d.propertyAddress || "Geçmiş Portföy İşlemi").trim(),
    dealNumber:
      d.portfolioNo?.trim() ||
      `TRL-${new Date(closingDateIso).getFullYear().toString().slice(-2)}-${Math.floor(
        100 + Math.random() * 900
      )}`,
    dealType,
    customerId: `hist-cust-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    customerName: d.buyerName?.trim() || "Geçmiş Müşteri",
    customerPhone: d.buyerPhone?.trim() || "",
    propertyId: `hist-prop-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    propertyTitle: (d.propertyAddress || "Geçmiş Gayrimenkul").trim(),
    address: (d.propertyAddress || "").trim(),
    propertyType: d.propertyType || "Daire",
    area: parseFloat(String(d.landArea)) || undefined,
    landType: d.landType,
    landlordName: d.sellerName?.trim() || "Mülk Sahibi",
    landlordPhone: d.sellerPhone?.trim() || "",
    mandateDate: toISODate(d.mandateDate) || undefined,
    depositDate: toISODate(d.depositDate) || undefined,
    durationText: d.dealDuration?.trim() || undefined,
    leadChannel: d.leadSource || undefined,
    currency: commCurrVal,
    priceCurrency: priceCurrVal,
    commissionCurrency: commCurrVal,
    commissionRate: dealType === "rent" ? 100 : 5,
    stage: "won",
    askingPrice: listingPrice,
    offeredPrice: closingPrice,
    agreedPrice: closingPrice,
    deposit: 0,
    commissionExpected: commExpected,
    commissionReceived: commExpected,
    paymentMethod: d.collectionDateMethod || "Nakit",
    collectionDate: closingDateIso,
    portfolioOrigin: origin,
    sharingType,
    partnerName: partnerAdvisorName || partnerCompany,
    partnerPhone,
    partnerCompany,
    partnerAdvisorId,
    partnerAdvisorName,
    partnerShareRate: partRate,
    partnerShareAmount: partAmt,
    advisorShareRate: advRate,
    advisorShareAmount: advAmt,
    officeShareRate: offRate,
    officeShareAmount: offAmt,
    brokerApproval: true,
    brokerApprovedAt: closingDateIso,
    brokerApprovedBy: "Volkan Affan Kanıgür (Ofis Yönetimi Arşiv)",
    closingDate: closingDateIso,
    reportDate: reportDateIso,
    isHistorical: true,
    archiveDocumentUrl: imageBase64 || undefined,
    archiveDocumentName: imageName || undefined,
    notes: d.notes?.trim() || undefined,
    createdById: finalAdvisorId,
    createdByName: finalAdvisorName,
    createdAt: new Date(closingDateIso).toISOString(),
  };
}

interface BatchDealItem {
  id: string;
  file: File;
  fileName: string;
  imageBase64: string;
  status: "pending" | "scanning" | "done" | "error";
  errorMsg?: string;
  dealData?: Deal;
  selected: boolean;
}

export function AddHistoricalDealModal({
  isOpen,
  onClose,
}: AddHistoricalDealModalProps) {
  const { users, currentUser, isBroker, addDeal } = useStore();

  // Mod Seçimi: Tekli Form Girişi veya Toplu Tarama
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single");

  // === TEKLİ MOD STATELERİ ===
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccessMsg, setScanSuccessMsg] = useState("");
  const [scanErrorMsg, setScanErrorMsg] = useState("");
  const [previewZoom, setPreviewZoom] = useState(false);

  // Form Alanları (%100 Manuel Düzenlenebilir)
  const [advisorName, setAdvisorName] = useState("");
  const [advisorId, setAdvisorId] = useState(currentUser.id);
  const [portfolioNo, setPortfolioNo] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [closingDate, setClosingDate] = useState("");

  const [dealType, setDealType] = useState<"sale" | "rent">("sale");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyType, setPropertyType] = useState("Daire");
  const [landArea, setLandArea] = useState("");
  const [landType, setLandType] = useState<"commercial" | "residential">("residential");

  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [mandateDate, setMandateDate] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [depositDate, setDepositDate] = useState("");
  const [dealDuration, setDealDuration] = useState("");

  const [leadChannel, setLeadChannel] = useState("");
  const [priceCurrency, setPriceCurrency] = useState<Currency>("GBP");
  const [commissionCurrency, setCommissionCurrency] = useState<Currency>("GBP");
  const [currency, setCurrency] = useState<Currency>("GBP");
  const [listingPrice, setListingPrice] = useState<string>("");
  const [closingPrice, setClosingPrice] = useState<string>("");
  const [commissionAmount, setCommissionAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("Nakit");
  const [notes, setNotes] = useState("");

  const [portfolioOrigin, setPortfolioOrigin] = useState<"advisor" | "office">("advisor");
  const [sharingType, setSharingType] = useState<DealSharingType>("none");
  const [partnerAdvisorId, setPartnerAdvisorId] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [advisorShareRate, setAdvisorShareRate] = useState<number>(100);
  const [advisorShareAmount, setAdvisorShareAmount] = useState<number>(0);
  const [partnerShareRate, setPartnerShareRate] = useState<number>(0);
  const [partnerShareAmount, setPartnerShareAmount] = useState<number>(0);
  const [officeShareRate, setOfficeShareRate] = useState<number>(0);
  const [officeShareAmount, setOfficeShareAmount] = useState<number>(0);

  // === TOPLU (BATCH) MOD STATELERİ ===
  const [batchItems, setBatchItems] = useState<BatchDealItem[]>([]);
  const [batchIsRunning, setBatchIsRunning] = useState(false);
  const [batchShouldStop, setBatchShouldStop] = useState(false);
  const [viewingBatchImage, setViewingBatchImage] = useState<string | null>(null);
  const [batchSavedCount, setBatchSavedCount] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split("T")[0];
      if (!reportDate) setReportDate(today);
      if (!closingDate) setClosingDate(today);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // TEKLİ: Tekil Görsel Yükleme
  const handleSingleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImageName(file.name);
    setScanSuccessMsg("");
    setScanErrorMsg("");
    setIsScanning(true);

    try {
      // 1600px ve JPEG kalite optimizasyonu (Hızlı ve hafif transfer)
      const compressedB64 = await compressImageForOcr(file);
      if (!compressedB64) {
        setIsScanning(false);
        setScanErrorMsg("Görsel okunamadı.");
        return;
      }
      setImageBase64(compressedB64);
      await scanImageWithAI(compressedB64, "image/jpeg");
    } catch (err: any) {
      setIsScanning(false);
      setScanErrorMsg(err?.message || "Görsel işlenirken hata oluştu.");
    }
  };

  // TEKLİ: AI ile Tarama
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

      let json: any = {};
      try {
        json = await res.json();
      } catch {
        throw new Error(`Sunucudan yanıt alınamadı (Durum: ${res.status}).`);
      }

      if (!res.ok || !json.success) {
        throw new Error(json.error || `Form okunamadı (${res.status}).`);
      }

      const d = json.data;

      // Alanları yerleştir
      if (d.advisorName) {
        setAdvisorName(d.advisorName);
        const bestMatch = findMatchingAdvisor(d.advisorName, users);
        if (bestMatch) {
          setAdvisorId(bestMatch.id);
          setAdvisorName(bestMatch.name);
        }
      }

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
      // Kurları bağımsız olarak tespit et ve ata
      let parsedPriceCurr: Currency = "GBP";
      if (d.closingCurrency && ["GBP", "TRY", "USD", "EUR"].includes(String(d.closingCurrency).toUpperCase())) {
        parsedPriceCurr = String(d.closingCurrency).toUpperCase() as Currency;
      } else if (d.listingCurrency && ["GBP", "TRY", "USD", "EUR"].includes(String(d.listingCurrency).toUpperCase())) {
        parsedPriceCurr = String(d.listingCurrency).toUpperCase() as Currency;
      } else if (d.currency && ["GBP", "TRY", "USD", "EUR"].includes(String(d.currency).toUpperCase())) {
        parsedPriceCurr = String(d.currency).toUpperCase() as Currency;
      }
      setPriceCurrency(parsedPriceCurr);

      let parsedCommCurr: Currency = parsedPriceCurr;
      if (d.commissionCurrency && ["GBP", "TRY", "USD", "EUR"].includes(String(d.commissionCurrency).toUpperCase())) {
        parsedCommCurr = String(d.commissionCurrency).toUpperCase() as Currency;
      } else if (d.currency && ["GBP", "TRY", "USD", "EUR"].includes(String(d.currency).toUpperCase())) {
        parsedCommCurr = String(d.currency).toUpperCase() as Currency;
      }
      setCommissionCurrency(parsedCommCurr);
      setCurrency(parsedCommCurr);

      if (d.listingPrice) setListingPrice(String(d.listingPrice).replace(/[^0-9.]/g, ""));
      const cleanClosing = d.closingPrice ? String(d.closingPrice).replace(/[^0-9.]/g, "") : "";
      if (cleanClosing) setClosingPrice(cleanClosing);

      const isRent = String(d.dealType || "").toLowerCase().includes("kira") || String(d.dealType || "") === "rent";

      if (d.commissionAmount) {
        const cleanComm = String(d.commissionAmount).replace(/[^0-9.]/g, "");
        setCommissionAmount(cleanComm);
        calculateCommissionShares(parseFloat(cleanComm) || 0, sharingType, portfolioOrigin);
      } else if (cleanClosing) {
        const cNum = parseFloat(cleanClosing) || 0;
        const autoComm = isRent ? cNum : cNum * 0.05;
        setCommissionAmount(String(autoComm));
        calculateCommissionShares(autoComm, sharingType, portfolioOrigin);
      }
      if (d.collectionDateMethod) setPaymentMethod(d.collectionDateMethod);
      if (d.notes) setNotes(d.notes);
      if (d.partnerAdvisorName) {
        setPartnerName(d.partnerAdvisorName);
        const partnerUser = findMatchingAdvisor(d.partnerAdvisorName, users);
        if (partnerUser) {
          setSharingType("internal");
          setPartnerAdvisorId(partnerUser.id);
        } else {
          setSharingType(d.portfolioOrigin === "partner" ? "external" : "internal");
        }
      }
      if (d.partnerPhone) setPartnerPhone(d.partnerPhone);
      if (d.advisorAmount && Number(d.advisorAmount) > 0) {
        setAdvisorShareAmount(Number(d.advisorAmount));
      }
      if (d.partnerAmount && Number(d.partnerAmount) > 0) {
        setPartnerShareAmount(Number(d.partnerAmount));
      }
      if (d.officeAmount && Number(d.officeAmount) > 0) {
        setOfficeShareAmount(Number(d.officeAmount));
      }

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
      const partnerAmt = totalComm * 0.5;
      const remaining = totalComm * 0.5;
      const advRate = origin === "advisor" ? 0.6 : 0.5;
      const advAmount = remaining * advRate;
      const offAmount = remaining * (1 - advRate);

      setPartnerShareRate(50);
      setPartnerShareAmount(partnerAmt);
      setAdvisorShareRate(advRate * 50);
      setAdvisorShareAmount(advAmount);
      setOfficeShareRate((1 - advRate) * 50);
      setOfficeShareAmount(offAmount);
    } else if (shareType === "internal") {
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
      const num = parseFloat(val) || 0;
      if (num > 0 && !commissionAmount) {
        // Kiralıkta %100 (1 aylık kira), satılıkta %5
        const estComm = dealType === "rent" ? num : num * 0.05;
        setCommissionAmount(String(estComm));
        calculateCommissionShares(estComm, sharingType, portfolioOrigin);
      }
    }
  };

  // TEKLİ: Kaydet ve Bitir
  const handleSingleSubmit = (e: React.FormEvent) => {
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
      currency: commissionCurrency,
      priceCurrency: priceCurrency,
      commissionCurrency: commissionCurrency,
      commissionRate: dealType === "rent" ? 100 : 5,
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
      partnerAdvisorId: sharingType === "internal" ? (partnerAdvisorId || undefined) : undefined,
      partnerAdvisorName:
        sharingType === "internal"
          ? (users.find((u) => u.id === partnerAdvisorId)?.name || partnerName.trim() || undefined)
          : undefined,
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

  // === TOPLU (BATCH) FONKSİYONLARI ===

  // Çoklu Dosya Seçimi
  const handleBatchFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems: BatchDealItem[] = files.map((file, idx) => ({
      id: `batch-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      fileName: file.name,
      imageBase64: "",
      status: "pending",
      selected: true,
    }));

    setBatchItems((prev) => [...prev, ...newItems]);
    // Seçim kutusunu sıfırla ki aynı dosyaları tekrar seçebilsin
    e.target.value = "";
  };

  // Sıralı AI Tarama Motoru
  const runBatchScanning = async () => {
    if (batchIsRunning) return;
    setBatchIsRunning(true);
    setBatchShouldStop(false);

    // Listede taranmayı bekleyenleri sırayla al
    for (let i = 0; i < batchItems.length; i++) {
      // Kullanıcı durdurduysa döngüden çık
      if (batchShouldStop) break;

      const item = batchItems[i];
      if (item.status === "done") continue; // Zaten taranmış

      // Durumu 'scanning' yap
      setBatchItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: "scanning", errorMsg: undefined } : it))
      );

      try {
        // 1. Görseli 1600px ve JPEG kalitede sıkıştırılmış Base64'e dönüştür
        const b64 = item.imageBase64 || (await compressImageForOcr(item.file));

        // 2. AI Endpoint'ine gönder (Geçici yoğunluk durumunda 1 kez otomatik tekrar)
        let parsedData: any = null;
        let lastErrorMsg = "";

        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const res = await fetch("/api/parse-deal-form", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageBase64: b64, mimeType: "image/jpeg" }),
            });

            let json: any = {};
            try {
              json = await res.json();
            } catch {
              throw new Error(`Sunucu hatası (${res.status})`);
            }

            if (res.ok && json.success) {
              parsedData = json.data;
              break;
            } else {
              lastErrorMsg = json.error || `Okuma başarısız (${res.status})`;
            }
          } catch (e: any) {
            lastErrorMsg = e?.message || "Bağlantı hatası";
          }

          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 1000));
          }
        }

        if (!parsedData) {
          throw new Error(lastErrorMsg || "Form okunamadı.");
        }

        // 3. Veriyi Deal nesnesine dönüştür
        const deal = parseAiDataToDeal(parsedData, b64, item.fileName, users, currentUser);

        // 4. Durumu güncelle
        setBatchItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: "done",
                  imageBase64: b64,
                  dealData: deal,
                  errorMsg: undefined,
                }
              : it
          )
        );
      } catch (err: any) {
        setBatchItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: "error",
                  errorMsg: err?.message || "Tarama hatası.",
                }
              : it
          )
        );
      }

      // API rate limit aşımını önlemek için 500ms dinlen
      await new Promise((r) => setTimeout(r, 500));
    }

    setBatchIsRunning(false);
  };

  // Tekil Başarısız Batch Öğesini Tekrar Dene
  const retrySingleBatchItem = async (itemId: string) => {
    const item = batchItems.find((it) => it.id === itemId);
    if (!item) return;

    setBatchItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, status: "scanning", errorMsg: undefined } : it))
    );

    try {
      const b64 = item.imageBase64 || (await compressImageForOcr(item.file));
      const res = await fetch("/api/parse-deal-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: b64, mimeType: "image/jpeg" }),
      });

      let json: any = {};
      try {
        json = await res.json();
      } catch {
        throw new Error(`Sunucu hatası (${res.status})`);
      }

      if (!res.ok || !json.success) {
        throw new Error(json.error || `Form okunamadı (${res.status})`);
      }

      const deal = parseAiDataToDeal(json.data, b64, item.fileName, users, currentUser);
      setBatchItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? { ...it, status: "done", imageBase64: b64, dealData: deal, errorMsg: undefined }
            : it
        )
      );
    } catch (err: any) {
      setBatchItems((prev) =>
        prev.map((it) =>
          it.id === itemId ? { ...it, status: "error", errorMsg: err?.message || "Hata." } : it
        )
      );
    }
  };

  // Tekil batch öğesini sil
  const removeBatchItem = (id: string) => {
    setBatchItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Tüm listeyi temizle
  const clearBatchItems = () => {
    if (batchIsRunning) return;
    setBatchItems([]);
    setBatchSavedCount(null);
  };

  // Toplu Kaydetme
  const handleSaveAllBatchDeals = () => {
    const readyItems = batchItems.filter((it) => it.status === "done" && it.dealData && it.selected);
    if (readyItems.length === 0) {
      alert("Kaydedilecek taranmış ve seçili işlem bulunamadı.");
      return;
    }

    let saved = 0;
    for (const item of readyItems) {
      if (item.dealData) {
        addDeal(item.dealData);
        saved++;
      }
    }

    setBatchSavedCount(saved);
    alert(`Tebrikler! ${saved} adet geçmiş fiziki işlem başarıyla sisteme aktarıldı ve finansa işlendi.`);
    onClose();
  };

  // Batch öğesini tekli düzenleme formuna aktar
  const loadBatchItemIntoSingleMode = (item: BatchDealItem) => {
    if (!item.dealData) return;
    const d = item.dealData;

    setImageBase64(d.archiveDocumentUrl || "");
    setImageName(d.archiveDocumentName || item.fileName);
    setAdvisorId(d.createdById || currentUser.id);
    setAdvisorName(d.createdByName || "");
    setPortfolioNo(d.dealNumber || "");
    setClosingDate(d.closingDate || "");
    setReportDate(d.reportDate || d.closingDate || "");
    setDealType(d.dealType || "sale");
    setPropertyAddress(d.address || d.propertyTitle || d.title || "");
    setPropertyType(d.propertyType || "Daire");
    setLandArea(d.area ? String(d.area) : "");
    setSellerName(d.landlordName || "");
    setSellerPhone(d.landlordPhone || "");
    setBuyerName(d.customerName || "");
    setBuyerPhone(d.customerPhone || "");
    setMandateDate(d.mandateDate || "");
    setDepositDate(d.depositDate || "");
    setDealDuration(d.durationText || "");
    setLeadChannel(d.leadChannel || "");
    setPriceCurrency(d.priceCurrency || d.currency || "GBP");
    setCommissionCurrency(d.commissionCurrency || d.currency || "GBP");
    setCurrency(d.currency || "GBP");
    setListingPrice(d.askingPrice ? String(d.askingPrice) : "");
    setClosingPrice(d.agreedPrice ? String(d.agreedPrice) : "");
    setCommissionAmount(d.commissionExpected ? String(d.commissionExpected) : "");
    setPaymentMethod(d.paymentMethod || "Nakit");
    setNotes(d.notes || "");
    setPortfolioOrigin(d.portfolioOrigin || "advisor");
    setSharingType(d.sharingType || "none");
    setPartnerName(d.partnerName || "");
    setPartnerPhone(d.partnerPhone || "");
    setAdvisorShareRate(d.advisorShareRate || 100);
    setAdvisorShareAmount(d.advisorShareAmount || 0);
    setPartnerShareRate(d.partnerShareRate || 0);
    setPartnerShareAmount(d.partnerShareAmount || 0);
    setOfficeShareRate(d.officeShareRate || 0);
    setOfficeShareAmount(d.officeShareAmount || 0);

    setActiveTab("single");
  };

  // İstatistikler
  const totalBatch = batchItems.length;
  const doneBatch = batchItems.filter((i) => i.status === "done").length;
  const errorBatch = batchItems.filter((i) => i.status === "error").length;
  const pendingBatch = batchItems.filter((i) => i.status === "pending" || i.status === "scanning").length;
  const progressPercent = totalBatch > 0 ? Math.round((doneBatch / totalBatch) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-[#1d2566] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/10 flex items-center justify-center font-bold">
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

          {/* Sekme Geçiş Butonları */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 border border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab("single")}
              className={`px-3 py-1 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "single"
                  ? "bg-[#00adb5] text-[#1d2566] shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tekli Form İnceleme</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("batch")}
              className={`px-3 py-1 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "batch"
                  ? "bg-[#00adb5] text-[#1d2566] shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Toplu Arşiv Tarama (50+ Fotoğraf)</span>
              {batchItems.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-purple-600 text-white text-[10px] rounded-full">
                  {batchItems.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SEÇİLEN MOD: 1. TEKLİ İNCELEME MODU */}
        {/* ========================================================================= */}
        {activeTab === "single" && (
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
                    <span className="text-[10px] text-slate-500 font-mono mt-1">
                      JPG, PNG, WebP (Tüm el yazıları, onay kutuları ve kenar notları otomatik okunur)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSingleImageUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="space-y-2">
                    <div className="relative border border-slate-300 bg-slate-900 overflow-hidden flex items-center justify-center group min-h-[220px] max-h-[360px]">
                      <img
                        src={imageBase64}
                        alt="Yüklenen Kağıt Form"
                        className={`object-contain w-full h-full transition-transform duration-200 ${
                          previewZoom ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
                        }`}
                        onClick={() => setPreviewZoom(!previewZoom)}
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewZoom(!previewZoom)}
                        className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 hover:bg-black text-white text-[10px] font-mono flex items-center gap-1 rounded-sm shadow-xs"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{previewZoom ? "Küçült" : "Büyüt"}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono">
                      <span className="truncate max-w-[200px]" title={imageName}>
                        📎 {imageName || "Form Görseli"}
                      </span>
                      <label className="text-[#00adb5] font-bold hover:underline cursor-pointer">
                        Başka Fotoğraf Seç
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSingleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* AI Tarama Durumu */}
                {isScanning && (
                  <div className="p-3 bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-mono flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#00adb5] shrink-0" />
                    <div>
                      <div className="font-bold">Yapay Zeka Formu İnceliyor...</div>
                      <div className="text-[10.5px] text-cyan-700">
                        El yazıları, onay kutuları, rakamlar ve kenar notları okunuyor.
                      </div>
                    </div>
                  </div>
                )}

                {scanSuccessMsg && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-tight">{scanSuccessMsg}</span>
                  </div>
                )}

                {scanErrorMsg && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="leading-tight">{scanErrorMsg}</span>
                  </div>
                )}
              </div>

              {/* Bilgilendirme Kutusu */}
              <div className="p-3.5 bg-white border border-slate-200 text-slate-600 text-xs space-y-2">
                <div className="font-bold text-[#1d2566] flex items-center gap-1.5 text-xs">
                  <HelpCircle className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>Geçmiş İşlem Giriş Mantığı:</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                  <li>Fotoğraf attığınızda veriler sağdaki kutucuklara otomatik işlenir.</li>
                  <li><strong>İstediğiniz kutucuğa tıklayıp elle düzeltebilirsiniz.</strong></li>
                  <li>Kağıdın kenarına düşülmüş el yazısı notlar "Notlar" alanına otomatik aktarılır.</li>
                  <li>Yüklenen form görseli kalıcı dijital arşiv olarak işlemin arkasında saklanır.</li>
                </ul>
              </div>
            </div>

            {/* SAĞ PANEL: Düzenlenebilir Form Alanları (7 Kolon) */}
            <div className="lg:col-span-7 p-4 sm:p-6 overflow-y-auto max-h-[calc(96vh-120px)] bg-white">
              <form onSubmit={handleSingleSubmit} className="space-y-5 text-xs">
                {/* Form Üst Bilgileri */}
                <div className="p-3 bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                      Rapor Tarihi (GG/AA/YYYY)
                    </label>
                    <DateInput
                      value={reportDate}
                      onChange={(val) => setReportDate(val)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                      İşlem / Kapanış Tarihi (GG/AA/YYYY) *
                    </label>
                    <DateInput
                      value={closingDate}
                      onChange={(val) => setClosingDate(val)}
                      required
                      className="w-full"
                    />
                  </div>
                </div>

                {/* 01 GAYRİMENKUL BİLGİLERİ */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-bold text-[#1d2566] text-xs flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#00adb5]" />
                      01 Gayrimenkul Bilgileri
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 text-[11px] font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="dealType"
                          value="sale"
                          checked={dealType === "sale"}
                          onChange={() => setDealType("sale")}
                        />
                        <span>Satılık</span>
                      </label>
                      <label className="flex items-center gap-1 text-[11px] font-bold cursor-pointer text-amber-800">
                        <input
                          type="radio"
                          name="dealType"
                          value="rent"
                          checked={dealType === "rent"}
                          onChange={() => setDealType("rent")}
                        />
                        <span>Kiralık</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                        Gayrimenkul Adresi / Başlık *
                      </label>
                      <input
                        type="text"
                        required
                        value={propertyAddress}
                        onChange={(e) => setPropertyAddress(e.target.value)}
                        placeholder="Örn: Girne Merkez 2+1 Daire veya Tam Adres..."
                        className="w-full px-2.5 py-1.5 border border-slate-300 bg-white text-xs focus:outline-none focus:border-[#00adb5]"
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                        Gayrimenkul Türü
                      </label>
                      <select
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 bg-white text-xs focus:outline-none focus:border-[#00adb5]"
                      >
                        {PROPERTY_TYPES.map((pt) => (
                          <option key={pt} value={pt}>
                            {pt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {propertyType === "Arsa" && (
                    <div className="grid grid-cols-2 gap-3 p-2 bg-slate-50 border border-slate-200">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">
                          Arazi m²
                        </label>
                        <input
                          type="text"
                          value={landArea}
                          onChange={(e) => setLandArea(e.target.value)}
                          placeholder="Örn: 500"
                          className="w-full px-2 py-1 border border-slate-300 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">
                          Arsa Türü
                        </label>
                        <select
                          value={landType}
                          onChange={(e) => setLandType(e.target.value as any)}
                          className="w-full px-2 py-1 border border-slate-300 bg-white text-xs"
                        >
                          <option value="residential">Villalık / Konut</option>
                          <option value="commercial">Ticari</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 02 TARAFLAR VE TARİHLER */}
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-1.5 font-bold text-[#1d2566] text-xs flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#00adb5]" />
                    02 Taraflar ve İşlem Tarihleri
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Mülk Sahibi */}
                    <div className="p-2.5 bg-slate-50/70 border border-slate-200 space-y-2">
                      <div className="text-[11px] font-bold text-slate-800">Mülk Sahibi</div>
                      <div>
                        <input
                          type="text"
                          value={sellerName}
                          onChange={(e) => setSellerName(e.target.value)}
                          placeholder="Ad Soyad"
                          className="w-full px-2 py-1 border border-slate-300 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={sellerPhone}
                          onChange={(e) => setSellerPhone(e.target.value)}
                          placeholder="Telefon (0533...)"
                          className="w-full px-2 py-1 border border-slate-300 bg-white text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Alıcı / Kiracı */}
                    <div className="p-2.5 bg-slate-50/70 border border-slate-200 space-y-2">
                      <div className="text-[11px] font-bold text-slate-800">
                        {dealType === "rent" ? "Kiracı" : "Alıcı Müşteri"}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          placeholder="Ad Soyad"
                          className="w-full px-2 py-1 border border-slate-300 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={buyerPhone}
                          onChange={(e) => setBuyerPhone(e.target.value)}
                          placeholder="Telefon (0548...)"
                          className="w-full px-2 py-1 border border-slate-300 bg-white text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Formdaki İşlem Tarihleri */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-2.5 bg-slate-50 border border-slate-200">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">
                        Yetki Belgesi Alınan Tarih
                      </label>
                      <DateInput
                        value={mandateDate}
                        onChange={(val) => setMandateDate(val)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">
                        Depozito Tarihi
                      </label>
                      <DateInput
                        value={depositDate}
                        onChange={(val) => setDepositDate(val)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">
                        Satış / Kiralama Süresi
                      </label>
                      <input
                        type="text"
                        value={dealDuration}
                        onChange={(e) => setDealDuration(e.target.value)}
                        placeholder="Örn: 2 gün veya 1 ay"
                        className="w-full px-2.5 py-1.5 border border-slate-300 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 03 & 04 İŞLEM VE FİNANS BİLGİLERİ */}
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-1.5 font-bold text-[#1d2566] text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#00adb5]" />
                      03 & 04 İşlem Bilgileri & Hizmet Bedeli
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Fiyat ile komisyon farklı kurlarda olabilir (örn: Kira 700 GBP, Alınan Komisyon 43.000 TL)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Fiyat Grubu */}
                    <div className="p-2.5 bg-white border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-800">
                          {dealType === "rent" ? "Kiralama Fiyatı" : "Satış Fiyatı"}
                        </label>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500 font-medium">Fiyat Kuru:</span>
                          <select
                            value={priceCurrency}
                            onChange={(e) => setPriceCurrency(e.target.value as Currency)}
                            className="px-1.5 py-0.5 border border-slate-300 bg-white font-mono font-bold text-[11px]"
                          >
                            <option value="GBP">GBP (£)</option>
                            <option value="TRY">TRY (₺)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="USD">USD ($)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-600 block mb-0.5">İlan Fiyatı</label>
                          <input
                            type="number"
                            value={listingPrice}
                            onChange={(e) => setListingPrice(e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-1 border border-slate-300 bg-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#1d2566] block mb-0.5">
                            {dealType === "rent" ? "Kaça Kiralandı *" : "Kaça Satıldı *"}
                          </label>
                          <input
                            type="number"
                            required
                            value={closingPrice}
                            onChange={(e) => handleClosingPriceOrCommChange(e.target.value, "closing")}
                            placeholder="0"
                            className="w-full px-2 py-1 border border-slate-300 bg-white font-mono font-bold text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Komisyon Grubu */}
                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-emerald-950">
                          Alınan Hizmet Bedeli (Komisyon) *
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const cNum = parseFloat(closingPrice) || 0;
                              const est = dealType === "rent" ? cNum : cNum * 0.05;
                              setCommissionAmount(String(est));
                              setCommissionCurrency(priceCurrency);
                              setCurrency(priceCurrency);
                              calculateCommissionShares(est, sharingType, portfolioOrigin);
                            }}
                            className="text-[9.5px] px-1.5 py-0.5 bg-emerald-200 hover:bg-emerald-300 text-emerald-900 rounded font-semibold cursor-pointer"
                            title="Fiyat üzerinden hesapla"
                          >
                            {dealType === "rent" ? "%100 Hesapla" : "%5 Hesapla"}
                          </button>
                          <select
                            value={commissionCurrency}
                            onChange={(e) => {
                              setCommissionCurrency(e.target.value as Currency);
                              setCurrency(e.target.value as Currency);
                            }}
                            className="px-1.5 py-0.5 border border-emerald-300 bg-white font-mono font-bold text-[11px] text-emerald-900"
                          >
                            <option value="TRY">TRY (₺)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="USD">USD ($)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <input
                          type="number"
                          required
                          value={commissionAmount}
                          onChange={(e) => handleClosingPriceOrCommChange(e.target.value, "comm")}
                          placeholder="Örn: 43000 veya 700"
                          className="w-full px-2.5 py-1.5 border border-emerald-400 bg-white font-mono font-bold text-xs text-emerald-950 focus:outline-none focus:border-emerald-600"
                        />
                        <span className="text-[9.5px] text-emerald-700 block mt-0.5">
                          Formdaki "Alınan Hizmet Bedeli" kutusundaki tutar ve kur buraya işlenir.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                        Müşterinin Ulaştığı Kanal
                      </label>
                      <select
                        value={leadChannel}
                        onChange={(e) => setLeadChannel(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 bg-white text-xs focus:outline-none focus:border-[#00adb5]"
                      >
                        <option value="">Seçiniz...</option>
                        {LEAD_CHANNELS.map((ch) => (
                          <option key={ch} value={ch}>
                            {ch}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                        Tahsilat Yöntemi
                      </label>
                      <input
                        type="text"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        placeholder="Nakit, Havale, Elden..."
                        className="w-full px-2.5 py-1.5 border border-slate-300 bg-white text-xs focus:outline-none focus:border-[#00adb5]"
                      />
                    </div>
                  </div>
                </div>

                {/* 05 PORTFÖY TÜRÜ VE HAKEDİŞ PAYLAŞIMI */}
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-1.5 font-bold text-[#1d2566] text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#00adb5]" />
                      05 Portföy Türü & Hakediş Paylaşımı
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Otomatik hesaplanır, elle değiştirilebilir
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                        Portföy Menşei
                      </label>
                      <select
                        value={portfolioOrigin}
                        onChange={(e) => {
                          const o = e.target.value as "advisor" | "office";
                          setPortfolioOrigin(o);
                          calculateCommissionShares(parseFloat(commissionAmount) || 0, sharingType, o);
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-300 bg-white font-semibold text-xs focus:outline-none focus:border-[#00adb5]"
                      >
                        <option value="advisor">Danışmanın Kendi Portföyü</option>
                        <option value="office">Ofis Portföyü</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                        Paylaşım Türü
                      </label>
                      <select
                        value={sharingType}
                        onChange={(e) => {
                          const st = e.target.value as DealSharingType;
                          setSharingType(st);
                          calculateCommissionShares(parseFloat(commissionAmount) || 0, st, portfolioOrigin);
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-300 bg-white font-semibold text-xs focus:outline-none focus:border-[#00adb5]"
                      >
                        <option value="none">Tek Danışman (Paylaşım Yok)</option>
                        <option value="internal">İç Paylaşım (Ofis İçi 2. Danışman %25)</option>
                        <option value="external">Dış Paylaşım (Dış Ortak / Acente %50)</option>
                      </select>
                    </div>
                  </div>

                  {sharingType !== "none" && (
                    <div className="p-2.5 bg-purple-50/70 border border-purple-200 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-purple-900 block mb-1">
                          {sharingType === "internal" ? "2. Danışman (Müşteri GD)" : "Dış Ortak / Şirket Adı"}
                        </label>
                        {sharingType === "internal" ? (
                          <select
                            value={partnerAdvisorId}
                            onChange={(e) => {
                              setPartnerAdvisorId(e.target.value);
                              const u = users.find((user) => user.id === e.target.value);
                              if (u) setPartnerName(u.name);
                            }}
                            className="w-full px-2 py-1 border border-purple-300 bg-white text-xs font-bold"
                          >
                            <option value="">Seçiniz...</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={partnerName}
                            onChange={(e) => setPartnerName(e.target.value)}
                            placeholder="Ortak Danışman / Ofis..."
                            className="w-full px-2 py-1 border border-purple-300 bg-white text-xs"
                          />
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-purple-900 block mb-1">
                          Ortak Telefon / İletişim
                        </label>
                        <input
                          type="text"
                          value={partnerPhone}
                          onChange={(e) => setPartnerPhone(e.target.value)}
                          placeholder="Telefon..."
                          className="w-full px-2 py-1 border border-purple-300 bg-white text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Dağılım Özeti Kartları */}
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-2 bg-emerald-50 border border-emerald-200">
                      <div className="text-[10px] font-bold text-emerald-800">
                        GD1 ({users.find((u) => u.id === advisorId)?.name?.split(" ")[0] || "Siz"})
                      </div>
                      <div className="font-bold text-xs text-emerald-950 mt-0.5">
                        {advisorShareAmount.toLocaleString("tr-TR")} {commissionCurrency}
                      </div>
                      <div className="text-[9.5px] text-emerald-700 font-normal">%{advisorShareRate}</div>
                    </div>

                    <div className="p-2 bg-slate-100 border border-slate-300">
                      <div className="text-[10px] font-bold text-slate-800">Ofis Payı</div>
                      <div className="font-bold text-xs text-slate-900 mt-0.5">
                        {officeShareAmount.toLocaleString("tr-TR")} {commissionCurrency}
                      </div>
                      <div className="text-[9.5px] text-slate-600 font-normal">%{officeShareRate}</div>
                    </div>

                    <div className="p-2 bg-purple-50 border border-purple-200">
                      <div className="text-[10px] font-bold text-purple-800">
                        {sharingType === "internal" ? "GD2 Payı" : "Ortak Payı"}
                      </div>
                      <div className="font-bold text-xs text-purple-950 mt-0.5">
                        {partnerShareAmount.toLocaleString("tr-TR")} {commissionCurrency}
                      </div>
                      <div className="text-[9.5px] text-purple-700 font-normal">%{partnerShareRate}</div>
                    </div>
                  </div>
                </div>

                {/* NOTLAR (Kenar Notları Dahil) */}
                <div>
                  <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                    Notlar & Kağıt Üzerindeki El Yazısı Açıklamalar
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Form üzerindeki notlar veya sayfanın kenarına iliştirilmiş el yazısı eklemeler..."
                    className="w-full px-2.5 py-1.5 border border-slate-300 bg-white text-xs focus:outline-none focus:border-[#00adb5]"
                  />
                </div>

                {/* Alt Aksiyon Butonları */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Vazgeç
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Arşiv İşlemini Kaydet (Finansa Ekle)</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SEÇİLEN MOD: 2. TOPLU (BATCH) ARŞİV TARAMA MODU */}
        {/* ========================================================================= */}
        {activeTab === "batch" && (
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50 p-4 sm:p-6 space-y-4">
            {/* Üst Yükleme & Kontrol Şeridi */}
            <div className="bg-white border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-[#1d2566] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#00adb5]" />
                    <span>Toplu Kağıt Form Arşivleme (50+ Fotoğraf Sıralı AI)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Tüm geçmiş işlem fotoğraflarını tek seferde seçin; sistem aşırı yükleme (rate-limit) yapmadan sırayla okuyacaktır.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3.5 py-1.5 bg-[#1d2566] hover:bg-[#151a48] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition">
                    <UploadCloud className="w-4 h-4 text-[#00adb5]" />
                    <span>Fotoğrafları Seç (Çoklu)</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleBatchFilesSelect}
                      className="hidden"
                    />
                  </label>

                  {batchItems.length > 0 && (
                    <>
                      {!batchIsRunning ? (
                        <button
                          type="button"
                          onClick={runBatchScanning}
                          disabled={pendingBatch === 0}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{doneBatch > 0 ? "Kalanları Tara" : "Taramayı Başlat"}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setBatchShouldStop(true)}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                        >
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Durdur</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={clearBatchItems}
                        disabled={batchIsRunning}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                        title="Listeyi Temizle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* İlerleme Çubuğu */}
              {totalBatch > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
                    <span className="flex items-center gap-2">
                      <span className="font-bold text-[#1d2566]">Toplam: {totalBatch} Evrak</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">Tamamlanan: {doneBatch}</span>
                      {errorBatch > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-red-600 font-semibold">Hatalı: {errorBatch}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="text-slate-500">Sırada: {pendingBatch}</span>
                    </span>
                    <span className="font-bold text-[#00adb5]">%{progressPercent}</span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 border border-slate-200 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#00adb5] to-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Kuyruk ve Sonuç Listesi */}
            <div className="flex-1 bg-white border border-slate-200 overflow-y-auto shadow-2xs">
              {batchItems.length === 0 ? (
                <div className="py-16 text-center text-slate-500 font-mono text-xs space-y-3">
                  <UploadCloud className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="font-bold text-slate-700">Toplu Taranacak Fotoğraf Eklenmedi</div>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                    Yukarıdaki "Fotoğrafları Seç (Çoklu)" butonuna basarak telefonunuzdan veya bilgisayarınızdan onlarca işlem formunu tek seferde yükleyebilirsiniz.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={batchItems.every((i) => i.selected)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setBatchItems((prev) => prev.map((i) => ({ ...i, selected: checked })));
                          }}
                        />
                      </th>
                      <th className="py-2.5 px-3 w-16">Fotoğraf</th>
                      <th className="py-2.5 px-3">Dosya Adı & Durum</th>
                      <th className="py-2.5 px-3">Danışman</th>
                      <th className="py-2.5 px-3">Gayrimenkul / Adres</th>
                      <th className="py-2.5 px-3">Alıcı / Müşteri</th>
                      <th className="py-2.5 px-3 font-mono">Tarih</th>
                      <th className="py-2.5 px-3 font-mono">Komisyon</th>
                      <th className="py-2.5 px-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {batchItems.map((item, idx) => {
                      const d = item.dealData;
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition ${
                            item.status === "scanning" ? "bg-cyan-50/50" : ""
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              disabled={item.status !== "done"}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setBatchItems((prev) =>
                                  prev.map((it) => (it.id === item.id ? { ...it, selected: checked } : it))
                                );
                              }}
                            />
                          </td>

                          <td className="py-2.5 px-3">
                            {item.imageBase64 ? (
                              <button
                                type="button"
                                onClick={() => setViewingBatchImage(item.imageBase64)}
                                className="w-10 h-10 border border-slate-300 bg-slate-100 flex items-center justify-center overflow-hidden hover:opacity-80 transition cursor-pointer"
                                title="Büyütmek için tıklayın"
                              >
                                <img
                                  src={item.imageBase64}
                                  alt="Form"
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ) : (
                              <div className="w-10 h-10 border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800 text-xs truncate max-w-[140px]" title={item.fileName}>
                              {idx + 1}. {item.fileName}
                            </div>
                            <div className="mt-0.5">
                              {item.status === "pending" && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                                  <Clock className="w-3 h-3" /> Sırada
                                </span>
                              )}
                              {item.status === "scanning" && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-[#00adb5] font-bold">
                                  <Loader2 className="w-3 h-3 animate-spin" /> AI Taranıyor...
                                </span>
                              )}
                              {item.status === "done" && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tamamlandı
                                </span>
                              )}
                              {item.status === "error" && (
                                <div className="space-y-0.5">
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] text-red-600 font-bold"
                                    title={item.errorMsg}
                                  >
                                    <AlertCircle className="w-3 h-3" /> Hata
                                  </span>
                                  {item.errorMsg && (
                                    <div
                                      className="text-[9.5px] text-red-500 font-mono truncate max-w-[130px]"
                                      title={item.errorMsg}
                                    >
                                      {item.errorMsg}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            {d ? (
                              <span className="font-bold text-[#1d2566] text-xs">
                                {d.createdByName || "—"}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            {d ? (
                              <div>
                                <div className="font-bold text-slate-800 text-xs truncate max-w-[180px]" title={d.propertyTitle}>
                                  {d.propertyTitle}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {d.dealType === "rent" ? "Kiralık" : "Satılık"} • {d.propertyType || "Daire"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            {d ? (
                              <div>
                                <div className="font-semibold text-slate-700 text-xs">
                                  {d.customerName || "—"}
                                </div>
                                {d.landlordName && (
                                  <div className="text-[10px] text-slate-400">
                                    Mal Sahibi: {d.landlordName}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                            {d?.closingDate || "—"}
                          </td>

                          <td className="py-2.5 px-3">
                            {d ? (
                              <div>
                                <span className="font-bold text-emerald-700 text-xs">
                                  {d.commissionExpected.toLocaleString("tr-TR")} {d.commissionCurrency || d.currency}
                                </span>
                                <div className="text-[10px] text-slate-400">
                                  Bedel: {d.agreedPrice.toLocaleString("tr-TR")} {d.priceCurrency || d.currency}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {item.status === "error" && (
                                <button
                                  type="button"
                                  onClick={() => retrySingleBatchItem(item.id)}
                                  className="px-2 py-1 text-[10.5px] font-bold text-amber-700 hover:bg-amber-50 border border-amber-200 transition flex items-center gap-1 cursor-pointer"
                                  title="Bu formu tekrar dene"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Tekrar Dene</span>
                                </button>
                              )}
                              {item.status === "done" && (
                                <button
                                  type="button"
                                  onClick={() => loadBatchItemIntoSingleMode(item)}
                                  className="px-2 py-1 text-[10.5px] font-bold text-[#00adb5] hover:bg-cyan-50 border border-cyan-200 transition flex items-center gap-1 cursor-pointer"
                                  title="Tekli Düzenleme Modunda Aç"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Düzenle</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeBatchItem(item.id)}
                                disabled={item.status === "scanning"}
                                className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                                title="Listeden Çıkar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Alt Toplu Kaydetme Çubuğu */}
            {batchItems.length > 0 && (
              <div className="bg-white border border-slate-200 p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs font-mono text-slate-600">
                  <span className="font-bold text-[#1d2566]">
                    {batchItems.filter((i) => i.status === "done" && i.selected).length} adet taranmış işlem seçili.
                  </span>
                  <span className="text-slate-400 ml-2">
                    Toplam Komisyon:{" "}
                    {batchItems
                      .filter((i) => i.status === "done" && i.selected && i.dealData)
                      .reduce((sum, i) => sum + (i.dealData?.commissionExpected || 0), 0)
                      .toLocaleString("tr-TR")}{" "}
                    GBP
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Kapat
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAllBatchDeals}
                    disabled={batchItems.filter((i) => i.status === "done" && i.selected).length === 0}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>
                      Tüm Seçilenleri Sisteme Kaydet (
                      {batchItems.filter((i) => i.status === "done" && i.selected).length} İşlem)
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* FOTOĞRAF ÖNİZLEME LIGHTBOX (Büyütülmüş Görsel) */}
        {/* ========================================================================= */}
        {viewingBatchImage && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
              <div className="p-3 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
                <span className="text-xs font-mono font-bold">Orijinal Kağıt Form Önizleme</span>
                <button
                  type="button"
                  onClick={() => setViewingBatchImage(null)}
                  className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-2 overflow-auto flex items-center justify-center bg-slate-950 flex-1 min-h-[300px]">
                <img
                  src={viewingBatchImage}
                  alt="Form"
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
