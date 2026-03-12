import React, { useState, useRef, useCallback } from 'react';
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
  Label,
  Brush,
} from 'recharts';
import { FundDataset, Language } from '../types';
import { Anomaly, AnomalyType, anomaliesByDate } from '../utils/anomalyDetection';
import { X, FileText, Target, MessageSquarePlus, Eye, EyeOff, Calendar, Download, Image, ZoomIn, ZoomOut, Crosshair, ChevronDown, AlertTriangle } from 'lucide-react';

interface FundChartProps {
  dataset: FundDataset;
  viewMode?: 'raw' | 'normalized';
  lang: Language;
  anomalies?: Anomaly[];
  showAnomalyMarkers?: boolean;
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

/**
 * Serialize an SVG element to a PNG Blob via an offscreen canvas.
 */
function svgToPngBlob(svgEl: SVGSVGElement, scale: number = 2): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgEl.clientWidth * scale;
      canvas.height = svgEl.clientHeight * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG image load failed'));
    };
    img.src = url;
  });
}

/**
 * Trigger a browser download from a Blob.
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const BENCHMARK_COLOR = '#f59e0b'; // Amber/Gold — visually distinct

export const FundChart: React.FC<FundChartProps> = ({ dataset, viewMode = 'raw', lang, anomalies = [], showAnomalyMarkers = true }) => {
  const [annotations, setAnnotations] = useState<Record<string, string>>({});
  const [showLabels, setShowLabels] = useState(true);
  const [brushActive, setBrushActive] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [benchmark, setBenchmark] = useState<string | null>(null);
  const [showBenchmarkMenu, setShowBenchmarkMenu] = useState(false);
  const benchmarkMenuRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Close benchmark dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (benchmarkMenuRef.current && !benchmarkMenuRef.current.contains(e.target as Node)) {
        setShowBenchmarkMenu(false);
      }
    };
    if (showBenchmarkMenu) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [showBenchmarkMenu]);

  const handleExportPng = useCallback(async () => {
    if (!chartContainerRef.current) return;
    const svgEl = chartContainerRef.current.querySelector('svg');
    if (!svgEl) return;
    setExporting(true);
    try {
      const blob = await svgToPngBlob(svgEl as SVGSVGElement, 3);
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `fund-chart-${dateStr}.png`);
    } catch (err) {
      console.warn('[Export] PNG export failed:', err);
    } finally {
      setExporting(false);
    }
  }, []);

  const handleExportSvg = useCallback(() => {
    if (!chartContainerRef.current) return;
    const svgEl = chartContainerRef.current.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `fund-chart-${dateStr}.svg`);
  }, []);

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
      toggleHide: "Hide Annotations",
      anomalyOn: "Anomalies",
      anomalyOff: "Anomalies",
      exportPng: "Export PNG",
      exportSvg: "Export SVG",
      zoomOn: "Zoom",
      zoomOff: "Reset Zoom",
      exporting: "Exporting...",
      benchmark: "Benchmark",
      benchmarkNone: "No Benchmark",
      benchmarkPin: "Pin as Benchmark",
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
      toggleHide: "隱藏備註",
      anomalyOn: "異常標記",
      anomalyOff: "異常標記",
      exportPng: "匯出 PNG",
      exportSvg: "匯出 SVG",
      zoomOn: "縮放",
      zoomOff: "重置縮放",
      exporting: "匯出中...",
      benchmark: "基準",
      benchmarkNone: "無基準",
      benchmarkPin: "設為基準",
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
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setBrushActive(!brushActive)}
            className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${brushActive ? 'glass-cta shadow-indigo-500/10' : 'glass-button-secondary text-slate-500 dark:text-slate-400'}`}
          >
            {brushActive ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            <span className="hidden sm:inline">{brushActive ? t.zoomOff : t.zoomOn}</span>
          </button>
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${showLabels ? 'glass-cta shadow-indigo-500/10' : 'glass-button-secondary text-slate-500 dark:text-slate-400'}`}
          >
            {showLabels ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden sm:inline">{showLabels ? t.toggleHide : t.toggleShow}</span>
          </button>

          <div className="w-px h-6 bg-black/10 dark:bg-white/10 hidden sm:block"></div>

          <button
            onClick={handleExportPng}
            disabled={exporting}
            className="text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2.5 px-4 py-2.5 rounded-xl border glass-button-secondary text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white disabled:opacity-50"
          >
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">{exporting ? t.exporting : t.exportPng}</span>
          </button>
          <button
            onClick={handleExportSvg}
            className="text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2.5 px-4 py-2.5 rounded-xl border glass-button-secondary text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t.exportSvg}</span>
          </button>

          <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-xl shadow-indigo-500/5 tracking-[0.2em] uppercase">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">{t.probe}</span>
          </div>

          <div className="w-px h-6 bg-black/10 dark:bg-white/10 hidden sm:block"></div>

          {/* Benchmark Selector */}
          <div className="relative" ref={benchmarkMenuRef}>
            <button
              onClick={() => setShowBenchmarkMenu(!showBenchmarkMenu)}
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 px-4 py-2.5 rounded-xl border ${benchmark
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'glass-button-secondary text-slate-500 dark:text-slate-400 border-black/5 dark:border-white/5'
                }`}
            >
              <Crosshair className="w-4 h-4" />
              <span className="hidden sm:inline">{benchmark || t.benchmark}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showBenchmarkMenu ? 'rotate-180' : ''}`} />
            </button>

            {showBenchmarkMenu && (
              <div className="absolute right-0 top-full mt-2 z-50 glass-panel border-black/5 dark:border-white/10 rounded-2xl shadow-3xl overflow-hidden min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => { setBenchmark(null); setShowBenchmarkMenu(false); }}
                  className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${!benchmark ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/5' : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${!benchmark ? 'bg-indigo-500' : 'bg-transparent border border-slate-300 dark:border-slate-600'}`}></div>
                  {t.benchmarkNone}
                </button>
                {dataset.funds.map((fund) => (
                  <button
                    key={fund}
                    onClick={() => { setBenchmark(fund); setShowBenchmarkMenu(false); }}
                    className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${benchmark === fund ? 'text-amber-600 dark:text-amber-400 bg-amber-500/5' : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${benchmark === fund ? 'bg-amber-500' : 'bg-transparent border border-slate-300 dark:border-slate-600'}`}></div>
                    {fund}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full relative" ref={chartContainerRef} style={{ height: brushActive ? 620 : 550 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataset.data} onClick={handleChartClick} margin={{ top: 50, right: 30, left: 10, bottom: brushActive ? 40 : 20 }}>
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

            {/* Anomaly markers */}
            {showAnomalyMarkers && anomalies.length > 0 && (() => {
              const byDate = anomaliesByDate(anomalies);
              const dates = Array.from(byDate.keys());
              // Only show high & medium severity markers on chart to avoid clutter
              return dates.map(date => {
                const items = byDate.get(date)!.filter(a => a.severity !== 'low');
                if (items.length === 0) return null;
                const hasHigh = items.some(a => a.severity === 'high');
                const color = hasHigh ? '#ef4444' : '#f59e0b';
                return (
                  <ReferenceLine
                    key={`anomaly-${date}`}
                    x={date}
                    stroke={color}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                  >
                    <Label
                      value="⚠"
                      position="top"
                      fill={color}
                      fontSize={14}
                      offset={8}
                    />
                  </ReferenceLine>
                );
              });
            })()}

            {/* Benchmark line — rendered first (behind) with distinct dashed amber style */}
            {benchmark && (
              <Line
                key={`benchmark-${benchmark}`}
                type="monotone"
                dataKey={benchmark}
                stroke={BENCHMARK_COLOR}
                strokeWidth={3}
                strokeDasharray="8 4"
                dot={false}
                activeDot={{ r: 6, stroke: BENCHMARK_COLOR, strokeWidth: 2, fill: '#fff' }}
                connectNulls={true}
                animationDuration={1500}
                animationEasing="ease-in-out"
                name={`${benchmark} (${t.benchmark})`}
              />
            )}

            {/* Fund lines */}
            {dataset.funds.map((fund, index) => {
              // Skip the benchmark fund from normal rendering to avoid double-drawing
              if (fund === benchmark) return null;
              return (
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
              );
            })}

            {brushActive && (
              <Brush
                dataKey="date"
                height={30}
                stroke="#6366f1"
                fill="rgba(99, 102, 241, 0.05)"
                travellerWidth={10}
                tickFormatter={(val: string) => val}
              />
            )}
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