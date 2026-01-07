// JarvisChatPanel - Global Jarvis chat interface with Scribe Mode
// Used by JarvisGlobalProvider, available on all pages

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvis } from '../../services/jarvis/JarvisGlobalProvider';
import { SparklesIcon, XMarkIcon, PaperAirplaneIcon, MicrophoneIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';
import { JarvisScribeMode } from './JarvisScribeMode';

type PanelMode = 'chat' | 'scribe';

export const JarvisChatPanel: React.FC = () => {
    const {
        isOpen,
        closeJarvis,
        messages,
        isLoading,
        sendMessage,
        currentPatient
    } = useJarvis();

    const [mode, setMode] = useState<PanelMode>('chat');
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && mode === 'chat') {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, mode]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const message = input.trim();
        setInput('');
        await sendMessage(message);
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
                    initial={{ opacity: 0, x: 100, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 100, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={cn(
                        "fixed bottom-24 right-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden z-50",
                        mode === 'scribe' ? "w-[450px] h-[600px]" : "w-96 h-[500px]"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5" />
                            <span className="font-semibold">Jarvis</span>
                            {currentPatient && (
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                    {currentPatient.name}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Mode Toggle */}
                            <button
                                onClick={() => setMode(mode === 'chat' ? 'scribe' : 'chat')}
                                className={cn(
                                    "p-1.5 rounded-full transition-colors",
                                    mode === 'scribe' ? "bg-white/30" : "hover:bg-white/20"
                                )}
                                title={mode === 'chat' ? 'Switch to Scribe Mode' : 'Switch to Chat'}
                            >
                                {mode === 'chat' ? (
                                    <MicrophoneIcon className="w-4 h-4" />
                                ) : (
                                    <ChatBubbleLeftIcon className="w-4 h-4" />
                                )}
                            </button>
                            <button
                                onClick={closeJarvis}
                                className="p-1 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content based on mode */}
                    {mode === 'chat' ? (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map(message => (
                                    <div
                                        key={message.id}
                                        className={cn(
                                            "max-w-[85%] rounded-2xl px-4 py-2",
                                            message.role === 'user'
                                                ? "ml-auto bg-teal-500 text-white rounded-br-sm"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm"
                                        )}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                            <span className="text-xs text-slate-500">Jarvis is thinking...</span>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask Jarvis anything..."
                                        disabled={isLoading}
                                        className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || isLoading}
                                        className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <PaperAirplaneIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <p className="text-xs text-slate-400">
                                        Try: "Order CBC" or "What's her vitals?"
                                    </p>
                                    <button
                                        onClick={() => setMode('scribe')}
                                        className="text-xs text-teal-600 hover:underline flex items-center gap-1"
                                    >
                                        <MicrophoneIcon className="w-3 h-3" />
                                        Scribe Mode
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Scribe Mode */
                        <div className="flex-1 overflow-y-auto p-4">
                            {currentPatient ? (
                                <JarvisScribeMode
                                    patient={currentPatient}
                                    onClose={() => setMode('chat')}
                                    onApplied={() => setMode('chat')}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                    <MicrophoneIcon className="w-12 h-12 text-slate-300 mb-4" />
                                    <h3 className="font-medium text-slate-600 mb-2">No Patient Selected</h3>
                                    <p className="text-sm text-slate-400">
                                        Please select a patient first to use Scribe Mode.
                                        Click on a patient from the dashboard to set context.
                                    </p>
                                    <button
                                        onClick={() => setMode('chat')}
                                        className="mt-4 text-sm text-teal-600 hover:underline"
                                    >
                                        Back to Chat
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default JarvisChatPanel;
