// ActivePatientCard - Compact patient card with AI badge

import React from 'react';
import { motion } from 'framer-motion';
import { Patient } from '../../types';
import { SparklesIcon, ClockIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

interface ActivePatientCardProps {
    patient: Patient;
    insightCount: number;
    onClick: () => void;
}

export const ActivePatientCard: React.FC<ActivePatientCardProps> = ({
    patient,
    insightCount,
    onClick
}) => {
    const triageColor = getTriageColor(patient.triage?.level);
    const lastInteraction = getLastInteraction(patient);

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative p-4 rounded-xl cursor-pointer transition-all",
                "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700",
                "hover:shadow-lg hover:border-teal-300 dark:hover:border-teal-700"
            )}
            onClick={onClick}
        >
            {/* AI Badge */}
            {insightCount > 0 && (
                <div className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-teal-500 text-white text-xs font-bold shadow-md">
                    <SparklesIcon className="w-3 h-3" />
                    {insightCount}
                </div>
            )}

            {/* Patient Info */}
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-sm",
                    triageColor.bg
                )}>
                    {patient.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {patient.name.split(' ')[0]}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-semibold", triageColor.text)}>
                            {patient.triage?.level === 'Red' ? '🔴 Critical' :
                                patient.triage?.level === 'Yellow' ? '🟡 Moderate' :
                                    '🟢 Stable'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Last Interaction */}
            {lastInteraction && (
                <div className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <ClockIcon className="w-3 h-3" />
                    Last: {lastInteraction}
                </div>
            )}
        </motion.div>
    );
};

// Helper functions
const getTriageColor = (level?: string) => {
    switch (level) {
        case 'Red':
            return { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400' };
        case 'Yellow':
            return { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
        case 'Green':
            return { bg: 'bg-green-500', text: 'text-green-600 dark:text-green-400' };
        default:
            return { bg: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-400' };
    }
};

const getLastInteraction = (patient: Patient): string | null => {
    // Check vitals history
    if (patient.vitalsHistory && patient.vitalsHistory.length > 0) {
        const lastVitals = new Date(patient.vitalsHistory[0].recordedAt);
        return formatTimeAgo(lastVitals);
    }

    // Check timeline
    if (patient.timeline && patient.timeline.length > 0) {
        const lastEvent = new Date(patient.timeline[0].timestamp);
        return formatTimeAgo(lastEvent);
    }

    return null;
};

const formatTimeAgo = (date: Date): string => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);

    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

export default ActivePatientCard;
