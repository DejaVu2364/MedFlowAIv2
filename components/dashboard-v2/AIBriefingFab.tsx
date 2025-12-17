import React from 'react';
import { Button } from '../ui/button';
import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export const AIBriefingFab: React.FC = () => {
    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Button
                className={cn(
                    "flex items-center gap-2 rounded-full shadow-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 border border-slate-700/50 py-6 px-6 transition-all hover:scale-105"
                )}
            >
                <Sparkles className="w-5 h-5 animate-pulse text-amber-300 dark:text-amber-500" />
                <span className="font-medium">Morning Briefing</span>
            </Button>
        </div>
    );
};
