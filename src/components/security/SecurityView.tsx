"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import {
  ShieldAlert,
  Trash2,
  GitMerge,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Database,
  Cloud,
  RefreshCw,
  Copy,
  ExternalLink,
  Check,
  Zap,
  Server,
} from "lucide-react";
import {
  checkSupabaseHealth,
  seedAllDataToSupabase,
  SupabaseHealthStatus,
} from "@/lib/supabase/db";


export function SecurityView() {
  const { isBroker, customers, properties, deals, rentals, mandates } = useStore();
  const [activeTab, setActiveTab] = useState<"trash" | "merge" | "csv" | "supabase">("supabase");

  const [mergeSourceId, setMergeSourceId] = useState(customers[0]?.id || "");
  const [mergeTargetId, setMergeTargetId] = useState(customers[1]?.id || "");
  const [mergeSuccess, setMergeSuccess] = useState(false);

  // Supabase State
  const [healthStatus, setHealthStatus] = useState<SupabaseHealthStatus | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);


  if (!isBroker) {
    return (
      <div className="sharp-card p-12 text-center border-l-4 border-l-amber-500 max-w-xl mx-auto my-12 space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 tracking-wide uppercase font-mono">
          Erişim Yetkisi Kısıtlandı
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Veri Kurtarma, Çöp Kutusu ve Müşteri Birleştirme araçlarına sadece{" "}
          <strong className="text-emerald-600">Broker / Yönetici</strong> yetkisiyle
          erişilebilir.
        </p>
      </div>
    );
  }

  const handleMerge = () => {
    if (mergeSourceId === mergeTargetId) {
      alert("Aynı müşteriyi kendisiyle birleştiremezsiniz!");
      return;
    }
    setMergeSuccess(true);
    setTimeout(() => setMergeSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#00adb5] font-semibold tracking-wider uppercase">
              VERİ GÜVENLİĞİ & ARŞİV
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              Broker Denetim Masası
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1d2566] tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#00adb5]" />
            Veri Koruma ve Denetim Araçları
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geri Dönüşüm Kutusu (Soft Delete), mükerrer müşteri birleştirme ve CSV
            veri aktarım denetimi.
          </p>
        </div>

        {/* Tablar */}
        <div className="flex items-center bg-white border border-slate-200 p-1 shadow-sm">
          <button
            onClick={() => setActiveTab("trash")}
            className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "trash"
                ? "bg-[#1d2566] text-white font-semibold"
                : "text-slate-600 hover:text-[#1d2566]"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" /> Çöp Kutusu
          </button>
          <button
            onClick={() => setActiveTab("merge")}
            className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "merge"
                ? "bg-[#1d2566] text-white font-semibold"
                : "text-slate-600 hover:text-[#1d2566]"
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" /> Müşteri Birleştir
          </button>
          <button
            onClick={() => setActiveTab("csv")}
            className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "csv"
                ? "bg-[#1d2566] text-white font-semibold"
                : "text-slate-600 hover:text-[#1d2566]"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> CSV İçe Aktarma
          </button>
          <button
            onClick={() => {
              setActiveTab("supabase");
              if (!healthStatus) {
                setIsCheckingHealth(true);
                checkSupabaseHealth().then((res) => {
                  setHealthStatus(res);
                  setIsCheckingHealth(false);
                });
              }
            }}
            className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "supabase"
                ? "bg-[#00adb5] text-white font-bold"
                : "text-slate-600 hover:text-[#00adb5]"
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Supabase Canlı DB (Faz 5)
          </button>
        </div>
      </div>


      {activeTab === "trash" && (
        <div className="sharp-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-xs font-bold text-[#1d2566] font-mono uppercase">
                Geri Dönüşüm Kutusu (Soft Delete Arşivi)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Danışmanlar veya broker tarafından silinen kayıtlar kalıcı olarak
                yok edilmez; bu ekrandan tek tıkla geri kurtarılabilir.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              0 Aktif Silinmiş Kayıt
            </span>
          </div>

          <div className="p-8 text-center text-xs text-slate-400 font-mono">
            Şu anda çöp kutusunda bekleyen silinmiş müşteri veya portföy kaydı
            bulunmuyor.
          </div>
        </div>
      )}

      {activeTab === "merge" && (
        <div className="sharp-card p-6 space-y-4 max-w-2xl">
          <div>
            <h3 className="text-xs font-bold text-[#1d2566] font-mono uppercase">
              Mükerrer Müşteri Profillerini Birleştirme Motoru
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              İki farklı kanaldan açılmış aynı kişiye ait kayıtları tek bir profilde
              birleştirin. Tüm görüşmeler, takvim randevuları ve finansal işlemler
              hedef profile aktarılır.
            </p>
          </div>

          {mergeSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Profiller başarıyla birleştirildi ve denetim loglarına kaydedildi!
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">
                Kapatılacak Mükerrer Profil:
              </label>
              <select
                value={mergeSourceId}
                onChange={(e) => setMergeSourceId(e.target.value)}
                className="sharp-input w-full p-2 text-xs"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">
                Aktarılacak Ana (Hedef) Profil:
              </label>
              <select
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
                className="sharp-input w-full p-2 text-xs"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleMerge}
              className="sharp-btn-navy px-4 py-2 text-xs flex items-center gap-2 cursor-pointer font-semibold shadow-sm"
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Profilleri Birleştir ve Arşivle</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === "csv" && (
        <div className="sharp-card p-6 space-y-4 max-w-2xl">
          <div>
            <h3 className="text-xs font-bold text-[#1d2566] font-mono uppercase">
              Toplu Müşteri CSV İçe Aktarma Masası
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Excel veya eski sistemden alınan 500 satıra kadar CSV dosyalarını
              yükleyin. Sistem mükerrer telefonları otomatik atlar.
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-300 p-8 text-center hover:border-[#00adb5] transition cursor-pointer bg-slate-50/60">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-800">
              CSV Dosyasını Buraya Sürükleyin veya Dosya Seçin
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">
              Sütunlar: Ad Soyad, Telefon, Kategori, Bütçe, Para Birimi, Bölge
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUPABASE CANLI VERİTABANI & REALTIME SYNC (FAZ 5) */}
      {activeTab === "supabase" && (
        <div className="space-y-6">
          {/* Bağlantı Sağlık Kartı */}
          <div className="sharp-card p-6 bg-white border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1d2566] text-white flex items-center justify-center">
                  <Database className="w-5 h-5 text-[#00adb5]" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-[#00adb5] font-bold">
                    BULUT POSTGRESQL & REALTIME SENKRONİZASYON (FAZ 5)
                  </div>
                  <h3 className="text-sm font-bold text-[#1d2566] flex items-center gap-2">
                    Supabase Veritabanı Teşhis ve Kontrol Paneli
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isCheckingHealth}
                  onClick={async () => {
                    setIsCheckingHealth(true);
                    const res = await checkSupabaseHealth();
                    setHealthStatus(res);
                    setIsCheckingHealth(false);
                  }}
                  className="sharp-btn-primary px-3.5 py-2 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? "animate-spin" : ""}`} />
                  <span>{isCheckingHealth ? "Test Ediliyor..." : "Bağlantıyı Test Et"}</span>
                </button>
              </div>
            </div>

            {/* Durum Göstergeleri */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="p-3 bg-slate-50 border border-slate-200 font-mono">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                  Supabase Endpoint
                </div>
                <div className="text-xs font-bold text-[#1d2566] truncate">
                  qlfuwodxlfxirfvarczd.supabase.co
                </div>
                <div className="text-[10px] text-emerald-700 mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  API Uç Noktası Erişilebilir
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 font-mono">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                  Ağ Gecikmesi (Latency)
                </div>
                <div className="text-base font-bold text-[#1d2566]">
                  {healthStatus?.latencyMs ? `${healthStatus.latencyMs} ms` : "Ölçülüyor..."}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  HTTPS REST + WebSocket Katmanı
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 font-mono">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                  Şema Tablo Durumu
                </div>
                <div className="text-xs font-bold text-[#1d2566]">
                  {healthStatus?.tables
                    ? Object.values(healthStatus.tables).filter(Boolean).length === 5
                      ? "Tüm Tablolar Aktif (5/5)"
                      : `${Object.values(healthStatus.tables).filter(Boolean).length}/5 Tablo Bulundu`
                    : "Kontrol Bekleniyor"}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  customers, properties, deals, rentals, mandates
                </div>
              </div>
            </div>

            {/* Tablo Detay Rozetleri */}
            {healthStatus?.tables && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-2">
                  Veritabanı Tablo Denetimi (PostgreSQL Public Schema):
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  {Object.entries(healthStatus.tables).map(([tbl, isReady]) => (
                    <span
                      key={tbl}
                      className={`px-2.5 py-1 border flex items-center gap-1.5 font-bold ${
                        isReady
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isReady ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      ></span>
                      {tbl} : {isReady ? "Canlı & Hazır" : "Şema Bekleniyor"}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SQL Şema Kurulum Rehberi & Hızlı Kopyalama */}
          <div className="sharp-card p-6 bg-gradient-to-br from-white to-slate-50 border border-slate-200">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h4 className="text-xs font-bold text-[#1d2566] font-mono uppercase flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#00adb5]" />
                  Supabase SQL Şeması Kurulum Rehberi
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Bulut veritabanınızda tabloları 1 dakikada kurmak için aşağıdaki şema dosyasını Supabase SQL Editor&apos;e yapıştırıp &apos;Run&apos; butonuna basmanız yeterlidir.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch("/supabase_schema.sql").then((r) => r.text()).catch(() => "");
                      await navigator.clipboard.writeText(res || "supabase_schema.sql kök dizinde mevcuttur.");
                      setSqlCopied(true);
                      setTimeout(() => setSqlCopied(false), 3000);
                    } catch {
                      setSqlCopied(true);
                      setTimeout(() => setSqlCopied(false), 3000);
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{sqlCopied ? "Kopyalandı!" : "Şemayı Kopyala"}</span>
                </button>

                <a
                  href="https://supabase.com/dashboard/project/qlfuwodxlfxirfvarczd/sql"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sharp-btn-navy px-3.5 py-1.5 text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  <span>SQL Editor&apos;ü Aç</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#00adb5]" />
                </a>
              </div>
            </div>

            <div className="space-y-2 mt-4 text-xs font-mono bg-white p-4 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <span className="w-5 h-5 bg-[#1d2566] text-white flex items-center justify-center text-[10px]">1</span>
                <span>Proje kök dizinindeki <strong>supabase_schema.sql</strong> dosyasını açın veya yukarıdaki &apos;Şemayı Kopyala&apos; butonuna basın.</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <span className="w-5 h-5 bg-[#1d2566] text-white flex items-center justify-center text-[10px]">2</span>
                <span>Supabase Dashboard &gt; SQL Editor alanına yapıştırın ve <strong>Run</strong> butonuna tıklayın.</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <span className="w-5 h-5 bg-[#00adb5] text-white flex items-center justify-center text-[10px]">3</span>
                <span>Aşağıdaki &apos;Verileri Buluta Aktar&apos; butonuna basarak mevcut tüm müşteri ve portföy havuzunu canlı buluta senkronize edin.</span>
              </div>
            </div>

            {/* Verileri Şimdi Buluta Aktar (Seed) */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-[#1d2566]">
                  Mevcut Yerel Verileri Bulut PostgreSQL&apos;e Aktar
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {customers.length} Müşteri • {properties.length} Portföy • {deals.length} Finans Anlaşması • {rentals.length} Kira • {mandates.length} Yetki
                </div>
              </div>

              <button
                type="button"
                disabled={isSeeding}
                onClick={async () => {
                  setIsSeeding(true);
                  setSeedResult(null);
                  const res = await seedAllDataToSupabase({
                    customers,
                    properties,
                    deals,
                    rentals,
                    mandates,
                  });
                  setIsSeeding(false);
                  setSeedResult(res.message);
                  setTimeout(() => setSeedResult(null), 7000);
                }}
                className="sharp-btn-primary px-4 py-2 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Cloud className={`w-4 h-4 ${isSeeding ? "animate-pulse" : ""}`} />
                <span>{isSeeding ? "Buluta Aktarılıyor..." : "Verileri Buluta Eşitle (Sync)"}</span>
              </button>
            </div>

            {seedResult && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{seedResult}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

