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
import { X, FileText, Target, MessageSquarePlus, Eye, EyeOff } from 'lucide-react';

interface FundChartProps {
  dataset: FundDataset;
  viewMode?: 'raw' | 'normalized';
  lang: Language;
}

const COLORS = ['#b59a5d', '#0f172a', '#64748b', '#94a3b8', '#1e293b', '#475569'];

export const FundChart: React.FC<FundChartProps> = ({ dataset, viewMode = 'raw', lang }) => {
  const [annotations, setAnnotations] = useState<Record<string, string>>({});
  const [showLabels, setShowLabels] = useState(true);

  const t = {
    en: {
      indexed: "Indexed Appreciation (Base 100)",
      absolute: "Absolute Market Valuation",
      audit: "Real-time Comparative Audit",
      probe: "Interactive Intersect Probe",
      spotTitle: "Spot Valuation Briefing",
      notePlaceholder: "Add optional market note...",
      eventLabel: "Market Note (Optional)",
      toggleShow: "Show Labels",
      toggleHide: "Hide Labels"
    },
    cn: {
      indexed: "指數增值（基準 100）",
      absolute: "絕對市場估值",
      audit: "實時對比審計",
      probe: "交互式交叉探測",
      spotTitle: "即時估值簡報",
      notePlaceholder: "添加市場備註（可選）...",
      eventLabel: "市場備註（可選）",
      toggleShow: "顯示標籤",
      toggleHide: "隱藏標籤"
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
        <div className="bg-bank-navy p-4 border border-bank-gold/20 shadow-2xl">
          <p className="text-bank-gold text-xs font-bold mb-2 border-b border-white/10 pb-1">{label}</p>
          <div className="space-y-3">
            {payload.map((item: any) => (
              <div key={item.dataKey} className="flex flex-col">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">{item.name}</span>
                  <span className="text-bank-gold font-mono font-bold text-xs">{item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {dataset.metadata?.[item.name]?.description && (
                  <span className="text-white/40 text-[9px] font-serif italic">{dataset.metadata[item.name].description}</span>
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
    <div className="w-full flex flex-col gap-8">
      <div className="flex items-center justify-between border-b border-bank-gold/10 pb-6">
        <div>
          <h3 className="text-xl font-serif font-bold text-bank-navy">
            {viewMode === 'normalized' ? t.indexed : t.absolute}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">{t.audit}</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowLabels(!showLabels)}
            className="text-[10px] font-black text-slate-400 hover:text-bank-gold uppercase tracking-widest flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 transition-all rounded-sm"
          >
            {showLabels ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showLabels ? t.toggleHide : t.toggleShow}</span>
          </button>
          <div className="text-[10px] font-black text-bank-gold uppercase tracking-widest flex items-center gap-2 px-4 py-2 bg-bank-cream border border-bank-gold/20 rounded-sm">
            <Target className="w-3.5 h-3.5" />
            <span>{t.probe}</span>
          </div>
        </div>
      </div>

      <div className="h-[500px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataset.data} onClick={handleChartClick} margin={{ top: 50, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="1 1" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} stroke="#e2e8f0" tickMargin={15} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} domain={['auto', 'auto']} stroke="#e2e8f0" />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" height={36} iconType="rect" wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
            
            {Object.entries(annotations).map(([date, text]) => (
              <ReferenceLine key={date} x={date} stroke="#b59a5d" strokeWidth={1} strokeDasharray="3 3">
                {showLabels && text && (
                  <Label 
                    value={text} 
                    position="top" 
                    fill="#b59a5d" 
                    fontSize={9} 
                    fontWeight="bold" 
                    className="uppercase tracking-widest"
                    offset={15}
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
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                connectNulls={true}
                animationDuration={1500}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {Object.keys(annotations).length > 0 && (
        <div className="animate-in slide-in-from-bottom-4">
          <h4 className="text-[10px] font-black text-bank-navy uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
            <FileText className="w-4 h-4 text-bank-gold" />
            {t.spotTitle}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(annotations).sort().map(date => {
              const point = getDataForDate(date);
              if (!point) return null;
              return (
                <div key={date} className="bg-white border border-bank-gold/20 p-6 relative shadow-lg hover:shadow-xl transition-all group rounded-sm">
                  <button 
                    onClick={() => setAnnotations(prev => {
                      const next = { ...prev };
                      delete next[date];
                      return next;
                    })} 
                    className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <div className="font-serif font-bold text-bank-navy text-lg mb-4 border-b border-bank-gold/10 pb-2">{date}</div>
                  
                  <div className="space-y-4 mb-6">
                    {dataset.funds.map((fund, idx) => (
                      <div key={fund} className="flex flex-col text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-black uppercase tracking-tighter truncate max-w-[120px]">{fund}</span>
                          <span className="font-mono font-bold text-bank-navy">
                            {point[fund] !== null ? (point[fund] as number).toLocaleString(undefined, { minimumFractionDigits: 2 }) : 'N/A'}
                          </span>
                        </div>
                        {dataset.metadata?.[fund]?.description && (
                          <span className="text-[8px] text-slate-300 font-serif italic truncate">{dataset.metadata[fund].description}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="relative mt-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 mb-2 text-[8px] font-black text-bank-gold uppercase tracking-widest opacity-60">
                      <MessageSquarePlus className="w-3 h-3" />
                      {t.eventLabel}
                    </div>
                    <textarea
                      value={annotations[date]}
                      onChange={(e) => updateAnnotation(date, e.target.value)}
                      placeholder={t.notePlaceholder}
                      className="w-full bg-bank-cream/50 border border-bank-gold/5 p-3 text-[11px] font-serif italic text-bank-navy focus:border-bank-gold focus:outline-none transition-all rounded-sm resize-none h-16 placeholder:opacity-30"
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