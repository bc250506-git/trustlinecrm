import { CustomerCategory, PropertyStatus } from "./types";

/**
 * Müşteri kategorisi (BUYER, SELLER, TENANT) Türkçe gösterim
 */
export function formatCustomerCategory(category?: string | CustomerCategory): string {
  if (!category) return "";
  const upper = category.toUpperCase();
  switch (upper) {
    case "BUYER":
      return "Alıcı Adayı";
    case "SELLER":
      return "Satıcı";
    case "TENANT":
      return "Kiracı Adayı";
    case "LANDLORD":
      return "Ev Sahibi";
    case "INVESTOR":
      return "Yatırımcı";
    default:
      return category;
  }
}

/**
 * Müşteri sıcaklık durumu (hot, warm, cold) Türkçe gösterim
 */
export function formatCustomerTemperature(temperature?: string): string {
  if (!temperature) return "";
  const lower = temperature.toLowerCase();
  switch (lower) {
    case "hot":
      return "Sıcak (Acil)";
    case "warm":
      return "Ilık (Takipte)";
    case "cold":
      return "Soğuk (Pasif)";
    default:
      return temperature;
  }
}

/**
 * Takip / Ajanda işlem türü (showing, meeting, call, office_event, other)
 */
export function formatFollowUpKind(kind?: string, isOfficeEvent?: boolean): string {
  if (isOfficeEvent || kind === "office_event") {
    return "Ofis Etkinliği";
  }
  if (!kind) return "Genel Görev";
  const lower = kind.toLowerCase();
  switch (lower) {
    case "showing":
      return "Yer Gösterme";
    case "meeting":
      return "Yüz Yüze Görüşme";
    case "call":
      return "Telefon Araması";
    case "office_event":
      return "Ofis Etkinliği";
    case "other":
      return "Genel Görev";
    default:
      return kind;
  }
}

/**
 * Portföy durumu (AVAILABLE, SOLD, RENTED vb.)
 */
export function formatPropertyStatus(status?: string | PropertyStatus): string {
  if (!status) return "";
  const upper = status.toUpperCase();
  switch (upper) {
    case "AVAILABLE":
      return "Yayında (Müsait)";
    case "RESERVED":
    case "OPTIONED":
      return "Opsiyonlu / Rezerve";
    case "SOLD":
      return "Satıldı";
    case "RENTED":
      return "Kiralandı";
    case "ARCHIVED":
    case "PASSIVE":
      return "Pasif / Arşiv";
    default:
      return status;
  }
}

/**
 * İlan tipi (sale, rent)
 */
export function formatListingType(listingType?: string): string {
  if (!listingType) return "";
  const lower = listingType.toLowerCase();
  if (lower === "sale") return "Satılık";
  if (lower === "rent") return "Kiralık";
  return listingType;
}

/**
 * Satış / Kiralama anlaşma aşaması (offer, won, lost)
 */
export function formatDealStage(stage?: string): string {
  if (!stage) return "";
  const lower = stage.toLowerCase();
  switch (lower) {
    case "offer":
      return "Teklif / Sözleşme";
    case "won":
      return "Kazanıldı";
    case "lost":
      return "Kaybedildi";
    default:
      return stage;
  }
}

/**
 * Yetki sözleşmesi tipi (exclusive, open)
 */
export function formatMandateType(type?: string): string {
  if (!type) return "";
  const lower = type.toLowerCase();
  if (lower === "exclusive") return "Tek Yetkili";
  if (lower === "open") return "Genel Yetki";
  return type;
}

/**
 * Otomasyon kuralı kategorisi (rental, matchmaker, lead, mandate)
 */
export function formatAutomationCategory(category?: string): string {
  if (!category) return "";
  const lower = category.toLowerCase();
  switch (lower) {
    case "rental":
      return "Kira Takibi";
    case "matchmaker":
      return "Akıllı Eşleştirme";
    case "lead":
      return "Müşteri / Aday Takibi";
    case "mandate":
      return "Yetki Sözleşmesi";
    case "birthday":
      return "Doğum Günü";
    case "agenda":
      return "Ajanda & Randevu";
    case "finance":
      return "Finans & Komisyon";
    case "property":
      return "Portföy Yönetimi";
    default:
      return category;
  }
}
