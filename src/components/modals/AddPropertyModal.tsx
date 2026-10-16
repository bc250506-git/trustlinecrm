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
} from "lucide-react";
import { PropertyImageUploader } from "../properties/PropertyImageUploader";

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
  } = useStore();

  const [formTitle, setFormTitle] = useState("");
  const [formImageUrl, setFormImageUrl] = useState<string | undefined>(undefined);
  const [formDistrict, setFormDistrict] = useState(KKTC_DISTRICTS[0]);
  const [formSubRegion, setFormSubRegion] = useState(getRegionsByDistrict(KKTC_DISTRICTS[0])[0] || "");
  const [formListingType, setFormListingType] = useState<"sale" | "rent">("sale");
  const [formPropertyType, setFormPropertyType] = useState("Daire");
  const [formPrice, setFormPrice] = useState("");
  const [formCurrency, setFormCurrency] = useState<Currency>("GBP");
  const [formArea, setFormArea] = useState("");
  const [formRooms, setFormRooms] = useState("2+1");
  const [formOwnerCustomerId, setFormOwnerCustomerId] = useState("");
  const [formKeyHolder, setFormKeyHolder] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPublicDesc, setFormPublicDesc] = useState("");
  const [formListingUrl, setFormListingUrl] = useState("");
  const [formIsShared, setFormIsShared] = useState(false);
  const [formIsOffMarket, setFormIsOffMarket] = useState(false);

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

    onClose();
    if (onSuccess) onSuccess(newProp);
  };

  return (
    <div
      style={{ zIndex: zIndex || 70 }}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="sharp-card w-full max-w-xl max-h-[92vh] overflow-y-auto border border-slate-300 bg-white shadow-2xl my-auto">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#00adb5]" />
            <h2 className="text-sm font-bold text-[#1d2566]">
              Yeni Portföy Kaydı
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
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

          {/* Mülk Sahibi Seçimi */}
          <div>
            <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold flex items-center gap-1">
              <User className="w-3 h-3 text-[#00adb5]" />
              <span>Mülk Sahibi (Müşteri Havuzundan)</span>
            </label>
            <select
              value={formOwnerCustomerId}
              onChange={(e) => setFormOwnerCustomerId(e.target.value)}
              className="sharp-input w-full p-2 bg-white"
            >
              <option value="">-- Müşteri havuzundan seçin --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.phone || "Tel yok"}) - {c.category === "SELLER" ? "Satıcı" : "Müşteri"}
                </option>
              ))}
            </select>
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
    </div>
  );
}
