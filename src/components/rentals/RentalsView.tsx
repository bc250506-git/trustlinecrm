"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { RentalContract, Currency, Property } from "@/lib/types";
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
  Stamp,
} from "lucide-react";
import { ActionMenu } from "@/components/common/ActionMenu";
import { DeleteConfirmModal } from "@/components/common/DeleteConfirmModal";
import { PhoneInput } from "@/components/common/PhoneInput";
import { DateInput } from "@/components/common/DateInput";
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
    toggleRentalDuesPayment,
    uploadRentalReceipt,
    addRentalContract,
    updateRentalContract,
    deleteRentalContract,
    canManageRental,
    addProperty,
    updateProperty,
    addCustomer,
    renewRentalContract,
    relistRentalProperty,
    loseRentalProperty,
    toggleRentalStamp,
  } = useStore();

  // Kira Sözleşmeleri İzolasyonu: Herkes yalnızca kendininkini (Ofis ve Broker dahil) görür ve yönetir
  const filteredRentals = React.useMemo(() => {
    return rentals.filter((r) => r.active !== false);
  }, [rentals]);

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

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
    hasDues: false,
    duesAmount: "",
    duesCurrency: "TRY" as Currency,
    dueDay: 5,
    contractStart: `${new Date().getFullYear()}-01-01`,
    contractEnd: `${new Date().getFullYear()}-12-31`,
    depositAmount: "",
    assignedToId: currentUser.id,
    paymentPeriod: "monthly" as "monthly" | "quarterly" | "semi_annual" | "annual",
    isStamped: false,
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

  // Min ve Max yılları sözleşmelerden dinamik tespit et (en az 2025-2030 kapsar, sözleşme daha ilerideyse otomatik genişler)
  const minMaxKey = React.useMemo(() => {
    const now = currentDate || new Date();
    const currentYear = now.getFullYear();

    let minYear = 2025;
    // Kullanıcı talebi: 2030'a kadar kesintisiz akış; ayrıca her zaman cari yıl + 3 yıl ilerisini kapsasın
    let maxYear = Math.max(2030, currentYear + 3);

    filteredRentals.forEach((r) => {
      if (r.contractStart) {
        const startY = parseInt(r.contractStart.slice(0, 4), 10);
        if (!isNaN(startY) && startY < minYear) minYear = startY;
      }
      if (r.contractEnd) {
        const endY = parseInt(r.contractEnd.slice(0, 4), 10);
        if (!isNaN(endY) && endY > maxYear) maxYear = endY;
      }
    });

    return `${minYear}-${maxYear}`;
  }, [filteredRentals, currentDate]);

  const timelineYears = React.useMemo(() => {
    const [minY, maxY] = minMaxKey.split("-").map(Number);
    const years: number[] = [];
    for (let y = minY; y <= maxY; y++) {
      years.push(y);
    }
    return years;
  }, [minMaxKey]);

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
  const [stampFilter, setStampFilter] = useState<"ALL" | "STAMPED" | "UNSTAMPED">("ALL");

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

  const hasAutoScrolledRef = React.useRef(false);

  // İlk açılışta cari aya SADECE 1 KEZ dinamik şekilde konumlan (Ödeme işaretlerken başa/sağa atmayı kesinlikle engeller)
  useEffect(() => {
    if (hasAutoScrolledRef.current || allTimelineMonths.length === 0) return;
    const timer = setTimeout(() => {
      if (hasAutoScrolledRef.current) return;
      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      scrollToMonthKey(currentMonthKey, false);
      hasAutoScrolledRef.current = true;
    }, 150);
    return () => clearTimeout(timer);
  }, [allTimelineMonths]);

  // Silme Onay Modalı State
  const [rentalToDelete, setRentalToDelete] = useState<RentalContract | null>(null);

  // Kira Sözleşmesi Düzenleme / Ekleme Ortak State
  const [editingRental, setEditingRental] = useState<RentalContract | null>(null);

  const handleOpenAddRental = () => {
    setEditingRental(null);
    setSubNotice(null);
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
      currency: "GBP" as Currency,
      hasDues: false,
      duesAmount: "",
      duesCurrency: "TRY" as Currency,
      dueDay: 5,
      contractStart: `${new Date().getFullYear()}-01-01`,
      contractEnd: `${new Date().getFullYear()}-12-31`,
      depositAmount: "",
      assignedToId: currentUser.id,
      paymentPeriod: "monthly" as "monthly" | "quarterly" | "semi_annual" | "annual",
      isStamped: false,
      notes: "",
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditRental = (r: RentalContract) => {
    setEditingRental(r);
    setIsAddModalOpen(false);
    setSubNotice(null);

    // Otomatik portföy ve müşteri eşleme (id yoksa başlık/isimden bul - ÖNCE KİRALIK OLANLAR!)
    const matchedProp =
      properties.find(
        (p) =>
          (r.propertyId && p.id === r.propertyId) ||
          (r.propertyTitle &&
            p.title.trim().toLowerCase() === r.propertyTitle.trim().toLowerCase() &&
            p.listingType === "rent")
      ) ||
      properties.find(
        (p) =>
          r.propertyTitle &&
          p.title.trim().toLowerCase() === r.propertyTitle.trim().toLowerCase()
      );
    const matchedTenant = customers.find(
      (c) =>
        (r.tenantCustomerId && c.id === r.tenantCustomerId) ||
        (r.tenantName && c.fullName.trim().toLowerCase() === r.tenantName.trim().toLowerCase())
    );
    const matchedLandlord = customers.find(
      (c) =>
        (r.landlordCustomerId && c.id === r.landlordCustomerId) ||
        (r.landlordName && c.fullName.trim().toLowerCase() === r.landlordName.trim().toLowerCase())
    );

    setFormData({
      selectedPropertyId: r.propertyId || matchedProp?.id || "",
      propertyTitle: r.propertyTitle || "",
      region: r.region || matchedProp?.region || "",
      selectedTenantId: r.tenantCustomerId || matchedTenant?.id || "",
      tenantName: r.tenantName || "",
      tenantPhone: r.tenantPhone || matchedTenant?.phone || "",
      selectedLandlordId: r.landlordCustomerId || matchedLandlord?.id || "",
      landlordName: r.landlordName || matchedLandlord?.fullName || "",
      landlordPhone: r.landlordPhone || matchedLandlord?.phone || "",
      monthlyRent: String(r.monthlyRent || ""),
      currency: r.currency || "GBP",
      hasDues: !!r.hasDues,
      duesAmount: r.duesAmount ? String(r.duesAmount) : "",
      duesCurrency: r.duesCurrency || "TRY",
      dueDay: r.dueDay || 5,
      contractStart: r.contractStart || "",
      contractEnd: r.contractEnd || "",
      depositAmount: String(r.depositAmount || 0),
      assignedToId: r.assignedToId || currentUser.id,
      paymentPeriod: (r.paymentPeriod as any) || "monthly",
      isStamped: !!r.isStamped,
      notes: r.notes || "",
    });
  };

  const handleCloseRentalModal = () => {
    setIsAddModalOpen(false);
    setEditingRental(null);
    setSubNotice(null);
  };

  const handleSaveRentalEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRental) return;

    if (!formData.propertyTitle.trim() || !formData.tenantName.trim()) {
      alert("Lütfen portföy başlığı ve kiracı adını doldurun.");
      return;
    }

    const rentAmount = Number(formData.monthlyRent);
    if (isNaN(rentAmount) || rentAmount <= 0) {
      alert("Lütfen geçerli bir aylık kira tutarı girin.");
      return;
    }

    const hasDues = !!formData.hasDues;
    const duesAmount = hasDues ? Number(formData.duesAmount) || 0 : undefined;
    const duesCurrency = hasDues ? formData.duesCurrency : undefined;

    const assignedUser = users.find(
      (u) => u.id === (isBroker ? formData.assignedToId : (editingRental.assignedToId || currentUser.id))
    );

    const norm = (s?: string) =>
      s ? s.trim().replace(/İ/g, "i").replace(/I/g, "ı").toLocaleLowerCase("tr-TR") : "";
    const formTitleNorm = norm(formData.propertyTitle);

    // KİRALIK PORTFÖY ÇÖZÜMLEME:
    let targetProp: Property | undefined;
    if (formData.selectedPropertyId) {
      const sel = properties.find((p) => p.id === formData.selectedPropertyId);
      if (sel) {
        if (sel.listingType === "rent") {
          targetProp = sel;
        } else {
          // Satılık seçilmişse kiralık eşini bul
          targetProp =
            properties.find(
              (p) =>
                !p.deletedAt &&
                p.listingType === "rent" &&
                (p.linkedPropertyId === sel.id ||
                  sel.linkedPropertyId === p.id ||
                  norm(p.title) === norm(sel.title))
            ) || sel;
        }
      }
    }
    if (!targetProp && formTitleNorm) {
      targetProp =
        properties.find(
          (p) => !p.deletedAt && p.listingType === "rent" && norm(p.title) === formTitleNorm
        ) ||
        properties.find(
          (p) =>
            !p.deletedAt &&
            p.listingType === "rent" &&
            (norm(p.title).includes(formTitleNorm) || formTitleNorm.includes(norm(p.title)))
        ) ||
        properties.find(
          (p) =>
            !p.deletedAt &&
            (norm(p.title) === formTitleNorm || norm(p.title).includes(formTitleNorm))
        );
    }
    const resolvedPropId = targetProp ? targetProp.id : (formData.selectedPropertyId || editingRental.propertyId);
    const resolvedPropTitle = targetProp ? targetProp.title : formData.propertyTitle;

    updateRentalContract(editingRental.id, {
      propertyId: resolvedPropId,
      propertyTitle: resolvedPropTitle,
      region: formData.region || targetProp?.region || editingRental.region,
      tenantCustomerId: formData.selectedTenantId || editingRental.tenantCustomerId,
      tenantName: formData.tenantName,
      tenantPhone: formData.tenantPhone || "-",
      landlordCustomerId: formData.selectedLandlordId || targetProp?.ownerCustomerId || editingRental.landlordCustomerId,
      landlordName: formData.landlordName || targetProp?.ownerName || editingRental.landlordName,
      landlordPhone: formData.landlordPhone || targetProp?.ownerPhone || editingRental.landlordPhone,
      monthlyRent: rentAmount,
      currency: formData.currency,
      hasDues,
      duesAmount,
      duesCurrency,
      dueDay: Number(formData.dueDay) || 5,
      contractStart: formData.contractStart || editingRental.contractStart,
      contractEnd: formData.contractEnd || editingRental.contractEnd,
      depositAmount: Number(formData.depositAmount) || 0,
      paymentPeriod: formData.paymentPeriod,
      isStamped: formData.isStamped,
      stampedAt: formData.isStamped
        ? (editingRental.stampedAt || new Date().toISOString().split("T")[0])
        : undefined,
      notes: formData.notes,
      assignedToId: isBroker ? formData.assignedToId : (editingRental.assignedToId || currentUser.id),
      assignedToName: assignedUser ? assignedUser.name : (editingRental.assignedToName || currentUser.name),
    });

    if (resolvedPropId) {
      const propToUpdate = properties.find((p) => p.id === resolvedPropId);
      if (propToUpdate && propToUpdate.listingType === "rent") {
        updateProperty(resolvedPropId, { status: "RENTED" });
      }
      // GÜVENLİK: Bu mülkün satılık eşi varsa ASLA RENTED kalmasın, aktife (AVAILABLE) al
      const saleTwin = properties.find(
        (p) =>
          !p.deletedAt &&
          p.listingType === "sale" &&
          (p.linkedPropertyId === resolvedPropId ||
            (propToUpdate && propToUpdate.linkedPropertyId === p.id) ||
            (propToUpdate && norm(p.title) === norm(propToUpdate.title)))
      );
      if (saleTwin && saleTwin.status === "RENTED") {
        updateProperty(saleTwin.id, { status: "AVAILABLE" });
      }
    }

    setActionFeedback(`✓ "${resolvedPropTitle}" kira sözleşmesi başarıyla güncellendi.`);
    setTimeout(() => setActionFeedback(null), 5000);

    setEditingRental(null);
    setIsAddModalOpen(false);
  };

  const handleRentalFormSubmit = (e: React.FormEvent) => {
    if (editingRental) {
      handleSaveRentalEdit(e);
    } else {
      handleCreateRental(e);
    }
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

  // Yalnızca aidat tarihine 3 gün veya daha az kala ya da vadesi geçmişse hatırlatma göster
  const getDuesReminderStatus = (r: RentalContract) => {
    if (!r.hasDues || !r.duesAmount) return null;

    const now = currentDate || new Date();
    const currentMonthNum = now.getMonth() + 1; // 1-12
    const currentYearNum = now.getFullYear();
    const currentPeriodKey = `${currentYearNum}-${String(currentMonthNum).padStart(2, "0")}`;
    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const currentPayment = r.payments?.find(
      (p) =>
        p.periodKey === currentPeriodKey ||
        (p.dueDate && p.dueDate.startsWith(currentPeriodKey)) ||
        (p.month === currentMonthNum && (!p.year || p.year === currentYearNum))
    );

    // Bu ay aidat ödemesi yapıldıysa veya taksit yoksa hatırlatma gerekmez
    if (!currentPayment || currentPayment.duesStatus === "paid") {
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
        isOverdue: diffDays < 0 || currentPayment.duesStatus === "overdue",
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
    const norm = (s?: string) =>
      s ? s.trim().replace(/İ/g, "i").replace(/I/g, "ı").toLocaleLowerCase("tr-TR") : "";

    let prop = properties.find((p) => p.id === propId);
    // Eğer satılık bir portföy seçildiyse ve bu mülkün kiralık bir eşi varsa, kira sözleşmesi için kiralık eşi seç
    if (prop && prop.listingType === "sale") {
      const rentTwin = properties.find(
        (p) =>
          !p.deletedAt &&
          p.listingType === "rent" &&
          (p.linkedPropertyId === prop!.id ||
            prop!.linkedPropertyId === p.id ||
            norm(p.title) === norm(prop!.title))
      );
      if (rentTwin) {
        prop = rentTwin;
      }
    }

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

    const norm = (s?: string) =>
      s ? s.trim().replace(/İ/g, "i").replace(/I/g, "ı").toLocaleLowerCase("tr-TR") : "";
    const formTitleNorm = norm(formData.propertyTitle);

    // KİRALIK PORTFÖY ÇÖZÜMLEME:
    let targetProp: Property | undefined;
    if (formData.selectedPropertyId) {
      const sel = properties.find((p) => p.id === formData.selectedPropertyId);
      if (sel) {
        if (sel.listingType === "rent") {
          targetProp = sel;
        } else {
          // Satılık seçilmişse kiralık eşini bul
          targetProp =
            properties.find(
              (p) =>
                !p.deletedAt &&
                p.listingType === "rent" &&
                (p.linkedPropertyId === sel.id ||
                  sel.linkedPropertyId === p.id ||
                  norm(p.title) === norm(sel.title))
            ) || sel;
        }
      }
    }
    if (!targetProp && formTitleNorm) {
      targetProp =
        properties.find(
          (p) => !p.deletedAt && p.listingType === "rent" && norm(p.title) === formTitleNorm
        ) ||
        properties.find(
          (p) =>
            !p.deletedAt &&
            p.listingType === "rent" &&
            (norm(p.title).includes(formTitleNorm) || formTitleNorm.includes(norm(p.title)))
        ) ||
        properties.find(
          (p) =>
            !p.deletedAt &&
            (norm(p.title) === formTitleNorm || norm(p.title).includes(formTitleNorm))
        );
    }
    const resolvedPropId = targetProp ? targetProp.id : (formData.selectedPropertyId || undefined);
    const resolvedPropTitle = targetProp ? targetProp.title : formData.propertyTitle;

    addRentalContract({
      propertyId: resolvedPropId,
      propertyTitle: resolvedPropTitle,
      region: formData.region || targetProp?.region || "KKTC",
      tenantCustomerId: formData.selectedTenantId || undefined,
      tenantName: formData.tenantName,
      tenantPhone: formData.tenantPhone || "-",
      landlordCustomerId: formData.selectedLandlordId || targetProp?.ownerCustomerId || undefined,
      landlordName: formData.landlordName || targetProp?.ownerName || "Mülk Sahibi",
      landlordPhone: formData.landlordPhone || targetProp?.ownerPhone || "-",
      monthlyRent: rentAmount,
      currency: formData.currency,
      hasDues: !!formData.hasDues,
      duesAmount: formData.hasDues ? Number(formData.duesAmount) || 0 : undefined,
      duesCurrency: formData.hasDues ? formData.duesCurrency : undefined,
      dueDay: Number(formData.dueDay) || 5,
      contractStart: formData.contractStart || `${new Date().getFullYear()}-01-01`,
      contractEnd: formData.contractEnd || `${new Date().getFullYear()}-12-31`,
      depositAmount: Number(formData.depositAmount) || rentAmount * 2,
      active: true,
      paymentPeriod: formData.paymentPeriod,
      isStamped: formData.isStamped,
      stampedAt: formData.isStamped ? new Date().toISOString().split("T")[0] : undefined,
      notes: formData.notes,
      assignedToId: isBroker ? formData.assignedToId : currentUser.id,
      assignedToName: assignedUser ? assignedUser.name : currentUser.name,
    });

    if (resolvedPropId) {
      const propToUpdate = properties.find((p) => p.id === resolvedPropId);
      if (propToUpdate && propToUpdate.listingType === "rent") {
        updateProperty(resolvedPropId, { status: "RENTED" });
      }
      // GÜVENLİK KORUMASI: Bu mülkün satılık eşi varsa, satılık eşinin ASLA RENTED kalmadığından emin ol
      const saleTwin = properties.find(
        (p) =>
          !p.deletedAt &&
          p.listingType === "sale" &&
          (p.linkedPropertyId === resolvedPropId ||
            (propToUpdate && propToUpdate.linkedPropertyId === p.id) ||
            (propToUpdate && norm(p.title) === norm(propToUpdate.title)))
      );
      if (saleTwin && saleTwin.status === "RENTED") {
        updateProperty(saleTwin.id, { status: "AVAILABLE" });
      }
    }

    setActionFeedback(
      `✓ Kira sözleşmesi başarıyla oluşturuldu. "${resolvedPropTitle}" portföyü 'KİRALANDI' (Pasif) durumuna çekildi.`
    );
    setTimeout(() => setActionFeedback(null), 5000);

    setIsAddModalOpen(false);
  };



  const todayStr = new Date().toISOString().split("T")[0];
  const expiredRentals = filteredRentals.filter((r) => {
    if (r.active === false) return false;
    if (!r.contractEnd) return false;
    return r.contractEnd <= todayStr;
  });
  const visibleExpiredRentals = expiredRentals;

  const stampedCount = filteredRentals.filter((r) => !!r.isStamped).length;
  const unstampedCount = filteredRentals.length - stampedCount;
  const displayedRentals = filteredRentals
    .filter((r) => {
      if (stampFilter === "STAMPED") return !!r.isStamped;
      if (stampFilter === "UNSTAMPED") return !r.isStamped;
      return true;
    })
    .sort((a, b) => {
      const dayA = Number(a.dueDay) || 5;
      const dayB = Number(b.dueDay) || 5;
      if (dayA !== dayB) return dayA - dayB;
      return (a.propertyTitle || "").localeCompare(b.propertyTitle || "", "tr-TR");
    });

  return (
    <div className="space-y-6">
      {/* Üst Bilgi Başlığı */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-xs text-emerald-700 font-bold tracking-wider uppercase">
              YILLIK FİNANSAL YÖNETİM
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-emerald-800 font-mono font-bold bg-emerald-50 px-2.5 py-0.5 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Şahsi Kira Defteriniz ({filteredRentals.length} Sözleşme)
            </span>
            <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 border border-slate-200">
              🔒 Kira İzolasyonu: Yalnızca kendi kira sözleşmelerinizi görüntülüyorsunuz
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1d2566] tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            Kira Takip Matrisi ve Dekont Defteri
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Sorumlu olduğunuz şahsi kira sözleşmelerinizin 12 aylık kira tahsilat tablosu, ödeme durumları ve banka dekontları defteri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          {/* KKTC Vergi Dairesi Damga Pulu Filtresi */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setStampFilter("ALL")}
              className={`px-2.5 py-1 text-xs font-mono font-bold transition cursor-pointer ${
                stampFilter === "ALL"
                  ? "bg-[#1d2566] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              Tümü ({filteredRentals.length})
            </button>
            <button
              type="button"
              onClick={() => setStampFilter("STAMPED")}
              className={`px-2.5 py-1 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                stampFilter === "STAMPED"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-emerald-700 hover:bg-emerald-100 border border-emerald-300 bg-white"
              }`}
              title="KKTC Vergi Dairesi Pulu Onaylı Sözleşmeleri Filtrele"
            >
              <Stamp className="w-3.5 h-3.5" />
              <span>Pullatıldı ({stampedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStampFilter("UNSTAMPED")}
              className={`px-2.5 py-1 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                stampFilter === "UNSTAMPED"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-amber-800 hover:bg-amber-100 border border-amber-300 bg-white"
              }`}
              title="Henüz pullatılmamış (pul bekleyen) sözleşmeleri filtrele"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Pullatılmadı ({unstampedCount})</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-mono font-bold">
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300">
              Ödendi
            </span>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-300">
              Gecikmiş / Vadesi Gelmiş
            </span>
            <span className="px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200">
              Ödenmedi
            </span>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200">
              🏢 Aidat Takibi
            </span>
          </div>

          <button
            onClick={handleOpenAddRental}
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
      {filteredRentals.length > 0 && (
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

              {(() => {
                const now = currentDate || new Date();
                const curM = TURKISH_MONTHS.find((m) => m.num === now.getMonth() + 1)?.name || "Bugün";
                const curY = String(now.getFullYear()).slice(-2);
                const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
                return (
                  <button
                    type="button"
                    onClick={() => scrollToMonthKey(curKey, true)}
                    className="px-2.5 py-0.5 bg-[#1d2566] hover:bg-[#151c4f] text-white border border-[#1d2566] text-[11px] font-bold cursor-pointer transition shadow-xs"
                    title={`Cari aya (${curM} '${curY}) git`}
                  >
                    🎯 Bugün ({curM} &apos;{curY})
                  </button>
                );
              })()}
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
      {filteredRentals.length === 0 ? (
        <div className="sharp-card p-12 text-center border border-dashed border-slate-300 bg-slate-50/50 space-y-3">
          <KeyRound className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-[#1d2566]">
            Henüz Kayıtlı Kira Sözleşmesi Bulunmuyor
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Sorumlu olduğunuz şahsi bir kira sözleşmesi bulunmuyor. Yeni bir sözleşme eklemek için yukarıdaki '+ Yeni Kira Sözleşmesi Ekle' butonuna tıklayın.
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
                <th className="py-3 px-4 min-w-[300px] w-[300px] sticky left-0 bg-slate-50 z-20 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  Portföy & Sözleşme Detayları
                </th>
                <th className="py-3 px-3 text-right sticky left-[300px] bg-slate-50 z-20 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] min-w-[110px] w-[110px]">
                  Kira / Aidat
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
              {displayedRentals.length === 0 ? (
                <tr>
                  <td colSpan={allTimelineMonths.length + 3} className="py-10 text-center text-slate-500 font-mono text-xs">
                    Seçilen filtreleme kriterine ({stampFilter === "STAMPED" ? "Pullatıldı" : "Pullatılmadı"}) uygun kira sözleşmesi bulunamadı.
                  </td>
                </tr>
              ) : (
                displayedRentals.map((r) => {
                const reminderStatus = getRentalReminderStatus(r);
                const duesReminderStatus = getDuesReminderStatus(r);
                const startPeriodKey = r.contractStart ? r.contractStart.slice(0, 7) : "";
                const endPeriodKey = r.contractEnd ? r.contractEnd.slice(0, 7) : "";

                return (
                  <tr key={r.id} className="group hover:bg-slate-50 transition">
                    {/* Mülk & Sözleşme Bilgisi (Sticky Sol) - Pullatılmış / Pullatılmamış Renk Farkı */}
                    {/* Mülk & Sözleşme Bilgisi (Sticky Sol) - 7 Temel Bilgi */}
                    <td className={`py-3 px-3.5 sticky left-0 z-10 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] bg-white group-hover:bg-slate-50 transition ${
                      r.isStamped
                        ? "border-l-4 border-l-emerald-500"
                        : "border-l-4 border-l-amber-400"
                    }`}>
                      {/* 1. Portföy Adı */}
                      <div className="font-bold text-[#1d2566] text-xs leading-snug line-clamp-1" title={r.propertyTitle}>
                        {r.propertyTitle || "İsimsiz Portföy"}
                      </div>

                      {/* 2. Mal Sahibi & 3. Kiracı */}
                      <div className="mt-1 space-y-0.5 text-[11px] font-mono">
                        <div className="flex items-center gap-1 text-slate-700">
                          <span className="text-slate-400 font-semibold shrink-0">Mal Sahibi:</span>
                          <span className="font-medium text-slate-900 truncate">{r.landlordName || "-"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-700">
                          <span className="text-slate-400 font-semibold shrink-0">Kiracı:</span>
                          <span className="font-semibold text-slate-900 truncate">{r.tenantName || "-"}</span>
                        </div>
                      </div>

                      {/* 4. Sözleşme Tarihleri */}
                      <div className="mt-1 text-[10.5px] font-mono text-slate-600 flex items-center gap-1">
                        <span className="text-slate-400 font-semibold shrink-0">Sözleşme:</span>
                        <span className="font-medium text-slate-800">
                          {formatDateTR(r.contractStart)} - {formatDateTR(r.contractEnd)}
                        </span>
                      </div>

                      {/* Rozetler: 5. Kira Ödeme Tarihi, 6. Ödeme Periyodu, 7. Pul Durumu */}
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                        {/* 5. Kira Ödeme Tarihi */}
                        <span
                          className="text-[9.5px] font-mono font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 inline-flex items-center gap-1 shadow-2xs"
                          title={`Bu mülk için her ayın ${r.dueDay || 5}. gününde kira ödemesi tekrarlanır.`}
                        >
                          <Calendar className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                          <span>Ayın {r.dueDay || 5}. günü</span>
                        </span>

                        {/* 6. Ödeme Periyodu */}
                        <span
                          className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center shadow-2xs"
                          title="Kira Tahsilat Periyodu"
                        >
                          {r.paymentPeriod === "quarterly"
                            ? "3 Aylık Peşin"
                            : r.paymentPeriod === "semi_annual"
                            ? "6 Aylık Peşin"
                            : r.paymentPeriod === "annual"
                            ? "12 Aylık Peşin"
                            : "Aylık"}
                        </span>

                        {/* 7. Pul Durumu (Pullatıldı / Pul Bekliyor Butonu) */}
                        <button
                          type="button"
                          onClick={() => toggleRentalStamp(r.id)}
                          className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 inline-flex items-center gap-1 border transition cursor-pointer shadow-2xs active:scale-95 ${
                            r.isStamped
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                          }`}
                          title={
                            r.isStamped
                              ? `KKTC Vergi Dairesi Damga Pulu ile Pullatıldı ${r.stampedAt ? `(${formatDateTR(r.stampedAt)})` : ""}. Durumu değiştirmek için tıklayın.`
                              : "Bu sözleşme henüz Vergi Dairesi damga pulu ile pullatılmadı! 'Pullatıldı' yapmak için tıklayın."
                          }
                        >
                          <Stamp className={`w-2.5 h-2.5 ${r.isStamped ? "text-emerald-600" : "text-amber-600"} shrink-0`} />
                          <span>{r.isStamped ? "Pullatıldı" : "Pul Bekliyor"}</span>
                        </button>
                      </div>
                    </td>

                    {/* Aylık Kira ve Aidat Tutarı (Sticky Sol 2) */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#1d2566] whitespace-nowrap sticky left-[300px] bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] transition">
                      <div className="text-xs">{r.monthlyRent.toLocaleString("tr-TR")} {r.currency}</div>
                      {r.hasDues && r.duesAmount ? (
                        <div className="text-[10px] font-sans font-semibold text-indigo-700 bg-indigo-50/90 px-1.5 py-0.5 mt-1 border border-indigo-200 inline-block shadow-2xs">
                          Aidat: {r.duesAmount.toLocaleString("tr-TR")} {r.duesCurrency || "TRY"}
                        </div>
                      ) : (
                        <div className="text-[9px] font-sans font-normal text-slate-400 mt-0.5">
                          Aidat: Yok
                        </div>
                      )}
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
                      const isDuesPaid = payment?.duesStatus === "paid";
                      const isDuesOverdue = payment?.duesStatus === "overdue";
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

                            {/* Kira Ödeme Durumu & Buton */}
                            <div className="flex items-center gap-1 mt-0.5" title={`Kira Ödemesi: ${isPaid ? "Ödendi" : isOverdue ? "Gecikmiş" : "Ödenmedi"}`}>
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
                                    ? `${m.fullName} ${m.year}: Kira Ödendi olarak işaretli (Tıkla ve kaldır)`
                                    : `${m.fullName} ${m.year}: Kira Ödendi olarak işaretle`
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

                            {/* Aidat Ödeme Durumu (Kiradan haricen bağımsız işaretlenir) */}
                            {r.hasDues && r.duesAmount ? (
                              <div
                                className={`w-full mt-1 pt-0.5 border-t flex items-center justify-between px-1 text-[9px] font-mono transition ${
                                  isDuesPaid
                                    ? "border-indigo-200 bg-indigo-50/70 text-indigo-900 font-semibold"
                                    : isDuesOverdue
                                    ? "border-rose-300 bg-rose-50 text-rose-800 font-semibold"
                                    : "border-slate-200/80 bg-slate-50/60 text-slate-500"
                                }`}
                                title={
                                  isDuesPaid
                                    ? `${m.fullName}: Aidat Ödendi (${r.duesAmount} ${r.duesCurrency || "TRY"})`
                                    : isDuesOverdue
                                    ? `${m.fullName}: Aidat Vadesi Geçti! (${r.duesAmount} ${r.duesCurrency || "TRY"})`
                                    : `${m.fullName}: Aidat Ödenmedi (${r.duesAmount} ${r.duesCurrency || "TRY"})`
                                }
                              >
                                <span className="font-semibold text-[8px] uppercase tracking-tighter">Aidat</span>
                                <input
                                  type="checkbox"
                                  checked={isDuesPaid}
                                  onChange={(e) => {
                                    toggleRentalDuesPayment(
                                      r.id,
                                      m.key,
                                      e.target.checked,
                                      payment?.dueDate
                                    );
                                  }}
                                  title={
                                    isDuesPaid
                                      ? `${m.fullName} ${m.year}: Aidat ödendi (Kaldırmak için tıkla)`
                                      : `${m.fullName} ${m.year}: Aidat ödendi olarak işaretle`
                                  }
                                  className="w-3 h-3 accent-indigo-600 rounded-none cursor-pointer shrink-0"
                                />
                              </div>
                            ) : null}
                          </div>
                        </td>
                      );
                    })}

                    {/* İşlem Aksiyonları (Düzenle & Sil) (Sticky Sağ) */}
                    <td className="py-2 px-2 text-center sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)] transition">
                      <ActionMenu
                        onEdit={() => handleOpenEditRental(r)}
                        onDelete={() => setRentalToDelete(r)}
                        canEdit={canManageRental(r)}
                        canDelete={canManageRental(r)}
                      />
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      )}

      {/* KİRA SÖZLEŞMESİ OLUŞTURMA & DÜZENLEME MODALI */}
      {(isAddModalOpen || editingRental) && (
        <>
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="sharp-card w-full h-full sm:h-auto sm:max-h-[92vh] max-w-2xl flex flex-col overflow-hidden bg-white border-0 sm:border border-slate-300 shadow-2xl rounded-none sm:rounded-lg sm:my-auto">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
              <div className="flex items-center gap-2">
                {editingRental ? (
                  <Edit3 className="w-4 h-4 text-[#00adb5]" />
                ) : (
                  <KeyRound className="w-4 h-4 text-[#00adb5]" />
                )}
                <div>
                  <h3 className="text-sm font-bold text-[#1d2566]">
                    {editingRental
                      ? "Kira Sözleşmesini Düzenle"
                      : "Yeni Kira Takip Kaydı & Sözleşmesi"}
                  </h3>
                  {editingRental && (
                    <p className="text-[10px] text-slate-500 font-mono">
                      {editingRental.propertyTitle} — {editingRental.tenantName}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseRentalModal}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRentalFormSubmit} className="p-6 space-y-4 text-xs flex-1 overflow-y-auto">
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
                    className="sharp-input w-full p-2 text-xs bg-white font-medium"
                  >
                    <option value="">
                      -- Portföy havuzundan kiralık mülk seçin veya aşağıya elle yazın --
                    </option>
                    <optgroup label="📋 KİRALIK PORTFÖYLER (Öncelikli)">
                      {properties
                        .filter((p) => !p.deletedAt && p.listingType === "rent")
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            [KİRALIK] {p.title} ({p.region || "KKTC"}) - {p.price.toLocaleString("tr-TR")} {p.currency}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="🏢 DİĞER / SATILIK PORTFÖYLER">
                      {properties
                        .filter((p) => !p.deletedAt && p.listingType === "sale")
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            [SATILIK] {p.title} ({p.region || "KKTC"}) - {p.price.toLocaleString("tr-TR")} {p.currency}
                          </option>
                        ))}
                    </optgroup>
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

                {/* KKTC Kira Ödeme Periyodu (Aylık, 3 Aylık, 6 Aylık, 12 Aylık) */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                    Kira Ödeme Periyodu / Tahsilat Şekli *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: "monthly", label: "AYLIK", desc: "Her Ay Düzenli" },
                      { key: "quarterly", label: "3 AYLIK", desc: "3 Ay Peşin Tahsilat" },
                      { key: "semi_annual", label: "6 AYLIK", desc: "6 Ay Peşin Tahsilat" },
                      { key: "annual", label: "12 AYLIK", desc: "12 Ay Yıllık Peşin" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            paymentPeriod: opt.key as any,
                          }))
                        }
                        className={`p-2 text-left border cursor-pointer transition text-xs ${
                          formData.paymentPeriod === opt.key
                            ? "bg-[#1d2566] text-white border-[#1d2566] shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <div className="font-mono font-bold">{opt.label}</div>
                        <div
                          className={`text-[10px] ${
                            formData.paymentPeriod === opt.key ? "text-cyan-200" : "text-slate-500"
                          }`}
                        >
                          {opt.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                  {formData.paymentPeriod !== "monthly" && (
                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Peşin Tahsilat Kuralı:</strong> Sözleşme oluşturulduğunda ilk{" "}
                        {formData.paymentPeriod === "quarterly"
                          ? "3"
                          : formData.paymentPeriod === "semi_annual"
                          ? "6"
                          : "12"}{" "}
                        ay otomatik olarak &quot;Ödendi&quot; olarak işaretlenecek, sözleşme kira takip çizelgesinde aktif olarak izlenmeye devam edecektir.
                      </span>
                    </div>
                  )}
                </div>

                {/* Aidat Ödemesi (Bina / Site Yönetim Aidatı) */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="hasDuesAdd"
                      checked={!!formData.hasDues}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hasDues: e.target.checked,
                          duesAmount: e.target.checked ? prev.duesAmount : "",
                        }))
                      }
                      className="w-4 h-4 accent-[#00adb5] rounded-none cursor-pointer"
                    />
                    <label
                      htmlFor="hasDuesAdd"
                      className="text-xs font-semibold text-slate-800 cursor-pointer flex items-center gap-1.5"
                    >
                      <Building className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Aidat Ödemesi Var mı? (Site / Bina Aidatı)</span>
                    </label>
                  </div>

                  {formData.hasDues && (
                    <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
                      <div>
                        <label className="block text-[11px] font-semibold text-indigo-950 mb-1">
                          Aylık Aidat Tutarı *
                        </label>
                        <input
                          type="number"
                          placeholder="Örn: 1500"
                          value={formData.duesAmount}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              duesAmount: e.target.value,
                            }))
                          }
                          className="sharp-input w-full p-2 text-xs font-mono font-bold bg-white"
                          required={formData.hasDues}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-indigo-950 mb-1">
                          Aidat Para Birimi
                        </label>
                        <select
                          value={formData.duesCurrency || "TRY"}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              duesCurrency: e.target.value as Currency,
                            }))
                          }
                          className="sharp-input w-full p-2 text-xs font-mono bg-white font-bold"
                        >
                          <option value="TRY">TRY (₺) - KKTC Standart</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="USD">USD ($)</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2 text-[10px] text-indigo-800 font-mono">
                        ℹ️ Aidat tutarı kira bedelinin altında listelenecek ve her ay kiradan bağımsız olarak &quot;Ödendi / Ödenmedi&quot; olarak takip edilecektir.
                      </div>
                    </div>
                  )}
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
                          const start = formData.contractStart || `${new Date().getFullYear()}-01-01`;
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
                    <DateInput
                      value={formData.contractStart}
                      onChange={(val) =>
                        setFormData({ ...formData, contractStart: val })
                      }
                      className="w-full text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Sözleşme Bitiş Tarihi (Yenileme Alarmı)
                    </label>
                    <DateInput
                      value={formData.contractEnd}
                      onChange={(val) =>
                        setFormData({ ...formData, contractEnd: val })
                      }
                      className="w-full text-xs font-mono"
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
                      <div className="sharp-input w-full p-2 bg-slate-100 border border-slate-300 text-slate-700 text-xs font-mono font-semibold flex items-center justify-between cursor-not-allowed select-none">
                        <span className="truncate">{users.find((u) => u.id === formData.assignedToId)?.name || currentUser.name}</span>
                        <span className="text-[10px] text-slate-500 font-normal shrink-0 ml-1">🔒 Kilitli</span>
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

              {/* KKTC Vergi Dairesi Damga Pulu */}
              <div className="p-3 bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-[#1d2566] text-xs flex items-center gap-1.5">
                    <Stamp className="w-4 h-4 text-emerald-600" />
                    <span>KKTC Vergi Dairesi Damga Pulu (Pullatıldı)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sözleşme vergi dairesinde resmi damga pulu yapıştırılarak onaylatıldı mı?
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                  <input
                    type="checkbox"
                    checked={formData.isStamped}
                    onChange={(e) => setFormData({ ...formData, isStamped: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer rounded-none"
                  />
                  <span className={formData.isStamped ? "text-emerald-700 font-bold" : "text-slate-600"}>
                    {formData.isStamped ? "✓ Pullatıldı" : "Pullatılmadı"}
                  </span>
                </label>
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
                  onClick={handleCloseRentalModal}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="sharp-btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {editingRental ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Değişiklikleri Kaydet</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Sözleşmeyi Kaydet & 12 Ayı Oluştur</span>
                    </>
                  )}
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-0 sm:p-4">
          <div className="sharp-card w-full max-w-md bg-white border-0 sm:border border-slate-300 shadow-2xl rounded-none sm:rounded-lg">
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
                  placeholder={`Örn: Garanti_Banka_Dekont_${activeReceiptModal?.monthName?.replace(/\s+/g, "_") || "Dekont"}.pdf`}
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
