"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Trust360Contract } from "@/lib/types";
import { formatDateTR } from "@/lib/formatters";
import { AddTrust360Modal } from "./AddTrust360Modal";
import { Trust360ExpenseModal } from "./Trust360ExpenseModal";
import { Trust360ReportModal } from "./Trust360ReportModal";
import { Trust360ChecklistModal } from "./Trust360ChecklistModal";
import { ActionMenu } from "@/components/common/ActionMenu";
import {
  ShieldCheck,
  Plus,
  Search,
  Building,
  User,
  Calendar,
  FileText,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageCircle,
  MoreVertical,
  Edit2,
  Trash2,
  Phone,
  DollarSign,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";

export function Trust360View() {
  const {
    trust360Contracts,
    currentUser,
    isBroker,
    deleteTrust360Contract,
    toggleTrust360FeeStatus,
    canManageTrust360,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expiring_soon" | "expired">("all");
  const [feeFilter, setFeeFilter] = useState<"all" | "paid" | "pending">("all");

  // Modal Durumları
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [contractToEdit, setContractToEdit] = useState<Trust360Contract | null>(null);
  const [activeExpenseContract, setActiveExpenseContract] = useState<Trust360Contract | null>(null);
  const [activeReportContract, setActiveReportContract] = useState<Trust360Contract | null>(null);
  const [activeChecklistContract, setActiveChecklistContract] = useState<Trust360Contract | null>(null);

  // Danışman İzolasyonu: Danışmanlar sadece kendi ekledikleri veya atandıkları sözleşmeleri görür
  const visibleContracts = useMemo(() => {
    if (isBroker) return trust360Contracts;
    return trust360Contracts.filter((c) => c.assignedToId === currentUser.id);
  }, [trust360Contracts, isBroker, currentUser.id]);

  // Gün hesaplayıcı (SSR uyumlu - mount sonrası istemcide hesaplanır)
  const [todayStr, setTodayStr] = useState<string>("");
  useEffect(() => {
    setTodayStr(new Date().toISOString().split("T")[0]);
  }, []);

  const getContractRemainingDays = (endDateStr: string) => {
    if (!endDateStr) return 0;
    try {
      const now = todayStr ? new Date(todayStr) : new Date();
      const end = new Date(endDateStr);
      return Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
    } catch {
      return 0;
    }
  };

  // Filtreleme
  const filteredContracts = useMemo(() => {
    return visibleContracts.filter((c) => {
      // 1. Arama sorgusu
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (c.propertyTitle || "").toLowerCase().includes(q);
        const matchOwner = (c.ownerName || "").toLowerCase().includes(q);
        const matchTenant = (c.tenantName || "").toLowerCase().includes(q);
        const matchCode = (c.contractNumber || "").toLowerCase().includes(q);
        const matchRegion = (c.region || "").toLowerCase().includes(q);
        if (!matchTitle && !matchOwner && !matchTenant && !matchCode && !matchRegion) {
          return false;
        }
      }

      // 2. Durum filtresi
      const diffDays = getContractRemainingDays(c.endDate);
      if (statusFilter === "expiring_soon" && (diffDays > 30 || diffDays < 0)) {
        return false;
      }
      if (statusFilter === "expired" && diffDays >= 0) {
        return false;
      }
      if (statusFilter === "active" && diffDays < 0) {
        return false;
      }

      // 3. Yıllık bedel filtresi
      if (feeFilter === "paid" && c.feePaymentStatus !== "paid") return false;
      if (feeFilter === "pending" && c.feePaymentStatus === "paid") return false;

      return true;
    });
  }, [visibleContracts, searchQuery, statusFilter, feeFilter, todayStr]);

  // İstatistikler
  const stats = useMemo(() => {
    const total = visibleContracts.length;
    let paidCount = 0;
    let pendingCount = 0;
    let expiringSoonCount = 0;
    let totalExpensesSum: Record<string, number> = {};

    visibleContracts.forEach((c) => {
      if (c.feePaymentStatus === "paid") {
        paidCount++;
      } else {
        pendingCount++;
      }

      const diffDays = getContractRemainingDays(c.endDate);
      if (diffDays <= 30 && diffDays >= 0) {
        expiringSoonCount++;
      }

      (c.expenses || []).forEach((exp) => {
        totalExpensesSum[exp.currency] = (totalExpensesSum[exp.currency] || 0) + exp.amount;
      });
    });

    return {
      total,
      paidCount,
      pendingCount,
      expiringSoonCount,
      totalExpensesSum,
    };
  }, [visibleContracts, todayStr]);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-150">
      {/* 1. Üst Başlık & Logo Alanı */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <img
            src="/trust360-logo.jpg"
            alt="Trust 360 Logo"
            className="h-12 w-auto object-contain border border-slate-200 shadow-2xs p-1 bg-white"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#1d2566] tracking-tight">
                Trust 360 Kiralık Mülk Yönetimi
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#00adb5]/10 text-[#00adb5] border border-[#00adb5]/30">
                Rental Management
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Yıllık sabit ücretli profesyonel portföy takip, bakım, resmi işlem ve operasyon merkezi
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setContractToEdit(null);
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 bg-[#1d2566] text-white font-bold text-xs hover:bg-[#151a47] transition flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-[#00adb5]" />
          <span>+ Yeni Mülk Yönetimi (Trust 360) Ekle</span>
        </button>
      </div>

      {/* 2. İstatistik Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Kart 1: Toplam Mülk */}
        <div className="p-4 bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>Yönetilen Mülk</span>
            <Building className="w-4 h-4 text-[#00adb5]" />
          </div>
          <div className="text-2xl font-black text-[#1d2566] font-mono">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {isBroker ? "Tüm Şirket Portföyü" : "Şahsi Yönetiminiz"}
          </div>
        </div>

        {/* Kart 2: Yıllık Hizmet Bedeli Tahsilatı */}
        <div className="p-4 bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>Yıllık Ücret Tahsilatı</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {stats.paidCount} / {stats.total}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {stats.pendingCount > 0 ? (
              <span className="text-amber-700 font-bold">{stats.pendingCount} mülk ödeme bekliyor</span>
            ) : (
              <span className="text-emerald-700 font-bold">Tümü Tahsil Edildi</span>
            )}
          </div>
        </div>

        {/* Kart 3: Gerçekleşen Toplam Masraflar */}
        <div className="p-4 bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>Koordine Edilen Masraflar</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono truncate">
            {Object.keys(stats.totalExpensesSum).length === 0 ? (
              "0 GBP"
            ) : (
              Object.entries(stats.totalExpensesSum)
                .map(([curr, sum]) => `${sum.toLocaleString("tr-TR")} ${curr}`)
                .join(" • ")
            )}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Usta, fatura ve bakım giderleri
          </div>
        </div>

        {/* Kart 4: Yenileme Yaklaşanlar */}
        <div className="p-4 bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>Yenilemesi Yaklaşan</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {stats.expiringSoonCount}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            30 gün içinde dolacak sözleşmeler
          </div>
        </div>
      </div>

      {/* 3. Arama & Filtreleme Çubuğu */}
      <div className="p-4 bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Mülk adı, mülk sahibi, kiracı veya kod ara..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 text-xs focus:outline-none focus:border-[#00adb5]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 bg-white font-mono text-xs focus:outline-none"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Yalnızca Aktifler</option>
            <option value="expiring_soon">Yenileme Yaklaşanlar (≤ 30 Gün)</option>
            <option value="expired">Süresi Dolanlar</option>
          </select>

          <select
            value={feeFilter}
            onChange={(e) => setFeeFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 bg-white font-mono text-xs focus:outline-none"
          >
            <option value="all">Yıllık Bedel: Tümü</option>
            <option value="paid">Tahsil Edilenler</option>
            <option value="pending">Ödeme Bekleyenler</option>
          </select>
        </div>
      </div>

      {/* 4. Mülk Yönetim Tablosu */}
      {filteredContracts.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-300 bg-slate-50/50 space-y-3">
          <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-[#1d2566]">
            Kayıtlı Trust 360 Sözleşmesi Bulunamadı
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? "Arama kriterlerinize uygun bir yönetim sözleşmesi bulunamadı."
              : "Henüz Trust 360 kapsamında yönetilen bir mülk eklemediniz. Yeni bir mülk eklemek için yukarıdaki '+ Yeni Mülk Yönetimi Ekle' butonuna tıklayın."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => {
                setContractToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 bg-[#1d2566] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs hover:bg-[#151a47] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#00adb5]" /> İlk Mülkü Yönetime Al
            </button>
          )}
        </div>
      ) : (
        <div className="border border-slate-200 bg-white shadow-2xs overflow-visible">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[10.5px] uppercase font-bold tracking-wider">
                <th className="py-3 px-3.5">Portföy / Gayrimenkul</th>
                <th className="py-3 px-3 w-[180px]">Mülk Sahibi & Kiracı</th>
                <th className="py-3 px-3 w-[150px]">Yönetim Dönemi</th>
                <th className="py-3 px-2 text-center w-[110px] whitespace-nowrap">Yıllık Bedel</th>
                <th className="py-3 px-2 text-center w-[100px] whitespace-nowrap">Masraflar</th>
                <th className="py-3 px-2 text-center w-[110px] whitespace-nowrap">Kontrol</th>
                <th className="py-3 px-3 text-right w-[210px] whitespace-nowrap">İşlemler & Rapor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContracts.map((c) => {
                const diffDays = getContractRemainingDays(c.endDate);
                const isExpiringSoon = diffDays <= 30 && diffDays >= 0;
                const isExpired = diffDays < 0;

                const checklistItems = c.checklist || [];
                const completedChecklist = checklistItems.filter((i) => i.completed).length;

                const expensesCount = (c.expenses || []).length;
                let contractExpenseTotal = 0;
                (c.expenses || []).forEach((e) => {
                  contractExpenseTotal += e.amount;
                });

                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50/80 transition ${
                      isExpiringSoon ? "bg-amber-50/30" : isExpired ? "bg-red-50/30" : ""
                    }`}
                  >
                    {/* Sütun 1: Portföy Bilgisi */}
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900 text-xs leading-snug">
                        {c.propertyTitle}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                        <span>{c.region || "KKTC"}</span>
                        <span>•</span>
                        <span>{c.propertyType || "Konut"}</span>
                        {c.contractNumber && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 font-semibold">{c.contractNumber}</span>
                          </>
                        )}
                      </div>
                      {isBroker && (
                        <div className="text-[10px] text-indigo-700 font-mono mt-1">
                          Danışman: <strong>{c.assignedToName}</strong>
                        </div>
                      )}
                    </td>

                    {/* Sütun 2: Mülk Sahibi & Kiracı */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 flex items-center justify-between gap-1">
                        <span className="truncate">{c.ownerName}</span>
                        {(c.ownerWhatsapp || c.ownerPhone) && (
                          <a
                            href={`https://wa.me/${(c.ownerWhatsapp || c.ownerPhone).replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Mülk sahibine WhatsApp mesajı gönder"
                            className="text-emerald-600 hover:text-emerald-700 p-0.5"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="text-[10.5px] font-mono text-slate-500 flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5 text-slate-400" />
                        <span>{c.ownerPhone || "-"}</span>
                      </div>
                      {c.tenantName && (
                        <div className="mt-1 pt-1 border-t border-slate-100 text-[10.5px] text-slate-600">
                          <span className="text-slate-400">Kiracı:</span> <strong>{c.tenantName}</strong>
                        </div>
                      )}
                    </td>

                    {/* Sütun 3: Sözleşme Dönemi */}
                    <td className="py-3 px-3 font-mono">
                      <div className="text-slate-800 text-[11px] font-semibold">
                        {formatDateTR(c.startDate)} - {formatDateTR(c.endDate)}
                      </div>
                      <div className="mt-1">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 bg-red-100 text-red-800 border border-red-200">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>Süresi Doldu</span>
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{diffDays} gün kaldı (Yenileme)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-medium">
                            {diffDays} gün kaldı
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Sütun 4: Yıllık Bedel Durumu */}
                    <td className="py-3 px-3 text-center">
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        {c.annualFee.toLocaleString("tr-TR")} {c.currency}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleTrust360FeeStatus(c.id)}
                        title="Ödeme durumunu değiştirmek için tıklayın"
                        className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 border text-[10px] font-mono font-bold transition cursor-pointer shadow-2xs ${
                          c.feePaymentStatus === "paid"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                        }`}
                      >
                        {c.feePaymentStatus === "paid" ? (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Tahsil Edildi</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-2.5 h-2.5 text-amber-600" />
                            <span>Ödeme Bekliyor</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Sütun 5: Masraflar Özeti */}
                    <td className="py-3 px-3 text-center">
                      <div className="font-mono font-bold text-slate-800 text-xs">
                        {expensesCount > 0
                          ? `${contractExpenseTotal.toLocaleString("tr-TR")} ${c.currency}`
                          : "0"}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {expensesCount} İşlem Kaydı
                      </div>
                    </td>

                    {/* Sütun 6: Kontrol Listesi Durumu */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setActiveChecklistContract(c)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[10.5px] font-mono font-bold text-slate-700 transition cursor-pointer"
                        title="Demirbaş ve Giriş/Çıkış Kontrol Listesini Aç"
                      >
                        <ClipboardList className="w-3 h-3 text-[#00adb5]" />
                        <span>{completedChecklist} / {checklistItems.length || 13}</span>
                      </button>
                    </td>

                    {/* Sütun 7: Hızlı Aksiyon Butonları */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Masraf Defteri Butonu */}
                        <button
                          type="button"
                          onClick={() => setActiveExpenseContract(c)}
                          className="px-2.5 py-1.5 bg-[#1d2566] text-white hover:bg-[#151a47] font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-xs"
                          title="İşlem & Masraf Defteri (Faturalar ve Harcamalar)"
                        >
                          <FileText className="w-3 h-3 text-[#00adb5]" />
                          <span>Masraf Defteri</span>
                        </button>

                        {/* Müşteri Ekstresi / Döküm Butonu */}
                        <button
                          type="button"
                          onClick={() => setActiveReportContract(c)}
                          className="px-2.5 py-1.5 bg-emerald-700 text-white hover:bg-emerald-800 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-xs"
                          title="Mülk Sahibine Sunulabilir Faaliyet ve Masraf Ekstresi"
                        >
                          <FileText className="w-3 h-3 text-emerald-200" />
                          <span>Döküm Al</span>
                        </button>

                        {/* Düzenle & Sil Menüsü - Portallı Üst Katman */}
                        {canManageTrust360(c) && (
                          <ActionMenu
                            onEdit={() => {
                              setContractToEdit(c);
                              setIsAddModalOpen(true);
                            }}
                            onDelete={() => {
                              if (
                                confirm(
                                  `'${c.propertyTitle}' Trust 360 mülk yönetimi sözleşmesini silmek istediğinize emin misiniz?`
                                )
                              ) {
                                deleteTrust360Contract(c.id);
                              }
                            }}
                            canEdit={canManageTrust360(c)}
                            canDelete={canManageTrust360(c)}
                            canDeactivate={false}
                            menuPosition="right"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Alt Bilgi & Hizmet Standartları */}
      <div className="p-4 bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#00adb5]" />
          <span>
            <strong>Trust 360 Kiralık Mülk Yönetimi:</strong> Giriş/çıkış kontrolü, demirbaş takibi, elektrik/su devirleri ve usta/onarım koordinasyonu dahil.
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Trustline Estate Ltd. • Yıllık Sabit Hizmet Modeli
        </div>
      </div>

      {/* Modallar */}
      {isAddModalOpen && (
        <AddTrust360Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setContractToEdit(null);
          }}
          contractToEdit={contractToEdit}
        />
      )}

      {activeExpenseContract && (
        <Trust360ExpenseModal
          isOpen={Boolean(activeExpenseContract)}
          onClose={() => setActiveExpenseContract(null)}
          contract={activeExpenseContract}
        />
      )}

      {activeReportContract && (
        <Trust360ReportModal
          isOpen={Boolean(activeReportContract)}
          onClose={() => setActiveReportContract(null)}
          contract={activeReportContract}
        />
      )}

      {activeChecklistContract && (
        <Trust360ChecklistModal
          isOpen={Boolean(activeChecklistContract)}
          onClose={() => setActiveChecklistContract(null)}
          contract={activeChecklistContract}
        />
      )}
    </div>
  );
}

