import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../ui/button';

import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import {
    Send,
    Mic,
    MicOff,
    Sparkles,
    X,
    Check,
    AlertCircle,
    FileText,
    Pill,
    ClipboardList,
    RefreshCw,
    User
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';
import { cn } from '../../lib/utils';
import { usePatient } from '../../contexts/PatientContext';
import { useParams, useLocation } from 'react-router-dom';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useDoctorProfile } from '../../hooks/useDoctorProfile';
import { chatWithGemini } from '../../services/geminiService';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { Patient } from '../../types';

// Types
interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    sources?: string[];
    pendingAction?: PendingAction;
    executedAction?: ExecutedAction;
}

interface PendingAction {
    id: string;
    type: 'order' | 'medication' | 'note';
    items: string[];
    patientId: string;
    patientName: string;
    status: 'pending' | 'confirmed' | 'cancelled';
}

interface ExecutedAction {
    id: string;
    type: string;
    items: string[];
    executedAt: Date;
    success: boolean;
}

// NOTE: DoctorProfile type is now in useDoctorProfile hook
// Legacy getDoctorProfile kept for reference but hook is used instead

// AI Status Banner Component
const AIStatusBanner: React.FC = () => {
    const { status } = useConnectionStatus();

    if (status.gemini === 'connected' || status.gemini === 'checking') {
        return null;
    }

    return (
        <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs text-amber-700 dark:text-amber-300">
                {status.gemini === 'no-key'
                    ? 'AI key not configured. Running in offline demo mode.'
                    : 'AI service unavailable. Using local fallback.'}
            </span>
        </div>
    );
};

// Build patient context for RAG
const buildPatientContext = (patient: Patient): string => {
    const parts: string[] = [];

    parts.push(`PATIENT: ${patient.name}, ${patient.age}y ${patient.gender}`);
    parts.push(`STATUS: ${patient.status}`);

    if (patient.chiefComplaints?.length) {
        parts.push(`CHIEF COMPLAINTS: ${patient.chiefComplaints.map(c => c.complaint).join(', ')}`);
    }

    if (patient.vitals) {
        parts.push(`VITALS: BP ${patient.vitals.bp_sys}/${patient.vitals.bp_dia}, HR ${patient.vitals.pulse}, SpO2 ${patient.vitals.spo2}%`);
    }

    if (patient.orders?.length) {
        const activeOrders = patient.orders.filter(o => o.status !== 'cancelled');
        parts.push(`ACTIVE ORDERS: ${activeOrders.map(o => `${o.label} (${o.status})`).join(', ')}`);
    }

    return parts.join('\n');
};

// Search for patient by name or ID
const searchPatient = (query: string, patients: Patient[]): Patient | null => {
    const q = query.toLowerCase().trim();
    // Try exact ID match first
    const byId = patients.find(p => p.id.toLowerCase() === q);
    if (byId) return byId;
    // Try name match
    const byName = patients.find(p => p.name.toLowerCase().includes(q));
    if (byName) return byName;
    return null;
};

// Parse load patient command
const parseLoadPatientCommand = (input: string): string | null => {
    const match = input.match(/(?:load|open|show|switch to)\s+(?:patient\s+)?(.+)/i);
    return match ? match[1].trim() : null;
};

// Parse action commands
const parseActionCommand = (input: string, patient: Patient | null): PendingAction | null => {
    if (!patient) return null;
    const lowerInput = input.toLowerCase();

    // MEDICATIONS
    const medMatch = input.match(/(?:start|prescribe|give)\s+(.+?)\s+(\d+\s*(?:mg|g|mcg|ml))\s+(bd|od|tds|qid|prn|stat)/i);
    if (medMatch) {
        return {
            id: `action-${Date.now()}`,
            type: 'medication',
            items: [medMatch[1].trim()],
            patientId: patient.id,
            patientName: patient.name,
            status: 'pending'
        };
    }

    // RADIOLOGY
    const radMatch = input.match(/(?:order|get|do)\s+(ct|mri|x-ray|xray|ultrasound)\s+(.+)/i);
    if (radMatch) {
        return {
            id: `action-${Date.now()}`,
            type: 'order',
            items: [`${radMatch[1].toUpperCase()} ${radMatch[2]}`],
            patientId: patient.id,
            patientName: patient.name,
            status: 'pending'
        };
    }

    // INVESTIGATIONS (Fallback)
    const orderMatch = input.match(/(?:order|add|do|get|send for)\s+(?:a\s+)?(.+?)(?:\s+for\s+|$)/i);
    if (orderMatch && !lowerInput.includes('scan') && !lowerInput.includes('x-ray')) {
        const orderText = orderMatch[1];
        const items = orderText.split(/,|\s+and\s+/).map(s => s.trim()).filter(Boolean);
        if (items.length > 0) {
            return {
                id: `action-${Date.now()}`,
                type: 'order',
                items,
                patientId: patient.id,
                patientName: patient.name,
                status: 'pending'
            };
        }
    }

    return null;
};

// Quick Actions
const dashboardActions = [
    { label: 'Critical Patients', icon: AlertCircle, prompt: 'Show me critical patients' },
    { label: 'Queue Status', icon: User, prompt: 'What is the queue status?' },
    { label: 'Pending Orders', icon: ClipboardList, prompt: 'Show pending orders' },
];

const patientActions = [
    { label: 'Summarize', icon: FileText, prompt: 'Summarize this patient case' },
    { label: 'Suggest Orders', icon: ClipboardList, prompt: 'Suggest investigations' },
    { label: 'Check Drugs', icon: Pill, prompt: 'Check interactions' },
];

// Pending Action Card
const PendingActionCard: React.FC<{ action: PendingAction; onConfirm: () => void; onCancel: () => void }> = ({ action, onConfirm, onCancel }) => (
    <Card className="border-amber-200 bg-amber-50/50 mt-2">
        <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Pending Orders</span>
            </div>
            <div className="space-y-1 mb-2">
                {action.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>{item}</span>
                    </div>
                ))}
            </div>
            <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs hover:bg-amber-100 text-amber-900">Cancel</Button>
                <Button size="sm" onClick={onConfirm} className="h-7 text-xs bg-teal-600 hover:bg-teal-700">Confirm</Button>
            </div>
        </CardContent>
    </Card>
);

// Executed Action Card
const ExecutedActionCard: React.FC<{ action: ExecutedAction }> = ({ action }) => (
    <Card className="border-green-200 bg-green-50/50 mt-2">
        <CardContent className="p-3">
            <div className="flex items-center gap-2 text-green-800 font-medium text-sm mb-1">
                <Check className="w-4 h-4" /> Orders Placed
            </div>
            <div className="text-xs text-green-700 pl-6">
                {action.items.join(', ')}
            </div>
        </CardContent>
    </Card>
);

// Message Bubble
const MessageBubble: React.FC<{ message: Message; onConfirmAction?: () => void; onCancelAction?: () => void }> = ({
    message, onConfirmAction, onCancelAction
}) => {
    const isUser = message.role === 'user';
    return (
        <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
            <div className={cn(
                "max-w-[85%] rounded-2xl p-3 text-sm whitespace-pre-wrap shadow-sm",
                isUser ? "bg-teal-600 text-white rounded-tr-sm" : "bg-slate-100 text-slate-800 rounded-tl-sm"
            )}>
                <ReactMarkdown
                    components={{
                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                        strong: ({ node, ...props }) => <span className="font-bold" {...props} />,
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />
                    }}
                >
                    {message.content}
                </ReactMarkdown>

                {message.pendingAction && message.pendingAction.status === 'pending' && onConfirmAction && onCancelAction && (
                    <div className="mt-2">
                        <PendingActionCard action={message.pendingAction} onConfirm={onConfirmAction} onCancel={onCancelAction} />
                    </div>
                )}

                {message.executedAction && (
                    <div className="mt-2">
                        <ExecutedActionCard action={message.executedAction} />
                    </div>
                )}

                {message.sources && message.sources.length > 0 && (
                    <div className={cn("mt-2 text-[10px]", isUser ? "text-teal-100" : "text-slate-500")}>
                        Sources: {message.sources.join(', ')}
                    </div>
                )}
            </div>
        </div>
    );
};

export const UnifiedAICopilot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [loadedPatient, setLoadedPatient] = useState<Patient | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const { id } = useParams<{ id: string }>();
    const { patients, updateStateAndDb } = usePatient();
    const location = useLocation();
    const { isListening, transcript, startListening, stopListening, resetTranscript, hasSupport } = useSpeechRecognition();
    const doctorProfile = useDoctorProfile();

    // Current Patient & Profile
    const patientId = id || location.pathname.match(/\/patient[^/]*\/([^/]+)/)?.[1];
    const patient = useMemo(() => patients.find(p => p.id === patientId), [patients, patientId]);

    // Dashboard Context Stats
    const dashboardStats = useMemo(() => {
        if (location.pathname !== '/' && !location.pathname.includes('dashboard')) return null;

        const critical = patients.filter(p => p.triage?.level === 'Red');
        const waiting = patients.filter(p => p.status === 'Waiting for Doctor');
        const pending = patients.reduce((acc, p) => acc + (p.orders?.filter(o => o.status === 'draft')?.length || 0), 0);

        return {
            counts: {
                critical: critical.length,
                waiting: waiting.length,
                pending
            },
            criticalPatients: critical.map(p => ({
                name: p.name,
                complaint: p.chiefComplaints?.[0]?.complaint || 'Unknown',
                age: p.age,
                gender: p.gender
            })),
            waitingPatients: waiting.slice(0, 10).map(p => ({ name: p.name, status: p.status }))
        };
    }, [patients, location.pathname]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping, isOpen]);

    // Voice
    useEffect(() => {
        if (transcript) {
            setInput(prev => (prev ? prev + ' ' : '') + transcript);
            resetTranscript();
        }
    }, [transcript, resetTranscript]);

    // Initial Greeting
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            let greeting = `Good day, ${doctorProfile.name}. `;
            const activePatient = loadedPatient || patient;

            if (activePatient) {
                greeting += `I'm ready to assist with ${activePatient.name}.`;
            } else if (dashboardStats) {
                greeting += `Here is your status:\n• ${dashboardStats.counts.critical} critical patients\n• ${dashboardStats.counts.waiting} waiting\n• ${dashboardStats.counts.pending} orders pending signature.\n\nHow can I help?`;
            } else {
                greeting += "How can I assist you today?";
            }

            setMessages([{ id: 'welcome', role: 'assistant', content: greeting, timestamp: new Date() }]);
        }
    }, [isOpen, patient, loadedPatient, dashboardStats, doctorProfile.name, messages.length]);

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        const userMessage: Message = { id: `msg-${Date.now()}`, role: 'user', content: text.trim(), timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Command Parsers
        const lowerText = text.toLowerCase();

        // 1. Confirm/Cancel
        if (pendingAction) {
            if (['confirm', 'yes', 'ok'].includes(lowerText)) { handleConfirmAction(); setIsTyping(false); return; }
            if (['cancel', 'no'].includes(lowerText)) { handleCancelAction(); setIsTyping(false); return; }
        }

        // 2. Clear Context
        if (lowerText.match(/(?:clear|exit)\s+patient/)) {
            setLoadedPatient(null);
            setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: "Context cleared. Viewing general dashboard.", timestamp: new Date() }]);
            setIsTyping(false);
            return;
        }

        // 3. Load Patient
        const loadName = parseLoadPatientCommand(text);
        if (loadName) {
            const found = searchPatient(loadName, patients);
            if (found) {
                setLoadedPatient(found);
                setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: `Loaded ${found.name}.`, timestamp: new Date() }]);
            } else {
                setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: `Could not find patient "${loadName}".`, timestamp: new Date() }]);
            }
            setIsTyping(false);
            return;
        }

        // 4. Actions
        const activePatient = loadedPatient || patient;
        const action = parseActionCommand(text, activePatient || null);
        if (action) {
            setPendingAction(action);
            setMessages(prev => [...prev, {
                id: `ai-${Date.now()}`, role: 'assistant', content: `I've prepared these orders for ${action.patientName}:`, timestamp: new Date(), pendingAction: action
            }]);
            setIsTyping(false);
            return;
        }

        // 4b. Dashboard Queries (Local Fallback)
        if (dashboardStats && !activePatient) {
            const lower = text.toLowerCase();
            if (lower.includes('critical') || lower.includes('red')) {
                const msg = `CRITICAL PATIENTS (${dashboardStats.counts.critical}):\n` +
                    dashboardStats.criticalPatients.map(p => `• ${p.name} (${p.age}${p.gender}) - ${p.complaint}`).join('\n');
                setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: msg, timestamp: new Date() }]);
                setIsTyping(false);
                return;
            }
            if (lower.includes('queue') || lower.includes('waiting')) {
                const list = dashboardStats.waitingPatients || [];
                const msg = `WAITING LIST (${dashboardStats.counts.waiting}):\n` +
                    (list.length ? list.map(p => `• ${p.name} (${p.status})`).join('\n') : "No waiting patients.");
                setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: msg, timestamp: new Date() }]);
                setIsTyping(false);
                return;
            }
            if (lower.includes('pending') || lower.includes('orders')) {
                const msg = `PENDING ORDERS: You have ${dashboardStats.counts.pending} orders waiting for signature. Say "Show pending orders" to review them.`;
                setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: msg, timestamp: new Date() }]);
                setIsTyping(false);
                return;
            }
        }

        // 5. Gemini Chat
        try {
            const context = activePatient ? buildPatientContext(activePatient) : (dashboardStats ? `Dashboard Context:\n${JSON.stringify(dashboardStats, null, 2)}` : '');
            const systemPrompt = `You are MedFlow AI. Context: \n${context}\nBe concise.`;

            const response = await chatWithGemini(
                [...messages.slice(-5), userMessage].map(m => ({ role: m.role === 'user' ? 'user' : 'ai' as const, content: m.content })),
                systemPrompt
            );

            setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: response, timestamp: new Date() }]);
        } catch (e) {
            setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'assistant', content: "I'm having trouble connecting. Try again.", timestamp: new Date() }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleConfirmAction = useCallback(() => {
        const activePatient = loadedPatient || patient;
        if (!pendingAction || !activePatient) return;
        // Logic to add orders... simplified for brevity, assuming standard updateStateAndDb usage
        updateStateAndDb(activePatient.id, p => ({
            ...p,
            orders: [...(p.orders || []), ...pendingAction.items.map((item, i) => ({
                orderId: `ord-${Date.now()}-${i}`, patientId: activePatient.id, createdBy: doctorProfile.name, createdAt: new Date().toISOString(),
                category: 'investigation' as const, subType: item, label: item, payload: {}, priority: 'routine' as const, status: 'sent' as const
            }))]
        }));

        const executed: ExecutedAction = { id: pendingAction.id, type: pendingAction.type, items: pendingAction.items, executedAt: new Date(), success: true };
        setMessages(prev => prev.map(m => m.pendingAction?.id === pendingAction.id ? { ...m, pendingAction: { ...m.pendingAction, status: 'confirmed' as const } } : m)
            .concat({ id: `conf-${Date.now()}`, role: 'assistant', content: "Confirmed.", timestamp: new Date(), executedAction: executed }));
        setPendingAction(null);
    }, [pendingAction, patient, loadedPatient, updateStateAndDb, doctorProfile.name]);

    const handleCancelAction = useCallback(() => {
        setMessages(prev => prev.map(m => m.pendingAction?.id === pendingAction?.id ? { ...m, pendingAction: { ...m.pendingAction, status: 'cancelled' as const } } : m)
            .concat({ id: `canc-${Date.now()}`, role: 'assistant', content: "Cancelled.", timestamp: new Date() }));
        setPendingAction(null);
    }, [pendingAction]);

    const handleVoiceToggle = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <>
            {/* Trigger Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className={cn(
                        "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 transition-transform hover:scale-105",
                        "bg-teal-600 hover:bg-teal-700 text-white border-2 border-white/20"
                    )}
                >
                    <Sparkles className="w-6 h-6" />
                </Button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-4 right-4 w-[calc(100vw-2rem)] sm:w-[400px] h-[600px] max-h-[85vh] bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-teal-600 text-white rounded-t-2xl shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm leading-none">MedFlow AI</h3>
                                <p className="text-[10px] text-teal-100 mt-0.5 font-medium">Gemini Copilot</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-teal-100 hover:bg-teal-700/50 hover:text-white rounded-full w-8 h-8">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* AI Service Status Banner */}
                    <AIStatusBanner />

                    {/* Context Badge (if active) */}
                    {(loadedPatient || patient) && (
                        <div className="bg-slate-50 dark:bg-slate-900 border-b px-4 py-2 flex justify-between items-center text-xs">
                            <span className="font-medium text-slate-600 dark:text-slate-300">
                                Context: {loadedPatient?.name || patient?.name}
                            </span>
                            {loadedPatient && (
                                <button onClick={() => setLoadedPatient(null)} className="text-teal-600 hover:underline">Clear</button>
                            )}
                        </div>
                    )}

                    {/* Quick Actions */}
                    {messages.length < 2 && (
                        <div className="p-3 border-b bg-slate-50/50 overflow-x-auto">
                            <div className="flex gap-2 w-max">
                                {((loadedPatient || patient) ? patientActions : dashboardActions).map(act => (
                                    <button key={act.label} onClick={() => handleSend(act.prompt)} className="flex items-center gap-1 px-3 py-1.5 bg-white border rounded-full text-xs font-medium text-slate-600 hover:border-teal-500 hover:text-teal-600 transition-colors shadow-sm">
                                        <act.icon className="w-3 h-3" /> {act.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    <ScrollArea className="flex-1 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-950">
                        <div className="p-4 space-y-4">
                            {messages.map((msg) => (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg}
                                    onConfirmAction={msg.pendingAction?.status === 'pending' ? handleConfirmAction : undefined}
                                    onCancelAction={msg.pendingAction?.status === 'pending' ? handleCancelAction : undefined}
                                />
                            ))}
                            {isTyping && (
                                <div className="flex items-center gap-2 text-slate-400 text-xs ml-2">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span>Thinking...</span>
                                </div>
                            )}
                            {/* Bottom anchor for autoscroll */}
                            <div ref={bottomRef} />
                        </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-3 bg-white dark:bg-slate-950 border-t rounded-b-2xl">
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-full border border-transparent focus-within:border-teal-500 transition-colors">
                            <TextareaAutosize
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                maxRows={4}
                                placeholder={isListening ? "Listening..." : "Ask MedFlow..."}
                                className="w-full border-0 bg-transparent shadow-none focus:ring-0 text-sm px-3 py-2 resize-none placeholder:text-slate-400 outline-none"
                            />
                            {hasSupport && (
                                <Button size="icon" variant="ghost" onClick={handleVoiceToggle} className={cn("rounded-full w-8 h-8", isListening && "text-red-500 bg-red-100")}>
                                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                </Button>
                            )}
                            <Button size="icon" onClick={() => handleSend()} className="rounded-full w-8 h-8 bg-teal-600 hover:bg-teal-700 shadow-sm">
                                <Send className="w-3.5 h-3.5 text-white" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UnifiedAICopilot;
