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
import { InboxView } from "@/components/inbox/InboxView";
import { SecurityView } from "@/components/security/SecurityView";
import { SettingsView } from "@/components/settings/SettingsView";
import { LoginView } from "@/components/auth/LoginView";
import { BrochureModal } from "@/components/brochure/BrochureModal";
import { Customer, Property } from "@/lib/types";
import { useStore } from "@/lib/store";

function MainApp() {
  const { isAuthenticated } = useStore();
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [matchmakerCustomer, setMatchmakerCustomer] = useState<Customer | null>(null);
  const [matchmakerProperty, setMatchmakerProperty] = useState<Property | null>(null);
  const [brochureProperty, setBrochureProperty] = useState<Property | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

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

            {activeTab === "inbox" && <InboxView />}

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
