import React, { useState, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { FundChart } from './components/FundChart';
import { DataRestructurer } from './components/DataRestructurer';
import { parseCSV, normalizeDataset } from './utils/csvParser';
import { FundDataset, Language } from './types';
import { 
  Compass, 
  BarChart3, 
  RefreshCw, 
  DollarSign, 
  Database, 
  FileUp, 
  ShieldCheck,
  TrendingUp,
  Award
} from 'lucide-react';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [dataset, setDataset] = useState<FundDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'raw' | 'normalized'>('normalized');
  const [inputMode, setInputMode] = useState<'upload' | 'restructure'>('upload');

  const t = {
    en: {
      title: "Fund Chart Builder",
      subtitle: "Institutional Asset Visualization",
      reset: "Reset Terminal",
      ingestion: "Portfolio Ingestion",
      ingestionSub: "Securely import your financial data to begin high-conviction quantitative auditing.",
      upload: "Secure Upload",
      builder: "Asset Builder",
      review: "Quantitative Review",
      perfTitle: "Portfolio Performance",
      rebased: "Index 100",
      marketVal: "Market Value",
      records: "Ingested Records",
      assets: "Constituent Assets",
      window: "Fiscal Window",
      registry: "Transaction Registry (Sample)",
      to: "to",
      error: "Security protocols prevented parsing."
    },
    cn: {
      title: "基金圖表構建器",
      subtitle: "機構級資產視覺化中心",
      reset: "重置終端",
      ingestion: "資產數據錄入",
      ingestionSub: "安全導入您的財務數據，開始高標準的量化審計。",
      upload: "安全上傳",
      builder: "資產構建器",
      review: "量化評估",
      perfTitle: "投資組合表現",
      rebased: "基準 100",
      marketVal: "市場價值",
      records: "錄入紀錄",
      assets: "成分資產",
      window: "財政週期",
      registry: "交易紀錄（示例）",
      to: "至",
      error: "安全協議阻止了數據解析。"
    }
  }[lang];

  const handleDataLoaded = async (content: string) => {
    setError(null);
    try {
      const parsed = parseCSV(content);
      setDataset(parsed);
    } catch (err) {
      setError(t.error);
      setDataset(null);
    }
  };

  const handleRestructureComplete = async (mergedDataset: FundDataset) => {
    setError(null);
    setDataset(mergedDataset);
  };

  const handleReset = () => {
    setDataset(null);
    setError(null);
    setViewMode('normalized');
  };

  const chartDataset = useMemo(() => {
    if (!dataset) return null;
    return viewMode === 'normalized' ? normalizeDataset(dataset) : dataset;
  }, [dataset, viewMode]);

  return (
    <div className="min-h-screen font-sans">
      <header className="bg-bank-obsidian border-b border-bank-gold/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-bank-gold p-2.5 rounded-sm">
              <Compass className="w-6 h-6 text-bank-obsidian" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-white tracking-widest uppercase">
                {t.title}
              </h1>
              <p className="text-[10px] text-bank-gold font-bold uppercase tracking-[0.2em] opacity-80">
                {t.subtitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex bg-white/5 p-1 rounded-sm border border-white/10">
              <button 
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-[9px] font-black tracking-widest uppercase rounded-sm transition-all ${lang === 'en' ? 'bg-bank-gold text-bank-obsidian' : 'text-white/40 hover:text-white'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLang('cn')}
                className={`px-3 py-1 text-[9px] font-black tracking-widest uppercase rounded-sm transition-all ${lang === 'cn' ? 'bg-bank-gold text-bank-obsidian' : 'text-white/40 hover:text-white'}`}
              >
                繁體
              </button>
            </div>

            {dataset && (
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 text-xs text-bank-gold/60 hover:text-bank-gold transition-colors font-bold uppercase tracking-widest"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t.reset}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!dataset || !chartDataset ? (
          <div className="space-y-12 flex flex-col items-center justify-center min-h-[70vh]">
            <div className="text-center max-w-2xl space-y-4">
              <Award className="w-12 h-12 text-bank-gold mx-auto mb-2 opacity-50" />
              <h2 className="text-4xl font-serif font-bold text-bank-navy">{t.ingestion}</h2>
              <p className="text-slate-500 font-light text-lg">
                {t.ingestionSub}
              </p>
            </div>

            <div className="flex bg-white p-1 rounded-sm border border-bank-gold/30 shadow-sm">
                <button 
                    onClick={() => setInputMode('upload')}
                    className={`flex items-center gap-3 px-8 py-3 rounded-sm text-xs font-bold uppercase tracking-widest transition-all ${inputMode === 'upload' ? 'bg-bank-navy text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <FileUp className="w-4 h-4" />
                    {t.upload}
                </button>
                <button 
                    onClick={() => setInputMode('restructure')}
                    className={`flex items-center gap-3 px-8 py-3 rounded-sm text-xs font-bold uppercase tracking-widest transition-all ${inputMode === 'restructure' ? 'bg-bank-navy text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Database className="w-4 h-4" />
                    {t.builder}
                </button>
            </div>

            <div className="w-full max-w-4xl">
              {inputMode === 'upload' ? (
                  <FileUpload onDataLoaded={handleDataLoaded} lang={lang} />
              ) : (
                  <DataRestructurer onComplete={handleRestructureComplete} lang={lang} />
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-900 border border-red-200 font-medium text-sm flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-red-500" />
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                   <div className="h-1 w-8 bg-bank-gold"></div>
                   <span className="text-[10px] font-black text-bank-gold uppercase tracking-[0.3em]">{t.review}</span>
                </div>
                <h2 className="text-4xl font-serif font-bold text-bank-navy">{t.perfTitle}</h2>
              </div>
              
              <div className="bg-white p-1.5 rounded-sm border border-bank-gold/20 shadow-sm flex">
                <button
                  onClick={() => setViewMode('normalized')}
                  className={`flex items-center gap-2 px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all ${
                    viewMode === 'normalized' 
                      ? 'bg-bank-navy text-white' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  {t.rebased}
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`flex items-center gap-2 px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all ${
                    viewMode === 'raw' 
                      ? 'bg-bank-navy text-white' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  {t.marketVal}
                </button>
              </div>
            </div>

            <div className="glass-card p-8 rounded-sm shadow-xl">
              <FundChart dataset={chartDataset} viewMode={viewMode} lang={lang} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 border-l-4 border-bank-gold shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">{t.records}</span>
                  <p className="text-3xl font-serif font-bold text-bank-navy">{dataset.data.length.toLocaleString()}</p>
               </div>
               <div className="bg-white p-6 border-l-4 border-bank-gold shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">{t.assets}</span>
                  <p className="text-3xl font-serif font-bold text-bank-navy">{dataset.funds.length}</p>
               </div>
               <div className="bg-white p-6 border-l-4 border-bank-gold shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">{t.window}</span>
                  <div className="flex items-end justify-between">
                    <p className="text-sm font-bold text-bank-navy leading-tight uppercase tracking-tighter">
                      {dataset.data[0]?.date}<br/>
                      <span className="text-bank-gold">{t.to}</span><br/>
                      {dataset.data[dataset.data.length - 1]?.date}
                    </p>
                    <Database className="w-8 h-8 text-bank-gold opacity-30" />
                  </div>
               </div>
            </div>

            <div className="bg-white border border-bank-gold/10 overflow-hidden shadow-2xl rounded-sm">
              <div className="px-6 py-4 bg-bank-navy border-b border-bank-gold/20 flex items-center justify-between">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">{t.registry}</h3>
                <BarChart3 className="w-4 h-4 text-bank-gold" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">{lang === 'cn' ? '估值日期' : 'Valuation Date'}</th>
                      {dataset.funds.map(f => <th key={f} className="px-6 py-4">{f}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-xs">
                    {dataset.data.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-bank-cream transition-colors">
                        <td className="px-6 py-4 font-bold text-bank-navy">{row.date}</td>
                        {dataset.funds.map(f => (
                          <td key={f} className="px-6 py-4 text-slate-600">
                              {row[f] !== null && row[f] !== undefined ? (row[f] as number).toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="py-20 text-center border-t border-bank-gold/10 mt-20">
        <Compass className="w-8 h-8 text-bank-gold mx-auto mb-6 opacity-40" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-bank-navy opacity-60">
          {lang === 'cn' ? '基金圖表構建器 — 私人' : 'Fund Chart Builder — Confidential'}
        </p>
      </footer>
    </div>
  );
};

export default App;