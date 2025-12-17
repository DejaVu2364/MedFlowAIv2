import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Patient } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import {
    MessageCircle,
    Send,
    X,
    Sparkles,
    FileText,
    AlertTriangle,
    Activity,
    Pill,
    ClipboardList,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    BookOpen
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface PatientRAGChatProps {
    patient: Patient;
    isOpen: boolean;
    onClose: () => void;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    sources?: string[];
    timestamp: Date;
}

interface PatientContext {
    demographics: string;
    chiefComplaints: string;
    vitals: string;
    hpi: string;
    pmh: string;
    allergies: string;
    medications: string;
    orders: string;
    rounds: string;
    triageInfo: string;
}

// Build patient context from patient data
const buildPatientContext = (patient: Patient): PatientContext => {
    const demographics = `${patient.name}, ${patient.age}y ${patient.gender}. ID: ${patient.id}. Status: ${patient.status}.`;

    const chiefComplaints = patient.chiefComplaints?.length
        ? `Chief Complaints: ${patient.chiefComplaints.map(c => `${c.complaint} (${c.durationValue} ${c.durationUnit})`).join(', ')}.`
        : 'No chief complaints recorded.';

    const vitals = patient.vitals
        ? `Latest Vitals: BP ${patient.vitals.bp_sys}/${patient.vitals.bp_dia} mmHg, HR ${patient.vitals.pulse} bpm, SpO2 ${patient.vitals.spo2}%, RR ${patient.vitals.rr}/min.`
        : 'No vitals recorded.';

    const hpi = patient.clinicalFile?.sections?.history?.hpi
        ? `HPI: ${patient.clinicalFile.sections.history.hpi}`
        : 'No HPI recorded.';

    const pmh = patient.clinicalFile?.sections?.history?.past_medical_history
        ? `Past Medical History: ${patient.clinicalFile.sections.history.past_medical_history}`
        : 'No PMH recorded.';

    const allergies = patient.clinicalFile?.sections?.history?.allergy_history?.length
        ? `Allergies: ${patient.clinicalFile.sections.history.allergy_history.map(a => a.substance).join(', ')}.`
        : 'No known allergies.';

    const medications = patient.orders?.filter(o => o.category === 'medication' && o.status !== 'cancelled')?.length
        ? `Active Medications: ${patient.orders.filter(o => o.category === 'medication' && o.status !== 'cancelled').map(o => o.label).join(', ')}.`
        : 'No active medications.';

    const orders = patient.orders?.length
        ? `Orders (${patient.orders.length} total): ${patient.orders.map(o => `${o.label} (${o.status})`).slice(0, 5).join(', ')}${patient.orders.length > 5 ? '...' : ''}.`
        : 'No orders.';

    const rounds = patient.rounds?.length
        ? `Latest Round: ${patient.rounds[patient.rounds.length - 1]?.assessment || 'No assessment recorded'}.`
        : 'No rounds recorded.';

    const triageInfo = patient.triage
        ? `Triage: Level ${patient.triage.level}.`
        : 'Not triaged.';

    return {
        demographics,
        chiefComplaints,
        vitals,
        hpi,
        pmh,
        allergies,
        medications,
        orders,
        rounds,
        triageInfo
    };
};

// Simple RAG search - find relevant context based on query
const searchContext = (query: string, context: PatientContext): { relevant: string[]; sources: string[] } => {
    const lowerQuery = query.toLowerCase();
    const relevant: string[] = [];
    const sources: string[] = [];

    // Always include demographics
    relevant.push(context.demographics);
    sources.push('Demographics');

    // Keyword-based relevance matching
    if (lowerQuery.includes('vital') || lowerQuery.includes('bp') || lowerQuery.includes('pressure') ||
        lowerQuery.includes('heart') || lowerQuery.includes('oxygen') || lowerQuery.includes('spo2')) {
        relevant.push(context.vitals);
        sources.push('Vitals');
    }

    if (lowerQuery.includes('complain') || lowerQuery.includes('present') || lowerQuery.includes('symptom') ||
        lowerQuery.includes('chief') || lowerQuery.includes('came') || lowerQuery.includes('problem')) {
        relevant.push(context.chiefComplaints);
        sources.push('Chief Complaints');
    }

    if (lowerQuery.includes('history') || lowerQuery.includes('hpi') || lowerQuery.includes('illness') ||
        lowerQuery.includes('onset') || lowerQuery.includes('duration')) {
        relevant.push(context.hpi);
        sources.push('HPI');
    }

    if (lowerQuery.includes('past') || lowerQuery.includes('pmh') || lowerQuery.includes('medical history') ||
        lowerQuery.includes('chronic') || lowerQuery.includes('condition')) {
        relevant.push(context.pmh);
        sources.push('Past Medical History');
    }

    if (lowerQuery.includes('allerg') || lowerQuery.includes('react') || lowerQuery.includes('sensitive')) {
        relevant.push(context.allergies);
        sources.push('Allergies');
    }

    if (lowerQuery.includes('medic') || lowerQuery.includes('drug') || lowerQuery.includes('prescription') ||
        lowerQuery.includes('taking') || lowerQuery.includes('dose')) {
        relevant.push(context.medications);
        sources.push('Medications');
    }

    if (lowerQuery.includes('order') || lowerQuery.includes('test') || lowerQuery.includes('investigation') ||
        lowerQuery.includes('lab') || lowerQuery.includes('pending')) {
        relevant.push(context.orders);
        sources.push('Orders');
    }

    if (lowerQuery.includes('round') || lowerQuery.includes('progress') || lowerQuery.includes('assessment') ||
        lowerQuery.includes('plan') || lowerQuery.includes('note')) {
        relevant.push(context.rounds);
        sources.push('Rounds');
    }

    if (lowerQuery.includes('triage') || lowerQuery.includes('severity') || lowerQuery.includes('priority') ||
        lowerQuery.includes('urgent') || lowerQuery.includes('critical')) {
        relevant.push(context.triageInfo);
        sources.push('Triage');
    }

    // If no specific match, include summary context
    if (relevant.length === 1) {
        relevant.push(context.chiefComplaints, context.vitals, context.triageInfo);
        sources.push('Chief Complaints', 'Vitals', 'Triage');
    }

    return { relevant, sources };
};

// Simulate RAG response generation (in production, this would call Gemini with context)
const generateRAGResponse = async (
    query: string,
    context: PatientContext,
    patientName: string
): Promise<{ response: string; sources: string[] }> => {
    // Simulate API delay
    await new Promise(r => setTimeout(r, 600));

    const { relevant, sources } = searchContext(query, context);
    const contextStr = relevant.join(' ');

    // Generate grounded response based on retrieved context
    const lowerQuery = query.toLowerCase();
    let response = '';

    if (lowerQuery.includes('summary') || lowerQuery.includes('overview') || lowerQuery.includes('tell me about')) {
        response = `**${patientName}** - ${context.demographics}\n\n${context.chiefComplaints}\n\n${context.vitals}\n\n${context.triageInfo}`;
    } else if (lowerQuery.includes('vital')) {
        response = context.vitals !== 'No vitals recorded.'
            ? `Based on the latest readings:\n\n${context.vitals}`
            : 'No vitals have been recorded for this patient yet.';
    } else if (lowerQuery.includes('allerg')) {
        response = context.allergies;
    } else if (lowerQuery.includes('medic') || lowerQuery.includes('drug')) {
        response = context.medications;
    } else if (lowerQuery.includes('order') || lowerQuery.includes('test')) {
        response = context.orders;
    } else if (lowerQuery.includes('history') || lowerQuery.includes('hpi')) {
        response = context.hpi;
    } else if (lowerQuery.includes('complain') || lowerQuery.includes('present')) {
        response = context.chiefComplaints;
    } else if (lowerQuery.includes('triage') || lowerQuery.includes('severity')) {
        response = context.triageInfo;
    } else {
        // Default: provide contextual summary
        response = `Based on the patient record:\n\n${context.chiefComplaints}\n\n${context.vitals}\n\nAsk me about specific aspects like vitals, medications, allergies, or orders.`;
    }

    return { response, sources };
};

export const PatientRAGChat: React.FC<PatientRAGChatProps> = ({ patient, isOpen, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showContext, setShowContext] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Build patient context
    const patientContext = useMemo(() => buildPatientContext(patient), [patient]);

    // Initialize with welcome message
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: 'welcome',
                role: 'system',
                content: `📋 Patient context loaded for **${patient.name}**.\n\nI have access to:\n• Demographics & Triage\n• Chief Complaints & HPI\n• Vitals & Allergies\n• Medications & Orders\n• Round Notes\n\nAsk me anything about this patient. My responses are grounded in the actual record.`,
                timestamp: new Date()
            }]);
        }
    }, [isOpen, messages.length, patient.name]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const { response, sources } = await generateRAGResponse(
                input.trim(),
                patientContext,
                patient.name
            );

            const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: response,
                sources,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: 'Sorry, I encountered an error processing your request.',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, patientContext, patient.name]);

    const suggestedQuestions = [
        "What are the vitals?",
        "Any allergies?",
        "Current medications?",
        "Tell me about the chief complaint"
    ];

    if (!isOpen) return null;

    return (
        <Card className="fixed bottom-4 right-4 w-[400px] h-[550px] shadow-2xl border-2 flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <CardHeader className="py-3 px-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-t-lg flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-semibold">Patient Assistant</CardTitle>
                            <p className="text-xs text-teal-100">{patient.name} • RAG-enabled</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowContext(!showContext)}
                            className="text-white hover:bg-white/20 h-8 w-8"
                        >
                            <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-white hover:bg-white/20 h-8 w-8"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {/* Context Panel (Collapsible) */}
            {showContext && (
                <div className="bg-slate-50 border-b p-3 flex-shrink-0">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Loaded Context</span>
                        <Badge variant="outline" className="text-xs">RAG</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                        {[
                            { icon: FileText, label: 'Demographics', active: true },
                            { icon: Activity, label: 'Vitals', active: !!patient.vitals },
                            { icon: ClipboardList, label: 'HPI', active: !!patient.clinicalFile?.sections?.history?.hpi },
                            { icon: AlertTriangle, label: 'Allergies', active: !!patient.clinicalFile?.sections?.history?.allergy_history?.length },
                            { icon: Pill, label: 'Medications', active: !!patient.orders?.filter(o => o.category === 'medication').length },
                            { icon: ClipboardList, label: 'Orders', active: !!patient.orders?.length },
                        ].map((item, i) => (
                            <div key={i} className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded",
                                item.active ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-400"
                            )}>
                                <item.icon className="w-3 h-3" />
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={cn(
                            "flex",
                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}>
                            <div className={cn(
                                "max-w-[85%] rounded-xl p-3 text-sm",
                                msg.role === 'user'
                                    ? 'bg-teal-600 text-white'
                                    : msg.role === 'system'
                                        ? 'bg-blue-50 text-blue-900 border border-blue-100'
                                        : 'bg-slate-100 text-slate-800'
                            )}>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap gap-1">
                                        <span className="text-xs text-muted-foreground">Sources:</span>
                                        {msg.sources.map((src, i) => (
                                            <Badge key={i} variant="outline" className="text-[10px] py-0">
                                                {src}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span className="text-xs">Searching patient records...</span>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Suggested Questions */}
            {messages.length <= 1 && (
                <div className="px-4 pb-2 flex-shrink-0">
                    <div className="flex flex-wrap gap-1">
                        {suggestedQuestions.map((q, i) => (
                            <Button
                                key={i}
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setInput(q)}
                            >
                                {q}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-3 border-t flex-shrink-0">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about this patient..."
                        className="flex-1 text-sm"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isLoading}
                        className="bg-teal-600 hover:bg-teal-700 shrink-0"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
                <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Responses grounded in patient data only
                </p>
            </div>
        </Card>
    );
};

export default PatientRAGChat;
