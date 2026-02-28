import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Label
} from 'recharts';
import { FundDataset, Language } from '../types';
import { X, FileText, Target, MessageSquarePlus, Eye, EyeOff, Calendar } from 'lucide-react';

interface FundChartProps {
  dataset: FundDataset;
  viewMode?: 'raw' | 'normalized';
  lang: Language;
}

// Modern professional color palette
const COLORS = [
  '#4a57f2', // Indigo
  '#0d9488', // Teal
  '#db2777', // Pink
  '#ea580c', // Orange
  '#7c3aed', // Violet
  '#2563eb', // Blue
];

export const FundChart: React.FC<FundChartProps> = ({ dataset, viewMode = 'raw', lang }) => {
  const [annotations, setAnnotations] = useState<Record<string, string>>({});
  const [showLabels, setShowLabels] = useState(true);

  const t = {
    en: {
      indexed: "Indexed Performance (Base 100)",
      absolute: "Nominal Asset Value",
      audit: "Real-time Comparative Audit",
      probe: "Data Inspector",
      spotTitle: "Regional Market Analysis",
      notePlaceholder: "Add context note...",
      eventLabel: "Annotation (Optional)",
      toggleShow: "Show Annotations",
      toggleHide: "Hide Annotations"
    },
    cn: {
      indexed: "歸一化績效 (基準 100)",
      absolute: "標稱資產價值",
      audit: "實時比較審計",
      probe: "數據探測器",
      spotTitle: "市場分析摘要",
      notePlaceholder: "添加背景備註...",
      eventLabel: "備註 (可選)",
      toggleShow: "顯示備註",
      toggleHide: "隱藏備註"
    }
  }[lang];

  const handleChartClick = (data: any) => {
    if (data && data.activeLabel) {
      const date = data.activeLabel;
      setAnnotations(prev => {
        const next = { ...prev };
        if (date in next) {
          delete next[date];
        } else {
          next[date] = "";
        }
        return next;
      });
    }
  };

  const updateAnnotation = (date: string, text: string) => {
    setAnnotations(prev => ({ ...prev, [date]: text }));
  };

  const getDataForDate = (date: string) => dataset.data.find(d => d.date === date);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-6 border-black/5 dark:border-white/10 shadow-3xl rounded-[1.5rem] backdrop-blur-3xl min-w-[240px] transition-colors duration-500">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mb-4 border-b border-black/5 dark:border-white/5 pb-3 uppercase tracking-[0.3em] font-mono">{label}</p>
          <div className="space-y-4">
            {payload.map((item: any) => (
              <div key={item.dataKey} className="flex flex-col">
                <div className="flex items-center justify-between gap-8">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.3)]" style={{ backgroundColor: item.color }}></div>
                    <span className="text-slate-900 dark:text-white text-[11px] font-black tracking-widest uppercase">{item.name}</span>
                  </div>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-black text-xs tabular-nums tracking-tighter">
                    {item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {dataset.metadata?.[item.name]?.description && (
                  <span className="text-slate-500 text-[9px] mt-1 ml-5 font-medium tracking-wide italic">{dataset.metadata[item.name].description}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col gap-12 transition-colors duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {viewMode === 'normalized' ? t.indexed : t.absolute}
          </h3>
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse"></div>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-black uppercase tracking-[0.3em]">{t.audit}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 px-5 py-3 rounded-xl border ${showLabels ? 'glass-cta shadow-indigo-500/10' : 'glass-button-secondary text-slate-500 dark:text-slate-400'}`}
          >
            {showLabels ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden sm:inline">{showLabels ? t.toggleHide : t.toggleShow}</span>
          </button>
          <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-5 py-3 rounded-xl flex items-center gap-3 shadow-xl shadow-indigo-500/5 tracking-[0.2em] uppercase">
            <Target className="w-4 h-4" />
            <span>{t.probe}</span>
          </div>
        </div>
      </div>

      <div className="h-[550px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataset.data} onClick={handleChartClick} margin={{ top: 50, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-black/5 dark:text-white/5" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }}
              stroke="#94a3b830"
              tickMargin={20}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }}
              domain={['auto', 'auto']}
              stroke="#94a3b830"
              tickMargin={15}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5' }} />
            <Legend
              verticalAlign="top"
              align="right"
              height={60}
              iconType="circle"
              wrapperStyle={{ paddingBottom: '40px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8' }}
            />

            {Object.entries(annotations).map(([date, text]) => (
              <ReferenceLine key={date} x={date} stroke="#6366f1" strokeWidth={2} strokeDasharray="6 6" strokeOpacity={0.4}>
                {showLabels && text && (
                  <Label
                    value={text}
                    position="top"
                    fill="#6366f1"
                    fontSize={10}
                    fontWeight={900}
                    className="uppercase tracking-[0.2em] font-sans"
                    offset={25}
                  />
                )}
              </ReferenceLine>
            ))}

            {dataset.funds.map((fund, index) => (
              <Line
                key={fund}
                type="monotone"
                dataKey={fund}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={index === 0 ? 4 : 2.5}
                dot={false}
                activeDot={{ r: 8, stroke: '#fff', strokeWidth: 3, fill: COLORS[index % COLORS.length] }}
                connectNulls={true}
                animationDuration={2000}
                animationEasing="ease-in-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {Object.keys(annotations).length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out space-y-8 mt-4">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
            <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.4em]">
              {t.spotTitle}
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.keys(annotations).sort().map(date => {
              const point = getDataForDate(date);
              if (!point) return null;
              return (
                <div key={date} className="glass-panel border-black/5 dark:border-white/5 p-8 relative shadow-2xl hover:shadow-indigo-500/5 hover:border-black/10 dark:hover:border-white/10 transition-all rounded-[2rem] group flex flex-col backdrop-blur-3xl overflow-hidden active:scale-[0.99] duration-300">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <MessageSquarePlus className="w-40 h-40 dark:text-white text-black" />
                  </div>

                  <button
                    onClick={() => setAnnotations(prev => {
                      const next = { ...prev };
                      delete next[date];
                      return next;
                    })}
                    className="absolute top-6 right-6 text-slate-400 dark:text-slate-600 hover:text-red-500 transition-all p-2 hover:bg-red-500/10 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-4 mb-8">
                    <div className="glass-cta p-3 rounded-xl text-white shadow-xl">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="font-black text-slate-900 dark:text-white text-xl tabular-nums tracking-tighter">{date}</span>
                  </div>

                  <div className="space-y-4 mb-8 flex-grow relative z-10">
                    {dataset.funds.map((fund, idx) => (
                      <div key={fund} className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] dark:shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                            <span className="text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest truncate max-w-[140px]">{fund}</span>
                          </div>
                          <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 tabular-nums text-xs">
                            {point[fund] !== null ? (point[fund] as number).toLocaleString(undefined, { minimumFractionDigits: 2 }) : (
                              <span className="text-slate-400 dark:text-slate-700 italic opacity-50">NULL</span>
                            )}
                          </span>
                        </div>
                        {dataset.metadata?.[fund]?.description && (
                          <span className="text-[9px] text-slate-500 dark:text-slate-600 font-bold ml-4.5 mt-1 tracking-tight truncate">{dataset.metadata[fund].description}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="relative mt-auto pt-6 border-t border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-4 text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 w-fit px-3 py-1 rounded-lg border border-indigo-500/10 shadow-lg">
                      <MessageSquarePlus className="w-4 h-4" />
                      {t.eventLabel}
                    </div>
                    <textarea
                      value={annotations[date]}
                      onChange={(e) => updateAnnotation(date, e.target.value)}
                      placeholder={t.notePlaceholder}
                      className="w-full glass-input p-4 text-sm text-slate-900 dark:text-white focus:ring-indigo-500 transition-all rounded-2xl resize-none h-28 placeholder:text-slate-400 dark:placeholder:text-slate-600 leading-relaxed font-medium shadow-inner tracking-wide"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};