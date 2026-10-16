"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Customer, PipelineStage, Currency } from "@/lib/types";
import { KKTC_DISTRICTS, getRegionsByDistrict } from "@/lib/kktcLocations";
import {
  Kanban,
  Plus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Phone,
  MessageSquare,
  Sparkles,
  Flame,
  ChevronRight,
  X,
  Trash2,
  Lock,
  Edit3,
  User,
  Building,
  DollarSign,
  MapPin,
} from "lucide-react";
import { ActionMenu } from "@/components/common/ActionMenu";
import { DeleteConfirmModal } from "@/components/common/DeleteConfirmModal";
import { AddCustomerModal } from "@/components/modals/AddCustomerModal";
import { AddPropertyModal } from "@/components/modals/AddPropertyModal";

const STAGES: { id: PipelineStage; label: string; color: string }[] = [
  { id: "NEW", label: "Yeni Lead", color: "border-t-[#00adb5]" },
  { id: "CONTACTED", label: "İlk Temas", color: "border-t-cyan-600" },
  { id: "QUALIFIED", label: "İhtiyaç Analizi", color: "border-t-teal-600" },
  { id: "LISTING_SENT", label: "Portföy Paylaşıldı", color: "border-t-sky-600" },
  { id: "APPOINTMENT", label: "Randevu", color: "border-t-[#1d2566]" },
  { id: "SHOWING", label: "Yer Gösterimi", color: "border-t-indigo-600" },
  { id: "OFFER", label: "Teklif / Pazarlık", color: "border-t-amber-500" },
  { id: "WON", label: "Kazanıldı (Satış/Kira)", color: "border-t-emerald-600" },
  { id: "LOST", label: "Kaybedildi", color: "border-t-rose-600" },
];

export function PipelineView() {
  const {
    customers,
    myCustomers,
    updateCustomer,
    deleteCustomer,
    canManageCustomer,
    isBroker,
    users,
    currentUser,
    properties,
    addCustomer,
  } = useStore();

  const activeCustomers = (isBroker ? customers : myCustomers).filter((c) => !c.deletedAt);

  // Yeni Satış Süreci Modalı State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formStage, setFormStage] = useState<PipelineStage>("NEW");
  const [formBudget, setFormBudget] = useState("");
  const [formCurrency, setFormCurrency] = useState<Currency>("GBP");
  const [formTemperature, setFormTemperature] = useState<"hot" | "warm" | "cold">("warm");
  const [formDistrict, setFormDistrict] = useState(KKTC_DISTRICTS[0]);
  const [formSubRegion, setFormSubRegion] = useState(getRegionsByDistrict(KKTC_DISTRICTS[0])[0] || "");
  const [formPropertyId, setFormPropertyId] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formAdvisorId, setFormAdvisorId] = useState(currentUser.id);

  // Standart Modal Entegrasyonu (Müşteri & Portföy)
  const [isAddCustSubModalOpen, setIsAddCustSubModalOpen] = useState(false);
  const [isAddPropertySubModalOpen, setIsAddPropertySubModalOpen] = useState(false);

  const [closingModal, setClosingModal] = useState<{
    customer: Customer;
    stage: "WON" | "LOST";
  } | null>(null);

  const [closingNotes, setClosingNotes] = useState("");

  // Silme Onay Modalı State
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Satış Süreci Düzenleme Modalı State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editCustStage, setEditCustStage] = useState<PipelineStage>("NEW");
  const [editCustBudget, setEditCustBudget] = useState("");
  const [editCustBudgetCurrency, setEditCustBudgetCurrency] = useState<Currency>("GBP");
  const [editCustTemperature, setEditCustTemperature] = useState<"hot" | "warm" | "cold">("warm");
  const [editCustRegion, setEditCustRegion] = useState("");
  const [editCustNotes, setEditCustNotes] = useState("");

  const handleOpenEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setEditCustStage(c.stage);
    setEditCustBudget(c.budget ? String(c.budget) : "");
    setEditCustBudgetCurrency(c.budgetCurrency || "GBP");
    setEditCustTemperature(c.temperature || "warm");
    setEditCustRegion(c.region || "");
    setEditCustNotes(c.notes || "");
  };

  const handleSaveCustomerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    updateCustomer(editingCustomer.id, {
      stage: editCustStage,
      budget: Number(editCustBudget) || 0,
      budgetCurrency: editCustBudgetCurrency,
      temperature: editCustTemperature,
      region: editCustRegion,
      notes: editCustNotes,
    });
    setEditingCustomer(null);
  };

  useEffect(() => {
    if (
      closingModal ||
      customerToDelete ||
      editingCustomer ||
      isAddModalOpen ||
      isAddCustSubModalOpen ||
      isAddPropertySubModalOpen
    ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [
    closingModal,
    customerToDelete,
    editingCustomer,
    isAddModalOpen,
    isAddCustSubModalOpen,
    isAddPropertySubModalOpen,
  ]);

  const handleOpenAddModal = () => {
    setFormCustomerId(customers[0]?.id || "");
    setFormStage("NEW");
    setFormBudget("");
    setFormCurrency("GBP");
    setFormTemperature("warm");
    setFormDistrict(KKTC_DISTRICTS[0]);
    setFormSubRegion(getRegionsByDistrict(KKTC_DISTRICTS[0])[0] || "");
    setFormPropertyId("");
    setFormNotes("");
    setFormAdvisorId(currentUser.id);
    setIsAddModalOpen(true);
  };

  const handleCreatePipelineDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerId) {
      alert("Lütfen süreç başlatmak için bir müşteri seçin veya '+ Yeni Müşteri Ekle' butonunu kullanın.");
      return;
    }
    const cust = customers.find((c) => c.id === formCustomerId);
    if (!cust) return;

    const assignedAdvisor = isBroker
      ? users.find((u) => u.id === formAdvisorId) || currentUser
      : currentUser;

    const prop = properties.find((p) => p.id === formPropertyId);
    const propNote = prop ? `\nİlgili Portföy: ${prop.title} (${prop.region})` : "";
    const finalNote = formNotes
      ? `${cust.notes ? cust.notes + "\n" : ""}[Satış Süreci Başlatıldı - ${new Date().toLocaleDateString("tr-TR")}]: ${formNotes}${propNote}`
      : propNote
      ? `${cust.notes ? cust.notes + "\n" : ""}[Satış Süreci]: ${propNote}`
      : cust.notes;

    updateCustomer(formCustomerId, {
      stage: formStage,
      budget: Number(formBudget) || cust.budget || 0,
      budgetCurrency: formCurrency,
      temperature: formTemperature,
      region: `${formDistrict} / ${formSubRegion}`,
      notes: finalNote,
      assignedToId: assignedAdvisor.id,
      assignedToName: assignedAdvisor.name,
    });

    setIsAddModalOpen(false);
  };



  const handleMoveStage = (customer: Customer, newStage: PipelineStage) => {
    if (newStage === "WON" || newStage === "LOST") {
      setClosingModal({ customer, stage: newStage });
    } else {
      updateCustomer(customer.id, { stage: newStage });
    }
  };

  const handleConfirmClose = () => {
    if (closingModal) {
      updateCustomer(closingModal.customer.id, {
        stage: closingModal.stage,
        notes: closingNotes
          ? `${closingModal.customer.notes || ""}\n[${closingModal.stage}]: ${closingNotes}`
          : closingModal.customer.notes,
      });
      setClosingModal(null);
      setClosingNotes("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Yeni Satış Ekle Butonu */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#00adb5] font-bold tracking-wider uppercase">
              SATIŞ HUNİSİ (PIPELINE)
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              Aktif Satış Süreci & Kanban
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1d2566] tracking-tight flex items-center gap-2">
            <Kanban className="w-5 h-5 text-[#00adb5]" />
            Satış Süreci Kanban Panosu
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Müşteri adaylarınızın ilk temastan teklif ve kapanışa kadar olan satış süreçlerini yönetin.
          </p>
        </div>

        {/* Yeni Satış Ekle Butonu */}
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-[#00adb5] hover:bg-[#00969d] text-white font-mono font-bold text-xs tracking-wider uppercase transition cursor-pointer flex items-center gap-2 shadow-xs shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Satış Ekle</span>
        </button>
      </div>

      {/* 9 Aşamalı Yatay Kayan Kanban Panosu */}
      <div className="flex gap-3 overflow-x-auto pb-6 min-h-[600px] select-none">
        {STAGES.map((stage, index) => {
          const stageCustomers = activeCustomers.filter(
            (c) => (c.stage || "NEW") === stage.id
          );

          return (
            <div
              key={stage.id}
              className={`w-72 shrink-0 bg-slate-50 border border-slate-200 flex flex-col justify-between ${stage.color} border-t-3 shadow-2xs`}
            >
              {/* Kolon Başlığı */}
              <div>
                <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-slate-100 text-[10px] font-mono flex items-center justify-center font-bold text-[#1d2566] border border-slate-200">
                      {index + 1}
                    </span>
                    <h3 className="text-xs font-bold text-[#1d2566] tracking-tight">
                      {stage.label}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-[#1d2566] font-bold">
                    {stageCustomers.length}
                  </span>
                </div>

                {/* Kartlar Listesi */}
                <div className="p-2 space-y-2.5 max-h-[550px] overflow-y-auto">
                  {stageCustomers.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400 font-mono">
                      Bu aşamada aday yok
                    </div>
                  ) : (
                    stageCustomers.map((c) => {
                      const canManage = canManageCustomer(c);

                      return (
                        <div
                          key={c.id}
                          className="sharp-card p-3 border border-slate-200 hover:border-[#00adb5] transition flex flex-col gap-2 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-bold text-[#1d2566] line-clamp-1">
                              {c.fullName}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {c.temperature === "hot" && (
                                <span className="text-[9px] font-mono text-rose-700 bg-rose-50 px-1 border border-rose-300 font-bold">
                                  SICAK
                                </span>
                              )}
                              {canManage && (
                                <ActionMenu
                                  onEdit={() => handleOpenEditCustomer(c)}
                                  onDelete={() => setCustomerToDelete(c)}
                                  canEdit={canManage}
                                  canDelete={canManage}
                                />
                              )}
                            </div>
                          </div>

                          <div className="text-[11px] font-mono text-slate-600 space-y-0.5">
                            <div className="flex justify-between">
                              <span>Bütçe:</span>
                              <span className="text-[#1d2566] font-bold">
                                {c.budget?.toLocaleString("tr-TR")} {c.budgetCurrency}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Bölge:</span>
                              <span className="text-slate-700 font-semibold truncate max-w-[120px]">
                                {c.region}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Danışman:</span>
                              <span className="text-[#00adb5] font-semibold">
                                {c.assignedToName || "Atanmadı"}
                              </span>
                            </div>
                          </div>

                          {/* Hızlı Aşama Değiştirme Butonları */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            {!canManage ? (
                              <span className="text-[10px] font-mono text-slate-400 italic">
                                🔒 Paylaşılan Aday
                              </span>
                            ) : (
                              <>
                                {/* Önceki Aşama */}
                                {index > 0 ? (
                                  <button
                                    onClick={() =>
                                      handleMoveStage(c, STAGES[index - 1].id)
                                    }
                                    className="text-[10px] font-mono text-slate-600 hover:text-slate-900 px-1.5 py-0.5 bg-slate-100 border border-slate-200 cursor-pointer"
                                    title="Önceki Aşamaya Geri Al"
                                  >
                                    ← Geri
                                  </button>
                                ) : (
                                  <div />
                                )}

                                {/* Sonraki Aşama */}
                                {index < STAGES.length - 1 ? (
                                  <button
                                    onClick={() =>
                                      handleMoveStage(c, STAGES[index + 1].id)
                                    }
                                    className="text-[10px] font-mono text-white bg-[#00adb5] hover:bg-[#00939a] px-2.5 py-0.5 cursor-pointer flex items-center gap-1 font-bold shadow-2xs"
                                    title="Sonraki Aşamaya İlerlet"
                                  >
                                    İlerlet →
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-mono text-emerald-700 font-bold">
                                    ✓ Tamamlandı
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kazanıldı / Kaybedildi Kapanış Açıklama Modalı */}
      {closingModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="sharp-card w-full max-w-md bg-white border border-slate-300 shadow-2xl">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {closingModal.stage === "WON" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
                <h3 className="text-xs font-bold text-[#1d2566]">
                  {closingModal.stage === "WON"
                    ? "Satış / Kiralama Başarıyla Kapatıldı!"
                    : "Fırsat Kaybedildi Olarak İşaretleniyor"}
                </h3>
              </div>
              <button
                onClick={() => setClosingModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 border border-slate-200 font-mono text-[11px]">
                <div>Müşteri: {closingModal.customer.fullName}</div>
                <div>Bütçe: {closingModal.customer.budget?.toLocaleString("tr-TR")} {closingModal.customer.budgetCurrency}</div>
                <div>Tarih: {new Date().toISOString().split("T")[0]}</div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-600 font-semibold mb-1">
                  {closingModal.stage === "WON"
                    ? "Kapanış Notları & Komisyon Detayları:"
                    : "Kaybedilme Nedeni (Fiyat, vazgeçti, rakip ofis vb.):"}
                </label>
                <textarea
                  rows={3}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Detaylı kapanış açıklaması yazın..."
                  className="sharp-input w-full p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setClosingModal(null)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClose}
                  className={`px-4 py-1.5 font-bold text-white shadow-2xs cursor-pointer ${
                    closingModal.stage === "WON"
                      ? "sharp-btn-emerald"
                      : "sharp-btn-danger"
                  }`}
                >
                  Kapanışı Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SATIŞ SÜRECİ DÜZENLEME MODALI */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="sharp-card w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden bg-white border border-slate-300 shadow-2xl">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#00adb5]" />
                <h3 className="text-xs font-bold text-[#1d2566]">
                  Satış Süreci Adayını Düzenle
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerEdit} className="p-5 space-y-4 text-xs flex-1 overflow-y-auto">
              <div className="p-2.5 bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-mono block">Müşteri:</span>
                <span className="font-bold text-[#1d2566] text-xs">{editingCustomer.fullName}</span>
                {editingCustomer.phone && (
                  <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                    {editingCustomer.phone}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                  Satış Süreci Aşaması *
                </label>
                <select
                  value={editCustStage}
                  onChange={(e) => setEditCustStage(e.target.value as PipelineStage)}
                  className="sharp-input w-full p-2 font-mono bg-white font-bold"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Bütçe
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editCustBudget}
                    onChange={(e) => setEditCustBudget(e.target.value)}
                    className="sharp-input w-full p-2 font-mono"
                    placeholder="Örn: 150000"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Para Birimi
                  </label>
                  <select
                    value={editCustBudgetCurrency}
                    onChange={(e) =>
                      setEditCustBudgetCurrency(e.target.value as Currency)
                    }
                    className="sharp-input w-full p-2 font-mono bg-white"
                  >
                    <option value="GBP">GBP (£ - Sterlin)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="USD">USD ($ - Dolar)</option>
                    <option value="TRY">TRY (₺ - TL)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Müşteri Sıcaklığı
                  </label>
                  <select
                    value={editCustTemperature}
                    onChange={(e) =>
                      setEditCustTemperature(e.target.value as "hot" | "warm" | "cold")
                    }
                    className="sharp-input w-full p-2 font-mono bg-white"
                  >
                    <option value="hot">Sıcak (Satın almaya hazır)</option>
                    <option value="warm">Ilık (Araştırma aşamasında)</option>
                    <option value="cold">Soğuk (Uzun vadeli)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Aranan Bölge
                  </label>
                  <input
                    type="text"
                    value={editCustRegion}
                    onChange={(e) => setEditCustRegion(e.target.value)}
                    className="sharp-input w-full p-2 font-mono"
                    placeholder="Örn: Girne / Alsancak"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                  Aşama / Takip Notları
                </label>
                <textarea
                  rows={2}
                  value={editCustNotes}
                  onChange={(e) => setEditCustNotes(e.target.value)}
                  className="sharp-input w-full p-2"
                  placeholder="Görüşme ve aşama detayları..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
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

      {/* YENİ SATIŞ SÜRECİ BAŞLAT MODALI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="sharp-card w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden bg-white border border-slate-300 shadow-2xl my-auto">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
              <div className="flex items-center gap-2">
                <Kanban className="w-4 h-4 text-[#00adb5]" />
                <h3 className="text-sm font-bold text-[#1d2566]">
                  Yeni Satış Süreci Başlat
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePipelineDeal} className="p-5 space-y-4 text-xs flex-1 overflow-y-auto">
              {/* Müşteri Seçimi & Hızlı Ekle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-mono text-[11px] font-bold">
                    Müşteri Seçin *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddCustSubModalOpen(true)}
                    className="text-[#00adb5] hover:text-[#00969d] font-mono font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    + Yeni Müşteri Oluştur
                  </button>
                </div>
                {customers.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    Sistemde henüz müşteri bulunmuyor. Lütfen yukarıdaki &quot;+ Yeni Müşteri Oluştur&quot; butonuna tıklayın.
                  </div>
                ) : (
                  <select
                    value={formCustomerId}
                    onChange={(e) => setFormCustomerId(e.target.value)}
                    className="sharp-input w-full p-2.5 font-mono bg-white font-semibold"
                    required
                  >
                    <option value="">-- Müşteri Havuzundan Seçiniz --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.phone || "Telefon yok"}) — {c.category === "BUYER" ? "Alıcı" : c.category === "SELLER" ? "Satıcı" : c.category === "TENANT" ? "Kiracı" : "Mal Sahibi"}
                      </option>
                    ))}
                  </select>
                )}
                <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                  Seçilen müşterinin aşaması ve satış hunisi bilgileri güncellenecektir.
                </span>
              </div>

              {/* Başlangıç Aşaması */}
              <div>
                <label className="block text-slate-700 font-mono text-[11px] font-bold mb-1">
                  Başlangıç Aşaması *
                </label>
                <select
                  value={formStage}
                  onChange={(e) => setFormStage(e.target.value as PipelineStage)}
                  className="sharp-input w-full p-2 font-mono bg-white font-bold text-[#1d2566]"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bütçe ve Para Birimi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-mono text-[11px] font-bold mb-1">
                    Hedef Bütçe
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    className="sharp-input w-full p-2 font-mono"
                    placeholder="Örn: 175000"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-mono text-[11px] font-bold mb-1">
                    Para Birimi
                  </label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value as Currency)}
                    className="sharp-input w-full p-2 font-mono bg-white"
                  >
                    <option value="GBP">GBP (£ - Sterlin)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="USD">USD ($ - Dolar)</option>
                    <option value="TRY">TRY (₺ - TL)</option>
                  </select>
                </div>
              </div>

              {/* İlgili Portföy */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-mono text-[11px] font-bold">
                    İlgili Portföy (Opsiyonel)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddPropertySubModalOpen(true)}
                    className="text-[#00adb5] hover:text-[#00969d] font-mono font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    + Yeni Portföy Ekle
                  </button>
                </div>
                <select
                  value={formPropertyId}
                  onChange={(e) => setFormPropertyId(e.target.value)}
                  className="sharp-input w-full p-2 font-mono bg-white"
                >
                  <option value="">-- Henüz Bir Portföy Bağlanmadı --</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.region} - {p.price.toLocaleString("tr-TR")} {p.currency})
                    </option>
                  ))}
                </select>
              </div>

              {/* İlçe & Bölge (KKTC) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-mono text-[11px] font-bold mb-1">
                    KKTC İlçe
                  </label>
                  <select
                    value={formDistrict}
                    onChange={(e) => {
                      const d = e.target.value;
                      setFormDistrict(d);
                      setFormSubRegion(getRegionsByDistrict(d)[0] || "");
                    }}
                    className="sharp-input w-full p-2 font-mono bg-white"
                  >
                    {KKTC_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-mono text-[11px] font-bold mb-1">
                    Bölge / Mahalle
                  </label>
                  <select
                    value={formSubRegion}
                    onChange={(e) => setFormSubRegion(e.target.value)}
                    className="sharp-input w-full p-2 font-mono bg-white"
                  >
                    {getRegionsByDistrict(formDistrict).map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sıcaklık & Sorumlu Danışman */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-mono text-[11px] font-bold mb-1">
                    Müşteri Sıcaklığı
                  </label>
                  <select
                    value={formTemperature}
                    onChange={(e) =>
                      setFormTemperature(e.target.value as "hot" | "warm" | "cold")
                    }
                    className="sharp-input w-full p-2 font-mono bg-white font-semibold"
                  >
                    <option value="hot">🔥 Sıcak (Hemen Almaya Hazır)</option>
                    <option value="warm">⚡ Ilık (Portföy İnceliyor)</option>
                    <option value="cold">❄️ Soğuk (Piyasa Araştırması)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-mono text-[11px] font-bold mb-1">
                    Sorumlu Danışman
                  </label>
                  {isBroker ? (
                    <select
                      value={formAdvisorId}
                      onChange={(e) => setFormAdvisorId(e.target.value)}
                      className="sharp-input w-full p-2 font-mono bg-white font-semibold"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={currentUser.name}
                      className="sharp-input w-full p-2 font-mono bg-slate-100 text-slate-600 font-semibold cursor-not-allowed"
                    />
                  )}
                </div>
              </div>

              {/* Başlangıç Notu */}
              <div>
                <label className="block text-slate-700 font-mono text-[11px] font-bold mb-1">
                  Süreç Notu / İlk Detaylar
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="sharp-input w-full p-2 font-sans"
                  placeholder="Müşterinin özel istekleri, ilk arama notu veya hedefleri..."
                />
              </div>

              {/* Butonlar */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer font-mono text-xs uppercase"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00adb5] hover:bg-[#00969d] text-white font-mono font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  Süreci Başlat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STANDART MÜŞTERİ EKLEME MODALI */}
      <AddCustomerModal
        isOpen={isAddCustSubModalOpen}
        onClose={() => setIsAddCustSubModalOpen(false)}
        initialCategory="BUYER"
        zIndex={80}
        onSuccess={(newCust) => {
          setIsAddCustSubModalOpen(false);
          if (newCust) {
            setFormCustomerId(newCust.id);
          }
        }}
      />

      {/* STANDART PORTFÖY EKLEME MODALI */}
      <AddPropertyModal
        isOpen={isAddPropertySubModalOpen}
        onClose={() => setIsAddPropertySubModalOpen(false)}
        zIndex={80}
        onSuccess={(newProp) => {
          setIsAddPropertySubModalOpen(false);
          if (newProp) {
            setFormPropertyId(newProp.id);
          }
        }}
      />

      {/* SİLME ONAY MODALI */}
      <DeleteConfirmModal
        isOpen={!!customerToDelete}
        title="Satış Süreci Kaydını Sil"
        itemName={customerToDelete ? customerToDelete.fullName : undefined}
        message="Bu müşteri ve bağlı olduğu tüm satış süreci kayıtları sistemden kalıcı olarak silinecektir."
        onConfirm={() => {
          if (customerToDelete) {
            deleteCustomer(customerToDelete.id);
            setCustomerToDelete(null);
          }
        }}
        onCancel={() => setCustomerToDelete(null)}
      />
    </div>
  );
}
