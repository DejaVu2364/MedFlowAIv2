import React from 'react';
import { cn } from '../lib/utils';

type Language = 'en-IN' | 'hi-IN' | 'kn-IN';

interface VoiceLanguageToggleProps {
    language: Language;
    onLanguageChange: (lang: Language) => void;
    className?: string;
}

export const VoiceLanguageToggle: React.FC<VoiceLanguageToggleProps> = ({ language, onLanguageChange, className }) => {
    return (
        <div className={cn("flex items-center bg-muted rounded-full p-0.5 border border-border/50", className)}>
            <button
                type="button"
                onClick={() => onLanguageChange('en-IN')}
                className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full transition-all",
                    language === 'en-IN'
                        ? "bg-background shadow-sm text-primary"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                EN
            </button>
            <button
                type="button"
                onClick={() => onLanguageChange('hi-IN')}
                className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full transition-all",
                    language === 'hi-IN'
                        ? "bg-orange-50 text-orange-700 shadow-sm border border-orange-100"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                हि
            </button>
            <button
                type="button"
                onClick={() => onLanguageChange('kn-IN')}
                className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full transition-all",
                    language === 'kn-IN'
                        ? "bg-yellow-50 text-yellow-700 shadow-sm border border-yellow-100"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                ಕ
            </button>
        </div>
    );
};
