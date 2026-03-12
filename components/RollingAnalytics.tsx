import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { FundDataset, Language } from '../types';
import {
  computeRollingMetric,
  computeDrawdownDuration,
  RollingMetricType,
  WINDOW_PRESETS,
} from '../utils/rollingMetrics';
import {
  Activity,
  TrendingDown,
  BarChart3,
  Timer,
  Gauge,
  Shield,
} from 'lucide-react';

const COLORS = [
  '#4a57f2', '#0d9488', '#db2777', '#ea580c',
  '#7c3aed', '#2563eb', '#059669', '#dc2626',
];

interface Props {
  dataset: FundDataset;
  lang: Language;
}

type MetricOption = RollingMetricType | 'drawdownDuration';

export const RollingAnalytics: React.FC<Props> = ({ dataset, lang }) => {
  const [windowSize, setWindowSize] = useState(30);
  const [selectedMetric, setSelectedMetric] = useState<MetricOption>('volatility');

  const t = {
    en: {
      title: 'Rolling Window Analytics',
      subtitle: 'Time-varying risk & return analysis',
      window: 'Window Size',
      metric: 'Metric',
      volatility: 'Volatility',
      volatilityDesc: 'Annualized rolling volatility',
      sharpe: 'Sharpe Ratio',
      sharpeDesc: 'Risk-adjusted return over window',
      sortino: 'Sortino Ratio',
      sortinoDesc: 'Downside risk-adjusted return',
      drawdown: 'Max Drawdown',
      drawdownDesc: 'Worst loss within window',
      returnLabel: 'Return',
      returnDesc: 'Window period return',
      drawdownDuration: 'Drawdown Duration',
      drawdownDurationDesc: 'Consecutive periods below peak',
      points: 'pts',
      noData: 'Not enough data for the selected window size. Reduce the window or add more data.',
    },
    cn: {
      title: '滾動窗口分析',
      subtitle: '時變風險與回報分析',
      window: '窗口大小',
      metric: '指標',
      volatility: '波動率',
      volatilityDesc: '年化滾動波動率',
      sharpe: '夏普比率',
      sharpeDesc: '窗口期風險調整回報',
      sortino: '索提諾比率',
      sortinoDesc: '下行風險調整回報',
      drawdown: '最大回撤',
      drawdownDesc: '窗口期最大跌幅',
      returnLabel: '回報率',
      returnDesc: '窗口期收益率',
      drawdownDuration: '回撤持續期',
      drawdownDurationDesc: '低於峰值的連續期數',
      points: '點',
      noData: '所選窗口大小的數據不足。請縮小窗口或添加更多數據。',
    },
  }[lang];

  const metricOptions: { key: MetricOption; label: string; desc: string; icon: React.FC<any> }[] = [
    { key: 'volatility', label: t.volatility, desc: t.volatilityDesc, icon: Activity },
    { key: 'sharpe', label: t.sharpe, desc: t.sharpeDesc, icon: Gauge },
    { key: 'sortino', label: t.sortino, desc: t.sortinoDesc, icon: Shield },
    { key: 'drawdown', label: t.drawdown, desc: t.drawdownDesc, icon: TrendingDown },
    { key: 'return', label: t.returnLabel, desc: t.returnDesc, icon: BarChart3 },
    { key: 'drawdownDuration', label: t.drawdownDuration, desc: t.drawdownDurationDesc, icon: Timer },
  ];

  const rollingData = useMemo(() => {
    if (selectedMetric === 'drawdownDuration') {
      return computeDrawdownDuration(dataset.data, dataset.funds);
    }
    return computeRollingMetric(dataset.data, dataset.funds, selectedMetric, windowSize);
  }, [dataset, selectedMetric, windowSize]);

  const formatValue = (val: number | null): string => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    if (selectedMetric === 'drawdownDuration') return `${val}`;
    if (selectedMetric === 'volatility' || selectedMetric === 'drawdown' || selectedMetric === 'return') {
      return (val * 100).toFixed(2) + '%';
    }
    return val.toFixed(2);
  };

  const yAxisFormatter = (val: number) => {
    if (selectedMetric === 'drawdownDuration') return `${val}`;
    if (selectedMetric === 'volatility' || selectedMetric === 'drawdown' || selectedMetric === 'return') {
      return (val * 100).toFixed(0) + '%';
    }
    return val.toFixed(1);
  };

  const useArea = selectedMetric === 'drawdown' || selectedMetric === 'drawdownDuration';

  return (
    <div className="glass-panel rounded-[2.5rem] border-black/5 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col backdrop-blur-3xl transition-colors duration-500">
      {/* Header */}
      <div className="px-8 py-6 bg-white/20 dark:bg-white/5 border-b border-black/5 dark:border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-colors duration-500">
        <div className="flex items-center gap-4">
          <div className="glass-cta p-2.5 rounded-xl text-white shadow-xl flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">{t.title}</h3>
            <p className="text-[9px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">{t.subtitle}</p>
          </div>
        </div>

        {/* Window Size Selector */}
        {selectedMetric !== 'drawdownDuration' && (
          <div className="flex items-center gap-2 bg-white/40 dark:bg-black/20 p-1.5 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner transition-colors duration-500">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-3">{t.window}</span>
            {WINDOW_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setWindowSize(preset.value)}
                className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${windowSize === preset.value
                  ? 'bg-white/80 dark:bg-white/15 text-slate-900 dark:text-white shadow-lg border border-black/5 dark:border-white/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
              >
                {lang === 'cn' ? preset.labelCn : preset.label} {lang === 'cn' ? t.points : t.points}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-8 space-y-8">
        {/* Metric Selector Chips */}
        <div className="flex flex-wrap gap-3">
          {metricOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSelectedMetric(opt.key)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border transition-all duration-300 ease-out active:scale-95 ${selectedMetric === opt.key
                ? 'glass-cta shadow-indigo-500/10 border-indigo-500/30'
                : 'glass-button-secondary border-black/5 dark:border-white/5 text-slate-500 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-slate-300'
                }`}
            >
              <opt.icon className={`w-4 h-4 ${selectedMetric === opt.key ? 'text-white' : ''}`} />
              <div className="text-left">
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] block ${selectedMetric === opt.key ? 'text-white' : 'text-inherit'}`}>
                  {opt.label}
                </span>
                <span className={`text-[8px] font-semibold block mt-0.5 ${selectedMetric === opt.key ? 'text-white/70' : 'text-slate-400 dark:text-slate-600'}`}>
                  {opt.desc}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Chart */}
        {rollingData.length === 0 ? (
          <div className="p-16 text-center text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
            {t.noData}
          </div>
        ) : (
          <div className="glass-panel rounded-3xl border-black/5 dark:border-white/5 p-6 bg-white/20 dark:bg-black/10 shadow-xl">
            <ResponsiveContainer width="100%" height={420}>
              {useArea ? (
                <AreaChart data={rollingData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <defs>
                    {dataset.funds.map((fund, i) => (
                      <linearGradient key={fund} id={`rolling-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-black/5 dark:text-white/5" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={60}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={yAxisFormatter}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      padding: '12px 16px',
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                    }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}
                    itemStyle={{ color: '#e2e8f0', fontSize: '11px', fontWeight: 700 }}
                    formatter={(val: number) => formatValue(val)}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}
                  />
                  {dataset.funds.map((fund, i) => (
                    <Area
                      key={fund}
                      type="monotone"
                      dataKey={fund}
                      stroke={COLORS[i % COLORS.length]}
                      fill={`url(#rolling-grad-${i})`}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2 }}
                      connectNulls
                    />
                  ))}
                </AreaChart>
              ) : (
                <LineChart data={rollingData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-black/5 dark:text-white/5" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={60}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={yAxisFormatter}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      padding: '12px 16px',
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                    }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}
                    itemStyle={{ color: '#e2e8f0', fontSize: '11px', fontWeight: 700 }}
                    formatter={(val: number) => formatValue(val)}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}
                  />
                  {dataset.funds.map((fund, i) => (
                    <Line
                      key={fund}
                      type="monotone"
                      dataKey={fund}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
