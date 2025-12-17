import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import { ClinicalSplitLayout } from '../components/clinical-v2/ClinicalSplitLayout';
import { ScribeSidePanel } from '../components/clinical-v2/ScribeSidePanel';
import ClinicalFlowWorkspace from '../components/clinical/ClinicalFlowWorkspace';
import { Button } from '../components/ui/button';
import { SOAPDraftResponse } from '../services/geminiService';
import { FloatingMicButton } from '../components/clinical-v2/FloatingMicButton';

const PatientWorkspaceV2: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { patients, isLoading, setSelectedPatientId } = usePatient();

    // State for the "Amber Link" (Ghost Text)
    const [scribeDraft, setScribeDraft] = useState<SOAPDraftResponse | null>(null);
    const [isListening, setIsListening] = useState(false);

    // Find patient
    const patient = patients.find(p => p.id === id);

    // Sync selected ID when patient loads (ensure consistency)
    useEffect(() => {
        if (id && patient) {
            setSelectedPatientId(id);
        }
    }, [id, patient, setSelectedPatientId]);

    const handleMicClick = () => {
        setIsListening(!isListening);
        // The actual listening logic is in ScribeSidePanel
        // This floating button just provides quick access visual feedback
    };

    if (isLoading && !patient) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
                    <div className="h-4 w-48 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-center p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Patient Not Found</h2>
                <p className="text-slate-500 mb-6">The requested patient ID could not be found.</p>
                <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
            </div>
        );
    }

    return (
        <>
            <ClinicalSplitLayout
                patient={patient}
                sidePanel={<ScribeSidePanel onDraftGenerated={setScribeDraft} />}
            >
                <div className="w-full">
                    <ClinicalFlowWorkspace
                        patient={patient}
                        draftData={scribeDraft}
                        onClearDraft={() => setScribeDraft(null)}
                    />
                </div>
            </ClinicalSplitLayout>

            {/* Floating Mic Button - Always visible for quick access */}
            <FloatingMicButton
                isListening={isListening}
                onClick={handleMicClick}
                className="lg:hidden" // Only show on mobile, desktop has side panel
            />
        </>
    );
};

export default PatientWorkspaceV2;

