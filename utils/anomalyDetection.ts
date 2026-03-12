import { FundDataset, DataPoint } from '../types';

export type AnomalyType = 'spike' | 'drop' | 'flat' | 'gap';

export type AnomalySeverity = 'low' | 'medium' | 'high';

export interface Anomaly {
  date: string;
  fund: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  zScore: number;
  returnPct: number;      // period-over-period % change
  description: string;
  descriptionCn: string;
}

/**
 * Detect anomalies across all funds in a dataset using z-score analysis
 * on period-over-period returns.
 *
 * Detection methods:
 *  1. Spike / Drop — |z-score| of single-period return exceeds threshold
 *  2. Flat — near-zero returns for N consecutive periods
 *  3. Gap  — missing / null value after a valid value
 */
export function detectAnomalies(
  dataset: FundDataset,
  options?: {
    zThresholdHigh?: number;   // default 3.0
    zThresholdMed?: number;    // default 2.0
    flatPeriods?: number;      // consecutive near-zero periods to flag
    flatEpsilon?: number;      // what counts as "near-zero" return
  }
): Anomaly[] {
  const {
    zThresholdHigh = 3.0,
    zThresholdMed = 2.0,
    flatPeriods = 5,
    flatEpsilon = 0.0001,
  } = options ?? {};

  const anomalies: Anomaly[] = [];
  const { data, funds } = dataset;

  if (data.length < 3) return anomalies;

  for (const fund of funds) {
    // Compute returns
    const returns: (number | null)[] = [null]; // first period has no return
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1][fund];
      const curr = data[i][fund];
      if (prev == null || curr == null || prev === 0) {
        returns.push(null);
      } else {
        returns.push(((curr as number) - (prev as number)) / Math.abs(prev as number));
      }
    }

    // Filter valid returns for statistics
    const validReturns = returns.filter((r): r is number => r !== null);
    if (validReturns.length < 5) continue;

    const mean = validReturns.reduce((s, v) => s + v, 0) / validReturns.length;
    const variance = validReturns.reduce((s, v) => s + (v - mean) ** 2, 0) / validReturns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) continue; // completely flat — nothing to detect against

    // 1. Spike / Drop detection via z-score
    for (let i = 1; i < data.length; i++) {
      const r = returns[i];
      if (r === null) continue;

      const z = (r - mean) / stdDev;
      const absZ = Math.abs(z);

      if (absZ >= zThresholdMed) {
        const type: AnomalyType = r > 0 ? 'spike' : 'drop';
        const severity: AnomalySeverity = absZ >= zThresholdHigh ? 'high' : 'medium';
        const pct = r * 100;

        anomalies.push({
          date: data[i].date as string,
          fund,
          type,
          severity,
          zScore: Math.round(z * 100) / 100,
          returnPct: Math.round(pct * 100) / 100,
          description: `${fund}: ${type === 'spike' ? 'Unusual surge' : 'Sharp decline'} of ${pct.toFixed(2)}% (z=${z.toFixed(1)})`,
          descriptionCn: `${fund}: ${type === 'spike' ? '異常上漲' : '急劇下跌'} ${pct.toFixed(2)}% (z=${z.toFixed(1)})`,
        });
      }
    }

    // 2. Flat period detection
    let flatStreak = 0;
    for (let i = 1; i < data.length; i++) {
      const r = returns[i];
      if (r !== null && Math.abs(r) < flatEpsilon) {
        flatStreak++;
        if (flatStreak === flatPeriods) {
          const startIdx = i - flatPeriods + 1;
          anomalies.push({
            date: data[startIdx].date as string,
            fund,
            type: 'flat',
            severity: 'low',
            zScore: 0,
            returnPct: 0,
            description: `${fund}: Stale/flat NAV for ${flatPeriods}+ consecutive periods starting ${data[startIdx].date}`,
            descriptionCn: `${fund}: 淨值連續${flatPeriods}+期無變動，起始於 ${data[startIdx].date}`,
          });
        }
      } else {
        flatStreak = 0;
      }
    }

    // 3. Gap detection (null after valid)
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1][fund];
      const curr = data[i][fund];
      if (prev != null && curr == null) {
        anomalies.push({
          date: data[i].date as string,
          fund,
          type: 'gap',
          severity: 'medium',
          zScore: 0,
          returnPct: 0,
          description: `${fund}: Data gap — missing value after ${(prev as number).toFixed(2)} on ${data[i - 1].date}`,
          descriptionCn: `${fund}: 數據缺失 — ${data[i - 1].date} 的 ${(prev as number).toFixed(2)} 後無數據`,
        });
      }
    }
  }

  // Sort by date, then severity (high → low)
  const sevOrder: Record<AnomalySeverity, number> = { high: 0, medium: 1, low: 2 };
  anomalies.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    return sevOrder[a.severity] - sevOrder[b.severity];
  });

  return anomalies;
}

/** Group anomalies by date for chart overlay */
export function anomaliesByDate(anomalies: Anomaly[]): Map<string, Anomaly[]> {
  const map = new Map<string, Anomaly[]>();
  for (const a of anomalies) {
    const arr = map.get(a.date) ?? [];
    arr.push(a);
    map.set(a.date, arr);
  }
  return map;
}
