"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Customer, Property } from "@/lib/types";
import { formatCustomerCategory, formatCustomerTemperature } from "@/lib/formatters";
import {
  findMatchesForCustomer,
  findMatchesForProperty,
} from "@/lib/matchmaker";
import {
  getCurrentExchangeRates,
  updateLiveExchangeRates,
  ExchangeRates,
} from "@/lib/currency";
import {
  Sparkles,
  User,
  Building,
  CheckCircle2,
  XCircle,
  Share2,
  Phone,
  MessageSquare,
  RefreshCw,
  Coins,
  Flame,
  Star,
  MapPin,
  Home,
  Layers,
} from "lucide-react";

interface MatchmakerViewProps {
  initialCustomer?: Customer | null;
  initialProperty?: Property | null;
  onOpenBrochure?: (property: Property) => void;
  onCreateAppointment?: (customer: Customer, property: Property) => void;
}

export function MatchmakerView({
  initialCustomer,
  initialProperty,
  onOpenBrochure,
}: MatchmakerViewProps) {
  const { customers, properties } = useStore();

  const [mode, setMode] = useState<"customer_to_property" | "property_to_customer">(
    initialProperty ? "property_to_customer" : "customer_to_property"
  );

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomer?.id || customers[0]?.id || ""
  );

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    initialProperty?.id || properties[0]?.id || ""
  );

  // Canlı Kur Durumu
  const [fxData, setFxData] = useState(() => getCurrentExchangeRates());
  const [isUpdatingFx, setIsUpdatingFx] = useState(false);

  useEffect(() => {
    // Sayfa açıldığında veya periyodik 10 dk'da bir kurları güncelle
    updateLiveExchangeRates().then(() => {
      setFxData(getCurrentExchangeRates());
    });
    const interval = setInterval(() => {
      updateLiveExchangeRates().then(() => {
        setFxData(getCurrentExchangeRates());
      });
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshFx = async () => {
    setIsUpdatingFx(true);
    await updateLiveExchangeRates();
    setFxData(getCurrentExchangeRates());
    setIsUpdatingFx(false);
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  // Eşleştirme Motoru Sonuçları
  const matchesForCustomer = selectedCustomer
    ? findMatchesForCustomer(selectedCustomer, properties)
    : [];

  const matchesForProperty = selectedProperty
    ? findMatchesForProperty(selectedProperty, customers)
    : [];

  return (
    <div className="space-y-6">
      {/* Üst Bilgi Başlığı */}
      <div className="sharp-card p-6 border-l-4 border-l-[#00adb5] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#00adb5] font-bold tracking-wider uppercase">
              YAPAY ZEKA & ALGORİTMA MOTORU (V2)
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              Sert Niyet Filtresi & Anlık FX Kur Çevirici
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1d2566] tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00adb5]" />
            Akıllı Portföy & Müşteri Eşleştirme Motoru
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            • <strong>Sert Niyet Kuralı:</strong> Alıcıya kiralık, kiracıya satılık portföy ASLA önerilmez.<br />
            • <strong>Canlı Kur Çevirici:</strong> Para birimi engeli yok; bütçe anlık KKTC / MB kurlarıyla otomatik dönüştürülerek karşılaştırılır.<br />
            • <strong>Çoklu Tercih Desteği:</strong> Müşterinin seçtiği alternatif bölgeler, konut tipleri ve oda sayıları tam taranır.
          </p>
        </div>

        {/* Mod Değiştirici */}
        <div className="flex items-center bg-slate-100 border border-slate-200 p-1 shrink-0">
          <button
            onClick={() => setMode("customer_to_property")}
            className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              mode === "customer_to_property"
                ? "bg-[#1d2566] text-white font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="w-3.5 h-3.5" /> Müşteriye Portföy Bul
          </button>
          <button
            onClick={() => setMode("property_to_customer")}
            className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              mode === "property_to_customer"
                ? "bg-[#1d2566] text-white font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building className="w-3.5 h-3.5" /> Portföye Müşteri Bul
          </button>
        </div>
      </div>

      {/* Canlı Kur Göstergesi Bandı */}
      <div className="sharp-card p-3 bg-gradient-to-r from-slate-900 to-[#1d2566] text-white flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-[#00adb5] font-bold uppercase tracking-wider">
            <Coins className="w-4 h-4 text-[#00adb5]" /> Canlı FX Kurları:
          </span>
          <span className="bg-white/10 px-2 py-0.5 border border-white/20">
            1 GBP = <strong>{fxData.rates.GBP.toFixed(2)} ₺</strong>
          </span>
          <span className="bg-white/10 px-2 py-0.5 border border-white/20">
            1 EUR = <strong>{fxData.rates.EUR.toFixed(2)} ₺</strong>
          </span>
          <span className="bg-white/10 px-2 py-0.5 border border-white/20">
            1 USD = <strong>{fxData.rates.USD.toFixed(2)} ₺</strong>
          </span>
          <span className="text-[10px] text-slate-300">
            ({fxData.lastUpdated})
          </span>
        </div>

        <button
          type="button"
          onClick={handleRefreshFx}
          disabled={isUpdatingFx}
          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-mono flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
          title="Kurları Şimdi Güncelle"
        >
          <RefreshCw className={`w-3 h-3 ${isUpdatingFx ? "animate-spin" : ""}`} />
          <span>{isUpdatingFx ? "Çekiliyor..." : "Kurları Güncelle"}</span>
        </button>
      </div>

      {/* Kaynak Seçim Alanı */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sol Kolon: Seçilen Özne Kartı (4 Kolon) */}
        <div className="md:col-span-4 space-y-4">
          <div className="sharp-card p-4">
            <div className="text-xs font-mono uppercase text-slate-500 mb-2 font-bold">
              {mode === "customer_to_property"
                ? "Analiz Edilecek Müşteri:"
                : "Analiz Edilecek Portföy:"}
            </div>

            {mode === "customer_to_property" ? (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="sharp-input w-full p-2.5 text-xs font-mono bg-white mb-4"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({formatCustomerCategory(c.category)} - {c.budget?.toLocaleString("tr-TR")}{" "}
                    {c.budgetCurrency})
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="sharp-input w-full p-2.5 text-xs font-mono bg-white mb-4"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.listingType === "sale" ? "Satılık" : "Kiralık"} -{" "}
                    {p.price.toLocaleString("tr-TR")} {p.currency})
                  </option>
                ))}
              </select>
            )}

            {/* Seçili Kartın Kriter Özeti */}
            {mode === "customer_to_property" && selectedCustomer && (
              <div className="bg-slate-50 border border-slate-200 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1d2566] text-sm">
                    {selectedCustomer.fullName}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-[#00adb5]/10 text-[#00adb5] border border-[#00adb5]/30 font-bold">
                      {formatCustomerCategory(selectedCustomer.category)}
                    </span>
                    {selectedCustomer.isVip && (
                      <span className="text-[9px] font-mono uppercase bg-amber-500 text-black px-1.5 py-0.5 font-bold flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-black" /> VIP
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] font-mono space-y-2 text-slate-600">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="text-slate-500">Maksimum Bütçe:</span>
                    <span className="text-[#1d2566] font-bold text-xs">
                      {selectedCustomer.budget?.toLocaleString("tr-TR")}{" "}
                      {selectedCustomer.budgetCurrency}
                    </span>
                  </div>

                  {/* Bölgeler */}
                  <div className="py-1 border-b border-slate-200">
                    <div className="flex items-center gap-1 text-slate-500 mb-1">
                      <MapPin className="w-3 h-3 text-[#00adb5]" />
                      <span>Aranan Bölge(ler):</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedCustomer.regions && selectedCustomer.regions.length > 0 ? (
                        selectedCustomer.regions.map((rg, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-white border border-slate-300 text-slate-800 text-[10px] font-semibold"
                          >
                            {rg}
                          </span>
                        ))
                      ) : (
                        <span className="font-semibold text-slate-800">
                          {selectedCustomer.region || "KKTC Genel"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Konut Tipleri */}
                  <div className="py-1 border-b border-slate-200">
                    <div className="flex items-center gap-1 text-slate-500 mb-1">
                      <Home className="w-3 h-3 text-[#00adb5]" />
                      <span>Gayrimenkul Tipi:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedCustomer.propertyTypes && selectedCustomer.propertyTypes.length > 0 ? (
                        selectedCustomer.propertyTypes.map((pt, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-white border border-slate-300 text-slate-800 text-[10px] font-semibold"
                          >
                            {pt}
                          </span>
                        ))
                      ) : (
                        <span className="font-semibold text-slate-800">
                          {selectedCustomer.propertyType || "Tümü"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Oda Sayıları */}
                  <div className="py-1 border-b border-slate-200">
                    <div className="flex items-center gap-1 text-slate-500 mb-1">
                      <Layers className="w-3 h-3 text-[#00adb5]" />
                      <span>Oda Sayısı Tercihi:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedCustomer.roomsList && selectedCustomer.roomsList.length > 0 ? (
                        selectedCustomer.roomsList.map((rm, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-white border border-slate-300 text-slate-800 text-[10px] font-semibold"
                          >
                            {rm}
                          </span>
                        ))
                      ) : (
                        <span className="font-semibold text-slate-800">
                          {selectedCustomer.rooms || "Farketmez"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sıcaklık Seviyesi */}
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-500">Müşteri Sıcaklığı:</span>
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        selectedCustomer.temperature === "hot"
                          ? "text-rose-600"
                          : selectedCustomer.temperature === "warm"
                          ? "text-amber-600"
                          : "text-slate-600"
                      }`}
                    >
                      {selectedCustomer.temperature === "hot" && (
                        <Flame className="w-3 h-3 text-rose-600 fill-rose-600" />
                      )}
                      {formatCustomerTemperature(selectedCustomer.temperature)}
                    </span>
                  </div>
                </div>

                {selectedCustomer.notes && (
                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 italic">
                    "{selectedCustomer.notes}"
                  </div>
                )}
              </div>
            )}

            {mode === "property_to_customer" && selectedProperty && (
              <div className="bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1d2566] line-clamp-1">
                    {selectedProperty.title}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    {selectedProperty.listingType === "sale" ? "Satılık" : "Kiralık"}
                  </span>
                </div>

                <div className="text-[11px] font-mono space-y-1.5 text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Liste Fiyatı:</span>
                    <span className="text-[#1d2566] font-bold text-xs">
                      {selectedProperty.price.toLocaleString("tr-TR")}{" "}
                      {selectedProperty.currency}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Konum:</span>
                    <span className="text-slate-800 font-semibold">
                      {selectedProperty.region}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Tip & Oda:</span>
                    <span className="text-slate-800 font-semibold">
                      {selectedProperty.propertyType} • {selectedProperty.rooms}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Alan:</span>
                    <span className="text-slate-800 font-semibold">
                      {selectedProperty.area} m²
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sağ Kolon: Eşleşme Sonuçları (8 Kolon) */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00adb5]" />
              <h2 className="text-sm font-bold text-[#1d2566]">
                {mode === "customer_to_property"
                  ? `Uygun Portföyler (${matchesForCustomer.length} Eşleşme)`
                  : `Uygun Müşteriler (${matchesForProperty.length} Eşleşme)`}
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              Skor &ge; %50 Olanlar • Niyeti Uyuşmayanlar Elendi
            </span>
          </div>

          {/* Müşteri -> Mülk Eşleşmeleri */}
          {mode === "customer_to_property" && (
            <div className="space-y-3">
              {matchesForCustomer.length === 0 ? (
                <div className="sharp-card p-12 text-center text-slate-500 font-mono text-xs space-y-2">
                  <p className="font-bold text-slate-700">
                    Bu müşterinin işlem niyetine ({selectedCustomer?.category === "BUYER" ? "Satılık" : "Kiralık"}) ve bütçesine uygun aktif portföy bulunamadı.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Satılık arayan alıcılara kiralık portföyler kural gereği kesinlikle önerilmemektedir.
                  </p>
                </div>
              ) : (
                matchesForCustomer.map(({ property, result }) => (
                  <div
                    key={property.id}
                    className="sharp-card p-4 hover:border-[#00adb5] transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Skor Rozeti */}
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-0.5 border ${
                            result.score >= 85
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : result.score >= 70
                              ? "bg-[#00adb5]/10 text-[#00adb5] border-[#00adb5]/40"
                              : "bg-amber-50 text-amber-800 border-amber-300"
                          }`}
                        >
                          %{result.score} EŞLEŞME
                        </span>

                        {result.isStrictMatch && (
                          <span className="text-[10px] font-mono uppercase bg-emerald-600 text-white px-2 py-0.5 font-bold">
                            TAM KRİTER UYUMU
                          </span>
                        )}

                        <span className="text-xs font-bold font-mono text-[#1d2566]">
                          {property.price.toLocaleString("tr-TR")}{" "}
                          {property.currency}
                        </span>

                        {/* Kur Çevrim Hapı */}
                        {result.convertedBudgetDisplay && (
                          <span className="text-[10px] font-mono text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5">
                            💱 {result.convertedBudgetDisplay}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-bold text-slate-800">
                        {property.title}
                      </h3>

                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                        <span>{property.region}</span>
                        <span>•</span>
                        <span>{property.propertyType}</span>
                        <span>•</span>
                        <span>{property.area} m²</span>
                        <span>•</span>
                        <span>{property.rooms}</span>
                      </div>

                      {/* Kriter Açıklamaları */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {result.matchedCriteria.map((c, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 flex items-center gap-1 font-semibold"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> {c}
                          </span>
                        ))}
                        {result.missingCriteria.map((m, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 border border-rose-200 flex items-center gap-1 font-semibold"
                          >
                            <XCircle className="w-2.5 h-2.5 text-rose-600" /> {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Hızlı Aksiyonlar */}
                    <div className="flex items-center gap-2 shrink-0">
                      {selectedCustomer && selectedCustomer.whatsapp && (
                        <a
                          href={`https://wa.me/${selectedCustomer.whatsapp.replace(
                            /\D/g,
                            ""
                          )}?text=${encodeURIComponent(
                            `Sayın ${selectedCustomer.fullName}, aradığınız kriterlere uygun yeni portföyümüzü incelemenizi isteriz: ${property.title} - ${property.price.toLocaleString("tr-TR")} ${property.currency}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-2xs"
                          title="WhatsApp ile Broşür ve Bilgi Paylaş"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Paylaş</span>
                        </a>
                      )}

                      <button
                        onClick={() => onOpenBrochure && onOpenBrochure(property)}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:border-[#1d2566] text-[#1d2566] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#00adb5]" />
                        <span>Broşür</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Mülk -> Müşteri Eşleşmeleri */}
          {mode === "property_to_customer" && (
            <div className="space-y-3">
              {matchesForProperty.length === 0 ? (
                <div className="sharp-card p-12 text-center text-slate-500 font-mono text-xs space-y-2">
                  <p className="font-bold text-slate-700">
                    Bu portföyün işlem türüne ({selectedProperty?.listingType === "sale" ? "Satılık Alıcı" : "Kiralık Kiracı"}) ve fiyatına uygun müşteri adayı bulunamadı.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Satılık portföylere kiracı müşteriler kesinlikle önerilmemektedir.
                  </p>
                </div>
              ) : (
                matchesForProperty.map(({ customer, result }) => (
                  <div
                    key={customer.id}
                    className="sharp-card p-4 hover:border-[#00adb5] transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-0.5 border ${
                            result.score >= 85
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : result.score >= 70
                              ? "bg-[#00adb5]/10 text-[#00adb5] border-[#00adb5]/40"
                              : "bg-amber-50 text-amber-800 border-amber-300"
                          }`}
                        >
                          %{result.score} EŞLEŞME
                        </span>

                        <span className="text-xs font-bold text-slate-800">
                          {customer.fullName}
                        </span>

                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#00adb5]/10 text-[#00adb5] border border-[#00adb5]/30 font-bold">
                          {formatCustomerCategory(customer.category)}
                        </span>

                        {customer.temperature === "hot" ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-300 font-bold flex items-center gap-1">
                            <Flame className="w-3 h-3 fill-rose-600" /> SICAK ALICI
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                            {formatCustomerTemperature(customer.temperature)}
                          </span>
                        )}

                        {customer.isVip && (
                          <span className="text-[9px] font-mono uppercase bg-amber-500 text-black px-1.5 py-0.5 font-bold flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-black" /> VIP
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 flex-wrap">
                        <span className="text-[#1d2566] font-bold">
                          Bütçe: {customer.budget?.toLocaleString("tr-TR")}{" "}
                          {customer.budgetCurrency}
                        </span>
                        {result.convertedBudgetDisplay && (
                          <span className="text-cyan-800 bg-cyan-50 border border-cyan-200 px-1.5 py-0.2 text-[10px]">
                            💱 {result.convertedBudgetDisplay}
                          </span>
                        )}
                        <span>•</span>
                        <span>{customer.regions?.join(", ") || customer.region}</span>
                        <span>•</span>
                        <span>{customer.propertyTypes?.join(", ") || customer.propertyType}</span>
                      </div>

                      {/* Kriter Açıklamaları */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {result.matchedCriteria.map((c, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 flex items-center gap-1 font-semibold"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> {c}
                          </span>
                        ))}
                        {result.missingCriteria.map((m, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 border border-rose-200 flex items-center gap-1 font-semibold"
                          >
                            <XCircle className="w-2.5 h-2.5 text-rose-600" /> {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Hızlı Aksiyonlar */}
                    <div className="flex items-center gap-2 shrink-0">
                      {customer.phone && (
                        <a
                          href={`tel:${customer.phone}`}
                          className="p-1.5 bg-white border border-slate-300 hover:border-[#00adb5] text-slate-600 transition shadow-2xs"
                          title="Hemen Ara"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#00adb5]" />
                        </a>
                      )}

                      {customer.whatsapp && selectedProperty && (
                        <a
                          href={`https://wa.me/${customer.whatsapp.replace(
                            /\D/g,
                            ""
                          )}?text=${encodeURIComponent(
                            `Merhaba ${customer.fullName}, talep ettiğiniz kriterlerde yeni portföyümüz portföy havuzumuza girdi: ${selectedProperty.title} - ${selectedProperty.price.toLocaleString("tr-TR")} ${selectedProperty.currency}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-2xs"
                          title="WhatsApp Paylaş"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Paylaş</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
