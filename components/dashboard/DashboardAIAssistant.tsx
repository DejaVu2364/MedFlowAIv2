import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import {
    MessageCircle,
    X,
    Send,
    Mic,
    Sparkles,
    User,
    Bot,
    Loader2,
    ChevronUp
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../../contexts/PatientContext';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    actions?: { label: string; action: string; payload?: string }[];
}

interface DashboardAIAssistantProps {
    userName?: string;
}

const GREETING_TEMPLATES = [
    "Good morning, Dr. {name}! You have {critical} critical patients today.",
    "Welcome back, Dr. {name}. {pending} orders are awaiting your review.",
    "Hello Dr. {name}! Quick summary: {total} patients in your care."
];

const QUICK_ACTIONS = [
    { label: "Show critical patients", query: "Show me all critical patients" },
    { label: "Pending orders", query: "What orders need my attention?" },
    { label: "Recent admissions", query: "Show recent admissions" },
    { label: "Discharge ready", query: "Which patients are ready for discharge?" },
];

export const DashboardAIAssistant: React.FC<DashboardAIAssistantProps> = ({
    userName = "Doctor"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const navigate = useNavigate();
    const { patients } = usePatient();

    // Calculate stats for greeting
    const criticalCount = patients.filter(p => p.triage?.level === 'Red').length;
    const pendingOrders = patients.reduce((acc, p) => acc + (p.orders?.filter(o => o.status === 'draft')?.length || 0), 0);
    const dischargeReady = patients.filter(p => p.dischargeSummary?.status === 'finalized').length;

    // Generate personalized greeting
    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Initialize with greeting on first open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const greeting: Message = {
                id: 'greeting',
                role: 'assistant',
                content: `${getTimeGreeting()}, Dr. ${userName}! 👋\n\nHere's your quick summary:\n• **${criticalCount}** critical patients\n• **${pendingOrders}** pending orders\n• **${dischargeReady}** patients ready for discharge\n\nHow can I help you today?`,
                timestamp: new Date(),
                actions: QUICK_ACTIONS.map(qa => ({ label: qa.label, action: 'query', payload: qa.query }))
            };
            setMessages([greeting]);
        }
    }, [isOpen, messages.length, userName, criticalCount, pendingOrders, dischargeReady]);

    // Auto-scroll on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const processQuery = async (query: string) => {
        // Add user message
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: query,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        // Simulate AI response (in production, this would call Gemini)
        await new Promise(resolve => setTimeout(resolve, 800));

        let response: Message;
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes('critical')) {
            const criticalPatients = patients.filter(p => p.triage?.level === 'Red');
            response = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: criticalPatients.length > 0
                    ? `Found **${criticalPatients.length}** critical patients:\n\n${criticalPatients.map(p => `• **${p.name}** - ${p.chiefComplaints?.[0]?.complaint || 'Unknown'}`).join('\n')}`
                    : "Great news! No critical patients currently.",
                timestamp: new Date(),
                actions: criticalPatients.slice(0, 3).map(p => ({
                    label: `View ${p.name.split(' ')[0]}`,
                    action: 'navigate',
                    payload: `/patient/${p.id}/medview`
                }))
            };
        } else if (lowerQuery.includes('order') || lowerQuery.includes('pending')) {
            const patientsWithDrafts = patients.filter(p => p.orders?.some(o => o.status === 'draft'));
            response = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: pendingOrders > 0
                    ? `You have **${pendingOrders}** draft orders across **${patientsWithDrafts.length}** patients awaiting sign-off.`
                    : "All orders are signed off! 🎉",
                timestamp: new Date(),
                actions: patientsWithDrafts.slice(0, 3).map(p => ({
                    label: `${p.name.split(' ')[0]}'s Orders`,
                    action: 'navigate',
                    payload: `/patient/${p.id}/medview`
                }))
            };
        } else if (lowerQuery.includes('discharge')) {
            const dischargePatients = patients.filter(p => p.dischargeSummary?.status === 'finalized');
            response = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: dischargePatients.length > 0
                    ? `**${dischargePatients.length}** patients are ready for discharge:\n\n${dischargePatients.map(p => `• **${p.name}** - ${p.dischargeSummary?.finalDiagnosis || 'Unknown'}`).join('\n')}`
                    : "No patients are currently ready for discharge.",
                timestamp: new Date(),
                actions: dischargePatients.slice(0, 3).map(p => ({
                    label: `View ${p.name.split(' ')[0]}`,
                    action: 'navigate',
                    payload: `/patient/${p.id}/medview`
                }))
            };
        } else if (lowerQuery.includes('admission') || lowerQuery.includes('recent')) {
            const recentPatients = [...patients]
                .sort((a, b) => new Date(b.registrationTime).getTime() - new Date(a.registrationTime).getTime())
                .slice(0, 5);
            response = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: `Here are the **5 most recent admissions**:\n\n${recentPatients.map(p => `• **${p.name}** - ${p.chiefComplaints?.[0]?.complaint || 'Unknown'} (${p.triage?.level || 'Unassigned'})`).join('\n')}`,
                timestamp: new Date(),
                actions: recentPatients.slice(0, 3).map(p => ({
                    label: `View ${p.name.split(' ')[0]}`,
                    action: 'navigate',
                    payload: `/patient/${p.id}/medview`
                }))
            };
        } else {
            response = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: "I can help you with:\n• **Critical patients** - Find patients needing urgent attention\n• **Pending orders** - Review orders awaiting sign-off\n• **Discharge ready** - Patients ready to go home\n• **Recent admissions** - Latest patient arrivals\n\nWhat would you like to know?",
                timestamp: new Date()
            };
        }

        setIsTyping(false);
        setMessages(prev => [...prev, response]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            processQuery(input.trim());
            setInput('');
        }
    };

    const handleAction = (action: string, payload?: string) => {
        if (action === 'navigate' && payload) {
            navigate(payload);
            setIsOpen(false);
        } else if (action === 'query' && payload) {
            processQuery(payload);
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full shadow-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 animate-in fade-in zoom-in"
                size="icon"
            >
                <MessageCircle className="w-6 h-6 text-white" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-400 border-2 border-white animate-pulse" />
            </Button>
        );
    }

    return (
        <Card className={cn(
            "fixed z-50 shadow-2xl border-slate-200 transition-all duration-300",
            isMinimized
                ? "bottom-6 left-6 w-72 h-14"
                : "bottom-6 left-6 w-96 h-[500px] flex flex-col"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-t-lg">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm">MedFlow AI</p>
                        {!isMinimized && (
                            <p className="text-xs text-teal-100">Your clinical assistant</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-white/20"
                        onClick={() => setIsMinimized(!isMinimized)}
                    >
                        <ChevronUp className={cn("w-4 h-4 transition-transform", isMinimized && "rotate-180")} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-white/20"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <ScrollArea className="flex-1 p-3" ref={scrollRef}>
                        <div className="space-y-4">
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex gap-2",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="h-7 w-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                                            <Bot className="w-4 h-4 text-teal-600" />
                                        </div>
                                    )}
                                    <div className={cn(
                                        "max-w-[80%] rounded-lg p-3 text-sm",
                                        msg.role === 'user'
                                            ? "bg-teal-600 text-white rounded-br-none"
                                            : "bg-slate-100 text-slate-800 rounded-bl-none"
                                    )}>
                                        <p className="whitespace-pre-wrap">{msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}</p>

                                        {msg.actions && msg.actions.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {msg.actions.map((action, idx) => (
                                                    <Badge
                                                        key={idx}
                                                        variant="outline"
                                                        className="cursor-pointer hover:bg-teal-50 text-xs py-0.5"
                                                        onClick={() => handleAction(action.action, action.payload)}
                                                    >
                                                        {action.label}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                            <User className="w-4 h-4 text-slate-600" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex gap-2 items-center">
                                    <div className="h-7 w-7 rounded-full bg-teal-100 flex items-center justify-center">
                                        <Bot className="w-4 h-4 text-teal-600" />
                                    </div>
                                    <div className="bg-slate-100 rounded-lg p-3 rounded-bl-none">
                                        <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-3 border-t bg-slate-50/50">
                        <div className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me anything..."
                                className="flex-1 text-sm"
                            />
                            <Button type="submit" size="icon" className="bg-teal-600 hover:bg-teal-700">
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </form>
                </>
            )}
        </Card>
    );
};

export default DashboardAIAssistant;
