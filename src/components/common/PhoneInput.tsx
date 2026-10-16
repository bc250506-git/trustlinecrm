"use client";

import React, { useId } from "react";
import { extractPhone9Digits, formatPhoneWithPrefix } from "@/lib/formatters";

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
  placeholder = "XX) XXX XX XX",
  required = false,
  disabled = false,
  ...rest
}: PhoneInputProps) {
  const autoId = useId();
  const inputId = id || autoId;

  // Ham 9 haneyi çek (kalan 9 hane)
  const digits = extractPhone9Digits(value);

  // Girdi kutusunda görüntülenecek 9 hane maskesi
  const formatDisplay9Digits = (d: string) => {
    if (!d) return "";
    let res = "";
    if (d.length > 0) {
      res += d.slice(0, 2);
    }
    if (d.length >= 2) {
      res += ") ";
    }
    if (d.length > 2) {
      res += d.slice(2, 5);
    }
    if (d.length > 5) {
      res += " " + d.slice(5, 7);
    }
    if (d.length > 7) {
      res += " " + d.slice(7, 9);
    }
    return res;
  };

  const displayVal = formatDisplay9Digits(digits);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const cleanDigits = extractPhone9Digits(rawInput);

    if (!cleanDigits) {
      onChange("");
      return;
    }

    // Tam format: +90 (5XX) XXX XX XX
    const fullFormatted = formatPhoneWithPrefix(cleanDigits);
    onChange(fullFormatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace tuşuna basıldığında parantez/boşluk engeline takılmadan son rakamı sil
    if (e.key === "Backspace" && digits.length > 0) {
      // Normal davranış input onChange'e yansıyacak
    }
  };

  return (
    <div
      className={`flex items-center border border-slate-300 bg-white transition focus-within:border-[#00adb5] focus-within:ring-1 focus-within:ring-[#00adb5] ${
        disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : ""
      }`}
    >
      {/* Sabit Prefiks: +90 (5 */}
      <span className="px-2.5 py-2 bg-slate-100 border-r border-slate-200 text-[#1d2566] font-mono font-bold text-xs select-none shrink-0 flex items-center gap-1">
        <span className="text-[10px] text-slate-500 font-semibold">TR/KKTC</span>
        <span className="text-[#00adb5] font-black">+90</span>
        <span className="text-slate-800 font-bold">(5</span>
      </span>

      {/* Kalan 9 Hanenin Girildiği Alan */}
      <input
        id={inputId}
        type="tel"
        inputMode="numeric"
        value={displayVal}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete="tel"
        className={`w-full p-2 font-mono text-xs text-slate-800 bg-transparent outline-none placeholder:text-slate-400 font-semibold ${className}`}
        {...rest}
      />
    </div>
  );
}
