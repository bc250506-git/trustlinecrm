"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import {
  Shield,
  UserCheck,
  Clock,
  Bell,
  Search,
  ChevronDown,
  Building2,
  Zap,
  Settings,
  LogOut,
} from "lucide-react";
import { NotificationCenterDrawer } from "@/components/automation/NotificationCenterDrawer";

interface HeaderProps {
  onNavigateTab?: (tab: any) => void;
}

export function Header({ onNavigateTab }: HeaderProps) {
  const { currentUser, isBroker, notifications, logout } =
    useStore();
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Kıbrıs Saati (Asia/Famagusta)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("tr-TR", {
        timeZone: "Asia/Famagusta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const dateStr = now.toLocaleDateString("tr-TR", {
        timeZone: "Asia/Famagusta",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      setCurrentTime(timeStr);
      setCurrentDate(dateStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Sol: Logo (Orijinal PNG) & Marka */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Trustline Real Estate"
            className="h-9 md:h-10 w-auto object-contain shrink-0"
          />
        </div>

        {/* Canlı Saat / Zaman Dilimi (Asia/Famagusta - KKTC) */}
        <div className="hidden lg:flex items-center gap-2 pl-6 ml-2 border-l border-slate-200 text-sm text-slate-600 font-mono">
          <Clock className="w-4 h-4 text-[#00adb5]" />
          <span className="text-slate-700 font-medium">{currentDate}</span>
          <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-[#1d2566] font-bold">
            {currentTime || "--:--:--"} (KKTC)
          </span>
        </div>
      </div>

      {/* Sağ: Bildirimler ve Kullanıcı Rol Seçici */}
      <div className="flex items-center gap-3">
        {/* Bildirim Zili ve Otomasyon Masası Butonu */}
        <button
          type="button"
          onClick={() => setIsNotificationDrawerOpen(true)}
          className="relative px-3 py-1.5 bg-white border border-slate-300 hover:border-[#00adb5] text-slate-700 hover:text-[#1d2566] transition cursor-pointer shadow-2xs flex items-center gap-1.5 font-mono text-sm"
          title="Akıllı Bildirim & Otomasyon Masası (Faz 2)"
        >
          <Bell className="w-4 h-4 text-[#1d2566]" />
          <span className="hidden sm:inline font-bold text-[#1d2566]">Otomasyon</span>
          {unreadNotificationCount > 0 ? (
            <span className="bg-rose-500 text-white font-mono text-xs font-bold px-1.5 py-0.2 rounded-full animate-pulse">
              {unreadNotificationCount}
            </span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#00adb5]"></span>
          )}
        </button>

        {/* Rol Göstergesi & Değiştirici */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-[#00adb5] transition text-left cursor-pointer shadow-2xs"
          >
            <div className="w-7 h-7 bg-[#1d2566] text-white flex items-center justify-center text-xs font-bold font-mono">
              {currentUser.name.replace(/[()]/g, "").trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#1d2566] leading-tight">
                {currentUser.name}
              </span>
              <span className="text-xs font-mono leading-tight">
                {currentUser.title ? (
                  <span className={isBroker ? "text-emerald-700 font-bold" : "text-[#00adb5] font-bold"}>
                    {currentUser.title.toUpperCase()}
                  </span>
                ) : isBroker ? (
                  <span className="text-emerald-700 font-bold">
                    BROKER / YÖNETİCİ
                  </span>
                ) : (
                  <span className="text-[#00adb5] font-bold">
                    GAYRİMENKUL DANIŞMANI
                  </span>
                )}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1" />
          </button>

          {/* Kullanıcı Menüsü (Güvenli: Test Değişimi Kaldırıldı) */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 shadow-xl py-2 z-50">
              {/* Kullanıcı Kartı */}
              <div className="px-3 pb-2.5 mb-1.5 border-b border-slate-100">
                <div className="text-sm font-bold text-[#1d2566] leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                  @{currentUser.username} • {currentUser.email}
                </div>
                <div className="mt-1.5">
                  <span
                    className={`inline-block text-[9px] font-mono px-2 py-0.5 border font-bold ${
                      isBroker
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {currentUser.title || (isBroker ? "Broker / Yönetici" : "Danışman")}
                  </span>
                </div>
              </div>

              {/* Menü İşlemleri */}
              <div className="px-1.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    if (onNavigateTab) onNavigateTab("settings");
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-mono font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1d2566] transition cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>Ayarlar & Şifre Değiştir</span>
                </button>

                <div className="pt-1 mt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-mono font-medium text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    <span>Oturumu Kapat</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Akıllı Bildirim & Otomasyon Masası Çekmecesi */}
      <NotificationCenterDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        onNavigateTab={(tab) => onNavigateTab && onNavigateTab(tab)}
      />
    </header>
  );
}

