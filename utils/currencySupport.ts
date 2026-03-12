import { FundDataset, DataPoint } from '../types';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'HKD' | 'CNY' | 'JPY';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  nameCn: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', nameCn: '美元' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', nameCn: '歐元' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', nameCn: '英鎊' },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', nameCn: '港幣' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', nameCn: '人民幣' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', nameCn: '日圓' },
};

/** Static fallback FX rates (vs USD). Updated periodically or when live fetch fails. */
const STATIC_FX_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  HKD: 7.82,
  CNY: 7.24,
  JPY: 149.5,
};

let cachedRates: Record<CurrencyCode, number> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 3600_000; // 1 hour

/**
 * Fetch live FX rates from a free API. Falls back to static rates on failure.
 * Rates are expressed as: 1 USD = X target currency.
 */
export async function getFxRates(): Promise<Record<CurrencyCode, number>> {
  if (cachedRates && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedRates;
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.result !== 'success') throw new Error('API error');

    const rates: Record<CurrencyCode, number> = { USD: 1 } as any;
    for (const code of Object.keys(CURRENCIES) as CurrencyCode[]) {
      rates[code] = json.rates?.[code] ?? STATIC_FX_RATES[code];
    }
    cachedRates = rates;
    cacheTimestamp = Date.now();
    return rates;
  } catch {
    // Fallback to static rates
    cachedRates = { ...STATIC_FX_RATES };
    cacheTimestamp = Date.now();
    return cachedRates;
  }
}

/** Synchronous getter — returns cached or static rates without network call */
export function getFxRatesSync(): Record<CurrencyCode, number> {
  return cachedRates ?? { ...STATIC_FX_RATES };
}

/**
 * Convert a value from one currency to another.
 * Rates are "1 USD = X currency", so:
 *   valueInUSD = value / rates[fromCurrency]
 *   valueInTarget = valueInUSD * rates[toCurrency]
 */
export function convertCurrency(
  value: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: Record<CurrencyCode, number>
): number {
  if (from === to) return value;
  const inUsd = value / rates[from];
  return inUsd * rates[to];
}

// ─── Currency Detection ───────────────────────────────────────────

const CURRENCY_PATTERNS: { pattern: RegExp; code: CurrencyCode }[] = [
  { pattern: /\bUSD\b/i, code: 'USD' },
  { pattern: /\bEUR\b/i, code: 'EUR' },
  { pattern: /\bGBP\b/i, code: 'GBP' },
  { pattern: /\bHKD\b/i, code: 'HKD' },
  { pattern: /\bCNY\b|\bRMB\b|\bCNH\b/i, code: 'CNY' },
  { pattern: /\bJPY\b/i, code: 'JPY' },
  // Symbol-based
  { pattern: /\bHK\$/i, code: 'HKD' },
  { pattern: /(?<![A-Z])€/i, code: 'EUR' },
  { pattern: /(?<![A-Z])£/i, code: 'GBP' },
  // ¥ is ambiguous — could be JPY or CNY, heuristic needed
];

/**
 * Attempt to detect currency from a fund column header name.
 * Returns null if no match found.
 */
export function detectCurrencyFromHeader(headerName: string): CurrencyCode | null {
  for (const { pattern, code } of CURRENCY_PATTERNS) {
    if (pattern.test(headerName)) return code;
  }

  // Check for ¥ — disambiguate via context clues
  if (/¥/.test(headerName)) {
    // If header contains Chinese characters, likely CNY
    if (/[\u4e00-\u9fff]/.test(headerName)) return 'CNY';
    return 'JPY'; // default ¥ to JPY
  }

  return null;
}

/**
 * Heuristic: guess currency from typical NAV magnitude.
 * Very rough — should always be overridable by user.
 */
export function guessCurrencyFromMagnitude(prices: number[]): CurrencyCode | null {
  if (prices.length === 0) return null;
  const median = [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)];

  if (median > 1000) return 'JPY';    // JPY NAVs often 10,000+
  if (median > 5 && median < 10) return 'CNY'; // CNY or HKD range
  // Can't reliably distinguish USD/EUR/GBP by magnitude alone
  return null;
}

/**
 * Auto-detect currencies for all funds in a dataset.
 * Returns a map of fund name → detected currency (or 'USD' as default).
 */
export function detectFundCurrencies(dataset: FundDataset): Record<string, CurrencyCode> {
  const result: Record<string, CurrencyCode> = {};

  for (const fund of dataset.funds) {
    // Layer 1: header parsing
    const fromHeader = detectCurrencyFromHeader(fund);
    if (fromHeader) {
      result[fund] = fromHeader;
      continue;
    }

    // Layer 2: magnitude heuristic
    const prices = dataset.data
      .map(d => d[fund])
      .filter((v): v is number => typeof v === 'number');
    const fromMagnitude = guessCurrencyFromMagnitude(prices);
    if (fromMagnitude) {
      result[fund] = fromMagnitude;
      continue;
    }

    // Layer 3: default
    result[fund] = 'USD';
  }

  return result;
}

/**
 * Convert an entire dataset to a target currency.
 * Returns a new dataset with converted values (does not mutate original).
 */
export function convertDataset(
  dataset: FundDataset,
  fundCurrencies: Record<string, CurrencyCode>,
  targetCurrency: CurrencyCode,
  rates: Record<CurrencyCode, number>
): FundDataset {
  // Check if any conversion is actually needed
  const needsConversion = dataset.funds.some(f => (fundCurrencies[f] ?? 'USD') !== targetCurrency);
  if (!needsConversion) return dataset;

  const convertedData: DataPoint[] = dataset.data.map(row => {
    const newRow: DataPoint = { date: row.date };
    for (const fund of dataset.funds) {
      const val = row[fund];
      if (typeof val === 'number') {
        const from = fundCurrencies[fund] ?? 'USD';
        newRow[fund] = convertCurrency(val, from, targetCurrency, rates);
      } else {
        newRow[fund] = val;
      }
    }
    return newRow;
  });

  return { ...dataset, data: convertedData };
}
