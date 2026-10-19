"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building,
  Key,
  FileText,
  Briefcase,
  Calendar,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Info,
  CheckCircle2,
  User,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { formatCurrencyAmount } from "@/lib/currency";

export interface RelationalDeleteModalProps {
  isOpen: boolean;
  type: "customer" | "property";
  itemId: string | null;
  itemName?: string;
  onClose: () => void;
  onConfirm: (cascade: boolean) => void;
}

export function RelationalDeleteModal({
  isOpen,
  type,
  itemId,
  itemName,
  onClose,
  onConfirm,
}: RelationalDeleteModalProps) {
  const { customers, properties, rentals, mandates, deals, followUps } = useStore();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Modal açıkken arkaplan kaydırmasını engelle ve Esc tuşu ile kapatabil
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen, onClose]);

  // İlişkisel Bağımlılık Taraması (Müşteri veya Portföy)
  const dependencies = useMemo(() => {
    if (!isOpen || !itemId) {
      return {
        properties: [],
        rentals: [],
        mandates: [],
        deals: [],
        followUps: [],
        total: 0,
      };
    }

    if (type === "customer") {
      // 1. Müşteriye ait portföyler (SADECE KESİN ID EŞLEŞMESİ)
      const ownedProperties = properties.filter((p) => {
        if (p.deletedAt) return false;
        return Boolean(itemId && p.ownerCustomerId === itemId);
      });
      const ownedPropertyIds = new Set(ownedProperties.map((p) => p.id));

      // 2. Doğrudan veya dolaylı (portföy üzerinden) kira sözleşmeleri (SADECE KESİN ID)
      const linkedRentals = rentals.filter((r) => {
        if (!r.active) return false;
        if (Boolean(itemId && (r.tenantCustomerId === itemId || r.landlordCustomerId === itemId))) return true;
        if (r.propertyId && ownedPropertyIds.has(r.propertyId)) return true;
        return false;
      });

      // 3. Yetki belgeleri (SADECE KESİN ID)
      const linkedMandates = mandates.filter((m) => {
        if (m.status === "cancelled") return false;
        if (Boolean(itemId && m.ownerCustomerId === itemId)) return true;
        if (m.propertyId && ownedPropertyIds.has(m.propertyId)) return true;
        return false;
      });

      // 4. İşlem & Anlaşmalar (Deals) (SADECE KESİN ID)
      const linkedDeals = deals.filter((d) => {
        if (d.stage === "lost") return false;
        if (Boolean(itemId && d.customerId === itemId)) return true;
        if (d.propertyId && ownedPropertyIds.has(d.propertyId)) return true;
        return false;
      });

      // 5. Açık randevu ve takipleri (SADECE KESİN ID)
      const linkedFollowUps = followUps.filter((f) => {
        if (f.status !== "open") return false;
        if (Boolean(itemId && f.customerId === itemId)) return true;
        if (f.propertyId && ownedPropertyIds.has(f.propertyId)) return true;
        return false;
      });

      const total =
        ownedProperties.length +
        linkedRentals.length +
        linkedMandates.length +
        linkedDeals.length +
        linkedFollowUps.length;

      return {
        properties: ownedProperties,
        rentals: linkedRentals,
        mandates: linkedMandates,
        deals: linkedDeals,
        followUps: linkedFollowUps,
        total,
      };
    } else {
      // type === "property"
      // 1. Portföye ait aktif kira sözleşmeleri
      const linkedRentals = rentals.filter((r) => r.active && r.propertyId === itemId);

      // 2. Portföye ait yetki belgeleri
      const linkedMandates = mandates.filter(
        (m) => m.status !== "cancelled" && m.propertyId === itemId
      );

      // 3. Portföye ait işlemler
      const linkedDeals = deals.filter(
        (d) => d.stage !== "lost" && d.propertyId === itemId
      );

      // 4. Portföye ait açık randevular
      const linkedFollowUps = followUps.filter(
        (f) => f.status === "open" && f.propertyId === itemId
      );

      const total =
        linkedRentals.length +
        linkedMandates.length +
        linkedDeals.length +
        linkedFollowUps.length;

      return {
        properties: [],
        rentals: linkedRentals,
        mandates: linkedMandates,
        deals: linkedDeals,
        followUps: linkedFollowUps,
        total,
      };
    }
  }, [isOpen, itemId, type, customers, properties, rentals, mandates, deals, followUps, itemName]);

  if (!isOpen || !itemId) return null;

  const hasDependencies = dependencies.total > 0;
  const displayName = itemName || (type === "customer" ? "Seçilen Müşteri" : "Seçilen Portföy");

  const toggleSection = (sec: string) => {
    setExpandedSection((prev) => (prev === sec ? null : sec));
  };

  return (
    <div
      className="fixed inset-0 z-[150] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`sharp-card w-full max-w-2xl bg-white border-2 ${
          hasDependencies ? "border-amber-500" : "border-rose-500"
        } shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* STICKY HEADER - Kural #1 Gereği sticky ve kapatma butonu üstte sabit */}
        <div
          className={`shrink-0 sticky top-0 z-20 px-5 py-4 border-b flex items-center justify-between ${
            hasDependencies
              ? "bg-amber-50/95 border-amber-200"
              : "bg-rose-50/95 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 border flex items-center justify-center shrink-0 ${
                hasDependencies
                  ? "bg-amber-100 border-amber-300 text-amber-700"
                  : "bg-rose-100 border-rose-300 text-rose-700"
              }`}
            >
              {hasDependencies ? (
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1d2566] tracking-wide flex items-center gap-2">
                {type === "customer"
                  ? "Müşteri ve İlişkili Veri Silme Onayı"
                  : "Portföy ve İlişkili Veri Silme Onayı"}
                {hasDependencies && (
                  <span className="px-2 py-0.5 text-[10px] bg-amber-500 text-white font-mono font-bold tracking-normal rounded-none">
                    {dependencies.total} Bağımlı Kayıt
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                {hasDependencies
                  ? "⚠️ Kritik Bağımlılık Taraması: Bağlantılı alt veriler tespit edildi!"
                  : "Sistem Kaydı Silme Denetimi"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-200/50 transition cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE BODY - Yalnızca bu içerik alanı kaydırılabilir */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans">
          {/* Silinmek İstenen Ana Kayıt Özeti */}
          <div className="p-3 bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {type === "customer" ? (
                <User className="w-4 h-4 text-blue-600 shrink-0" />
              ) : (
                <Building className="w-4 h-4 text-[#00adb5] shrink-0" />
              )}
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block">
                  {type === "customer" ? "Silinecek Müşteri" : "Silinecek Portföy"}
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {displayName}
                </span>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 text-[10px] font-mono font-bold ${
                hasDependencies
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-300"
              }`}
            >
              {hasDependencies ? "Bağlantılı Kayıtlar Var" : "İlişkili Kayıt Yok"}
            </span>
          </div>

          {/* Bağımlılık Durumu Uyarısı */}
          {hasDependencies ? (
            <div className="p-3.5 bg-amber-50/70 border border-amber-300 space-y-2 text-slate-700">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-900 text-xs">
                    Bu {type === "customer" ? "müşteriye" : "portföye"} bağlı diğer form ve kayıtlar mevcut!
                  </p>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    {type === "customer"
                      ? "Bu müşteriyi sildiğinizde, onun sahibi olduğu portföyler, bu portföylere ait aktif kira takipleri, sözleşmeler ve açık randevular sahipsiz kalacaktır."
                      : "Bu portföyü sildiğinizde, bu mülke bağlı aktif kira takipleri, yetki sözleşmeleri ve açık randevular etkisiz veya sahipsiz kalacaktır."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs">
                Bu kayda bağlı herhangi bir portföy, aktif kira takibi veya sözleşme bulunmamaktadır.
                Kayıt güvenle sistemden kaldırılabilir.
              </p>
            </div>
          )}

          {/* Bağımlı Kayıtların Kategorize Listesi */}
          {hasDependencies && (
            <div className="space-y-2.5">
              <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wide">
                Etkilenecek Bağlı Veri Detayları ({dependencies.total})
              </p>

              {/* 1. PORTFÖYLER (Yalnızca Müşteri Silinirken) */}
              {dependencies.properties.length > 0 && (
                <div className="border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => toggleSection("properties")}
                    className="w-full p-2.5 px-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left cursor-pointer transition border-b border-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-bold text-slate-800 text-xs">
                        Maliki Olduğu Portföyler ({dependencies.properties.length})
                      </span>
                    </div>
                    {expandedSection === "properties" ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {expandedSection === "properties" && (
                    <div className="p-3 space-y-1.5 max-h-40 overflow-y-auto bg-slate-50/40">
                      {dependencies.properties.map((p) => (
                        <div
                          key={p.id}
                          className="p-2 bg-white border border-slate-200 flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-slate-800 font-mono block">
                              {p.title}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {p.region} • {p.listingType === "rent" ? "Kiralık" : "Satılık"}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-[#1d2566]">
                            {formatCurrencyAmount(p.price, p.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. KİRA SÖZLEŞMELERİ & KİRA TAKİP */}
              {dependencies.rentals.length > 0 && (
                <div className="border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => toggleSection("rentals")}
                    className="w-full p-2.5 px-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left cursor-pointer transition border-b border-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-bold text-slate-800 text-xs">
                        Aktif Kira Sözleşmeleri & Kira Takip ({dependencies.rentals.length})
                      </span>
                    </div>
                    {expandedSection === "rentals" ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {expandedSection === "rentals" && (
                    <div className="p-3 space-y-1.5 max-h-40 overflow-y-auto bg-slate-50/40">
                      {dependencies.rentals.map((r) => (
                        <div
                          key={r.id}
                          className="p-2 bg-white border border-slate-200 flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-slate-800 font-mono block">
                              {r.propertyTitle}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Kiracı: {r.tenantName} | Ev Sahibi: {r.landlordName}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-emerald-700">
                            {formatCurrencyAmount(r.monthlyRent, r.currency)}/ay
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. YETKİ BELGELERİ */}
              {dependencies.mandates.length > 0 && (
                <div className="border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => toggleSection("mandates")}
                    className="w-full p-2.5 px-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left cursor-pointer transition border-b border-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-bold text-slate-800 text-xs">
                        Yetki Belgeleri & Sözleşmeler ({dependencies.mandates.length})
                      </span>
                    </div>
                    {expandedSection === "mandates" ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {expandedSection === "mandates" && (
                    <div className="p-3 space-y-1.5 max-h-40 overflow-y-auto bg-slate-50/40">
                      {dependencies.mandates.map((m) => (
                        <div
                          key={m.id}
                          className="p-2 bg-white border border-slate-200 flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-slate-800 font-mono block">
                              {m.propertyTitle || "Portföy Yetki Belgesi"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {m.mandateType === "exclusive" ? "Tek Yetkili" : "Genel Yetki"} • Bitiş: {m.endDate}
                            </span>
                          </div>
                          <span className="px-1.5 py-0.5 text-[9px] bg-slate-100 font-mono font-bold uppercase">
                            {m.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. SATIŞ / FIRSAT KAYITLARI (DEALS) */}
              {dependencies.deals.length > 0 && (
                <div className="border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => toggleSection("deals")}
                    className="w-full p-2.5 px-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left cursor-pointer transition border-b border-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                      <span className="font-bold text-slate-800 text-xs">
                        İşlem & Satış Süreçleri ({dependencies.deals.length})
                      </span>
                    </div>
                    {expandedSection === "deals" ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {expandedSection === "deals" && (
                    <div className="p-3 space-y-1.5 max-h-40 overflow-y-auto bg-slate-50/40">
                      {dependencies.deals.map((d) => (
                        <div
                          key={d.id}
                          className="p-2 bg-white border border-slate-200 flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-slate-800 font-mono block">
                              {d.title}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Aşama: {d.stage} • Müşteri: {d.customerName || "-"}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-purple-700">
                            {formatCurrencyAmount(d.agreedPrice, d.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. AÇIK RANDEVU VE TAKİPLER */}
              {dependencies.followUps.length > 0 && (
                <div className="border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => toggleSection("followUps")}
                    className="w-full p-2.5 px-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left cursor-pointer transition border-b border-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span className="font-bold text-slate-800 text-xs">
                        Açık Randevu & Takip Görevleri ({dependencies.followUps.length})
                      </span>
                    </div>
                    {expandedSection === "followUps" ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {expandedSection === "followUps" && (
                    <div className="p-3 space-y-1.5 max-h-40 overflow-y-auto bg-slate-50/40">
                      {dependencies.followUps.map((f) => (
                        <div
                          key={f.id}
                          className="p-2 bg-white border border-slate-200 flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-slate-800 font-mono block">
                              {f.title}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Vade: {f.dueAt?.split("T")[0]}
                            </span>
                          </div>
                          <span className="px-1.5 py-0.5 text-[9px] bg-amber-100 text-amber-800 font-mono font-bold uppercase">
                            Açık
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* İşlem Seçenekleri Açıklaması */}
              <div className="p-3 bg-slate-100/80 border border-slate-300/80 rounded-none space-y-1 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Info className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>Nasıl bir silme işlemi yapmak istersiniz?</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 pl-1 pt-1 text-[10.5px]">
                  <li>
                    <strong className="text-rose-700">Tüm Bağlı Verilerle Birlikte Sil (Önerilen):</strong> Ana kaydı
                    ve bağlı portföyleri siler; kira sözleşmelerini pasife alır; yetki belgeleri ve fırsatları
                    iptal ederek veri bütünlüğünü sağlar.
                  </li>
                  <li>
                    <strong className="text-slate-800">Yalnızca Bu Kaydı Sil:</strong> Yalnızca seçilen kaydı siler,
                    bağlı diğer tüm form ve portföyler sistemde muhatapsız / sahipsiz olarak kalır.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* STICKY FOOTER - Kural #1 Gereği sticky ve her zaman görünür */}
        <div className="shrink-0 sticky bottom-0 z-20 px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-mono font-bold cursor-pointer transition shadow-2xs"
          >
            Vazgeç
          </button>

          <div className="flex items-center gap-2">
            {hasDependencies ? (
              <>
                <button
                  type="button"
                  onClick={() => onConfirm(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-mono font-bold cursor-pointer transition"
                  title="Yalnızca seçilen kaydı siler, bağlı kayıtları sahipsiz bırakır"
                >
                  Yalnızca Bu Kaydı Sil
                </button>
                <button
                  type="button"
                  onClick={() => onConfirm(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                  title="Bağlı portföy, kira ve sözleşmelerle birlikte tam temizlik yapar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Tüm Bağlı Verilerle Birlikte Sil</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onConfirm(false)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Evet, Sil</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
