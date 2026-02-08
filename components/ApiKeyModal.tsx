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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 bg-surface-50 border-b border-surface-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-brand-100 p-1.5 rounded-md text-brand-600">
                            <Key className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-surface-900">{t.title}</h3>
                    </div>
                    <button onClick={onClose} className="text-surface-400 hover:text-surface-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-surface-600 leading-relaxed">
                        {t.desc}
                    </p>

                    <input
                        type="password"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder={t.placeholder}
                        className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all font-mono text-sm"
                    />

                    <div className="flex items-start gap-3 p-3 bg-brand-50 rounded-lg border border-brand-100">
                        <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-brand-800 leading-snug font-medium">
                            {t.security}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 text-sm font-bold text-surface-600 hover:bg-surface-50 rounded-lg transition-colors"
                        >
                            {t.cancel}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!key.trim()}
                            className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold shadow-md shadow-brand-200 transition-all flex items-center justify-center gap-2"
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
