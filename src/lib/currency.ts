import { Currency } from "./types";

export interface ExchangeRates {
  TRY: number;
  USD: number;
  EUR: number;
  GBP: number;
}

// 1 Birim Döviz = Kaç TL (Varsayılan Piyasa / KKTC MB Referans Kurları)
export const DEFAULT_RATES: ExchangeRates = {
  TRY: 1,
  USD: 49.36,
  EUR: 55.10,
  GBP: 65.23,
};

let currentRates: ExchangeRates = { ...DEFAULT_RATES };
let lastFetchTime: number = 0;
let isLiveFromApi: boolean = false;

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 dakika

/**
 * KKTC / Uluslararası Canlı Döviz Kurlarını Çeker ve Önbelleğe Alır
 */
export async function updateLiveExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_TTL_MS && isLiveFromApi) {
    return currentRates;
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/TRY", {
      next: { revalidate: 600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        currentRates = {
          TRY: 1,
          USD: Number((1 / data.rates.USD).toFixed(4)),
          EUR: Number((1 / data.rates.EUR).toFixed(4)),
          GBP: Number((1 / data.rates.GBP).toFixed(4)),
        };
        lastFetchTime = now;
        isLiveFromApi = true;
        if (typeof window !== "undefined") {
          localStorage.setItem("trustline_fx_rates", JSON.stringify(currentRates));
          localStorage.setItem("trustline_fx_time", String(now));
        }
      }
    }
  } catch (err) {
    // Ağ hatası durumunda yerel önbellek veya varsayılan kurlar kullanılır
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("trustline_fx_rates");
      if (cached) {
        try {
          currentRates = JSON.parse(cached);
        } catch { }
      }
    }
  }

  return currentRates;
}

/**
 * Anlık döviz kurlarını ve durum bilgisini döndürür
 */
export function getCurrentExchangeRates(): {
  rates: ExchangeRates;
  lastUpdated: string;
  isLive: boolean;
} {
  // İstemcide başlangıçta kayıtlı önbellek varsa yükle
  if (typeof window !== "undefined" && !isLiveFromApi) {
    const cached = localStorage.getItem("trustline_fx_rates");
    const cachedTime = localStorage.getItem("trustline_fx_time");
    if (cached) {
      try {
        currentRates = JSON.parse(cached);
        if (cachedTime) lastFetchTime = Number(cachedTime);
      } catch { }
    }
  }

  return {
    rates: currentRates,
    lastUpdated: lastFetchTime > 0 ? "Canlı (Otomatik 10 dk)" : "KKTC MB Referans",
    isLive: isLiveFromApi,
  };
}

/**
 * İki para birimi arasında tutarı çevirir
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rates: ExchangeRates = currentRates
): number {
  if (from === to || !Number.isFinite(amount) || amount <= 0) return amount || 0;
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  if (toRate <= 0) return 0;
  const inTry = amount * fromRate;
  return inTry / toRate;
}

/**
 * Para formatlama
 */
export function formatCurrencyAmount(amount: number, currency: Currency): string {
  return `${Math.round(amount).toLocaleString("tr-TR")} ${currency}`;
}
