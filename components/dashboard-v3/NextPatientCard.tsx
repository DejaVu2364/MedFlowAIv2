// NextPatientCard - Hero CTA component

import React from 'react';
import { motion } from 'framer-motion';
import { Patient } from '../../types';
import { JarvisInsight } from '../../types/jarvis';
import { UserIcon, ClockIcon, ArrowRightIcon, ChevronRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

interface NextPatientCardProps {
    patient: Patient | null;
    insight?: JarvisInsight;
    onSeePatient: () => void;
    onSkip: () => void;
}

export const NextPatientCard: React.FC<NextPatientCardProps> = ({
    patient,
    insight,
    onSeePatient,
    onSkip
}) => {
    if (!patient) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center"
            >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <UserIcon className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">
                    Queue is clear!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    No patients waiting for you right now.
                </p>
            </motion.div>
        );
    }

    const waitTime = getWaitTime(patient.registrationTime);
    const triageColor = getTriageColor(patient.triage?.level);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl border-2 border-teal-200 dark:border-teal-800 bg-gradient-to-br from-white to-teal-50/50 dark:from-slate-900 dark:to-teal-900/20 shadow-lg"
        >
            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-400/10 to-teal-600/10 rounded-bl-full" />

            <div className="p-6 relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md",
                            triageColor.bg
                        )}>
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                {patient.name}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {patient.age}{patient.gender?.charAt(0)} • {patient.chiefComplaints?.[0]?.complaint || 'No complaint'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge className={cn("font-semibold", triageColor.badge)}>
                            {patient.triage?.level || 'None'}
                        </Badge>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <ClockIcon className="w-4 h-4" />
                        <span>Waiting: <strong>{waitTime}</strong></span>
                    </div>
                </div>

                {/* AI Insight */}
                {insight && (
                    <div className="mb-4 p-3 rounded-lg bg-teal-50 dark:bg-teal-900/30 border border-teal-200/50 dark:border-teal-700/30">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
                                {insight.isPersonalized ? '✨ Based on your pattern' : 'AI Insight'}
                            </span>
                        </div>
                        <p className="text-sm text-teal-600 dark:text-teal-400 mt-1">
                            {insight.message}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        onClick={onSeePatient}
                        className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-5 text-base font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                    >
                        See Patient
                        <ArrowRightIcon className="w-5 h-5 ml-2" />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onSkip}
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 py-5 rounded-xl"
                    >
                        Skip
                        <ChevronRightIcon className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </div>

            {/* Keyboard hint */}
            <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-xs">N</kbd> to see patient
                </p>
            </div>
        </motion.div>
    );
};

// Helper functions
const getWaitTime = (registrationTime: string): string => {
    const now = Date.now();
    const registered = new Date(registrationTime).getTime();
    const minutes = Math.floor((now - registered) / 60000);

    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
};

const getTriageColor = (level?: string) => {
    switch (level) {
        case 'Red':
            return { bg: 'bg-red-500', badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' };
        case 'Yellow':
            return { bg: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' };
        case 'Green':
            return { bg: 'bg-green-500', badge: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' };
        default:
            return { bg: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
    }
};

export default NextPatientCard;
