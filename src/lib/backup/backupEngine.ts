import * as XLSX from "xlsx";
import JSZip from "jszip";
import {
  Customer,
  Property,
  Deal,
  RentalContract,
  MandateContract,
  FollowUp,
  User,
} from "../types";
import { formatPropertyStatus, formatListingType } from "../formatters";

export type BackupModuleKey =
  | "customers"
  | "properties"
  | "deals"
  | "rentals"
  | "mandates"
  | "followUps";

export type PeriodFilter = "all" | "2026" | "2025" | "this_month" | "custom";

export interface BackupFilterOptions {
  scope: "all" | BackupModuleKey[];
  advisorId: "all" | string;
  period: PeriodFilter;
  customStartDate?: string; // YYYY-MM-DD
  customEndDate?: string; // YYYY-MM-DD
}

export interface BackupMetadata {
  version: "3.0";
  system: "Trustline Real Estate CRM";
  exportedAt: string;
  scopeSummary: string;
  advisorFilter: string;
  periodFilter: string;
  exportedBy: {
    id: string;
    name: string;
    username: string;
    role: string;
    title?: string;
  };
  counts: {
    customers: number;
    properties: number;
    deals: number;
    rentals: number;
    mandates: number;
    followUps: number;
  };
}

export interface BackupPayload {
  metadata: BackupMetadata;
  customers: Customer[];
  properties: Property[];
  deals: Deal[];
  rentals: RentalContract[];
  mandates: MandateContract[];
  followUps: FollowUp[];
}

// Tarih filtresi kontrolü
function matchesPeriod(
  dateStr: string | undefined,
  period: PeriodFilter,
  startDate?: string,
  endDate?: string
): boolean {
  if (period === "all" || !dateStr) return true;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;

  const year = d.getFullYear();
  if (period === "2026") return year === 2026;
  if (period === "2025") return year === 2025;

  if (period === "this_month") {
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }

  if (period === "custom") {
    const itemTime = d.getTime();
    if (startDate) {
      const start = new Date(startDate).getTime();
      if (itemTime < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate).getTime() + 86400000; // gün sonuna kadar
      if (itemTime > end) return false;
    }
    return true;
  }

  return true;
}

// 1. GRANÜLER YEDEK VERİSİ ÜRETİM MOTORU
export function generateBackupPayload(
  allData: {
    customers: Customer[];
    properties: Property[];
    deals: Deal[];
    rentals: RentalContract[];
    mandates: MandateContract[];
    followUps: FollowUp[];
  },
  options: BackupFilterOptions,
  currentUser: User,
  allUsers: User[]
): BackupPayload {
  const isAllScope = options.scope === "all";
  const selectedScope = new Set(
    Array.isArray(options.scope) ? options.scope : []
  );

  const shouldInclude = (key: BackupModuleKey) =>
    isAllScope || selectedScope.has(key);

  const targetAdvisor =
    options.advisorId !== "all"
      ? allUsers.find((u) => u.id === options.advisorId)
      : null;

  // Filtreleme fonksiyonları
  const filteredCustomers = shouldInclude("customers")
    ? allData.customers.filter((c) => {
        if (
          options.advisorId !== "all" &&
          c.assignedToId !== options.advisorId
        ) {
          return false;
        }
        return matchesPeriod(
          c.createdAt,
          options.period,
          options.customStartDate,
          options.customEndDate
        );
      })
    : [];

  const filteredProperties = shouldInclude("properties")
    ? allData.properties.filter((p) => {
        if (
          options.advisorId !== "all" &&
          p.assignedToId !== options.advisorId
        ) {
          return false;
        }
        return matchesPeriod(
          p.createdAt,
          options.period,
          options.customStartDate,
          options.customEndDate
        );
      })
    : [];

  const filteredDeals = shouldInclude("deals")
    ? allData.deals.filter((d) => {
        if (options.advisorId !== "all") {
          const isCreator = d.createdById === options.advisorId;
          const isPartner = d.partnerAdvisorId === options.advisorId;
          if (!isCreator && !isPartner) return false;
        }
        return matchesPeriod(
          d.closingDate || d.createdAt,
          options.period,
          options.customStartDate,
          options.customEndDate
        );
      })
    : [];

  const filteredRentals = shouldInclude("rentals")
    ? allData.rentals.filter((r) => {
        if (
          options.advisorId !== "all" &&
          r.assignedToId !== options.advisorId
        ) {
          return false;
        }
        return matchesPeriod(
          r.contractStart || r.createdAt,
          options.period,
          options.customStartDate,
          options.customEndDate
        );
      })
    : [];

  const filteredMandates = shouldInclude("mandates")
    ? allData.mandates.filter((m) => {
        if (
          options.advisorId !== "all" &&
          m.assignedToId !== options.advisorId
        ) {
          return false;
        }
        return matchesPeriod(
          m.startDate || m.createdAt,
          options.period,
          options.customStartDate,
          options.customEndDate
        );
      })
    : [];

  const filteredFollowUps = shouldInclude("followUps")
    ? allData.followUps.filter((f) => {
        if (options.advisorId !== "all") {
          const isAssigned = f.assignedToId === options.advisorId;
          const isCreator = f.createdById === options.advisorId;
          if (!isAssigned && !isCreator) return false;
        }
        return matchesPeriod(
          f.dueAt || f.createdAt,
          options.period,
          options.customStartDate,
          options.customEndDate
        );
      })
    : [];

  const metadata: BackupMetadata = {
    version: "3.0",
    system: "Trustline Real Estate CRM",
    exportedAt: new Date().toISOString(),
    scopeSummary: isAllScope ? "Tüm Veritabanı" : Array.from(selectedScope).join(", "),
    advisorFilter: targetAdvisor
      ? `${targetAdvisor.name} (@${targetAdvisor.username})`
      : "Tüm Ofis Veritabanı",
    periodFilter:
      options.period === "all"
        ? "Tüm Zamanlar"
        : options.period === "this_month"
        ? "Bu Ay"
        : options.period === "custom"
        ? `${options.customStartDate || "..."} - ${options.customEndDate || "..."}`
        : `${options.period} Yılı`,
    exportedBy: {
      id: currentUser.id,
      name: currentUser.name,
      username: currentUser.username,
      role: currentUser.role,
      title: currentUser.title,
    },
    counts: {
      customers: filteredCustomers.length,
      properties: filteredProperties.length,
      deals: filteredDeals.length,
      rentals: filteredRentals.length,
      mandates: filteredMandates.length,
      followUps: filteredFollowUps.length,
    },
  };

  return {
    metadata,
    customers: filteredCustomers,
    properties: filteredProperties,
    deals: filteredDeals,
    rentals: filteredRentals,
    mandates: filteredMandates,
    followUps: filteredFollowUps,
  };
}

// 2. ÇOK SEKMELİ YÖNETİCİ EXCEL'İ (.XLSX) ÜRETİMİ
export function generateExcelWorkbook(payload: BackupPayload): Uint8Array {
  const wb = XLSX.utils.book_new();

  // SEKME 1: MÜŞTERİLER
  const customersRows = payload.customers.map((c, idx) => ({
    "No": idx + 1,
    "Müşteri ID": c.id,
    "Ad Soyad": c.fullName,
    "Telefon": c.phone,
    "WhatsApp": c.whatsapp || c.phone,
    "E-posta": c.email || "-",
    "Kategori":
      c.category === "BUYER"
        ? "Alıcı"
        : c.category === "SELLER"
        ? "Satıcı"
        : c.category === "TENANT"
        ? "Kiracı"
        : c.category === "LANDLORD"
        ? "Ev Sahibi"
        : "Yatırımcı",
    "Sıcaklık":
      c.temperature === "hot"
        ? "🔥 Sıcak (Acil)"
        : c.temperature === "warm"
        ? "☀️ Ilık"
        : "❄️ Soğuk",
    "VIP": c.isVip ? "Evet" : "Hayır",
    "Aranan Bölge": c.region,
    "Mülk Tipi": c.propertyType,
    "Oda Sayısı": c.rooms || "-",
    "Bütçe Tutarı": c.budget ? `${c.budget.toLocaleString("tr-TR")} ${c.budgetCurrency}` : "0",
    "Aşama (Pipeline)": c.stage,
    "Sorumlu Danışman": c.assignedToName || "-",
    "Eklenme Tarihi": c.createdAt ? new Date(c.createdAt).toLocaleDateString("tr-TR") : "-",
    "Son İletişim": c.lastContactAt ? new Date(c.lastContactAt).toLocaleDateString("tr-TR") : "-",
    "Özel Notlar": c.notes || "-",
  }));

  const wsCustomers = XLSX.utils.json_to_sheet(customersRows);
  XLSX.utils.book_append_sheet(wb, wsCustomers, "Müşteri Havuzu");

  // SEKME 2: PORTFÖYLER
  const propertiesRows = payload.properties.map((p, idx) => ({
    "No": idx + 1,
    "Portföy ID": p.id,
    "İlan Başlığı": p.title,
    "İşlem Türü": formatListingType(p.listingType),
    "Durum": formatPropertyStatus(p.status),
    "Mülk Tipi": p.propertyType,
    "Fiyat": `${p.price.toLocaleString("tr-TR")} ${p.currency}`,
    "Şehir / Bölge": p.region,
    "Oda Sayısı": p.rooms,
    "Alan (m²)": p.area,
    "Açık Adres": p.address || "-",
    "Mülk Sahibi Adı": p.ownerName || "-",
    "Mülk Sahibi Telefonu": p.ownerPhone || "-",
    "Danışman": p.assignedToName || "-",
    "Paylaşımlı Portföy": p.isShared ? "Evet" : "Hayır",
    "Off-Market (Gizli)": p.isOffMarket ? "Evet" : "Hayır",
    "Kayıt Tarihi": p.createdAt ? new Date(p.createdAt).toLocaleDateString("tr-TR") : "-",
    "İlan Linki": p.listingUrl || "-",
  }));

  const wsProperties = XLSX.utils.json_to_sheet(propertiesRows);
  XLSX.utils.book_append_sheet(wb, wsProperties, "Portföy Envanteri");

  // SEKME 3: KAPANAN İŞLEMLER & FİNANS
  const dealsRows = payload.deals.map((d, idx) => ({
    "No": idx + 1,
    "İşlem ID": d.id,
    "Portföy Başlığı": d.propertyTitle || d.title,
    "İşlem Tipi": d.dealType === "rent" ? "Kiralama" : "Satış",
    "Alıcı / Kiracı": d.customerName || "-",
    "Mülk Sahibi": d.landlordName || "-",
    "Nihai Anlaşılan Fiyat": `${d.agreedPrice.toLocaleString("tr-TR")} ${d.currency}`,
    "Alınan Depozito": d.deposit ? `${d.deposit.toLocaleString("tr-TR")} ${d.currency}` : "0",
    "Komisyon Oranı (%)": d.commissionRate ? `%${d.commissionRate}` : "-",
    "Brüt Komisyon Tutarı": `${d.commissionReceived.toLocaleString("tr-TR")} ${d.currency}`,
    "Portföy Kökeni": d.portfolioOrigin === "advisor" ? "Danışman Portföyü" : "Ofis Portföyü",
    "Paylaşım Türü":
      d.sharingType === "external"
        ? "Dış Ofis ile Paylaşım"
        : d.sharingType === "internal"
        ? "Şirket İçi Ortak Danışman"
        : "Tek Danışman",
    "Ortak Danışman / Ofis": d.partnerCompany || d.partnerAdvisorName || d.partnerName || "-",
    "Ortak Pay Tutarı": d.partnerShareAmount ? `${d.partnerShareAmount.toLocaleString("tr-TR")} ${d.currency}` : "0",
    "Satış Danışmanı Payı": `${(d.advisorShareAmount || 0).toLocaleString("tr-TR")} ${d.currency}`,
    "Trustline Ofis Payı": `${(d.officeShareAmount || 0).toLocaleString("tr-TR")} ${d.currency}`,
    "Alıcının Geldiği Kanal": d.leadChannel || "-",
    "Kapanış / Satış Tarihi": d.closingDate || (d.createdAt ? new Date(d.createdAt).toLocaleDateString("tr-TR") : "-"),
    "İşlemi Yapan": d.createdByName || "-",
    "Broker Onayı": d.brokerApproval ? "Onaylandı" : "Bekliyor",
  }));

  const wsDeals = XLSX.utils.json_to_sheet(dealsRows);
  XLSX.utils.book_append_sheet(wb, wsDeals, "Kapanan İşlemler");

  // SEKME 4: KİRA TAKİP MATRİSİ
  const rentalsRows = payload.rentals.map((r, idx) => {
    const paidCount = (r.payments || []).filter((p) => p.status === "paid").length;
    const unpaidCount = (r.payments || []).length - paidCount;

    return {
      "No": idx + 1,
      "Kontrat ID": r.id,
      "Kiralanan Mülk": r.propertyTitle,
      "Bölge": r.region,
      "Kiracı Adı": r.tenantName,
      "Kiracı Telefonu": r.tenantPhone,
      "Mülk Sahibi": r.landlordName,
      "Aylık Kira Bedeli": `${r.monthlyRent.toLocaleString("tr-TR")} ${r.currency}`,
      "Kira Ödeme Günü": `Her ayın ${r.dueDay}. günü`,
      "Depozito": `${r.depositAmount.toLocaleString("tr-TR")} ${r.currency}`,
      "Sözleşme Başlangıç": r.contractStart,
      "Sözleşme Bitiş": r.contractEnd,
      "Ödenen Ay Sayısı": paidCount,
      "Kalan / Ödenmeyen": unpaidCount,
      "Kontrat Durumu": r.active ? "Aktif Yürürlükte" : "Sona Erdi",
      "Sorumlu Danışman": r.assignedToName || "-",
      "Notlar": r.notes || "-",
    };
  });

  const wsRentals = XLSX.utils.json_to_sheet(rentalsRows);
  XLSX.utils.book_append_sheet(wb, wsRentals, "Kira Takibi");

  // SEKME 5: YETKİ BELGELERİ
  const mandatesRows = payload.mandates.map((m, idx) => ({
    "No": idx + 1,
    "Sözleşme ID": m.id,
    "Portföy Başlığı": m.propertyTitle,
    "Mülk Tipi": m.propertyType,
    "Bölge": m.region,
    "Yetki Verilen Fiyat": `${m.listingPrice.toLocaleString("tr-TR")} ${m.currency}`,
    "Yetki Türü": m.mandateType === "exclusive" ? "Tek Yetkili (Exclusive)" : "Genel Yetki",
    "Komisyon Oranı (%)": `%${m.commissionRate}`,
    "Mülk Sahibi Adı": m.ownerName,
    "Mülk Sahibi Telefonu": m.ownerPhone,
    "Başlangıç Tarihi": m.startDate,
    "Bitiş Tarihi": m.endDate,
    "Sorumlu Danışman": m.assignedToName || "-",
    "Durum": m.status === "active" ? "Aktif" : m.status === "expired" ? "Süresi Doldu" : "İptal",
  }));

  const wsMandates = XLSX.utils.json_to_sheet(mandatesRows);
  XLSX.utils.book_append_sheet(wb, wsMandates, "Yetki Belgeleri");

  // SEKME 6: AJANDA & GÖREVLER
  const followUpsRows = payload.followUps.map((f, idx) => ({
    "No": idx + 1,
    "Görev ID": f.id,
    "Başlık": f.title,
    "İlgili Müşteri": f.customerName || "-",
    "İlgili Portföy": f.propertyTitle || "-",
    "Aktivite Türü":
      f.kind === "call"
        ? "Telefon Araması"
        : f.kind === "meeting"
        ? "Yüz Yüze Görüşme"
        : f.kind === "showing"
        ? "Yer Gösterme (Sunum)"
        : f.kind === "office_event"
        ? "Ofis Etkinliği"
        : "Diğer",
    "Planlanan Zaman": f.dueAt ? new Date(f.dueAt).toLocaleString("tr-TR") : "-",
    "Durum":
      f.status === "done"
        ? "Tamamlandı"
        : f.status === "cancelled"
        ? "İptal Edildi"
        : "Bekliyor",
    "Görüşme Sonucu": f.outcome || "-",
    "Geri Bildirim / Notlar": f.feedback || "-",
    "Sorumlu Danışman": f.assignedToName || "-",
    "Oluşturan": f.createdByName || "-",
  }));

  const wsFollowUps = XLSX.utils.json_to_sheet(followUpsRows);
  XLSX.utils.book_append_sheet(wb, wsFollowUps, "Ajanda & Takip");

  // Excel binary çıktısını üret
  const excelBuffer = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
  });

  return new Uint8Array(excelBuffer);
}

// 3. TAM ARŞİV ZIP PAKETİ (.ZIP) ÜRETİMİ
export async function generateZipArchive(
  payload: BackupPayload,
  fileNameBase: string
): Promise<Blob> {
  const zip = new JSZip();

  // 1. JSON Sistem Yedeğini ekle
  const jsonContent = JSON.stringify(payload, null, 2);
  zip.file(`${fileNameBase}_SISTEM_YEDEGI.json`, jsonContent);

  // 2. Excel dosyasını ekle
  const excelBuffer = generateExcelWorkbook(payload);
  zip.file(`${fileNameBase}_YONETICI_RAPORU.xlsx`, excelBuffer);

  // 3. README & Denetim Özeti Bilgi Notu ekle
  const readmeText = `====================================================================
TRUSTLINE REAL ESTATE CRM — GÜVENLİK VE VERİTABANI YEDEKLEME PAKETİ
====================================================================
Oluşturulma Tarihi : ${new Date().toLocaleString("tr-TR")}
Yedekleyen Yetkili : ${payload.metadata.exportedBy.name} (${payload.metadata.exportedBy.role})
Filtre Kapsamı     : ${payload.metadata.scopeSummary}
Danışman Filtresi  : ${payload.metadata.advisorFilter}
Dönem Filtresi     : ${payload.metadata.periodFilter}

PAKET İÇERİĞİ:
1. ${fileNameBase}_SISTEM_YEDEGI.json :
   Kusursuz sistem klonlama ve geri yükleme dosyasıdır. Trustline CRM Veri Koruma
   ekranından tek tıkla yüklenerek sistemi aynı saniyede sıfır kayıpla ayağa kaldırır.

2. ${fileNameBase}_YONETICI_RAPORU.xlsx :
   Muhasebe, yönetim veya arşiv incelemesi için hazırlanmış çok sekmeli Excel tablosudur.
   (Müşteriler, Portföyler, Kapanan İşlemler, Kira Takibi, Yetki Belgeleri, Ajanda).

İSTATİSTİKLER:
- Müşteriler      : ${payload.metadata.counts.customers} Kayıt
- Portföyler      : ${payload.metadata.counts.properties} Portföy
- Kapanan İşlemler: ${payload.metadata.counts.deals} Anlaşma
- Kira Sözleşmesi : ${payload.metadata.counts.rentals} Kontrat
- Yetki Belgeleri : ${payload.metadata.counts.mandates} Sözleşme
- Ajanda & Takip  : ${payload.metadata.counts.followUps} Aktivite

© 2026 Trustline Real Estate & Investment Ltd. Girne / KKTC
====================================================================`;

  zip.file("README_BILGI_NOTU.txt", readmeText);

  // ZIP'i Blob olarak paketle
  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return zipBlob;
}

// 4. İNDİRME YARDIMCILARI
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadJsonFile(payload: BackupPayload, fileName: string) {
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, fileName);
}

export function downloadExcelFile(payload: BackupPayload, fileName: string) {
  const buffer = generateExcelWorkbook(payload);
  const blob = new Blob([buffer as any], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, fileName);
}
