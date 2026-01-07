// AI Whisper Bar - Ambient insight indicator

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JarvisInsight } from '../../types/jarvis';
import { SparklesIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

interface AIWhisperBarProps {
    insights: JarvisInsight[];
    onInsightClick: (insight: JarvisInsight) => void;
    onDismiss: (insightId: string) => void;
}

export const AIWhisperBar: React.FC<AIWhisperBarProps> = ({
    insights,
    onInsightClick,
    onDismiss
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const highPriorityInsights = useMemo(() =>
        insights.filter(i => i.severity === 'high' || i.severity === 'medium'),
        [insights]
    );

    const latestInsight = highPriorityInsights[0];

    if (insights.length === 0) return null;

    return (
        <div className="relative">
            {/* Collapsed Bar */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "flex items-center justify-between px-4 py-2 rounded-lg cursor-pointer transition-all",
                    "bg-gradient-to-r from-teal-50 to-teal-100/50 dark:from-teal-900/30 dark:to-teal-800/20",
                    "border border-teal-200/50 dark:border-teal-700/30",
                    isExpanded && "rounded-b-none"
                )}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/20">
                        <SparklesIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>

                    <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
                        💡 {insights.length} insight{insights.length !== 1 ? 's' : ''}
                    </span>

                    {latestInsight && !isExpanded && (
                        <span className="text-sm text-teal-600/80 dark:text-teal-400/80 hidden sm:inline">
                            • "{latestInsight.patientName}: {latestInsight.message}"
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-teal-600/60 dark:text-teal-400/60">
                        {isExpanded ? 'Collapse' : 'View All'}
                    </span>
                    <ChevronDownIcon
                        className={cn(
                            "w-4 h-4 text-teal-600 dark:text-teal-400 transition-transform",
                            isExpanded && "rotate-180"
                        )}
                    />
                </div>
            </motion.div>

            {/* Expanded Panel */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="absolute left-0 right-0 z-40 bg-white dark:bg-slate-900 border border-t-0 border-teal-200/50 dark:border-teal-700/30 rounded-b-lg shadow-lg overflow-hidden"
                    >
                        <div className="max-h-64 overflow-y-auto">
                            {insights.map(insight => (
                                <InsightRow
                                    key={insight.id}
                                    insight={insight}
                                    onClick={() => onInsightClick(insight)}
                                    onDismiss={() => onDismiss(insight.id)}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const InsightRow: React.FC<{
    insight: JarvisInsight;
    onClick: () => void;
    onDismiss: () => void;
}> = ({ insight, onClick, onDismiss }) => {
    const severityColors = {
        high: 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10',
        medium: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10',
        low: 'border-l-teal-500 bg-teal-50/50 dark:bg-teal-900/10'
    };

    return (
        <div
            className={cn(
                "flex items-center justify-between p-3 border-l-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                severityColors[insight.severity]
            )}
            onClick={onClick}
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {insight.patientName}
                    </span>
                    {insight.isPersonalized && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300">
                            ✨ Personalized
                        </span>
                    )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {insight.message}
                </p>
            </div>

            <div className="flex items-center gap-2 ml-3">
                {insight.suggestedAction && (
                    <button
                        className="text-xs px-2 py-1 rounded bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors"
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                    >
                        {insight.suggestedAction.label}
                    </button>
                )}
                <button
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                >
                    <XMarkIcon className="w-4 h-4 text-slate-400" />
                </button>
            </div>
        </div>
    );
};

export default AIWhisperBar;
