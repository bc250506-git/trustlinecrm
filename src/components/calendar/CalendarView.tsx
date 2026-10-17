"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useStore } from "@/lib/store";
import { FollowUp } from "@/lib/types";
import {
  formatFollowUpKind,
  combineLocalDateAndTimeToIso,
  extractLocalDateAndTime,
  formatFollowUpTime,
} from "@/lib/formatters";
import {
  CalendarDays,
  Plus,
  Clock,
  Phone,
  MessageSquare,
  CheckCircle2,
  Calendar as CalendarIcon,
  X,
  User,
  Building,
  Trash2,
  Edit3,
  Users,
  Megaphone,
  Sparkles,
  RotateCcw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ActionMenu } from "@/components/common/ActionMenu";
import { DeleteConfirmModal } from "@/components/common/DeleteConfirmModal";
import { AddFollowUpModal } from "@/components/modals/AddFollowUpModal";
import { BoxedDateNavigator } from "@/components/common/BoxedDateNavigator";
import { DateInput } from "@/components/common/DateInput";

// Ay listesi şablonu (Geçmiş ve Cari Yıl + Gelecek Aylar)
const CALENDAR_MONTH_OPTIONS = [
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
  { key: "2027-01", label: "Ocak 2027", short: "Oca 27" },
  { key: "2027-02", label: "Şubat 2027", short: "Şub 27" },
  { key: "2027-03", label: "Mart 2027", short: "Mar 27" },
];

export function CalendarView() {
  const {
    followUps,
    addFollowUp,
    updateFollowUp,
    postponeFollowUp,
    completeFollowUp,
    deleteFollowUp,
    canManageFollowUp,
    customers,
    myCustomers,
    properties,
    myProperties,
    currentUser,
    isBroker,
  } = useStore();

  const activeCustomers = isBroker ? customers : myCustomers;
  const activeProperties = isBroker ? properties : myProperties;

  // === FİLTRE STATELERİ ===
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKind, setFilterKind] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("open"); // open | done | ALL
  const [periodFilter, setPeriodFilter] = useState<
    "ALL" | "TODAY" | "1W" | "1M" | "3M" | "6M" | "12M" | "CUSTOM_DATE" | "MONTH"
  >("ALL");
  const [selectedDate, setSelectedDate] = useState<string>(""); // YYYY-MM-DD (Spesifik gün seçimi)
  const [selectedMonth, setSelectedMonth] = useState<string>(""); // YYYY-MM (Ay seçimi)

  // Yanlışlıkla Tamamlama için Hızlı Geri Al Bildirimi
  const [lastCompletedTask, setLastCompletedTask] = useState<FollowUp | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Silme Onay Modalı State
  const [followUpToDelete, setFollowUpToDelete] = useState<FollowUp | null>(null);

  // Görev Düzenleme Modalı State
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [editFormTitle, setEditFormTitle] = useState("");
  const [editFormKind, setEditFormKind] = useState<
    "call" | "meeting" | "showing" | "office_event" | "other"
  >("showing");
  const [editFormDate, setEditFormDate] = useState("");
  const [editFormTime, setEditFormTime] = useState("");
  const [editFormStatus, setEditFormStatus] = useState<"open" | "done" | "cancelled">("open");
  const [editFormFeedback, setEditFormFeedback] = useState("");

  const handleOpenEditFollowUp = (t: FollowUp) => {
    setEditingFollowUp(t);
    setEditFormTitle(t.title);
    setEditFormKind(t.kind);
    const { date: datePart, time: timePart } = extractLocalDateAndTime(t.dueAt);
    setEditFormDate(datePart);
    setEditFormTime(timePart);
    setEditFormStatus(t.status);
    setEditFormFeedback(t.feedback || "");
  };

  const handleSaveFollowUpEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFollowUp) return;
    updateFollowUp(editingFollowUp.id, {
      title: editFormTitle,
      kind: editFormKind,
      dueAt: combineLocalDateAndTimeToIso(editFormDate, editFormTime),
      status: editFormStatus,
      feedback: editFormFeedback,
    });
    setEditingFollowUp(null);
  };

  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    if (isAddModalOpen || editingFollowUp || followUpToDelete) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isAddModalOpen, editingFollowUp, followUpToDelete]);

  // Yardımcı Tarih Fonksiyonları
  const getTaskDateStr = (f: FollowUp): string => {
    return f.dueAt ? f.dueAt.split("T")[0] : "";
  };

  const getTaskMonthKey = (f: FollowUp): string => {
    if (!f.dueAt) return "";
    const d = new Date(f.dueAt);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  // Ay şeridindeki her ayın toplam görev sayıları
  const monthCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    followUps.forEach((f) => {
      const key = getTaskMonthKey(f);
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [followUps]);

  // Bugün ve Yarın Stringleri
  const now = currentDate || new Date();
  const todayStr = now.toISOString().split("T")[0];
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Geri Alma (Tamamlandı -> Açık / Tamamlanmadı)
  const handleReopenTask = (id: string) => {
    updateFollowUp(id, {
      status: "open",
      outcome: "pending",
    });
    if (lastCompletedTask?.id === id) {
      setLastCompletedTask(null);
    }
  };

  // Görevi Tamamla
  const handleCompleteTask = (t: FollowUp) => {
    completeFollowUp(t.id, "attended", "Görüşme tamamlandı.");
    setLastCompletedTask(t);
  };

  // Cari Ay Anahtarı (YYYY-MM)
  const currentMonthKey = useMemo(() => {
    const d = currentDate || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, [currentDate]);

  // Gün Değiştirme Fonksiyonları (Sağlı Sollu Ok)
  const handlePrevDay = () => {
    const base = selectedDate
      ? new Date(selectedDate + "T12:00:00")
      : new Date((currentDate || new Date()).getTime());
    base.setDate(base.getDate() - 1);
    const newStr = base.toISOString().split("T")[0];
    setSelectedDate(newStr);
    setPeriodFilter("CUSTOM_DATE");
    setSelectedMonth("");
  };

  const handleNextDay = () => {
    const base = selectedDate
      ? new Date(selectedDate + "T12:00:00")
      : new Date((currentDate || new Date()).getTime());
    base.setDate(base.getDate() + 1);
    const newStr = base.toISOString().split("T")[0];
    setSelectedDate(newStr);
    setPeriodFilter("CUSTOM_DATE");
    setSelectedMonth("");
  };

  const handleGoToday = () => {
    setSelectedDate(todayStr);
    setPeriodFilter("CUSTOM_DATE");
    setSelectedMonth("");
  };

  const handleGoTomorrow = () => {
    setSelectedDate(tomorrowStr);
    setPeriodFilter("CUSTOM_DATE");
    setSelectedMonth("");
  };

  const handleClearDay = () => {
    setSelectedDate("");
    setPeriodFilter("ALL");
  };

  // Ay Filtresi Fonksiyonları (Sağlı Sollu Ok)
  const handlePrevMonth = () => {
    const baseKey = selectedMonth || currentMonthKey;
    const [y, m] = baseKey.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(prevKey);
    setPeriodFilter("MONTH");
    setSelectedDate("");
  };

  const handleNextMonth = () => {
    const baseKey = selectedMonth || currentMonthKey;
    const [y, m] = baseKey.split("-").map(Number);
    const nextDate = new Date(y, m, 1);
    const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(nextKey);
    setPeriodFilter("MONTH");
    setSelectedDate("");
  };

  const handleGoThisMonth = () => {
    setSelectedMonth(currentMonthKey);
    setPeriodFilter("MONTH");
    setSelectedDate("");
  };

  const handleClearMonth = () => {
    setSelectedMonth("");
    setPeriodFilter("ALL");
  };

  // Gün Gösterim Metni
  const dayDisplayText = useMemo(() => {
    if (!selectedDate) return "TÜM GÜNLER";
    try {
      const d = new Date(selectedDate + "T12:00:00");
      return d.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).toLocaleUpperCase("tr-TR");
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

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

  // Seçili güne ait görev sayısı
  const selectedDayCount = useMemo(() => {
    if (!selectedDate) return null;
    return followUps.filter((f) => getTaskDateStr(f) === selectedDate).length;
  }, [followUps, selectedDate]);

  // Gelişmiş Filtreleme Mantığı
  const filteredTasks = useMemo(() => {
    return followUps.filter((f) => {
      // 1. Arama sorgusu
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = f.title.toLowerCase().includes(q);
        const matchCustomer = f.customerName?.toLowerCase().includes(q);
        const matchProp = f.propertyTitle?.toLowerCase().includes(q);
        const matchAdvisor = f.assignedToName?.toLowerCase().includes(q);
        if (!matchTitle && !matchCustomer && !matchProp && !matchAdvisor) {
          return false;
        }
      }

      // 2. Tür Filtresi
      if (filterKind !== "ALL") {
        if (filterKind === "office_event") {
          if (!f.isOfficeEvent && f.kind !== "office_event") return false;
        } else if (f.kind !== filterKind) {
          return false;
        }
      }

      // 3. Durum Filtresi (open, done, ALL)
      if (filterStatus !== "ALL" && f.status !== filterStatus) {
        return false;
      }

      // 4. Gün / Ay / Dönem Tarih Filtresi
      if (selectedDate) {
        // Belirli gün seçildiyse (Gün seçme kutusu)
        if (getTaskDateStr(f) !== selectedDate) return false;
      } else if (selectedMonth) {
        // Belirli ay seçildiyse (Ay şeridi)
        if (getTaskMonthKey(f) !== selectedMonth) return false;
      } else if (periodFilter !== "ALL") {
        const taskDate = new Date(f.dueAt);
        const taskDateStr = getTaskDateStr(f);

        if (periodFilter === "TODAY") {
          if (taskDateStr !== todayStr) return false;
        } else if (periodFilter === "1W") {
          // 1 Hafta: Son 1 gün ve gelecek 7 gün
          const diffDays = (taskDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
          if (diffDays < -1 || diffDays > 7) return false;
        } else if (periodFilter === "1M") {
          // 1 Ay: Son 2 gün ve gelecek 30 gün
          const diffDays = (taskDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
          if (diffDays < -2 || diffDays > 30) return false;
        } else if (periodFilter === "3M") {
          // 3 Ay: Gelecek 90 gün
          const diffDays = (taskDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
          if (diffDays < -5 || diffDays > 90) return false;
        } else if (periodFilter === "6M") {
          // 6 Ay: Gelecek 180 gün
          const diffDays = (taskDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
          if (diffDays < -10 || diffDays > 180) return false;
        } else if (periodFilter === "12M") {
          // 12 Ay: Gelecek 365 gün
          const diffDays = (taskDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
          if (diffDays < -30 || diffDays > 365) return false;
        }
      }

      return true;
    });
  }, [
    followUps,
    filterKind,
    filterStatus,
    searchQuery,
    periodFilter,
    selectedDate,
    selectedMonth,
    now,
    todayStr,
  ]);

  // Kronolojik Sıralama (Yakından Uzağa)
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort(
      (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    );
  }, [filteredTasks]);

  const hasActiveFilter =
    searchQuery.trim() !== "" ||
    filterKind !== "ALL" ||
    filterStatus !== "open" ||
    periodFilter !== "ALL" ||
    selectedDate !== "" ||
    selectedMonth !== "";

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterKind("ALL");
    setFilterStatus("open");
    setPeriodFilter("ALL");
    setSelectedDate("");
    setSelectedMonth("");
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#00adb5] font-bold tracking-wider uppercase">
              AJANDA & GÖREV PLANLAYICI
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              Randevu, Takvim ve Yer Gösterme Yönetimi
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1d2566] tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#00adb5]" />
            Ajanda ve Takip Programı
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Yer göstermeleri, telefon aramalarını ve müşteri randevularını yönetin; gün ve dönem bazlı filtreleyin.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="sharp-btn-primary px-4 py-2 text-xs flex items-center gap-2 cursor-pointer self-start md:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Randevu / Arama Planla</span>
        </button>
      </div>

      {/* Gelişmiş Filtreleme Paneli (İşlemler / Finans Sekmesi Mimarisi) */}
      <div className="sharp-card p-4 space-y-4">
        {/* 1. Üst Satır: Arama Kutusu, Tür ve Durum Filtreleri */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
          {/* Arama Inputu */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Randevu, müşteri, mülk veya danışman ara..."
              className="sharp-input w-full pl-9 pr-3 py-1.5 font-mono text-xs bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tür Filtresi */}
            <div className="flex items-center bg-slate-100 border border-slate-200 p-0.5">
              {[
                { id: "ALL", label: "Tüm Türler" },
                { id: "showing", label: "Yer Gösterme" },
                { id: "meeting", label: "Görüşme" },
                { id: "call", label: "Arama" },
                { id: "office_event", label: "Ofis Etkinlikleri" },
                { id: "other", label: "Diğer" },
              ].map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setFilterKind(k.id)}
                  className={`px-2.5 py-1 text-[11px] font-mono transition cursor-pointer ${
                    filterKind === k.id
                      ? "bg-[#1d2566] text-white font-bold shadow-2xs"
                      : "text-slate-600 hover:text-[#1d2566]"
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>

            {/* Durum Filtresi */}
            <div className="flex items-center bg-slate-100 border border-slate-200 p-0.5">
              {[
                { id: "open", label: "Açık / Bekleyen" },
                { id: "done", label: "Tamamlananlar" },
                { id: "ALL", label: "Tümü" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setFilterStatus(s.id)}
                  className={`px-2.5 py-1 text-[11px] font-mono transition cursor-pointer ${
                    filterStatus === s.id
                      ? "bg-slate-200 text-[#1d2566] font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Tarih & Zaman Gezginleri (Gün Değişimi ve Ay Filtresi - Sağlı Sollu Ok Kutuları) */}
        <div className="pt-2 border-t border-slate-200 flex flex-col gap-3">
          {/* Üst Satır: Hızlı Dönemler */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 border border-slate-200 shrink-0">
              <span className="text-[11px] font-mono text-slate-500 px-2 font-bold uppercase hidden sm:inline">
                Dönem:
              </span>
              {[
                { id: "ALL", label: "Tümü" },
                { id: "TODAY", label: "Bugün" },
                { id: "1W", label: "1 Hafta" },
                { id: "1M", label: "1 Ay" },
                { id: "3M", label: "3 Ay" },
                { id: "6M", label: "6 Ay" },
                { id: "12M", label: "12 Ay" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setPeriodFilter(item.id as any);
                    setSelectedDate("");
                    setSelectedMonth("");
                  }}
                  className={`px-2.5 py-1 text-xs font-mono transition cursor-pointer ${
                    periodFilter === item.id && !selectedDate && !selectedMonth
                      ? "bg-[#00adb5] text-white font-bold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alt Satır: Gün Değiştirme ve Ay Filtresi (Sağlı Sollu Ok Kutuları) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-0.5">
            {/* GÜN DEĞİŞTİRME KUTUSU (Sağlı Sollu Ok ve Ortada İşaretli Gün) */}
            <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50/80 border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#1d2566] shrink-0">
                <CalendarIcon className="w-3.5 h-3.5 text-[#00adb5]" />
                <span>Gün Değişimi:</span>
              </div>

              {/* Sağlı Sollu Ok ve Ortada İşaretli Gün Kutusu */}
              <BoxedDateNavigator
                label={dayDisplayText}
                onPrev={handlePrevDay}
                onNext={handleNextDay}
                prevTitle="Önceki Gün"
                nextTitle="Sonraki Gün"
                badge={
                  selectedDayCount !== null ? (
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#00adb5]/10 text-[#00adb5] border border-[#00adb5]/30 font-bold font-mono">
                      {selectedDayCount}
                    </span>
                  ) : undefined
                }
              />

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleGoToday}
                  className={`px-2.5 py-1.5 text-xs font-mono border transition cursor-pointer font-bold ${
                    selectedDate === todayStr
                      ? "bg-[#1d2566] text-white border-[#1d2566]"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                  }`}
                  title="Bugünün randevularına git"
                >
                  Bugün
                </button>
                <button
                  type="button"
                  onClick={handleGoTomorrow}
                  className={`px-2 py-1.5 text-xs font-mono border transition cursor-pointer ${
                    selectedDate === tomorrowStr
                      ? "bg-[#1d2566] text-white border-[#1d2566] font-bold"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                  }`}
                  title="Yarına git"
                >
                  Yarın
                </button>

                {selectedDate && (
                  <button
                    type="button"
                    onClick={handleClearDay}
                    className="p-1.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-500 hover:text-rose-600 cursor-pointer transition flex items-center gap-1 text-xs font-mono"
                    title="Seçili günü temizle (Tüm günleri göster)"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Tüm Günler</span>
                  </button>
                )}
              </div>
            </div>

            {/* AY FİLTRESİ KUTUSU (Sağlı Sollu Ok ve Ortada İşaretli Ay) */}
            <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50/80 border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#1d2566] shrink-0">
                <CalendarDays className="w-3.5 h-3.5 text-[#00adb5]" />
                <span>Ay Filtresi:</span>
              </div>

              {/* Sağlı Sollu Ok ve Ortada İşaretli Ay Kutusu */}
              <BoxedDateNavigator
                label={monthDisplayText}
                onPrev={handlePrevMonth}
                onNext={handleNextMonth}
                prevTitle="Önceki Ay"
                nextTitle="Sonraki Ay"
                badge={
                  selectedMonth && monthCounts[selectedMonth] !== undefined ? (
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#00adb5]/10 text-[#00adb5] border border-[#00adb5]/30 font-bold font-mono">
                      {monthCounts[selectedMonth]}
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
        </div>

        {/* 4. Aktif Filtre Bilgilendirme ve Sıfırlama */}
        {hasActiveFilter && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs font-mono">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500 font-bold flex items-center gap-1">
                <Filter className="w-3 h-3 text-[#00adb5]" />
                Aktif Filtreler:
              </span>
              {selectedDate && (
                <span className="px-2 py-0.5 bg-[#00adb5]/10 text-[#00adb5] border border-[#00adb5]/30 flex items-center gap-1 font-semibold">
                  Seçili Gün:{" "}
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate("");
                      setPeriodFilter("ALL");
                    }}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedMonth && (
                <span className="px-2 py-0.5 bg-[#1d2566]/10 text-[#1d2566] border border-[#1d2566]/20 flex items-center gap-1 font-semibold">
                  Ay:{" "}
                  {CALENDAR_MONTH_OPTIONS.find((m) => m.key === selectedMonth)?.label ||
                    selectedMonth}
                  <button
                    type="button"
                    onClick={() => setSelectedMonth("")}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {periodFilter !== "ALL" && !selectedDate && !selectedMonth && (
                <span className="px-2 py-0.5 bg-[#00adb5]/10 text-[#00adb5] border border-[#00adb5]/30 flex items-center gap-1 font-semibold">
                  Dönem:{" "}
                  {periodFilter === "TODAY"
                    ? "Bugün"
                    : periodFilter === "1W"
                    ? "1 Hafta"
                    : periodFilter === "1M"
                    ? "1 Ay"
                    : periodFilter === "3M"
                    ? "3 Ay"
                    : periodFilter === "6M"
                    ? "6 Ay"
                    : "12 Ay"}
                  <button
                    type="button"
                    onClick={() => setPeriodFilter("ALL")}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {filterKind !== "ALL" && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                  Tür: {formatFollowUpKind(filterKind)}
                  <button
                    type="button"
                    onClick={() => setFilterKind("ALL")}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {filterStatus !== "open" && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                  Durum: {filterStatus === "done" ? "Tamamlananlar" : "Tümü"}
                  <button
                    type="button"
                    onClick={() => setFilterStatus("open")}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
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
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[#00adb5] hover:text-[#1d2566] font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <RotateCcw className="w-3 h-3" />
              Tüm Filtreleri Sıfırla
            </button>
          </div>
        )}
      </div>

      {/* Yanlışlıkla Tamamlandıya Basanlar İçin Hızlı Geri Al Bildirimi */}
      {lastCompletedTask && (
        <div className="sharp-card p-3 bg-amber-50 border border-amber-300 flex items-center justify-between gap-3 text-xs font-mono text-amber-950 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>&ldquo;{lastCompletedTask.title}&rdquo;</strong> görevi tamamlandı olarak işaretlendi.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleReopenTask(lastCompletedTask.id)}
              className="px-3 py-1 bg-white border border-amber-400 hover:bg-amber-100 text-amber-900 font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Yanlışlıkla Bastım, Geri Al (Tamamlanmadı Yap)</span>
            </button>
            <button
              type="button"
              onClick={() => setLastCompletedTask(null)}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Görev Sayacı */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-mono text-slate-500 font-medium flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#00adb5]" />
          <span>
            {sortedTasks.length} Görev / Randevu Listeleniyor
          </span>
        </div>
      </div>

      {/* Görev Kartları Listesi */}
      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="sharp-card p-12 text-center text-slate-400 font-mono text-xs">
            Seçili tarih ve filtre kriterlerine uygun randevu veya takip bulunamadı.
          </div>
        ) : (
          sortedTasks.map((t) => {
            const isDone = t.status === "done";
            const isPast = currentDate ? new Date(t.dueAt) < currentDate && !isDone : false;
            const isOffice = t.isOfficeEvent || t.kind === "office_event";

            return (
              <div
                key={t.id}
                className={`sharp-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                  isOffice
                    ? isDone
                      ? "bg-purple-50/50 border-purple-200 opacity-60 shadow-xs border-l-4 border-l-purple-400"
                      : "bg-gradient-to-r from-purple-50/80 via-indigo-50/40 to-white border-purple-300 border-l-4 border-l-purple-600 shadow-sm hover:border-purple-500"
                    : isDone
                    ? "opacity-65 bg-slate-50 border-slate-300"
                    : "hover:border-[#00adb5]"
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {isOffice ? (
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 border font-bold bg-purple-100 text-purple-900 border-purple-300 flex items-center gap-1 shadow-2xs">
                        <Users className="w-3 h-3 text-purple-700" />
                        OFİS ETKİNLİĞİ • TÜM EKİP
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 border font-bold ${
                          t.kind === "showing"
                            ? "bg-[#1d2566]/10 text-[#1d2566] border-[#1d2566]/20"
                            : t.kind === "meeting"
                            ? "bg-[#00adb5]/10 text-[#00adb5] border-[#00adb5]/30"
                            : t.kind === "call"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        {formatFollowUpKind(t.kind)}
                      </span>
                    )}

                    {isPast && (
                      <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 border border-rose-300 font-bold">
                        VADESİ GEÇTİ
                      </span>
                    )}

                    {isDone && (
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2.5 py-0.5 border border-emerald-300 font-bold flex items-center gap-1 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        TAMAMLANDI
                      </span>
                    )}

                    <span className="text-xs font-mono text-slate-600 font-medium">
                      {new Date(t.dueAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        weekday: "short",
                      })}
                      {t.hasSpecificTime !== false &&
                      t.dueAt.includes("T") &&
                      !t.dueAt.endsWith("T00:00:00") ? (
                        <>
                          {" "}
                          -{" "}
                          {formatFollowUpTime(t.dueAt)}
                        </>
                      ) : (
                        <span className="ml-1 text-[11px] text-slate-500 font-normal italic">
                          (Saat Belirtilmedi / Tüm Gün)
                        </span>
                      )}
                    </span>
                  </div>

                  <h3
                    className={`text-xs font-bold ${
                      isDone
                        ? "line-through text-slate-500"
                        : isOffice
                        ? "text-purple-950 font-extrabold flex items-center gap-1.5"
                        : "text-[#1d2566]"
                    }`}
                  >
                    {isOffice && <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                    {t.title}
                  </h3>

                  <div className="text-[11px] text-slate-600 font-mono flex flex-wrap items-center gap-3">
                    {isOffice ? (
                      <>
                        <span className="text-purple-900 font-bold flex items-center gap-1">
                          <Users className="w-3 h-3 text-purple-600" />
                          Tüm Ofis Ekibi & Danışmanlar Ortak Takviminde
                        </span>
                        {t.createdByName && (
                          <span className="text-slate-600">• Düzenleyen: {t.createdByName}</span>
                        )}
                        {t.propertyTitle && (
                          <span className="text-slate-500 line-clamp-1">
                            • İlgili Mülk: {t.propertyTitle}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {t.customerName ? (
                          <span className="text-slate-800 font-semibold">
                            Müşteri: {t.customerName}
                            {t.customerPhone && (
                              <span className="text-slate-500 font-normal">
                                {" "}
                                ({t.customerPhone})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Müşteri Bağımsız</span>
                        )}
                        {t.propertyTitle && (
                          <span className="text-slate-500 line-clamp-1">
                            • {t.propertyTitle}
                          </span>
                        )}
                        <span>• Danışman: {t.assignedToName || "Atanmadı"}</span>
                      </>
                    )}
                  </div>

                  {t.feedback && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 border border-slate-200 italic">
                      Sonuç Notu: {t.feedback}
                    </div>
                  )}
                </div>

                {/* Aksiyon Butonları */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isDone ? (
                    <>
                      <button
                        type="button"
                        onClick={() => postponeFollowUp(t.id)}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 hover:border-amber-500 text-amber-800 text-xs font-mono font-medium transition cursor-pointer"
                      >
                        Yarına Ertele
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCompleteTask(t)}
                        className="sharp-btn-emerald px-3 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tamamla</span>
                      </button>
                    </>
                  ) : (
                    /* TAMAMLANDI'YI TAMAMLANMADI DİYE GERİ ALMA BUTONU */
                    <button
                      type="button"
                      onClick={() => handleReopenTask(t.id)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      title="Görevi geri al ve tekrar bekleyen açık görev durumuna getir"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      <span>Tamamlanmadı Yap (Geri Al)</span>
                    </button>
                  )}

                  {canManageFollowUp(t) && (
                    <ActionMenu
                      onEdit={() => handleOpenEditFollowUp(t)}
                      onDelete={() => setFollowUpToDelete(t)}
                      canEdit={canManageFollowUp(t)}
                      canDelete={canManageFollowUp(t)}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Standardize Yeni Takip & Randevu Ekle Modalı */}
      <AddFollowUpModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* GÖREV DÜZENLEME MODALI */}
      {editingFollowUp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="sharp-card w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden bg-white border border-slate-300 shadow-2xl">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#00adb5]" />
                <h3 className="text-xs font-bold text-[#1d2566]">
                  Takip & Randevuyu Düzenle
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingFollowUp(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFollowUpEdit} className="p-5 space-y-4 text-xs flex-1 overflow-y-auto">
              <div>
                <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                  Aksiyon / Görev Başlığı *
                </label>
                <input
                  type="text"
                  required
                  value={editFormTitle}
                  onChange={(e) => setEditFormTitle(e.target.value)}
                  className="sharp-input w-full p-2"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                  Görüşme / İşlem Türü
                </label>
                <select
                  value={editFormKind}
                  onChange={(e) =>
                    setEditFormKind(
                      e.target.value as any
                    )
                  }
                  className="sharp-input w-full p-2 font-mono bg-white"
                >
                  <option value="showing">Yer Gösterme (Portföy Sunumu)</option>
                  <option value="meeting">Yüz Yüze Görüşme</option>
                  <option value="call">Telefon Görüşmesi / Takip</option>
                  <option value="office_event">Ofis Toplantısı / Etkinlik</option>
                  <option value="other">Diğer</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Tarih *
                  </label>
                  <DateInput
                    required
                    value={editFormDate}
                    onChange={(val) => setEditFormDate(val)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Saat (Opsiyonel)
                  </label>
                  <input
                    type="time"
                    value={editFormTime}
                    onChange={(e) => setEditFormTime(e.target.value)}
                    className="sharp-input w-full p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                  Durum
                </label>
                <select
                  value={editFormStatus}
                  onChange={(e) =>
                    setEditFormStatus(
                      e.target.value as "open" | "done" | "cancelled"
                    )
                  }
                  className="sharp-input w-full p-2 font-mono bg-white font-bold"
                >
                  <option value="open">Açık (Bekliyor)</option>
                  <option value="done">Tamamlandı</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                  Görüşme Notu / Geri Bildirim
                </label>
                <textarea
                  rows={2}
                  value={editFormFeedback}
                  onChange={(e) => setEditFormFeedback(e.target.value)}
                  className="sharp-input w-full p-2"
                  placeholder="Görüşme sonucu veya müşteri geri bildirimi..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingFollowUp(null)}
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
        isOpen={!!followUpToDelete}
        title="Ajanda Görevini Sil"
        itemName={followUpToDelete ? followUpToDelete.title : undefined}
        message="Bu ajanda randevusu / takip görevi kalıcı olarak silinecektir."
        onConfirm={() => {
          if (followUpToDelete) {
            deleteFollowUp(followUpToDelete.id);
            setFollowUpToDelete(null);
          }
        }}
        onCancel={() => setFollowUpToDelete(null)}
      />
    </div>
  );
}
