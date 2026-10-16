"use client";

import React, { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { Property, Currency, PropertyStatus, Customer } from "@/lib/types";
import { BrochureModal } from "../brochure/BrochureModal";
import { AddCustomerModal } from "@/components/modals/AddCustomerModal";
import {
  KKTC_DISTRICTS,
  getRegionsByDistrict,
} from "@/lib/kktcLocations";
import {
  Building,
  Plus,
  Search,
  Sparkles,
  Share2,
  Lock,
  Key,
  MapPin,
  Maximize2,
  BedDouble,
  User,
  Phone,
  FileText,
  X,
  Filter,
  Eye,
  Check,
  ShieldCheck,
  Briefcase,
  UserPlus,
  ExternalLink,
  UserCheck,
  ShieldAlert,
  Globe,
  ChevronDown,
  Trash2,
  Archive,
  Edit3,
  Award,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { PropertyImageUploader } from "./PropertyImageUploader";
import { ActionMenu } from "@/components/common/ActionMenu";
import { DeleteConfirmModal } from "@/components/common/DeleteConfirmModal";
import { AddDealModal } from "../modals/AddDealModal";

interface PropertiesViewProps {
  onFindMatches: (property: Property) => void;
}

export function PropertiesView({ onFindMatches }: PropertiesViewProps) {
  const {
    properties,
    myProperties,
    sharedProperties,
    customers,
    myCustomers,
    addProperty,
    addCustomer,
    updateProperty,
    deleteProperty,
    togglePropertyShare,
    canManageProperty,
    isBroker,
    currentUser,
    users,
    mandates,
    reactivateProperty,
  } = useStore();

  // İlgili portföyün Tek Yetki Sözleşmesi kontrolü
  const getExclusiveMandate = (property: Property) => {
    return mandates.find(
      (m) =>
        (m.propertyId === property.id ||
          (m.propertyTitle &&
            property.title &&
            m.propertyTitle.trim().toLowerCase() === property.title.trim().toLowerCase())) &&
        m.mandateType === "exclusive" &&
        m.status !== "cancelled"
    );
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [listingTypeFilter, setListingTypeFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [districtFilter, setDistrictFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activePropertyDetail, setActivePropertyDetail] = useState<Property | null>(null);
  const [brochureProperty, setBrochureProperty] = useState<Property | null>(null);

  // KKTC Bölge State (Yeni Portföy)
  const [formDistrict, setFormDistrict] = useState("Girne");
  const [formSubRegion, setFormSubRegion] = useState("Alsancak");

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formImageUrl, setFormImageUrl] = useState<string | undefined>(undefined);
  const [formPropertyType, setFormPropertyType] = useState("Daire");
  const [formListingType, setFormListingType] = useState<"sale" | "rent">("sale");
  const [formPrice, setFormPrice] = useState("");
  const [formCurrency, setFormCurrency] = useState<Currency>("GBP");
  const [formArea, setFormArea] = useState("");
  const [formRooms, setFormRooms] = useState("3+1");
  const [formAddress, setFormAddress] = useState("");
  const [formKeyHolder, setFormKeyHolder] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formPublicDesc, setFormPublicDesc] = useState("");
  const [formListingUrl, setFormListingUrl] = useState("");
  const [formIsOffMarket, setFormIsOffMarket] = useState(false);
  const [formIsShared, setFormIsShared] = useState(false);
  const [formAssigneeId, setFormAssigneeId] = useState(currentUser.id);

  // Mülk Sahibi Seçimi & Arama State
  const [formOwnerCustomerId, setFormOwnerCustomerId] = useState("");
  const [ownerSearchQuery, setOwnerSearchQuery] = useState("");
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);
  const [sellerNotice, setSellerNotice] = useState<string | null>(null);
  const ownerDropdownRef = useRef<HTMLDivElement>(null);

  // "+ Yeni Satıcı Ekle" Sub-Modal State (Standardize Modal Entegrasyonu)
  const [isAddSellerSubModalOpen, setIsAddSellerSubModalOpen] = useState(false);

  // Silme Onay Modalı State
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  // İşlem Kapama Modalı State
  const [dealCloseProperty, setDealCloseProperty] = useState<Property | null>(null);
  const [isDealCloseModalOpen, setIsDealCloseModalOpen] = useState(false);

  // Portföy Düzenleme Modalı State
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editImageUrl, setEditImageUrl] = useState<string | undefined>(undefined);
  const [editDistrict, setEditDistrict] = useState("Girne");
  const [editSubRegion, setEditSubRegion] = useState("Alsancak");
  const [editListingType, setEditListingType] = useState<"sale" | "rent">("sale");
  const [editPropertyType, setEditPropertyType] = useState("Daire");
  const [editPrice, setEditPrice] = useState("");
  const [editCurrency, setEditCurrency] = useState<Currency>("GBP");
  const [editArea, setEditArea] = useState("");
  const [editRooms, setEditRooms] = useState("3+1");
  const [editStatus, setEditStatus] = useState<PropertyStatus>("AVAILABLE");
  const [editAddress, setEditAddress] = useState("");
  const [editOwnerCustomerId, setEditOwnerCustomerId] = useState("");
  const [editOwnerName, setEditOwnerName] = useState("");
  const [editOwnerPhone, setEditOwnerPhone] = useState("");
  const [editKeyHolder, setEditKeyHolder] = useState("");
  const [editListingUrl, setEditListingUrl] = useState("");
  const [editIsOffMarket, setEditIsOffMarket] = useState(false);
  const [editIsShared, setEditIsShared] = useState(false);
  const [editAssigneeId, setEditAssigneeId] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPublicDesc, setEditPublicDesc] = useState("");

  const handleOpenEditModal = (p: Property) => {
    setEditingProperty(p);
    setEditTitle(p.title);

    const regionParts = p.region.split("/").map((s) => s.trim());
    const matchedDistrict =
      KKTC_DISTRICTS.find((d) => d === regionParts[0]) || KKTC_DISTRICTS[0];
    setEditDistrict(matchedDistrict);
    const subRegions = getRegionsByDistrict(matchedDistrict);
    setEditSubRegion(
      regionParts[1] && subRegions.includes(regionParts[1])
        ? regionParts[1]
        : subRegions[0] || ""
    );

    setEditListingType(p.listingType);
    setEditPropertyType(p.propertyType);
    setEditPrice(String(p.price));
    setEditCurrency(p.currency);
    setEditArea(p.area ? String(p.area) : "");
    setEditRooms(p.rooms || "3+1");
    setEditStatus(p.status);
    setEditAddress(p.address || "");
    setEditOwnerCustomerId(p.ownerCustomerId || "");
    setEditOwnerName(p.ownerName || "");
    setEditOwnerPhone(p.ownerPhone || "");
    setEditKeyHolder(p.keyHolder || "");
    setEditListingUrl(p.listingUrl || "");
    setEditIsOffMarket(p.isOffMarket || false);
    setEditIsShared(p.isShared || false);
    setEditAssigneeId(p.assignedToId || currentUser.id);
    setEditNotes(p.notes || "");
    setEditPublicDesc(p.publicDescription || "");
    setEditImageUrl(p.imageUrl || p.photos?.[0]?.url || undefined);
  };

  const handleEditDistrictChange = (d: string) => {
    setEditDistrict(d);
    const regions = getRegionsByDistrict(d);
    setEditSubRegion(regions[0] || "");
  };

  const handleSavePropertyEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;

    if (!editTitle.trim()) {
      alert("Lütfen portföy başlığını doldurun.");
      return;
    }
    const priceNum = Number(editPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Lütfen geçerli bir portföy fiyatı girin.");
      return;
    }

    const fullRegion = `${editDistrict} / ${editSubRegion}`;
    const assignedUser = users.find(
      (u) => u.id === (isBroker ? editAssigneeId : editingProperty.assignedToId)
    );

    if (!editOwnerCustomerId) {
      alert("Lütfen portföyün mal sahibini müşteri havuzundan seçin!");
      return;
    }

    const cust = customers.find((c) => c.id === editOwnerCustomerId);
    const finalOwnerName = cust?.fullName || "Bilinmiyor";
    const finalOwnerPhone = cust?.phone || "";

    const photos = editImageUrl
      ? [
          {
            id: editingProperty.photos?.[0]?.id || `ph-${Date.now()}`,
            propertyId: editingProperty.id,
            url: editImageUrl,
            shareable: true,
          },
        ]
      : [];

    const updates = {
      title: editTitle.trim(),
      region: fullRegion,
      propertyType: editPropertyType,
      listingType: editListingType,
      price: priceNum,
      currency: editCurrency,
      area: Number(editArea) || 0,
      rooms: editRooms,
      status: editStatus,
      address: editAddress.trim(),
      ownerCustomerId: editOwnerCustomerId || undefined,
      ownerName: finalOwnerName.trim() || "Bilinmiyor",
      ownerPhone: finalOwnerPhone.trim(),
      keyHolder: editKeyHolder.trim(),
      notes: editNotes.trim(),
      publicDescription: editPublicDesc.trim(),
      isOffMarket: editIsOffMarket,
      listingUrl: editIsOffMarket ? undefined : editListingUrl.trim() || undefined,
      assignedToId: assignedUser?.id || editingProperty.assignedToId,
      assignedToName: assignedUser?.name || editingProperty.assignedToName,
      isShared: editIsShared,
      imageUrl: editImageUrl,
      photos,
    };

    const success = updateProperty(editingProperty.id, updates);
    if (success) {
      if (activePropertyDetail?.id === editingProperty.id) {
        setActivePropertyDetail({
          ...editingProperty,
          ...updates,
        });
      }
      setEditingProperty(null);
    }
  };

  // 4. Kural: Popuplar açıkken arkaplan asla scroll yapılamasın
  useEffect(() => {
    const hasOpenModal =
      isAddModalOpen ||
      isAddSellerSubModalOpen ||
      activePropertyDetail !== null ||
      propertyToDelete !== null ||
      editingProperty !== null ||
      isDealCloseModalOpen;
    if (hasOpenModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [
    isAddModalOpen,
    isAddSellerSubModalOpen,
    activePropertyDetail,
    propertyToDelete,
    editingProperty,
    isDealCloseModalOpen,
  ]);

  // Click outside to close owner dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        ownerDropdownRef.current &&
        !ownerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsOwnerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // KKTC İlçe değiştiğinde mahalle/bölgeyi otomatik güncelle
  const handleDistrictChange = (d: string) => {
    setFormDistrict(d);
    const regions = getRegionsByDistrict(d);
    setFormSubRegion(regions[0] || "");
  };



  // Müşteri havuzundan mülk sahibi seçildiğinde
  const handleSelectOwner = (customerId: string) => {
    setFormOwnerCustomerId(customerId);
    setIsOwnerDropdownOpen(false);
    setOwnerSearchQuery("");
  };

  const selectedOwner = customers.find((c) => c.id === formOwnerCustomerId);

  // Filtrelenmiş mülk sahipleri listesi (Arama destekli)
  const availableOwners = (isBroker ? customers : myCustomers)
    .filter((c) => {
      if (!ownerSearchQuery) return true;
      const q = ownerSearchQuery.toLowerCase();
      const matchName = c.fullName.toLowerCase().includes(q);
      const matchPhone = c.phone?.toLowerCase().includes(q);
      const matchRegion = c.region?.toLowerCase().includes(q);
      return matchName || matchPhone || matchRegion;
    })
    .sort((a, b) => {
      if (a.category === "SELLER" && b.category !== "SELLER") return -1;
      if (a.category !== "SELLER" && b.category === "SELLER") return 1;
      return a.fullName.localeCompare(b.fullName, "tr");
    });


  // Ortak Filtreleyici
  const filterList = (list: Property[]) => {
    return list.filter((p) => {
      if (listingTypeFilter !== "ALL" && p.listingType !== listingTypeFilter)
        return false;
      if (typeFilter !== "ALL" && p.propertyType !== typeFilter) return false;
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (
        districtFilter !== "ALL" &&
        !p.region.toLowerCase().includes(districtFilter.toLowerCase())
      ) {
        return false;
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchRegion = p.region.toLowerCase().includes(q);
        const matchOwner = p.ownerName?.toLowerCase().includes(q);
        if (!matchTitle && !matchRegion && !matchOwner) return false;
      }

      return true;
    });
  };

  const isActive = (p: Property) =>
    p.status !== "SOLD" && p.status !== "RENTED" && p.status !== "ARCHIVED" && !p.deletedAt;
  const isPassive = (p: Property) =>
    (p.status === "SOLD" || p.status === "RENTED") && !p.deletedAt;

  const filteredMyProperties = filterList(myProperties.filter(isActive));
  const filteredSharedProperties = filterList(sharedProperties.filter(isActive));
  const filteredAllProperties = filterList(properties.filter(isActive));

  const passivePool = isBroker
    ? properties.filter(isPassive)
    : properties.filter(
        (p) => isPassive(p) && (p.assignedToId === currentUser.id || p.isShared)
      );
  const filteredPassiveProperties = filterList(passivePool);

  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formOwnerCustomerId) {
      alert("Lütfen portföy için müşteri havuzundan bir Mülk Sahibi / Satıcı seçin veya '+ Yeni Satıcı Ekle' butonunu kullanın.");
      return;
    }

    const assignedUser = users.find((u) => u.id === formAssigneeId);
    const fullRegion = `${formDistrict} / ${formSubRegion}`;
    const owner = customers.find((c) => c.id === formOwnerCustomerId);

    const photos = formImageUrl
      ? [
          {
            id: `ph-${Date.now()}`,
            propertyId: "",
            url: formImageUrl,
            shareable: true,
          },
        ]
      : [];

    addProperty({
      title: formTitle,
      region: fullRegion,
      propertyType: formPropertyType,
      listingType: formListingType,
      price: Number(formPrice) || 0,
      currency: formCurrency,
      area: Number(formArea) || 0,
      rooms: formRooms,
      status: "AVAILABLE",
      address: formAddress,
      ownerCustomerId: formOwnerCustomerId,
      ownerName: owner?.fullName || "Bilinmiyor",
      ownerPhone: owner?.phone || "",
      keyHolder: formKeyHolder,
      notes: formNotes,
      publicDescription: formPublicDesc,
      isOffMarket: formIsOffMarket,
      listingUrl: formIsOffMarket ? undefined : formListingUrl.trim() || undefined,
      assignedToId: formAssigneeId,
      assignedToName: assignedUser?.name,
      isShared: formIsShared,
      imageUrl: formImageUrl,
      photos,
    });

    setIsAddModalOpen(false);
    setFormImageUrl(undefined);
    setFormTitle("");
    setFormPrice("");
    setFormArea("");
    setFormAddress("");
    setFormOwnerCustomerId("");
    setFormKeyHolder("");
    setFormNotes("");
    setFormPublicDesc("");
    setFormListingUrl("");
    setFormIsOffMarket(false);
    setFormIsShared(false);
    setFormCurrency("GBP");
  };

  // Render Kart Izgarası
  const renderPropertyGrid = (items: Property[], isSharedSection: boolean) => {
    if (items.length === 0) {
      return (
        <div className="sharp-card p-8 text-center text-slate-400 font-mono text-xs border border-dashed border-slate-300">
          {isSharedSection
            ? "Henüz diğer danışmanlar tarafından ortak kullanıma açılmış bir portföy bulunmuyor."
            : "Bu filtrelere uygun portföy kaydınız bulunmuyor."}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((p) => {
          const isOwner = p.assignedToId === currentUser.id;

          return (
            <div
              key={p.id}
              className={`sharp-card border transition flex flex-col justify-between overflow-hidden group shadow-xs hover:shadow-md ${
                isSharedSection
                  ? "border-cyan-200 hover:border-[#00adb5] bg-cyan-50/15"
                  : "border-slate-200 hover:border-[#1d2566] bg-white"
              }`}
            >
              <div>
                {/* Portföy Fotoğrafı (Opsiyonel • Yüklendiyse Gösterilir) */}
                {(() => {
                  const photoUrl = p.imageUrl || p.photos?.[0]?.url;
                  if (!photoUrl) return null;
                  return (
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden border-b border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>
                  );
                })()}

                {/* Portföy Kartı Üst Bölümü */}
                <div className="p-3.5 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 font-bold shadow-xs ${
                          p.listingType === "sale"
                            ? "bg-[#00adb5] text-white"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {p.listingType === "sale" ? "SATILIK" : "KİRALIK"}
                      </span>

                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-white text-slate-800 font-bold border border-slate-200 shadow-2xs">
                        {p.propertyType}
                      </span>

                      {/* Tek Yetkili Rozeti (Yetki Ekranındaki Tasarımın Birebir Aynısı) */}
                      {getExclusiveMandate(p) && (
                        <span
                          className="text-[10px] font-mono uppercase px-2 py-0.5 border font-bold inline-flex items-center gap-1 bg-[#1d2566]/10 text-[#1d2566] border-[#1d2566]/30 shadow-2xs"
                          title={`Tek Yetkili Aracılık Sözleşmesi (${getExclusiveMandate(p)?.contractNumber || "Aktif"})`}
                        >
                          <Award className="w-3 h-3 text-[#1d2566]" /> Tek Yetkili
                        </span>
                      )}

                      {/* İlansız (Off-Market) Rozeti */}
                      {p.isOffMarket && (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-amber-500 text-white font-bold shadow-xs flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>İlansız Portföy</span>
                        </span>
                      )}
                    </div>

                    {canManageProperty(p) && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ActionMenu
                          onEdit={() => handleOpenEditModal(p)}
                          onDelete={() => setPropertyToDelete(p)}
                          onCloseDeal={() => {
                            setDealCloseProperty(p);
                            setIsDealCloseModalOpen(true);
                          }}
                          closeDealLabel={
                            p.listingType === "sale"
                              ? "Portföy Satıldı (İşlem Kapat)"
                              : "Portföy Kiralandı (İşlem Kapat)"
                          }
                          canEdit={canManageProperty(p)}
                          canDelete={canManageProperty(p)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between gap-2 pt-1">
                    <div className="text-xl font-mono font-extrabold text-[#1d2566] tracking-tight">
                      {p.price.toLocaleString("tr-TR")} <span className="text-sm font-bold text-[#00adb5]">{p.currency}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 font-semibold">
                      {p.area} m² • {p.rooms}
                    </div>
                  </div>
                </div>

                {/* Detay Bilgileri */}
                <div className="p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[11px] font-mono mb-1">
                      <span className="text-[#00adb5] font-bold flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {p.region}
                      </span>
                      {/* Paylaşım Durumu Rozeti / Butonu */}
                      {isOwner ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePropertyShare(p.id);
                          }}
                          className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 border cursor-pointer font-bold transition ${
                            p.isShared
                              ? "bg-cyan-50 text-[#00adb5] border-cyan-300 hover:bg-cyan-100"
                              : "bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                          }`}
                          title="Diğer danışmanlara paylaşımı aç/kapat"
                        >
                          <Share2 className="w-2.5 h-2.5" />
                          <span>{p.isShared ? "Paylaşıldı" : "Bireysel"}</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-cyan-100 text-[#00adb5] border border-cyan-300 font-bold">
                          <Share2 className="w-2.5 h-2.5" />
                          <span>Paylaşan: {p.assignedToName}</span>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePropertyDetail(p)}
                      className="text-left font-bold text-slate-800 hover:text-[#00adb5] transition line-clamp-2 leading-snug cursor-pointer block"
                    >
                      {p.title}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono py-2 border-y border-slate-100 text-slate-600">
                    <div className="flex items-center gap-1">
                      <Maximize2 className="w-3 h-3 text-[#00adb5]" />
                      <span>{p.area} m²</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BedDouble className="w-3 h-3 text-[#1d2566]" />
                      <span>{p.rooms || "Belirtilmedi"}</span>
                    </div>
                  </div>

                  {/* Ofis İçi Bilgiler */}
                  <div className="p-2.5 bg-slate-50 border border-slate-200 text-xs font-mono space-y-1.5">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" /> Mal Sahibi:
                      </span>
                      <span className="text-slate-900 font-bold">
                        {p.ownerName || "Bilinmiyor"}
                      </span>
                    </div>
                    {p.ownerPhone && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Telefon:</span>
                        <span className="text-slate-800 font-mono font-medium">{p.ownerPhone}</span>
                      </div>
                    )}
                    {p.keyHolder && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-[#00adb5]" /> Anahtar:
                        </span>
                        <span className="text-slate-800 truncate max-w-[150px] font-medium">
                          {p.keyHolder}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
                      <span>Danışman:</span>
                      <span className="text-[#1d2566] font-bold">
                        {p.assignedToName || "Atanmadı"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aksiyon Alt Çubuğu - Eşit Uzunlukta Butonlar (İlan linki varsa 4, yoksa 3 eşit buton) */}
              <div className="p-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-1.5">
                {p.listingUrl && (
                  <a
                    href={p.listingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-1 bg-white border border-slate-300 hover:border-[#00adb5] text-[#00adb5] text-xs font-mono font-bold flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs text-center"
                    title="İlan Sayfasına Git"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span>İlan</span>
                  </a>
                )}

                {canManageProperty(p) && (
                  <button
                    type="button"
                    onClick={() => {
                      setDealCloseProperty(p);
                      setIsDealCloseModalOpen(true);
                    }}
                    className={`flex-1 py-1.5 px-1 border text-xs font-mono font-bold flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs text-center ${
                      p.listingType === "sale"
                        ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 hover:border-amber-400"
                        : "bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300 hover:border-blue-400"
                    }`}
                    title={
                      p.listingType === "sale"
                        ? "Portföy Satıldı (İşlem Kapat)"
                        : "Portföy Kiralandı (İşlem Kapat)"
                    }
                  >
                    <CheckCircle2
                      className={`w-3 h-3 shrink-0 ${
                        p.listingType === "sale" ? "text-amber-600" : "text-blue-600"
                      }`}
                    />
                    <span>{p.listingType === "sale" ? "Satıldı" : "Kiralandı"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenEditModal(p)}
                  className="flex-1 py-1.5 px-1 bg-white border border-slate-300 hover:border-[#1d2566] text-[#1d2566] text-xs font-mono font-bold flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs text-center"
                  title="Portföyü Düzenle"
                >
                  <Edit3 className="w-3 h-3 text-[#00adb5] shrink-0" />
                  <span>Düzenle</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBrochureProperty(p)}
                  className="flex-1 py-1.5 px-1 bg-white border border-slate-300 hover:border-[#1d2566] text-[#1d2566] text-xs font-mono font-bold flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs text-center"
                  title="Müşteri Paylaşım Broşürünü Aç"
                >
                  <Share2 className="w-3 h-3 text-[#00adb5] shrink-0" />
                  <span>Broşür</span>
                </button>

                <button
                  type="button"
                  onClick={() => onFindMatches(p)}
                  className="flex-1 py-1.5 px-1 bg-[#00adb5] hover:bg-[#00939a] text-white text-xs font-mono font-bold flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs text-center"
                  title="Bu Mülke Uygun Müşterileri Eşleştir"
                >
                  <Sparkles className="w-3 h-3 text-white shrink-0" />
                  <span>Müşteri Bul</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Pasif Kart Izgarası (Satılan & Kiralanan Portföyler)
  const renderPassivePropertyGrid = (items: Property[]) => {
    if (items.length === 0) {
      return (
        <div className="sharp-card p-8 text-center text-slate-400 font-mono text-xs border border-dashed border-slate-300 bg-slate-50/50">
          Henüz satılmış veya kiralanmış pasif portföy kaydı bulunmuyor.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((p) => {
          const isSold = p.status === "SOLD";
          const isRented = p.status === "RENTED";

          return (
            <div
              key={p.id}
              className="sharp-card border border-slate-300 bg-slate-100/75 hover:bg-white transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md opacity-85 hover:opacity-100 grayscale-[30%] hover:grayscale-0 group"
            >
              <div>
                {/* Pasif Portföy Fotoğrafı */}
                {(() => {
                  const photoUrl = p.imageUrl || p.photos?.[0]?.url;
                  if (!photoUrl) return null;
                  return (
                    <div className="relative h-40 w-full bg-slate-200 overflow-hidden border-b border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                })()}

                {/* Portföy Kartı Üst Bölümü */}
                <div className="p-3.5 border-b border-slate-200 bg-slate-100/90">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Belirgin Pasif Rozeti */}
                      {isSold ? (
                        <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 font-extrabold bg-rose-600 text-white shadow-xs tracking-wider flex items-center gap-1">
                          [ SATILDI ]
                        </span>
                      ) : isRented ? (
                        <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 font-extrabold bg-blue-600 text-white shadow-xs tracking-wider flex items-center gap-1">
                          [ KİRALANDI ]
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 font-extrabold bg-slate-600 text-white shadow-xs tracking-wider flex items-center gap-1">
                          [ PASİF ]
                        </span>
                      )}

                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-white text-slate-700 font-bold border border-slate-300">
                        {p.propertyType}
                      </span>

                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-200 text-slate-600 font-semibold">
                        {p.listingType === "sale" ? "Satılık" : "Kiralık"}
                      </span>
                    </div>

                    {canManageProperty(p) && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                          onEdit={() => handleOpenEditModal(p)}
                          onDelete={() => setPropertyToDelete(p)}
                          canEdit={canManageProperty(p)}
                          canDelete={canManageProperty(p)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between gap-2 pt-1">
                    <div className="text-xl font-mono font-extrabold text-slate-700 tracking-tight">
                      {p.price.toLocaleString("tr-TR")}{" "}
                      <span className="text-sm font-bold text-slate-500">{p.currency}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 font-semibold">
                      {p.area} m² • {p.rooms}
                    </div>
                  </div>
                </div>

                {/* Detay Bilgileri */}
                <div className="p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[11px] font-mono mb-1">
                      <span className="text-slate-600 font-bold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {p.region}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        Danışman: {p.assignedToName || "Atanmadı"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePropertyDetail(p)}
                      className="text-left font-bold text-slate-700 hover:text-[#1d2566] transition line-clamp-2 leading-snug cursor-pointer block"
                    >
                      {p.title}
                    </button>
                  </div>

                  {/* Ofis İçi Mal Sahibi Bilgisi */}
                  <div className="p-2.5 bg-white/70 border border-slate-200 text-[10px] font-mono space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1">
                        <User className="w-2.5 h-2.5 text-slate-400" /> Mal Sahibi:
                      </span>
                      <span className="text-slate-800 font-bold">
                        {p.ownerName || "Bilinmiyor"}
                      </span>
                    </div>
                    {p.ownerPhone && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Telefon:</span>
                        <span className="text-slate-700 font-mono">{p.ownerPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Aksiyon Alt Çubuğu: Aktife Al (Yeniden Yayınla) */}
              <div className="p-2.5 bg-slate-100 border-t border-slate-200 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        `"${p.title}" portföyünü yeniden aktife almak ve canlı ilana çekmek istiyor musunuz?`
                      )
                    ) {
                      reactivateProperty(p.id);
                    }
                  }}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="Portföyü tek tıkla canlı ilan havuzuna geri döndür"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Aktife Al (Yeniden Yayınla)</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(p)}
                    className="flex-1 py-1 px-1 bg-white border border-slate-300 hover:border-slate-500 text-slate-700 text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
                  >
                    <Edit3 className="w-3 h-3 text-slate-500" />
                    <span>Düzenle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBrochureProperty(p)}
                    className="flex-1 py-1 px-1 bg-white border border-slate-300 hover:border-slate-500 text-slate-700 text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
                  >
                    <Share2 className="w-3 h-3 text-slate-500" />
                    <span>Broşür</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#00adb5] font-bold tracking-wider uppercase">
              PORTFÖY YÖNETİMİ
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              {isBroker ? "Tüm Ofis Portföyleri" : "Kişisel ve Paylaşılan Portföyler"}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1d2566] tracking-tight">
            Gayrimenkul Portföy Envanteri
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Satılık ve kiralık portföyleri yönetin, gizlilik filtreli müşteri
            broşürleri üretin ve ekip içi ortak çalışmaya açın.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFormCurrency("GBP");
              setIsAddModalOpen(true);
            }}
            className="sharp-btn-primary px-4 py-2 text-xs flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Portföy Ekle</span>
          </button>
        </div>
      </div>

      {/* Arama & Filtre Çubuğu */}
      <div className="sharp-card p-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Başlık, bölge veya portföy ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sharp-input w-full pl-8.5 pr-3 py-1.5 text-xs font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* KKTC İlçe Filtresi */}
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="sharp-input py-1 px-2 text-[11px] font-mono bg-white text-[#1d2566] font-semibold"
          >
            <option value="ALL">İlçe: Tümü</option>
            {KKTC_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Portföy Türü (Satılık / Kiralık) */}
          <div className="flex items-center bg-slate-100 border border-slate-200 p-0.5">
            {[
              { id: "ALL", label: "Tümü" },
              { id: "sale", label: "Satılık" },
              { id: "rent", label: "Kiralık" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setListingTypeFilter(t.id)}
                className={`px-2.5 py-1 text-[11px] font-mono transition cursor-pointer ${
                  listingTypeFilter === t.id
                    ? "bg-[#1d2566] text-white font-bold shadow-2xs"
                    : "text-slate-600 hover:text-[#1d2566]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Gayrimenkul Tipi */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="sharp-input py-1 px-2.5 text-[11px] font-mono bg-white"
          >
            <option value="ALL">Tip: Tümü</option>
            <option value="Daire">Daire</option>
            <option value="Villa">Villa</option>
            <option value="Ticari">Ticari</option>
            <option value="Arsa">Arsa</option>
          </select>

          {/* Durum / Arşiv Filtresi */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sharp-input py-1 px-2.5 text-[11px] font-mono bg-white font-semibold text-[#1d2566]"
          >
            <option value="ALL">Durum: Tümü</option>
            <option value="AVAILABLE">Yayında (Aktif)</option>
            <option value="RESERVED">Rezerve</option>
            <option value="SOLD">Satıldı</option>
            <option value="RENTED">Kiralandı</option>
            <option value="ARCHIVED">Arşivdeki Portföyler</option>
          </select>
        </div>
      </div>

      {/* Portföy Listesi (Danışman İzolasyonu & Ortak Paylaşım) */}
      {isBroker ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#1d2566]" />
              <h2 className="text-sm font-bold text-[#1d2566] uppercase font-mono tracking-wide">
                Ofis Genel Portföy Envanteri ({filteredAllProperties.length})
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Broker Denetim Masası — Tüm Danışmanlar
            </span>
          </div>
          {renderPropertyGrid(filteredAllProperties, false)}
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. Kişisel Portföyler */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#1d2566]" />
                <h2 className="text-sm font-bold text-[#1d2566] uppercase font-mono tracking-wide">
                  Kişisel Portföylerim ({filteredMyProperties.length})
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Sadece sizin yönettiğiniz portföyler (diğer danışmanlar göremez)
              </span>
            </div>
            {renderPropertyGrid(filteredMyProperties, false)}
          </div>

          {/* 2. Diğer Danışmanlardan Paylaşılan Portföyler */}
          <div className="space-y-3 pt-4 border-t-2 border-dashed border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#00adb5]" />
                <h2 className="text-sm font-bold text-[#00adb5] uppercase font-mono tracking-wide">
                  Diğer Danışmanlardan Paylaşılan Portföyler ({filteredSharedProperties.length})
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Ekip arkadaşlarının ortak çalışmaya ve alıcı bulmaya açtığı portföyler
              </span>
            </div>
            {renderPropertyGrid(filteredSharedProperties, true)}
          </div>
        </div>
      )}

      {/* 3. Satılan & Kiralanan (Pasif) Portföyler */}
      <div className="space-y-3 pt-6 border-t-2 border-dashed border-slate-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-700 uppercase font-mono tracking-wide">
              Satılan & Kiralanan (Pasif) Portföyler ({filteredPassiveProperties.length})
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Sözleşmesi ve satışı kapanmış mülkler • Arşivde bekletilir, tek tıkla aktife alınabilir
          </span>
        </div>
        {renderPassivePropertyGrid(filteredPassiveProperties)}
      </div>

      {/* Portföy Kartı Detayı Pop-up Modal */}
      {activePropertyDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4">
          <div className="sharp-card w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-300 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#00adb5]" />
                <h2 className="text-sm font-bold text-[#1d2566]">
                  Portföy Düzenle & Detay
                </h2>
              </div>
              <button
                onClick={() => setActivePropertyDetail(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              {/* Portföy Fotoğrafı */}
              {(activePropertyDetail.imageUrl || activePropertyDetail.photos?.[0]?.url) && (
                <div className="relative h-64 w-full overflow-hidden border border-slate-200 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activePropertyDetail.imageUrl || activePropertyDetail.photos?.[0]?.url}
                    alt={activePropertyDetail.title}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              )}

              {/* Başlık ve Temel Bilgiler */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 font-bold text-white ${
                        activePropertyDetail.listingType === "sale"
                          ? "bg-[#00adb5]"
                          : "bg-emerald-600"
                      }`}
                    >
                      {activePropertyDetail.listingType === "sale" ? "SATILIK" : "KİRALIK"}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      {activePropertyDetail.propertyType}
                    </span>

                    {/* Tek Yetkili Rozeti */}
                    {getExclusiveMandate(activePropertyDetail) && (
                      <span
                        className="text-[10px] font-mono uppercase px-2 py-0.5 border font-bold inline-flex items-center gap-1 bg-[#1d2566]/10 text-[#1d2566] border-[#1d2566]/30 shadow-2xs"
                        title={`Tek Yetkili Aracılık Sözleşmesi (${getExclusiveMandate(activePropertyDetail)?.contractNumber || "Aktif"})`}
                      >
                        <Award className="w-3 h-3 text-[#1d2566]" /> Tek Yetkili
                      </span>
                    )}

                    {activePropertyDetail.isOffMarket && (
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-amber-500 text-white font-bold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>İlansız Portföy</span>
                      </span>
                    )}
                    <span className="text-xs font-mono text-slate-500 flex items-center gap-1 font-bold">
                      <MapPin className="w-3 h-3 text-[#00adb5]" />
                      {activePropertyDetail.region}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#1d2566]">
                    {activePropertyDetail.title}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-mono font-extrabold text-[#00adb5] tracking-tight">
                    {activePropertyDetail.price.toLocaleString("tr-TR")}{" "}
                    {activePropertyDetail.currency}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {activePropertyDetail.area} m² • {activePropertyDetail.rooms}
                  </div>
                </div>
              </div>

              {/* DANIŞMANLAR ARASI PAYLAŞIM PANELİ */}
              <div className="p-3.5 bg-cyan-50/70 border border-cyan-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Share2 className="w-4 h-4 text-[#00adb5] shrink-0 mt-0.5" />
                  <div>
                    <label className="flex items-center gap-2 font-bold text-xs text-[#1d2566] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activePropertyDetail.isShared || false}
                        disabled={
                          !isBroker && activePropertyDetail.assignedToId !== currentUser.id
                        }
                        onChange={() => {
                          togglePropertyShare(activePropertyDetail.id);
                          setActivePropertyDetail({
                            ...activePropertyDetail,
                            isShared: !activePropertyDetail.isShared,
                          });
                        }}
                        className="w-4 h-4 text-[#00adb5] accent-[#00adb5] rounded border-slate-300 cursor-pointer"
                      />
                      <span>Diğer Danışmanlara Paylaş</span>
                    </label>
                    <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                      {activePropertyDetail.isShared
                        ? "Bu portföy şu anda tüm ofis danışmanlarının 'Paylaşılan Portföyler' listesinde görünür durumdadır."
                        : "Bu portföy şu an gizlidir; sadece siz ve broker görebilir."}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-slate-500 block">
                    Portföy Sorumlusu:
                  </span>
                  <span className="text-xs font-mono font-bold text-[#1d2566]">
                    {activePropertyDetail.assignedToName || "Atanmadı"}
                  </span>
                </div>
              </div>

              {/* Varsa İlan Linki */}
              {activePropertyDetail.listingUrl && (
                <div className="p-3 bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#00adb5]" />
                    <span className="font-semibold text-slate-700">Harici İlan Bağlantısı:</span>
                    <span className="font-mono text-slate-500 text-[11px] truncate max-w-xs">
                      {activePropertyDetail.listingUrl}
                    </span>
                  </div>
                  <a
                    href={activePropertyDetail.listingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:border-[#00adb5] text-[#00adb5] font-mono font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>İlanı Aç</span>
                  </a>
                </div>
              )}

              {/* Ofis İçi Gizli Bilgiler & Mülk Sahibi Bağlantısı */}
              <div className="p-3 bg-amber-50/60 border border-amber-200 space-y-2 text-xs">
                <div className="flex items-center justify-between font-mono text-[11px] text-amber-800 font-bold border-b border-amber-200/60 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3" />
                    <span>Ofis İçi Gizli Bilgiler (Müşteri Broşürlerinde Çıkmaz)</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-mono">Mal Sahibi</span>
                    <span className="font-semibold text-slate-900">{activePropertyDetail.ownerName || "Bilinmiyor"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-mono">Telefon</span>
                    <span className="font-semibold font-mono">{activePropertyDetail.ownerPhone || "Yok"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-mono">Anahtar Durumu</span>
                    <span className="font-semibold">{activePropertyDetail.keyHolder || "Belirtilmedi"}</span>
                  </div>
                </div>
                {activePropertyDetail.address && (
                  <div className="pt-2 border-t border-amber-100 text-[11px]">
                    <span className="text-slate-500 font-mono">Açık Adres: </span>
                    <span className="text-slate-800">{activePropertyDetail.address}</span>
                  </div>
                )}
              </div>

              {/* Tek Yetkili Sözleşme Bilgi Paneli */}
              {(() => {
                const mandate = getExclusiveMandate(activePropertyDetail);
                if (!mandate) return null;
                return (
                  <div className="p-3 bg-[#1d2566]/5 border border-[#1d2566]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 border font-bold inline-flex items-center gap-1 bg-[#1d2566]/10 text-[#1d2566] border-[#1d2566]/30 shadow-2xs">
                        <Award className="w-3 h-3 text-[#1d2566]" /> Tek Yetkili
                      </span>
                      <span className="font-mono text-[11px] text-[#1d2566] font-bold">
                        {mandate.contractNumber || "Sözleşme Aktif"}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600 font-mono text-[11px]">
                        Geçerlilik: {mandate.startDate} / {mandate.endDate}
                      </span>
                    </div>
                    <div className="font-mono font-bold text-emerald-700 text-xs shrink-0">
                      Komisyon Oranı: %{mandate.commissionRate || 5}
                    </div>
                  </div>
                );
              })()}

              {/* Tanıtım Metni */}
              {activePropertyDetail.publicDescription && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 font-mono mb-1">
                    Müşteri Tanıtım Metni
                  </h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 border border-slate-200 leading-relaxed">
                    {activePropertyDetail.publicDescription}
                  </p>
                </div>
              )}

              {/* Aksiyon Butonları */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
                {canManageProperty(activePropertyDetail) ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={activePropertyDetail.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as any;
                        updateProperty(activePropertyDetail.id, { status: newStatus });
                        setActivePropertyDetail({ ...activePropertyDetail, status: newStatus });
                      }}
                      className="sharp-input py-1.5 px-2 text-xs font-mono bg-white font-bold text-[#1d2566]"
                    >
                      <option value="AVAILABLE">Yayında (Aktif)</option>
                      <option value="RESERVED">Rezerve</option>
                      <option value="SOLD">Satıldı</option>
                      <option value="RENTED">Kiralandı</option>
                      <option value="ARCHIVED">Arşivde</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setPropertyToDelete(activePropertyDetail);
                      }}
                      className="sharp-btn-danger px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Portföyü Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Sil</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] font-mono text-slate-500 italic flex items-center gap-1">
                    Ortak Ofis Portföyü
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {canManageProperty(activePropertyDetail) && (
                    !isActive(activePropertyDetail) ? (
                      <button
                        type="button"
                        onClick={() => {
                          const p = activePropertyDetail;
                          if (
                            confirm(
                              `"${p.title}" portföyünü yeniden aktife almak ve canlı ilan havuzuna çekmek istiyor musunuz?`
                            )
                          ) {
                            reactivateProperty(p.id);
                            setActivePropertyDetail(null);
                          }
                        }}
                        className="px-3.5 py-1.5 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs text-white bg-emerald-600 hover:bg-emerald-700 transition"
                        title="Portföyü tek tıkla canlı ilan havuzuna geri döndür"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Portföyü Aktifleştir</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const p = activePropertyDetail;
                          setActivePropertyDetail(null);
                          setDealCloseProperty(p);
                          setIsDealCloseModalOpen(true);
                        }}
                        className={`px-3.5 py-1.5 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs text-white ${
                          activePropertyDetail.listingType === "sale"
                            ? "bg-amber-600 hover:bg-amber-700"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                        title={
                          activePropertyDetail.listingType === "sale"
                            ? "Portföy Satıldı (İşlem Kapat)"
                            : "Portföy Kiralandı (İşlem Kapat)"
                        }
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {activePropertyDetail.listingType === "sale"
                            ? "Portföy Satıldı (İşlem Kapat)"
                            : "Portföy Kiralandı (İşlem Kapat)"}
                        </span>
                      </button>
                    )
                  )}

                  {canManageProperty(activePropertyDetail) && (
                    <button
                      type="button"
                      onClick={() => {
                        const p = activePropertyDetail;
                        setActivePropertyDetail(null);
                        handleOpenEditModal(p);
                      }}
                      className="px-3.5 py-1.5 bg-[#1d2566] hover:bg-[#151b4d] text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Portföy Bilgilerini Düzenle"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#00adb5]" />
                      <span>Düzenle</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const p = activePropertyDetail;
                      setActivePropertyDetail(null);
                      setBrochureProperty(p);
                    }}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 hover:border-[#1d2566] text-[#1d2566] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#00adb5]" />
                    <span>Broşür Üret</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const p = activePropertyDetail;
                      setActivePropertyDetail(null);
                      onFindMatches(p);
                    }}
                    className="px-4 py-1.5 bg-[#00adb5] hover:bg-[#00939a] text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>Müşteri Bul</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePropertyDetail(null)}
                    className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-mono cursor-pointer"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Broşür Modalı */}
      {brochureProperty && (
        <BrochureModal
          property={brochureProperty}
          onClose={() => setBrochureProperty(null)}
        />
      )}

      {/* 1. KURAL: Başlık sade ve net "Yeni Portföy Kaydı" */}
      {/* 4. KURAL: Backdrop-blur-md ile ferah blur efekti */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4">
          <div className="sharp-card w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-300 bg-white shadow-2xl relative">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#00adb5]" />
                <h2 className="text-sm font-bold text-[#1d2566]">
                  Yeni Portföy Kaydı
                </h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="p-5 space-y-4 text-xs flex-1 overflow-y-auto">
              {/* 2. KURAL: "Portföy Başlığı" */}
              <div>
                <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                  Portföy Başlığı *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Örn: Girne Alsancak Deniz Manzaralı 4+1 Çatı Dubleksi"
                  className="sharp-input w-full p-2 text-xs"
                />
              </div>

              {/* Portföy Kapak Görseli (Opsiyonel • Maksimum 1 Adet) */}
              <PropertyImageUploader
                imageUrl={formImageUrl}
                onChange={setFormImageUrl}
              />

              {/* KKTC KONUM VE BÖLGE SEÇİMİ (ZORUNLU ALAN) */}
              <div className="p-3 bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-[10px] font-mono uppercase text-[#1d2566] font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>Konum ve Bölge Seçimi *</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-mono text-[10px] mb-1 font-semibold">
                      İlçe / Şehir *
                    </label>
                    <select
                      value={formDistrict}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="sharp-input w-full p-2 bg-white font-mono"
                    >
                      {KKTC_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-mono text-[10px] mb-1 font-semibold">
                      Bölge / Mahalle / Belde *
                    </label>
                    <select
                      value={formSubRegion}
                      onChange={(e) => setFormSubRegion(e.target.value)}
                      className="sharp-input w-full p-2 bg-white font-mono"
                    >
                      {getRegionsByDistrict(formDistrict).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-[#00adb5] font-bold">
                  Seçilen Bölge: {formDistrict} / {formSubRegion}
                </div>
              </div>

              {/* 2. KURAL: "Portföy Türü" */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Portföy Türü *
                  </label>
                  <select
                    value={formListingType}
                    onChange={(e) => setFormListingType(e.target.value as any)}
                    className="sharp-input w-full p-2 bg-white"
                  >
                    <option value="sale">Satılık</option>
                    <option value="rent">Kiralık</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Gayrimenkul Tipi
                  </label>
                  <select
                    value={formPropertyType}
                    onChange={(e) => setFormPropertyType(e.target.value)}
                    className="sharp-input w-full p-2 bg-white"
                  >
                    <option value="Daire">Daire</option>
                    <option value="Villa">Villa</option>
                    <option value="Ticari">Ticari</option>
                    <option value="Arsa">Arsa</option>
                  </select>
                </div>
              </div>

              {/* FİYAT (ZORUNLU ALAN) & PARA BİRİMİ (DEFAULT GBP) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                    Fiyat (Tutar) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="Örn: 250000"
                    className="sharp-input w-full p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                    Para Birimi *
                  </label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value as any)}
                    className="sharp-input w-full p-2 font-mono text-xs bg-white text-[#1d2566] font-bold"
                  >
                    <option value="GBP">GBP (£ - İngiliz Sterlini)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="USD">USD ($ - Amerikan Doları)</option>
                    <option value="TRY">TRY (₺ - Türk Lirası)</option>
                  </select>
                </div>
              </div>

              {/* M2 & ODA SAYISI */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    m² (Brüt)
                  </label>
                  <input
                    type="number"
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                    placeholder="Örn: 250"
                    className="sharp-input w-full p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Oda Sayısı
                  </label>
                  <input
                    type="text"
                    value={formRooms}
                    onChange={(e) => setFormRooms(e.target.value)}
                    placeholder="Örn: 3+1"
                    className="sharp-input w-full p-2 font-mono text-xs"
                  />
                </div>
              </div>

              {/* 5. ve 6. KURAL: MÜLK SAHİBİ SADECE HAVUZDAN SEÇİLİR, SEARCH EDİLEBİLİR, ASLA ELLE GİRİLMEZ */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 space-y-3" ref={ownerDropdownRef}>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="text-[10px] font-mono uppercase text-[#1d2566] font-bold flex items-center gap-1.5">
                    <User className="w-3 h-3 text-[#00adb5]" />
                    <span>Mülk Sahibi / Satıcı (Zorunlu Alan) *</span>
                  </div>

                  {/* "+ Yeni Müşteri Ekle" Butonu */}
                  <button
                    type="button"
                    onClick={() => setIsAddSellerSubModalOpen(true)}
                    className="px-2.5 py-1 bg-[#00adb5] hover:bg-[#00939a] text-white text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Yeni Müşteri Ekle</span>
                  </button>
                </div>

                {sellerNotice && (
                  <div className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 p-2 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{sellerNotice}</span>
                  </div>
                )}

                {/* 5. KURAL: Seçili Mülk Sahibi Kartı (Seçiliyse şık bir bilgi kartı, elle input yok!) */}
                {selectedOwner ? (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-emerald-600 text-white font-bold flex items-center justify-center font-mono text-xs shadow-2xs">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{selectedOwner.fullName}</span>
                          <span className="text-[9px] bg-emerald-200 text-emerald-900 font-mono px-1.5 py-0.2 font-bold">
                            Müşteri Havuzunda Kayıtlı
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-600 flex items-center gap-2 mt-0.5">
                          <span>{selectedOwner.phone || "Telefon yok"}</span>
                          <span>•</span>
                          <span>{selectedOwner.region}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectOwner("")}
                      className="text-xs text-rose-600 hover:text-rose-800 font-mono font-bold underline cursor-pointer px-2 py-1"
                    >
                      Değiştir
                    </button>
                  </div>
                ) : (
                  /* 6. KURAL: Mülk Sahibi Arama ve Seçim Alanı (Searchable Select) */
                  <div className="space-y-1.5 relative">
                    <label className="block text-slate-600 font-mono text-[10px] font-semibold">
                      Müşteri Havuzunda Arayın ve Seçin *
                    </label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="İsim, telefon veya bölge yazarak arayın..."
                        value={ownerSearchQuery}
                        onChange={(e) => {
                          setOwnerSearchQuery(e.target.value);
                          setIsOwnerDropdownOpen(true);
                        }}
                        onFocus={() => setIsOwnerDropdownOpen(true)}
                        className="sharp-input w-full pl-8 pr-7 py-2 text-xs font-mono bg-white"
                      />
                      <ChevronDown
                        className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 cursor-pointer pointer-events-none"
                      />
                    </div>

                    {/* Arama Sonuçları Açılır Menüsü */}
                    {isOwnerDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto bg-white border border-slate-300 shadow-xl z-20 divide-y divide-slate-100">
                        {availableOwners.length === 0 ? (
                          <div className="p-3 text-center text-slate-500 font-mono text-[11px]">
                            Eşleşen satıcı bulunamadı. Hemen üstteki{" "}
                            <strong className="text-[#00adb5]">+ Yeni Satıcı Ekle</strong>{" "}
                            butonundan ekleyebilirsiniz.
                          </div>
                        ) : (
                          availableOwners.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectOwner(c.id)}
                              className="w-full p-2.5 text-left hover:bg-cyan-50/70 transition flex items-center justify-between text-xs cursor-pointer group"
                            >
                              <div>
                                <div className="font-bold text-[#1d2566] group-hover:text-[#00adb5] flex items-center gap-1.5">
                                  <span>{c.fullName}</span>
                                  <span
                                    className={`text-[9px] font-mono px-1.5 py-0.2 ${
                                      c.category === "SELLER"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {c.category === "SELLER" ? "Satıcı" : "Müşteri"}
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                                  {c.phone || "Telefon yok"} • {c.region}
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-[#00adb5] font-bold opacity-0 group-hover:opacity-100 transition">
                                Seç →
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 7. KURAL: ANAHTAR DURUMU & AÇIK ADRES */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold flex items-center gap-1">
                    <Key className="w-3 h-3 text-[#00adb5]" />
                    <span>Anahtar Durumu</span>
                  </label>
                  <input
                    type="text"
                    value={formKeyHolder}
                    onChange={(e) => setFormKeyHolder(e.target.value)}
                    placeholder="Örn: Ofis Kasasında #14 / Kapıcı İdris Bey"
                    className="sharp-input w-full p-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Açık Adres (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Sokak, bina no, daire..."
                    className="sharp-input w-full p-1.5 text-xs"
                  />
                </div>
              </div>

              {/* MÜŞTERİ BROŞÜR AÇIKLAMASI */}
              <div>
                <label className="block text-slate-600 font-mono text-[11px] mb-1">
                  Müşteri Broşür Açıklaması
                </label>
                <textarea
                  rows={2}
                  value={formPublicDesc}
                  onChange={(e) => setFormPublicDesc(e.target.value)}
                  placeholder="Müşteriye gönderilecek broşürde gözükecek estetik tanıtım metni..."
                  className="sharp-input w-full p-2"
                />
              </div>

              {/* 8. KURAL: İLAN LİNKİ (Eğer Off-Market seçilmediyse görünür) */}
              {!formIsOffMarket && (
                <div className="p-3 bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-mono text-[11px] font-semibold flex items-center gap-1">
                      <Globe className="w-3 h-3 text-[#00adb5]" />
                      <span>İlan Bağlantı Linki (Opsiyonel)</span>
                    </label>
                    {formListingUrl && (
                      <a
                        href={formListingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono font-bold text-[#00adb5] hover:underline flex items-center gap-0.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Bağlantıyı Test Et</span>
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    value={formListingUrl}
                    onChange={(e) => setFormListingUrl(e.target.value)}
                    placeholder="https://101evler.com/... veya portal ilan linki"
                    className="sharp-input w-full p-2 font-mono text-xs bg-white"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">
                    Danışmanlar portföy kartındaki tek tıkla doğrudan ilan sayfasına gidebilir.
                  </p>
                </div>
              )}

              {/* 3. KURAL: CHECKBOX'LAR FORMUN EN ALTINDA */}
              {/* 8. KURAL: DİĞER DANIŞMANLARA PAYLAŞ & GİZLİ / ÖZEL PORTFÖY (OFF-MARKET) */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                {/* Checkbox 1: Diğer Danışmanlara Paylaş */}
                <div className="p-2.5 bg-cyan-50/60 border border-cyan-200">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsShared}
                      onChange={(e) => setFormIsShared(e.target.checked)}
                      className="w-4 h-4 text-[#00adb5] accent-[#00adb5] rounded border-slate-300 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-[#1d2566]">
                        Diğer Danışmanlara Paylaş
                      </span>
                      <p className="text-[11px] text-slate-500 font-mono">
                        İşaretlenirse ofisteki diğer danışmanların &quot;Paylaşılan Portföyler&quot; panelinde görünür.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Checkbox 2: Gizli / Özel Portföy (Off-Market) */}
                <div className="p-2.5 bg-amber-50/60 border border-amber-200">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsOffMarket}
                      onChange={(e) => setFormIsOffMarket(e.target.checked)}
                      className="w-4 h-4 text-amber-600 accent-amber-600 rounded border-slate-300 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Gizli / Özel Portföy (Off-Market)</span>
                      </span>
                      <p className="text-[11px] text-amber-800/80 font-mono">
                        Mülk sahibi ilana çıkılmasını istemiyor; portföy portallarda yayınlanmaz, yalnızca özel alıcı eşleştirmeleriyle el altından sunulur.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* BUTONLAR */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer font-mono"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="sharp-btn-primary px-4 py-1.5 font-bold text-white shadow-2xs cursor-pointer font-mono"
                >
                  Portföyü Kaydet
                </button>
              </div>
            </form>


          </div>
        </div>
      )}

      {/* PORTFÖY DÜZENLEME MODALI */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="sharp-card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-300 bg-white shadow-2xl">
            {/* Modal Başlığı */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#00adb5]" />
                <div>
                  <h2 className="text-sm font-bold text-[#1d2566]">
                    Portföyü Düzenle
                  </h2>
                  <p className="text-[10px] font-mono text-slate-500 truncate max-w-md">
                    {editingProperty.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProperty(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePropertyEdit} className="p-5 space-y-4 text-xs flex-1 overflow-y-auto">
              {/* Portföy Başlığı */}
              <div>
                <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                  Portföy Başlığı *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Örn: Girne Alsancak Deniz Manzaralı 4+1 Çatı Dubleksi"
                  className="sharp-input w-full p-2 text-xs font-semibold"
                />
              </div>

              {/* Portföy Kapak Görseli (Opsiyonel • Maksimum 1 Adet) */}
              <PropertyImageUploader
                imageUrl={editImageUrl}
                onChange={setEditImageUrl}
              />

              {/* KKTC KONUM VE BÖLGE SEÇİMİ */}
              <div className="p-3 bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-[10px] font-mono uppercase text-[#1d2566] font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>Konum ve Bölge Seçimi *</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-mono text-[10px] mb-1 font-semibold">
                      İlçe / Şehir *
                    </label>
                    <select
                      value={editDistrict}
                      onChange={(e) => handleEditDistrictChange(e.target.value)}
                      className="sharp-input w-full p-2 bg-white font-mono"
                    >
                      {KKTC_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-mono text-[10px] mb-1 font-semibold">
                      Bölge / Mahalle / Belde *
                    </label>
                    <select
                      value={editSubRegion}
                      onChange={(e) => setEditSubRegion(e.target.value)}
                      className="sharp-input w-full p-2 bg-white font-mono"
                    >
                      {getRegionsByDistrict(editDistrict).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-[#00adb5] font-bold">
                  Seçilen Bölge: {editDistrict} / {editSubRegion}
                </div>
              </div>

              {/* Portföy Türü & Gayrimenkul Tipi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Portföy Türü *
                  </label>
                  <select
                    value={editListingType}
                    onChange={(e) => setEditListingType(e.target.value as any)}
                    className="sharp-input w-full p-2 bg-white"
                  >
                    <option value="sale">Satılık</option>
                    <option value="rent">Kiralık</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Gayrimenkul Tipi *
                  </label>
                  <select
                    value={editPropertyType}
                    onChange={(e) => setEditPropertyType(e.target.value)}
                    className="sharp-input w-full p-2 bg-white"
                  >
                    <option value="Daire">Daire</option>
                    <option value="Villa">Villa</option>
                    <option value="Müstakil Ev">Müstakil Ev</option>
                    <option value="Ticari">Ticari</option>
                    <option value="Arsa">Arsa</option>
                  </select>
                </div>
              </div>

              {/* FİYAT & PARA BİRİMİ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                    Fiyat (Tutar) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="Örn: 250000"
                    className="sharp-input w-full p-2 font-mono text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                    Para Birimi *
                  </label>
                  <select
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value as any)}
                    className="sharp-input w-full p-2 bg-white font-mono font-bold"
                  >
                    <option value="GBP">GBP (£ - Sterlin)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="USD">USD ($ - Dolar)</option>
                    <option value="TRY">TRY (₺ - TL)</option>
                  </select>
                </div>
              </div>

              {/* ALAN (m²), ODA SAYISI & DURUM */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Brüt/Net Alan (m²)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    placeholder="Örn: 140"
                    className="sharp-input w-full p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Oda Sayısı
                  </label>
                  <select
                    value={editRooms}
                    onChange={(e) => setEditRooms(e.target.value)}
                    className="sharp-input w-full p-2 bg-white font-mono"
                  >
                    <option value="1+0">1+0 (Stüdyo)</option>
                    <option value="1+1">1+1</option>
                    <option value="2+1">2+1</option>
                    <option value="3+1">3+1</option>
                    <option value="4+1">4+1</option>
                    <option value="5+1">5+1 ve üzeri</option>
                    <option value="Villa">Villa / Özel</option>
                    <option value="Komple Bina">Komple Bina</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Portföy Durumu *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as PropertyStatus)}
                    className="sharp-input w-full p-2 bg-white font-mono font-bold text-[#1d2566]"
                  >
                    <option value="AVAILABLE">Yayında (Aktif)</option>
                    <option value="RESERVED">Rezerve</option>
                    <option value="SOLD">Satıldı</option>
                    <option value="RENTED">Kiralandı</option>
                    <option value="ARCHIVED">Arşivde</option>
                  </select>
                </div>
              </div>

              {/* MAL SAHİBİ BİLGİLERİ (OFİS İÇİ - ZORUNLU MÜŞTERİ HAVUZU) */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                  <label className="text-[11px] font-mono text-amber-900 font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Mal Sahibi / Müşteri (Zorunlu Alan) *</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsAddSellerSubModalOpen(true)}
                    className="px-2.5 py-1 bg-[#00adb5] hover:bg-[#00939a] text-white text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Yeni Müşteri Ekle</span>
                  </button>
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[10px] mb-1 font-semibold">
                    Müşteri Havuzundan Mal Sahibi Seçin *
                  </label>
                  <select
                    required
                    value={editOwnerCustomerId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setEditOwnerCustomerId(cid);
                      if (cid) {
                        const match = customers.find((c) => c.id === cid);
                        if (match) {
                          setEditOwnerName(match.fullName);
                          setEditOwnerPhone(match.phone || "");
                        }
                      } else {
                        setEditOwnerName("");
                        setEditOwnerPhone("");
                      }
                    }}
                    className="sharp-input w-full p-2 bg-white text-xs font-mono font-bold text-[#1d2566]"
                  >
                    <option value="">-- Müşteri havuzundan mal sahibi seçin (Zorunlu) --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.phone || "Telefon yok"} - {c.category === "SELLER" ? "Satıcı" : "Müşteri"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seçili Mal Sahibi Bilgi Kartı */}
                {editOwnerCustomerId && (() => {
                  const owner = customers.find((c) => c.id === editOwnerCustomerId);
                  if (!owner) return null;
                  return (
                    <div className="p-3 bg-white border border-emerald-300 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-emerald-600 text-white font-bold flex items-center justify-center font-mono text-xs shadow-2xs">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{owner.fullName}</span>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.2 font-bold">
                              Kayıtlı Mal Sahibi
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-600 flex items-center gap-2 mt-0.5">
                            <span>{owner.phone || "Telefon yok"}</span>
                            <span>•</span>
                            <span>{owner.region || "Bölge belirtilmemiş"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ANAHTAR DURUMU & AÇIK ADRES */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold flex items-center gap-1">
                    <Key className="w-3 h-3 text-[#00adb5]" />
                    <span>Anahtar Yeri / Durumu</span>
                  </label>
                  <input
                    type="text"
                    value={editKeyHolder}
                    onChange={(e) => setEditKeyHolder(e.target.value)}
                    placeholder="Örn: Ofis Kasasında #14 / Kapıcı İdris Bey"
                    className="sharp-input w-full p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Açık Adres (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Sokak, bina no, daire..."
                    className="sharp-input w-full p-2 text-xs"
                  />
                </div>
              </div>

              {/* MÜŞTERİ TANITIM METNİ */}
              <div>
                <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                  Müşteri Tanıtım Metni (Broşürde Gözükür)
                </label>
                <textarea
                  rows={2}
                  value={editPublicDesc}
                  onChange={(e) => setEditPublicDesc(e.target.value)}
                  placeholder="Müşteriye gönderilecek broşürde gözükecek estetik tanıtım açıklaması..."
                  className="sharp-input w-full p-2"
                />
              </div>

              {/* OFİS İÇİ ÖZEL NOTLAR */}
              <div>
                <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                  Ofis İçi Notlar (Gizli)
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Komisyon anlaşması, pazarlık payı, mülk sahibi beklentisi..."
                  className="sharp-input w-full p-2"
                />
              </div>

              {/* İLAN LİNKİ (Eğer Off-Market seçilmediyse) */}
              {!editIsOffMarket && (
                <div className="p-3 bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-mono text-[11px] font-semibold flex items-center gap-1">
                      <Globe className="w-3 h-3 text-[#00adb5]" />
                      <span>İlan Bağlantı Linki (Opsiyonel)</span>
                    </label>
                    {editListingUrl && (
                      <a
                        href={editListingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono font-bold text-[#00adb5] hover:underline flex items-center gap-0.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Bağlantıyı Test Et</span>
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    value={editListingUrl}
                    onChange={(e) => setEditListingUrl(e.target.value)}
                    placeholder="https://101evler.com/... veya portal ilan linki"
                    className="sharp-input w-full p-2 font-mono text-xs bg-white"
                  />
                </div>
              )}

              {/* PAYLAŞIM & SORUMLU DANIŞMAN */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                {/* Diğer Danışmanlara Paylaş */}
                <div className="p-2.5 bg-cyan-50/60 border border-cyan-200">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsShared}
                      onChange={(e) => setEditIsShared(e.target.checked)}
                      className="w-4 h-4 text-[#00adb5] accent-[#00adb5] rounded border-slate-300"
                    />
                    <span className="font-bold text-[#1d2566]">Diğer Danışmanlara Paylaş</span>
                  </label>
                  <p className="text-[10px] text-slate-500 font-mono ml-6 mt-0.5">
                    İşaretlenirse tüm danışmanlar bu portföyü Paylaşılan Portföyler sekmesinde görebilir.
                  </p>
                </div>

                {/* Off-Market (Gizli) Portföy */}
                <div className="p-2.5 bg-amber-50/60 border border-amber-200">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsOffMarket}
                      onChange={(e) => setEditIsOffMarket(e.target.checked)}
                      className="w-4 h-4 text-amber-600 accent-amber-600 rounded border-slate-300"
                    />
                    <span className="font-bold text-amber-900 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-700" />
                      <span>Gizli / Özel Portföy (Off-Market)</span>
                    </span>
                  </label>
                  <p className="text-[10px] text-slate-500 font-mono ml-6 mt-0.5">
                    Portallarda ve ilan sitelerinde yayınlanmaz, sadece ofis içi birebir eşleştirmeler için kullanılır.
                  </p>
                </div>

                {/* Danışman Ataması (Yalnızca Broker için) */}
                {isBroker && (
                  <div className="pt-1">
                    <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                      Portföy Sorumlusu Danışman
                    </label>
                    <select
                      value={editAssigneeId}
                      onChange={(e) => setEditAssigneeId(e.target.value)}
                      className="sharp-input w-full p-2 bg-white font-mono"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role === "ADMIN" ? "Broker" : "Danışman"})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Aksiyon Butonları */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
                {!isActive(editingProperty) ? (
                  <button
                    type="button"
                    onClick={() => {
                      const p = editingProperty;
                      if (
                        confirm(
                          `"${editTitle || p.title}" portföyünü yeniden aktife almak ve canlı ilan havuzuna çekmek istiyor musunuz?`
                        )
                      ) {
                        reactivateProperty(p.id);
                        setEditingProperty(null);
                      }
                    }}
                    className="px-3.5 py-1.5 font-mono text-xs font-bold flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-400 shadow-2xs cursor-pointer transition"
                    title="Portföyü tek tıkla canlı ilan havuzuna geri döndür"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Portföyü Aktifleştir</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const p = editingProperty;
                      setEditingProperty(null);
                      setDealCloseProperty(p);
                      setIsDealCloseModalOpen(true);
                    }}
                    className={`px-3.5 py-1.5 font-mono text-xs font-bold flex items-center gap-1.5 border shadow-2xs cursor-pointer ${
                      editingProperty.listingType === "sale"
                        ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300"
                        : "bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300"
                    }`}
                    title={
                      editingProperty.listingType === "sale"
                        ? "Portföy Satıldı (İşlem Kapat)"
                        : "Portföy Kiralandı (İşlem Kapat)"
                    }
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        editingProperty.listingType === "sale" ? "text-amber-600" : "text-blue-600"
                      }`}
                    />
                    <span>
                      {editingProperty.listingType === "sale"
                        ? "Portföy Satıldı (İşlem Kapat)"
                        : "Portföy Kiralandı (İşlem Kapat)"}
                    </span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProperty(null)}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="sharp-btn-primary px-4 py-1.5 font-bold text-white shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Değişiklikleri Kaydet</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SİLME ONAY MODALI */}
      <DeleteConfirmModal
        isOpen={!!propertyToDelete}
        title="Portföyü Sil"
        itemName={propertyToDelete ? propertyToDelete.title : undefined}
        message="Bu portföy kaydı, fotoğrafları ve ofis kayıtları sistemden kalıcı olarak silinecektir."
        onConfirm={() => {
          if (propertyToDelete) {
            deleteProperty(propertyToDelete.id);
            if (activePropertyDetail?.id === propertyToDelete.id) {
              setActivePropertyDetail(null);
            }
            setPropertyToDelete(null);
          }
        }}
        onCancel={() => setPropertyToDelete(null)}
      />

      {/* İŞLEM KAPAMA (İŞLEM SONRASI OFİS RAPORU) MODALI */}
      <AddDealModal
        isOpen={isDealCloseModalOpen}
        initialPropertyId={dealCloseProperty?.id}
        onClose={() => {
          setIsDealCloseModalOpen(false);
          setDealCloseProperty(null);
        }}
        onSuccess={() => {
          setIsDealCloseModalOpen(false);
          setDealCloseProperty(null);
        }}
      />

      {/* CANONICAL MÜŞTERİ / SATICI OLUŞTURMA MODALI */}
      <AddCustomerModal
        isOpen={isAddSellerSubModalOpen}
        onClose={() => setIsAddSellerSubModalOpen(false)}
        initialCategory="SELLER"
        zIndex={130}
        onSuccess={(newCustomer) => {
          setIsAddSellerSubModalOpen(false);
          if (newCustomer) {
            setFormOwnerCustomerId(newCustomer.id);
            setEditOwnerCustomerId(newCustomer.id);
            setEditOwnerName(newCustomer.fullName);
            setEditOwnerPhone(newCustomer.phone || "");
            setSellerNotice(`✓ Yeni satıcı müşteri havuzuna eklendi ve portföye seçildi: ${newCustomer.fullName}`);
            setTimeout(() => setSellerNotice(null), 5000);
          }
        }}
      />
    </div>
  );
}
