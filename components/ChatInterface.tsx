
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
    <div className="bg-white border border-bank-gold/10 shadow-2xl rounded-sm overflow-hidden mt-10 mb-12">
      <div className="px-8 py-5 border-b border-bank-gold/10 flex items-center justify-between bg-bank-navy">
        <div className="flex items-center gap-3">
          <Landmark className="w-5 h-5 text-bank-gold" />
          <h3 className="font-serif font-bold text-white text-lg tracking-wide">{t.title}</h3>
        </div>
        {!analysis && !isAnalyzing && (
          <button 
            onClick={onRunAnalysis}
            className="flex items-center gap-2 px-6 py-2.5 bg-bank-gold hover:bg-bank-goldLight text-bank-obsidian rounded-sm text-[10px] font-black uppercase tracking-[0.2em] transition-all"
          >
            {t.btn} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      
      <div className="p-10 bg-bank-cream/30">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-bank-gold mb-6" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">{t.loading}</p>
          </div>
        ) : analysis ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-1000">
             <div className="prose prose-slate max-w-none prose-sm font-light text-bank-navy/80 leading-relaxed first-letter:text-4xl first-letter:font-serif first-letter:font-bold first-letter:mr-1 first-letter:float-left">
               <ReactMarkdown>{analysis}</ReactMarkdown>
             </div>
             <div className="mt-12 pt-8 border-t border-bank-gold/10 flex items-center justify-between">
               <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                 <Briefcase className="w-3.5 h-3.5 text-bank-gold" />
                 {t.confidential}
               </div>
               <button 
                  onClick={onRunAnalysis}
                  className="text-[9px] text-bank-gold hover:text-bank-navy font-black uppercase tracking-[0.3em] flex items-center gap-2 transition-all"
               >
                 <PenTool className="w-3.5 h-3.5" /> {t.update}
               </button>
             </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-bank-cream w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-bank-gold/10">
              <Landmark className="w-10 h-10 text-bank-gold/40" />
            </div>
            <p className="text-bank-navy font-serif font-bold text-xl mb-2">{t.mandate}</p>
            <p className="text-slate-400 text-xs uppercase tracking-[0.2em] max-w-sm mx-auto font-medium">
              {t.mandateSub}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};