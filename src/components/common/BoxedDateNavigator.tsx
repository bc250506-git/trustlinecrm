"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BoxedDateNavigatorProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  prevTitle?: string;
  nextTitle?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  disabledPrev?: boolean;
  disabledNext?: boolean;
}

export function BoxedDateNavigator({
  label,
  onPrev,
  onNext,
  prevTitle = "Önceki",
  nextTitle = "Sonraki",
  badge,
  icon,
  className = "",
  disabledPrev = false,
  disabledNext = false,
}: BoxedDateNavigatorProps) {
  return (
    <div
      className={`inline-flex items-center border border-slate-300 bg-white shadow-2xs font-mono h-9 select-none ${className}`}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={disabledPrev}
        className="h-full px-2.5 sm:px-3 border-r border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent text-slate-700 hover:text-[#1d2566] transition cursor-pointer flex items-center justify-center active:bg-slate-200"
        title={prevTitle}
        aria-label={prevTitle}
      >
        <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
      </button>

      <div className="h-full px-3.5 sm:px-5 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#1d2566] tracking-wide uppercase min-w-[130px] sm:min-w-[160px]">
        {icon}
        <span>{label}</span>
        {badge}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={disabledNext}
        className="h-full px-2.5 sm:px-3 border-l border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent text-slate-700 hover:text-[#1d2566] transition cursor-pointer flex items-center justify-center active:bg-slate-200"
        title={nextTitle}
        aria-label={nextTitle}
      >
        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
      </button>
    </div>
  );
}
