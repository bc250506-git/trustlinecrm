"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  itemName?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  title = "Silme Onayı",
  itemName,
  message,
  confirmText = "Evet, Kalıcı Olarak Sil",
  cancelText = "Vazgeç",
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="sharp-card w-full max-w-md bg-white border-2 border-rose-500 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık Alanı */}
        <div className="p-4 border-b border-rose-200 bg-rose-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#1d2566] tracking-wide">
                {title}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                Kalıcı Silme İşlemi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gövde Alanı */}
        <div className="p-5 space-y-3 text-xs">
          {itemName && (
            <div className="p-3 bg-slate-50 border border-slate-200 font-mono font-bold text-slate-800 break-words text-[11px]">
              {itemName}
            </div>
          )}

          <p className="text-slate-600 leading-relaxed font-sans text-xs">
            {message ||
              "Bu kaydı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve ilgili veri sistemden tamamen kaldırılır."}
          </p>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center justify-end gap-2 p-3.5 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-mono font-bold cursor-pointer transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
