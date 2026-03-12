import React, { useMemo, useCallback } from 'react';
import { Language } from '../types';
import { Calendar, RotateCcw, ChevronRight } from 'lucide-react';

export interface DateRange {
  start: string | null; // YYYY-MM-DD or null = beginning
  end: string | null;   // YYYY-MM-DD or null = latest
}

interface DateRangeFilterProps {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
  /** All available dates in the dataset (sorted ascending) */
  availableDates: string[];
  lang: Language;
}

type PresetKey = 'YTD' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'ALL';

interface Preset {
  key: PresetKey;
  label: string;
  labelCn: string;
}

const PRESETS: Preset[] = [
  { key: 'YTD', label: 'YTD', labelCn: '今年' },
  { key: '1M', label: '1M', labelCn: '1月' },
  { key: '3M', label: '3M', labelCn: '3月' },
  { key: '6M', label: '6M', labelCn: '6月' },
  { key: '1Y', label: '1Y', labelCn: '1年' },
  { key: '3Y', label: '3Y', labelCn: '3年' },
  { key: '5Y', label: '5Y', labelCn: '5年' },
  { key: 'ALL', label: 'All', labelCn: '全部' },
];

function subtractMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

function getYearStart(dateStr: string): string {
  return dateStr.slice(0, 4) + '-01-01';
}

/** Find the closest date in the sorted array that is >= target */
function findClosestDateOnOrAfter(dates: string[], target: string): string {
  for (const d of dates) {
    if (d >= target) return d;
  }
  return dates[dates.length - 1];
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  dateRange,
  onChange,
  availableDates,
  lang,
}) => {
  const minDate = availableDates[0] ?? '';
  const maxDate = availableDates[availableDates.length - 1] ?? '';

  const effectiveStart = dateRange.start ?? minDate;
  const effectiveEnd = dateRange.end ?? maxDate;

  const filteredCount = useMemo(() => {
    return availableDates.filter(d => d >= effectiveStart && d <= effectiveEnd).length;
  }, [availableDates, effectiveStart, effectiveEnd]);

  const totalCount = availableDates.length;

  const activePreset = useMemo((): PresetKey | null => {
    if (!dateRange.start && !dateRange.end) return 'ALL';
    if (dateRange.end && dateRange.end !== maxDate) return null;

    const start = dateRange.start;
    if (!start) return 'ALL';

    const closestYTD = findClosestDateOnOrAfter(availableDates, getYearStart(maxDate));
    if (start === closestYTD) return 'YTD';

    for (const months of [1, 3, 6, 12, 36, 60]) {
      const target = subtractMonths(maxDate, months);
      const closest = findClosestDateOnOrAfter(availableDates, target);
      if (start === closest) {
        const key = months === 1 ? '1M' : months === 3 ? '3M' : months === 6 ? '6M' : months === 12 ? '1Y' : months === 36 ? '3Y' : '5Y';
        return key as PresetKey;
      }
    }
    return null;
  }, [dateRange, maxDate, availableDates]);

  const handlePreset = useCallback((preset: PresetKey) => {
    if (preset === 'ALL') {
      onChange({ start: null, end: null });
      return;
    }

    let targetStart: string;
    if (preset === 'YTD') {
      targetStart = getYearStart(maxDate);
    } else {
      const monthsMap: Record<string, number> = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12, '3Y': 36, '5Y': 60 };
      targetStart = subtractMonths(maxDate, monthsMap[preset]);
    }

    const closestStart = findClosestDateOnOrAfter(availableDates, targetStart);
    onChange({ start: closestStart, end: null });
  }, [maxDate, availableDates, onChange]);

  const handleStartChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      onChange({ ...dateRange, start: null });
    } else {
      const closest = findClosestDateOnOrAfter(availableDates, val);
      onChange({ ...dateRange, start: closest });
    }
  }, [dateRange, availableDates, onChange]);

  const handleEndChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      onChange({ ...dateRange, end: null });
    } else {
      // Find closest date on or before
      let closest = availableDates[availableDates.length - 1];
      for (let i = availableDates.length - 1; i >= 0; i--) {
        if (availableDates[i] <= val) { closest = availableDates[i]; break; }
      }
      onChange({ ...dateRange, end: closest });
    }
  }, [dateRange, availableDates, onChange]);

  const handleReset = useCallback(() => {
    onChange({ start: null, end: null });
  }, [onChange]);

  const isFiltered = dateRange.start !== null || dateRange.end !== null;

  const t = lang === 'cn'
    ? { title: '日期範圍篩選', from: '起始', to: '結束', showing: '顯示', of: '/', points: '個數據點', reset: '重置' }
    : { title: 'Date Range Filter', from: 'From', to: 'To', showing: 'Showing', of: 'of', points: 'data points', reset: 'Reset' };

  return (
    <div className="glass-panel p-5 rounded-2xl border-black/5 dark:border-white/5 shadow-lg">
      <div className="flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg">
              <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {t.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Data point counter */}
            <span className={`text-[10px] font-bold tabular-nums ${isFiltered ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-500'}`}>
              {t.showing} {filteredCount.toLocaleString()} {t.of} {totalCount.toLocaleString()} {t.points}
            </span>

            {isFiltered && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                title={t.reset}
              >
                <RotateCcw className="w-3 h-3" />
                {t.reset}
              </button>
            )}
          </div>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePreset(p.key)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all border ${
                activePreset === p.key
                  ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 border-transparent hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {lang === 'cn' ? p.labelCn : p.label}
            </button>
          ))}
        </div>

        {/* Date pickers row */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">
              {t.from}
            </label>
            <input
              type="date"
              value={effectiveStart}
              min={minDate}
              max={effectiveEnd}
              onChange={handleStartChange}
              className="w-full px-3 py-2 text-sm font-semibold tabular-nums rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
            />
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 mt-5 flex-shrink-0" />

          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">
              {t.to}
            </label>
            <input
              type="date"
              value={effectiveEnd}
              min={effectiveStart}
              max={maxDate}
              onChange={handleEndChange}
              className="w-full px-3 py-2 text-sm font-semibold tabular-nums rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
            />
          </div>
        </div>

        {/* Visual range indicator */}
        {availableDates.length > 0 && (
          <div className="relative h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
            {(() => {
              const startIdx = availableDates.indexOf(effectiveStart);
              const endIdx = availableDates.indexOf(effectiveEnd);
              const total = availableDates.length - 1;
              if (total <= 0) return null;
              const left = Math.max(0, (startIdx / total) * 100);
              const width = Math.max(0.5, ((endIdx - startIdx) / total) * 100);
              return (
                <div
                  className="absolute top-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-300"
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
