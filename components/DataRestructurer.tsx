
import React, { useState, useMemo } from 'react';
import { 
  Trash2, LayoutGrid, Info, Hash, 
  ClipboardPaste, Database, CheckSquare, History, Wand2,
  ShieldCheck, ArrowRight, Bookmark,
  Landmark, FileText
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
      auditTitle: "Timeline Integrity Audit",
      auditSub: "Professional Tier Reconciliation",
      validated: "Validated Windows",
      back: "Back",
      launch: "Launch Performance Hub",
      policy: "Audit Policy",
      strategies: [
        { id: 'forwardFill', label: 'Institutional Standard', desc: 'Synthesize missing intervals via Forward-Fill logic.' },
        { id: 'intersect', label: 'Strict Convergence', desc: 'Isolate intervals present across all constituents.' },
        { id: 'original', label: 'Unfiltered Aggregate', desc: 'Retain all raw data gaps.' }
      ],
      temporalIndex: "Master Temporal Index",
      absent: "ABSENT",
      assembler: "Portfolio Assembler",
      assemblerSub: "Bespoke Multi-Asset Construct",
      definition: "Asset Definition",
      symbol: "Asset Code",
      description: "Asset Description",
      navSet: "Temporal NAV Set",
      commit: "Commit Asset to Portfolio",
      guide: [
        "1. Extract NAV series from institutional terminal.",
        "2. Assign sovereign identifier and commit below.",
        "3. Aggregate constituents to generate consolidated briefing."
      ],
      vaulted: "Vaulted Constituents",
      empty: "Vault Empty",
      points: "Points Verified",
      execute: "Execute Reconciliation"
    },
    cn: {
      auditTitle: "時間線完整性審核",
      auditSub: "專業級對賬",
      validated: "經驗證的時間週期",
      back: "返回",
      launch: "進入績效中心",
      policy: "審計策略",
      strategies: [
        { id: 'forwardFill', label: '機構標準', desc: '通過前向填充邏輯合成缺失的時間間隔。' },
        { id: 'intersect', label: '嚴格收斂', desc: '僅保留所有資產共有的時間間隔。' },
        { id: 'original', label: '未過濾彙總', desc: '保留所有原始數據缺口。' }
      ],
      temporalIndex: "主時間索引",
      absent: "缺失",
      assembler: "資產組裝器",
      assemblerSub: "定制多資產結構",
      definition: "資產定義",
      symbol: "資產代碼",
      description: "資產描述",
      navSet: "淨值時間序列",
      commit: "將資產提交至組合",
      guide: [
        "1. 從機構終端提取淨值序列。",
        "2. 分配資產標識符並提交。",
        "3. 彙總各成分資產以生成綜合簡報。"
      ],
      vaulted: "已入庫資產",
      empty: "金庫為空",
      points: "個數據點經驗證",
      execute: "執行對賬"
    }
  }[lang];

  const startReconciliation = () => {
    const dataset = mergeFundEntries(entries);
    if (dataset?.data.length) { setMergedDataset(dataset); setStep('reconcile'); }
  };

  const handleCommit = () => {
    if(currentCode && currentText) { 
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
      <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
        <div className="bg-bank-navy p-10 text-white shadow-2xl rounded-sm border-t-8 border-bank-gold">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 rounded-full bg-bank-obsidian border border-bank-gold/20 flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-bank-gold" />
              </div>
              <div>
                <h2 className="text-3xl font-serif font-bold tracking-tight">{t.auditTitle}</h2>
                <div className="flex gap-6 mt-2 text-bank-gold/60 text-[10px] font-black uppercase tracking-widest">
                  <span className="flex items-center gap-2"><Database className="w-4 h-4" /> {finalDatasetPreview.data.length} {t.validated}</span>
                  <span className="flex items-center gap-2"><Bookmark className="w-4 h-4" /> {t.auditSub}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep('input')} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-sm font-bold text-[10px] uppercase tracking-widest transition-all">{t.back}</button>
              <button onClick={() => onComplete(finalDatasetPreview)} className="px-10 py-3 bg-bank-gold text-bank-obsidian rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-bank-goldLight transition-all">{t.launch}</button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-2xl border border-bank-gold/10 overflow-hidden flex flex-col md:flex-row min-h-[500px] rounded-sm">
          <div className="w-full md:w-80 bg-bank-cream p-10 border-r border-bank-gold/10 space-y-10">
            <h3 className="text-[10px] font-black text-bank-navy uppercase tracking-[0.3em] flex items-center gap-3"><Wand2 className="w-4 h-4 text-bank-gold" /> {t.policy}</h3>
            <div className="space-y-4">
              {t.strategies.map(s => (
                <button key={s.id} onClick={() => setAlignmentStrategy(s.id as any)} className={`w-full text-left p-6 rounded-sm border transition-all ${alignmentStrategy === s.id ? 'border-bank-gold bg-white shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <p className="text-xs font-black text-bank-navy uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-[10px] text-slate-500 italic leading-relaxed">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-grow overflow-auto">
            <table className="w-full text-left border-collapse font-mono text-[10px]">
              <thead className="sticky top-0 bg-white z-20 border-b border-bank-gold/10">
                <tr>
                  <th className="p-6 bg-bank-cream font-black uppercase text-bank-navy tracking-widest">{t.temporalIndex}</th>
                  {finalDatasetPreview.funds.map(f => (
                    <th key={f} className="p-6 font-black uppercase text-bank-navy tracking-widest">
                      {f}
                      <div className="text-[8px] opacity-40 font-serif normal-case tracking-normal">{finalDatasetPreview.metadata?.[f]?.description}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {finalDatasetPreview.data.map((row, i) => (
                  <tr key={i} className="hover:bg-bank-cream transition-colors">
                    <td className="p-6 font-bold text-bank-navy border-r border-slate-50">{row.date}</td>
                    {finalDatasetPreview.funds.map(f => (
                      <td key={f} className={`p-6 ${row[`_synthetic_${f}`] ? 'text-bank-gold font-black' : 'text-slate-600 font-medium'}`}>
                        <div className="flex items-center justify-between">
                          {row[f] !== null ? (row[f] as number).toLocaleString(undefined, {minimumFractionDigits: 2}) : t.absent}
                          {row[`_synthetic_${f}`] && <History className="w-3 h-3" />}
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
    <div className="w-full max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-serif font-bold text-bank-navy tracking-tight">{t.assembler}</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-bank-gold">{t.assemblerSub}</p>
      </div>

      <div className="bg-white shadow-2xl border border-bank-gold/10 flex flex-col md:flex-row min-h-[650px] rounded-sm">
        <div className="flex-grow p-12 space-y-10 bg-white">
          <h3 className="text-2xl font-serif font-bold text-bank-navy">{t.definition}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><Hash className="w-4 h-4 inline mr-2 text-bank-gold" /> {t.symbol}</label>
              <input type="text" placeholder="e.g. AURE-GROWTH" className="w-full px-6 py-4 bg-bank-cream/50 border border-bank-gold/10 font-bold focus:border-bank-gold outline-none transition-all rounded-sm text-sm" value={currentCode} onChange={e => setCurrentCode(e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><FileText className="w-4 h-4 inline mr-2 text-bank-gold" /> {t.description}</label>
              <input type="text" placeholder="e.g. Strategic Global Equities" className="w-full px-6 py-4 bg-bank-cream/50 border border-bank-gold/10 font-serif focus:border-bank-gold outline-none transition-all rounded-sm text-sm italic" value={currentDescription} onChange={e => setCurrentDescription(e.target.value)} />
            </div>
            <div className="space-y-3 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><ClipboardPaste className="w-4 h-4 inline mr-2 text-bank-gold" /> {t.navSet}</label>
              <textarea placeholder="Paste Index/Value pairs..." className="w-full px-6 py-4 bg-bank-cream/50 border border-bank-gold/10 font-mono text-[10px] h-[80px] focus:border-bank-gold outline-none transition-all rounded-sm resize-none" value={currentText} onChange={e => setCurrentText(e.target.value)} />
            </div>
          </div>
          <button onClick={handleCommit} disabled={!currentCode || !currentText} className="w-full py-5 bg-bank-navy hover:bg-bank-obsidian text-white rounded-sm font-black uppercase tracking-[0.3em] transition-all disabled:opacity-30 border border-bank-gold/20 shadow-xl">{t.commit}</button>
          
          <div className="p-6 bg-bank-cream border border-bank-gold/20 rounded-sm">
            <div className="flex gap-5">
              <Info className="w-6 h-6 text-bank-gold shrink-0" />
              <div className="text-[10px] text-bank-navy leading-relaxed space-y-2 uppercase font-bold tracking-wider">
                {t.guide.map((g, i) => <p key={i}>{g}</p>)}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-96 bg-bank-navy p-12 flex flex-col border-l border-bank-gold/20 text-white">
          <div className="flex items-center justify-between mb-10">
            <h4 className="text-[10px] font-black text-bank-gold uppercase tracking-[0.3em]">{t.vaulted} ({entries.length})</h4>
            <LayoutGrid className="w-4 h-4 text-bank-gold/40" />
          </div>
          <div className="flex-grow space-y-5 overflow-y-auto pr-2">
            {!entries.length ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-white">
                <Landmark className="w-12 h-12 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">{t.empty}</p>
              </div>
            ) : (
              entries.map((e, i) => (
                <div key={i} className="bg-white/5 p-5 rounded-sm border border-bank-gold/10 flex justify-between items-center group animate-in slide-in-from-right-4">
                  <div className="flex flex-col min-w-0">
                    <span className="font-serif font-bold text-lg text-bank-gold truncate">{e.code}</span>
                    <span className="text-[8px] text-slate-300 font-serif italic truncate block opacity-60 mb-1">{e.description}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{parseRawPastedData(e.rawText).length} {t.points}</span>
                  </div>
                  <button onClick={() => setEntries(p => p.filter((_, idx) => idx !== i))} className="p-2 text-white/20 hover:text-red-400 transition-all shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))
            )}
          </div>
          <button onClick={startReconciliation} disabled={!entries.length} className="mt-12 w-full py-6 bg-bank-gold text-bank-obsidian rounded-sm font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-all hover:bg-bank-goldLight disabled:opacity-20 shadow-2xl">{t.execute} <ArrowRight className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
};
