import { Patient } from '../types';

export interface FocusGroup {
    id: 'critical' | 'drafts' | 'discharge' | 'admin_request';
    label: string;
    count: number;
    priority: 'high' | 'medium' | 'low';
    subtext: string;
    intent: 'review' | 'sign' | 'triage';
    targetPatientId?: string;
}

/**
 * Calculates bed occupancy percentage.
 * Defaults totalBeds to 30 if not provided.
 */
export const calculateOccupancy = (patients: Patient[] = [], totalBeds: number = 30): { occupied: number, total: number, percentage: number } => {
    if (!patients) {
        return { occupied: 0, total: totalBeds, percentage: 0 };
    }

    const occupied = patients.filter(p => p.status !== 'Discharged').length;

    // Safety check for zero denominator
    const effectiveTotal = totalBeds > 0 ? totalBeds : 30;

    let percentage = (occupied / effectiveTotal) * 100;

    // Ensure percentage is within bounds and not NaN
    if (isNaN(percentage)) percentage = 0;
    if (percentage > 100) percentage = 100; // Cap at 100 for display purposes, though technically could overfill

    return {
        occupied,
        total: effectiveTotal,
        percentage: Math.round(percentage)
    };
};

/**
 * Derives the "Focus Feed" groups for the dashboard.
 * Categorizes tasks into Critical Triage, Draft Orders, and Discharge Readiness.
 */
export const deriveFocusGroups = (patients: Patient[] = []): FocusGroup[] => {
    if (!patients) return [];

    const groups: FocusGroup[] = [];

    // Group 1: Critical Triage
    const criticalPatients = patients.filter(p =>
        p.triage?.level === 'Red' &&
        p.status !== 'Discharged'
    );

    if (criticalPatients.length > 0) {
        groups.push({
            id: 'critical',
            label: 'Critical Triage',
            count: criticalPatients.length,
            priority: 'high',
            subtext: `${criticalPatients.length} patient${criticalPatients.length === 1 ? '' : 's'} waiting for doctor`,
            intent: 'triage',
            targetPatientId: criticalPatients[0].id
        });
    }

    // Group 2: Doctor Action Loop (TPA Justification)
    // Demo: Look for 'Vikram S' who has High Risk Meds
    const tpaPatient = patients.find(p => p.name === 'Vikram S');

    if (tpaPatient) {
        groups.push({
            id: 'admin_request',
            label: 'Sign TPA Justification',
            count: 1,
            priority: 'high',
            subtext: `Use of Restricted Antibiotics (Meropenem) requires justification.`,
            intent: 'sign',
            targetPatientId: tpaPatient.id
        });
    }

    // Group 3: Draft Orders
    let draftOrderCount = 0;
    let firstPatientWithDrafts: string | undefined;

    patients.forEach(p => {
        if (p.orders) {
            const drafts = p.orders.filter(o => o.status === 'draft');
            if (drafts.length > 0) {
                draftOrderCount += drafts.length;
                if (!firstPatientWithDrafts) firstPatientWithDrafts = p.id;
            }
        }
    });

    if (draftOrderCount > 0) {
        groups.push({
            id: 'drafts',
            label: 'Draft Orders',
            count: draftOrderCount,
            priority: 'medium',
            subtext: `${draftOrderCount} item${draftOrderCount === 1 ? '' : 's'} awaiting signature`,
            intent: 'sign',
            targetPatientId: firstPatientWithDrafts
        });
    }

    // Group 4: Ready for Discharge (Drafts ready for review)
    const readyForDischarge = patients.filter(p =>
        p.dischargeSummary &&
        p.status !== 'Discharged' &&
        p.dischargeSummary.status === 'draft' // Only show Drafts for Doctor to finalize
    );

    if (readyForDischarge.length > 0) {
        groups.push({
            id: 'discharge',
            label: 'Ready for Discharge',
            count: readyForDischarge.length,
            priority: 'low',
            subtext: `${readyForDischarge.length} summar${readyForDischarge.length === 1 ? 'y' : 'ies'} ready for review`,
            intent: 'review',
            targetPatientId: readyForDischarge[0].id
        });
    }

    return groups;
};
