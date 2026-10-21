"use client";

import React, { useState } from "react";
import { Property } from "@/lib/types";
import { useStore } from "@/lib/store";
import {
  X,
  MapPin,
  Maximize2,
  BedDouble,
  ShieldCheck,
  Printer,
  FileDown,
  MessageCircle,
  Award,
  Loader2,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { formatPhoneWithPrefix } from "@/lib/formatters";

interface BrochureModalProps {
  property: Property;
  onClose: () => void;
}

export function BrochureModal({ property, onClose }: BrochureModalProps) {
  const { mandates, users } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const assignedUser =
    users.find((u) => u.id === property.assignedToId) ||
    users.find((u) => u.name.trim().toLowerCase() === property.assignedToName?.trim().toLowerCase()) ||
    users.find((u) => u.id === "usr-volkan") ||
    users[0];

  const isExclusive = mandates.some(
    (m) =>
      (m.propertyId === property.id ||
        (m.propertyTitle &&
          property.title &&
          m.propertyTitle.trim().toLowerCase() === property.title.trim().toLowerCase())) &&
      m.mandateType === "exclusive" &&
      m.status !== "cancelled"
  );

  // Müşteri Paylaşımına Uygun Fotoğraflar (PRD Güvenlik Kuralı)
  const displayPhotos =
    property.photos && property.photos.length > 0
      ? property.photos.filter((p) => p.shareable)
      : property.imageUrl
      ? [{ id: "cover-photo", propertyId: property.id, url: property.imageUrl, shareable: true }]
      : [];

  // Görselleri Canvas Tainting / CORS Hatası Olmadan Base64 Data URL'e Çevirici
  const imageSrcToBase64 = async (src: string): Promise<string> => {
    if (!src) return "";
    if (src.startsWith("data:")) return src;

    // Yerel relative yollar (/logo.png vb.)
    if (src.startsWith("/")) {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error("Local image fetch failed");
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.warn("Local image to base64 failed:", err);
        return src;
      }
    }

    // Harici HTTP/HTTPS görselleri (Unsplash, Supabase CDN vb.) API Proxy üzerinden çek
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
      // Proxy başarısız olursa direkt CORS denemesi yap
      try {
        const directRes = await fetch(src, { mode: "cors" });
        const blob = await directRes.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e2) {
        console.warn("Direct image conversion failed:", e2);
        return src;
      }
    }
  };

  // Broşürden Yüksek Çözünürlüklü Gerçek PDF Blob Üretici
  const generateBrochurePdf = async (): Promise<{ blob: Blob; filename: string }> => {
    const brochureElement = document.getElementById("printable-brochure-content");
    if (!brochureElement) throw new Error("Broşür içeriği bulunamadı.");

    const imgElements = Array.from(brochureElement.querySelectorAll("img"));
    const originalSrcs = imgElements.map((img) => img.src);

    try {
      // 1. Broşürdeki tüm görselleri geçici olarak Base64'e dönüştür (Canvas Tainting %100 önlenir)
      await Promise.all(
        imgElements.map(async (img) => {
          try {
            const b64 = await imageSrcToBase64(img.src);
            if (b64 && b64.startsWith("data:")) {
              img.src = b64;
            }
          } catch (e) {
            console.warn("Image conversion skipped for:", img.src, e);
          }
        })
      );

      // DOM ve imajların render olması için kısa bekleme
      await new Promise((r) => setTimeout(r, 60));

      const canvas = await html2canvas(brochureElement, {
        scale: 2, // Yüksek çözünürlüklü A4 kalitesi
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

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const margin = 8; // 8mm kenar boşluğu
      const printableWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin * 2;
      const imgWidth = printableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= printableHeight * 1.05) {
        // Tek A4 sayfasına orantılı ve net sığdırma
        const finalHeight = Math.min(imgHeight, printableHeight);
        pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, finalHeight);
      } else {
        // Uzun metinlerde sayfaları taşmadan bölme
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
      // Orijinal görsel bağlantılarını eksiksiz geri yükle
      imgElements.forEach((img, i) => {
        img.src = originalSrcs[i];
      });
    }
  };

  // 1. WP PAYLAŞ: PDF Üretip WhatsApp Uygulamasına ve Doğrudan Broşür Linkine Yönlendirir
  const handleShareWhatsApp = async () => {
    try {
      setIsGenerating(true);
      const { blob, filename } = await generateBrochurePdf();
      const pdfFile = new File([blob], filename, { type: "application/pdf" });

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const brochureUrl = `${origin}/brosur/${property.id}`;

      const text = `🏡 *${property.title}*\n📍 *Bölge:* ${property.region}\n💰 *Fiyat:* ${property.price.toLocaleString("tr-TR")} ${property.currency}\n📐 *Kullanım Alanı:* ${property.area} m² (${property.rooms || ""})\n🏢 *Yetkili Danışman:* ${property.assignedToName || "Trustline Estate"}\n\n📄 *Canlı Broşür & PDF İncele:* ${brochureUrl}\n\n*Trustline Estate*`;

      // 1. Web Share API (Mobil ve dosya paylaşımını destekleyen tarayıcılarda doğrudan WhatsApp'a PDF ekler)
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            title: `${property.title} - Trustline Portföy Broşürü`,
            text: text,
            files: [pdfFile],
          });
          return;
        } catch (err: any) {
          if (err.name === "AbortError") return;
        }
      }

      // 2. Masaüstü Fallback: PDF dosyasını bilgisayara otomatik indir ve WhatsApp uygulamasını/webini hazır link ile aç
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const desktopText = `${text}\n\n📎 *PDF Dosyası:* ${filename} dosyanız hazırlandı ve cihazınıza indirildi.`;
      window.open(`https://wa.me/?text=${encodeURIComponent(desktopText)}`, "_blank");
    } catch (err: any) {
      console.error("WhatsApp paylaşım hatası:", err);
      alert("Broşür hazırlanırken bir hata oluştu: " + (err?.message || "Lütfen tekrar deneyiniz."));
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. YAZDIR: Yalnızca Broşür Tasarımını İzole Bir Iframe İle Yazdırır (CRM Arayüzü Asla Çıkmaz)
  const handlePrint = () => {
    const brochureElement = document.getElementById("printable-brochure-content");
    if (!brochureElement) {
      alert("Broşür içeriği bulunamadı.");
      return;
    }

    // İzole gizli iframe oluştur
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      return;
    }

    // Sayfadaki tüm Tailwind ve CSS stillerini iframe içine klonla
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

    // iframe içeriği hazır olduğunda ve görseller render olduğunda yazdır
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Iframe print hatası:", e);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 400);
  };

  // 3. İNDİR: Broşürü Doğrudan Gerçek PDF Dosyası Olarak İndirir (Asla Yazdırma Açmaz)
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

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="brochure-modal-backdrop fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="brochure-modal-container sharp-card w-full h-full sm:h-auto sm:max-h-[92vh] max-w-3xl flex flex-col overflow-hidden bg-white border-0 sm:border border-slate-200 shadow-2xl rounded-none sm:rounded-lg sm:my-auto">
        {/* Güvenlik & İşlem Başlığı (Sadece 3 Net Aksiyon: WP PAYLAŞ, YAZDIR, İNDİR) */}
        <div className="no-print p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0 sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#1d2566] tracking-wide">
                Müşteri Paylaşım Broşürü (Güvenli Görünüm)
              </span>
              <span className="text-[10px] text-emerald-700 font-mono font-medium">
                ✓ Mülk sahibi bilgileri, açık adres ve ofis notları filtrelendi.
              </span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* 1. WP PAYLAŞ */}
            <button
              disabled={isGenerating}
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-60"
              title="Broşür PDF'ini oluşturur ve doğrudan WhatsApp uygulamasına yönlendirir"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <MessageCircle className="w-3.5 h-3.5" />
              )}
              <span>WP PAYLAŞ</span>
            </button>

            {/* 2. YAZDIR */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Doğrudan yazdırma ekranını aç"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>YAZDIR</span>
            </button>

            {/* 3. İNDİR */}
            <button
              disabled={isGenerating}
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 bg-[#1d2566] hover:bg-[#151b4d] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-60"
              title="Broşürü PDF dosyası olarak indir"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00adb5]" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-[#00adb5]" />
              )}
              <span>İNDİR</span>
            </button>

            {/* Kapat Butonu */}
            <button
              onClick={onClose}
              className="p-1.5 bg-white border border-slate-300 hover:border-rose-400 hover:text-rose-600 text-slate-500 transition ml-1 cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Müşterinin Göreceği Profesyonel Broşür Alanı (Ferah Beyaz) */}
        <div className="flex-1 overflow-y-auto">
          <div id="printable-brochure-content" className="printable-brochure p-8 space-y-6 text-slate-800 bg-white">
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
              Broşür için seçilmiş halka açık fotoğraf bulunamadı.
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
          <div className="p-4 bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-[#1d2566]">
                İletişim & Randevu: {assignedUser?.name || property.assignedToName || "Trustline Estate"}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Trustline Estate • Kaan Otel Karşısı, Kemal Yapar Sk-No :1, Girne 99300
              </div>
            </div>
            <div className="text-right shrink-0">
              {assignedUser?.phone && (
                <div className="text-xs font-mono text-[#00adb5] font-bold">
                  Danışman: {formatPhoneWithPrefix(assignedUser.phone) || assignedUser.phone}
                </div>
              )}
              <div className="text-xs font-mono text-[#1d2566] font-bold">
                Ofis: +90 533 846 00 80
              </div>
              {assignedUser?.email ? (
                <div className="text-[10px] text-slate-500 font-mono">
                  {assignedUser.email}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
