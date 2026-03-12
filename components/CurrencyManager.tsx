import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import {
  CurrencyCode,
  CurrencyInfo,
  CURRENCIES,
  getFxRates,
  getFxRatesSync,
} from '../utils/currencySupport';
import { DollarSign, RefreshCw, ChevronDown, Info } from 'lucide-react';

interface CurrencyManagerProps {
  /** Current display currency */
  displayCurrency: CurrencyCode;
  onDisplayCurrencyChange: (code: CurrencyCode) => void;
  /** Per-fund source currency assignments */
  fundCurrencies: Record<string, CurrencyCode>;
  onFundCurrencyChange: (fund: string, code: CurrencyCode) => void;
  /** Fund names */
  funds: string[];
  lang: Language;
}

const CURRENCY_LIST = Object.values(CURRENCIES);

// Fund colors matching FundChart
const FUND_COLORS = [
  '#4a57f2', '#0d9488', '#db2777', '#ea580c', '#7c3aed', '#2563eb',
];

export const CurrencyManager: React.FC<CurrencyManagerProps> = ({
  displayCurrency,
  onDisplayCurrencyChange,
  fundCurrencies,
  onFundCurrencyChange,
  funds,
  lang,
}) => {
  const [ratesLoaded, setRatesLoaded] = useState(false);
  const [showFundAssignments, setShowFundAssignments] = useState(false);
  const rates = getFxRatesSync();

  // Fetch live rates on mount
  useEffect(() => {
    getFxRates().then(() => setRatesLoaded(true));
  }, []);

  const t = lang === 'cn'
    ? {
        title: '幣種管理',
        display: '顯示幣種',
        fundAssign: '基金原始幣種',
        showAssign: '設定基金幣種',
        hideAssign: '隱藏',
        autoDetected: '自動偵測',
        rate: '匯率',
        live: '即時',
        static: '靜態',
      }
    : {
        title: 'Currency Manager',
        display: 'Display Currency',
        fundAssign: 'Fund Source Currencies',
        showAssign: 'Assign Fund Currencies',
        hideAssign: 'Hide',
        autoDetected: 'Auto-detected',
        rate: 'Rate',
        live: 'Live',
        static: 'Static',
      };

  return (
    <div className="glass-panel p-5 rounded-2xl border-black/5 dark:border-white/5 shadow-lg">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg">
              <DollarSign className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {t.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${ratesLoaded ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
              {ratesLoaded ? t.live : t.static}
            </span>
          </div>
        </div>

        {/* Display currency selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {t.display}:
          </span>
          {CURRENCY_LIST.map(cur => (
            <button
              key={cur.code}
              onClick={() => onDisplayCurrencyChange(cur.code)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all border ${
                displayCurrency === cur.code
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 border-transparent hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span className="mr-1">{cur.symbol}</span>
              {cur.code}
            </button>
          ))}
        </div>

        {/* FX rate preview for selected currency */}
        {displayCurrency !== 'USD' && (
          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-500">
            <Info className="w-3 h-3" />
            <span className="tabular-nums">
              1 USD = {rates[displayCurrency]?.toFixed(4) ?? '—'} {displayCurrency}
            </span>
          </div>
        )}

        {/* Toggle fund assignments */}
        <button
          onClick={() => setShowFundAssignments(!showFundAssignments)}
          className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 py-1.5 px-2 rounded-lg transition-all w-fit"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${showFundAssignments ? 'rotate-180' : ''}`} />
          {showFundAssignments ? t.hideAssign : t.showAssign}
        </button>

        {/* Per-fund currency assignment */}
        {showFundAssignments && (
          <div className="space-y-2 pt-1 border-t border-black/5 dark:border-white/5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              {t.fundAssign}
            </span>
            {funds.map((fund, idx) => {
              const color = FUND_COLORS[idx % FUND_COLORS.length];
              const current = fundCurrencies[fund] ?? 'USD';
              return (
                <div key={fund} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate flex-1 min-w-0 max-w-[160px]">
                    {fund}
                  </span>
                  <select
                    value={current}
                    onChange={(e) => onFundCurrencyChange(fund, e.target.value as CurrencyCode)}
                    className="text-[11px] font-bold px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                  >
                    {CURRENCY_LIST.map(cur => (
                      <option key={cur.code} value={cur.code}>
                        {cur.symbol} {cur.code}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
