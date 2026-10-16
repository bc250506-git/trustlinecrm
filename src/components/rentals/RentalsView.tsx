"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { RentalContract, Currency } from "@/lib/types";
import { KKTC_DISTRICTS, getRegionsByDistrict } from "@/lib/kktcLocations";
import { AddPropertyModal } from "@/components/modals/AddPropertyModal";
import { AddCustomerModal } from "@/components/modals/AddCustomerModal";
import {
  KeyRound,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Upload,
  Download,
  Plus,
  Building,
  Users,
  ShieldCheck,
  UserCheck,
  UserPlus,
  X,
  FileSpreadsheet,
  Trash2,
  Edit3,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { ActionMenu } from "@/components/common/ActionMenu";
import { DeleteConfirmModal } from "@/components/common/DeleteConfirmModal";
import { PhoneInput } from "@/components/common/PhoneInput";
import { formatDateTR, cleanWhatsAppNumber, formatPhoneWithPrefix } from "@/lib/formatters";

export function RentalsView() {
  const {
    rentals,
    isBroker,
    currentUser,
    users,
    properties,
    customers,
    toggleRentalPayment,
    uploadRentalReceipt,
    addRentalContract,
    updateRentalContract,
    deleteRentalContract,
    canManageRental,
    addProperty,
    addCustomer,
    renewRentalContract,
    relistRentalProperty,
    loseRentalProperty,
  } = useStore();

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeReceiptModal, setActiveReceiptModal] = useState<{
    rentalId: string;
    month: number;
    year?: number;
    periodKey?: string;
    monthName: string;
    contract: RentalContract;
    dueDate?: string;
  } | null>(null);

  const [simulatedFileName, setSimulatedFileName] = useState("");

  // Bildirim mesajı (Alt modaldan ekleme yapılınca ana modalda gösterilir)
  const [subNotice, setSubNotice] = useState<string | null>(null);

  // Sub-modal durumları (Standardize Modal Entegrasyonu)
  const [isAddPropertySubModalOpen, setIsAddPropertySubModalOpen] = useState(false);
  const [isAddCustomerSubModalOpen, setIsAddCustomerSubModalOpen] = useState(false);
  const [customerSubModalType, setCustomerSubModalType] = useState<"tenant" | "landlord">("tenant");

  // Yeni Kira Kayıt Form State
  const [formData, setFormData] = useState({
    selectedPropertyId: "",
    propertyTitle: "",
    region: "",
    selectedTenantId: "",
    tenantName: "",
    tenantPhone: "",
    selectedLandlordId: "",
    landlordName: "",
    landlordPhone: "",
    monthlyRent: "",
    currency: "GBP" as Currency,
    dueDay: 5,
    contractStart: "2026-01-01",
    contractEnd: "2026-12-31",
    depositAmount: "",
    assignedToId: currentUser.id,
    notes: "",
  });

  // Sözleşme süresi hesaplama yardımcıları
  const addMonthsToDate = (startDateStr: string, monthsToAdd: number): string => {
    if (!startDateStr) return "";
    const [y, m, d] = startDateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d || 1);
    date.setMonth(date.getMonth() + monthsToAdd);
    date.setDate(date.getDate() - 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDurationInMonths = (startStr?: string, endStr?: string): number => {
    if (!startStr || !endStr) return 0;
    const [y1, m1] = startStr.split("-").map(Number);
    const [y2, m2] = endStr.split("-").map(Number);
    if (!y1 || !m1 || !y2 || !m2) return 0;
    const count = (y2 - y1) * 12 + (m2 - m1) + 1;
    return Math.max(count, 0);
  };

  const formatPeriodRange = (startStr?: string, endStr?: string): string => {
    if (!startStr || !endStr) return "";
    const [y1, m1] = startStr.split("-").map(Number);
    const [y2, m2] = endStr.split("-").map(Number);
    if (!y1 || !m1 || !y2 || !m2) return "";
    const mNames = ["", "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    const duration = (y2 - y1) * 12 + (m2 - m1) + 1;
    return `${duration} Ay (${mNames[m1]} '${String(y1).slice(-2)} - ${mNames[m2]} '${String(y2).slice(-2)})`;
  };

  const TURKISH_MONTHS = [
    { num: 1, name: "Oca", full: "Ocak" },
    { num: 2, name: "Şub", full: "Şubat" },
    { num: 3, name: "Mar", full: "Mart" },
    { num: 4, name: "Nis", full: "Nisan" },
    { num: 5, name: "May", full: "Mayıs" },
    { num: 6, name: "Haz", full: "Haziran" },
    { num: 7, name: "Tem", full: "Temmuz" },
    { num: 8, name: "Ağu", full: "Ağustos" },
    { num: 9, name: "Eyl", full: "Eylül" },
    { num: 10, name: "Eki", full: "Ekim" },
    { num: 11, name: "Kas", full: "Kasım" },
    { num: 12, name: "Ara", full: "Aralık" },
  ];

  // Min ve Max yılları sözleşmelerden dinamik tespit et (en az 2025-2027 kapsar)
  const timelineYears = React.useMemo(() => {
    let minYear = 2025;
    let maxYear = 2027;

    rentals.forEach((r) => {
      if (r.contractStart) {
        const startY = parseInt(r.contractStart.slice(0, 4), 10);
        if (!isNaN(startY) && startY < minYear) minYear = startY;
      }
      if (r.contractEnd) {
        const endY = parseInt(r.contractEnd.slice(0, 4), 10);
        if (!isNaN(endY) && endY > maxYear) maxYear = endY;
      }
    });

    const years: number[] = [];
    for (let y = minYear; y <= maxYear; y++) {
      years.push(y);
    }
    return years;
  }, [rentals]);

  // Zaman çizelgesindeki tüm aylar
  const allTimelineMonths = React.useMemo(() => {
    const list: Array<{
      key: string;
      year: number;
      month: number;
      shortName: string;
      fullName: string;
      label: string;
    }> = [];

    timelineYears.forEach((year) => {
      TURKISH_MONTHS.forEach((m) => {
        const key = `${year}-${String(m.num).padStart(2, "0")}`;
        list.push({
          key,
          year,
          month: m.num,
          shortName: m.name,
          fullName: m.full,
          label: `${m.name} '${String(year).slice(-2)}`,
        });
      });
    });

    return list;
  }, [timelineYears]);

  // Tablo yatay kaydırma referansı ve dinamik kesintisiz scroll takibi
  const tableScrollRef = React.useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [visibleStartMonth, setVisibleStartMonth] = useState<string>("Ocak 2026");
  const [visibleEndMonth, setVisibleEndMonth] = useState<string>("Aralık 2026");

  // Tablo kaydıkça sliderı ve ekranda görünen ay aralığını kesintisiz senkronize et
  const handleTableScroll = () => {
    const el = tableScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll > 0) {
      const progress = Math.min(1, Math.max(0, el.scrollLeft / maxScroll));
      setScrollProgress(progress);

      const monthColWidth = 82;
      const firstVisibleIdx = Math.min(
        allTimelineMonths.length - 1,
        Math.max(0, Math.floor(el.scrollLeft / monthColWidth))
      );
      const visibleCount = Math.floor((el.clientWidth - 365) / monthColWidth) || 8;
      const lastVisibleIdx = Math.min(
        allTimelineMonths.length - 1,
        firstVisibleIdx + visibleCount - 1
      );

      const firstM = allTimelineMonths[firstVisibleIdx];
      const lastM = allTimelineMonths[lastVisibleIdx];
      if (firstM) setVisibleStartMonth(`${firstM.fullName} ${firstM.year}`);
      if (lastM) setVisibleEndMonth(`${lastM.fullName} ${lastM.year}`);
    }
  };

  // Slider hareket ettikçe tabloyu piksel hassasiyetinde akıcı kaydır ("fışşş diye")
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const progress = val / 1000;
    setScrollProgress(progress);
    const el = tableScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    el.scrollLeft = progress * maxScroll;
  };

  // Belirli bir aya yumuşak şekilde atla
  const scrollToMonthKey = (monthKey: string, smooth = true) => {
    const el = tableScrollRef.current;
    if (!el) return;
    const idx = allTimelineMonths.findIndex((m) => m.key === monthKey);
    if (idx >= 0) {
      const monthColWidth = 82;
      // 1 ay öncesini de göstererek görsel bağlam sağla
      const targetScroll = Math.max(0, (idx - 1) * monthColWidth);
      el.scrollTo({ left: targetScroll, behavior: smooth ? "smooth" : "auto" });
    }
  };

  // Ay bazında kaydırma butonu
  const scrollByMonths = (monthDelta: number) => {
    const el = tableScrollRef.current;
    if (!el) return;
    const monthColWidth = 82;
    el.scrollBy({ left: monthDelta * monthColWidth, behavior: "smooth" });
  };

  // İlk açılışta cari aya (Ekim 2026) otomatik ve akıcı şekilde konumlan
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToMonthKey("2026-10", false);
    }, 150);
    return () => clearTimeout(timer);
  }, [allTimelineMonths]);

  // Silme Onay Modalı State
  const [rentalToDelete, setRentalToDelete] = useState<RentalContract | null>(null);

  // Kira Sözleşmesi Düzenleme Modalı State
  const [editingRental, setEditingRental] = useState<RentalContract | null>(null);
  const [editRentalForm, setEditRentalForm] = useState({
    monthlyRent: "",
    currency: "GBP" as Currency,
    dueDay: 5,
    tenantName: "",
    tenantPhone: "",
    landlordName: "",
    landlordPhone: "",
    contractStart: "",
    contractEnd: "",
    depositAmount: "",
    notes: "",
  });

  const handleOpenEditRental = (r: RentalContract) => {
    setEditingRental(r);
    setEditRentalForm({
      monthlyRent: String(r.monthlyRent),
      currency: r.currency,
      dueDay: r.dueDay,
      tenantName: r.tenantName,
      tenantPhone: r.tenantPhone || "",
      landlordName: r.landlordName,
      landlordPhone: r.landlordPhone || "",
      contractStart: r.contractStart,
      contractEnd: r.contractEnd,
      depositAmount: String(r.depositAmount || 0),
      notes: r.notes || "",
    });
  };

  const handleSaveRentalEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRental) return;
    const newRent = Number(editRentalForm.monthlyRent) || editingRental.monthlyRent;
    const newCurrency = editRentalForm.currency;
    const newDueDay = Number(editRentalForm.dueDay) || editingRental.dueDay;

    updateRentalContract(editingRental.id, {
      monthlyRent: newRent,
      currency: newCurrency,
      dueDay: newDueDay,
      tenantName: editRentalForm.tenantName,
      tenantPhone: editRentalForm.tenantPhone,
      landlordName: editRentalForm.landlordName,
      landlordPhone: editRentalForm.landlordPhone,
      contractStart: editRentalForm.contractStart,
      contractEnd: editRentalForm.contractEnd,
      depositAmount: Number(editRentalForm.depositAmount) || 0,
      notes: editRentalForm.notes,
    });
    setEditingRental(null);
  };

  // Body Scroll Lock for Modals
  useEffect(() => {
    if (
      isAddModalOpen ||
      activeReceiptModal ||
      isAddPropertySubModalOpen ||
      isAddCustomerSubModalOpen ||
      rentalToDelete ||
      editingRental
    ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [
    isAddModalOpen,
    activeReceiptModal,
    isAddPropertySubModalOpen,
    isAddCustomerSubModalOpen,
    rentalToDelete,
    editingRental,
  ]);

  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Yalnızca kira tarihine 3 gün veya daha az kala ya da vadesi geçmişse hatırlatma göster
  const getRentalReminderStatus = (r: RentalContract) => {
    const now = currentDate || new Date();
    const currentMonthNum = now.getMonth() + 1; // 1-12
    const currentYearNum = now.getFullYear();
    const currentPeriodKey = `${currentYearNum}-${String(currentMonthNum).padStart(2, "0")}`;
    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Bu aya ait aktif ödemeyi bul
    const currentPayment = r.payments?.find(
      (p) =>
        p.periodKey === currentPeriodKey ||
        (p.dueDate && p.dueDate.startsWith(currentPeriodKey)) ||
        (p.month === currentMonthNum && (!p.year || p.year === currentYearNum))
    );

    // Bu ay ödemesi yapıldıysa veya bu ayda taksit yoksa hatırlatma gerekmez
    if (!currentPayment || currentPayment.status === "paid") {
      return null;
    }

    let dueDateStr = currentPayment.dueDate;
    if (!dueDateStr) {
      const daysInCurrentMonth = new Date(currentYearNum, currentMonthNum, 0).getDate();
      const adjustedDay = Math.min(r.dueDay, daysInCurrentMonth);
      dueDateStr = `${currentYearNum}-${String(currentMonthNum).padStart(2, "0")}-${String(adjustedDay).padStart(2, "0")}`;
    }

    const [y, m, d] = dueDateStr.split("-").map(Number);
    const dueDate = new Date(y, m - 1, d);
    const diffDays = Math.ceil((dueDate.getTime() - todayDateOnly.getTime()) / (1000 * 3600 * 24));

    if (diffDays <= 3) {
      return {
        diffDays,
        isOverdue: diffDays < 0 || currentPayment.status === "overdue",
        dueDateStr,
      };
    }

    return null;
  };

  // Mülk seçildiğinde alanları doldur
  const handleSelectProperty = (propId: string) => {
    if (!propId) {
      setFormData((prev) => ({
        ...prev,
        selectedPropertyId: "",
      }));
      return;
    }
    const prop = properties.find((p) => p.id === propId);
    if (prop) {
      setFormData((prev) => ({
        ...prev,
        selectedPropertyId: prop.id,
        propertyTitle: prop.title,
        region: prop.region || prev.region,
        landlordName: prop.ownerName || prev.landlordName,
        landlordPhone: prop.ownerPhone || prev.landlordPhone,
        monthlyRent:
          prop.listingType === "rent" ? prop.price.toString() : prev.monthlyRent,
        currency: prop.currency || prev.currency,
        depositAmount:
          prop.listingType === "rent"
            ? (prop.price * 2).toString()
            : prev.depositAmount,
      }));
    }
  };

  // Kiracı seçildiğinde alanları doldur
  const handleSelectTenant = (customerId: string) => {
    if (!customerId) {
      setFormData((prev) => ({
        ...prev,
        selectedTenantId: "",
      }));
      return;
    }
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setFormData((prev) => ({
        ...prev,
        selectedTenantId: cust.id,
        tenantName: cust.fullName,
        tenantPhone: cust.phone || prev.tenantPhone,
      }));
    }
  };

  // Ev Sahibi seçildiğinde alanları doldur
  const handleSelectLandlord = (customerId: string) => {
    if (!customerId) {
      setFormData((prev) => ({
        ...prev,
        selectedLandlordId: "",
      }));
      return;
    }
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setFormData((prev) => ({
        ...prev,
        selectedLandlordId: cust.id,
        landlordName: cust.fullName,
        landlordPhone: cust.phone || prev.landlordPhone,
      }));
    }
  };

  // Kira girildiğinde otomatik depozito önerisi (2 kira)
  const handleRentChange = (val: string) => {
    const num = Number(val);
    setFormData((prev) => ({
      ...prev,
      monthlyRent: val,
      depositAmount: !isNaN(num) && num > 0 ? (num * 2).toString() : prev.depositAmount,
    }));
  };

  const handleCreateRental = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.propertyTitle.trim() || !formData.tenantName.trim()) {
      alert("Lütfen portföy başlığı ve kiracı adını doldurun.");
      return;
    }
    const rentAmount = Number(formData.monthlyRent);
    if (isNaN(rentAmount) || rentAmount <= 0) {
      alert("Lütfen geçerli bir aylık kira tutarı girin.");
      return;
    }

    const assignedUser = users.find(
      (u) => u.id === (isBroker ? formData.assignedToId : currentUser.id)
    );

    addRentalContract({
      propertyId: formData.selectedPropertyId || undefined,
      propertyTitle: formData.propertyTitle,
      region: formData.region || "KKTC",
      tenantCustomerId: formData.selectedTenantId || undefined,
      tenantName: formData.tenantName,
      tenantPhone: formData.tenantPhone || "-",
      landlordCustomerId: formData.selectedLandlordId || undefined,
      landlordName: formData.landlordName || "Mülk Sahibi",
      landlordPhone: formData.landlordPhone || "-",
      monthlyRent: rentAmount,
      currency: formData.currency,
      dueDay: Number(formData.dueDay) || 5,
      contractStart: formData.contractStart || "2026-01-01",
      contractEnd: formData.contractEnd || "2026-12-31",
      depositAmount: Number(formData.depositAmount) || rentAmount * 2,
      active: true,
      notes: formData.notes,
      assignedToId: isBroker ? formData.assignedToId : currentUser.id,
      assignedToName: assignedUser ? assignedUser.name : currentUser.name,
    });

    setIsAddModalOpen(false);
  };



  const todayStr = new Date().toISOString().split("T")[0];
  const expiredRentals = rentals.filter((r) => {
    if (r.active === false) return false;
    if (!r.contractEnd) return false;
    return r.contractEnd <= todayStr;
  });
  const visibleExpiredRentals = isBroker
    ? expiredRentals
    : expiredRentals.filter((r) => r.assignedToId === currentUser.id);

  return (
    <div className="space-y-6">
      {/* Üst Bilgi Başlığı */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-emerald-700 font-bold tracking-wider uppercase">
              YILLIK FİNANSAL YÖNETİM
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              {isBroker
                ? `Ofis Geneli (${rentals.length} Sözleşme)`
                : `Kira Takip Defteri (${rentals.length} Sözleşme)`}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1d2566] tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            Kira Takip Matrisi ve Dekont Defteri
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            12 aylık kira tahsilat tablosu, ödeme durumları ve banka dekontları yönetim defteri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono font-bold">
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300">
              Ödendi
            </span>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-300">
              Gecikmiş / Vadesi Gelmiş
            </span>
            <span className="px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200">
              Ödenmedi
            </span>
          </div>

          <button
            onClick={() => {
              setFormData({
                selectedPropertyId: "",
                propertyTitle: "",
                region: "",
                selectedTenantId: "",
                tenantName: "",
                tenantPhone: "",
                selectedLandlordId: "",
                landlordName: "",
                landlordPhone: "",
                monthlyRent: "",
                currency: "GBP",
                dueDay: 5,
                contractStart: "2026-01-01",
                contractEnd: "2026-12-31",
                depositAmount: "",
                assignedToId: currentUser.id,
                notes: "",
              });
              setIsAddModalOpen(true);
            }}
            className="sharp-btn-primary px-3.5 py-2 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kira Sözleşmesi Ekle</span>
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono font-bold flex items-center justify-between animate-in fade-in">
          <span>{actionFeedback}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ⚠️ KİRA SÜRESİ BİTEN KİRALIKLAR UYARI MASASI */}
      {visibleExpiredRentals.length > 0 && (
        <div className="space-y-3">
          <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-none shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 bg-amber-500 text-white shadow-xs">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-amber-950 font-mono tracking-tight">
                  KİRA SÖZLEŞMESİ BİTEN KİRALIKLAR UYARI MASASI ({visibleExpiredRentals.length})
                </h3>
                <p className="text-[11px] text-amber-800 font-mono">
                  Sözleşme süresi dolmuş aktif kiralıklar için aksiyon alınması bekleniyor.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {visibleExpiredRentals.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 bg-white border border-amber-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                      <span className="text-amber-600 font-mono font-bold">⚠️</span>
                      <span className="text-[#1d2566] font-bold">[{r.propertyTitle}]</span>
                      <span className="text-slate-700">kiralığınızın</span>
                      <span className="text-emerald-700 font-bold">[{r.tenantName}]</span>
                      <span className="text-slate-700">ile olan kira sözleşmesi bitmiştir</span>
                      <span className="font-mono text-rose-700 font-bold bg-rose-50 px-2 py-0.5 border border-rose-200">
                        ({r.contractEnd})
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 flex items-center gap-3">
                      <span>Mülk Sahibi: {r.landlordName || "Bilinmiyor"}</span>
                      <span>•</span>
                      <span>Aylık Kira: {r.monthlyRent} {r.currency}</span>
                      <span>•</span>
                      <span>Danışman: {users.find((u) => u.id === r.assignedToId)?.name || "Atanmadı"}</span>
                    </div>
                  </div>

                  {/* 3 Net Aksiyon Butonu */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Aksiyon 1: Sözleşmeyi Yenile (+1 Yıl) */}
                    <button
                      type="button"
                      onClick={() => {
                        const ok = renewRentalContract(r.id);
                        if (ok) {
                          setActionFeedback(
                            `✓ [${r.propertyTitle}] için sözleşme +1 yıl uzatıldı ve ödeme matrisi yeni döneme aktarıldı.`
                          );
                          setTimeout(() => setActionFeedback(null), 5000);
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="Sözleşme başlangıç ve bitişine +1 yıl ekler, matrise 12 yeni ay ekler"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Sözleşmeyi Yenile (+1 Yıl)</span>
                    </button>

                    {/* Aksiyon 2: Yeniden Yayınla (Aktife Al) */}
                    <button
                      type="button"
                      onClick={() => {
                        const ok = relistRentalProperty(r.id);
                        if (ok) {
                          setActionFeedback(
                            `✓ [${r.propertyTitle}] kira takibinden düşürüldü ve portföy 'AVAILABLE' (Aktif) yapılarak canlı ilan havuzuna çekildi.`
                          );
                          setTimeout(() => setActionFeedback(null), 5000);
                        }
                      }}
                      className="px-3 py-1.5 bg-[#00adb5] hover:bg-[#00939a] text-white font-mono font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="Kiracı ayrıldı/tahliye edildi. Portföyü AVAILABLE yaparak canlı ilan havuzuna ve eşleşme motoruna geri yükler."
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Yeniden Yayınla (Aktife Al)</span>
                    </button>

                    {/* Aksiyon 3: Portföy Kaybedildi (Sistemden Kaldır) */}
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `[${r.propertyTitle}] mülk sahibi tarafından geri çekildi veya kaybedildi olarak sistemden tamamen kaldırılsın mı?`
                          )
                        ) {
                          const ok = loseRentalProperty(r.id);
                          if (ok) {
                            setActionFeedback(
                              `✓ [${r.propertyTitle}] ve bağlı kira kaydı sistemden tamamen kaldırıldı.`
                            );
                            setTimeout(() => setActionFeedback(null), 5000);
                          }
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="Mal sahibi portföyü geri çekti veya başka firmaya verdi. Portföyü ve kira kaydını sistemden tamamen kaldırır."
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Portföy Kaybedildi (Sistemden Kaldır)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KESİNTİSİZ ZAMAN ÇİZELGESİ SLIDERI (SADE VE MODERN TASARIM) */}
      {rentals.length > 0 && (
        <div className="sharp-card p-3 bg-white border border-slate-200 shadow-xs mb-3 space-y-2">
          {/* Üst Satır: Görüntülenen Dönem ve Hızlı Yıl / Bugün Butonları */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-[#00adb5]" />
              <span className="font-bold text-[#1d2566]">
                {visibleStartMonth} — {visibleEndMonth}
              </span>
              <span className="text-slate-400 text-[10px]">
                ({allTimelineMonths.length} Ay Kesintisiz Akış)
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {timelineYears.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => scrollToMonthKey(`${year}-01`, true)}
                  className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 hover:text-[#1d2566] border border-slate-300 text-slate-700 text-[11px] font-bold cursor-pointer transition shadow-2xs"
                  title={`${year} yılına atla`}
                >
                  {year}
                </button>
              ))}

              <button
                type="button"
                onClick={() => scrollToMonthKey("2026-10", true)}
                className="px-2.5 py-0.5 bg-[#1d2566] hover:bg-[#151c4f] text-white border border-[#1d2566] text-[11px] font-bold cursor-pointer transition shadow-xs"
                title="Cari aya (Ekim 2026) git"
              >
                🎯 Bugün (Eki &apos;26)
              </button>
            </div>
          </div>

          {/* Sade, Temiz ve Modern Standart Slider Rayı */}
          <div className="flex items-center gap-3 pt-0.5">
            <span className="text-[10px] font-mono text-slate-400 shrink-0 font-semibold">
              {allTimelineMonths[0]?.label}
            </span>

            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min={0}
                max={1000}
                step={1}
                value={Math.round(scrollProgress * 1000)}
                onChange={handleSliderChange}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#00adb5]"
                title="Tabloyu yatayda kaydırmak için sürükleyin"
              />
            </div>

            <span className="text-[10px] font-mono text-slate-400 shrink-0 font-semibold">
              {allTimelineMonths[allTimelineMonths.length - 1]?.label}
            </span>
          </div>
        </div>
      )}

      {/* Yıllık Matris Tablosu VEYA Boş Durum */}
      {rentals.length === 0 ? (
        <div className="sharp-card p-12 text-center border border-dashed border-slate-300 bg-slate-50/50 space-y-3">
          <KeyRound className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-[#1d2566]">
            Henüz Kayıtlı Kira Sözleşmesi Bulunmuyor
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isBroker
              ? "Ofis portföyünde henüz aktif bir kira sözleşmesi kaydı girilmedi. Yeni bir kira takibi başlatmak için yukarıdaki butonu kullanın."
              : "Sorumlu olduğunuz aktif bir kira sözleşmesi bulunmuyor. Yeni bir sözleşme eklemek için yukarıdaki '+ Yeni Kira Sözleşmesi Ekle' butonuna tıklayın."}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="sharp-btn-primary px-4 py-2 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> İlk Kira Sözleşmesini Ekle
          </button>
        </div>
      ) : (
        <div
          ref={tableScrollRef}
          onScroll={handleTableScroll}
          className="sharp-card overflow-x-auto relative scroll-smooth focus:outline-none"
          tabIndex={0}
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3 px-4 min-w-[270px] w-[270px] sticky left-0 bg-slate-50 z-20 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  Mülk & Kiracı / Vade Günü
                </th>
                <th className="py-3 px-3 text-right sticky left-[270px] bg-slate-50 z-20 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] min-w-[95px] w-[95px]">
                  Aylık Kira
                </th>
                {allTimelineMonths.map((m) => {
                  const isCurrentRealMonth =
                    currentDate &&
                    currentDate.getFullYear() === m.year &&
                    currentDate.getMonth() + 1 === m.month;

                  return (
                    <th
                      key={m.key}
                      data-month-key={m.key}
                      className={`py-2 px-1 text-center min-w-[82px] w-[82px] transition border-r border-slate-200/60 ${
                        isCurrentRealMonth
                          ? "bg-cyan-50/90 text-[#00adb5] border-b-2 border-[#00adb5] font-black"
                          : ""
                      }`}
                    >
                      <div className="text-[11px] leading-tight font-bold">{m.shortName}</div>
                      <div className="text-[9px] font-mono opacity-60">{`'${String(m.year).slice(-2)}`}</div>
                    </th>
                  );
                })}
                <th className="py-3 px-2 text-center min-w-[50px] sticky right-0 bg-slate-50 z-20 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rentals.map((r) => {
                const reminderStatus = getRentalReminderStatus(r);
                const startPeriodKey = r.contractStart ? r.contractStart.slice(0, 7) : "";
                const endPeriodKey = r.contractEnd ? r.contractEnd.slice(0, 7) : "";

                return (
                  <tr key={r.id} className="group hover:bg-slate-50/80 transition">
                    {/* Mülk & Kiracı Bilgisi (Sticky Sol) */}
                    <td className="py-3 px-4 sticky left-0 bg-white group-hover:bg-slate-50/95 z-10 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                      <div className="font-bold text-[#1d2566] flex items-center gap-2 flex-wrap">
                        <span>{r.propertyTitle}</span>
                        {isBroker && r.assignedToName && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#1d2566]/5 border border-[#1d2566]/20 text-[#1d2566] font-semibold">
                            {r.assignedToName}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[#00adb5] font-semibold">
                          {r.tenantName}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-600 font-semibold">
                          📅 Her ayın {r.dueDay}. günü
                        </span>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 font-mono text-[10px] font-bold border border-slate-200" title="Sözleşme Süresi">
                          {formatPeriodRange(r.contractStart, r.contractEnd)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Ev Sahibi: {r.landlordName} {r.landlordPhone && r.landlordPhone !== "-" ? `(${r.landlordPhone})` : ""}
                      </div>

                      {reminderStatus ? (
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              const text = encodeURIComponent(
                                `Merhaba ${r.tenantName}, ${r.propertyTitle} mülkünüz için her ayın ${r.dueDay}. günü vadeli ${r.monthlyRent} ${r.currency} kira ödemeniz ${
                                  reminderStatus.isOverdue
                                    ? "vadesi geçmiş durumdadır."
                                    : reminderStatus.diffDays === 0
                                    ? "için bugün son gündür."
                                    : `${reminderStatus.diffDays} gün sonra vadesi dolacaktır.`
                                } Ödeme ve dekont detayları için bu hat üzerinden iletişime geçebilirsiniz. Teşekkür ederiz.`
                              );
                              const phone = cleanWhatsAppNumber(r.tenantPhone);
                              window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
                            }}
                            className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 inline-flex items-center gap-1 cursor-pointer transition shadow-2xs"
                            title="Kiracıya tek tıkla resmi WhatsApp kira hatırlatması gönder"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>
                              WhatsApp Vade Hatırlat{" "}
                              {reminderStatus.isOverdue
                                ? "(Gecikmiş)"
                                : reminderStatus.diffDays === 0
                                ? "(Bugün)"
                                : `(${reminderStatus.diffDays} Gün Kaldı)`}
                            </span>
                          </button>
                          <span className="text-[10px] text-slate-400 font-mono">({formatPhoneWithPrefix(r.tenantPhone) || r.tenantPhone})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-mono">
                          <span>Kiracı İletişim: {r.tenantPhone}</span>
                        </div>
                      )}
                    </td>

                    {/* Aylık Kira Tutarı (Sticky Sol 2) */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#1d2566] whitespace-nowrap sticky left-[270px] bg-white group-hover:bg-slate-50/95 z-10 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                      {r.monthlyRent.toLocaleString("tr-TR")} {r.currency}
                    </td>

                    {/* Dinamik Kesintisiz Zaman Çizelgesi Hücreleri */}
                    {allTimelineMonths.map((m) => {
                      const isContractMonth =
                        Boolean(startPeriodKey && endPeriodKey) &&
                        m.key >= startPeriodKey &&
                        m.key <= endPeriodKey;

                      const isCurrentRealMonth =
                        currentDate &&
                        currentDate.getFullYear() === m.year &&
                        currentDate.getMonth() + 1 === m.month;

                      // Sözleşme dışındaki aylar için boş pasif kutu (—)
                      if (!isContractMonth) {
                        return (
                          <td
                            key={m.key}
                            className={`py-2 px-1 text-center border-r border-slate-100 ${
                              isCurrentRealMonth ? "bg-cyan-50/25" : "bg-slate-50/30"
                            }`}
                          >
                            <div
                              className="h-10 flex items-center justify-center text-slate-300 font-mono text-sm select-none border border-transparent"
                              title={`${r.propertyTitle} — Bu ay (${m.fullName} ${m.year}) sözleşme kapsamında değil`}
                            >
                              —
                            </div>
                          </td>
                        );
                      }

                      // Sözleşme kapsamındaki aktif ay
                      const payment = r.payments?.find(
                        (p) =>
                          p.periodKey === m.key ||
                          (p.dueDate && p.dueDate.startsWith(m.key)) ||
                          (p.month === m.month && (p.year ? p.year === m.year : m.year === 2026))
                      );

                      const isPaid = payment?.status === "paid";
                      const isOverdue = payment?.status === "overdue";
                      const daysInMonth = new Date(m.year, m.month, 0).getDate();
                      const adjustedDay = Math.min(r.dueDay, daysInMonth);
                      const dueDayLabel = `${adjustedDay} ${m.shortName}`;

                      return (
                        <td
                          key={m.key}
                          className={`py-2 px-1 text-center border-r border-slate-100 ${
                            isCurrentRealMonth ? "bg-cyan-50/20" : ""
                          }`}
                        >
                          <div
                            className={`p-1 border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                              isPaid
                                ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold"
                                : isOverdue
                                ? "bg-rose-50 border-rose-300 text-rose-800 font-semibold shadow-xs"
                                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                            }`}
                          >
                            <div className="text-[10px] font-mono leading-none">
                              {dueDayLabel}
                            </div>

                            {/* Ödeme Durumu & Buton */}
                            <div className="flex items-center gap-1 mt-0.5">
                              <input
                                type="checkbox"
                                checked={isPaid}
                                onChange={(e) => {
                                  toggleRentalPayment(
                                    r.id,
                                    m.key,
                                    e.target.checked,
                                    payment?.dueDate
                                  );
                                }}
                                title={
                                  isPaid
                                    ? `${m.fullName} ${m.year}: Ödendi olarak işaretli (Tıkla ve kaldır)`
                                    : `${m.fullName} ${m.year}: Ödendi olarak işaretle`
                                }
                                className="w-3.5 h-3.5 accent-emerald-600 rounded-none cursor-pointer"
                              />

                              {/* Dekont Butonu */}
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveReceiptModal({
                                    rentalId: r.id,
                                    month: m.month,
                                    year: m.year,
                                    periodKey: m.key,
                                    monthName: `${m.fullName} ${m.year}`,
                                    contract: r,
                                    dueDate: payment?.dueDate,
                                  })
                                }
                                title={
                                  payment?.receiptName
                                    ? `Dekont: ${payment.receiptName}`
                                    : `${m.fullName} ${m.year} Dekontu Yükle`
                                }
                                className={`p-0.5 cursor-pointer hover:text-[#1d2566] transition ${
                                  payment?.receiptName
                                    ? "text-[#00adb5]"
                                    : "text-slate-400 hover:text-slate-600"
                                }`}
                              >
                                <FileText className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>
                      );
                    })}

                    {/* İşlem Aksiyonları (Düzenle & Sil) (Sticky Sağ) */}
                    <td className="py-2 px-2 text-center sticky right-0 bg-white group-hover:bg-slate-50/95 z-10 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                      <ActionMenu
                        onEdit={() => handleOpenEditRental(r)}
                        onDelete={() => setRentalToDelete(r)}
                        canEdit={canManageRental(r)}
                        canDelete={canManageRental(r)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* YENİ KİRA SÖZLEŞMESİ EKLE MODAL */}
      {isAddModalOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="sharp-card w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden bg-white border border-slate-300 shadow-2xl my-auto">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#00adb5]" />
                <h3 className="text-sm font-bold text-[#1d2566]">
                  Yeni Kira Takip Kaydı & Sözleşmesi
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRental} className="p-6 space-y-4 text-xs flex-1 overflow-y-auto">
              {/* Alt Modallardan Başarılı Kayıt Bildirimi */}
              {subNotice && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{subNotice}</span>
                </div>
              )}

              {/* 1. MÜLK BİLGİLERİ */}
              <div className="space-y-3 pb-3 border-b border-slate-100">
                <div className="text-[11px] font-mono uppercase font-bold text-[#1d2566] flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>1. Kiralık Portföy Seçimi veya Girişi</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Kayıtlı Portföyden Seç (Otomatik Bilgi Çeker):
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddPropertySubModalOpen(true)}
                      className="px-2 py-0.5 bg-[#00adb5] hover:bg-[#00939a] text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition"
                      title="Mevcut modal kapanmadan portföy ekleyin"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Yeni Portföy Ekle</span>
                    </button>
                  </div>
                  <select
                    value={formData.selectedPropertyId}
                    onChange={(e) => handleSelectProperty(e.target.value)}
                    className="sharp-input w-full p-2 text-xs bg-white"
                  >
                    <option value="">
                      -- Mevcut portföylerden seçin veya aşağıya elle yazın --
                    </option>
                    {properties.filter((p) => !p.deletedAt).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.region || "KKTC"}) - {p.price} {p.currency}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Portföy / Daire Başlığı *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Girne Alsancak 2+1 Lüks Daire"
                      value={formData.propertyTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, propertyTitle: e.target.value })
                      }
                      className="sharp-input w-full p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Bölge / Konum
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Girne / Alsancak"
                      value={formData.region}
                      onChange={(e) =>
                        setFormData({ ...formData, region: e.target.value })
                      }
                      className="sharp-input w-full p-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 2. TARAFLAR (KİRACI & EV SAHİBİ) */}
              <div className="space-y-3 pb-3 border-b border-slate-100">
                <div className="text-[11px] font-mono uppercase font-bold text-[#1d2566] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>2. Sözleşme Tarafları (Kiracı ve Mülk Sahibi)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kiracı */}
                  <div className="p-3 bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-slate-800">
                        Kiracı (Müşteri) *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSubModalType("tenant");
                          setIsAddCustomerSubModalOpen(true);
                        }}
                        className="px-2 py-0.5 bg-[#00adb5] hover:bg-[#00939a] text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition"
                        title="Mevcut modal kapanmadan kiracı müşteri ekleyin"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>+ Yeni Kiracı Ekle</span>
                      </button>
                    </div>
                    <select
                      value={formData.selectedTenantId}
                      onChange={(e) => handleSelectTenant(e.target.value)}
                      className="sharp-input w-full p-1.5 text-xs bg-white"
                    >
                      <option value="">-- Müşteri havuzundan seç --</option>
                      {customers.filter((c) => !c.deletedAt).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.phone || "Tel yok"})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Kiracı Ad Soyad *"
                      value={formData.tenantName}
                      onChange={(e) =>
                        setFormData({ ...formData, tenantName: e.target.value })
                      }
                      className="sharp-input w-full p-1.5 text-xs"
                    />
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-500">Kiracı Telefonu</label>
                      <PhoneInput
                        value={formData.tenantPhone}
                        onChange={(val) => setFormData({ ...formData, tenantPhone: val })}
                      />
                    </div>
                  </div>

                  {/* Ev Sahibi */}
                  <div className="p-3 bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-slate-800">
                        Mülk Sahibi (Ev Sahibi)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSubModalType("landlord");
                          setIsAddCustomerSubModalOpen(true);
                        }}
                        className="px-2 py-0.5 bg-[#00adb5] hover:bg-[#00939a] text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition"
                        title="Mevcut modal kapanmadan ev sahibi müşteri ekleyin"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>+ Yeni Ev Sahibi Ekle</span>
                      </button>
                    </div>
                    <select
                      value={formData.selectedLandlordId}
                      onChange={(e) => handleSelectLandlord(e.target.value)}
                      className="sharp-input w-full p-1.5 text-xs bg-white"
                    >
                      <option value="">-- Müşteri havuzundan seç --</option>
                      {customers
                        .filter((c) => !c.deletedAt && c.category === "SELLER")
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.fullName} ({c.phone || "Tel yok"})
                          </option>
                        ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Mülk Sahibi Ad Soyad"
                      value={formData.landlordName}
                      onChange={(e) =>
                        setFormData({ ...formData, landlordName: e.target.value })
                      }
                      className="sharp-input w-full p-1.5 text-xs"
                    />
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-500">Mülk Sahibi Telefonu</label>
                      <PhoneInput
                        value={formData.landlordPhone}
                        onChange={(val) => setFormData({ ...formData, landlordPhone: val })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. FİNANSAL DETAYLAR */}
              <div className="space-y-3 pb-3 border-b border-slate-100">
                <div className="text-[11px] font-mono uppercase font-bold text-[#1d2566] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>3. Kira Tutarı ve Ödeme Koşulları</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Aylık Kira *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Örn: 850"
                      value={formData.monthlyRent}
                      onChange={(e) => handleRentChange(e.target.value)}
                      className="sharp-input w-full p-2 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Para Birimi
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currency: e.target.value as Currency,
                        })
                      }
                      className="sharp-input w-full p-2 text-xs font-mono bg-white font-bold"
                    >
                      <option value="GBP">GBP (£)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="TRY">TRY (₺)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Kira Vade Günü (Her ayın X. günü) *
                    </label>
                    <select
                      value={formData.dueDay}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dueDay: Number(e.target.value),
                        })
                      }
                      className="sharp-input w-full p-2 text-xs font-mono bg-white font-bold"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          Her ayın {d}. günü {d === 31 ? "(Ay Sonu)" : ""}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      Kira ödemesi her ayın bu gününde tekrarlanır.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Depozito Tutarı
                    </label>
                    <input
                      type="number"
                      placeholder="Örn: 1700"
                      value={formData.depositAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, depositAmount: e.target.value })
                      }
                      className="sharp-input w-full p-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 4. SÖZLEŞME GEÇERLİLİK DÖNEMİ VE DANIŞMAN */}
              <div className="space-y-2 pb-3 border-b border-slate-100">
                <div className="text-[11px] font-mono uppercase font-bold text-[#1d2566] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#00adb5]" />
                    <span>4. Sözleşme Süresi (Yıllık Dönem) & Danışman</span>
                  </div>
                  {/* Hızlı Süre Önayarları */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">Hızlı Süre:</span>
                    {[
                      { label: "+3 Ay", months: 3 },
                      { label: "+6 Ay", months: 6 },
                      { label: "+1 Yıl", months: 12 },
                      { label: "+2 Yıl", months: 24 },
                    ].map((preset) => (
                      <button
                        key={preset.months}
                        type="button"
                        onClick={() => {
                          const start = formData.contractStart || "2026-01-01";
                          const newEnd = addMonthsToDate(start, preset.months);
                          setFormData((prev) => ({ ...prev, contractEnd: newEnd }));
                        }}
                        className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 hover:bg-[#00adb5] hover:text-white border border-slate-300 transition cursor-pointer"
                        title={`${preset.months} aylık süre uygula`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Sözleşme Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      lang="tr-TR"
                      value={formData.contractStart}
                      onChange={(e) =>
                        setFormData({ ...formData, contractStart: e.target.value })
                      }
                      className="sharp-input w-full p-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Sözleşme Bitiş Tarihi (Yenileme Alarmı)
                    </label>
                    <input
                      type="date"
                      lang="tr-TR"
                      value={formData.contractEnd}
                      onChange={(e) =>
                        setFormData({ ...formData, contractEnd: e.target.value })
                      }
                      className="sharp-input w-full p-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Sorumlu Danışman
                    </label>
                    {isBroker ? (
                      <select
                        value={formData.assignedToId}
                        onChange={(e) =>
                          setFormData({ ...formData, assignedToId: e.target.value })
                        }
                        className="sharp-input w-full p-2 text-xs bg-white font-medium"
                      >
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role === "ADMIN" ? "Ofis" : "Danışman"})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-2 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
                        {currentUser.name} (Şahsi Portföy)
                      </div>
                    )}
                  </div>
                </div>

                {/* Dinamik Süre ve Matris Kutu Bilgisi */}
                {formData.contractStart && formData.contractEnd && (
                  <div className="text-[11px] font-mono text-[#00adb5] font-bold flex items-center gap-1.5 bg-cyan-50/70 p-2 border border-cyan-200">
                    <span>⏱️ Seçilen Sözleşme Süresi:</span>
                    <span className="px-1.5 py-0.2 bg-white border border-cyan-300 text-[#1d2566] font-bold">
                      {getDurationInMonths(formData.contractStart, formData.contractEnd)} Ay ({getDurationInMonths(formData.contractStart, formData.contractEnd)} Taksit Matrise Yerleşecek)
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({formatDateTR(formData.contractStart)} — {formatDateTR(formData.contractEnd)})
                    </span>
                  </div>
                )}
              </div>

              {/* 5. NOTLAR */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Özel Notlar (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Banka hesap bilgisi, tahliye taahhütnamesi veya ek protokol notları..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="sharp-input w-full p-2 text-xs"
                />
              </div>

              {/* BUTONLAR */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="sharp-btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sözleşmeyi Kaydet & 12 Ayı Oluştur</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* STANDART PORTFÖY MODALI ENTEGRASYONU */}
        <AddPropertyModal
          isOpen={isAddPropertySubModalOpen}
          onClose={() => setIsAddPropertySubModalOpen(false)}
          initialListingType="rent"
          onSuccess={(newProp) => {
            setFormData((prev) => ({
              ...prev,
              selectedPropertyId: newProp.id,
              propertyTitle: newProp.title,
              region: newProp.region,
              monthlyRent: newProp.price > 0 ? newProp.price.toString() : prev.monthlyRent,
              currency: newProp.currency,
              depositAmount: newProp.price > 0 ? (newProp.price * 2).toString() : prev.depositAmount,
              landlordName: newProp.ownerName || prev.landlordName,
              landlordPhone: newProp.ownerPhone || prev.landlordPhone,
            }));
            setIsAddPropertySubModalOpen(false);
            setSubNotice(`✓ Yeni portföy oluşturuldu ve sözleşmeye seçildi: ${newProp.title}`);
            setTimeout(() => setSubNotice(null), 5000);
          }}
        />

        {/* STANDART MÜŞTERİ MODALI ENTEGRASYONU */}
        <AddCustomerModal
          isOpen={isAddCustomerSubModalOpen}
          onClose={() => setIsAddCustomerSubModalOpen(false)}
          initialCategory={customerSubModalType === "tenant" ? "TENANT" : "SELLER"}
          onSuccess={(newCust) => {
            if (customerSubModalType === "tenant") {
              setFormData((prev) => ({
                ...prev,
                selectedTenantId: newCust.id,
                tenantName: newCust.fullName,
                tenantPhone: newCust.phone || prev.tenantPhone,
              }));
              setSubNotice(`✓ Yeni kiracı müşteri eklendi ve seçildi: ${newCust.fullName}`);
            } else {
              setFormData((prev) => ({
                ...prev,
                selectedLandlordId: newCust.id,
                landlordName: newCust.fullName,
                landlordPhone: newCust.phone || prev.landlordPhone,
              }));
              setSubNotice(`✓ Yeni ev sahibi müşteri eklendi ve seçildi: ${newCust.fullName}`);
            }
            setIsAddCustomerSubModalOpen(false);
            setTimeout(() => setSubNotice(null), 5000);
          }}
        />
      </>
    )}

      {/* DEKONT DEFTERİ MODALI */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="sharp-card w-full max-w-md bg-white border border-slate-300 shadow-2xl">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#00adb5]" />
                <h3 className="text-xs font-bold text-[#1d2566]">
                  Kira Dekont Defteri — {activeReceiptModal.monthName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceiptModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 border border-slate-200 text-[11px] font-mono space-y-1">
                <div>Mülk: {activeReceiptModal.contract.propertyTitle}</div>
                <div>Kiracı: {activeReceiptModal.contract.tenantName}</div>
                <div className="text-[#1d2566] font-bold text-sm">
                  Kira Tutarı:{" "}
                  {activeReceiptModal.contract.monthlyRent.toLocaleString("tr-TR")}{" "}
                  {activeReceiptModal.contract.currency}
                </div>
                {activeReceiptModal.dueDate && (
                  <div className="text-slate-500 text-[10px]">
                    Vade Tarihi: {formatDateTR(activeReceiptModal.dueDate)}
                  </div>
                )}
              </div>

              {/* Yüklü Dekont Durumu */}
              {activeReceiptModal.contract.payments.find(
                (p) =>
                  p.periodKey === activeReceiptModal.periodKey ||
                  (activeReceiptModal.dueDate && p.dueDate === activeReceiptModal.dueDate) ||
                  (p.month === activeReceiptModal.month && (!p.year || p.year === activeReceiptModal.year))
              )?.receiptName ? (
                <div className="p-3 bg-emerald-50 border border-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-mono text-emerald-950 font-bold">
                        {
                          activeReceiptModal.contract.payments.find(
                            (p) =>
                              p.periodKey === activeReceiptModal.periodKey ||
                              (activeReceiptModal.dueDate && p.dueDate === activeReceiptModal.dueDate) ||
                              (p.month === activeReceiptModal.month && (!p.year || p.year === activeReceiptModal.year))
                          )?.receiptName
                        }
                      </div>
                      <div className="text-[10px] text-emerald-700 font-mono">
                        Supabase Storage CDN Üzerinde Kayıtlı
                      </div>
                    </div>
                  </div>
                  <button className="px-2 py-1 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 font-mono text-[10px] font-bold">
                    <Download className="w-3 h-3" /> İndir
                  </button>
                </div>
              ) : (
                <div className="text-slate-500 text-center py-2 font-mono text-[11px]">
                  Bu aya ait henüz bir banka dekontu yüklenmemiş.
                </div>
              )}

              {/* Simüle Dekont Yükleme */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-[11px] font-mono text-slate-600 font-semibold">
                  Yeni Dekont Dosyası Seç (PDF, JPG, PNG):
                </label>
                <input
                  type="text"
                  placeholder="Örn: Garanti_Banka_Dekont_Ekim_2026.pdf"
                  value={simulatedFileName}
                  onChange={(e) => setSimulatedFileName(e.target.value)}
                  className="sharp-input w-full p-2 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveReceiptModal(null)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  Kapat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (simulatedFileName && activeReceiptModal) {
                      uploadRentalReceipt(
                        activeReceiptModal.rentalId,
                        activeReceiptModal.periodKey || activeReceiptModal.month,
                        simulatedFileName,
                        activeReceiptModal.dueDate
                      );
                      setSimulatedFileName("");
                      setActiveReceiptModal(null);
                    }
                  }}
                  className="sharp-btn-primary px-3.5 py-1.5 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Upload className="w-3 h-3" /> Dekontu Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KİRA SÖZLEŞMESİ DÜZENLEME MODALI */}
      {editingRental && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="sharp-card w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-300 bg-white shadow-2xl">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#00adb5]" />
                <h2 className="text-sm font-bold text-[#1d2566]">
                  Kira Sözleşmesini Düzenle
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingRental(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRentalEdit} className="p-5 space-y-4 text-xs flex-1 overflow-y-auto">
              {/* Portföy Bilgisi */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 text-slate-700">
                <span className="text-[10px] text-slate-500 font-mono block">İlgili Portföy:</span>
                <span className="font-bold text-[#1d2566] text-xs">{editingRental.propertyTitle}</span>
              </div>

              {/* Kiracı Bilgileri */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                    Kiracı Adı Soyadı *
                  </label>
                  <input
                    type="text"
                    required
                    value={editRentalForm.tenantName}
                    onChange={(e) =>
                      setEditRentalForm((prev) => ({ ...prev, tenantName: e.target.value }))
                    }
                    className="sharp-input w-full p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                    Kiracı Telefonu
                  </label>
                  <PhoneInput
                    value={editRentalForm.tenantPhone}
                    onChange={(val) =>
                      setEditRentalForm((prev) => ({ ...prev, tenantPhone: val }))
                    }
                  />
                </div>
              </div>

              {/* Mülk Sahibi Bilgileri */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                    Mülk Sahibi Adı Soyadı *
                  </label>
                  <input
                    type="text"
                    required
                    value={editRentalForm.landlordName}
                    onChange={(e) =>
                      setEditRentalForm((prev) => ({ ...prev, landlordName: e.target.value }))
                    }
                    className="sharp-input w-full p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                    Mülk Sahibi Telefonu
                  </label>
                  <PhoneInput
                    value={editRentalForm.landlordPhone}
                    onChange={(val) =>
                      setEditRentalForm((prev) => ({ ...prev, landlordPhone: val }))
                    }
                  />
                </div>
              </div>

              {/* Kira Tutarı, Para Birimi ve Vade Günü */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                    Aylık Kira Tutarı *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editRentalForm.monthlyRent}
                    onChange={(e) =>
                      setEditRentalForm((prev) => ({ ...prev, monthlyRent: e.target.value }))
                    }
                    className="sharp-input w-full p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                    Para Birimi
                  </label>
                  <select
                    value={editRentalForm.currency}
                    onChange={(e) =>
                      setEditRentalForm((prev) => ({
                        ...prev,
                        currency: e.target.value as Currency,
                      }))
                    }
                    className="sharp-input w-full p-2 font-mono bg-white"
                  >
                    <option value="GBP">GBP (£ - Sterlin)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="USD">USD ($ - Dolar)</option>
                    <option value="TRY">TRY (₺ - TL)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                    Kira Vade Günü (Her ayın X. günü) *
                  </label>
                  <select
                    value={editRentalForm.dueDay}
                    onChange={(e) =>
                      setEditRentalForm((prev) => ({
                        ...prev,
                        dueDay: Number(e.target.value) || 5,
                      }))
                    }
                    className="sharp-input w-full p-2 font-mono font-bold bg-white"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Her ayın {d}. günü {d === 31 ? "(Ay Sonu)" : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    Kira ödemesi her ayın seçilen gününde tekrarlanır.
                  </p>
                </div>
              </div>

              {/* Sözleşme Geçerlilik Süresi ve Depozito */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] font-mono text-slate-700 font-bold">
                    Sözleşme Süresi & Depozito
                  </span>
                  {/* Hızlı Süre Önayarları */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">Hızlı Süre:</span>
                    {[
                      { label: "+3 Ay", months: 3 },
                      { label: "+6 Ay", months: 6 },
                      { label: "+1 Yıl", months: 12 },
                      { label: "+2 Yıl", months: 24 },
                    ].map((preset) => (
                      <button
                        key={preset.months}
                        type="button"
                        onClick={() => {
                          const start = editRentalForm.contractStart || "2026-01-01";
                          const newEnd = addMonthsToDate(start, preset.months);
                          setEditRentalForm((prev) => ({ ...prev, contractEnd: newEnd }));
                        }}
                        className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 hover:bg-[#00adb5] hover:text-white border border-slate-300 transition cursor-pointer"
                        title={`${preset.months} aylık süre uygula`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                      Sözleşme Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      lang="tr-TR"
                      value={editRentalForm.contractStart}
                      onChange={(e) =>
                        setEditRentalForm((prev) => ({ ...prev, contractStart: e.target.value }))
                      }
                      className="sharp-input w-full p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                      Sözleşme Bitiş Tarihi (Alarm)
                    </label>
                    <input
                      type="date"
                      lang="tr-TR"
                      value={editRentalForm.contractEnd}
                      onChange={(e) =>
                        setEditRentalForm((prev) => ({ ...prev, contractEnd: e.target.value }))
                      }
                      className="sharp-input w-full p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                      Depozito Tutarı
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editRentalForm.depositAmount}
                      onChange={(e) =>
                        setEditRentalForm((prev) => ({ ...prev, depositAmount: e.target.value }))
                      }
                      className="sharp-input w-full p-2 font-mono"
                    />
                  </div>
                </div>

                {/* Dinamik Süre ve Matris Kutu Bilgisi */}
                {editRentalForm.contractStart && editRentalForm.contractEnd && (
                  <div className="text-[11px] font-mono text-[#00adb5] font-bold flex items-center gap-1.5 bg-cyan-50/70 p-2 border border-cyan-200">
                    <span>⏱️ Seçilen Sözleşme Süresi:</span>
                    <span className="px-1.5 py-0.2 bg-white border border-cyan-300 text-[#1d2566] font-bold">
                      {getDurationInMonths(editRentalForm.contractStart, editRentalForm.contractEnd)} Ay ({getDurationInMonths(editRentalForm.contractStart, editRentalForm.contractEnd)} Taksit Matrise Yerleşecek)
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({formatDateTR(editRentalForm.contractStart)} — {formatDateTR(editRentalForm.contractEnd)})
                    </span>
                  </div>
                )}
              </div>

              {/* Notlar */}
              <div>
                <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                  Sözleşme Notları
                </label>
                <textarea
                  rows={2}
                  value={editRentalForm.notes}
                  onChange={(e) =>
                    setEditRentalForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="sharp-input w-full p-2"
                  placeholder="Ek sözleşme veya tahsilat notları..."
                />
              </div>

              {/* Butonlar */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingRental(null)}
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
        isOpen={!!rentalToDelete}
        title="Kira Sözleşmesini Sil"
        itemName={
          rentalToDelete
            ? `"${rentalToDelete.propertyTitle}" (${rentalToDelete.tenantName})`
            : undefined
        }
        message="Bu kira sözleşmesi ve sözleşmeye ait tüm 12 aylık kira tahsilat/makbuz geçmişi sistemden kalıcı olarak silinecektir."
        onConfirm={() => {
          if (rentalToDelete) {
            deleteRentalContract(rentalToDelete.id);
            setRentalToDelete(null);
          }
        }}
        onCancel={() => setRentalToDelete(null)}
      />
    </div>
  );
}
