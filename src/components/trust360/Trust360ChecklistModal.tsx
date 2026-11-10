"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { Trust360Contract, Trust360ChecklistItem, createDefaultTrust360Checklist } from "@/lib/types";
import {
  X,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ClipboardList,
  LogIn,
  LogOut,
  RotateCw,
  Edit2,
  Check,
} from "lucide-react";

interface Trust360ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Trust360Contract;
}

export function Trust360ChecklistModal({
  isOpen,
  onClose,
  contract,
}: Trust360ChecklistModalProps) {
  const { updateTrust360Checklist } = useStore();

  const [items, setItems] = useState<Trust360ChecklistItem[]>(() => {
    if (contract.checklist && contract.checklist.length > 0) {
      return contract.checklist;
    }
    return createDefaultTrust360Checklist();
  });

  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemType, setNewItemType] = useState<"move_in" | "periodic" | "move_out">("move_in");
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");

  if (!isOpen) return null;

  const handleToggleItem = (id: string) => {
    const next = items.map((it) => {
      if (it.id === id) {
        const nextCompleted = !it.completed;
        return {
          ...it,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
      }
      return it;
    });
    setItems(next);
    updateTrust360Checklist(contract.id, next);
  };

  const handleSaveNotes = (id: string) => {
    const next = items.map((it) => {
      if (it.id === id) {
        return { ...it, notes: notesText.trim() || undefined };
      }
      return it;
    });
    setItems(next);
    updateTrust360Checklist(contract.id, next);
    setEditingNotesId(null);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemLabel.trim()) return;

    const newItem: Trust360ChecklistItem = {
      id: `chk-${Date.now()}`,
      label: newItemLabel.trim(),
      type: newItemType,
      completed: false,
    };
    const next = [...items, newItem];
    setItems(next);
    updateTrust360Checklist(contract.id, next);
    setNewItemLabel("");
  };

  const handleDeleteItem = (id: string) => {
    const next = items.filter((it) => it.id !== id);
    setItems(next);
    updateTrust360Checklist(contract.id, next);
  };

  const completedCount = items.filter((it) => it.completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const moveInItems = items.filter((it) => it.type === "move_in");
  const periodicItems = items.filter((it) => it.type === "periodic");
  const moveOutItems = items.filter((it) => it.type === "move_out");

  const renderSection = (
    title: string,
    sectionItems: Trust360ChecklistItem[],
    icon: React.ElementType,
    badgeColor: string
  ) => {
    const IconComp = icon;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
          <div className="flex items-center gap-1.5 font-bold text-xs text-[#1d2566]">
            <IconComp className="w-4 h-4 text-[#00adb5]" />
            <span>{title}</span>
          </div>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-none ${badgeColor}`}>
            {sectionItems.filter((i) => i.completed).length} / {sectionItems.length} Tamamlandı
          </span>
        </div>

        <div className="space-y-1.5">
          {sectionItems.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 border transition flex flex-col gap-1.5 ${
                item.completed
                  ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                  : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleItem(item.id)}
                  className="flex items-start gap-2 text-left cursor-pointer flex-1 group"
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 group-hover:text-[#00adb5] shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-xs ${
                      item.completed ? "line-through text-slate-400 font-medium" : "font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNotesId(item.id);
                      setNotesText(item.notes || "");
                    }}
                    title={item.notes ? "Notu düzenle" : "Not ekle"}
                    className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                    title="Maddeyi kaldır"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Not Görüntüleme */}
              {item.notes && editingNotesId !== item.id && (
                <div className="ml-6 text-[10.5px] font-mono text-slate-600 bg-slate-50 border-l-2 border-[#00adb5] px-2 py-1">
                  {item.notes}
                </div>
              )}

              {/* Not Düzenleme Formu */}
              {editingNotesId === item.id && (
                <div className="ml-6 flex items-center gap-1.5 mt-1">
                  <input
                    type="text"
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Örn: Elektrik sayacı: 42100 kWh, 2 adet klima kumandası teslim edildi..."
                    className="flex-1 px-2 py-1 text-xs border border-slate-300 focus:outline-none focus:border-[#00adb5]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveNotes(item.id)}
                    className="p-1 bg-emerald-600 text-white cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingNotesId(null)}
                    className="p-1 bg-slate-200 text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#1d2566] text-white">
                TRUST 360
              </span>
              <span className="text-xs font-bold text-[#1d2566]">
                Demirbaş & Operasyonel Kontrol Listesi
              </span>
            </div>
            <h2 className="text-sm font-bold text-[#1d2566] tracking-tight mt-0.5 truncate max-w-lg">
              {contract.propertyTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
              <span className="text-slate-700">Genel Tamamlanma Durumu</span>
              <span className="text-[#1d2566]">
                %{progressPercent} ({completedCount}/{items.length})
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Checklist Sections */}
        <div className="p-6 overflow-y-auto space-y-6">
          {renderSection(
            "04 Kiracı Giriş ve Teslim Kontrolleri",
            moveInItems,
            LogIn,
            "bg-blue-100 text-blue-800"
          )}
          {renderSection(
            "01-02 Dönemsel İdari & Bakım Kontrolleri",
            periodicItems,
            RotateCw,
            "bg-purple-100 text-purple-800"
          )}
          {renderSection(
            "04 Kiracı Çıkış & Hasar / Depozito Kontrolleri",
            moveOutItems,
            LogOut,
            "bg-amber-100 text-amber-900"
          )}

          {/* Yeni Madde Ekleme Formu */}
          <form
            onSubmit={handleAddItem}
            className="p-3 bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2 text-xs"
          >
            <select
              value={newItemType}
              onChange={(e) => setNewItemType(e.target.value as any)}
              className="px-2 py-1.5 border border-slate-300 bg-white font-bold text-xs focus:outline-none"
            >
              <option value="move_in">Giriş Kontrolü</option>
              <option value="periodic">Dönemsel Takip</option>
              <option value="move_out">Çıkış Kontrolü</option>
            </select>
            <input
              type="text"
              value={newItemLabel}
              onChange={(e) => setNewItemLabel(e.target.value)}
              placeholder="Yeni kontrol maddesi yazın (Örn: Havuz aydınlatma ampulü yenilendi)..."
              className="flex-1 min-w-[200px] px-2.5 py-1.5 border border-slate-300 bg-white text-xs focus:outline-none focus:border-[#00adb5]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#1d2566] text-white font-bold text-xs hover:bg-[#151a47] transition flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ekle</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1d2566] text-white font-bold text-xs hover:bg-[#151a47] transition cursor-pointer"
          >
            Tamam / Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

