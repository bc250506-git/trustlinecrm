"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Customer, CustomerCategory, Currency, PipelineStage } from "@/lib/types";
import { KKTC_DISTRICTS, getRegionsByDistrict } from "@/lib/kktcLocations";
import { isCustomerActiveTenant } from "@/lib/matchmaker";
import { formatDateTR, cleanWhatsAppNumber, formatPhoneWithPrefix } from "@/lib/formatters";
import {
  Users,
  Plus,
  Search,
  Star,
  Phone,
  MessageSquare,
  Sparkles,
  Filter,
  Check,
  X,
  AlertTriangle,
  Flame,
  ArrowUpDown,
  Mail,
  AtSign,
  UserCheck,
  Share2,
  MapPin,
  Trash2,
  Lock,
  Cake,
  MessageCircle,
} from "lucide-react";
import { ActionMenu } from "@/components/common/ActionMenu";
import { DeleteConfirmModal } from "@/components/common/DeleteConfirmModal";
import { AddCustomerModal } from "@/components/modals/AddCustomerModal";

interface CustomersViewProps {
  onFindMatches: (customer: Customer) => void;
  selectedCustomerId?: string | null;
}

export function CustomersView({
  onFindMatches,
  selectedCustomerId,
}: CustomersViewProps) {
  const {
    customers,
    myCustomers,
    sharedCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    toggleCustomerShare,
    canManageCustomer,
    isBroker,
    currentUser,
    users,
    rentals,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [temperatureFilter, setTemperatureFilter] = useState<string>("ALL");
  const [vipOnly, setVipOnly] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeCustomerDetail, setActiveCustomerDetail] = useState<Customer | null>(
    selectedCustomerId
      ? customers.find((c) => c.id === selectedCustomerId) || null
      : null
  );

  // Silme Onay Modalı State
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Popuplar açıkken arkaplan asla scroll yapılamasın
  useEffect(() => {
    const hasOpenModal =
      isAddModalOpen || activeCustomerDetail !== null || customerToDelete !== null;
    if (hasOpenModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAddModalOpen, activeCustomerDetail, customerToDelete]);

  // Filtreleme fonksiyonu
  const filterList = (list: Customer[]) => {
    return list.filter((c) => {
      if (c.deletedAt) return false;
      if (vipOnly && !c.isVip) return false;
      if (categoryFilter !== "ALL" && c.category !== categoryFilter) return false;
      if (temperatureFilter !== "ALL" && c.temperature !== temperatureFilter)
        return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = c.fullName.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q);
        const matchRegion = c.region?.toLowerCase().includes(q);
        const matchType = c.propertyType?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchRegion && !matchType) return false;
      }

      return true;
    });
  };

  const filteredMyCustomers = filterList(myCustomers);
  const filteredSharedCustomers = filterList(sharedCustomers);
  const filteredAllCustomers = filterList(customers);

  const toggleVip = (id: string, currentStatus?: boolean) => {
    updateCustomer(id, { isVip: !currentStatus });
  };



  const renderCustomerTable = (customerList: Customer[], isSharedPool: boolean) => (
    <div className="sharp-card overflow-x-auto shadow-2xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider font-bold">
            <th className="py-3 px-4 w-12 text-center">VIP</th>
            <th className="py-3 px-4">Müşteri Adı & İletişim</th>
            <th className="py-3 px-4">Kategori / Niyet</th>
            <th className="py-3 px-4">Bölge & Tercih</th>
            <th className="py-3 px-4">Bütçe</th>
            <th className="py-3 px-4">Sıcaklık</th>
            <th className="py-3 px-4">Danışman / Paylaşım Durumu</th>
            <th className="py-3 px-4 text-right">Aksiyonlar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {customerList.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="py-10 text-center text-slate-400 font-mono"
              >
                {isSharedPool
                  ? "Diğer danışmanlar tarafından ortak çalışmaya açılmış müşteri kaydı bulunmuyor."
                  : "Bu filtreye uygun müşteri kaydı bulunamadı."}
              </td>
            </tr>
          ) : (
            customerList.map((c) => (
              <tr
                key={c.id}
                className="hover:bg-slate-50/80 transition group font-sans"
              >
                {/* VIP Yıldızı */}
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => toggleVip(c.id, c.isVip)}
                    className="cursor-pointer text-slate-300 hover:text-amber-500 transition"
                    title={c.isVip ? "VIP'den Çıkar" : "VIP Yap"}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        c.isVip
                          ? "fill-amber-500 text-amber-500"
                          : "hover:fill-amber-400/40"
                      }`}
                    />
                  </button>
                </td>

                {/* Adı & İletişim */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setActiveCustomerDetail(c)}
                      className="text-left font-bold text-[#1d2566] hover:text-[#00adb5] transition block text-sm cursor-pointer leading-snug"
                    >
                      {c.fullName}
                    </button>
                    {(() => {
                      if (!c.birthDate) return null;
                      const parts = c.birthDate.split("-");
                      if (parts.length < 3) return null;
                      const now = new Date();
                      const isToday =
                        now.getMonth() + 1 === Number(parts[1]) &&
                        now.getDate() === Number(parts[2]);
                      if (isToday) {
                        return (
                          <span
                            title="Bugün doğum günü! Tebrik mesajı iletin."
                            className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-pink-100 text-pink-700 border border-pink-300 px-2 py-0.5 animate-pulse"
                          >
                            <Cake className="w-3.5 h-3.5 text-pink-600" />
                            Bugün Doğum Günü!
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 font-mono">
                    <span className="font-semibold text-slate-700">{formatPhoneWithPrefix(c.phone) || c.phone || "Telefon yok"}</span>
                    {c.email && <span>• {c.email}</span>}
                    {c.birthDate && (
                      <span className="text-slate-500">
                        • 🎂 {formatDateTR(c.birthDate)}
                      </span>
                    )}
                  </div>
                </td>

                {/* Kategori */}
                <td className="py-3 px-4">
                  {(() => {
                    const isActiveTenant = c.category === "TENANT" && isCustomerActiveTenant(c, rentals);
                    return (
                      <span
                        className={`text-xs font-mono uppercase px-2.5 py-1 border font-bold ${
                          c.category === "BUYER"
                            ? "bg-[#00adb5]/10 text-[#00adb5] border-[#00adb5]/30"
                            : c.category === "SELLER"
                            ? "bg-[#1d2566]/10 text-[#1d2566] border-[#1d2566]/20"
                            : isActiveTenant
                            ? "bg-slate-100 text-slate-700 border-slate-300"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {c.category === "BUYER"
                          ? "Alıcı"
                          : c.category === "SELLER"
                          ? "Satıcı"
                          : isActiveTenant
                          ? "Aktif Kiracı"
                          : "Kiracı Adayı"}
                      </span>
                    );
                  })()}
                </td>

                {/* Bölge & Gayrimenkul Tipi */}
                <td className="py-3 px-4 text-slate-700">
                  <div className="text-sm font-semibold text-slate-800">{c.region || "Belirtilmedi"}</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {c.propertyType || "Herhangi"}
                    {c.rooms && c.rooms !== "Farketmez / Tümü" && ` • ${c.rooms}`}
                  </div>
                </td>

                {/* Bütçe */}
                <td className="py-3 px-4 font-mono font-bold text-sm text-[#1d2566]">
                  {c.budget?.toLocaleString("tr-TR")} {c.budgetCurrency}
                </td>

                {/* Sıcaklık */}
                <td className="py-3 px-4">
                  <span
                    className={`text-xs font-mono uppercase px-2.5 py-0.5 border font-bold flex items-center gap-1 w-fit ${
                      c.temperature === "hot"
                        ? "bg-rose-50 text-rose-700 border-rose-300"
                        : c.temperature === "warm"
                        ? "bg-amber-50 text-amber-700 border-amber-300"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {c.temperature === "hot" && <Flame className="w-3 h-3 text-rose-600" />}
                    {c.temperature === "hot"
                      ? "Sıcak"
                      : c.temperature === "warm"
                      ? "Ilık"
                      : "Soğuk"}
                  </span>
                </td>

                {/* Danışman & Paylaşım Durumu */}
                <td className="py-3 px-4 text-xs font-mono">
                  <div className="font-semibold text-slate-800">
                    {c.assignedToName || "Atanmadı"}
                  </div>
                  {c.assignedToId === currentUser.id ? (
                    <button
                      type="button"
                      onClick={() => toggleCustomerShare(c.id)}
                      className={`mt-1 inline-flex items-center gap-1 text-xs px-2 py-0.5 border cursor-pointer font-bold transition ${
                        c.isShared
                          ? "bg-cyan-50 text-[#00adb5] border-cyan-300 hover:bg-cyan-100"
                          : "bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                      }`}
                      title="Diğer danışmanlara paylaşımı aç/kapat"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>{c.isShared ? "Ekiple Paylaşıldı" : "Bireysel (Gizli)"}</span>
                    </button>
                  ) : (
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-cyan-50 text-[#00adb5] border border-cyan-300 font-bold">
                      <Share2 className="w-2.5 h-2.5" />
                      <span>Paylaşan: {c.assignedToName}</span>
                    </span>
                  )}
                </td>

                {/* Hızlı Aksiyonlar */}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Eşleştirme Motoru Butonu (Yalnızca ALICI ve KİRACI ADAYLARI için gösterilir) */}
                    {(c.category === "BUYER" || (c.category === "TENANT" && !isCustomerActiveTenant(c, rentals))) && (
                      <button
                        onClick={() => onFindMatches(c)}
                        className="px-2.5 py-1 bg-[#00adb5] hover:bg-[#00939a] text-white text-[11px] font-mono flex items-center gap-1 transition cursor-pointer font-bold shadow-2xs"
                        title="Bu Müşteriye Uygun Portföyleri Eşleştir"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                        <span>Eşleştir</span>
                      </button>
                    )}

                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="p-1 bg-white border border-slate-300 hover:border-[#00adb5] hover:text-[#00adb5] text-slate-600 transition"
                        title="Telefonla Ara"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {c.whatsapp && (
                      <a
                        href={`https://wa.me/${cleanWhatsAppNumber(c.whatsapp)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-600 text-slate-600 transition"
                        title="WhatsApp Aç"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {canManageCustomer(c) && (
                      <ActionMenu
                        onEdit={() => setActiveCustomerDetail(c)}
                        onDelete={() => setCustomerToDelete(c)}
                        canEdit={canManageCustomer(c)}
                        canDelete={canManageCustomer(c)}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Üst Başlık ve Aksiyonlar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#00adb5] font-bold tracking-wider uppercase">
              MÜŞTERİ PORTFÖYÜ
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              {isBroker ? "Ofis Genel Havuzu" : "Danışman Portföyü"}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1d2566] tracking-tight">
            Müşteri Havuzu ve Talepler
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Alıcı, satıcı ve kiracı taleplerini takip edin; bütçe ve lokasyon
            kriterlerine göre tek tıkla mülk eşleştirin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="sharp-btn-primary px-4 py-2 text-xs flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Müşteri Ekle</span>
          </button>
        </div>
      </div>

      {/* Filtre ve Arama Çubuğu */}
      <div className="sharp-card p-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Arama */}
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="İsim, telefon, bölge veya tip ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sharp-input w-full pl-8.5 pr-3 py-1.5 text-xs font-mono"
          />
        </div>

        {/* Filtre Butonları */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Kategori Filtresi */}
          <div className="flex items-center bg-slate-100 border border-slate-200 p-0.5">
            {[
              { id: "ALL", label: "Tümü" },
              { id: "BUYER", label: "Alıcı" },
              { id: "SELLER", label: "Satıcı" },
              { id: "TENANT", label: "Kiracı" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 text-[11px] font-mono transition cursor-pointer ${
                  categoryFilter === cat.id
                    ? "bg-[#1d2566] text-white font-bold shadow-2xs"
                    : "text-slate-600 hover:text-[#1d2566]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sıcaklık Filtresi */}
          <div className="flex items-center bg-slate-100 border border-slate-200 p-0.5">
            {[
              { id: "ALL", label: "Sıcaklık: Tümü" },
              { id: "hot", label: "Sıcak" },
              { id: "warm", label: "Ilık" },
              { id: "cold", label: "Soğuk" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTemperatureFilter(t.id)}
                className={`px-2 py-1 text-[11px] font-mono transition cursor-pointer ${
                  temperatureFilter === t.id
                    ? "bg-rose-600 text-white font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* VIP Filtresi */}
          <button
            onClick={() => setVipOnly(!vipOnly)}
            className={`px-2.5 py-1 border text-[11px] font-mono flex items-center gap-1.5 transition cursor-pointer ${
              vipOnly
                ? "bg-amber-100 border-amber-400 text-amber-900 font-bold"
                : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
            }`}
          >
            <Star
              className={`w-3 h-3 ${vipOnly ? "fill-amber-500 text-amber-500" : ""}`}
            />
            <span>VIP Yalnızca</span>
          </button>
        </div>
      </div>

      {/* Müşteri Listesi (Danışman İzolasyonu & Ortak Paylaşım) */}
      {isBroker ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1d2566]" />
              <h2 className="text-sm font-bold text-[#1d2566] uppercase font-mono tracking-wide">
                Ofis Genel Müşteri Havuzu ({filteredAllCustomers.length})
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Broker Denetim Masası — Tüm Ekip
            </span>
          </div>
          {renderCustomerTable(filteredAllCustomers, false)}
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. Kişisel Müşteriler */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#1d2566]" />
                <h2 className="text-sm font-bold text-[#1d2566] uppercase font-mono tracking-wide">
                  Kişisel Müşteri Havuzum ({filteredMyCustomers.length})
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Sadece sizin takip ettiğiniz müşteriler (diğer danışmanlar göremez)
              </span>
            </div>
            {renderCustomerTable(filteredMyCustomers, false)}
          </div>

          {/* 2. Diğer Danışmanlardan Paylaşılan Müşteriler */}
          <div className="space-y-3 pt-4 border-t-2 border-dashed border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#00adb5]" />
                <h2 className="text-sm font-bold text-[#00adb5] uppercase font-mono tracking-wide">
                  Diğer Danışmanlardan Paylaşılan Müşteriler ({filteredSharedCustomers.length})
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Ekip arkadaşlarının ortak çalışmaya açtığı talepler
              </span>
            </div>
            {renderCustomerTable(filteredSharedCustomers, true)}
          </div>
        </div>
      )}

      {/* Standardize Yeni Müşteri Modal */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Müşteri Detay Modalı / Yan Kartı */}
      {activeCustomerDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4">
          <div className="sharp-card w-full max-w-lg border border-slate-300 bg-white shadow-2xl">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#00adb5] uppercase font-bold">
                  Müşteri Kartı Detayı
                </div>
                <h3 className="text-sm font-bold text-[#1d2566]">
                  {activeCustomerDetail.fullName}
                </h3>
              </div>
              <button
                onClick={() => setActiveCustomerDetail(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 border border-slate-200 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">TELEFON:</span>
                  <span className="text-slate-800 font-semibold">
                    {formatPhoneWithPrefix(activeCustomerDetail.phone) || activeCustomerDetail.phone || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">WHATSAPP:</span>
                  <span className="text-slate-800 font-semibold">
                    {formatPhoneWithPrefix(activeCustomerDetail.whatsapp) || activeCustomerDetail.whatsapp || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">BÜTÇE:</span>
                  <span className="text-[#1d2566] font-bold text-sm">
                    {activeCustomerDetail.budget?.toLocaleString("tr-TR")}{" "}
                    {activeCustomerDetail.budgetCurrency}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">BÖLGE & TİP:</span>
                  <span className="text-slate-800 font-semibold">
                    {activeCustomerDetail.region} / {activeCustomerDetail.propertyType}
                    {activeCustomerDetail.rooms && activeCustomerDetail.rooms !== "Farketmez / Tümü" && ` (${activeCustomerDetail.rooms})`}
                  </span>
                </div>
                <div className="col-span-2 border-t border-slate-200 pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[10px]">DOĞUM TARİHİ:</span>
                    <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                      <Cake className="w-3.5 h-3.5 text-pink-500" />
                      {activeCustomerDetail.birthDate
                        ? formatDateTR(activeCustomerDetail.birthDate)
                        : "Belirtilmedi"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Doğum Günü Kutlama Kartı (Eğer Bugün Doğum Günü İse) */}
              {(() => {
                if (!activeCustomerDetail.birthDate) return null;
                const parts = activeCustomerDetail.birthDate.split("-");
                if (parts.length < 3) return null;
                const now = new Date();
                const isToday =
                  now.getMonth() + 1 === Number(parts[1]) &&
                  now.getDate() === Number(parts[2]);
                if (!isToday) return null;

                const phone = activeCustomerDetail.whatsapp || activeCustomerDetail.phone || "";
                const cleanPhone = cleanWhatsAppNumber(phone);
                const greeting = `Sayın ${activeCustomerDetail.fullName}, Trustline Gayrimenkul ailesi olarak yeni yaşınızı en içten dileklerimizle kutlar; sevdiklerinizle birlikte sağlıklı, huzurlu ve bereketli bir yıl dileriz. 🎂🎉`;
                const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(greeting)}`;

                return (
                  <div className="p-3 bg-pink-50 border border-pink-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Cake className="w-4 h-4 text-pink-600 shrink-0" />
                      <div className="text-xs text-pink-900">
                        <strong>Bugün Doğum Günü!</strong> Müşterinize kutlama mesajı iletin.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.open(url, "_blank")}
                      className="px-2.5 py-1 bg-pink-600 hover:bg-pink-700 text-white text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs shrink-0"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Kutlama
                    </button>
                  </div>
                );
              })()}

              <div>
                <span className="text-[11px] font-mono text-slate-500 font-bold block mb-1">
                  ÖZEL DANIŞMAN NOTU:
                </span>
                <p className="p-3 bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed font-sans">
                  {activeCustomerDetail.notes || "Henüz not eklenmedi."}
                </p>
              </div>

              {/* Popup Modal İçindeki "Diğer Danışmanlara Paylaş" Checkbox'ı */}
              {(() => {
                const canManageActive = canManageCustomer(activeCustomerDetail);

                return (
                  <>
                    <div className="p-3 bg-slate-50 border border-slate-200 flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="detailCustomerShareCheckbox"
                          checked={activeCustomerDetail.isShared || false}
                          disabled={!canManageActive}
                          onChange={() => {
                            if (!canManageActive) return;
                            toggleCustomerShare(activeCustomerDetail.id);
                            setActiveCustomerDetail({
                              ...activeCustomerDetail,
                              isShared: !activeCustomerDetail.isShared,
                            });
                          }}
                          className={`w-4 h-4 mt-0.5 accent-[#00adb5] rounded-none ${
                            canManageActive ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                          }`}
                        />
                        <label
                          htmlFor="detailCustomerShareCheckbox"
                          className={canManageActive ? "cursor-pointer" : "cursor-not-allowed"}
                        >
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Share2 className="w-3.5 h-3.5 text-[#00adb5]" />
                            Diğer Danışmanlara Paylaş
                          </span>
                          <span className="text-[11px] text-slate-500 block font-mono mt-0.5">
                            {activeCustomerDetail.isShared
                              ? "Bu talep şu anda diğer tüm danışmanların paylaşılan havuzunda görünmektedir."
                              : "Bu talep yalnızca sizin kişisel havuzunuzdadır."}
                          </span>
                        </label>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 uppercase font-bold shrink-0 ${
                          activeCustomerDetail.isShared
                            ? "bg-cyan-50 text-[#00adb5] border border-cyan-300"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {activeCustomerDetail.isShared ? "Paylaşıldı" : "Bireysel"}
                      </span>
                    </div>


                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          const c = activeCustomerDetail;
                          setActiveCustomerDetail(null);
                          onFindMatches(c);
                        }}
                        className="sharp-btn-primary px-3.5 py-1.5 flex items-center gap-1.5 font-mono cursor-pointer shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Eşleşen Portföyleri Aç
                      </button>

                      {canManageActive && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerToDelete(activeCustomerDetail);
                          }}
                          className="sharp-btn-danger px-3 py-1.5 text-[11px] font-mono cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Müşteriyi Sil</span>
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* SİLME ONAY MODALI */}
      <DeleteConfirmModal
        isOpen={!!customerToDelete}
        title="Müşteri Kaydını Sil"
        itemName={customerToDelete ? customerToDelete.fullName : undefined}
        message="Bu müşteri kaydı, iletişim bilgileri ve talep geçmişi sistemden kalıcı olarak silinecektir."
        onConfirm={() => {
          if (customerToDelete) {
            deleteCustomer(customerToDelete.id);
            if (activeCustomerDetail?.id === customerToDelete.id) {
              setActiveCustomerDetail(null);
            }
            setCustomerToDelete(null);
          }
        }}
        onCancel={() => setCustomerToDelete(null)}
      />
    </div>
  );
}
