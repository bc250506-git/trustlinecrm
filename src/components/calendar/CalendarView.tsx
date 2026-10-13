"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { FollowUp } from "@/lib/types";
import {
  CalendarDays,
  Plus,
  Clock,
  Phone,
  MessageSquare,
  CheckCircle2,
  Calendar as CalendarIcon,
  X,
  User,
  Building,
  Trash2,
  Edit3,
  Users,
  Megaphone,
  Sparkles,
} from "lucide-react";
import { ActionMenu } from "@/components/common/ActionMenu";
import { DeleteConfirmModal } from "@/components/common/DeleteConfirmModal";
import { AddFollowUpModal } from "@/components/modals/AddFollowUpModal";

export function CalendarView() {
  const {
    followUps,
    addFollowUp,
    updateFollowUp,
    postponeFollowUp,
    completeFollowUp,
    deleteFollowUp,
    canManageFollowUp,
    customers,
    myCustomers,
    properties,
    myProperties,
    currentUser,
    isBroker,
  } = useStore();

  const activeCustomers = isBroker ? customers : myCustomers;
  const activeProperties = isBroker ? properties : myProperties;

  const [filterKind, setFilterKind] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("open");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Silme Onay Modalı State
  const [followUpToDelete, setFollowUpToDelete] = useState<FollowUp | null>(null);

  // Görev Düzenleme Modalı State
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [editFormTitle, setEditFormTitle] = useState("");
  const [editFormKind, setEditFormKind] = useState<"call" | "meeting" | "showing" | "office_event" | "other">("showing");
  const [editFormDate, setEditFormDate] = useState("");
  const [editFormTime, setEditFormTime] = useState("");
  const [editFormStatus, setEditFormStatus] = useState<"open" | "done" | "cancelled">("open");
  const [editFormFeedback, setEditFormFeedback] = useState("");

  const handleOpenEditFollowUp = (t: FollowUp) => {
    setEditingFollowUp(t);
    setEditFormTitle(t.title);
    setEditFormKind(t.kind);
    const datePart = t.dueAt ? t.dueAt.split("T")[0] : new Date().toISOString().split("T")[0];
    const timePart = t.dueAt && t.dueAt.includes("T") ? t.dueAt.split("T")[1]?.slice(0, 5) : "14:00";
    setEditFormDate(datePart);
    setEditFormTime(timePart || "14:00");
    setEditFormStatus(t.status);
    setEditFormFeedback(t.feedback || "");
  };

  const handleSaveFollowUpEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFollowUp) return;
    updateFollowUp(editingFollowUp.id, {
      title: editFormTitle,
      kind: editFormKind,
      dueAt: `${editFormDate}T${editFormTime || "12:00"}:00`,
      status: editFormStatus,
      feedback: editFormFeedback,
    });
    setEditingFollowUp(null);
  };

  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  React.useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  React.useEffect(() => {
    if (isAddModalOpen || editingFollowUp || followUpToDelete) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isAddModalOpen, editingFollowUp, followUpToDelete]);

  const filteredTasks = followUps.filter((f) => {
    if (filterKind !== "ALL") {
      if (filterKind === "office_event") {
        if (!f.isOfficeEvent && f.kind !== "office_event") return false;
      } else if (f.kind !== filterKind) {
        return false;
      }
    }
    if (filterStatus !== "ALL" && f.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Üst Başlık */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#00adb5] font-bold tracking-wider uppercase">
              AJANDA & GÖREV PLANLAYICI
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              Randevu ve Yer Gösterme Yönetimi
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1d2566] tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#00adb5]" />
            Ajanda ve Takip Programı
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Yer göstermeleri, telefon aramalarını ve müşteri randevularını yönetin;
            sonuçları ve ertelemeleri kaydedin.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="sharp-btn-primary px-4 py-2 text-xs flex items-center gap-2 cursor-pointer self-start md:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Randevu / Arama Planla</span>
        </button>
      </div>

      {/* Filtre Çubuğu */}
      <div className="sharp-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {/* Tür Filtresi */}
          <div className="flex items-center bg-slate-100 border border-slate-200 p-0.5">
            {[
              { id: "ALL", label: "Tüm Türler" },
              { id: "showing", label: "Yer Gösterme" },
              { id: "meeting", label: "Görüşme" },
              { id: "call", label: "Arama" },
              { id: "office_event", label: "Ofis Etkinlikleri" },
              { id: "other", label: "Diğer" },
            ].map((k) => (
              <button
                key={k.id}
                onClick={() => setFilterKind(k.id)}
                className={`px-2.5 py-1 text-[11px] font-mono transition cursor-pointer ${
                  filterKind === k.id
                    ? "bg-[#1d2566] text-white font-bold shadow-2xs"
                    : "text-slate-600 hover:text-[#1d2566]"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>

          {/* Durum Filtresi */}
          <div className="flex items-center bg-slate-100 border border-slate-200 p-0.5">
            {[
              { id: "open", label: "Açık / Bekleyen" },
              { id: "done", label: "Tamamlananlar" },
              { id: "ALL", label: "Tümü" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterStatus(s.id)}
                className={`px-2.5 py-1 text-[11px] font-mono transition cursor-pointer ${
                  filterStatus === s.id
                    ? "bg-slate-200 text-[#1d2566] font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-500 font-medium">
          {filteredTasks.length} Görev Listeleniyor
        </div>
      </div>

      {/* Görev Kartları Listesi */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="sharp-card p-12 text-center text-slate-400 font-mono text-xs">
            Seçili kriterlere uygun randevu veya takip bulunamadı.
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isDone = t.status === "done";
            const isPast = currentDate ? new Date(t.dueAt) < currentDate && !isDone : false;
            const isOffice = t.isOfficeEvent || t.kind === "office_event";

            return (
              <div
                key={t.id}
                className={`sharp-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                  isOffice
                    ? isDone
                      ? "bg-purple-50/50 border-purple-200 opacity-60 shadow-xs border-l-4 border-l-purple-400"
                      : "bg-gradient-to-r from-purple-50/80 via-indigo-50/40 to-white border-purple-300 border-l-4 border-l-purple-600 shadow-sm hover:border-purple-500"
                    : isDone
                    ? "opacity-60 bg-slate-50"
                    : "hover:border-[#00adb5]"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {isOffice ? (
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 border font-bold bg-purple-100 text-purple-900 border-purple-300 flex items-center gap-1 shadow-2xs">
                        <Users className="w-3 h-3 text-purple-700" />
                        OFİS ETKİNLİĞİ • TÜM EKİP
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 border font-bold ${
                          t.kind === "showing"
                            ? "bg-[#1d2566]/10 text-[#1d2566] border-[#1d2566]/20"
                            : t.kind === "meeting"
                            ? "bg-[#00adb5]/10 text-[#00adb5] border-[#00adb5]/30"
                            : t.kind === "call"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        {t.kind === "showing"
                          ? "Yer Gösterme"
                          : t.kind === "meeting"
                          ? "Yüz Yüze Görüşme"
                          : t.kind === "call"
                          ? "Telefon Araması"
                          : "Genel Görev"}
                      </span>
                    )}

                    {isPast && (
                      <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 border border-rose-300 font-bold">
                        VADESİ GEÇTİ
                      </span>
                    )}

                    {isDone && (
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-300 font-bold">
                        TAMAMLANDI ({t.outcome})
                      </span>
                    )}

                    <span className="text-xs font-mono text-slate-600 font-medium">
                      {new Date(t.dueAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        weekday: "short",
                      })}
                      {t.hasSpecificTime !== false && t.dueAt.includes("T") && !t.dueAt.endsWith("T00:00:00") ? (
                        <>
                          {" "}
                          -{" "}
                          {new Date(t.dueAt).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </>
                      ) : (
                        <span className="ml-1 text-[11px] text-slate-500 font-normal italic">
                          (Saat Belirtilmedi / Tüm Gün)
                        </span>
                      )}
                    </span>
                  </div>

                  <h3
                    className={`text-xs font-bold ${
                      isDone
                        ? "line-through text-slate-400"
                        : isOffice
                        ? "text-purple-950 font-extrabold flex items-center gap-1.5"
                        : "text-[#1d2566]"
                    }`}
                  >
                    {isOffice && <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                    {t.title}
                  </h3>

                  <div className="text-[11px] text-slate-600 font-mono flex flex-wrap items-center gap-3">
                    {isOffice ? (
                      <>
                        <span className="text-purple-900 font-bold flex items-center gap-1">
                          <Users className="w-3 h-3 text-purple-600" />
                          Tüm Ofis Ekibi & Danışmanlar Ortak Takviminde
                        </span>
                        {t.createdByName && (
                          <span className="text-slate-600">• Düzenleyen: {t.createdByName}</span>
                        )}
                        {t.propertyTitle && (
                          <span className="text-slate-500 line-clamp-1">
                            • İlgili Mülk: {t.propertyTitle}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {t.customerName ? (
                          <span className="text-slate-800 font-semibold">
                            Müşteri: {t.customerName}
                            {t.customerPhone && (
                              <span className="text-slate-500 font-normal"> ({t.customerPhone})</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Müşteri Bağımsız</span>
                        )}
                        {t.propertyTitle && (
                          <span className="text-slate-500 line-clamp-1">
                            • {t.propertyTitle}
                          </span>
                        )}
                        <span>• Danışman: {t.assignedToName || "Atanmadı"}</span>
                      </>
                    )}
                  </div>

                  {t.feedback && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 border border-slate-200 italic">
                      Sonuç Notu: {t.feedback}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isDone && (
                    <>
                      <button
                        onClick={() => postponeFollowUp(t.id)}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 hover:border-amber-500 text-amber-800 text-xs font-mono font-medium transition cursor-pointer"
                      >
                        Yarına Ertele
                      </button>
                      <button
                        onClick={() =>
                          completeFollowUp(t.id, "attended", "Görüşme tamamlandı.")
                        }
                        className="sharp-btn-emerald px-3 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tamamla</span>
                      </button>
                    </>
                  )}
                  {canManageFollowUp(t) && (
                    <ActionMenu
                      onEdit={() => handleOpenEditFollowUp(t)}
                      onDelete={() => setFollowUpToDelete(t)}
                      canEdit={canManageFollowUp(t)}
                      canDelete={canManageFollowUp(t)}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Standardize Yeni Takip & Randevu Ekle Modalı */}
      <AddFollowUpModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* GÖREV DÜZENLEME MODALI */}
      {editingFollowUp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="sharp-card w-full max-w-lg bg-white border border-slate-300 shadow-2xl">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#00adb5]" />
                <h3 className="text-xs font-bold text-[#1d2566]">
                  Takip & Randevuyu Düzenle
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingFollowUp(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFollowUpEdit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                  Aksiyon / Görev Başlığı *
                </label>
                <input
                  type="text"
                  required
                  value={editFormTitle}
                  onChange={(e) => setEditFormTitle(e.target.value)}
                  className="sharp-input w-full p-2"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                  Görüşme / İşlem Türü
                </label>
                <select
                  value={editFormKind}
                  onChange={(e) =>
                    setEditFormKind(
                      e.target.value as any
                    )
                  }
                  className="sharp-input w-full p-2 font-mono bg-white"
                >
                  <option value="showing">Yer Gösterme (Portföy Sunumu)</option>
                  <option value="meeting">Yüz Yüze Görüşme</option>
                  <option value="call">Telefon Görüşmesi / Takip</option>
                  <option value="office_event">Ofis Toplantısı / Etkinlik</option>
                  <option value="other">Diğer</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Tarih *
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormDate}
                    onChange={(e) => setEditFormDate(e.target.value)}
                    className="sharp-input w-full p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Saat (Opsiyonel)
                  </label>
                  <input
                    type="time"
                    value={editFormTime}
                    onChange={(e) => setEditFormTime(e.target.value)}
                    className="sharp-input w-full p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                  Durum
                </label>
                <select
                  value={editFormStatus}
                  onChange={(e) =>
                    setEditFormStatus(
                      e.target.value as "open" | "done" | "cancelled"
                    )
                  }
                  className="sharp-input w-full p-2 font-mono bg-white font-bold"
                >
                  <option value="open">Açık (Bekliyor)</option>
                  <option value="done">Tamamlandı</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                  Görüşme Notu / Geri Bildirim
                </label>
                <textarea
                  rows={2}
                  value={editFormFeedback}
                  onChange={(e) => setEditFormFeedback(e.target.value)}
                  className="sharp-input w-full p-2"
                  placeholder="Görüşme sonucu veya müşteri geri bildirimi..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingFollowUp(null)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="sharp-btn-primary px-4 py-1.5 font-bold text-white shadow-2xs cursor-pointer"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SİLME ONAY MODALI */}
      <DeleteConfirmModal
        isOpen={!!followUpToDelete}
        title="Ajanda Görevini Sil"
        itemName={followUpToDelete ? followUpToDelete.title : undefined}
        message="Bu ajanda randevusu / takip görevi kalıcı olarak silinecektir."
        onConfirm={() => {
          if (followUpToDelete) {
            deleteFollowUp(followUpToDelete.id);
            setFollowUpToDelete(null);
          }
        }}
        onCancel={() => setFollowUpToDelete(null)}
      />
    </div>
  );
}
