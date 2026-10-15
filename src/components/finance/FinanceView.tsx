"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useStore } from "@/lib/store";
import { Deal, Currency, DealSharingType } from "@/lib/types";
import { ActionMenu } from "@/components/common/ActionMenu";
import { DeleteConfirmModal } from "@/components/common/DeleteConfirmModal";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { AddDealModal } from "@/components/modals/AddDealModal";
import { BoxedDateNavigator } from "@/components/common/BoxedDateNavigator";
import {
  Calculator,
  Plus,
  Coins,
  TrendingUp,
  Percent,
  CheckCircle2,
  X,
  Building,
  Edit3,
  Users,
  Search,
  Filter,
  Calendar,
  RotateCcw,
  PieChart,
  Handshake,
  ShieldCheck,
} from "lucide-react";

// Ay listesi şablonu (Geçmiş ve Cari Yıl)
const MONTH_OPTIONS = [
  { key: "2025-10", label: "Ekim 2025", short: "Eki 25" },
  { key: "2025-11", label: "Kasım 2025", short: "Kas 25" },
  { key: "2025-12", label: "Aralık 2025", short: "Ara 25" },
  { key: "2026-01", label: "Ocak 2026", short: "Oca 26" },
  { key: "2026-02", label: "Şubat 2026", short: "Şub 26" },
  { key: "2026-03", label: "Mart 2026", short: "Mar 26" },
  { key: "2026-04", label: "Nisan 2026", short: "Nis 26" },
  { key: "2026-05", label: "Mayıs 2026", short: "May 26" },
  { key: "2026-06", label: "Haziran 2026", short: "Haz 26" },
  { key: "2026-07", label: "Temmuz 2026", short: "Tem 26" },
  { key: "2026-08", label: "Ağustos 2026", short: "Ağu 26" },
  { key: "2026-09", label: "Eylül 2026", short: "Eyl 26" },
  { key: "2026-10", label: "Ekim 2026", short: "Eki 26" },
  { key: "2026-11", label: "Kasım 2026", short: "Kas 26" },
  { key: "2026-12", label: "Aralık 2026", short: "Ara 26" },
];

export function FinanceView() {
  const {
    deals,
    isBroker,
    updateDeal,
    deleteDeal,
    canManageDeal,
    customers,
    properties,
    users,
    currentUser,
  } = useStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [financeTab, setFinanceTab] = useState<"matrix" | "analytics">("matrix");

  // Silme Onay Modalı State
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);

  // Düzenleme Modalı State
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDealType, setEditDealType] = useState<"sale" | "rent">("sale");
  const [editCustomerId, setEditCustomerId] = useState("");
  const [editPropertyId, setEditPropertyId] = useState("");
  const [editCurrency, setEditCurrency] = useState<Currency>("GBP");
  const [editAgreedPrice, setEditAgreedPrice] = useState("");
  const [editCommissionRate, setEditCommissionRate] = useState<number>(5);
  const [editOrigin, setEditOrigin] = useState<"advisor" | "office">("advisor");
  const [editSharingType, setEditSharingType] = useState<DealSharingType>("none");
  const [editPartnerCompany, setEditPartnerCompany] = useState("");
  const [editPartnerName, setEditPartnerName] = useState("");
  const [editPartnerPhone, setEditPartnerPhone] = useState("");
  const [editPartnerAdvisorId, setEditPartnerAdvisorId] = useState("");
  const [editStage, setEditStage] = useState<"offer" | "won" | "lost">("offer");
  const [editPaymentDue, setEditPaymentDue] = useState("");
  const [editAdvisorId, setEditAdvisorId] = useState<string>(currentUser.id);
  const [editBrokerApproval, setEditBrokerApproval] = useState(false);

  // === FİLTRELEME STATELERİ ===
  const [searchQuery, setSearchQuery] = useState("");
  const [originFilter, setOriginFilter] = useState<string>("ALL"); // ALL | advisor | office
  const [periodFilter, setPeriodFilter] = useState<"ALL" | "1M" | "3M" | "6M" | "12M" | "MONTH">("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>(""); // YYYY-MM

  // Danışman hesabı ise sadece kendi işlemlerini görür; Ofis / Broker hesabı ise tüm ofisin işlemlerini görür.
  const visibleDeals = useMemo(() => {
    return isBroker ? deals : deals.filter((d) => d.createdById === currentUser.id);
  }, [deals, isBroker, currentUser.id]);

  // Yardımcı: İşlemin tarihini alma
  const getDealDate = useCallback((d: Deal): Date => {
    const raw = d.closingDate || d.paymentDue || d.createdAt;
    return new Date(raw);
  }, []);

  const getDealMonthKey = useCallback((d: Deal): string => {
    const dt = getDealDate(d);
    if (isNaN(dt.getTime())) return "";
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, [getDealDate]);

  // Her ay için o ayki işlem adetleri
  const monthCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    visibleDeals.forEach((d) => {
      const key = getDealMonthKey(d);
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [visibleDeals, getDealMonthKey]);

  // Cari Ay Anahtarı (YYYY-MM)
  const currentMonthKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  // Ay Değiştirme Fonksiyonları (Sağlı Sollu Ok)
  const handlePrevMonth = () => {
    const baseKey = selectedMonth || currentMonthKey;
    const [y, m] = baseKey.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(prevKey);
    setPeriodFilter("MONTH");
  };

  const handleNextMonth = () => {
    const baseKey = selectedMonth || currentMonthKey;
    const [y, m] = baseKey.split("-").map(Number);
    const nextDate = new Date(y, m, 1);
    const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(nextKey);
    setPeriodFilter("MONTH");
  };

  const handleGoThisMonth = () => {
    setSelectedMonth(currentMonthKey);
    setPeriodFilter("MONTH");
  };

  const handleClearMonth = () => {
    setSelectedMonth("");
    setPeriodFilter("ALL");
  };

  // Ay Gösterim Metni
  const monthDisplayText = useMemo(() => {
    if (!selectedMonth) return "TÜM AYLAR";
    try {
      const [y, m] = selectedMonth.split("-").map(Number);
      const d = new Date(y, m - 1, 1);
      return d.toLocaleDateString("tr-TR", {
        month: "long",
        year: "numeric",
      }).toLocaleUpperCase("tr-TR");
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth]);

  // Filtreleri uygulama
  const filteredDeals = useMemo(() => {
    const now = new Date();

    return visibleDeals.filter((d) => {
      // 1. Portföy Menşei Filtresi
      if (originFilter !== "ALL" && d.portfolioOrigin !== originFilter) {
        return false;
      }

      // 2. Arama Filtresi (Başlık, Mülk, Müşteri, Danışman)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = d.title.toLowerCase().includes(q);
        const propMatch = d.propertyTitle?.toLowerCase().includes(q) || false;
        const custMatch = d.customerName?.toLowerCase().includes(q) || false;
        const advisorMatch = d.createdByName?.toLowerCase().includes(q) || false;
        if (!titleMatch && !propMatch && !custMatch && !advisorMatch) {
          return false;
        }
      }

      // 3. Tarih Filtreleme
      const dt = getDealDate(d);
      if (isNaN(dt.getTime())) return true;

      if (periodFilter === "MONTH" && selectedMonth) {
        const key = getDealMonthKey(d);
        if (key !== selectedMonth) return false;
      } else if (periodFilter === "1M") {
        if (dt.getFullYear() !== now.getFullYear() || dt.getMonth() !== now.getMonth()) {
          return false;
        }
      } else if (periodFilter === "3M") {
        const diffMs = now.getTime() - dt.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays > 93 || diffDays < -30) return false;
      } else if (periodFilter === "6M") {
        const diffMs = now.getTime() - dt.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays > 185 || diffDays < -30) return false;
      } else if (periodFilter === "12M") {
        const diffMs = now.getTime() - dt.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays > 366 || diffDays < -30) return false;
      }

      return true;
    });
  }, [visibleDeals, originFilter, searchQuery, periodFilter, selectedMonth, getDealDate, getDealMonthKey]);

  // Filtrelenmiş Finans Özeti (GBP Ağırlıklı Göstergeler)
  const gbpFilteredDeals = filteredDeals.filter((d) => d.currency === "GBP");
  const totalAgreedGbp = gbpFilteredDeals.reduce((sum, d) => sum + d.agreedPrice, 0);
  const totalCommissionGbp = gbpFilteredDeals.reduce((sum, d) => sum + d.commissionExpected, 0);
  const totalAdvisorGbp = gbpFilteredDeals.reduce((sum, d) => {
    if (d.advisorShareAmount !== undefined) return sum + d.advisorShareAmount;
    const isVolkan = d.createdById === "usr-volkan";
    const rate = isVolkan ? 1.0 : d.portfolioOrigin === "advisor" ? 0.6 : 0.5;
    return sum + Math.round(d.commissionExpected * rate);
  }, 0);
  const totalOfficeGbp = gbpFilteredDeals.reduce((sum, d) => {
    if (d.officeShareAmount !== undefined) return sum + d.officeShareAmount;
    const isVolkan = d.createdById === "usr-volkan";
    const rate = isVolkan ? 0.0 : d.portfolioOrigin === "advisor" ? 0.4 : 0.5;
    return sum + Math.round(d.commissionExpected * rate);
  }, 0);
  const totalPartnerGbp = gbpFilteredDeals.reduce((sum, d) => {
    return sum + (d.partnerShareAmount || 0);
  }, 0);

  // Filtreleri sıfırlama
  const handleResetFilters = () => {
    setSearchQuery("");
    setOriginFilter("ALL");
    setPeriodFilter("ALL");
    setSelectedMonth("");
  };

  const hasActiveFilter =
    searchQuery.trim() !== "" ||
    originFilter !== "ALL" ||
    periodFilter !== "ALL" ||
    selectedMonth !== "";

  // Düzenleme Handlers
  const handleOpenEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setEditTitle(deal.title);
    setEditDealType(deal.dealType || "sale");
    setEditCustomerId(deal.customerId);
    setEditPropertyId(deal.propertyId);
    setEditCurrency(deal.currency);
    setEditAgreedPrice(deal.agreedPrice.toString());
    const rate =
      deal.agreedPrice > 0
        ? Math.round((deal.commissionExpected / deal.agreedPrice) * 100)
        : 5;
    setEditCommissionRate([1, 2, 3, 4, 5, 10, 15, 100].includes(rate) ? rate : 5);
    setEditOrigin(deal.portfolioOrigin || "advisor");
    setEditSharingType(deal.sharingType || "none");
    setEditPartnerCompany(deal.partnerCompany || "");
    setEditPartnerName(deal.partnerName || "");
    setEditPartnerPhone(deal.partnerPhone || "");
    setEditPartnerAdvisorId(deal.partnerAdvisorId || "");
    setEditStage(deal.stage);
    setEditPaymentDue(
      deal.closingDate || deal.paymentDue || (deal.createdAt ? deal.createdAt.split("T")[0] : "")
    );
    setEditAdvisorId(deal.createdById || currentUser.id);
    setEditBrokerApproval(!!deal.brokerApproval);
  };

  const editAgreedNum = Number(editAgreedPrice) || 0;
  const editCalculatedCommission =
    editCommissionRate === 100
      ? editAgreedNum
      : Math.round((editAgreedNum * editCommissionRate) / 100);

  // Paylaşım ve menşee göre oranlar
  let editAdvisorRate = 0.6;
  let editOfficeRate = 0.4;
  let editPartnerRate = 0;

  if (editSharingType === "external") {
    editPartnerRate = 0.5;
    if (editOrigin === "advisor") {
      editAdvisorRate = 0.3;
      editOfficeRate = 0.2;
    } else {
      editAdvisorRate = 0.25;
      editOfficeRate = 0.25;
    }
  } else if (editSharingType === "internal") {
    editPartnerRate = 0.25;
    if (editOrigin === "advisor") {
      editAdvisorRate = 0.3;
      editOfficeRate = 0.45;
    } else {
      editAdvisorRate = 0.25;
      editOfficeRate = 0.5;
    }
  } else {
    // none (tek danışman)
    if (editOrigin === "advisor") {
      editAdvisorRate = 0.6;
      editOfficeRate = 0.4;
    } else {
      editAdvisorRate = 0.5;
      editOfficeRate = 0.5;
    }
  }

  const editCalculatedAdvisorShare = Math.round(editCalculatedCommission * editAdvisorRate);
  const editCalculatedOfficeShare = Math.round(editCalculatedCommission * editOfficeRate);
  const editCalculatedPartnerShare = Math.round(editCalculatedCommission * editPartnerRate);

  const handleSaveEditDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal) return;
    const agreedNumVal = Number(editAgreedPrice) || 0;
    const calcComm =
      editCommissionRate === 100
        ? agreedNumVal
        : Math.round((agreedNumVal * editCommissionRate) / 100);
    const cust = customers.find((c) => c.id === editCustomerId);
    const prop = properties.find((p) => p.id === editPropertyId);

    const selectedAdvisor = isBroker
      ? users.find((u) => u.id === editAdvisorId) || {
          id: editingDeal.createdById || currentUser.id,
          name: editingDeal.createdByName || currentUser.name,
        }
      : {
          id: editingDeal.createdById || currentUser.id,
          name: editingDeal.createdByName || currentUser.name,
        };

    const partnerAdv =
      editSharingType === "internal"
        ? users.find((u) => u.id === editPartnerAdvisorId)
        : null;

    updateDeal(editingDeal.id, {
      title: editTitle,
      dealType: editDealType,
      customerId: editCustomerId,
      customerName: cust?.fullName || editingDeal.customerName,
      propertyId: editPropertyId,
      propertyTitle: prop?.title || editingDeal.propertyTitle,
      currency: editCurrency,
      agreedPrice: agreedNumVal,
      offeredPrice: agreedNumVal,
      deposit: 0,
      commissionExpected: calcComm,
      commissionReceived: calcComm,
      portfolioOrigin: editOrigin,
      sharingType: editSharingType,
      partnerCompany: editSharingType === "external" ? editPartnerCompany : undefined,
      partnerName: editSharingType === "external" ? editPartnerName : undefined,
      partnerPhone: editSharingType === "external" ? editPartnerPhone : undefined,
      partnerAdvisorId: editSharingType === "internal" ? editPartnerAdvisorId : undefined,
      partnerAdvisorName: editSharingType === "internal" ? partnerAdv?.name : undefined,
      advisorShareRate: Math.round(editAdvisorRate * 100),
      advisorShareAmount: editCalculatedAdvisorShare,
      officeShareRate: Math.round(editOfficeRate * 100),
      officeShareAmount: editCalculatedOfficeShare,
      partnerShareRate: Math.round(editPartnerRate * 100),
      partnerShareAmount: editCalculatedPartnerShare,
      brokerApproval: editBrokerApproval,
      brokerApprovedAt: editBrokerApproval
        ? editingDeal.brokerApprovedAt || new Date().toISOString()
        : undefined,
      brokerApprovedBy: editBrokerApproval
        ? editingDeal.brokerApprovedBy || currentUser.name
        : undefined,
      stage: editStage,
      paymentDue: editPaymentDue,
      closingDate: editPaymentDue,
      createdById: selectedAdvisor.id,
      createdByName: selectedAdvisor.name,
    });

    setEditingDeal(null);
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Sekme Geçişi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#00adb5] font-bold tracking-wider uppercase">
              KOMİSYON & GELİR MOTORU
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              {isBroker ? "Ofis İşlem Defteri" : "Kişisel İşlemlerim"}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1d2566] tracking-tight flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#00adb5]" />
            İşlemler (Finans & Komisyon Paylaşım Defteri)
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            {isBroker
              ? "Tüm ofis ekibinin satış ve kiralama işlemleri, net ciroları ve hakediş dağılım defteri."
              : "Yalnızca size ait satış ve kiralama işlemleri, net cironuz ve komisyon hakediş defteriniz."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-300">
            <button
              type="button"
              onClick={() => setFinanceTab("matrix")}
              className={`px-3 py-1.5 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                financeTab === "matrix"
                  ? "bg-[#1d2566] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-[#00adb5]" />
              İşlem Defteri & Matris
            </button>
            <button
              type="button"
              onClick={() => setFinanceTab("analytics")}
              className={`px-3 py-1.5 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                financeTab === "analytics"
                  ? "bg-[#1d2566] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              Trendler & Grafikler
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="sharp-btn-primary px-4 py-2 text-xs flex items-center gap-2 cursor-pointer self-start md:self-auto shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>İşlem Kapama (Ofis Raporu)</span>
          </button>
        </div>
      </div>

      {financeTab === "analytics" ? (
        <AnalyticsView />
      ) : (
        <>
          {/* Finansal Özet Kartları (Filtrelenmiş İşlemlere Göre Anlık Güncellenir) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sharp-card p-4 border-t-3 border-t-[#00adb5]">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="font-bold text-[#1d2566] px-2 py-0.5 bg-slate-100 border border-slate-200 uppercase">
                  Toplam Anlaşma
                </span>
                <TrendingUp className="w-4 h-4 text-[#00adb5]" />
              </div>
              <div className="text-xl font-bold font-mono text-[#1d2566] mt-2">
                {filteredDeals.length} <span className="text-xs font-normal text-slate-500">İşlem</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-1">
                {gbpFilteredDeals.length} GBP Portföy Satışı
              </div>
            </div>

            <div className="sharp-card p-4 border-t-3 border-t-[#1d2566]">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="font-bold text-[#1d2566] px-2 py-0.5 bg-slate-100 border border-slate-200 uppercase">
                  Toplam Satış Hacmi (GBP)
                </span>
                <Building className="w-4 h-4 text-[#1d2566]" />
              </div>
              <div className="text-xl font-bold font-mono text-[#1d2566] mt-2">
                {totalAgreedGbp.toLocaleString("tr-TR")}{" "}
                <span className="text-xs font-normal text-slate-500">GBP</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-1">
                Anlaşılan toplam mülk bedeli
              </div>
            </div>

            <div className="sharp-card p-4 border-t-3 border-t-emerald-600">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="font-bold text-emerald-800 px-2 py-0.5 bg-emerald-50 border border-emerald-200 uppercase">
                  Toplam Komisyon (GBP)
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-2">
                {totalCommissionGbp.toLocaleString("tr-TR")}{" "}
                <span className="text-xs font-normal text-slate-500">GBP</span>
              </div>
              <div className="text-[11px] font-mono text-emerald-600 mt-1">
                Tahsil edilen toplam komisyon
              </div>
            </div>

            <div className="sharp-card p-4 border-t-3 border-t-[#00adb5]">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="font-bold text-[#1d2566] px-2 py-0.5 bg-slate-100 border border-slate-200 uppercase">
                  Komisyon Dağılımı (GBP)
                </span>
                <PieChart className="w-4 h-4 text-[#00adb5]" />
              </div>
              <div className="space-y-1 mt-1 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Danışman Payı:</span>
                  <span className="text-[#00adb5] font-bold">
                    {totalAdvisorGbp.toLocaleString("tr-TR")} GBP
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Ofis Payı:</span>
                  <span className="text-[#1d2566] font-bold">
                    {totalOfficeGbp.toLocaleString("tr-TR")} GBP
                  </span>
                </div>
                {totalPartnerGbp > 0 && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-purple-600">Dış / Ortak Payı:</span>
                    <span className="text-purple-700 font-bold">
                      {totalPartnerGbp.toLocaleString("tr-TR")} GBP
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* === GELİŞMİŞ FİLTRELEME MERKEZİ === */}
          <div className="sharp-card p-4 bg-white border border-slate-300 space-y-3.5 shadow-xs">
            {/* 1. Üst Filtre Satırı: Arama, Portföy Menşei ve Zaman Aralığı */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
              {/* Arama Inputu */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="İşlem başlığı, mülk, müşteri veya danışman ara..."
                  className="sharp-input w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Portföy Menşei Filtresi */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 border border-slate-200 shrink-0">
                <span className="text-[11px] font-mono text-slate-500 px-2 font-bold uppercase hidden sm:inline">
                  Menşe:
                </span>
                {[
                  { id: "ALL", label: "Tüm Menşeler" },
                  { id: "advisor", label: "Danışman (%60)" },
                  { id: "office", label: "Ofis (%50)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOriginFilter(item.id)}
                    className={`px-2.5 py-1 text-xs font-mono transition cursor-pointer ${
                      originFilter === item.id
                        ? "bg-[#1d2566] text-white font-bold shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Hızlı Dönem Seçimi */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 border border-slate-200 shrink-0">
                <span className="text-[11px] font-mono text-slate-500 px-2 font-bold uppercase hidden sm:inline">
                  Dönem:
                </span>
                {[
                  { id: "ALL", label: "Tümü" },
                  { id: "1M", label: "Bu Ay" },
                  { id: "3M", label: "3 Aylık" },
                  { id: "6M", label: "6 Aylık" },
                  { id: "12M", label: "12 Aylık" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPeriodFilter(item.id as "ALL" | "1M" | "3M" | "6M" | "12M" | "MONTH");
                      setSelectedMonth("");
                    }}
                    className={`px-2.5 py-1 text-xs font-mono transition cursor-pointer ${
                      periodFilter === item.id && !selectedMonth
                        ? "bg-[#00adb5] text-white font-bold shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Ay Filtresi: Sağlı Sollu Ok ve Ortada İşaretli Ay Kutusu */}
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500 font-bold uppercase hidden sm:inline flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#00adb5]" />
                  Ay Filtresi:
                </span>

                {/* Sağlı Sollu Ok Kutusu */}
                <BoxedDateNavigator
                  label={monthDisplayText}
                  onPrev={handlePrevMonth}
                  onNext={handleNextMonth}
                  prevTitle="Önceki Ay"
                  nextTitle="Sonraki Ay"
                  badge={
                    selectedMonth && monthCounts[selectedMonth] !== undefined ? (
                      <span className="text-[10px] px-1.5 py-0.2 bg-[#00adb5]/10 text-[#00adb5] border border-[#00adb5]/30 font-bold font-mono">
                        {monthCounts[selectedMonth]} İşlem
                      </span>
                    ) : undefined
                  }
                />

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleGoThisMonth}
                    className={`px-2.5 py-1.5 text-xs font-mono border transition cursor-pointer font-bold ${
                      selectedMonth === currentMonthKey
                        ? "bg-[#1d2566] text-white border-[#1d2566]"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                    title="Cari ayı filtrele"
                  >
                    Bu Ay
                  </button>

                  {selectedMonth && (
                    <button
                      type="button"
                      onClick={handleClearMonth}
                      className="p-1.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-500 hover:text-rose-600 cursor-pointer transition flex items-center gap-1 text-xs font-mono"
                      title="Ay filtresini temizle (Tüm ayları göster)"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Tüm Aylar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Aktif Filtre Bilgilendirme ve Sıfırlama */}
            {hasActiveFilter && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs font-mono">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500 font-bold flex items-center gap-1">
                    <Filter className="w-3 h-3 text-[#00adb5]" />
                    Aktif Filtreler:
                  </span>
                  {originFilter !== "ALL" && (
                    <span className="px-2 py-0.5 bg-[#1d2566]/10 text-[#1d2566] border border-[#1d2566]/20 flex items-center gap-1">
                      Menşe: {originFilter === "advisor" ? "Danışman (%60)" : "Ofis (%50)"}
                      <button
                        type="button"
                        onClick={() => setOriginFilter("ALL")}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {periodFilter !== "ALL" && !selectedMonth && (
                    <span className="px-2 py-0.5 bg-[#00adb5]/10 text-[#00adb5] border border-[#00adb5]/30 flex items-center gap-1">
                      Dönem:{" "}
                      {periodFilter === "1M"
                        ? "Bu Ay"
                        : periodFilter === "3M"
                        ? "Son 3 Ay"
                        : periodFilter === "6M"
                        ? "Son 6 Ay"
                        : "Son 12 Ay"}
                      <button
                        type="button"
                        onClick={() => setPeriodFilter("ALL")}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedMonth && (
                    <span className="px-2 py-0.5 bg-[#1d2566] text-white border border-[#1d2566] flex items-center gap-1 font-bold">
                      Ay: {MONTH_OPTIONS.find((m) => m.key === selectedMonth)?.label || selectedMonth}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMonth("");
                          setPeriodFilter("ALL");
                        }}
                        className="hover:text-amber-300 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-1">
                      Arama: &quot;{searchQuery}&quot;
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  <span className="text-slate-400">
                    ({visibleDeals.length} işlemden {filteredDeals.length} tanesi listeleniyor)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2 py-0.5 text-xs text-rose-700 hover:text-rose-900 border border-rose-200 bg-rose-50 hover:bg-rose-100 flex items-center gap-1 cursor-pointer transition font-bold"
                >
                  <RotateCcw className="w-3 h-3" />
                  Filtreleri Sıfırla
                </button>
              </div>
            )}
          </div>

          {/* Komisyon Paylaşım Kuralı Bilgi Çubuğu */}
          <div className="sharp-card p-3.5 bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="flex items-start gap-2.5">
              <Percent className="w-4 h-4 text-[#00adb5] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#1d2566] block">1. Tek Danışman</strong>
                <span className="text-slate-600 text-[11px]">
                  Kendi Portföyü: %60 GD / %40 Ofis<br />
                  Ofis Portföyü: %50 GD / %50 Ofis
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 md:border-l md:border-slate-200 md:pl-3">
              <Handshake className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#1d2566] block">2. Dış Paylaşım (%50 Dış Ortak)</strong>
                <span className="text-slate-600 text-[11px]">
                  Kendi Portföyü: %30 GD / %20 Ofis<br />
                  Ofis Portföyü: %25 GD / %25 Ofis
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 md:border-l md:border-slate-200 md:pl-3">
              <Users className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#1d2566] block">3. Şirket İçi 2 Danışman (%25 Müşteri)</strong>
                <span className="text-slate-600 text-[11px]">
                  Kendi Portföyü: %30 GD1 / %45 Ofis<br />
                  Ofis Portföyü: %25 GD1 / %50 Ofis
                </span>
              </div>
            </div>
          </div>

          {/* Finansal İşlemler Tablosu */}
          <div className="sharp-card overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Mülk & İşlem</th>
                  <th className="py-3 px-4">Taraflar</th>
                  <th className="py-3 px-4">Menşe & Paylaşım</th>
                  <th className="py-3 px-4">Tarih</th>
                  <th className="py-3 px-4">Anlaşılan Bedel</th>
                  <th className="py-3 px-4">Toplam Komisyon</th>
                  <th className="py-3 px-4">Hakediş Dağılımı</th>
                  <th className="py-3 px-4 text-center">Broker Onayı</th>
                  <th className="py-3 px-4 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeals.map((d) => {
                  const totalComm = d.commissionExpected;

                  // Oran fallbackleri (Dış ofis, iç paylaşım veya tek danışman kuralları)
                  let fallbackAdvRate = d.portfolioOrigin === "advisor" ? 60 : 50;
                  let fallbackPartRate = 0;
                  let fallbackOffRate = d.portfolioOrigin === "advisor" ? 40 : 50;

                  if (d.sharingType === "external") {
                    fallbackPartRate = 50;
                    fallbackAdvRate = d.portfolioOrigin === "advisor" ? 30 : 25;
                    fallbackOffRate = d.portfolioOrigin === "advisor" ? 20 : 25;
                  } else if (d.sharingType === "internal") {
                    fallbackPartRate = 25;
                    fallbackAdvRate = d.portfolioOrigin === "advisor" ? 30 : 25;
                    fallbackOffRate = d.portfolioOrigin === "advisor" ? 45 : 50;
                  }

                  const advRate = d.advisorShareRate !== undefined ? d.advisorShareRate : fallbackAdvRate;
                  const partRate = d.partnerShareRate !== undefined ? d.partnerShareRate : fallbackPartRate;
                  const offRate = d.officeShareRate !== undefined ? d.officeShareRate : fallbackOffRate;

                  const advShare =
                    d.advisorShareAmount !== undefined
                      ? d.advisorShareAmount
                      : Math.round((totalComm * advRate) / 100);
                  const partShare =
                    d.partnerShareAmount !== undefined
                      ? d.partnerShareAmount
                      : Math.round((totalComm * partRate) / 100);
                  const offShare =
                    d.officeShareAmount !== undefined
                      ? d.officeShareAmount
                      : totalComm - advShare - partShare;

                  const rawDate = d.closingDate || d.paymentDue || d.createdAt;
                  const formattedDate = rawDate ? rawDate.split("T")[0] : "—";

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition">
                      {/* 1. Mülk & İşlem Başlığı */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {d.dealNumber && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-300">
                              {d.dealNumber}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-mono uppercase px-1.5 py-0.5 border font-bold ${
                              d.dealType === "rent"
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : "bg-blue-50 text-blue-800 border-blue-300"
                            }`}
                          >
                            {d.dealType === "rent" ? "KİRALIK" : "SATILIK"}
                          </span>
                        </div>
                        <div className="font-bold text-[#1d2566] mt-1">
                          {d.propertyTitle || d.title}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1.5 mt-0.5">
                          {isBroker && d.createdByName && (
                            <span className="text-[#00adb5] font-semibold font-mono">
                              GD: {d.createdByName}
                            </span>
                          )}
                          {d.propertyTitle && d.propertyTitle !== d.title && (
                            <span>• {d.title}</span>
                          )}
                        </div>
                      </td>

                      {/* 2. Taraflar (Müşteri & Mal Sahibi) */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-semibold">
                          {d.customerName || "—"}
                        </div>
                        {d.landlordName && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Mülk Sahibi: {d.landlordName}
                          </div>
                        )}
                        {d.leadChannel && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Kanal: {d.leadChannel}
                          </div>
                        )}
                      </td>

                      {/* 3. Menşe & Paylaşım */}
                      <td className="py-3 px-4">
                        {d.sharingType === "external" ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 border font-bold bg-purple-50 text-purple-700 border-purple-200 inline-flex items-center gap-1">
                              <Handshake className="w-3 h-3 text-purple-600" />
                              Dış Paylaşım (%50)
                            </span>
                            <div className="text-[11px] text-slate-700 font-medium font-mono">
                              {d.partnerCompany || d.partnerName || "Dış Ortak"}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {d.portfolioOrigin === "advisor" ? "Kendi Portföyü (%30 GD)" : "Ofis Portföyü (%25 GD)"}
                            </div>
                          </div>
                        ) : d.sharingType === "internal" ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 border font-bold bg-indigo-50 text-indigo-700 border-indigo-200 inline-flex items-center gap-1">
                              <Users className="w-3 h-3 text-indigo-600" />
                              İç Paylaşım (%25)
                            </span>
                            <div className="text-[11px] text-slate-700 font-medium font-mono">
                              2. GD: {d.partnerAdvisorName || "Danışman"}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {d.portfolioOrigin === "advisor" ? "Kendi Portföyü (%30 GD1)" : "Ofis Portföyü (%25 GD1)"}
                            </div>
                          </div>
                        ) : (
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 border font-bold ${
                              d.portfolioOrigin === "advisor"
                                ? "bg-[#00adb5]/10 text-[#00adb5] border-[#00adb5]/30"
                                : "bg-[#1d2566]/10 text-[#1d2566] border-[#1d2566]/20"
                            }`}
                          >
                            {d.portfolioOrigin === "advisor"
                              ? "Kendi Portföyü (%60 / %40)"
                              : "Ofis Portföyü (%50 / %50)"}
                          </span>
                        )}
                      </td>

                      {/* 4. Tarih */}
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {formattedDate}
                      </td>

                      {/* 5. Anlaşılan Bedel */}
                      <td className="py-3 px-4 font-mono font-bold text-[#1d2566]">
                        {d.agreedPrice.toLocaleString("tr-TR")} {d.currency}
                      </td>

                      {/* 6. Toplam Komisyon */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {d.commissionExpected.toLocaleString("tr-TR")} {d.currency}
                      </td>

                      {/* 7. Hakediş Dağılımı */}
                      <td className="py-3 px-4 font-mono text-[11px] space-y-0.5">
                        <div className="text-[#00adb5] font-bold">
                          GD: {advShare.toLocaleString("tr-TR")} {d.currency}{" "}
                          <span className="text-[10px] font-normal text-slate-500">(%{advRate})</span>
                        </div>
                        <div className="text-[#1d2566] font-bold">
                          Ofis: {offShare.toLocaleString("tr-TR")} {d.currency}{" "}
                          <span className="text-[10px] font-normal text-slate-500">(%{offRate})</span>
                        </div>
                        {partShare > 0 && (
                          <div className="text-purple-600 font-bold">
                            Ortak: {partShare.toLocaleString("tr-TR")} {d.currency}{" "}
                            <span className="text-[10px] font-normal text-slate-500">(%{partRate})</span>
                          </div>
                        )}
                      </td>

                      {/* 8. Broker Onayı */}
                      <td className="py-3 px-4 text-center">
                        {d.brokerApproval ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Onaylandı
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-300">
                            Bekliyor
                          </span>
                        )}
                      </td>

                      {/* 9. İşlem Aksiyonları (Düzenle & Sil) */}
                      <td className="py-3 px-4 text-center">
                        <ActionMenu
                          onEdit={() => handleOpenEditDeal(d)}
                          onDelete={() => setDealToDelete(d)}
                          canEdit={canManageDeal(d)}
                          canDelete={canManageDeal(d)}
                        />
                      </td>
                    </tr>
                  );
                })}

                {filteredDeals.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 font-mono text-xs">
                      <div className="space-y-2 max-w-sm mx-auto">
                        <Coins className="w-8 h-8 text-slate-300 mx-auto" />
                        <div className="font-bold text-slate-700">
                          Seçili kriterlere uygun işlem kaydı bulunamadı.
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Filtreleri genişletebilir veya arama sorgusunu temizleyebilirsiniz.
                        </p>
                        {hasActiveFilter && (
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="mt-2 sharp-btn-primary px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Filtreleri Temizle
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Standart Yeni Satış / Komisyon Anlaşması Modalı */}
      <AddDealModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* DÜZENLEME MODALI */}
      {editingDeal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="sharp-card w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-300 bg-white shadow-2xl">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#00adb5]" />
                <div>
                  <h2 className="text-sm font-bold text-[#1d2566]">
                    İşlem Kapama Raporunu Düzenle
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {editingDeal.dealNumber || "İşlem Formu"} • Fiziksel Ofis Rapor Kayıt Güncellemesi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingDeal(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDeal} className="p-5 space-y-4 text-xs">
              {/* İşlem Başlığı & Tür */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    İşlem / Rapor Başlığı *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="sharp-input w-full p-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    İşlem Türü *
                  </label>
                  <select
                    value={editDealType}
                    onChange={(e) => setEditDealType(e.target.value as "sale" | "rent")}
                    className="sharp-input w-full p-2 bg-white font-mono font-bold text-[#1d2566]"
                  >
                    <option value="sale">Satış İşlemi</option>
                    <option value="rent">Kiralama İşlemi</option>
                  </select>
                </div>
              </div>

              {/* Danışman Seçimi */}
              <div>
                <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#00adb5]" />
                  İşlemi Kapatan Danışman (GD Adı Soyadı) {isBroker ? "*" : ""}
                </label>
                {isBroker ? (
                  <select
                    value={editAdvisorId}
                    onChange={(e) => setEditAdvisorId(e.target.value)}
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
                    <span className="font-bold text-[#1d2566]">
                      {editingDeal?.createdByName || currentUser.name}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-200 text-slate-700 border border-slate-300 font-bold">
                      Danışman
                    </span>
                  </div>
                )}
              </div>

              {/* Müşteri & Portföy Seçimi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Alıcı / Kiracı Müşteri *
                  </label>
                  <select
                    value={editCustomerId}
                    onChange={(e) => setEditCustomerId(e.target.value)}
                    className="sharp-input w-full p-2 bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    İlgili Portföy / Mülk *
                  </label>
                  <select
                    value={editPropertyId}
                    onChange={(e) => setEditPropertyId(e.target.value)}
                    className="sharp-input w-full p-2 bg-white"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Para Birimi & Anlaşılan Bedel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Para Birimi
                  </label>
                  <select
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value as Currency)}
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
                    Gerçekleşen İşlem Bedeli *
                  </label>
                  <input
                    type="number"
                    required
                    value={editAgreedPrice}
                    onChange={(e) => setEditAgreedPrice(e.target.value)}
                    className="sharp-input w-full p-2 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Portföy Menşei & Komisyon Oranı */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Portföy Menşei *
                  </label>
                  <select
                    value={editOrigin}
                    onChange={(e) => setEditOrigin(e.target.value as "advisor" | "office")}
                    className="sharp-input w-full p-2 bg-white font-medium"
                  >
                    <option value="advisor">Danışman Kendi Portföyü</option>
                    <option value="office">Ofis Portföyü</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Komisyon Oranı (%)
                  </label>
                  <select
                    value={editCommissionRate}
                    onChange={(e) => setEditCommissionRate(Number(e.target.value))}
                    className="sharp-input w-full p-2 bg-white font-mono font-bold"
                  >
                    <option value={1}>%1</option>
                    <option value={2}>%2</option>
                    <option value={3}>%3</option>
                    <option value={4}>%4</option>
                    <option value={5}>%5</option>
                    <option value={10}>%10</option>
                    <option value={15}>%15</option>
                    <option value={100}>%100 (1 Kira Bedeli)</option>
                  </select>
                </div>
              </div>

              {/* Paylaşım Türü & Detayları */}
              <div className="p-3 bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                    Paylaşım Durumu (İşlem Ortaklığı) *
                  </label>
                  <select
                    value={editSharingType}
                    onChange={(e) => setEditSharingType(e.target.value as DealSharingType)}
                    className="sharp-input w-full p-2 bg-white font-semibold text-[#1d2566]"
                  >
                    <option value="none">Paylaşım Yok (Yalnızca Ofis Danışmanı)</option>
                    <option value="external">Dışarı ile Paylaşım (%50 Dış Şirket / Danışman)</option>
                    <option value="internal">İç Paylaşım (%25 Şirket İçi 2. Danışman)</option>
                  </select>
                </div>

                {editSharingType === "external" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-slate-500 font-mono text-[10px] mb-0.5">
                        Dış Şirket / Ofis Adı
                      </label>
                      <input
                        type="text"
                        value={editPartnerCompany}
                        onChange={(e) => setEditPartnerCompany(e.target.value)}
                        placeholder="Örn: Coldwell Banker"
                        className="sharp-input w-full p-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-mono text-[10px] mb-0.5">
                        Dış Danışman Adı Soyadı
                      </label>
                      <input
                        type="text"
                        value={editPartnerName}
                        onChange={(e) => setEditPartnerName(e.target.value)}
                        placeholder="Örn: Mehmet Demir"
                        className="sharp-input w-full p-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-mono text-[10px] mb-0.5">
                        Dış Danışman Telefonu
                      </label>
                      <input
                        type="tel"
                        value={editPartnerPhone}
                        onChange={(e) => setEditPartnerPhone(e.target.value)}
                        placeholder="0533..."
                        className="sharp-input w-full p-1.5 text-xs"
                      />
                    </div>
                  </div>
                )}

                {editSharingType === "internal" && (
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-slate-500 font-mono text-[10px] mb-0.5">
                      Müşteriyi Getiren 2. Danışman (%25 Pay)
                    </label>
                    <select
                      value={editPartnerAdvisorId}
                      onChange={(e) => setEditPartnerAdvisorId(e.target.value)}
                      className="sharp-input w-full p-2 bg-white"
                    >
                      <option value="">Danışman Seçiniz...</option>
                      {users
                        .filter((u) => u.id !== editAdvisorId)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Aşama & Tahsilat Vadesi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Anlaşma Aşaması
                  </label>
                  <select
                    value={editStage}
                    onChange={(e) => setEditStage(e.target.value as "offer" | "won" | "lost")}
                    className="sharp-input w-full p-2 bg-white font-medium"
                  >
                    <option value="offer">Teklif / Sözleşme Aşamasında</option>
                    <option value="won">Kazanıldı (Tahsil Edildi)</option>
                    <option value="lost">İptal / Kaybedildi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    İşlem / Kapanış Tarihi
                  </label>
                  <input
                    type="date"
                    value={editPaymentDue}
                    onChange={(e) => setEditPaymentDue(e.target.value)}
                    className="sharp-input w-full p-2 font-mono"
                  />
                </div>
              </div>

              {/* Canlı Hesaplanan Komisyon Özeti */}
              <div className="bg-[#1d2566]/5 border border-[#1d2566]/20 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[#1d2566] flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-[#00adb5]" />
                    Toplam Tahsil Edilecek Komisyon:
                  </span>
                  <span className="font-bold text-sm text-[#1d2566]">
                    {editCalculatedCommission.toLocaleString("tr-TR")} {editCurrency}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#1d2566]/15 text-[11px] font-mono">
                  <div className="text-[#00adb5] font-bold">
                    Danışman Payı (%{Math.round(editAdvisorRate * 100)}):<br />
                    {editCalculatedAdvisorShare.toLocaleString("tr-TR")} {editCurrency}
                  </div>
                  {editCalculatedPartnerShare > 0 && (
                    <div className="text-purple-600 font-bold">
                      {editSharingType === "external" ? "Dış Ortak" : "2. Danışman"} (%{Math.round(editPartnerRate * 100)}):<br />
                      {editCalculatedPartnerShare.toLocaleString("tr-TR")} {editCurrency}
                    </div>
                  )}
                  <div className="text-[#1d2566] font-bold text-right sm:text-right">
                    Ofis Payı (%{Math.round(editOfficeRate * 100)}):<br />
                    {editCalculatedOfficeShare.toLocaleString("tr-TR")} {editCurrency}
                  </div>
                </div>
              </div>

              {/* Broker Onayı Checkbox */}
              {isBroker && (
                <div className="pt-2 border-t border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer font-mono text-xs">
                    <input
                      type="checkbox"
                      checked={editBrokerApproval}
                      onChange={(e) => setEditBrokerApproval(e.target.checked)}
                      className="w-4 h-4 text-[#00adb5] rounded-none focus:ring-[#00adb5]"
                    />
                    <span className="font-bold text-[#1d2566] flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Broker / Ofis Yöneticisi Tarafından Onaylandı
                    </span>
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingDeal(null)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="sharp-btn-primary px-4 py-1.5 font-bold text-white shadow-2xs cursor-pointer"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SİLME ONAY MODALI */}
      <DeleteConfirmModal
        isOpen={!!dealToDelete}
        title="İşlem Kaydını Sil"
        itemName={dealToDelete ? `${dealToDelete.title} (${dealToDelete.customerName || "Müşteri"})` : undefined}
        message="Bu işlem ve komisyon anlaşması kaydı kalıcı olarak silinecektir. Yapılan komisyon hesaplamaları ve ciro kayıtları güncellenecektir."
        onConfirm={() => {
          if (dealToDelete) {
            deleteDeal(dealToDelete.id);
            setDealToDelete(null);
          }
        }}
        onCancel={() => setDealToDelete(null)}
      />
    </div>
  );
}
