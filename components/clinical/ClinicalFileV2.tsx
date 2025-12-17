import React, { useState, useCallback } from 'react';
import { Patient, HistorySectionData, GPESectionData, SystemicExamSectionData, Complaint, Allergy } from '../../types';
import { usePatient } from '../../contexts/PatientContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
    Save,
    Sparkles,
    Clock,
    FileText,
    Heart,
    Stethoscope,
    Brain,
    AlertTriangle,
    Activity,
    Users,
    Pill,
    ClipboardList,
    RefreshCw,
    MessageCircle,
    Plus,
    X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { TriageBadge } from '../common/TriageBadge';
import { AIScribePanel } from './AIScribePanel';
import { SOAPDraft } from './AIScribeDraftPreview';
import { PatientRAGChat } from '../patient/PatientRAGChat';

interface ClinicalFileV2Props {
    patient: Patient;
}

// Section Header Component
const SectionHeader: React.FC<{
    title: string;
    icon: React.ElementType;
    description?: string;
    badge?: string;
    aiButton?: boolean;
    onAIClick?: () => void;
}> = ({ title, icon: Icon, description, badge, aiButton, onAIClick }) => (
    <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-teal-600" />
            <h3 className="font-semibold text-sm">{title}</h3>
            {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
        </div>
        {aiButton && onAIClick && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-teal-600" onClick={onAIClick}>
                <Sparkles className="w-3 h-3" /> AI Assist
            </Button>
        )}
    </div>
);

// Chief Complaints Editor
const ChiefComplaintsEditor: React.FC<{
    complaints: Complaint[];
    onChange: (complaints: Complaint[]) => void;
}> = ({ complaints, onChange }) => {
    const addComplaint = () => {
        onChange([...complaints, { symptom: '', duration: '', severity: '', notes: '' }]);
    };

    const removeComplaint = (index: number) => {
        onChange(complaints.filter((_, i) => i !== index));
    };

    const updateComplaint = (index: number, field: keyof Complaint, value: string) => {
        const updated = [...complaints];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-2">
            {complaints.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                    <Input
                        value={c.symptom}
                        onChange={(e) => updateComplaint(i, 'symptom', e.target.value)}
                        placeholder="Complaint/Symptom"
                        className="flex-1"
                    />
                    <Input
                        value={c.duration || ''}
                        onChange={(e) => updateComplaint(i, 'duration', e.target.value)}
                        placeholder="Duration (e.g., 2 days)"
                        className="w-32"
                    />
                    <select
                        value={c.severity || ''}
                        onChange={(e) => updateComplaint(i, 'severity', e.target.value)}
                        className="h-9 px-2 rounded-md border border-input text-sm w-24"
                    >
                        <option value="">Severity</option>
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                    </select>
                    <Button variant="ghost" size="icon" onClick={() => removeComplaint(i)} className="h-8 w-8">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={addComplaint} className="gap-1 text-xs">
                <Plus className="w-3 h-3" /> Add Complaint
            </Button>
        </div>
    );
};

// Allergy Editor
const AllergyEditor: React.FC<{
    allergies: Allergy[];
    onChange: (allergies: Allergy[]) => void;
}> = ({ allergies, onChange }) => {
    const addAllergy = () => {
        onChange([...allergies, { substance: '', reaction: '', severity: '' }]);
    };

    const removeAllergy = (index: number) => {
        onChange(allergies.filter((_, i) => i !== index));
    };

    const updateAllergy = (index: number, field: keyof Allergy, value: string) => {
        const updated = [...allergies];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-2">
            {allergies.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No known drug allergies (NKDA)</p>
            )}
            {allergies.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                    <Input
                        value={a.substance}
                        onChange={(e) => updateAllergy(i, 'substance', e.target.value)}
                        placeholder="Drug/Substance"
                        className="flex-1"
                    />
                    <Input
                        value={a.reaction}
                        onChange={(e) => updateAllergy(i, 'reaction', e.target.value)}
                        placeholder="Reaction"
                        className="flex-1"
                    />
                    <select
                        value={a.severity}
                        onChange={(e) => updateAllergy(i, 'severity', e.target.value)}
                        className="h-9 px-2 rounded-md border border-input text-sm w-24"
                    >
                        <option value="">Severity</option>
                        <option value="Mild">Mild</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Severe">Severe</option>
                    </select>
                    <Button variant="ghost" size="icon" onClick={() => removeAllergy(i)} className="h-8 w-8">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={addAllergy} className="gap-1 text-xs">
                <Plus className="w-3 h-3" /> Add Allergy
            </Button>
        </div>
    );
};

// GPE Flags Grid
const GPEFlags: React.FC<{
    flags: GPESectionData['flags'];
    onChange: (flags: GPESectionData['flags']) => void;
}> = ({ flags, onChange }) => {
    const items = [
        { key: 'pallor', label: 'Pallor' },
        { key: 'icterus', label: 'Icterus' },
        { key: 'cyanosis', label: 'Cyanosis' },
        { key: 'clubbing', label: 'Clubbing' },
        { key: 'lymphadenopathy', label: 'Lymphadenopathy' },
        { key: 'edema', label: 'Edema' },
    ] as const;

    return (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {items.map(({ key, label }) => (
                <label key={key} className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors text-sm",
                    flags?.[key] ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200"
                )}>
                    <input
                        type="checkbox"
                        checked={flags?.[key] || false}
                        onChange={(e) => onChange({ ...flags, [key]: e.target.checked })}
                        className="h-4 w-4 rounded"
                    />
                    {label}
                </label>
            ))}
        </div>
    );
};

// Main Clinical File Component - NO COLLAPSIBLES
const ClinicalFileV2: React.FC<ClinicalFileV2Props> = ({ patient }) => {
    const { updateClinicalFileSection } = usePatient();
    const { addToast } = useToast();

    // State from patient data
    const [history, setHistory] = useState<Partial<HistorySectionData>>({
        complaints: patient.clinicalFile?.sections?.history?.complaints || [],
        hpi: patient.clinicalFile?.sections?.history?.hpi || '',
        past_medical_history: patient.clinicalFile?.sections?.history?.past_medical_history || '',
        past_surgical_history: patient.clinicalFile?.sections?.history?.past_surgical_history || '',
        drug_history: patient.clinicalFile?.sections?.history?.drug_history || '',
        allergy_history: patient.clinicalFile?.sections?.history?.allergy_history || [],
        family_history: patient.clinicalFile?.sections?.history?.family_history || '',
        personal_social_history: patient.clinicalFile?.sections?.history?.personal_social_history || '',
    });

    const [gpe, setGpe] = useState<Partial<GPESectionData>>({
        general_appearance: patient.clinicalFile?.sections?.gpe?.general_appearance || '',
        build: patient.clinicalFile?.sections?.gpe?.build || '',
        hydration: patient.clinicalFile?.sections?.gpe?.hydration || '',
        flags: patient.clinicalFile?.sections?.gpe?.flags || {
            pallor: false, icterus: false, cyanosis: false,
            clubbing: false, lymphadenopathy: false, edema: false
        },
        remarks: patient.clinicalFile?.sections?.gpe?.remarks || '',
    });

    const [systemic, setSystemic] = useState<Partial<SystemicExamSectionData>>({
        cvs: patient.clinicalFile?.sections?.systemic?.cvs || {},
        rs: patient.clinicalFile?.sections?.systemic?.rs || {},
        cns: patient.clinicalFile?.sections?.systemic?.cns || {},
        abdomen: patient.clinicalFile?.sections?.systemic?.abdomen || {},
    });

    const [impression, setImpression] = useState('');
    const [plan, setPlan] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [isRAGChatOpen, setIsRAGChatOpen] = useState(false);
    const [activeSystemTab, setActiveSystemTab] = useState('cvs');

    // Save handler
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 500));

        updateClinicalFileSection(patient.id, 'history', history);
        updateClinicalFileSection(patient.id, 'gpe', gpe);
        updateClinicalFileSection(patient.id, 'systemic', systemic);

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSaved(`at ${time}`);
        setIsSaving(false);
        addToast("Clinical file saved", "success");
    }, [patient.id, history, gpe, systemic, updateClinicalFileSection, addToast]);

    // AI Scribe handler - populates fields from SOAP
    const handleDraftAccepted = useCallback((draft: SOAPDraft) => {
        setHistory(prev => ({ ...prev, hpi: draft.s }));
        setGpe(prev => ({ ...prev, remarks: draft.o }));
        setImpression(draft.a);
        setPlan(draft.p);
        addToast("AI draft applied to clinical fields", "info");
    }, [addToast]);

    // Vitals strip
    const VitalsStrip = patient.vitals ? (
        <div className="flex items-center gap-4 text-sm bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="font-medium">BP {patient.vitals.bp_sys}/{patient.vitals.bp_dia}</span>
            <span className="text-muted-foreground">•</span>
            <span>HR {patient.vitals.pulse}</span>
            <span className="text-muted-foreground">•</span>
            <span>SpO2 {patient.vitals.spo2}%</span>
            <span className="text-muted-foreground">•</span>
            <span>RR {patient.vitals.rr}</span>
        </div>
    ) : null;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50">
            {/* Sticky Header */}
            <header className="sticky top-0 z-40 bg-white border-b px-6 py-3 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg">
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-bold text-foreground">{patient.name}</h1>
                                <span className="text-sm text-muted-foreground">{patient.age}y / {patient.gender}</span>
                                <TriageBadge level={patient.triage?.level || 'Green'} />
                            </div>
                            <p className="text-xs text-muted-foreground">ID: {patient.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsRAGChatOpen(true)} className="gap-1">
                            <MessageCircle className="w-4 h-4" /> Ask AI
                        </Button>
                        <Badge variant={patient.status === 'Discharged' ? 'secondary' : 'default'}>
                            {patient.status}
                        </Badge>
                    </div>
                </div>
            </header>

            {/* Main Content - Scrollable */}
            <ScrollArea className="flex-1">
                <main className="max-w-5xl mx-auto p-6 space-y-6 pb-24">

                    {/* Vitals Strip */}
                    {VitalsStrip}

                    {/* AI SCRIBE - Simple and Direct */}
                    <AIScribePanel onDraftAccepted={handleDraftAccepted} />

                    {/* CHIEF COMPLAINTS */}
                    <Card>
                        <CardContent className="pt-4">
                            <SectionHeader title="Chief Complaints" icon={ClipboardList} badge={`${history.complaints?.length || 0}`} />
                            <ChiefComplaintsEditor
                                complaints={history.complaints || []}
                                onChange={(complaints) => setHistory(prev => ({ ...prev, complaints }))}
                            />
                        </CardContent>
                    </Card>

                    {/* HISTORY OF PRESENT ILLNESS */}
                    <Card>
                        <CardContent className="pt-4">
                            <SectionHeader title="History of Present Illness (HPI)" icon={FileText} aiButton onAIClick={() => addToast("AI structuring HPI...", "info")} />
                            <Textarea
                                value={history.hpi || ''}
                                onChange={(e) => setHistory(prev => ({ ...prev, hpi: e.target.value }))}
                                placeholder="Describe: Onset • Duration • Character • Location • Radiation • Associated symptoms • Relieving/Aggravating factors"
                                className="min-h-[100px]"
                            />
                        </CardContent>
                    </Card>

                    {/* PAST HISTORY - ALL VISIBLE */}
                    <Card>
                        <CardContent className="pt-4 space-y-4">
                            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Heart className="w-4 h-4" /> Past History
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Past Medical History</label>
                                    <Textarea
                                        value={history.past_medical_history || ''}
                                        onChange={(e) => setHistory(prev => ({ ...prev, past_medical_history: e.target.value }))}
                                        placeholder="DM, HTN, CAD, Asthma..."
                                        className="min-h-[70px]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Past Surgical History</label>
                                    <Textarea
                                        value={history.past_surgical_history || ''}
                                        onChange={(e) => setHistory(prev => ({ ...prev, past_surgical_history: e.target.value }))}
                                        placeholder="Appendectomy 2019, CABG 2021..."
                                        className="min-h-[70px]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Drug History</label>
                                    <Textarea
                                        value={history.drug_history || ''}
                                        onChange={(e) => setHistory(prev => ({ ...prev, drug_history: e.target.value }))}
                                        placeholder="Metformin 500mg BD, Atorvastatin 10mg HS..."
                                        className="min-h-[70px]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Family History</label>
                                    <Textarea
                                        value={history.family_history || ''}
                                        onChange={(e) => setHistory(prev => ({ ...prev, family_history: e.target.value }))}
                                        placeholder="Father: DM, HTN. Mother: Hypothyroid..."
                                        className="min-h-[70px]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Personal & Social History</label>
                                <Textarea
                                    value={history.personal_social_history || ''}
                                    onChange={(e) => setHistory(prev => ({ ...prev, personal_social_history: e.target.value }))}
                                    placeholder="Occupation, smoking, alcohol, diet, exercise..."
                                    className="min-h-[60px]"
                                />
                            </div>

                            {/* Allergy Section */}
                            <div>
                                <SectionHeader title="Drug Allergies" icon={AlertTriangle} badge={`${history.allergy_history?.length || 0}`} />
                                <AllergyEditor
                                    allergies={history.allergy_history || []}
                                    onChange={(allergies) => setHistory(prev => ({ ...prev, allergy_history: allergies }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* GENERAL PHYSICAL EXAMINATION */}
                    <Card>
                        <CardContent className="pt-4 space-y-4">
                            <SectionHeader title="General Physical Examination" icon={Stethoscope} />

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Appearance</label>
                                    <select
                                        value={gpe.general_appearance || ''}
                                        onChange={(e) => setGpe(prev => ({ ...prev, general_appearance: e.target.value as any }))}
                                        className="w-full h-9 px-2 rounded-md border border-input text-sm"
                                    >
                                        <option value="">Select...</option>
                                        <option value="well">Well</option>
                                        <option value="ill">Ill</option>
                                        <option value="toxic">Toxic</option>
                                        <option value="cachectic">Cachectic</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Build</label>
                                    <select
                                        value={gpe.build || ''}
                                        onChange={(e) => setGpe(prev => ({ ...prev, build: e.target.value as any }))}
                                        className="w-full h-9 px-2 rounded-md border border-input text-sm"
                                    >
                                        <option value="">Select...</option>
                                        <option value="normal">Normal</option>
                                        <option value="obese">Obese</option>
                                        <option value="cachectic">Cachectic</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Hydration</label>
                                    <select
                                        value={gpe.hydration || ''}
                                        onChange={(e) => setGpe(prev => ({ ...prev, hydration: e.target.value as any }))}
                                        className="w-full h-9 px-2 rounded-md border border-input text-sm"
                                    >
                                        <option value="">Select...</option>
                                        <option value="normal">Normal</option>
                                        <option value="mild">Mild Dehydration</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="severe">Severe</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">Clinical Signs (Click to toggle)</label>
                                <GPEFlags
                                    flags={gpe.flags || { pallor: false, icterus: false, cyanosis: false, clubbing: false, lymphadenopathy: false, edema: false }}
                                    onChange={(flags) => setGpe(prev => ({ ...prev, flags }))}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Additional Remarks</label>
                                <Textarea
                                    value={gpe.remarks || ''}
                                    onChange={(e) => setGpe(prev => ({ ...prev, remarks: e.target.value }))}
                                    placeholder="Additional GPE findings..."
                                    className="min-h-[60px]"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* SYSTEMIC EXAMINATION - TABS */}
                    <Card>
                        <CardContent className="pt-4">
                            <SectionHeader title="Systemic Examination" icon={Activity} />
                            <Tabs value={activeSystemTab} onValueChange={setActiveSystemTab}>
                                <TabsList className="grid w-full grid-cols-4 mb-4">
                                    <TabsTrigger value="cvs">CVS</TabsTrigger>
                                    <TabsTrigger value="rs">RS</TabsTrigger>
                                    <TabsTrigger value="cns">CNS</TabsTrigger>
                                    <TabsTrigger value="abdomen">Abdomen</TabsTrigger>
                                </TabsList>
                                {['cvs', 'rs', 'cns', 'abdomen'].map(sys => (
                                    <TabsContent key={sys} value={sys}>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['inspection', 'palpation', 'percussion', 'auscultation'].map(field => (
                                                <div key={field}>
                                                    <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">
                                                        {field.charAt(0).toUpperCase() + field.slice(1)}
                                                    </label>
                                                    <Textarea
                                                        value={(systemic as any)[sys]?.[field] || ''}
                                                        onChange={(e) => setSystemic(prev => ({
                                                            ...prev,
                                                            [sys]: { ...(prev as any)[sys], [field]: e.target.value }
                                                        }))}
                                                        placeholder={`${sys.toUpperCase()} ${field}...`}
                                                        className="min-h-[60px]"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3">
                                            <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">Summary</label>
                                            <Textarea
                                                value={(systemic as any)[sys]?.summary || ''}
                                                onChange={(e) => setSystemic(prev => ({
                                                    ...prev,
                                                    [sys]: { ...(prev as any)[sys], summary: e.target.value }
                                                }))}
                                                placeholder={`${sys.toUpperCase()} summary...`}
                                                className="min-h-[50px]"
                                            />
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* IMPRESSION & PLAN */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-l-4 border-l-teal-500">
                            <CardContent className="pt-4">
                                <SectionHeader title="Impression / Diagnosis" icon={Brain} />
                                <Textarea
                                    value={impression}
                                    onChange={(e) => setImpression(e.target.value)}
                                    placeholder="Working diagnosis, differential diagnoses..."
                                    className="min-h-[100px]"
                                />
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-amber-500 bg-amber-50/30">
                            <CardContent className="pt-4">
                                <SectionHeader title="Plan" icon={ClipboardList} badge="Draft" />
                                <Textarea
                                    value={plan}
                                    onChange={(e) => setPlan(e.target.value)}
                                    placeholder="Investigations, medications, referrals..."
                                    className="min-h-[100px] bg-transparent"
                                />
                            </CardContent>
                        </Card>
                    </div>

                </main>
            </ScrollArea>

            {/* Sticky Save Footer */}
            <footer className="sticky bottom-0 bg-white border-t px-6 py-3 shadow-lg">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        {lastSaved ? `Saved ${lastSaved}` : 'Unsaved changes'}
                    </span>
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Saving...' : 'Save Clinical File'}
                    </Button>
                </div>
            </footer>

            {/* RAG Chat */}
            <PatientRAGChat
                patient={patient}
                isOpen={isRAGChatOpen}
                onClose={() => setIsRAGChatOpen(false)}
            />
        </div>
    );
};

export default ClinicalFileV2;
