import React, { useMemo, useState } from 'react';
import { FundDataset, Language } from '../types';
import { computeCorrelationMatrix, correlationToColor } from '../utils/correlationMatrix';
import { Grid3x3, Info } from 'lucide-react';

interface Props {
  dataset: FundDataset;
  lang: Language;
}

export const CorrelationMatrix: React.FC<Props> = ({ dataset, lang }) => {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  // Detect dark mode from the document
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

  const t = {
    en: {
      title: 'Correlation Matrix',
      subtitle: 'Pairwise return correlations across assets',
      hint: 'Based on periodic return correlations. Values range from -1 (inverse) to +1 (perfectly correlated).',
      positive: 'Positive',
      negative: 'Negative',
      neutral: 'Uncorrelated',
      legend: 'Legend',
      minAssets: 'Correlation matrix requires at least 2 assets.',
    },
    cn: {
      title: '相關性矩陣',
      subtitle: '資產間收益率的配對相關性',
      hint: '基於期間收益率相關性。數值範圍從 -1（反向）到 +1（完全正相關）。',
      positive: '正相關',
      negative: '負相關',
      neutral: '無相關',
      legend: '圖例',
      minAssets: '相關性矩陣需要至少 2 項資產。',
    },
  }[lang];

  const result = useMemo(
    () => computeCorrelationMatrix(dataset.data, dataset.funds),
    [dataset],
  );

  if (dataset.funds.length < 2) {
    return (
      <div className="glass-panel rounded-[2.5rem] border-black/5 dark:border-white/5 shadow-2xl p-12 text-center">
        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">
          {t.minAssets}
        </p>
      </div>
    );
  }

  const { funds, matrix } = result;
  const n = funds.length;

  // Layout constants
  const cellSize = Math.min(80, Math.max(48, 400 / n));
  const labelWidth = Math.min(120, Math.max(60, 12 * Math.max(...funds.map(f => f.length))));
  const totalWidth = labelWidth + n * cellSize;
  const totalHeight = 40 + n * cellSize; // 40 for top labels

  return (
    <div className="glass-panel rounded-[2.5rem] border-black/5 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col backdrop-blur-3xl transition-colors duration-500">
      {/* Header */}
      <div className="px-8 py-6 bg-white/20 dark:bg-white/5 border-b border-black/5 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-500">
        <div className="flex items-center gap-4">
          <div className="glass-cta p-2.5 rounded-xl text-white shadow-xl flex items-center justify-center">
            <Grid3x3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">{t.title}</h3>
            <p className="text-[9px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">{t.subtitle}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.legend}:</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: correlationToColor(-1, isDark) }}></div>
              <span className="text-[9px] font-bold text-slate-500">-1</span>
            </div>
            <div className="w-16 h-4 rounded" style={{
              background: `linear-gradient(to right, ${correlationToColor(-1, isDark)}, ${correlationToColor(0, isDark)}, ${correlationToColor(1, isDark)})`,
            }}></div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-slate-500">+1</span>
              <div className="w-4 h-4 rounded" style={{ backgroundColor: correlationToColor(1, isDark) }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="p-8">
        <div className="overflow-x-auto custom-scrollbar">
          <svg
            width={totalWidth}
            height={totalHeight}
            viewBox={`0 0 ${totalWidth} ${totalHeight}`}
            className="mx-auto"
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            {/* Top labels (rotated) */}
            {funds.map((fund, j) => (
              <text
                key={`top-${j}`}
                x={labelWidth + j * cellSize + cellSize / 2}
                y={35}
                textAnchor="end"
                fontSize={Math.min(10, cellSize * 0.2)}
                fontWeight={900}
                fill={hoveredCell?.col === j ? (isDark ? '#a5b4fc' : '#4f46e5') : (isDark ? '#94a3b8' : '#64748b')}
                className="uppercase transition-colors"
                style={{ letterSpacing: '0.1em' }}
                transform={`rotate(-45, ${labelWidth + j * cellSize + cellSize / 2}, 35)`}
              >
                {fund}
              </text>
            ))}

            {/* Rows */}
            {funds.map((fundRow, i) => (
              <g key={`row-${i}`}>
                {/* Left label */}
                <text
                  x={labelWidth - 8}
                  y={40 + i * cellSize + cellSize / 2 + 4}
                  textAnchor="end"
                  fontSize={Math.min(10, cellSize * 0.2)}
                  fontWeight={900}
                  fill={hoveredCell?.row === i ? (isDark ? '#a5b4fc' : '#4f46e5') : (isDark ? '#94a3b8' : '#64748b')}
                  className="uppercase transition-colors"
                  style={{ letterSpacing: '0.1em' }}
                >
                  {fundRow}
                </text>

                {/* Cells */}
                {funds.map((_, j) => {
                  const value = matrix[i][j];
                  const isHovered = hoveredCell?.row === i && hoveredCell?.col === j;
                  const isHighlighted = hoveredCell?.row === i || hoveredCell?.col === j;
                  const isDiagonal = i === j;

                  return (
                    <g
                      key={`cell-${i}-${j}`}
                      onMouseEnter={() => setHoveredCell({ row: i, col: j })}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{ cursor: 'default' }}
                    >
                      <rect
                        x={labelWidth + j * cellSize + 1}
                        y={40 + i * cellSize + 1}
                        width={cellSize - 2}
                        height={cellSize - 2}
                        rx={6}
                        fill={correlationToColor(value, isDark)}
                        opacity={isHovered ? 1 : isHighlighted ? 0.85 : 0.75}
                        stroke={isHovered ? (isDark ? '#a5b4fc' : '#4f46e5') : 'transparent'}
                        strokeWidth={isHovered ? 2 : 0}
                        className="transition-all duration-150"
                      />
                      <text
                        x={labelWidth + j * cellSize + cellSize / 2}
                        y={40 + i * cellSize + cellSize / 2 + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={Math.min(12, cellSize * 0.25)}
                        fontWeight={isDiagonal ? 900 : 800}
                        fontFamily="ui-monospace, monospace"
                        fill={
                          isDiagonal
                            ? (isDark ? '#e2e8f0' : '#1e293b')
                            : Math.abs(value) > 0.6
                              ? (isDark ? '#f1f5f9' : value > 0 ? '#312e81' : '#7f1d1d')
                              : (isDark ? '#cbd5e1' : '#475569')
                        }
                      >
                        {isDiagonal ? '1.00' : value.toFixed(2)}
                      </text>
                    </g>
                  );
                })}
              </g>
            ))}
          </svg>
        </div>

        {/* Hover tooltip */}
        {hoveredCell && (
          <div className="mt-4 flex items-center justify-center gap-3 animate-in fade-in duration-150">
            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">
              {funds[hoveredCell.row]}
            </span>
            <span className="text-[10px] font-bold text-slate-400">×</span>
            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">
              {funds[hoveredCell.col]}
            </span>
            <span className="text-[10px] font-bold text-slate-400">=</span>
            <span className={`text-sm font-black tabular-nums ${
              matrix[hoveredCell.row][hoveredCell.col] > 0.3
                ? 'text-indigo-600 dark:text-indigo-400'
                : matrix[hoveredCell.row][hoveredCell.col] < -0.3
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-600 dark:text-slate-300'
            }`}>
              {matrix[hoveredCell.row][hoveredCell.col].toFixed(4)}
            </span>
          </div>
        )}

        {/* Info hint */}
        <div className="mt-6 flex items-start gap-2 text-[9px] font-semibold text-slate-400 dark:text-slate-600 leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{t.hint}</span>
        </div>
      </div>
    </div>
  );
};
