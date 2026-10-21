"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { Calendar } from "lucide-react";

export interface DateInputProps {
  value: string; // ISO format "YYYY-MM-DD" or empty ""
  onChange: (isoDate: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  min?: string;
  max?: string;
}

/**
 * ISO (YYYY-MM-DD) -> TR (GG/AA/YYYY)
 */
function isoToTr(iso: string): string {
  if (!iso || typeof iso !== "string") return "";
  const parts = iso.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    if (y && m && d) {
      return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
    }
  }
  return "";
}

/**
 * TR (GG/AA/YYYY veya GG.AA.YYYY) -> ISO (YYYY-MM-DD)
 */
function trToIso(tr: string): string | null {
  if (!tr) return null;
  const cleaned = tr.replace(/[^\d]/g, "");
  if (cleaned.length !== 8) return null;

  const day = parseInt(cleaned.slice(0, 2), 10);
  const month = parseInt(cleaned.slice(2, 4), 10);
  const year = parseInt(cleaned.slice(4, 8), 10);

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900 || year > 2100) return null;

  // Ayın gün sayısı kontrolü
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return null;

  const dStr = String(day).padStart(2, "0");
  const mStr = String(month).padStart(2, "0");
  const yStr = String(year);

  return `${yStr}-${mStr}-${dStr}`;
}

export function DateInput({
  value,
  onChange,
  placeholder = "GG/AA/YYYY",
  className = "",
  disabled = false,
  required = false,
  id,
  min,
  max,
}: DateInputProps) {
  const autoId = useId();
  const inputId = id || autoId;
  const pickerRef = useRef<HTMLInputElement>(null);

  // Ekranda görüntülenecek GG/AA/YYYY formatındaki metin
  const [displayText, setDisplayText] = useState(() => isoToTr(value));

  // Üst componentten gelen value değiştikçe displayText'i senkronize et
  useEffect(() => {
    setDisplayText(isoToTr(value));
  }, [value]);

  // Metin kutusunda tuşlama maskelemesi (GG/AA/YYYY)
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "").slice(0, 8);

    let formatted = "";
    if (digits.length > 0) {
      formatted += digits.slice(0, 2);
    }
    if (digits.length >= 2) {
      formatted += "/" + digits.slice(2, 4);
    }
    if (digits.length >= 4) {
      formatted += "/" + digits.slice(4, 8);
    }

    setDisplayText(formatted);

    if (digits.length === 8) {
      const parsedIso = trToIso(formatted);
      if (parsedIso) {
        onChange(parsedIso);
      }
    } else if (digits.length === 0) {
      onChange("");
    }
  };

  const handleBlur = () => {
    if (!displayText) {
      onChange("");
      return;
    }
    const parsedIso = trToIso(displayText);
    if (parsedIso) {
      onChange(parsedIso);
      setDisplayText(isoToTr(parsedIso));
    } else {
      // Geçersiz format girildiyse önceki geçerli değere geri dön
      setDisplayText(isoToTr(value));
    }
  };

  // Takvim ikonuna tıklandığında yerel takvim seçicisini aç
  const handleOpenPicker = () => {
    if (disabled) return;
    try {
      if (pickerRef.current) {
        if ("showPicker" in HTMLInputElement.prototype) {
          pickerRef.current.showPicker();
        } else {
          pickerRef.current.focus();
        }
      }
    } catch {
      pickerRef.current?.focus();
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIso = e.target.value;
    onChange(newIso);
    setDisplayText(isoToTr(newIso));
  };

  return (
    <div
      className={`relative flex items-center border border-slate-300 bg-white transition focus-within:border-[#00adb5] focus-within:ring-1 focus-within:ring-[#00adb5] h-[38px] ${
        disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : ""
      } ${className}`}
    >
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        value={displayText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="w-full h-full py-1.5 px-2.5 text-xs font-mono font-medium text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none"
      />

      {/* Takvim Butonu & İkonu */}
      <div className="relative flex items-center justify-center p-1.5 mr-1 text-slate-400 hover:text-[#00adb5] hover:bg-slate-100 rounded transition shrink-0 cursor-pointer">
        <Calendar className="w-4 h-4 pointer-events-none" />
        <input
          ref={pickerRef}
          type="date"
          value={value || ""}
          onChange={handlePickerChange}
          min={min}
          max={max}
          disabled={disabled}
          tabIndex={-1}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          title="Takvimden Tarih Seç (GG/AA/YYYY)"
        />
      </div>
    </div>
  );
}
