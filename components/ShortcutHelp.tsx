import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { ShortcutAction } from '../hooks/useKeyboardShortcuts';
import { Language } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutAction[];
  lang: Language;
}

export const ShortcutHelp: React.FC<Props> = ({ isOpen, onClose, shortcuts, lang }) => {
  if (!isOpen) return null;

  const t = {
    en: {
      title: 'Keyboard Shortcuts',
      navigation: 'Navigation',
      view: 'View',
      action: 'Actions',
      close: 'Close',
      hint: 'Press ? anytime to toggle this panel',
    },
    cn: {
      title: '鍵盤快捷鍵',
      navigation: '導航',
      view: '視圖',
      action: '操作',
      close: '關閉',
      hint: '隨時按 ? 切換此面板',
    },
  }[lang];

  const categoryLabels: Record<string, string> = {
    navigation: t.navigation,
    view: t.view,
    action: t.action,
  };

  const grouped = shortcuts.reduce<Record<string, ShortcutAction[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  const formatKey = (s: ShortcutAction): string => {
    const parts: string[] = [];
    if (s.ctrl) parts.push('Ctrl');
    if (s.shift) parts.push('Shift');
    parts.push(s.key === ' ' ? 'Space' : s.key.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass-panel border-black/5 dark:border-white/10 rounded-[2rem] shadow-3xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="glass-cta p-2 rounded-xl text-white shadow-xl">
              <Keyboard className="w-5 h-5" />
            </div>
            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">
              {t.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="px-8 py-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {['navigation', 'view', 'action'].map((category) => {
            const items = grouped[category];
            if (!items || items.length === 0) return null;
            return (
              <div key={category}>
                <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mb-3">
                  {categoryLabels[category]}
                </h4>
                <div className="space-y-2">
                  {items.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2.5 px-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {lang === 'cn' ? s.descriptionCn : s.description}
                      </span>
                      <kbd className="ml-4 shrink-0 px-3 py-1.5 bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-lg text-[10px] font-black text-slate-600 dark:text-slate-300 font-mono tracking-wider shadow-sm">
                        {formatKey(s)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="px-8 py-4 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-600 text-center uppercase tracking-widest">
            {t.hint}
          </p>
        </div>
      </div>
    </div>
  );
};
