// JarvisCommandPalette - Spotlight-style command interface (Cmd+K)
// Provides quick access to all Jarvis commands and actions

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../../contexts/PatientContext';
import { useJarvis } from '../../services/jarvis/JarvisGlobalProvider';
import {
    MagnifyingGlassIcon,
    SparklesIcon,
    UserIcon,
    BeakerIcon,
    DocumentTextIcon,
    ArrowRightIcon,
    XMarkIcon,
    HomeIcon,
    ClipboardDocumentListIcon,
    HeartIcon,
    SunIcon,
    MoonIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';
import { ALL_PROCEDURES } from '../../constants/procedures';

interface Command {
    id: string;
    label: string;
    description?: string;
    icon: React.ComponentType<{ className?: string }>;
    category: 'navigation' | 'patient' | 'action' | 'procedure' | 'ai' | 'settings';
    action: () => void;
    keywords?: string[];
}

export const JarvisCommandPalette: React.FC = () => {
    const navigate = useNavigate();
    const { patients } = usePatient();
    const {
        isCommandPaletteOpen,
        closeCommandPalette,
        openJarvis,
        toggleDarkMode,
        isDarkMode
    } = useJarvis();

    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when opened
    useEffect(() => {
        if (isCommandPaletteOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isCommandPaletteOpen]);

    // Build commands list
    const commands = useMemo((): Command[] => {
        const cmds: Command[] = [
            // Navigation
            {
                id: 'nav-home',
                label: 'Go to Dashboard',
                description: 'Return to main dashboard',
                icon: HomeIcon,
                category: 'navigation',
                action: () => { navigate('/'); closeCommandPalette(); },
                keywords: ['home', 'main', 'start']
            },
            {
                id: 'nav-beds',
                label: 'Go to Bed Manager',
                icon: HeartIcon,
                category: 'navigation',
                action: () => { navigate('/beds'); closeCommandPalette(); },
                keywords: ['beds', 'wards', 'admission']
            },
            {
                id: 'nav-triage',
                label: 'Go to Triage',
                icon: ClipboardDocumentListIcon,
                category: 'navigation',
                action: () => { navigate('/triage'); closeCommandPalette(); },
                keywords: ['triage', 'waiting', 'emergency']
            },
            // AI Actions
            {
                id: 'ai-chat',
                label: 'Ask Jarvis',
                description: 'Open AI assistant chat',
                icon: SparklesIcon,
                category: 'ai',
                action: () => { openJarvis(); closeCommandPalette(); },
                keywords: ['jarvis', 'ai', 'chat', 'ask', 'help']
            },
            // Settings
            {
                id: 'settings-dark',
                label: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
                icon: isDarkMode ? SunIcon : MoonIcon,
                category: 'settings',
                action: () => { toggleDarkMode(); closeCommandPalette(); },
                keywords: ['dark', 'light', 'theme', 'mode']
            }
        ];

        // Add patient commands
        patients.slice(0, 10).forEach(patient => {
            cmds.push({
                id: `patient-${patient.id}`,
                label: `Open ${patient.name}`,
                description: `${patient.age}${patient.gender?.charAt(0)} • ${patient.chiefComplaints?.[0]?.complaint || 'No complaint'} • ${patient.triage?.level || 'No triage'}`,
                icon: UserIcon,
                category: 'patient',
                action: () => { navigate(`/patient/${patient.id}/medview`); closeCommandPalette(); },
                keywords: [patient.name.toLowerCase(), patient.id.toLowerCase()]
            });
        });

        // Add procedure commands
        ALL_PROCEDURES.slice(0, 10).forEach(proc => {
            cmds.push({
                id: `proc-${proc.subType}`,
                label: `Order: ${proc.label}`,
                description: `${proc.category} • ${proc.defaultPriority}`,
                icon: BeakerIcon,
                category: 'procedure',
                action: () => {
                    // TODO: Open order modal with this procedure
                    console.log('[Jarvis] Order procedure:', proc);
                    closeCommandPalette();
                },
                keywords: [proc.label.toLowerCase(), proc.subType.toLowerCase()]
            });
        });

        return cmds;
    }, [patients, navigate, closeCommandPalette, openJarvis, toggleDarkMode, isDarkMode]);

    // Filter commands by query
    const filteredCommands = useMemo(() => {
        if (!query.trim()) return commands;

        const q = query.toLowerCase();
        return commands.filter(cmd =>
            cmd.label.toLowerCase().includes(q) ||
            cmd.description?.toLowerCase().includes(q) ||
            cmd.keywords?.some(k => k.includes(q))
        );
    }, [commands, query]);

    // Keyboard navigation
    useEffect(() => {
        if (!isCommandPaletteOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredCommands[selectedIndex]) {
                        filteredCommands[selectedIndex].action();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    closeCommandPalette();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCommandPaletteOpen, filteredCommands, selectedIndex, closeCommandPalette]);

    // Reset selection when filtered results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Group commands by category
    const groupedCommands = useMemo(() => {
        const groups: Record<string, Command[]> = {};
        filteredCommands.forEach(cmd => {
            if (!groups[cmd.category]) groups[cmd.category] = [];
            groups[cmd.category].push(cmd);
        });
        return groups;
    }, [filteredCommands]);

    const categoryLabels: Record<string, string> = {
        navigation: 'Navigation',
        patient: 'Patients',
        action: 'Actions',
        procedure: 'Procedures',
        ai: 'AI Assistant',
        settings: 'Settings'
    };

    if (!isCommandPaletteOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center pt-[15vh]"
                onClick={closeCommandPalette}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                        <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search commands, patients, procedures..."
                            className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
                        />
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">↑↓</kbd>
                            <span>navigate</span>
                            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono ml-2">↵</kbd>
                            <span>select</span>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        {filteredCommands.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                                <SparklesIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No results for "{query}"</p>
                                <p className="text-xs mt-1">Try searching for patients, procedures, or commands</p>
                            </div>
                        ) : (
                            Object.entries(groupedCommands).map(([category, cmds]) => (
                                <div key={category}>
                                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50">
                                        {categoryLabels[category] || category}
                                    </div>
                                    {cmds.map((cmd, idx) => {
                                        const globalIdx = filteredCommands.indexOf(cmd);
                                        const isSelected = globalIdx === selectedIndex;

                                        return (
                                            <button
                                                key={cmd.id}
                                                onClick={cmd.action}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                                                    isSelected
                                                        ? "bg-teal-50 dark:bg-teal-900/30"
                                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                )}
                                            >
                                                <cmd.icon className={cn(
                                                    "w-5 h-5 shrink-0",
                                                    isSelected ? "text-teal-600" : "text-slate-400"
                                                )} />
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn(
                                                        "font-medium truncate",
                                                        isSelected ? "text-teal-700 dark:text-teal-300" : "text-slate-800 dark:text-slate-200"
                                                    )}>
                                                        {cmd.label}
                                                    </p>
                                                    {cmd.description && (
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                            {cmd.description}
                                                        </p>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <ArrowRightIcon className="w-4 h-4 text-teal-500 shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4 text-teal-500" />
                            <span>Jarvis Command Palette</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">esc</kbd>
                            <span>close</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default JarvisCommandPalette;
