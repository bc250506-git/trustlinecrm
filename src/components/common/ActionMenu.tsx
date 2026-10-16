"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    openUpwards: boolean;
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hesaplama: Ekran sınırları, drop-down vs drop-up akıllı yönü
  const calculateCoords = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Menü yüksekliği ortalama 80-140px. Altta 150px'den az yer varsa ve üstte daha fazla yer varsa yukarı açılır
    const openUpwards = spaceBelow < 150 && spaceAbove > spaceBelow;

    const newCoords: {
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
      openUpwards: boolean;
    } = { openUpwards };

    if (openUpwards) {
      newCoords.bottom = Math.max(8, window.innerHeight - rect.top + 4);
    } else {
      newCoords.top = Math.max(8, rect.bottom + 4);
    }

    if (menuPosition === "left") {
      newCoords.left = Math.max(8, Math.min(rect.left, window.innerWidth - 220));
    } else {
      const rightDistance = window.innerWidth - rect.right;
      newCoords.right = Math.max(8, Math.min(rightDistance, window.innerWidth - 220));
    }

    setCoords(newCoords);
  }, [menuPosition]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      calculateCoords();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Dışarı tıklama, scroll veya esc tuşunda menüyü kapat
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current && buttonRef.current.contains(target)) {
        return;
      }
      if (menuRef.current && menuRef.current.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!canEdit && !canDelete && !onCloseDeal) return null;

  const menuDropdown = (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: coords?.top !== undefined ? `${coords.top}px` : "auto",
        bottom: coords?.bottom !== undefined ? `${coords.bottom}px` : "auto",
        left: coords?.left !== undefined ? `${coords.left}px` : "auto",
        right: coords?.right !== undefined ? `${coords.right}px` : "auto",
        zIndex: 99999,
      }}
      className="min-w-[210px] w-max max-w-xs bg-white border border-slate-300 shadow-2xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100"
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
  );

  return (
    <div
      className={`relative inline-block text-left ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`p-1.5 border transition cursor-pointer shadow-2xs ${
          isOpen
            ? "bg-slate-100 text-[#00adb5] border-[#00adb5]"
            : "bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200 hover:border-slate-300"
        }`}
        title="İşlemler (Düzenle / Sil / İşlem Kapat)"
        aria-label="İşlemler"
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {mounted && isOpen && coords && typeof document !== "undefined"
        ? createPortal(menuDropdown, document.body)
        : null}
    </div>
  );
}
