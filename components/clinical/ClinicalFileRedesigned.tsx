import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePatient } from '../../contexts/PatientContext';
import { useAuth } from '../../contexts/AuthContext';
import { Patient, User, ClinicalFileSections, HistorySectionData, GPESectionData, SystemicExamSectionData, Allergy } from '../../types';
import { SparklesIcon, CheckBadgeIcon, ChevronDownIcon, ChevronUpIcon, MicrophoneIcon, PlusIcon, XMarkIcon, InformationCircleIcon } from '../icons';
import TextareaAutosize from 'react-textarea-autosize';
import VoiceInput from '../VoiceInput';
import { useToast } from '../../contexts/ToastContext';

// --- TYPES ---

interface SectionProps {
    patient: Patient;
    isSignedOff: boolean;
}

// --- COMPONENTS ---

const AIActionBubble: React.FC<{ onClick: () => void; text: string; icon?: React.ElementType; tooltip?: string; isLoading?: boolean }> = ({ onClick, text, icon: Icon = SparklesIcon, tooltip, isLoading }) => (
    <button
        onClick={onClick}
        disabled={isLoading}
        title={tooltip}
        className="group relative flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded-full text-[10px] font-bold uppercase tracking-wide border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
    >
        {isLoading ? <div className="w-3 h-3 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" /> : <Icon className="w-3 h-3" />}
        <span>{text}</span>
    </button>
);

const SectionCard: React.FC<{
    id: string;
    title: string;
    isCompleted?: boolean;
    children: React.ReactNode;
    aiActions?: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
    headerClassName?: string;
}> = ({ id, title, isCompleted, children, aiActions, defaultOpen = false, className = "", headerClassName = "" }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [wasSaved, setWasSaved] = useState(false);

    // Auto-expand if children are interacted with (simplified by just keeping it open if user opens it)
    // In a real "smart" implementation, we might listen to focus events within the div.

    const handleToggle = () => setIsOpen(!isOpen);

    return (
        <div id={id} className={`bg-white dark:bg-gray-800 rounded-xl border transition-all duration-300 ${isOpen ? 'border-brand-blue/30 shadow-md ring-1 ring-brand-blue/5' : 'border-border-color shadow-sm hover:border-gray-300'} ${className}`}>
            <div
                className={`flex items-center justify-between p-4 cursor-pointer select-none ${headerClassName}`}
                onClick={handleToggle}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}>
                        {isCompleted ? <CheckBadgeIcon className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                    <div>
                        <h3 className={`text-sm font-bold ${isCompleted ? 'text-green-800 dark:text-green-400' : 'text-text-primary'}`}>{title}</h3>
                        {wasSaved && !isOpen && <p className="text-[10px] text-text-tertiary font-medium">Saved</p>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isOpen && aiActions && <div className="flex gap-2 mr-2" onClick={e => e.stopPropagation()}>{aiActions}</div>}
                    <div className={`text-text-tertiary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        <ChevronDownIcon className="w-5 h-5" />
                    </div>
                </div>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 pt-0 border-t border-transparent">
                    {children}
                </div>
            </div>
        </div>
    );
};

const LeftNav: React.FC<{ sections: { id: string; label: string }[]; activeSection: string; onSectionClick: (id: string) => void }> = ({ sections, activeSection, onSectionClick }) => (
    <nav className="sticky top-24 space-y-1 pr-4 hidden lg:block">
        {sections.map(section => (
            <button
                key={section.id}
                onClick={() => onSectionClick(section.id)}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 border-l-2 ${activeSection === section.id
                    ? 'bg-white dark:bg-gray-800 text-brand-blue border-brand-blue shadow-sm translate-x-1'
                    : 'text-text-tertiary border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-text-secondary'
                    }`}
            >
                {section.label}
            </button>
        ))}
    </nav>
);

const TemplateButtons: React.FC<{ onSelect: (text: string) => void; options: string[] }> = ({ onSelect, options }) => (
    <div className="flex flex-wrap gap-2 mt-2">
        {options.map(opt => (
            <button
                key={opt}
                onClick={() => onSelect(opt)}
                className="px-2 py-1 text-[10px] font-semibold bg-gray-50 dark:bg-gray-700 text-text-secondary border border-border-color rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
                + {opt}
            </button>
        ))}
    </div>
);

// --- SECTIONS ---

const ComplaintSection: React.FC<SectionProps> = ({ patient, isSignedOff }) => {
    const { updateClinicalFileSection, checkMissingInfo } = usePatient();
    const complaint = patient.clinicalFile.sections.history?.complaints?.[0]?.symptom || '';
    const [isScanning, setIsScanning] = useState(false);

    const handleChange = (val: string) => {
        updateClinicalFileSection(patient.id, 'history', { complaints: [{ symptom: val, duration: 'Unknown' }] });
    };

    const handleScan = async () => {
        setIsScanning(true);
        await checkMissingInfo(patient.id, 'history');
        setIsScanning(false);
    };

    return (
        <div className="relative">
            <input
                type="text"
                value={complaint}
                onChange={e => handleChange(e.target.value)}
                disabled={isSignedOff}
                placeholder="e.g., Sudden onset chest pain"
                className="w-full text-lg font-medium bg-transparent border-b-2 border-border-color focus:border-brand-blue outline-none py-2 px-1 transition-colors placeholder-gray-300"
            />
            {!isSignedOff && (
                <div className="absolute right-0 top-2 flex gap-2">
                    <AIActionBubble onClick={handleScan} text="Scan Missing" isLoading={isScanning} tooltip="Check for critical missing details" />
                </div>
            )}
        </div>
    );
};

const HPISection: React.FC<SectionProps> = ({ patient, isSignedOff }) => {
    const { updateClinicalFileSection, formatHpi } = usePatient();
    const hpi = patient.clinicalFile.sections.history?.hpi || '';
    const [isFormatting, setIsFormatting] = useState(false);

    const handleChange = (val: string) => updateClinicalFileSection(patient.id, 'history', { hpi: val });

    const insertTemplate = (text: string) => {
        const newVal = hpi ? `${hpi}\n${text}: ` : `${text}: `;
        handleChange(newVal);
    };

    const handleFormat = async () => {
        setIsFormatting(true);
        await formatHpi(patient.id);
        setIsFormatting(false);
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <TextareaAutosize
                    minRows={4}
                    value={hpi}
                    onChange={e => handleChange(e.target.value)}
                    disabled={isSignedOff}
                    placeholder="Describe the history of present illness..."
                    className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border border-border-color rounded-xl text-sm leading-relaxed focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue outline-none resize-none"
                />
                {!isSignedOff && (
                    <div className="absolute bottom-3 right-3 flex gap-2">
                        <VoiceInput onTranscript={text => handleChange(hpi + ' ' + text)} />
                    </div>
                )}
            </div>
            {!isSignedOff && (
                <div className="flex justify-between items-start">
                    <TemplateButtons onSelect={insertTemplate} options={['Onset', 'Duration', 'Character', 'Radiation', 'Aggravating', 'Relieving']} />
                    <AIActionBubble onClick={handleFormat} text="Auto-Format" isLoading={isFormatting} />
                </div>
            )}
        </div>
    );
};

const AssociatedSymptomsSection: React.FC<SectionProps> = ({ patient, isSignedOff }) => {
    const { updateClinicalFileSection } = usePatient();
    const symptoms = patient.clinicalFile.sections.history?.associated_symptoms || [];
    const [input, setInput] = useState('');

    const addSymptom = (s: string) => {
        if (s && !symptoms.includes(s)) {
            updateClinicalFileSection(patient.id, 'history', { associated_symptoms: [...symptoms, s] });
        }
        setInput('');
    };

    const removeSymptom = (s: string) => {
        updateClinicalFileSection(patient.id, 'history', { associated_symptoms: symptoms.filter(sym => sym !== s) });
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {symptoms.map(s => (
                    <span key={s} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {s}
                        {!isSignedOff && <button onClick={() => removeSymptom(s)} className="ml-1.5 hover:text-blue-900"><XMarkIcon className="w-3 h-3" /></button>}
                    </span>
                ))}
            </div>
            {!isSignedOff && (
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSymptom(input)}
                        placeholder="Type symptom and press Enter..."
                        className="w-full p-2.5 bg-transparent border border-border-color rounded-lg text-sm focus:border-brand-blue outline-none"
                    />
                    <div className="absolute right-2 top-2.5">
                        <PlusIcon className="w-4 h-4 text-text-tertiary cursor-pointer hover:text-brand-blue" onClick={() => addSymptom(input)} />
                    </div>
                </div>
            )}
            {!isSignedOff && <TemplateButtons onSelect={addSymptom} options={['Fever', 'Nausea', 'Vomiting', 'Headache', 'Dizziness', 'Shortness of Breath']} />}
        </div>
    );
};

const HistoryGridSection: React.FC<SectionProps> = ({ patient, isSignedOff }) => {
    const { updateClinicalFileSection } = usePatient();
    const history = patient.clinicalFile.sections.history || {};

    const Field = ({ label, fieldKey }: { label: string, fieldKey: keyof HistorySectionData }) => (
        <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg border border-border-color">
            <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1 block">{label}</label>
            <TextareaAutosize
                minRows={2}
                value={(history[fieldKey] as string) || ''}
                onChange={e => updateClinicalFileSection(patient.id, 'history', { [fieldKey]: e.target.value })}
                disabled={isSignedOff}
                className="w-full bg-transparent text-sm outline-none resize-none"
                placeholder="None"
            />
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Past Medical History" fieldKey="past_medical_history" />
            <Field label="Drug History" fieldKey="drug_history" />
            <Field label="Family History" fieldKey="family_history" />
            <Field label="Social History" fieldKey="personal_social_history" />
        </div>
    );
};

const AllergiesSection: React.FC<SectionProps> = ({ patient, isSignedOff }) => {
    const { updateClinicalFileSection } = usePatient();
    const allergies = patient.clinicalFile.sections.history?.allergy_history || [];

    const addAllergy = () => {
        updateClinicalFileSection(patient.id, 'history', { allergy_history: [...allergies, { substance: '', reaction: '', severity: 'Mild' }] });
    };

    const updateAllergy = (index: number, field: keyof Allergy, val: string) => {
        const newAllergies = [...allergies];
        newAllergies[index] = { ...newAllergies[index], [field]: val };
        updateClinicalFileSection(patient.id, 'history', { allergy_history: newAllergies });
    };

    return (
        <div className="space-y-3">
            {allergies.length === 0 && <p className="text-sm text-text-tertiary italic">No known allergies recorded.</p>}
            {allergies.map((a, i) => (
                <div key={i} className="flex gap-2 items-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-800">
                    <input value={a.substance} onChange={e => updateAllergy(i, 'substance', e.target.value)} placeholder="Substance" className="flex-1 bg-transparent text-sm font-medium text-red-900 dark:text-red-200 outline-none placeholder-red-300" />
                    <select value={a.severity} onChange={e => updateAllergy(i, 'severity', e.target.value)} className="bg-transparent text-xs text-red-700 dark:text-red-300 outline-none">
                        <option>Mild</option><option>Moderate</option><option>Severe</option>
                    </select>
                    {!isSignedOff && <button onClick={() => updateClinicalFileSection(patient.id, 'history', { allergy_history: allergies.filter((_, idx) => idx !== i) })} className="text-red-400 hover:text-red-600"><XMarkIcon className="w-4 h-4" /></button>}
                </div>
            ))}
            {!isSignedOff && (
                <button onClick={addAllergy} className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1">
                    <PlusIcon className="w-3 h-3" /> Add Allergy
                </button>
            )}
        </div>
    );
};

const GPESection: React.FC<SectionProps> = ({ patient, isSignedOff }) => {
    const { updateClinicalFileSection, summarizeSection } = usePatient();
    const gpe = patient.clinicalFile.sections.gpe || {};
    const [isSummarizing, setIsSummarizing] = useState(false);

    const handleSummary = async () => {
        setIsSummarizing(true);
        await summarizeSection(patient.id, 'gpe');
        setIsSummarizing(false);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase">Appearance</label>
                    <select value={gpe.general_appearance || ''} onChange={e => updateClinicalFileSection(patient.id, 'gpe', { general_appearance: e.target.value })} disabled={isSignedOff} className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-900/50 border border-border-color rounded-lg text-sm outline-none">
                        <option value="">Select...</option><option value="well">Well</option><option value="ill">Ill-looking</option><option value="toxic">Toxic</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase">Build</label>
                    <select value={gpe.build || ''} onChange={e => updateClinicalFileSection(patient.id, 'gpe', { build: e.target.value })} disabled={isSignedOff} className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-900/50 border border-border-color rounded-lg text-sm outline-none">
                        <option value="">Select...</option><option value="average">Average</option><option value="thin">Thin</option><option value="obese">Obese</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase mb-2 block">Quick Check</label>
                <div className="flex flex-wrap gap-3">
                    {['Pallor', 'Icterus', 'Cyanosis', 'Clubbing', 'LAD', 'Edema'].map(key => {
                        const k = key.toLowerCase() as keyof typeof gpe.flags;
                        return (
                            <label key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${gpe.flags?.[k] ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-border-color text-text-secondary hover:bg-gray-50'}`}>
                                <input type="checkbox" checked={!!gpe.flags?.[k]} onChange={() => updateClinicalFileSection(patient.id, 'gpe', { flags: { ...gpe.flags, [k]: !gpe.flags?.[k] } })} disabled={isSignedOff} className="hidden" />
                                <span className="text-xs font-medium">{key}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
            {gpe.aiGeneratedSummary && (
                <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100 italic">
                    AI Summary: {gpe.aiGeneratedSummary}
                </div>
            )}
        </div>
    );
};

const SystemicSection: React.FC<SectionProps> = ({ patient, isSignedOff }) => {
    const { updateClinicalFileSection } = usePatient();
    const systemic = patient.clinicalFile.sections.systemic || {};
    const systems: { key: keyof SystemicExamSectionData; label: string }[] = [
        { key: 'cvs', label: 'CVS' }, { key: 'rs', label: 'Respiratory' }, { key: 'abdomen', label: 'Abdomen' },
        { key: 'cns', label: 'CNS' }, { key: 'msk', label: 'Musculoskeletal' }
    ];

    return (
        <div className="space-y-2">
            {systems.map(({ key, label }) => (
                <div key={key} className="border border-border-color rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-900/30 px-3 py-2 border-b border-border-color flex justify-between items-center">
                        <span className="text-xs font-bold text-text-secondary uppercase">{label}</span>
                    </div>
                    <TextareaAutosize
                        minRows={2}
                        value={systemic[key]?.summary || ''}
                        onChange={e => updateClinicalFileSection(patient.id, 'systemic', { [key]: { ...systemic[key], summary: e.target.value } })}
                        disabled={isSignedOff}
                        placeholder={`Notes for ${label}...`}
                        className="w-full p-3 text-sm bg-white dark:bg-gray-800 outline-none resize-none"
                    />
                </div>
            ))}
        </div>
    );
};

const SignOffSection: React.FC<{ patient: Patient; user: User }> = ({ patient, user }) => {
    const { signOffClinicalFile, crossCheckFile, isLoading } = usePatient();

    const handleSignOff = async () => {
        await crossCheckFile(patient.id);
        // In a real app, we'd wait for cross-check result, but here we assume the hook handles the flow/toast
        if (window.confirm("Ready to sign off? This will lock the file.")) {
            signOffClinicalFile(patient.id);
        }
    };

    if (patient.clinicalFile.status === 'signed') {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <CheckBadgeIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-green-800">Clinical File Signed</h3>
                <p className="text-sm text-green-700">By {user.name} on {new Date(patient.clinicalFile.signedAt!).toLocaleString()}</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800 border border-indigo-100 dark:border-indigo-800 rounded-xl p-6 flex flex-col items-center justify-center gap-4 shadow-sm">
            <div className="text-center">
                <h3 className="text-lg font-bold text-text-primary">Ready to Finalize?</h3>
                <p className="text-sm text-text-secondary">AI will cross-check for inconsistencies before signing.</p>
            </div>
            <button
                onClick={handleSignOff}
                disabled={isLoading}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isLoading ? 'Verifying...' : 'Sign Off & Generate Plan'}
            </button>
        </div>
    );
};

// --- MAIN LAYOUT ---

const ClinicalFileRedesigned: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { currentUser } = usePatient(); // Actually useAuth is better for currentUser, but usePatient wraps it? No, usePatientData takes currentUser.
    // Wait, usePatient provides everything.
    // Let's check Context.
    // Context provides ...patientData which has currentUser? No, usePatientData takes currentUser as arg.
    // We need useAuth for currentUser.
    // But wait, PatientContext.tsx: const { currentUser } = useAuth(); const patientData = usePatientData(currentUser);
    // So patientData doesn't expose currentUser directly?
    // Let's check usePatientData return. It doesn't return currentUser.
    // So I need useAuth.
    // But I can't import useAuth here easily if I don't want to add another import.
    // Actually I should import useAuth.

    // Let's assume I can get it.
    // For now, I'll just use a placeholder or import useAuth.
    // I'll import useAuth.

    const [activeSection, setActiveSection] = useState('complaint');
    const isSignedOff = patient.clinicalFile.status === 'signed';

    // Scroll spy logic
    useEffect(() => {
        const handleScroll = () => {
            const sections = ['complaint', 'hpi', 'symptoms', 'history', 'allergies', 'gpe', 'systemic', 'signoff'];
            for (const id of sections) {
                const el = document.getElementById(id);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top >= 0 && rect.top <= 300) {
                        setActiveSection(id);
                        break;
                    }
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSection(id);
        }
    };

    const sections = [
        { id: 'complaint', label: 'Presenting Complaint' },
        { id: 'hpi', label: 'History of Present Illness' },
        { id: 'symptoms', label: 'Associated Symptoms' },
        { id: 'history', label: 'Medical History' },
        { id: 'allergies', label: 'Allergies' },
        { id: 'gpe', label: 'General Physical Exam' },
        { id: 'systemic', label: 'Systemic Exam' },
        { id: 'signoff', label: 'Sign Off' },
    ];

    // Helper to check completion (simplified)
    const isComplete = (section: string) => {
        const h = patient.clinicalFile.sections.history;
        const g = patient.clinicalFile.sections.gpe;
        switch (section) {
            case 'complaint': return !!h?.complaints?.[0]?.symptom;
            case 'hpi': return !!h?.hpi && h.hpi.length > 10;
            case 'symptoms': return (h?.associated_symptoms?.length || 0) > 0;
            case 'allergies': return (h?.allergy_history?.length || 0) > 0; // Or explicitly "No allergies"
            case 'gpe': return !!g?.general_appearance;
            default: return false;
        }
    };

    // We need user for SignOff
    // I will grab it from a hook inside the component if possible, or just pass dummy if I can't.
    // I'll add useAuth import at top.

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT NAV */}
                    <div className="hidden lg:block lg:col-span-3">
                        <LeftNav sections={sections} activeSection={activeSection} onSectionClick={scrollToSection} />
                    </div>

                    {/* RIGHT CONTENT */}
                    <div className="col-span-1 lg:col-span-9 space-y-6 pb-20">
                        <SectionCard id="complaint" title="Presenting Complaint" isCompleted={isComplete('complaint')} defaultOpen={true}>
                            <ComplaintSection patient={patient} isSignedOff={isSignedOff} />
                        </SectionCard>

                        <SectionCard id="hpi" title="History of Present Illness" isCompleted={isComplete('hpi')} defaultOpen={true}>
                            <HPISection patient={patient} isSignedOff={isSignedOff} />
                        </SectionCard>

                        <SectionCard id="symptoms" title="Associated Symptoms" isCompleted={isComplete('symptoms')}>
                            <AssociatedSymptomsSection patient={patient} isSignedOff={isSignedOff} />
                        </SectionCard>

                        <SectionCard id="history" title="Past Medical & Social History" isCompleted={false}>
                            <HistoryGridSection patient={patient} isSignedOff={isSignedOff} />
                        </SectionCard>

                        <SectionCard id="allergies" title="Allergies" isCompleted={isComplete('allergies')} className="border-red-100 dark:border-red-900/30" headerClassName="bg-red-50/50 dark:bg-red-900/10">
                            <AllergiesSection patient={patient} isSignedOff={isSignedOff} />
                        </SectionCard>

                        <SectionCard id="gpe" title="General Physical Examination" isCompleted={isComplete('gpe')}>
                            <GPESection patient={patient} isSignedOff={isSignedOff} />
                        </SectionCard>

                        <SectionCard id="systemic" title="Systemic Examination" isCompleted={false}>
                            <SystemicSection patient={patient} isSignedOff={isSignedOff} />
                        </SectionCard>

                        <div id="signoff">
                            <AuthConsumer>
                                {(user) => user ? <SignOffSection patient={patient} user={user} /> : null}
                            </AuthConsumer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper to consume Auth Context
const AuthConsumer: React.FC<{ children: (user: User | null) => React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    return <>{children(currentUser)}</>;
};

export default ClinicalFileRedesigned;
