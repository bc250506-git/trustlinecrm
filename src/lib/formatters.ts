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
    case "SELLER_AND_BUYER":
      return "Satıcı & Alıcı Adayı";
    case "TENANT":
      return "Kiracı";
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

/**
 * Tarihleri standart Türkçe formatta gg/aa/yyyy (DD/MM/YYYY) olarak formatlar
 */
export function formatDateTR(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "-";
  try {
    if (typeof dateInput === "string") {
      const trimmed = dateInput.trim();
      if (!trimmed || trimmed === "-") return "-";
      // Zaten gg/aa/yyyy veya gg.aa.yyyy ise doğrudan gg/aa/yyyy dön
      if (/^\d{2}[/.]\d{2}[/.]\d{4}$/.test(trimmed)) {
        return trimmed.replace(/\./g, "/");
      }
      // YYYY-MM-DD veya YYYY-MM-DDTHH:mm:ss formatı
      const clean = trimmed.split("T")[0];
      const parts = clean.split("-");
      if (parts.length === 3 && parts[0].length === 4) {
        const [y, m, d] = parts;
        return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
      }
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return typeof dateInput === "string" ? dateInput : "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return typeof dateInput === "string" ? dateInput : "-";
  }
}

/**
 * Telefon numarasından +90 (5 prefixi haricindeki kalan 9 haneyi çeker
 */
export function extractPhone9Digits(raw: string | undefined | null): string {
  if (!raw) return "";
  let digits = raw.replace(/\D/g, "");
  // 905XXXXXXXXX (12 hane) -> ilk 3 haneyi at
  if (digits.startsWith("905")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("05")) {
    // 05XXXXXXXXX (11 hane) -> ilk 2 haneyi at
    digits = digits.slice(2);
  } else if (
    digits.startsWith("5") &&
    (digits.length >= 10 || (digits.length >= 2 && (digits[1] === "3" || digits[1] === "4" || digits[1] === "0")))
  ) {
    // 5XXXXXXXXX veya 53X, 54X, 50X girildiyse baştaki mükerrer 5'i at
    digits = digits.slice(1);
  } else if (digits.startsWith("90") && digits.length >= 11) {
    digits = digits.slice(2);
    if (digits.startsWith("5")) digits = digits.slice(1);
  }
  // En fazla 9 hane
  return digits.slice(0, 9);
}

/**
 * Girilen 9 haneyi veya ham telefon numarasını +90 (5xx) xxx xx xx formatına dönüştürür
 */
export function formatPhoneWithPrefix(raw: string | undefined | null): string {
  if (!raw) return "";
  const d = extractPhone9Digits(raw);
  if (!d) return "";
  
  let res = "+90 (5";
  if (d.length > 0) {
    res += d.slice(0, 2);
  }
  if (d.length >= 2) {
    res += ")";
  }
  if (d.length > 2) {
    res += " " + d.slice(2, 5);
  }
  if (d.length > 5) {
    res += " " + d.slice(5, 7);
  }
  if (d.length > 7) {
    res += " " + d.slice(7, 9);
  }
  return res;
}

/**
 * WhatsApp mesajlaşma API'si için (wa.me) temiz 905XXXXXXXXX formatı üretir
 */
export function cleanWhatsAppNumber(phone: string | undefined | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("905") && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith("05") && digits.length === 11) {
    return "90" + digits.slice(1);
  }
  if (digits.startsWith("5") && digits.length === 10) {
    return "90" + digits;
  }
  if (digits.length === 9) {
    return "905" + digits;
  }
  if (digits.startsWith("90")) {
    return digits;
  }
  return `90${digits}`;
}

/**
 * Randevu ve ajanda saatini kullanıcının girdiği yerel saate sadık kalarak ISO formatına dönüştürür.
 * Örneğin: date="2026-10-20", time="10:00" -> Yerel saatle oluşturulup toISOString() üretir.
 * Bu sayede veritabanı (TIMESTAMPTZ) ve tarayıcılar arasında saat kayması (+3 saat ekleme) engellenir.
 */
export function combineLocalDateAndTimeToIso(dateStr: string, timeStr?: string): string {
  if (!dateStr) return new Date().toISOString();
  const cleanTime = timeStr && timeStr.trim() ? timeStr.trim() : "10:00";
  const [hours, minutes] = cleanTime.split(":").map((v) => Number(v) || 0);
  const [year, month, day] = dateStr.split("-").map((v) => Number(v) || 0);

  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return localDate.toISOString();
}

/**
 * Veritabanından gelen dueAt değerinden yerel tarih ("YYYY-MM-DD") ve saati ("HH:mm") çözer.
 * Düzenleme modalında ve form alanlarında tam girilen saati gösterir.
 */
export function extractLocalDateAndTime(dueAtStr?: string): { date: string; time: string } {
  if (!dueAtStr) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return { date: `${y}-${m}-${d}`, time: "10:00" };
  }

  // Eğer doğrudan saat dilimsiz "YYYY-MM-DDTHH:mm:ss" kaydedilmiş eski bir veriyse
  if (dueAtStr.includes("T") && !dueAtStr.endsWith("Z") && !dueAtStr.includes("+")) {
    const [dPart, tPart] = dueAtStr.split("T");
    return {
      date: dPart,
      time: tPart.slice(0, 5) || "10:00",
    };
  }

  const dt = new Date(dueAtStr);
  if (isNaN(dt.getTime())) {
    const parts = dueAtStr.split("T");
    return { date: parts[0] || "", time: parts[1]?.slice(0, 5) || "10:00" };
  }

  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  const hours = String(dt.getHours()).padStart(2, "0");
  const minutes = String(dt.getMinutes()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

/**
 * Görev ve randevunun saatini kartlarda ve listelerde tam yerel saat formatında ("10:00") döndürür.
 */
export function formatFollowUpTime(dueAtStr?: string): string {
  if (!dueAtStr) return "10:00";
  return extractLocalDateAndTime(dueAtStr).time;
}

/**
 * Görev ve randevunun gününü ("YYYY-MM-DD") yerel saat dilimine göre döndürür.
 */
export function formatFollowUpDate(dueAtStr?: string): string {
  if (!dueAtStr) return "";
  return extractLocalDateAndTime(dueAtStr).date;
}

