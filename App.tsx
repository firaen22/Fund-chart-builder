import React, { useState, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { FundChart } from './components/FundChart';
import { DataRestructurer } from './components/DataRestructurer';
import { parseCSV, normalizeDataset } from './utils/csvParser';
import { FundDataset, Language } from './types';
import { FinancialMetrics } from './components/FinancialMetrics';
import { ChatInterface } from './components/ChatInterface';
import { ApiKeyModal } from './components/ApiKeyModal';
import { analyzeFundData } from './services/gemini';
import {
  LineChart,
  BarChart3,
  RefreshCcw,
  DollarSign,
  Database,
  FileUp,
  Activity,
  TrendingUp,
  Zap,
  Globe,
  Settings,
  ShieldCheck
} from 'lucide-react';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [dataset, setDataset] = useState<FundDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'raw' | 'normalized'>('normalized');
  const [inputMode, setInputMode] = useState<'upload' | 'restructure'>('upload');

  // AI & API Key State
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const t = {
    en: {
      title: "Fund Chart Builder",
      subtitle: "Professional Analytics Engine",
      reset: "Reset Terminal",
      ingestion: "Data Ingestion",
      ingestionSub: "Connect your financial datasets to initialize professional-grade performance visualization.",
      upload: "CSV Upload",
      builder: "Asset Builder",
      review: "Performance Analytics",
      perfTitle: "Portfolio Overview",
      rebased: "Normalized (Base 100)",
      marketVal: "Nominal Values",
      records: "Data Points",
      assets: "Assets",
      window: "Date Range",
      registry: "Historical Ledger",
      to: "to",
      error: "Data parsing failed. Check format integrity."
    },
    cn: {
      title: "基金圖表構建器",
      subtitle: "專業分析引擎",
      reset: "重置控制台",
      ingestion: "數據導入",
      ingestionSub: "連接您的財務數據集，以初始化專業級的績效視覺化。",
      upload: "CSV 上傳",
      builder: "資產構建器",
      review: "績效分析",
      perfTitle: "投資組合概覽",
      rebased: "歸一化 (基準 100)",
      marketVal: "標稱價值",
      records: "數據點",
      assets: "資產數量",
      window: "日期範圍",
      registry: "歷史台賬",
      to: "至",
      error: "數據解析失敗。請檢查格式完整性。"
    }
  }[lang];

  const handleRunAnalysis = async () => {
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }

    if (!dataset) return;

    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await analyzeFundData(dataset, apiKey, lang);
      setAnalysis(result);
    } catch (err) {
      setAnalysis("Error generating analysis. Please check your API Key and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key);
    setShowKeyModal(false);
  };

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
    <div className="min-h-screen bg-surface-50 text-surface-900 selection:bg-brand-100 selection:text-brand-900" >
      <header className="sticky top-0 z-50 glass-effect border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 p-2 rounded-lg text-white">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-surface-900">
                {t.title}
              </h1>
              <p className="text-[10px] text-surface-500 font-medium uppercase tracking-wider">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-md border border-surface-200">
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'en' ? 'bg-white text-brand-700 shadow-sm border border-surface-200' : 'text-surface-500 hover:text-surface-900'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('cn')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'cn' ? 'bg-white text-brand-700 shadow-sm border border-surface-200' : 'text-surface-500 hover:text-surface-900'}`}
              >
                CN
              </button>
            </div>

            {dataset && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-surface-600 hover:text-brand-600 transition-colors bg-white border border-surface-200 rounded-md shadow-sm"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                {t.reset}
              </button>
            )}

            <button
              onClick={() => setShowKeyModal(true)}
              className="p-2 text-surface-500 hover:text-surface-900 transition-colors rounded-md hover:bg-surface-100"
              title="API Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <ApiKeyModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onSave={handleSaveKey}
        lang={lang}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!dataset || !chartDataset ? (
          <div className="space-y-10 flex flex-col items-center justify-center min-h-[60vh] py-12">
            <div className="text-center max-w-xl space-y-4">
              <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-100">
                <Globe className="w-8 h-8 text-brand-600" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-surface-900">{t.ingestion}</h2>
              <p className="text-surface-500 font-medium leading-relaxed">
                {t.ingestionSub}
              </p>
            </div>

            <div className="flex bg-surface-100 p-1 rounded-xl border border-surface-200 shadow-sm">
              <button
                onClick={() => setInputMode('upload')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${inputMode === 'upload' ? 'bg-white text-brand-700 shadow-md border border-surface-200' : 'text-surface-500 hover:text-surface-900'}`}
              >
                <FileUp className="w-4 h-4" />
                {t.upload}
              </button>
              <button
                onClick={() => setInputMode('restructure')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${inputMode === 'restructure' ? 'bg-white text-brand-700 shadow-md border border-surface-200' : 'text-surface-500 hover:text-surface-900'}`}
              >
                <Database className="w-4 h-4" />
                {t.builder}
              </button>
            </div>

            <div className="w-full max-w-4xl">
              {inputMode === 'upload' ? (
                <div className="bg-white rounded-3xl border border-surface-200 shadow-xl overflow-hidden p-2">
                  <FileUpload onDataLoaded={handleDataLoaded} lang={lang} />
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-surface-200 shadow-xl overflow-hidden p-2">
                  <DataRestructurer onComplete={handleRestructureComplete} lang={lang} />
                </div>
              )}
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm font-semibold flex items-center gap-3 animate-in fade-in zoom-in">
                <ShieldCheck className="w-5 h-5 text-red-500" />
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest bg-brand-50 px-2 py-0.5 rounded border border-brand-100">{t.review}</span>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-surface-900">{t.perfTitle}</h2>
              </div>

              <div className="bg-surface-100 p-1 rounded-xl border border-surface-200 shadow-sm flex items-center">
                <button
                  onClick={() => setViewMode('normalized')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'normalized'
                    ? 'bg-white text-brand-700 shadow-md border border-surface-200'
                    : 'text-surface-500 hover:text-surface-700'
                    }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  {t.rebased}
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'raw'
                    ? 'bg-white text-brand-700 shadow-md border border-surface-200'
                    : 'text-surface-500 hover:text-surface-700'
                    }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  {t.marketVal}
                </button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-surface-200 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                <Activity className="w-32 h-32 text-brand-600" />
              </div>
              <FundChart dataset={chartDataset} viewMode={viewMode} lang={lang} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm hover:shadow-md transition-shadow group">
                <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-2">{t.records}</span>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-extrabold text-surface-900">{dataset.data.length.toLocaleString()}</p>
                  <LineChart className="w-8 h-8 text-brand-200 group-hover:text-brand-400 transition-colors" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm hover:shadow-md transition-shadow group">
                <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-2">{t.assets}</span>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-extrabold text-surface-900">{dataset.funds.length}</p>
                  <Database className="w-8 h-8 text-brand-200 group-hover:text-brand-400 transition-colors" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm hover:shadow-md transition-shadow group">
                <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-2">{t.window}</span>
                <div className="flex items-end justify-between">
                  <p className="text-sm font-bold text-surface-900 leading-tight">
                    <span className="text-brand-600 tabular-nums">{dataset.data[0]?.date}</span>
                    <span className="block text-[10px] text-surface-400 my-0.5 uppercase tracking-tighter">{t.to}</span>
                    <span className="text-brand-600 tabular-nums">{dataset.data[dataset.data.length - 1]?.date}</span>
                  </p>
                  <Settings className="w-8 h-8 text-brand-200 group-hover:text-brand-400 transition-colors" />
                </div>
              </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <FinancialMetrics dataset={chartDataset} lang={lang} />
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-100">
              <ChatInterface
                analysis={analysis}
                isAnalyzing={isAnalyzing}
                onRunAnalysis={handleRunAnalysis}
                hasData={!!dataset}
                lang={lang}
              />
            </div>



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
          </div>
        )}
      </main>

      <footer className="py-16 text-center border-t border-surface-200 mt-20 bg-white">
        <div className="bg-brand-50 w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-brand-100">
          <Zap className="w-5 h-5 text-brand-600" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-surface-400">
          {lang === 'cn' ? '基金圖表構建器 — 企業版' : 'Fund Chart Builder — Enterprise Edition'}
        </p>
      </footer>
    </div >
  );
};

export default App;
