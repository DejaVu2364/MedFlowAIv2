import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Patient, ActiveProblem } from '../../types';
import { usePatient } from '../../contexts/PatientContext';
import {
    ClockIcon, BeakerIcon, MoonIcon,
    ArrowTrendingUpIcon, ClipboardDocumentCheckIcon,
    ExclamationTriangleIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { TriageBadge } from '../common/TriageBadge';
import { AISummaryCard } from './AISummaryCard';
import { AIChangeCard } from './AIChangeCard';
import { ProblemList } from './ProblemList';
import { KeyTrends } from './KeyTrends';
import { AITaskList } from './AITaskList';
import { HandoverCard } from './HandoverCard';
import { RevenueAuditWidget } from '../RevenueAuditWidget';
import { cn } from '../../lib/utils';
import { checkRateLimit, getCachedOverview, setCachedOverview } from '../../services/tokenUsageTracker';

// --- SUB-SECTIONS ---

const TimelineCard: React.FC<{ patient: Patient }> = ({ patient }) => {
    // Convert patient timeline events to display format
    const events = useMemo(() => {
        if (!patient.timeline || patient.timeline.length === 0) {
            // Generate events from patient data (orders, results, vitals)
            const generatedEvents: { time: string; text: string; icon: string; color: string }[] = [];

            // Add recent orders as events
            patient.orders?.slice(0, 3).forEach(order => {
                const time = new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                generatedEvents.push({
                    time,
                    text: `${order.category === 'medication' ? '💊' : '🔬'} Order: ${order.label}`,
                    icon: order.status === 'completed' ? '✓' : '⏳',
                    color: order.status === 'completed' ? 'text-green-600' : 'text-amber-600'
                });
            });

            // Add recent results as events
            patient.results?.slice(0, 2).forEach(result => {
                const time = new Date(result.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                generatedEvents.push({
                    time,
                    text: `📋 Result: ${result.name} - ${result.value}`,
                    icon: result.isAbnormal ? '⚠️' : '✓',
                    color: result.isAbnormal ? 'text-red-600' : 'text-green-600'
                });
            });

            // Add vitals update if history exists
            if (patient.vitalsHistory && patient.vitalsHistory.length > 0) {
                const latestVitals = patient.vitalsHistory[0];
                const time = new Date(latestVitals.recordedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                generatedEvents.push({
                    time,
                    text: `📊 Vitals recorded - HR: ${latestVitals.measurements.pulse}, SpO2: ${latestVitals.measurements.spo2}%`,
                    icon: '💓',
                    color: 'text-teal-600'
                });
            }

            return generatedEvents.sort((a, b) => b.time.localeCompare(a.time));
        }

        // Map actual timeline events if they exist
        return patient.timeline.map(event => {
            if (event.type === 'TeamNote') {
                return {
                    time: new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    text: `📝 ${event.author}: ${event.content.substring(0, 50)}...`,
                    icon: event.isEscalation ? '🚨' : '💬',
                    color: event.isEscalation ? 'text-red-600' : 'text-slate-600'
                };
            } else if (event.type === 'Checklist') {
                const completed = event.items.filter(i => i.checked).length;
                return {
                    time: new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    text: `✅ ${event.title} (${completed}/${event.items.length})`,
                    icon: '📋',
                    color: completed === event.items.length ? 'text-green-600' : 'text-amber-600'
                };
            } else {
                // SOAPNote
                return {
                    time: new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    text: `🩺 SOAP Note by ${event.author}`,
                    icon: '📄',
                    color: 'text-blue-600'
                };
            }
        });
    }, [patient.timeline, patient.orders, patient.results, patient.vitalsHistory]);

    if (events.length === 0) {
        return (
            <Card className="shadow-sm border-dashed border-border/50 bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                        <ClockIcon className="w-7 h-7 opacity-60" />
                    </div>
                    <p className="font-medium text-sm">No Recent Activity</p>
                    <p className="text-xs mt-1 text-center max-w-[200px]">Events will appear as orders, results, and vitals are recorded.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-border/50">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <MoonIcon className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative border-l-2 border-muted ml-3 space-y-6 py-2">
                    {events.slice(0, 5).map((event, i) => (
                        <div key={i} className="ml-6 relative">
                            <div className="absolute -left-[1.95rem] top-0 bg-background border rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-sm z-10">
                                {event.icon}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                                <span className="text-xs font-bold text-muted-foreground font-mono">{event.time}</span>
                                <span className={cn("text-sm font-medium", event.color)}>{event.text}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};



const MedReviewCard: React.FC<{ patient: Patient }> = ({ patient }) => {
    // Get medication orders from patient data
    const medications = useMemo(() => {
        return (patient.orders || [])
            .filter(order => order.category === 'medication')
            .slice(0, 5);
    }, [patient.orders]);

    if (medications.length === 0) {
        return (
            <Card className="shadow-sm border-dashed border-border/50">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <BeakerIcon className="w-5 h-5 text-muted-foreground" />
                    <CardTitle className="text-base font-semibold">Medication Review</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <p className="text-sm">No active medications</p>
                </CardContent>
            </Card>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Given</Badge>;
            case 'in_progress':
                return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Active</Badge>;
            case 'sent':
                return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Ordered</Badge>;
            default:
                return <Badge variant="outline">Pending</Badge>;
        }
    };

    return (
        <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-border/50">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <BeakerIcon className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">Medication Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {medications.map((med, idx) => (
                    <React.Fragment key={med.orderId}>
                        {idx > 0 && <Separator />}
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-sm font-semibold">{med.label}</div>
                                <div className="text-xs text-muted-foreground">
                                    {new Date(med.createdAt).toLocaleDateString()} • {med.priority}
                                </div>
                            </div>
                            {getStatusBadge(med.status)}
                        </div>
                    </React.Fragment>
                ))}
            </CardContent>
        </Card>
    );
};

// --- MAIN COMPONENT ---

const MedViewRedesigned: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { generatePatientOverview, updateStateAndDb, isLoading } = usePatient();
    const hasAutoGenerated = useRef(false);
    const [aiError, setAiError] = useState<string | null>(null);

    // Auto-generate AI summary on mount (with rate limiting & caching)
    useEffect(() => {
        const autoGenerate = async () => {
            // Skip if already has overview or already attempted
            if (patient.overview || hasAutoGenerated.current || isLoading) {
                return;
            }

            // Check cache first (1 hour TTL)
            const cached = getCachedOverview(patient.id);
            if (cached) {
                // Use cached data - no API call needed
                return;
            }

            // Check rate limit
            const rateCheck = checkRateLimit();
            if (!rateCheck.allowed) {
                setAiError(`Rate limited. Try again in ${Math.ceil(rateCheck.waitMs / 1000)}s`);
                return;
            }

            hasAutoGenerated.current = true;
            setAiError(null);

            try {
                await generatePatientOverview(patient.id);
            } catch (err) {
                console.error('Failed to auto-generate overview:', err);
                setAiError('AI unavailable');
            }
        };

        autoGenerate();
    }, [patient.id, patient.overview, isLoading]);

    // Derive AI Changes from patient data
    const changes = useMemo(() => {
        const result: { category: 'vitals' | 'labs' | 'symptoms' | 'meds'; description: string; trend?: 'up' | 'down' | 'stable'; severity?: 'high' | 'medium' | 'low' }[] = [];

        // Check for abnormal results
        patient.results?.filter(r => r.isAbnormal).forEach(r => {
            result.push({
                category: 'labs',
                description: `${r.name}: ${r.value} (abnormal)`,
                severity: 'high',
                trend: 'up'
            });
        });

        // Check vitals for concerning trends
        if (patient.vitals) {
            if (patient.vitals.spo2 && patient.vitals.spo2 < 95) {
                result.push({
                    category: 'vitals',
                    description: `SpO2 low: ${patient.vitals.spo2}%`,
                    severity: 'high',
                    trend: 'down'
                });
            }
            if (patient.vitals.pulse && patient.vitals.pulse > 100) {
                result.push({
                    category: 'vitals',
                    description: `Tachycardia: HR ${patient.vitals.pulse}`,
                    severity: 'medium',
                    trend: 'up'
                });
            }
            if (patient.vitals.bp_sys && patient.vitals.bp_sys < 100) {
                result.push({
                    category: 'vitals',
                    description: `Hypotension: BP ${patient.vitals.bp_sys}/${patient.vitals.bp_dia}`,
                    severity: 'high',
                    trend: 'down'
                });
            }
        }

        return result;
    }, [patient.results, patient.vitals]);

    // Derive AI Tasks from patient data
    const [tasks, setTasks] = useState<{ id: string; description: string; priority: 'high' | 'medium' | 'low'; completed: boolean }[]>([]);

    // Generate tasks on mount or when patient changes
    useMemo(() => {
        const generatedTasks: typeof tasks = [];

        // Add tasks for pending orders
        const pendingOrders = (patient.orders || []).filter(o => o.status === 'sent' || o.status === 'in_progress');
        if (pendingOrders.length > 0) {
            generatedTasks.push({
                id: 'task-pending-orders',
                description: `Follow up on ${pendingOrders.length} pending orders`,
                priority: 'medium',
                completed: false
            });
        }

        // Add tasks for abnormal results
        const abnormalResults = (patient.results || []).filter(r => r.isAbnormal);
        if (abnormalResults.length > 0) {
            generatedTasks.push({
                id: 'task-abnormal-labs',
                description: `Review ${abnormalResults.length} abnormal lab results`,
                priority: 'high',
                completed: false
            });
        }

        // Add clinical documentation task
        if (patient.clinicalFile?.status === 'draft') {
            generatedTasks.push({
                id: 'task-sign-clinical',
                description: 'Complete and sign clinical file',
                priority: 'medium',
                completed: false
            });
        }

        // Add discharge planning task if patient is stable
        if (patient.triage?.level === 'Green' && patient.status === 'In Treatment') {
            generatedTasks.push({
                id: 'task-discharge-plan',
                description: 'Evaluate for discharge readiness',
                priority: 'low',
                completed: false
            });
        }

        setTasks(generatedTasks);
    }, [patient.id]);

    const toggleTask = (id: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    // Problem List Handlers
    const addProblem = () => {
        console.log("Add problem clicked");
    };

    const editProblem = (id: string) => {
        console.log("Edit problem", id);
    };

    const removeProblem = (id: string) => {
        updateStateAndDb(patient.id, p => ({ ...p, activeProblems: (p.activeProblems || []).filter(pr => pr.id !== id) }));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* AI Clinical Summary - Compact Hero */}
            <AISummaryCard
                summary={patient.overview?.summary || "AI summary will auto-generate. Click refresh if needed."}
                onRefresh={() => generatePatientOverview(patient.id)}
                isLoading={isLoading}
            />

            {/* Main 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Trends + Activity (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Key Trends - Always show */}
                    <KeyTrends patient={patient} />

                    {/* Recent Activity - Condensed */}
                    <TimelineCard patient={patient} />
                </div>

                {/* Right Column: Problems + Tasks (1/3 width) */}
                <div className="space-y-6">
                    {/* Active Problems - Priority info */}
                    <ProblemList
                        problems={patient.activeProblems || []}
                        onAdd={addProblem}
                        onEdit={editProblem}
                        onRemove={removeProblem}
                    />

                    {/* AI Tasks - Only if any exist */}
                    {tasks.length > 0 && (
                        <AITaskList tasks={tasks} onToggle={toggleTask} />
                    )}
                </div>
            </div>

            {/* Handover - Collapsible at bottom */}
            <details className="group">
                <summary className="cursor-pointer list-none">
                    <Card className="shadow-sm hover:shadow-md transition-all border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between py-3">
                            <div className="flex items-center gap-2">
                                <ClipboardDocumentCheckIcon className="w-5 h-5 text-muted-foreground" />
                                <CardTitle className="text-base font-semibold">Doctor-to-Doctor Handover</CardTitle>
                            </div>
                            <Badge variant="outline" className="text-xs">
                                {patient.handoverSummary ? 'Saved' : 'Draft'}
                            </Badge>
                        </CardHeader>
                    </Card>
                </summary>
                <div className="mt-2">
                    <HandoverCard
                        initialNote={patient.handoverSummary}
                        onSave={(note) => updateStateAndDb(patient.id, p => ({ ...p, handoverSummary: note }))}
                    />
                </div>
            </details>
        </div>
    );
};

export default MedViewRedesigned;
