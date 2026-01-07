// JarvisGlobalProvider - Makes Jarvis accessible from anywhere in the app
// Provides useJarvis() hook for all components

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Patient } from '../../types';
import { JarvisInsight, ConversationMessage } from '../../types/jarvis';
import { usePatient } from '../../contexts/PatientContext';
import { useAuth } from '../../contexts/AuthContext';
import { chatWithGemini } from '../../services/geminiService';
import { recordApiCall } from '../../services/tokenUsageTracker';
import { resolvePronouns, addMessage, setCurrentPatient, buildContextString } from '../jarvis/ConversationManager';
import { loadDashboardConfig, toggleDarkMode } from '../jarvis/AdaptiveUI';
import { generateDashboardInsights } from '../jarvis/JarvisCore';
import { getOrCreateProfile } from '../jarvis/DoctorMemory';

// Jarvis Context State
interface JarvisState {
    isOpen: boolean;
    isCommandPaletteOpen: boolean;
    isLoading: boolean;
    messages: ConversationMessage[];
    insights: JarvisInsight[];
    currentPatient: Patient | null;
    isDarkMode: boolean;
}

// Jarvis Context Actions
interface JarvisActions {
    openJarvis: () => void;
    closeJarvis: () => void;
    toggleJarvis: () => void;
    openCommandPalette: () => void;
    closeCommandPalette: () => void;
    sendMessage: (content: string) => Promise<void>;
    setCurrentPatient: (patient: Patient | null) => void;
    executeAction: (action: JarvisAction) => Promise<void>;
    toggleDarkMode: () => void;
    refreshInsights: () => void;
}

// Action types Jarvis can execute
export interface JarvisAction {
    type: 'navigate' | 'order' | 'note' | 'search' | 'workflow';
    payload: Record<string, unknown>;
}

type JarvisContextType = JarvisState & JarvisActions;

const JarvisContext = createContext<JarvisContextType | null>(null);

// Hook to use Jarvis from any component
export const useJarvis = (): JarvisContextType => {
    const context = useContext(JarvisContext);
    if (!context) {
        throw new Error('useJarvis must be used within JarvisGlobalProvider');
    }
    return context;
};

interface JarvisGlobalProviderProps {
    children: ReactNode;
}

export const JarvisGlobalProvider: React.FC<JarvisGlobalProviderProps> = ({ children }) => {
    const { patients } = usePatient();
    const { currentUser } = useAuth();

    // State
    const [isOpen, setIsOpen] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPatientState, setCurrentPatientState] = useState<Patient | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [messages, setMessages] = useState<ConversationMessage[]>([
        {
            id: '1',
            role: 'jarvis',
            content: "Hi! I'm Jarvis, your clinical assistant. Press Cmd/Ctrl + K for quick commands.",
            timestamp: new Date().toISOString()
        }
    ]);
    const [insights, setInsights] = useState<JarvisInsight[]>([]);

    // Initialize dark mode and doctor profile
    useEffect(() => {
        const config = loadDashboardConfig();
        setIsDarkMode(config.darkMode);
        if (config.darkMode) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    // Generate insights when patients change
    useEffect(() => {
        if (patients.length > 0 && currentUser) {
            const profile = getOrCreateProfile(currentUser.id, currentUser.name, currentUser.email || '');
            const newInsights = generateDashboardInsights(patients, profile);
            setInsights(newInsights);
        }
    }, [patients, currentUser]);

    // Global keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if in input/textarea
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                // Allow Escape to close
                if (e.key === 'Escape') {
                    setIsOpen(false);
                    setIsCommandPaletteOpen(false);
                }
                return;
            }

            // Cmd/Ctrl + J = Toggle Jarvis
            if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }

            // Cmd/Ctrl + K = Command Palette
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }

            // J alone (when not in input) = Toggle Jarvis
            if (e.key === 'j' && !e.metaKey && !e.ctrlKey) {
                setIsOpen(prev => !prev);
            }

            // Escape = Close all
            if (e.key === 'Escape') {
                setIsOpen(false);
                setIsCommandPaletteOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Build context for Gemini
    const buildContext = useCallback(() => {
        const patientSummaries = patients.slice(0, 10).map(p =>
            `- ${p.name} (${p.age}${p.gender?.charAt(0)}): Chief: ${p.chiefComplaints?.[0]?.complaint || 'None'}, Triage: ${p.triage?.level || 'None'}, Status: ${p.status}`
        ).join('\n');

        const currentPatientContext = currentPatientState
            ? `\n\nCurrent Patient in Focus: ${currentPatientState.name}\n- Age: ${currentPatientState.age}\n- Vitals: HR ${currentPatientState.vitals?.pulse}, BP ${currentPatientState.vitals?.bp_sys}/${currentPatientState.vitals?.bp_dia}, SpO2 ${currentPatientState.vitals?.spo2}%`
            : '';

        const conversationContext = buildContextString();

        return `You are Jarvis, an AI clinical assistant for ${currentUser?.name || 'Dr.'} at MedFlow hospital.

Your patients today:
${patientSummaries}
${currentPatientContext}

${conversationContext}

Rules:
- Be concise and helpful
- Resolve pronouns ("her", "him") to the current or last mentioned patient
- Suggest specific actions when appropriate
- Use medical terminology appropriately`;
    }, [patients, currentPatientState, currentUser]);

    // Send message to Jarvis
    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || isLoading) return;

        const userMessage: ConversationMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date().toISOString(),
            context: currentPatientState ? { patientId: currentPatientState.id } : undefined
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Update context manager
            if (currentPatientState) {
                setCurrentPatient(currentPatientState);
            }

            // Resolve pronouns
            const resolvedInput = resolvePronouns(content.trim(), patients);
            addMessage(userMessage, patients);

            // Build chat history
            const chatHistory = messages.slice(-6).map(m => ({
                role: m.role === 'user' ? 'user' as const : 'ai' as const,
                content: m.content
            }));

            const response = await chatWithGemini(
                [...chatHistory, { role: 'user' as const, content: resolvedInput }],
                buildContext()
            );

            recordApiCall('jarvis_global', 'gemini-flash', resolvedInput, response || '');

            const jarvisMessage: ConversationMessage = {
                id: (Date.now() + 1).toString(),
                role: 'jarvis',
                content: response || "I'm having trouble processing that. Could you rephrase?",
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, jarvisMessage]);
        } catch (error) {
            console.error('[Jarvis] Error:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'jarvis',
                content: "Sorry, I encountered an error. Please try again.",
                timestamp: new Date().toISOString()
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, currentPatientState, patients, messages, buildContext]);

    // Execute an action
    const executeAction = useCallback(async (action: JarvisAction) => {
        console.log('[Jarvis] Executing action:', action);

        switch (action.type) {
            case 'navigate':
                // Navigation handled by caller
                break;
            case 'order':
                // Order creation handled by ActionExecutor
                break;
            case 'note':
                // Note creation handled by ActionExecutor
                break;
            case 'search':
                // Search handled by CommandPalette
                break;
            case 'workflow':
                // Workflow execution
                break;
        }
    }, []);

    // Toggle dark mode
    const handleToggleDarkMode = useCallback(() => {
        const newMode = toggleDarkMode();
        setIsDarkMode(newMode);
    }, []);

    // Refresh insights
    const refreshInsights = useCallback(() => {
        if (patients.length > 0 && currentUser) {
            const profile = getOrCreateProfile(currentUser.id, currentUser.name, currentUser.email || '');
            const newInsights = generateDashboardInsights(patients, profile);
            setInsights(newInsights);
        }
    }, [patients, currentUser]);

    const contextValue: JarvisContextType = {
        // State
        isOpen,
        isCommandPaletteOpen,
        isLoading,
        messages,
        insights,
        currentPatient: currentPatientState,
        isDarkMode,

        // Actions
        openJarvis: () => setIsOpen(true),
        closeJarvis: () => setIsOpen(false),
        toggleJarvis: () => setIsOpen(prev => !prev),
        openCommandPalette: () => setIsCommandPaletteOpen(true),
        closeCommandPalette: () => setIsCommandPaletteOpen(false),
        sendMessage,
        setCurrentPatient: setCurrentPatientState,
        executeAction,
        toggleDarkMode: handleToggleDarkMode,
        refreshInsights
    };

    return (
        <JarvisContext.Provider value={contextValue}>
            {children}
        </JarvisContext.Provider>
    );
};

export default JarvisGlobalProvider;
