import React, { useState } from 'react';
import { CloudUpload, FileText, Play, Info, CheckCircle2, Calendar, FileType, Lock, ArrowRight } from 'lucide-react';
import { generateDemoData } from '../utils/csvParser';
import { Language } from '../types';

interface FileUploadProps {
  onDataLoaded: (csvContent: string) => void;
  lang: Language;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, lang }) => {
  const [dragActive, setDragActive] = useState(false);

  const t = {
    en: {
      gateway: "Upload Dataset",
      import: "Initialize performance analytics",
      secure: "Drag & drop CSV records",
      awaiting: "Supports comma-separated NAV history",
      init: "Select File",
      sample: "Try Sample Dataset",
      standards: "Schema Requirements",
      col1: "Time Index",
      col1Desc: "Date column must be first (YYYY-MM-DD or ISO-8601).",
      col2: "Asset Identifiers",
      col2Desc: "Numerical NAV values in subsequent columns.",
      schema: "Valid Format"
    },
    cn: {
      gateway: "上傳數據集",
      import: "初始化績效分析",
      secure: "拖放 CSV 紀錄",
      awaiting: "支持以逗號分隔的淨值歷史",
      init: "選擇文件",
      sample: "嘗試示例數據",
      standards: "架構要求",
      col1: "時間索引",
      col1Desc: "日期列必須位於第一列 (YYYY-MM-DD 或 ISO-8601)。",
      col2: "資產標識符",
      col2Desc: "後續列中的數值淨值。",
      schema: "有效格式"
    }
  }[lang];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => e.target?.result && onDataLoaded(e.target.result as string);
    reader.readAsText(file);
  };

  return (
    <div className="w-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/5">
      <div className="flex-grow p-10 lg:p-14 space-y-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-indigo-500/10 px-2 py-1 rounded text-indigo-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 border border-indigo-500/20">
              <Lock className="w-3 h-3" /> Secure Ingest
            </div>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">{t.gateway}</h2>
          <p className="text-slate-400 text-sm font-medium">{t.import}</p>
        </div>

        <div
          className={`relative flex flex-col items-center justify-center p-12 lg:p-16 border-2 transition-all duration-300 ease-out rounded-[2rem] group backdrop-blur-xl ${dragActive ? 'bg-indigo-500/10 border-indigo-500/50 scale-[1.01] shadow-[0_0_50px_rgba(99,102,241,0.2)] animate-pulse' : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10'}`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        >
          <div className="bg-white/5 p-6 rounded-2xl shadow-2xl border border-white/10 mb-6 text-indigo-400 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-500 ease-out backdrop-blur-md">
            <CloudUpload className="w-12 h-12" />
          </div>
          <p className="text-white font-black text-xl mb-1 tracking-tight">{t.secure}</p>
          <p className="text-xs text-slate-400 mb-10 font-medium tracking-wide">{t.awaiting}</p>

          <label className="cursor-pointer glass-cta py-4 px-10 rounded-xl text-sm font-bold shadow-2xl flex items-center gap-3">
            {t.init}
            <input type="file" className="hidden" accept=".csv" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={() => onDataLoaded(generateDemoData())}
            className="flex items-center gap-2 text-[11px] font-bold glass-button-secondary px-8 py-3.5 rounded-xl uppercase tracking-widest"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> {t.sample}
          </button>
        </div>
      </div>

      <div className="w-full md:w-[380px] p-10 lg:p-14 bg-black/20 backdrop-blur-3xl flex flex-col justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="glass-cta w-10 h-10 rounded-xl flex items-center justify-center">
              <FileType className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">
              {t.standards}
            </h3>
          </div>

          <div className="space-y-10">
            <div className="flex items-start gap-4">
              <div className="mt-1 bg-white/5 p-2 border border-white/10 rounded-xl text-indigo-400 shadow-xl">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="font-black text-xs text-white mb-1 uppercase tracking-wider">{t.col1}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{t.col1Desc}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 bg-white/5 p-2 border border-white/10 rounded-xl text-indigo-400 shadow-xl">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-black text-xs text-white mb-1 uppercase tracking-wider">{t.col2}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{t.col2Desc}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="bg-black/40 p-6 rounded-2xl border border-white/5 font-mono text-[11px] text-slate-400 relative overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="absolute top-0 right-0 bg-white/5 text-white/50 px-3 py-1.5 text-[9px] font-black uppercase rounded-bl-xl border-l border-b border-white/5">
              {t.schema}
            </div>
            <div className="pt-4">
              <p className="text-slate-600 mb-2">// Date, Asset_A, Asset_B</p>
              <p className="text-indigo-300 font-medium">2024-01-01, 104.22, 98.40</p>
              <p className="text-indigo-300 font-medium opacity-80">2024-01-02, 105.10, 98.15</p>
            </div>
          </div>

          <div className="mt-8 p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex items-start gap-4 shadow-xl">
            <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-slate-400 leading-normal uppercase tracking-wider">
              Encrypted ingestion ensures data remains localized to your current session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};