import React, { useState, useMemo } from 'react';
import {
  Trash2, LayoutGrid, Info, Hash,
  ClipboardPaste, Database, CheckCircle2, History, Wand2,
  ShieldCheck, ArrowRight, Bookmark,
  Layers, FileText, PlusCircle, Calendar
} from 'lucide-react';
import {
  RawFundEntry, mergeFundEntries, parseRawPastedData,
  reconcileDataset
} from '../utils/dataMerger';
import { FundDataset, Language } from '../types';

interface DataRestructurerProps { onComplete: (dataset: FundDataset) => void; lang: Language; }

export const DataRestructurer: React.FC<DataRestructurerProps> = ({ onComplete, lang }) => {
  const [step, setStep] = useState<'input' | 'reconcile'>('input');
  const [entries, setEntries] = useState<RawFundEntry[]>([]);
  const [currentCode, setCurrentCode] = useState('');
  const [currentDescription, setCurrentDescription] = useState('');
  const [currentText, setCurrentText] = useState('');
  const [mergedDataset, setMergedDataset] = useState<FundDataset | null>(null);
  const [alignmentStrategy, setAlignmentStrategy] = useState<'original' | 'forwardFill' | 'intersect'>('forwardFill');

  const finalDatasetPreview = useMemo(() => mergedDataset ? reconcileDataset(mergedDataset, alignmentStrategy) : null, [mergedDataset, alignmentStrategy]);

  const t = {
    en: {
      auditTitle: "Reconciliation Engine",
      auditSub: "Dataset Alignment Audit",
      validated: "Validated Samples",
      back: "Modify Components",
      launch: "Initialize Hub",
      policy: "Aggregation Logic",
      strategies: [
        { id: 'forwardFill', label: 'Linear Forward Fill', desc: 'Auto-synthesize gaps using last known observations.' },
        { id: 'intersect', label: 'Strict Temporal Fit', desc: 'Retain only records shared by all constituents.' },
        { id: 'original', label: 'Native Sparse Data', desc: 'Process dataset with existing gaps intact.' }
      ],
      temporalIndex: "Temporal Index",
      absent: "NO DATA",
      assembler: "Multi-Asset Assembler",
      assemblerSub: "Custom Index Engineering",
      definition: "Define Component",
      symbol: "Identifier (e.g. S&P500)",
      description: "Brief Label",
      navSet: "Value Stream (Paste CSV/Tabular)",
      commit: "Add Component",
      guide: [
        "Select your asset identifier.",
        "Paste NAV/Price history from Excel or terminal.",
        "Aggregate multiple assets to build a composite index."
      ],
      vaulted: "Asset Inventory",
      empty: "Queue Empty",
      points: "Records",
      execute: "Process Aggregation"
    },
    cn: {
      auditTitle: "對賬引擎",
      auditSub: "數據集對齊審計",
      validated: "經驗證樣本",
      back: "修改組件",
      launch: "初始化中心",
      policy: "彙總邏輯",
      strategies: [
        { id: 'forwardFill', label: '線性前向填充', desc: '使用最後觀測值自動合成缺口。' },
        { id: 'intersect', label: '嚴格時間擬合', desc: '僅保留所有成分共有的記錄。' },
        { id: 'original', label: '原始稀疏數據', desc: '完整保留現有缺口處理數據集。' }
      ],
      temporalIndex: "時間索引",
      absent: "無數據",
      assembler: "多資產組裝器",
      assemblerSub: "定制指數工程",
      definition: "定義組件",
      symbol: "標識符 (如 S&P500)",
      description: "簡要標籤",
      navSet: "價值流 (貼入 CSV/製表符數據)",
      commit: "添加組件",
      guide: [
        "選擇您的資產標識符。",
        "從 Excel 或終端貼入淨值/價格歷史。",
        "彙總多個資產以構建綜合指數。"
      ],
      vaulted: "資產庫存",
      empty: "隊列為空",
      points: "條記錄",
      execute: "執行彙總"
    }
  }[lang];

  const startReconciliation = () => {
    const dataset = mergeFundEntries(entries);
    if (dataset?.data.length) { setMergedDataset(dataset); setStep('reconcile'); }
  };

  const handleCommit = () => {
    if (currentCode && currentText) {
      setEntries(p => [...p, {
        code: currentCode,
        description: currentDescription || currentCode,
        rawText: currentText
      }]);
      setCurrentCode('');
      setCurrentDescription('');
      setCurrentText('');
    }
  };

  if (step === 'reconcile' && finalDatasetPreview) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in duration-700 transition-colors duration-500">
        <div className="glass-panel p-10 text-slate-900 dark:text-white shadow-2xl rounded-[2.5rem] border-black/5 dark:border-white/5 relative overflow-hidden backdrop-blur-3xl transition-colors duration-500">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none dark:text-white text-black">
            <ShieldCheck className="w-48 h-48" />
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10 font-bold">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 rounded-2xl glass-cta flex items-center justify-center text-white shadow-2xl">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">{t.auditTitle}</h2>
                <div className="flex gap-6 mt-2">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> {finalDatasetPreview.data.length} {t.validated}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <Bookmark className="w-3.5 h-3.5" /> {t.auditSub}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep('input')} className="px-6 py-3.5 glass-button-secondary rounded-xl text-xs font-black uppercase tracking-widest">{t.back}</button>
              <button onClick={() => onComplete(finalDatasetPreview)} className="px-10 py-3.5 glass-cta rounded-xl text-xs font-black uppercase tracking-[0.1em] shadow-indigo-500/20 flex items-center gap-3">
                {t.launch} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[2.5rem] border-black/5 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[650px] backdrop-blur-3xl transition-colors duration-500">
          <div className="w-full md:w-80 bg-white/40 dark:bg-black/20 p-10 border-r border-black/5 dark:border-white/5 space-y-12 transition-colors duration-500">
            <div className="flex items-center gap-3">
              <Wand2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">{t.policy}</h3>
            </div>
            <div className="space-y-4">
              {t.strategies.map(s => (
                <button
                  key={s.id}
                  onClick={() => setAlignmentStrategy(s.id as any)}
                  className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 ${alignmentStrategy === s.id ? 'border-indigo-500/50 bg-indigo-500/10 shadow-2xl shadow-indigo-500/10' : 'border-black/5 dark:border-white/5 opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">{s.label}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed tracking-wide">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-grow overflow-auto custom-scrollbar bg-black/5">
            <table className="w-full text-left border-collapse font-mono text-[11px]">
              <thead className="sticky top-0 bg-white/80 dark:bg-slate-900 shadow-xl z-20 border-b border-black/5 dark:border-white/5 backdrop-blur-md transition-colors duration-500">
                <tr>
                  <th className="p-6 bg-black/5 dark:bg-black/40 font-black uppercase text-slate-500 tracking-[0.2em]">{t.temporalIndex}</th>
                  {finalDatasetPreview.funds.map(f => (
                    <th key={f} className="p-6 font-black uppercase text-slate-900 dark:text-white tracking-widest bg-white/20 dark:bg-black/20">
                      <div className="flex flex-col">
                        <span className="text-indigo-600 dark:text-indigo-400">{f}</span>
                        <span className="text-[9px] text-slate-500 normal-case font-medium mt-1 tracking-tight">{finalDatasetPreview.metadata?.[f]?.description}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {finalDatasetPreview.data.map((row, i) => (
                  <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-6 font-black text-slate-900 dark:text-white border-r border-black/5 dark:border-white/5 tabular-nums tracking-wider">{row.date}</td>
                    {finalDatasetPreview.funds.map(f => (
                      <td key={f} className={`p-6 tabular-nums ${row[`_synthetic_${f}`] ? 'text-indigo-600 dark:text-indigo-400 font-black' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>
                        <div className="flex items-center justify-between">
                          {row[f] !== null ? (row[f] as number).toLocaleString(undefined, { minimumFractionDigits: 2 }) : (
                            <span className="text-slate-400 dark:text-slate-600 text-[10px] font-black italic tracking-widest">{t.absent}</span>
                          )}
                          {row[`_synthetic_${f}`] && <History className="w-4 h-4 opacity-40 ml-3" />}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-black/5 dark:divide-white/5 transition-colors duration-500">
      <div className="flex-grow p-10 lg:p-14 space-y-12">
        <div className="space-y-2">
          <div className="bg-indigo-500/10 px-3 py-1.5 rounded-xl text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-2 mb-3 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
            <Layers className="w-4 h-4" /> {t.assemblerSub}
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t.assembler}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
              <Hash className="w-4 h-4 text-indigo-600 dark:text-indigo-500" /> {t.symbol}
            </label>
            <input
              type="text"
              placeholder="e.g. BTC-USD"
              className="w-full px-5 py-4 glass-input rounded-2xl font-black focus:ring-indigo-500 transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 tracking-wider text-slate-900 dark:text-white shadow-inner"
              value={currentCode}
              onChange={e => setCurrentCode(e.target.value.toUpperCase())}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-500" /> {t.description}
            </label>
            <input
              type="text"
              placeholder="e.g. Digital Gold"
              className="w-full px-5 py-4 glass-input rounded-2xl font-bold focus:ring-indigo-500 transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 tracking-wide text-slate-900 dark:text-white shadow-inner"
              value={currentDescription}
              onChange={e => setCurrentDescription(e.target.value)}
            />
          </div>
          <div className="space-y-3 md:col-span-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
              <ClipboardPaste className="w-4 h-4 text-indigo-600 dark:text-indigo-500" /> {t.navSet}
            </label>
            <textarea
              placeholder="Date,Value..."
              className="w-full px-5 py-4 glass-input rounded-2xl font-mono text-xs h-40 focus:ring-indigo-500 transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner text-slate-900 dark:text-white"
              value={currentText}
              onChange={e => setCurrentText(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleCommit}
          disabled={!currentCode || !currentText}
          className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98] ${(!currentCode || !currentText) ? 'bg-black/5 dark:bg-white/5 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-black/5 dark:border-white/5' : 'glass-cta shadow-indigo-500/20'}`}
        >
          <PlusCircle className="w-5 h-5" /> {t.commit}
        </button>

        <div className="p-6 bg-white/40 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 flex gap-5 shadow-2xl backdrop-blur-md transition-colors duration-500">
          <Info className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed space-y-3 tracking-wide">
            {t.guide.map((g, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-indigo-600 dark:text-indigo-300 font-black">0{i + 1}</span>
                <span className="border-l border-black/10 dark:border-white/10 pl-3">{g}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full md:w-[420px] p-10 lg:p-14 bg-white/40 dark:bg-black/30 backdrop-blur-3xl border-l border-black/5 dark:border-white/5 flex flex-col transition-colors duration-500">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] animate-pulse"></div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400">{t.vaulted}</h4>
          </div>
          <span className="px-3 py-1 bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white text-[10px] font-black rounded-lg border border-black/5 dark:border-white/10 shadow-lg">{entries.length} Assets</span>
        </div>

        <div className="flex-grow space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          {!entries.length ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40 text-center space-y-6">
              <div className="p-8 bg-black/5 dark:bg-white/5 rounded-full backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-2xl">
                <LayoutGrid className="w-12 h-12 text-slate-400 dark:text-white" />
              </div>
              <p className="text-[10px] font-black text-slate-500 dark:text-white uppercase tracking-[0.4em]">{t.empty}</p>
            </div>
          ) : (
            entries.map((e, i) => (
              <div key={i} style={{ animationDelay: `${i * 100}ms` }} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-black/5 dark:border-white/5 flex justify-between items-center group animate-in fade-in slide-in-from-right-8 duration-700 ease-out fill-mode-both hover:-translate-y-1 hover:bg-white/20 dark:hover:bg-white/10 transition-all shadow-xl hover:shadow-indigo-500/5 hover:border-black/10 dark:hover:border-white/10">
                <div className="flex flex-col min-w-0">
                  <span className="font-black text-slate-900 dark:text-white text-sm tracking-widest truncate uppercase">{e.code}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold truncate block mb-2 tracking-wide">{e.description}</span>
                  <div className="flex items-center gap-2.5 text-[9px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest">
                    <Calendar className="w-3.5 h-3.5" />
                    {parseRawPastedData(e.rawText).length} {t.points}
                  </div>
                </div>
                <button onClick={() => setEntries(p => p.filter((_, idx) => idx !== i))} className="p-2.5 text-slate-400 dark:text-slate-600 hover:text-red-500 transition-all duration-300 ease-out hover:rotate-90 active:scale-75 shrink-0 border border-transparent hover:border-red-500/20 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={startReconciliation}
          disabled={!entries.length}
          className={`mt-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98] ${!entries.length ? 'bg-black/5 dark:bg-white/5 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-black/5 dark:border-white/5' : 'glass-cta shadow-indigo-500/20'}`}
        >
          {t.execute} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};