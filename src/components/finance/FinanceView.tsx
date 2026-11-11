"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useStore } from "@/lib/store";
import { Deal, Currency, DealSharingType, isOfficeSystemAccount, isVolkanUser, isVolkanDeal } from "@/lib/types";
import { ActionMenu } from "@/components/common/ActionMenu";
import { DeleteConfirmModal } from "@/components/common/DeleteConfirmModal";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { AddDealModal } from "@/components/modals/AddDealModal";
import { AddHistoricalDealModal } from "@/components/modals/AddHistoricalDealModal";
import { DealReportModal } from "@/components/modals/DealReportModal";
import { BoxedDateNavigator } from "@/components/common/BoxedDateNavigator";
import { PhoneInput } from "@/components/common/PhoneInput";
import { DateInput } from "@/components/common/DateInput";
import { formatDateTR, convertToGbp } from "@/lib/formatters";
import { updateLiveExchangeRates } from "@/lib/currency";
import { KKTC_DISTRICTS, getRegionsByDistrict } from "@/lib/kktcLocations";
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
  FileText,
  Sparkles,
  Camera,
  Image as ImageIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserCheck,
  MapPin,
  User,
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
  const [isHistoricalModalOpen, setIsHistoricalModalOpen] = useState(false);
  const [viewingArchiveUrl, setViewingArchiveUrl] = useState<string | null>(null);
  const [financeTab, setFinanceTab] = useState<"matrix" | "analytics">(() => {
    if (typeof window === "undefined") return "matrix";
    try {
      const saved = localStorage.getItem("trustline_crm_finance_tab");
      if (saved === "matrix" || saved === "analytics") return saved;
    } catch {}
    return "matrix";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("trustline_crm_finance_tab", financeTab);
    } catch {}
  }, [financeTab]);

  // Silme Onay Modalı State
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);

  // Düzenleme Modalı State
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDealType, setEditDealType] = useState<"sale" | "rent">("sale");
  const [editCustomerId, setEditCustomerId] = useState("");
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editPropertyId, setEditPropertyId] = useState("");
  const [editPropertyTitle, setEditPropertyTitle] = useState("");
  const [editCurrency, setEditCurrency] = useState<Currency>("GBP");
  const [editPriceCurrency, setEditPriceCurrency] = useState<Currency>("GBP");
  const [editAgreedPrice, setEditAgreedPrice] = useState("");
  const [editCommissionAmount, setEditCommissionAmount] = useState<string>("");
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
  const [editArchiveUrl, setEditArchiveUrl] = useState<string | undefined>(undefined);
  const [editArchiveName, setEditArchiveName] = useState<string | undefined>(undefined);

  // İşlem Sonrası Ofis Raporu (Resmi PDF) Modalı State
  const [selectedDealForReport, setSelectedDealForReport] = useState<Deal | null>(null);

  useEffect(() => {
    updateLiveExchangeRates();
  }, []);

  // === FİLTRELEME STATELERİ ===
  const [searchQuery, setSearchQuery] = useState("");
  const [dealTypeFilter, setDealTypeFilter] = useState<string>("ALL"); // ALL | sale | rent
  const [districtFilter, setDistrictFilter] = useState<string>("ALL");
  const [subRegionFilter, setSubRegionFilter] = useState<string>("ALL");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>("ALL");
  const [advisorFilter, setAdvisorFilter] = useState<string>("ALL"); // ALL | userId
  const [originFilter, setOriginFilter] = useState<string>("ALL"); // ALL | advisor | office
  const [periodFilter, setPeriodFilter] = useState<"ALL" | "1M" | "3M" | "6M" | "12M" | "MONTH">("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>(""); // YYYY-MM
  const [sortBy, setSortBy] = useState<string>("newest");

  // === SIRALAMA STATELERİ (Tarih, Anlaşılan Bedel, Toplam Komisyon) ===
  const [sortField, setSortField] = useState<"date" | "agreedPrice" | "commissionExpected" | null>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleToggleSort = (field: "date" | "agreedPrice" | "commissionExpected") => {
    if (sortField === field) {
      const nextOrder = sortOrder === "desc" ? "asc" : "desc";
      setSortOrder(nextOrder);
      if (field === "date") setSortBy(nextOrder === "desc" ? "newest" : "oldest");
      else if (field === "agreedPrice") setSortBy(nextOrder === "desc" ? "price_desc" : "price_asc");
      else if (field === "commissionExpected") setSortBy(nextOrder === "desc" ? "comm_desc" : "comm_asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
      if (field === "date") setSortBy("newest");
      else if (field === "agreedPrice") setSortBy("price_desc");
      else if (field === "commissionExpected") setSortBy("comm_desc");
    }
  };

  // Danışman hesabı ise sadece kendi işlemlerini ve 2. danışman olarak dahil olduğu ortak işlemleri görür; Ofis / Broker hesabı ise tüm ofisin işlemlerini görür.
  const visibleDeals = useMemo(() => {
    return isBroker
      ? deals
      : deals.filter(
          (d) =>
            d.createdById === currentUser.id ||
            d.partnerAdvisorId === currentUser.id ||
            (d.createdByName &&
              currentUser.name &&
              d.createdByName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
            (d.partnerAdvisorName &&
              currentUser.name &&
              d.partnerAdvisorName.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
        );
  }, [deals, isBroker, currentUser]);

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

  // Seçilen ilçeye bağlı alt mahalle/bölge listesi
  const availableSubRegions = useMemo(() => {
    if (districtFilter === "ALL") return [];
    return getRegionsByDistrict(districtFilter);
  }, [districtFilter]);

  // Standart ve Dinamik Mülk Tipleri Listesi
  const availablePropertyTypes = useMemo(() => {
    const set = new Set([
      "Daire",
      "Villa",
      "Müstakil Ev",
      "Penthouse",
      "Ticari",
      "Arsa",
      "Bina",
      "Ofis",
      "Dükkan",
      "İkiz Villa",
      "Rezidans",
      "Tarla",
    ]);
    deals.forEach((d) => {
      if (d.propertyType && d.propertyType.trim()) {
        set.add(d.propertyType.trim());
      }
    });
    properties.forEach((p) => {
      if (p.propertyType && p.propertyType.trim()) {
        set.add(p.propertyType.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, [deals, properties]);

  // Aktif Danışmanlar Listesi
  const availableAdvisors = useMemo(() => {
    return users
      .filter((u) => u.active && !isOfficeSystemAccount(u))
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [users]);

  // Filtreleri uygulama
  const filteredDeals = useMemo(() => {
    const now = new Date();

    return visibleDeals.filter((d) => {
      // 1. Satılık / Kiralık Filtresi
      if (dealTypeFilter !== "ALL") {
        const dType = d.dealType || "sale";
        if (dType !== dealTypeFilter) return false;
      }

      // 2. İlçe (Şehir) Filtresi
      if (districtFilter !== "ALL") {
        const prop = properties.find((p) => p.id === d.propertyId);
        const qDist = districtFilter.toLowerCase();
        const combined = `${d.address || ""} ${d.title} ${d.propertyTitle || ""} ${prop?.region || ""} ${prop?.address || ""} ${prop?.location || ""}`.toLowerCase();
        if (!combined.includes(qDist)) return false;
      }

      // 3. Mahalle / Bölge Filtresi
      if (subRegionFilter !== "ALL") {
        const prop = properties.find((p) => p.id === d.propertyId);
        const qSub = subRegionFilter.toLowerCase();
        const combined = `${d.address || ""} ${d.title} ${d.propertyTitle || ""} ${prop?.region || ""} ${prop?.address || ""} ${prop?.location || ""}`.toLowerCase();
        if (!combined.includes(qSub)) return false;
      }

      // 4. Mülk Tipi Filtresi
      if (propertyTypeFilter !== "ALL") {
        const prop = properties.find((p) => p.id === d.propertyId);
        const pType = d.propertyType || prop?.propertyType || "";
        const combined = `${d.propertyType || ""} ${d.title} ${d.propertyTitle || ""} ${prop?.propertyType || ""}`.toLowerCase();
        const matches = (pType && pType.toLowerCase() === propertyTypeFilter.toLowerCase()) || combined.includes(propertyTypeFilter.toLowerCase());
        if (!matches) return false;
      }

      // 5. Portföy Menşei Filtresi
      if (originFilter !== "ALL" && d.portfolioOrigin !== originFilter) {
        return false;
      }

      // 6. Danışman Filtresi
      if (advisorFilter !== "ALL") {
        const adv = users.find((u) => u.id === advisorFilter);
        const advNameNorm = adv ? adv.name.trim().toLowerCase() : "";
        const isMatch =
          d.createdById === advisorFilter ||
          d.partnerAdvisorId === advisorFilter ||
          (d.createdByName && advNameNorm && d.createdByName.trim().toLowerCase() === advNameNorm) ||
          (d.partnerAdvisorName && advNameNorm && d.partnerAdvisorName.trim().toLowerCase() === advNameNorm);
        if (!isMatch) return false;
      }

      // 7. Arama Filtresi (Başlık, Mülk, Müşteri, Danışman, Adres)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = d.title.toLowerCase().includes(q);
        const propMatch = d.propertyTitle?.toLowerCase().includes(q) || false;
        const custMatch = d.customerName?.toLowerCase().includes(q) || false;
        const advisorMatch = d.createdByName?.toLowerCase().includes(q) || false;
        const dealNumMatch = d.dealNumber?.toLowerCase().includes(q) || false;
        const addressMatch = d.address?.toLowerCase().includes(q) || false;
        if (!titleMatch && !propMatch && !custMatch && !advisorMatch && !dealNumMatch && !addressMatch) {
          return false;
        }
      }

      // 8. Tarih Filtreleme
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
  }, [
    visibleDeals,
    dealTypeFilter,
    districtFilter,
    subRegionFilter,
    propertyTypeFilter,
    originFilter,
    advisorFilter,
    properties,
    users,
    searchQuery,
    periodFilter,
    selectedMonth,
    getDealDate,
    getDealMonthKey,
  ]);

  // Sıralanmış İşlemler (Tarih, Anlaşılan Bedel, Toplam Komisyon)
  const sortedDeals = useMemo(() => {
    if (!sortField) return filteredDeals;

    return [...filteredDeals].sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortField === "date") {
        valA = getDealDate(a).getTime();
        valB = getDealDate(b).getTime();
      } else if (sortField === "agreedPrice") {
        const currA = a.priceCurrency || a.currency || "GBP";
        const currB = b.priceCurrency || b.currency || "GBP";
        valA = convertToGbp(a.agreedPrice || 0, currA);
        valB = convertToGbp(b.agreedPrice || 0, currB);
      } else if (sortField === "commissionExpected") {
        const currA = a.commissionCurrency || a.currency || "GBP";
        const currB = b.commissionCurrency || b.currency || "GBP";
        valA = convertToGbp(a.commissionExpected || 0, currA);
        valB = convertToGbp(b.commissionExpected || 0, currB);
      }

      if (valA === valB) return 0;
      return sortOrder === "asc" ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }, [filteredDeals, sortField, sortOrder, getDealDate]);

  // Filtrelenmiş Finans Özeti (Tüm Para Birimleri Canlı Kurlarla GBP'ye Çevrilerek Hesaplanır)
  const totalAgreedGbp = filteredDeals.reduce((sum, d) => {
    const priceCurr = (d.priceCurrency || (d.currency === "TRY" ? "GBP" : d.currency) || "GBP") as Currency;
    return sum + convertToGbp(d.agreedPrice || 0, priceCurr);
  }, 0);

  const totalCommissionGbp = filteredDeals.reduce((sum, d) => {
    const commCurr = (d.commissionCurrency || d.currency || "TRY") as Currency;
    return sum + convertToGbp(d.commissionExpected || 0, commCurr);
  }, 0);

  const totalAdvisorGbp = filteredDeals.reduce((sum, d) => {
    const commCurr = (d.commissionCurrency || d.currency || "TRY") as Currency;
    const commGbp = convertToGbp(d.commissionExpected || 0, commCurr);
    const isVolkan = isVolkanDeal(d);
    if (isVolkan) {
      const partRate = d.sharingType === "external" ? 0.5 : d.sharingType === "internal" ? 0.25 : 0;
      const advRate = 1 - partRate;
      return sum + Math.round(commGbp * advRate);
    }

    if (!isBroker) {
      // Eğer kullanıcı 2. danışman ise kendi payı d.partnerShareAmount'tur
      if (d.partnerAdvisorId === currentUser.id) {
        return (
          sum +
          (d.partnerShareAmount !== undefined
            ? convertToGbp(d.partnerShareAmount, commCurr)
            : Math.round(commGbp * 0.25))
        );
      }
      if (d.advisorShareAmount !== undefined) {
        return sum + convertToGbp(d.advisorShareAmount, commCurr);
      }
      const rate = d.portfolioOrigin === "advisor" ? 0.6 : 0.5;
      return sum + Math.round(commGbp * rate);
    } else {
      // Broker tüm danışmanlara ödenecek toplam danışman hakedişini görür (Danışman 1 + Danışman 2)
      const advShare =
        d.advisorShareAmount !== undefined
          ? convertToGbp(d.advisorShareAmount, commCurr)
          : Math.round(commGbp * (d.portfolioOrigin === "advisor" ? 0.6 : 0.5));
      const internalPartShare =
        d.sharingType === "internal"
          ? (d.partnerShareAmount !== undefined
              ? convertToGbp(d.partnerShareAmount, commCurr)
              : Math.round(commGbp * 0.25))
          : 0;
      return sum + advShare + internalPartShare;
    }
  }, 0);

  const totalOfficeGbp = filteredDeals.reduce((sum, d) => {
    if (isVolkanDeal(d)) return sum + 0;
    const commCurr = (d.commissionCurrency || d.currency || "TRY") as Currency;
    const commGbp = convertToGbp(d.commissionExpected || 0, commCurr);
    if (d.officeShareAmount !== undefined) {
      return sum + convertToGbp(d.officeShareAmount, commCurr);
    }
    const rate = d.portfolioOrigin === "advisor" ? 0.4 : 0.5;
    return sum + Math.round(commGbp * rate);
  }, 0);

  const totalPartnerGbp = filteredDeals.reduce((sum, d) => {
    // Dış şirket ortaklığı payı
    if (d.sharingType === "external") {
      const commCurr = (d.commissionCurrency || d.currency || "TRY") as Currency;
      const commGbp = convertToGbp(d.commissionExpected || 0, commCurr);
      return (
        sum +
        (d.partnerShareAmount !== undefined
          ? convertToGbp(d.partnerShareAmount, commCurr)
          : Math.round(commGbp * 0.5))
      );
    }
    return sum;
  }, 0);

  // Filtreleri sıfırlama
  const handleResetFilters = () => {
    setSearchQuery("");
    setDealTypeFilter("ALL");
    setDistrictFilter("ALL");
    setSubRegionFilter("ALL");
    setPropertyTypeFilter("ALL");
    setAdvisorFilter("ALL");
    setOriginFilter("ALL");
    setPeriodFilter("ALL");
    setSelectedMonth("");
    setSortBy("newest");
    setSortField("date");
    setSortOrder("desc");
  };

  const activeFilterCount =
    (searchQuery.trim() !== "" ? 1 : 0) +
    (dealTypeFilter !== "ALL" ? 1 : 0) +
    (districtFilter !== "ALL" ? 1 : 0) +
    (subRegionFilter !== "ALL" ? 1 : 0) +
    (propertyTypeFilter !== "ALL" ? 1 : 0) +
    (advisorFilter !== "ALL" ? 1 : 0) +
    (originFilter !== "ALL" ? 1 : 0) +
    (periodFilter !== "ALL" ? 1 : 0) +
    (selectedMonth !== "" ? 1 : 0);

  const hasActiveFilter = activeFilterCount > 0;

  // Düzenleme Handlers
  const handleOpenEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setEditTitle(deal.title);
    setEditDealType(deal.dealType || "sale");
    setEditCustomerId(deal.customerId);
    setEditCustomerName(deal.customerName || "");
    setEditPropertyId(deal.propertyId);
    setEditPropertyTitle(deal.propertyTitle || deal.title || "");
    setEditCurrency(deal.currency); // Ana komisyon para birimi (TRY, GBP vb.)
    setEditPriceCurrency(deal.priceCurrency || (deal.currency === "TRY" ? "GBP" : deal.currency)); // Mülk satış/kira kuru (GBP vb.)
    setEditAgreedPrice(deal.agreedPrice.toString());
    setEditCommissionAmount(deal.commissionExpected ? deal.commissionExpected.toString() : "");

    const rate =
      deal.commissionRate ||
      (deal.dealType === "rent"
        ? 100
        : deal.agreedPrice > 0
        ? Math.round((deal.commissionExpected / deal.agreedPrice) * 100)
        : 5);
    setEditCommissionRate([1, 2, 3, 4, 5, 10, 15, 100].includes(rate) ? rate : (deal.dealType === "rent" ? 100 : 5));
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
    const dealAdvisorId =
      !deal.createdById || isOfficeSystemAccount({ id: deal.createdById, name: deal.createdByName })
        ? "usr-volkan"
        : deal.createdById;
    setEditAdvisorId(dealAdvisorId);
    setEditBrokerApproval(!!deal.brokerApproval);
    setEditArchiveUrl(deal.archiveDocumentUrl);
    setEditArchiveName(deal.archiveDocumentName);
  };

  const editAgreedNum = Number(editAgreedPrice) || 0;
  const editCalculatedCommission =
    editCommissionAmount !== "" && !isNaN(Number(editCommissionAmount))
      ? Number(editCommissionAmount)
      : editCommissionRate === 100
      ? editAgreedNum
      : Math.round((editAgreedNum * editCommissionRate) / 100);

  // Paylaşım ve menşee göre oranlar
  let editAdvisorRate = 0.6;
  let editOfficeRate = 0.4;
  let editPartnerRate = 0;

  const isVolkanEdit =
    editAdvisorId === "usr-volkan" ||
    isVolkanUser({ id: editAdvisorId, name: users.find((u) => u.id === editAdvisorId)?.name }) ||
    isOfficeSystemAccount({ id: editAdvisorId });

  if (isVolkanEdit) {
    if (editSharingType === "external") {
      editPartnerRate = 0.5;
      editAdvisorRate = 0.5;
      editOfficeRate = 0.0;
    } else if (editSharingType === "internal") {
      editPartnerRate = 0.25;
      editAdvisorRate = 0.75;
      editOfficeRate = 0.0;
    } else {
      editPartnerRate = 0.0;
      editAdvisorRate = 1.0;
      editOfficeRate = 0.0;
    }
  } else {
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
  }

  const editCalculatedAdvisorShare = Math.round(editCalculatedCommission * editAdvisorRate);
  const editCalculatedOfficeShare = Math.round(editCalculatedCommission * editOfficeRate);
  const editCalculatedPartnerShare = Math.round(editCalculatedCommission * editPartnerRate);

  const handleSaveEditDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal) return;
    const agreedNumVal = Number(editAgreedPrice) || 0;
    const calcComm = editCalculatedCommission;

    const isHist =
      !!editingDeal.isHistorical ||
      editingDeal.customerId?.startsWith("hist-") ||
      editingDeal.propertyId?.startsWith("hist-") ||
      !customers.some((c) => c.id === editCustomerId);

    const cust = customers.find((c) => c.id === editCustomerId);
    const prop = properties.find((p) => p.id === editPropertyId);

    const finalCustomerName = isHist
      ? (editCustomerName.trim() || editingDeal.customerName || "Geçmiş Müşteri")
      : (cust?.fullName || editingDeal.customerName);

    const finalPropertyTitle = isHist
      ? (editPropertyTitle.trim() || editingDeal.propertyTitle || editingDeal.title)
      : (prop?.title || editingDeal.propertyTitle);

    const finalCustomerId = isHist
      ? (editingDeal.customerId || `hist-cust-${Date.now()}`)
      : editCustomerId;

    const finalPropertyId = isHist
      ? (editingDeal.propertyId || `hist-prop-${Date.now()}`)
      : editPropertyId;

    let targetAdvisorId = isBroker ? editAdvisorId : (editingDeal.createdById || currentUser.id);
    if (!targetAdvisorId || targetAdvisorId === "usr-ofis" || isOfficeSystemAccount({ id: targetAdvisorId })) {
      targetAdvisorId = "usr-volkan";
    }
    const foundUser = users.find((u) => u.id === targetAdvisorId);
    const selectedAdvisor = foundUser
      ? { id: foundUser.id, name: foundUser.name }
      : { id: "usr-volkan", name: "Volkan Affan Kanıgür" };

    const partnerAdv =
      editSharingType === "internal"
        ? users.find((u) => u.id === editPartnerAdvisorId)
        : null;

    updateDeal(editingDeal.id, {
      title: finalPropertyTitle,
      dealType: editDealType,
      customerId: finalCustomerId,
      customerName: finalCustomerName,
      propertyId: finalPropertyId,
      propertyTitle: finalPropertyTitle,
      currency: editCurrency,
      priceCurrency: editPriceCurrency,
      commissionCurrency: editCurrency,
      agreedPrice: agreedNumVal,
      offeredPrice: agreedNumVal,
      deposit: 0,
      commissionRate: editCommissionRate,
      commissionExpected: calcComm,
      commissionReceived: calcComm,
      isHistorical: isHist,
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
      archiveDocumentUrl: editArchiveUrl,
      archiveDocumentName: editArchiveName,
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

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsHistoricalModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer bg-[#00adb5] hover:bg-[#00969d] text-white shadow-xs transition"
              title="CRM öncesi kağıt formları fotoğrafla AI tarayarak veya hızlıca manuel sisteme aktarın"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Eski Kağıt Form Arşivle (AI & Fotoğraf)</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="sharp-btn-primary px-4 py-2 text-xs flex items-center gap-2 cursor-pointer self-start md:self-auto shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>İşlem Kapama (Ofis Raporu)</span>
            </button>
          </div>
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
                  {isBroker ? "Toplam Anlaşma" : "Kişisel Kapanan İşlem"}
                </span>
                <TrendingUp className="w-4 h-4 text-[#00adb5]" />
              </div>
              <div className="text-xl font-bold font-mono text-[#1d2566] mt-2">
                {filteredDeals.length} <span className="text-xs font-normal text-slate-500">İşlem</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-1">
                {isBroker ? "Kapanan toplam işlem adedi" : "Kişisel kapanan işlem adediniz"}
              </div>
            </div>

            <div className="sharp-card p-4 border-t-3 border-t-[#1d2566]">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="font-bold text-[#1d2566] px-2 py-0.5 bg-slate-100 border border-slate-200 uppercase">
                  {isBroker ? "Toplam Satış Hacmi (GBP)" : "Kişisel Satış Hacmim (GBP)"}
                </span>
                <Building className="w-4 h-4 text-[#1d2566]" />
              </div>
              <div className="text-xl font-bold font-mono text-[#1d2566] mt-2">
                {totalAgreedGbp.toLocaleString("tr-TR")}{" "}
                <span className="text-xs font-normal text-slate-500">GBP</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-1">
                {isBroker ? "Anlaşılan toplam mülk bedeli" : "Sorumlu olduğunuz işlemlerin bedeli"}
              </div>
            </div>

            <div className="sharp-card p-4 border-t-3 border-t-emerald-600">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="font-bold text-emerald-800 px-2 py-0.5 bg-emerald-50 border border-emerald-200 uppercase">
                  {isBroker ? "Toplam Komisyon (GBP)" : "Üretilen Komisyon (GBP)"}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-2">
                {totalCommissionGbp.toLocaleString("tr-TR")}{" "}
                <span className="text-xs font-normal text-slate-500">GBP</span>
              </div>
              <div className="text-[11px] font-mono text-emerald-600 mt-1">
                {isBroker ? "Tahsil edilen toplam komisyon" : "İşlemlerinizden üretilen brüt komisyon"}
              </div>
            </div>

            <div className="sharp-card p-4 border-t-3 border-t-purple-600">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="font-bold text-purple-900 px-2 py-0.5 bg-purple-50 border border-purple-200 uppercase">
                  {isBroker ? "Komisyon Dağılımı (GBP)" : "Prim Hak Edişim (GBP)"}
                </span>
                <Coins className="w-4 h-4 text-purple-600" />
              </div>
              {isBroker ? (
                <div className="space-y-1 mt-1 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Danışman Payları:</span>
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
              ) : (
                <>
                  <div className="text-xl font-bold font-mono text-purple-700 mt-2">
                    {totalAdvisorGbp.toLocaleString("tr-TR")}{" "}
                    <span className="text-xs font-normal text-slate-500">GBP</span>
                  </div>
                  <div className="text-[11px] font-mono text-purple-600 mt-1">
                    Onaylı net prim hak edişiniz
                  </div>
                </>
              )}
            </div>
          </div>

          {/* === GELİŞMİŞ FİLTRELEME VE KONTROL MERKEZİ === */}
          <div className="sharp-card p-4 bg-white border border-slate-300 space-y-3.5 shadow-xs">
            {/* 1. Üst Satır: Arama Çubuğu + Satılık/Kiralık Segment Toggle + Sıralama Menüsü + Filtreleri Sıfırla */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Arama Input */}
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Başlık, bölge, adres, ilan no veya müşteri ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sharp-input w-full pl-9 pr-8 py-2 text-xs font-mono bg-slate-50/50 hover:bg-white focus:bg-white focus:border-[#00adb5] transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-rose-500 cursor-pointer p-0.5"
                    title="Aramayı Temizle"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {/* Satılık / Kiralık Durumu Segment Toggle */}
                <div className="inline-flex items-center bg-slate-100 p-0.5 border border-slate-200">
                  {[
                    { id: "ALL", label: "Tümü" },
                    { id: "sale", label: "Satılık" },
                    { id: "rent", label: "Kiralık" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDealTypeFilter(t.id)}
                      className={`px-3 py-1.5 text-xs font-mono font-semibold transition-all cursor-pointer ${
                        dealTypeFilter === t.id
                          ? "bg-[#1d2566] text-white shadow-2xs font-bold"
                          : "text-slate-600 hover:text-[#1d2566]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Sıralama Seçenekleri (En Son Eklenenler Varsayılan) */}
                <div className="relative flex items-center">
                  <span className="text-slate-400 absolute left-2.5 pointer-events-none">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSortBy(val);
                      if (val === "newest") {
                        setSortField("date");
                        setSortOrder("desc");
                      } else if (val === "oldest") {
                        setSortField("date");
                        setSortOrder("asc");
                      } else if (val === "price_desc") {
                        setSortField("agreedPrice");
                        setSortOrder("desc");
                      } else if (val === "price_asc") {
                        setSortField("agreedPrice");
                        setSortOrder("asc");
                      } else if (val === "comm_desc") {
                        setSortField("commissionExpected");
                        setSortOrder("desc");
                      } else if (val === "comm_asc") {
                        setSortField("commissionExpected");
                        setSortOrder("asc");
                      }
                    }}
                    className="sharp-input pl-8 pr-3 py-1.5 text-xs font-mono font-bold bg-white text-[#1d2566] border border-slate-200 focus:border-[#00adb5]"
                    title="Sıralama Ölçütü"
                  >
                    <option value="newest">Sırala: En Son Eklenen (Varsayılan)</option>
                    <option value="oldest">Sırala: En Eski Eklenen</option>
                    <option value="price_desc">Sırala: Bedel (Yüksekten Düşüğe)</option>
                    <option value="price_asc">Sırala: Bedel (Düşükten Yükseğe)</option>
                    <option value="comm_desc">Sırala: Komisyon (Yüksekten Düşüğe)</option>
                    <option value="comm_asc">Sırala: Komisyon (Düşükten Yükseğe)</option>
                  </select>
                </div>

                {/* Filtreleri Sıfırla Butonu (Hızlı) */}
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                    title="Uygulanan tüm filtreleri temizle"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Temizle ({activeFilterCount})</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2. Orta Satır: Portföy Yönetimindeki Dropdown Filtreler (İlçe, Bölge/Mahalle, Mülk Tipi, Danışman) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
              {/* 1. Konum: İlçe */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#00adb5]" />
                  <span>İlçe (Şehir)</span>
                </label>
                <select
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    setSubRegionFilter("ALL");
                  }}
                  className="sharp-input w-full py-1.5 px-2.5 text-xs font-mono bg-white text-[#1d2566] font-semibold border-slate-200"
                >
                  <option value="ALL">Tüm İlçeler</option>
                  {KKTC_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Konum: Mahalle / Bölge */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#00adb5]" />
                  <span>Mahalle / Bölge</span>
                </label>
                <select
                  value={subRegionFilter}
                  onChange={(e) => setSubRegionFilter(e.target.value)}
                  disabled={districtFilter === "ALL"}
                  className={`sharp-input w-full py-1.5 px-2.5 text-xs font-mono border-slate-200 ${
                    districtFilter === "ALL"
                      ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                      : "bg-white text-[#1d2566] font-semibold"
                  }`}
                >
                  <option value="ALL">
                    {districtFilter === "ALL" ? "Önce İlçe Seçin" : "Tüm Bölgeler"}
                  </option>
                  {availableSubRegions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Mülk Tipi */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Building className="w-3 h-3 text-[#00adb5]" />
                  <span>Mülk Tipi</span>
                </label>
                <select
                  value={propertyTypeFilter}
                  onChange={(e) => setPropertyTypeFilter(e.target.value)}
                  className="sharp-input w-full py-1.5 px-2.5 text-xs font-mono bg-white text-[#1d2566] font-semibold border-slate-200"
                >
                  <option value="ALL">Tüm Tipler</option>
                  {availablePropertyTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Danışman */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-[#00adb5]" />
                  <span>Danışman</span>
                </label>
                <select
                  value={advisorFilter}
                  onChange={(e) => setAdvisorFilter(e.target.value)}
                  className="sharp-input w-full py-1.5 px-2.5 text-xs font-mono bg-white text-[#1d2566] font-semibold border-slate-200"
                >
                  <option value="ALL">Tüm Danışmanlar</option>
                  {availableAdvisors.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === "ADMIN" ? "Broker" : "Danışman"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Alt Satır: Ay Filtresi (Ok Kutusu) + Portföy Menşei + Hızlı Dönem Seçimi */}
            <div className="pt-2 border-t border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Ay Filtresi: Sağlı Sollu Ok Kutusu ve Bu Ay Butonu */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500 font-bold uppercase hidden sm:inline flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#00adb5]" />
                  Ay Filtresi:
                </span>

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

              {/* Menşe ve Hızlı Dönem Seçimi Grupları */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Portföy Menşei */}
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
            </div>

            {/* 4. Aktif Filtre Bilgilendirme ve Sıfırlama */}
            {hasActiveFilter && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs font-mono">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500 font-bold flex items-center gap-1">
                    <Filter className="w-3 h-3 text-[#00adb5]" />
                    Aktif Filtreler:
                  </span>
                  {dealTypeFilter !== "ALL" && (
                    <span className="px-2 py-0.5 bg-[#1d2566] text-white flex items-center gap-1 font-bold">
                      {dealTypeFilter === "sale" ? "Satılık" : "Kiralık"}
                      <button
                        type="button"
                        onClick={() => setDealTypeFilter("ALL")}
                        className="hover:text-amber-300 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {districtFilter !== "ALL" && (
                    <span className="px-2 py-0.5 bg-[#00adb5]/10 text-[#008288] border border-[#00adb5]/30 flex items-center gap-1 font-bold">
                      İlçe: {districtFilter}
                      <button
                        type="button"
                        onClick={() => {
                          setDistrictFilter("ALL");
                          setSubRegionFilter("ALL");
                        }}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {subRegionFilter !== "ALL" && (
                    <span className="px-2 py-0.5 bg-[#00adb5]/10 text-[#008288] border border-[#00adb5]/30 flex items-center gap-1 font-bold">
                      Bölge: {subRegionFilter}
                      <button
                        type="button"
                        onClick={() => setSubRegionFilter("ALL")}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {propertyTypeFilter !== "ALL" && (
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-1 font-bold">
                      Tip: {propertyTypeFilter}
                      <button
                        type="button"
                        onClick={() => setPropertyTypeFilter("ALL")}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  )}
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
                  {advisorFilter !== "ALL" && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 font-bold">
                      Danışman: {users.find((u) => u.id === advisorFilter)?.name || advisorFilter}
                      <button
                        type="button"
                        onClick={() => setAdvisorFilter("ALL")}
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

          {/* Finansal İşlemler Tablosu */}
          <div className="sharp-card overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Mülk &amp; İşlem</th>
                  <th className="py-3 px-4">Taraflar</th>
                  <th className="py-3 px-4">Menşe &amp; Paylaşım</th>

                  {/* Sıralanabilir Tarih Sütunu */}
                  <th
                    onClick={() => handleToggleSort("date")}
                    className={`py-3 px-4 cursor-pointer select-none transition hover:bg-slate-100 ${
                      sortField === "date" ? "text-[#1d2566] bg-slate-100/80" : ""
                    }`}
                    title="Tarihe göre sırala (Tıklayarak Azalan / Artan değiştirin)"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Tarih</span>
                      {sortField === "date" ? (
                        sortOrder === "desc" ? (
                          <ArrowDown className="w-3.5 h-3.5 text-[#00adb5]" />
                        ) : (
                          <ArrowUp className="w-3.5 h-3.5 text-[#00adb5]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* Sıralanabilir Anlaşılan Bedel Sütunu */}
                  <th
                    onClick={() => handleToggleSort("agreedPrice")}
                    className={`py-3 px-4 cursor-pointer select-none transition hover:bg-slate-100 ${
                      sortField === "agreedPrice" ? "text-[#1d2566] bg-slate-100/80" : ""
                    }`}
                    title="Anlaşılan bedele göre sırala (Tıklayarak Azalan / Artan değiştirin)"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Anlaşılan Bedel</span>
                      {sortField === "agreedPrice" ? (
                        sortOrder === "desc" ? (
                          <ArrowDown className="w-3.5 h-3.5 text-[#00adb5]" />
                        ) : (
                          <ArrowUp className="w-3.5 h-3.5 text-[#00adb5]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* Sıralanabilir Toplam Komisyon Sütunu */}
                  <th
                    onClick={() => handleToggleSort("commissionExpected")}
                    className={`py-3 px-4 cursor-pointer select-none transition hover:bg-slate-100 ${
                      sortField === "commissionExpected" ? "text-[#1d2566] bg-slate-100/80" : ""
                    }`}
                    title="Toplam komisyona göre sırala (Tıklayarak Azalan / Artan değiştirin)"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Toplam Komisyon</span>
                      {sortField === "commissionExpected" ? (
                        sortOrder === "desc" ? (
                          <ArrowDown className="w-3.5 h-3.5 text-[#00adb5]" />
                        ) : (
                          <ArrowUp className="w-3.5 h-3.5 text-[#00adb5]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-4">Hakediş Dağılımı</th>
                  <th className="py-3 px-4 text-center">Broker Onayı</th>
                  <th className="py-3 px-4 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedDeals.map((d) => {
                  const totalComm = d.commissionExpected;
                  const isVolkan = isVolkanDeal(d);

                  // Oran fallbackleri (Dış ofis, iç paylaşım veya tek danışman kuralları)
                  let fallbackAdvRate = 60;
                  let fallbackPartRate = 0;
                  let fallbackOffRate = 40;

                  if (isVolkan) {
                    if (d.sharingType === "external") {
                      fallbackPartRate = 50;
                      fallbackAdvRate = 50;
                      fallbackOffRate = 0;
                    } else if (d.sharingType === "internal") {
                      fallbackPartRate = 25;
                      fallbackAdvRate = 75;
                      fallbackOffRate = 0;
                    } else {
                      fallbackPartRate = 0;
                      fallbackAdvRate = 100;
                      fallbackOffRate = 0;
                    }
                  } else {
                    fallbackAdvRate = d.portfolioOrigin === "advisor" ? 60 : 50;
                    fallbackOffRate = d.portfolioOrigin === "advisor" ? 40 : 50;
                    if (d.sharingType === "external") {
                      fallbackPartRate = 50;
                      fallbackAdvRate = d.portfolioOrigin === "advisor" ? 30 : 25;
                      fallbackOffRate = d.portfolioOrigin === "advisor" ? 20 : 25;
                    } else if (d.sharingType === "internal") {
                      fallbackPartRate = 25;
                      fallbackAdvRate = d.portfolioOrigin === "advisor" ? 30 : 25;
                      fallbackOffRate = d.portfolioOrigin === "advisor" ? 45 : 50;
                    }
                  }

                  const advRate = isVolkan ? fallbackAdvRate : (d.advisorShareRate !== undefined ? d.advisorShareRate : fallbackAdvRate);
                  const partRate = isVolkan ? fallbackPartRate : (d.partnerShareRate !== undefined ? d.partnerShareRate : fallbackPartRate);
                  const offRate = isVolkan ? 0 : (d.officeShareRate !== undefined ? d.officeShareRate : fallbackOffRate);

                  const partShare = Math.round((totalComm * partRate) / 100);
                  const offShare = isVolkan ? 0 : (d.officeShareAmount !== undefined ? d.officeShareAmount : Math.round((totalComm * offRate) / 100));
                  const advShare = totalComm - partShare - offShare;

                  const rawDate = d.closingDate || d.paymentDue || d.createdAt;
                  const formattedDate = rawDate ? formatDateTR(rawDate) : "—";

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
                          {d.isHistorical && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-300 inline-flex items-center gap-1">
                              <FileText className="w-3 h-3 text-purple-600" />
                              Fiziki Arşiv
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-[#1d2566] mt-1 flex items-center gap-1.5 flex-wrap">
                          <span>{d.propertyTitle || d.title}</span>
                          {d.isHistorical && (
                            <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              📜 Arşiv
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1.5 mt-0.5">
                          {isBroker && (
                            <span className="text-[#00adb5] font-semibold font-mono">
                              GD: {isVolkan ? "Volkan Affan Kanıgür" : (d.createdByName || "—")}
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
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 border font-bold bg-indigo-50 text-indigo-700 border-indigo-200 inline-flex items-center gap-1">
                              <Users className="w-3 h-3 text-indigo-600" />
                              İç Paylaşım (%25)
                            </span>
                            {d.partnerAdvisorId === currentUser.id && (
                              <div className="inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ★ Siz 2. Danışmansınız (Müşteri)
                              </div>
                            )}
                            <div className="text-[11px] text-slate-700 font-medium font-mono">
                              <div>Portföy (GD1): <span className="font-semibold">{d.createdByName || "Danışman 1"}</span></div>
                              <div>Müşteri (GD2): <span className="font-semibold text-indigo-700">{d.partnerAdvisorName || "Danışman 2"}</span></div>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {d.portfolioOrigin === "advisor" ? "Portföy %30 / Müşteri %25" : "Portföy %25 / Müşteri %25"}
                            </div>
                          </div>
                        ) : (
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 border font-bold ${
                              isVolkan
                                ? "bg-amber-50 text-amber-900 border-amber-300"
                                : d.portfolioOrigin === "advisor"
                                ? "bg-[#00adb5]/10 text-[#00adb5] border-[#00adb5]/30"
                                : "bg-[#1d2566]/10 text-[#1d2566] border-[#1d2566]/20"
                            }`}
                          >
                            {isVolkan
                              ? "Broker Kapanışı (%100 Pay)"
                              : d.portfolioOrigin === "advisor"
                              ? (isBroker ? "Kendi Portföyü (%60 / %40)" : "Kendi Portföyü (%60 Prim)")
                              : (isBroker ? "Ofis Portföyü (%50 / %50)" : "Ofis Portföyü (%50 Prim)")}
                          </span>
                        )}
                      </td>

                      {/* 4. Tarih */}
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {formattedDate}
                      </td>

                      {/* 5. Anlaşılan Bedel */}
                      <td className="py-3 px-4 font-mono font-bold text-[#1d2566]">
                        {d.agreedPrice.toLocaleString("tr-TR")} {d.priceCurrency || d.currency}
                      </td>

                      {/* 6. Toplam Komisyon */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {d.commissionExpected.toLocaleString("tr-TR")} {d.currency}
                      </td>

                      {/* 7. Hakediş Dağılımı */}
                      <td className="py-3 px-4 font-mono text-[11px] space-y-0.5">
                        <div
                          className={
                            d.createdById === currentUser.id
                              ? "text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 border border-emerald-200"
                              : "text-[#00adb5] font-bold"
                          }
                        >
                          GD1 {d.createdById === currentUser.id ? "(Siz)" : ""}: {advShare.toLocaleString("tr-TR")} {d.currency}{" "}
                          <span className="text-[10px] font-normal text-slate-500">(%{advRate})</span>
                        </div>
                        {isBroker && (
                          <div className="text-[#1d2566] font-bold">
                            Ofis: {offShare.toLocaleString("tr-TR")} {d.currency}{" "}
                            <span className="text-[10px] font-normal text-slate-500">(%{offRate})</span>
                          </div>
                        )}
                        {partShare > 0 && (
                          <div
                            className={
                              d.partnerAdvisorId === currentUser.id
                                ? "text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 border border-emerald-200"
                                : "text-purple-600 font-bold"
                            }
                          >
                            {d.sharingType === "internal"
                              ? `GD2 ${d.partnerAdvisorId === currentUser.id ? "(Siz)" : ""}: `
                              : "Ortak: "}
                            {partShare.toLocaleString("tr-TR")} {d.currency}{" "}
                            <span className="text-[10px] font-normal text-slate-500">(%{partRate})</span>
                          </div>
                        )}
                      </td>

                      {/* 8. Broker Onayı */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {d.brokerApproval ? (
                            <div className="inline-flex items-center gap-1.5 justify-center flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Onaylandı
                              </span>
                              {(isBroker || d.createdById === currentUser.id || d.partnerAdvisorId === currentUser.id) && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedDealForReport(d)}
                                  className="px-1.5 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 transition cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold font-mono shadow-2xs"
                                  title="İşlem Sonrası Ofis Raporu (Resmi PDF Görüntüle / İndir / Yazdır)"
                                >
                                  <FileText className="w-3 h-3 text-red-600" />
                                  <span>PDF</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-300">
                              Bekliyor
                            </span>
                          )}

                          {d.archiveDocumentUrl ? (
                            <button
                              type="button"
                              onClick={() => setViewingArchiveUrl(d.archiveDocumentUrl!)}
                              className="px-1.5 py-0.5 bg-[#00adb5]/10 hover:bg-[#00adb5]/20 text-[#008288] border border-[#00adb5]/30 transition cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold font-mono shadow-2xs mt-0.5"
                              title="Yüklenen Kağıt Form Fotoğrafını / Taramasını İncele"
                            >
                              <ImageIcon className="w-3 h-3 text-[#00adb5]" />
                              <span>Form Fotoğrafı</span>
                            </button>
                          ) : (d.isHistorical || d.archiveDocumentName) ? (
                            <label
                              className="px-1.5 py-0.5 bg-slate-50 hover:bg-[#00adb5]/10 text-slate-700 hover:text-[#008288] border border-slate-300 hover:border-[#00adb5]/40 transition cursor-pointer inline-flex items-center gap-1 text-[10px] font-mono mt-0.5 shadow-2xs"
                              title={`Fiziki Kağıt Form Fotoğrafını Yükle / Bağla (${d.archiveDocumentName || "Arşiv Belgesi"})`}
                            >
                              <Camera className="w-3 h-3 text-[#00adb5]" />
                              <span>{d.archiveDocumentName ? "Fotoğrafı Bağla" : "+ Fotoğraf"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    const b64 = reader.result as string;
                                    updateDeal(d.id, {
                                      archiveDocumentUrl: b64,
                                      archiveDocumentName: file.name,
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </label>
                          ) : null}
                        </div>
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

                {sortedDeals.length === 0 && (
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

      {/* Geçmiş Kağıt Form Arşivleme (AI & Express Form) Modalı */}
      <AddHistoricalDealModal
        isOpen={isHistoricalModalOpen}
        onClose={() => setIsHistoricalModalOpen(false)}
      />

      {/* Orijinal Kağıt Form Fotoğrafı / Taraması İnceleme Modalı */}
      {viewingArchiveUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 animate-fade-in">
          <div className="relative max-w-4xl w-full max-h-[92vh] bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-3 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <div>
                  <h3 className="text-xs font-mono font-bold text-white">
                    Orijinal Kağıt İşlem Formu Fotoğrafı / Taraması
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Fiziksel arşiv dökümanı dijital önizleme
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={viewingArchiveUrl}
                  download="islem-formu-arsiv.jpg"
                  className="px-2.5 py-1 text-[11px] font-mono bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-1.5"
                >
                  Fotoğrafı İndir
                </a>
                <button
                  type="button"
                  onClick={() => setViewingArchiveUrl(null)}
                  className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Kapat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-3 overflow-auto flex items-center justify-center bg-slate-950 flex-1 min-h-[300px]">
              <img
                src={viewingArchiveUrl}
                alt="Fiziki Form Arşiv Belgesi"
                className="max-w-full max-h-[78vh] object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* DÜZENLEME MODALI */}
      {editingDeal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4">
          <div className="sharp-card w-full h-full sm:h-auto sm:max-h-[90vh] max-w-2xl flex flex-col overflow-hidden border-0 sm:border border-slate-300 bg-white shadow-2xl rounded-none sm:rounded-lg">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
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

            <form onSubmit={handleSaveEditDeal} className="p-5 space-y-4 text-xs flex-1 overflow-y-auto">
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
                    value={editAdvisorId || "usr-volkan"}
                    onChange={(e) => setEditAdvisorId(e.target.value)}
                    className="sharp-input w-full p-2 bg-white font-medium text-slate-800"
                  >
                    {users.filter((u) => !isOfficeSystemAccount(u)).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.role === "ADMIN" ? "(Ofis / Broker)" : "(Danışman)"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="sharp-input w-full p-2 bg-slate-100 border border-slate-300 font-medium text-slate-700 flex items-center justify-between cursor-not-allowed select-none">
                    <span className="font-bold text-[#1d2566]">
                      {editingDeal?.createdByName || currentUser.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal shrink-0 ml-1">
                      🔒 Kilitli
                    </span>
                  </div>
                )}
              </div>

              {/* Müşteri & Portföy Alanı */}
              {editingDeal?.isHistorical ||
              editingDeal?.customerId?.startsWith("hist-") ||
              editingDeal?.propertyId?.startsWith("hist-") ||
              !customers.some((c) => c.id === editCustomerId) ? (
                <div className="p-3 bg-purple-50/70 border border-purple-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                    <FileText className="w-3.5 h-3.5 text-purple-700" />
                    <span>Geçmiş Fiziki Arşiv Kaydı (Mevcut portföy ve müşteri havuzundan bağımsızdır)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-mono text-[11px] mb-1 font-semibold">
                        {editDealType === "rent" ? "Kiracı Adı Soyadı *" : "Alıcı Müşteri Adı Soyadı *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={editCustomerName}
                        onChange={(e) => setEditCustomerName(e.target.value)}
                        placeholder="Müşteri Adı Soyadı..."
                        className="sharp-input w-full p-2 bg-white font-medium text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-mono text-[11px] mb-1 font-semibold">
                        Gayrimenkul / Portföy Başlığı veya Adresi *
                      </label>
                      <input
                        type="text"
                        required
                        value={editPropertyTitle}
                        onChange={(e) => setEditPropertyTitle(e.target.value)}
                        placeholder="Gayrimenkul adresi veya başlığı..."
                        className="sharp-input w-full p-2 bg-white font-medium text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              ) : (
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
              )}

              {/* Fiyat, Komisyon ve Kurlar (Kurlar Birbirinden Bağımsızdır) */}
              <div className="p-3 bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-[#1d2566] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span>İşlem Bedeli & Hizmet Bedeli Dağılımı</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Fiyat ile komisyon farklı kurlarda olabilir (örn: Kira 700 GBP, Alınan Komisyon 43.000 TL)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Satış/Kira Fiyatı */}
                  <div className="p-2.5 bg-white border border-slate-200 space-y-1.5">
                    <label className="block text-slate-700 font-mono text-[11px] font-bold">
                      {editDealType === "rent" ? "Kira Bedeli" : "Satış Bedeli"} *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={editPriceCurrency}
                        onChange={(e) => setEditPriceCurrency(e.target.value as Currency)}
                        className="sharp-input w-28 p-2 bg-white font-mono font-bold text-[#1d2566]"
                      >
                        <option value="GBP">GBP (£)</option>
                        <option value="TRY">TRY (₺)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                      <input
                        type="number"
                        required
                        value={editAgreedPrice}
                        onChange={(e) => setEditAgreedPrice(e.target.value)}
                        placeholder="0"
                        className="sharp-input flex-1 p-2 font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Alınan Hizmet Bedeli (Komisyon) */}
                  <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-emerald-900 font-mono text-[11px] font-bold">
                        Tahsil Edilen Komisyon Tutarı *
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const p = Number(editAgreedPrice) || 0;
                            const comm = editDealType === "rent" ? p : Math.round(p * 0.05);
                            setEditCommissionAmount(comm.toString());
                            setEditCurrency(editPriceCurrency);
                            setEditCommissionRate(editDealType === "rent" ? 100 : 5);
                          }}
                          className="text-[9.5px] px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-semibold cursor-pointer"
                          title="Fiyat üzerinden standart komisyon hesapla"
                        >
                          {editDealType === "rent" ? "%100 Hesapla" : "%5 Hesapla"}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={editCurrency}
                        onChange={(e) => setEditCurrency(e.target.value as Currency)}
                        className="sharp-input w-28 p-2 bg-white font-mono font-bold text-emerald-900 border-emerald-300"
                      >
                        <option value="TRY">TRY (₺)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                      <input
                        type="number"
                        required
                        value={editCommissionAmount}
                        onChange={(e) => setEditCommissionAmount(e.target.value)}
                        placeholder="0"
                        className="sharp-input flex-1 p-2 font-mono font-bold text-emerald-950 border-emerald-300 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Portföy Menşei & Standart Komisyon Oranı */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
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
                      Standart Komisyon Oranı
                    </label>
                    <select
                      value={editCommissionRate}
                      onChange={(e) => setEditCommissionRate(Number(e.target.value))}
                      className="sharp-input w-full p-2 bg-white font-mono font-bold"
                    >
                      <option value={100}>%100 (Kiralama Standart - 1 Kira)</option>
                      <option value={5}>%5 (Satış Standart)</option>
                      <option value={1}>%1</option>
                      <option value={2}>%2</option>
                      <option value={3}>%3</option>
                      <option value={4}>%4</option>
                      <option value={10}>%10</option>
                      <option value={15}>%15</option>
                    </select>
                  </div>
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
                      <PhoneInput
                        value={editPartnerPhone}
                        onChange={(val) => setEditPartnerPhone(val)}
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
                  <DateInput
                    value={editPaymentDue}
                    onChange={(val) => setEditPaymentDue(val)}
                    className="w-full"
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

              {/* Fiziki Kağıt Rapor / Arşiv Belgesi Fotoğrafı */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 font-mono text-[11px] font-semibold flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#00adb5]" />
                    Fiziki Kağıt Rapor / Evrak Fotoğrafı
                  </label>
                  {editArchiveUrl && (
                    <button
                      type="button"
                      onClick={() => setViewingArchiveUrl(editArchiveUrl)}
                      className="text-[10px] text-[#00adb5] hover:text-[#008288] underline font-mono cursor-pointer"
                    >
                      Büyük Boyut Görüntüle
                    </button>
                  )}
                </div>
                {editArchiveUrl ? (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200">
                    <img
                      src={editArchiveUrl}
                      alt="Form Evrakı"
                      className="w-12 h-12 object-cover rounded border border-slate-300 shadow-2xs cursor-pointer"
                      onClick={() => setViewingArchiveUrl(editArchiveUrl)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-bold text-slate-800 truncate">
                        {editArchiveName || "Fiziki Form Taraması"}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Fiziki belge sisteme ekli.
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px] font-mono cursor-pointer transition">
                        Değiştir
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              setEditArchiveUrl(reader.result as string);
                              setEditArchiveName(file.name);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setEditArchiveUrl(undefined);
                          setEditArchiveName(undefined);
                        }}
                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                        title="Fotoğrafı Kaldır"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#00adb5]/40 bg-[#00adb5]/5 hover:bg-[#00adb5]/10 text-slate-700 text-xs font-mono cursor-pointer transition">
                    <Camera className="w-4 h-4 text-[#00adb5]" />
                    <span>Fiziki kağıt form fotoğrafı yükle veya bağla</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          setEditArchiveUrl(reader.result as string);
                          setEditArchiveName(file.name);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                )}
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

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs p-3.5 border-t border-slate-200 mt-auto flex justify-end gap-2 -mx-5 -mb-5 z-20">
                <button
                  type="button"
                  onClick={() => setEditingDeal(null)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer text-xs font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="sharp-btn-primary px-5 py-2 font-bold text-white shadow-2xs cursor-pointer text-xs"
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

      {/* İŞLEM SONRASI OFİS RAPORU RESMİ PDF MODALI */}
      {selectedDealForReport && (
        <DealReportModal
          deal={selectedDealForReport}
          onClose={() => setSelectedDealForReport(null)}
        />
      )}
    </div>
  );
}
