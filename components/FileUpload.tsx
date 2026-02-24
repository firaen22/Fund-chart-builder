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
    <div className="w-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-surface-200">
      <div className="flex-grow p-10 lg:p-14 space-y-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-brand-50 px-2 py-1 rounded text-brand-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
              <Lock className="w-3 h-3" /> Secure Ingestion
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-surface-900 tracking-tight">{t.gateway}</h2>
          <p className="text-surface-500 text-sm font-medium">{t.import}</p>
        </div>

        <div
          className={`relative flex flex-col items-center justify-center p-12 lg:p-16 border-2 border-dashed transition-all duration-300 ease-out rounded-3xl group ${dragActive ? 'border-brand-500 bg-brand-50/50 scale-[1.01] shadow-inner ring-4 ring-brand-500/20 animate-pulse' : 'border-surface-200 bg-surface-50/50 hover:border-brand-400 hover:bg-white'}`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        >
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-surface-200 mb-6 text-brand-600 group-hover:scale-110 group-hover:-translate-y-1 group-hover:shadow-md transition-all duration-300 ease-out">
            <CloudUpload className="w-10 h-10" />
          </div>
          <p className="text-surface-900 font-bold text-lg mb-1">{t.secure}</p>
          <p className="text-xs text-surface-400 mb-8 font-medium">{t.awaiting}</p>

          <label className="cursor-pointer bg-brand-600 hover:bg-brand-700 text-white py-3.5 px-8 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 flex items-center gap-3">
            {t.init}
            <input type="file" className="hidden" accept=".csv" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => onDataLoaded(generateDemoData())}
            className="flex items-center gap-2 text-[11px] font-bold text-surface-500 hover:text-brand-600 transition-all px-6 py-3 border border-surface-200 bg-white rounded-xl shadow-sm hover:border-brand-200"
          >
            <Play className="w-3.5 h-3.5" /> {t.sample}
          </button>
        </div>
      </div>

      <div className="w-full md:w-[380px] p-10 lg:p-14 bg-surface-50 flex flex-col justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
              <FileType className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-surface-900 uppercase tracking-widest">
              {t.standards}
            </h3>
          </div>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="mt-1 bg-white p-1.5 border border-surface-200 rounded-lg shadow-sm text-brand-600">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-surface-900 mb-1">{t.col1}</p>
                <p className="text-xs text-surface-500 leading-relaxed font-medium">{t.col1Desc}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 bg-white p-1.5 border border-surface-200 rounded-lg shadow-sm text-brand-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-surface-900 mb-1">{t.col2}</p>
                <p className="text-xs text-surface-500 leading-relaxed font-medium">{t.col2Desc}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="bg-white p-5 rounded-2xl border border-surface-200 font-mono text-[11px] text-surface-600 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 bg-brand-100 text-brand-700 px-2 py-1 text-[9px] font-bold uppercase rounded-bl-lg">
              {t.schema}
            </div>
            <div className="pt-2">
              <p className="text-surface-300 mb-1">// Date, Asset_A, Asset_B</p>
              <p className="text-surface-900 font-medium">2024-01-01, 104.22, 98.40</p>
              <p className="text-surface-900 font-medium">2024-01-02, 105.10, 98.15</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-brand-50 rounded-xl border border-brand-100 flex items-center gap-3">
            <Info className="w-4 h-4 text-brand-600 shrink-0" />
            <p className="text-[10px] font-semibold text-brand-800 leading-snug">
              Encrypted ingestion ensures data remains localized to your current browser session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};