// JarvisChat - Conversational AI Assistant

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Patient } from '../../types';
import { ConversationMessage } from '../../types/jarvis';
import { SparklesIcon, XMarkIcon, PaperAirplaneIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { chatWithGemini } from '../../services/geminiService';
import { checkRateLimit, recordApiCall } from '../../services/tokenUsageTracker';
import { resolvePronouns, addMessage, setCurrentPatient, extractEntities, buildContextString } from '../../services/jarvis/ConversationManager';

interface JarvisChatProps {
    isOpen: boolean;
    onClose: () => void;
    currentPatient?: Patient;
    patients: Patient[];
}

export const JarvisChat: React.FC<JarvisChatProps> = ({
    isOpen,
    onClose,
    currentPatient,
    patients
}) => {
    const [messages, setMessages] = useState<ConversationMessage[]>([
        {
            id: '1',
            role: 'jarvis',
            content: "Hi Dr.! I'm Jarvis, your clinical assistant. Ask me anything about your patients.",
            timestamp: new Date().toISOString()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Build context for Gemini
    const buildContext = useCallback(() => {
        const patientSummaries = patients.slice(0, 10).map(p =>
            `- ${p.name} (${p.age}${p.gender?.charAt(0)}): ${p.chiefComplaints?.[0]?.complaint || 'No complaint'}, Triage: ${p.triage?.level || 'None'}, Status: ${p.status}`
        ).join('\n');

        const currentPatientContext = currentPatient
            ? `\n\nCurrent Patient in Focus: ${currentPatient.name} (ID: ${currentPatient.id})\n- Age: ${currentPatient.age}\n- Chief Complaint: ${currentPatient.chiefComplaints?.[0]?.complaint}\n- Vitals: HR ${currentPatient.vitals?.pulse}, BP ${currentPatient.vitals?.bp_sys}/${currentPatient.vitals?.bp_dia}, SpO2 ${currentPatient.vitals?.spo2}%`
            : '';

        return `You are Jarvis, an AI clinical assistant for Dr. Hari at MedFlow hospital.

Your patients today:
${patientSummaries}
${currentPatientContext}

Rules:
- Be concise but helpful
- When the doctor asks about "her" or "him" without a name, assume they mean the current patient in focus, or the last patient mentioned
- Suggest specific actions when appropriate
- If asked about a patient, provide relevant clinical insights
- Always be professional and supportive`;
    }, [patients, currentPatient]);

    // Handle sending message
    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ConversationMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toISOString(),
            context: currentPatient ? { patientId: currentPatient.id } : undefined
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Check rate limit
            const rateCheck = checkRateLimit();
            if (!rateCheck.allowed) {
                throw new Error(`Rate limited. Wait ${Math.ceil(rateCheck.waitMs / 1000)}s`);
            }

            // Set current patient context
            if (currentPatient) {
                setCurrentPatient(currentPatient);
            }

            // Resolve pronouns in user input
            const resolvedInput = resolvePronouns(input.trim(), patients);

            // Extract entities from input
            extractEntities(input.trim(), patients);

            // Add message to conversation history
            addMessage(userMessage, patients);

            // Build conversation history
            const conversationHistory = messages.slice(-6).map(m =>
                `${m.role === 'user' ? 'Doctor' : 'Jarvis'}: ${m.content}`
            ).join('\n');

            // Call Gemini using chat format with enhanced context
            const chatHistory = messages.slice(-6).map(m => ({
                role: m.role === 'user' ? 'user' as const : 'ai' as const,
                content: m.content
            }));

            // Build enhanced context with conversation manager
            const enhancedContext = `${buildContext()}\n\n${buildContextString()}`;

            const response = await chatWithGemini(
                [...chatHistory, { role: 'user' as const, content: resolvedInput }],
                enhancedContext
            );

            // Record API call
            recordApiCall('jarvis_chat', 'gemini-flash', resolvedInput, response || '');

            const jarvisMessage: ConversationMessage = {
                id: (Date.now() + 1).toString(),
                role: 'jarvis',
                content: response || "I'm having trouble processing that. Could you rephrase?",
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, jarvisMessage]);
        } catch (error) {
            console.error('[JarvisChat] Error:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'jarvis',
                content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date().toISOString()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-4 right-4 w-96 h-[500px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col z-50 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-500 text-white">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                <SparklesIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Jarvis</h3>
                                <p className="text-xs text-white/80">Clinical Assistant</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Context Badge */}
                    {currentPatient && (
                        <div className="px-4 py-2 bg-teal-50 dark:bg-teal-900/30 border-b border-teal-100 dark:border-teal-800">
                            <p className="text-xs text-teal-700 dark:text-teal-300">
                                📍 Context: <strong>{currentPatient.name}</strong>
                            </p>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map(message => (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex",
                                    message.role === 'user' ? 'justify-end' : 'justify-start'
                                )}
                            >
                                <div className={cn(
                                    "max-w-[80%] px-4 py-2 rounded-2xl text-sm",
                                    message.role === 'user'
                                        ? 'bg-teal-600 text-white rounded-br-md'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md'
                                )}>
                                    {message.content}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl rounded-bl-md">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Jarvis..."
                                className="flex-1"
                                disabled={isLoading}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                size="icon"
                                className="bg-teal-600 hover:bg-teal-500"
                            >
                                <PaperAirplaneIcon className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 text-center">
                            Press J to toggle • Enter to send
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default JarvisChat;
