"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Property, Currency } from "@/lib/types";
import { KKTC_DISTRICTS, getRegionsByDistrict } from "@/lib/kktcLocations";
import {
  Building,
  X,
  MapPin,
  User,
  Key,
  Globe,
  ExternalLink,
  Share2,
  Lock,
  UserPlus,
} from "lucide-react";
import { PropertyImageUploader } from "../properties/PropertyImageUploader";
import { AddCustomerModal } from "./AddCustomerModal";

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newProperty: Property) => void;
  zIndex?: number;
  initialListingType?: "sale" | "rent";
  initialOwnerCustomerId?: string;
}

export function AddPropertyModal({
  isOpen,
  onClose,
  onSuccess,
  zIndex,
  initialListingType,
  initialOwnerCustomerId,
}: AddPropertyModalProps) {
  const {
    currentUser,
    isBroker,
    customers,
    addProperty,
    updateProperty,
  } = useStore();

  const [formTitle, setFormTitle] = useState("");
  const [formImageUrl, setFormImageUrl] = useState<string | undefined>(undefined);
  const [formDistrict, setFormDistrict] = useState(KKTC_DISTRICTS[0]);
  const [formSubRegion, setFormSubRegion] = useState(getRegionsByDistrict(KKTC_DISTRICTS[0])[0] || "");
  const [formListingType, setFormListingType] = useState<"sale" | "rent">("sale");
  const [formPropertyType, setFormPropertyType] = useState("Daire");
  const [formPrice, setFormPrice] = useState("");
  const [formCurrency, setFormCurrency] = useState<Currency>("GBP");

  // Çift İlan (Hem Satılık Hem Kiralık) State
  const [formIsDualListing, setFormIsDualListing] = useState(false);
  const [formDualPrice, setFormDualPrice] = useState("");
  const [formDualCurrency, setFormDualCurrency] = useState<Currency>("GBP");

  const [formArea, setFormArea] = useState("");
  const [formRooms, setFormRooms] = useState("2+1");
  const [formOwnerCustomerId, setFormOwnerCustomerId] = useState("");
  const [formKeyHolder, setFormKeyHolder] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPublicDesc, setFormPublicDesc] = useState("");
  const [formListingUrl, setFormListingUrl] = useState("");
  const [formIsShared, setFormIsShared] = useState(false);
  const [formIsOffMarket, setFormIsOffMarket] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

  const prevIsOpenRef = React.useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setFormTitle("");
      setFormImageUrl(undefined);
      setFormDistrict(KKTC_DISTRICTS[0]);
      setFormSubRegion(getRegionsByDistrict(KKTC_DISTRICTS[0])[0] || "");
      setFormListingType(initialListingType || "sale");
      setFormPropertyType("Daire");
      setFormPrice("");
      setFormCurrency("GBP");
      setFormIsDualListing(false);
      setFormDualPrice("");
      setFormDualCurrency("GBP");
      setFormArea("");
      setFormRooms("2+1");
      setFormOwnerCustomerId(initialOwnerCustomerId || "");
      setFormKeyHolder("");
      setFormAddress("");
      setFormPublicDesc("");
      setFormListingUrl("");
      setFormIsShared(false);
      setFormIsOffMarket(false);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialListingType, initialOwnerCustomerId]);

  if (!isOpen) return null;

  const handleDistrictChange = (d: string) => {
    setFormDistrict(d);
    const subs = getRegionsByDistrict(d);
    setFormSubRegion(subs[0] || "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formPrice) return;

    const selectedOwner = customers.find((c) => c.id === formOwnerCustomerId);

    const photos = formImageUrl
      ? [
          {
            id: `p-${Date.now()}`,
            propertyId: "",
            url: formImageUrl,
            shareable: true,
          },
        ]
      : [];

    const newProp = addProperty({
      title: formTitle,
      region: `${formDistrict} / ${formSubRegion}`,
      propertyType: formPropertyType,
      listingType: formListingType,
      price: Number(formPrice) || 0,
      currency: formCurrency,
      area: Number(formArea) || 0,
      rooms: formRooms,
      status: "AVAILABLE",
      address: formAddress,
      ownerCustomerId: formOwnerCustomerId || undefined,
      ownerName: selectedOwner ? selectedOwner.fullName : "Bilinmiyor",
      ownerPhone: selectedOwner ? selectedOwner.phone : "",
      keyHolder: formKeyHolder,
      publicDescription: formPublicDesc,
      isShared: formIsShared,
      isOffMarket: formIsOffMarket,
      listingUrl: formIsOffMarket ? undefined : formListingUrl,
      assignedToId: currentUser.id,
      assignedToName: currentUser.name,
      imageUrl: formImageUrl,
      photos,
    });

    // Çift İlan (Aynı portföy hem Satılık hem Kiralık olarak 2 bağımsız kayıt eklenir)
    if (formIsDualListing && Number(formDualPrice) > 0) {
      const oppositeType: "sale" | "rent" = formListingType === "sale" ? "rent" : "sale";
      const secondaryProp = addProperty({
        title: formTitle,
        region: `${formDistrict} / ${formSubRegion}`,
        propertyType: formPropertyType,
        listingType: oppositeType,
        price: Number(formDualPrice) || 0,
        currency: formDualCurrency,
        area: Number(formArea) || 0,
        rooms: formRooms,
        status: "AVAILABLE",
        address: formAddress,
        ownerCustomerId: formOwnerCustomerId || undefined,
        ownerName: selectedOwner ? selectedOwner.fullName : "Bilinmiyor",
        ownerPhone: selectedOwner ? selectedOwner.phone : "",
        keyHolder: formKeyHolder,
        publicDescription: formPublicDesc,
        isShared: formIsShared,
        isOffMarket: formIsOffMarket,
        listingUrl: formIsOffMarket ? undefined : formListingUrl,
        assignedToId: currentUser.id,
        assignedToName: currentUser.name,
        imageUrl: formImageUrl,
        photos,
        linkedPropertyId: newProp.id,
      });

      updateProperty(newProp.id, { linkedPropertyId: secondaryProp.id });
    }

    onClose();
    if (onSuccess) onSuccess(newProp);
  };

  return (
    <div
      style={{ zIndex: zIndex || 70 }}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="sharp-card w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-300 bg-white shadow-2xl my-auto">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#00adb5]" />
            <h2 className="text-sm font-bold text-[#1d2566]">
              Yeni Portföy Kaydı
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
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
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                {formListingType === "sale" ? "Satış Fiyatı *" : "Kiralık Fiyatı *"}
              </label>
              <input
                type="number"
                required
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder={formListingType === "sale" ? "Örn: 250000" : "Örn: 850"}
                className="sharp-input w-full p-2 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                {formListingType === "sale" ? "Satış Para Birimi *" : "Kira Para Birimi *"}
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

          {/* ÇİFT İLAN SEÇENEĞİ (AYNI PORTFÖY HEM SATILIK HEM KİRALIK) */}
          <div className="p-3 border border-cyan-200 bg-cyan-50/40 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formIsDualListing}
                onChange={(e) => setFormIsDualListing(e.target.checked)}
                className="w-4 h-4 text-[#00adb5] rounded border-slate-300 focus:ring-[#00adb5]"
              />
              <span className="text-xs font-bold text-[#1d2566]">
                {formListingType === "sale"
                  ? "Bu portföy aynı zamanda KİRALIK olarak da pazarlanıyor"
                  : "Bu portföy aynı zamanda SATILIK olarak da pazarlanıyor"}
              </span>
            </label>
            <p className="text-[10px] text-slate-500 font-mono pl-6 leading-relaxed">
              İşaretlendiğinde portföy havuzuna ve eşleştirme motoruna aynı bilgiler ve fotoğraflarla hem Satılık hem Kiralık olarak 2 bağımsız kayıt eklenir. İlanların statüleri birbirinden bağımsızdır (biri kiralandığında veya pasife alındığında diğeri aktif kalabilir).
            </p>

            {formIsDualListing && (
              <div className="pt-2 border-t border-cyan-200/80 grid grid-cols-2 gap-3 pl-6">
                <div>
                  <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                    {formListingType === "sale" ? "Kiralık Fiyatı *" : "Satış Fiyatı *"}
                  </label>
                  <input
                    type="number"
                    required={formIsDualListing}
                    value={formDualPrice}
                    onChange={(e) => setFormDualPrice(e.target.value)}
                    placeholder={formListingType === "sale" ? "Örn: 850" : "Örn: 250000"}
                    className="sharp-input w-full p-2 font-mono text-xs bg-white border-cyan-400 focus:border-[#00adb5]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                    {formListingType === "sale" ? "Kira Para Birimi *" : "Satış Para Birimi *"}
                  </label>
                  <select
                    value={formDualCurrency}
                    onChange={(e) => setFormDualCurrency(e.target.value as any)}
                    className="sharp-input w-full p-2 font-mono text-xs bg-white text-[#1d2566] font-bold border-cyan-400 focus:border-[#00adb5]"
                  >
                    <option value="GBP">GBP (£ - İngiliz Sterlini)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="USD">USD ($ - Amerikan Doları)</option>
                    <option value="TRY">TRY (₺ - Türk Lirası)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

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

          {/* Mülk Sahibi / Satıcı Seçimi & Hızlı Ekle */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
              <label className="text-[11px] font-mono text-amber-900 font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Mal Sahibi / Müşteri (Zorunlu Alan) *</span>
              </label>

              <button
                type="button"
                onClick={() => setIsAddCustomerModalOpen(true)}
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
                value={formOwnerCustomerId}
                onChange={(e) => setFormOwnerCustomerId(e.target.value)}
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
          </div>

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
                placeholder="Örn: Ofis Kasasında #14"
                className="sharp-input w-full p-2 text-xs"
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
                className="sharp-input w-full p-2 text-xs"
              />
            </div>
          </div>

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

          {!formIsOffMarket && (
            <div>
              <label className="block text-slate-700 font-mono text-[11px] mb-1 font-semibold flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#00adb5]" />
                <span>İlan Bağlantı Linki (Opsiyonel)</span>
              </label>
              <input
                type="url"
                value={formListingUrl}
                onChange={(e) => setFormListingUrl(e.target.value)}
                placeholder="https://101evler.com/... veya portal linki"
                className="sharp-input w-full p-2 font-mono text-xs bg-white"
              />
            </div>
          )}

          {/* Paylaşım ve Off-Market Checkboxları */}
          <div className="space-y-2 pt-1 border-t border-slate-200">
            <div className="p-3 bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="modalPropertyShare"
                checked={formIsShared}
                onChange={(e) => setFormIsShared(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-[#00adb5] rounded-none cursor-pointer"
              />
              <label htmlFor="modalPropertyShare" className="cursor-pointer">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-[#00adb5]" />
                  Diğer Danışmanlara Paylaş
                </span>
                <span className="text-[11px] text-slate-500 block font-mono mt-0.5">
                  İşaretlenirse tüm ekip bu portföyü görüp müşteri eşleştirebilir.
                </span>
              </label>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="modalPropertyOffMarket"
                checked={formIsOffMarket}
                onChange={(e) => setFormIsOffMarket(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-amber-600 rounded-none cursor-pointer"
              />
              <label htmlFor="modalPropertyOffMarket" className="cursor-pointer">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  Gizli / Özel Portföy (Off-Market)
                </span>
                <span className="text-[11px] text-amber-700 block font-mono mt-0.5">
                  Portallarda ve genel ilanlarda yayınlanmaz, sadece VIP müşteri eşleşmesinde kullanılır.
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              className="sharp-btn-primary px-4 py-1.5 font-bold text-white shadow-2xs cursor-pointer"
            >
              Portföyü Kaydet
            </button>
          </div>
        </form>
      </div>

      {/* CANONICAL MÜŞTERİ / SATICI OLUŞTURMA MODALI */}
      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        initialCategory="SELLER"
        zIndex={(zIndex || 70) + 40}
        onSuccess={(newCust) => {
          setFormOwnerCustomerId(newCust.id);
          setIsAddCustomerModalOpen(false);
        }}
      />
    </div>
  );
}
