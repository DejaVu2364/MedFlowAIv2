
export type Role = 'Intern' | 'Doctor' | 'Admin';
export type TriageLevel = 'Red' | 'Yellow' | 'Green' | 'None';
export type PatientStatus = 'Waiting for Triage' | 'Waiting for Doctor' | 'In Treatment' | 'Discharged';
export type Department = 'Cardiology' | 'Orthopedics' | 'General Medicine' | 'Obstetrics' | 'Neurology' | 'Emergency' | 'Pulmonology' | 'Nephrology' | 'Pediatrics' | 'Surgery' | 'Gastroenterology' | 'Unknown';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
}

export type AuditEventAction = 'accept' | 'modify' | 'reject' | 'view' | 'create' | 'signoff' | 'cancel' | 'finalize';
export type AuditEventEntity = 'patient_record' | 'history_section' | 'order' | 'soap_note' | 'team_note' | 'checklist' | 'clinical_file' | 'round' | 'discharge_summary' | 'vitals' | 'housekeeping_task';

export interface AuditEvent {
    id: string;
    userId: string;
    patientId: string;
    action: AuditEventAction;
    entity: AuditEventEntity;
    entityId?: string;
    payload?: any;
    timestamp: string;
}

export interface Vitals {
    hr: number;
    bpSys: number;
    bpDia: number;
    rr: number;
    spo2: number;
    temp: number;
}

export interface VitalsMeasurements {
    temp_c?: number | null;
    pulse?: number | null;
    rr?: number | null;
    bp_sys?: number | null;
    bp_dia?: number | null;
    spo2?: number | null;
    glucose_mg_dl?: number | null;
    pain_score?: number | null;
    urine_output_ml?: number | null;
}

export interface VitalsRecord {
    vitalId: string;
    patientId: string;
    recordedBy: string;
    recordedAt: string;
    source: 'nurse' | 'monitor' | 'manual' | 'device';
    measurements: VitalsMeasurements;
    observations?: string | null;
    tags?: ('pre-op' | 'post-op')[];
    linkedOrders?: string[];
    meta?: { deviceId: string | null; imported: boolean };
}

export interface Triage {
    level: TriageLevel;
    reasons: string[];
}

export interface AITriageSuggestion {
    department: Department;
    suggested_triage: TriageLevel;
    confidence: number;
}

export interface SOAPNote {
    type: 'SOAP';
    id: string;
    patientId: string;
    author: string;
    authorId: string;
    role: Role;
    timestamp: string;
    transcript?: string;
    s: string;
    o: string;
    a: string;
    p: string;
    aiMeta?: Record<string, any>;
}

export interface TeamNote {
    type: 'TeamNote';
    id: string;
    patientId: string;
    author: string;
    authorId: string;
    role: Role;
    content: string;
    isEscalation?: boolean;
    timestamp: string;
}

export interface Checklist {
    type: 'Checklist';
    id: string;
    patientId: string;
    author: string;
    authorId: string;
    role: Role;
    title: string;
    items: { text: string; checked: boolean }[];
    timestamp: string;
}

export type TimelineEvent = SOAPNote | TeamNote | Checklist;

export type OrderCategory = 'investigation' | 'radiology' | 'medication' | 'procedure' | 'nursing' | 'referral';
export type OrderPriority = 'routine' | 'urgent' | 'STAT';
export type OrderStatus = 'draft' | 'sent' | 'scheduled' | 'in_progress' | 'completed' | 'resulted' | 'cancelled';

export interface Order {
    orderId: string;
    patientId: string;
    createdBy: string;
    createdAt: string;
    linkedSnapshotId?: string | null;
    category: OrderCategory;
    subType: string;
    code?: string | null;
    label: string;
    instructions?: string; // New field for dosage/notes
    payload: {
        sampleType?: string;
        collectionInstructions?: string;
        modality?: string;
        region?: string;
        contrast?: boolean;
        dose?: string;
        route?: string;
        frequency?: string;
        duration?: string;
        prn?: boolean;
        details?: string;
        consentRequired?: boolean;
        task?: string;
        specialty?: string;
        reason?: string;
    };
    priority: OrderPriority;
    status: OrderStatus;
    scheduledFor?: string | null;
    resultRef?: {
        resultId: string | null;
        summary: string | null;
        reportUrl: string | null;
    };
    ai_provenance?: {
        prompt_id: string | null;
        rationale: string | null;
    };
    history?: {
        timestamp: string;
        userId: string;
        action: string;
        details?: any;
    }[];
    meta?: {
        lastModified: string;
        modifiedBy: string;
    };
}

export interface Result {
    resultId?: string;
    id?: string; // Legacy alias for resultId
    patientId: string;
    orderId?: string;
    type?: 'lab' | 'imaging';
    name: string;
    timestamp: string;
    status?: 'final' | 'preliminary';
    isAbnormal: boolean;
    value: string;
    unit?: string;
    normalRange?: string;
    referenceRange?: string;
    delta?: {
        previousValue: string;
        change: 'increase' | 'decrease' | 'stable';
    };
    reportUrl?: string;
}

export interface Round {
    roundId: string;
    patientId: string;
    doctorId: string;
    createdAt: string;
    status: 'draft' | 'signed';
    subjective: string;
    objective: string;
    assessment: string;
    plan: {
        text: string;
        linkedOrders: string[];
    };
    linkedResults: string[];
    ai_provenance?: {
        prompt_id: string | null;
        action: 'generate_soap' | 'summarize_changes' | null;
    };
    signedBy: string | null;
    signedAt: string | null;
}

export interface PatientOverview {
    summary: string;
    vitalsSnapshot: string;
    activeOrders: string;
    recentResults: string;
}

export interface FollowUpQuestion {
    id: string;
    text: string;
    answer_type: 'text' | 'options';
    quick_options?: string[];
    rationale?: string;
}

export interface ComposedHistory {
    paragraph: string;
}

export interface Allergy {
    substance: string;
    reaction: string;
    severity: 'Mild' | 'Moderate' | 'Severe' | '';
}

export interface HistorySectionData {
    complaints: Complaint[]; // REPLACED chief_complaint & duration with this array
    hpi: string;
    associated_symptoms: string[];
    past_medical_history: string;
    past_surgical_history: string;
    drug_history: string;
    allergy_history: Allergy[];
    family_history: string;
    personal_social_history: string;
    menstrual_obstetric_history: string;
    socioeconomic_lifestyle: string;
    review_of_systems: { [key: string]: boolean | string };
}

export interface GPESectionData {
    general_appearance: 'well' | 'fair' | 'ill' | 'toxic' | 'cachectic' | '';
    vitals: Partial<VitalsMeasurements>;
    build: 'normal' | 'obese' | 'cachectic' | '';
    hydration: 'normal' | 'mild' | 'moderate' | 'severe' | '';
    flags: {
        pallor: boolean;
        icterus: boolean;
        cyanosis: boolean;
        clubbing: boolean;
        lymphadenopathy: boolean;
        edema: boolean;
    };
    height_cm: number;
    weight_kg: number;
    bmi: number;
    remarks: string;
    aiGeneratedSummary?: string;
}

export interface SystemicExamSystemData {
    autofill?: boolean;
    inspection: string;
    palpation: string;
    percussion: string;
    auscultation: string;
    summary: string;
}

export interface SystemicExamSectionData {
    cvs?: Partial<SystemicExamSystemData>;
    rs?: Partial<SystemicExamSystemData>;
    cns?: Partial<SystemicExamSystemData>;
    abdomen?: Partial<SystemicExamSystemData>;
    msk?: Partial<SystemicExamSystemData>;
    skin?: Partial<SystemicExamSystemData>;
    other?: Partial<SystemicExamSystemData>;
}

export interface ClinicalFileSections {
    history: Partial<HistorySectionData>;
    gpe: Partial<GPESectionData>;
    systemic: Partial<SystemicExamSectionData>;
}

export interface AISuggestionHistory {
    complaints?: Complaint[];
    structured_hpi?: string;
    past_medical_history?: string;
    allergy_history?: Allergy[];
    family_history?: string;
    followUpQuestions?: {
        [fieldKey: string]: FollowUpQuestion[];
    };
    followUpAnswers?: {
        [fieldKey: string]: Record<string, string>;
    };
}

export interface ClinicalFile {
    id: string;
    patientId: string;
    status: 'draft' | 'signed';
    signedAt?: string;
    signedBy?: string;
    aiSummary?: string;
    missingInfo?: string[];
    crossCheckInconsistencies?: string[];
    aiSuggestions?: {
        history?: Partial<AISuggestionHistory>;
    };
    sections: ClinicalFileSections;
}

export interface DischargeMedication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}

export interface DischargeSummary {
    id: string;
    patientId: string;
    doctorId: string;
    finalDiagnosis: string;
    briefHistory: string;
    courseInHospital: string;
    treatmentGiven: string;
    investigationsSummary: string;
    conditionAtDischarge: string;
    dischargeMeds: DischargeMedication[];
    dietAdvice: string;
    activityAdvice: string;
    followUpInstructions: string;
    emergencyWarnings: string;
    status: 'draft' | 'finalized';
    generatedAt?: string;
    finalizedAt?: string;
}

export interface ActiveProblem {
    id: string;
    description: string;
    status: 'urgent' | 'monitor' | 'improving';
    notes?: string;
}

export interface Complaint {
    symptom: string;
    duration: string;
    severity?: string;
    notes?: string;
}

export type ChiefComplaint = {
    complaint: string;
    durationValue: number;
    durationUnit: "hours" | "days" | "weeks" | "months";
};

export interface Patient {
    id: string;
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    contact: string;
    chiefComplaints: ChiefComplaint[]; // REPLACED chief_complaint & duration with this array
    status: PatientStatus;
    vitals?: VitalsMeasurements;
    vitalsHistory: VitalsRecord[];
    triage: Triage;
    aiTriage?: AITriageSuggestion & { fromCache?: boolean };
    registrationTime: string;
    timeline: TimelineEvent[];
    overview?: PatientOverview;
    clinicalFile: ClinicalFile;
    orders: Order[];
    results: Result[];
    rounds: Round[];
    dischargeSummary?: DischargeSummary;
    handoverSummary?: string;
    activeProblems?: ActiveProblem[];

    // Ops: Payment & Insurance
    paymentMode?: 'Cash' | 'Insurance' | 'Corporate';
    insuranceInfo?: {
        provider: string;
        policyNumber: string;
        roomRentCap: number;
        overallCap: number;
    };

    // Ops: Admission & Bed Tracking
    admissionDate?: string; // ISO date string
    bedAssignment?: {
        bedId: string;
        wardId: string;
        bedLabel: string;
        assignedAt: string;
    };
}

export type Page = 'dashboard' | 'reception' | 'triage' | 'patientDetail' | 'dischargeSummary';

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    sources?: string[];
    isLoading?: boolean;
}

export type AppContextType = {
    page: Page;
    setPage: (page: Page) => void;
    currentUser: User | null;
    setUser: (user: User | null) => void;
    patients: Patient[];
    auditLog: AuditEvent[];
    addPatient: (patientData: Omit<Patient, 'id' | 'status' | 'registrationTime' | 'triage' | 'timeline' | 'orders' | 'vitalsHistory' | 'clinicalFile' | 'rounds' | 'dischargeSummary' | 'overview' | 'results' | 'vitals' | 'handoverSummary'>) => Promise<void>;
    updatePatientVitals: (patientId: string, vitals: Vitals) => Promise<void>;
    updatePatientStatus: (patientId: string, status: PatientStatus) => void;
    addNoteToPatient: (patientId: string, content: string, isEscalation?: boolean) => Promise<void>;
    addSOAPNoteToPatient: (patientId: string, soapData: Omit<SOAPNote, 'id' | 'type' | 'patientId' | 'timestamp' | 'author' | 'authorId' | 'role'>, originalSuggestion: any) => Promise<void>;
    addChecklistToPatient: (patientId: string, title: string, items: string[]) => Promise<void>;
    updatePatientComplaint: (patientId: string, newComplaints: ChiefComplaint[]) => void;
    logAuditEvent: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => void;
    toggleChecklistItem: (patientId: string, checklistId: string, itemIndex: number) => void;
    selectedPatientId: string | null;
    setSelectedPatientId: (id: string | null) => void;
    isLoading: boolean;
    error: string | null;
    chatHistory: ChatMessage[];
    sendChatMessage: (message: string, patientContextId?: string | null) => Promise<void>;
    signOffClinicalFile: (patientId: string) => Promise<void>;
    updateOrder: (patientId: string, orderId: string, updates: Partial<Order>) => void;
    acceptAIOrders: (patientId: string, orderIds: string[]) => void;
    sendAllDrafts: (patientId: string, category: OrderCategory) => void;
    addVitalsRecord: (patientId: string, entryData: Pick<VitalsRecord, 'measurements' | 'observations' | 'source'>) => void;
    generateDischargeSummary: (patientId: string) => Promise<void>;
    saveDischargeSummary: (patientId: string, summary: DischargeSummary) => Promise<void>;
    finalizeDischarge: (patientId: string, summary: DischargeSummary) => Promise<void>;
    addOrderToPatient: (patientId: string, order: Partial<Order>) => void;
    generatePatientOverview: (patientId: string) => Promise<void>;
    generateHandoverSummary: (patientId: string) => Promise<void>;
    summarizePatientClinicalFile: (patientId: string) => Promise<void>;
    summarizeVitals: (patientId: string) => Promise<string | null>;
    createDraftRound: (patientId: string) => Promise<Round>;
    updateDraftRound: (patientId: string, roundId: string, updates: Partial<Round>) => void;
    signOffRound: (patientId: string, roundId: string, acknowledgedContradictions: string[]) => Promise<void>;
    getRoundContradictions: (patientId: string, roundId: string) => Promise<string[]>;
    updateClinicalFileSection: <K extends keyof ClinicalFileSections>(
        patientId: string,
        sectionKey: K,
        data: Partial<ClinicalFileSections[K]>
    ) => void;
    formatHpi: (patientId: string) => Promise<void>;
    checkMissingInfo: (patientId: string, sectionKey: keyof ClinicalFileSections) => void;
    summarizeSection: (patientId: string, sectionKey: keyof ClinicalFileSections) => Promise<void>;
    crossCheckFile: (patientId: string) => Promise<void>;
    acceptAISuggestion: (patientId: string, field: keyof AISuggestionHistory) => void;
    clearAISuggestions: (patientId: string, section: 'history') => void;
    getFollowUpQuestions: (patientId: string, sectionKey: 'history', fieldKey: keyof HistorySectionData, seedText: string) => Promise<void>;
    updateFollowUpAnswer: (patientId: string, fieldKey: keyof HistorySectionData, questionId: string, answer: string) => void;
    composeHistoryWithAI: (patientId: string, sectionKey: 'history', fieldKey: keyof HistorySectionData) => Promise<void>;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    updateStateAndDb: (patientId: string, updater: (p: Patient) => Patient) => void;
};