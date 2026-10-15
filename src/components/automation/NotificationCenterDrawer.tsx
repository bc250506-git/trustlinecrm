"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { WorkflowNotification } from "@/lib/types";
import { formatAutomationCategory } from "@/lib/formatters";
import {
  Bell,
  Sparkles,
  MessageCircle,
  Clock,
  Check,
  CheckCheck,
  Trash2,
  X,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  ArrowUpRight,
  Flame,
  KeyRound,
  AlertTriangle,
  FileText,
  Send,
  Zap,
  Cake,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

interface NotificationCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
}

export function NotificationCenterDrawer({
  isOpen,
  onClose,
  onNavigateTab,
}: NotificationCenterDrawerProps) {
  const {
    notifications,
    automationRules,
    rentals,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    toggleAutomationRule,
    triggerAutomationEngine,
    renewRentalContract,
    relistRentalProperty,
    loseRentalProperty,
  } = useStore();

  const [activeTab, setActiveTab] = useState<"notifications" | "rules">("notifications");
  const [filterUnread, setFilterUnread] = useState(false);
  const [isRunningScan, setIsRunningScan] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = filterUnread
    ? notifications.filter((n) => !n.read)
    : notifications;

  const handleRunScan = () => {
    setIsRunningScan(true);
    setScanResult(null);
    setTimeout(() => {
      const res = triggerAutomationEngine();
      setIsRunningScan(false);
      const totalNew =
        res.matchesFound +
        res.rentAlerts +
        res.decayAlerts +
        res.mandateAlerts +
        (res.contractAlerts || 0) +
        (res.birthdayAlerts || 0);
      setScanResult(
        totalNew > 0
          ? `✓ Tarama tamamlandı: ${totalNew} yeni otomasyon bildirimi oluşturuldu.`
          : `✓ Tarama tamamlandı: Tüm kurallar güncel, yeni alarm bulunmuyor.`
      );
      setTimeout(() => setScanResult(null), 6000);
    }, 600);
  };

  const handleOpenWhatsApp = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    window.open(url, "_blank");
  };

  const getNotificationIcon = (type: WorkflowNotification["type"]) => {
    switch (type) {
      case "match":
        return <Sparkles className="w-4 h-4 text-[#00adb5]" />;
      case "rent_due":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "rent_paid":
        return <KeyRound className="w-4 h-4 text-emerald-600" />;
      case "lead_decay":
        return <Flame className="w-4 h-4 text-rose-500" />;
      case "mandate_expiring":
        return <FileText className="w-4 h-4 text-purple-600" />;
      case "contract_expiring":
        return <KeyRound className="w-4 h-4 text-amber-600" />;
      case "birthday":
        return <Cake className="w-4 h-4 text-pink-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const getNotificationBadge = (type: WorkflowNotification["type"]) => {
    switch (type) {
      case "match":
        return <span className="bg-[#00adb5]/10 text-[#00adb5] border border-[#00adb5]/20 px-2 py-0.5 text-[10px] font-mono font-bold">AKILLI EŞLEŞME</span>;
      case "rent_due":
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-mono font-bold">KİRA VADESİ</span>;
      case "rent_paid":
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-mono font-bold">KİRA TAHSİLATI</span>;
      case "lead_decay":
        return <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 text-[10px] font-mono font-bold">SOĞUMA ALARMI</span>;
      case "mandate_expiring":
        return <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 text-[10px] font-mono font-bold">YETKİ YENİLEME (60 GÜN)</span>;
      case "contract_expiring":
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-mono font-bold">KİRA BİTİŞİ (60 GÜN)</span>;
      case "birthday":
        return <span className="bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 text-[10px] font-mono font-bold">🎂 DOĞUM GÜNÜ</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-[10px] font-mono font-bold">BİLDİRİM</span>;
    }
  };

  return (
    <>
      {/* Arka Plan Karartması */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs transition-opacity"
      />

      {/* Sağ Panel Çekmecesi */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col font-sans">
        {/* Çekmece Üst Çubuğu */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1d2566] text-white flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#00adb5]" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-[#00adb5] font-bold tracking-wider">
                AKILLI OTOMASYON MERKEZİ (FAZ 2)
              </div>
              <h2 className="text-sm font-bold text-[#1d2566] flex items-center gap-2">
                İş Akışları & Bildirim Masası
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canlı Otomasyon Bildirim Rozeti */}
        <div className="px-4 py-1.5 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between text-[11px] font-mono text-emerald-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Otonom Canlı Takip: <strong>Aktif</strong> (Her 60 sn & Sekme Odağında)</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">Oto-Senkron</span>
        </div>

        {/* Sekme Değiştirici */}
        <div className="flex border-b border-slate-200 bg-white px-4 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`pb-2.5 px-3 text-xs font-mono font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "notifications"
                ? "border-[#00adb5] text-[#1d2566]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Bildirimler & Alarmlar ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`pb-2.5 px-3 text-xs font-mono font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "rules"
                ? "border-[#00adb5] text-[#1d2566]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Otomasyon Robotları ({automationRules.filter((r) => r.enabled).length}/{automationRules.length})
          </button>
        </div>

        {/* Ana İçerik Alanı */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {/* TAB 1: BİLDİRİMLER */}
          {activeTab === "notifications" && (
            <>
              {/* Filtre ve Hızlı Aksiyon */}
              <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterUnread(!filterUnread)}
                    className={`px-2.5 py-1 border text-[11px] font-bold cursor-pointer transition ${
                      filterUnread
                        ? "bg-[#1d2566] text-white border-[#1d2566]"
                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {filterUnread ? "✓ Sadece Okunmamışlar" : "Tüm Bildirimler"}
                  </button>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] text-[#00adb5] hover:text-[#1d2566] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Tümünü Okundu Say
                  </button>
                )}
              </div>

              {/* Bildirim Listesi */}
              <div className="space-y-3">
                {filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`sharp-card p-3.5 border transition ${
                      notif.read
                        ? "bg-white border-slate-200 opacity-80"
                        : "bg-white border-l-4 border-l-[#00adb5] border-slate-300 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getNotificationBadge(notif.type)}
                        <span className="text-[10px] font-mono text-slate-400">
                          {notif.createdAt}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notif.read && (
                          <button
                            title="Okundu yap"
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="p-1 text-slate-400 hover:text-emerald-600 transition cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          title="Sil"
                          onClick={() => deleteNotification(notif.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-[#1d2566] mb-1 flex items-center gap-1.5">
                      {getNotificationIcon(notif.type)}
                      {notif.title}
                    </h4>

                    <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                      {notif.message}
                    </p>

                    {/* Kira Sözleşmesi Bitenler İçin 3 Net Hızlı Aksiyon */}
                    {notif.type === "contract_expiring" && (() => {
                      const linkedRental = notif.targetId ? rentals.find((r) => r.id === notif.targetId) : undefined;
                      if (!linkedRental) return null;
                      return (
                        <div className="p-2.5 bg-amber-50 border border-amber-300 space-y-2 mb-2">
                          <div className="text-[11px] font-bold text-amber-950 font-mono">
                            ⚠️ [{linkedRental.propertyTitle}] kiralığınızın [{linkedRental.tenantName}] ile olan kira sözleşmesi bitmiştir ({linkedRental.contractEnd}).
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                renewRentalContract(linkedRental.id);
                                markNotificationAsRead(notif.id);
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-[10px] flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Sözleşmeyi 1 yıl uzatır"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Sözleşmeyi Yenile (+1 Yıl)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                relistRentalProperty(linkedRental.id);
                                markNotificationAsRead(notif.id);
                              }}
                              className="px-2 py-1 bg-[#00adb5] hover:bg-[#00939a] text-white font-mono font-bold text-[10px] flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Portföyü aktife alıp yeniden yayınlar"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Yeniden Yayınla (Aktife Al)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    `[${linkedRental.propertyTitle}] portföyü kaybedildi olarak sistemden tamamen silinsin mi?`
                                  )
                                ) {
                                  loseRentalProperty(linkedRental.id);
                                  markNotificationAsRead(notif.id);
                                }
                              }}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold text-[10px] flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Portföyü kaybedildi olarak siler"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Portföy Kaybedildi</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* WhatsApp Şablon Önizlemesi & Aksiyon Butonları */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {notif.whatsappDraft && notif.whatsappPhone && (
                        <div className="p-2 bg-emerald-50/70 border border-emerald-200/60 text-[10px] text-emerald-950 rounded-none font-mono">
                          <div className="font-bold text-emerald-800 mb-0.5 flex items-center gap-1">
                            <Send className="w-3 h-3 text-emerald-600" />
                            Hazır WhatsApp Mesaj Taslağı ({notif.whatsappPhone}):
                          </div>
                          <div className="line-clamp-2 italic text-slate-700">
                            &ldquo;{notif.whatsappDraft}&rdquo;
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1">
                        {notif.whatsappDraft && notif.whatsappPhone ? (
                          <button
                            onClick={() => {
                              markNotificationAsRead(notif.id);
                              handleOpenWhatsApp(notif.whatsappPhone!, notif.whatsappDraft!);
                            }}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp Gönder
                          </button>
                        ) : (
                          <div></div>
                        )}

                        {notif.targetTab && (
                          <button
                            onClick={() => {
                              markNotificationAsRead(notif.id);
                              onNavigateTab(notif.targetTab);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-[#1d2566] hover:bg-[#151b4a] text-white text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                          >
                            İlgili Modüle Git <ArrowUpRight className="w-3 h-3 text-[#00adb5]" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredNotifications.length === 0 && (
                  <div className="p-8 text-center bg-white border border-slate-200">
                    <CheckCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <div className="text-xs font-bold text-[#1d2566] font-mono">
                      {filterUnread ? "Okunmamış Bildirim Yok" : "Kayıtlı Bildirim Bulunmuyor"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Otomasyon motoru arka planda çalışıyor ve yeni alarmları buraya düşürecektir.
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: OTOMASYON ROBOTLARI */}
          {activeTab === "rules" && (
            <div className="space-y-4">
              {/* Tarama Başlatıcı Kutu */}
              <div className="sharp-card p-4 bg-gradient-to-br from-white to-[#00adb5]/10 border border-[#00adb5]/30">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-[10px] font-mono text-[#00adb5] font-bold uppercase tracking-wider">
                      Otonom İş Akışı Motoru
                    </div>
                    <h3 className="text-xs font-bold text-[#1d2566]">
                      Sistem Verilerini Tara & Alarmları Tetikle
                    </h3>
                  </div>
                  <button
                    disabled={isRunningScan}
                    onClick={handleRunScan}
                    className="px-3 py-1.5 bg-[#00adb5] hover:bg-[#009299] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRunningScan ? "animate-spin" : ""}`} />
                    {isRunningScan ? "Taranıyor..." : "Şimdi Tara"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Tüm kira sözleşmeleri, sıcak müşteri havuzu ve portföy eşleşmelerini 4 aktif kurala göre derinlemesine tarar.
                </p>

                {scanResult && (
                  <div className="mt-3 p-2 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-semibold flex items-center gap-1.5 animate-fadeIn">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{scanResult}</span>
                  </div>
                )}
              </div>

              {/* Kurallar Listesi */}
              <div className="space-y-3">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider px-1">
                  Aktif Otomasyon Kuralları ({automationRules.length})
                </div>

                {automationRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`sharp-card p-3.5 bg-white border transition ${
                      rule.enabled ? "border-slate-300 shadow-xs" : "border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-[#1d2566]">
                            {rule.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                          {rule.description}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                          <span>Kategori: <strong className="text-slate-700 font-bold">{formatAutomationCategory(rule.category)}</strong></span>
                          <span>•</span>
                          <span>Son Tetiklenme: <strong className="text-[#00adb5]">{rule.lastTriggeredAt || "Henüz tetiklenmedi"}</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleAutomationRule(rule.id)}
                        className="text-slate-500 hover:text-[#1d2566] transition cursor-pointer shrink-0 pt-0.5"
                        title={rule.enabled ? "Devre dışı bırak" : "Aktif et"}
                      >
                        {rule.enabled ? (
                          <ToggleRight className="w-8 h-8 text-[#00adb5]" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-slate-300" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Çekmece Alt Bilgi */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[10px] font-mono text-slate-500 flex items-center justify-between shrink-0">
          <span>İş Akışı & Otomasyon Masası</span>
          <span className="text-[#00adb5] font-bold">Trustline Real Estate</span>
        </div>
      </div>
    </>
  );
}
