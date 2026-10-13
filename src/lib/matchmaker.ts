import { Customer, Property } from "./types";
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
 * Müşteri ve Portföy Eşleştirme Algoritması (V2 - Gelişmiş Deterministik Motor)
 * - Niyet Uyumu: Sert eleme (Alıcıya kiralık, kiracıya satılık ASLA önerilmez)
 * - Canlı Döviz Çevirici: Para birimi cezası yok, bütçe anlık kurla dönüştürülerek karşılaştırılır
 * - Çoklu Seçim: Çoklu bölge, çoklu mülk tipi ve çoklu oda sayısı etiketlerini tam destekler
 * - Sıcaklık & VIP: Sıcak (Hot) ve VIP müşteriler önceliklendirilir
 */
export function matchCustomerAndProperty(
  customer: Customer,
  property: Property
): MatchResult {
  const matchedCriteria: string[] = [];
  const missingCriteria: string[] = [];
  let score = 0;

  // 1. İŞLEM VE NİYET UYUMU (SERT ELEME - HARD FILTER)
  // Satılık arayan birine kiralık, kiralık arayana satılık ASLA önerilmez!
  const isIntentMatch =
    (customer.category === "BUYER" && property.listingType === "sale") ||
    (customer.category === "TENANT" && property.listingType === "rent") ||
    (customer.category === "SELLER" && property.listingType === "sale");

  if (!isIntentMatch) {
    return {
      score: 0,
      isEligible: false,
      matchedCriteria: [],
      missingCriteria: [
        customer.category === "BUYER"
          ? "Niyet Uyumsuz: Müşteri Satılık arıyor, portföy Kiralık."
          : customer.category === "TENANT"
          ? "Niyet Uyumsuz: Müşteri Kiralık arıyor, portföy Satılık."
          : "Niyet Uyumsuzluğu",
      ],
      isStrictMatch: false,
    };
  }

  // Niyet açıklaması
  matchedCriteria.push(
    customer.category === "BUYER"
      ? "Satılık Alıcı Uyumu"
      : customer.category === "TENANT"
      ? "Kiralık Kiracı Uyumu"
      : "Portföy Satıcı Uyumu"
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
        ? `Tam Bütçe Uyumu (${formatCurrencyAmount(property.price, property.currency)})`
        : `Bütçe Fazlası (+${formatCurrencyAmount(margin, property.currency)})${
            fxNote ? ` [Kur Çevrimi: ${fxNote}]` : ""
          }`
    );
  } else {
    // Bütçe eksikliği - Pazarlık Toleransı
    const diff = property.price - convertedBudget;
    const tolerance10 = property.price * 0.1;
    const tolerance20 = property.price * 0.2;

    if (diff <= tolerance10) {
      // %10 Pazarlık Payı İçinde
      score += 25;
      matchedCriteria.push(
        `%10 Pazarlık Payı İçinde (-${formatCurrencyAmount(diff, property.currency)})${
          fxNote ? ` [${fxNote}]` : ""
        }`
      );
    } else if (diff <= tolerance20) {
      // %10-%20 Arası Yakın
      score += 12;
      missingCriteria.push(
        `Bütçe %10-%20 Yakın (-${formatCurrencyAmount(diff, property.currency)})${
          fxNote ? ` [${fxNote}]` : ""
        }`
      );
    } else {
      // Bütçe Yetersiz
      missingCriteria.push(
        `Bütçe Yetersiz (-${formatCurrencyAmount(diff, property.currency)})${
          fxNote ? ` [${fxNote}]` : ""
        }`
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
 */
export function findMatchesForCustomer(
  customer: Customer,
  properties: Property[]
): { property: Property; result: MatchResult }[] {
  return properties
    .filter((p) => p.status === "AVAILABLE" && !p.deletedAt)
    .map((property) => ({
      property,
      result: matchCustomerAndProperty(customer, property),
    }))
    .filter((item) => item.result.isEligible && item.result.score >= 50)
    .sort((a, b) => {
      // 1. Eşleşme puanı
      if (b.result.score !== a.result.score) {
        return b.result.score - a.result.score;
      }
      // 2. Strict match önceliği
      if (b.result.isStrictMatch !== a.result.isStrictMatch) {
        return b.result.isStrictMatch ? 1 : -1;
      }
      // 3. Fiyat yakınlığı
      return a.property.price - b.property.price;
    });
}

/**
 * Portföy için En Uygun Müşterileri Bulur ve Sıralar (Sıcaklık & VIP Ağırlıklı)
 */
export function findMatchesForProperty(
  property: Property,
  customers: Customer[]
): { customer: Customer; result: MatchResult }[] {
  return customers
    .filter((c) => !c.deletedAt)
    .map((customer) => ({
      customer,
      result: matchCustomerAndProperty(customer, property),
    }))
    .filter((item) => item.result.isEligible && item.result.score >= 50)
    .sort((a, b) => {
      // 1. Eşleşme puanı
      if (b.result.score !== a.result.score) {
        return b.result.score - a.result.score;
      }
      // 2. VIP Önceliği
      if (b.customer.isVip !== a.customer.isVip) {
        return b.customer.isVip ? 1 : -1;
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
