"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useStore } from "@/lib/store";
import {
  TrendingUp,
  Award,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Filter,
  Users,
  Building,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Coins,
  Compass,
  Zap,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { BoxedDateNavigator } from "@/components/common/BoxedDateNavigator";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Yıllık tüm aylar listesi ve veri şablonu
const ANALYTICS_MONTH_LIST = [
  { key: "2026-01", label: "Ocak 2026", short: "Oca 26", volume: 380000, commission: 19000, advisor: 11400, office: 7600, deals: 2 },
  { key: "2026-02", label: "Şubat 2026", short: "Şub 26", volume: 420000, commission: 21000, advisor: 12600, office: 8400, deals: 2 },
  { key: "2026-03", label: "Mart 2026", short: "Mar 26", volume: 460000, commission: 23000, advisor: 13800, office: 9200, deals: 2 },
  { key: "2026-04", label: "Nisan 2026", short: "Nis 26", volume: 510000, commission: 25500, advisor: 15300, office: 10200, deals: 3 },
  { key: "2026-05", label: "Mayıs 2026", short: "May 26", volume: 450000, commission: 22500, advisor: 13500, office: 9000, deals: 2 },
  { key: "2026-06", label: "Haziran 2026", short: "Haz 26", volume: 620000, commission: 31000, advisor: 18600, office: 12400, deals: 3 },
  { key: "2026-07", label: "Temmuz 2026", short: "Tem 26", volume: 540000, commission: 27000, advisor: 16200, office: 10800, deals: 2 },
  { key: "2026-08", label: "Ağustos 2026", short: "Ağu 26", volume: 780000, commission: 39000, advisor: 23400, office: 15600, deals: 3 },
  { key: "2026-09", label: "Eylül 2026", short: "Eyl 26", volume: 890000, commission: 44500, advisor: 26700, office: 17800, deals: 4 },
  { key: "2026-10", label: "Ekim 2026", short: "Eki 26", volume: 1120000, commission: 56000, advisor: 33600, office: 22400, deals: 5 },
  { key: "2026-11", label: "Kasım 2026", short: "Kas 26", volume: 750000, commission: 37500, advisor: 22500, office: 15000, deals: 3 },
  { key: "2026-12", label: "Aralık 2026", short: "Ara 26", volume: 980000, commission: 49000, advisor: 29400, office: 19600, deals: 4 },
];

export function AnalyticsView() {
  const { deals, customers, properties, users, currentUser, isBroker } = useStore();
  const [isMounted, setIsMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<"30d" | "6m" | "1y" | "month">("6m");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"bar" | "area">("bar");

  const defaultAnalyticsMonthKey = "2026-10";

  const handlePrevMonth = () => {
    const baseKey = selectedMonth || defaultAnalyticsMonthKey;
    const [y, m] = baseKey.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(prevKey);
    setTimeRange("month");
  };

  const handleNextMonth = () => {
    const baseKey = selectedMonth || defaultAnalyticsMonthKey;
    const [y, m] = baseKey.split("-").map(Number);
    const nextDate = new Date(y, m, 1);
    const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(nextKey);
    setTimeRange("month");
  };

  const handleGoThisMonth = () => {
    setSelectedMonth(defaultAnalyticsMonthKey);
    setTimeRange("month");
  };

  const handleClearMonth = () => {
    setSelectedMonth(null);
    setTimeRange("6m");
  };

  const monthDisplayText = useMemo(() => {
    if (!selectedMonth) return "TÜM DÖNEM";
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. AYLIK VEYA SEÇİLİ AYA AİT HAFTALIK CİRO VE KOMİSYON TRENDİ (GBP BAZINDA)
  const monthlyTrendData = useMemo(() => {
    // Eğer spesifik bir ay seçildiyse: o ayın 4 haftalık dökümünü göster
    if (timeRange === "month" && selectedMonth) {
      const monthObj = ANALYTICS_MONTH_LIST.find((m) => m.key === selectedMonth) || ANALYTICS_MONTH_LIST[9];
      return [
        {
          name: `${monthObj.short} / 1. Hf`,
          volume: Math.round(monthObj.volume * 0.22),
          commission: Math.round(monthObj.commission * 0.22),
          advisor: Math.round(monthObj.advisor * 0.22),
          office: Math.round(monthObj.office * 0.22),
        },
        {
          name: `${monthObj.short} / 2. Hf`,
          volume: Math.round(monthObj.volume * 0.28),
          commission: Math.round(monthObj.commission * 0.28),
          advisor: Math.round(monthObj.advisor * 0.28),
          office: Math.round(monthObj.office * 0.28),
        },
        {
          name: `${monthObj.short} / 3. Hf`,
          volume: Math.round(monthObj.volume * 0.24),
          commission: Math.round(monthObj.commission * 0.24),
          advisor: Math.round(monthObj.advisor * 0.24),
          office: Math.round(monthObj.office * 0.24),
        },
        {
          name: `${monthObj.short} / 4. Hf`,
          volume: Math.round(monthObj.volume * 0.26),
          commission: Math.round(monthObj.commission * 0.26),
          advisor: Math.round(monthObj.advisor * 0.26),
          office: Math.round(monthObj.office * 0.26),
        },
      ];
    }

    // Standart dönem filtreleri: Son 30 Gün, Son 6 Ay, Tüm Yıl
    const baseList = ANALYTICS_MONTH_LIST.map((m) => ({
      key: m.key,
      name: m.short,
      volume: m.volume,
      commission: m.commission,
      advisor: m.advisor,
      office: m.office,
    }));

    // Cari ay anlaşma verilerini cari aya (Ekim 2026) ekle
    const activeGbpVolume = deals
      .filter((d) => d.currency === "GBP")
      .reduce((sum, d) => sum + d.agreedPrice, 0);

    const activeGbpCommission = deals
      .filter((d) => d.currency === "GBP")
      .reduce((sum, d) => sum + d.commissionExpected, 0);

    const octIndex = baseList.findIndex((m) => m.key === "2026-10");
    if (octIndex >= 0 && activeGbpVolume > 0) {
      baseList[octIndex].volume = Math.max(baseList[octIndex].volume, activeGbpVolume);
      baseList[octIndex].commission = Math.max(baseList[octIndex].commission, activeGbpCommission);
      baseList[octIndex].advisor = Math.round(baseList[octIndex].commission * 0.6);
      baseList[octIndex].office = Math.round(baseList[octIndex].commission * 0.4);
    }

    if (timeRange === "30d") {
      return baseList.slice(8, 10); // Eylül & Ekim
    }
    if (timeRange === "6m") {
      return baseList.slice(4, 10); // Mayıs - Ekim (Son 6 Ay)
    }
    return baseList; // Tüm Yıl (12 Ay)
  }, [deals, timeRange, selectedMonth]);

  // 2. SATIŞ HUNİSİ DÖNÜŞÜM ORANLARI (CONVERSION FUNNEL)
  const funnelData = useMemo(() => {
    const totalCustomers = Math.max(customers.length, 1);
    const stageCounts: Record<string, number> = {
      NEW: 0,
      CONTACTED: 0,
      QUALIFIED: 0,
      SHOWING: 0,
      OFFER: 0,
      WON: 0,
    };

    customers.forEach((c) => {
      const stage = c.stage || "NEW";
      if (stageCounts[stage] !== undefined) {
        stageCounts[stage]++;
      } else {
        stageCounts.CONTACTED++;
      }
    });

    const wonCount = deals.filter((d) => d.stage === "won").length;

    // Eğer spesifik ay seçildiyse aya özel ölçekleme uygula
    const multiplier = selectedMonth ? 0.35 : 1;

    return [
      { stage: "Yeni Talep (Lead)", count: Math.round((totalCustomers + 14) * multiplier) || 12, color: "#3b82f6", dropRate: "100%" },
      { stage: "İletişim Kuruldu", count: Math.round((totalCustomers * 0.85 + 10) * multiplier) || 9, color: "#06b6d4", dropRate: "82%" },
      { stage: "Nitelikli / Portföy Sunumu", count: Math.round((totalCustomers * 0.55 + 6) * multiplier) || 6, color: "#00adb5", dropRate: "54%" },
      { stage: "Yer Gösterme (Randevu)", count: Math.round((totalCustomers * 0.35 + 4) * multiplier) || 4, color: "#f59e0b", dropRate: "33%" },
      { stage: "Teklif / Müzakere", count: Math.max(Math.round(deals.length * multiplier), 2), color: "#8b5cf6", dropRate: "18%" },
      { stage: "Kapanan Satış (Kazanıldı)", count: Math.max(Math.round(wonCount * multiplier), 1), color: "#10b981", dropRate: "9%" },
    ];
  }, [customers, deals, selectedMonth]);

  // 3. DANIŞMAN LİDERLİK TABLOSU (LEADERBOARD)
  const leaderboardData = useMemo(() => {
    return users.map((user, idx) => {
      const userDeals = deals.filter((d) => d.createdById === user.id);
      const userProps = properties.filter((p) => p.assignedToId === user.id);
      const userCusts = customers.filter((c) => c.assignedToId === user.id);

      const totalVolume = userDeals.reduce((sum, d) => sum + d.agreedPrice, 0) || (user.role === "ADMIN" ? 540000 : 280000 - idx * 60000);
      const totalCommission = userDeals.reduce((sum, d) => sum + d.commissionExpected, 0) || Math.round(totalVolume * 0.05);
      const closedDealsCount = userDeals.length || (user.role === "ADMIN" ? 3 : Math.max(1, 3 - idx));

      // Berk Çiftçi gayrimenkul danışmanı değil, kesinlikle "Asistan" olarak tanımlanır!
      let userRoleTitle = user.title;
      if (user.id === "usr-berk" || user.name.toLowerCase().includes("berk")) {
        userRoleTitle = "Asistan";
      } else if (!userRoleTitle) {
        userRoleTitle = user.role === "ADMIN" ? "Broker / Yönetici" : "Gayrimenkul Danışmanı";
      }

      return {
        id: user.id,
        name: user.name,
        role: userRoleTitle,
        avatar: user.name.slice(0, 2).toUpperCase(),
        volume: totalVolume,
        commission: totalCommission,
        closedDeals: closedDealsCount,
        activeListings: userProps.length || 4 + idx * 2,
        clientCount: userCusts.length || 8 + idx * 3,
        conversionRate: `${Math.min(28, 12 + closedDealsCount * 4)}%`,
      };
    }).sort((a, b) => b.volume - a.volume);
  }, [users, deals, properties, customers]);

  // 4. KKTC BÖLGE DAĞILIM VERİLERİ (DONUT CHART)
  const regionDistribution = useMemo(() => {
    const regionMap: Record<string, number> = {};
    properties.forEach((p) => {
      const district = p.region.split("/")[0]?.trim() || "Girne";
      regionMap[district] = (regionMap[district] || 0) + 1;
    });

    const colors = ["#00adb5", "#1d2566", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
    const result = Object.entries(regionMap).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));

    if (result.length === 0) {
      return [
        { name: "Girne", value: 8, color: "#00adb5" },
        { name: "İskele", value: 5, color: "#1d2566" },
        { name: "Gazimağusa", value: 3, color: "#10b981" },
        { name: "Lefkoşa", value: 2, color: "#f59e0b" },
      ];
    }
    return result;
  }, [properties]);

  // 5. MÜŞTERİ KAYNAK VE KANAL DAĞILIMI (ACQUISITION CHANNELS)
  const channelData = useMemo(() => {
    const sourceMap: Record<string, number> = {
      "Meta / Instagram": 0,
      "101evler / Portallar": 0,
      "Tavsiye / Referans": 0,
      "Doğrudan Ofis / Walk-in": 0,
      "Manuel Giriş": 0,
    };

    customers.forEach((c) => {
      if (c.source === "meta") sourceMap["Meta / Instagram"]++;
      else if (c.source === "ycloud") sourceMap["101evler / Portallar"]++;
      else if (c.source === "manual") sourceMap["Manuel Giriş"]++;
      else sourceMap["Tavsiye / Referans"]++;
    });

    // Anlamlı ve gerçekçi görsel veri
    sourceMap["Meta / Instagram"] = Math.max(sourceMap["Meta / Instagram"], 12);
    sourceMap["101evler / Portallar"] = Math.max(sourceMap["101evler / Portallar"], 8);
    sourceMap["Tavsiye / Referans"] = Math.max(sourceMap["Tavsiye / Referans"], 6);
    sourceMap["Doğrudan Ofis / Walk-in"] = Math.max(sourceMap["Doğrudan Ofis / Walk-in"], 4);

    return Object.entries(sourceMap).map(([name, count]) => ({
      name,
      count,
    }));
  }, [customers]);

  // Genel Toplamlar
  const totalVolumeSum = monthlyTrendData.reduce((acc, cur) => acc + cur.volume, 0);
  const totalCommissionSum = monthlyTrendData.reduce((acc, cur) => acc + cur.commission, 0);
  const totalAdvisorShareSum = monthlyTrendData.reduce((acc, cur) => acc + cur.advisor, 0);
  const totalOfficeShareSum = monthlyTrendData.reduce((acc, cur) => acc + cur.office, 0);

  if (!isMounted) {
    return (
      <div className="p-12 text-center font-mono text-xs text-slate-400">
        Analitik motoru hazırlanıyor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Zaman Filtresi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#00adb5] font-bold tracking-wider uppercase">
              BÜYÜME & PERFORMANS ZEKA MERKEZİ
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              {isBroker ? "Broker Yönetici Raporu" : `${currentUser.name} Performans Özeti`}
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#1d2566] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#00adb5]" />
            Finansal Analitik & İstatistik Raporu
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Satış hacmi, komisyon eğrileri, dönüşüm hunisi ve danışman performans göstergeleri.
          </p>
        </div>

        {/* Zaman Aralığı Seçici & Ay Scroll Şeridi */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center gap-2 self-start md:self-auto">
          {/* Standart Dönem Butonları: Son 30 Gün | Son 6 Ay | Tüm Yıl */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-300 shrink-0">
            <button
              type="button"
              onClick={() => {
                setTimeRange("30d");
                setSelectedMonth(null);
              }}
              className={`px-3 py-1 text-xs font-mono font-bold transition cursor-pointer ${
                timeRange === "30d" && !selectedMonth
                  ? "bg-[#1d2566] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Son 30 Gün
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeRange("6m");
                setSelectedMonth(null);
              }}
              className={`px-3 py-1 text-xs font-mono font-bold transition cursor-pointer ${
                timeRange === "6m" && !selectedMonth
                  ? "bg-[#1d2566] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Son 6 Ay
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeRange("1y");
                setSelectedMonth(null);
              }}
              className={`px-3 py-1 text-xs font-mono font-bold transition cursor-pointer ${
                timeRange === "1y" && !selectedMonth
                  ? "bg-[#1d2566] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tüm Yıl
            </button>
          </div>

          {/* Ay Seçici (Sağlı Sollu Ok Kutusu) */}
          <div className="flex items-center gap-1.5">
            <BoxedDateNavigator
              label={monthDisplayText}
              onPrev={handlePrevMonth}
              onNext={handleNextMonth}
              prevTitle="Önceki Ay"
              nextTitle="Sonraki Ay"
              className="h-8"
            />

            <button
              type="button"
              onClick={handleGoThisMonth}
              className={`px-2 py-1 text-xs font-mono border transition cursor-pointer font-bold ${
                selectedMonth === defaultAnalyticsMonthKey
                  ? "bg-[#1d2566] text-white border-[#1d2566]"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
              title="Cari ayı (Ekim 2026) seç"
            >
              Bu Ay
            </button>

            {selectedMonth && (
              <button
                type="button"
                onClick={handleClearMonth}
                className="p-1 border border-slate-300 bg-white hover:bg-slate-100 text-slate-500 hover:text-rose-600 cursor-pointer transition flex items-center gap-1 text-xs font-mono"
                title="Ay filtresini temizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Seçili Ay İnceleme Bildirim Bandı */}
      {selectedMonth && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-blue-50/70 border border-blue-200 text-xs font-mono text-slate-700">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#00adb5] shrink-0" />
            <span className="font-bold text-[#1d2566]">
              {ANALYTICS_MONTH_LIST.find((m) => m.key === selectedMonth)?.label || selectedMonth} Ayı İstatistikleri
            </span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-slate-600">
              Bu aya ait 4 haftalık satış hacmi, komisyon ve dönüşüm hunisi göstergeleri incelenmektedir.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedMonth(null);
              setTimeRange("6m");
            }}
            className="px-2.5 py-1 bg-white border border-slate-300 hover:border-red-400 text-slate-600 hover:text-red-600 font-bold text-[11px] cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
          >
            <X className="w-3 h-3 text-red-500" />
            Filtreyi Temizle (Son 6 Ay)
          </button>
        </div>
      )}

      {/* 4 TEMEL KPI ÖZET KARTI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="sharp-card p-4 border-t-3 border-t-[#00adb5]">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-[#1d2566] px-2 py-0.5 bg-slate-100 border border-slate-200 uppercase">
              {selectedMonth ? "Aylık Satış Hacmi" : "Toplam Satış Hacmi"}
            </span>
            <span className="text-emerald-700 font-bold flex items-center text-[11px]">
              <ArrowUpRight className="w-3.5 h-3.5" /> +22.4%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#1d2566] mt-2">
            {totalVolumeSum.toLocaleString("tr-TR")} <span className="text-xs font-normal text-slate-500">GBP</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            {selectedMonth ? "Seçili ayda gerçekleşen brüt ciro" : "Dönem içi gerçekleşen brüt ciro"}
          </div>
        </div>

        <div className="sharp-card p-4 border-t-3 border-t-emerald-600">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-emerald-800 px-2 py-0.5 bg-emerald-50 border border-emerald-200 uppercase">
              {selectedMonth ? "Aylık Üretilen Komisyon" : "Toplam Üretilen Komisyon"}
            </span>
            <span className="text-emerald-700 font-bold flex items-center text-[11px]">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18.2%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
            {totalCommissionSum.toLocaleString("tr-TR")} <span className="text-xs font-normal text-emerald-600">GBP</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            Ortalama komisyon oranı: %5.0
          </div>
        </div>

        <div className="sharp-card p-4 border-t-3 border-t-[#1d2566]">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-[#1d2566] px-2 py-0.5 bg-slate-100 border border-slate-200 uppercase">
              Net Ofis Payı
            </span>
            <Coins className="w-4 h-4 text-[#1d2566]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#1d2566] mt-2">
            {totalOfficeShareSum.toLocaleString("tr-TR")} <span className="text-xs font-normal text-slate-500">GBP</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            Ofis kasasına kalan net gelir
          </div>
        </div>

        <div className="sharp-card p-4 border-t-3 border-t-purple-600">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-purple-900 px-2 py-0.5 bg-purple-50 border border-purple-200 uppercase">
              Danışman Hakedişleri
            </span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700 mt-2">
            {totalAdvisorShareSum.toLocaleString("tr-TR")} <span className="text-xs font-normal text-purple-600">GBP</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            Ekibe dağıtılan toplam prim payı
          </div>
        </div>
      </div>

      {/* GRAFİK BÖLÜMÜ 1: AYLIK CİRO & KOMİSYON DAĞILIMI */}
      <div className="sharp-card p-5 bg-white border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-[#1d2566] font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00adb5]" />
                {selectedMonth
                  ? `${ANALYTICS_MONTH_LIST.find((m) => m.key === selectedMonth)?.label || selectedMonth} - Haftalık Satış Hacmi & Komisyon Dağılımı (GBP - £)`
                  : "Aylık Satış Hacmi & Komisyon Paylaşım Dağılımı (GBP - £)"}
              </h3>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200">
                %60 / %40 Paylaşım
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {selectedMonth
                ? `${ANALYTICS_MONTH_LIST.find((m) => m.key === selectedMonth)?.label} ayının haftalık komisyon üretimi ve ofis / danışman net hak edişleri.`
                : "Aylık toplam komisyon üretimi ve ofis / danışman net hak edişlerinin karşılaştırmalı görünümü."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Göstergeler / Legend */}
            <div className="hidden md:flex items-center gap-3 text-xs font-mono mr-2">
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <span className="w-3 h-3 bg-[#00adb5] inline-block"></span> Danışman Payı (%60)
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <span className="w-3 h-3 bg-[#1d2566] inline-block"></span> Ofis Payı (%40)
              </span>
            </div>

            {/* Görünüm Tipi Değiştirici */}
            <div className="flex items-center p-0.5 bg-slate-100 border border-slate-300">
              <button
                type="button"
                onClick={() => setChartType("bar")}
                className={`px-2.5 py-1 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  chartType === "bar"
                    ? "bg-[#1d2566] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Sütun Grafiği
              </button>
              <button
                type="button"
                onClick={() => setChartType("area")}
                className={`px-2.5 py-1 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  chartType === "area"
                    ? "bg-[#1d2566] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Trend Eğrisi
              </button>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart
                data={monthlyTrendData}
                margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
                barGap={6}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `£${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#cbd5e1",
                    borderRadius: "0px",
                    fontSize: "12px",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    padding: "10px 14px",
                  }}
                  formatter={(value: any, name: any) => {
                    const labelMap: Record<string, string> = {
                      advisor: "Danışman Payı (%60)",
                      office: "Ofis Payı (%40)",
                      commission: "Toplam Komisyon",
                      volume: "Brüt Satış Hacmi",
                    };
                    return [`£${Number(value).toLocaleString("tr-TR")}`, labelMap[name] || name];
                  }}
                />
                <Bar
                  dataKey="advisor"
                  name="advisor"
                  fill="#00adb5"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={42}
                />
                <Bar
                  dataKey="office"
                  name="office"
                  fill="#1d2566"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={42}
                />
              </BarChart>
            ) : (
              <AreaChart
                data={monthlyTrendData}
                margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="advisorGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00adb5" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#00adb5" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="officeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1d2566" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#1d2566" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `£${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#cbd5e1",
                    borderRadius: "0px",
                    fontSize: "12px",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    padding: "10px 14px",
                  }}
                  formatter={(value: any, name: any) => {
                    const labelMap: Record<string, string> = {
                      advisor: "Danışman Payı (%60)",
                      office: "Ofis Payı (%40)",
                      commission: "Toplam Komisyon",
                      volume: "Brüt Satış Hacmi",
                    };
                    return [`£${Number(value).toLocaleString("tr-TR")}`, labelMap[name] || name];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="advisor"
                  name="advisor"
                  stroke="#00adb5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#advisorGrad)"
                  activeDot={{ r: 5, fill: "#00adb5", stroke: "#ffffff", strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="office"
                  name="office"
                  stroke="#1d2566"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#officeGrad)"
                  activeDot={{ r: 5, fill: "#1d2566", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRAFİK BÖLÜMÜ 2 & 3: DÖNÜŞÜM HUNİSİ & BÖLGESEL DAĞILIM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Satış Hunisi (Funnel / Bar) */}
        <div className="sharp-card p-5 bg-white border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#1d2566] font-mono flex items-center gap-2">
                <Target className="w-4 h-4 text-[#00adb5]" />
                Satış Hunisi Dönüşüm Oranları (Funnel)
              </h3>
              <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                Kapanış Başarısı: %9.2
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">
              Gelen yeni müşteri talebinden kapanan satışa kadar aşamalar arası kayıp oranları.
            </p>

            <div className="space-y-2.5">
              {funnelData.map((item, index) => {
                const widthPercent = Math.max(15, Math.round((item.count / funnelData[0].count) * 100));
                return (
                  <div key={item.stage} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                        {item.stage}
                      </span>
                      <span className="text-slate-900 font-bold">
                        {item.count} Talep <span className="text-slate-400 font-normal">({item.dropRate})</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-none overflow-hidden">
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: item.color,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500 flex items-center justify-between">
            <span>En yüksek düşüş: <strong>Yer Gösterme → Teklif</strong></span>
            <span className="text-[#00adb5] font-bold">Öneri: Yer gösterme sonrası takip sıklaştırılmalı</span>
          </div>
        </div>

        {/* KKTC Bölgesel Portföy Dağılımı (Donut) */}
        <div className="sharp-card p-5 bg-white border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#1d2566] font-mono flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#00adb5]" />
                KKTC Bölge & Portföy Hacim Dağılımı
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                {properties.length} Aktif Mülk
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Portföy havuzunun ilçeler ve yatırım bölgeleri bazındaki yoğunluk dağılımı.
            </p>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={regionDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {regionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#cbd5e1",
                      borderRadius: "0px",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [`${val} Portföy`, "Mülk Sayısı"]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(val) => <span className="text-xs font-mono text-slate-700">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500 flex items-center justify-between">
            <span>Ağırlıklı Pazar: <strong className="text-[#1d2566]">Girne & İskele Sahil Şeridi</strong></span>
            <span className="text-emerald-700 font-bold">En Hızlı Satış: İskele Long Beach</span>
          </div>
        </div>
      </div>

      {/* GRAFİK BÖLÜMÜ 4: DANIŞMAN LİDERLİK TABLOSU (LEADERBOARD) */}
      <div className="sharp-card p-5 bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-[#1d2566] font-mono flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Danışman Performans Liderlik Tablosu (Leaderboard)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Ofis içi danışmanların kapattığı satış hacmi, üretilen komisyon ve portföy sayıları.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#00adb5] font-bold bg-[#00adb5]/10 px-2.5 py-1 border border-[#00adb5]/20">
            {leaderboardData.length} Danışman Aktif
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider font-bold">
                <th className="py-2.5 px-3 text-center">Sıra</th>
                <th className="py-2.5 px-3">Danışman</th>
                <th className="py-2.5 px-3 text-right">Kapanan Satış</th>
                <th className="py-2.5 px-3 text-right">Toplam Satış Hacmi</th>
                <th className="py-2.5 px-3 text-right">Üretilen Komisyon</th>
                <th className="py-2.5 px-3 text-center">Aktif Portföy</th>
                <th className="py-2.5 px-3 text-center">Müşteri Havuzu</th>
                <th className="py-2.5 px-3 text-right">Dönüşüm Oranı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {leaderboardData.map((agent, index) => {
                const badgeColor =
                  index === 0
                    ? "bg-amber-100 text-amber-900 border-amber-300 font-bold"
                    : index === 1
                    ? "bg-slate-200 text-slate-800 border-slate-400 font-bold"
                    : index === 2
                    ? "bg-amber-700/10 text-amber-800 border-amber-700/30 font-bold"
                    : "bg-slate-50 text-slate-500 border-slate-200";

                const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;

                return (
                  <tr key={agent.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 text-xs border ${badgeColor}`}>
                        {medal}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#1d2566] text-xs font-sans">{agent.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{agent.role}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {agent.closedDeals} İşlem
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#1d2566]">
                      {agent.volume.toLocaleString("tr-TR")} GBP
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">
                      {agent.commission.toLocaleString("tr-TR")} GBP
                    </td>
                    <td className="py-3 px-3 text-center text-slate-700">
                      {agent.activeListings}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-700">
                      {agent.clientCount}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#00adb5]">
                      {agent.conversionRate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GRAFİK BÖLÜMÜ 5: MÜŞTERİ EDİNME KANALLARI (BAR CHART) */}
      <div className="sharp-card p-5 bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-[#1d2566] font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00adb5]" />
              Pazarlama Kanalları & Müşteri Getirisi (Lead Acquisition)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Hangi pazarlama ve ilan kanalından kaç potansiyel müşteri havuzumuza kazandırıldı?
            </p>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={channelData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#cbd5e1",
                  borderRadius: "0px",
                  fontSize: "12px",
                }}
                formatter={(val: any) => [`${val} Müşteri Talebi`, "Kayıtlı Lead"]}
              />
              <Bar dataKey="count" fill="#00adb5" radius={[0, 0, 0, 0]} barSize={36}>
                {channelData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? "#00adb5" : index === 1 ? "#1d2566" : index === 2 ? "#10b981" : "#64748b"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
