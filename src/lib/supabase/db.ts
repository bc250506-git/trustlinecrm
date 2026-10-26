import { createClient } from "./client";
import {
  Customer,
  Property,
  FollowUp,
  Deal,
  RentalContract,
  MandateContract,
  User,
} from "../types";
import {
  initialCustomers,
  initialProperties,
  initialFollowUps,
  initialDeals,
  initialRentals,
  initialMandates,
  initialUsers,
} from "../mockData";

export const supabase = createClient();

// ==========================================
// 1. BAĞLANTI DURUMU & SAĞLIK KONTROLÜ (HEALTH CHECK)
// ==========================================
export interface SupabaseHealthStatus {
  isConnected: boolean;
  latencyMs: number;
  statusText: string;
  url: string;
  tables: Record<string, boolean>;
}

export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  const startTime = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qlfuwodxlfxirfvarczd.supabase.co";

  try {
    // Hafif bir sorgu ile bağlantı ve tablo varlığı testi
    const [custRes, propRes, dealRes, rentRes, mandRes] = await Promise.allSettled([
      supabase.from("customers").select("id").limit(1),
      supabase.from("properties").select("id").limit(1),
      supabase.from("deals").select("id").limit(1),
      supabase.from("rentals").select("id").limit(1),
      supabase.from("mandates").select("id").limit(1),
    ]);

    const latencyMs = Date.now() - startTime;

    const tables: Record<string, boolean> = {
      customers: custRes.status === "fulfilled" && !custRes.value.error,
      properties: propRes.status === "fulfilled" && !propRes.value.error,
      deals: dealRes.status === "fulfilled" && !dealRes.value.error,
      rentals: rentRes.status === "fulfilled" && !rentRes.value.error,
      mandates: mandRes.status === "fulfilled" && !mandRes.value.error,
    };

    const hasAnyTable = Object.values(tables).some(Boolean);

    return {
      isConnected: true,
      latencyMs,
      url,
      statusText: hasAnyTable
        ? "Bulut PostgreSQL Veritabanı Canlı & Tablolar Hazır"
        : "Supabase Bağlantısı Açık (SQL Şeması Çalıştırılmayı Bekliyor)",
      tables,
    };
  } catch (err: any) {
    return {
      isConnected: false,
      latencyMs: Date.now() - startTime,
      url,
      statusText: `Bağlantı Kurulamadı: ${err?.message || "Ağ hatası"}`,
      tables: {
        customers: false,
        properties: false,
        deals: false,
        rentals: false,
        mandates: false,
      },
    };
  }
}

// ==========================================
// 2. MÜŞTERİLER (CUSTOMERS)
// ==========================================
export async function getCustomers(): Promise<Customer[]> {
  try {
    const { data, error } = await supabase.from("customers").select("*");

    if (error || !data) {
      return [];
    }
    return data.map((c: any) => {
      const isAlsoBuyer =
        c.isAlsoBuyer !== undefined
          ? Boolean(c.isAlsoBuyer)
          : c.is_also_buyer !== undefined
          ? Boolean(c.is_also_buyer)
          : c.category === "SELLER_AND_BUYER" || c.category === "TENANT_AND_BUYER";
      return {
        ...c,
        isAlsoBuyer,
      };
    }) as Customer[];
  } catch {
    return [];
  }
}

export async function saveCustomer(customer: Partial<Customer>): Promise<boolean> {
  try {
    const payload: any = { ...customer };
    if (customer.isAlsoBuyer !== undefined) {
      payload.isAlsoBuyer = Boolean(customer.isAlsoBuyer);
      payload.is_also_buyer = Boolean(customer.isAlsoBuyer);
    }
    const { error } = await supabase.from("customers").upsert(payload);
    if (!error) return true;
    if (error.code === "PGRST204" || error.message?.includes("column")) {
      const { isAlsoBuyer, is_also_buyer, ...safeCust } = payload;
      const { error: safeErr } = await supabase.from("customers").upsert(safeCust);
      return !safeErr;
    }
    return false;
  } catch {
    return false;
  }
}

export async function deleteCustomerFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 3. PORTFÖYLER (PROPERTIES)
// ==========================================
export async function getProperties(): Promise<Property[]> {
  try {
    const { data, error } = await supabase.from("properties").select("*");

    if (error || !data) {
      return [];
    }
    return data as Property[];
  } catch {
    return [];
  }
}

export async function saveProperty(property: Partial<Property>): Promise<boolean> {
  try {
    const { error } = await supabase.from("properties").upsert(property);
    if (!error) return true;
    if (error.code === "PGRST204" || error.message?.includes("column")) {
      const { linkedPropertyId, ...safeProp } = property as any;
      const { error: safeErr } = await supabase.from("properties").upsert(safeProp);
      return !safeErr;
    }
    return false;
  } catch {
    return false;
  }
}

export async function deletePropertyFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("properties").delete().eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 4. AJANDA & TAKİPLER (FOLLOW UPS)
// ==========================================
export async function getFollowUps(): Promise<FollowUp[]> {
  try {
    const { data, error } = await supabase.from("follow_ups").select("*");

    if (error || !data) {
      return [];
    }
    return data as FollowUp[];
  } catch {
    return [];
  }
}

export async function saveFollowUp(followUp: Partial<FollowUp>): Promise<boolean> {
  try {
    const { error } = await supabase.from("follow_ups").upsert(followUp);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteFollowUpFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("follow_ups").delete().eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 5. FİNANS & KOMİSYON ANLAŞMALARI (DEALS)
// ==========================================
export async function getDeals(): Promise<Deal[]> {
  try {
    const { data, error } = await supabase.from("deals").select("*");

    if (error || !data) {
      return [];
    }
    return data as Deal[];
  } catch {
    return [];
  }
}

export async function saveDeal(deal: Partial<Deal>): Promise<boolean> {
  try {
    const { error } = await supabase.from("deals").upsert(deal);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteDealFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("deals").delete().eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 6. KİRA SÖZLEŞMELERİ (RENTALS)
// ==========================================
export async function getRentals(): Promise<RentalContract[]> {
  try {
    const { data, error } = await supabase.from("rentals").select("*");

    if (error || !data) {
      return [];
    }
    return data.map((r: any) => {
      let isStamped = r.isStamped ?? false;
      let stampedAt = r.stampedAt ?? undefined;
      let paymentPeriod = r.paymentPeriod ?? "monthly";
      let hasDues = r.hasDues ?? false;
      let duesAmount = r.duesAmount ?? undefined;
      let duesCurrency = r.duesCurrency ?? undefined;
      let dealId = r.dealId ?? undefined;
      let notes = r.notes ?? "";

      if (notes && notes.includes("<!--RENTAL_META:")) {
        try {
          const match = notes.match(/<!--RENTAL_META:(.*?)-->/);
          if (match && match[1]) {
            const parsed = JSON.parse(match[1]);
            if (parsed.isStamped !== undefined) isStamped = parsed.isStamped;
            if (parsed.stampedAt !== undefined) stampedAt = parsed.stampedAt;
            if (parsed.paymentPeriod !== undefined) paymentPeriod = parsed.paymentPeriod;
            if (parsed.hasDues !== undefined) hasDues = parsed.hasDues;
            if (parsed.duesAmount !== undefined) duesAmount = parsed.duesAmount;
            if (parsed.duesCurrency !== undefined) duesCurrency = parsed.duesCurrency;
            if (parsed.dealId !== undefined) dealId = parsed.dealId;
          }
          notes = notes.replace(/<!--RENTAL_META:.*?-->/g, "").trim();
        } catch {}
      }

      return {
        ...r,
        isStamped,
        stampedAt,
        paymentPeriod,
        hasDues,
        duesAmount,
        duesCurrency,
        dealId,
        notes,
      } as RentalContract;
    });
  } catch {
    return [];
  }
}

export async function saveRental(rental: Partial<RentalContract>): Promise<boolean> {
  try {
    // 1. Önce doğrudan upsert dene
    const { error } = await supabase.from("rentals").upsert(rental);
    if (!error) return true;

    // 2. Eğer şema uyumsuzluğu varsa
    const safePayload: any = {
      id: rental.id,
      propertyId: rental.propertyId || null,
      propertyTitle: rental.propertyTitle || "Kira Sözleşmesi",
      region: rental.region || null,
      tenantCustomerId: rental.tenantCustomerId || null,
      tenantName: rental.tenantName || "Kiracı",
      tenantPhone: rental.tenantPhone || null,
      landlordCustomerId: rental.landlordCustomerId || null,
      landlordName: rental.landlordName || "Mal Sahibi",
      landlordPhone: rental.landlordPhone || null,
      monthlyRent: rental.monthlyRent || 0,
      currency: rental.currency || "GBP",
      dueDay: rental.dueDay || 5,
      contractStart: rental.contractStart || null,
      contractEnd: rental.contractEnd || null,
      depositAmount: rental.depositAmount || 0,
      active: rental.active !== false,
      notes: rental.notes || null,
      assignedToId: rental.assignedToId || null,
      assignedToName: rental.assignedToName || null,
      createdAt: rental.createdAt || new Date().toISOString(),
      payments: rental.payments || [],
    };

    if (rental.isStamped || rental.stampedAt || rental.paymentPeriod || rental.hasDues || rental.duesAmount || rental.dealId) {
      const meta = {
        isStamped: rental.isStamped,
        stampedAt: rental.stampedAt,
        paymentPeriod: rental.paymentPeriod,
        hasDues: rental.hasDues,
        duesAmount: rental.duesAmount,
        duesCurrency: rental.duesCurrency,
        dealId: rental.dealId,
      };
      const cleanNotes = (safePayload.notes || "").replace(/<!--RENTAL_META:.*?-->/g, "").trim();
      safePayload.notes = cleanNotes
        ? `${cleanNotes} <!--RENTAL_META:${JSON.stringify(meta)}-->`
        : `<!--RENTAL_META:${JSON.stringify(meta)}-->`;
    }

    const { error: safeError } = await supabase.from("rentals").upsert(safePayload);
    if (safeError) {
      console.error("Kritik: saveRental güvenli payload ile de başarısız oldu:", safeError);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Kritik: saveRental istisnası:", err);
    return false;
  }
}

export async function deleteRentalFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("rentals").delete().eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 7. YETKİ SÖZLEŞMELERİ (MANDATES)
// ==========================================
export async function getMandates(): Promise<MandateContract[]> {
  try {
    const { data, error } = await supabase.from("mandates").select("*");

    if (error || !data) {
      return [];
    }
    return data as MandateContract[];
  } catch {
    return [];
  }
}

export async function saveMandate(mandate: Partial<MandateContract>): Promise<boolean> {
  try {
    const payload = {
      ...mandate,
      region: (mandate as any).region || "Girne",
      ownerName: mandate.ownerName || "Bilinmiyor",
      propertyType: (mandate as any).propertyType || "Daire",
      listingPrice: (mandate as any).listingPrice || 0,
      currency: mandate.currency || "GBP",
      status: mandate.status || "active",
      mandateType: mandate.mandateType || "exclusive",
      commissionRate: mandate.commissionRate ?? 5,
    };
    const { error } = await supabase.from("mandates").upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteMandateFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("mandates").delete().eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 7. KULLANICILAR & KRİPTOLU KİMLİK DOĞRULAMA (USERS & AUTH)
// ==========================================
export async function getUsersFromSupabase(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) {
      return initialUsers;
    }
    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      username: d.username,
      email: d.email || "",
      role: d.role || "AGENT",
      title: d.title || "",
      active: d.active !== false,
      mustChangePassword: d.mustChangePassword ?? d.must_change_password ?? true,
      passwordHash: d.passwordHash || d.password_hash || undefined,
      passwordSalt: d.passwordSalt || d.password_salt || undefined,
      phone: d.phone || "",
      avatarUrl: d.avatarUrl || d.avatar_url || "",
      commissionSplitRatio: d.commissionSplitRatio || 0.6,
      permissions: d.permissions || {
        scope: d.role === "ADMIN" ? "all" : "own",
        customers: true,
        properties: true,
        followups: true,
        pipeline: true,
        import: d.role === "ADMIN",
        finance: d.role === "ADMIN",
        rentals: d.role === "ADMIN",
        audit: d.role === "ADMIN",
      },
    })) as User[];
  } catch {
    return initialUsers;
  }
}

export async function saveUserCredentialsToSupabase(
  userId: string,
  passwordHash: string,
  passwordSalt: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Önce camelCase alanlarla dene
    const { error: err1 } = await supabase
      .from("users")
      .update({
        passwordHash,
        passwordSalt,
        mustChangePassword: false,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", userId);

    if (err1) {
      // snake_case kolonlarıyla dene
      const { error: err2 } = await supabase
        .from("users")
        .update({
          password_hash: passwordHash,
          password_salt: passwordSalt,
          must_change_password: false,
        })
        .eq("id", userId);

      if (err2) {
        // Eğer must_change_password kolonu henüz eklenmemişse yalnızca hash & salt kaydetmeyi dene
        const { error: err3 } = await supabase
          .from("users")
          .update({
            password_hash: passwordHash,
            password_salt: passwordSalt,
          })
          .eq("id", userId);

        if (err3) {
          const { error: err4 } = await supabase
            .from("users")
            .update({
              passwordHash,
              passwordSalt,
            })
            .eq("id", userId);

          if (err4) {
            console.warn("Supabase kullanıcı şifre hash kaydı uyarısı (SQL şeması güncellenmeli):", err2.message);
            return { success: false, error: err2.message };
          }
        }
      }
    }
    return { success: true };
  } catch (err: any) {
    console.warn("Supabase bağlantı hatası:", err);
    return { success: false, error: err?.message };
  }
}

export async function upsertUserToSupabase(user: User): Promise<boolean> {
  try {
    const { error } = await supabase.from("users").upsert(user);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 8. REALTIME WEBSOCKET DİNLEYİCİSİ (SENKRONİZASYON)
// ==========================================
export function setupRealtimeSync(
  onDatabaseChange: (payload: { table: string; eventType: string; newRecord: any; oldRecord?: any }) => void
) {
  try {
    const channel = supabase
      .channel("trustline-crm-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload) => {
          onDatabaseChange({
            table: payload.table,
            eventType: payload.eventType,
            newRecord: payload.new,
            oldRecord: payload.old,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}

// ==========================================
// 9. BULUT VERİ EŞİTLEME (SEED MOCK TO SUPABASE)
// ==========================================
export async function seedAllDataToSupabase(data: {
  customers: Customer[];
  properties: Property[];
  deals: Deal[];
  rentals: RentalContract[];
  mandates: MandateContract[];
  followUps?: FollowUp[];
  users?: User[];
}): Promise<{ success: boolean; message: string }> {
  try {
    let insertedCounts = 0;
    const errors: string[] = [];

    if (data.users && data.users.length > 0) {
      const { error: userErr } = await supabase.from("users").upsert(data.users);
      if (userErr) errors.push(`users: ${userErr.message}`);
      else insertedCounts += data.users.length;
    }

    if (data.customers.length > 0) {
      const { error: custErr } = await supabase.from("customers").upsert(data.customers);
      if (custErr) errors.push(`customers: ${custErr.message}`);
      else insertedCounts += data.customers.length;
    }

    if (data.properties.length > 0) {
      const { error: propErr } = await supabase.from("properties").upsert(data.properties);
      if (propErr) errors.push(`properties: ${propErr.message}`);
      else insertedCounts += data.properties.length;
    }

    if (data.deals.length > 0) {
      const { error: dealErr } = await supabase.from("deals").upsert(data.deals);
      if (dealErr) errors.push(`deals: ${dealErr.message}`);
      else insertedCounts += data.deals.length;
    }

    if (data.rentals.length > 0) {
      const { error: rentErr } = await supabase.from("rentals").upsert(data.rentals);
      if (rentErr) errors.push(`rentals: ${rentErr.message}`);
      else insertedCounts += data.rentals.length;
    }

    if (data.mandates.length > 0) {
      const { error: mandErr } = await supabase.from("mandates").upsert(data.mandates);
      if (mandErr) errors.push(`mandates: ${mandErr.message}`);
      else insertedCounts += data.mandates.length;
    }

    if (data.followUps && data.followUps.length > 0) {
      const { error: followErr } = await supabase.from("follow_ups").upsert(data.followUps);
      if (followErr) errors.push(`follow_ups: ${followErr.message}`);
      else insertedCounts += data.followUps.length;
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: `Kayıt uyarısı: Bazı tablolar aktarılamadı (${errors[0]}). Lütfen SQL Editor'de şemanın güncel olduğundan emin olun.`,
      };
    }

    return {
      success: true,
      message: `Tüm CRM verileri başarıyla Supabase bulut veritabanına aktarıldı (${insertedCounts} kayıt işlendi).`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Aktarım hatası: ${err?.message || "Bilinmeyen hata"}`,
    };
  }
}
