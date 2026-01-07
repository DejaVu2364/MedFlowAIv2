// JarvisFloatingButton - Global floating action button for Jarvis
// Shows on all pages, opens Jarvis chat or command palette

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvis } from '../../services/jarvis/JarvisGlobalProvider';
import { SparklesIcon, XMarkIcon, CommandLineIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

export const JarvisFloatingButton: React.FC = () => {
    const { isOpen, toggleJarvis, openCommandPalette, insights } = useJarvis();

    const highPriorityInsights = insights.filter(i => i.severity === 'high').length;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
            {/* Command Palette Button */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openCommandPalette}
                className="w-10 h-10 rounded-full bg-slate-800 dark:bg-slate-700 text-white shadow-lg flex items-center justify-center hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                title="Command Palette (Cmd+K)"
            >
                <CommandLineIcon className="w-5 h-5" />
            </motion.button>

            {/* Main Jarvis Button */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleJarvis}
                className={cn(
                    "w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all relative",
                    isOpen
                        ? "bg-slate-700 hover:bg-slate-600 text-white"
                        : "bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white"
                )}
                title={isOpen ? "Close Jarvis (J)" : "Open Jarvis (J)"}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                        >
                            <SparklesIcon className="w-6 h-6" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* High priority indicator */}
                {highPriorityInsights > 0 && !isOpen && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
                    >
                        {highPriorityInsights}
                    </motion.div>
                )}
            </motion.button>

            {/* Keyboard hint */}
            <div className="text-xs text-slate-400 dark:text-slate-500 text-right">
                <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">J</kbd> Chat •
                <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] ml-1">⌘K</kbd> Commands
            </div>
        </div>
    );
};

export default JarvisFloatingButton;
