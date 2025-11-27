import React, { useState, useMemo } from 'react';
import { Patient, Order, VitalsRecord, TimelineEvent, ActiveProblem, OrderStatus } from '../../types';
import { usePatient } from '../../contexts/PatientContext';
import {
    SparklesIcon, ClockIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
    ExclamationTriangleIcon, CheckCircleIcon, BeakerIcon,
    ClipboardDocumentCheckIcon, UserIcon, MoonIcon, SunIcon,
    ChevronDownIcon, ChevronUpIcon, PlusIcon, PencilIcon, TrashIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import TextareaAutosize from 'react-textarea-autosize';

// --- HELPER COMPONENTS ---

const Card: React.FC<{ title: string; icon?: React.ElementType; children: React.ReactNode; className?: string; action?: React.ReactNode }> = ({ title, icon: Icon, children, className = '', action }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden ${className}`}>
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">{title}</h3>
            </div>
            {action}
        </div>
        <div className="p-4">
            {children}
        </div>
    </div>
);

const Badge: React.FC<{ children: React.ReactNode; color?: 'red' | 'yellow' | 'green' | 'blue' | 'gray'; className?: string }> = ({ children, color = 'gray', className = '' }) => {
    const colors = {
        red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
        green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
        blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
        gray: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colors[color]} ${className}`}>
            {children}
        </span>
    );
};

// --- SUB-SECTIONS ---

const PatientHeader: React.FC<{ patient: Patient }> = ({ patient }) => {
    const vitals = patient.vitals;
    return (
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm mb-6 -mx-4 sm:-mx-6 lg:-mx-8 mt-[-1.5rem] sm:mt-[-2rem] lg:mt-[-2rem]">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                        {patient.name.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">{patient.name}</h1>
                            <Badge color={patient.triage.level === 'Red' ? 'red' : patient.triage.level === 'Yellow' ? 'yellow' : 'green'}>{patient.status}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                            <span>{patient.age}y / {patient.gender}</span>
                            <span className="text-gray-300">|</span>
                            <span className="font-mono">UHID: {patient.id.slice(-6)}</span>
                            <span className="text-gray-300">|</span>
                            <span>Ward A, Bed 4</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                        <span className="text-[10px] uppercase text-gray-400 font-bold">HR</span>
                        <span className={`text-sm font-bold ${vitals?.pulse && vitals.pulse > 100 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{vitals?.pulse || '--'}</span>
                    </div>
                    <div className="flex flex-col items-center px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                        <span className="text-[10px] uppercase text-gray-400 font-bold">BP</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{vitals?.bp_sys}/{vitals?.bp_dia || '--'}</span>
                    </div>
                    <div className="flex flex-col items-center px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                        <span className="text-[10px] uppercase text-gray-400 font-bold">SpO2</span>
                        <span className={`text-sm font-bold ${vitals?.spo2 && vitals.spo2 < 95 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{vitals?.spo2 || '--'}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SummaryCard: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { generatePatientOverview, isLoading } = usePatient();

    return (
        <Card title="AI 24-Hour Clinical Summary" icon={SparklesIcon} className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800 border-indigo-100 dark:border-indigo-900/50"
            action={
                <button onClick={() => generatePatientOverview(patient.id)} disabled={isLoading} className="text-xs flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                    <SparklesIcon className="w-3 h-3" /> Refresh
                </button>
            }
        >
            <div className="prose prose-sm dark:prose-invert max-w-none">
                {patient.overview?.summary ? (
                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {patient.overview.summary}
                    </div>
                ) : (
                    <div className="text-center py-4 text-gray-400 text-sm italic">
                        Click refresh to generate a 24-hour summary.
                    </div>
                )}
            </div>
        </Card>
    );
};

const ChangeCard: React.FC<{ patient: Patient }> = ({ patient }) => {
    // Mock logic for changes - in real app would compare with historical data
    return (
        <Card title="What Changed Since Yesterday" icon={ArrowTrendingUpIcon} className="border-l-4 border-l-blue-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Vitals Changes */}
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase">Vitals</h4>
                    <div className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">HR</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-gray-900 dark:text-white">
                            76 <span className="text-gray-400">→</span> 92 <span className="text-red-500 text-xs">↑</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">BP</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-gray-900 dark:text-white">
                            160/100 <span className="text-gray-400">→</span> 138/90 <span className="text-green-500 text-xs">↓</span>
                        </div>
                    </div>
                </div>

                {/* Lab Changes */}
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase">Labs</h4>
                    <div className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">CRP</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-gray-900 dark:text-white">
                            24 <span className="text-gray-400">→</span> 62 <span className="text-red-500 text-xs">↑↑</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Na+</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-gray-900 dark:text-white">
                            129 <span className="text-gray-400">→</span> 134 <span className="text-green-500 text-xs">ok</span>
                        </div>
                    </div>
                </div>

                {/* Symptom Changes */}
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase">Symptoms</h4>
                    <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400"><CheckCircleIcon className="w-4 h-4" /> Headache improved</div>
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400"><CheckCircleIcon className="w-4 h-4" /> Vomiting resolved</div>
                        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400"><ExclamationTriangleIcon className="w-4 h-4" /> Nausea persists</div>
                    </div>
                </div>

                {/* Med Changes */}
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase">Meds</h4>
                    <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400"><PlusIcon className="w-3 h-3" /> Ondansetron added</div>
                        <div className="flex items-center gap-2 text-red-500 dark:text-red-400"><ExclamationTriangleIcon className="w-3 h-3" /> Missed Amlodipine</div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

const TimelineCard: React.FC<{ patient: Patient }> = ({ patient }) => {
    // Mock events for now, ideally derived from timeline/audit log
    const events = [
        { time: '21:15', text: 'BP rose to 170/100 → Hydralazine given', icon: '⚠️', color: 'text-red-500' },
        { time: '22:00', text: 'Vomited once → Ondansetron given', icon: '🤮', color: 'text-orange-500' },
        { time: '01:30', text: 'Fever spike to 38.6°C → Paracetamol administered', icon: '🌡️', color: 'text-red-500' },
        { time: '04:00', text: 'SpO₂ dropped to 92% → Oxygen started', icon: '🫁', color: 'text-blue-500' },
    ];

    return (
        <Card title="Overnight Events (8 PM - Now)" icon={MoonIcon}>
            <div className="relative border-l-2 border-gray-100 dark:border-gray-700 ml-3 space-y-6 py-2">
                {events.map((event, i) => (
                    <div key={i} className="ml-6 relative">
                        <div className="absolute -left-[1.95rem] top-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-sm">
                            {event.icon}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                            <span className="text-xs font-bold text-gray-400 font-mono">{event.time}</span>
                            <span className={`text-sm font-medium ${event.color} dark:text-gray-200`}>{event.text}</span>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const Sparkline: React.FC<{ data: any[], dataKey: string, color: string, label: string }> = ({ data, dataKey, color, label }) => {
    const latest = data[data.length - 1]?.[dataKey] || 0;
    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] uppercase font-bold text-gray-400">{label}</span>
                <span className={`text-lg font-bold text-${color}-600 dark:text-${color}-400 leading-none`}>{latest}</span>
            </div>
            <div className="h-12 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <Line type="monotone" dataKey={dataKey} stroke={color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#10b981'} strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const TrendCard: React.FC<{ patient: Patient }> = ({ patient }) => {
    // Mock data generation if history is empty
    const data = useMemo(() => {
        if (patient.vitalsHistory.length > 5) return patient.vitalsHistory.map(v => v.measurements);
        // Generate mock trend
        return Array.from({ length: 24 }, (_, i) => ({
            pulse: 70 + Math.random() * 20,
            bp_sys: 110 + Math.random() * 30,
            spo2: 94 + Math.random() * 5,
            rr: 14 + Math.random() * 6,
            temp_c: 36.5 + Math.random() * 1.5
        }));
    }, [patient.vitalsHistory]);

    return (
        <Card title="Key Trends (Last 24h)" icon={ArrowTrendingUpIcon}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <Sparkline data={data} dataKey="pulse" color="red" label="Heart Rate" />
                <Sparkline data={data} dataKey="bp_sys" color="blue" label="BP (Sys)" />
                <Sparkline data={data} dataKey="rr" color="green" label="Resp Rate" />
                <Sparkline data={data} dataKey="temp_c" color="orange" label="Temp" />
                <Sparkline data={data} dataKey="spo2" color="blue" label="SpO2" />
            </div>
        </Card>
    );
};

const ProblemListCard: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { updateStateAndDb } = usePatient();
    const [isEditing, setIsEditing] = useState(false);
    const [newProblem, setNewProblem] = useState('');

    const problems = patient.activeProblems || [
        { id: '1', description: 'Hypertensive urgency', status: 'improving' },
        { id: '2', description: 'Raised CRP', status: 'urgent' },
        { id: '3', description: 'Nausea', status: 'monitor' },
    ];

    const addProblem = () => {
        if (!newProblem.trim()) return;
        const newP: ActiveProblem = { id: Date.now().toString(), description: newProblem, status: 'monitor' };
        updateStateAndDb(patient.id, p => ({ ...p, activeProblems: [...(p.activeProblems || []), newP] }));
        setNewProblem('');
    };

    const removeProblem = (id: string) => {
        updateStateAndDb(patient.id, p => ({ ...p, activeProblems: (p.activeProblems || []).filter(pr => pr.id !== id) }));
    };

    return (
        <Card title="Active Problems (Prioritized)" icon={ClipboardDocumentCheckIcon} action={<button onClick={() => setIsEditing(!isEditing)} className="text-gray-400 hover:text-blue-500"><PencilIcon className="w-4 h-4" /></button>}>
            <div className="space-y-2">
                {problems.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${p.status === 'urgent' ? 'bg-red-500' : p.status === 'improving' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{p.description}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge color={p.status === 'urgent' ? 'red' : p.status === 'improving' ? 'green' : 'yellow'}>{p.status}</Badge>
                            {isEditing && <button onClick={() => removeProblem(p.id)} className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>}
                        </div>
                    </div>
                ))}
                {isEditing && (
                    <div className="flex gap-2 mt-2">
                        <input
                            type="text"
                            value={newProblem}
                            onChange={e => setNewProblem(e.target.value)}
                            placeholder="Add new problem..."
                            className="flex-1 text-sm p-2 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyDown={e => e.key === 'Enter' && addProblem()}
                        />
                        <button onClick={addProblem} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"><PlusIcon className="w-4 h-4" /></button>
                    </div>
                )}
            </div>
        </Card>
    );
};

const MedReviewCard: React.FC<{ patient: Patient }> = ({ patient }) => {
    return (
        <Card title="Medication Review" icon={BeakerIcon}>
            <div className="space-y-3">
                <div className="flex justify-between items-center p-2 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">Amlodipine 5 mg OD</div>
                        <div className="text-xs text-red-500 font-medium">Missed yesterday</div>
                    </div>
                    <Badge color="red">Missed</Badge>
                </div>
                <div className="flex justify-between items-center p-2 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">Ondansetron</div>
                        <div className="text-xs text-green-600 dark:text-green-400">Given x2 overnight</div>
                    </div>
                    <Badge color="green">Active</Badge>
                </div>
                <div className="flex justify-between items-center p-2">
                    <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">Paracetamol</div>
                        <div className="text-xs text-blue-500">Next dose due at 10:00 AM</div>
                    </div>
                    <Badge color="blue">Due Soon</Badge>
                </div>
            </div>
        </Card>
    );
};

const PendingTasksCard: React.FC<{ patient: Patient }> = ({ patient }) => {
    return (
        <Card title="Pending Tasks & Orders" icon={ClockIcon}>
            <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                    <BeakerIcon className="w-5 h-5 text-yellow-600" />
                    <div className="flex-1">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">Pending Lab Results</div>
                        <div className="text-xs text-gray-500">Blood Culture (24h)</div>
                    </div>
                    <span className="text-xs font-mono text-gray-400">2h ago</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                    <ClipboardDocumentCheckIcon className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">Nurse Task</div>
                        <div className="text-xs text-gray-500">Change wound dressing</div>
                    </div>
                    <span className="text-xs font-mono text-gray-400">Due 10:00</span>
                </div>
            </div>
        </Card>
    );
};

const HandoverCard: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { generateHandoverSummary, updateStateAndDb } = usePatient();
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mt-6">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">Doctor-to-Doctor Handover</h3>
                </div>
                {isOpen ? <ChevronUpIcon className="w-4 h-4 text-gray-400" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
            </button>
            {isOpen && (
                <div className="p-4">
                    <TextareaAutosize
                        minRows={3}
                        placeholder="Type handover notes here..."
                        defaultValue={patient.handoverSummary || "• BP stabilized after 2AM dose.\n• CRP rising — repeat sample at 10 AM.\n• Patient anxious; counsel in rounds."}
                        onChange={(e) => updateStateAndDb(patient.id, p => ({ ...p, handoverSummary: e.target.value }))}
                        className="w-full p-3 bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none resize-none leading-relaxed font-medium"
                    />
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---

const MedViewRedesigned: React.FC<{ patient: Patient }> = ({ patient }) => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            <PatientHeader patient={patient} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <SummaryCard patient={patient} />
                <ChangeCard patient={patient} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <TimelineCard patient={patient} />
                        <TrendCard patient={patient} />
                    </div>
                    <div className="space-y-6">
                        <ProblemListCard patient={patient} />
                        <MedReviewCard patient={patient} />
                        <PendingTasksCard patient={patient} />
                    </div>
                </div>

                <HandoverCard patient={patient} />
            </div>
        </div>
    );
};

export default MedViewRedesigned;
