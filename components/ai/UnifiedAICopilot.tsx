import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import {
    MessageCircle,
    Send,
    Mic,
    MicOff,
    Sparkles,
    X,
    Check,
    AlertCircle,
    FileText,
    Pill,
    Activity,
    ClipboardList,
    RefreshCw,
    User,
    Stethoscope
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePatient } from '../../contexts/PatientContext';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useLocation } from 'react-router-dom';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { chatWithGemini } from '../../services/geminiService';
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

interface DoctorProfile {
    name: string;
    specialty: string;
    preferences: {
        commonOrders: string[];
        verbosity: 'concise' | 'detailed';
    };
}

// Simulated doctor profile (in production, fetch from Firestore)
const getDoctorProfile = (): DoctorProfile => ({
    name: 'Dr. Sharma',
    specialty: 'Internal Medicine',
    preferences: {
        commonOrders: ['CBC', 'LFT', 'RFT', 'Chest X-ray'],
        verbosity: 'concise'
    }
});

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

    if (patient.clinicalFile?.sections?.history?.hpi) {
        parts.push(`HPI: ${patient.clinicalFile.sections.history.hpi}`);
    }

    if (patient.clinicalFile?.sections?.history?.past_medical_history) {
        parts.push(`PMH: ${patient.clinicalFile.sections.history.past_medical_history}`);
    }

    if (patient.clinicalFile?.sections?.history?.allergy_history?.length) {
        parts.push(`ALLERGIES: ${patient.clinicalFile.sections.history.allergy_history.map(a => a.substance).join(', ')}`);
    }

    if (patient.orders?.length) {
        const activeOrders = patient.orders.filter(o => o.status !== 'cancelled');
        parts.push(`ACTIVE ORDERS: ${activeOrders.map(o => `${o.label} (${o.status})`).join(', ')}`);
    }

    return parts.join('\n');
};

// Parse action commands from user input
const parseActionCommand = (input: string, patient: Patient | null): PendingAction | null => {
    const lowerInput = input.toLowerCase();

    // Check for order commands
    const orderPatterns = [
        /(?:order|add|do|get|send for)\s+(?:a\s+)?(.+?)(?:\s+for\s+|$)/i,
        /(.+?)\s+(?:order|investigation|test|lab)/i
    ];

    for (const pattern of orderPatterns) {
        const match = input.match(pattern);
        if (match && patient) {
            const orderText = match[1];
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
    }

    return null;
};

// Quick action prompts
const quickActions = [
    { label: 'Summarize', icon: FileText, prompt: 'Summarize this patient case concisely' },
    { label: 'Suggest Orders', icon: ClipboardList, prompt: 'What investigations should I order for this patient?' },
    { label: 'Check Vitals', icon: Activity, prompt: 'What are the current vitals and any concerns?' },
    { label: 'Drug Check', icon: Pill, prompt: 'Any drug interactions or allergies I should know about?' },
];

// Pending Action Card Component
const PendingActionCard: React.FC<{
    action: PendingAction;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ action, onConfirm, onCancel }) => (
    <Card className="border-amber-200 bg-amber-50/50 mt-2">
        <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Pending Orders</span>
            </div>
            <div className="space-y-1 mb-3">
                {action.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>{item}</span>
                    </div>
                ))}
            </div>
            <div className="text-xs text-muted-foreground mb-2">
                Patient: {action.patientName}
            </div>
            <div className="flex gap-2">
                <Button size="sm" onClick={onConfirm} className="gap-1 bg-teal-600 hover:bg-teal-700">
                    <Check className="w-3 h-3" /> Confirm
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel} className="gap-1">
                    <X className="w-3 h-3" /> Cancel
                </Button>
            </div>
        </CardContent>
    </Card>
);

// Executed Action Card Component
const ExecutedActionCard: React.FC<{ action: ExecutedAction }> = ({ action }) => (
    <Card className="border-green-200 bg-green-50/50 mt-2">
        <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Orders Placed</span>
            </div>
            <div className="space-y-1">
                {action.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-green-700">
                        <Check className="w-3 h-3" />
                        <span>{item}</span>
                    </div>
                ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
                Executed at {action.executedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        </CardContent>
    </Card>
);

// Message Bubble Component
const MessageBubble: React.FC<{ message: Message; onConfirmAction?: () => void; onCancelAction?: () => void }> = ({
    message,
    onConfirmAction,
    onCancelAction
}) => {
    const isUser = message.role === 'user';

    return (
        <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
            <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5",
                isUser
                    ? "bg-teal-600 text-white rounded-br-md"
                    : "bg-slate-100 text-slate-800 rounded-bl-md"
            )}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200/50">
                        <span className="text-xs opacity-70">📎 Sources: {message.sources.join(', ')}</span>
                    </div>
                )}

                {message.pendingAction && message.pendingAction.status === 'pending' && onConfirmAction && onCancelAction && (
                    <PendingActionCard
                        action={message.pendingAction}
                        onConfirm={onConfirmAction}
                        onCancel={onCancelAction}
                    />
                )}

                {message.executedAction && (
                    <ExecutedActionCard action={message.executedAction} />
                )}
            </div>
        </div>
    );
};

// Main Component
export const UnifiedAICopilot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Context
    const { id } = useParams<{ id: string }>();
    const { patients, updateStateAndDb } = usePatient();
    const { currentUser } = useAuth();
    const location = useLocation();

    // Voice recognition
    const { isListening, transcript, startListening, stopListening, resetTranscript, hasSupport } = useSpeechRecognition();

    // Get current patient from route
    const patientId = id || location.pathname.match(/\/patient[^/]*\/([^/]+)/)?.[1];
    const patient = useMemo(() => patients.find(p => p.id === patientId), [patients, patientId]);

    // Doctor profile
    const doctorProfile = useMemo(() => getDoctorProfile(), []);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Handle voice transcript
    useEffect(() => {
        if (transcript) {
            setInput(prev => prev + ' ' + transcript);
            resetTranscript();
        }
    }, [transcript, resetTranscript]);

    // Welcome message when opened with patient context
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const greeting = patient
                ? `Good ${getTimeOfDay()}, ${doctorProfile.name}. I see you're reviewing ${patient.name}'s file. How can I help?`
                : `Good ${getTimeOfDay()}, ${doctorProfile.name}. How can I assist you today?`;

            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: greeting,
                timestamp: new Date()
            }]);
        }
    }, [isOpen, patient, doctorProfile.name]);

    const getTimeOfDay = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        return 'evening';
    };

    // Handle send message
    const handleSend = useCallback(async (text: string = input) => {
        if (!text.trim()) return;

        const userMessage: Message = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: text.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');

        // Check for confirmation commands
        const lowerText = text.toLowerCase().trim();
        if (pendingAction && (lowerText === 'confirm' || lowerText === 'yes' || lowerText === 'ok')) {
            handleConfirmAction();
            return;
        }
        if (pendingAction && (lowerText === 'cancel' || lowerText === 'no' || lowerText === 'nevermind')) {
            handleCancelAction();
            return;
        }

        // Check for action commands
        const action = parseActionCommand(text, patient || null);
        if (action) {
            setPendingAction(action);
            const aiResponse: Message = {
                id: `msg-${Date.now()}-ai`,
                role: 'assistant',
                content: `I'll queue these orders for ${action.patientName}:`,
                timestamp: new Date(),
                pendingAction: action
            };
            setMessages(prev => [...prev, aiResponse]);
            return;
        }

        // Regular chat - call Gemini
        setIsTyping(true);
        try {
            const context = patient ? buildPatientContext(patient) : '';
            const systemPrompt = `You are MedFlow AI Copilot, a warm and professional clinical assistant. 
${patient ? `Current patient context:\n${context}` : 'No patient currently selected.'}
Be concise, friendly, and always cite sources when referencing patient data.
Doctor's name: ${doctorProfile.name}`;

            const response = await chatWithGemini(
                [...messages.slice(-10), userMessage].map(m => ({
                    role: m.role === 'user' ? 'user' : 'ai' as const,
                    content: m.content
                })),
                systemPrompt
            );

            // Determine sources based on what was discussed
            const sources: string[] = [];
            if (response.toLowerCase().includes('vital')) sources.push('Vitals');
            if (response.toLowerCase().includes('complaint') || response.toLowerCase().includes('present')) sources.push('HPI');
            if (response.toLowerCase().includes('allerg')) sources.push('Allergies');
            if (response.toLowerCase().includes('order') || response.toLowerCase().includes('lab')) sources.push('Orders');
            if (response.toLowerCase().includes('medication') || response.toLowerCase().includes('drug')) sources.push('Medications');

            const aiMessage: Message = {
                id: `msg-${Date.now()}-ai`,
                role: 'assistant',
                content: response,
                timestamp: new Date(),
                sources: sources.length > 0 ? sources : undefined
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: `msg-${Date.now()}-error`,
                role: 'assistant',
                content: "I encountered an error. Please try again.",
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    }, [input, messages, patient, doctorProfile, pendingAction]);

    // Confirm pending action
    const handleConfirmAction = useCallback(() => {
        if (!pendingAction || !patient) return;

        // Execute orders using updateStateAndDb
        const newOrders = pendingAction.items.map((item, idx) => ({
            orderId: `order-${Date.now()}-${idx}`,
            patientId: patient.id,
            createdBy: doctorProfile.name,
            createdAt: new Date().toISOString(),
            category: 'investigation' as const,
            subType: item,
            label: item,
            payload: {},
            priority: 'routine' as const,
            status: 'sent' as const,
        }));

        updateStateAndDb(patient.id, p => ({
            ...p,
            orders: [...p.orders, ...newOrders]
        }));

        const executedAction: ExecutedAction = {
            id: pendingAction.id,
            type: pendingAction.type,
            items: pendingAction.items,
            executedAt: new Date(),
            success: true
        };

        const confirmMessage: Message = {
            id: `msg-${Date.now()}-confirm`,
            role: 'assistant',
            content: `✅ Orders placed successfully for ${patient.name}!`,
            timestamp: new Date(),
            executedAction
        };

        setMessages(prev => {
            // Mark pending action as confirmed in previous message
            const updated = prev.map(m => {
                if (m.pendingAction?.id === pendingAction.id) {
                    return { ...m, pendingAction: { ...m.pendingAction, status: 'confirmed' as const } };
                }
                return m;
            });
            return [...updated, confirmMessage];
        });

        setPendingAction(null);
    }, [pendingAction, patient, updateStateAndDb, doctorProfile.name]);

    // Cancel pending action
    const handleCancelAction = useCallback(() => {
        if (!pendingAction) return;

        const cancelMessage: Message = {
            id: `msg-${Date.now()}-cancel`,
            role: 'assistant',
            content: "Orders cancelled. Let me know if you need anything else.",
            timestamp: new Date()
        };

        setMessages(prev => {
            const updated = prev.map(m => {
                if (m.pendingAction?.id === pendingAction.id) {
                    return { ...m, pendingAction: { ...m.pendingAction, status: 'cancelled' as const } };
                }
                return m;
            });
            return [...updated, cancelMessage];
        });

        setPendingAction(null);
    }, [pendingAction]);

    // Voice toggle
    const handleVoiceToggle = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-teal-600 hover:bg-teal-700 text-white z-50 flex items-center justify-center"
                    size="icon"
                >
                    <MessageCircle className="w-6 h-6" />
                </Button>
            </SheetTrigger>

            <SheetContent className="w-[420px] sm:w-[480px] flex flex-col h-full border-l border-border shadow-2xl bg-background p-0">
                {/* Header */}
                <SheetHeader className="px-4 py-3 border-b bg-teal-50/50">
                    <SheetTitle className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-teal-600 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-base font-bold text-teal-800">MedFlow Copilot</span>
                            <span className="text-xs font-normal text-muted-foreground">Your Clinical AI Assistant</span>
                        </div>
                    </SheetTitle>
                </SheetHeader>

                {/* Patient Context Card */}
                {patient && (
                    <div className="mx-4 mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-teal-600" />
                            <span className="font-medium text-sm">{patient.name}</span>
                            <Badge variant="outline" className="ml-auto text-xs">
                                {patient.age}y • {patient.gender}
                            </Badge>
                        </div>
                        {patient.chiefComplaints?.[0] && (
                            <p className="text-xs text-muted-foreground mt-1">
                                CC: {patient.chiefComplaints[0].complaint}
                            </p>
                        )}
                    </div>
                )}

                {/* Quick Actions */}
                <div className="px-4 py-2 flex gap-2 overflow-x-auto">
                    {quickActions.map(action => (
                        <Button
                            key={action.label}
                            variant="outline"
                            size="sm"
                            className="text-xs whitespace-nowrap gap-1 border-teal-200 text-teal-700 hover:bg-teal-50"
                            onClick={() => handleSend(action.prompt)}
                            disabled={!patient && action.label !== 'Summarize'}
                        >
                            <action.icon className="w-3 h-3" />
                            {action.label}
                        </Button>
                    ))}
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 px-4" ref={scrollRef}>
                    <div className="space-y-4 py-4">
                        {messages.map(message => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                onConfirmAction={message.pendingAction?.status === 'pending' ? handleConfirmAction : undefined}
                                onCancelAction={message.pendingAction?.status === 'pending' ? handleCancelAction : undefined}
                            />
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t bg-slate-50/50">
                    <div className="relative">
                        <Textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={isListening ? "Listening..." : "Ask anything or give commands..."}
                            className={cn(
                                "pr-20 resize-none min-h-[50px] max-h-[100px] rounded-xl",
                                isListening && "border-red-400 ring-1 ring-red-400"
                            )}
                        />
                        <div className="absolute right-2 bottom-2 flex gap-1">
                            {hasSupport && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className={cn(
                                        "h-8 w-8 rounded-full",
                                        isListening && "bg-red-100 text-red-600 animate-pulse"
                                    )}
                                    onClick={handleVoiceToggle}
                                    title={isListening ? "Stop listening" : "Voice input"}
                                >
                                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                </Button>
                            )}
                            <Button
                                size="icon"
                                className="h-8 w-8 bg-teal-600 hover:bg-teal-700 rounded-lg"
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isTyping}
                            >
                                <Send className="w-4 h-4 text-white" />
                            </Button>
                        </div>
                    </div>

                    {pendingAction && (
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Say "Confirm" to place orders or "Cancel" to abort
                        </p>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default UnifiedAICopilot;
