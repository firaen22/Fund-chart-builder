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
            <div className="glass-panel rounded-[2rem] p-12 border-white/5 shadow-2xl text-center backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-700">
                <Activity className="w-16 h-16 mx-auto mb-6 text-slate-700 animate-pulse" />
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500">{t.noData}</p>
            </div>
        );
    }

    const { maxDrawdown = 0, trackingError, rSquared } = metrics || {};

    // Determine Strategy Classification
    let strategyClassification = '';
    let strategyStyle = '';

    if (trackingError !== undefined) {
        if (trackingError < 0.01) {
            strategyClassification = t.passive;
            strategyStyle = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        } else if (trackingError <= 0.03) {
            strategyClassification = t.activeLite;
            strategyStyle = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        } else {
            strategyClassification = t.active;
            strategyStyle = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
        }
    }

    const isClosetIndexing = rSquared !== undefined && rSquared > 0.95 && trackingError !== undefined && trackingError < 0.02;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="glass-panel rounded-[2.5rem] p-10 border-white/5 shadow-3xl backdrop-blur-3xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none scale-150">
                    <Target className="w-64 h-64" />
                </div>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="glass-cta p-4 rounded-2xl shadow-2xl shadow-indigo-500/20">
                            <Target className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight uppercase tracking-[0.05em]">{t.title}</h2>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1.5">{t.subtitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full lg:w-auto bg-black/20 p-2 rounded-2xl border border-white/5 shadow-inner">
                        <select
                            value={selectedFund}
                            onChange={(e) => setSelectedFund(e.target.value)}
                            className="w-full lg:w-72 bg-transparent border-none text-white text-sm rounded-xl focus:ring-0 block p-3 font-black uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                        >
                            {dataset.funds.map(fund => (
                                <option key={fund} value={fund} className="bg-slate-900 text-white font-bold">{fund}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {strategyClassification && (
                    <div className="mb-10 relative z-10">
                        <span className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] border backdrop-blur-md shadow-2xl ${strategyStyle}`}>
                            <Shield className="w-4 h-4" />
                            {strategyClassification}
                        </span>
                    </div>
                )}

                {isClosetIndexing && (
                    <div className="mb-10 p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-start gap-5 shadow-2xl animate-in slide-in-from-left-4 duration-500 relative z-10">
                        <div className="bg-rose-500 p-2 rounded-lg shadow-lg shadow-rose-500/20">
                            <AlertTriangle className="w-5 h-5 text-white flex-shrink-0" />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black text-rose-400 uppercase tracking-[0.4em] mb-2">{t.warning}</h4>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed tracking-wide">{t.closetIndexing}</p>
                        </div>
                    </div>
                )}

                <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] mb-6 relative z-10">{t.summary}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <div className="glass-panel p-6 rounded-[2rem] border-white/5 bg-white/5 hover:bg-white/[0.08] transition-all group active:scale-[0.98]">
                        <div className="flex items-center gap-3 mb-4 text-slate-500 group-hover:text-indigo-400 transition-colors">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em]">{t.aum}</span>
                        </div>
                        <p className="text-3xl font-black text-white tracking-tighter tabular-nums">${(mockAUM / 1000000).toFixed(1)}M</p>
                    </div>

                    <div className="glass-panel p-6 rounded-[2rem] border-white/5 bg-white/5 hover:bg-white/[0.08] transition-all group active:scale-[0.98]">
                        <div className="flex items-center gap-3 mb-4 text-slate-500 group-hover:text-emerald-400 transition-colors">
                            <Percent className="w-4 h-4" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em]">{t.yield}</span>
                        </div>
                        <p className="text-3xl font-black text-emerald-400 tracking-tighter tabular-nums">{(mockYield * 100).toFixed(2)}%</p>
                    </div>

                    <div className="glass-panel p-6 rounded-[2rem] border-white/5 bg-white/5 hover:bg-white/[0.08] transition-all group active:scale-[0.98]">
                        <div className="flex items-center gap-3 mb-4 text-slate-500 group-hover:text-rose-400 transition-colors">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em]">{t.mdd}</span>
                        </div>
                        <p className="text-3xl font-black text-rose-400 tracking-tighter tabular-nums">{(maxDrawdown * 100).toFixed(2)}%</p>
                    </div>

                    <div className="glass-panel p-6 rounded-[2rem] border-white/5 bg-white/5 hover:bg-white/[0.08] transition-all group active:scale-[0.98]">
                        <div className="flex items-center gap-3 mb-4 text-slate-500 group-hover:text-indigo-400 transition-colors">
                            <BarChart2 className="w-4 h-4" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em]">{t.te}</span>
                        </div>
                        <p className="text-3xl font-black text-indigo-400 tracking-tighter tabular-nums">
                            {trackingError !== undefined ? (trackingError * 100).toFixed(2) + '%' : '—'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
