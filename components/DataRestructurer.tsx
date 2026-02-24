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
      <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="bg-surface-900 p-8 text-white shadow-2xl rounded-3xl border border-surface-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.05]">
            <ShieldCheck className="w-32 h-32" />
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">{t.auditTitle}</h2>
                <div className="flex gap-4 mt-1">
                  <span className="text-surface-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Database className="w-3 h-3" /> {finalDatasetPreview.data.length} {t.validated}
                  </span>
                  <span className="text-brand-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Bookmark className="w-3 h-3" /> {t.auditSub}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('input')} className="px-5 py-2.5 bg-surface-800 hover:bg-surface-700 text-white rounded-xl text-xs font-bold transition-all border border-surface-700">{t.back}</button>
              <button onClick={() => onComplete(finalDatasetPreview)} className="px-8 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-lg transition-all duration-300 ease-out active:scale-[0.98] flex items-center gap-2 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-500 animate-shimmer hover:shadow-brand-500/25">
                {t.launch} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-surface-200 shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
          <div className="w-full md:w-80 bg-surface-50 p-10 border-r border-surface-200 space-y-10">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-brand-600" />
              <h3 className="text-[10px] font-bold text-surface-900 uppercase tracking-widest">{t.policy}</h3>
            </div>
            <div className="space-y-3">
              {t.strategies.map(s => (
                <button
                  key={s.id}
                  onClick={() => setAlignmentStrategy(s.id as any)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all ${alignmentStrategy === s.id ? 'border-brand-500 bg-white shadow-md ring-1 ring-brand-500' : 'border-surface-200 opacity-60 hover:opacity-100 hover:bg-white'}`}
                >
                  <p className="text-xs font-extrabold text-surface-900 uppercase tracking-tight mb-1">{s.label}</p>
                  <p className="text-[10px] text-surface-500 font-medium leading-relaxed">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-grow overflow-auto">
            <table className="w-full text-left border-collapse font-mono text-[11px]">
              <thead className="sticky top-0 bg-white z-20 border-b border-surface-200">
                <tr>
                  <th className="p-5 bg-surface-50 font-bold uppercase text-surface-400 tracking-widest">{t.temporalIndex}</th>
                  {finalDatasetPreview.funds.map(f => (
                    <th key={f} className="p-5 font-extrabold uppercase text-surface-900 tracking-tight">
                      <div className="flex flex-col">
                        <span>{f}</span>
                        <span className="text-[9px] text-surface-400 normal-case font-medium">{finalDatasetPreview.metadata?.[f]?.description}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {finalDatasetPreview.data.map((row, i) => (
                  <tr key={i} className="hover:bg-surface-50 transition-colors group">
                    <td className="p-5 font-bold text-surface-900 border-r border-surface-100 tabular-nums">{row.date}</td>
                    {finalDatasetPreview.funds.map(f => (
                      <td key={f} className={`p-5 tabular-nums ${row[`_synthetic_${f}`] ? 'text-brand-600 font-extrabold' : 'text-surface-600 font-medium'}`}>
                        <div className="flex items-center justify-between">
                          {row[f] !== null ? (row[f] as number).toLocaleString(undefined, { minimumFractionDigits: 2 }) : (
                            <span className="text-surface-300 text-[10px] font-bold italic">{t.absent}</span>
                          )}
                          {row[`_synthetic_${f}`] && <History className="w-3.5 h-3.5 opacity-50 ml-2" />}
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
    <div className="w-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-surface-200">
      <div className="flex-grow p-10 lg:p-14 space-y-10">
        <div className="space-y-1">
          <div className="bg-brand-50 px-2 py-1 rounded text-brand-600 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1 mb-2">
            <Layers className="w-3 h-3" /> {t.assemblerSub}
          </div>
          <h2 className="text-2xl font-extrabold text-surface-900 tracking-tight">{t.assembler}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-brand-500" /> {t.symbol}
            </label>
            <input
              type="text"
              placeholder="e.g. BTC-USD"
              className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl font-bold focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm placeholder:text-surface-300"
              value={currentCode}
              onChange={e => setCurrentCode(e.target.value.toUpperCase())}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-brand-500" /> {t.description}
            </label>
            <input
              type="text"
              placeholder="e.g. Digital Gold"
              className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl font-medium focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm placeholder:text-surface-300"
              value={currentDescription}
              onChange={e => setCurrentDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest flex items-center gap-2">
              <ClipboardPaste className="w-3.5 h-3.5 text-brand-500" /> {t.navSet}
            </label>
            <textarea
              placeholder="Date,Value..."
              className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl font-mono text-xs h-32 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none placeholder:text-surface-300"
              value={currentText}
              onChange={e => setCurrentText(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleCommit}
          disabled={!currentCode || !currentText}
          className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-surface-200 text-white rounded-xl font-bold text-sm transition-all duration-200 ease-out shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" /> {t.commit}
        </button>

        <div className="p-5 bg-surface-50 rounded-2xl border border-surface-200 flex gap-4">
          <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-surface-500 font-medium leading-relaxed space-y-2">
            {t.guide.map((g, i) => <div key={i} className="flex gap-2"><span>{i + 1}.</span>{g}</div>)}
          </div>
        </div>
      </div>

      <div className="w-full md:w-[380px] p-10 lg:p-14 bg-surface-900 text-white flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-400"></div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-400">{t.vaulted}</h4>
          </div>
          <span className="px-2 py-0.5 bg-brand-500/20 text-brand-300 text-[10px] font-bold rounded border border-brand-500/30">{entries.length}</span>
        </div>

        <div className="flex-grow space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          {!entries.length ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40 text-center space-y-4">
              <div className="p-4 bg-white/5 rounded-full backdrop-blur-sm border border-white/5">
                <LayoutGrid className="w-8 h-8 text-white" />
              </div>
              <p className="text-[10px] font-bold text-white uppercase tracking-widest">{t.empty}</p>
            </div>
          ) : (
            entries.map((e, i) => (
              <div key={i} style={{ animationDelay: `${i * 50}ms` }} className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-white/5 flex justify-between items-center group animate-in fade-in slide-in-from-right-8 duration-500 ease-out fill-mode-both hover:-translate-y-0.5 hover:bg-white/10 transition-all shadow-sm">
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-white text-sm tracking-tight truncate">{e.code}</span>
                  <span className="text-[10px] text-slate-300 font-medium truncate block mb-1">{e.description}</span>
                  <div className="flex items-center gap-1.5 text-[9px] text-brand-300 font-bold uppercase tracking-tighter">
                    <Calendar className="w-3 h-3" />
                    {parseRawPastedData(e.rawText).length} {t.points}
                  </div>
                </div>
                <button onClick={() => setEntries(p => p.filter((_, idx) => idx !== i))} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/20 rounded-lg transition-all duration-200 ease-out hover:scale-110 active:scale-90 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={startReconciliation}
          disabled={!entries.length}
        >
          {t.execute} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};