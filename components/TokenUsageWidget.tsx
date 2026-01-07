import React, { useState, useEffect } from 'react';
import { BoltIcon } from '@heroicons/react/24/outline';
import { cn } from '../lib/utils';

interface TokenStats {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCalls: number;
    callsThisHour: number;
    callsToday: number;
    estimatedCost: number;
}

const STORAGE_KEY = 'medflow_token_usage';

// Get usage stats safely
const getStats = (): TokenStats => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            const inputCost = (data.totalInputTokens || 0) / 1000000 * 0.075;
            const outputCost = (data.totalOutputTokens || 0) / 1000000 * 0.30;
            return {
                totalInputTokens: data.totalInputTokens || 0,
                totalOutputTokens: data.totalOutputTokens || 0,
                totalCalls: data.totalCalls || 0,
                callsThisHour: data.callsThisHour || 0,
                callsToday: data.callsToday || 0,
                estimatedCost: inputCost + outputCost
            };
        }
    } catch (e) {
        console.warn('TokenUsageWidget: failed to load stats', e);
    }
    return {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCalls: 0,
        callsThisHour: 0,
        callsToday: 0,
        estimatedCost: 0
    };
};

interface TokenUsageWidgetProps {
    className?: string;
    compact?: boolean;
}

export const TokenUsageWidget: React.FC<TokenUsageWidgetProps> = ({ className, compact = true }) => {
    const [stats, setStats] = useState<TokenStats>(getStats);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const handleUpdate = () => setStats(getStats());
        window.addEventListener('tokenUsageUpdated', handleUpdate);
        const interval = setInterval(handleUpdate, 30000);
        return () => {
            window.removeEventListener('tokenUsageUpdated', handleUpdate);
            clearInterval(interval);
        };
    }, []);

    const totalTokens = stats.totalInputTokens + stats.totalOutputTokens;
    const formatNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

    // Compact pill - teal themed to match app
    if (compact && !isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                    "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300",
                    "border border-teal-200 dark:border-teal-700",
                    "hover:bg-teal-100 dark:hover:bg-teal-800/50 transition-colors",
                    className
                )}
            >
                <BoltIcon className="w-3.5 h-3.5" />
                <span>{formatNum(totalTokens)} tokens</span>
            </button>
        );
    }

    // Expanded popover - teal themed
    return (
        <div className="relative">
            <div className={cn(
                "absolute right-0 top-full mt-2 w-64 p-4 rounded-xl z-50",
                "bg-white dark:bg-slate-900 shadow-xl border border-teal-200 dark:border-teal-800",
                className
            )}>
                <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-sm text-teal-800 dark:text-teal-200 flex items-center gap-2">
                        <BoltIcon className="w-4 h-4" /> AI Token Usage
                    </span>
                    <button onClick={() => setIsExpanded(false)} className="text-xs text-teal-500 hover:text-teal-700">
                        Close
                    </button>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Calls</span>
                        <span className="font-mono font-medium">{stats.totalCalls}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Input Tokens</span>
                        <span className="font-mono">{formatNum(stats.totalInputTokens)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Output Tokens</span>
                        <span className="font-mono">{formatNum(stats.totalOutputTokens)}</span>
                    </div>
                    <div className="pt-2 border-t border-teal-100 dark:border-teal-800 flex justify-between">
                        <span className="text-teal-600 dark:text-teal-400 font-medium">Est. Cost</span>
                        <span className="font-mono font-bold">${stats.estimatedCost.toFixed(4)}</span>
                    </div>
                </div>
            </div>
            <button
                onClick={() => setIsExpanded(false)}
                className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                    "bg-teal-600 text-white",
                    className
                )}
            >
                <BoltIcon className="w-3.5 h-3.5" />
                <span>{formatNum(totalTokens)} tokens</span>
            </button>
        </div>
    );
};

export default TokenUsageWidget;
