"use client";

import React, { useState, useMemo, useRef } from "react";
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
  Archive,
  FileCode2,
  Calendar,
  User as UserIcon,
  Filter,
  RefreshCw,
  History,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
} from "lucide-react";
import {
  BackupModuleKey,
  PeriodFilter,
  generateBackupPayload,
  generateZipArchive,
  downloadBlob,
  downloadJsonFile,
  downloadExcelFile,
} from "@/lib/backup/backupEngine";
import {
  parseAndValidateBackup,
  BackupPreview,
  NormalizedBackupData,
} from "@/lib/backup/restoreEngine";

export function SecurityView() {
  const {
    isBroker,
    customers,
    properties,
    deals,
    rentals,
    mandates,
    followUps,
    currentUser,
    users,
    restoreBackup,
    snapshots,
    createManualSnapshot,
    restoreSnapshot,
    removeSnapshot,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    "export" | "restore" | "snapshots" | "csv" | "merge" | "trash"
  >("export");

  // =========================================================================
  // 1. GRANÜLER YEDEKLEME (EXPORT) STATE'LERİ
  // =========================================================================
  const [selectedScope, setSelectedScope] = useState<"all" | BackupModuleKey[]>("all");
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<"all" | string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isExporting, setIsExporting] = useState<"json" | "excel" | "zip" | null>(null);

  // Kapsam checkbox'ları kontrolü
  const toggleScopeKey = (key: BackupModuleKey) => {
    if (selectedScope === "all") {
      const allKeys: BackupModuleKey[] = [
        "customers",
        "properties",
        "deals",
        "rentals",
        "mandates",
        "followUps",
      ];
      setSelectedScope(allKeys.filter((k) => k !== key));
    } else {
      if (selectedScope.includes(key)) {
        const next = selectedScope.filter((k) => k !== key);
        setSelectedScope(next.length === 0 ? "all" : next);
      } else {
        const next = [...selectedScope, key];
        if (next.length === 6) setSelectedScope("all");
        else setSelectedScope(next);
      }
    }
  };

  const isScopeChecked = (key: BackupModuleKey) => {
    if (selectedScope === "all") return true;
    return selectedScope.includes(key);
  };

  // Dinamik filtrelenmiş verileri canlı hesapla (Sayaçlar için)
  const previewPayload = useMemo(() => {
    return generateBackupPayload(
      { customers, properties, deals, rentals, mandates, followUps },
      {
        scope: selectedScope,
        advisorId: selectedAdvisorId,
        period: selectedPeriod,
        customStartDate: customStartDate || undefined,
        customEndDate: customEndDate || undefined,
      },
      currentUser,
      users
    );
  }, [
    customers,
    properties,
    deals,
    rentals,
    mandates,
    followUps,
    selectedScope,
    selectedAdvisorId,
    selectedPeriod,
    customStartDate,
    customEndDate,
    currentUser,
    users,
  ]);

  const handleDownloadJSON = () => {
    setIsExporting("json");
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const advisorSlug =
        selectedAdvisorId === "all"
          ? "OFIS_TUMU"
          : users.find((u) => u.id === selectedAdvisorId)?.username || "danisman";
      const fileName = `trustline_crm_${advisorSlug}_yedek_${todayStr}.json`;

      downloadJsonFile(previewPayload, fileName);
    } finally {
      setIsExporting(null);
    }
  };

  const handleDownloadExcel = () => {
    setIsExporting("excel");
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const advisorSlug =
        selectedAdvisorId === "all"
          ? "OFIS_YONETICI_RAPORU"
          : users.find((u) => u.id === selectedAdvisorId)?.username || "danisman";
      const fileName = `trustline_crm_${advisorSlug}_${todayStr}.xlsx`;

      downloadExcelFile(previewPayload, fileName);
    } finally {
      setIsExporting(null);
    }
  };

  const handleDownloadZIP = async () => {
    setIsExporting("zip");
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const advisorSlug =
        selectedAdvisorId === "all"
          ? "TAM_ARSIV"
          : users.find((u) => u.id === selectedAdvisorId)?.username || "danisman";
      const fileNameBase = `trustline_crm_${advisorSlug}_${todayStr}`;

      const zipBlob = await generateZipArchive(previewPayload, fileNameBase);
      downloadBlob(zipBlob, `${fileNameBase}.zip`);
    } catch (err) {
      alert("ZIP paketi oluşturulurken bir hata oluştu.");
    } finally {
      setIsExporting(null);
    }
  };

  // =========================================================================
  // 2. YEDEKTEN GERİ YÜKLE (RESTORE) STATE'LERİ
  // =========================================================================
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<BackupPreview | null>(null);
  const [normalizedData, setNormalizedData] = useState<NormalizedBackupData | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<"merge" | "clean">("merge");
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError(null);
    setRestoreSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setRestoreError("Yalnızca .JSON uzantılı Trustline CRM sistem yedek dosyaları yüklenebilir.");
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = parseAndValidateBackup(text);
      if (result.valid && result.preview && result.data) {
        setRestorePreview(result.preview);
        setNormalizedData(result.data);
      } else {
        setRestoreError(result.error || "Dosya ayrıştırılamadı.");
        setRestorePreview(null);
        setNormalizedData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!normalizedData) return;

    const confirmText =
      restoreMode === "clean"
        ? "DİKKAT: 'Tam Geri Yükleme' mevcut kayıtları silerek sistemi yedeğin alındığı ana geri döndürür. Devam etmek istiyor musunuz?"
        : "Eksik veriler mevcut kayıtlarla birleştirilecektir. Devam etmek istiyor musunuz?";

    if (!window.confirm(confirmText)) return;

    setIsRestoring(true);
    setRestoreError(null);
    try {
      const res = await restoreBackup(normalizedData, restoreMode);
      setIsRestoring(false);
      if (res.success) {
        setRestoreSuccessMsg(res.message);
        setUploadedFile(null);
        setRestorePreview(null);
        setNormalizedData(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setRestoreError("Geri yükleme başarısız oldu.");
      }
    } catch (err: any) {
      setIsRestoring(false);
      setRestoreError(err?.message || "Geri yükleme sırasında bir hata oluştu.");
    }
  };

  // =========================================================================
  // 3. GÜVENLİK KASASI (SNAPSHOTS) STATE'LERİ
  // =========================================================================
  const [manualSnapName, setManualSnapName] = useState("");
  const [manualSnapDesc, setManualSnapDesc] = useState("");
  const [isCreatingSnap, setIsCreatingSnap] = useState(false);
  const [snapshotMsg, setSnapshotMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSnapName.trim()) return;

    createManualSnapshot(manualSnapName.trim(), manualSnapDesc.trim() || "Kullanıcı manuel kurtarma noktası");
    setManualSnapName("");
    setManualSnapDesc("");
    setIsCreatingSnap(false);
    setSnapshotMsg({ type: "success", text: "Yeni geri yükleme noktası başarıyla kasaya eklendi!" });
    setTimeout(() => setSnapshotMsg(null), 3000);
  };

  const handleRestoreFromSnapshot = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" adlı kurtarma noktasına geri dönmek istediğinizden emin misiniz?`)) {
      return;
    }
    const res = await restoreSnapshot(id);
    if (res.success) {
      setSnapshotMsg({ type: "success", text: `Sistem başarıyla "${name}" noktasına döndürüldü.` });
    } else {
      setSnapshotMsg({ type: "error", text: res.message });
    }
    setTimeout(() => setSnapshotMsg(null), 4000);
  };

  // =========================================================================
  // 4. MÜŞTERİ BİRLEŞTİRME STATE'LERİ
  // =========================================================================
  const [mergeSourceId, setMergeSourceId] = useState(customers[0]?.id || "");
  const [mergeTargetId, setMergeTargetId] = useState(customers[1]?.id || "");
  const [mergeSuccess, setMergeSuccess] = useState(false);

  const handleMerge = () => {
    if (mergeSourceId === mergeTargetId) {
      alert("Aynı müşteriyi kendisiyle birleştiremezsiniz!");
      return;
    }
    setMergeSuccess(true);
    setTimeout(() => setMergeSuccess(false), 4000);
  };

  if (!isBroker) {
    return (
      <div className="sharp-card p-12 text-center border-l-4 border-l-amber-500 max-w-xl mx-auto my-12 space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 tracking-wide uppercase font-mono">
          Erişim Yetkisi Kısıtlandı
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Veri Kurtarma, Geri Yükleme, Güvenlik Kasası ve Yedekleme araçlarına sadece{" "}
          <strong className="text-emerald-600">Broker / Yönetici</strong> yetkisiyle
          erişilebilir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Sekmeler */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#00adb5] font-semibold tracking-wider uppercase">
              VERİ KORUMA, YEDEKLEME & KURTARMA
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              Broker Denetim Masası
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1d2566] tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#00adb5]" />
            Veri Güvenliği ve Yedekleme Masası
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Granüler Excel/JSON/ZIP arşivleme, sıfır kayıplı sistem geri yükleme ve otomatik güvenlik kasası.
          </p>
        </div>

        {/* Ana Sekmeler */}
        <div className="flex flex-wrap items-center bg-white border border-slate-200 p-1 shadow-xs gap-0.5">
          <button
            onClick={() => setActiveTab("export")}
            className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "export"
                ? "bg-[#1d2566] text-white font-semibold shadow-2xs"
                : "text-slate-600 hover:text-[#1d2566]"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Granüler Yedek Al</span>
          </button>
          <button
            onClick={() => setActiveTab("restore")}
            className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "restore"
                ? "bg-[#1d2566] text-white font-semibold shadow-2xs"
                : "text-slate-600 hover:text-[#1d2566]"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Yedekten Geri Yükle</span>
          </button>
          <button
            onClick={() => setActiveTab("snapshots")}
            className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "snapshots"
                ? "bg-[#1d2566] text-white font-semibold shadow-2xs"
                : "text-slate-600 hover:text-[#1d2566]"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Güvenlik Kasası ({snapshots.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("csv")}
            className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "csv"
                ? "bg-[#1d2566] text-white font-semibold shadow-2xs"
                : "text-slate-600 hover:text-[#1d2566]"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV İçe Aktar</span>
          </button>
          <button
            onClick={() => setActiveTab("merge")}
            className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "merge"
                ? "bg-[#1d2566] text-white font-semibold shadow-2xs"
                : "text-slate-600 hover:text-[#1d2566]"
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>Birleştir</span>
          </button>
          <button
            onClick={() => setActiveTab("trash")}
            className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "trash"
                ? "bg-[#1d2566] text-white font-semibold shadow-2xs"
                : "text-slate-600 hover:text-[#1d2566]"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Çöp Kutusu</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEKME 1: GRANÜLER YEDEKLEME MASASI (EXPORT)                               */}
      {/* ========================================================================= */}
      {activeTab === "export" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Sol Kolon: Yapılandırma Masası */}
            <div className="lg:col-span-8 space-y-5">
              <div className="sharp-card p-6 bg-white border border-slate-200 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-[#1d2566] font-mono flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#00adb5]" />
                    <span>Yedekleme Parametreleri & Filtreleri</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                    Özelleştirilebilir Kapsam
                  </span>
                </div>

                {/* 1. Kapsam Seçimi */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider">
                      1. Ne Yedeklenecek? (Veri Modülleri)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedScope(selectedScope === "all" ? [] : "all")
                      }
                      className="text-[11px] font-mono text-[#00adb5] hover:underline cursor-pointer font-bold"
                    >
                      {selectedScope === "all" ? "Tümünü Temizle" : "Tüm Sistemi Seç"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { key: "customers" as BackupModuleKey, label: "Müşteri Havuzu", count: customers.length },
                      { key: "properties" as BackupModuleKey, label: "Portföy Envanteri", count: properties.length },
                      { key: "deals" as BackupModuleKey, label: "Kapanan İşlemler & Finans", count: deals.length },
                      { key: "rentals" as BackupModuleKey, label: "Kira Takip Matrisi", count: rentals.length },
                      { key: "mandates" as BackupModuleKey, label: "Tek Yetki Belgeleri", count: mandates.length },
                      { key: "followUps" as BackupModuleKey, label: "Ajanda & Takip Görevleri", count: followUps.length },
                    ].map((item) => {
                      const checked = isScopeChecked(item.key);
                      return (
                        <label
                          key={item.key}
                          onClick={() => toggleScopeKey(item.key)}
                          className={`p-2.5 border text-xs font-mono flex items-center justify-between cursor-pointer transition select-none ${
                            checked
                              ? "bg-slate-50 border-[#00adb5] text-[#1d2566] font-semibold shadow-2xs"
                              : "bg-white border-slate-200 text-slate-400 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              readOnly
                              className="accent-[#00adb5] w-3.5 h-3.5 pointer-events-none"
                            />
                            <span>{item.label}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">({item.count})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Danışman & Tarih Filtreleri */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  {/* Danışman Filtresi */}
                  <div>
                    <label className="block text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-1.5">
                      2. Danışman Filtresi
                    </label>
                    <div className="relative">
                      <select
                        value={selectedAdvisorId}
                        onChange={(e) => setSelectedAdvisorId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#00adb5] focus:outline-none transition cursor-pointer"
                      >
                        <option value="all">Tüm Ofis Verisi (Tüm Danışmanlar)</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            Yalnızca: {u.name} (@{u.username})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      Danışman ayrıldığında veya kendi portföy dökümünü talep ettiğinde kişisel yedek üretir.
                    </div>
                  </div>

                  {/* Dönem Filtresi */}
                  <div>
                    <label className="block text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-1.5">
                      3. Tarih / Dönem Filtresi
                    </label>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value as PeriodFilter)}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#00adb5] focus:outline-none transition cursor-pointer"
                    >
                      <option value="all">Tüm Zamanlar (Eksiksiz Tarihçe)</option>
                      <option value="2026">2026 Yılı Kayıtları</option>
                      <option value="2025">2025 Yılı Kayıtları</option>
                      <option value="this_month">Yalnızca Bu Ay</option>
                      <option value="custom">Özel Tarih Aralığı Seç...</option>
                    </select>

                    {selectedPeriod === "custom" && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="px-2 py-1 text-xs font-mono border border-slate-300 bg-white"
                        />
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="px-2 py-1 text-xs font-mono border border-slate-300 bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 3 İndirme Butonu */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-3">
                    4. Dışa Aktarma Formatını Seçin:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* JSON Buton */}
                    <button
                      type="button"
                      disabled={isExporting !== null}
                      onClick={handleDownloadJSON}
                      className="p-3 bg-white hover:bg-slate-50 border-2 border-indigo-200 hover:border-indigo-500 text-left transition cursor-pointer shadow-xs group"
                    >
                      <div className="flex items-center justify-between text-indigo-700 mb-1">
                        <FileCode2 className="w-5 h-5" />
                        <span className="text-[10px] font-mono font-bold uppercase bg-indigo-50 px-1.5 py-0.5">
                          .JSON
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-700">
                        Sistem Yedeği
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-1">
                        Sisteme geri yüklenebilir sıfır kayıplı format.
                      </div>
                    </button>

                    {/* EXCEL Buton */}
                    <button
                      type="button"
                      disabled={isExporting !== null}
                      onClick={handleDownloadExcel}
                      className="p-3 bg-white hover:bg-slate-50 border-2 border-emerald-200 hover:border-emerald-500 text-left transition cursor-pointer shadow-xs group"
                    >
                      <div className="flex items-center justify-between text-emerald-700 mb-1">
                        <FileSpreadsheet className="w-5 h-5" />
                        <span className="text-[10px] font-mono font-bold uppercase bg-emerald-50 px-1.5 py-0.5">
                          .XLSX
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">
                        Yönetici Excel'i
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-1">
                        6 sekmeli okunabilir tablo ve ofis çıktısı.
                      </div>
                    </button>

                    {/* ZIP Buton */}
                    <button
                      type="button"
                      disabled={isExporting !== null}
                      onClick={handleDownloadZIP}
                      className="p-3 bg-[#00adb5] hover:bg-[#00969d] text-white text-left transition cursor-pointer shadow-xs group border-2 border-[#00adb5]"
                    >
                      <div className="flex items-center justify-between text-white mb-1">
                        <Archive className="w-5 h-5" />
                        <span className="text-[10px] font-mono font-bold uppercase bg-black/20 px-1.5 py-0.5">
                          .ZIP
                        </span>
                      </div>
                      <div className="font-bold text-xs">
                        Tam Arşiv Paketi
                      </div>
                      <div className="text-[10px] font-mono text-teal-100 mt-1">
                        JSON + Excel bir arada tek paket.
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sağ Kolon: Canlı Filtre Sayacı & Önizleme Özeti */}
            <div className="lg:col-span-4 space-y-4">
              <div className="sharp-card p-5 bg-white border border-slate-200 space-y-4 shadow-xs">
                <div className="text-xs font-mono font-bold text-[#1d2566] uppercase pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span>Dışa Aktarılacak Hacim</span>
                  <span className="text-emerald-700 text-[10px]">● Dinamik Canlı</span>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Müşteri Havuzu:</span>
                    <span className="font-bold text-slate-900">{previewPayload.metadata.counts.customers} Kayıt</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Portföy Envanteri:</span>
                    <span className="font-bold text-slate-900">{previewPayload.metadata.counts.properties} İlan</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Kapanan İşlemler:</span>
                    <span className="font-bold text-slate-900">{previewPayload.metadata.counts.deals} Anlaşma</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Kira Sözleşmeleri:</span>
                    <span className="font-bold text-slate-900">{previewPayload.metadata.counts.rentals} Kontrat</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Yetki Belgeleri:</span>
                    <span className="font-bold text-slate-900">{previewPayload.metadata.counts.mandates} Sözleşme</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Ajanda & Görevler:</span>
                    <span className="font-bold text-slate-900">{previewPayload.metadata.counts.followUps} Takip</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800">Uygulanan Filtreler:</div>
                  <div className="text-[10px] text-slate-500">
                    • Danışman: <span className="font-semibold text-slate-700">{previewPayload.metadata.advisorFilter}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    • Dönem: <span className="font-semibold text-slate-700">{previewPayload.metadata.periodFilter}</span>
                  </div>
                </div>
              </div>

              {/* Bilgilendirme Notu */}
              <div className="p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-mono space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-indigo-800">
                  <Info className="w-3.5 h-3.5 text-indigo-600" />
                  Kusursuz Kurtarma Garantisi
                </div>
                <p className="text-[10px] text-indigo-700 leading-relaxed">
                  İndirilen .JSON dosyası ilişkisel kimlikler, kira ödeme durumları ve yetki süreleri dahil sıfır veri kaybıyla saklanır. Bilgisayar değişse bile tek tıkla geri yüklenebilir.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEKME 2: YEDEKTEN GERİ YÜKLE (RESTORE MASASI)                             */}
      {/* ========================================================================= */}
      {activeTab === "restore" && (
        <div className="space-y-6 max-w-4xl">
          {/* Başarı Bildirimi */}
          {restoreSuccessMsg && (
            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-900 font-mono text-xs flex items-start gap-3 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-emerald-900">Geri Yükleme Başarılı!</div>
                <div className="text-xs text-emerald-800 mt-1">{restoreSuccessMsg}</div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  Veriler hem yerel CRM hafızasına hem de PostgreSQL bulutuna işlendi.
                </div>
              </div>
            </div>
          )}

          {/* Hata Bildirimi */}
          {restoreError && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-900 font-mono text-xs flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-red-900">Dosya İnceleme / Yükleme Hatası</div>
                <div className="text-xs text-red-800 mt-1">{restoreError}</div>
              </div>
            </div>
          )}

          <div className="sharp-card p-6 bg-white border border-slate-200 space-y-5">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1d2566] font-mono flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#00adb5]" />
                  <span>Sistem Yedek Dosyasını (.JSON) Seçin</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daha önce indirilmiş bir Trustline CRM yedek dosyasını yükleyerek sistemi anında ayağa kaldırın.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                Otomatik Önizleme Aktif
              </span>
            </div>

            {/* Dosya Yükleme Alanı */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-[#00adb5] p-8 text-center transition cursor-pointer bg-slate-50/60 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileCode2 className="w-10 h-10 text-slate-400 group-hover:text-[#00adb5] mx-auto mb-2 transition" />
              <div className="text-xs font-bold text-slate-800 font-mono">
                {uploadedFile
                  ? `Seçilen Dosya: ${uploadedFile.name}`
                  : "JSON Yedek Dosyasını Buraya Sürükleyin veya Tıklayarak Seçin"}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                trustline_crm_OFIS_YEDEGI_....json veya kişisel yedek dosyaları
              </div>
            </div>

            {/* Önizleme Kartı (Inspection Preview) */}
            {restorePreview && (
              <div className="space-y-4 pt-2 border-t border-slate-200 animate-in fade-in duration-200">
                <div className="p-4 bg-slate-50 border border-slate-200 text-xs font-mono">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                    <div className="font-bold text-[#1d2566] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Yedek Dosyası Doğrulandı</span>
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 font-bold">
                      Format: v{restorePreview.version}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] mb-3">
                    <div>
                      <span className="text-slate-500">Yedek Alma Tarihi:</span>{" "}
                      <strong className="text-slate-800">
                        {new Date(restorePreview.exportedAt).toLocaleString("tr-TR")}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Yedekleyen Yetkili:</span>{" "}
                      <strong className="text-slate-800">{restorePreview.exportedBy}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Yedek Kapsamı:</span>{" "}
                      <strong className="text-slate-800">{restorePreview.scopeSummary}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Toplam Kayıt:</span>{" "}
                      <strong className="text-emerald-700 font-bold">{restorePreview.totalRecords} Kayıt</strong>
                    </div>
                  </div>

                  {/* Kayıt Sayıları Izgarası */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center pt-2 border-t border-slate-200">
                    <div className="p-2 bg-white border border-slate-200">
                      <div className="font-bold text-sm text-[#1d2566]">
                        {restorePreview.counts.customers}
                      </div>
                      <div className="text-[10px] text-slate-500">Müşteri</div>
                    </div>
                    <div className="p-2 bg-white border border-slate-200">
                      <div className="font-bold text-sm text-[#1d2566]">
                        {restorePreview.counts.properties}
                      </div>
                      <div className="text-[10px] text-slate-500">Portföy</div>
                    </div>
                    <div className="p-2 bg-white border border-slate-200">
                      <div className="font-bold text-sm text-[#1d2566]">
                        {restorePreview.counts.deals}
                      </div>
                      <div className="text-[10px] text-slate-500">Finans/İşlem</div>
                    </div>
                    <div className="p-2 bg-white border border-slate-200">
                      <div className="font-bold text-sm text-[#1d2566]">
                        {restorePreview.counts.rentals}
                      </div>
                      <div className="text-[10px] text-slate-500">Kira</div>
                    </div>
                    <div className="p-2 bg-white border border-slate-200">
                      <div className="font-bold text-sm text-[#1d2566]">
                        {restorePreview.counts.mandates}
                      </div>
                      <div className="text-[10px] text-slate-500">Yetki</div>
                    </div>
                    <div className="p-2 bg-white border border-slate-200">
                      <div className="font-bold text-sm text-[#1d2566]">
                        {restorePreview.counts.followUps}
                      </div>
                      <div className="text-[10px] text-slate-500">Ajanda</div>
                    </div>
                  </div>
                </div>

                {/* 2 Geri Yükleme Seçeneği */}
                <div className="space-y-3">
                  <div className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider">
                    Geri Yükleme Yöntemini Seçin:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      onClick={() => setRestoreMode("merge")}
                      className={`p-3.5 border-2 text-xs font-mono cursor-pointer transition select-none flex items-start gap-3 ${
                        restoreMode === "merge"
                          ? "bg-slate-50 border-[#00adb5] text-[#1d2566] shadow-xs"
                          : "bg-white border-slate-200 text-slate-500"
                      }`}
                    >
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === "merge"}
                        onChange={() => setRestoreMode("merge")}
                        className="accent-[#00adb5] mt-1"
                      />
                      <div>
                        <div className="font-bold text-slate-900">
                          Eksikleri Tamamla (Merge / Güvenli Ekleme)
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Mevcut kayıtları silmez. Yedekte olup sistemde olmayan kayıtları ekler, eşleşenleri günceller.
                        </div>
                      </div>
                    </label>

                    <label
                      onClick={() => setRestoreMode("clean")}
                      className={`p-3.5 border-2 text-xs font-mono cursor-pointer transition select-none flex items-start gap-3 ${
                        restoreMode === "clean"
                          ? "bg-amber-50/50 border-amber-500 text-amber-900 shadow-xs"
                          : "bg-white border-slate-200 text-slate-500"
                      }`}
                    >
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === "clean"}
                        onChange={() => setRestoreMode("clean")}
                        className="accent-amber-600 mt-1"
                      />
                      <div>
                        <div className="font-bold text-amber-950">
                          Tam Geri Yükleme (Clean Restore)
                        </div>
                        <div className="text-[11px] text-amber-800 mt-0.5">
                          Sistemi tamamen bu yedeğin alındığı ana döndürür. Yedeğin tarihinden sonra eklenenler kaldırılır.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Kurtarma Noktası Güvencesi */}
                <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] font-mono flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    İşlem başlamadan önce sistemin şu anki hali <strong>Güvenlik Kasası</strong>na otomatik kaydedilecektir. Dilediğinizde tek tıkla geri alabilirsiniz.
                  </span>
                </div>

                {/* Geri Yükleme Butonu */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isRestoring}
                    onClick={handleExecuteRestore}
                    className="w-full py-3 bg-[#00adb5] hover:bg-[#00969d] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sistem ve Veritabanı Geri Yükleniyor...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        <span>
                          {restoreMode === "merge"
                            ? "Eksik Verileri Sisteme Güvenle Geri Yükle"
                            : "Sistemi Bu Yedek Noktasına Tam Olarak Döndür"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEKME 3: GÜVENLİK KASASI (SNAPSHOTS / RESTORE POINTS)                     */}
      {/* ========================================================================= */}
      {activeTab === "snapshots" && (
        <div className="space-y-6 max-w-4xl">
          {snapshotMsg && (
            <div
              className={`p-3 border-l-4 text-xs font-mono flex items-center gap-2.5 ${
                snapshotMsg.type === "success"
                  ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                  : "bg-red-50 border-red-500 text-red-800"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{snapshotMsg.text}</span>
            </div>
          )}

          <div className="sharp-card p-6 bg-white border border-slate-200 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-[#1d2566] font-mono flex items-center gap-2">
                  <History className="w-4 h-4 text-[#00adb5]" />
                  <span>Tarayıcı İçi Güvenlik Kasası (Kurtarma Noktaları)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Her gün veya geri yükleme öncesi otomatik alınan sistem anlık görüntüleri (Restore Points).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreatingSnap(!isCreatingSnap)}
                className="sharp-btn-primary px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Manuel Kurtarma Noktası Oluştur</span>
              </button>
            </div>

            {/* Manuel Snapshot Ekleme Formu */}
            {isCreatingSnap && (
              <form onSubmit={handleCreateSnapshot} className="p-4 bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
                <div className="font-bold text-[#1d2566] uppercase text-[11px]">
                  Yeni Kurtarma Noktası Kaydet
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={manualSnapName}
                    onChange={(e) => setManualSnapName(e.target.value)}
                    placeholder="Kurtarma Noktası Adı (Örn: Hafta Sonu Öncesi)"
                    className="p-2 border border-slate-300 bg-white text-xs font-mono w-full"
                    autoFocus
                    required
                  />
                  <input
                    type="text"
                    value={manualSnapDesc}
                    onChange={(e) => setManualSnapDesc(e.target.value)}
                    placeholder="Açıklama / Not (Opsiyonel)"
                    className="p-2 border border-slate-300 bg-white text-xs font-mono w-full"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingSnap(false)}
                    className="px-3 py-1 text-slate-600 bg-slate-200 hover:bg-slate-300 cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 bg-[#00adb5] hover:bg-[#00969d] text-white font-bold cursor-pointer"
                  >
                    Noktayı Kaydet
                  </button>
                </div>
              </form>
            )}

            {/* Snapshot Listesi */}
            {snapshots.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-mono">
                Henüz kayıtlı bir kurtarma noktası bulunmuyor.
              </div>
            ) : (
              <div className="space-y-3">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-4 bg-white border border-slate-200 hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{snap.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 font-bold uppercase ${
                            snap.type === "auto_pre_restore"
                              ? "bg-amber-100 text-amber-800"
                              : snap.type === "auto_daily"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {snap.type === "auto_pre_restore"
                            ? "Geri Yükleme Öncesi"
                            : snap.type === "auto_daily"
                            ? "Günlük Otomatik"
                            : "Manuel"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {snap.description} • {new Date(snap.createdAt).toLocaleString("tr-TR")}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
                        <span>{snap.counts.customers} Müşteri</span>
                        <span>•</span>
                        <span>{snap.counts.properties} Portföy</span>
                        <span>•</span>
                        <span>{snap.counts.deals} İşlem</span>
                        <span>•</span>
                        <span>{snap.counts.rentals} Kira</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRestoreFromSnapshot(snap.id, snap.name)}
                        className="px-3 py-1.5 bg-[#1d2566] hover:bg-[#151a47] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Bu Noktaya Dön</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSnapshot(snap.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                        title="Noktayı Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEKME 4: CSV İÇE AKTARMA                                                  */}
      {/* ========================================================================= */}
      {activeTab === "csv" && (
        <div className="sharp-card p-6 space-y-4 max-w-2xl bg-white border border-slate-200">
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

      {/* ========================================================================= */}
      {/* SEKME 5: MÜŞTERİ BİRLEŞTİRME                                              */}
      {/* ========================================================================= */}
      {activeTab === "merge" && (
        <div className="sharp-card p-6 space-y-4 max-w-2xl bg-white border border-slate-200">
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

      {/* ========================================================================= */}
      {/* SEKME 6: ÇÖP KUTUSU                                                       */}
      {/* ========================================================================= */}
      {activeTab === "trash" && (
        <div className="sharp-card p-6 space-y-4 bg-white border border-slate-200">
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
    </div>
  );
}
