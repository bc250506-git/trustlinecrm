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
} from "lucide-react";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";


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
    postponeFollowUp,
    completeFollowUp,
  } = useStore();

  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completeFeedback, setCompleteFeedback] = useState("");
  const [completeOutcome, setCompleteOutcome] = useState("attended");
  const [dashboardTab, setDashboardTab] = useState<"operations" | "analytics">("operations");

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
    completeFollowUp(id, completeOutcome, completeFeedback);
    setCompletingId(null);
    setCompleteFeedback("");
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

      {/* Canlı Metrik Sayaçları (Keskin Kurumsal Beyaz Bloklar) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="sharp-card p-4 border-t-3 border-t-[#00adb5]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1 flex items-center justify-between">
            <span>Aktif Müşteriler</span>
            <Users className="w-4 h-4 text-[#00adb5]" />
          </div>
          <div className="text-2xl font-bold text-[#1d2566] font-mono">
            {customers.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            {isBroker ? "Ofis genel havuz" : "Sorumlu olduğunuz"}
          </div>
        </div>

        <div className="sharp-card p-4 border-t-3 border-t-rose-500">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1 flex items-center justify-between">
            <span>Sıcak Adaylar</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 font-mono">
            {hotCustomers.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Acil aksiyon bekleyen
          </div>
        </div>

        <div className="sharp-card p-4 border-t-3 border-t-amber-500">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1 flex items-center justify-between">
            <span>Bugün / Geciken</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono">
            {overdueAndTodayTasks.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Zamanı gelen randevu/arama
          </div>
        </div>

        <div className="sharp-card p-4 border-t-3 border-t-[#1d2566]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1 flex items-center justify-between">
            <span>Aktif Portföy</span>
            <Building className="w-4 h-4 text-[#1d2566]" />
          </div>
          <div className="text-2xl font-bold text-[#1d2566] font-mono">
            {activeProperties.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Satış/Kiralıkta yayında
          </div>
        </div>

        <div className="sharp-card p-4 border-t-3 border-t-[#00adb5] col-span-2 lg:col-span-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1 flex items-center justify-between">
            <span>AI Onaylı Lead</span>
            <Sparkles className="w-4 h-4 text-[#00adb5]" />
          </div>
          <div className="text-2xl font-bold text-[#00adb5] font-mono">
            +{aiApprovedTodayCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Bugün Meta / WhatsApp
          </div>
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
                              className={`text-[10px] font-mono uppercase px-2 py-0.5 font-bold ${
                                task.kind === "showing"
                                  ? "bg-[#1d2566]/10 text-[#1d2566] border border-[#1d2566]/20"
                                  : task.kind === "meeting"
                                  ? "bg-[#00adb5]/10 text-[#00adb5] border border-[#00adb5]/30"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {task.kind === "showing"
                                ? "Yer Gösterme"
                                : task.kind === "meeting"
                                ? "Yüz Yüze Görüşme"
                                : "Telefon Araması"}
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

                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-white text-slate-700 border border-slate-200 font-medium">
                        {task.kind}
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
        </>
      )}
    </div>
  );
}
