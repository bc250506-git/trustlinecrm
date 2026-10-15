"use client";

import React, { useState } from "react";
import { Property } from "@/lib/types";
import { useStore } from "@/lib/store";
import {
  X,
  Share2,
  Building2,
  MapPin,
  Maximize2,
  BedDouble,
  ShieldCheck,
  Check,
  Copy,
  Printer,
  FileDown,
  MessageCircle,
  ExternalLink,
  Award,
} from "lucide-react";

interface BrochureModalProps {
  property: Property;
  onClose: () => void;
}

export function BrochureModal({ property, onClose }: BrochureModalProps) {
  const { mandates } = useStore();
  const [copied, setCopied] = useState(false);

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
  const displayPhotos = property.photos.filter((p) => p.shareable);

  const handleCopyLink = () => {
    const brochureLink = `${window.location.origin}/brosur/${property.id}`;
    navigator.clipboard.writeText(brochureLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const brochureLink = `${window.location.origin}/brosur/${property.id}`;
    const text = `🏡 *${property.title}*\n📍 *Bölge:* ${property.region}\n💰 *Fiyat:* ${property.price.toLocaleString("tr-TR")} ${property.currency}\n📐 *Kullanım:* ${property.area} m² (${property.rooms || ""})\n\n📄 *Broşür Detayları ve Fotoğraflar için:* ${brochureLink}\n\n*Trustline Gayrimenkul Danışmanlığı*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleNativeShare = async () => {
    const brochureLink = `${window.location.origin}/brosur/${property.id}`;
    const shareData = {
      title: `${property.title} - Trustline Portföy Broşürü`,
      text: `${property.title} | ${property.price.toLocaleString("tr-TR")} ${property.currency} | ${property.region}`,
      url: brochureLink,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {}
    }
    handleCopyLink();
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="brochure-modal-backdrop fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="sharp-card w-full max-w-3xl bg-white border border-slate-200 shadow-2xl my-8">
        {/* Güvenlik & İşlem Başlığı (Ofis Tarafı) */}
        <div className="no-print p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
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
            {/* WhatsApp ile Paylaş Butonu */}
            <button
              onClick={handleShareWhatsApp}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="WhatsApp ile Müşteriye Gönder"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {/* PDF İndir / Kaydet Butonu */}
            <button
              onClick={handleDownloadPdf}
              className="px-2.5 py-1 bg-[#1d2566] hover:bg-[#151b4d] text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Broşürü PDF olarak bilgisayara / telefona kaydet"
            >
              <FileDown className="w-3.5 h-3.5 text-[#00adb5]" />
              <span>PDF İndir</span>
            </button>

            {/* Doğrudan Yazdır Butonu */}
            <button
              onClick={() => window.print()}
              className="px-2 py-1 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-mono flex items-center gap-1 transition cursor-pointer"
              title="Yazdır"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Yazdır</span>
            </button>

            {/* Cihaz Paylaşım Menüsü (Mobil / Web Share API) */}
            <button
              onClick={handleNativeShare}
              className="p-1.5 bg-white border border-slate-300 hover:border-[#00adb5] text-slate-700 transition cursor-pointer"
              title="Cihaz Paylaşımı (Paylaş Menüsü)"
            >
              <Share2 className="w-3.5 h-3.5 text-[#00adb5]" />
            </button>

            {/* Link Kopyala */}
            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:border-[#00adb5] text-xs font-mono text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Müşteri Broşür Bağlantısını Kopyala"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Kopyalandı!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Link
                </>
              )}
            </button>

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
        <div className="printable-brochure p-8 space-y-6 text-slate-800 bg-white">
          {/* Broşür Üst Başlığı & Orijinal Logo */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-5">
            <div>
              <img
                src="/logo.png"
                alt="Trustline Real Estate"
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
                    className="w-full h-56 object-cover object-center hover:scale-103 transition duration-500"
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
    </div>
  );
}
