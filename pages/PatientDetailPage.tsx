import React, { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import { useAuth } from '../contexts/AuthContext';
import { Patient, User, TriageLevel, Order, Vitals, OrderStatus, OrderCategory, ClinicalFileSections, Allergy, HistorySectionData, GPESectionData, SystemicExamSectionData, SystemicExamSystemData, AISuggestionHistory, OrderPriority, Round, VitalsRecord, VitalsMeasurements, PatientStatus } from '../types';
import { SparklesIcon, CheckBadgeIcon, InformationCircleIcon, DocumentDuplicateIcon, ChevronDownIcon, ChevronUpIcon, XMarkIcon, EllipsisVerticalIcon, PaperAirplaneIcon, PencilIcon, BeakerIcon, FilmIcon, PillIcon, ClipboardDocumentListIcon, UserCircleIcon, SearchIcon, PlusIcon, DocumentTextIcon } from '../components/icons';
import TextareaAutosize from 'react-textarea-autosize';
import VoiceInput from '../components/VoiceInput';
import VitalsSnapshotCard from '../components/vitals/VitalsSnapshotCard';
import VitalsChart from '../components/vitals/VitalsChart';
import ClinicalFileRedesigned from '../components/clinical/ClinicalFileRedesigned';
import MedViewRedesigned from '../components/medview/MedViewRedesigned';

// ...

// {activeTab === 'vitals' && <VitalsTab patient={patient} />}
// {activeTab === 'medview' && <MedViewTab patient={patient} />}

// --- STYLED COMPONENTS & HELPERS ---

const TriageBadge: React.FC<{ level: TriageLevel }> = React.memo(({ level }) => {
    const levelStyles: Record<TriageLevel, string> = {
        Red: 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800',
        Yellow: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:ring-yellow-800',
        Green: 'bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-800',
        None: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700',
    };
    return <span className={`px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full ${levelStyles[level]}`}>{level}</span>;
});

const PatientWorkspaceHeader: React.FC<{ patient: Patient, onStatusChange: (s: PatientStatus) => void }> = React.memo(({ patient, onStatusChange }) => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const vitals = patient.vitals;

    const VitalsChip: React.FC<{ label: string, value?: number | string | null, unit: string, isAbnormal?: boolean }> = React.memo(({ label, value, unit, isAbnormal }) => (
        <div className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl border transition-all ${isAbnormal ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 shadow-sm' : 'bg-background-primary border-border-color'}`}>
            <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider mb-0.5">{label}</span>
            <span className={`text-lg font-bold leading-none ${isAbnormal ? 'text-red-600 dark:text-red-400' : 'text-text-primary'}`}>
                {value || '--'}<span className="text-xs font-normal text-text-tertiary ml-0.5">{unit}</span>
            </span>
        </div>
    ));

    return (
        <div className="glass border-b border-border-color sticky top-16 z-30 shadow-sm print:hidden">
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-blue to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-blue/20">
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-text-primary">{patient.name}</h2>
                                <TriageBadge level={patient.triage.level} />
                            </div>
                            <div className="flex items-center gap-2 text-sm text-text-secondary mt-0.5 font-medium">
                                <span>{patient.age}y</span>
                                <span className="text-border-color">|</span>
                                <span>{patient.gender}</span>
                                <span className="text-border-color">|</span>
                                <span className="font-mono text-text-tertiary text-xs">#{patient.id.slice(-5)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Vitals Ribbon */}
                        <div className="flex gap-2">
                            <VitalsChip label="HR" value={vitals?.pulse} unit="" isAbnormal={(vitals?.pulse || 0) > 100} />
                            <VitalsChip label="BP" value={vitals?.bp_sys ? `${vitals.bp_sys}/${vitals?.bp_dia}` : null} unit="" isAbnormal={(vitals?.bp_sys || 0) < 90} />
                            <VitalsChip label="SpO2" value={vitals?.spo2} unit="%" isAbnormal={(vitals?.spo2 || 100) < 95} />
                            <button
                                onClick={() => navigate(`/patient/${patient.id}/vitals`)}
                                className="px-3 py-2 bg-white dark:bg-gray-800 border border-border-color rounded-xl text-xs font-bold text-brand-blue hover:bg-brand-blue hover:text-white transition-colors shadow-sm"
                            >
                                View Full Vitals
                            </button>
                        </div>

                        <div className="h-8 w-px bg-border-color hidden lg:block"></div>

                        <select
                            value={patient.status}
                            onChange={(e) => onStatusChange(e.target.value as PatientStatus)}
                            className="px-4 py-2 bg-background-secondary border border-border-color rounded-xl text-sm font-medium text-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition-shadow cursor-pointer hover:bg-background-tertiary"
                            disabled={currentUser?.role !== 'Doctor' && currentUser?.role !== 'Admin'}
                        >
                            <option value="Waiting for Triage">Waiting for Triage</option>
                            <option value="Waiting for Doctor">Waiting for Doctor</option>
                            <option value="In Treatment">In Treatment</option>
                            <option value="Discharged">Discharged</option>
                        </select>
                        {patient.status === 'Discharged' && (
                            <button
                                onClick={() => navigate(`/discharge/${patient.id}`)}
                                className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-bold border border-green-200 hover:bg-green-200"
                            >
                                View Discharge Summary
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

const Accordion: React.FC<{ title: string, children: React.ReactNode, isOpenDefault?: boolean, status?: 'green' | 'yellow' | 'red' }> = React.memo(({ title, children, isOpenDefault = false, status }) => {
    const [isOpen, setIsOpen] = useState(isOpenDefault);
    return (
        <div className="border border-border-color rounded-xl overflow-hidden bg-background-primary shadow-sm mb-4 transition-all duration-200 hover:shadow-md">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 bg-background-primary hover:bg-background-secondary/50 focus:outline-none transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ring-2 ring-offset-2 ${status === 'green' ? 'bg-green-500 ring-green-100' : status === 'red' ? 'bg-red-500 ring-red-100' : status === 'yellow' ? 'bg-yellow-500 ring-yellow-100' : 'bg-brand-blue ring-blue-100'}`}></div>
                    <h4 className="text-sm font-bold text-text-primary group-hover:text-brand-blue transition-colors">{title}</h4>
                </div>
                <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} text-text-tertiary`}>
                    <ChevronDownIcon />
                </div>
            </button>
            {isOpen && <div className="p-5 border-t border-border-color bg-background-secondary/10 animate-fade-in">{children}</div>}
        </div>
    );
});

const AIActionButton: React.FC<{ onClick: () => void, text: string, isLoading?: boolean }> = React.memo(({ onClick, text, isLoading }) => (
    <button onClick={onClick} disabled={isLoading} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-50 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition-all border border-indigo-100 dark:border-indigo-800 shadow-sm hover:shadow-indigo-100">
        {isLoading ? <div className="w-3 h-3 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div> : <SparklesIcon className="w-3.5 h-3.5" />} {text}
    </button>
));

const TagsInput: React.FC<{ tags: string[]; onTagsChange: (tags: string[]) => void; disabled: boolean }> = React.memo(({ tags, onTagsChange, disabled }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (newTag && !tags.includes(newTag)) {
                onTagsChange([...tags, newTag]);
            }
            setInputValue('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        onTagsChange(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className={`w-full flex flex-wrap items-center gap-2 p-2 border border-border-color rounded-lg bg-background-primary transition-shadow focus-within:ring-2 focus-within:ring-brand-blue/20 focus-within:border-brand-blue ${disabled ? 'opacity-70' : ''}`}>
            {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-brand-blue-light text-brand-blue-dark text-xs font-semibold px-2 py-1 rounded-md">
                    {tag}
                    {!disabled && <button onClick={() => removeTag(tag)} className="hover:text-red-500 ml-1">&times;</button>}
                </span>
            ))}
            <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className="flex-grow bg-transparent focus:outline-none text-sm text-input-text min-w-[120px]"
                placeholder={tags.length === 0 ? "Type symptoms and press Enter..." : ""}
            />
        </div>
    );
});

// --- CLINICAL FILE SUB-SECTIONS ---

const AIAssistedTextarea: React.FC<{
    patient: Patient;
    fieldKey: keyof HistorySectionData;
    label: string;
    isSignedOff: boolean;
    minRows?: number;
}> = React.memo(({ patient, fieldKey, label, isSignedOff, minRows = 2 }) => {
    const { updateClinicalFileSection, getFollowUpQuestions, updateFollowUpAnswer, composeHistoryWithAI } = usePatient();
    const [isLoading, setIsLoading] = useState(false);

    const history = patient.clinicalFile.sections.history || {};
    const currentValue = (history[fieldKey] as string) || '';

    const suggestions = patient.clinicalFile.aiSuggestions?.history;
    const questions = suggestions?.followUpQuestions?.[fieldKey];
    const answers = suggestions?.followUpAnswers?.[fieldKey] || {};

    const handleChange = (value: string) => {
        updateClinicalFileSection(patient.id, 'history', { [fieldKey]: value });
    };

    const handleVoiceTranscript = (text: string) => {
        handleChange(currentValue ? `${currentValue} ${text}` : text);
    };

    const handleSuggest = async () => {
        setIsLoading(true);
        await getFollowUpQuestions(patient.id, 'history', fieldKey, currentValue);
        setIsLoading(false);
    };

    const handleCompose = async () => {
        setIsLoading(true);
        await composeHistoryWithAI(patient.id, 'history', fieldKey);
        setIsLoading(false);
    };

    return (
        <div className="group">
            <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wide group-focus-within:text-brand-blue transition-colors">{label}</label>
                {!isSignedOff && <VoiceInput onTranscript={handleVoiceTranscript} className="w-5 h-5 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
            <div className={`relative border rounded-lg overflow-hidden transition-all duration-200 shadow-sm ${questions ? 'border-brand-blue ring-1 ring-brand-blue/20' : 'border-border-color hover:border-gray-300 focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/10'}`}>
                <TextareaAutosize
                    minRows={minRows}
                    value={currentValue}
                    onChange={e => handleChange(e.target.value)}
                    disabled={isSignedOff}
                    placeholder="Click to type or dictate..."
                    className={`w-full p-3 text-sm bg-background-primary text-input-text resize-none outline-none leading-relaxed ${patient.clinicalFile.aiSuggestions?.history ? 'bg-indigo-50/30' : ''}`}
                />
                {!isSignedOff && currentValue.trim().length > 5 && !questions && (
                    <div className="absolute bottom-2 right-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                        <AIActionButton onClick={handleSuggest} text="AI Follow-up" isLoading={isLoading} />
                    </div>
                )}
            </div>
            {!isSignedOff && questions && (
                <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-indigo-100 dark:border-indigo-900/50 shadow-soft animate-slide-down relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <div className="flex justify-between items-center mb-3 pl-2">
                        <h5 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase flex items-center gap-1.5"><SparklesIcon className="w-3.5 h-3.5" /> AI Interview Mode</h5>
                        <AIActionButton onClick={handleCompose} text="Finish & Compose" isLoading={isLoading} />
                    </div>
                    <div className="space-y-3 pl-2">
                        {questions.map(q => (
                            <div key={q.id} className="text-sm">
                                <p className="font-medium text-text-primary mb-1.5">{q.text}</p>
                                {q.answer_type === 'options' && q.quick_options ? (
                                    <div className="flex flex-wrap gap-2">
                                        {q.quick_options.map(opt => (
                                            <button key={opt} onClick={() => updateFollowUpAnswer(patient.id, fieldKey, q.id, opt)} className={`px-3 py-1 text-xs rounded-full border transition-all ${answers[q.id] === opt ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-background-primary text-text-secondary border-border-color hover:border-indigo-400'}`}>{opt}</button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input type="text" onBlur={(e) => updateFollowUpAnswer(patient.id, fieldKey, q.id, e.target.value)} defaultValue={answers[q.id] || ''} placeholder="Patient's answer..." className="flex-1 px-3 py-1.5 text-sm border border-border-color rounded-md bg-background-primary focus:ring-1 focus:ring-brand-blue outline-none" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});


const HistorySection: React.FC<{ patient: Patient; isSignedOff: boolean }> = React.memo(({ patient, isSignedOff }) => {
    const { updateClinicalFileSection, formatHpi, checkMissingInfo, summarizeSection } = usePatient();
    const history = patient.clinicalFile.sections.history || {};

    // Local state for new complaint entry
    const [newSymptom, setNewSymptom] = useState('');
    const [newDuration, setNewDuration] = useState('');

    const handleFieldChange = (field: keyof HistorySectionData, value: any) => {
        updateClinicalFileSection(patient.id, 'history', { [field]: value });
    };

    const handleAddComplaint = () => {
        if (!newSymptom.trim()) return;
        const currentComplaints = history.complaints || [];
        handleFieldChange('complaints', [...currentComplaints, { symptom: newSymptom, duration: newDuration }]);
        setNewSymptom('');
        setNewDuration('');
    };

    const removeComplaint = (index: number) => {
        const currentComplaints = history.complaints || [];
        handleFieldChange('complaints', currentComplaints.filter((_, i) => i !== index));
    };

    const handleHpiVoice = (text: string) => {
        handleFieldChange('hpi', (history.hpi || '') + ' ' + text);
    }

    const handleAllergyChange = (index: number, field: keyof Allergy, value: string) => {
        const newAllergies = [...(history.allergy_history || [])];
        newAllergies[index] = { ...newAllergies[index], [field]: value };
        handleFieldChange('allergy_history', newAllergies);
    };

    const addAllergy = () => {
        const newAllergies = [...(history.allergy_history || []), { substance: '', reaction: '', severity: '' }];
        handleFieldChange('allergy_history', newAllergies);
    };

    const removeAllergy = (index: number) => {
        const newAllergies = (history.allergy_history || []).filter((_, i) => i !== index);
        handleFieldChange('allergy_history', newAllergies);
    };
    const reviewOfSystemsFields = ['Cardiovascular', 'Respiratory', 'Gastrointestinal', 'Genitourinary', 'Neurological', 'Musculoskeletal', 'Dermatological', 'Endocrine', 'Hematological', 'Psychiatric'];

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-3 pb-2 border-b border-border-color/50">
                <AIActionButton onClick={() => checkMissingInfo(patient.id, 'history')} text="Scan for Missing Info" />
                <AIActionButton onClick={() => summarizeSection(patient.id, 'history')} text="Generate Summary" />
            </div>

            {/* Complaints Section - Updated for Multiple Entries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2">
                    <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wide mb-2 block">Presenting Complaints</label>
                    <div className="space-y-2 mb-3">
                        {(history.complaints || []).map((c, i) => (
                            <div key={i} className="flex gap-3 items-center bg-background-secondary p-2 rounded-lg border border-border-color">
                                <span className="flex-1 text-sm font-medium text-text-primary">{c.symptom}</span>
                                <span className="text-xs bg-white dark:bg-black px-2 py-1 rounded border border-border-color text-text-secondary">{c.duration || 'Duration unknown'}</span>
                                {!isSignedOff && <button onClick={() => removeComplaint(i)} className="text-text-tertiary hover:text-red-500"><XMarkIcon className="w-4 h-4" /></button>}
                            </div>
                        ))}
                    </div>
                    {!isSignedOff && (
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Symptom (e.g. Fever)"
                                value={newSymptom}
                                onChange={e => setNewSymptom(e.target.value)}
                                className="flex-2 w-full p-2.5 border border-border-color rounded-lg bg-background-primary text-sm focus:ring-1 focus:ring-brand-blue outline-none"
                                onKeyDown={e => e.key === 'Enter' && handleAddComplaint()}
                            />
                            <input
                                type="text"
                                placeholder="Duration (e.g. 3 days)"
                                value={newDuration}
                                onChange={e => setNewDuration(e.target.value)}
                                className="flex-1 w-full p-2.5 border border-border-color rounded-lg bg-background-primary text-sm focus:ring-1 focus:ring-brand-blue outline-none"
                                onKeyDown={e => e.key === 'Enter' && handleAddComplaint()}
                            />
                            <button onClick={handleAddComplaint} className="px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue-dark">Add</button>
                        </div>
                    )}
                </div>

                <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wide">History of Present Illness</label>
                        <div className="flex gap-2">
                            <AIActionButton onClick={() => formatHpi(patient.id)} text="Auto-Format" />
                            {!isSignedOff && <VoiceInput onTranscript={handleHpiVoice} />}
                        </div>
                    </div>
                    <TextareaAutosize minRows={4} value={history.hpi || ''} onChange={e => handleFieldChange('hpi', e.target.value)} disabled={isSignedOff} className="w-full p-4 border border-border-color rounded-lg bg-background-primary text-input-text shadow-sm leading-relaxed focus:ring-2 focus:ring-brand-blue/20 outline-none" />
                </div>

                <div className="md:col-span-2">
                    <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wide mb-1.5 block">Associated Symptoms</label>
                    <TagsInput tags={history.associated_symptoms || []} onTagsChange={tags => handleFieldChange('associated_symptoms', tags)} disabled={isSignedOff} />
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t border-border-color/50">
                    <AIAssistedTextarea patient={patient} fieldKey="past_medical_history" label="Past Medical History" isSignedOff={isSignedOff} />
                    <AIAssistedTextarea patient={patient} fieldKey="past_surgical_history" label="Past Surgical History" isSignedOff={isSignedOff} />
                    <AIAssistedTextarea patient={patient} fieldKey="drug_history" label="Drug / Medication History" isSignedOff={isSignedOff} />
                    <AIAssistedTextarea patient={patient} fieldKey="family_history" label="Family History" isSignedOff={isSignedOff} />
                    <AIAssistedTextarea patient={patient} fieldKey="personal_social_history" label="Personal & Social History" isSignedOff={isSignedOff} />
                    {patient.gender === 'Female' && (
                        <AIAssistedTextarea patient={patient} fieldKey="menstrual_obstetric_history" label="Menstrual / Obstetric History" isSignedOff={isSignedOff} />
                    )}
                    <AIAssistedTextarea patient={patient} fieldKey="socioeconomic_lifestyle" label="Socioeconomic & Lifestyle" isSignedOff={isSignedOff} />
                </div>

                <div className="md:col-span-2 bg-red-50/50 dark:bg-red-900/10 p-5 rounded-xl border border-red-100 dark:border-red-900/30">
                    <label className="text-[11px] font-bold text-red-700 uppercase tracking-wide mb-3 block flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>Allergies</label>
                    <div className="space-y-3">
                        {(history.allergy_history || []).map((allergy, index) => (
                            <div key={index} className="flex gap-3 items-center">
                                <input placeholder="Substance" value={allergy.substance} onChange={e => handleAllergyChange(index, 'substance', e.target.value)} disabled={isSignedOff} className="p-2 border border-red-200 rounded-lg flex-1 bg-white dark:bg-black text-sm focus:ring-2 focus:ring-red-200 outline-none" />
                                <input placeholder="Reaction" value={allergy.reaction} onChange={e => handleAllergyChange(index, 'reaction', e.target.value)} disabled={isSignedOff} className="p-2 border border-red-200 rounded-lg flex-1 bg-white dark:bg-black text-sm focus:ring-2 focus:ring-red-200 outline-none" />
                                <select value={allergy.severity} onChange={e => handleAllergyChange(index, 'severity', e.target.value)} disabled={isSignedOff} className="p-2 border border-red-200 rounded-lg bg-white dark:bg-black text-sm w-32 focus:ring-2 focus:ring-red-200 outline-none">
                                    <option value="">Severity...</option>
                                    <option>Mild</option><option>Moderate</option><option>Severe</option>
                                </select>
                                <button onClick={() => removeAllergy(index)} disabled={isSignedOff} className="text-red-400 hover:text-red-600 hover:bg-red-100 p-1.5 rounded-md transition-colors">&times;</button>
                            </div>
                        ))}
                        {!isSignedOff && <button onClick={addAllergy} className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1 mt-2"><PlusIcon /> Add Allergy</button>}
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wide mb-3 block">Review of Systems</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {reviewOfSystemsFields.map(field => (
                            <label key={field} className={`flex items-center space-x-2 p-2.5 rounded-lg border cursor-pointer transition-all ${history.review_of_systems?.[field.toLowerCase()] ? 'bg-brand-blue-light border-brand-blue text-brand-blue-dark shadow-sm' : 'bg-background-primary border-border-color text-text-secondary hover:border-gray-300'}`}>
                                <input type="checkbox" checked={!!history.review_of_systems?.[field.toLowerCase()]} onChange={() => handleFieldChange('review_of_systems', { ...history.review_of_systems, [field.toLowerCase()]: !history.review_of_systems?.[field.toLowerCase()] })} disabled={isSignedOff} className="h-4 w-4 rounded text-brand-blue focus:ring-brand-blue" />
                                <span className="text-xs font-medium">{field}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});


const SystemicExamSection: React.FC<{ patient: Patient; isSignedOff: boolean }> = React.memo(({ patient, isSignedOff }) => {
    const { updateClinicalFileSection, summarizeSection } = usePatient();
    const systems: { key: keyof SystemicExamSectionData; label: string }[] = [
        { key: 'cvs', label: 'Cardiovascular (CVS)' }, { key: 'rs', label: 'Respiratory (RS)' },
        { key: 'abdomen', label: 'Abdomen' }, { key: 'cns', label: 'Central Nervous System (CNS)' },
        { key: 'msk', label: 'Musculoskeletal (MSK)' }, { key: 'skin', label: 'Skin & Integument' },
    ];

    const SystemPanel: React.FC<{ systemKey: keyof SystemicExamSectionData; systemLabel: string; }> = React.memo(({ systemKey, systemLabel }) => {
        const systemData = patient.clinicalFile.sections.systemic?.[systemKey] || {};
        const handleFieldChange = (field: keyof SystemicExamSystemData, value: string) => {
            updateClinicalFileSection(patient.id, 'systemic', { [systemKey]: { ...systemData, [field]: value } });
        };
        // Exclude 'autofill' from fields to prevent passing boolean to TextareaAutosize value prop
        const fields: (Exclude<keyof SystemicExamSystemData, 'autofill'>)[] = ['inspection', 'palpation', 'percussion', 'auscultation', 'summary'];
        return (
            <Accordion title={systemLabel}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map(field => (
                        <div key={field} className={field === 'summary' ? 'md:col-span-2' : ''}>
                            <div className="flex justify-between">
                                <label className="text-[11px] font-bold text-text-tertiary uppercase mb-1">{field}</label>
                                {!isSignedOff && <VoiceInput onTranscript={(t) => handleFieldChange(field, (systemData[field] || '') + ' ' + t)} className="w-4 h-4" />}
                            </div>
                            <TextareaAutosize
                                minRows={field === 'summary' ? 2 : 1}
                                value={systemData[field] || ''}
                                onChange={e => handleFieldChange(field, e.target.value)}
                                disabled={isSignedOff}
                                className="w-full p-2.5 border border-border-color rounded-lg bg-background-primary text-sm focus:ring-1 focus:ring-brand-blue outline-none transition-shadow"
                            />
                        </div>
                    ))}
                </div>
            </Accordion>
        );
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-end"><AIActionButton onClick={() => summarizeSection(patient.id, 'systemic')} text="Summarize All" /></div>
            {systems.map(({ key, label }) => <SystemPanel key={key} systemKey={key} systemLabel={label} />)}
        </div>
    );
});

const SummarySignoffSection: React.FC<{ patient: Patient; user: User }> = React.memo(({ patient, user }) => {
    const { signOffClinicalFile, summarizePatientClinicalFile, crossCheckFile, isLoading } = usePatient();
    useEffect(() => { if (!patient.clinicalFile.aiSummary) summarizePatientClinicalFile(patient.id); }, [patient.id, patient.clinicalFile.aiSummary, summarizePatientClinicalFile]);

    const handleSignOff = async () => {
        await crossCheckFile(patient.id);
    };
    useEffect(() => {
        const inconsistencies = patient.clinicalFile.crossCheckInconsistencies;
        if (Array.isArray(inconsistencies) && (inconsistencies as string[]).length > 0) {
            if (window.confirm(`AI Cross-Check Issues:\n- ${(inconsistencies as string[]).join('\n- ')}\nProceed?`)) signOffClinicalFile(patient.id);
        } else if (Array.isArray(inconsistencies)) {
            signOffClinicalFile(patient.id);
        }
    }, [patient.clinicalFile.crossCheckInconsistencies, signOffClinicalFile]);

    const safeFormatDate = (dateString?: string) => {
        if (!dateString) return 'Date Unknown';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    if (patient.clinicalFile.status === 'signed') {
        return (
            <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 px-6 py-8 rounded-xl mt-6 justify-center shadow-sm">
                <CheckBadgeIcon className="w-6 h-6" /> <span className="font-semibold text-lg">Signed Off by {patient.clinicalFile.signedBy === user.id ? 'you' : 'Doctor'} on {safeFormatDate(patient.clinicalFile.signedAt)}</span>
            </div>
        );
    }
    return (
        <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-border-color shadow-medium">
            <h4 className="font-bold text-lg text-text-primary mb-3 flex items-center gap-2">Assessment & Plan Summary <span className="text-xs font-normal text-text-tertiary bg-background-primary px-2 py-0.5 rounded border">AI Generated</span></h4>
            <div className="p-5 bg-background-primary rounded-xl border border-border-color shadow-inner mb-6 text-text-secondary leading-relaxed">
                {patient.clinicalFile.aiSummary || <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"></div> Generating summary...</span>}
            </div>
            <div className="flex justify-end">
                <button onClick={handleSignOff} disabled={isLoading || user.role !== 'Doctor'} className="px-8 py-3 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:bg-gray-400 shadow-lg shadow-green-600/20 hover:shadow-green-600/30 transition-all transform hover:-translate-y-0.5">
                    {isLoading ? 'Verifying...' : 'Sign Off Case'}
                </button>
            </div>
        </div>
    );
});

const GPESection: React.FC<{ patient: Patient; isSignedOff: boolean }> = React.memo(({ patient, isSignedOff }) => {
    const { updateClinicalFileSection, summarizeSection } = usePatient();
    const gpe = patient.clinicalFile.sections.gpe || {};
    const handleFieldChange = (field: keyof GPESectionData, value: any) => updateClinicalFileSection(patient.id, 'gpe', { [field]: value });
    const handleFlagsChange = (flag: keyof GPESectionData['flags']) => updateClinicalFileSection(patient.id, 'gpe', { flags: { ...gpe.flags, [flag]: !gpe.flags?.[flag] } });

    useEffect(() => {
        if (gpe.height_cm && gpe.weight_kg) {
            const bmi = gpe.weight_kg / ((gpe.height_cm / 100) ** 2);
            if (gpe.bmi?.toFixed(1) !== bmi.toFixed(1)) handleFieldChange('bmi', parseFloat(bmi.toFixed(1)));
        }
    }, [gpe.height_cm, gpe.weight_kg]);

    return (
        <div className="space-y-4">
            <div className="flex justify-end"><AIActionButton onClick={() => summarizeSection(patient.id, 'gpe')} text="Auto-Describe" /></div>
            {gpe.aiGeneratedSummary && <div className="p-3 bg-blue-50/50 text-blue-900 text-sm rounded-lg border border-blue-100">{gpe.aiGeneratedSummary}</div>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                    <label className="text-[11px] font-bold text-text-tertiary uppercase">Appearance</label>
                    <select value={gpe.general_appearance || ''} onChange={e => handleFieldChange('general_appearance', e.target.value)} disabled={isSignedOff} className="w-full mt-1 p-2.5 border border-border-color rounded-lg bg-background-primary text-sm focus:ring-1 focus:ring-brand-blue outline-none cursor-pointer">
                        <option value="">Select...</option><option value="well">Well</option><option value="ill">Ill-looking</option><option value="toxic">Toxic</option><option value="cachectic">Cachectic</option>
                    </select>
                </div>
                <div><label className="text-[11px] font-bold text-text-tertiary uppercase">Height (cm)</label><input type="number" value={gpe.height_cm || ''} onChange={e => handleFieldChange('height_cm', parseFloat(e.target.value))} disabled={isSignedOff} className="w-full mt-1 p-2.5 border border-border-color rounded-lg bg-background-primary text-sm focus:ring-1 focus:ring-brand-blue outline-none" /></div>
                <div><label className="text-[11px] font-bold text-text-tertiary uppercase">Weight (kg)</label><input type="number" value={gpe.weight_kg || ''} onChange={e => handleFieldChange('weight_kg', parseFloat(e.target.value))} disabled={isSignedOff} className="w-full mt-1 p-2.5 border border-border-color rounded-lg bg-background-primary text-sm focus:ring-1 focus:ring-brand-blue outline-none" /></div>
            </div>
            <div className="flex flex-wrap gap-4 p-5 bg-background-secondary/30 rounded-xl border border-border-color">
                {[{ key: 'pallor', label: 'Pallor' }, { key: 'icterus', label: 'Icterus' }, { key: 'cyanosis', label: 'Cyanosis' }, { key: 'clubbing', label: 'Clubbing' }, { key: 'lymphadenopathy', label: 'LAD' }, { key: 'edema', label: 'Edema' }].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2 cursor-pointer group">
                        <input type="checkbox" checked={!!gpe.flags?.[key as any]} onChange={() => handleFlagsChange(key as any)} disabled={isSignedOff} className="h-4 w-4 rounded text-brand-blue" />
                        <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary">{label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
});


const ClinicalFileTab: React.FC<{ patient: Patient; user: User }> = React.memo(({ patient, user }) => {
    const isSignedOff = patient.clinicalFile.status === 'signed';
    return (
        <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
            <Accordion title="History" isOpenDefault={true} status="yellow"><HistorySection patient={patient} isSignedOff={isSignedOff} /></Accordion>
            <Accordion title="General Physical Examination"><GPESection patient={patient} isSignedOff={isSignedOff} /></Accordion>
            <Accordion title="Systemic Examination"><SystemicExamSection patient={patient} isSignedOff={isSignedOff} /></Accordion>
            <SummarySignoffSection patient={patient} user={user} />
        </div>
    );
});

// --- ORDERS CATALOG (EXPANDED) ---

const CATALOG_ITEMS: Record<OrderCategory, string[]> = {
    investigation: [
        'Complete Blood Count (CBC)', 'Basic Metabolic Panel (BMP)', 'Comprehensive Metabolic Panel (CMP)',
        'Liver Function Tests (LFT)', 'Lipid Panel', 'Thyroid Stimulating Hormone (TSH)',
        'Hemoglobin A1c', 'Urinalysis', 'Urine Culture', 'Coagulation Profile (PT/INR/PTT)',
        'Troponin I', 'D-Dimer', 'Blood Culture x2', 'Serum Lactate', 'Procalcitonin',
        'Arterial Blood Gas (ABG)', 'Serum Electrolytes', 'Iron Studies', 'Vitamin B12 / Folate',
        'C-Reactive Protein (CRP)', 'ESR', 'Dengue Serology (NS1, IgM, IgG)', 'Peripheral Smear for MP',
        'Widal Test', 'Rapid Malaria Antigen', 'Stool Routine & Microscopy', 'Renal Function Test (Urea/Creat)'
    ],
    radiology: [
        'CXR - PA View', 'CXR - AP View', 'CXR - Lateral', 'CT Head Non-Contrast', 'CT Head w/ Contrast',
        'CT Abdomen/Pelvis w/ Contrast', 'CT Chest Pulmonary Angiogram', 'MRI Brain', 'MRI Spine',
        'Ultrasound Abdomen', 'Ultrasound KUB', 'Ultrasound Doppler Lower Limb', 'X-Ray Left Arm',
        'X-Ray Right Arm', 'X-Ray Left Leg', 'X-Ray Right Leg', 'Echocardiogram'
    ],
    medication: [
        'Paracetamol 500mg PO', 'Paracetamol 1g IV', 'Ibuprofen 400mg PO', 'Morphine 2mg IV',
        'Fentanyl 50mcg IV', 'Ondansetron 4mg IV', 'Metoclopramide 10mg IV', 'Pantoprazole 40mg IV',
        'Ceftriaxone 1g IV', 'Amoxicillin 500mg PO', 'Piperacillin-Tazobactam 4.5g IV', 'Vancomycin 1g IV',
        'Azithromycin 500mg PO', 'Furosemide 40mg IV', 'Metoprolol 25mg PO', 'Amlodipine 5mg PO',
        'Normal Saline 500ml Bolus', 'Lactated Ringers 1L', 'D5W 1L', 'Insulin Regular', 'Insulin Glargine',
        'Atorvastatin 40mg PO', 'Aspirin 75mg PO', 'Ceftriaxone 2g IV BD', 'Doxycycline 100mg PO'
    ],
    procedure: [
        'Peripheral IV Cannulation', 'Urinary Catheterization', 'Nasogastric Tube Insertion',
        'ECG (12 Lead)', 'Wound Dressing', 'Suturing', 'Blood Transfusion', 'Central Line Insertion',
        'Lumbar Puncture', 'Paracentesis', 'Thoracentesis', 'Splint Application', 'Cast Application'
    ],
    nursing: [
        'Vitals Monitoring q4h', 'Vitals Monitoring q1h', 'Strict I/O Charting', 'Fall Risk Precautions',
        'Bed Rest', 'Ambulate with Assistance', 'Diabetic Diet', 'NPO', 'Clear Liquid Diet', 'Neurological Obs q1h'
    ],
    referral: [
        'Cardiology Consult', 'General Surgery Consult', 'Orthopedics Consult', 'Neurology Consult',
        'Gastroenterology Consult', 'Nephrology Consult', 'Infectious Disease Consult', 'Physiotherapy', 'Dietician'
    ]
};

const ORDER_SETS: { name: string, items: { category: OrderCategory, label: string }[] }[] = [
    {
        name: 'Acute Fever Profile', items: [
            { category: 'investigation', label: 'Complete Blood Count (CBC)' },
            { category: 'investigation', label: 'Urine Culture' },
            { category: 'investigation', label: 'Peripheral Smear for MP' },
            { category: 'investigation', label: 'Dengue Serology (NS1, IgM, IgG)' },
            { category: 'medication', label: 'Paracetamol 500mg PO' }
        ]
    },
    {
        name: 'Chest Pain (ACS)', items: [
            { category: 'procedure', label: 'ECG (12 Lead)' },
            { category: 'investigation', label: 'Troponin I' },
            { category: 'investigation', label: 'Complete Blood Count (CBC)' },
            { category: 'medication', label: 'Aspirin 300mg PO STAT' },
            { category: 'medication', label: 'Atorvastatin 80mg PO STAT' }
        ]
    },
    {
        name: 'Dengue Protocol', items: [
            { category: 'investigation', label: 'Complete Blood Count (CBC)' },
            { category: 'investigation', label: 'Dengue Serology (NS1, IgM, IgG)' },
            { category: 'investigation', label: 'Liver Function Tests (LFT)' },
            { category: 'medication', label: 'Paracetamol 500mg PO' },
            { category: 'medication', label: 'Normal Saline 500ml Bolus' }
        ]
    },
    {
        name: 'Malaria Protocol', items: [
            { category: 'investigation', label: 'Peripheral Smear for MP' },
            { category: 'investigation', label: 'Rapid Malaria Antigen' },
            { category: 'investigation', label: 'Complete Blood Count (CBC)' },
            { category: 'medication', label: 'Paracetamol 500mg PO' }
        ]
    },
    {
        name: 'Typhoid (Enteric)', items: [
            { category: 'investigation', label: 'Blood Culture x2' },
            { category: 'investigation', label: 'Widal Test' },
            { category: 'investigation', label: 'Complete Blood Count (CBC)' },
            { category: 'medication', label: 'Ceftriaxone 2g IV BD' }
        ]
    },
    {
        name: 'Acute Gastroenteritis', items: [
            { category: 'investigation', label: 'Stool Routine & Microscopy' },
            { category: 'investigation', label: 'Serum Electrolytes' },
            { category: 'investigation', label: 'Renal Function Test (Urea/Creat)' },
            { category: 'medication', label: 'Ondansetron 4mg IV' },
            { category: 'medication', label: 'Lactated Ringers 1L' }
        ]
    },
    {
        name: 'Pre-Op General', items: [
            { category: 'investigation', label: 'Complete Blood Count (CBC)' },
            { category: 'investigation', label: 'Coagulation Profile (PT/INR/PTT)' },
            { category: 'investigation', label: 'Serum Electrolytes' },
            { category: 'radiology', label: 'CXR - PA View' },
            { category: 'nursing', label: 'NPO' }
        ]
    }
];

const OrdersTab: React.FC<{ patient: Patient }> = React.memo(({ patient }) => {
    const { updateOrder, addOrderToPatient, sendAllDrafts } = usePatient();
    const [activeCategory, setActiveCategory] = useState<OrderCategory>('investigation');
    const [quickOrderText, setQuickOrderText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const categories: { key: OrderCategory; label: string; icon: any }[] = [
        { key: 'investigation', label: 'Labs', icon: BeakerIcon }, { key: 'radiology', label: 'Imaging', icon: FilmIcon },
        { key: 'medication', label: 'Meds', icon: PillIcon }, { key: 'procedure', label: 'Procedures', icon: ClipboardDocumentListIcon },
    ];
    const filteredOrders = useMemo(() => patient.orders.filter(o => o.category === activeCategory), [patient.orders, activeCategory]);

    // Filter catalog items based on search - case insensitive
    const filteredCatalog = useMemo(() => {
        const items = CATALOG_ITEMS[activeCategory] || [];
        if (!searchTerm) return items;
        return items.filter(i => i.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [activeCategory, searchTerm]);

    const handleCatalogClick = (itemLabel: string) => {
        addOrderToPatient(patient.id, {
            category: activeCategory,
            label: itemLabel,
            priority: 'routine',
            instructions: activeCategory === 'medication' ? 'Review dosage before admin' : ''
        });
        setSearchTerm(''); // Clear search on add for better flow
    };

    const handleOrderSetClick = (items: { category: OrderCategory, label: string }[]) => {
        items.forEach(item => {
            addOrderToPatient(patient.id, {
                category: item.category,
                label: item.label,
                priority: 'routine',
            });
        });
    };

    return (
        <div className="flex flex-col lg:flex-row h-full min-h-[600px] bg-background-primary">
            {/* Catalog Sidebar */}
            <div className="w-full lg:w-80 border-r border-border-color bg-background-secondary/40 flex flex-col">
                <div className="p-4 border-b border-border-color">
                    <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3">Categories</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                        {categories.map(cat => (
                            <button key={cat.key} onClick={() => setActiveCategory(cat.key)} className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat.key ? 'bg-background-primary shadow-sm text-brand-blue ring-1 ring-border-color' : 'text-text-secondary hover:bg-background-tertiary'}`}>
                                <cat.icon className="w-4 h-4 mr-3" /> {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-b border-border-color bg-background-tertiary/50">
                    <h4 className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-2 flex items-center gap-1"><SparklesIcon className="w-3 h-3" /> Quick Sets</h4>
                    <div className="flex flex-wrap gap-2">
                        {ORDER_SETS.map((set, i) => (
                            <button key={i} onClick={() => handleOrderSetClick(set.items)} className="px-3 py-1.5 text-xs font-medium text-text-secondary bg-background-primary border border-border-color rounded-full hover:border-brand-blue hover:text-brand-blue transition-all shadow-sm">
                                {set.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                    <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3">Catalog ({activeCategory})</h4>
                    <div className="relative mb-3">
                        <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-text-tertiary" />
                        <input
                            type="text"
                            placeholder={`Search ${activeCategory}...`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-border-color rounded-lg bg-background-primary text-input-text focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue placeholder-text-tertiary"
                        />
                    </div>

                    <div className="space-y-1 overflow-y-auto flex-1 max-h-[400px]">
                        {filteredCatalog.map((item) => (
                            <button
                                key={item}
                                onClick={() => handleCatalogClick(item)}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-text-secondary bg-transparent hover:bg-background-tertiary rounded-lg transition-colors flex items-center group"
                            >
                                <PlusIcon className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 text-brand-blue transition-opacity" />
                                {item}
                            </button>
                        ))}
                        {filteredCatalog.length === 0 && (
                            <div className="py-6 text-center border-2 border-dashed border-border-color rounded-xl mt-2">
                                <p className="text-xs text-text-tertiary mb-2">Item not found.</p>
                                <button
                                    onClick={() => { handleCatalogClick(searchTerm); }}
                                    className="text-xs bg-brand-blue text-white px-3 py-1.5 rounded-md hover:bg-brand-blue-dark shadow-sm"
                                >
                                    Add Custom: "{searchTerm}"
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Order Area */}
            <div className="flex-1 p-6 flex flex-col bg-background-primary">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-text-primary">Active Orders</h3>
                    <button onClick={() => sendAllDrafts(patient.id, activeCategory)} className="px-5 py-2 bg-brand-blue text-white rounded-xl font-bold text-sm hover:bg-brand-blue-dark shadow-lg shadow-brand-blue/20 transition-transform hover:-translate-y-0.5 flex items-center gap-2">
                        <PaperAirplaneIcon className="w-4 h-4" /> Sign & Send Drafts
                    </button>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                    {filteredOrders.length > 0 ? filteredOrders.map(order => (
                        <div key={order.orderId} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all shadow-sm ${order.status === 'draft' ? 'bg-background-secondary/50 border-dashed border-brand-blue/40' : 'bg-background-primary border-border-color'}`}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`font-semibold text-sm ${order.status === 'draft' ? 'text-brand-blue-dark' : 'text-text-primary'}`}>{order.label}</h4>
                                    {order.status === 'draft' && <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Draft</span>}
                                </div>
                                {order.category === 'medication' && (
                                    <input
                                        type="text"
                                        placeholder="Add Dosage / Instructions..."
                                        value={order.instructions || ''}
                                        onChange={(e) => updateOrder(patient.id, order.orderId, { instructions: e.target.value })}
                                        className="w-full text-xs border-b border-transparent hover:border-border-color focus:border-brand-blue bg-transparent outline-none py-1 text-text-secondary placeholder-text-tertiary transition-colors"
                                        disabled={order.status !== 'draft'}
                                    />
                                )}
                                <div className="flex gap-2 mt-1.5 text-[10px] text-text-tertiary uppercase font-bold tracking-wide">
                                    <span className={order.priority === 'STAT' ? 'text-red-600' : ''}>{order.priority}</span>
                                    <span>&bull;</span>
                                    <span>{order.status.replace('_', ' ')}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 self-end sm:self-center mt-3 sm:mt-0">
                                {order.status === 'draft' && <select value={order.priority} onChange={e => updateOrder(patient.id, order.orderId, { priority: e.target.value as OrderPriority })} className="text-xs border border-border-color p-1.5 rounded-lg bg-background-primary text-text-secondary outline-none"><option value="routine">Routine</option><option value="urgent">Urgent</option><option value="STAT">STAT</option></select>}
                                <button onClick={() => updateOrder(patient.id, order.orderId, { status: order.status === 'draft' ? 'sent' : order.status === 'sent' ? 'in_progress' : 'completed' })} className={`px-4 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wide border transition-all ${order.status === 'draft' ? 'bg-brand-blue text-white border-brand-blue hover:bg-brand-blue-dark' : 'bg-background-tertiary text-text-secondary border-transparent hover:bg-border-color'}`}>{order.status === 'draft' ? 'Send' : order.status === 'sent' ? 'Begin' : 'Complete'}</button>
                            </div>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center h-64 text-text-tertiary rounded-2xl border-2 border-dashed border-border-color bg-background-secondary/20">
                            <ClipboardDocumentListIcon className="w-10 h-10 mb-3 opacity-20" />
                            <p className="text-sm font-medium">No active {activeCategory} orders.</p>
                            <p className="text-xs opacity-70">Select items from the catalog to begin.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

const MedViewTab: React.FC<{ patient: Patient }> = React.memo(({ patient }) => {
    const { generateHandoverSummary, isLoading } = usePatient();

    // Auto-generate if empty
    useEffect(() => {
        if (!patient.handoverSummary && !isLoading) {
            generateHandoverSummary(patient.id);
        }
    }, [patient.handoverSummary, isLoading, generateHandoverSummary, patient.id]);

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="bg-background-primary p-6 rounded-xl border border-border-color shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-text-primary">AI Handover Summary</h3>
                    <button onClick={() => generateHandoverSummary(patient.id)} className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1"><SparklesIcon className="w-3 h-3" /> Regenerate</button>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-text-secondary">
                    {patient.handoverSummary ? <p className="whitespace-pre-wrap">{patient.handoverSummary}</p> : <div className="flex items-center gap-2 text-text-tertiary"><div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"></div> Generating handover...</div>}
                </div>
            </div>

            <div className="bg-background-primary p-6 rounded-xl border border-border-color shadow-sm">
                <h3 className="font-bold text-lg text-text-primary mb-4">Vitals Trends</h3>
                <div className="w-full">
                    <VitalsChart data={patient.vitalsHistory} />
                </div>
            </div>
        </div>
    );
});

const VitalsTab: React.FC<{ patient: Patient }> = React.memo(({ patient }) => {
    const navigate = useNavigate();
    return (
        <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-text-primary">Vitals Overview</h3>
                <button
                    onClick={() => navigate(`/patient/${patient.id}/vitals`)}
                    className="px-4 py-2 bg-brand-blue text-white text-sm font-bold rounded-xl hover:bg-brand-blue-dark transition-colors shadow-sm"
                >
                    Open Full Vitals Dashboard
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    {patient.vitals && <VitalsSnapshotCard vitals={patient.vitals} />}
                </div>
                <div className="lg:col-span-2">
                    <VitalsChart data={patient.vitalsHistory} />
                </div>
            </div>
        </div>
    );
});


const PatientDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { patients, updatePatientStatus, isLoading } = usePatient();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'clinical' | 'orders' | 'vitals' | 'medview'>('clinical');

    const patient = patients.find(p => p.id === id);

    if (!patient) {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-screen space-y-4">
                    <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-text-tertiary animate-pulse font-medium">Loading patient data...</p>
                </div>
            );
        }
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4">
                <p className="text-text-tertiary font-medium">Patient not found.</p>
                <button onClick={() => navigate('/')} className="text-brand-blue hover:underline">Return to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-secondary pb-20">
            <PatientWorkspaceHeader patient={patient} onStatusChange={(s) => updatePatientStatus(patient.id, s)} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                {/* Tabs */}
                <div className="flex space-x-1 bg-background-tertiary/50 p-1 rounded-xl mb-6 w-fit mx-auto border border-border-color">
                    <button onClick={() => setActiveTab('clinical')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'clinical' ? 'bg-white dark:bg-gray-800 text-brand-blue shadow-sm ring-1 ring-black/5' : 'text-text-secondary hover:text-text-primary'}`}>Clinical File</button>
                    <button onClick={() => setActiveTab('orders')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-white dark:bg-gray-800 text-brand-blue shadow-sm ring-1 ring-black/5' : 'text-text-secondary hover:text-text-primary'}`}>Orders</button>
                    <button onClick={() => setActiveTab('vitals')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'vitals' ? 'bg-white dark:bg-gray-800 text-brand-blue shadow-sm ring-1 ring-black/5' : 'text-text-secondary hover:text-text-primary'}`}>Vitals</button>
                    <button onClick={() => setActiveTab('medview')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'medview' ? 'bg-white dark:bg-gray-800 text-brand-blue shadow-sm ring-1 ring-black/5' : 'text-text-secondary hover:text-text-primary'}`}>MedView</button>
                </div>

                <div className="animate-fade-in">
                    {activeTab === 'clinical' && currentUser && <ClinicalFileRedesigned patient={patient} />}
                    {activeTab === 'orders' && <OrdersTab patient={patient} />}
                    {activeTab === 'vitals' && <VitalsTab patient={patient} />}
                    {activeTab === 'medview' && <MedViewRedesigned patient={patient} />}
                </div>
            </div>
        </div>
    );
};

export default PatientDetailPage;
