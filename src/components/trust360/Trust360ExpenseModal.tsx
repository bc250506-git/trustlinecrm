"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import {
  Trust360Contract,
  Trust360Expense,
  Trust360ExpenseCategory,
  Trust360PaidBy,
  Currency,
} from "@/lib/types";
import {
  X,
  Plus,
  Trash2,
  FileText,
  UploadCloud,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Wrench,
  Droplets,
  Zap,
  Landmark,
  Sparkles,
  Key,
  FolderOpen,
  DollarSign,
  Eye,
} from "lucide-react";

interface Trust360ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Trust360Contract;
}

const CATEGORY_MAP: Record<
  Trust360ExpenseCategory,
  { label: string; icon: React.ElementType; color: string }
> = {
  maintenance: {
    label: "Arıza, Tamirat & Usta",
    icon: Wrench,
    color: "text-amber-700 bg-amber-50 border-amber-200",
  },
  pool_garden: {
    label: "Havuz & Bahçe Bakımı",
    icon: Droplets,
    color: "text-cyan-700 bg-cyan-50 border-cyan-200",
  },
  utility: {
    label: "Elektrik, Su & Abonelikler",
    icon: Zap,
    color: "text-yellow-700 bg-yellow-50 border-yellow-200",
  },
  tax_duty: {
    label: "Vergi & Resmi Harçlar",
    icon: Landmark,
    color: "text-indigo-700 bg-indigo-50 border-indigo-200",
  },
  cleaning_paint: {
    label: "Temizlik & Boya / Badana",
    icon: Sparkles,
    color: "text-purple-700 bg-purple-50 border-purple-200",
  },
  lock_fixture: {
    label: "Çilingir, Kilit & Demirbaş",
    icon: Key,
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  official_paper: {
    label: "Resmi Evrak & Bildirim",
    icon: FileText,
    color: "text-blue-700 bg-blue-50 border-blue-200",
  },
  other: {
    label: "Diğer İşlem & Masraflar",
    icon: FolderOpen,
    color: "text-slate-700 bg-slate-50 border-slate-200",
  },
};

const PAID_BY_MAP: Record<Trust360PaidBy, { label: string; badgeClass: string }> = {
  owner: {
    label: "Mülk Sahibi Karşıladı",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
  },
  agent: {
    label: "Danışman / Ofis Cebinden Ödendi",
    badgeClass: "bg-amber-50 text-amber-900 border-amber-300 font-bold",
  },
  tenant: {
    label: "Kiracıdan Tahsil Edildi",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-300",
  },
};

export function Trust360ExpenseModal({
  isOpen,
  onClose,
  contract,
}: Trust360ExpenseModalProps) {
  const { addTrust360Expense, deleteTrust360Expense } = useStore();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState<Trust360ExpenseCategory>("maintenance");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<Currency>(contract.currency || "GBP");
  const [paidBy, setPaidBy] = useState<Trust360PaidBy>("owner");
  const [receiptName, setReceiptName] = useState<string>("");
  const [receiptData, setReceiptData] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [previewReceipt, setPreviewReceipt] = useState<{ name: string; data: string } | null>(null);

  if (!isOpen) return null;

  // Dosya yükleme işlemi (Base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Dosya boyutu en fazla 5MB olabilir.");
      return;
    }

    setReceiptName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setReceiptData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Lütfen geçerli bir harcama tutarı girin.");
      return;
    }

    if (!description.trim()) {
      alert("Lütfen yapılan işlemle ilgili bir açıklama girin.");
      return;
    }

    addTrust360Expense(contract.id, {
      contractId: contract.id,
      date,
      category,
      categoryLabel: CATEGORY_MAP[category]?.label,
      description: description.trim(),
      amount: numAmount,
      currency,
      paidBy,
      receiptName: receiptName || undefined,
      receiptData: receiptData || undefined,
      notes: notes.trim() || undefined,
    });

    // Formu sıfırla
    setIsAddingNew(false);
    setDescription("");
    setAmount("");
    setReceiptName("");
    setReceiptData("");
    setNotes("");
  };

  // Toplam harcama özeti (döviz bazlı)
  const currencyTotals: Record<string, number> = {};
  (contract.expenses || []).forEach((exp) => {
    currencyTotals[exp.currency] = (currencyTotals[exp.currency] || 0) + exp.amount;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#1d2566] text-white">
                TRUST 360
              </span>
              <span className="font-mono text-[11px] text-slate-500 font-bold">
                {contract.contractNumber || "İşlem & Masraf Defteri"}
              </span>
            </div>
            <h2 className="text-sm font-bold text-[#1d2566] tracking-tight mt-0.5">
              {contract.propertyTitle}
            </h2>
            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
              <span>Mülk Sahibi: <strong className="text-slate-800">{contract.ownerName}</strong></span>
              {contract.tenantName && <span>• Kiracı: <strong className="text-slate-800">{contract.tenantName}</strong></span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-slate-600">
              Kayıtlı İşlem Sayısı: <strong className="text-slate-900">{(contract.expenses || []).length}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <div className="font-mono flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Toplam Masraf:</span>
              {Object.keys(currencyTotals).length === 0 ? (
                <span className="font-bold text-slate-600">0</span>
              ) : (
                Object.entries(currencyTotals).map(([curr, total]) => (
                  <span
                    key={curr}
                    className="px-2 py-0.5 bg-white border border-slate-300 text-slate-900 font-bold shadow-2xs"
                  >
                    {total.toLocaleString("tr-TR")} {curr}
                  </span>
                ))
              )}
            </div>
          </div>

          {!isAddingNew && (
            <button
              onClick={() => setIsAddingNew(true)}
              className="px-3 py-1.5 bg-[#1d2566] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-[#151a47] transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#00adb5]" />
              <span>Yeni Masraf / İşlem Ekle</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Yeni Masraf Ekleme Formu */}
          {isAddingNew && (
            <form
              onSubmit={handleSaveExpense}
              className="p-4 bg-slate-50 border-2 border-dashed border-[#00adb5]/60 rounded-none space-y-3.5 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold text-[#1d2566] text-xs flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>Yeni Hizmet & Masraf Kaydı Girişi</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Tarih */}
                <div>
                  <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                    İşlem Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 font-mono text-xs focus:outline-none focus:border-[#00adb5]"
                  />
                </div>

                {/* 2. Kategori */}
                <div>
                  <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                    Hizmet Kategorisi *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Trust360ExpenseCategory)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 font-bold text-xs focus:outline-none focus:border-[#00adb5]"
                  >
                    {Object.entries(CATEGORY_MAP).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Kim Ödedi? */}
                <div>
                  <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                    Masrafı Kim Karşıladı? *
                  </label>
                  <select
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value as Trust360PaidBy)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 font-bold text-xs focus:outline-none focus:border-[#00adb5]"
                  >
                    <option value="owner">Mülk Sahibi Karşıladı</option>
                    <option value="agent">Danışman / Ofis Cebinden Ödendi</option>
                    <option value="tenant">Kiracıdan Tahsil Edildi</option>
                  </select>
                </div>
              </div>

              {/* 4. Açıklama */}
              <div>
                <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                  Yapılan İşlem / Harcama Açıklaması *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Örn: Havuz pompası tamiri, motor rulmanı yenilendi ve ilaçlama yapıldı"
                  className="w-full px-2.5 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#00adb5]"
                />
              </div>

              {/* 5. Tutar & Para Birimi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                    Harcama Tutarı & Döviz *
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      required
                      step="any"
                      min={0}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 border border-slate-300 font-mono font-bold text-xs focus:outline-none focus:border-[#00adb5]"
                    />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className="bg-slate-100 border border-l-0 border-slate-300 px-2 py-1.5 font-bold font-mono text-xs focus:outline-none"
                    >
                      <option value="GBP">GBP (£)</option>
                      <option value="TRY">TRY (₺)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>

                {/* 6. Dekont / Fatura Yükleme */}
                <div>
                  <label className="text-[10.5px] font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Fatura / Dekont İliştir</span>
                    {receiptName && (
                      <span className="text-[10px] text-emerald-600 font-bold truncate max-w-[150px]">
                        ✓ {receiptName}
                      </span>
                    )}
                  </label>
                  <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 bg-white hover:border-[#00adb5] hover:bg-slate-50 transition cursor-pointer text-slate-600">
                    <UploadCloud className="w-3.5 h-3.5 text-[#00adb5]" />
                    <span className="text-xs">{receiptName ? "Dosyayı Değiştir" : "Belge / Fotoğraf Seç"}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Notlar */}
              <div>
                <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                  Ek Notlar (Usta iletişim bilgisi, fatura no vb.)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Opsiyonel not..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#00adb5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>İşlemi Kaydet</span>
                </button>
              </div>
            </form>
          )}

          {/* Masraflar Tablosu */}
          {(!contract.expenses || contract.expenses.length === 0) ? (
            <div className="p-8 text-center border border-dashed border-slate-200 bg-slate-50/50 text-slate-500 font-mono space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs">Bu portföy için henüz kaydedilmiş bir harcama veya işlem bulunmuyor.</p>
              <p className="text-[11px] text-slate-400">
                Yapılan havuz bakımı, su/elektrik ödemesi veya tadilatları eklemek için yukarıdaki butonu kullanın.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-mono text-[10.5px] text-slate-600 uppercase font-bold">
                    <th className="py-2.5 px-3">Tarih</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Yapılan İşlem & Açıklama</th>
                    <th className="py-2.5 px-3">Kim Ödedi</th>
                    <th className="py-2.5 px-3 text-right">Tutar</th>
                    <th className="py-2.5 px-2 text-center">Dekont</th>
                    <th className="py-2.5 px-2 text-center">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contract.expenses.map((exp) => {
                    const catInfo = CATEGORY_MAP[exp.category] || CATEGORY_MAP.other;
                    const IconComponent = catInfo.icon;
                    const paidInfo = PAID_BY_MAP[exp.paidBy] || PAID_BY_MAP.owner;

                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {exp.date}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[10.5px] font-semibold ${catInfo.color}`}
                          >
                            <IconComponent className="w-3 h-3 shrink-0" />
                            <span>{catInfo.label}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{exp.description}</div>
                          {exp.notes && (
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {exp.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-1.5 py-0.5 border text-[10px] font-mono ${paidInfo.badgeClass}`}
                          >
                            {paidInfo.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {exp.amount.toLocaleString("tr-TR")} {exp.currency}
                        </td>
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          {exp.receiptData ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewReceipt({
                                  name: exp.receiptName || "Dekont",
                                  data: exp.receiptData!,
                                })
                              }
                              title={`Dekontu Görüntüle: ${exp.receiptName || ""}`}
                              className="p-1 text-[#00adb5] hover:text-[#1d2566] hover:bg-slate-100 transition cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-slate-300 font-mono text-[10px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Bu işlem kaydını silmek istediğinize emin misiniz?")) {
                                deleteTrust360Expense(contract.id, exp.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                            title="İşlemi Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1d2566] text-white font-bold text-xs hover:bg-[#151a47] transition cursor-pointer"
          >
            Tamam / Kapat
          </button>
        </div>
      </div>

      {/* Dekont / Fatura Önizleme Modalı */}
      {previewReceipt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h4 className="font-mono font-bold text-xs text-[#1d2566] truncate">
                {previewReceipt.name}
              </h4>
              <button
                onClick={() => setPreviewReceipt(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-100 max-h-[70vh]">
              {previewReceipt.data.startsWith("data:image/") ? (
                <img
                  src={previewReceipt.data}
                  alt={previewReceipt.name}
                  className="max-w-full max-h-[65vh] object-contain border border-slate-300 shadow-xs"
                />
              ) : (
                <iframe
                  src={previewReceipt.data}
                  title={previewReceipt.name}
                  className="w-full h-[65vh] border-0"
                />
              )}
            </div>
            <div className="p-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <a
                href={previewReceipt.data}
                download={previewReceipt.name}
                className="font-bold text-[#00adb5] hover:underline"
              >
                ⬇ Dosyayı İndir
              </a>
              <button
                onClick={() => setPreviewReceipt(null)}
                className="px-3 py-1 bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
