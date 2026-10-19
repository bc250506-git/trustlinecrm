import {
  Customer,
  Property,
  Deal,
  RentalContract,
  MandateContract,
  FollowUp,
} from "../types";

export interface SnapshotItem {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  type: "auto_pre_restore" | "auto_daily" | "manual";
  counts: {
    customers: number;
    properties: number;
    deals: number;
    rentals: number;
    mandates: number;
    followUps: number;
  };
  data: {
    customers: Customer[];
    properties: Property[];
    deals: Deal[];
    rentals: RentalContract[];
    mandates: MandateContract[];
    followUps: FollowUp[];
  };
}

const STORAGE_KEY = "trustline_crm_snapshots_v1";
const MAX_SNAPSHOTS = 5;

export function getLocalSnapshots(): SnapshotItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sanitizePropertiesForSnapshot(props: Property[]): Property[] {
  if (!Array.isArray(props)) return [];
  return props.map((p) => {
    const isBase64 = (s?: string) => Boolean(s && s.startsWith("data:"));
    const safeImageUrl = isBase64(p.imageUrl) ? undefined : p.imageUrl;
    const safePhotos = (p.photos || []).map((ph) => ({
      ...ph,
      url: isBase64(ph.url) ? "" : ph.url,
    }));
    return {
      ...p,
      imageUrl: safeImageUrl,
      photos: safePhotos,
    };
  });
}

export function saveSnapshot(
  name: string,
  description: string,
  type: SnapshotItem["type"],
  data: SnapshotItem["data"]
): SnapshotItem {
  const existing = getLocalSnapshots();

  const sanitizedData: SnapshotItem["data"] = {
    ...data,
    properties: sanitizePropertiesForSnapshot(data.properties || []),
  };

  const newSnapshot: SnapshotItem = {
    id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    description,
    createdAt: new Date().toISOString(),
    type,
    counts: {
      customers: data.customers?.length || 0,
      properties: data.properties?.length || 0,
      deals: data.deals?.length || 0,
      rentals: data.rentals?.length || 0,
      mandates: data.mandates?.length || 0,
      followUps: data.followUps?.length || 0,
    },
    data: sanitizedData,
  };

  // Mevcut eski snapshot'lardaki ağır base64 yükünü de hafifleterek kotayı ferahlat
  const cleanedExisting = existing.map((s) => ({
    ...s,
    data: {
      ...s.data,
      properties: sanitizePropertiesForSnapshot(s.data?.properties || []),
    },
  }));

  // En yeni snapshot başa gelir, maksimum 10 snapshot saklanır
  const updated = [newSnapshot, ...cleanedExisting].slice(0, 10);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Snapshot depolama uyarısı:", err);
  }

  return newSnapshot;
}

export function deleteSnapshot(id: string): boolean {
  const existing = getLocalSnapshots();
  const updated = existing.filter((s) => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

// Günlük otomatik snapshot alıcı kontrolü
export function checkAndCreateDailySnapshot(data: SnapshotItem["data"]) {
  if (typeof window === "undefined") return;
  const lastDailyKey = "trustline_last_daily_snapshot_date";
  const today = new Date().toISOString().split("T")[0];
  const lastDate = localStorage.getItem(lastDailyKey);

  if (lastDate !== today) {
    saveSnapshot(
      `Günlük Otomatik Güvenlik Kasası (${today})`,
      "Sistem açılışında alınan otomatik koruma noktası",
      "auto_daily",
      data
    );
    try {
      localStorage.setItem(lastDailyKey, today);
    } catch {}
  }
}
