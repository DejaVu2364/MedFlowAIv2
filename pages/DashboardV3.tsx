// DashboardV3 - AI-Powered Doctor Workstation

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import { useAuth } from '../contexts/AuthContext';
import { Patient } from '../types';
import { JarvisInsight, DoctorProfile } from '../types/jarvis';
import { generateDashboardInsights, getNextPatient } from '../services/jarvis/JarvisCore';
import { getOrCreateProfile, recordPatientSeen, recordSuggestionAccepted, recordSuggestionRejected } from '../services/jarvis/DoctorMemory';

// Components
import { MorningBriefing } from '../components/dashboard-v3/MorningBriefing';
import { AIWhisperBar } from '../components/dashboard-v3/AIWhisperBar';
import { NextPatientCard } from '../components/dashboard-v3/NextPatientCard';
import { ActivePatientCard } from '../components/dashboard-v3/ActivePatientCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

import { Search as SearchIcon, UserPlus as UserPlusIcon, RefreshCw as RefreshCwIcon, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

const DashboardV3: React.FC = () => {
    const navigate = useNavigate();
    const { patients, isLoading } = usePatient();
    const { currentUser } = useAuth();

    // State
    const [showBriefing, setShowBriefing] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);
    const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);

    // Initialize doctor profile
    useEffect(() => {
        if (currentUser) {
            const profile = getOrCreateProfile(
                currentUser.id,
                currentUser.name,
                currentUser.email || ''
            );
            setDoctorProfile(profile);
        }
    }, [currentUser]);

    // Check if first visit today (for briefing)
    useEffect(() => {
        const today = new Date().toDateString();
        const lastVisit = localStorage.getItem('medflow_last_visit');
        if (lastVisit === today) {
            setShowBriefing(false);
        } else {
            localStorage.setItem('medflow_last_visit', today);
        }
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'n':
                    handleSeeNextPatient();
                    break;
                case 's':
                    document.getElementById('dashboard-search')?.focus();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [patients]);

    // Derived data
    const nextPatient = useMemo(() => getNextPatient(patients), [patients]);

    const activePatients = useMemo(() =>
        patients.filter(p => p.status === 'In Treatment').slice(0, 5),
        [patients]
    );

    const queuePatients = useMemo(() =>
        patients.filter(p => p.status === 'Waiting for Doctor').slice(0, 5),
        [patients]
    );

    const insights = useMemo(() => {
        const allInsights = generateDashboardInsights(patients, doctorProfile || undefined);
        return allInsights.filter(i => !dismissedInsights.includes(i.id));
    }, [patients, doctorProfile, dismissedInsights]);

    const nextPatientInsight = useMemo(() => {
        if (!nextPatient) return undefined;
        return insights.find(i => i.patientId === nextPatient.id);
    }, [nextPatient, insights]);

    const patientInsightCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        insights.forEach(i => {
            counts[i.patientId] = (counts[i.patientId] || 0) + 1;
        });
        return counts;
    }, [insights]);

    const filteredPatients = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return patients
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .slice(0, 5);
    }, [patients, searchQuery]);

    // Handlers
    const handleSeeNextPatient = useCallback(() => {
        if (nextPatient) {
            if (doctorProfile) {
                recordPatientSeen(doctorProfile, nextPatient.id);
            }
            navigate(`/patient/${nextPatient.id}/medview`);
        }
    }, [nextPatient, doctorProfile, navigate]);

    const handleSkipPatient = useCallback(() => {
        // In a real app, this would update queue order
        console.log('Skipped patient:', nextPatient?.id);
    }, [nextPatient]);

    const handlePatientClick = useCallback((patientId: string) => {
        if (doctorProfile) {
            recordPatientSeen(doctorProfile, patientId);
        }
        navigate(`/patient/${patientId}/medview`);
    }, [doctorProfile, navigate]);

    const handleInsightClick = useCallback((insight: JarvisInsight) => {
        if (insight.suggestedAction?.type === 'navigate') {
            const route = insight.suggestedAction.payload?.route as string;
            if (route) navigate(route);
        }
        if (doctorProfile) {
            recordSuggestionAccepted(doctorProfile);
        }
    }, [doctorProfile, navigate]);

    const handleDismissInsight = useCallback((insightId: string) => {
        setDismissedInsights(prev => [...prev, insightId]);
        if (doctorProfile) {
            recordSuggestionRejected(doctorProfile, insightId);
        }
    }, [doctorProfile]);

    // Greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Loading state
    if (isLoading && patients.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen">
                <RefreshCwIcon className="w-6 h-6 text-teal-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Morning Briefing Overlay */}
            {showBriefing && currentUser && (
                <MorningBriefing
                    doctorName={currentUser.name}
                    patients={patients}
                    onStart={() => {
                        setShowBriefing(false);
                        if (nextPatient) handleSeeNextPatient();
                    }}
                    onShowQueue={() => setShowBriefing(false)}
                />
            )}

            <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                {/* AI Whisper Bar */}
                {insights.length > 0 && (
                    <AIWhisperBar
                        insights={insights}
                        onInsightClick={handleInsightClick}
                        onDismiss={handleDismissInsight}
                    />
                )}

                {/* Header */}
                <header className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                            {getGreeting()}, <span className="text-teal-600">{currentUser?.name?.split(' ')[0] || 'Doctor'}</span>
                        </h1>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </span>
                            <span>{patients.length} patients</span>
                        </div>
                    </div>

                    <Button
                        onClick={() => navigate('/register')}
                        className="bg-teal-600 hover:bg-teal-500"
                    >
                        <UserPlusIcon className="w-4 h-4 mr-2" />
                        Register Patient
                    </Button>
                </header>

                {/* Search */}
                <div className="relative max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        id="dashboard-search"
                        type="text"
                        placeholder="Search patients... (Press S)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                    {filteredPatients.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
                            {filteredPatients.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => { handlePatientClick(p.id); setSearchQuery(''); }}
                                    className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-400 font-semibold text-sm">
                                        {p.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{p.name}</p>
                                        <p className="text-xs text-slate-500">{p.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Next Patient Hero Card */}
                <NextPatientCard
                    patient={nextPatient}
                    insight={nextPatientInsight}
                    onSeePatient={handleSeeNextPatient}
                    onSkip={handleSkipPatient}
                />

                {/* Patient Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* My Active Patients */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                            My Active ({activePatients.length})
                        </h3>
                        {activePatients.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">No active patients</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {activePatients.map(patient => (
                                    <ActivePatientCard
                                        key={patient.id}
                                        patient={patient}
                                        insightCount={patientInsightCounts[patient.id] || 0}
                                        onClick={() => handlePatientClick(patient.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Queue */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                            Queue ({queuePatients.length})
                        </h3>
                        {queuePatients.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">Queue is clear</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {queuePatients.map(patient => (
                                    <ActivePatientCard
                                        key={patient.id}
                                        patient={patient}
                                        insightCount={patientInsightCounts[patient.id] || 0}
                                        onClick={() => handlePatientClick(patient.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Keyboard Hints */}
                <div className="text-center text-xs text-slate-400 dark:text-slate-500 pt-4">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">N</kbd> Next Patient •{' '}
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">S</kbd> Search
                </div>
            </div>
        </div>
    );
};

export default DashboardV3;
