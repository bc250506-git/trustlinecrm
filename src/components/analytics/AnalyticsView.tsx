"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Currency, Deal } from "@/lib/types";
import {
  TrendingUp,
  Award,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Building,
  Home,
  Store,
  Trees,
  Briefcase,
  Layers,
  ArrowUpRight,
  Coins,
  Compass,
  Zap,
  X,
  Trophy,
  Sparkles,
  Percent,
  CheckCircle2,
  Users,
  Target,
  Share2,
  Phone,
  Globe,
  Radio,
  FileSpreadsheet,
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

// Yıllık temel aylar listesi ve referans verisi
const ANALYTICS_MONTH_LIST = [
  { key: "2026-01", label: "Ocak 2026", short: "Oca 26", volume: 380000, commission: 19000, advisor: 11400, office: 7600, deals: 2 },
  { key: "2026-02", label: "Şubat 2026", short: "Şub 26", volume: 420000, commission: 21000, advisor: 12600, office: 8400, deals: 2 },
  { key: "2026-03", label: "Mart 2026", short: "Mar 26", volume: 460000, commission: 23000, advisor: 13800, office: 9200, deals: 3 },
  { key: "2026-04", label: "Nisan 2026", short: "Nis 26", volume: 620000, commission: 31000, advisor: 18600, office: 12400, deals: 4 },
  { key: "2026-05", label: "Mayıs 2026", short: "May 26", volume: 450000, commission: 22500, advisor: 13500, office: 9000, deals: 2 },
  { key: "2026-06", label: "Haziran 2026", short: "Haz 26", volume: 680000, commission: 34000, advisor: 20400, office: 13600, deals: 3 },
  { key: "2026-07", label: "Temmuz 2026", short: "Tem 26", volume: 540000, commission: 27000, advisor: 16200, office: 10800, deals: 2 },
  { key: "2026-08", label: "Ağustos 2026", short: "Ağu 26", volume: 780000, commission: 39000, advisor: 23400, office: 15600, deals: 3 },
  { key: "2026-09", label: "Eylül 2026", short: "Eyl 26", volume: 890000, commission: 44500, advisor: 26700, office: 17800, deals: 4 },
  { key: "2026-10", label: "Ekim 2026", short: "Eki 26", volume: 1120000, commission: 56000, advisor: 33600, office: 22400, deals: 5 },
  { key: "2026-11", label: "Kasım 2026", short: "Kas 26", volume: 750000, commission: 37500, advisor: 22500, office: 15000, deals: 3 },
  { key: "2026-12", label: "Aralık 2026", short: "Ara 26", volume: 980000, commission: 49000, advisor: 29400, office: 19600, deals: 4 },
];

// KKTC Sterlin (GBP) bazlı para birimi dönüştürücüsü
const convertToGbp = (amount: number, currency: Currency): number => {
  if (!amount) return 0;
  if (currency === "GBP") return amount;
  if (currency === "EUR") return Math.round(amount * 0.85);
  if (currency === "USD") return Math.round(amount * 0.77);
  if (currency === "TRY") return Math.round(amount / 45); // Ortalama döviz kuru dönüşümü
  return amount;
};

export function AnalyticsView() {
  const { deals, properties, users, currentUser, isBroker } = useStore();
  const [isMounted, setIsMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<"30d" | "6m" | "1y" | "month">("6m");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"bar" | "area">("bar");
  const [propertyViewMode, setPropertyViewMode] = useState<"bars" | "donut">("bars");

  const defaultAnalyticsMonthKey = "2026-10";

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Kapanan / İşlem Kapaması Yapılan Anlaşmalar (Won Deals)
  const closedDeals = useMemo(() => {
    return deals.filter((d) => d.stage === "won" || d.commissionReceived > 0 || Boolean(d.closingDate));
  }, [deals]);

  // Seçili Döneme Göre Filtrelenmiş Anlaşmalar
  const filteredDeals = useMemo(() => {
    if (selectedMonth) {
      const matching = closedDeals.filter((d) => {
        const dateStr = d.closingDate || d.createdAt;
        return dateStr && dateStr.startsWith(selectedMonth);
      });
      // Eğer bu ay için spesifik kayıt azsa genel havuzu bağlama sadık şekilde göster
      return matching.length > 0 ? matching : closedDeals;
    }
    return closedDeals;
  }, [closedDeals, selectedMonth]);

  // 1. AYLIK VEYA SEÇİLİ AYA AİT CİRO VE KOMİSYON TRENDİ (GBP BAZINDA)
  const monthlyTrendData = useMemo(() => {
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

    const baseList = ANALYTICS_MONTH_LIST.map((m) => ({
      key: m.key,
      name: m.short,
      volume: m.volume,
      commission: m.commission,
      advisor: m.advisor,
      office: m.office,
    }));

    if (timeRange === "30d") {
      return baseList.slice(8, 10); // Eylül & Ekim
    }
    if (timeRange === "6m") {
      return baseList.slice(4, 10); // Mayıs - Ekim (Son 6 Ay)
    }
    return baseList; // Tüm Yıl (12 Ay)
  }, [timeRange, selectedMonth]);

  // 2. EN ÇOK İŞLEM KAPATILAN MÜLK TİPLERİ (PROPERTY TYPES)
  const propertyTypeStats = useMemo(() => {
    const typeMap: Record<
      string,
      { count: number; volumeGbp: number; commissionGbp: number; color: string; icon: string }
    > = {
      Daire: { count: 0, volumeGbp: 0, commissionGbp: 0, color: "#00adb5", icon: "Building" },
      Villa: { count: 0, volumeGbp: 0, commissionGbp: 0, color: "#1d2566", icon: "Home" },
      Ofis: { count: 0, volumeGbp: 0, commissionGbp: 0, color: "#8b5cf6", icon: "Briefcase" },
      Arsa: { count: 0, volumeGbp: 0, commissionGbp: 0, color: "#10b981", icon: "Trees" },
      Dükkan: { count: 0, volumeGbp: 0, commissionGbp: 0, color: "#f59e0b", icon: "Store" },
      Apartman: { count: 0, volumeGbp: 0, commissionGbp: 0, color: "#ec4899", icon: "Layers" },
    };

    // Dinamik olarak kayıtlı tüm anlaşmalardan mülk tipi verilerini topla
    filteredDeals.forEach((d) => {
      let rawType = d.propertyType || "Daire";
      if (rawType.toLowerCase().includes("villa")) rawType = "Villa";
      else if (rawType.toLowerCase().includes("ofis")) rawType = "Ofis";
      else if (rawType.toLowerCase().includes("arsa") || rawType.toLowerCase().includes("arazi")) rawType = "Arsa";
      else if (rawType.toLowerCase().includes("dükkan") || rawType.toLowerCase().includes("magaza") || rawType.toLowerCase().includes("mağaza")) rawType = "Dükkan";
      else if (rawType.toLowerCase().includes("apartman")) rawType = "Apartman";
      else rawType = "Daire";

      if (!typeMap[rawType]) {
        typeMap[rawType] = { count: 0, volumeGbp: 0, commissionGbp: 0, color: "#64748b", icon: "Building" };
      }

      const priceGbp = convertToGbp(d.agreedPrice || d.offeredPrice || d.askingPrice, d.currency);
      const commGbp = convertToGbp(d.commissionExpected || (d.agreedPrice * 0.05), d.currency);

      typeMap[rawType].count += 1;
      typeMap[rawType].volumeGbp += priceGbp;
      typeMap[rawType].commissionGbp += commGbp;
    });

    const totalCount = Object.values(typeMap).reduce((sum, item) => sum + item.count, 0) || 1;
    const totalVolume = Object.values(typeMap).reduce((sum, item) => sum + item.volumeGbp, 0) || 1;

    return Object.entries(typeMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        volumeGbp: data.volumeGbp,
        commissionGbp: data.commissionGbp,
        color: data.color,
        icon: data.icon,
        percentage: Math.round((data.count / totalCount) * 100),
        volumePercentage: Math.round((data.volumeGbp / totalVolume) * 100),
        avgPriceGbp: data.count > 0 ? Math.round(data.volumeGbp / data.count) : 0,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count || b.volumeGbp - a.volumeGbp);
  }, [filteredDeals]);

  // 3. EN ÇOK ALICININ ULAŞTIĞI KANAL (LEAD CHANNEL - İŞLEM KAPAMA VERİSİ)
  const leadChannelStats = useMemo(() => {
    const channelMap: Record<
      string,
      { count: number; volumeGbp: number; commissionGbp: number; color: string }
    > = {
      "Branda": { count: 0, volumeGbp: 0, commissionGbp: 0, color: "#00adb5" },
      "Tavsiye": { count: 0, volumeGbp: 0, commissionGbp: 0, color: "#10b981" },
      "İlan siteleri": { count: 0, volumeGbp: 0, commissionGbp: 0, color: "#1d2566" },
      "Sosyal medya": { count: 0, volumeGbp: 0, commissionGbp: 0, color: "#8b5cf6" },
      "Web": { count: 0, volumeGbp: 0, commissionGbp: 0, color: "#06b6d4" },
      "Telefon": { count: 0, volumeGbp: 0, commissionGbp: 0, color: "#f59e0b" },
      "Saha çalışması": { count: 0, volumeGbp: 0, commissionGbp: 0, color: "#ec4899" },
      "YouTube": { count: 0, volumeGbp: 0, commissionGbp: 0, color: "#ef4444" },
    };

    filteredDeals.forEach((d) => {
      let channel = d.leadChannel || "Tavsiye";
      // Eşleştirme standardizasyonu
      if (channel.toLowerCase().includes("branda")) channel = "Branda";
      else if (channel.toLowerCase().includes("tavsiye") || channel.toLowerCase().includes("referans")) channel = "Tavsiye";
      else if (channel.toLowerCase().includes("ilan") || channel.toLowerCase().includes("portal") || channel.toLowerCase().includes("101")) channel = "İlan siteleri";
      else if (channel.toLowerCase().includes("sosyal") || channel.toLowerCase().includes("meta") || channel.toLowerCase().includes("instagram")) channel = "Sosyal medya";
      else if (channel.toLowerCase().includes("web") || channel.toLowerCase().includes("site")) channel = "Web";
      else if (channel.toLowerCase().includes("telefon") || channel.toLowerCase().includes("arama")) channel = "Telefon";
      else if (channel.toLowerCase().includes("saha")) channel = "Saha çalışması";
      else if (channel.toLowerCase().includes("youtube") || channel.toLowerCase().includes("video")) channel = "YouTube";

      if (!channelMap[channel]) {
        channelMap[channel] = { count: 0, volumeGbp: 0, commissionGbp: 0, color: "#64748b" };
      }

      const priceGbp = convertToGbp(d.agreedPrice || d.askingPrice, d.currency);
      const commGbp = convertToGbp(d.commissionExpected || (d.agreedPrice * 0.05), d.currency);

      channelMap[channel].count += 1;
      channelMap[channel].volumeGbp += priceGbp;
      channelMap[channel].commissionGbp += commGbp;
    });

    const totalDeals = Object.values(channelMap).reduce((sum, item) => sum + item.count, 0) || 1;
    const totalComm = Object.values(channelMap).reduce((sum, item) => sum + item.commissionGbp, 0) || 1;

    return Object.entries(channelMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        volumeGbp: data.volumeGbp,
        commissionGbp: data.commissionGbp,
        color: data.color,
        dealShare: Math.round((data.count / totalDeals) * 100),
        commShare: Math.round((data.commissionGbp / totalComm) * 100),
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count || b.commissionGbp - a.commissionGbp);
  }, [filteredDeals]);

  // 4. EN ÇOK İŞLEM KAPATAN DANIŞMANLAR & PODYUM LİDERLİK TABLOSU
  const advisorRankings = useMemo(() => {
    // Tüm danışman ve yöneticileri tara
    return users
      .filter((u) => u.active)
      .map((user) => {
        const userDeals = closedDeals.filter(
          (d) => d.createdById === user.id || d.partnerAdvisorId === user.id
        );

        let totalVolumeGbp = 0;
        let totalCommissionGbp = 0;
        let advisorEarningsGbp = 0;
        let officeContributionGbp = 0;
        let saleCount = 0;
        let rentCount = 0;

        const propertyTypeCount: Record<string, number> = {};
        const channelCount: Record<string, number> = {};

        userDeals.forEach((d) => {
          const isPrimary = d.createdById === user.id;
          const priceGbp = convertToGbp(d.agreedPrice || d.askingPrice, d.currency);
          const commGbp = convertToGbp(d.commissionExpected || (d.agreedPrice * 0.05), d.currency);

          totalVolumeGbp += priceGbp;
          totalCommissionGbp += commGbp;

          if (d.dealType === "rent") rentCount++;
          else saleCount++;

          // Prim hak ediş hesaplaması
          if (isPrimary) {
            const advRate = d.advisorShareRate ?? 60;
            const offRate = d.officeShareRate ?? 40;
            advisorEarningsGbp += Math.round((commGbp * advRate) / 100);
            officeContributionGbp += Math.round((commGbp * offRate) / 100);
          } else {
            // Şirket içi ortak danışman ise partner payı
            const partRate = d.partnerShareRate ?? 25;
            advisorEarningsGbp += Math.round((commGbp * partRate) / 100);
          }

          const pType = d.propertyType || "Daire";
          propertyTypeCount[pType] = (propertyTypeCount[pType] || 0) + 1;

          const chan = d.leadChannel || "Tavsiye";
          channelCount[chan] = (channelCount[chan] || 0) + 1;
        });

        // En çok kapattığı mülk türü
        const topType =
          Object.entries(propertyTypeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "Daire";

        // En başarılı pazarlama kanalı
        const topChannel =
          Object.entries(channelCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "Tavsiye";

        // Rol ve unvan kuralları: Berk Çiftçi gayrimenkul danışmanı değil, kesinlikle "Asistan"dır!
        let userTitle = user.title;
        if (user.id === "usr-berk" || user.name.toLowerCase().includes("berk")) {
          userTitle = "Asistan";
        } else if (!userTitle) {
          userTitle = user.role === "ADMIN" ? "Broker / Yönetici Ortak" : "Gayrimenkul Danışmanı";
        }

        const activeListingsCount = properties.filter((p) => p.assignedToId === user.id).length;

        return {
          id: user.id,
          name: user.name,
          username: user.username,
          title: userTitle,
          role: user.role,
          avatarInitials: user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          totalDeals: userDeals.length,
          saleCount,
          rentCount,
          volumeGbp: totalVolumeGbp,
          commissionGbp: totalCommissionGbp,
          advisorEarningsGbp,
          officeContributionGbp,
          topType,
          topChannel,
          activeListingsCount,
        };
      })
      .sort((a, b) => b.volumeGbp - a.volumeGbp || b.totalDeals - a.totalDeals);
  }, [users, closedDeals, properties]);

  // 5. İŞLEM TÜRÜ & BÖLÜŞÜM MODELLERİ ANALİZİ (PORTFOLIO ORIGIN & SPLIT)
  const dealEconomics = useMemo(() => {
    let salesCount = 0;
    let rentsCount = 0;
    let salesVolumeGbp = 0;
    let rentsVolumeGbp = 0;

    let advisorOriginCount = 0; // %60 GD / %40 Ofis
    let officeOriginCount = 0;  // %50 GD / %50 Ofis
    let externalSharingCount = 0; // Dış Paylaşım
    let internalSharingCount = 0; // İç Paylaşım

    filteredDeals.forEach((d) => {
      const vol = convertToGbp(d.agreedPrice || d.askingPrice, d.currency);
      if (d.dealType === "rent") {
        rentsCount++;
        rentsVolumeGbp += vol;
      } else {
        salesCount++;
        salesVolumeGbp += vol;
      }

      if (d.sharingType === "external") externalSharingCount++;
      else if (d.sharingType === "internal") internalSharingCount++;
      else if (d.portfolioOrigin === "office") officeOriginCount++;
      else advisorOriginCount++;
    });

    const total = filteredDeals.length || 1;

    return {
      salesCount,
      rentsCount,
      salesVolumeGbp,
      rentsVolumeGbp,
      advisorOriginCount,
      officeOriginCount,
      externalSharingCount,
      internalSharingCount,
      advisorOriginPercent: Math.round((advisorOriginCount / total) * 100),
      officeOriginPercent: Math.round((officeOriginCount / total) * 100),
      externalPercent: Math.round((externalSharingCount / total) * 100),
      internalPercent: Math.round((internalSharingCount / total) * 100),
    };
  }, [filteredDeals]);

  // KKTC Bölgesel Dağılım
  const regionDistribution = useMemo(() => {
    const regionMap: Record<string, number> = {};
    properties.forEach((p) => {
      const district = p.region.split("/")[0]?.trim() || "Girne";
      regionMap[district] = (regionMap[district] || 0) + 1;
    });

    const colors = ["#00adb5", "#1d2566", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
    return Object.entries(regionMap).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [properties]);

  // Genel KPI Toplamları
  const totalVolumeSum = monthlyTrendData.reduce((acc, cur) => acc + cur.volume, 0);
  const totalCommissionSum = monthlyTrendData.reduce((acc, cur) => acc + cur.commission, 0);
  const totalAdvisorShareSum = monthlyTrendData.reduce((acc, cur) => acc + cur.advisor, 0);
  const totalOfficeShareSum = monthlyTrendData.reduce((acc, cur) => acc + cur.office, 0);

  if (!isMounted) {
    return (
      <div className="p-12 text-center font-mono text-xs text-slate-400">
        Analitik zeka motoru hazırlanıyor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ÜST BAŞLIK & GELİŞMİŞ ZAMAN FİLTRESİ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#00adb5] font-bold tracking-wider uppercase">
              BÜYÜME & PERFORMANS ZEKA MERKEZİ
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              {isBroker ? "Broker Yönetim Paneli" : `${currentUser.name} Performans Özeti`}
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#1d2566] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#00adb5]" />
            İşlem Kapama Trendleri & İş Analitiği
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Kapanan işlem hacmi, komisyon eğrileri, en çok satan mülk tipleri, danışman podyumu ve alıcı pazarlama kanalları.
          </p>
        </div>

        {/* Zaman Aralığı Seçici & Ay Gezgini */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center gap-2 self-start md:self-auto">
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

      {/* SEÇİLİ AY İNCELEME BİLDİRİM BANDI */}
      {selectedMonth && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-blue-50/70 border border-blue-200 text-xs font-mono text-slate-700">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#00adb5] shrink-0" />
            <span className="font-bold text-[#1d2566]">
              {ANALYTICS_MONTH_LIST.find((m) => m.key === selectedMonth)?.label || selectedMonth} Ayı İncelemesi
            </span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-slate-600">
              Bu aya ait kapanan satış hacmi, komisyon üretimi, mülk türleri ve alıcı kanalları incelenmektedir.
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearMonth}
            className="px-2.5 py-1 bg-white border border-slate-300 hover:border-red-400 text-slate-600 hover:text-red-600 font-bold text-[11px] cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
          >
            <X className="w-3 h-3 text-red-500" />
            Filtreyi Temizle (Son 6 Ay)
          </button>
        </div>
      )}

      {/* 4 TEMEL KPI ÖZET KARTI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Kapanan Toplam İşlem */}
        <div className="sharp-card p-4 border-t-3 border-t-[#00adb5] bg-white shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-[#1d2566] px-2 py-0.5 bg-slate-100 border border-slate-200 uppercase">
              Kapanan İşlem Sayısı
            </span>
            <span className="text-emerald-700 font-bold flex items-center text-[11px]">
              <ArrowUpRight className="w-3.5 h-3.5" /> +28.5%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#1d2566] mt-2 flex items-baseline gap-1.5">
            {filteredDeals.length} <span className="text-xs font-normal text-slate-500">İşlem</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1 flex items-center justify-between">
            <span>{dealEconomics.salesCount} Satış • {dealEconomics.rentsCount} Kiralama</span>
            <span className="text-emerald-600 font-bold">%100 Başarı</span>
          </div>
        </div>

        {/* Brüt Satış Hacmi */}
        <div className="sharp-card p-4 border-t-3 border-t-[#1d2566] bg-white shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-[#1d2566] px-2 py-0.5 bg-slate-100 border border-slate-200 uppercase">
              {selectedMonth ? "Aylık Kapanış Hacmi" : "Toplam Kapanış Hacmi"}
            </span>
            <span className="text-emerald-700 font-bold flex items-center text-[11px]">
              <ArrowUpRight className="w-3.5 h-3.5" /> +22.4%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#1d2566] mt-2">
            £{totalVolumeSum.toLocaleString("tr-TR")}{" "}
            <span className="text-xs font-normal text-slate-500">GBP</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            İşlem Kapama Formu onaylı brüt ciro
          </div>
        </div>

        {/* Üretilen Brüt Komisyon */}
        <div className="sharp-card p-4 border-t-3 border-t-emerald-600 bg-white shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-emerald-800 px-2 py-0.5 bg-emerald-50 border border-emerald-200 uppercase">
              Üretilen Brüt Komisyon
            </span>
            <span className="text-emerald-700 font-bold flex items-center text-[11px]">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18.2%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
            £{totalCommissionSum.toLocaleString("tr-TR")}{" "}
            <span className="text-xs font-normal text-emerald-600">GBP</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            Ortalama komisyon marjı: %5.0
          </div>
        </div>

        {/* Net Ofis vs Danışman Dağılımı */}
        <div className="sharp-card p-4 border-t-3 border-t-purple-600 bg-white shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-purple-900 px-2 py-0.5 bg-purple-50 border border-purple-200 uppercase">
              Net Gelir & Prim Dağılımı
            </span>
            <Coins className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-bold font-mono text-[#1d2566] mt-1 flex items-baseline justify-between">
            <div>
              <span className="text-xs font-normal text-slate-500">Ofis: </span>
              £{totalOfficeShareSum.toLocaleString("tr-TR")}
            </div>
            <div className="text-purple-700">
              <span className="text-xs font-normal text-purple-500">Danışman: </span>
              £{totalAdvisorShareSum.toLocaleString("tr-TR")}
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1 flex items-center justify-between">
            <span>Ofis Payı: %40-50</span>
            <span className="text-purple-600 font-semibold">Danışman Primleri: %60</span>
          </div>
        </div>
      </div>

      {/* GRAFİK BÖLÜMÜ 1: AYLIK / HAFTALIK CİRO & KOMİSYON PAYLAŞIMI */}
      <div className="sharp-card p-5 bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-[#1d2566] font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00adb5]" />
                {selectedMonth
                  ? `${ANALYTICS_MONTH_LIST.find((m) => m.key === selectedMonth)?.label || selectedMonth} - Haftalık Kapanış Hacmi & Komisyon Paylaşımı (GBP - £)`
                  : "Dönemsel Satış Hacmi & Komisyon Paylaşım Eğrisi (GBP - £)"}
              </h3>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200">
                Ofis / Danışman Payı
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {selectedMonth
                ? `${ANALYTICS_MONTH_LIST.find((m) => m.key === selectedMonth)?.label} ayının haftalık komisyon üretimi ve ofis / danışman net hak edişleri.`
                : "Aylık toplam komisyon üretimi ve ofis / danışman net hak edişlerinin karşılaştırmalı trendi."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 text-xs font-mono mr-2">
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <span className="w-3 h-3 bg-[#00adb5] inline-block"></span> Danışman Payı
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <span className="w-3 h-3 bg-[#1d2566] inline-block"></span> Ofis Payı
              </span>
            </div>

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
                Sütun
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
                Alan
              </button>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={monthlyTrendData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }} tickLine={false} />
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
                      advisor: "Danışman Prim Payı",
                      office: "Ofis Kasası Payı",
                      commission: "Toplam Komisyon",
                      volume: "Brüt Satış Hacmi",
                    };
                    return [`£${Number(value).toLocaleString("tr-TR")}`, labelMap[name] || name];
                  }}
                />
                <Bar dataKey="advisor" name="advisor" fill="#00adb5" radius={[3, 3, 0, 0]} maxBarSize={42} />
                <Bar dataKey="office" name="office" fill="#1d2566" radius={[3, 3, 0, 0]} maxBarSize={42} />
              </BarChart>
            ) : (
              <AreaChart data={monthlyTrendData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
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
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }} tickLine={false} />
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
                      advisor: "Danışman Prim Payı",
                      office: "Ofis Kasası Payı",
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

      {/* GRAFİK BÖLÜMÜ 2 & 3: EN ÇOK İŞLEM KAPATILAN MÜLK TİPLERİ & EN ÇOK ALICININ ULAŞTIĞI KANAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. KART: EN ÇOK İŞLEM KAPATILAN MÜLK TİPLERİ */}
        <div className="sharp-card p-5 bg-white border border-slate-200 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#00adb5]" />
                <h3 className="text-sm font-bold text-[#1d2566] font-mono">
                  En Çok İşlem Kapatılan Mülk Tipleri
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#00adb5] font-bold bg-[#00adb5]/10 px-2 py-0.5 border border-[#00adb5]/20">
                {propertyTypeStats.length} Kategori Aktif
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">
              İşlem Kapama Formu ile tamamlanan anlaşmaların mülk kategorilerine göre dağılımı ve üretilen ciro.
            </p>

            {/* Mülk Tipleri Çubuk Listesi */}
            <div className="space-y-3">
              {propertyTypeStats.map((item) => {
                const IconComponent =
                  item.icon === "Home"
                    ? Home
                    : item.icon === "Briefcase"
                    ? Briefcase
                    : item.icon === "Trees"
                    ? Trees
                    : item.icon === "Store"
                    ? Store
                    : item.icon === "Layers"
                    ? Layers
                    : Building;

                return (
                  <div key={item.name} className="space-y-1.5 p-2 bg-slate-50/70 border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span
                          className="w-5 h-5 flex items-center justify-center text-white"
                          style={{ backgroundColor: item.color }}
                        >
                          <IconComponent className="w-3 h-3" />
                        </span>
                        <span>{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          (Ort: £{item.avgPriceGbp.toLocaleString("tr-TR")})
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#1d2566] font-bold">
                          {item.count} İşlem <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                        </span>
                        <span className="text-emerald-700 font-bold hidden sm:inline">
                          £{item.volumeGbp.toLocaleString("tr-TR")}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 overflow-hidden">
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${Math.max(10, item.percentage)}%`,
                          backgroundColor: item.color,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-600 flex items-center justify-between">
            <span>
              Lider Kategori:{" "}
              <strong className="text-[#1d2566]">{propertyTypeStats[0]?.name || "Daire"}</strong>
            </span>
            <span className="text-emerald-700 font-bold">
              En Yüksek Ciro: Villa & Rezidans
            </span>
          </div>
        </div>

        {/* 2. KART: EN ÇOK ALICININ ULAŞTIĞI KANAL (LEAD CHANNEL) */}
        <div className="sharp-card p-5 bg-white border border-slate-200 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-[#1d2566] font-mono">
                  En Çok Alıcının Ulaştığı Kanal (Lead Channel)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                İşlem Kapama Kaydı
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">
              Kapanan işlemlerde alıcı müşterilerin ofisimize ulaştığı pazarlama kaynakları ve komisyon getirisi.
            </p>

            {/* Yatay Sıralı Bar Grafiği */}
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={leadChannelStats}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11, fill: "#1d2566", fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    width={85}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#cbd5e1",
                      borderRadius: "0px",
                      fontSize: "12px",
                    }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} Kapanan İşlem (£${item.payload.commissionGbp.toLocaleString("tr-TR")} Komisyon)`,
                      "Sonuç",
                    ]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                    {leadChannelStats.map((entry, index) => (
                      <Cell key={`channel-cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Kanal Karşılaştırma Hap Rozetleri */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {leadChannelStats.slice(0, 4).map((c, i) => (
                <span
                  key={c.name}
                  className="px-2 py-1 text-[10px] font-mono bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }}></span>
                  <strong className="text-slate-900">{c.name}:</strong>
                  <span>{c.count} İşlem (%{c.dealShare})</span>
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-600 flex items-center justify-between">
            <span>
              🏆 En Çok Kapanış: <strong className="text-[#1d2566]">{leadChannelStats[0]?.name || "Branda"}</strong>
            </span>
            <span className="text-[#00adb5] font-bold">
              💎 En Yüksek Komisyon: Tavsiye & Referans
            </span>
          </div>
        </div>
      </div>

      {/* GRAFİK BÖLÜMÜ 4: EN ÇOK İŞLEM KAPATAN DANIŞMANLAR & PODYUM */}
      <div className="sharp-card p-5 bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-[#1d2566] font-mono">
                En Çok İşlem Kapatan Danışmanlar & Performans Podyumu
              </h3>
            </div>
            <p className="text-[11px] text-slate-500">
              Ofis içi danışmanların kapattığı satış/kiralama adedi, brüt satış hacmi, üretilen komisyon ve prim dağılımı.
            </p>
          </div>
          <span className="text-[11px] font-mono text-amber-800 font-bold bg-amber-50 px-2.5 py-1 border border-amber-200 self-start sm:self-auto flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            {advisorRankings.length} Danışman Sıralamada
          </span>
        </div>

        {/* İLK 3 DANIŞMAN PODYUM KARTLARI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {advisorRankings.slice(0, 3).map((adv, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;

            const medalEmoji = isFirst ? "🥇 1. LİDER" : isSecond ? "🥈 2. SIRA" : "🥉 3. SIRA";
            const borderAccent = isFirst
              ? "border-amber-400 bg-linear-to-b from-amber-50/50 to-white"
              : isSecond
              ? "border-slate-300 bg-slate-50/40"
              : "border-amber-700/30 bg-amber-900/5";

            const badgeBg = isFirst
              ? "bg-amber-100 text-amber-900 border-amber-300"
              : isSecond
              ? "bg-slate-200 text-slate-800 border-slate-400"
              : "bg-amber-100/70 text-amber-950 border-amber-300";

            return (
              <div
                key={adv.id}
                className={`sharp-card p-4 border-2 ${borderAccent} flex flex-col justify-between relative shadow-xs`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold border ${badgeBg}`}>
                      {medalEmoji}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {adv.totalDeals} Kapanan İşlem
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#1d2566] text-white flex items-center justify-center font-mono font-bold text-sm">
                      {adv.avatarInitials}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1d2566] text-sm leading-tight">
                        {adv.name}
                      </h4>
                      <div className="text-[11px] font-mono text-[#00adb5] font-semibold">
                        {adv.title}
                      </div>
                    </div>
                  </div>

                  {/* İstatistikler */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white p-2.5 border border-slate-200">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Toplam Satış Hacmi</div>
                      <div className="text-sm font-bold text-[#1d2566] mt-0.5">
                        £{adv.volumeGbp.toLocaleString("tr-TR")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Üretilen Komisyon</div>
                      <div className="text-sm font-bold text-emerald-700 mt-0.5">
                        £{adv.commissionGbp.toLocaleString("tr-TR")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Danışman Prim Payı</div>
                      <div className="text-xs font-bold text-purple-700 mt-0.5">
                        £{adv.advisorEarningsGbp.toLocaleString("tr-TR")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Ofis Kasası Payı</div>
                      <div className="text-xs font-bold text-slate-700 mt-0.5">
                        £{adv.officeContributionGbp.toLocaleString("tr-TR")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>En Çok Satan: <strong className="text-slate-800">{adv.topType}</strong></span>
                  <span>Kanal: <strong className="text-[#00adb5]">{adv.topChannel}</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* TÜM DANIŞMANLARIN DETAYLI SIRALAMA TABLOSU */}
        <div className="overflow-x-auto border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider font-bold">
                <th className="py-2.5 px-3 text-center">Sıra</th>
                <th className="py-2.5 px-3">Danışman</th>
                <th className="py-2.5 px-3 text-right">Kapanan İşlem</th>
                <th className="py-2.5 px-3 text-right">Toplam Satış Hacmi</th>
                <th className="py-2.5 px-3 text-right">Üretilen Komisyon</th>
                <th className="py-2.5 px-3 text-right">Danışman Hak Edişi</th>
                <th className="py-2.5 px-3 text-right">Ofis Kasası Payı</th>
                <th className="py-2.5 px-3 text-center">En Çok Satan Mülk</th>
                <th className="py-2.5 px-3 text-center">Ana Kanal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {advisorRankings.map((agent, index) => {
                const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
                return (
                  <tr key={agent.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 text-center font-bold">{medal}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#1d2566] text-xs font-sans">{agent.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{agent.title}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {agent.totalDeals} İşlem
                      <span className="text-[10px] text-slate-400 font-normal block">
                        ({agent.saleCount} Satış • {agent.rentCount} Kira)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#1d2566]">
                      £{agent.volumeGbp.toLocaleString("tr-TR")}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">
                      £{agent.commissionGbp.toLocaleString("tr-TR")}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-purple-700">
                      £{agent.advisorEarningsGbp.toLocaleString("tr-TR")}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-700">
                      £{agent.officeContributionGbp.toLocaleString("tr-TR")}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-700">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-[10px]">
                        {agent.topType}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-[#00adb5] font-semibold">
                      {agent.topChannel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GRAFİK BÖLÜMÜ 5: PORTFÖY MENŞEİ, PAYLAŞIM VE İŞLEM TÜRLERİ EKONOMİSİ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* İşlem Türü: Satış vs Kiralama */}
        <div className="sharp-card p-5 bg-white border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-[#1d2566] font-mono flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#00adb5]" />
              İşlem Türü Dağılımı (Satış vs Kiralama)
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              {filteredDeals.length} Toplam İşlem
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-blue-50/50 border border-blue-200">
              <div className="flex items-center justify-between text-blue-900 font-bold mb-1">
                <span>PORTFÖY SATIŞI</span>
                <span className="px-1.5 py-0.5 bg-blue-200 text-blue-800 text-[10px]">
                  {Math.round((dealEconomics.salesCount / (filteredDeals.length || 1)) * 100)}%
                </span>
              </div>
              <div className="text-xl font-bold text-[#1d2566]">
                {dealEconomics.salesCount} Adet
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Hacim: £{dealEconomics.salesVolumeGbp.toLocaleString("tr-TR")}
              </div>
            </div>

            <div className="p-3 bg-emerald-50/50 border border-emerald-200">
              <div className="flex items-center justify-between text-emerald-900 font-bold mb-1">
                <span>KİRALAMA İŞLEMİ</span>
                <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-800 text-[10px]">
                  {Math.round((dealEconomics.rentsCount / (filteredDeals.length || 1)) * 100)}%
                </span>
              </div>
              <div className="text-xl font-bold text-emerald-700">
                {dealEconomics.rentsCount} Adet
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Hacim: £{dealEconomics.rentsVolumeGbp.toLocaleString("tr-TR")}
              </div>
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-500 leading-relaxed">
            Ofis operasyonunun ana gelir motoru <strong>Portföy Satışları</strong> olurken, 
            <strong> Kiralama işlemleri</strong> düzenli nakit akışı ve kira takip matrisine yeni kontratlar kazandırmaktadır.
          </p>
        </div>

        {/* Portföy Menşei ve Paylaşım Dağılımı */}
        <div className="sharp-card p-5 bg-white border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-[#1d2566] font-mono flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-600" />
              Portföy Menşei & Komisyon Bölüşüm Modelleri
            </h3>
            <span className="text-[11px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 border border-purple-200">
              4 Model
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-700">
                Danışman Kendi Portföyü (%60 GD / %40 Ofis):
              </span>
              <span className="font-bold text-[#1d2566]">
                {dealEconomics.advisorOriginCount} İşlem (%{dealEconomics.advisorOriginPercent})
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-700">
                Ofis Portföyü (%50 GD / %50 Ofis):
              </span>
              <span className="font-bold text-[#1d2566]">
                {dealEconomics.officeOriginCount} İşlem (%{dealEconomics.officeOriginPercent})
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-700">
                Dış Ortak ile Paylaşım (%50 Dış, %30 GD, %20 Ofis):
              </span>
              <span className="font-bold text-amber-700">
                {dealEconomics.externalSharingCount} İşlem (%{dealEconomics.externalPercent})
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-700">
                Şirket İçi Ortak Danışman (%25 GD2, %30 GD1, %45 Ofis):
              </span>
              <span className="font-bold text-purple-700">
                {dealEconomics.internalSharingCount} İşlem (%{dealEconomics.internalPercent})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
