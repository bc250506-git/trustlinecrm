"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import {
  Users,
  Building,
  Calendar,
  AlertCircle,
  AlertTriangle,
  KeyRound,
  CreditCard,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  UserCheck,
  ChevronRight,
  Plus,
  BarChart3,
  TrendingUp,
  Kanban,
  Bell,
  ArrowUpRight,
  Zap,
  UserPlus,
  CalendarPlus,
  FileCheck,
  Calculator,
  RotateCcw,
  X,
} from "lucide-react";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { NotificationCenterDrawer } from "@/components/automation/NotificationCenterDrawer";
import { MonthCalendarView } from "@/components/calendar/MonthCalendarView";
import { AddDealModal } from "@/components/modals/AddDealModal";
import { AddFollowUpModal } from "@/components/modals/AddFollowUpModal";
import { AddCustomerModal } from "@/components/modals/AddCustomerModal";
import { AddPropertyModal } from "@/components/modals/AddPropertyModal";
import { AddMandateModal } from "@/components/modals/AddMandateModal";
import {
  formatFollowUpKind,
  formatCustomerCategory,
  formatCustomerTemperature,
} from "@/lib/formatters";

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
  onOpenCustomer: (customerId: string) => void;
}

export function DashboardView({ onNavigate, onOpenCustomer }: DashboardViewProps) {
  const {
    currentUser,
    isBroker,
    customers,
    properties,
    followUps,
    rentals,
    deals,
    notifications,
    postponeFollowUp,
    completeFollowUp,
    updateFollowUp,
  } = useStore();

  const [lastCompletedTask, setLastCompletedTask] = useState<any | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completeFeedback, setCompleteFeedback] = useState("");
  const [completeOutcome, setCompleteOutcome] = useState("attended");
  const [dashboardTab, setDashboardTab] = useState<"operations" | "analytics">("operations");
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Hızlı İşlem Modalları State
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  const [isAddFollowUpModalOpen, setIsAddFollowUpModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [isAddMandateModalOpen, setIsAddMandateModalOpen] = useState(false);

  // Sayım Mantığı
  const hotCustomers = customers.filter((c) => c.temperature === "hot");
  const activeProperties = properties.filter((p) => p.status === "AVAILABLE");
  const aiApprovedTodayCount = 2; // Simüle edilen bugünkü broker onaylı lead

  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [overdueAndTodayTasks, setOverdueAndTodayTasks] = useState<any[]>([]);
  const [next7DaysTasks, setNext7DaysTasks] = useState<any[]>([]);
  const [fourteenDayInactiveCustomers, setFourteenDayInactiveCustomers] = useState<any[]>([]);
  const [expiringRentals, setExpiringRentals] = useState<any[]>([]);
  const [paymentAlerts, setPaymentAlerts] = useState<any[]>([]);

  React.useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
    const todayStr = now.toISOString().split("T")[0];

    const overdue = followUps.filter((f) => {
      if (f.status !== "open") return false;
      const taskDate = f.dueAt.split("T")[0];
      return taskDate <= todayStr || new Date(f.dueAt) < now;
    });

    const next7 = followUps.filter((f) => {
      if (f.status !== "open") return false;
      const diffDays =
        (new Date(f.dueAt).getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diffDays > 0 && diffDays <= 7;
    });

    // Danışman yalnızca kendi müşterilerini ve kiralarını görür, broker hepsini görür
    const userCustomers = isBroker
      ? customers
      : customers.filter((c) => c.assignedToId === currentUser.id);

    const userRentals = isBroker
      ? rentals
      : rentals.filter((r) => r.assignedToId === currentUser.id);

    // 14 Günlük İletişimsizlik Alarmı
    const fourteen = userCustomers.filter((c) => {
      if (!c.lastContactAt) return true;
      const diffDays =
        (now.getTime() - new Date(c.lastContactAt).getTime()) / (1000 * 3600 * 24);
      return diffDays >= 14;
    });

    // Sözleşme Bitiş Alarmı (Bitişine 30 gün veya daha az kalanlar)
    const expiring = userRentals.filter((r) => {
      if (!r.active || !r.contractEnd) return false;
      const end = new Date(r.contractEnd);
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
      return diff <= 30;
    });

    // Kira Tahsilat / Ödeme Alarmı (Vadesi Geçenler veya Vadesine 3 Gün veya Daha Az Kalanlar)
    const monthNames = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
    ];
    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const payAlerts: any[] = [];
    userRentals.forEach((r) => {
      if (!r.active || !r.payments) return;
      r.payments.forEach((p) => {
        const isFullyPaid =
          p.status === "paid" || (p.paidAmount && p.paidAmount >= p.amount);
        if (isFullyPaid) return;

        if (!p.dueDate) return;
        const dueParts = p.dueDate.split("-");
        const due = new Date(
          Number(dueParts[0]),
          Number(dueParts[1]) - 1,
          Number(dueParts[2])
        );
        const diffDays = Math.ceil(
          (due.getTime() - todayDateOnly.getTime()) / (1000 * 3600 * 24)
        );

        // Kural: Vadesi geçenler (diffDays <= 0) VEYA 3 gün kala başlayan yaklaşanlar (diffDays <= 3)
        if (diffDays <= 3) {
          const remainingAmount = p.amount - (p.paidAmount || 0);
          payAlerts.push({
            rentalId: r.id,
            propertyTitle: r.propertyTitle,
            tenantName: r.tenantName,
            tenantPhone: r.tenantPhone,
            month: p.month,
            monthName: monthNames[p.month - 1] || `${p.month}. Ay`,
            dueDate: p.dueDate,
            diffDays,
            isOverdue: diffDays < 0,
            isToday: diffDays === 0,
            isUpcoming: diffDays > 0,
            amount: p.amount,
            paidAmount: p.paidAmount || 0,
            remainingAmount,
            currency: p.currency || r.currency,
            assignedToName: r.assignedToName,
          });
        }
      });
    });

    payAlerts.sort((a, b) => a.diffDays - b.diffDays);

    setOverdueAndTodayTasks(overdue);
    setNext7DaysTasks(next7);
    setFourteenDayInactiveCustomers(fourteen);
    setExpiringRentals(expiring);
    setPaymentAlerts(payAlerts);
  }, [followUps, customers, rentals, isBroker, currentUser.id]);

  const handleFinishTask = (id: string) => {
    const t = followUps.find((f) => f.id === id);
    completeFollowUp(id, completeOutcome, completeFeedback);
    setCompletingId(null);
    setCompleteFeedback("");
    if (t) setLastCompletedTask(t);
  };

  const handleReopenTask = (id: string) => {
    updateFollowUp(id, {
      status: "open",
      outcome: "pending",
    });
    if (lastCompletedTask?.id === id) {
      setLastCompletedTask(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Karşılama ve Gün Özeti */}
      <div className="sharp-card p-6 border-l-4 border-l-[#00adb5]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-[#00adb5] font-bold tracking-wider uppercase">
                {isBroker ? "BROKER KONTROL MERKEZİ" : "DANIŞMAN GÜNLÜK PLANI"}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-mono">
                Trustline CRM v5.0
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#1d2566] tracking-tight">
              Hoş Geldiniz, {currentUser.name}
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              {dashboardTab === "operations"
                ? "Bugün ilgilenmeniz gereken öncelikli randevular, 14 günü aşan müşteri ilişki alarmları ve aktif portföy durumunuz."
                : "Satış hacmi, komisyon eğrileri, dönüşüm hunisi ve KKTC bölgesel portföy dağılımı analitiği."}
            </p>
          </div>

          {/* Görünüm Değiştirici: Operasyonel vs Analitik */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-300 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setDashboardTab("operations")}
              className={`px-3 py-1.5 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                dashboardTab === "operations"
                  ? "bg-[#1d2566] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#00adb5]" />
              Operasyonel Akış & Alarmlar
            </button>
            <button
              type="button"
              onClick={() => setDashboardTab("analytics")}
              className={`px-3 py-1.5 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                dashboardTab === "analytics"
                  ? "bg-[#1d2566] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
              Finans & Performans Analitiği (v5.0)
            </button>
          </div>
        </div>
      </div>

      {dashboardTab === "analytics" ? (
        <AnalyticsView />
      ) : (
        <>

      {/* Canlı Metrik Sayaçları (Tıklanabilir Hızlı Erişim Blokları) */}
      {(() => {
        // 1. Müşteri Havuzu: Mevcut erişilebilir müşteri sayısı
        const customerCount = customers.length;

        // 2. Aktif Portföy: Yayındaki portföy sayısı
        const activePropertiesCount = properties.filter((p) => p.status === "AVAILABLE").length;

        // 3. Bu Ayki İşlem Sayısı: Yürütülen ve kapanan satış/kiralama anlaşmaları
        const now = currentDate || new Date();
        const monthlyDeals = deals.filter((d) => {
          const dateStr = d.closingDate || d.createdAt;
          if (!dateStr) return true;
          const dDate = new Date(dateStr);
          return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear();
        });
        const monthlyDealsCount = monthlyDeals.length > 0 ? monthlyDeals.length : deals.length;

        // 4. Bugünkü Randevu / Toplantı / Arama / Etkinlikler
        const todayStr = now.toISOString().split("T")[0];
        const todayEvents = followUps.filter((f) => {
          if (f.status !== "open") return false;
          const taskDate = f.dueAt.split("T")[0];
          return taskDate === todayStr;
        });
        const todayActionCount = todayEvents.length > 0 ? todayEvents.length : overdueAndTodayTasks.length;

        // 5. Alarmlar: Aktif otomasyon uyarıları
        const unreadAlertsCount = notifications.filter((n) => !n.read).length;
        const totalAlertsCount = notifications.length;

        return (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Müşteri Havuzu */}
            <button
              type="button"
              onClick={() => onNavigate("customers")}
              className="sharp-card p-4 border-t-3 border-t-[#00adb5] text-left transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group flex flex-col justify-between"
              title="Müşteri Havuzunu Aç"
            >
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1.5 flex items-center justify-between">
                  <span className="group-hover:text-[#00adb5] transition-colors">Müşteri Havuzu</span>
                  <Users className="w-4 h-4 text-[#00adb5] group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-bold text-[#1d2566] font-mono">
                  {customerCount}
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-mono pt-2 border-t border-slate-100">
                <span className="truncate">{isBroker ? "Ofis Genel Havuzu" : "Kişisel & Ortak"}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00adb5] shrink-0 transition-colors" />
              </div>
            </button>

            {/* 2. Aktif Portföy */}
            <button
              type="button"
              onClick={() => onNavigate("properties")}
              className="sharp-card p-4 border-t-3 border-t-[#1d2566] text-left transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group flex flex-col justify-between"
              title="Portföy Yönetimini Aç"
            >
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1.5 flex items-center justify-between">
                  <span className="group-hover:text-[#1d2566] transition-colors">Aktif Portföy</span>
                  <Building className="w-4 h-4 text-[#1d2566] group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-bold text-[#1d2566] font-mono">
                  {activePropertiesCount}
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-mono pt-2 border-t border-slate-100">
                <span className="truncate">{properties.length} Toplam Portföy</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1d2566] shrink-0 transition-colors" />
              </div>
            </button>

            {/* 3. Bu Ayki İşlem Sayısı */}
            <button
              type="button"
              onClick={() => onNavigate("finance")}
              className="sharp-card p-4 border-t-3 border-t-emerald-600 text-left transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group flex flex-col justify-between"
              title="İşlemler (Finans & Komisyon) Ekranını Aç"
            >
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1.5 flex items-center justify-between">
                  <span className="group-hover:text-emerald-700 transition-colors">Bu Ayki İşlemler</span>
                  <Calculator className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-bold text-emerald-700 font-mono">
                  {monthlyDealsCount}
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-mono pt-2 border-t border-slate-100">
                <span className="truncate">{isBroker ? "Ofis İşlem Defteri" : "Kişisel İşlemlerim"}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 transition-colors" />
              </div>
            </button>

            {/* 4. Bugünkü Randevu / Toplantı / Arama */}
            <button
              type="button"
              onClick={() => onNavigate("calendar")}
              className="sharp-card p-4 border-t-3 border-t-amber-500 text-left transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group flex flex-col justify-between"
              title="Ajandayı Aç"
            >
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1.5 flex items-center justify-between">
                  <span className="group-hover:text-amber-700 transition-colors">Bugünkü Randevular</span>
                  <Calendar className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-bold text-amber-700 font-mono">
                  {todayActionCount}
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-mono pt-2 border-t border-slate-100">
                <span className="truncate">Randevu, Toplantı & Arama</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0 transition-colors" />
              </div>
            </button>

            {/* 5. Alarmlar */}
            <button
              type="button"
              onClick={() => setIsNotificationDrawerOpen(true)}
              className="sharp-card p-4 border-t-3 border-t-rose-500 text-left transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group flex flex-col justify-between col-span-2 lg:col-span-1"
              title="Otomasyon & Bildirim Masasını Aç"
            >
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1.5 flex items-center justify-between">
                  <span className="group-hover:text-rose-600 transition-colors">Alarmlar</span>
                  <Bell className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-rose-600 font-mono">
                    {totalAlertsCount}
                  </div>
                  {unreadAlertsCount > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-rose-100 text-rose-700 border border-rose-200">
                      {unreadAlertsCount} Yeni
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-mono pt-2 border-t border-slate-100">
                <span className="truncate">Otomasyon Bildirimleri</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500 shrink-0 transition-colors" />
              </div>
            </button>
          </div>
        );
      })()}

      {/* Hızlı İşlemler Paneli (6 Doğrudan Eylem Kutusu) */}
      <div className="sharp-card p-4 bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#00adb5]" />
            <h2 className="text-xs font-bold text-[#1d2566] tracking-wide font-mono uppercase">
              Hızlı İşlemler
            </h2>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] text-slate-500 font-mono">
              Tek tıkla modal açıp yeni kayıt oluşturun
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. İşlem Kapama Butonu */}
          <button
            type="button"
            onClick={() => setIsAddDealModalOpen(true)}
            className="p-3 bg-slate-50/70 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-400 text-left transition-all cursor-pointer group flex flex-col justify-between shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
            title="Yeni Satış / Komisyon Anlaşması Ekle"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-emerald-100/60 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calculator className="w-4 h-4" />
              </div>
              <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 transition-colors leading-tight">
                İşlem Kapama
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5 leading-tight">
                Satış & Komisyon
              </div>
            </div>
          </button>

          {/* 2. İş Ekleme Butonu */}
          <button
            type="button"
            onClick={() => setIsAddFollowUpModalOpen(true)}
            className="p-3 bg-slate-50/70 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-400 text-left transition-all cursor-pointer group flex flex-col justify-between shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
            title="Ajandaya Yeni Randevu / Takip Ekle"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-amber-100/60 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CalendarPlus className="w-4 h-4" />
              </div>
              <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 transition-colors" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-amber-800 transition-colors leading-tight">
                İş Ekle
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5 leading-tight">
                Randevu & Ajanda
              </div>
            </div>
          </button>

          {/* 3. Müşteri Ekleme Butonu */}
          <button
            type="button"
            onClick={() => setIsAddCustomerModalOpen(true)}
            className="p-3 bg-slate-50/70 hover:bg-cyan-50/60 border border-slate-200 hover:border-[#00adb5] text-left transition-all cursor-pointer group flex flex-col justify-between shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
            title="Yeni Müşteri Kaydı Oluştur"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-cyan-100/60 text-[#00adb5] flex items-center justify-center group-hover:scale-105 transition-transform">
                <UserPlus className="w-4 h-4" />
              </div>
              <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#00adb5] transition-colors" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-[#1d2566] transition-colors leading-tight">
                Müşteri Ekle
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5 leading-tight">
                Müşteri Havuzu
              </div>
            </div>
          </button>

          {/* 4. Portföy Ekleme Butonu */}
          <button
            type="button"
            onClick={() => setIsAddPropertyModalOpen(true)}
            className="p-3 bg-slate-50/70 hover:bg-indigo-50/60 border border-slate-200 hover:border-[#1d2566] text-left transition-all cursor-pointer group flex flex-col justify-between shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
            title="Yeni Gayrimenkul Portföyü Ekle"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-indigo-100/60 text-[#1d2566] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building className="w-4 h-4" />
              </div>
              <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#1d2566] transition-colors" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-[#1d2566] transition-colors leading-tight">
                Portföy Ekle
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5 leading-tight">
                Yeni Gayrimenkul
              </div>
            </div>
          </button>

          {/* 5. Yetki Ekleme Butonu */}
          <button
            type="button"
            onClick={() => setIsAddMandateModalOpen(true)}
            className="p-3 bg-slate-50/70 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-400 text-left transition-all cursor-pointer group flex flex-col justify-between shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
            title="Yeni Tek / Genel Yetki Sözleşmesi Kaydet"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-purple-100/60 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileCheck className="w-4 h-4" />
              </div>
              <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-600 transition-colors" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-purple-800 transition-colors leading-tight">
                Yetki Ekle
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5 leading-tight">
                Sözleşme Kaydı
              </div>
            </div>
          </button>

          {/* 6. Akıllı Eşleştirme Motoru Butonu */}
          <button
            type="button"
            onClick={() => onNavigate("matchmaker")}
            className="p-3 bg-gradient-to-br from-[#00adb5]/5 to-[#1d2566]/5 hover:from-[#00adb5]/10 hover:to-[#1d2566]/10 border border-[#00adb5]/30 hover:border-[#00adb5] text-left transition-all cursor-pointer group flex flex-col justify-between shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
            title="Akıllı Eşleştirme Motoru Ekranını Aç"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-[#00adb5]/15 text-[#00adb5] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#00adb5] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1d2566] group-hover:text-[#00adb5] transition-colors leading-tight">
                Eşleştirme Motoru
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5 leading-tight">
                AI / Algoritma ↗
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* İki Kolonlu Ana Çalışma Alanı */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sol Kolon: Geciken ve Bugün Yapılacaklar (7 Kolon) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="sharp-card">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00adb5]" />
                <h2 className="text-sm font-bold text-[#1d2566] tracking-wide">
                  Geciken ve Bugün Yapılacak Takip Listesi
                </h2>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-white text-[#1d2566] border border-slate-300 font-bold">
                {overdueAndTodayTasks.length} Görev
              </span>
            </div>

            {/* Yanlışlıkla Tamamlayanlar İçin Hızlı Geri Al Bildirimi */}
            {lastCompletedTask && (
              <div className="p-3 bg-amber-50 border-b border-amber-300 flex items-center justify-between gap-3 text-xs font-mono text-amber-950 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>&ldquo;{lastCompletedTask.title}&rdquo;</strong> tamamlandı yapıldı.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleReopenTask(lastCompletedTask.id)}
                    className="px-2.5 py-1 bg-white border border-amber-400 hover:bg-amber-100 text-amber-900 font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Geri Al (Tamamlanmadı Yap)</span>
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

            <div className="divide-y divide-slate-100">
              {overdueAndTodayTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-mono">
                  Bugün için vadesi geçmiş veya planlanmış açık takip bulunmuyor.
                </div>
              ) : (
                overdueAndTodayTasks.map((task) => {
                  const isPast = currentDate ? new Date(task.dueAt) < currentDate : false;
                  const isCompleting = completingId === task.id;

                  return (
                    <div key={task.id} className="p-4 hover:bg-slate-50/80 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-mono uppercase px-2 py-0.5 border font-bold ${
                                task.kind === "showing"
                                  ? "bg-[#1d2566]/10 text-[#1d2566] border-[#1d2566]/20"
                                  : task.kind === "meeting"
                                  ? "bg-[#00adb5]/10 text-[#00adb5] border-[#00adb5]/30"
                                  : task.isOfficeEvent || task.kind === "office_event"
                                  ? "bg-purple-100 text-purple-900 border-purple-300"
                                  : task.kind === "call"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-slate-100 text-slate-700 border-slate-300"
                              }`}
                            >
                              {formatFollowUpKind(task.kind, task.isOfficeEvent)}
                            </span>
                            {isPast && (
                              <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 border border-rose-300 font-bold">
                                GECİKMİŞ
                              </span>
                            )}
                            <span className="text-[11px] font-mono text-slate-500 font-medium">
                              {new Date(task.dueAt).toLocaleTimeString("tr-TR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <h3 className="text-xs font-bold text-slate-800">
                            {task.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-600">
                            <span className="text-[#1d2566] font-semibold">
                              Müşteri: {task.customerName}
                            </span>
                            {task.customerPhone && (
                              <span className="font-mono text-slate-500">
                                ({task.customerPhone})
                              </span>
                            )}
                            {task.propertyTitle && (
                              <span className="text-slate-500 truncate max-w-xs">
                                • {task.propertyTitle}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Aksiyon Butonları */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {task.customerPhone && (
                            <>
                              <a
                                href={`tel:${task.customerPhone}`}
                                className="p-1.5 bg-white border border-slate-300 hover:border-[#00adb5] hover:text-[#00adb5] text-slate-600 transition"
                                title="Telefonla Ara"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={`https://wa.me/${task.customerPhone.replace(
                                  /\D/g,
                                  ""
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-600 text-slate-600 transition"
                                title="WhatsApp Mesajı Aç"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            </>
                          )}

                          <button
                            onClick={() => postponeFollowUp(task.id)}
                            className="px-2 py-1 bg-white border border-slate-300 hover:border-amber-500 hover:text-amber-700 text-[11px] font-mono text-slate-700 transition cursor-pointer"
                            title="Yarına Ertele"
                          >
                            Yarına Ertele
                          </button>

                          <button
                            onClick={() => setCompletingId(isCompleting ? null : task.id)}
                            className="sharp-btn-emerald px-2.5 py-1 text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Tamamla
                          </button>
                        </div>
                      </div>

                      {/* Tamamlama Sonuç Formu */}
                      {isCompleting && (
                        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 space-y-2.5">
                          <div className="text-[11px] font-mono text-slate-700 font-bold uppercase">
                            Yer Gösterme / Görüşme Sonucu:
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {[
                              { id: "attended", label: "Görüşüldü / Katıldı" },
                              { id: "liked", label: "Beğendi (Sıcak)" },
                              { id: "no_show", label: "Gelmedi / Ulaşılamadı" },
                              { id: "uninterested", label: "İlgilenmedi" },
                              { id: "offered", label: "Teklif Verdi" },
                            ].map((o) => (
                              <button
                                key={o.id}
                                onClick={() => setCompleteOutcome(o.id)}
                                className={`p-1.5 border text-left text-[11px] font-mono transition cursor-pointer ${
                                  completeOutcome === o.id
                                    ? "bg-[#1d2566] border-[#1d2566] text-white font-semibold"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {o.label}
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            placeholder="Görüşme notu veya müşteri geri bildirimi yazın..."
                            value={completeFeedback}
                            onChange={(e) => setCompleteFeedback(e.target.value)}
                            className="sharp-input w-full p-2 text-xs"
                          />
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => setCompletingId(null)}
                              className="px-2.5 py-1 bg-white border border-slate-300 text-xs text-slate-600 hover:text-slate-900"
                            >
                              Vazgeç
                            </button>
                            <button
                              onClick={() => handleFinishTask(task.id)}
                              className="sharp-btn-emerald px-3 py-1 text-xs"
                            >
                              Kaydet ve Kapat
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Gelecek 7 Günlük Randevu Programı */}
          <div className="sharp-card">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#1d2566]" />
                <h2 className="text-sm font-bold text-[#1d2566] tracking-wide">
                  Gelecek 7 Günün Programı
                </h2>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-white text-[#1d2566] border border-slate-300 font-bold">
                {next7DaysTasks.length} Planlı
              </span>
            </div>

            <div className="p-4">
              {next7DaysTasks.length === 0 ? (
                <div className="text-xs text-slate-400 font-mono text-center py-4">
                  Önümüzdeki 7 gün için planlanmış randevu bulunmuyor.
                </div>
              ) : (
                <div className="space-y-2">
                  {next7DaysTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[#1d2566] text-[11px] bg-white px-2 py-0.5 border border-slate-200 font-semibold">
                          {new Date(task.dueAt).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                            weekday: "short",
                          })}{" "}
                          {new Date(task.dueAt).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {task.title}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {task.customerName} • {task.assignedToName || "Atanmadı"}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 border font-bold ${
                          task.kind === "showing"
                            ? "bg-[#1d2566]/10 text-[#1d2566] border-[#1d2566]/20"
                            : task.kind === "meeting"
                            ? "bg-[#00adb5]/10 text-[#00adb5] border-[#00adb5]/30"
                            : task.isOfficeEvent || task.kind === "office_event"
                            ? "bg-purple-100 text-purple-900 border-purple-300"
                            : task.kind === "call"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {formatFollowUpKind(task.kind, task.isOfficeEvent)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Alarmlar (Kira Tahsilat, Kira Sözleşmesi & 14 Gün İlişki Takibi) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. KİRA TAHSİLAT / ÖDEME ALARMI (Geçen veya 3 Gün Kala Yaklaşanlar) */}
          {paymentAlerts.length > 0 && (
            <div className="sharp-card border-t-3 border-t-amber-500">
              <div className="p-4 border-b border-slate-200 bg-amber-50/25">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <h2 className="text-sm font-bold text-[#1d2566] tracking-wide">
                      Kira Tahsilat / Ödeme Alarmı
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                    {paymentAlerts.length} Ödeme
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Vadesi geçmiş veya 3 gün içinde ödenmesi gereken kira taksitleri.
                </p>
              </div>

              <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                {paymentAlerts.map((item, idx) => {
                  const isCritical = item.isOverdue || item.isToday;
                  return (
                    <div
                      key={`pay-alert-${item.rentalId}-${item.month}-${idx}`}
                      className="p-3.5 hover:bg-slate-50 transition flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 line-clamp-1">
                          {item.propertyTitle} — {item.monthName} Kirası
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 border font-bold shrink-0 ${
                            isCritical
                              ? "bg-rose-50 text-rose-700 border-rose-300 animate-pulse"
                              : "bg-amber-50 text-amber-800 border-amber-300"
                          }`}
                        >
                          {item.isToday
                            ? "VADESİ BUGÜN!"
                            : item.isOverdue
                            ? `${Math.abs(item.diffDays)} Gün Gecikti`
                            : `${item.diffDays} Gün Kaldı`}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center justify-between font-mono">
                        <span>
                          Kiracı: <strong className="text-[#00adb5]">{item.tenantName}</strong>
                        </span>
                        <span className="font-bold text-[#1d2566]">
                          {item.remainingAmount.toLocaleString("tr-TR")} {item.currency}
                          {item.paidAmount > 0 && (
                            <span className="text-[10px] text-slate-400 font-normal ml-1">
                              ({item.paidAmount.toLocaleString("tr-TR")} ödendi)
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] font-mono">
                        <div className="text-slate-500">
                          {isBroker && item.assignedToName
                            ? `Danışman: ${item.assignedToName}`
                            : `Vade Günü: ${item.dueDate}`}
                        </div>
                        <button
                          onClick={() => onNavigate("rentals")}
                          className="px-2.5 py-1 bg-[#1d2566] text-white hover:bg-[#151b4d] text-[10px] font-mono flex items-center gap-1 cursor-pointer font-semibold shadow-2xs"
                        >
                          Kira Takibine Git <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. KİRA SÖZLEŞMESİ BİTİŞ ALARMI (30 Gün Kuralı) */}
          {expiringRentals.length > 0 && (
            <div className="sharp-card border-t-3 border-t-rose-500">
              <div className="p-4 border-b border-slate-200 bg-rose-50/20">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-rose-600" />
                    <h2 className="text-sm font-bold text-[#1d2566] tracking-wide">
                      Sözleşme Bitiş Alarmı (Kira Takibi)
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 font-bold">
                    {expiringRentals.length} Sözleşme
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Bitişine 30 gün veya daha az kalan kira sözleşmeleri. Mülk sahibi ve kiracıyla yenileme koşullarını netleştirin.
                </p>
              </div>

              <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
                {expiringRentals.map((r) => {
                  const now = currentDate || new Date();
                  const end = new Date(r.contractEnd);
                  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
                  const isCritical = diff <= 5;

                  return (
                    <div
                      key={`widget-${r.id}`}
                      className="p-3.5 hover:bg-slate-50 transition flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 line-clamp-1">
                            {r.propertyTitle}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 border font-bold shrink-0 ${
                            isCritical
                              ? "bg-rose-50 text-rose-700 border-rose-300 animate-pulse"
                              : "bg-amber-50 text-amber-800 border-amber-300"
                          }`}
                        >
                          {diff <= 0 ? "SÜRE BİTTİ" : `${diff} Gün Kaldı`}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center justify-between font-mono">
                        <span>
                          Kiracı: <strong className="text-[#00adb5]">{r.tenantName}</strong>
                        </span>
                        <span className="font-bold text-[#1d2566]">
                          {r.monthlyRent.toLocaleString("tr-TR")} {r.currency} / ay
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] font-mono">
                        <div className="text-slate-500">
                          {isBroker ? `Danışman: ${r.assignedToName || "Atanmadı"}` : `Bitiş: ${r.contractEnd}`}
                        </div>
                        <button
                          onClick={() => onNavigate("rentals")}
                          className="px-2.5 py-1 bg-[#1d2566] text-white hover:bg-[#151b4d] text-[10px] font-mono flex items-center gap-1 cursor-pointer font-semibold shadow-2xs"
                        >
                          Kira Takibine Git <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. İLİŞKİ TAKİBİ ALARMI (14 Gün Kuralı) */}
          {fourteenDayInactiveCustomers.length > 0 && (
            <div className="sharp-card border-t-3 border-t-amber-500">
              <div className="p-4 border-b border-slate-200 bg-amber-50/30">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <h2 className="text-sm font-bold text-[#1d2566] tracking-wide">
                      İlişki Takibi Alarmı (14 Gün Kuralı)
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                    {fourteenDayInactiveCustomers.length} Müşteri
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Son 14 gündür arama veya görüşme kaydı girilmemiş müşteriler.
                  Portföyden kopma riskine karşı lütfen hızlı aksiyon alın.
                </p>
              </div>

              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {fourteenDayInactiveCustomers.map((cust) => {
                  const daysAgo =
                    cust.lastContactAt && currentDate
                      ? Math.floor(
                          (currentDate.getTime() -
                            new Date(cust.lastContactAt).getTime()) /
                            (1000 * 3600 * 24)
                        )
                      : "Kayıt Yok";

                  return (
                    <div
                      key={cust.id}
                      className="p-3.5 hover:bg-slate-50 transition flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            {cust.fullName}
                          </span>
                          {cust.isVip && (
                            <span className="text-[9px] font-mono uppercase bg-amber-500 text-black px-1 font-bold">
                              VIP
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 border border-rose-300 font-bold">
                          {typeof daysAgo === "number"
                            ? `${daysAgo} Gündür Sessiz`
                            : "Hiç Görüşülmedi"}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center justify-between font-mono">
                        <span>
                          {cust.region} • {cust.propertyType}
                        </span>
                        <span className="font-bold text-[#1d2566]">
                          {cust.budget?.toLocaleString("tr-TR")}{" "}
                          {cust.budgetCurrency}
                        </span>
                      </div>

                      {/* Hızlı Aksiyon Butonları (14 Gün Kuralı) */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <div className="text-[10px] font-mono text-slate-500">
                          Danışman: {cust.assignedToName || "Atanmadı"}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {cust.phone && (
                            <a
                              href={`tel:${cust.phone}`}
                              className="px-2 py-1 bg-white border border-slate-300 hover:border-[#00adb5] text-[10px] font-mono text-slate-700 hover:text-[#00adb5] flex items-center gap-1"
                              title="Telefonla Ara"
                            >
                              <Phone className="w-3 h-3 text-[#00adb5]" /> Ara
                            </a>
                          )}
                          {cust.whatsapp && (
                            <a
                              href={`https://wa.me/${cust.whatsapp.replace(
                                /\D/g,
                                ""
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-white border border-slate-300 hover:border-emerald-500 text-[10px] font-mono text-slate-700 hover:text-emerald-600 flex items-center gap-1"
                              title="WhatsApp Aç"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-600" />{" "}
                              WhatsApp
                            </a>
                          )}
                          <button
                            onClick={() => onOpenCustomer(cust.id)}
                            className="px-2.5 py-1 bg-[#1d2566] text-white hover:bg-[#151b4d] text-[10px] font-mono flex items-center gap-1 cursor-pointer font-semibold shadow-2xs"
                          >
                            Karta Git <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. HİÇBİR ALARM OLMADIĞINDA GÖRÜNECEK ALAN */}
          {paymentAlerts.length === 0 &&
            expiringRentals.length === 0 &&
            fourteenDayInactiveCustomers.length === 0 && (
              <div className="sharp-card p-6 border-l-4 border-l-emerald-500 bg-white shadow-2xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#1d2566]">
                      Hiçbir Aktif Alarmınız Yok
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Harika gidiyorsunuz! Şu anda vadesi geçen veya yaklaşan kira ödemesi, bitiş tarihi yaklaşan sözleşme ya da 14 gündür temas kurulmamış müşteri bulunmamaktadır.
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Hızlı Erişim: Akıllı Eşleştirme Çağrısı */}
          <div className="sharp-card p-5 bg-gradient-to-br from-white to-[#00adb5]/5 border border-[#00adb5]/30 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#00adb5] font-mono font-bold uppercase mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Deterministik Matchmaker
              </div>
              <p className="text-xs text-slate-600">
                Portföyler ve müşteriler arası bütçe, para birimi ve niyet uyumunu
                4 kuralla analiz edin.
              </p>
            </div>
            <button
              onClick={() => onNavigate("matchmaker")}
              className="sharp-btn-primary px-3.5 py-2 text-xs shrink-0 cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              Motoru Aç <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Ana Sayfa En Altı: Aylık Kareli Takvim ve Günlük Detay Kartı */}
      <MonthCalendarView isDashboard={true} onNavigate={onNavigate} />
        </>
      )}

      {/* Akıllı Bildirim & Otomasyon Masası Çekmecesi */}
      <NotificationCenterDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        onNavigateTab={(tab) => onNavigate(tab)}
      />

      {/* Standart Hızlı İşlem Modalları */}
      <AddDealModal
        isOpen={isAddDealModalOpen}
        onClose={() => setIsAddDealModalOpen(false)}
      />
      <AddFollowUpModal
        isOpen={isAddFollowUpModalOpen}
        onClose={() => setIsAddFollowUpModalOpen(false)}
      />
      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
      />
      <AddPropertyModal
        isOpen={isAddPropertyModalOpen}
        onClose={() => setIsAddPropertyModalOpen(false)}
      />
      <AddMandateModal
        isOpen={isAddMandateModalOpen}
        onClose={() => setIsAddMandateModalOpen(false)}
      />
    </div>
  );
}
