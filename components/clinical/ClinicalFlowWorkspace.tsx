import React, { useState, useCallback } from 'react';
import { Patient } from '../../types';
import { usePatient } from '../../contexts/PatientContext';
import { useToast } from '../../contexts/ToastContext';
import { ClinicalSection } from './ClinicalSection';
import { ClinicalFooter } from './ClinicalFooter';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Activity, Clock, Sparkles, FileText, Stethoscope, Brain, ClipboardList } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { TriageBadge } from '../common/TriageBadge';
import { AIScribePanel } from './AIScribePanel';
import { SOAPDraft } from './AIScribeDraftPreview';
import { AIOrderSuggestionsPanel } from './AIOrderSuggestionsPanel';
import { SOAPDraftResponse } from '../../services/geminiService';

interface ClinicalFlowWorkspaceProps {
    patient: Patient;
    draftData?: SOAPDraftResponse | null;
    onClearDraft?: () => void;
}

const ClinicalFlowWorkspace: React.FC<ClinicalFlowWorkspaceProps> = ({ patient, draftData, onClearDraft }) => {
    const { updateClinicalFileSection } = usePatient();
    const { addToast } = useToast();

    // Derived State from Patient (Persistent)
    const [history, setHistory] = useState(patient.clinicalFile.sections.history.hpi || '');
    const [exam, setExam] = useState(patient.clinicalFile.sections.gpe.remarks || '');

    // Local State (Transient for Phase 1)
    const [impression, setImpression] = useState('');
    const [plan, setPlan] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        // Simulate network delay for UX
        await new Promise(resolve => setTimeout(resolve, 600));

        // Persist mapped fields
        updateClinicalFileSection(patient.id, 'history', { hpi: history });
        updateClinicalFileSection(patient.id, 'gpe', { remarks: exam });

        // Impression and Plan are local-only in Phase 1 as per constraints

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSaved(`at ${time}`);
        setIsSaving(false);
        addToast("Draft clinical notes saved", "success");
    }, [patient.id, history, exam, updateClinicalFileSection, addToast]);

    const handleDraftAccepted = useCallback((draft: SOAPDraft) => {
        setHistory(draft.s);
        setExam(draft.o);
        setImpression(draft.a);
        setPlan(draft.p);
        addToast("Clinical fields populated from AI draft", "info");
    }, [addToast]);

    const { addOrderToPatient } = usePatient();

    const handleAddDraftOrders = useCallback(async (orders: any[]) => {
        let count = 0;
        for (const order of orders) {
            await addOrderToPatient(patient.id, {
                ...order,
                status: 'draft', // FORCE DRAFT
                ai_provenance: {
                    ...order.ai_provenance,
                    prompt_id: 'clinical_suggestion'
                }
            });
            count++;
        }
        addToast(`${count} orders added to Drafts.`, "success");
    }, [addOrderToPatient, patient.id, addToast]);

    const applyGhostDraft = useCallback(() => {
        if (draftData) {
            setHistory(draftData.subjective);
            setExam(draftData.objective);
            setImpression(draftData.assessment);
            setPlan(draftData.plan);
            addToast("AI Draft applied to record.", "success");
            if (onClearDraft) onClearDraft();
        }
    }, [draftData, onClearDraft, addToast]);

    // Vitals display helper
    const vitalsDisplay = patient.vitals ? (
        <div className="flex items-center gap-4 text-sm text-muted-foreground bg-blue-50/50 px-3 py-2 rounded-lg border border-blue-100">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>BP {patient.vitals.bp_sys}/{patient.vitals.bp_dia}</span>
            <span>•</span>
            <span>HR {patient.vitals.pulse} bpm</span>
            <span>•</span>
            <span>SpO2 {patient.vitals.spo2}%</span>
            <span>•</span>
            <span>RR {patient.vitals.rr}/min</span>
        </div>
    ) : null;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 relative">
            {/* Sticky Header - Clean Design */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b px-6 py-4 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-lg font-bold text-foreground">{patient.name}</h1>
                                <span className="text-sm text-muted-foreground">{patient.age}y / {patient.gender}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1.5 font-mono">
                                    <Clock className="w-3.5 h-3.5" />
                                    {patient.id.slice(0, 8).toUpperCase()}
                                </span>
                                {patient.chiefComplaints?.[0] && (
                                    <span className="text-slate-600">
                                        C/C: {patient.chiefComplaints[0].complaint}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant={patient.status === 'Discharged' ? 'secondary' : 'default'} className="rounded-full px-3 py-1 text-xs">
                            {patient.status}
                        </Badge>
                        <TriageBadge level={patient.triage.level} />
                    </div>
                </div>
            </header>

            {/* Scrollable Workspace Body */}
            <main className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-6 pb-32">

                {/* Vitals Strip */}
                {vitalsDisplay}

                {/* AMBER GHOST DRAFT CARD (Phase 4) */}
                {draftData && (
                    <Card className="bg-amber-50 border-amber-200 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-600" />
                                    <h3 className="font-semibold text-amber-900">AI Scribe Draft Available</h3>
                                </div>
                                <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-100/50">
                                    SOAP Note
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm text-amber-900/80 mb-4">
                                <div><span className="font-semibold">S:</span> {draftData.subjective?.slice(0, 80)}...</div>
                                <div><span className="font-semibold">O:</span> {draftData.objective?.slice(0, 80)}...</div>
                                <div><span className="font-semibold">A:</span> {draftData.assessment?.slice(0, 80)}...</div>
                                <div><span className="font-semibold">P:</span> {draftData.plan?.slice(0, 80)}...</div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-amber-200 text-amber-700"
                                    onClick={onClearDraft}
                                >
                                    Dismiss
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-teal-600 hover:bg-teal-700 text-white"
                                    onClick={applyGhostDraft}
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Apply to Record
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* AI Scribe Control Panel */}
                <AIScribePanel onDraftAccepted={handleDraftAccepted} />

                {/* Clinical Sections - Clean Card Design */}
                <div className="space-y-6">

                    {/* History Section Header */}
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        <FileText className="w-4 h-4" />
                        <span>History</span>
                    </div>

                    {/* 1. History - Card Enclosed */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-500" />
                                Chief Complaint & History of Present Illness
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <ClinicalSection
                                title=""
                                placeholder="Describe the presenting complaint, duration, and relevant history..."
                                value={history}
                                onChange={setHistory}
                                className="border-0 shadow-none focus-within:ring-0 p-0"
                                helperText="Include onset, duration, progression, associated symptoms, relieving/aggravating factors"
                            />
                        </CardContent>
                    </Card>

                    {/* Examination Section Header */}
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-4">
                        <Stethoscope className="w-4 h-4" />
                        <span>Examination</span>
                    </div>

                    {/* 2. Examination - Card Enclosed */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-slate-500" />
                                General Physical & Systemic Examination
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <ClinicalSection
                                title=""
                                placeholder="General appearance, consciousness, pallor, icterus, cyanosis, clubbing, lymphadenopathy, edema, systemic findings (CVS, RS, P/A, CNS)..."
                                value={exam}
                                onChange={setExam}
                                className="border-0 shadow-none focus-within:ring-0 p-0"
                            />
                        </CardContent>
                    </Card>

                    {/* Analysis Section Header */}
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-4">
                        <Brain className="w-4 h-4" />
                        <span>Assessment & Plan</span>
                    </div>

                    {/* Active Problems Display */}
                    {patient.clinicalFile.sections.history.complaints && patient.clinicalFile.sections.history.complaints.length > 0 && (
                        <Card className="shadow-sm bg-slate-50/50">
                            <CardContent className="p-4">
                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2">Active Problems:</span>
                                    {patient.clinicalFile.sections.history.complaints.map((c, i) => (
                                        <Badge key={i} variant="secondary" className="px-3 py-1 font-medium">
                                            {c.symptom}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 3. Impression */}
                    <Card className="shadow-sm border-l-4 border-l-teal-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Brain className="w-4 h-4 text-teal-500" />
                                Impression / Diagnosis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <ClinicalSection
                                title=""
                                placeholder="Working diagnosis, differential diagnoses..."
                                value={impression}
                                onChange={setImpression}
                                className="border-0 shadow-none p-0"
                                helperText="Synthesize findings into your clinical assessment"
                            />
                        </CardContent>
                    </Card>

                    {/* 4. Plan */}
                    <Card className="shadow-sm bg-amber-50/30 border-dashed border-2 border-amber-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-amber-600" />
                                Plan (Draft)
                                <Badge variant="outline" className="text-xs border-amber-300 text-amber-600">Draft</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <ClinicalSection
                                title=""
                                placeholder="Investigations, medications, referrals, patient advice..."
                                value={plan}
                                onChange={setPlan}
                                className="border-0 bg-transparent shadow-none p-0"
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* AI Order Suggestions (Phase 3A) */}
                <AIOrderSuggestionsPanel
                    clinicalFileSections={{
                        ...patient.clinicalFile.sections,
                        history: { ...patient.clinicalFile.sections.history, hpi: history }, // Use local draft state
                        gpe: { ...patient.clinicalFile.sections.gpe, remarks: exam }        // Use local draft state
                    }}
                    onAddDraftOrders={handleAddDraftOrders}
                />

            </main>

            {/* Footer */}
            <ClinicalFooter
                onSave={handleSave}
                isSaving={isSaving}
                lastSavedAt={lastSaved}
            />
        </div>
    );
};

export default ClinicalFlowWorkspace;
