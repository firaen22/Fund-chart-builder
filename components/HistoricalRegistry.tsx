import React from 'react';
import { FundDataset, Language } from '../types';
import { BarChart3 } from 'lucide-react';

interface Props {
    dataset: FundDataset;
    lang: Language;
}

export const HistoricalRegistry: React.FC<Props> = ({ dataset, lang }) => {
    const t = {
        en: {
            registry: "Historical Ledger",
        },
        cn: {
            registry: "歷史台賬",
        }
    }[lang];

    return (
        <div className="glass-panel border-black/5 dark:border-white/5 shadow-3xl rounded-[2.5rem] overflow-hidden backdrop-blur-3xl transition-colors duration-500">
            <div className="px-8 py-6 bg-white/40 dark:bg-white/5 border-b border-black/5 dark:border-white/5 flex items-center justify-between transition-colors duration-500">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)] animate-pulse"></div>
                    <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">{t.registry}</h3>
                </div>
                <div className="glass-cta p-2 rounded-lg text-white shadow-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-black/5 dark:bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] border-b border-black/5 dark:border-white/5">
                        <tr>
                            <th className="px-8 py-5 border-r border-black/5 dark:border-white/5 last:border-0">{lang === 'cn' ? '估值日期' : 'Valuation Date'}</th>
                            {dataset.funds.map(f => (
                                <th key={f} className="px-8 py-5 border-r border-black/5 dark:border-white/5 last:border-0">
                                    <span className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">{f}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono text-xs">
                        {dataset.data.slice(0, 15).map((row, i) => (
                            <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                <td className="px-8 py-5 font-black text-slate-900 dark:text-white tabular-nums border-r border-black/5 dark:border-white/5 group-hover:bg-indigo-500/5 dark:group-hover:bg-indigo-500/10 transition-colors uppercase tracking-wider">{row.date}</td>
                                {dataset.funds.map(f => (
                                    <td key={f} className="px-8 py-5 text-slate-500 dark:text-slate-400 tabular-nums border-r border-black/5 dark:border-white/5 last:border-0 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-black">
                                        {row[f] !== null && row[f] !== undefined ? (row[f] as number).toLocaleString(undefined, { minimumFractionDigits: 2 }) : (
                                            <span className="text-slate-300 dark:text-slate-800 italic opacity-50">NULL</span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {dataset.data.length > 15 && (
                <div className="px-8 py-5 bg-white/20 dark:bg-black/20 text-[10px] text-slate-500 font-black uppercase tracking-[0.25em] text-center border-t border-black/5 dark:border-white/5 italic transition-colors duration-500">
                    Truncated showing top 15 records out of {dataset.data.length}
                </div>
            )}
        </div>
    );
};
