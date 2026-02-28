import React, { useState } from 'react';
import { Key, Save, X, ShieldCheck } from 'lucide-react';
import { Language } from '../types';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string) => void;
    lang: Language;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, lang }) => {
    const [key, setKey] = useState('');

    if (!isOpen) return null;

    const t = {
        en: {
            title: "API Configuration",
            desc: "Enter your Google Gemini API key to enable AI features.",
            placeholder: "e.g. AIzaSy...",
            save: "Save Key",
            cancel: "Cancel",
            security: "Your key is stored locally in your browser and never sent to our servers."
        },
        cn: {
            title: "API 配置",
            desc: "輸入您的 Google Gemini API 金鑰以啟用 AI 功能。",
            placeholder: "例如：AIzaSy...",
            save: "儲存金鑰",
            cancel: "取消",
            security: "您的金鑰僅儲存在本地瀏覽器中，絕不會發送至我們的服務器。"
        }
    }[lang];

    const handleSave = () => {
        if (key.trim()) {
            onSave(key.trim());
            setKey('');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-xl animate-in fade-in duration-300 transition-colors duration-500">
            <div className="glass-panel rounded-[2rem] border-black/5 dark:border-white/10 shadow-3xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 backdrop-blur-3xl transition-colors duration-500">
                <div className="px-8 py-6 bg-white/40 dark:bg-white/5 border-b border-black/5 dark:border-white/5 flex items-center justify-between transition-colors duration-500">
                    <div className="flex items-center gap-4">
                        <div className="glass-cta p-2 rounded-xl text-white shadow-indigo-500/20 flex items-center justify-center">
                            <Key className="w-4 h-4" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-[0.1em]">{t.title}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed tracking-wide">
                        {t.desc}
                    </p>

                    <input
                        type="password"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder={t.placeholder}
                        className="w-full px-5 py-4 glass-input rounded-2xl font-black focus:ring-indigo-500 transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 tracking-wider shadow-inner text-slate-900 dark:text-white"
                    />

                    <div className="flex items-start gap-4 p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 shadow-2xl transition-colors duration-500">
                        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-bold uppercase tracking-widest">
                            {t.security}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500 glass-button-secondary rounded-xl active:scale-[0.98]"
                        >
                            {t.cancel}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!key.trim()}
                            className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${!key.trim() ? 'bg-black/5 dark:bg-white/5 text-slate-400 dark:text-slate-700 cursor-not-allowed border border-black/5 dark:border-white/5' : 'glass-cta shadow-indigo-500/20'}`}
                        >
                            <Save className="w-4 h-4" />
                            {t.save}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
