import React, { useState, useMemo } from 'react';
import { FundDataset, Language } from '../types';
import { calculateAllMetrics, MetricResults } from '../utils/financialMetrics';
import {
    Calculator,
    Calendar,
    CheckCircle2,
    Settings2,
    TrendingUp,
    Activity,
    AlertTriangle,
    Percent,
    BarChart2,
    Shield,
    Target
} from 'lucide-react';

interface Props {
    dataset: FundDataset;
    lang: Language;
}

type MetricKey = keyof MetricResults;

export const FinancialMetrics: React.FC<Props> = ({ dataset, lang }) => {
    const [startDate, setStartDate] = useState<string>(() => {
        if (dataset.data.length > 0) return dataset.data[0].date;
        return '';
    });

    const [endDate, setEndDate] = useState<string>(() => {
        if (dataset.data.length > 0) return dataset.data[dataset.data.length - 1].date;
        return '';
    });

    const [selectedMetrics, setSelectedMetrics] = useState<Record<MetricKey, boolean>>({
        sharpeRatio: false,
        maxDrawdown: true,
        cumulativeReturn: true,
        volatility: false,
        rsi: false,
        sortinoRatio: true,
        beta: false,
        alpha: false,
        trackingError: true,
        rSquared: false
    });

    const t = {
        en: {
            title: "Financial Metrics",
            subtitle: "Advanced quantitative analysis",
            dateRange: "Analysis Period",
            metrics: "Select Indicators",
            sharpe: "Sharpe Ratio",
            sharpeDesc: "Risk-adjusted return",
            sortino: "Sortino Ratio",
            sortinoDesc: "Downside risk-adjusted return",
            mdd: "Max Drawdown",
            mddDesc: "Worst possible loss",
            return: "Cumulative Return",
            returnDesc: "Total profit/loss",
            volatility: "Ann. Volatility",
            volatilityDesc: "Price stability",
            beta: "Beta",
            betaDesc: "Market volatility vs benchmark",
            alpha: "Alpha",
            alphaDesc: "Excess return vs benchmark",
            te: "Tracking Error",
            teDesc: "Active risk vs benchmark",
            r2: "R-Squared",
            r2Desc: "Correlation to benchmark",
            rsi: "RSI (14)",
            rsiDesc: "Momentum indicator",
            fund: "Fund Name",
            noData: "No data available for the selected range."
        },
        cn: {
            title: "財務指標分析",
            subtitle: "高級定量分析",
            dateRange: "分析期間",
            metrics: "選擇指標",
            sharpe: "夏普比率",
            sharpeDesc: "每一單位風險的超額回報",
            sortino: "索提諾比率",
            sortinoDesc: "下行風險調整後回報",
            mdd: "最大回撤",
            mddDesc: "期間內最大跌幅",
            return: "累積回報",
            returnDesc: "期間總獲利",
            volatility: "年化波動率",
            volatilityDesc: "價格變動劇烈程度",
            beta: "貝塔係數 (Beta)",
            betaDesc: "相對於基準的波動性",
            alpha: "阿爾法 (Alpha)",
            alphaDesc: "相對於基準的超額回報",
            te: "追蹤誤差 (TE)",
            teDesc: "相對於基準的活躍風險",
            r2: "R平方",
            r2Desc: "與基準的相關性",
            rsi: "相對強弱指數 (RSI)",
            rsiDesc: "趨勢與買賣力道",
            fund: "基金名稱",
            noData: "所選範圍內無數據。"
        }
    }[lang];

    const metricsConfig: { key: MetricKey; label: string; desc: string; icon: React.FC<any>; color: string }[] = [
        { key: 'cumulativeReturn', label: t.return, desc: t.returnDesc, icon: Percent, color: 'text-emerald-600' },
        { key: 'maxDrawdown', label: t.mdd, desc: t.mddDesc, icon: AlertTriangle, color: 'text-red-500' },
        { key: 'sharpeRatio', label: t.sharpe, desc: t.sharpeDesc, icon: Activity, color: 'text-indigo-600' },
        { key: 'sortinoRatio', label: t.sortino, desc: t.sortinoDesc, icon: Shield, color: 'text-sky-500' },
        { key: 'volatility', label: t.volatility, desc: t.volatilityDesc, icon: Activity, color: 'text-orange-500' },
        { key: 'beta', label: t.beta, desc: t.betaDesc, icon: TrendingUp, color: 'text-rose-500' },
        { key: 'alpha', label: t.alpha, desc: t.alphaDesc, icon: Target, color: 'text-amber-500' },
        { key: 'trackingError', label: t.te, desc: t.teDesc, icon: Activity, color: 'text-sky-600' },
        { key: 'rSquared', label: t.r2, desc: t.r2Desc, icon: TrendingUp, color: 'text-rose-600' },
        { key: 'rsi', label: t.rsi, desc: t.rsiDesc, icon: BarChart2, color: 'text-purple-600' },
    ];

    const computedMetrics = useMemo(() => {
        const results: Record<string, MetricResults | null> = {};
        const benchmarkName = dataset.funds.length > 0 ? dataset.funds[0] : undefined;
        dataset.funds.forEach(fund => {
            results[fund] = calculateAllMetrics(dataset.data, fund, startDate, endDate, benchmarkName);
        });
        return results;
    }, [dataset, startDate, endDate]);

    const toggleMetric = (key: MetricKey) => {
        setSelectedMetrics(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const activeMetrics = metricsConfig.filter(m => selectedMetrics[m.key]);

    return (
        <div className="glass-panel rounded-[2.5rem] border-white/5 shadow-2xl overflow-hidden flex flex-col backdrop-blur-3xl">
            <div className="px-8 py-6 bg-white/5 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="glass-cta p-2.5 rounded-xl text-white shadow-xl">
                        <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">{t.title}</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{t.subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-black/20 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                    <div className="flex items-center gap-3 px-4 py-2 border-r border-white/5">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.dateRange}</span>
                    </div>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="text-xs font-mono font-black text-white bg-transparent border-none focus:ring-0 p-1 cursor-pointer"
                    />
                    <span className="text-slate-700 font-black">/</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="text-xs font-mono font-black text-white bg-transparent border-none focus:ring-0 p-1 cursor-pointer"
                    />
                </div>
            </div>

            <div className="p-8 space-y-10">
                {/* Metric Selection */}
                <div className="flex flex-wrap gap-4">
                    {metricsConfig.map((metric) => (
                        <button
                            key={metric.key}
                            onClick={() => toggleMetric(metric.key)}
                            className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all duration-300 ease-out active:scale-95 ${selectedMetrics[metric.key]
                                ? 'glass-cta shadow-indigo-500/10 border-indigo-500/30'
                                : 'glass-button-secondary border-white/5 text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${selectedMetrics[metric.key] ? 'bg-white text-indigo-600 shadow-lg' : 'bg-white/5'}`}>
                                {selectedMetrics[metric.key] && <CheckCircle2 className="w-3.5 h-3.5 animate-in zoom-in duration-500 ease-out" />}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${selectedMetrics[metric.key] ? 'text-white' : 'text-inherit'}`}>
                                {metric.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Results Table */}
                <div className="overflow-hidden rounded-3xl border border-white/5 glass-panel bg-black/10 shadow-3xl">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] border-b border-white/5">
                                <tr>
                                    <th className="px-8 py-5 bg-black/40 sticky left-0 z-10 backdrop-blur-xl border-r border-white/5">{t.fund}</th>
                                    {activeMetrics.map(m => (
                                        <th key={m.key} className="px-8 py-5 whitespace-nowrap border-r border-white/5 last:border-0">
                                            <div className="flex items-center gap-3 hover:text-white transition-colors">
                                                <m.icon className={`w-4 h-4 text-indigo-400`} />
                                                <span>{m.label}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-mono text-xs">
                                {dataset.funds.map((fund) => {
                                    const result = computedMetrics[fund];
                                    if (!result) return null;

                                    return (
                                        <tr key={fund} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-8 py-5 font-black text-white bg-black/20 group-hover:bg-indigo-500/10 sticky left-0 border-r border-white/5 backdrop-blur-xl shadow-2xl transition-colors tracking-widest uppercase">
                                                {fund}
                                            </td>
                                            {activeMetrics.map(m => {
                                                let value = result[m.key];
                                                let displayValue = '—';
                                                let colorClass = 'text-slate-400';

                                                if (value !== undefined && value !== null && !isNaN(value)) {
                                                    if (m.key === 'cumulativeReturn' || m.key === 'maxDrawdown' || m.key === 'volatility' || m.key === 'alpha' || m.key === 'trackingError') {
                                                        displayValue = (value * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
                                                        if (m.key === 'cumulativeReturn' || m.key === 'alpha') {
                                                            colorClass = value >= 0 ? 'text-emerald-400 font-black' : 'text-rose-400 font-black';
                                                        } else if (m.key === 'maxDrawdown') {
                                                            colorClass = 'text-rose-400 font-black';
                                                        }
                                                    } else {
                                                        displayValue = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                        if (m.key === 'sharpeRatio' || m.key === 'sortinoRatio') {
                                                            colorClass = value > 1 ? 'text-emerald-400 font-black' : (value < 0 ? 'text-rose-400' : 'text-slate-300 font-black');
                                                        }
                                                    }
                                                }

                                                return (
                                                    <td key={m.key} className={`px-8 py-5 tabular-nums border-r border-white/5 last:border-0 ${colorClass}`}>
                                                        {displayValue}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {activeMetrics.length === 0 && (
                        <div className="p-12 text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
                            {t.metrics}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
