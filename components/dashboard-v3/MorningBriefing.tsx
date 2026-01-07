// Morning Briefing Component - First-login greeting

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JarvisBriefing } from '../../types/jarvis';
import { generateMorningBriefing } from '../../services/jarvis/JarvisCore';
import { Patient } from '../../types';
import { SparklesIcon, ArrowRightIcon, UsersIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';

interface MorningBriefingProps {
    doctorName: string;
    patients: Patient[];
    onStart: () => void;
    onShowQueue: () => void;
}

export const MorningBriefing: React.FC<MorningBriefingProps> = ({
    doctorName,
    patients,
    onStart,
    onShowQueue
}) => {
    const [briefing, setBriefing] = useState<JarvisBriefing | null>(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const loadBriefing = async () => {
            const data = await generateMorningBriefing(doctorName, patients);
            setBriefing(data);
        };
        loadBriefing();
    }, [doctorName, patients]);

    const handleStart = () => {
        setIsVisible(false);
        setTimeout(onStart, 300);
    };

    if (!briefing) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="max-w-lg w-full mx-4 p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl"
                    >
                        {/* Jarvis Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
                                <SparklesIcon className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        {/* Greeting */}
                        <h1 className="text-3xl font-bold text-white text-center mb-2">
                            {briefing.greeting}
                        </h1>

                        {/* Summary */}
                        <p className="text-lg text-white/80 text-center mb-8">
                            {briefing.summary}
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <StatCard
                                label="Critical"
                                value={briefing.criticalCount}
                                color="text-red-400"
                            />
                            <StatCard
                                label="In Queue"
                                value={briefing.queueCount}
                                color="text-amber-400"
                            />
                            <StatCard
                                label="Discharge"
                                value={briefing.dischargeReadyCount}
                                color="text-green-400"
                            />
                        </div>

                        {/* Top Priority */}
                        {briefing.topPriority && (
                            <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-xs text-teal-300 font-semibold uppercase mb-1">
                                    🎯 I suggest starting with
                                </p>
                                <p className="text-white font-medium">
                                    {briefing.topPriority.patientName}
                                </p>
                                <p className="text-white/60 text-sm">
                                    {briefing.topPriority.reason}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                onClick={handleStart}
                                className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-6 text-lg font-semibold rounded-xl"
                            >
                                Start My Day
                                <ArrowRightIcon className="w-5 h-5 ml-2" />
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onShowQueue}
                                className="border-white/30 text-white hover:bg-white/10 py-6 rounded-xl"
                            >
                                <UsersIcon className="w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const StatCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div className="text-center p-3 rounded-lg bg-white/5">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-white/60 uppercase">{label}</p>
    </div>
);

export default MorningBriefing;
