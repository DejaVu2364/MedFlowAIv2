import React, { createContext, useContext, ReactNode, useState } from 'react';
import { usePatientData } from '../hooks/usePatientData';
import { useAuth } from './AuthContext';
import { Patient, AuditEvent, Vitals, PatientStatus, SOAPNote, ClinicalFileSections, Order, OrderCategory, DischargeSummary, Round, HistorySectionData, AISuggestionHistory, ChatMessage, Checklist, ChiefComplaint } from '../types';

// Define the shape of the context based on what usePatientData returns
type UsePatientDataReturn = ReturnType<typeof usePatientData>;

interface PatientContextType extends UsePatientDataReturn {
    selectedPatientId: string | null;
    setSelectedPatientId: (id: string | null) => void;
    chatHistory: ChatMessage[];
    sendChatMessage: (message: string, patientContextId?: string | null) => Promise<void>;
    addChecklistToPatient: (patientId: string, title: string, items: string[]) => Promise<void>;
    toggleChecklistItem: (patientId: string, checklistId: string, itemIndex: number) => void;
    generateClinicalFileFromVoice: (patientId: string, transcript: string) => Promise<void>;
    updatePatientComplaint: (patientId: string, newComplaints: ChiefComplaint[]) => void;
    removeOrder: (patientId: string, orderId: string) => void;
}

const PatientContext = createContext<PatientContextType | null>(null);

export const usePatient = () => {
    const context = useContext(PatientContext);
    if (!context) {
        throw new Error('usePatient must be used within a PatientProvider');
    }
    return context;
};

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const patientData = usePatientData(currentUser);

    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

    const addChecklistToPatient = async (patientId: string, title: string, items: string[]) => {
        if (!currentUser) return;
        const newChecklist: Checklist = {
            title, author: currentUser.name, authorId: currentUser.id, role: currentUser.role,
            id: `CHK-${Date.now()}`, type: 'Checklist', patientId, timestamp: new Date().toISOString(),
            items: items.map(itemText => ({ text: itemText, checked: false })),
        };
        patientData.updateStateAndDb(patientId, p => ({ ...p, timeline: [newChecklist, ...p.timeline] }));
    };

    const toggleChecklistItem = (patientId: string, checklistId: string, itemIndex: number) => {
        patientData.updateStateAndDb(patientId, p => {
            const newTimeline = p.timeline.map(event => {
                if (event.type === 'Checklist' && event.id === checklistId) {
                    const newItems = [...event.items];
                    newItems[itemIndex].checked = !newItems[itemIndex].checked;
                    return { ...event, items: newItems };
                }
                return event;
            });
            return { ...p, timeline: newTimeline };
        });
    };

    // AI-powered chat with patient context
    const sendChatMessage = async (message: string, patientContextId?: string | null) => {
        const newUserMsg: ChatMessage = { role: 'user', content: message };
        setChatHistory(prev => [...prev, newUserMsg]);

        // Add loading placeholder
        const loadingMsg: ChatMessage = { role: 'model', content: '', isLoading: true };
        setChatHistory(prev => [...prev, loadingMsg]);

        try {
            // Build patient context if available
            let context = "General medical knowledge query.";

            if (patientContextId) {
                const patient = patientData.patients.find(p => p.id === patientContextId);
                if (patient) {
                    context = `Patient Context:
                        Name: ${patient.name}, Age: ${patient.age}, Gender: ${patient.gender}
                        Chief Complaints: ${patient.chiefComplaints?.map(c => `${c.complaint} (${c.durationValue} ${c.durationUnit})`).join(', ') || 'None'}
                        Current Status: ${patient.status}
                        Triage Level: ${patient.triage.level}
                        Current Vitals: ${patient.vitals ? `HR: ${patient.vitals.pulse}, BP: ${patient.vitals.bp_sys}/${patient.vitals.bp_dia}, SpO2: ${patient.vitals.spo2}%, Temp: ${patient.vitals.temp_c}°C` : 'Not recorded'}
                        Clinical History: ${JSON.stringify(patient.clinicalFile.sections.history || {})}
                        Active Orders: ${patient.orders.filter(o => o.status !== 'completed').map(o => o.label).join(', ') || 'None'}
                        Recent Results: ${patient.results.slice(0, 3).map(r => `${r.name}: ${r.value}`).join(', ') || 'None'}`;
                }
            }

            // Import answerWithRAG from services
            const { answerWithRAG } = await import('../services/geminiService');
            const aiResponse = await answerWithRAG(message, context);

            // Replace loading message with actual response
            setChatHistory(prev => prev.slice(0, -1).concat({
                role: 'model',
                content: aiResponse,
                isLoading: false
            }));
        } catch (error) {
            console.error('Chat AI error:', error);
            setChatHistory(prev => prev.slice(0, -1).concat({
                role: 'model',
                content: "I'm sorry, I encountered an error processing your request. Please try again.",
                isLoading: false
            }));
        }
    };

    const generateClinicalFileFromVoice = async (patientId: string, transcript: string) => {
        try {
            const { generateClinicalFileFromTranscript } = await import('../services/geminiService');
            const sections = await generateClinicalFileFromTranscript(transcript);

            patientData.updateStateAndDb(patientId, p => {
                const currentFile = p.clinicalFile;
                // Deep merge logic (simplified for brevity)
                const newHistory = { ...currentFile.sections.history, ...sections.history };
                const newGpe = { ...currentFile.sections.gpe, ...sections.gpe };
                const newSystemic = { ...currentFile.sections.systemic, ...sections.systemic };

                return {
                    ...p,
                    clinicalFile: {
                        ...currentFile,
                        sections: {
                            ...currentFile.sections,
                            history: newHistory,
                            gpe: newGpe,
                            systemic: newSystemic
                        }
                    }
                };
            });
        } catch (error) {
            console.error("Error generating clinical file from voice:", error);
            throw error;
        }
    };

    return (
        <PatientContext.Provider value={{
            ...patientData,
            selectedPatientId,
            setSelectedPatientId,
            chatHistory,
            sendChatMessage,
            addChecklistToPatient,
            toggleChecklistItem,
            generateClinicalFileFromVoice
        }}>
            {children}
        </PatientContext.Provider>
    );
};
