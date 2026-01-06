// src/types/patient.ts

export type Role = 'Intern' | 'Doctor' | 'Admin';
export type TriageLevel = 'Red' | 'Yellow' | 'Green' | 'None';
export type PatientStatus = 'Waiting for Triage' | 'Waiting for Doctor' | 'In Treatment' | 'Discharged';
export type Department = 'Cardiology' | 'Orthopedics' | 'General Medicine' | 'Obstetrics' | 'Neurology' | 'Emergency' | 'Unknown';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
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

export interface Patient {
    id: string;
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    contact: string;
    chiefComplaints: ChiefComplaint[];
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
    paymentMode?: 'Cash' | 'Insurance' | 'Corporate';
    insuranceInfo?: {
        provider: string;
        policyNumber: string;
        roomRentCap: number;
        overallCap: number;
    };
    admissionDate?: string;
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
