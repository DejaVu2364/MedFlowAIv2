import { Patient, Order } from '../types';
import { allocatePatientsToBeds, Bed } from './bedLogic';

export interface RevenueRisk {
    id: string;
    patientId: string;
    category: 'Consumable Leak' | 'TPA Rejection Risk' | 'Room Rent Mismatch';
    description: string;
    potentialLoss: number;
    severity: 'High' | 'Medium' | 'Low';
    actions: { label: string; handler: string }[];
}

const CONSUMABLE_KEYWORDS = {
    'suture': { keyword: 'suture', orderMatch: 'suture', cost: 1200 },
    'ryles': { keyword: 'ryles', orderMatch: 'tube', cost: 450 },
    'catheter': { keyword: 'catheter', orderMatch: 'foley', cost: 800 },
    'cannula': { keyword: 'cannula', orderMatch: 'cannula', cost: 150 }
};

const TPA_RISK_MAP = {
    'meropenem': {
        drug: 'Meropenem',
        requiredKeywords: ['sepsis', 'culture', 'sensitivity', 'shock', 'neutropenia'],
        justification: 'Broad spectrum coverage required for sepsis/resistant organism',
        loss: 45000
    },
    'colistin': {
        drug: 'Colistin',
        requiredKeywords: ['mdr', 'acinetobacter', 'resistant', 'culture'],
        justification: 'MDR Organism confirmed on culture',
        loss: 60000
    }
};

export const runRevenueAudit = (patients: Patient[]): RevenueRisk[] => {
    const risks: RevenueRisk[] = [];

    // Get Bed Data for Rent Checks
    const beds = allocatePatientsToBeds(patients);
    const bedMap = new Map<string, Bed>();
    beds.forEach(b => {
        if (b.patient) bedMap.set(b.patient.id, b);
    });

    patients.forEach(patient => {
        // --- 1. The "Consumable" Trap (High Severity) ---
        // Scan clinical notes (history & exam & procedure notes if existed) for usage keywords
        const cf = patient.clinicalFile;
        // Robustly get HPI
        const hpi = cf?.sections?.history?.hpi || "";
        const clinicalText = (JSON.stringify(cf || {}) + " " + hpi).toLowerCase();

        Object.values(CONSUMABLE_KEYWORDS).forEach(item => {
            if (clinicalText.includes(item.keyword)) {
                // Check if ordered
                const hasOrder = patient.orders.some(o =>
                    (o.label || "").toLowerCase().includes(item.orderMatch) && o.status !== 'cancelled'
                );

                if (!hasOrder) {
                    risks.push({
                        id: `risk-${patient.id}-con-${item.keyword}`,
                        patientId: patient.id,
                        category: 'Consumable Leak',
                        description: `Potential Unbilled Consumable: "${item.keyword}" mentioned in notes but not found in orders.`,
                        potentialLoss: item.cost,
                        severity: 'High',
                        actions: [{ label: 'Add Order', handler: 'add-order' }, { label: 'Ignore', handler: 'ignore' }]
                    });
                }
            }
        });

        // --- 2. The "TPA Rejection" Trap (High Severity) ---
        // High-end antibiotics without documented justification (Sepsis/Culture)
        patient.orders.forEach(order => {
            if (order.category === 'medication' && order.status !== 'cancelled') {
                const label = (order.label || "").toLowerCase();

                Object.values(TPA_RISK_MAP).forEach(rule => {
                    if (label.includes(rule.drug.toLowerCase())) {
                        // Check for justification in notes
                        const hasJustification = rule.requiredKeywords.some(k => clinicalText.includes(k));

                        if (!hasJustification) {
                            risks.push({
                                id: `risk-${patient.id}-tpa-${rule.drug}`,
                                patientId: patient.id,
                                category: 'TPA Rejection Risk',
                                description: `High-value drug "${rule.drug}" prescribed without documented indication (${rule.requiredKeywords.join('/')}).`,
                                potentialLoss: rule.loss,
                                severity: 'High',
                                actions: [{ label: 'AI Justify', handler: 'ai-justify' }, { label: 'Review', handler: 'review' }]
                            });
                        }
                    }
                });
            }
        });

        // --- 3. The "Room Rent" Mismatch (Medium Severity) ---
        // Patient in room costing more than insurance limit
        const bed = bedMap.get(patient.id);
        if (bed && bed.patient?.insuranceLimit) {
            if (bed.dailyRate > bed.patient.insuranceLimit) {
                risks.push({
                    id: `risk-${patient.id}-rent-cap`,
                    patientId: patient.id,
                    category: 'Room Rent Mismatch',
                    description: `Bed Charge (₹${bed.dailyRate}) exceeds Insurance Cap (₹${bed.patient.insuranceLimit}).`,
                    potentialLoss: (bed.dailyRate - bed.patient.insuranceLimit) * bed.patient.lengthOfStay,
                    severity: 'Medium',
                    actions: [{ label: 'Downgrade Bed', handler: 'move-bed' }, { label: 'Counsel', handler: 'counsel' }]
                });
            }
        }
    });

    return risks;
};
