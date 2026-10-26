import { Customer, Property, RentalContract } from "./types";
import { convertCurrency, formatCurrencyAmount, getCurrentExchangeRates } from "./currency";

export interface MatchResult {
  score: number; // 0 - 100
  isEligible: boolean; // Niyet uyumu yoksa kesinlikle false
  matchedCriteria: string[];
  missingCriteria: string[];
  isStrictMatch: boolean;
  convertedBudgetDisplay?: string;
  fxNote?: string;
}

/**
 * Bir müşterinin halihazırda aktif bir kira sözleşmesi olup olmadığını kontrol eder.
 * Aktif kiracılar ev bulmuş durumdadır, portföy arayışında DEĞİLDİR.
 */
export function isCustomerActiveTenant(
  customer: { id: string; phone?: string; fullName?: string },
  rentals?: RentalContract[]
): boolean {
  if (!rentals || rentals.length === 0) return false;
  const cleanPhone = (customer.phone || "").replace(/\D/g, "");
  const cleanName = (customer.fullName || "").trim().toLowerCase();

  return rentals.some((r) => {
    if (!r.active) return false;
    if (r.tenantCustomerId && r.tenantCustomerId === customer.id) return true;
    if (cleanPhone && r.tenantPhone && r.tenantPhone.replace(/\D/g, "") === cleanPhone) return true;
    if (cleanName && r.tenantName && r.tenantName.trim().toLowerCase() === cleanName) return true;
    return false;
  });
}

/**
 * Müşteri ve Portföy Eşleştirme Fonksiyonu
 */
export function matchCustomerAndProperty(
  customer: Customer,
  property: Property,
  rentals?: RentalContract[]
): MatchResult {
  const matchedCriteria: string[] = [];
  const missingCriteria: string[] = [];
  let score = 0;

  // 0. AKTİF PORTFÖY KONTROLÜ (SERT ELEME - HARD FILTER)
  // Pasife düşen (SOLD, RENTED, ARCHIVED) veya silinmiş portföyler eşleşme motoruna asla sunulmaz!
  if (property.status !== "AVAILABLE" || property.deletedAt) {
    return {
      score: 0,
      isEligible: false,
      matchedCriteria: [],
      missingCriteria: [
        property.status === "SOLD"
          ? "Portföy Satıldı (Pasif)"
          : property.status === "RENTED"
          ? "Portföy Kiralandı (Pasif)"
          : property.status === "ARCHIVED"
          ? "Portföy Arşivde (Pasif)"
          : "Portföy Aktif Değil",
      ],
      isStrictMatch: false,
    };
  }

  // 1. MÜLK SAHİBİ KENDİ PORTFÖYÜYLE ASLA EŞLEŞEMEZ (SERT ELEME - HARD FILTER)
  const isOwner =
    (property.ownerCustomerId && property.ownerCustomerId === customer.id) ||
    (property.ownerPhone && customer.phone && property.ownerPhone.replace(/\D/g, "") === customer.phone.replace(/\D/g, "")) ||
    (property.ownerName && customer.fullName && property.ownerName.trim().toLowerCase() === customer.fullName.trim().toLowerCase());

  if (isOwner) {
    return {
      score: 0,
      isEligible: false,
      matchedCriteria: [],
      missingCriteria: ["Mülk sahibi kendi mülkü ile eşleştirilemez."],
      isStrictMatch: false,
    };
  }

  // 2. SATICILARA PORTFÖY ÖNERİLMEZ, PORTFÖYE DE SATICI ÖNERİLMEZ (SERT ELEME)
  if (customer.category === "SELLER") {
    return {
      score: 0,
      isEligible: false,
      matchedCriteria: [],
      missingCriteria: ["Satıcı müşteri portföy arayışında değildir."],
      isStrictMatch: false,
    };
  }

  // 3. AKTİF KİRACILAR EV BULMUŞTUR, YENİDEN KİRALIK ARAMAZLAR (SERT ELEME)
  if (customer.category === "TENANT" && isCustomerActiveTenant(customer, rentals)) {
    return {
      score: 0,
      isEligible: false,
      matchedCriteria: [],
      missingCriteria: ["Mevcut aktif kira sözleşmesi bulunmaktadır (Ev bulmuş, arayışta değil)."],
      isStrictMatch: false,
    };
  }

  // 4. İŞLEM VE NİYET UYUMU (SERT ELEME - HARD FILTER)
  // Alıcıya YALNIZCA Satılık portföy, Kiracı Adayına YALNIZCA Kiralık portföy önerilir!
  const isIntentMatch =
    (customer.category === "BUYER" && property.listingType === "sale") ||
    (customer.category === "TENANT" && property.listingType === "rent");

  if (!isIntentMatch) {
    return {
      score: 0,
      isEligible: false,
      matchedCriteria: [],
      missingCriteria: [
        customer.category === "BUYER"
          ? "Niyet Uyumsuz: Alıcı müşteri Satılık portföy arıyor, bu mülk Kiralıktır."
          : customer.category === "TENANT"
          ? "Niyet Uyumsuz: Kiracı adayı Kiralık portföy arıyor, bu mülk Satılıktır."
          : "Niyet Uyumsuzluğu",
      ],
      isStrictMatch: false,
    };
  }

  // Niyet açıklaması
  matchedCriteria.push(
    customer.category === "BUYER"
      ? "Satılık Alıcı Uyumu"
      : "Kiralık Kiracı Adayı Uyumu"
  );

  // 2. BÜTÇE & FİYAT UYUMU (40 PUAN) - DÖVİZ KURU OTOMATİK ÇEVRİLİR
  const rates = getCurrentExchangeRates().rates;
  const convertedBudget = convertCurrency(
    customer.budget || 0,
    customer.budgetCurrency,
    property.currency,
    rates
  );

  let fxNote: string | undefined = undefined;
  if (customer.budgetCurrency !== property.currency) {
    fxNote = `${formatCurrencyAmount(customer.budget, customer.budgetCurrency)} ≈ ${formatCurrencyAmount(
      convertedBudget,
      property.currency
    )}`;
  }

  if (convertedBudget >= property.price) {
    // Tam bütçe karşılığı
    score += 40;
    const margin = convertedBudget - property.price;
    matchedCriteria.push(
      margin === 0
        ? `Bütçe Uyumu (${formatCurrencyAmount(property.price, property.currency)})`
        : `Bütçe Fazlası (+${formatCurrencyAmount(margin, property.currency)})`
    );
  } else {
    // Bütçe eksikliği - Pazarlık Toleransı
    const diff = property.price - convertedBudget;
    const tolerance10 = property.price * 0.1;
    const tolerance20 = property.price * 0.2;

    if (diff <= tolerance10) {
      score += 25;
      matchedCriteria.push(
        `%10 Pazarlık Payı İçinde (-${formatCurrencyAmount(diff, property.currency)})`
      );
    } else if (diff <= tolerance20) {
      score += 12;
      missingCriteria.push(
        `Bütçe %10-%20 Yakın (-${formatCurrencyAmount(diff, property.currency)})`
      );
    } else {
      missingCriteria.push(
        `Bütçe Yetersiz (-${formatCurrencyAmount(diff, property.currency)})`
      );
    }
  }

  // 3. BÖLGE / LOKASYON UYUMU (25 PUAN) - ÇOKLU BÖLGE DESTEĞİ
  const propRegionClean = (property.region || "").toLowerCase().trim();
  const customerRegionList: string[] = [];

  if (customer.regions && customer.regions.length > 0) {
    customerRegionList.push(...customer.regions);
  } else if (customer.region) {
    customerRegionList.push(customer.region);
  }

  let isRegionMatch = false;
  let matchedRegionName = "";

  if (customerRegionList.length === 0 || customerRegionList.some((r) => r.toLowerCase().includes("tümü") || r.toLowerCase().includes("kktc"))) {
    isRegionMatch = true;
    matchedRegionName = "Tüm Bölgeler (Serbest)";
  } else {
    for (const r of customerRegionList) {
      const cleanR = r.toLowerCase().trim();
      const parts = cleanR.split("/").map((p) => p.trim());
      const matchesMainOrSub = parts.some((p) => p && propRegionClean.includes(p));
      const reverseMatch = propRegionClean.split("/").map((p) => p.trim()).some((p) => p && cleanR.includes(p));

      if (matchesMainOrSub || reverseMatch) {
        isRegionMatch = true;
        matchedRegionName = r;
        break;
      }
    }
  }

  if (isRegionMatch) {
    score += 25;
    matchedCriteria.push(`Bölge Uyumu: ${matchedRegionName || property.region}`);
  } else {
    const requestedStr = customerRegionList.slice(0, 2).join(", ") + (customerRegionList.length > 2 ? ` (+${customerRegionList.length - 2})` : "");
    missingCriteria.push(`Farklı Bölge (Talep: ${requestedStr || "Belirtilmedi"}, Mülk: ${property.region})`);
  }

  // 4. GAYRİMENKUL TİPİ UYUMU (20 PUAN) - ÇOKLU TİP DESTEĞİ
  const propTypeClean = (property.propertyType || "").toLowerCase().trim();
  const customerTypeList: string[] = [];

  if (customer.propertyTypes && customer.propertyTypes.length > 0) {
    customerTypeList.push(...customer.propertyTypes);
  } else if (customer.propertyType) {
    customerTypeList.push(customer.propertyType);
  }

  let isTypeMatch = false;
  let matchedTypeName = "";

  if (customerTypeList.length === 0 || customerTypeList.some((t) => t.toLowerCase().includes("tümü") || t.toLowerCase().includes("farketmez"))) {
    isTypeMatch = true;
    matchedTypeName = "Tümü";
  } else {
    for (const t of customerTypeList) {
      const cleanT = t.toLowerCase().trim();
      if (propTypeClean.includes(cleanT) || cleanT.includes(propTypeClean)) {
        isTypeMatch = true;
        matchedTypeName = t;
        break;
      }
    }
  }

  if (isTypeMatch) {
    score += 20;
    matchedCriteria.push(`Tip Uyumu: ${matchedTypeName || property.propertyType}`);
  } else {
    const requestedTypesStr = customerTypeList.slice(0, 2).join(", ") + (customerTypeList.length > 2 ? ` (+${customerTypeList.length - 2})` : "");
    missingCriteria.push(`Farklı Tip (Talep: ${requestedTypesStr || "Belirtilmedi"}, Mülk: ${property.propertyType})`);
  }

  // 5. ODA SAYISI UYUMU (15 PUAN) - ÇOKLU ODA DESTEĞİ
  const propRoomsClean = (property.rooms || "").toLowerCase().replace(/\s+/g, "");
  const customerRoomsList: string[] = [];

  if (customer.roomsList && customer.roomsList.length > 0) {
    customerRoomsList.push(...customer.roomsList);
  } else if (customer.rooms) {
    customerRoomsList.push(customer.rooms);
  }

  let isRoomsMatch = false;
  let matchedRoomsName = "";

  if (
    customerRoomsList.length === 0 ||
    customerRoomsList.some((r) => r.toLowerCase().includes("tümü") || r.toLowerCase().includes("farketmez")) ||
    !propRoomsClean
  ) {
    isRoomsMatch = true;
    matchedRoomsName = "Farketmez / Esnek";
  } else {
    for (const r of customerRoomsList) {
      const cleanR = r.toLowerCase().replace(/\s+/g, "");
      if (propRoomsClean.includes(cleanR) || cleanR.includes(propRoomsClean)) {
        isRoomsMatch = true;
        matchedRoomsName = r;
        break;
      }
    }
  }

  if (isRoomsMatch) {
    score += 15;
    matchedCriteria.push(`Oda Sayısı Uyumu: ${matchedRoomsName || property.rooms}`);
  } else {
    const requestedRoomsStr = customerRoomsList.slice(0, 3).join(", ") + (customerRoomsList.length > 3 ? ` (+${customerRoomsList.length - 3})` : "");
    missingCriteria.push(`Farklı Oda Sayısı (Talep: ${requestedRoomsStr}, Mülk: ${property.rooms})`);
  }

  // 6. SICAKLIK VE VIP ÖNCELİK PUANI (BONUS)
  if (customer.temperature === "hot") {
    matchedCriteria.push("🔥 Sıcak Alıcı Önceliği");
  }
  if (customer.isVip) {
    matchedCriteria.push("⭐ VIP Müşteri Önceliği");
  }

  // Kusursuz Eşleşme Şartı
  const isStrictMatch =
    isIntentMatch &&
    convertedBudget >= property.price &&
    isRegionMatch &&
    isTypeMatch &&
    isRoomsMatch;

  return {
    score: Math.min(100, Math.round(score)),
    isEligible: true,
    matchedCriteria,
    missingCriteria,
    isStrictMatch,
    convertedBudgetDisplay: fxNote,
  };
}

/**
 * Müşteri için En Uygun Portföyleri Bulur ve Sıralar
 * Yalnızca ALICI ve KİRACI ADAYLARI portföy eşleşmesi alabilir.
 * SATICILAR ve AKTİF KİRACILAR (sözleşmesi olanlar) kesinlikle boş liste alır.
 */
export function findMatchesForCustomer(
  customer: Customer,
  properties: Property[],
  rentals?: RentalContract[]
): { property: Property; result: MatchResult }[] {
  // 1. SATICILAR KESİNLİKLE PORTFÖY ARAYIŞINDA DEĞİLDİR
  if (customer.category === "SELLER") return [];

  // 2. AKTİF KİRACILAR EV TUTMUŞTUR, YENİDEN KİRALIK ARAMAZLAR
  if (customer.category === "TENANT" && isCustomerActiveTenant(customer, rentals)) {
    return [];
  }

  return properties
    .filter((p) => {
      if (p.status !== "AVAILABLE" || p.deletedAt) return false;
      // Alıcıya SADECE Satılık
      if (customer.category === "BUYER" && p.listingType !== "sale") return false;
      // Kiracı Adayına SADECE Kiralık
      if (customer.category === "TENANT" && p.listingType !== "rent") return false;
      return true;
    })
    .map((property) => ({
      property,
      result: matchCustomerAndProperty(customer, property, rentals),
    }))
    .filter((item) => item.result.isEligible && item.result.score >= 50)
    .sort((a, b) => {
      // 1. Eşleşme puanı
      if (b.result.score !== a.result.score) {
        return b.result.score - a.result.score;
      }
      // 2. Strict match önceliği
      if (b.result.isStrictMatch !== a.result.isStrictMatch) {
        return (b.result.isStrictMatch ? 1 : 0) - (a.result.isStrictMatch ? 1 : 0);
      }
      // 3. Fiyat yakınlığı
      return a.property.price - b.property.price;
    });
}

/**
 * Portföy için En Uygun Müşterileri Bulur ve Sıralar (Sıcaklık & VIP Ağırlıklı)
 * SATILIK portföye SADECE ALICI müşteriler önerilir.
 * KİRALIK portföye SADECE KİRACI ADAYLARI (aktif sözleşmesi olmayan) önerilir.
 * SATICILAR, AKTİF KİRACILAR ve MÜLKÜN KENDİ SAHİBİ ASLA ÖNERİLMEZ.
 */
export function findMatchesForProperty(
  property: Property,
  customers: Customer[],
  rentals?: RentalContract[]
): { customer: Customer; result: MatchResult }[] {
  return customers
    .filter((c) => {
      if (c.deletedAt) return false;

      const isBuyerCandidate =
        c.category === "BUYER" ||
        c.category === "SELLER_AND_BUYER" ||
        c.category === "TENANT_AND_BUYER" ||
        Boolean(c.isAlsoBuyer);

      const isTenantCandidate =
        (c.category === "TENANT" || c.category === "TENANT_AND_BUYER") &&
        !isCustomerActiveTenant(c, rentals);

      // Sadece satıcı olanlar (aynı zamanda alıcı olmayanlar) hiçbir portföye alıcı/kiracı önerilemez
      if (c.category === "SELLER" && !c.isAlsoBuyer) return false;

      // Mülk sahibi kendi portföyüne müşteri olarak önerilemez
      const isOwner =
        (property.ownerCustomerId && property.ownerCustomerId === c.id) ||
        (property.ownerPhone && c.phone && property.ownerPhone.replace(/\D/g, "") === c.phone.replace(/\D/g, "")) ||
        (property.ownerName && c.fullName && property.ownerName.trim().toLowerCase() === c.fullName.trim().toLowerCase());
      if (isOwner) return false;

      // Satılık portföye ALICI (BUYER, SELLER_AND_BUYER, TENANT_AND_BUYER veya isAlsoBuyer)
      if (property.listingType === "sale") {
        return isBuyerCandidate;
      }

      // Kiralık portföye YALNIZCA KİRACI ADAYI (Aktif sözleşmesi bulunmayan TENANT)
      if (property.listingType === "rent") {
        return isTenantCandidate;
      }

      return false;
    })
    .map((customer) => ({
      customer,
      result: matchCustomerAndProperty(customer, property, rentals),
    }))
    .filter((item) => item.result.isEligible && item.result.score >= 50)
    .sort((a, b) => {
      // 1. Eşleşme puanı
      if (b.result.score !== a.result.score) {
        return b.result.score - a.result.score;
      }
      // 2. VIP Önceliği
      if (b.customer.isVip !== a.customer.isVip) {
        return (b.customer.isVip ? 1 : 0) - (a.customer.isVip ? 1 : 0);
      }
      // 3. Müşteri Sıcaklığı (Hot > Warm > Cold)
      const tempWeights: Record<string, number> = { hot: 3, warm: 2, cold: 1 };
      const weightA = tempWeights[a.customer.temperature] || 1;
      const weightB = tempWeights[b.customer.temperature] || 1;
      if (weightB !== weightA) {
        return weightB - weightA;
      }
      return 0;
    });
}
