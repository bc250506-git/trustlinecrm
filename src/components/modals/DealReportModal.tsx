"use client";

import React, { useState } from "react";
import { Deal } from "@/lib/types";
import {
  X,
  Printer,
  FileDown,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { formatDateTR, formatPhoneWithPrefix } from "@/lib/formatters";

interface DealReportModalProps {
  deal: Deal;
  onClose: () => void;
}

const ALL_CHANNELS = [
  ["Branda", "Sosyal medya", "Etkinlik"],
  ["Telefon", "Saha çalışması", "İlan siteleri"],
  ["Tavsiye", "YouTube", "Portföy videosu"],
  ["Web", "Yüz yüze sunum", "Reklam alanları"],
];

const PROPERTY_TYPES = ["Ofis", "Daire", "Villa", "Apartman", "Arsa", "Dükkan"];

export function DealReportModal({ deal, onClose }: DealReportModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const rawReportDate =
    deal.brokerApprovedAt ||
    deal.closingDate ||
    deal.createdAt?.split("T")[0] ||
    new Date().toISOString().split("T")[0];
  const reportDate = formatDateTR(rawReportDate);

  const hasPartner = Boolean(
    deal.sharingType &&
    deal.sharingType !== "none" &&
    ((deal.partnerShareRate && deal.partnerShareRate > 0) ||
      deal.partnerName ||
      deal.partnerAdvisorName ||
      deal.partnerCompany)
  );

  const displayAddress = (() => {
    const addr = (deal.address || "").trim();
    if (addr && addr.toLowerCase() !== "gayrimenkul") return addr;
    const title = (deal.propertyTitle || "").trim();
    if (title && title.toLowerCase() !== "gayrimenkul") return title;
    return "";
  })();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const reportElement = document.getElementById("printable-deal-report");
    if (!reportElement) return;

    setIsGenerating(true);
    try {
      // 1. İmajları Base64'e dönüştür
      const imgElements = Array.from(reportElement.querySelectorAll("img"));
      await Promise.all(
        imgElements.map(async (img) => {
          if (img.src && !img.src.startsWith("data:")) {
            try {
              const res = await fetch(img.src);
              const blob = await res.blob();
              await new Promise<void>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  img.src = reader.result as string;
                  resolve();
                };
                reader.onerror = () => resolve();
                reader.readAsDataURL(blob);
              });
            } catch (e) {
              console.warn("Logo base64 conversion error:", e);
            }
          }
        })
      );

      await new Promise((r) => setTimeout(r, 80));

      const canvas = await html2canvas(reportElement, {
        scale: 2.5, // Ultra keskin A4 baskı çözünürlüğü
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

      const fileName = `Islem-Raporu-${deal.dealNumber || deal.id}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF oluşturma hatası:", err);
      alert("PDF oluşturulurken bir hata oluştu. Lütfen yazdırma seçeneğini kullanın.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Yazdırma Medyası Stilleri - Tek Sayfa A4 Garantisi */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-deal-report,
          #printable-deal-report * {
            visibility: visible !important;
          }
          #printable-deal-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: 284mm !important;
            margin: 0 !important;
            padding: 4mm 6mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-after: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[95vh] max-w-4xl border-0 sm:border border-slate-300 shadow-2xl flex flex-col rounded-none sm:rounded-lg sm:my-auto overflow-hidden">
        {/* Üst Modal Kontrol Başlığı (Yazdırmada görünmez) */}
        <div className="no-print bg-[#1d2566] text-white px-5 py-3 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm tracking-wide">
                İşlem Sonrası Ofis Raporu
              </h3>
              <div className="text-[11px] text-slate-300 font-mono">
                İşlem No: {deal.dealNumber || deal.id} • Rapor Tarihi: {reportDate}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer border border-white/20"
              title="Yazıcıdan Yazdır (Tek Sayfa)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Yazdır</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              title="Resmi PDF İndir"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>{isGenerating ? "PDF Oluşturuluyor..." : "PDF İndir"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Belge Görüntüleme Alanı */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex justify-center">
          {/* FİZİKSEL FORM ŞABLONU (A4 Orantılı Antetli Belge) */}
          <div
            id="printable-deal-report"
            className="bg-white text-slate-900 w-full max-w-[210mm] p-5 sm:p-6 border border-slate-300 shadow-md font-sans text-[10.5px] leading-tight"
          >
            {/* 1. ÜST ANTET VE LOGO */}
            <div className="border-b-2 border-slate-900 pb-2 mb-2">
              <div className="flex items-center justify-between">
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.png"
                    alt="Trustline Real Estate"
                    className="h-10 w-auto object-contain"
                  />
                </div>

                <div className="text-right">
                  <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                    İŞLEM SONRASI OFİS RAPORU
                  </h1>
                </div>
              </div>

              {/* Üst Alanlar: GD Adı Soyadı, İşlem No, Rapor Tarihi */}
              <div className="grid grid-cols-3 gap-2 mt-2.5 pt-1.5 border-t border-slate-200 text-[10.5px]">
                <div>
                  <span className="font-bold text-slate-700">GD ADI SOYADI: </span>
                  <span className="font-semibold text-slate-900 border-b border-dotted border-slate-400 pb-0.5">
                    {deal.createdByName || "Danışman"}
                  </span>
                </div>
                <div className="text-center">
                  <span className="font-bold text-slate-700">İŞLEM / PORTFÖY NO: </span>
                  <span className="font-semibold text-slate-900 border-b border-dotted border-slate-400 pb-0.5">
                    {deal.dealNumber || deal.id}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-700">RAPOR TARİHİ: </span>
                  <span className="font-semibold text-slate-900 border-b border-dotted border-slate-400 pb-0.5">
                    {reportDate}
                  </span>
                </div>
              </div>
            </div>

            {/* 01 GAYRİMENKUL BİLGİLERİ */}
            <div className="mb-2 pb-1.5 border-b border-slate-300">
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-xs text-slate-900 tracking-wider">
                  01 GAYRİMENKUL BİLGİLERİ
                </span>
                <div className="flex items-center gap-4 text-[11px]">
                  <label className="inline-flex items-center gap-1">
                    <span className="w-3.5 h-3.5 border border-slate-900 inline-flex items-center justify-center font-bold text-[10px] bg-slate-50">
                      {deal.dealType === "sale" ? "✓" : ""}
                    </span>
                    <span>Satış</span>
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <span className="w-3.5 h-3.5 border border-slate-900 inline-flex items-center justify-center font-bold text-[10px] bg-slate-50">
                      {deal.dealType === "rent" ? "✓" : ""}
                    </span>
                    <span>Kiralama</span>
                  </label>
                </div>
              </div>

              <div className="mb-1.5">
                <span className="font-bold text-slate-700">ADRES: </span>
                <span className="border-b border-dotted border-slate-400 pb-0.5 font-medium">
                  {displayAddress}
                </span>
              </div>

              {/* Tip Seçenekleri */}
              <div className="flex flex-wrap items-center gap-3 mb-1">
                {PROPERTY_TYPES.map((type) => {
                  const isChecked = deal.propertyType === type;
                  return (
                    <label key={type} className="inline-flex items-center gap-1">
                      <span className="w-3.5 h-3.5 border border-slate-900 inline-flex items-center justify-center font-bold text-[10px] bg-slate-50">
                        {isChecked ? "✓" : ""}
                      </span>
                      <span>{type}</span>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center gap-6 mt-1">
                <div>
                  <span className="font-bold text-slate-700">Arazi m²: </span>
                  <span className="border-b border-dotted border-slate-400 pb-0.5 px-2 font-medium">
                    {deal.area ? `${deal.area} m²` : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700">Arsa türü: </span>
                  <label className="inline-flex items-center gap-1">
                    <span className="w-3.5 h-3.5 border border-slate-900 inline-flex items-center justify-center font-bold text-[10px] bg-slate-50">
                      {deal.landType === "commercial" ? "✓" : ""}
                    </span>
                    <span>Ticari</span>
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <span className="w-3.5 h-3.5 border border-slate-900 inline-flex items-center justify-center font-bold text-[10px] bg-slate-50">
                      {deal.landType === "residential" ? "✓" : ""}
                    </span>
                    <span>Villalık</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 02 TARAFLAR VE İŞLEM TARİHLERİ */}
            <div className="mb-2 pb-1.5 border-b border-slate-300">
              <div className="font-black text-xs text-slate-900 tracking-wider mb-1.5">
                02 TARAFLAR VE İŞLEM TARİHLERİ
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-1">
                <div>
                  <span className="font-bold text-slate-700 block text-[10px]">
                    MÜLK SAHİBİ ADI SOYADI:
                  </span>
                  <span className="border-b border-dotted border-slate-400 pb-0.5 block font-medium">
                    {deal.landlordName || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px]">TELEFON:</span>
                  <span className="border-b border-dotted border-slate-400 pb-0.5 block font-medium">
                    {formatPhoneWithPrefix(deal.landlordPhone) || deal.landlordPhone || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px]">
                    YETKİ BELGESİ ALINAN TARİH:
                  </span>
                  <span className="border-b border-dotted border-slate-400 pb-0.5 block font-medium">
                    {formatDateTR(deal.mandateDate)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-1">
                <div>
                  <span className="font-bold text-slate-700 block text-[10px]">
                    ALICI / KİRACI ADI SOYADI:
                  </span>
                  <span className="border-b border-dotted border-slate-400 pb-0.5 block font-medium">
                    {deal.customerName || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px]">TELEFON:</span>
                  <span className="border-b border-dotted border-slate-400 pb-0.5 block font-medium">
                    {formatPhoneWithPrefix(deal.customerPhone) || deal.customerPhone || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px]">
                    DEPOZİTO TARİHİ:
                  </span>
                  <span className="border-b border-dotted border-slate-400 pb-0.5 block font-medium">
                    {formatDateTR(deal.depositDate)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                <div>
                  <span className="font-bold text-slate-700">İŞLEM KAPATMA TARİHİ: </span>
                  <span className="border-b border-dotted border-slate-400 pb-0.5 font-medium">
                    {formatDateTR(deal.closingDate || rawReportDate)}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">
                    SATIŞ / KİRALAMA SÜRESİ (GÜN / HAFTA / AY):{" "}
                  </span>
                  <span className="border-b border-dotted border-slate-400 pb-0.5 font-medium">
                    {deal.durationText || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* 03 ALICININ ULAŞTIĞI KANAL */}
            <div className="mb-2 pb-1.5 border-b border-slate-300">
              <div className="font-black text-xs text-slate-900 tracking-wider mb-1.5">
                03 ALICININ ULAŞTIĞI KANAL
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-1 gap-x-3">
                {ALL_CHANNELS.map((col, colIdx) => (
                  <div key={colIdx} className="space-y-1">
                    {col.map((channel) => {
                      const isSelected =
                        deal.leadChannel &&
                        deal.leadChannel.toLowerCase().trim() === channel.toLowerCase().trim();
                      return (
                        <label key={channel} className="flex items-center gap-1.5 text-[10px]">
                          <span className="w-3.5 h-3.5 border border-slate-900 inline-flex items-center justify-center font-bold text-[10px] bg-slate-50 shrink-0">
                            {isSelected ? "✓" : ""}
                          </span>
                          <span className={isSelected ? "font-bold text-slate-900" : "text-slate-700"}>
                            {channel}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* 04 İŞLEM BİLGİLERİ */}
            <div className="mb-2 pb-1.5 border-b border-slate-300">
              <div className="mb-1.5">
                <span className="font-black text-xs text-slate-900 tracking-wider">
                  04 İŞLEM BİLGİLERİ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-1.5">
                <div>
                  <span className="font-bold text-slate-700 block text-[10px]">
                    SATIŞ / KİRALAMA FİYATI:
                  </span>
                  <span className="border-b border-dotted border-slate-400 pb-0.5 block font-semibold">
                    {deal.askingPrice ? deal.askingPrice.toLocaleString("tr-TR") : "-"} {deal.currency}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px]">
                    KAÇA SATILDI / KİRALANDI:
                  </span>
                  <span className="border-b border-dotted border-slate-400 pb-0.5 block font-semibold text-emerald-950">
                    {deal.agreedPrice.toLocaleString("tr-TR")} {deal.currency}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px]">
                    ANLAŞILAN HİZMET BEDELİ:
                  </span>
                  <span className="border-b border-dotted border-slate-400 pb-0.5 block font-semibold text-[#1d2566]">
                    {(deal.commissionReceived || deal.commissionExpected).toLocaleString("tr-TR")}{" "}
                    {deal.currency} (%{deal.commissionRate || 5})
                  </span>
                </div>
              </div>

              <div className="mb-1">
                <span className="font-bold text-slate-700">TAHSİLAT TARİHİ / YÖNTEMİ: </span>
                <span className="border-b border-dotted border-slate-400 pb-0.5 font-medium">
                  {formatDateTR(deal.collectionDate || deal.paymentDue || rawReportDate)} /{" "}
                  {deal.paymentMethod || "Banka Havalesi / EFT"}
                </span>
              </div>

              {deal.notes && (
                <div className="text-[10px] text-slate-600 italic mt-0.5">
                  <span className="font-bold text-slate-700 not-italic">NOTLAR: </span>
                  {deal.notes}
                </div>
              )}
            </div>

            {/* 05 PORTFÖY TÜRÜ VE PAYLAŞIM */}
            <div className="mb-2">
              <div className="font-black text-xs text-slate-900 tracking-wider mb-1.5">
                05 PORTFÖY TÜRÜ VE PAYLAŞIM
              </div>

              <div className="flex items-center gap-6 mb-1.5">
                <label className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border border-slate-900 inline-flex items-center justify-center font-bold text-[10px] bg-slate-50">
                    {deal.portfolioOrigin === "advisor" && !hasPartner ? "✓" : ""}
                  </span>
                  <span>Kendi portföyü</span>
                </label>

                <label className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border border-slate-900 inline-flex items-center justify-center font-bold text-[10px] bg-slate-50">
                    {deal.portfolioOrigin === "office" && !hasPartner ? "✓" : ""}
                  </span>
                  <span>Ofis portföyü</span>
                </label>

                <label className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border border-slate-900 inline-flex items-center justify-center font-bold text-[10px] bg-slate-50">
                    {hasPartner ? "✓" : ""}
                  </span>
                  <span>Ortak</span>
                </label>
              </div>

              {/* Ortak Bilgileri (Yalnızca ortak işlemse dinamik olarak gösterilir) */}
              {hasPartner && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  <div>
                    <span className="font-bold text-slate-700">ORTAK OFİS / DANIŞMAN ADI: </span>
                    <span className="border-b border-dotted border-slate-400 pb-0.5 font-medium">
                      {deal.sharingType === "internal"
                        ? deal.partnerAdvisorName || "2. Danışman (İç Paylaşım)"
                        : deal.partnerName || deal.partnerCompany || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">ORTAK İLETİŞİM BİLGİSİ: </span>
                    <span className="border-b border-dotted border-slate-400 pb-0.5 font-medium">
                      {formatPhoneWithPrefix(deal.partnerPhone) || deal.partnerPhone || "-"}
                    </span>
                  </div>
                </div>
              )}

              {/* Komisyon Pay Tablosu */}
              <table className="w-full border-collapse border border-slate-400 mb-2 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400">
                    <th className="border border-slate-400 p-1 text-left font-bold text-slate-800">
                      PAY SAHİBİ
                    </th>
                    <th className="border border-slate-400 p-1 text-center font-bold text-slate-800 w-24">
                      ORAN
                    </th>
                    <th className="border border-slate-400 p-1 text-right font-bold text-slate-800 w-40">
                      TUTAR
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-400 p-1 font-semibold">
                      GD ({deal.createdByName || "Danışman"})
                    </td>
                    <td className="border border-slate-400 p-1 text-center font-bold">
                      %{deal.advisorShareRate || 0}
                    </td>
                    <td className="border border-slate-400 p-1 text-right font-bold text-[#1d2566]">
                      {(deal.advisorShareAmount || 0).toLocaleString("tr-TR")} {deal.currency}
                    </td>
                  </tr>

                  {hasPartner && (
                    <tr>
                      <td className="border border-slate-400 p-1">
                        Ortak (
                        {deal.sharingType === "internal"
                          ? deal.partnerAdvisorName || "2. Danışman"
                          : deal.partnerName || deal.partnerCompany || "Ortak"}
                        )
                      </td>
                      <td className="border border-slate-400 p-1 text-center font-bold">
                        %{deal.partnerShareRate || 0}
                      </td>
                      <td className="border border-slate-400 p-1 text-right font-bold">
                        {(deal.partnerShareAmount || 0).toLocaleString("tr-TR")} {deal.currency}
                      </td>
                    </tr>
                  )}

                  <tr className="bg-emerald-50/40">
                    <td className="border border-slate-400 p-1 font-bold text-emerald-950">
                      OFİS PAYI (Trustline Real Estate)
                    </td>
                    <td className="border border-slate-400 p-1 text-center font-bold text-emerald-950">
                      %{deal.officeShareRate || 0}
                    </td>
                    <td className="border border-slate-400 p-1 text-right font-bold text-emerald-800">
                      {(deal.officeShareAmount || 0).toLocaleString("tr-TR")} {deal.currency}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* İMZALAR VE ONAYLAR */}
              <div className="grid grid-cols-2 gap-4 border border-slate-400 p-3 bg-slate-50/50 mt-2">
                <div className="border-r border-slate-300 pr-3 flex flex-col justify-between min-h-[55px]">
                  <div>
                    <div className="font-bold text-[10px] text-slate-600 uppercase mb-0.5">
                      GD ADI SOYADI / İMZA:
                    </div>
                    <div className="font-bold text-xs text-slate-900">
                      {deal.createdByName || "Danışman"}
                    </div>
                  </div>
                  <div className="mt-3 pt-1 border-t border-slate-400 text-[10px] text-slate-500 font-medium">
                    İmza:
                  </div>
                </div>

                <div className="pl-2 flex flex-col justify-between min-h-[55px]">
                  <div>
                    <div className="font-bold text-[10px] text-slate-600 uppercase mb-0.5">
                      BROKER ONAYI / TARİH / İMZA:
                    </div>
                    <div className="font-bold text-xs text-slate-900">
                      {deal.brokerApprovedBy || "Volkan Affan Kanıgür"}
                    </div>
                  </div>
                  <div className="mt-3 pt-1 border-t border-slate-400 text-[10px] text-slate-500 font-medium flex items-center justify-between">
                    <span>Tarih: {reportDate}</span>
                    <span>İmza:</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
