import {
  Customer,
  Property,
  Deal,
  RentalContract,
  MandateContract,
  FollowUp,
} from "../types";

export interface NormalizedBackupData {
  customers: Customer[];
  properties: Property[];
  deals: Deal[];
  rentals: RentalContract[];
  mandates: MandateContract[];
  followUps: FollowUp[];
}

export interface BackupPreview {
  version: string;
  exportedAt: string;
  scopeSummary: string;
  exportedBy: string;
  totalRecords: number;
  counts: {
    customers: number;
    properties: number;
    deals: number;
    rentals: number;
    mandates: number;
    followUps: number;
  };
}

export interface ParseBackupResult {
  valid: boolean;
  error?: string;
  preview?: BackupPreview;
  data?: NormalizedBackupData;
}

export function parseAndValidateBackup(jsonString: string): ParseBackupResult {
  try {
    const parsed = JSON.parse(jsonString);

    if (typeof parsed !== "object" || parsed === null) {
      return {
        valid: false,
        error: "Geçersiz dosya formatı! Yüklenen dosya geçerli bir JSON nesnesi içermiyor.",
      };
    }

    // Hem yeni v3.0 formatını hem de eski v1-v2 ofis yedeği formatını destekle
    const rawCustomers =
      parsed.customers || parsed.data?.customers || [];
    const rawProperties =
      parsed.properties || parsed.data?.properties || [];
    const rawDeals =
      parsed.deals || parsed.data?.deals || [];
    const rawRentals =
      parsed.rentals || parsed.data?.rentals || [];
    const rawMandates =
      parsed.mandates || parsed.data?.mandates || [];
    const rawFollowUps =
      parsed.followUps || parsed.data?.followUps || [];

    const customers: Customer[] = (Array.isArray(rawCustomers) ? rawCustomers : []).map((c: any) => ({
      ...c,
      category: c.category || "BUYER",
      temperature: c.temperature || "warm",
      isVip: c.isVip ?? false,
      budgetCurrency: c.budgetCurrency || "TRY",
      stage: c.stage || "NEW",
      regions: Array.isArray(c.regions) ? c.regions : (c.region ? [c.region] : []),
      propertyTypes: Array.isArray(c.propertyTypes) ? c.propertyTypes : (c.propertyType ? [c.propertyType] : []),
      roomsList: Array.isArray(c.roomsList) ? c.roomsList : (c.rooms ? [c.rooms] : []),
    }));

    const properties: Property[] = (Array.isArray(rawProperties) ? rawProperties : []).map((p: any) => ({
      ...p,
      currency: p.currency || "TRY",
      listingType: p.listingType || "sale",
      status: p.status || "AVAILABLE",
      photos: Array.isArray(p.photos) ? p.photos : [],
      isOffMarket: p.isOffMarket ?? false,
      isShared: p.isShared ?? false,
    }));

    const deals: Deal[] = (Array.isArray(rawDeals) ? rawDeals : []).map((d: any) => ({
      ...d,
      dealType: d.dealType || "sale",
      currency: d.currency || "TRY",
      sharingType: d.sharingType || "none",
      portfolioOrigin: d.portfolioOrigin || "advisor",
      brokerApproval: d.brokerApproval ?? false,
      askingPrice: d.askingPrice || 0,
      offeredPrice: d.offeredPrice || 0,
      agreedPrice: d.agreedPrice || 0,
      deposit: d.deposit || 0,
      commissionExpected: d.commissionExpected || 0,
      commissionReceived: d.commissionReceived || 0,
    }));

    const rentals: RentalContract[] = (Array.isArray(rawRentals) ? rawRentals : []).map((r: any) => ({
      ...r,
      currency: r.currency || "GBP",
      active: r.active ?? true,
      payments: Array.isArray(r.payments) ? r.payments : [],
    }));

    const mandates: MandateContract[] = (Array.isArray(rawMandates) ? rawMandates : []).map((m: any) => ({
      ...m,
      currency: m.currency || "GBP",
      status: m.status || "active",
    }));

    const followUps: FollowUp[] = (Array.isArray(rawFollowUps) ? rawFollowUps : []).map((f: any) => ({
      ...f,
      status: f.status || "open",
      outcome: f.outcome || "pending",
    }));

    const totalRecords =
      customers.length +
      properties.length +
      deals.length +
      rentals.length +
      mandates.length +
      followUps.length;

    if (totalRecords === 0) {
      return {
        valid: false,
        error:
          "Yedek dosyasında hiçbir geçerli CRM kaydı (Müşteri, Portföy, vb.) bulunamadı.",
      };
    }

    const exportedAt =
      parsed.metadata?.exportedAt ||
      parsed.exportedAt ||
      parsed.timestamp ||
      new Date().toISOString();

    const scopeSummary =
      parsed.metadata?.scopeSummary ||
      parsed.exportScope ||
      "Sistem Veritabanı Yedeği";

    const exportedBy =
      parsed.metadata?.exportedBy?.name ||
      parsed.authorizedUser?.name ||
      "Ofis Yöneticisi";

    const version = parsed.metadata?.version || "2.0";

    const preview: BackupPreview = {
      version,
      exportedAt,
      scopeSummary,
      exportedBy,
      totalRecords,
      counts: {
        customers: customers.length,
        properties: properties.length,
        deals: deals.length,
        rentals: rentals.length,
        mandates: mandates.length,
        followUps: followUps.length,
      },
    };

    const data: NormalizedBackupData = {
      customers,
      properties,
      deals,
      rentals,
      mandates,
      followUps,
    };

    return {
      valid: true,
      preview,
      data,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Dosya okunamadı: ${err?.message || "Bilinmeyen JSON ayrıştırma hatası"}`,
    };
  }
}

// Güvenli Merge Fonksiyonu (ID bazlı birleştirme)
export function mergeEntityList<T extends { id: string }>(
  currentList: T[],
  backupList: T[]
): { merged: T[]; addedCount: number; updatedCount: number } {
  const map = new Map<string, T>(currentList.map((item) => [item.id, item]));
  let addedCount = 0;
  let updatedCount = 0;

  for (const item of backupList) {
    if (!item.id) continue;
    if (map.has(item.id)) {
      const existing = map.get(item.id)!;
      map.set(item.id, { ...existing, ...item });
      updatedCount++;
    } else {
      map.set(item.id, item);
      addedCount++;
    }
  }

  return {
    merged: Array.from(map.values()),
    addedCount,
    updatedCount,
  };
}
