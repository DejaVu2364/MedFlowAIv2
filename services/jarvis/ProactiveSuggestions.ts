// ProactiveSuggestions.ts - Generates proactive suggestions based on patient data
// Detects missing information and vitals thresholds

import { Patient, ClinicalFileSections } from '../../types';
import { JarvisInsight } from '../../types/jarvis';

export interface ProactiveSuggestion {
    id: string;
    type: 'missing_field' | 'vitals_alert' | 'time_based' | 'workflow';
    severity: 'low' | 'medium' | 'high';
    message: string;
    suggestedQuestion?: string;
    action?: {
        type: 'order' | 'navigate' | 'ask' | 'mark_nkda';
        payload?: Record<string, unknown>;
    };
}

// Critical fields that should be captured
const CRITICAL_FIELDS = [
    { key: 'allergy_history', label: 'Allergy History', question: 'Do you have any known drug allergies?' },
    { key: 'drug_history', label: 'Current Medications', question: 'What medications are you currently taking?' },
    { key: 'complaints', label: 'Chief Complaints', question: 'What brings you in today?' },
];

// Vitals thresholds for alerts
const VITALS_THRESHOLDS = {
    spo2_low: { value: 92, message: 'SpO2 is low', action: 'o2_therapy' },
    spo2_critical: { value: 88, message: 'SpO2 is critical', action: 'o2_urgent' },
    bp_sys_high: { value: 180, message: 'Systolic BP is elevated (Hypertensive urgency)', action: 'bp_management' },
    bp_sys_low: { value: 90, message: 'Systolic BP is low (Hypotension)', action: 'fluid_resus' },
    hr_high: { value: 120, message: 'Tachycardia detected', action: 'ecg' },
    hr_low: { value: 50, message: 'Bradycardia detected', action: 'ecg' },
    temp_high: { value: 38.5, message: 'Fever detected', action: 'fever_workup' },
    rr_high: { value: 24, message: 'Tachypnea detected', action: 'respiratory_assessment' },
};

export const detectMissingFields = (
    clinicalFile: Partial<ClinicalFileSections>
): ProactiveSuggestion[] => {
    const suggestions: ProactiveSuggestion[] = [];
    const history = clinicalFile.history;

    // Check each critical field
    CRITICAL_FIELDS.forEach(field => {
        const value = history?.[field.key as keyof typeof history];
        const isEmpty = !value ||
            (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'string' && !value.trim());

        if (isEmpty) {
            suggestions.push({
                id: `missing_${field.key}`,
                type: 'missing_field',
                severity: field.key === 'allergy_history' ? 'high' : 'medium',
                message: `${field.label} not documented`,
                suggestedQuestion: field.question,
                action: field.key === 'allergy_history' ?
                    { type: 'mark_nkda' } :
                    { type: 'ask', payload: { question: field.question } }
            });
        }
    });

    return suggestions;
};

export const checkVitalsThresholds = (patient: Patient): ProactiveSuggestion[] => {
    const suggestions: ProactiveSuggestion[] = [];
    const vitals = patient.vitals;

    if (!vitals) return suggestions;

    // SpO2 checks
    if (vitals.spo2 !== null && vitals.spo2 !== undefined) {
        if (vitals.spo2 < VITALS_THRESHOLDS.spo2_critical.value) {
            suggestions.push({
                id: 'vitals_spo2_critical',
                type: 'vitals_alert',
                severity: 'high',
                message: `SpO2 is ${vitals.spo2}% - Critical hypoxemia`,
                action: { type: 'order', payload: { subType: 'o2_nrb', priority: 'STAT' } }
            });
        } else if (vitals.spo2 < VITALS_THRESHOLDS.spo2_low.value) {
            suggestions.push({
                id: 'vitals_spo2_low',
                type: 'vitals_alert',
                severity: 'medium',
                message: `SpO2 is ${vitals.spo2}% - Consider O2 therapy?`,
                action: { type: 'order', payload: { subType: 'o2_nasal_cannula' } }
            });
        }
    }

    // BP checks
    if (vitals.bp_sys !== null && vitals.bp_sys !== undefined) {
        if (vitals.bp_sys > VITALS_THRESHOLDS.bp_sys_high.value) {
            suggestions.push({
                id: 'vitals_bp_high',
                type: 'vitals_alert',
                severity: 'high',
                message: `BP is ${vitals.bp_sys}/${vitals.bp_dia} - Hypertensive urgency`,
                action: { type: 'order', payload: { subType: 'bp_management' } }
            });
        } else if (vitals.bp_sys < VITALS_THRESHOLDS.bp_sys_low.value) {
            suggestions.push({
                id: 'vitals_bp_low',
                type: 'vitals_alert',
                severity: 'high',
                message: `BP is ${vitals.bp_sys}/${vitals.bp_dia} - Hypotension`,
                action: { type: 'order', payload: { subType: 'iv_fluid' } }
            });
        }
    }

    // HR checks
    if (vitals.pulse !== null && vitals.pulse !== undefined) {
        if (vitals.pulse > VITALS_THRESHOLDS.hr_high.value) {
            suggestions.push({
                id: 'vitals_hr_high',
                type: 'vitals_alert',
                severity: 'medium',
                message: `Heart rate is ${vitals.pulse} bpm - Tachycardia`,
                action: { type: 'order', payload: { subType: 'ecg' } }
            });
        } else if (vitals.pulse < VITALS_THRESHOLDS.hr_low.value) {
            suggestions.push({
                id: 'vitals_hr_low',
                type: 'vitals_alert',
                severity: 'medium',
                message: `Heart rate is ${vitals.pulse} bpm - Bradycardia`,
                action: { type: 'order', payload: { subType: 'ecg' } }
            });
        }
    }

    // Temp check
    if (vitals.temp_c !== null && vitals.temp_c !== undefined) {
        if (vitals.temp_c > VITALS_THRESHOLDS.temp_high.value) {
            suggestions.push({
                id: 'vitals_fever',
                type: 'vitals_alert',
                severity: 'medium',
                message: `Temperature is ${vitals.temp_c}°C - Fever`,
                action: { type: 'order', payload: { subType: 'fever_workup' } }
            });
        }
    }

    // RR check
    if (vitals.rr !== null && vitals.rr !== undefined) {
        if (vitals.rr > VITALS_THRESHOLDS.rr_high.value) {
            suggestions.push({
                id: 'vitals_rr_high',
                type: 'vitals_alert',
                severity: 'medium',
                message: `Respiratory rate is ${vitals.rr}/min - Tachypnea`,
                action: { type: 'order', payload: { subType: 'abg' } }
            });
        }
    }

    return suggestions;
};

// Time-based suggestions
export const checkTimeBased = (patient: Patient): ProactiveSuggestion[] => {
    const suggestions: ProactiveSuggestion[] = [];

    // Check if patient has been waiting too long
    const registrationTime = new Date(patient.registrationTime);
    const hoursWaiting = (Date.now() - registrationTime.getTime()) / (1000 * 60 * 60);

    if (hoursWaiting > 4 && patient.status === 'In Treatment') {
        const hasRecentLabs = patient.results.some(r => {
            const resultTime = new Date(r.timestamp);
            return (Date.now() - resultTime.getTime()) < 4 * 60 * 60 * 1000;
        });

        if (!hasRecentLabs && patient.orders.filter(o => o.category === 'investigation').length > 0) {
            suggestions.push({
                id: 'time_labs_delayed',
                type: 'time_based',
                severity: 'low',
                message: `Patient waiting ${Math.floor(hoursWaiting)}+ hours. Lab results may be delayed.`
            });
        }
    }

    // Check if discharge is pending but summary not started
    if (patient.status === 'Discharged' && !patient.dischargeSummary) {
        suggestions.push({
            id: 'discharge_summary_pending',
            type: 'workflow',
            severity: 'medium',
            message: 'Discharge summary not yet created',
            action: { type: 'navigate', payload: { route: `/patient/${patient.id}/discharge` } }
        });
    }

    return suggestions;
};

// Convert ProactiveSuggestion to JarvisInsight for display
export const suggestionToInsight = (suggestion: ProactiveSuggestion, patientId?: string): JarvisInsight => {
    return {
        id: suggestion.id,
        patientId: patientId || '',
        message: suggestion.message,
        severity: suggestion.severity,
        category: suggestion.type === 'vitals_alert' ? 'vitals' :
            suggestion.type === 'missing_field' ? 'documentation' : 'workflow',
        suggestedAction: suggestion.action ? {
            type: suggestion.action.type as any,
            label: suggestion.suggestedQuestion || 'Take action',
            payload: suggestion.action.payload
        } : undefined,
        timestamp: new Date().toISOString()
    };
};

// Get all suggestions for a patient
export const getAllSuggestions = (patient: Patient): ProactiveSuggestion[] => {
    return [
        ...checkVitalsThresholds(patient),
        ...detectMissingFields(patient.clinicalFile?.sections || {}),
        ...checkTimeBased(patient)
    ];
};

export default {
    detectMissingFields,
    checkVitalsThresholds,
    checkTimeBased,
    getAllSuggestions,
    suggestionToInsight
};
