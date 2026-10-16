"use client";

import React, { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { MandateContract, Currency, Property } from "@/lib/types";
import { KKTC_DISTRICTS, getRegionsByDistrict } from "@/lib/kktcLocations";
import { ActionMenu } from "@/components/common/ActionMenu";
import { DeleteConfirmModal } from "@/components/common/DeleteConfirmModal";
import { AddPropertyModal } from "@/components/modals/AddPropertyModal";
import { AddCustomerModal } from "@/components/modals/AddCustomerModal";
import { DateInput } from "@/components/common/DateInput";
import { formatDateTR, cleanWhatsAppNumber, formatPhoneWithPrefix } from "@/lib/formatters";
import {
  FileCheck,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building,
  User,
  Percent,
  MessageCircle,
  X,
  CheckCircle2,
  Filter,
  FileText,
  UserPlus,
  Send,
  Trash2,
  Edit3,
  Award,
} from "lucide-react";

export function MandatesView() {
  const {
    mandates,
    properties,
    customers,
    users,
    currentUser,
    isBroker,
    addMandateContract,
    updateMandateContract,
    deleteMandateContract,
    canManageMandate,
    addProperty,
    addCustomer,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expiring" | "expired">("all");
  const [filterAdvisor, setFilterAdvisor] = useState<string>("all");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMandate, setEditingMandate] = useState<MandateContract | null>(null);
  const [mandateToDelete, setMandateToDelete] = useState<MandateContract | null>(null);

  // Sub-modal bildirim
  const [subNotice, setSubNotice] = useState<string | null>(null);

  // Sub-modal açılış durumları (Standardize Modal Entegrasyonu)
  const [isAddCustomerSubModalOpen, setIsAddCustomerSubModalOpen] = useState(false);
  const [isAddPropertySubModalOpen, setIsAddPropertySubModalOpen] = useState(false);

  // Form State
  const [formPropertyId, setFormPropertyId] = useState("");
  const [formOwnerCustomerId, setFormOwnerCustomerId] = useState("");
  const [formMandateType, setFormMandateType] = useState<"exclusive" | "open">("exclusive");
  const [formCommissionRate, setFormCommissionRate] = useState<number>(5);
  const [formStartDate, setFormStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formEndDate, setFormEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split("T")[0];
  });
  const [formContractNumber, setFormContractNumber] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formAdvisorId, setFormAdvisorId] = useState(currentUser.id);

  // Otomatik Gün Farkı & Durum Hesaplama
  const calculateDaysRemaining = (endDateStr: string) => {
    const now = new Date();
    const end = new Date(endDateStr);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
  };

  // Filtreleme
  const filteredMandates = useMemo(() => {
    return mandates.filter((m) => {
      const days = calculateDaysRemaining(m.endDate);
      const isExpiring = days > 0 && days <= 60;
      const isExpired = days <= 0;
      const isActive = days > 60;

      if (filterStatus === "active" && !isActive) return false;
      if (filterStatus === "expiring" && !isExpiring) return false;
      if (filterStatus === "expired" && !isExpired) return false;

      if (filterAdvisor !== "all" && m.assignedToId !== filterAdvisor) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.propertyTitle.toLowerCase().includes(q);
        const matchOwner = m.ownerName.toLowerCase().includes(q);
        const matchNo = (m.contractNumber || "").toLowerCase().includes(q);
        const matchRegion = m.region.toLowerCase().includes(q);
        if (!matchTitle && !matchOwner && !matchNo && !matchRegion) return false;
      }

      return true;
    });
  }, [mandates, filterStatus, filterAdvisor, searchQuery]);

  // KPI Sayımları
  const totalMandatesCount = mandates.length;
  const exclusiveCount = mandates.filter((m) => m.mandateType === "exclusive").length;
  const expiringCount = mandates.filter((m) => {
    const days = calculateDaysRemaining(m.endDate);
    return days > 0 && days <= 60;
  }).length;
  const expiredCount = mandates.filter((m) => calculateDaysRemaining(m.endDate) <= 0).length;

  // Hızlı Süre Butonları (+3 Ay, +6 Ay, +1 Yıl)
  const handleSetDurationMonths = (monthsToAdd: number) => {
    const base = new Date(formStartDate || new Date());
    base.setMonth(base.getMonth() + monthsToAdd);
    setFormEndDate(base.toISOString().split("T")[0]);
  };

  // WhatsApp Yetki Uzatma Mesajı
  const handleSendWhatsAppRenewal = (m: MandateContract) => {
    const days = calculateDaysRemaining(m.endDate);
    const text = encodeURIComponent(
      `Merhaba ${m.ownerName}, ${m.propertyTitle} portföyünüz için akdettiğimiz emlak aracılık sözleşmesi ${
        days <= 0 ? "süresi dolmuştur" : `${days} gün sonra sona erecektir`
      }. Satış çalışmalarımızı kesintisiz sürdürmek ve yetki süresini uzatmak üzere görüşebilir miyiz? - Trustline Real Estate`
    );
    const cleanPhone = cleanWhatsAppNumber(m.ownerPhone);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };


  // Form Submit (Ekle / Güncelle)
  const handleSubmitMandate = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedProp = properties.find((p) => p.id === formPropertyId);
    const selectedOwner = customers.find((c) => c.id === formOwnerCustomerId);

    const propTitle = selectedProp ? selectedProp.title : "Belirtilmemiş Portföy";
    const propType = selectedProp ? selectedProp.propertyType : "Daire";
    const propRegion = selectedProp ? selectedProp.region : "KKTC";
    const propPrice = selectedProp ? selectedProp.price : 0;
    const propCurrency = selectedProp ? selectedProp.currency : "GBP";

    const ownerName = selectedOwner ? selectedOwner.fullName : "Belirtilmemiş Mal Sahibi";
    const ownerPhone = selectedOwner ? (selectedOwner.phone || selectedOwner.whatsapp || "") : "";

    const assignedUser = users.find((u) => u.id === formAdvisorId) || currentUser;

    const days = calculateDaysRemaining(formEndDate);
    const status: MandateContract["status"] =
      days <= 0 ? "expired" : days <= 60 ? "expiring_soon" : "active";

    if (editingMandate) {
      updateMandateContract(editingMandate.id, {
        propertyId: formPropertyId || undefined,
        propertyTitle: propTitle,
        propertyType: propType,
        region: propRegion,
        listingPrice: propPrice,
        currency: propCurrency,
        ownerCustomerId: formOwnerCustomerId || undefined,
        ownerName,
        ownerPhone,
        mandateType: formMandateType,
        commissionRate: formCommissionRate,
        startDate: formStartDate,
        endDate: formEndDate,
        status,
        contractNumber: formContractNumber || editingMandate.contractNumber,
        notes: formNotes,
        assignedToId: assignedUser.id,
        assignedToName: assignedUser.name,
      });
      setEditingMandate(null);
    } else {
      addMandateContract({
        propertyId: formPropertyId || undefined,
        propertyTitle: propTitle,
        propertyType: propType,
        region: propRegion,
        listingPrice: propPrice,
        currency: propCurrency,
        ownerCustomerId: formOwnerCustomerId || undefined,
        ownerName,
        ownerPhone,
        mandateType: formMandateType,
        commissionRate: formCommissionRate,
        startDate: formStartDate,
        endDate: formEndDate,
        status,
        contractNumber:
          formContractNumber.trim() || `TL-YET-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        notes: formNotes,
        assignedToId: isBroker ? assignedUser.id : currentUser.id,
        assignedToName: isBroker ? assignedUser.name : currentUser.name,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleOpenEdit = (m: MandateContract) => {
    setEditingMandate(m);
    setFormPropertyId(m.propertyId || "");
    setFormOwnerCustomerId(m.ownerCustomerId || "");
    setFormMandateType(m.mandateType);
    setFormCommissionRate(m.commissionRate || 5);
    setFormStartDate(m.startDate);
    setFormEndDate(m.endDate);
    setFormContractNumber(m.contractNumber || "");
    setFormNotes(m.notes || "");
    setFormAdvisorId(m.assignedToId || currentUser.id);
    setIsAddModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingMandate(null);
    setFormPropertyId("");
    setFormOwnerCustomerId("");
    setFormMandateType("exclusive");
    setFormCommissionRate(5);
    setFormStartDate(new Date().toISOString().split("T")[0]);
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setFormEndDate(d.toISOString().split("T")[0]);
    setFormContractNumber(`TL-YET-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setFormNotes("");
    setFormAdvisorId(currentUser.id);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Aksiyon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#00adb5] font-bold tracking-wider uppercase">
              PORTFÖY YETKİ & SÖZLEŞME YÖNETİMİ
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              {isBroker ? "Ofis Geneli Yetki Takip Masası" : `${currentUser.name} (Bireysel Yetkiler)`}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1d2566] tracking-tight flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#00adb5]" />
            Yetki Takip & Aracılık Sözleşmeleri
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Mal sahiplerinden alınan tek yetkili ve genel satış sözleşmelerinin geçerlilik süreleri, yenileme alarmları ve komisyon oranları.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="sharp-btn-primary px-4 py-2 text-xs flex items-center gap-2 cursor-pointer self-start md:self-auto shadow-xs font-bold"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Yetki Sözleşmesi Ekle</span>
        </button>
      </div>

      {/* 4 KPI Sayaç Kartı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="sharp-card p-4 border-t-3 border-t-[#00adb5]">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-[#1d2566] px-2 py-0.5 bg-slate-100 border border-slate-200 uppercase">
              Toplam Yetkili Portföy
            </span>
            <Building className="w-4 h-4 text-[#00adb5]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#1d2566] mt-2">
            {totalMandatesCount} <span className="text-xs font-normal text-slate-500">Sözleşme</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            Kayıtlı aktif & geçmiş aracılık yetkileri
          </div>
        </div>

        <div className="sharp-card p-4 border-t-3 border-t-[#1d2566]">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-[#1d2566] px-2 py-0.5 bg-slate-100 border border-slate-200 uppercase">
              Tek Yetkili (Exclusive)
            </span>
            <Award className="w-4 h-4 text-[#1d2566]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#1d2566] mt-2">
            {exclusiveCount} <span className="text-xs font-normal text-slate-500">Mülk</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            Tek yetki oranı: %{totalMandatesCount ? Math.round((exclusiveCount / totalMandatesCount) * 100) : 0}
          </div>
        </div>

        <div className="sharp-card p-4 border-t-3 border-t-amber-500">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-amber-900 px-2 py-0.5 bg-amber-50 border border-amber-200 uppercase">
              Yenileme Yaklaşan (≤ 60 Gün)
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-2">
            {expiringCount} <span className="text-xs font-normal text-amber-600">Alarm</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            Mal sahibiyle uzatma görüşmesi gerekenler
          </div>
        </div>

        <div className="sharp-card p-4 border-t-3 border-t-rose-500">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-rose-900 px-2 py-0.5 bg-rose-50 border border-rose-200 uppercase">
              Süresi Dolan Yetkiler
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-2">
            {expiredCount} <span className="text-xs font-normal text-rose-600">Sözleşme</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            Yetkisi biten & yenilenmemiş mülkler
          </div>
        </div>
      </div>

      {/* Arama & Filtreleme Çubuğu */}
      <div className="sharp-card p-3 bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Portföy adı, mal sahibi, sözleşme no veya bölge ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 text-xs focus:border-[#00adb5] outline-none"
            />
          </div>

          {/* Durum Filtresi */}
          <div className="flex items-center gap-1 font-mono">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-2.5 py-1.5 border text-xs cursor-pointer font-bold transition ${
                filterStatus === "all"
                  ? "bg-[#1d2566] text-white border-[#1d2566]"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              }`}
            >
              Tümü ({mandates.length})
            </button>
            <button
              onClick={() => setFilterStatus("active")}
              className={`px-2.5 py-1.5 border text-xs cursor-pointer font-bold transition ${
                filterStatus === "active"
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => setFilterStatus("expiring")}
              className={`px-2.5 py-1.5 border text-xs cursor-pointer font-bold transition ${
                filterStatus === "expiring"
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-white text-amber-700 border-amber-300 hover:bg-amber-50"
              }`}
            >
              Yenileme Yaklaşan ({expiringCount})
            </button>
            <button
              onClick={() => setFilterStatus("expired")}
              className={`px-2.5 py-1.5 border text-xs cursor-pointer font-bold transition ${
                filterStatus === "expired"
                  ? "bg-rose-700 text-white border-rose-700"
                  : "bg-white text-rose-700 border-rose-300 hover:bg-rose-50"
              }`}
            >
              Süresi Dolan ({expiredCount})
            </button>
          </div>
        </div>

        {/* Danışman Filtresi (Broker için) */}
        {isBroker && (
          <div className="flex items-center gap-2 font-mono shrink-0">
            <span className="text-slate-500">Danışman:</span>
            <select
              value={filterAdvisor}
              onChange={(e) => setFilterAdvisor(e.target.value)}
              className="p-1.5 border border-slate-300 text-xs bg-white text-[#1d2566] font-semibold"
            >
              <option value="all">Tüm Danışmanlar</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Yetki Sözleşmeleri Tablosu */}
      <div className="sharp-card overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider font-bold">
              <th className="py-3 px-4">Portföy / Mülk</th>
              <th className="py-3 px-4">Mal Sahibi</th>
              <th className="py-3 px-4 text-center">Yetki Türü</th>
              <th className="py-3 px-4 text-center">Komisyon</th>
              <th className="py-3 px-4">Geçerlilik Tarihleri & Kalan Süre</th>
              <th className="py-3 px-4">Sözleşme No / Sorumlu</th>
              <th className="py-3 px-4 text-center">Yetki Aksiyonu</th>
              <th className="py-3 px-4 text-center">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMandates.map((m) => {
              const daysRemaining = calculateDaysRemaining(m.endDate);
              const isExpired = daysRemaining <= 0;
              const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 60;

              return (
                <tr key={m.id} className="hover:bg-slate-50/80 transition">
                  {/* 1. Portföy / Mülk */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#1d2566] flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#00adb5] shrink-0" />
                      <span>{m.propertyTitle}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {m.region} • {m.propertyType} • {m.listingPrice ? `${m.listingPrice.toLocaleString("tr-TR")} ${m.currency}` : "Fiyat Belirtilmedi"}
                    </div>
                  </td>

                  {/* 2. Mal Sahibi */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {m.ownerName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatPhoneWithPrefix(m.ownerPhone) || m.ownerPhone || "Telefon yok"}
                    </div>
                  </td>

                  {/* 3. Yetki Türü */}
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 border font-bold inline-flex items-center gap-1 ${
                        m.mandateType === "exclusive"
                          ? "bg-[#1d2566]/10 text-[#1d2566] border-[#1d2566]/30"
                          : "bg-slate-100 text-slate-600 border-slate-300"
                      }`}
                    >
                      {m.mandateType === "exclusive" ? (
                        <>
                          <Award className="w-3 h-3 text-[#1d2566]" /> Tek Yetkili
                        </>
                      ) : (
                        "Genel Yetki"
                      )}
                    </span>
                  </td>

                  {/* 4. Komisyon */}
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                    %{m.commissionRate || 5}
                  </td>

                  {/* 5. Geçerlilik Tarihleri & Kalan Süre */}
                  <td className="py-3 px-4">
                    <div className="text-xs font-mono font-medium text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDateTR(m.startDate)}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-bold">{formatDateTR(m.endDate)}</span>
                    </div>

                    <div className="mt-1">
                      {isExpired ? (
                        <span className="px-2 py-0.5 bg-rose-50 border border-rose-300 text-rose-700 font-mono text-[10px] font-bold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Süresi Doldu ({Math.abs(daysRemaining)} gün önce)
                        </span>
                      ) : isExpiringSoon ? (
                        <span className="px-2 py-0.5 bg-amber-50 border border-amber-300 text-amber-800 font-mono text-[10px] font-bold inline-flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Yenileme Yaklaştı ({daysRemaining} gün kaldı)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 font-mono text-[10px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Aktif ({daysRemaining} gün kaldı)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 6. Sözleşme No / Sorumlu */}
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div className="text-slate-700 font-bold">{m.contractNumber || "TL-YET-Belirtilmedi"}</div>
                    <div className="text-slate-400 text-[10px] mt-0.5">
                      Danışman: <span className="text-[#00adb5] font-semibold">{m.assignedToName}</span>
                    </div>
                  </td>

                  {/* 7. Yetki Aksiyonu (WhatsApp Uzatma) */}
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppRenewal(m)}
                      className={`px-2.5 py-1 text-[11px] font-mono font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 mx-auto ${
                        isExpiringSoon || isExpired
                          ? "bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-700 shadow-2xs"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                      }`}
                      title="Mal sahibine tek tıkla resmi yetki uzatma mesajı gönder"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{isExpired ? "Yenileme Mesajı" : "WhatsApp Hatırlat"}</span>
                    </button>
                  </td>

                  {/* 8. İşlem (Menü) */}
                  <td className="py-3 px-4 text-center">
                    <ActionMenu
                      onEdit={() => handleOpenEdit(m)}
                      onDelete={() => setMandateToDelete(m)}
                      canEdit={canManageMandate(m)}
                      canDelete={canManageMandate(m)}
                    />
                  </td>
                </tr>
              );
            })}

            {filteredMandates.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 font-mono text-xs">
                  Arama kriterlerine uyan yetki sözleşmesi bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* YENİ YETKİ EKLE / DÜZENLE MODALI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="sharp-card w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-300 bg-white shadow-2xl">
            {/* Modal Başlığı */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#00adb5]" />
                <h2 className="text-sm font-bold text-[#1d2566]">
                  {editingMandate ? "Yetki Sözleşmesini Düzenle" : "Yeni Yetki Sözleşmesi Kaydı"}
                </h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitMandate} className="p-5 space-y-4 text-xs flex-1 overflow-y-auto">
              {subNotice && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{subNotice}</span>
                </div>
              )}

              {/* 1. Mülk / Portföy Seçimi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-[#00adb5]" />
                    Yetki Alınan Portföy <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddPropertySubModalOpen(true)}
                    className="text-[11px] text-[#00adb5] hover:text-[#1d2566] font-bold flex items-center gap-1 cursor-pointer font-mono"
                  >
                    <Plus className="w-3 h-3" /> Yeni Portföy Ekle
                  </button>
                </div>
                <select
                  required
                  value={formPropertyId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setFormPropertyId(pid);
                    const prop = properties.find((p) => p.id === pid);
                    if (prop && prop.ownerCustomerId) {
                      setFormOwnerCustomerId(prop.ownerCustomerId);
                    }
                  }}
                  className="w-full p-2 border border-slate-300 text-xs focus:border-[#00adb5] outline-none bg-white font-mono"
                >
                  <option value="">-- Portföy Seçin --</option>
                  {properties.filter((p) => !p.deletedAt).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.region}) - {p.price.toLocaleString("tr-TR")} {p.currency}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Mal Sahibi Seçimi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#00adb5]" />
                    Mal Sahibi (Müşteri Havuzundan) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddCustomerSubModalOpen(true)}
                    className="text-[11px] text-[#00adb5] hover:text-[#1d2566] font-bold flex items-center gap-1 cursor-pointer font-mono"
                  >
                    <UserPlus className="w-3 h-3" /> Yeni Mal Sahibi Ekle
                  </button>
                </div>
                <select
                  required
                  value={formOwnerCustomerId}
                  onChange={(e) => setFormOwnerCustomerId(e.target.value)}
                  className="w-full p-2 border border-slate-300 text-xs focus:border-[#00adb5] outline-none bg-white font-mono"
                >
                  <option value="">-- Mal Sahibi Seçin --</option>
                  {customers.filter((c) => !c.deletedAt).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({formatPhoneWithPrefix(c.phone || c.whatsapp) || c.phone || c.whatsapp || "Tel yok"}) - {c.category === "SELLER" ? "Satıcı" : "Müşteri"}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Yetki Tipi & Komisyon Oranı */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Yetki Türü
                  </label>
                  <select
                    value={formMandateType}
                    onChange={(e) => setFormMandateType(e.target.value as "exclusive" | "open")}
                    className="w-full p-2 border border-slate-300 text-xs focus:border-[#00adb5] outline-none bg-white font-mono font-semibold"
                  >
                    <option value="exclusive">Tek Yetkili (Exclusive)</option>
                    <option value="open">Genel Yetkili (Open)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-emerald-600" />
                    Komisyon Oranı (%)
                  </label>
                  <select
                    value={formCommissionRate}
                    onChange={(e) => setFormCommissionRate(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 text-xs focus:border-[#00adb5] outline-none bg-white font-mono font-bold text-emerald-700"
                  >
                    <option value={1}>%1</option>
                    <option value={2}>%2</option>
                    <option value={3}>%3</option>
                    <option value={4}>%4</option>
                    <option value={5}>%5 (Standart KKTC)</option>
                    <option value={10}>%10</option>
                    <option value={15}>%15</option>
                    <option value={100}>%100 (Kiralık)</option>
                  </select>
                </div>
              </div>

              {/* 4. Geçerlilik Tarihleri & Hızlı Ayarlayıcılar */}
              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[#1d2566]">Sözleşme Süresi</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSetDurationMonths(3)}
                      className="px-2 py-0.5 bg-white border border-slate-300 hover:border-[#00adb5] text-[10px] font-bold cursor-pointer"
                    >
                      +3 Ay
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDurationMonths(6)}
                      className="px-2 py-0.5 bg-white border border-slate-300 hover:border-[#00adb5] text-[10px] font-bold cursor-pointer"
                    >
                      +6 Ay
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDurationMonths(12)}
                      className="px-2 py-0.5 bg-white border border-slate-300 hover:border-[#00adb5] text-[10px] font-bold cursor-pointer"
                    >
                      +1 Yıl
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 text-[11px] font-mono mb-1">
                      Başlangıç Tarihi
                    </label>
                    <DateInput
                      required
                      value={formStartDate}
                      onChange={(val) => setFormStartDate(val)}
                      className="w-full text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-[11px] font-mono mb-1">
                      Bitiş Tarihi
                    </label>
                    <DateInput
                      required
                      value={formEndDate}
                      onChange={(val) => setFormEndDate(val)}
                      className="w-full text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Sözleşme No & Sorumlu Danışman */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sözleşme / Belge No
                  </label>
                  <input
                    type="text"
                    placeholder="TL-YET-2026-..."
                    value={formContractNumber}
                    onChange={(e) => setFormContractNumber(e.target.value)}
                    className="w-full p-2 border border-slate-300 text-xs focus:border-[#00adb5] outline-none font-mono"
                  />
                </div>

                {isBroker && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Sorumlu Danışman
                    </label>
                    <select
                      value={formAdvisorId}
                      onChange={(e) => setFormAdvisorId(e.target.value)}
                      className="w-full p-2 border border-slate-300 text-xs focus:border-[#00adb5] outline-none bg-white font-mono"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 6. Notlar */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Yetki Notları / Özel Şartlar
                </label>
                <textarea
                  rows={2}
                  placeholder="Anahtar teslim durumu, pazarlama kanalı kısıtlamaları vb..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 text-xs focus:border-[#00adb5] outline-none"
                />
              </div>

              {/* Butonlar */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs cursor-pointer font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="sharp-btn-primary px-5 py-2 text-xs font-bold cursor-pointer shadow-xs"
                >
                  {editingMandate ? "Değişiklikleri Kaydet" : "Yetki Sözleşmesini Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STANDART PORTFÖY VE MÜŞTERİ MODALLARI ENTEGRASYONU */}
      <AddPropertyModal
        isOpen={isAddPropertySubModalOpen}
        onClose={() => setIsAddPropertySubModalOpen(false)}
        initialOwnerCustomerId={formOwnerCustomerId}
        onSuccess={(newProp) => {
          setFormPropertyId(newProp.id);
          if (newProp.ownerCustomerId) {
            setFormOwnerCustomerId(newProp.ownerCustomerId);
          }
          setIsAddPropertySubModalOpen(false);
          setSubNotice(`✓ Yeni portföy oluşturuldu ve yetki belgesine seçildi: ${newProp.title}`);
          setTimeout(() => setSubNotice(null), 5000);
        }}
      />

      <AddCustomerModal
        isOpen={isAddCustomerSubModalOpen}
        onClose={() => setIsAddCustomerSubModalOpen(false)}
        initialCategory="SELLER"
        onSuccess={(newCust) => {
          setFormOwnerCustomerId(newCust.id);
          setIsAddCustomerSubModalOpen(false);
          setSubNotice(`✓ Yeni mal sahibi müşteri havuzuna eklendi ve seçildi: ${newCust.fullName}`);
          setTimeout(() => setSubNotice(null), 5000);
        }}
      />

      {/* SİLME ONAY MODALI */}
      {mandateToDelete && (
        <DeleteConfirmModal
          isOpen={true}
          onCancel={() => setMandateToDelete(null)}
          onConfirm={() => {
            deleteMandateContract(mandateToDelete.id);
            setMandateToDelete(null);
          }}
          title="Yetki Sözleşmesini Sil"
          message={`'${mandateToDelete.propertyTitle}' portföyüne ait ${mandateToDelete.contractNumber || ""} numaralı yetki sözleşmesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
          confirmText="Yetki Sözleşmesini Sil"
        />
      )}

    </div>
  );
}
