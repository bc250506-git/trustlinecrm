"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { NavTab } from "./Sidebar";
import {
  LayoutDashboard,
  Building,
  Users,
  Calculator,
  Menu,
  X,
  Calendar,
  CalendarDays,
  KeyRound,
  FileCheck,
  Sparkles,
  ShieldAlert,
  Settings,
  LogOut,
  Clock,
  ChevronRight,
  UserCheck,
} from "lucide-react";

interface MobileBottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export function MobileBottomNav({ activeTab, setActiveTab }: MobileBottomNavProps) {
  const {
    isBroker,
    currentUser,
    customers,
    properties,
    followUps,
    deals,
    mandates,
    rentals,
    logout,
  } = useStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Sayaçlar
  const activeCustomersCount = isBroker
    ? customers.filter((c) => !c.deletedAt).length
    : customers.filter((c) => !c.deletedAt && (c.assignedToId === currentUser.id || c.isShared)).length;

  const activePropertiesCount = isBroker
    ? properties.filter((p) => !p.deletedAt).length
    : properties.filter((p) => !p.deletedAt && (p.assignedToId === currentUser.id || p.isShared)).length;

  const openFollowUpsCount = isBroker
    ? followUps.filter((f) => f.status === "open").length
    : followUps.filter((f) => f.status === "open" && (f.assignedToId === currentUser.id || f.isOfficeEvent)).length;

  const activeRentalsCount = isBroker
    ? rentals.filter((r) => r.active !== false).length
    : rentals.filter((r) => r.active !== false && r.assignedToId === currentUser.id).length;

  const activeMandatesCount = isBroker
    ? mandates.filter((m) => m.status !== "cancelled").length
    : mandates.filter((m) => m.status !== "cancelled" && m.assignedToId === currentUser.id).length;

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  const mainNavItems = [
    {
      id: "dashboard" as NavTab,
      label: "Anasayfa",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "properties" as NavTab,
      label: "Portföyler",
      icon: Building,
      badge: activePropertiesCount,
    },
    {
      id: "customers" as NavTab,
      label: "Müşteriler",
      icon: Users,
      badge: activeCustomersCount,
    },
    {
      id: "finance" as NavTab,
      label: "Finans",
      icon: Calculator,
      badge: deals.length > 0 ? deals.length : null,
    },
  ];

  const drawerModules = [
    {
      id: "month_calendar" as NavTab,
      label: "Aylık Takvim",
      icon: Calendar,
      description: "Tüm ofis ve bireysel randevu takvimi",
      badge: null,
      brokerOnly: false,
    },
    {
      id: "calendar" as NavTab,
      label: "Ajanda & Görevler",
      icon: CalendarDays,
      description: "Arama, yer gösterme ve günün randevuları",
      badge: openFollowUpsCount,
      brokerOnly: false,
    },
    {
      id: "rentals" as NavTab,
      label: "Kira Takip Sistemi",
      icon: KeyRound,
      description: "Sözleşmeler, aidat ve vadesi gelen kiralar",
      badge: activeRentalsCount,
      brokerOnly: false,
    },
    {
      id: "mandates" as NavTab,
      label: "Yetki Belgeleri",
      icon: FileCheck,
      description: "Tek yetkili emlak sözleşmeleri ve bitiş alarmları",
      badge: activeMandatesCount,
      brokerOnly: false,
    },
    {
      id: "matchmaker" as NavTab,
      label: "Akıllı Eşleştirme Motoru",
      icon: Sparkles,
      description: "Portföy ve alıcı müşterileri anında eşleştir",
      badge: null,
      brokerOnly: false,
    },
    {
      id: "security" as NavTab,
      label: "Güvenlik & Ofis Logları",
      icon: ShieldAlert,
      description: "Giriş kayıtları ve güvenlik denetimleri",
      badge: null,
      brokerOnly: true,
    },
    {
      id: "settings" as NavTab,
      label: "Sistem & Profil Ayarları",
      icon: Settings,
      description: "Şifre, unvan ve kişisel tercihler",
      badge: null,
      brokerOnly: false,
    },
  ];

  return (
    <>
      {/* 1. SABİT ALT NAVİGASYON ÇUBUĞU (Yalnızca mobilde görünür) */}
      <nav
        aria-label="Mobil Alt Menü"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl px-2 py-1.5 flex items-center justify-around safe-area-pb"
      >
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !isMenuOpen;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all cursor-pointer ${
                isActive
                  ? "text-[#00adb5] font-bold"
                  : "text-slate-500 hover:text-[#1d2566] font-medium"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
                {item.badge !== null && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-3 min-w-[16px] h-4 px-1 bg-[#1d2566] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center border border-white">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 font-mono">{item.label}</span>
              {isActive && (
                <div className="w-4 h-0.5 bg-[#00adb5] rounded-full mt-0.5" />
              )}
            </button>
          );
        })}

        {/* 5. Buton: Tüm Menü / Çekmece Açıcı */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all cursor-pointer ${
            isMenuOpen
              ? "text-[#1d2566] font-bold"
              : "text-slate-500 hover:text-[#1d2566] font-medium"
          }`}
        >
          <div className="relative">
            {isMenuOpen ? (
              <X className="w-5 h-5 text-red-600 scale-110" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-mono">
            {isMenuOpen ? "Kapat" : "Menü"}
          </span>
        </button>
      </nav>

      {/* 2. MOBİL TÜM MODÜLLER ÇEKMECESİ (DRAWER) */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end animate-fadeIn">
          {/* Backdrop Click */}
          <div
            className="flex-1"
            onClick={() => setIsMenuOpen(false)}
          />

          <div className="bg-white border-t border-slate-300 shadow-2xl max-h-[85vh] flex flex-col rounded-t-2xl overflow-hidden pb-6">
            {/* Çekmece Üst Başlığı & Kullanıcı Özeti */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#1d2566] text-white flex items-center justify-center font-bold text-xs font-mono shadow-xs">
                  {currentUser.name.replace(/[()]/g, "").trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1d2566] leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                    {currentUser.title || (isBroker ? "Broker / Yönetici" : "Danışman")}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 bg-slate-200/60 hover:bg-slate-200 text-slate-600 rounded-full cursor-pointer transition"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modül Listesi (Kaydırılabilir) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-slate-100">
              <div className="pt-1 pb-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-2 mb-2">
                  Tüm Operasyonel Modüller
                </div>

                <div className="space-y-1">
                  {drawerModules
                    .filter((m) => !m.brokerOnly || isBroker)
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectTab(item.id)}
                          className={`w-full flex items-center justify-between p-2.5 text-left transition font-medium cursor-pointer rounded-lg ${
                            isActive
                              ? "bg-[#1d2566] text-white shadow-xs"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-md ${isActive ? "bg-white/10 text-white" : "bg-slate-100 text-[#1d2566]"}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold tracking-tight">{item.label}</div>
                              <div className={`text-[10px] font-mono ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                                {item.description}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {item.badge !== null && item.badge > 0 && (
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                isActive ? "bg-[#00adb5] text-white" : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}>
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight className={`w-4 h-4 ${isActive ? "text-white/60" : "text-slate-400"}`} />
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Alt Butonlar: Çıkış Yap */}
              <div className="pt-3 px-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 font-mono text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Güvenli Oturumu Kapat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
