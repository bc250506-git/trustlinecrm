import { Customer, Property } from "./types";

export interface MatchResult {
  score: number; // 0 - 100
  matchedCriteria: string[];
  missingCriteria: string[];
  isStrictMatch: boolean;
}

export function matchCustomerAndProperty(
  customer: Customer,
  property: Property
): MatchResult {
  const matchedCriteria: string[] = [];
  const missingCriteria: string[] = [];
  let score = 0;

  // 1. Niyet Uyumu (Alıcı -> Satılık, Kiracı -> Kiralık, Satıcı -> Mülk portföyü)
  const isIntentMatch =
    (customer.category === "BUYER" && property.listingType === "sale") ||
    (customer.category === "TENANT" && property.listingType === "rent") ||
    (customer.category === "SELLER" && property.listingType === "sale");

  if (isIntentMatch) {
    score += 30;
    matchedCriteria.push(
      customer.category === "BUYER"
        ? "Satılık Alıcı Uyumu"
        : customer.category === "TENANT"
        ? "Kiralık Kiracı Uyumu"
        : "Portföy Satıcı Uyumu"
    );
  } else {
    missingCriteria.push("Niyet Uyumsuzluğu (Alıcı/Kiracı vs Portföy Türü)");
  }

  // 2. Para Birimi Uyumu (Katı kural: TRY-TRY, GBP-GBP, USD-USD, EUR-EUR)
  const isCurrencyMatch = customer.budgetCurrency === property.currency;
  if (isCurrencyMatch) {
    score += 25;
    matchedCriteria.push(`Aynı Para Birimi (${property.currency})`);
  } else {
    missingCriteria.push(
      `Farklı Para Birimi (Müşteri: ${customer.budgetCurrency}, Mülk: ${property.currency})`
    );
  }

  // 3. Bütçe Uyumu (Müşteri Bütçesi >= Portföy Fiyatı)
  if (isCurrencyMatch) {
    if (customer.budget >= property.price) {
      score += 25;
      const margin = customer.budget - property.price;
      matchedCriteria.push(
        margin === 0
          ? "Tam Bütçe Uyumu"
          : `Bütçe Fazlası (+${margin.toLocaleString("tr-TR")} ${property.currency})`
      );
    } else {
      const diff = property.price - customer.budget;
      const tolerance = property.price * 0.1; // %10 tolerans için kısmi puan
      if (diff <= tolerance) {
        score += 10;
        missingCriteria.push(
          `Bütçe %10 Yakın (-${diff.toLocaleString("tr-TR")} ${property.currency})`
        );
      } else {
        missingCriteria.push(
          `Bütçe Yetersiz (-${diff.toLocaleString("tr-TR")} ${property.currency})`
        );
      }
    }
  }

  // 4. Bölge Uyumu
  const custRegion = (customer.region || "").toLowerCase().trim();
  const propRegion = (property.region || "").toLowerCase().trim();
  const isRegionMatch =
    !custRegion ||
    !propRegion ||
    custRegion.includes(propRegion) ||
    propRegion.includes(custRegion);

  if (isRegionMatch) {
    score += 10;
    matchedCriteria.push(`Bölge Uyumu (${property.region})`);
  } else {
    missingCriteria.push(
      `Farklı Bölge (Müşteri: ${customer.region}, Mülk: ${property.region})`
    );
  }

  // 5. Gayrimenkul Tipi Uyumu
  const custType = (customer.propertyType || "").toLowerCase().trim();
  const propType = (property.propertyType || "").toLowerCase().trim();
  const isTypeMatch =
    !custType ||
    !propType ||
    custType.includes(propType) ||
    propType.includes(custType);

  if (isTypeMatch) {
    score += 10;
    matchedCriteria.push(`Gayrimenkul Tipi Uyumu (${property.propertyType})`);
  } else {
    missingCriteria.push(
      `Farklı Tip (Müşteri: ${customer.propertyType}, Mülk: ${property.propertyType})`
    );
  }

  const isStrictMatch =
    isIntentMatch &&
    isCurrencyMatch &&
    customer.budget >= property.price &&
    isRegionMatch &&
    isTypeMatch;

  return {
    score: Math.min(100, score),
    matchedCriteria,
    missingCriteria,
    isStrictMatch,
  };
}

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
    .filter((item) => item.result.score >= 55)
    .sort((a, b) => b.result.score - a.result.score);
}

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
    .filter((item) => item.result.score >= 55)
    .sort((a, b) => b.result.score - a.result.score);
}
