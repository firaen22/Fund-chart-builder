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
        <div className="bg-surface-900 text-white p-4 border border-surface-700 shadow-2xl rounded-xl">
          <p className="text-surface-400 text-[10px] font-bold mb-3 border-b border-surface-800 pb-2 uppercase tracking-widest">{label}</p>
          <div className="space-y-3">
            {payload.map((item: any) => (
              <div key={item.dataKey} className="flex flex-col">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-white text-[11px] font-bold tracking-tight">{item.name}</span>
                  </div>
                  <span className="text-brand-300 font-mono font-bold text-xs tabular-nums">
                    {item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {dataset.metadata?.[item.name]?.description && (
                  <span className="text-surface-500 text-[9px] mt-0.5 ml-3.5 italic">{dataset.metadata[item.name].description}</span>
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
    <div className="w-full flex flex-col gap-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-surface-900 tracking-tight">
            {viewMode === 'normalized' ? t.indexed : t.absolute}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
            <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest">{t.audit}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowLabels(!showLabels)}
            className="text-[10px] font-bold text-surface-600 hover:text-brand-600 hover:bg-brand-50 transition-all flex items-center gap-2 px-3 py-2 bg-surface-100 border border-surface-200 rounded-lg"
          >
            {showLabels ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{showLabels ? t.toggleHide : t.toggleShow}</span>
          </button>
          <div className="text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-100 px-3 py-2 rounded-lg flex items-center gap-2">
            <Target className="w-3.5 h-3.5" />
            <span>{t.probe}</span>
          </div>
        </div>
      </div>

      <div className="h-[500px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataset.data} onClick={handleChartClick} margin={{ top: 50, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f4" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: '#71717a', fontWeight: 600 }} 
              stroke="#e4e4e7" 
              tickMargin={15} 
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#71717a', fontWeight: 600 }} 
              domain={['auto', 'auto']} 
              stroke="#e4e4e7" 
              tickMargin={10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              align="right" 
              height={50} 
              iconType="circle" 
              wrapperStyle={{ paddingBottom: '30px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }} 
            />
            
            {Object.entries(annotations).map(([date, text]) => (
              <ReferenceLine key={date} x={date} stroke="#637df7" strokeWidth={1.5} strokeDasharray="4 4">
                {showLabels && text && (
                  <Label 
                    value={text} 
                    position="top" 
                    fill="#4a57f2" 
                    fontSize={10} 
                    fontWeight={800} 
                    className="uppercase tracking-widest bg-white"
                    offset={20}
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
                strokeWidth={index === 0 ? 3 : 2}
                dot={false}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: COLORS[index % COLORS.length] }}
                connectNulls={true}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {Object.keys(annotations).length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4 bg-brand-500 rounded-full"></div>
            <h4 className="text-[10px] font-black text-surface-900 uppercase tracking-widest">
              {t.spotTitle}
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(annotations).sort().map(date => {
              const point = getDataForDate(date);
              if (!point) return null;
              return (
                <div key={date} className="bg-white border border-surface-200 p-6 relative shadow-sm hover:shadow-md transition-all rounded-2xl group flex flex-col">
                  <button 
                    onClick={() => setAnnotations(prev => {
                      const next = { ...prev };
                      delete next[date];
                      return next;
                    })} 
                    className="absolute top-4 right-4 text-surface-300 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-5">
                    <div className="bg-brand-50 p-2 rounded-lg text-brand-600">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-surface-900 text-lg tabular-nums tracking-tight">{date}</span>
                  </div>
                  
                  <div className="space-y-3 mb-6 flex-grow">
                    {dataset.funds.map((fund, idx) => (
                      <div key={fund} className="flex flex-col text-[11px]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                            <span className="text-surface-500 font-bold uppercase tracking-tight truncate max-w-[120px]">{fund}</span>
                          </div>
                          <span className="font-mono font-bold text-surface-900 tabular-nums">
                            {point[fund] !== null ? (point[fund] as number).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                          </span>
                        </div>
                        {dataset.metadata?.[fund]?.description && (
                          <span className="text-[9px] text-surface-400 font-medium ml-3 italic truncate">{dataset.metadata[fund].description}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="relative mt-auto pt-5 border-t border-surface-100">
                    <div className="flex items-center gap-2 mb-3 text-[9px] font-bold text-brand-600 uppercase tracking-wider">
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      {t.eventLabel}
                    </div>
                    <textarea
                      value={annotations[date]}
                      onChange={(e) => updateAnnotation(date, e.target.value)}
                      placeholder={t.notePlaceholder}
                      className="w-full bg-surface-50 border border-surface-200 p-3 text-[12px] text-surface-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-all rounded-xl resize-none h-20 placeholder:text-surface-300"
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