import React, { useState } from 'react';
import { Shield, FileText, Play, Info, CheckCircle2, Calendar, Landmark, Lock } from 'lucide-react';
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
      gateway: "Data Integrity Gateway",
      import: "Standard Asset Record Import",
      secure: "Secure Document Transmission",
      awaiting: "Awaiting CSV format dataset",
      init: "Initialize Upload",
      sample: "Load Sample Portfolio",
      standards: "Compliance Standards",
      col1: "Index Column",
      col1Desc: "Mandatory Date field (ISO-8601). Temporal consistency is required.",
      col2: "Asset Values",
      col2Desc: "Discrete numeric NAV entries. Headers serve as Identifiers.",
      schema: "Standard Schema"
    },
    cn: {
      gateway: "數據完整性網關",
      import: "標準資產記錄導入",
      secure: "安全文檔傳輸",
      awaiting: "等待 CSV 格式數據集",
      init: "初始化上傳",
      sample: "加載示例組合",
      standards: "合規標準",
      col1: "索引列",
      col1Desc: "必須包含日期字段 (ISO-8601)。需要保持時間一致性。",
      col2: "資產價值",
      col2Desc: "離散數字淨值。表頭作為資產標識符。",
      schema: "標準架構"
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
    <div className="w-full max-w-3xl mx-auto space-y-12">
      <div className="bg-white p-12 shadow-2xl border-t-8 border-bank-gold rounded-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Landmark className="w-32 h-32" />
        </div>
        
        <div className="text-center mb-12">
          <div className="inline-flex p-4 bg-bank-navy text-bank-gold rounded-full mb-6 shadow-xl">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-bank-navy tracking-tight">{t.gateway}</h2>
          <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest font-bold">{t.import}</p>
        </div>

        <div 
          className={`relative flex flex-col items-center justify-center p-16 border-2 border-dashed transition-all duration-500 rounded-sm ${dragActive ? 'border-bank-gold bg-bank-cream scale-[1.01]' : 'border-slate-100 bg-slate-50/50 hover:border-bank-gold/40'}`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        >
          <div className="bg-white p-6 rounded-full shadow-lg mb-6 text-bank-navy border border-bank-gold/20">
             <FileText className="w-12 h-12" />
          </div>
          <p className="mb-2 text-xl font-serif text-bank-navy font-bold italic">{t.secure}</p>
          <p className="text-xs text-slate-400 mb-10 uppercase tracking-widest">{t.awaiting}</p>
          
          <label className="cursor-pointer bg-bank-navy hover:bg-bank-obsidian text-white py-5 px-12 rounded-sm text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 flex items-center gap-3 border border-bank-gold/30">
            {t.init}
            <input type="file" className="hidden" accept=".csv" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>
        </div>

        <div className="mt-12 flex items-center justify-center border-t border-slate-100 pt-10">
           <button 
             onClick={() => onDataLoaded(generateDemoData())} 
             className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-bank-gold hover:text-bank-navy transition-all px-8 py-3 border border-bank-gold/20 bg-bank-cream/50"
           >
             <Play className="w-4 h-4" /> {t.sample}
           </button>
        </div>
      </div>

      <div className="bg-bank-navy text-white p-12 shadow-2xl border-l-4 border-bank-gold rounded-sm">
        <h3 className="text-sm font-black mb-10 flex items-center gap-4 uppercase tracking-[0.4em]">
          <Shield className="w-6 h-6 text-bank-gold" />
          {t.standards}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-bank-obsidian p-2 text-bank-gold"><Calendar className="w-5 h-5" /></div>
              <div>
                <p className="font-bold text-xs uppercase tracking-widest text-white mb-1">{t.col1}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{t.col1Desc}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-bank-obsidian p-2 text-bank-gold"><CheckCircle2 className="w-5 h-5" /></div>
              <div>
                <p className="font-bold text-xs uppercase tracking-widest text-white mb-1">{t.col2}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{t.col2Desc}</p>
              </div>
            </div>
          </div>

          <div className="bg-bank-obsidian/40 p-6 border border-white/5 font-mono text-[10px] leading-relaxed relative">
            <div className="absolute top-0 right-0 bg-bank-gold text-bank-navy px-2 py-1 text-[8px] font-black uppercase">{t.schema}</div>
            <p className="text-bank-gold mb-2 opacity-50">// Date, Fund_A, Fund_B</p>
            <p className="text-white">2023-01-01,142.50,98.12</p>
            <p className="text-white">2023-01-02,143.10,98.05</p>
          </div>
        </div>
      </div>
    </div>
  );
};