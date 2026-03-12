
import React, { useState, useRef, useEffect } from 'react';
import {
  Landmark,
  PenTool,
  Loader2,
  ChevronRight,
  Briefcase,
  Send,
  MessageSquare,
  Sparkles,
  TrendingDown,
  Shield,
  PieChart,
  BarChart3,
  Trash2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { FundDataset, Language } from '../types';
import { chatWithFundData, ConversationMessage } from '../services/gemini';

interface ChatInterfaceProps {
  analysis: string | null;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  hasData: boolean;
  lang: Language;
  dataset?: FundDataset | null;
  apiKey?: string;
}

interface ChatEntry {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  analysis,
  isAnalyzing,
  onRunAnalysis,
  hasData,
  lang,
  dataset,
  apiKey,
}) => {
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!hasData) return null;

  const t = {
    en: {
      title: "Analytic Briefing",
      btn: "Generate Perspective",
      loading: "Compiling Strategic Intelligence...",
      confidential: "Bespoke Quantitative Assessment — Confidential",
      update: "Request Update",
      mandate: "Awaiting Quantitative Mandate",
      mandateSub: "Initialize analysis to receive a high-conviction briefing.",
      followUp: "Ask a follow-up question...",
      send: "Send",
      chatLoading: "Analyzing...",
      presets: "Quick Analysis",
      clearChat: "Clear Chat",
      presetRisk: "Risk Budget Review",
      presetDrawdown: "Drawdown Analysis",
      presetPeer: "Peer Comparison",
      presetAllocation: "Allocation Advice",
      presetOutlook: "Outlook & Forecast",
      presetCloset: "Closet Indexing Check",
      noApiKey: "Please configure your Gemini API key in Settings to use the chat.",
    },
    cn: {
      title: "分析簡報",
      btn: "生成分析見解",
      loading: "正在編制戰略情報...",
      confidential: "定制量化評估 — 機密",
      update: "請求更新",
      mandate: "等待量化授權",
      mandateSub: "初始化分析以接收高確定性的投資簡報。",
      followUp: "提出後續問題...",
      send: "發送",
      chatLoading: "分析中...",
      presets: "快速分析",
      clearChat: "清除對話",
      presetRisk: "風險預算審查",
      presetDrawdown: "回撤分析",
      presetPeer: "同業比較",
      presetAllocation: "配置建議",
      presetOutlook: "展望與預測",
      presetCloset: "被動管理檢查",
      noApiKey: "請在設定中配置 Gemini API 金鑰以使用聊天功能。",
    },
  }[lang];

  const presets = [
    {
      label: t.presetRisk,
      icon: Shield,
      prompt: lang === 'cn'
        ? '請對每檔基金進行詳細的風險預算審查，包括波動率分配、追蹤誤差容忍度以及風險調整後回報評估。'
        : 'Please conduct a detailed risk budget review for each fund, including volatility allocation, tracking error tolerance, and risk-adjusted return assessment.',
    },
    {
      label: t.presetDrawdown,
      icon: TrendingDown,
      prompt: lang === 'cn'
        ? '分析每檔基金的回撤模式。最大回撤發生在何時？恢復期多長？與同業相比如何？'
        : 'Analyze the drawdown patterns for each fund. When did the max drawdown occur? How long was the recovery period? How does this compare to peers?',
    },
    {
      label: t.presetPeer,
      icon: BarChart3,
      prompt: lang === 'cn'
        ? '對所有基金進行同業比較分析。哪些基金表現優異？在風險調整基礎上，哪些基金提供了最佳價值？'
        : 'Perform a peer comparison analysis across all funds. Which funds are outperforming? On a risk-adjusted basis, which funds offer the best value?',
    },
    {
      label: t.presetAllocation,
      icon: PieChart,
      prompt: lang === 'cn'
        ? '根據風險指標和績效數據，建議最優投資組合配置。考慮多元化、相關性以及風險回報平衡。'
        : 'Based on the risk metrics and performance data, suggest an optimal portfolio allocation. Consider diversification, correlation, and risk-return tradeoffs.',
    },
    {
      label: t.presetOutlook,
      icon: Sparkles,
      prompt: lang === 'cn'
        ? '根據近期趨勢和動量指標（RSI、波動率趨勢），提供每檔基金的短期展望和預測。'
        : 'Based on recent trends and momentum indicators (RSI, volatility trends), provide a short-term outlook and forecast for each fund.',
    },
    {
      label: t.presetCloset,
      icon: Briefcase,
      prompt: lang === 'cn'
        ? '對主動管理基金進行被動管理（壁櫥指數化）檢測。哪些基金的活躍份額低、追蹤誤差小，可能不值得其主動管理費用？'
        : 'Perform a closet indexing detection on the actively managed funds. Which funds have low active share and tracking error that may not justify their active management fees?',
    },
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isChatLoading]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !dataset || !apiKey || isChatLoading) return;

    const userEntry: ChatEntry = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: message.trim(),
      timestamp: Date.now(),
    };

    setChatHistory(prev => [...prev, userEntry]);
    setInputValue('');
    setIsChatLoading(true);

    try {
      // Build history for the API (exclude the message we just added)
      const apiHistory: ConversationMessage[] = chatHistory.map(e => ({
        role: e.role,
        text: e.text,
      }));

      const response = await chatWithFundData(dataset, apiKey, apiHistory, message.trim(), lang);

      const modelEntry: ChatEntry = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: response,
        timestamp: Date.now(),
      };

      setChatHistory(prev => [...prev, modelEntry]);
    } catch (err) {
      const errorEntry: ChatEntry = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: lang === 'cn' ? '分析服務暫時不可用，請稍後再試。' : 'Analysis service unavailable. Please check your API key and try again.',
        timestamp: Date.now(),
      };
      setChatHistory(prev => [...prev, errorEntry]);
    } finally {
      setIsChatLoading(false);
      inputRef.current?.focus();
    }
  };

  const handlePresetClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const canChat = !!dataset && !!apiKey;

  return (
    <div className="glass-panel border-black/5 dark:border-white/5 shadow-3xl rounded-[2.5rem] overflow-hidden mt-12 mb-16 backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-8 duration-700 transition-colors duration-500">
      {/* Header */}
      <div className="px-10 py-7 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-white/5 transition-colors duration-500">
        <div className="flex items-center gap-4">
          <div className="glass-cta p-2.5 rounded-xl text-white shadow-xl shadow-indigo-500/20 flex items-center justify-center">
            <Landmark className="w-5 h-5" />
          </div>
          <h3 className="font-black text-slate-900 dark:text-white text-xl tracking-tight uppercase tracking-[0.15em]">{t.title}</h3>
        </div>
        <div className="flex items-center gap-3">
          {chatHistory.length > 0 && (
            <button
              onClick={() => setChatHistory([])}
              className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all px-3 py-2 hover:bg-rose-500/5 rounded-xl border border-transparent hover:border-rose-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" /> {t.clearChat}
            </button>
          )}
          {!analysis && !isAnalyzing && (
            <button
              onClick={onRunAnalysis}
              className="glass-cta flex items-center gap-3 px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.25em] transition-all duration-300 active:scale-[0.95] shadow-indigo-500/20"
            >
              {t.btn} <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          )}
        </div>
      </div>

      <div className="p-12 bg-white/20 dark:bg-black/10 transition-colors duration-500">
        {/* Initial analysis loading */}
        {isAnalyzing && !analysis ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
              <Loader2 className="w-12 h-12 animate-spin text-indigo-500 dark:text-indigo-400 relative z-10" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.5em] animate-pulse text-indigo-600 dark:text-indigo-400/80">{t.loading}</p>
          </div>
        ) : analysis ? (
          <div className="space-y-8">
            {/* Initial analysis */}
            <div className="animate-in fade-in slide-in-from-top-6 duration-1000">
              <div className="prose prose-slate dark:prose-invert prose-indigo max-w-none font-medium text-slate-700 dark:text-slate-300 leading-relaxed text-base prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:tracking-wide prose-strong:text-indigo-600 dark:prose-strong:text-indigo-400 prose-ul:list-disc transition-all">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
              <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-500 font-black uppercase tracking-[0.3em] bg-black/5 dark:bg-white/5 px-4 py-2 rounded-lg border border-black/5 dark:border-white/5">
                  <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-500" />
                  {t.confidential}
                </div>
                <button
                  onClick={onRunAnalysis}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-white font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-all px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl border border-transparent hover:border-black/5 dark:hover:border-white/5"
                >
                  <PenTool className="w-4 h-4" /> {t.update}
                </button>
              </div>
            </div>

            {/* Conversation history */}
            {chatHistory.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-black/5 dark:border-white/5">
                {chatHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-6 py-4 ${entry.role === 'user'
                        ? 'bg-indigo-500/10 border border-indigo-500/20 text-slate-900 dark:text-white'
                        : 'bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/5 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      {entry.role === 'user' ? (
                        <div className="flex items-start gap-3">
                          <MessageSquare className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                          <p className="text-sm font-semibold leading-relaxed">{entry.text}</p>
                        </div>
                      ) : (
                        <div className="prose prose-sm prose-slate dark:prose-invert prose-indigo max-w-none font-medium leading-relaxed prose-headings:text-slate-900 dark:prose-headings:text-white prose-strong:text-indigo-600 dark:prose-strong:text-indigo-400">
                          <ReactMarkdown>{entry.text}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator for chat */}
                {isChatLoading && (
                  <div className="flex justify-start animate-in fade-in duration-300">
                    <div className="bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl px-6 py-4 flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400">{t.chatLoading}</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            )}

            {/* Preset quick-analysis templates */}
            {chatHistory.length === 0 && canChat && (
              <div className="pt-6 border-t border-black/5 dark:border-white/5">
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  {t.presets}
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {presets.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => handlePresetClick(preset.prompt)}
                      disabled={isChatLoading}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] glass-button-secondary border border-black/5 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:border-indigo-500/20 hover:bg-indigo-500/5 transition-all duration-200 disabled:opacity-50"
                    >
                      <preset.icon className="w-3.5 h-3.5" />
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up input */}
            {canChat ? (
              <div className="pt-4">
                <div className="flex items-center gap-3 bg-white/40 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-2xl p-2 shadow-inner transition-colors focus-within:border-indigo-500/30 focus-within:shadow-indigo-500/5">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t.followUp}
                    disabled={isChatLoading}
                    className="flex-1 bg-transparent border-none text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-0 px-4 py-2 disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={!inputValue.trim() || isChatLoading}
                    className="glass-cta p-3 rounded-xl text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 text-center">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                  {t.noApiKey}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Empty state — no analysis yet */
          <div className="text-center py-20 group">
            <div className="bg-black/5 dark:bg-white/5 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-black/5 dark:border-white/5 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
              <Landmark className="w-12 h-12 text-slate-300 dark:text-slate-700 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
            </div>
            <p className="text-slate-900 dark:text-white font-black text-2xl mb-4 tracking-tight uppercase tracking-[0.1em]">{t.mandate}</p>
            <p className="text-slate-500 dark:text-slate-500 text-[11px] uppercase tracking-[0.35em] max-w-sm mx-auto font-bold leading-relaxed">
              {t.mandateSub}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
