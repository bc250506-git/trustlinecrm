"use client";

import React, { useRef } from "react";
import { Trust360Contract } from "@/lib/types";
import { formatDateTR } from "@/lib/formatters";
import {
  X,
  Printer,
  Share2,
  FileText,
  Calendar,
  Building,
  User,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface Trust360ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Trust360Contract;
}

export function Trust360ReportModal({
  isOpen,
  onClose,
  contract,
}: Trust360ReportModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Harcama toplamları
  const totalsByCurrency: Record<string, number> = {};
  (contract.expenses || []).forEach((exp) => {
    totalsByCurrency[exp.currency] = (totalsByCurrency[exp.currency] || 0) + exp.amount;
  });

  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Döküm Metni
  const handleSendWhatsApp = () => {
    const phone = (contract.ownerWhatsapp || contract.ownerPhone || "").replace(/[^0-9]/g, "");
    if (!phone) {
      alert("Mülk sahibinin kayıtlı bir telefon numarası bulunamadı.");
      return;
    }

    const expensesList = (contract.expenses || [])
      .map(
        (exp, idx) =>
          `${idx + 1}. [${exp.date}] ${exp.categoryLabel || exp.category}: ${exp.description} - ${exp.amount.toLocaleString("tr-TR")} ${exp.currency}`
      )
      .join("\n");

    const totalsStr = Object.entries(totalsByCurrency)
      .map(([curr, sum]) => `*${sum.toLocaleString("tr-TR")} ${curr}*`)
      .join(" + ");

    const text = encodeURIComponent(
      `*TRUST 360 • KİRALIK MÜLK YÖNETİMİ DÖKÜMÜ*\n` +
      `Trustline Estate Ltd. Profesyonel Mülk Yönetimi\n\n` +
      `🏠 *Mülk:* ${contract.propertyTitle}\n` +
      `👤 *Mülk Sahibi:* ${contract.ownerName}\n` +
      `📅 *Dönem:* ${formatDateTR(contract.startDate)} - ${formatDateTR(contract.endDate)}\n` +
      `📋 *Sözleşme No:* ${contract.contractNumber || "-"}\n\n` +
      `📌 *Yapılan İşlemler ve Masraflar (${contract.expenses?.length || 0} Kalem):*\n` +
      (expensesList || "Bu dönemde henüz kaydedilmiş bir harcama bulunmamaktadır.") +
      `\n\n💰 *Toplam Yapılan Masraf:* ${totalsStr || "0"}\n\n` +
      `İlgili işlemlerin fatura ve dekontları şirketimiz arşivinde kayıtlıdır. Bilginize sunarız.\n\n` +
      `_Trustline Estate • Trust 360_`
    );

    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Modal Controls (Yazdırırken gizlenir) */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#1d2566] text-white">
              TRUST 360
            </span>
            <span className="text-xs font-bold text-[#1d2566]">
              Müşteri Faaliyet ve Masraf Ekstresi
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Mülk sahibine WhatsApp dökümü gönder"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp ile Gönder</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#1d2566] text-white font-bold text-xs hover:bg-[#151a47] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Yazdır veya PDF olarak kaydet"
            >
              <Printer className="w-3.5 h-3.5 text-[#00adb5]" />
              <span>Yazdır / PDF Kaydet</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ekstre Belgesi */}
        <div
          ref={printAreaRef}
          className="p-8 overflow-y-auto space-y-6 text-xs text-slate-800 bg-white"
        >
          {/* Ekstre Üst Başlığı & Logo */}
          <div className="border-b-2 border-[#1d2566] pb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/trust360-logo.jpg"
                alt="Trust 360 Logo"
                className="h-12 w-auto object-contain"
              />
              <div className="border-l border-slate-300 pl-3">
                <h1 className="text-sm font-extrabold text-[#1d2566] tracking-tight uppercase">
                  Trustline Estate Ltd.
                </h1>
                <p className="text-[10px] font-mono text-slate-500 font-bold">
                  Profesyonel Kiralık Mülk Yönetimi Hizmet Raporu
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-[11px] space-y-0.5">
              <div className="text-slate-400 font-semibold">Rapor Tarihi:</div>
              <div className="font-bold text-slate-800">
                {new Date().toLocaleDateString("tr-TR")}
              </div>
              <div className="text-[9.5px] px-1.5 py-0.5 bg-slate-100 border border-slate-200 inline-block text-slate-600 font-bold">
                {contract.contractNumber || "T360-RAPOR"}
              </div>
            </div>
          </div>

          {/* Mülk & Sözleşme Detay Kartı */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/80 border border-slate-200 text-xs">
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400 flex items-center gap-1">
                <Building className="w-3 h-3 text-[#00adb5]" /> Gayrimenkul Bilgisi
              </div>
              <div className="font-bold text-sm text-[#1d2566] leading-snug">
                {contract.propertyTitle}
              </div>
              <div className="text-slate-600 font-mono text-[11px]">
                {contract.region || "KKTC"} • {contract.propertyType || "Kiralık Konut"}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3 text-[#00adb5]" /> Mülk Sahibi & Sözleşme
              </div>
              <div className="font-bold text-sm text-slate-900">
                {contract.ownerName}
              </div>
              <div className="text-slate-600 font-mono text-[11px]">
                Tel: {contract.ownerPhone || "-"}
              </div>
              <div className="text-[10.5px] font-mono text-slate-500">
                Dönem: <strong>{formatDateTR(contract.startDate)} - {formatDateTR(contract.endDate)}</strong>
              </div>
            </div>
          </div>

          {/* Hizmet & Masraf Hareketleri Tablosu */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-xs text-[#1d2566] uppercase font-mono tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#00adb5]" />
                <span>Dönem İçi Gerçekleştirilen İşlemler ve Masraflar</span>
              </h3>
              <span className="font-mono text-[10.5px] text-slate-500">
                Toplam {(contract.expenses || []).length} Kayıt
              </span>
            </div>

            {(!contract.expenses || contract.expenses.length === 0) ? (
              <div className="p-6 text-center border border-dashed border-slate-300 text-slate-500 font-mono text-xs">
                Bu raporlama döneminde henüz bir harcama veya operasyonel işlem kaydı bulunmamaktadır.
              </div>
            ) : (
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-mono text-[10.5px] font-bold text-slate-700 uppercase">
                    <th className="py-2 px-2.5 border-r border-slate-200 w-[90px]">Tarih</th>
                    <th className="py-2 px-2.5 border-r border-slate-200 w-[150px]">Hizmet Türü</th>
                    <th className="py-2 px-2.5 border-r border-slate-200">Yapılan İşlem / Harcama Detayı</th>
                    <th className="py-2 px-2.5 border-r border-slate-200 w-[140px]">Karşılayan</th>
                    <th className="py-2 px-2.5 text-right w-[110px]">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {contract.expenses.map((exp, idx) => (
                    <tr key={exp.id} className={idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"}>
                      <td className="py-2 px-2.5 border-r border-slate-200 font-mono text-slate-600 whitespace-nowrap">
                        {exp.date}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 font-semibold text-slate-800">
                        {exp.categoryLabel || exp.category}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 text-slate-800">
                        <div>{exp.description}</div>
                        {exp.receiptName && (
                          <div className="text-[9.5px] text-emerald-700 font-mono mt-0.5">
                            📎 Fatura/Dekont: {exp.receiptName}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 font-mono text-[10.5px] text-slate-600">
                        {exp.paidBy === "owner"
                          ? "Mülk Sahibi"
                          : exp.paidBy === "agent"
                          ? "Danışman/Ofis"
                          : "Kiracı"}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {exp.amount.toLocaleString("tr-TR")} {exp.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold font-mono">
                    <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-slate-700">
                      Toplam Masraf Tutarı:
                    </td>
                    <td className="py-2.5 px-3 text-right text-sm text-[#1d2566]">
                      {Object.keys(totalsByCurrency).length === 0
                        ? "0"
                        : Object.entries(totalsByCurrency).map(([curr, sum]) => (
                            <div key={curr}>
                              {sum.toLocaleString("tr-TR")} {curr}
                            </div>
                          ))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Yasal & Operasyonel Açıklama */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 text-[10.5px] text-slate-600 font-mono space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00adb5]" />
              <span>Trust 360 Operasyonel Hizmet Notu:</span>
            </div>
            <p>
              İşbu faaliyet ve harcama ekstresi, Trustline Estate Ltd. tarafından mülkünüz için yürütülen
              Trust 360 profesyonel kiralık mülk yönetimi çerçevesinde koordine edilen arıza, tadilat, resmi harç
              ve bakım işlemlerini göstermektedir. Tüm işlemlerin fatura ve ödeme dekontları şirketimiz arşivinde kayıtlıdır.
            </p>
          </div>

          {/* İmza & Onay Alanı */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs font-mono">
            <div>
              <div className="text-slate-400 text-[10px] uppercase">Raporu Düzenleyen</div>
              <div className="font-bold text-slate-900 mt-1">{contract.assignedToName}</div>
              <div className="text-[10px] text-slate-500">Trustline Estate Ltd.</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase">Mülk Sahibi Bilgilendirme Onayı</div>
              <div className="font-bold text-slate-900 mt-1">{contract.ownerName}</div>
              <div className="text-[10px] text-slate-500">Teslim & Bilgi Edinilmiştir</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
