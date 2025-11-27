import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import { useAuth } from '../contexts/AuthContext';
import { DischargeSummary } from '../types';
import TextareaAutosize from 'react-textarea-autosize';
import { SparklesIcon, CheckBadgeIcon, DocumentTextIcon, XMarkIcon, PlusIcon, PencilIcon } from '../components/icons';

// --- COMPONENTS ---

const SectionHeader: React.FC<{ title: string; required?: boolean; isCompleted: boolean }> = ({ title, required, isCompleted }) => (
    <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-tertiary">{title}</h3>
            {required && <span className="text-red-500 text-xs" title="Required">*</span>}
        </div>
        {isCompleted ? <CheckBadgeIcon className="w-5 h-5 text-green-500" /> : <div className="w-4 h-4 rounded-full border border-border-color"></div>}
    </div>
);

const SuggestionBox: React.FC<{ label: string; value: string; onAccept: () => void; onDismiss: () => void }> = ({ label, value, onAccept, onDismiss }) => (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-3 mb-3 animate-fade-in">
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <SparklesIcon className="w-3 h-3" /> AI Suggestion: {label}
            </span>
            <div className="flex gap-2">
                <button onClick={onDismiss} className="text-text-tertiary hover:text-red-500"><XMarkIcon className="w-4 h-4" /></button>
            </div>
        </div>
        <p className="text-sm text-text-secondary whitespace-pre-wrap mb-3">{value}</p>
        <button onClick={onAccept} className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 transition-colors w-full sm:w-auto">
            Accept Suggestion
        </button>
    </div>
);

const DischargeSummaryPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        patients,
        generateDischargeSummary, saveDischargeSummary, finalizeDischarge,
        isLoading
    } = usePatient();
    const { currentUser } = useAuth();

    const patient = patients.find(p => p.id === id);

    // Local State for the Form
    const [summary, setSummary] = useState<Partial<DischargeSummary>>({});
    const [aiDraft, setAiDraft] = useState<Partial<DischargeSummary> | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    // Initialize or Load Draft
    useEffect(() => {
        if (!patient) {
            // If patient not found (or loading), we might want to wait or redirect.
            // For now, if patients are loaded and still not found, redirect.
            if (!isLoading && patients.length > 0) {
                navigate('/');
            }
            return;
        }

        if (patient.dischargeSummary) {
            setSummary(patient.dischargeSummary);
        } else if (!isGenerating && !summary.id) {
            // Auto-trigger generation on first load if empty
            setIsGenerating(true);
            generateDischargeSummary(patient.id).then(() => setIsGenerating(false));
        }
    }, [patient, generateDischargeSummary, isGenerating, summary.id, navigate, isLoading, patients.length]);

    // Sync context updates to local state when AI finishes
    useEffect(() => {
        if (patient?.dischargeSummary && !summary.id) {
            setSummary(patient.dischargeSummary);
            setAiDraft(patient.dischargeSummary); // Initially, AI draft is what we have
        }
    }, [patient?.dischargeSummary, summary.id]);

    const handleChange = (field: keyof DischargeSummary, value: any) => {
        setSummary(prev => ({ ...prev, [field]: value }));
    };

    const handleMedsChange = (index: number, field: string, value: string) => {
        const newMeds = [...(summary.dischargeMeds || [])];
        // @ts-ignore
        newMeds[index] = { ...newMeds[index], [field]: value };
        handleChange('dischargeMeds', newMeds);
    };

    const addMed = () => {
        const newMeds = [...(summary.dischargeMeds || []), { name: '', dosage: '', frequency: '', duration: '', instructions: '' }];
        handleChange('dischargeMeds', newMeds);
    };

    const removeMed = (index: number) => {
        const newMeds = (summary.dischargeMeds || []).filter((_, i) => i !== index);
        handleChange('dischargeMeds', newMeds);
    };

    // --- VALIDATION ---
    const validation = useMemo(() => {
        const hasValidMeds = (summary.dischargeMeds?.length || 0) > 0 && summary.dischargeMeds?.some(m => m.name.trim().length > 0);
        return {
            finalDiagnosis: !!summary.finalDiagnosis,
            courseInHospital: !!summary.courseInHospital,
            treatmentGiven: !!summary.treatmentGiven,
            conditionAtDischarge: !!summary.conditionAtDischarge,
            dischargeMeds: !!hasValidMeds,
            followUpInstructions: !!summary.followUpInstructions,
        };
    }, [summary]);

    const completedCount = Object.values(validation).filter(Boolean).length;
    const totalRequired = Object.keys(validation).length;
    const progress = Math.round((completedCount / totalRequired) * 100);

    const handleFinalize = async () => {
        if (completedCount < totalRequired) {
            alert("Please complete all required fields marked with * before finalizing.");
            return;
        }
        if (patient && summary.finalDiagnosis) {
            if (window.confirm("Are you sure you want to finalize? This will discharge the patient and create a housekeeping task.")) {
                await finalizeDischarge(patient.id, summary as DischargeSummary);
                navigate('/');
            }
        }
    };

    const handleSave = async () => {
        if (patient && summary.finalDiagnosis) {
            await saveDischargeSummary(patient.id, summary as DischargeSummary);
            alert("Draft saved successfully.");
        }
    };

    if (!patient) return null;

    return (
        <div className="min-h-screen bg-background-secondary flex flex-col">
            {/* Header */}
            <header className="bg-background-primary border-b border-border-color sticky top-0 z-40 px-6 py-4 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <DocumentTextIcon className="w-6 h-6 text-brand-blue" />
                        Discharge Workflow: {patient.name}
                    </h1>
                    <p className="text-sm text-text-secondary">UHID: {patient.id} • Ward 4 • Bed 12</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate(`/patient/${patient.id}`)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-border-color rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-text-primary">Save Draft</button>
                    <button
                        onClick={handleFinalize}
                        disabled={completedCount < totalRequired}
                        className="px-6 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm transition-all"
                    >
                        Finalize & Discharge
                    </button>
                </div>
            </header>

            <div className="flex flex-1 max-w-7xl mx-auto w-full p-6 gap-8">
                {/* LEFT: Checklist Sidebar */}
                <div className="w-64 shrink-0 hidden lg:block">
                    <div className="sticky top-24 bg-background-primary border border-border-color rounded-xl p-5 shadow-sm">
                        <h3 className="font-bold text-text-primary mb-4 flex justify-between items-center">
                            Protocol Checklist
                            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{progress}%</span>
                        </h3>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mb-6">
                            <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        <ul className="space-y-3 text-sm">
                            {[
                                { k: 'finalDiagnosis', l: 'Final Diagnosis' },
                                { k: 'courseInHospital', l: 'Hospital Course' },
                                { k: 'treatmentGiven', l: 'Treatment Summary' },
                                { k: 'conditionAtDischarge', l: 'Discharge Condition' },
                                { k: 'dischargeMeds', l: 'Medications' },
                                { k: 'followUpInstructions', l: 'Follow-up Plan' }
                            ].map(({ k, l }) => (
                                <li key={k} className={`flex items-center gap-2 ${validation[k as keyof typeof validation] ? 'text-green-600 font-medium' : 'text-text-tertiary'}`}>
                                    {validation[k as keyof typeof validation] ? <CheckBadgeIcon className="w-4 h-4" /> : <div className="w-4 h-4 border border-gray-300 rounded-full"></div>}
                                    {l}
                                </li>
                            ))}
                        </ul>
                        {isGenerating && (
                            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-lg border border-blue-100 flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                AI Drafting in progress...
                            </div>
                        )}
                    </div>
                </div>

                {/* MIDDLE: Form Content */}
                <div className="flex-1 space-y-6 pb-20">

                    {/* Diagnosis */}
                    <section className="bg-background-primary p-6 rounded-xl border border-border-color shadow-sm" onFocus={() => setActiveSection('diagnosis')}>
                        <SectionHeader title="Final Diagnosis" required isCompleted={validation.finalDiagnosis} />
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full text-lg font-bold border-b-2 border-border-color focus:border-brand-blue bg-transparent outline-none py-2 transition-colors placeholder-text-tertiary text-text-primary"
                                placeholder="e.g. Acute Appendicitis with Peritonitis"
                                value={summary.finalDiagnosis || ''}
                                onChange={e => handleChange('finalDiagnosis', e.target.value)}
                            />
                            <div className="absolute right-0 top-3 text-xs text-text-tertiary">ICD-10 Search Enabled</div>
                        </div>
                    </section>

                    {/* Brief History */}
                    <section className="bg-background-primary p-6 rounded-xl border border-border-color shadow-sm">
                        <SectionHeader title="Brief History" isCompleted={!!summary.briefHistory} />
                        <TextareaAutosize
                            minRows={3}
                            value={summary.briefHistory || ''}
                            onChange={e => handleChange('briefHistory', e.target.value)}
                            className="w-full resize-none outline-none text-sm leading-relaxed bg-transparent text-text-secondary focus:text-text-primary transition-colors"
                            placeholder="Patient presented with..."
                        />
                    </section>

                    {/* Course in Hospital */}
                    <section className="bg-background-primary p-6 rounded-xl border border-border-color shadow-sm group focus-within:ring-2 focus-within:ring-brand-blue/10 transition-all">
                        <SectionHeader title="Course in Hospital" required isCompleted={validation.courseInHospital} />
                        <TextareaAutosize
                            minRows={6}
                            value={summary.courseInHospital || ''}
                            onChange={e => handleChange('courseInHospital', e.target.value)}
                            className="w-full resize-none outline-none text-sm leading-relaxed bg-transparent text-text-secondary focus:text-text-primary transition-colors"
                            placeholder="Describe the hospital stay chronology..."
                        />
                    </section>

                    {/* Treatment & Investigations Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section className="bg-background-primary p-6 rounded-xl border border-border-color shadow-sm">
                            <SectionHeader title="Treatment Given" required isCompleted={validation.treatmentGiven} />
                            <TextareaAutosize
                                minRows={4}
                                value={summary.treatmentGiven || ''}
                                onChange={e => handleChange('treatmentGiven', e.target.value)}
                                className="w-full resize-none outline-none text-sm leading-relaxed bg-transparent text-text-secondary focus:text-text-primary transition-colors"
                            />
                        </section>
                        <section className="bg-background-primary p-6 rounded-xl border border-border-color shadow-sm">
                            <SectionHeader title="Significant Investigations" isCompleted={!!summary.investigationsSummary} />
                            <TextareaAutosize
                                minRows={4}
                                value={summary.investigationsSummary || ''}
                                onChange={e => handleChange('investigationsSummary', e.target.value)}
                                className="w-full resize-none outline-none text-sm leading-relaxed bg-transparent text-text-secondary focus:text-text-primary transition-colors"
                            />
                        </section>
                    </div>

                    {/* Medications */}
                    <section className="bg-background-primary p-6 rounded-xl border border-border-color shadow-sm">
                        <SectionHeader title="Discharge Medications" required isCompleted={validation.dischargeMeds} />
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-background-secondary text-text-tertiary font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-2 rounded-l-lg">Drug Name</th>
                                        <th className="px-4 py-2">Dosage</th>
                                        <th className="px-4 py-2">Frequency</th>
                                        <th className="px-4 py-2">Duration</th>
                                        <th className="px-4 py-2 rounded-r-lg">Instructions</th>
                                        <th className="w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-color text-text-primary">
                                    {summary.dischargeMeds?.map((med, idx) => (
                                        <tr key={idx} className="group hover:bg-background-secondary/30">
                                            <td className="p-2"><input type="text" value={med.name} onChange={e => handleMedsChange(idx, 'name', e.target.value)} className="w-full bg-transparent outline-none font-medium" placeholder="Drug Name" /></td>
                                            <td className="p-2"><input type="text" value={med.dosage} onChange={e => handleMedsChange(idx, 'dosage', e.target.value)} className="w-full bg-transparent outline-none" placeholder="e.g. 500mg" /></td>
                                            <td className="p-2"><input type="text" value={med.frequency} onChange={e => handleMedsChange(idx, 'frequency', e.target.value)} className="w-full bg-transparent outline-none" placeholder="e.g. BD" /></td>
                                            <td className="p-2"><input type="text" value={med.duration} onChange={e => handleMedsChange(idx, 'duration', e.target.value)} className="w-full bg-transparent outline-none" placeholder="e.g. 5 days" /></td>
                                            <td className="p-2"><input type="text" value={med.instructions} onChange={e => handleMedsChange(idx, 'instructions', e.target.value)} className="w-full bg-transparent outline-none text-text-secondary" placeholder="e.g. After food" /></td>
                                            <td className="p-2 text-center"><button onClick={() => removeMed(idx)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><XMarkIcon className="w-4 h-4" /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button onClick={addMed} className="mt-4 flex items-center gap-2 text-xs font-bold text-brand-blue hover:text-brand-blue-dark"><PlusIcon className="w-4 h-4" /> Add Medication</button>
                        </div>
                    </section>

                    {/* Advice & Follow-up */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section className="bg-background-primary p-6 rounded-xl border border-border-color shadow-sm">
                            <SectionHeader title="Diet & Activity" isCompleted={!!summary.dietAdvice} />
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-text-tertiary mb-1 block">Dietary Advice</label>
                                    <input type="text" value={summary.dietAdvice || ''} onChange={e => handleChange('dietAdvice', e.target.value)} className="w-full p-2 border border-border-color rounded bg-background-secondary/30 text-sm focus:border-brand-blue outline-none text-text-primary" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-tertiary mb-1 block">Activity Level</label>
                                    <input type="text" value={summary.activityAdvice || ''} onChange={e => handleChange('activityAdvice', e.target.value)} className="w-full p-2 border border-border-color rounded bg-background-secondary/30 text-sm focus:border-brand-blue outline-none text-text-primary" />
                                </div>
                            </div>
                        </section>
                        <section className="bg-background-primary p-6 rounded-xl border border-border-color shadow-sm">
                            <SectionHeader title="Follow Up & Warnings" required isCompleted={validation.followUpInstructions} />
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-text-tertiary mb-1 block">Follow Up Plan</label>
                                    <TextareaAutosize minRows={2} value={summary.followUpInstructions || ''} onChange={e => handleChange('followUpInstructions', e.target.value)} className="w-full p-2 border border-border-color rounded bg-background-secondary/30 text-sm focus:border-brand-blue outline-none text-text-primary" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-red-400 mb-1 block">Red Flag Warnings (Return to ER if...)</label>
                                    <TextareaAutosize minRows={2} value={summary.emergencyWarnings || ''} onChange={e => handleChange('emergencyWarnings', e.target.value)} className="w-full p-2 border border-red-200 dark:border-red-900 rounded bg-red-50/50 dark:bg-red-900/20 text-sm focus:border-red-400 outline-none text-text-primary" />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Condition at Discharge & Signature */}
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <section className="flex-1 bg-background-primary p-6 rounded-xl border border-border-color shadow-sm w-full">
                            <SectionHeader title="Condition at Discharge" required isCompleted={validation.conditionAtDischarge} />
                            <input type="text" value={summary.conditionAtDischarge || ''} onChange={e => handleChange('conditionAtDischarge', e.target.value)} className="w-full text-sm font-medium border-b border-border-color focus:border-brand-blue outline-none py-2 bg-transparent text-text-primary" placeholder="e.g. Hemodynamically stable, wounds dry and clean." />
                        </section>
                        <div className="p-6 text-right opacity-70">
                            <p className="font-script text-2xl text-brand-blue-dark mb-1">{currentUser?.name}</p>
                            <div className="h-px w-48 bg-black dark:bg-gray-400 ml-auto mb-2"></div>
                            <p className="text-xs font-bold uppercase text-text-secondary">Consultant Signature</p>
                            <p className="text-xs text-text-secondary">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DischargeSummaryPage;
