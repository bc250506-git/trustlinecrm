"use client";

import React, { use, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Property } from "@/lib/types";
import { initialProperties, initialMandates } from "@/lib/mockData";
import {
  MapPin,
  Maximize2,
  BedDouble,
  ShieldCheck,
  Printer,
  FileDown,
  MessageCircle,
  Award,
  Loader2,
  ArrowLeft,
  Building,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

interface PageProps {
  params: Promise<{ id: string }>;
}

function BrosurContent({ params }: PageProps) {
  const unwrappedParams = use(params);
  const propertyId = unwrappedParams.id;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // 1. Önce localStorage'daki güncel havuzdan ara
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("trustline_crm_properties_v3");
        if (saved) {
          const parsed: Property[] = JSON.parse(saved);
          const found = parsed.find((p) => p.id === propertyId);
          if (found) {
            setProperty(found);
            setLoading(false);
            return;
          }
        }
      } catch (e) {}
    }

    // 2. Mock verilerden ara
    const mockFound = initialProperties.find((p) => p.id === propertyId);
    if (mockFound) {
      setProperty(mockFound);
    }
    setLoading(false);
  }, [propertyId]);

  const isExclusive = property
    ? initialMandates.some(
        (m) =>
          (m.propertyId === property.id ||
            (m.propertyTitle &&
              property.title &&
              m.propertyTitle.trim().toLowerCase() === property.title.trim().toLowerCase())) &&
          m.mandateType === "exclusive" &&
          m.status !== "cancelled"
      )
    : false;

  const displayPhotos = property
    ? property.photos && property.photos.length > 0
      ? property.photos.filter((p) => p.shareable)
      : property.imageUrl
      ? [{ id: "cover-photo", propertyId: property.id, url: property.imageUrl, shareable: true }]
      : []
    : [];

  // Görselleri Base64 Data URL'e Çevirici (CORS Taint Güvenliği)
  const imageSrcToBase64 = async (src: string): Promise<string> => {
    if (!src) return "";
    if (src.startsWith("data:")) return src;

    if (src.startsWith("/")) {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error("Local fetch failed");
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        return src;
      }
    }

    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      try {
        const directRes = await fetch(src, { mode: "cors" });
        const blob = await directRes.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        return src;
      }
    }
  };

  // Gerçek A4 PDF Blob Oluşturucu
  const generateBrochurePdf = async (): Promise<{ blob: Blob; filename: string }> => {
    if (!property) throw new Error("Portföy verisi bulunamadı.");
    const brochureElement = document.getElementById("printable-brochure-content");
    if (!brochureElement) throw new Error("Broşür içeriği bulunamadı.");

    const imgElements = Array.from(brochureElement.querySelectorAll("img"));
    const originalSrcs = imgElements.map((img) => img.src);

    try {
      await Promise.all(
        imgElements.map(async (img) => {
          try {
            const b64 = await imageSrcToBase64(img.src);
            if (b64 && b64.startsWith("data:")) {
              img.src = b64;
            }
          } catch (e) {
            console.warn("Image conversion skipped for:", img.src);
          }
        })
      );

      await new Promise((r) => setTimeout(r, 60));

      const canvas = await html2canvas(brochureElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const printableWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin * 2;
      const imgWidth = printableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= printableHeight * 1.05) {
        const finalHeight = Math.min(imgHeight, printableHeight);
        pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, finalHeight);
      } else {
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, imgHeight);
        heightLeft -= printableHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", margin, position + margin, imgWidth, imgHeight);
          heightLeft -= printableHeight;
        }
      }

      const cleanTitle = (property.title || "Portfoy_Brosuru")
        .replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ_-]/g, "_")
        .slice(0, 40);
      const filename = `Trustline_${cleanTitle}.pdf`;
      const blob = pdf.output("blob");

      return { blob, filename };
    } finally {
      imgElements.forEach((img, i) => {
        img.src = originalSrcs[i];
      });
    }
  };

  // İNDİR Butonu
  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      const { blob, filename } = await generateBrochurePdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("PDF indirme hatası:", err);
      alert("Broşür PDF'i indirilirken bir hata oluştu: " + (err?.message || "Lütfen tekrar deneyiniz."));
    } finally {
      setIsGenerating(false);
    }
  };

  // YAZDIR Butonu (İzole Iframe)
  const handlePrint = () => {
    const brochureElement = document.getElementById("printable-brochure-content");
    if (!brochureElement || !property) {
      alert("Broşür içeriği bulunamadı.");
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const styleTags = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
      .map((el) => el.outerHTML)
      .join("\n");

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <title>${property.title || "Portföy Broşürü"} - Trustline</title>
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .printable-brochure {
              padding: 0 !important;
              max-width: 100% !important;
              box-shadow: none !important;
              border: none !important;
            }
          </style>
        </head>
        <body>
          <div class="printable-brochure">
            ${brochureElement.innerHTML}
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Iframe print error:", e);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 400);
  };

  // WhatsApp'tan Bilgi Alma Butonu
  const handleContactWhatsApp = () => {
    if (!property) return;
    const msg = `Merhaba Trustline, "${property.title}" (${property.region} - ${property.price.toLocaleString("tr-TR")} ${property.currency}) portföyünüz hakkında detaylı bilgi almak ve randevu oluşturmak istiyorum.`;
    window.open(`https://wa.me/902128004040?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-slate-600 font-mono text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-[#00adb5]" />
          <span>Portföy broşürü yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="sharp-card max-w-md w-full bg-white p-8 text-center border border-slate-200 shadow-xl space-y-4">
          <Building className="w-12 h-12 text-slate-400 mx-auto" />
          <h1 className="text-lg font-bold text-[#1d2566]">Portföy Bulunamadı</h1>
          <p className="text-xs text-slate-500">
            Aradığınız portföy yayından kaldırılmış veya bağlantı adresi değişmiş olabilir.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1d2566] text-white text-xs font-mono font-bold shadow-xs hover:bg-[#151b4d] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ana Sayfaya Dön</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80 py-8 px-4 flex flex-col items-center">
      {/* Üst Sabit Aksiyon Çubuğu (Yalnızca WP PAYLAŞ / BİLGİ AL, YAZDIR, İNDİR) */}
      <div className="no-print w-full max-w-3xl mb-4 bg-white border border-slate-200 shadow-md p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-[#1d2566]">
            Trustline Gayrimenkul • Resmi Portföy Broşürü
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* WhatsApp Butonu */}
          <button
            onClick={handleContactWhatsApp}
            className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Danışmanla WhatsApp üzerinden hemen iletişime geçin"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WP'DAN BİLGİ AL</span>
          </button>

          {/* YAZDIR Butonu */}
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Broşürün temiz A4 çıktısını al"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>YAZDIR</span>
          </button>

          {/* İNDİR Butonu */}
          <button
            disabled={isGenerating}
            onClick={handleDownloadPdf}
            className="px-3.5 py-1.5 bg-[#1d2566] hover:bg-[#151b4d] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-60"
            title="Broşürü yüksek kaliteli PDF dosyası olarak indir"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00adb5]" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-[#00adb5]" />
            )}
            <span>İNDİR (PDF)</span>
          </button>
        </div>
      </div>

      {/* Broşür Kartı (Yazdırılabilir ve PDF'e Çevrilebilir Alan) */}
      <div
        id="printable-brochure-content"
        className="printable-brochure sharp-card w-full max-w-3xl bg-white border border-slate-200 shadow-2xl p-8 space-y-6 text-slate-800"
      >
        {/* Broşür Üst Başlığı & Orijinal Logo */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <img
              src="/logo.png"
              alt="Trustline Real Estate"
              crossOrigin="anonymous"
              className="h-11 md:h-12 w-auto object-contain"
            />
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              {isExclusive && (
                <span className="text-xs font-mono uppercase px-2 py-0.5 border font-bold inline-flex items-center gap-1 bg-[#1d2566]/10 text-[#1d2566] border-[#1d2566]/30">
                  <Award className="w-3.5 h-3.5 text-[#1d2566]" /> Tek Yetkili
                </span>
              )}
              <div className="text-xs font-mono uppercase px-2 py-0.5 bg-[#00adb5]/10 text-[#00adb5] border border-[#00adb5]/30 font-bold inline-block">
                {property.listingType === "sale" ? "SATILIK" : "KİRALIK"}
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-[#1d2566] mt-1">
              {property.price.toLocaleString("tr-TR")} {property.currency}
            </div>
          </div>
        </div>

        {/* İlan Başlığı ve Bölge */}
        <div>
          <h1 className="text-xl font-bold text-[#1d2566] leading-tight">
            {property.title}
          </h1>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1 text-[#00adb5] font-semibold">
              <MapPin className="w-3.5 h-3.5" /> {property.region}
            </span>
            <span>•</span>
            <span className="font-medium">{property.propertyType}</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">
              Yetkili Portföy: {property.assignedToName || "Trustline Brokerage"}
            </span>
          </div>
        </div>

        {/* Fotoğraf Galerisi */}
        {displayPhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {displayPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className={`relative overflow-hidden border border-slate-200 bg-slate-100 ${
                  index === 0 && displayPhotos.length === 1 ? "col-span-2" : ""
                }`}
              >
                <img
                  src={photo.url}
                  alt={property.title}
                  crossOrigin="anonymous"
                  className="w-full h-56 object-cover object-center"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="h-44 bg-slate-50 border border-slate-200 flex items-center justify-center text-xs text-slate-400 font-mono">
            Broşür için seçilmiş fotoğraf bulunamadı.
          </div>
        )}

        {/* Temel Mülk Özellikleri (Keskin Kutular) */}
        <div className="grid grid-cols-3 gap-3">
          <div className="sharp-card p-3.5 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-0.5">
              Kullanım Alanı
            </span>
            <span className="text-base font-bold font-mono text-[#1d2566] flex items-center gap-1.5">
              <Maximize2 className="w-4 h-4 text-[#00adb5]" />
              {property.area} m² (Brüt)
            </span>
          </div>

          <div className="sharp-card p-3.5 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-0.5">
              Oda Dağılımı
            </span>
            <span className="text-base font-bold font-mono text-[#1d2566] flex items-center gap-1.5">
              <BedDouble className="w-4 h-4 text-[#1d2566]" />
              {property.rooms || "Belirtilmedi"}
            </span>
          </div>

          <div className="sharp-card p-3.5 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-0.5">
              Durum
            </span>
            <span className="text-base font-bold font-mono text-emerald-700">
              Müsait / Randevu İle
            </span>
          </div>
        </div>

        {/* Müşteri Açıklaması */}
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase text-slate-500 font-bold tracking-wider">
            Mülk Detayları ve Özellikleri
          </div>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 border border-slate-200 whitespace-pre-line font-sans">
            {property.publicDescription ||
              "Özel konumlu bu mülkümüz hakkında daha detaylı bilgi ve yer gösterimi randevusu almak için lütfen danışmanımız ile iletişime geçiniz."}
          </p>
        </div>

        {/* İletişim Alt Çubuğu */}
        <div className="p-4 bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#1d2566]">
              İletişim & Randevu:
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Trustline Gayrimenkul Danışmanlığı • Levent / İstanbul
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono text-[#00adb5] font-bold">
              +90 (212) 800 40 40
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              info@trustline.com.tr
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BrosurPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="flex items-center gap-2 text-slate-600 font-mono text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-[#00adb5]" />
            <span>Portföy broşürü yükleniyor...</span>
          </div>
        </div>
      }
    >
      <BrosurContent params={params} />
    </Suspense>
  );
}

