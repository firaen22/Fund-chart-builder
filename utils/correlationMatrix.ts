import { DataPoint } from '../types';

export interface CorrelationResult {
  funds: string[];
  matrix: number[][]; // funds.length x funds.length, values in [-1, 1]
}

/**
 * Compute periodic returns from price series, skipping null/missing values.
 */
function computeReturns(data: DataPoint[], fund: string): (number | null)[] {
  const returns: (number | null)[] = [null]; // first point has no prior
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1][fund];
    const curr = data[i][fund];
    if (typeof prev === 'number' && typeof curr === 'number' && prev !== 0) {
      returns.push((curr - prev) / prev);
    } else {
      returns.push(null);
    }
  }
  return returns;
}

/**
 * Pearson correlation between two return series, using only
 * indices where both values are non-null.
 */
function pearson(a: (number | null)[], b: (number | null)[]): number {
  const pairs: [number, number][] = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== null && b[i] !== null) {
      pairs.push([a[i] as number, b[i] as number]);
    }
  }
  if (pairs.length < 3) return 0;

  const n = pairs.length;
  const meanA = pairs.reduce((s, p) => s + p[0], 0) / n;
  const meanB = pairs.reduce((s, p) => s + p[1], 0) / n;

  let cov = 0;
  let varA = 0;
  let varB = 0;
  for (const [x, y] of pairs) {
    const da = x - meanA;
    const db = y - meanB;
    cov += da * db;
    varA += da * da;
    varB += db * db;
  }

  const denom = Math.sqrt(varA * varB);
  if (denom === 0) return 0;
  return cov / denom;
}

/**
 * Compute the full pairwise correlation matrix for all funds.
 */
export function computeCorrelationMatrix(
  data: DataPoint[],
  funds: string[],
): CorrelationResult {
  // Pre-compute return series
  const returnSeries: Record<string, (number | null)[]> = {};
  for (const fund of funds) {
    returnSeries[fund] = computeReturns(data, fund);
  }

  const n = funds.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1; // self-correlation
    for (let j = i + 1; j < n; j++) {
      const corr = pearson(returnSeries[funds[i]], returnSeries[funds[j]]);
      matrix[i][j] = corr;
      matrix[j][i] = corr;
    }
  }

  return { funds, matrix };
}

/**
 * Map a correlation value [-1, 1] to a color.
 * -1 = deep red, 0 = neutral gray, +1 = deep blue/indigo.
 */
export function correlationToColor(value: number, darkMode: boolean): string {
  const clamped = Math.max(-1, Math.min(1, value));

  if (clamped >= 0) {
    // Positive: neutral → indigo
    const t = clamped;
    if (darkMode) {
      const r = Math.round(30 + (67 - 30) * (1 - t));
      const g = Math.round(41 + (56 - 41) * (1 - t));
      const b = Math.round(59 + (202 - 59) * t);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const r = Math.round(241 - (241 - 99) * t);
      const g = Math.round(245 - (245 - 102) * t);
      const b = Math.round(249 - (249 - 241) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  } else {
    // Negative: neutral → red
    const t = Math.abs(clamped);
    if (darkMode) {
      const r = Math.round(30 + (220 - 30) * t);
      const g = Math.round(41 + (38 - 41) * t);
      const b = Math.round(59 + (38 - 59) * t);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const r = Math.round(241 + (254 - 241) * t);
      const g = Math.round(245 - (245 - 202) * t);
      const b = Math.round(249 - (249 - 202) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
}
