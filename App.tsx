import React, { useState, useMemo, Suspense, lazy } from 'react';
import { parseCSV, normalizeDataset } from './utils/csvParser';
import { FundDataset, Language } from './types';
import { ApiKeyModal } from './components/ApiKeyModal';
import { analyzeFundData } from './services/gemini';
import {
  LineChart,
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

const FileUpload = lazy(() => import('./components/FileUpload').then(m => ({ default: m.FileUpload })));
const FundChart = lazy(() => import('./components/FundChart').then(m => ({ default: m.FundChart })));
const DataRestructurer = lazy(() => import('./components/DataRestructurer').then(m => ({ default: m.DataRestructurer })));
const FinancialMetrics = lazy(() => import('./components/FinancialMetrics').then(m => ({ default: m.FinancialMetrics })));
const ChatInterface = lazy(() => import('./components/ChatInterface').then(m => ({ default: m.ChatInterface })));
const HistoricalRegistry = lazy(() => import('./components/HistoricalRegistry').then(m => ({ default: m.HistoricalRegistry })));
const AGIPortfolioManager = lazy(() => import('./components/AGIPortfolioManager').then(m => ({ default: m.AGIPortfolioManager })));

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [dataset, setDataset] = useState<FundDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'raw' | 'normalized'>('normalized');
  const [inputMode, setInputMode] = useState<'upload' | 'restructure'>('upload');
  const [dashboardTab, setDashboardTab] = useState<'analytics' | 'agi'>('analytics');

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
      error: "Data parsing failed. Check format integrity.",
      agiManager: "AGI Manager",
      analytics: "Analytics"
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
      error: "數據解析失敗。請檢查格式完整性。",
      agiManager: "AGI 管理器",
      analytics: "數據分析"
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
    <div className="min-h-screen text-slate-100 selection:bg-indigo-500/30 selection:text-white pb-20" >
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 3s infinite linear;
        }
      `}</style>
      <header className="sticky top-0 z-50 glass-panel border-b-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-500 p-2 rounded-lg text-white shadow-lg">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                {t.title}
              </h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'en' ? 'bg-white/10 text-white shadow-sm border border-white/10' : 'text-slate-400 hover:text-white'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('cn')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'cn' ? 'bg-white/10 text-white shadow-sm border border-white/10' : 'text-slate-400 hover:text-white'}`}
              >
                CN
              </button>
            </div>

            {dataset && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold glass-button-secondary rounded-lg"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                {t.reset}
              </button>
            )}

            <button
              onClick={() => setShowKeyModal(true)}
              className="p-2 text-slate-400 hover:text-white transition-colors rounded-md hover:bg-white/10"
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-600/10 blur-[120px] -z-10 rounded-full" />
        {!dataset || !chartDataset ? (
          <div className="space-y-10 flex flex-col items-center justify-center min-h-[60vh] py-12">
            <div className="text-center max-w-xl space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-2xl">
                <Globe className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-4xl font-black tracking-tight text-white mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">{t.ingestion}</h2>
              <p className="text-slate-400 font-medium leading-relaxed max-w-md mx-auto">
                {t.ingestionSub}
              </p>
            </div>

            <div className="flex bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 shadow-2xl">
              <button
                onClick={() => setInputMode('upload')}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${inputMode === 'upload' ? 'glass-cta shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <FileUp className="w-4 h-4" />
                {t.upload}
              </button>
              <button
                onClick={() => setInputMode('restructure')}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${inputMode === 'restructure' ? 'glass-cta shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Database className="w-4 h-4" />
                {t.builder}
              </button>
            </div>

            <div className="w-full max-w-4xl">
              <Suspense fallback={
                <div className="glass-panel rounded-[2rem] border-white/10 p-8 flex items-center justify-center min-h-[300px]">
                  <div className="w-8 h-8 border-2 border-white/5 border-t-white/30 rounded-full animate-spin"></div>
                </div>
              }>
                {inputMode === 'upload' ? (
                  <div className="glass-panel rounded-[2rem] border-white/5 overflow-hidden p-3 shadow-2xl">
                    <FileUpload onDataLoaded={handleDataLoaded} lang={lang} />
                  </div>
                ) : (
                  <div className="glass-panel rounded-[2rem] border-white/5 overflow-hidden p-3 shadow-2xl">
                    <DataRestructurer onComplete={handleRestructureComplete} lang={lang} />
                  </div>
                )}
              </Suspense>
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
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 shadow-2xl w-fit mb-6">
                  <button
                    onClick={() => setDashboardTab('analytics')}
                    className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl transition-all ${dashboardTab === 'analytics' ? 'bg-white/15 text-white shadow-lg border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <Activity className="w-4 h-4" />
                    {t.analytics}
                  </button>
                  <button
                    onClick={() => setDashboardTab('agi')}
                    className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl transition-all ${dashboardTab === 'agi' ? 'glass-cta' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <Zap className="w-4 h-4" />
                    {t.agiManager}
                  </button>
                </div>

                {dashboardTab === 'analytics' && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{t.review}</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-white">{t.perfTitle}</h2>
                  </>
                )}
              </div>

              {dashboardTab === 'analytics' && (
                <div className="bg-white/5 p-1 rounded-2xl border border-white/10 shadow-2xl flex items-center">
                  <button
                    onClick={() => setViewMode('normalized')}
                    className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${viewMode === 'normalized'
                      ? 'bg-white/15 text-white shadow-lg border border-white/10'
                      : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    {t.rebased}
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${viewMode === 'raw'
                      ? 'bg-white/15 text-white shadow-lg border border-white/10'
                      : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    {t.marketVal}
                  </button>
                </div>
              )}
            </div>

            {dashboardTab === 'agi' ? (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <Suspense fallback={<div className="h-64 glass-panel rounded-[2rem] border-white/5 animate-pulse"></div>}>
                  <AGIPortfolioManager dataset={chartDataset} lang={lang} />
                </Suspense>
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                  <Suspense fallback={<div className="h-64 glass-panel rounded-[2rem] border-white/5 animate-pulse"></div>}>
                    <ChatInterface
                      analysis={analysis}
                      isAnalyzing={isAnalyzing}
                      onRunAnalysis={handleRunAnalysis}
                      hasData={!!dataset}
                      lang={lang}
                    />
                  </Suspense>
                </div>
              </div>
            ) : (
              <>
                <div className="glass-panel p-8 rounded-[2rem] border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Activity className="w-48 h-48 text-indigo-400" />
                  </div>
                  <Suspense fallback={<div className="h-[500px] w-full animate-pulse bg-white/5 rounded-2xl"></div>}>
                    <FundChart dataset={chartDataset} viewMode={viewMode} lang={lang} />
                  </Suspense>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-panel p-6 rounded-2xl border-white/5 shadow-lg group glass-interactive">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{t.records}</span>
                    <div className="flex items-end justify-between">
                      <p className="text-3xl font-black text-white">{dataset.data.length.toLocaleString()}</p>
                      <LineChart className="w-8 h-8 text-indigo-400/20 group-hover:text-indigo-400/50 transition-colors" />
                    </div>
                  </div>
                  <div className="glass-panel p-6 rounded-2xl border-white/5 shadow-lg group glass-interactive">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{t.assets}</span>
                    <div className="flex items-end justify-between">
                      <p className="text-3xl font-black text-white">{dataset.funds.length}</p>
                      <Database className="w-8 h-8 text-indigo-400/20 group-hover:text-indigo-400/50 transition-colors" />
                    </div>
                  </div>
                  <div className="glass-panel p-6 rounded-2xl border-white/5 shadow-lg group glass-interactive">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{t.window}</span>
                    <div className="flex items-end justify-between">
                      <div className="text-sm font-bold text-white leading-tight">
                        <span className="text-indigo-300 tabular-nums">{dataset.data[0]?.date}</span>
                        <span className="block text-[10px] text-slate-500 my-0.5 uppercase tracking-tighter opacity-70">{t.to}</span>
                        <span className="text-indigo-300 tabular-nums">{dataset.data[dataset.data.length - 1]?.date}</span>
                      </div>
                      <Settings className="w-8 h-8 text-indigo-400/20 group-hover:text-indigo-400/50 transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  <Suspense fallback={<div className="h-64 glass-panel rounded-[2rem] border-white/5 animate-pulse"></div>}>
                    <FinancialMetrics dataset={chartDataset} lang={lang} />
                  </Suspense>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-100">
                  <Suspense fallback={<div className="h-64 glass-panel rounded-[2rem] border-white/5 animate-pulse"></div>}>
                    <ChatInterface
                      analysis={analysis}
                      isAnalyzing={isAnalyzing}
                      onRunAnalysis={handleRunAnalysis}
                      hasData={!!dataset}
                      lang={lang}
                    />
                  </Suspense>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-200">
                  <Suspense fallback={<div className="h-[400px] glass-panel rounded-[2rem] border-white/5 animate-pulse"></div>}>
                    <HistoricalRegistry dataset={dataset} lang={lang} />
                  </Suspense>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="py-20 text-center border-t border-white/5 mt-20 bg-black/40 backdrop-blur-xl">
        <div className="bg-white/5 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-lg">
          <Zap className="w-6 h-6 text-indigo-400" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">
          {lang === 'cn' ? '基金圖表構建器 — 企業版' : 'Fund Chart Builder — Enterprise Edition'}
        </p>
      </footer>
    </div >
  );
};

export default App;
