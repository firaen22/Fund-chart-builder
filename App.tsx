import React, { useState, useMemo, useEffect, useCallback, Suspense, lazy } from 'react';
import { parseCSV, normalizeDataset } from './utils/csvParser';
import { FundDataset, Language } from './types';
import { ApiKeyModal } from './components/ApiKeyModal';
import { analyzeFundData } from './services/gemini';
import { useKeyboardShortcuts, ShortcutAction } from './hooks/useKeyboardShortcuts';
import { ShortcutHelp } from './components/ShortcutHelp';
import {
  saveSession,
  loadSession,
  hasPersistedSession,
  getSessionAge,
  clearSession,
} from './utils/sessionPersistence';
import type { DateRange } from './components/DateRangeFilter';
import { detectAnomalies } from './utils/anomalyDetection';
import {
  CurrencyCode,
  detectFundCurrencies,
  convertDataset,
  getFxRates,
  getFxRatesSync,
} from './utils/currencySupport';
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
  ShieldCheck,
  Sun,
  Moon,
  RotateCcw,
  X as XIcon,
  Save,
  Keyboard,
  Calendar
} from 'lucide-react';

const FileUpload = lazy(() => import('./components/FileUpload').then(m => ({ default: m.FileUpload })));
const FundChart = lazy(() => import('./components/FundChart').then(m => ({ default: m.FundChart })));
const DataRestructurer = lazy(() => import('./components/DataRestructurer').then(m => ({ default: m.DataRestructurer })));
const FinancialMetrics = lazy(() => import('./components/FinancialMetrics').then(m => ({ default: m.FinancialMetrics })));
const ChatInterface = lazy(() => import('./components/ChatInterface').then(m => ({ default: m.ChatInterface })));
const HistoricalRegistry = lazy(() => import('./components/HistoricalRegistry').then(m => ({ default: m.HistoricalRegistry })));
const AGIPortfolioManager = lazy(() => import('./components/AGIPortfolioManager').then(m => ({ default: m.AGIPortfolioManager })));
const RollingAnalytics = lazy(() => import('./components/RollingAnalytics').then(m => ({ default: m.RollingAnalytics })));
const CorrelationMatrix = lazy(() => import('./components/CorrelationMatrix').then(m => ({ default: m.CorrelationMatrix })));
const DateRangeFilter = lazy(() => import('./components/DateRangeFilter').then(m => ({ default: m.DateRangeFilter })));
const AnomalyAlerts = lazy(() => import('./components/AnomalyAlerts').then(m => ({ default: m.AnomalyAlerts })));
const FundComparisonTable = lazy(() => import('./components/FundComparisonTable').then(m => ({ default: m.FundComparisonTable })));
const CurrencyManager = lazy(() => import('./components/CurrencyManager').then(m => ({ default: m.CurrencyManager })));

const App: React.FC = () => {
  // Restore persisted session on mount
  const [restoredFromSession] = useState(() => hasPersistedSession());
  const persisted = useMemo(() => loadSession(), []);

  const [lang, setLang] = useState<Language>(persisted.lang);
  const [dataset, setDataset] = useState<FundDataset | null>(persisted.dataset);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'raw' | 'normalized'>(persisted.viewMode);
  const [inputMode, setInputMode] = useState<'upload' | 'restructure'>(persisted.inputMode);
  const [dashboardTab, setDashboardTab] = useState<'analytics' | 'agi'>(persisted.dashboardTab);
  const [showRestoreBanner, setShowRestoreBanner] = useState(restoredFromSession);
  const [sessionAge] = useState(() => getSessionAge());

  // AI & API Key State
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(persisted.analysis);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Auto-save session whenever key state changes
  useEffect(() => {
    saveSession({ dataset, viewMode, inputMode, dashboardTab, lang, analysis });
  }, [dataset, viewMode, inputMode, dashboardTab, lang, analysis]);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as 'light' | 'dark';
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Date range filter
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });

  // Currency support
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>('USD');
  const [fundCurrencies, setFundCurrencies] = useState<Record<string, CurrencyCode>>({});
  const [fxRatesReady, setFxRatesReady] = useState(false);

  // Auto-detect fund currencies when dataset changes
  useEffect(() => {
    if (dataset) {
      setFundCurrencies(prev => {
        const detected = detectFundCurrencies(dataset);
        // Preserve user overrides, fill in new funds with auto-detected
        const merged = { ...detected };
        for (const [fund, code] of Object.entries(prev)) {
          if (dataset.funds.includes(fund)) merged[fund] = code;
        }
        return merged;
      });
    }
  }, [dataset]);

  // Fetch live FX rates on mount
  useEffect(() => {
    getFxRates().then(() => setFxRatesReady(true));
  }, []);

  const handleFundCurrencyChange = useCallback((fund: string, code: CurrencyCode) => {
    setFundCurrencies(prev => ({ ...prev, [fund]: code }));
  }, []);

  // Keyboard shortcuts
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  const shortcuts: ShortcutAction[] = useMemo(() => [
    {
      key: '?',
      shift: true,
      description: 'Toggle shortcut help',
      descriptionCn: '切換快捷鍵說明',
      category: 'action',
      handler: () => setShowShortcutHelp(prev => !prev),
    },
    {
      key: 'n',
      description: 'Switch to Normalized view',
      descriptionCn: '切換到歸一化視圖',
      category: 'view',
      handler: () => { if (dataset) setViewMode('normalized'); },
    },
    {
      key: 'm',
      description: 'Switch to Nominal Values view',
      descriptionCn: '切換到標稱價值視圖',
      category: 'view',
      handler: () => { if (dataset) setViewMode('raw'); },
    },
    {
      key: 'd',
      description: 'Toggle dark/light theme',
      descriptionCn: '切換深色/淺色主題',
      category: 'view',
      handler: () => setTheme(prev => prev === 'dark' ? 'light' : 'dark'),
    },
    {
      key: 'l',
      description: 'Toggle language (EN/CN)',
      descriptionCn: '切換語言 (EN/CN)',
      category: 'view',
      handler: () => setLang(prev => prev === 'en' ? 'cn' : 'en'),
    },
    {
      key: '1',
      description: 'Switch to Analytics tab',
      descriptionCn: '切換到分析標籤',
      category: 'navigation',
      handler: () => { if (dataset) setDashboardTab('analytics'); },
    },
    {
      key: '2',
      description: 'Switch to AGI Manager tab',
      descriptionCn: '切換到 AGI 管理器標籤',
      category: 'navigation',
      handler: () => { if (dataset) setDashboardTab('agi'); },
    },
    {
      key: 'r',
      description: 'Reset / clear data',
      descriptionCn: '重置 / 清除數據',
      category: 'action',
      handler: () => { if (dataset) handleReset(); },
    },
    {
      key: 'k',
      description: 'Open API key settings',
      descriptionCn: '開啟 API 金鑰設定',
      category: 'action',
      handler: () => setShowKeyModal(true),
    },
    {
      key: 'Escape',
      description: 'Close modals / panels',
      descriptionCn: '關閉彈窗 / 面板',
      category: 'navigation',
      handler: () => {
        setShowKeyModal(false);
        setShowShortcutHelp(false);
      },
    },
  ], [dataset]);

  useKeyboardShortcuts(shortcuts);

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
    setAnalysis(null);
    setDateRange({ start: null, end: null });
    setDisplayCurrency('USD');
    setFundCurrencies({});
    clearSession();
    setShowRestoreBanner(false);
  };

  // All unique sorted dates from the raw dataset (for the date picker bounds)
  const availableDates = useMemo(() => {
    if (!dataset) return [];
    return dataset.data.map(d => d.date as string);
  }, [dataset]);

  // Apply date range filter to the raw dataset BEFORE normalization
  const filteredDataset = useMemo(() => {
    if (!dataset) return null;
    const start = dateRange.start ?? '';
    const end = dateRange.end ?? '\uffff';
    const filtered = dataset.data.filter(d => (d.date as string) >= start && (d.date as string) <= end);
    if (filtered.length === 0) return dataset; // fallback: never show empty
    return { ...dataset, data: filtered };
  }, [dataset, dateRange]);

  // Apply FX conversion after date filtering, before normalization
  const fxConvertedDataset = useMemo(() => {
    if (!filteredDataset) return null;
    const rates = getFxRatesSync();
    return convertDataset(filteredDataset, fundCurrencies, displayCurrency, rates);
  }, [filteredDataset, fundCurrencies, displayCurrency, fxRatesReady]);

  const chartDataset = useMemo(() => {
    if (!fxConvertedDataset) return null;
    return viewMode === 'normalized' ? normalizeDataset(fxConvertedDataset) : fxConvertedDataset;
  }, [fxConvertedDataset, viewMode]);

  // Anomaly detection on the FX-converted (but non-normalized) dataset
  const anomalies = useMemo(() => {
    if (!fxConvertedDataset) return [];
    return detectAnomalies(fxConvertedDataset);
  }, [fxConvertedDataset]);

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30 selection:text-white pb-20 transition-colors duration-500" >
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
      <header className="sticky top-0 z-50 glass-panel border-b-black/5 dark:border-b-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-500 p-2 rounded-lg text-white shadow-lg">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {t.title}
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {dataset && (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 opacity-60" title={lang === 'cn' ? '自動保存已啟用' : 'Auto-save enabled'}>
                <Save className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                  {lang === 'cn' ? '已保存' : 'Saved'}
                </span>
              </div>
            )}

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-all rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-1 bg-black/5 dark:bg-black/40 p-1 rounded-xl border border-black/5 dark:border-white/5 shadow-inner">
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${lang === 'en' ? 'bg-white/80 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm border border-black/5 dark:border-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('cn')}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${lang === 'cn' ? 'bg-white/80 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm border border-black/5 dark:border-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
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
              onClick={() => setShowShortcutHelp(true)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-all rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
              title={lang === 'cn' ? '鍵盤快捷鍵 (?)' : 'Keyboard Shortcuts (?)'}
            >
              <Keyboard className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowKeyModal(true)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-all rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
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

      <ShortcutHelp
        isOpen={showShortcutHelp}
        onClose={() => setShowShortcutHelp(false)}
        shortcuts={shortcuts}
        lang={lang}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-600/10 blur-[120px] -z-10 rounded-full" />

        {/* Session Restored Banner */}
        {showRestoreBanner && dataset && (
          <div className="mb-6 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                <RotateCcw className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              </div>
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                {lang === 'cn'
                  ? `已恢復上次工作階段${sessionAge ? ` (${sessionAge})` : ''} — ${dataset.funds.length} 項資產, ${dataset.data.length.toLocaleString()} 筆資料點`
                  : `Previous session restored${sessionAge ? ` (${sessionAge})` : ''} — ${dataset.funds.length} asset${dataset.funds.length > 1 ? 's' : ''}, ${dataset.data.length.toLocaleString()} data points`}
              </p>
            </div>
            <button
              onClick={() => setShowRestoreBanner(false)}
              className="p-1.5 text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 hover:bg-indigo-500/10 rounded-lg transition-all"
              title="Dismiss"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}
        {!dataset || !chartDataset ? (
          <div className="space-y-10 flex flex-col items-center justify-center min-h-[60vh] py-12">
            <div className="text-center max-w-xl space-y-4">
              <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-black/5 dark:border-white/10 shadow-2xl">
                <Globe className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
              </div>
              <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-4 bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">{t.ingestion}</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md mx-auto">
                {t.ingestionSub}
              </p>
            </div>

            <div className="flex bg-white/40 dark:bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-black/5 dark:border-white/5 shadow-2xl">
              <button
                onClick={() => setInputMode('upload')}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${inputMode === 'upload' ? 'glass-cta shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
              >
                <FileUp className="w-4 h-4" />
                {t.upload}
              </button>
              <button
                onClick={() => setInputMode('restructure')}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${inputMode === 'restructure' ? 'glass-cta shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
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
                  <div className="glass-panel rounded-[2rem] border-black/5 dark:border-white/5 overflow-hidden p-3 shadow-2xl">
                    <FileUpload onDataLoaded={handleDataLoaded} onDatasetLoaded={handleRestructureComplete} lang={lang} />
                  </div>
                ) : (
                  <div className="glass-panel rounded-[2rem] border-black/5 dark:border-white/5 overflow-hidden p-3 shadow-2xl">
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
                <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/10 shadow-2xl w-fit mb-6">
                  <button
                    onClick={() => setDashboardTab('analytics')}
                    className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl transition-all ${dashboardTab === 'analytics' ? 'bg-white/80 dark:bg-white/15 text-slate-900 dark:text-white shadow-lg border border-black/5 dark:border-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    <Activity className="w-4 h-4" />
                    {t.analytics}
                  </button>
                  <button
                    onClick={() => setDashboardTab('agi')}
                    className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl transition-all ${dashboardTab === 'agi' ? 'glass-cta' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    <Zap className="w-4 h-4" />
                    {t.agiManager}
                  </button>
                </div>

                {dashboardTab === 'analytics' && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{t.review}</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{t.perfTitle}</h2>
                  </>
                )}
              </div>

              {dashboardTab === 'analytics' && (
                <div className="bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/10 shadow-2xl flex items-center">
                  <button
                    onClick={() => setViewMode('normalized')}
                    className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${viewMode === 'normalized'
                      ? 'bg-white/80 dark:bg-white/15 text-slate-900 dark:text-white shadow-lg border border-black/5 dark:border-white/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-slate-200'
                      }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    {t.rebased}
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${viewMode === 'raw'
                      ? 'bg-white/80 dark:bg-white/15 text-slate-900 dark:text-white shadow-lg border border-black/5 dark:border-white/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-slate-200'
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
                      dataset={chartDataset}
                      apiKey={apiKey}
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
                    <FundChart dataset={chartDataset} viewMode={viewMode} lang={lang} anomalies={anomalies} />
                  </Suspense>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-panel p-6 rounded-2xl border-black/5 dark:border-white/5 shadow-lg group glass-interactive">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest block mb-1">{t.records}</span>
                    <div className="flex items-end justify-between">
                      <p className="text-3xl font-black text-slate-900 dark:text-white">{(filteredDataset?.data.length ?? 0).toLocaleString()}</p>
                      <LineChart className="w-8 h-8 text-indigo-500/20 group-hover:text-indigo-500/50 transition-colors" />
                    </div>
                  </div>
                  <div className="glass-panel p-6 rounded-2xl border-black/5 dark:border-white/5 shadow-lg group glass-interactive">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest block mb-1">{t.assets}</span>
                    <div className="flex items-end justify-between">
                      <p className="text-3xl font-black text-slate-900 dark:text-white">{dataset.funds.length}</p>
                      <Database className="w-8 h-8 text-indigo-500/20 group-hover:text-indigo-500/50 transition-colors" />
                    </div>
                  </div>
                  <div className="glass-panel p-6 rounded-2xl border-black/5 dark:border-white/5 shadow-lg group glass-interactive">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest block mb-1">{t.window}</span>
                    <div className="flex items-end justify-between">
                      <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        <span className="text-indigo-600 dark:text-indigo-300 tabular-nums">{filteredDataset?.data[0]?.date}</span>
                        <span className="block text-[10px] text-slate-500 my-0.5 uppercase tracking-tighter opacity-70">{t.to}</span>
                        <span className="text-indigo-600 dark:text-indigo-300 tabular-nums">{filteredDataset?.data[filteredDataset.data.length - 1]?.date}</span>
                      </div>
                      <Calendar className="w-8 h-8 text-indigo-500/20 group-hover:text-indigo-400/50 transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Date Range Filter */}
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <Suspense fallback={<div className="h-20 glass-panel rounded-2xl border-white/5 animate-pulse"></div>}>
                    <DateRangeFilter
                      dateRange={dateRange}
                      onChange={setDateRange}
                      availableDates={availableDates}
                      lang={lang}
                    />
                  </Suspense>
                </div>

                {/* Currency Manager */}
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-50">
                  <Suspense fallback={<div className="h-20 glass-panel rounded-2xl border-white/5 animate-pulse"></div>}>
                    <CurrencyManager
                      displayCurrency={displayCurrency}
                      onDisplayCurrencyChange={setDisplayCurrency}
                      fundCurrencies={fundCurrencies}
                      onFundCurrencyChange={handleFundCurrencyChange}
                      funds={dataset.funds}
                      lang={lang}
                    />
                  </Suspense>
                </div>

                {/* Anomaly Alerts */}
                <div className="animate-in fade-in slide-in-from-bottom-7 duration-800">
                  <Suspense fallback={<div className="h-20 glass-panel rounded-2xl border-white/5 animate-pulse"></div>}>
                    <AnomalyAlerts dataset={fxConvertedDataset!} lang={lang} />
                  </Suspense>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  <Suspense fallback={<div className="h-64 glass-panel rounded-[2rem] border-white/5 animate-pulse"></div>}>
                    <FinancialMetrics dataset={chartDataset} lang={lang} />
                  </Suspense>
                </div>

                {/* Fund Comparison Table */}
                <div className="animate-in fade-in slide-in-from-bottom-9 duration-1000 delay-50">
                  <Suspense fallback={<div className="h-48 glass-panel rounded-2xl border-white/5 animate-pulse"></div>}>
                    <FundComparisonTable dataset={fxConvertedDataset!} lang={lang} />
                  </Suspense>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-75">
                  <Suspense fallback={<div className="h-64 glass-panel rounded-[2rem] border-white/5 animate-pulse"></div>}>
                    <RollingAnalytics dataset={chartDataset} lang={lang} />
                  </Suspense>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-11 duration-1000 delay-100">
                  <Suspense fallback={<div className="h-64 glass-panel rounded-[2rem] border-white/5 animate-pulse"></div>}>
                    <CorrelationMatrix dataset={chartDataset} lang={lang} />
                  </Suspense>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150">
                  <Suspense fallback={<div className="h-64 glass-panel rounded-[2rem] border-white/5 animate-pulse"></div>}>
                    <ChatInterface
                      analysis={analysis}
                      isAnalyzing={isAnalyzing}
                      onRunAnalysis={handleRunAnalysis}
                      hasData={!!dataset}
                      lang={lang}
                      dataset={chartDataset}
                      apiKey={apiKey}
                    />
                  </Suspense>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-200">
                  <Suspense fallback={<div className="h-[400px] glass-panel rounded-[2rem] border-white/5 animate-pulse"></div>}>
                    <HistoricalRegistry dataset={fxConvertedDataset!} lang={lang} />
                  </Suspense>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="py-20 text-center border-t border-black/5 dark:border-white/5 mt-20 bg-white/40 dark:bg-black/40 backdrop-blur-xl">
        <div className="bg-black/5 dark:bg-white/5 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-black/5 dark:border-white/10 shadow-lg">
          <Zap className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">
          {lang === 'cn' ? '基金圖表構建器 — 企業版' : 'Fund Chart Builder — Enterprise Edition'}
        </p>
      </footer>
    </div >
  );
};

export default App;
