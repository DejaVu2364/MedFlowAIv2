import React, { useState, useRef, useEffect } from 'react';
import { usePatient } from '../contexts/PatientContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { VoiceLanguageToggle } from './VoiceLanguageToggle';
import { MicrophoneIcon } from './icons'; // Assuming shared icons
import { cn } from '../lib/utils';

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
    const { chatHistory, sendChatMessage, selectedPatientId } = usePatient();
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Voice Integration
    const {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
        language,
        setLanguage,
        hasSupport
    } = useSpeechRecognition();

    useEffect(() => {
        if (transcript) {
            setMessage(prev => (prev ? prev + ' ' : '') + transcript);
            resetTranscript();
        }
    }, [transcript, resetTranscript]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [chatHistory]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            sendChatMessage(message, selectedPatientId);
            setMessage('');
        }
    };

    const handleVoiceToggle = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed top-0 right-0 h-full w-full md:w-96 bg-background-primary shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out"
            style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}>
            <div className="flex justify-between items-center p-4 border-b border-border-color">
                <div>
                    <h2 className="text-lg font-bold text-text-primary">AI Assistant</h2>
                    {selectedPatientId && <p className="text-xs text-text-tertiary">Context: Patient {selectedPatientId}</p>}
                </div>
                <button onClick={onClose} className="p-2 text-text-tertiary hover:text-text-primary">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.map((chat, index) => (
                    <div key={index} className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-lg ${chat.role === 'user' ? 'bg-brand-blue text-white' : 'bg-background-tertiary text-text-primary'}`}>
                            {chat.isLoading ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                                </div>
                            ) : (
                                <p className="text-sm whitespace-pre-wrap">{chat.content}</p>
                            )}
                        </div>
                        {chat.sources && chat.sources.length > 0 && (
                            <div className="text-xs text-text-tertiary mt-1">
                                Sources: {chat.sources.join(', ')}
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border-color space-y-2">

                {/* Voice Controls */}
                {hasSupport && (
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Voice Input</span>
                        <VoiceLanguageToggle language={language} onLanguageChange={setLanguage} />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={isListening ? "Listening..." : "Ask something..."}
                            className={cn(
                                "w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-background-primary text-input-text transition-colors",
                                isListening && "border-red-400 ring-1 ring-red-400 bg-red-50/10 placeholder:text-red-400"
                            )}
                            aria-label="Chat input"
                        />
                        {hasSupport && (
                            <button
                                type="button"
                                onClick={handleVoiceToggle}
                                className={cn(
                                    "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all",
                                    isListening
                                        ? "text-red-500 animate-pulse bg-red-100"
                                        : "text-gray-400 hover:text-brand-blue hover:bg-gray-100"
                                )}
                                title="Toggle Voice"
                            >
                                <MicrophoneIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-md shadow-sm hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatPanel;