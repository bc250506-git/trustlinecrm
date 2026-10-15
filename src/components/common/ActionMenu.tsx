"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit3, Trash2, CheckCircle2 } from "lucide-react";

interface ActionMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onCloseDeal?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  closeDealLabel?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  className?: string;
  menuPosition?: "left" | "right";
}

export function ActionMenu({
  onEdit,
  onDelete,
  onCloseDeal,
  editLabel = "Düzenle",
  deleteLabel = "Sil",
  closeDealLabel = "İşlem Kapat",
  canEdit = true,
  canDelete = true,
  className = "",
  menuPosition = "right",
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Menü dışına tıklandığında kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!canEdit && !canDelete && !onCloseDeal) return null;

  return (
    <div
      ref={menuRef}
      className={`relative inline-block text-left ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 transition cursor-pointer shadow-2xs"
        title="İşlemler (Düzenle / Sil / İşlem Kapat)"
        aria-label="İşlemler"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          className={`absolute z-40 mt-1 min-w-[210px] w-max max-w-xs bg-white border border-slate-300 shadow-xl py-1 text-xs animate-in fade-in duration-100 ${
            menuPosition === "left" ? "left-0" : "right-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {onCloseDeal && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onCloseDeal();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left font-mono font-medium text-emerald-700 hover:bg-emerald-50 transition cursor-pointer border-b border-slate-100"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{closeDealLabel}</span>
            </button>
          )}

          {canEdit && onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onEdit();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left font-mono font-medium text-slate-700 hover:bg-slate-50 hover:text-[#00adb5] transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#00adb5] shrink-0" />
              <span>{editLabel}</span>
            </button>
          )}

          {canDelete && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onDelete();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left font-mono font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{deleteLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
