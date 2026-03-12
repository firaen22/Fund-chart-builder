import { DataPoint } from '../types';
import {
  inferFrequency,
  calculateVolatility,
  calculateSharpeRatio,
  calculateDrawdown,
  calculateSortinoRatio,
} from './financialMetrics';

export type RollingMetricType = 'volatility' | 'sharpe' | 'sortino' | 'drawdown' | 'return';

export interface RollingDataPoint {
  date: string;
  [fundKey: string]: string | number | null;
}

/**
 * Compute a single rolling metric over a sliding window of `windowSize` data points.
 * Returns an array of { date, [fund]: value } for each point where the window is full.
 */
export function computeRollingMetric(
  data: DataPoint[],
  funds: string[],
  metric: RollingMetricType,
  windowSize: number,
): RollingDataPoint[] {
  if (data.length < windowSize || windowSize < 2) return [];

  const dates = data.map(d => d.date);
  const frequency = inferFrequency(dates);

  const results: RollingDataPoint[] = [];

  for (let i = windowSize - 1; i < data.length; i++) {
    const point: RollingDataPoint = { date: data[i].date };

    for (const fund of funds) {
      const windowSlice: number[] = [];
      for (let j = i - windowSize + 1; j <= i; j++) {
        const val = data[j][fund];
        if (typeof val === 'number') {
          windowSlice.push(val);
        }
      }

      if (windowSlice.length < 2) {
        point[fund] = null;
        continue;
      }

      switch (metric) {
        case 'volatility':
          point[fund] = calculateVolatility(windowSlice, frequency);
          break;
        case 'sharpe':
          point[fund] = calculateSharpeRatio(windowSlice, 0, frequency);
          break;
        case 'sortino':
          point[fund] = calculateSortinoRatio(windowSlice, 0, frequency);
          break;
        case 'drawdown':
          point[fund] = calculateDrawdown(windowSlice); // negative number
          break;
        case 'return': {
          const start = windowSlice[0];
          const end = windowSlice[windowSlice.length - 1];
          point[fund] = start !== 0 ? (end - start) / start : 0;
          break;
        }
      }
    }

    results.push(point);
  }

  return results;
}

/**
 * Compute drawdown duration (in data points) for each fund.
 * Returns an array of { date, [fund]: duration } where duration is the number of
 * consecutive points the fund has been in drawdown from its running peak.
 */
export function computeDrawdownDuration(
  data: DataPoint[],
  funds: string[],
): RollingDataPoint[] {
  const results: RollingDataPoint[] = [];

  // Track running peak and duration per fund
  const peaks: Record<string, number> = {};
  const durations: Record<string, number> = {};

  for (const fund of funds) {
    peaks[fund] = -Infinity;
    durations[fund] = 0;
  }

  for (const row of data) {
    const point: RollingDataPoint = { date: row.date };

    for (const fund of funds) {
      const val = row[fund];
      if (typeof val !== 'number') {
        point[fund] = null;
        continue;
      }

      if (val >= peaks[fund]) {
        peaks[fund] = val;
        durations[fund] = 0;
      } else {
        durations[fund]++;
      }

      point[fund] = durations[fund];
    }

    results.push(point);
  }

  return results;
}

/** Window size presets as data-point counts (rough mapping) */
export const WINDOW_PRESETS = [
  { label: '30', labelCn: '30', value: 30, desc: '~30 data points', descCn: '~30 個資料點' },
  { label: '60', labelCn: '60', value: 60, desc: '~60 data points', descCn: '~60 個資料點' },
  { label: '90', labelCn: '90', value: 90, desc: '~90 data points', descCn: '~90 個資料點' },
  { label: '120', labelCn: '120', value: 120, desc: '~120 data points', descCn: '~120 個資料點' },
] as const;
