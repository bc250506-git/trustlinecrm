"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Customer, Property, RentalContract } from "@/lib/types";
import { formatPhoneWithPrefix } from "@/lib/formatters";
import {
  Search,
  X,
  User,
  Building,
  KeyRound,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  MapPin,
  Tag,
} from "lucide-react";

interface GlobalHeaderSearchProps {
  onOpenCustomer?: (customerId: string) => void;
  onOpenProperty?: (propertyId: string) => void;
  onNavigateTab?: (tab: any) => void;
}

// Türkçe karakterleri normalize eden arama yardımcısı
function normalizeText(text?: string | null): string {
  if (!text) return "";
  return text
    .trim()
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u");
}

export function GlobalHeaderSearch({
  onOpenCustomer,
  onOpenProperty,
  onNavigateTab,
}: GlobalHeaderSearchProps) {
  const { currentUser, isBroker, customers, properties, rentals } = useStore();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. KULLANICI ERİŞİM İZOLASYONU (CRITICAL PERMISSION FILTER)
  // Broker: Tüm şirket kayıtlarına erişebilir.
  // Danışman: YALNIZCA kendi atandığı veya ofisle/kendisiyle paylaşılan kayıtları görür.
  // Başka danışmanın özel müşterisi/portföyü ASLA listede çıkmaz!
  const accessibleCustomers = useMemo(() => {
    if (isBroker) {
      return customers.filter((c) => !c.deletedAt);
    }
    return customers.filter(
      (c) => !c.deletedAt && (c.assignedToId === currentUser.id || c.isShared)
    );
  }, [customers, isBroker, currentUser]);

  const accessibleProperties = useMemo(() => {
    if (isBroker) {
      return properties.filter((p) => !p.deletedAt);
    }
    return properties.filter(
      (p) => !p.deletedAt && (p.assignedToId === currentUser.id || p.isShared)
    );
  }, [properties, isBroker, currentUser]);

  const accessibleRentals = useMemo(() => {
    if (isBroker) {
      return rentals.filter((r) => r.active !== false);
    }
    return rentals.filter(
      (r) =>
        r.active !== false &&
        (r.assignedToId === currentUser.id ||
          (r.assignedToName &&
            currentUser.name &&
            r.assignedToName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()))
    );
  }, [rentals, isBroker, currentUser]);

  // 2. ARAMA VE EŞLEŞTİRME FİLTRESİ
  const searchResults = useMemo(() => {
    const q = normalizeText(query);
    if (!q || q.length < 1) {
      return { customers: [], properties: [], rentals: [] };
    }

    const cleanNumQuery = query.replace(/\D/g, "");

    // Müşteriler
    const matchedCustomers = accessibleCustomers.filter((c) => {
      const matchName = normalizeText(c.fullName).includes(q);
      const matchEmail = c.email ? normalizeText(c.email).includes(q) : false;
      const matchPhone =
        cleanNumQuery.length >= 3 && c.phone
          ? c.phone.replace(/\D/g, "").includes(cleanNumQuery)
          : false;
      return matchName || matchEmail || matchPhone;
    });

    // Portföyler
    const matchedProperties = accessibleProperties.filter((p) => {
      const matchTitle = normalizeText(p.title).includes(q);
      const matchRegion = normalizeText(p.region).includes(q);
      const matchAddress = p.address ? normalizeText(p.address).includes(q) : false;
      const matchType = normalizeText(p.propertyType).includes(q);
      const matchOwner = p.ownerName ? normalizeText(p.ownerName).includes(q) : false;
      return matchTitle || matchRegion || matchAddress || matchType || matchOwner;
    });

    // Kiralar
    const matchedRentals = accessibleRentals.filter((r) => {
      const matchTitle = normalizeText(r.propertyTitle).includes(q);
      const matchTenant = normalizeText(r.tenantName).includes(q);
      const matchLandlord = normalizeText(r.landlordName).includes(q);
      return matchTitle || matchTenant || matchLandlord;
    });

    return {
      customers: matchedCustomers.slice(0, 5),
      properties: matchedProperties.slice(0, 5),
      rentals: matchedRentals.slice(0, 3),
      totalCount: matchedCustomers.length + matchedProperties.length + matchedRentals.length,
    };
  }, [query, accessibleCustomers, accessibleProperties, accessibleRentals]);

  // Dışarı tıklandığında dropdown'ı kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ctrl + K veya / klavye kısayolu ile hızlı odaklanma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelectCustomer = (c: Customer) => {
    setIsOpen(false);
    if (onOpenCustomer) {
      onOpenCustomer(c.id);
    } else if (onNavigateTab) {
      onNavigateTab("customers");
    }
  };

  const handleSelectProperty = (p: Property) => {
    setIsOpen(false);
    if (onOpenProperty) {
      onOpenProperty(p.id);
    } else if (onNavigateTab) {
      onNavigateTab("properties");
    }
  };

  const handleSelectRental = (r: RentalContract) => {
    setIsOpen(false);
    if (onNavigateTab) {
      onNavigateTab("rentals");
    }
  };

  const hasQuery = query.trim().length > 0;
  const hasResults =
    searchResults.customers.length > 0 ||
    searchResults.properties.length > 0 ||
    searchResults.rentals.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-lg mx-auto">
      {/* Searchbar Giriş Kutusu */}
      <div
        className={`relative flex items-center bg-slate-50 border transition-all rounded-xs ${
          isOpen
            ? "border-[#00adb5] bg-white ring-1 ring-[#00adb5]/20 shadow-xs"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <Search className="w-4 h-4 text-slate-400 ml-3 pointer-events-none shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Müşteri adı veya portföy ara..."
          className="w-full py-1.5 pl-2.5 pr-8 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-sans"
        />

        {/* Temizle Butonu veya Kısayol Tuşu */}
        <div className="absolute right-2 flex items-center gap-1.5">
          {hasQuery ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              title="Aramayı Temizle"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-100 border border-slate-200 select-none">
              Ctrl K
            </kbd>
          )}
        </div>
      </div>

      {/* Arama Sonuçları Dropdown */}
      {isOpen && hasQuery && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 shadow-2xl z-50 max-h-[460px] overflow-y-auto divide-y divide-slate-100 font-sans animate-in fade-in zoom-in-95 duration-100">
          {/* Sonuç Yok Uyarısı */}
          {!hasResults && (
            <div className="p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Search className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-700">
                &quot;{query}&quot; ile eşleşen erişilebilir kayıt bulunamadı.
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                🔒 Yalnızca yetkiniz dahilindeki (kendi veya paylaşılan) veriler listelenir.
              </p>
            </div>
          )}

          {/* 1. MÜŞTERİ SONUÇLARI */}
          {searchResults.customers.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-[10px] font-mono uppercase font-bold text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3 h-3 text-[#00adb5]" />
                  MÜŞTERİLER
                </span>
                <span>{searchResults.customers.length} Sonuç</span>
              </div>
              <div className="mt-1 space-y-0.5">
                {searchResults.customers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCustomer(c)}
                    className="w-full flex items-center justify-between p-2 text-left hover:bg-slate-50 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                        {c.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#1d2566] group-hover:text-[#00adb5] truncate transition">
                          {c.fullName}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          {c.phone && <span>{formatPhoneWithPrefix(c.phone) || c.phone}</span>}
                          {c.category && (
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 border border-slate-200">
                              {c.category === "BUYER"
                                ? "Alıcı"
                                : c.category === "SELLER"
                                ? "Satıcı"
                                : c.category === "TENANT"
                                ? "Kiracı"
                                : "Satıcı & Alıcı"}
                            </span>
                          )}
                          {c.isShared && (
                            <span className="text-indigo-600 font-bold">🤝 Paylaşılan</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#00adb5] group-hover:translate-x-0.5 transition shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. PORTFÖY SONUÇLARI */}
          {searchResults.properties.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-[10px] font-mono uppercase font-bold text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building className="w-3 h-3 text-[#1d2566]" />
                  PORTFÖYLER
                </span>
                <span>{searchResults.properties.length} Sonuç</span>
              </div>
              <div className="mt-1 space-y-0.5">
                {searchResults.properties.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProperty(p)}
                    className="w-full flex items-center justify-between p-2 text-left hover:bg-slate-50 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                        <Building className="w-3.5 h-3.5 text-emerald-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#1d2566] group-hover:text-[#00adb5] truncate transition">
                          {p.title}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span className="text-[#1d2566] font-bold">
                            {p.price.toLocaleString("tr-TR")} {p.currency}
                          </span>
                          <span>•</span>
                          <span>{p.propertyType}</span>
                          <span>•</span>
                          <span>{p.region || p.address}</span>
                          {p.isShared && (
                            <span className="text-indigo-600 font-bold">🤝 Paylaşılan</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#00adb5] group-hover:translate-x-0.5 transition shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. KİRA SÖZLEŞMELERİ SONUÇLARI */}
          {searchResults.rentals.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-[10px] font-mono uppercase font-bold text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3 h-3 text-amber-500" />
                  KİRA TAKİBİ
                </span>
                <span>{searchResults.rentals.length} Sonuç</span>
              </div>
              <div className="mt-1 space-y-0.5">
                {searchResults.rentals.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectRental(r)}
                    className="w-full flex items-center justify-between p-2 text-left hover:bg-slate-50 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#1d2566] group-hover:text-[#00adb5] truncate transition">
                          {r.propertyTitle}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>Kiracı: {r.tenantName}</span>
                          <span>•</span>
                          <span className="text-[#1d2566] font-semibold">
                            {r.monthlyRent} {r.currency}/ay
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#00adb5] group-hover:translate-x-0.5 transition shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Alt Bilgi */}
          {hasResults && (
            <div className="p-2 bg-slate-50 text-[10px] font-mono text-slate-500 flex items-center justify-between">
              <span>🔒 Yalnızca erişim yetkiniz olan veriler taranır</span>
              <span className="text-slate-400">Esc ile kapat</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
