import React, { useMemo, useState, useCallback } from 'react';
import { FundDataset, Language } from '../types';
import {
  calculateAllMetrics,
  MetricResults,
  inferFrequency,
} from '../utils/financialMetrics';
import { BarChart3, ArrowUpDown, ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';

interface FundComparisonTableProps {
  dataset: FundDataset;
  lang: Language;
}

type MetricKey = keyof MetricResults;

interface ColumnDef {
  key: MetricKey;
  labelEn: string;
  labelCn: string;
  format: (v: number | undefined) => string;
  /** true = higher is better (green), false = lower is better */
  higherIsBetter: boolean;
}

const COLUMNS: ColumnDef[] = [
  { key: 'cumulativeReturn', labelEn: 'Return', labelCn: '總回報', format: v => v != null ? (v * 100).toFixed(2) + '%' : '—', higherIsBetter: true },
  { key: 'volatility', labelEn: 'Volatility', labelCn: '波動率', format: v => v != null ? (v * 100).toFixed(2) + '%' : '—', higherIsBetter: false },
  { key: 'maxDrawdown', labelEn: 'Max DD', labelCn: '最大回撤', format: v => v != null ? (v * 100).toFixed(2) + '%' : '—', higherIsBetter: false },
  { key: 'sharpeRatio', labelEn: 'Sharpe', labelCn: '夏普', format: v => v != null ? v.toFixed(3) : '—', higherIsBetter: true },
  { key: 'sortinoRatio', labelEn: 'Sortino', labelCn: '索提諾', format: v => v != null ? v.toFixed(3) : '—', higherIsBetter: true },
  { key: 'rsi', labelEn: 'RSI', labelCn: 'RSI', format: v => v != null ? v.toFixed(1) : '—', higherIsBetter: true },
];

/** Mini sparkline SVG rendered inline */
const Sparkline: React.FC<{ prices: number[]; color: string; width?: number; height?: number }> = ({
  prices,
  color,
  width = 100,
  height = 28,
}) => {
  if (prices.length < 2) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * width;
    const y = height - ((p - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const isPositive = prices[prices.length - 1] >= prices[0];

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Start/end dots */}
      {(() => {
        const firstY = height - ((prices[0] - min) / range) * (height - 4) - 2;
        const lastX = width;
        const lastY = height - ((prices[prices.length - 1] - min) / range) * (height - 4) - 2;
        return (
          <>
            <circle cx={0} cy={firstY} r={2} fill={color} opacity={0.5} />
            <circle cx={lastX} cy={lastY} r={2.5} fill={color} />
          </>
        );
      })()}
    </svg>
  );
};

// Fund colors matching FundChart
const FUND_COLORS = [
  '#4a57f2', '#0d9488', '#db2777', '#ea580c', '#7c3aed', '#2563eb',
];

export const FundComparisonTable: React.FC<FundComparisonTableProps> = ({ dataset, lang }) => {
  const [sortCol, setSortCol] = useState<MetricKey>('cumulativeReturn');
  const [sortAsc, setSortAsc] = useState(false); // default: descending (best first)

  const handleSort = useCallback((key: MetricKey) => {
    if (sortCol === key) {
      setSortAsc(prev => !prev);
    } else {
      setSortCol(key);
      const col = COLUMNS.find(c => c.key === key);
      // Default direction: show "best" first
      setSortAsc(col ? !col.higherIsBetter : false);
    }
  }, [sortCol]);

  // Compute all metrics per fund
  const fundMetrics = useMemo(() => {
    return dataset.funds.map(fund => ({
      fund,
      metrics: calculateAllMetrics(dataset.data, fund),
    }));
  }, [dataset]);

  // Sorted rows
  const sortedFunds = useMemo(() => {
    return [...fundMetrics].sort((a, b) => {
      const aVal = a.metrics?.[sortCol] ?? -Infinity;
      const bVal = b.metrics?.[sortCol] ?? -Infinity;
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [fundMetrics, sortCol, sortAsc]);

  // Sparkline data: downsample to ~50 points max for performance
  const sparklineData = useMemo(() => {
    const result: Record<string, number[]> = {};
    for (const fund of dataset.funds) {
      const prices = dataset.data
        .map(d => d[fund])
        .filter((v): v is number => typeof v === 'number');

      if (prices.length <= 50) {
        result[fund] = prices;
      } else {
        // Downsample evenly
        const step = prices.length / 50;
        const sampled: number[] = [];
        for (let i = 0; i < 50; i++) {
          sampled.push(prices[Math.round(i * step)]);
        }
        sampled.push(prices[prices.length - 1]); // always include last
        result[fund] = sampled;
      }
    }
    return result;
  }, [dataset]);

  // Find best/worst for each metric for conditional formatting
  const metricRanks = useMemo(() => {
    const ranks: Record<MetricKey, { best: number; worst: number }> = {} as any;
    for (const col of COLUMNS) {
      const vals = fundMetrics
        .map(f => f.metrics?.[col.key])
        .filter((v): v is number => v != null);
      if (vals.length === 0) {
        ranks[col.key] = { best: 0, worst: 0 };
        continue;
      }
      if (col.higherIsBetter) {
        ranks[col.key] = { best: Math.max(...vals), worst: Math.min(...vals) };
      } else {
        // For "lower is better" like volatility: best = lowest, worst = highest
        // But for maxDrawdown (negative): best = closest to 0, worst = most negative
        if (col.key === 'maxDrawdown') {
          ranks[col.key] = { best: Math.max(...vals), worst: Math.min(...vals) };
        } else {
          ranks[col.key] = { best: Math.min(...vals), worst: Math.max(...vals) };
        }
      }
    }
    return ranks;
  }, [fundMetrics]);

  const getCellColor = (col: ColumnDef, value: number | undefined): string => {
    if (value == null) return '';
    const rank = metricRanks[col.key];
    if (rank.best === rank.worst) return '';
    const ratio = Math.abs((value - rank.worst) / (rank.best - rank.worst));
    if (ratio > 0.75) return 'text-emerald-600 dark:text-emerald-400 font-black';
    if (ratio < 0.25) return 'text-red-500 dark:text-red-400 font-black';
    return '';
  };

  const t = lang === 'cn'
    ? { title: '基金比較排名表', fund: '基金', trend: '走勢', rank: '排名' }
    : { title: 'Fund Comparison Rankings', fund: 'Fund', trend: 'Trend', rank: '#' };

  return (
    <div className="glass-panel p-5 rounded-2xl border-black/5 dark:border-white/5 shadow-lg">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-1.5 bg-indigo-500/10 rounded-lg">
          <BarChart3 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {t.title}
        </span>
      </div>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-black/5 dark:border-white/5">
              <th className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-3 pr-4 w-8">
                {t.rank}
              </th>
              <th className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-3 pr-4 min-w-[120px]">
                {t.fund}
              </th>
              <th className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-3 pr-4 min-w-[110px]">
                {t.trend}
              </th>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-3 pr-3 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors select-none whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    {lang === 'cn' ? col.labelCn : col.labelEn}
                    {sortCol === col.key ? (
                      sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedFunds.map((row, idx) => {
              const fundIdx = dataset.funds.indexOf(row.fund);
              const color = FUND_COLORS[fundIdx % FUND_COLORS.length];

              return (
                <tr
                  key={row.fund}
                  className="border-b border-black/[0.03] dark:border-white/[0.03] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Rank */}
                  <td className="py-3 pr-4">
                    <span className={`text-xs font-black tabular-nums ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700 dark:text-amber-600' : 'text-slate-400/60'}`}>
                      {idx + 1}
                    </span>
                  </td>

                  {/* Fund name with color dot */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                        {row.fund}
                      </span>
                    </div>
                  </td>

                  {/* Sparkline */}
                  <td className="py-3 pr-4">
                    <Sparkline prices={sparklineData[row.fund] ?? []} color={color} />
                  </td>

                  {/* Metric columns */}
                  {COLUMNS.map(col => {
                    const val = row.metrics?.[col.key];
                    const cellColor = getCellColor(col, val as number | undefined);
                    return (
                      <td key={col.key} className="py-3 pr-3">
                        <span className={`text-[11px] font-bold tabular-nums ${cellColor || 'text-slate-700 dark:text-slate-300'}`}>
                          {col.format(val as number | undefined)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
