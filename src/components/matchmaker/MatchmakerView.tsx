"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { Customer, Property } from "@/lib/types";
import {
  findMatchesForCustomer,
  findMatchesForProperty,
  MatchResult,
} from "@/lib/matchmaker";
import {
  Sparkles,
  User,
  Building,
  CheckCircle2,
  XCircle,
  Share2,
  Phone,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  Calendar,
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
  onCreateAppointment,
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
              YAPAY ZEKA & ALGORİTMA MOTORU
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              4 Kriterli Deterministik Eşleştirme
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1d2566] tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00adb5]" />
            Akıllı Portföy & Müşteri Eşleştirme Motoru
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            PRD kuralı uyarınca: Para birimi mutlak uyumu (TRY-TRY, GBP-GBP), bütçe
            kapasitesi, lokasyon & mülk tipi ve işlem niyeti (satılık/kiralık)
            kurallarına göre portföyünüzü en sıcak alıcılarla anında buluşturun.
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
                    {c.fullName} ({c.category} - {c.budget?.toLocaleString("tr-TR")}{" "}
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
              <div className="bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1d2566]">
                    {selectedCustomer.fullName}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-[#00adb5]/10 text-[#00adb5] border border-[#00adb5]/30 font-bold">
                    {selectedCustomer.category}
                  </span>
                </div>

                <div className="text-[11px] font-mono space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Maksimum Bütçe:</span>
                    <span className="text-[#1d2566] font-bold">
                      {selectedCustomer.budget?.toLocaleString("tr-TR")}{" "}
                      {selectedCustomer.budgetCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aranan Bölge:</span>
                    <span className="text-slate-800 font-semibold">
                      {selectedCustomer.region}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Konut Tipi:</span>
                    <span className="text-slate-800 font-semibold">
                      {selectedCustomer.propertyType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sıcaklık:</span>
                    <span className="text-rose-600 uppercase font-bold">
                      {selectedCustomer.temperature}
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

                <div className="text-[11px] font-mono space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Liste Fiyatı:</span>
                    <span className="text-[#1d2566] font-bold">
                      {selectedProperty.price.toLocaleString("tr-TR")}{" "}
                      {selectedProperty.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Konum:</span>
                    <span className="text-slate-800 font-semibold">
                      {selectedProperty.region}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kullanım / Oda:</span>
                    <span className="text-slate-800 font-semibold">
                      {selectedProperty.area} m² / {selectedProperty.rooms}
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
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              Skor &gt;= %55 Olanlar Listelenir
            </span>
          </div>

          {/* Müşteri -> Mülk Eşleşmeleri */}
          {mode === "customer_to_property" && (
            <div className="space-y-3">
              {matchesForCustomer.length === 0 ? (
                <div className="sharp-card p-12 text-center text-slate-400 font-mono text-xs">
                  Bu müşterinin bütçesine, para birimine ve tercihine uygun aktif
                  portföy bulunamadı.
                </div>
              ) : (
                matchesForCustomer.map(({ property, result }) => (
                  <div
                    key={property.id}
                    className="sharp-card p-4 hover:border-[#00adb5] transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        {/* Skor Rozeti */}
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-0.5 border ${
                            result.score >= 90
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
                      </div>

                      <h3 className="text-xs font-bold text-slate-800">
                        {property.title}
                      </h3>

                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                        <span>{property.region}</span>
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
                <div className="sharp-card p-12 text-center text-slate-400 font-mono text-xs">
                  Bu portföyün fiyatı ve niteliklerine uygun kayıtlı müşteri adayı
                  bulunamadı.
                </div>
              ) : (
                matchesForProperty.map(({ customer, result }) => (
                  <div
                    key={customer.id}
                    className="sharp-card p-4 hover:border-[#00adb5] transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-0.5 border ${
                            result.score >= 90
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

                        {customer.isVip && (
                          <span className="text-[9px] font-mono uppercase bg-amber-500 text-black px-1 font-bold">
                            VIP
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                        <span className="text-[#1d2566] font-bold">
                          Bütçe: {customer.budget?.toLocaleString("tr-TR")}{" "}
                          {customer.budgetCurrency}
                        </span>
                        <span>•</span>
                        <span>{customer.region}</span>
                        <span>•</span>
                        <span>{customer.propertyType}</span>
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
                          className="p-1.5 bg-white border border-slate-300 hover:border-[#00adb5] text-slate-600 transition"
                          title="Ara"
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
