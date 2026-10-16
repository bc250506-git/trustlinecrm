"use client";

import React from "react";
import { useStore } from "@/lib/store";
import {
  LayoutDashboard,
  Users,
  Building,
  Sparkles,
  CalendarDays,
  Calendar,
  KeyRound,
  Calculator,
  ShieldAlert,
  Lock,
  FileCheck,
  Settings,
  LogOut,
  Landmark,
  ExternalLink,
} from "lucide-react";

export type NavTab =
  | "dashboard"
  | "month_calendar"
  | "calendar"
  | "customers"
  | "properties"
  | "matchmaker"
  | "rentals"
  | "mandates"
  | "finance"
  | "security"
  | "settings";

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { isBroker, currentUser, customers, properties, followUps, deals, mandates, logout } = useStore();

  const navItems = [
    {
      id: "dashboard" as NavTab,
      label: "Anasayfa",
      icon: LayoutDashboard,
      badge: null,
      brokerOnly: false,
    },
    {
      id: "month_calendar" as NavTab,
      label: "Takvim",
      icon: Calendar,
      badge: "Aylık",
      brokerOnly: false,
    },
    {
      id: "calendar" as NavTab,
      label: "Ajanda",
      icon: CalendarDays,
      badge: followUps.filter((f) => f.status === "open").length,
      brokerOnly: false,
    },
    {
      id: "customers" as NavTab,
      label: "Müşteri Havuzu",
      icon: Users,
      badge: customers.length,
      brokerOnly: false,
    },
    {
      id: "properties" as NavTab,
      label: "Portföy Yönetimi",
      icon: Building,
      badge: properties.length,
      brokerOnly: false,
    },
    {
      id: "rentals" as NavTab,
      label: "Kira Takip",
      icon: KeyRound,
      badge: "12 Ay",
      brokerOnly: false,
    },
    {
      id: "mandates" as NavTab,
      label: "Yetki Takip",
      icon: FileCheck,
      badge: mandates.length,
      brokerOnly: false,
    },
    {
      id: "matchmaker" as NavTab,
      label: "Eşleştirme",
      icon: Sparkles,
      badge: null,
      brokerOnly: false,
    },
    {
      id: "finance" as NavTab,
      label: "İşlemler",
      icon: Calculator,
      badge: deals.length,
      brokerOnly: false,
    },
    {
      id: "accounting",
      label: "Muhasebe",
      icon: Landmark,
      badge: "Harici ↗",
      brokerOnly: true,
      href: "https://trustline-muhasebe.vercel.app/",
    },

    {
      id: "security" as NavTab,
      label: "Veri Koruma",
      icon: ShieldAlert,
      badge: isBroker ? "Denetim" : null,
      brokerOnly: true,
    },
    {
      id: "settings" as NavTab,
      label: "Ayarlar",
      icon: Settings,
      badge: null,
      brokerOnly: false,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 select-none shadow-2xs">
      <div className="py-4">
        {/* Navigasyon Başlığı */}
        <div className="px-4 pb-2 text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">
          Operasyonel Modüller
        </div>

        <nav className="flex flex-col gap-0.5">
          {navItems
            .filter((item) => !item.brokerOnly || isBroker)
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              if ("href" in item && item.href) {
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition font-medium cursor-pointer text-slate-600 hover:bg-slate-100 hover:text-[#1d2566] group"
                    title="Muhasebe portalını yeni sekmede aç"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-[#1d2566]" />
                      <span className="tracking-tight">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge !== null && (
                        <span className="text-xs font-mono px-2 py-0.5 font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 group-hover:border-slate-300">
                          {item.badge}
                          <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                        </span>
                      )}
                    </div>
                  </a>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as NavTab)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition font-medium cursor-pointer ${
                    isActive
                      ? "bg-[#1d2566] text-white border-l-4 border-[#00adb5] font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#1d2566]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? "text-[#00adb5]"
                          : "text-slate-400 group-hover:text-[#1d2566]"
                      }`}
                    />
                    <span className="tracking-tight">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge !== null && (
                      <span
                        className={`text-xs font-mono px-2 py-0.5 font-bold ${
                          isActive
                            ? "bg-[#00adb5] text-white"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
        </nav>
      </div>

      {/* Alt Bilgi & Kullanıcı Durumu / Çıkış */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 bg-[#1d2566] text-white flex items-center justify-center text-xs font-bold font-mono shrink-0">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="font-bold text-slate-800 text-sm truncate leading-tight">
                {currentUser.name}
              </div>
              <div className="text-xs text-slate-500 font-mono leading-tight">
                {currentUser.title || (isBroker ? "Broker" : "Danışman")}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Oturumu Kapat"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs font-mono text-slate-500">
          <span>Erişim: <strong className={isBroker ? "text-emerald-700" : "text-[#00adb5]"}>{isBroker ? "TAM YETKİ" : "DANIŞMAN"}</strong></span>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className="hover:underline text-slate-600 hover:text-[#1d2566] cursor-pointer"
          >
            Şifre / Profil
          </button>
        </div>
      </div>
    </aside>
  );
}
