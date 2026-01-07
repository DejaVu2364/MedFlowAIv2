// AIInsightDrawer - Right-side panel for detailed patient insights

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Patient } from '../../types';
import { JarvisInsight } from '../../types/jarvis';
import { XMarkIcon, SparklesIcon, ChevronRightIcon, BeakerIcon, HeartIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface AIInsightDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient | null;
    insights: JarvisInsight[];
    onActionClick: (insight: JarvisInsight) => void;
}

export const AIInsightDrawer: React.FC<AIInsightDrawerProps> = ({
    isOpen,
    onClose,
    patient,
    insights,
    onActionClick
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Group insights by category
    const groupedInsights = useMemo(() => {
        const groups: Record<string, JarvisInsight[]> = {
            vitals: [],
            labs: [],
            pattern: [],
            wait: [],
            medication: []
        };

        insights.forEach(insight => {
            if (groups[insight.category]) {
                groups[insight.category].push(insight);
            }
        });

        return groups;
    }, [insights]);

    const categories = [
        { key: 'vitals', label: 'Vitals', icon: HeartIcon, color: 'text-red-500' },
        { key: 'labs', label: 'Labs', icon: BeakerIcon, color: 'text-blue-500' },
        { key: 'pattern', label: 'Patterns', icon: SparklesIcon, color: 'text-teal-500' },
        { key: 'wait', label: 'Wait Time', icon: ClockIcon, color: 'text-amber-500' }
    ];

    const activeInsights = selectedCategory
        ? groupedInsights[selectedCategory] || []
        : insights;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 z-40"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-teal-500" />
                                <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                                    AI Insights
                                </h2>
                                {patient && (
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        • {patient.name}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Category Tabs */}
                        <div className="flex gap-1 p-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                                    !selectedCategory
                                        ? "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                            >
                                All ({insights.length})
                            </button>
                            {categories.map(cat => {
                                const count = groupedInsights[cat.key]?.length || 0;
                                if (count === 0) return null;
                                return (
                                    <button
                                        key={cat.key}
                                        onClick={() => setSelectedCategory(cat.key)}
                                        className={cn(
                                            "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                                            selectedCategory === cat.key
                                                ? "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300"
                                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        <cat.icon className={cn("w-4 h-4", cat.color)} />
                                        {cat.label} ({count})
                                    </button>
                                );
                            })}
                        </div>

                        {/* Insights List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {activeInsights.length === 0 ? (
                                <div className="text-center py-8">
                                    <SparklesIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                        No insights for this category
                                    </p>
                                </div>
                            ) : (
                                activeInsights.map(insight => (
                                    <InsightCard
                                        key={insight.id}
                                        insight={insight}
                                        onAction={() => onActionClick(insight)}
                                    />
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-center text-slate-400 dark:text-slate-500">
                                Press <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">I</kbd> to toggle insights
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// Individual insight card
const InsightCard: React.FC<{
    insight: JarvisInsight;
    onAction: () => void;
}> = ({ insight, onAction }) => {
    const severityStyles = {
        high: 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10',
        medium: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10',
        low: 'border-l-teal-500 bg-teal-50/50 dark:bg-teal-900/10'
    };

    return (
        <div className={cn(
            "p-3 rounded-lg border-l-4 transition-all hover:shadow-md cursor-pointer",
            severityStyles[insight.severity]
        )} onClick={onAction}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">
                            {insight.patientName}
                        </span>
                        {insight.isPersonalized && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300">
                                ✨ For you
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        {insight.message}
                    </p>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
            </div>

            {insight.suggestedAction && (
                <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full text-xs"
                    onClick={(e) => { e.stopPropagation(); onAction(); }}
                >
                    {insight.suggestedAction.label}
                </Button>
            )}
        </div>
    );
};

export default AIInsightDrawer;
