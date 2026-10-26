"use client";

import React, { useId } from "react";
import { Phone } from "lucide-react";

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  className = "",
  id,
  placeholder = "Örn: +90 533 123 4567 veya +44 7911 123456",
  required = false,
  disabled = false,
  ...rest
}: PhoneInputProps) {
  const autoId = useId();
  const inputId = id || autoId;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    // Yalnızca geçerli telefon karakterlerine izin ver: rakamlar (0-9), başta +, boşluk, tire (-), parantez ()
    let cleaned = raw.replace(/[^0-9+() -]/g, "");
    
    // Eğer '+' işareti varsa yalnızca en başta olabilir
    if (cleaned.includes("+")) {
      const hasLeadingPlus = cleaned.startsWith("+");
      cleaned = (hasLeadingPlus ? "+" : "") + cleaned.replace(/\+/g, "");
    }

    onChange(cleaned);
  };

  return (
    <div
      className={`flex items-center border border-slate-300 bg-white transition focus-within:border-[#00adb5] focus-within:ring-1 focus-within:ring-[#00adb5] h-[38px] ${
        disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : ""
      } ${className}`}
    >
      {/* Telefon İkonu & Gösterge */}
      <span className="px-2.5 h-full bg-slate-50 border-r border-slate-200 text-slate-500 font-mono text-xs select-none shrink-0 flex items-center gap-1.5">
        <Phone className="w-3.5 h-3.5 text-[#00adb5]" />
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider hidden sm:inline">Tel</span>
      </span>

      {/* Yerli ve Yabancı Numaralar İçin Esnek Metin Giriş Alanı */}
      <input
        id={inputId}
        type="tel"
        inputMode="tel"
        value={value || ""}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete="tel"
        className="w-full h-full px-3 font-mono text-xs text-slate-800 bg-transparent outline-none placeholder:text-slate-400 font-medium"
        {...rest}
      />
    </div>
  );
}

