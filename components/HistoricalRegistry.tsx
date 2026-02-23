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
        <div className="bg-white border border-surface-200 overflow-hidden shadow-lg rounded-3xl">
            <div className="px-6 py-5 bg-surface-50 border-b border-surface-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
                    <h3 className="text-sm font-bold text-surface-900 uppercase tracking-widest">{t.registry}</h3>
                </div>
                <BarChart3 className="w-4 h-4 text-surface-400" />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-surface-50/50 text-[10px] font-bold uppercase text-surface-400 tracking-widest border-b border-surface-100">
                        <tr>
                            <th className="px-6 py-4">{lang === 'cn' ? '估值日期' : 'Date'}</th>
                            {dataset.funds.map(f => (
                                <th key={f} className="px-6 py-4">
                                    <span className="text-surface-900">{f}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100 font-mono text-xs">
                        {dataset.data.slice(0, 15).map((row, i) => (
                            <tr key={i} className="hover:bg-brand-50/30 transition-colors group">
                                <td className="px-6 py-4 font-bold text-surface-900">{row.date}</td>
                                {dataset.funds.map(f => (
                                    <td key={f} className="px-6 py-4 text-surface-600 tabular-nums group-hover:text-brand-700">
                                        {row[f] !== null && row[f] !== undefined ? (row[f] as number).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {dataset.data.length > 15 && (
                <div className="px-6 py-4 bg-surface-50 text-[10px] text-surface-400 font-medium text-center border-t border-surface-100 italic">
                    Truncated showing top 15 records out of {dataset.data.length}
                </div>
            )}
        </div>
    );
};
