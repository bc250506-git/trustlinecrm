"use client";

import React, { useState } from "react";
import { StoreProvider } from "@/lib/store";
import { Header } from "@/components/layout/Header";
import { Sidebar, NavTab } from "@/components/layout/Sidebar";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { CustomersView } from "@/components/customers/CustomersView";
import { PropertiesView } from "@/components/properties/PropertiesView";
import { MatchmakerView } from "@/components/matchmaker/MatchmakerView";
import { CalendarView } from "@/components/calendar/CalendarView";
import { MonthCalendarView } from "@/components/calendar/MonthCalendarView";
import { RentalsView } from "@/components/rentals/RentalsView";
import { MandatesView } from "@/components/mandates/MandatesView";
import { FinanceView } from "@/components/finance/FinanceView";
import { SecurityView } from "@/components/security/SecurityView";
import { SettingsView } from "@/components/settings/SettingsView";
import { LoginView } from "@/components/auth/LoginView";
import { BrochureModal } from "@/components/brochure/BrochureModal";
import { WeeklyBackupModal } from "@/components/backup/WeeklyBackupModal";
import { Customer, Property } from "@/lib/types";
import { useStore } from "@/lib/store";

const VALID_TABS: NavTab[] = [
  "dashboard",
  "month_calendar",
  "calendar",
  "customers",
  "properties",
  "matchmaker",
  "rentals",
  "mandates",
  "finance",
  "security",
  "settings",
];

const ACTIVE_TAB_STORAGE_KEY = "trustline_crm_active_tab";

function getStoredTab(): NavTab {
  if (typeof window === "undefined") return "dashboard";

  // 1. URL Hash önceliği (#properties, #customers vb.)
  const hash = window.location.hash.replace(/^#/, "").trim() as NavTab;
  if (VALID_TABS.includes(hash)) {
    return hash;
  }

  // 2. URL Query Parametre önceliği (?tab=properties)
  try {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab") as NavTab;
    if (tabParam && VALID_TABS.includes(tabParam)) {
      return tabParam;
    }
  } catch {}

  // 3. LocalStorage önceliği
  try {
    const saved = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY) as NavTab;
    if (saved && VALID_TABS.includes(saved)) {
      return saved;
    }
  } catch {}

  return "dashboard";
}

function MainApp() {
  const { isAuthenticated } = useStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (typeof window !== "undefined") {
      return getStoredTab();
    }
    return "dashboard";
  });
  const [matchmakerCustomer, setMatchmakerCustomer] = useState<Customer | null>(null);
  const [matchmakerProperty, setMatchmakerProperty] = useState<Property | null>(null);
  const [brochureProperty, setBrochureProperty] = useState<Property | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // SSR Hydration Uyuşmazlığını Önleme & Hash Takibi (F5 Yenilemede Aynı Sekmede Kalma)
  React.useEffect(() => {
    setMounted(true);
    const initial = getStoredTab();
    if (initial) {
      setActiveTab(initial);
      if (window.location.hash !== `#${initial}`) {
        window.history.replaceState(null, "", `#${initial}`);
      }
    }

    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, "").trim() as NavTab;
      if (VALID_TABS.includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Aktif sekme değiştikçe LocalStorage ve URL Hash'ini daima güncel tut
  React.useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    try {
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
      if (window.location.hash !== `#${activeTab}`) {
        window.history.replaceState(null, "", `#${activeTab}`);
      }
    } catch {}
  }, [activeTab, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-mono text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#00adb5] animate-ping rounded-full" />
          <span>Trustline CRM Yükleniyor...</span>
        </div>
      </div>
    );
  }

  // Müşteriden Eşleştirme Motoruna Geçiş
  const handleFindMatchesForCustomer = (customer: Customer) => {
    setMatchmakerCustomer(customer);
    setMatchmakerProperty(null);
    setActiveTab("matchmaker");
  };

  // Portföyden Eşleştirme Motoruna Geçiş
  const handleFindMatchesForProperty = (property: Property) => {
    setMatchmakerProperty(property);
    setMatchmakerCustomer(null);
    setActiveTab("matchmaker");
  };

  const handleOpenCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setActiveTab("customers");
  };

  // Oturum açılmamışsa kurumsal login ekranını göster
  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col font-sans selection:bg-[#00adb5] selection:text-white">
      {/* Üst Yönetici Çubuğu */}
      <Header onNavigateTab={setActiveTab} />

      {/* Ana Çerçeve */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sol Kenar Çubuğu */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Ana İçerik Alanı */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#f8fafc]">
          <div className="max-w-[1440px] mx-auto">
            {activeTab === "dashboard" && (
              <DashboardView
                onNavigate={setActiveTab}
                onOpenCustomer={handleOpenCustomer}
              />
            )}

            {activeTab === "customers" && (
              <CustomersView
                onFindMatches={handleFindMatchesForCustomer}
                selectedCustomerId={selectedCustomerId}
              />
            )}

            {activeTab === "properties" && (
              <PropertiesView
                onFindMatches={handleFindMatchesForProperty}
              />
            )}

            {activeTab === "matchmaker" && (
              <MatchmakerView
                initialCustomer={matchmakerCustomer}
                initialProperty={matchmakerProperty}
                onOpenBrochure={(prop) => setBrochureProperty(prop)}
              />
            )}

            {activeTab === "month_calendar" && (
              <MonthCalendarView onNavigate={setActiveTab} />
            )}

            {activeTab === "calendar" && <CalendarView />}

            {activeTab === "rentals" && <RentalsView />}

            {activeTab === "mandates" && <MandatesView />}

            {activeTab === "finance" && <FinanceView />}


            {activeTab === "security" && <SecurityView />}

            {activeTab === "settings" && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Genel Broşür Modalı */}
      {brochureProperty && (
        <BrochureModal
          property={brochureProperty}
          onClose={() => setBrochureProperty(null)}
        />
      )}

      {/* Haftalık Otomatik Güvenlik ve Yedekleme Hatırlatıcısı Modalı */}
      <WeeklyBackupModal />
    </div>
  );
}

export default function Home() {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
}
