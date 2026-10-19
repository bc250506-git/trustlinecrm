"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import {
  generateBackupPayload,
  generateZipArchive,
  downloadBlob,
} from "@/lib/backup/backupEngine";
import {
  AlertTriangle,
  Download,
  Archive,
  ShieldCheck,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  FileCode2,
} from "lucide-react";

const BACKUP_STORAGE_KEY = "trustline_last_backup_timestamp";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function WeeklyBackupModal() {
  const {
    isBroker,
    currentUser,
    users,
    customers,
    allCustomers,
    properties,
    allProperties,
    deals,
    rentals,
    mandates,
    followUps,
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [daysSinceLastBackup, setDaysSinceLastBackup] = useState<number>(0);

  useEffect(() => {
    // Yalnızca Broker veya yetkili oturumda kontrol et
    if (!isBroker) return;

    try {
      const stored = localStorage.getItem(BACKUP_STORAGE_KEY);
      const now = Date.now();

      if (!stored) {
        // Hiç yedek alınmamış -> göster
        setDaysSinceLastBackup(7);
        setIsOpen(true);
      } else {
        const lastTime = parseInt(stored, 10);
        if (isNaN(lastTime)) {
          setIsOpen(true);
          return;
        }

        const diff = now - lastTime;
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        setDaysSinceLastBackup(days);

        // 7 günden fazla geçtiyse veya bugün Pazartesi ise
        const isMonday = new Date().getDay() === 1;
        if (diff >= SEVEN_DAYS_MS || (isMonday && diff >= ONE_DAY_MS)) {
          setIsOpen(true);
        }
      }
    } catch {}
  }, [isBroker]);

  const handleDownloadWeeklyZip = async () => {
    setIsDownloading(true);
    try {
      const payload = generateBackupPayload(
        {
          customers: allCustomers && allCustomers.length > 0 ? allCustomers : (customers || []),
          properties: allProperties && allProperties.length > 0 ? allProperties : (properties || []),
          deals: deals || [],
          rentals: rentals || [],
          mandates: mandates || [],
          followUps: followUps || [],
        },
        { scope: "all", advisorId: "all", period: "all" },
        currentUser,
        users || []
      );

      const todayStr = new Date().toISOString().split("T")[0];
      const fileNameBase = `trustline_crm_HAFTALIK_ARSIV_${todayStr}`;

      const zipBlob = await generateZipArchive(payload, fileNameBase);
      downloadBlob(zipBlob, `${fileNameBase}.zip`);

      // 7 günlük sayacı sıfırla
      localStorage.setItem(BACKUP_STORAGE_KEY, Date.now().toString());

      setDownloadSuccess(true);
      setTimeout(() => {
        setIsDownloading(false);
        setIsOpen(false);
        setDownloadSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error("Haftalık yedek indirme hatası:", err);
      setIsDownloading(false);
      alert(`Yedek paketi oluşturulurken bir hata oluştu: ${err?.message || "Bilinmeyen hata"}`);
    }
  };

  const handleSnooze = () => {
    // 24 saat ertele (son yedeği 6 gün önce gibi kaydet)
    const snoozeTime = Date.now() - 6 * ONE_DAY_MS;
    try {
      localStorage.setItem(BACKUP_STORAGE_KEY, snoozeTime.toString());
    } catch {}
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border-2 border-amber-500 shadow-2xl p-6 sm:p-7 space-y-5">
        {/* Üst Uyarı Başlığı */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold uppercase text-amber-700 tracking-wider flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>Haftalık Güvenlik Protokolü</span>
            </div>
            <h2 className="text-base font-bold text-[#1d2566] tracking-tight mt-0.5">
              Haftalık Sistem & Veritabanı Yedeği Zamanı!
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Son yedeklemenizden bu yana{" "}
              <strong className="text-amber-800">
                {daysSinceLastBackup >= 7 ? "7+ gün" : `${daysSinceLastBackup} gün`}
              </strong>{" "}
              geçti. Veri kaybını önlemek ve ofis arşivinizi güncel tutmak için
              haftalık ZIP arşivinizi indirmeniz önerilir.
            </p>
          </div>
        </div>

        {/* Canlı Sistem İstatistikleri Kartı */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 text-xs font-mono">
          <div className="text-[10px] text-slate-500 uppercase font-bold mb-2 flex items-center justify-between">
            <span>Paketlenecek Güncel Veritabanı Hacmi:</span>
            <span className="text-emerald-700 font-bold">● Tam Kapsam</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-white border border-slate-200">
              <div className="text-base font-bold text-[#1d2566]">{customers.length}</div>
              <div className="text-[10px] text-slate-500">Müşteri</div>
            </div>
            <div className="p-2 bg-white border border-slate-200">
              <div className="text-base font-bold text-[#1d2566]">{properties.length}</div>
              <div className="text-[10px] text-slate-500">Portföy</div>
            </div>
            <div className="p-2 bg-white border border-slate-200">
              <div className="text-base font-bold text-[#1d2566]">{deals.length}</div>
              <div className="text-[10px] text-slate-500">Finans/İşlem</div>
            </div>
            <div className="p-2 bg-white border border-slate-200">
              <div className="text-base font-bold text-[#1d2566]">{rentals.length}</div>
              <div className="text-[10px] text-slate-500">Kira Kontratı</div>
            </div>
            <div className="p-2 bg-white border border-slate-200">
              <div className="text-base font-bold text-[#1d2566]">{mandates.length}</div>
              <div className="text-[10px] text-slate-500">Yetki Belgesi</div>
            </div>
            <div className="p-2 bg-white border border-slate-200">
              <div className="text-base font-bold text-[#1d2566]">{followUps.length}</div>
              <div className="text-[10px] text-slate-500">Ajanda Takip</div>
            </div>
          </div>
        </div>

        {/* Paket İçeriği Özeti */}
        <div className="p-3 bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs font-mono space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-emerald-900">
            <Archive className="w-4 h-4 text-emerald-700" />
            İndirilecek .ZIP Paketinin İçeriği:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="flex items-center gap-1.5 text-slate-700">
              <FileCode2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sistem Yedeği (.JSON)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>6 Sekmeli Yönetici Excel (.XLSX)</span>
            </div>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownloadWeeklyZip}
            className="w-full py-3 bg-[#00adb5] hover:bg-[#00969d] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-md disabled:opacity-50"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Arşiv İndirildi! Sayaç Sıfırlandı</span>
              </>
            ) : isDownloading ? (
              <span>ZIP Paketi Hazırlanıyor...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Haftalık Yedeği İndir (.ZIP Arşivi)</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isDownloading}
            onClick={handleSnooze}
            className="w-full py-2 bg-transparent hover:bg-slate-100 text-slate-600 font-mono text-xs flex items-center justify-center gap-1 transition cursor-pointer"
          >
            <span>Risk Alarak Bu Seferlik Atla (Yarın Hatırlat)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
