import React, { useMemo, useState } from 'react';
import { Language, FundDataset } from '../types';
import { detectAnomalies, Anomaly, AnomalyType, AnomalySeverity } from '../utils/anomalyDetection';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, CircleDot, Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface AnomalyAlertsProps {
  dataset: FundDataset;
  lang: Language;
  /** Callback when user clicks an anomaly row — parent can scroll chart to date */
  onAnomalyClick?: (date: string) => void;
}

const TYPE_CONFIG: Record<AnomalyType, { icon: React.ElementType; colorClass: string; labelEn: string; labelCn: string }> = {
  spike: { icon: TrendingUp, colorClass: 'text-emerald-500', labelEn: 'Spike', labelCn: '飆升' },
  drop:  { icon: TrendingDown, colorClass: 'text-red-500', labelEn: 'Drop', labelCn: '下跌' },
  flat:  { icon: Minus, colorClass: 'text-amber-500', labelEn: 'Flat', labelCn: '平坦' },
  gap:   { icon: CircleDot, colorClass: 'text-slate-400', labelEn: 'Gap', labelCn: '缺失' },
};

const SEVERITY_BADGE: Record<AnomalySeverity, { bgClass: string; labelEn: string; labelCn: string }> = {
  high:   { bgClass: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20', labelEn: 'HIGH', labelCn: '高' },
  medium: { bgClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20', labelEn: 'MED', labelCn: '中' },
  low:    { bgClass: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20', labelEn: 'LOW', labelCn: '低' },
};

export const AnomalyAlerts: React.FC<AnomalyAlertsProps> = ({ dataset, lang, onAnomalyClick }) => {
  const anomalies = useMemo(() => detectAnomalies(dataset), [dataset]);

  const [expanded, setExpanded] = useState(false);
  const [filterType, setFilterType] = useState<AnomalyType | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<AnomalySeverity | 'all'>('all');

  const filtered = useMemo(() => {
    return anomalies.filter(a => {
      if (filterType !== 'all' && a.type !== filterType) return false;
      if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
      return true;
    });
  }, [anomalies, filterType, filterSeverity]);

  const displayLimit = expanded ? filtered.length : 8;
  const displayed = filtered.slice(0, displayLimit);

  const severityCounts = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    anomalies.forEach(a => counts[a.severity]++);
    return counts;
  }, [anomalies]);

  const t = lang === 'cn'
    ? {
        title: '異常檢測警報',
        noAnomalies: '未檢測到異常 — 數據看起來正常',
        total: '共',
        alerts: '個警報',
        showAll: '顯示全部',
        showLess: '收起',
        filterAll: '全部',
        fund: '基金',
        date: '日期',
        change: '變動',
      }
    : {
        title: 'Anomaly Detection Alerts',
        noAnomalies: 'No anomalies detected — data looks clean',
        total: '',
        alerts: 'alerts detected',
        showAll: 'Show all',
        showLess: 'Show less',
        filterAll: 'All',
        fund: 'Fund',
        date: 'Date',
        change: 'Change',
      };

  if (anomalies.length === 0) {
    return (
      <div className="glass-panel p-5 rounded-2xl border-black/5 dark:border-white/5 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.noAnomalies}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 rounded-2xl border-black/5 dark:border-white/5 shadow-lg">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {t.title}
            </span>
          </div>

          {/* Summary badges */}
          <div className="flex items-center gap-2">
            {severityCounts.high > 0 && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20">
                {severityCounts.high} HIGH
              </span>
            )}
            {severityCounts.medium > 0 && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {severityCounts.medium} MED
              </span>
            )}
            {severityCounts.low > 0 && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-500/10 text-slate-500 border border-slate-500/20">
                {severityCounts.low} LOW
              </span>
            )}
            <span className="text-[10px] font-bold text-slate-500 tabular-nums ml-1">
              {t.total} {anomalies.length} {t.alerts}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400" />

          {/* Type filter */}
          {(['all', 'spike', 'drop', 'flat', 'gap'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all border ${
                filterType === type
                  ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                  : 'text-slate-500 dark:text-slate-400 border-transparent hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {type === 'all' ? t.filterAll : (lang === 'cn' ? TYPE_CONFIG[type].labelCn : TYPE_CONFIG[type].labelEn)}
            </button>
          ))}

          <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1"></div>

          {/* Severity filter */}
          {(['all', 'high', 'medium', 'low'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all border ${
                filterSeverity === sev
                  ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                  : 'text-slate-500 dark:text-slate-400 border-transparent hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {sev === 'all' ? t.filterAll : (lang === 'cn' ? SEVERITY_BADGE[sev].labelCn : SEVERITY_BADGE[sev].labelEn)}
            </button>
          ))}
        </div>

        {/* Alert list */}
        <div className="space-y-1.5">
          {displayed.map((a, idx) => {
            const cfg = TYPE_CONFIG[a.type];
            const sevCfg = SEVERITY_BADGE[a.severity];
            const Icon = cfg.icon;

            return (
              <button
                key={`${a.date}-${a.fund}-${a.type}-${idx}`}
                onClick={() => onAnomalyClick?.(a.date)}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all group"
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.colorClass}`} />

                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                    {lang === 'cn' ? a.descriptionCn : a.description}
                  </p>
                </div>

                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border flex-shrink-0 ${sevCfg.bgClass}`}>
                  {lang === 'cn' ? sevCfg.labelCn : sevCfg.labelEn}
                </span>

                <span className="text-[10px] font-bold text-slate-400 tabular-nums flex-shrink-0 w-[80px] text-right">
                  {a.date}
                </span>
              </button>
            );
          })}
        </div>

        {/* Show more / less */}
        {filtered.length > 8 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 py-2 rounded-xl transition-all"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded
              ? t.showLess
              : `${t.showAll} (${filtered.length})`
            }
          </button>
        )}
      </div>
    </div>
  );
};
