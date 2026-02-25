import React, { useMemo, useState } from 'react';
import { FundDataset, Language } from '../types';
import { calculateAllMetrics, MetricResults } from '../utils/financialMetrics';
import {
    Activity,
    AlertTriangle,
    Target,
    Shield,
    TrendingUp,
    BarChart2,
    DollarSign,
    Percent
} from 'lucide-react';

interface Props {
    dataset: FundDataset;
    lang: Language;
}

export const AGIPortfolioManager: React.FC<Props> = ({ dataset, lang }) => {
    const [selectedFund, setSelectedFund] = useState<string>(
        dataset.funds.length > 0 ? dataset.funds[0] : ''
    );

    const t = {
        en: {
            title: "AGI Portfolio Manager",
            subtitle: "Total Solution & Institutional Analytics",
            fundSelect: "Select Portfolio Strategy",
            summary: "Portfolio Summary",
            aum: "Total AUM",
            yield: "Portfolio Yield",
            mdd: "Max Drawdown",
            te: "Tracking Error",
            r2: "R-Squared",
            passive: "Passive Indexer",
            activeLite: "Enhanced Index / Active-Lite",
            active: "High Conviction Active",
            warning: "Strategy Warning",
            closetIndexing: "Potential Closet Indexing Detected. High R-Squared and Low Tracking Error implies passive strategy with active fees.",
            noData: "Insufficient data to perform institutional analysis."
        },
        cn: {
            title: "AGI 投資組合經理",
            subtitle: "全面解決方案與機構級分析",
            fundSelect: "選擇投資組合策略",
            summary: "投資組合摘要",
            aum: "總資產管理規模 (AUM)",
            yield: "投資組合收益率",
            mdd: "最大回撤",
            te: "追蹤誤差",
            r2: "R平方",
            passive: "被動指數型",
            activeLite: "增強型指數 / 輕度主動",
            active: "高確信度主動型",
            warning: "策略警告",
            closetIndexing: "偵測到潛在的「隱形指數化」(Closet Indexing)。高 R 平方與低追蹤誤差暗示該策略為收取主動管理費用的被動策略。",
            noData: "數據不足，無法執行機構級分析。"
        }
    }[lang];

    // Note: AUM and Yield would typically come from metadata. We will mock them if not present.
    const mockAUM = 150000000; // $150M Example
    const mockYield = 0.045; // 4.5% Example

    const metrics = useMemo(() => {
        if (!selectedFund || dataset.funds.length < 2) return null;

        // Assume the first fund is the benchmark or find a suitable comparison.
        // For institutional analytics, we need a benchmark. Let's assume the user selected a benchmark or we use the first available.
        const benchmarkName = dataset.funds.find(f => f !== selectedFund) || dataset.funds[0];

        const startDate = dataset.data[0]?.date;
        const endDate = dataset.data[dataset.data.length - 1]?.date;

        return calculateAllMetrics(dataset.data, selectedFund, startDate, endDate, benchmarkName);
    }, [dataset, selectedFund]);

    if (!selectedFund || dataset.funds.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-8 border border-surface-200 shadow-lg text-center text-surface-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-surface-300" />
                <p>{t.noData}</p>
            </div>
        );
    }

    const { maxDrawdown = 0, trackingError, rSquared } = metrics || {};

    // Determine Strategy Classification
    let strategyClassification = '';
    let strategyColor = '';

    if (trackingError !== undefined) {
        if (trackingError < 0.01) {
            strategyClassification = t.passive;
            strategyColor = 'bg-slate-100 text-slate-700 border-slate-200';
        } else if (trackingError <= 0.03) {
            strategyClassification = t.activeLite;
            strategyColor = 'bg-blue-50 text-blue-700 border-blue-200';
        } else {
            strategyClassification = t.active;
            strategyColor = 'bg-brand-50 text-brand-700 border-brand-200';
        }
    }

    const isClosetIndexing = rSquared !== undefined && rSquared > 0.95 && trackingError !== undefined && trackingError < 0.02;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-surface-200 shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-100 p-2.5 rounded-xl">
                            <Target className="w-6 h-6 text-brand-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-surface-900">{t.title}</h2>
                            <p className="text-xs text-surface-500 font-medium tracking-wide uppercase">{t.subtitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <select
                            value={selectedFund}
                            onChange={(e) => setSelectedFund(e.target.value)}
                            className="w-full md:w-64 bg-surface-50 border border-surface-200 text-surface-900 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-2.5 font-bold"
                        >
                            {dataset.funds.map(fund => (
                                <option key={fund} value={fund}>{fund}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {strategyClassification && (
                    <div className="mb-8">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${strategyColor}`}>
                            <Shield className="w-3.5 h-3.5" />
                            {strategyClassification}
                        </span>
                    </div>
                )}

                {isClosetIndexing && (
                    <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-orange-800 uppercase tracking-wide mb-1">{t.warning}</h4>
                            <p className="text-sm text-orange-700 font-medium leading-relaxed">{t.closetIndexing}</p>
                        </div>
                    </div>
                )}

                <h3 className="text-sm font-bold text-surface-400 uppercase tracking-widest mb-4">{t.summary}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-surface-50 p-5 rounded-2xl border border-surface-100">
                        <div className="flex items-center gap-2 mb-2 text-surface-500">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">{t.aum}</span>
                        </div>
                        <p className="text-2xl font-black text-surface-900">${(mockAUM / 1000000).toFixed(1)}M</p>
                    </div>

                    <div className="bg-surface-50 p-5 rounded-2xl border border-surface-100">
                        <div className="flex items-center gap-2 mb-2 text-surface-500">
                            <Percent className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">{t.yield}</span>
                        </div>
                        <p className="text-2xl font-black text-emerald-600">{(mockYield * 100).toFixed(2)}%</p>
                    </div>

                    <div className="bg-surface-50 p-5 rounded-2xl border border-surface-100">
                        <div className="flex items-center gap-2 mb-2 text-surface-500">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">{t.mdd}</span>
                        </div>
                        <p className="text-2xl font-black text-red-500">{(maxDrawdown * 100).toFixed(2)}%</p>
                    </div>

                    <div className="bg-surface-50 p-5 rounded-2xl border border-surface-100">
                        <div className="flex items-center gap-2 mb-2 text-surface-500">
                            <BarChart2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">{t.te}</span>
                        </div>
                        <p className="text-2xl font-black text-brand-600">
                            {trackingError !== undefined ? (trackingError * 100).toFixed(2) + '%' : '—'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
