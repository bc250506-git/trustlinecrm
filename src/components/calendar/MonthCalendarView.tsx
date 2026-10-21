"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { FollowUp } from "@/lib/types";
import {
  formatFollowUpKind,
  cleanWhatsAppNumber,
  formatPhoneWithPrefix,
  formatFollowUpTime,
} from "@/lib/formatters";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Phone,
  MessageSquare,
  CheckCircle2,
  RotateCcw,
  Users,
  Building,
  CalendarDays,
  Sparkles,
  Search,
  Filter,
  Eye,
  Check,
  ChevronDown,
} from "lucide-react";
import { AddFollowUpModal } from "@/components/modals/AddFollowUpModal";
import { BoxedDateNavigator } from "@/components/common/BoxedDateNavigator";

// Ay şeridi seçenekleri (Geçmiş, Cari ve Gelecek Aylar)
const MONTH_STRIP_ITEMS = [
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

const WEEKDAY_NAMES = [
  { short: "Pzt", full: "Pazartesi" },
  { short: "Sal", full: "Salı" },
  { short: "Çar", full: "Çarşamba" },
  { short: "Per", full: "Perşembe" },
  { short: "Cum", full: "Cuma" },
  { short: "Cmt", full: "Cumartesi" },
  { short: "Paz", full: "Pazar" },
];

const TURKISH_MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

interface MonthCalendarViewProps {
  isDashboard?: boolean;
  onNavigate?: (tab: any) => void;
}

export function MonthCalendarView({ isDashboard = false, onNavigate }: MonthCalendarViewProps) {
  const {
    followUps,
    updateFollowUp,
    completeFollowUp,
    users,
    currentUser,
    isBroker,
  } = useStore();

  // Şu anki referans tarih (Varsayılan: Ekim 2026)
  const [viewDate, setViewDate] = useState<Date>(() => new Date(2026, 9, 14));
  const [todayStr, setTodayStr] = useState<string>("2026-10-14");

  useEffect(() => {
    // Gerçek cihaz tarihini al ancak 2026 Ekim demo verisi ile uyumlu başlat
    const now = new Date();
    const iso = now.toISOString().split("T")[0];
    setTodayStr(iso);
  }, []);

  // Seçili ve üzerine gelinen gün (Hover preview)
  const [selectedDateStr, setSelectedDateStr] = useState<string>("2026-10-14");
  const [hoveredDateStr, setHoveredDateStr] = useState<string | null>(null);

  // Filtreler
  const [statusFilter, setStatusFilter] = useState<"ALL" | "open" | "done">("ALL");
  const [kindFilter, setKindFilter] = useState<string>("ALL");
  const [advisorFilter, setAdvisorFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Hızlı Görev Ekleme Modalı
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<string>("2026-10-14");

  // Ay şeridi ref
  const monthScrollRef = useRef<HTMLDivElement>(null);

  // Aktif görüntülenen yıl ve ay
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth(); // 0-11
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  // Kullanıcı yetkisine göre filtrelenmiş tüm görevler
  const accessibleFollowUps = useMemo(() => {
    return followUps.filter((f) => {
      if (isBroker) return true;
      if (f.assignedToId === currentUser?.id) return true;
      if (f.isOfficeEvent) return true;
      return false;
    });
  }, [followUps, isBroker, currentUser]);

  // Ay şeridindeki aylık görev adetleri
  const monthTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    accessibleFollowUps.forEach((f) => {
      if (!f.dueAt) return;
      const d = new Date(f.dueAt);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [accessibleFollowUps]);

  // Ay değiştirme fonksiyonları
  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
    const newMonthStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    setSelectedDateStr(newMonthStr);
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
    const nextMonth = currentMonth + 2 > 12 ? 1 : currentMonth + 2;
    const nextYear = currentMonth + 2 > 12 ? currentYear + 1 : currentYear;
    const newMonthStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
    setSelectedDateStr(newMonthStr);
  };

  const handleGoToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateStr(now.toISOString().split("T")[0]);
  };

  const handleSelectMonthPill = (key: string) => {
    const [y, m] = key.split("-").map(Number);
    setViewDate(new Date(y, m - 1, 1));
    setSelectedDateStr(`${key}-01`);
  };

  // Aktif ayın gün kareleri hesaplaması (Pzt-Paz 7 kolon)
  const calendarDays = useMemo(() => {
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0: Paz, 1: Pzt...
    const mondayOffset = (firstDayIndex + 6) % 7; // Pzt: 0, Paz: 6

    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
    }[] = [];

    // Önceki ayın günleri
    for (let i = mondayOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 12 : currentMonth;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = new Date(prevY, prevM - 1, d).getDay();
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    // Cari ayın günleri
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    // Sonraki ayın günleri (Tam 35 veya 42 hücreye tamamlama)
    const totalCellsNeeded = cells.length > 35 ? 42 : 35;
    const remainingCells = totalCellsNeeded - cells.length;
    for (let d = 1; d <= remainingCells; d++) {
      const nextM = currentMonth + 2 > 12 ? 1 : currentMonth + 2;
      const nextY = currentMonth + 2 > 12 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = new Date(nextY, nextM - 1, d).getDay();
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    return cells;
  }, [currentYear, currentMonth, todayStr]);

  // Filtrelenmiş görevleri tarihlere göre haritalama (Map YYYY-MM-DD -> FollowUp[])
  const tasksByDate = useMemo(() => {
    const map = new Map<string, FollowUp[]>();

    accessibleFollowUps.forEach((f) => {
      // 1. Durum Filtresi
      if (statusFilter !== "ALL" && f.status !== statusFilter) return;

      // 2. Tür Filtresi
      if (kindFilter !== "ALL" && f.kind !== kindFilter) return;

      // 3. Danışman Filtresi
      if (isBroker && advisorFilter !== "ALL" && f.assignedToId !== advisorFilter) return;

      // 4. Arama
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          f.title?.toLowerCase().includes(q) ||
          f.customerName?.toLowerCase().includes(q) ||
          f.propertyTitle?.toLowerCase().includes(q) ||
          f.assignedToName?.toLowerCase().includes(q);
        if (!matches) return;
      }

      const dateStr = f.dueAt ? f.dueAt.split("T")[0] : "";
      if (!dateStr) return;

      const list = map.get(dateStr) || [];
      list.push(f);
      map.set(dateStr, list);
    });

    return map;
  }, [accessibleFollowUps, statusFilter, kindFilter, advisorFilter, searchQuery, isBroker]);

  // Ay özeti istatistikleri
  const currentMonthStats = useMemo(() => {
    let total = 0;
    let openCount = 0;
    let doneCount = 0;
    let showingCount = 0;

    accessibleFollowUps.forEach((f) => {
      if (!f.dueAt) return;
      const d = new Date(f.dueAt);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        total++;
        if (f.status === "open") openCount++;
        if (f.status === "done") doneCount++;
        if (f.kind === "showing") showingCount++;
      }
    });

    return { total, openCount, doneCount, showingCount };
  }, [accessibleFollowUps, currentYear, currentMonth]);

  // Aktif incelenen gün: Hover varsa hoverDate, yoksa selectedDate
  const inspectedDateStr = hoveredDateStr || selectedDateStr;
  const inspectedTasks = useMemo(() => {
    return tasksByDate.get(inspectedDateStr) || [];
  }, [tasksByDate, inspectedDateStr]);

  // Tarih Başlığı Formatlayıcı (örn: "14 Ekim 2026, Çarşamba")
  const formatInspectedDateHeader = (dateStr: string) => {
    try {
      const parts = dateStr.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const dayName = [
        "Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"
      ][d.getDay()];
      const monthName = TURKISH_MONTH_NAMES[d.getMonth()];
      return `${parts[2]} ${monthName} ${parts[0]}, ${dayName}`;
    } catch {
      return dateStr;
    }
  };

  // Tamamlandı / Geri Al İşlemleri
  const handleMarkAsDone = (taskId: string) => {
    completeFollowUp(taskId, "attended", "Takvim üzerinden tamamlandı olarak işaretlendi.");
  };

  const handleReopenTask = (taskId: string) => {
    updateFollowUp(taskId, {
      status: "open",
      outcome: "pending",
      feedback: "",
    });
  };

  // Hızlı Randevu Ekle Butonu
  const handleOpenAddModal = (dateStr?: string) => {
    setModalDate(dateStr || inspectedDateStr);
    setIsAddModalOpen(true);
  };

  // Tür için renk stili
  const getKindColorBadge = (kind: string, isDone: boolean) => {
    if (isDone) {
      return "bg-emerald-50 text-emerald-700 border-emerald-300";
    }
    switch (kind) {
      case "showing":
        return "bg-teal-50 text-teal-800 border-teal-300";
      case "meeting":
        return "bg-indigo-50 text-indigo-800 border-indigo-300";
      case "call":
        return "bg-amber-50 text-amber-900 border-amber-300";
      case "office_event":
        return "bg-purple-50 text-purple-900 border-purple-300";
      default:
        return "bg-slate-50 text-slate-800 border-slate-300";
    }
  };

  const getKindDot = (kind: string, isDone: boolean) => {
    if (isDone) return "bg-emerald-500";
    switch (kind) {
      case "showing": return "bg-[#00adb5]";
      case "meeting": return "bg-indigo-600";
      case "call": return "bg-amber-500";
      case "office_event": return "bg-purple-600";
      default: return "bg-slate-500";
    }
  };

  return (
    <div className={`space-y-5 ${isDashboard ? "mt-8 pt-6 border-t border-slate-200" : ""}`}>
      {/* ÜST BAŞLIK VE HIZLI EYLEMLER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-none bg-[#1d2566] text-white flex items-center justify-center shadow-xs">
              <CalendarIcon className="w-4 h-4 text-[#00adb5]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1d2566] tracking-tight">
                {isDashboard ? "Aylık İşlem & Randevu Takvimi" : "Takvim (Aylık Görünüm)"}
              </h2>
              <p className="text-xs text-slate-500">
                Ayın günlerini kareli matris üzerinde inceleyin, randevu ve görev detaylarını canlı takip edin.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Eğer Dashboard'daysak Ajanda'ya git butonu */}
          {isDashboard && onNavigate && (
            <button
              onClick={() => onNavigate("calendar")}
              className="sharp-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Ayrıntılı Ajanda Listesine Git"
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#00adb5]" />
              Ajandayı Aç
            </button>
          )}

          {/* Yeni Randevu / Görev Ekle Butonu */}
          <button
            onClick={() => handleOpenAddModal(selectedDateStr)}
            className="sharp-btn-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Yeni Randevu / Görev Ekle
          </button>
        </div>
      </div>

      {/* AY DEĞİŞTİRME KONTROLLERİ & YATAY AY SCROLL ŞERİDİ */}
      <div className="sharp-card p-4 bg-white border border-slate-200 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Sol: Ay Seçici (Sağlı Sollu Ok Kutusu) */}
          <div className="flex items-center gap-3">
            <BoxedDateNavigator
              label={`${TURKISH_MONTH_NAMES[currentMonth]} ${currentYear}`.toLocaleUpperCase("tr-TR")}
              onPrev={handlePrevMonth}
              onNext={handleNextMonth}
              prevTitle="Önceki Ay"
              nextTitle="Sonraki Ay"
              badge={
                currentMonthStats.total > 0 ? (
                  <span className="text-[10px] px-1.5 py-0.2 bg-[#00adb5]/10 text-[#00adb5] border border-[#00adb5]/30 font-bold font-mono">
                    {currentMonthStats.total} İşlem
                  </span>
                ) : undefined
              }
            />

            <button
              type="button"
              onClick={handleGoToday}
              className="px-2.5 py-1.5 text-xs font-mono font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition cursor-pointer"
              title="Cari aya / bugüne git"
            >
              Bugün
            </button>
          </div>

          {/* Sağ: İstatistik Rozetleri */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
              {currentMonthStats.openCount} Açık Randevu
            </span>
            <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              {currentMonthStats.doneCount} Tamamlanan
            </span>
            <span className="px-2 py-1 bg-teal-50 text-[#00adb5] border border-teal-200 font-semibold hidden sm:inline-block">
              {currentMonthStats.showingCount} Yer Gösterme
            </span>
          </div>
        </div>

        {/* YATAY AY SCROLL ŞERİDİ (Geçmiş ve Gelecek Aylar) */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1.5">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Clock className="w-3 h-3 text-[#00adb5]" /> Ay Gezgini (Geçmiş & Gelecek Aylar):
            </span>
            <span className="text-[10px] text-slate-400">Yatay kaydırarak ayları inceleyin</span>
          </div>

          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => {
                if (monthScrollRef.current) {
                  monthScrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
                }
              }}
              className="absolute left-0 z-10 p-1.5 bg-white/95 hover:bg-slate-100 text-slate-600 border border-slate-300 shadow-xs cursor-pointer"
              title="Sola Kaydır"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div
              ref={monthScrollRef}
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth px-7 py-1 w-full"
            >
              {MONTH_STRIP_ITEMS.map((item) => {
                const isActive = item.key === currentMonthKey;
                const count = monthTaskCounts[item.key] || 0;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSelectMonthPill(item.key)}
                    className={`px-3 py-1.5 text-xs font-mono shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isActive
                        ? "bg-[#1d2566] text-white border-[#1d2566] shadow-xs font-bold"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span>{item.label}</span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive
                            ? "bg-[#00adb5] text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                if (monthScrollRef.current) {
                  monthScrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
                }
              }}
              className="absolute right-0 z-10 p-1.5 bg-white/95 hover:bg-slate-100 text-slate-600 border border-slate-300 shadow-xs cursor-pointer"
              title="Sağa Kaydır"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* FİLTRELEME VE ARAMA ÇUBUĞU */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Arama */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Görev, müşteri, portföy ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#00adb5] outline-hidden font-mono"
            />
          </div>

          {/* Durum Filtresi */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-0.5">
            <span className="text-[10px] font-mono text-slate-400 px-1.5">Durum:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full text-xs bg-transparent outline-hidden font-mono text-slate-700 cursor-pointer"
            >
              <option value="ALL">Tümü (Açık & Tamamlanan)</option>
              <option value="open">Yalnızca Açıklar</option>
              <option value="done">Yalnızca Tamamlananlar</option>
            </select>
          </div>

          {/* Görev Türü */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-0.5">
            <span className="text-[10px] font-mono text-slate-400 px-1.5">Tür:</span>
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              className="w-full text-xs bg-transparent outline-hidden font-mono text-slate-700 cursor-pointer"
            >
              <option value="ALL">Tüm Etkinlik Türleri</option>
              <option value="showing">Yer Gösterme</option>
              <option value="meeting">Toplantı & Randevu</option>
              <option value="call">Telefon Araması</option>
              <option value="office_event">Ofis Etkinliği</option>
            </select>
          </div>

          {/* Danışman Filtresi (Yalnızca Broker/Ofis) */}
          {isBroker ? (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-0.5">
              <span className="text-[10px] font-mono text-slate-400 px-1.5">Danışman:</span>
              <select
                value={advisorFilter}
                onChange={(e) => setAdvisorFilter(e.target.value)}
                className="w-full text-xs bg-transparent outline-hidden font-mono text-slate-700 cursor-pointer"
              >
                <option value="ALL">Tüm Ofis Danışmanları</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-[11px] font-mono text-slate-500 flex items-center px-2 bg-slate-50 border border-slate-200">
              <span className="truncate">👤 Kendi Takviminiz ({currentUser?.name})</span>
            </div>
          )}
        </div>
      </div>

      {/* ANA İÇERİK: SOLDA KARELİ AY TAKVİMİ, SAĞDA "TAM KART" GÜNLÜK DETAY PANELİ */}
      {/* ANA İÇERİK: SOLDA KARELİ AY TAKVİMİ, SAĞDA "TAM KART" GÜNLÜK DETAY PANELİ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* SOL: 7 KOLONLU KARELİ AY TAKVİMİ (xl:col-span-8) */}
        <div className="xl:col-span-8 sharp-card bg-white border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto">
            <div className="min-w-[500px] sm:min-w-0 flex flex-col">
              {/* Hafta Günleri Başlık Satırı */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-mono font-bold text-slate-600 shrink-0">
            {WEEKDAY_NAMES.map((w, idx) => (
              <div
                key={w.short}
                className={`py-2.5 border-r last:border-r-0 border-slate-200 ${
                  idx >= 5 ? "text-amber-800 bg-amber-50/40" : ""
                }`}
              >
                <span className="hidden sm:inline">{w.full}</span>
                <span className="sm:hidden">{w.short}</span>
              </div>
            ))}
          </div>

          {/* Gün Kareleri Matrisi */}
          <div
            className="grid grid-cols-7 bg-slate-200 gap-px flex-1"
            onMouseLeave={() => setHoveredDateStr(null)}
          >
            {calendarDays.map((cell) => {
              const dayTasks = tasksByDate.get(cell.dateStr) || [];
              const isSelected = selectedDateStr === cell.dateStr;
              const isHovered = hoveredDateStr === cell.dateStr;
              const hasTasks = dayTasks.length > 0;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => {
                    setSelectedDateStr(cell.dateStr);
                    setHoveredDateStr(null);
                  }}
                  onMouseEnter={() => setHoveredDateStr(cell.dateStr)}
                  className={`relative min-h-[105px] p-1.5 transition-colors cursor-pointer flex flex-col justify-between group ${
                    cell.isCurrentMonth
                      ? "bg-white"
                      : "bg-slate-50/70 text-slate-400"
                  } ${
                    isSelected
                      ? "ring-2 ring-[#1d2566] z-20 bg-blue-50/20"
                      : isHovered
                      ? "ring-2 ring-[#00adb5] z-10 bg-teal-50/20"
                      : "hover:bg-slate-50/80"
                  }`}
                >
                  {/* Gün Başlığı: Gün Numarası ve Hızlı İşlem İkonu */}
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-none transition-colors ${
                        cell.isToday
                          ? "bg-[#00adb5] text-white shadow-2xs font-extrabold"
                          : isSelected
                          ? "bg-[#1d2566] text-white"
                          : cell.isCurrentMonth
                          ? "text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Görev Sayısı Noktası */}
                      {hasTasks && (
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dayTasks.some((t) => t.status === "open")
                              ? "bg-amber-500 animate-pulse"
                              : "bg-emerald-500"
                          }`}
                          title={`${dayTasks.length} etkinlik`}
                        />
                      )}

                      {/* Hoverda Hızlı Görev Ekle Butonu */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddModal(cell.dateStr);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 text-slate-600 transition-opacity"
                        title="Bu güne yeni görev ekle"
                      >
                        <Plus className="w-3 h-3 text-[#00adb5]" />
                      </button>
                    </div>
                  </div>

                  {/* Gün İçindeki Mini Görev Kartları */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {dayTasks.slice(0, 2).map((task) => {
                      const isDone = task.status === "done";
                      return (
                        <div
                          key={task.id}
                          className={`px-1.5 py-0.5 text-[10px] font-mono border truncate flex items-center gap-1 ${getKindColorBadge(
                            task.kind,
                            isDone
                          )} ${isDone ? "line-through opacity-75" : ""}`}
                          title={`${task.dueAt ? formatFollowUpTime(task.dueAt) : ""} - ${task.title}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${getKindDot(
                              task.kind,
                              isDone
                            )}`}
                          />
                          <span className="font-bold shrink-0">
                            {task.dueAt ? formatFollowUpTime(task.dueAt) : ""}
                          </span>
                          <span className="truncate">
                            {task.customerName ? `${task.customerName.split(" ")[0]}: ` : ""}
                            {task.title}
                          </span>
                        </div>
                      );
                    })}

                    {/* 2'den fazla görev varsa "+X daha" rozeti */}
                    {dayTasks.length > 2 && (
                      <div className="text-[9px] font-mono font-bold text-slate-500 px-1 py-0.5 bg-slate-100 border border-slate-200 text-center">
                        +{dayTasks.length - 2} daha
                      </div>
                    )}
                  </div>

                  {/* Hücre Alt Bilgisi (Bugünse Küçük Etiket) */}
                  {cell.isToday && (
                    <div className="text-[8px] font-mono text-[#00adb5] font-bold mt-0.5">
                      Bugün
                    </div>
                  )}
                </div>
              );
            })}
          </div>
            </div>
          </div>
        </div>

        {/* SAĞ: "TAM KART" GÜNLÜK DETAY PANELİ (xl:col-span-4) */}
        {/* Kullanıcının özel talebi: "üzerine gelindiğinde güzelce detay göstersin sitemizin tarzında popup gibi değil de güzel bi ui ile beliren tam kart" */}
        <div
          onMouseEnter={() => {
            if (hoveredDateStr) {
              setSelectedDateStr(hoveredDateStr);
            }
          }}
          className="xl:col-span-4 sharp-card bg-white border border-slate-200 shadow-sm p-4 flex flex-col h-full min-h-[580px] xl:max-h-[720px] sticky top-20"
        >
          {/* Kart Başlığı */}
          <div className="shrink-0 pb-3 border-b border-slate-100 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#00adb5] uppercase">
                {hoveredDateStr ? (
                  <span className="flex items-center gap-1 text-teal-700 bg-teal-50 px-1.5 py-0.5 border border-teal-200">
                    <Eye className="w-3 h-3" /> Önizleme (Üzerine Gelindi)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-700 bg-slate-100 px-1.5 py-0.5 border border-slate-200">
                    📌 Seçili Gün
                  </span>
                )}
                {inspectedDateStr === todayStr && (
                  <span className="bg-[#00adb5] text-white px-1.5 py-0.5 font-bold">
                    Bugün
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-[#1d2566] tracking-tight mt-1">
                {formatInspectedDateHeader(inspectedDateStr)}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddModal(inspectedDateStr)}
              className="sharp-btn-primary px-2.5 py-1 text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs font-semibold"
              title="Bu tarihe yeni randevu ekle"
            >
              <Plus className="w-3 h-3" /> Ekle
            </button>
          </div>

          {/* Günlük Görev Listesi */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 py-1">
            {inspectedTasks.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 space-y-2.5 h-full flex flex-col items-center justify-center min-h-[240px]">
                <div className="w-10 h-10 mx-auto bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200">
                  <CalendarDays className="w-5 h-5 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700">
                    Planlanmış Etkinlik Yok
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Bu tarihe ait bekleyen veya tamamlanmış herhangi bir randevu bulunmamaktadır.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(inspectedDateStr)}
                  className="sharp-btn-secondary px-3 py-1.5 text-xs text-[#00adb5] font-semibold flex items-center gap-1 mx-auto cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> + Randevu / Görev Ekle
                </button>
              </div>
            ) : (
              inspectedTasks.map((task) => {
                const isDone = task.status === "done";
                return (
                  <div
                    key={task.id}
                    className={`p-3.5 border transition-all space-y-2.5 ${
                      isDone
                        ? "bg-emerald-50/30 border-emerald-200"
                        : "bg-white border-slate-200 hover:border-[#00adb5] shadow-2xs"
                    }`}
                  >
                    {/* Üst Kısım: Saat, Tür ve Durum */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#1d2566] text-white flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#00adb5]" />
                          {formatFollowUpTime(task.dueAt)}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono font-bold border ${getKindColorBadge(
                            task.kind,
                            isDone
                          )}`}
                        >
                          {formatFollowUpKind(task.kind)}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 ${
                          isDone
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {isDone ? "✓ Tamamlandı" : "Açık Görev"}
                      </span>
                    </div>

                    {/* Görev Başlığı */}
                    <h4
                      className={`text-xs font-bold text-slate-900 leading-snug ${
                        isDone ? "line-through text-slate-500" : ""
                      }`}
                    >
                      {task.title}
                    </h4>

                    {/* Müşteri ve Telefon */}
                    {task.customerName && (
                      <div className="p-2 bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <Users className="w-3 h-3 text-[#00adb5]" />
                            {task.customerName}
                          </span>
                        </div>
                        {task.customerPhone && (
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 font-mono text-[10px]">
                            <a
                              href={`tel:${task.customerPhone}`}
                              className="px-2 py-0.5 bg-white border border-slate-300 hover:border-[#00adb5] text-slate-700 hover:text-[#00adb5] flex items-center gap-1"
                              title="Telefonla Ara"
                            >
                              <Phone className="w-2.5 h-2.5 text-[#00adb5]" />
                              {formatPhoneWithPrefix(task.customerPhone) || task.customerPhone}
                            </a>
                            <a
                              href={`https://wa.me/${cleanWhatsAppNumber(task.customerPhone)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 hover:text-emerald-600 flex items-center gap-1"
                              title="WhatsApp Mesajı"
                            >
                              <MessageSquare className="w-2.5 h-2.5 text-emerald-600" />
                              WhatsApp
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* İlgili Portföy */}
                    {task.propertyTitle && (
                      <div className="text-[11px] text-slate-600 flex items-start gap-1 font-mono">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{task.propertyTitle}</span>
                      </div>
                    )}

                    {/* Danışman */}
                    {task.assignedToName && (
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <span>Danışman:</span>
                        <span className="font-semibold text-slate-700">
                          {task.assignedToName}
                        </span>
                      </div>
                    )}

                    {/* Tamamlama Geri Bildirimi */}
                    {task.feedback && (
                      <div className="text-[10px] bg-emerald-50/50 p-2 border border-emerald-200 text-emerald-900 font-mono">
                        <span className="font-bold">Not: </span>
                        {task.feedback}
                      </div>
                    )}

                    {/* Eylem Butonları (Tamamla / Geri Al) */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                      {isDone ? (
                        <button
                          type="button"
                          onClick={() => handleReopenTask(task.id)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono flex items-center gap-1 cursor-pointer font-semibold shadow-2xs"
                          title="Yanlışlıkla tamamlandıysa geri al"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-700" />
                          ↺ Tamamlanmadı Yap (Geri Al)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkAsDone(task.id)}
                          className="px-2.5 py-1 bg-[#1d2566] hover:bg-[#151b4d] text-white text-[10px] font-mono flex items-center gap-1 cursor-pointer font-semibold shadow-2xs"
                          title="Görevi tamamlandı olarak işaretle"
                        >
                          <CheckCircle2 className="w-3 h-3 text-[#00adb5]" />
                          ✓ Tamamla
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* YENİ GÖREV EKLEME MODALI */}
      <AddFollowUpModal
        isOpen={isAddModalOpen}
        initialDate={modalDate}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
