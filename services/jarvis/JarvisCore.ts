// JarvisCore - AI Orchestrator for Doctor Dashboard

import { Patient } from '../../types';
import { JarvisInsight, JarvisBriefing, DoctorProfile, ConversationMessage } from '../../types/jarvis';
import { getOrCreateProfile, getMatchingPattern, recordSuggestionAccepted } from './DoctorMemory';
import { checkRateLimit, recordTokenUsage } from '../tokenUsageTracker';

// Generate morning briefing for doctor
export const generateMorningBriefing = async (
    doctorName: string,
    patients: Patient[]
): Promise<JarvisBriefing> => {
    const criticalPatients = patients.filter(p => p.triage?.level === 'Red');
    const queuePatients = patients.filter(p => p.status === 'Waiting for Doctor');
    const dischargeReady = patients.filter(p => p.status === 'Discharged' || p.dischargeSummary?.status === 'finalized');

    // Find top priority patient
    const topPriority = criticalPatients[0] || queuePatients.sort((a, b) => {
        const aWait = new Date(a.registrationTime).getTime();
        const bWait = new Date(b.registrationTime).getTime();
        return aWait - bWait;
    })[0];

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    let summary = `You have ${patients.length} patients today.`;
    if (criticalPatients.length > 0) {
        summary += ` ${criticalPatients.length} critical requiring attention.`;
    }
    if (dischargeReady.length > 0) {
        summary += ` ${dischargeReady.length} ready for discharge.`;
    }

    return {
        greeting: `${greeting}, Dr. ${doctorName.split(' ')[0]}`,
        summary,
        criticalCount: criticalPatients.length,
        queueCount: queuePatients.length,
        dischargeReadyCount: dischargeReady.length,
        topPriority: topPriority ? {
            patientName: topPriority.name,
            patientId: topPriority.id,
            reason: topPriority.triage?.level === 'Red'
                ? 'Critical - needs immediate attention'
                : `Waiting ${getWaitTime(topPriority.registrationTime)} - longest in queue`
        } : undefined
    };
};

// Generate insights for all patients
export const generateDashboardInsights = (
    patients: Patient[],
    doctorProfile?: DoctorProfile
): JarvisInsight[] => {
    const insights: JarvisInsight[] = [];

    patients.forEach(patient => {
        // Check for critical vitals
        if (patient.vitals) {
            if (patient.vitals.spo2 && patient.vitals.spo2 < 92) {
                insights.push({
                    id: `spo2-${patient.id}`,
                    patientId: patient.id,
                    patientName: patient.name,
                    category: 'vitals',
                    message: `SpO2 critically low: ${patient.vitals.spo2}%`,
                    severity: 'high',
                    suggestedAction: {
                        label: 'Order O2 Therapy',
                        type: 'order',
                        payload: { category: 'medication', label: 'O2 via nasal cannula' }
                    },
                    isPersonalized: false,
                    createdAt: new Date().toISOString()
                });
            }

            if (patient.vitals.pulse && patient.vitals.pulse > 120) {
                insights.push({
                    id: `hr-${patient.id}`,
                    patientId: patient.id,
                    patientName: patient.name,
                    category: 'vitals',
                    message: `Tachycardia: HR ${patient.vitals.pulse} bpm`,
                    severity: 'medium',
                    isPersonalized: false,
                    createdAt: new Date().toISOString()
                });
            }
        }

        // Check for abnormal results
        patient.results?.filter(r => r.isAbnormal).forEach(result => {
            insights.push({
                id: `lab-${patient.id}-${result.id}`,
                patientId: patient.id,
                patientName: patient.name,
                category: 'labs',
                message: `${result.name}: ${result.value} (abnormal)`,
                severity: 'medium',
                isPersonalized: false,
                createdAt: new Date().toISOString()
            });
        });

        // Check for long wait times
        const waitMinutes = getWaitMinutes(patient.registrationTime);
        if (waitMinutes > 45 && patient.status === 'Waiting for Doctor') {
            insights.push({
                id: `wait-${patient.id}`,
                patientId: patient.id,
                patientName: patient.name,
                category: 'wait',
                message: `Waiting ${waitMinutes} min`,
                severity: waitMinutes > 60 ? 'high' : 'medium',
                suggestedAction: {
                    label: 'See Patient',
                    type: 'navigate',
                    payload: { route: `/patient/${patient.id}/medview` }
                },
                isPersonalized: false,
                createdAt: new Date().toISOString()
            });
        }

        // Personalized pattern-based insights
        if (doctorProfile) {
            const complaint = patient.chiefComplaints?.[0]?.complaint || '';
            const pattern = getMatchingPattern(doctorProfile, complaint);

            if (pattern && pattern.frequency >= 3) {
                insights.push({
                    id: `pattern-${patient.id}`,
                    patientId: patient.id,
                    patientName: patient.name,
                    category: 'pattern',
                    message: `You usually order ${pattern.usualOrders.slice(0, 2).join(', ')} for ${pattern.condition}`,
                    severity: 'low',
                    suggestedAction: {
                        label: 'Draft Orders',
                        type: 'order',
                        payload: { orders: pattern.usualOrders }
                    },
                    isPersonalized: true,
                    createdAt: new Date().toISOString()
                });
            }
        }
    });

    // Sort by severity
    return insights.sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });
};

// Get insights for a specific patient
export const generatePatientInsights = (
    patient: Patient,
    doctorProfile?: DoctorProfile
): JarvisInsight[] => {
    return generateDashboardInsights([patient], doctorProfile);
};

// Get next patient from queue (priority-sorted)
export const getNextPatient = (patients: Patient[]): Patient | null => {
    const queue = patients
        .filter(p => p.status === 'Waiting for Doctor')
        .sort((a, b) => {
            // Red triage first
            if (a.triage?.level === 'Red' && b.triage?.level !== 'Red') return -1;
            if (b.triage?.level === 'Red' && a.triage?.level !== 'Red') return 1;

            // Then by wait time (longest first)
            const aWait = new Date(a.registrationTime).getTime();
            const bWait = new Date(b.registrationTime).getTime();
            return aWait - bWait;
        });

    return queue[0] || null;
};

// Helper: Calculate wait time string
const getWaitTime = (registrationTime: string): string => {
    const minutes = getWaitMinutes(registrationTime);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
};

// Helper: Calculate wait minutes
const getWaitMinutes = (registrationTime: string): number => {
    const now = Date.now();
    const registered = new Date(registrationTime).getTime();
    return Math.floor((now - registered) / 60000);
};

// Triage notification severity
export const triageNotification = (
    type: string,
    value?: number
): 'critical' | 'medium' | 'silent' => {
    if (type === 'spo2' && value && value < 90) return 'critical';
    if (type === 'vitals_abnormal') return 'medium';
    if (type === 'lab_abnormal') return 'medium';
    if (type === 'lab_normal') return 'silent';
    return 'medium';
};
