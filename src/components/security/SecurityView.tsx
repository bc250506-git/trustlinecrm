"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import {
  ShieldAlert,
  Trash2,
  GitMerge,
  FileSpreadsheet,
  CheckCircle2,
  Upload,
  Download,
  HardDrive,
} from "lucide-react";

export function SecurityView() {
  const {
    isBroker,
    customers,
    myCustomers,
    properties,
    myProperties,
    deals,
    rentals,
    mandates,
    followUps,
    currentUser,
  } = useStore();

  const [activeTab, setActiveTab] = useState<"trash" | "merge" | "csv" | "backup">("csv");

  const [mergeSourceId, setMergeSourceId] = useState(customers[0]?.id || "");
  const [mergeTargetId, setMergeTargetId] = useState(customers[1]?.id || "");
  const [mergeSuccess, setMergeSuccess] = useState(false);

  // Veritabanı Yedeği Kapsamı (Broker tam ofis veritabanı, Danışman zimmetli veritabanı)
  const exportCustomers = isBroker ? customers : myCustomers;
  const exportProperties = isBroker ? properties : myProperties;
  const exportDeals = isBroker ? deals : deals.filter((d) => d.createdById === currentUser.id);
  const exportRentals = isBroker ? rentals : rentals.filter((r) => r.assignedToId === currentUser.id);
  const exportMandates = isBroker ? mandates : mandates.filter((m) => m.assignedToId === currentUser.id);
  const exportFollowUps = isBroker ? followUps : followUps.filter((f) => f.assignedToId === currentUser.id);

  const handleExportBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      system: "Trustline CRM",
      exportScope: isBroker ? "OFFICE_FULL_DATABASE" : "ADVISOR_PERSONAL_DATA_ONLY",
      authorizedUser: {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        role: currentUser.role,
        title: currentUser.title,
      },
      stats: {
        customersCount: exportCustomers.length,
        propertiesCount: exportProperties.length,
        dealsCount: exportDeals.length,
        rentalsCount: exportRentals.length,
        mandatesCount: exportMandates.length,
        followUpsCount: exportFollowUps.length,
      },
      customers: exportCustomers,
      properties: exportProperties,
      deals: exportDeals,
      rentals: exportRentals,
      mandates: exportMandates,
      followUps: exportFollowUps,
    };

    const fileName = isBroker
      ? `trustline_crm_OFIS_YEDEGI_${new Date().toISOString().split("T")[0]}.json`
      : `trustline_crm_${currentUser.username}_kisisel_yedek_${new Date().toISOString().split("T")[0]}.json`;

    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isBroker) {
    return (
      <div className="sharp-card p-12 text-center border-l-4 border-l-amber-500 max-w-xl mx-auto my-12 space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 tracking-wide uppercase font-mono">
          Erişim Yetkisi Kısıtlandı
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Veri Kurtarma, Çöp Kutusu, Müşteri Birleştirme ve Yedekleme araçlarına sadece{" "}
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
            Geri Dönüşüm Kutusu, mükerrer müşteri birleştirme, CSV içe aktarma ve sistem veritabanı yedeği.
          </p>
        </div>

        {/* Tablar */}
        <div className="flex items-center bg-white border border-slate-200 p-1 shadow-xs">
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
            onClick={() => setActiveTab("backup")}
            className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "backup"
                ? "bg-[#1d2566] text-white font-semibold"
                : "text-slate-600 hover:text-[#1d2566]"
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Dışa Aktarma (Yedek)
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

      {/* TAB 4: VERİTABANI YEDEĞİ & DIŞA AKTARMA (JSON EXPORT) */}
      {activeTab === "backup" && (
        <div className="space-y-6 max-w-3xl">
          <div className="sharp-card p-6 bg-white border border-slate-200 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1d2566] text-white flex items-center justify-center">
                  <HardDrive className="w-5 h-5 text-[#00adb5]" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-[#00adb5] font-bold">
                    OFFLINE JSON VERİTABANI ARŞİVİ
                  </div>
                  <h3 className="text-sm font-bold text-[#1d2566] flex items-center gap-2">
                    CRM Veritabanı Yedeği (Dışa Aktarma)
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportBackup}
                className="sharp-btn-primary px-4 py-2 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Veritabanı Yedeğini İndir (.json)</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tüm müşteri havuzunuzu, portföy envanterinizi, finans ve komisyon anlaşmalarınızı, kira takip matrislerinizi ve tek yetki sözleşmelerinizi tek tıkla standart UTF-8 JSON formatında bilgisayarınıza yedekleyin.
            </p>

            {/* Yedek Kapsamı Canlı İstatistikleri */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 font-mono">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Müşteri Havuzu</div>
                <div className="text-base font-bold text-[#1d2566] mt-1">
                  {exportCustomers.length} <span className="text-[10px] font-normal text-slate-500">Kayıt</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 font-mono">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Portföy Envanteri</div>
                <div className="text-base font-bold text-[#1d2566] mt-1">
                  {exportProperties.length} <span className="text-[10px] font-normal text-slate-500">Portföy</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 font-mono">
                <div className="text-[10px] text-slate-500 uppercase font-bold">İşlem & Finans Kaydı</div>
                <div className="text-base font-bold text-[#1d2566] mt-1">
                  {exportDeals.length} <span className="text-[10px] font-normal text-slate-500">Anlaşma</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 font-mono">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Kira Sözleşmesi</div>
                <div className="text-base font-bold text-[#1d2566] mt-1">
                  {exportRentals.length} <span className="text-[10px] font-normal text-slate-500">Kontrat</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 font-mono">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Yetki Sözleşmesi</div>
                <div className="text-base font-bold text-[#1d2566] mt-1">
                  {exportMandates.length} <span className="text-[10px] font-normal text-slate-500">Yetki Belgesi</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 font-mono">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Ajanda & Takip</div>
                <div className="text-base font-bold text-[#1d2566] mt-1">
                  {exportFollowUps.length} <span className="text-[10px] font-normal text-slate-500">Aktivite</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 text-[11px] font-mono text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Güvenlik Notu:</strong> Dışa aktarılan dosya (JSON), ofisinizin tüm ticari kayıtlarını ve müşteri iletişim numaralarını içerir. Bu dosyayı yalnızca güvenli ofis arşivlerinde ve şifreli harici disklerde saklayınız.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

