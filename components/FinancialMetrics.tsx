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
        alpha: false
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
        <div className="bg-white rounded-3xl border border-surface-200 shadow-lg overflow-hidden flex flex-col">
            <div className="px-6 py-5 bg-surface-50 border-b border-surface-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-100 p-2 rounded-lg text-brand-700">
                        <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-surface-900 uppercase tracking-widest">{t.title}</h3>
                        <p className="text-[10px] text-surface-500 font-medium">{t.subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-surface-200 shadow-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 border-r border-surface-100">
                        <Calendar className="w-3.5 h-3.5 text-surface-400" />
                        <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">{t.dateRange}</span>
                    </div>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="text-xs font-mono font-bold text-surface-900 bg-transparent border-none focus:ring-0 p-1"
                    />
                    <span className="text-surface-300">-</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="text-xs font-mono font-bold text-surface-900 bg-transparent border-none focus:ring-0 p-1"
                    />
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Metric Selection */}
                <div className="flex flex-wrap gap-3">
                    {metricsConfig.map((metric) => (
                        <button
                            key={metric.key}
                            onClick={() => toggleMetric(metric.key)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ease-out active:scale-95 ${selectedMetrics[metric.key]
                                ? 'bg-brand-50 border-brand-200 shadow-sm'
                                : 'bg-white border-surface-200 hover:bg-surface-50 text-surface-400'
                                }`}
                        >
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${selectedMetrics[metric.key] ? 'bg-brand-500 text-white' : 'bg-surface-200'}`}>
                                {selectedMetrics[metric.key] && <CheckCircle2 className="w-3 h-3 animate-in zoom-in duration-300 ease-out" />}
                            </div>
                            <div className="text-left">
                                <span className={`block text-[10px] font-bold uppercase tracking-wider ${selectedMetrics[metric.key] ? 'text-brand-900' : 'text-surface-500'}`}>
                                    {metric.label}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Results Table */}
                <div className="overflow-x-auto rounded-xl border border-surface-200">
                    <table className="w-full text-left">
                        <thead className="bg-surface-50/80 text-[10px] font-bold uppercase text-surface-500 tracking-widest border-b border-surface-200">
                            <tr>
                                <th className="px-6 py-4 bg-surface-50 sticky left-0 z-10">{t.fund}</th>
                                {activeMetrics.map(m => (
                                    <th key={m.key} className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                                            <span>{m.label}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 font-mono text-xs">
                            {dataset.funds.map((fund) => {
                                const result = computedMetrics[fund];
                                if (!result) return null;

                                return (
                                    <tr key={fund} className="hover:bg-brand-50/30 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-surface-900 bg-white group-hover:bg-brand-50/30 sticky left-0 border-r border-surface-100 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                            {fund}
                                        </td>
                                        {activeMetrics.map(m => {
                                            let value = result[m.key];
                                            let displayValue = '—';
                                            let colorClass = 'text-surface-600';

                                            if (value !== undefined && value !== null && !isNaN(value)) {
                                                if (m.key === 'cumulativeReturn' || m.key === 'maxDrawdown' || m.key === 'volatility' || m.key === 'alpha') {
                                                    displayValue = (value * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
                                                    if (m.key === 'cumulativeReturn' || m.key === 'alpha') {
                                                        colorClass = value >= 0 ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold';
                                                    } else if (m.key === 'maxDrawdown') {
                                                        colorClass = 'text-red-500 font-bold';
                                                    }
                                                } else {
                                                    displayValue = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                    if (m.key === 'sharpeRatio' || m.key === 'sortinoRatio') {
                                                        colorClass = value > 1 ? 'text-emerald-600 font-bold' : (value < 0 ? 'text-red-500' : 'text-surface-700');
                                                    }
                                                }
                                            }

                                            return (
                                                <td key={m.key} className={`px-6 py-4 tabular-nums ${colorClass}`}>
                                                    {displayValue}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {activeMetrics.length === 0 && (
                        <div className="p-8 text-center text-surface-400 text-sm font-medium italic">
                            {t.metrics}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
