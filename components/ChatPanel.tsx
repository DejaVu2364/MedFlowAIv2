
import React, { useState, useRef, useEffect } from 'react';
import { usePatient } from '../contexts/PatientContext';

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
    const { chatHistory, sendChatMessage, selectedPatientId } = usePatient();
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
            <div className="p-4 border-t border-border-color">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask something..."
                        className="flex-1 px-3 py-2 border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-background-primary text-input-text"
                        aria-label="Chat input"
                    />
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-md shadow-sm hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatPanel;