
import React from 'react';
import { Landmark, PenTool, Loader2, ChevronRight, Briefcase } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Language } from '../types';

interface ChatInterfaceProps {
  analysis: string | null;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  hasData: boolean;
  lang: Language;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  analysis,
  isAnalyzing,
  onRunAnalysis,
  hasData,
  lang
}) => {
  if (!hasData) return null;

  const t = {
    en: {
      title: "Analytic Briefing",
      btn: "Generate Perspective",
      loading: "Compiling Strategic Intelligence...",
      confidential: "Bespoke Quantitative Assessment — Confidential",
      update: "Request Update",
      mandate: "Awaiting Quantitative Mandate",
      mandateSub: "Initialize analysis to receive a high-conviction briefing."
    },
    cn: {
      title: "分析简报",
      btn: "生成分析见解",
      loading: "正在编制战略情报...",
      confidential: "定制量化评估 — 机密",
      update: "请求更新",
      mandate: "等待量化授权",
      mandateSub: "初始化分析以接收高确定性的投资简报。"
    }
  }[lang];

  return (
    <div className="glass-panel border-white/5 shadow-3xl rounded-[2.5rem] overflow-hidden mt-12 mb-16 backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="px-10 py-7 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-4">
          <div className="glass-cta p-2.5 rounded-xl text-white shadow-xl shadow-indigo-500/20">
            <Landmark className="w-5 h-5" />
          </div>
          <h3 className="font-black text-white text-xl tracking-tight uppercase tracking-[0.15em]">{t.title}</h3>
        </div>
        {!analysis && !isAnalyzing && (
          <button
            onClick={onRunAnalysis}
            className="glass-cta flex items-center gap-3 px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.25em] transition-all duration-300 active:scale-[0.98] shadow-indigo-500/20"
          >
            {t.btn} <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        )}
      </div>

      <div className="p-12 bg-black/10">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
              <Loader2 className="w-12 h-12 animate-spin text-indigo-400 relative z-10" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.5em] animate-pulse text-indigo-400/80">{t.loading}</p>
          </div>
        ) : analysis ? (
          <div className="animate-in fade-in slide-in-from-top-6 duration-1000">
            <div className="prose prose-invert prose-indigo max-w-none font-medium text-slate-300 leading-relaxed text-base prose-headings:text-white prose-p:tracking-wide prose-strong:text-indigo-400 prose-ul:list-disc transition-all">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
            <div className="mt-16 pt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3 text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                {t.confidential}
              </div>
              <button
                onClick={onRunAnalysis}
                className="text-[10px] text-indigo-400 hover:text-white font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-all px-4 py-2 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5"
              >
                <PenTool className="w-4 h-4" /> {t.update}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 group">
            <div className="bg-white/5 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
              <Landmark className="w-12 h-12 text-slate-700 group-hover:text-indigo-400 transition-colors" />
            </div>
            <p className="text-white font-black text-2xl mb-4 tracking-tight uppercase tracking-[0.1em]">{t.mandate}</p>
            <p className="text-slate-500 text-[11px] uppercase tracking-[0.35em] max-w-sm mx-auto font-bold leading-relaxed">
              {t.mandateSub}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};