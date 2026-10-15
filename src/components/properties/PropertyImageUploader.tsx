"use client";

import React, { useState, useRef } from "react";
import { optimizeImageToWebP } from "@/lib/imageOptimizer";
import {
  UploadCloud,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface PropertyImageUploaderProps {
  imageUrl?: string;
  onChange: (url: string | undefined) => void;
  disabled?: boolean;
}

export function PropertyImageUploader({
  imageUrl,
  onChange,
  disabled = false,
}: PropertyImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileSizeKb, setFileSizeKb] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Lütfen yalnızca resim dosyası seçin (JPG, PNG, WebP).");
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);
      const res = await optimizeImageToWebP(file, 1200, 900, 0.75);
      setFileSizeKb(res.sizeKb);
      onChange(res.dataUrl);
    } catch (err: any) {
      setErrorMsg(err?.message || "Görsel optimize edilirken bir hata oluştu.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Aynı dosyayı tekrar seçebilmek için input değerini sıfırla
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveImage = () => {
    onChange(undefined);
    setFileSizeKb(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-slate-700 font-mono text-[11px] font-bold flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#00adb5]" />
          <span>PORTFÖY KAPAK GÖRSELİ (OPSİYONEL • EN FAZLA 1 ADET)</span>
        </label>
        {imageUrl && (
          <span className="text-[10px] font-mono text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {fileSizeKb ? `${fileSizeKb} KB (WebP Optimize)` : "WebP Optimize"}
          </span>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        disabled={disabled || isProcessing}
      />

      {/* 1. Yükleme / İşlenme Durumu */}
      {isProcessing && (
        <div className="h-36 border-2 border-dashed border-[#00adb5] bg-[#00adb5]/5 flex flex-col items-center justify-center gap-2 text-center p-4">
          <Loader2 className="w-6 h-6 text-[#00adb5] animate-spin" />
          <span className="text-xs font-mono font-bold text-[#1d2566]">
            Görsel WebP formatında optimize ediliyor...
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Boyut minimize ediliyor, veritabanı kotası korunuyor (~40 KB)
          </span>
        </div>
      )}

      {/* 2. Mevcut Görsel Önizleme Durumu */}
      {!isProcessing && imageUrl && (
        <div className="relative border border-slate-300 bg-slate-100 overflow-hidden group shadow-2xs">
          <div className="relative h-44 w-full bg-slate-900/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Portföy Kapak Görseli"
              className="w-full h-full object-cover object-center"
            />
            {/* Bilgi Rozeti */}
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1">
              <span>Maksimum 1 Görsel</span>
              {fileSizeKb && <span>• {fileSizeKb} KB</span>}
            </div>
          </div>

          {/* Alt Hızlı Aksiyonlar */}
          <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className="w-3 h-3 text-[#00adb5]" />
              <span>Görseli Değiştir</span>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={handleRemoveImage}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3 text-rose-600" />
              <span>Görseli Sil</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Boş Durum (Görsel Seçme Alanı) */}
      {!isProcessing && !imageUrl && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed p-4 text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
            isDragging
              ? "border-[#00adb5] bg-[#00adb5]/10"
              : "border-slate-300 hover:border-[#00adb5] bg-slate-50/70 hover:bg-white"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="w-9 h-9 bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-[#00adb5] mb-0.5">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-[#1d2566]">
            Görsel Yüklemek İçin Tıklayın veya Sürükleyin
          </div>
          <p className="text-[10px] text-slate-500 font-mono max-w-sm leading-relaxed">
            Maksimum 1 görsel. Sistem otomatik olarak <strong>WebP</strong> formatına dönüştürüp <strong>~40 KB</strong> seviyesine sıkıştırır.
          </p>
        </div>
      )}

      {/* Hata Mesajı */}
      {errorMsg && (
        <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-mono flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
