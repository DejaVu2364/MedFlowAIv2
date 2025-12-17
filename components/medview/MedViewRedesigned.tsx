import React, { useState, useMemo } from 'react';
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

// --- SUB-SECTIONS ---

const PatientHeader: React.FC<{ patient: Patient }> = ({ patient }) => {
    const vitals = patient.vitals;

    // Determine risk level based on triage or vitals (mock logic)
    const riskLevel = patient.triage.level === 'Red' ? 'high' : patient.triage.level === 'Yellow' ? 'medium' : 'low';

    return (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3 shadow-sm mb-6 -mx-4 sm:-mx-6 lg:-mx-8 mt-[-1.5rem] sm:mt-[-2rem] lg:mt-[-2rem]">
            <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md">
                        {patient.name.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold leading-none tracking-tight">{patient.name}</h1>
                            <TriageBadge level={patient.triage.level} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-medium">
                            <span>{patient.age}y / {patient.gender}</span>
                            <Separator orientation="vertical" className="h-3" />
                            <span className="font-mono">UHID: {patient.id.slice(-6)}</span>
                            <Separator orientation="vertical" className="h-3" />
                            <span>Ward A, Bed 4</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {patient.chiefComplaints?.map((c, i) => (
                                <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal bg-muted/50 text-muted-foreground border-border/50">
                                    {c.complaint} ({c.durationValue}{c.durationUnit.charAt(0)})
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center px-3 py-1 bg-muted/50 rounded-lg border">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold">HR</span>
                        <span className={cn("text-sm font-bold", vitals?.pulse && vitals.pulse > 100 ? "text-destructive" : "text-foreground")}>{vitals?.pulse || '--'}</span>
                    </div>
                    <div className="flex flex-col items-center px-3 py-1 bg-muted/50 rounded-lg border">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold">BP</span>
                        <span className="text-sm font-bold text-foreground">{vitals?.bp_sys}/{vitals?.bp_dia || '--'}</span>
                    </div>
                    <div className="flex flex-col items-center px-3 py-1 bg-muted/50 rounded-lg border">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold">SpO2</span>
                        <span className={cn("text-sm font-bold", vitals?.spo2 && vitals.spo2 < 95 ? "text-destructive" : "text-foreground")}>{vitals?.spo2 || '--'}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TimelineCard: React.FC<{ patient: Patient }> = ({ patient }) => {
    // Mock events - REMOVED for production readiness
    // In a real app, this would come from patient.timeline or a specific 'events' field
    const events: { time: string; text: string; icon: string; color: string }[] = [];

    if (events.length === 0) {
        return (
            <Card className="shadow-sm border-dashed border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <ClockIcon className="w-8 h-8 mb-2 opacity-50" />
                    <p>No recent timeline events</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-border/50">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <MoonIcon className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">Overnight Events (8 PM - Now)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative border-l-2 border-muted ml-3 space-y-6 py-2">
                    {events.map((event, i) => (
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
    // Placeholder logic for empty state
    const hasMeds = false;

    if (!hasMeds) {
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

    return (
        <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-border/50">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <BeakerIcon className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">Medication Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-sm font-semibold">Amlodipine 5 mg OD</div>
                        <div className="text-xs text-destructive font-medium">Missed yesterday</div>
                    </div>
                    <Badge variant="destructive">Missed</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-sm font-semibold">Ondansetron</div>
                        <div className="text-xs text-green-600 dark:text-green-400">Given x2 overnight</div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-sm font-semibold">Paracetamol</div>
                        <div className="text-xs text-blue-500">Next dose due at 10:00 AM</div>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Due Soon</Badge>
                </div>
            </CardContent>
        </Card>
    );
};

// --- MAIN COMPONENT ---

const MedViewRedesigned: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { generatePatientOverview, updateStateAndDb, isLoading } = usePatient();

    // Mock Changes Data - REMOVED
    const changes: { category: 'vitals' | 'labs' | 'symptoms' | 'meds'; description: string; trend?: 'up' | 'down' | 'stable'; severity?: 'high' | 'medium' | 'low' }[] = [];

    // Mock Tasks Data - REMOVED
    const [tasks, setTasks] = useState<{ id: string; description: string; priority: 'high' | 'medium' | 'low'; completed: boolean }[]>([]);

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
        <div className="min-h-screen bg-background pb-20">
            <PatientHeader patient={patient} />

            <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <AISummaryCard
                    summary={patient.overview?.summary || "Click refresh to generate summary."}
                    onRefresh={() => generatePatientOverview(patient.id)}
                    isLoading={isLoading}
                />

                <AIChangeCard changes={changes} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {patient.timeline.length > 0 ? (
                            <TimelineCard patient={patient} />
                        ) : (
                            <Card className="shadow-sm border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <ClockIcon className="w-8 h-8 mb-2 opacity-50" />
                                    <p>No recent timeline events</p>
                                </CardContent>
                            </Card>
                        )}

                        {patient.vitalsHistory.length > 0 ? (
                            <KeyTrends patient={patient} />
                        ) : (
                            <Card className="shadow-sm border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <ArrowTrendingUpIcon className="w-8 h-8 mb-2 opacity-50" />
                                    <p>No vitals trend data available</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    <div className="space-y-8">
                        <RevenueAuditWidget patient={patient} />
                        <ProblemList
                            problems={patient.activeProblems || []}
                            onAdd={addProblem}
                            onEdit={editProblem}
                            onRemove={removeProblem}
                        />
                        <MedReviewCard patient={patient} />
                        <AITaskList tasks={tasks} onToggle={toggleTask} />
                    </div>
                </div>

                <HandoverCard
                    initialNote={patient.handoverSummary}
                    onSave={(note) => updateStateAndDb(patient.id, p => ({ ...p, handoverSummary: note }))}
                />
            </div>
        </div>
    );
};

export default MedViewRedesigned;
