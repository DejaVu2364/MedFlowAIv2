import { Patient } from '../types';

export type BedType = 'ICU' | 'Private' | 'Semi-Private' | 'General Male' | 'General Female';

export interface Bed {
    id: string;
    wardId: 'ICU' | 'WARD-A' | 'WARD-B';
    label: string;
    type: BedType;
    dailyRate: number;
    status: 'available' | 'occupied' | 'discharge_planned' | 'cleaning' | 'maintenance';
    patient?: {
        id: string;
        name: string;
        gender: string;
        age: number;
        triage: 'Red' | 'Yellow' | 'Green';
        admissionDate: string; // ISO String
        lengthOfStay: number; // Days
        currentBill: number; // dailyRate * lengthOfStay
        insuranceLimit?: number; // Mock limit (e.g. 5000)
    };
}

// Pricing Configuration
const BED_RATES: Record<BedType, number> = {
    'ICU': 25000,
    'Private': 12000,
    'Semi-Private': 8000,
    'General Male': 3000,
    'General Female': 3000
};

/**
 * Generates the hospital infrastructure (Beds).
 */
export const generateHospitalInfrastructure = (): Bed[] => {
    const beds: Bed[] = [];

    // 1. ICU (10 Beds)
    for (let i = 1; i <= 10; i++) {
        beds.push({
            id: `bed-icu-${i}`,
            wardId: 'ICU',
            label: `ICU-${String(i).padStart(2, '0')}`,
            type: 'ICU',
            dailyRate: BED_RATES['ICU'],
            status: 'available'
        });
    }

    // 2. Ward A (Private/Semi - 10 Beds)
    for (let i = 1; i <= 5; i++) {
        beds.push({
            id: `bed-wa-p-${i}`,
            wardId: 'WARD-A',
            label: `PVT-${String(i).padStart(2, '0')}`,
            type: 'Private',
            dailyRate: BED_RATES['Private'],
            status: 'available'
        });
    }
    for (let i = 6; i <= 10; i++) {
        beds.push({
            id: `bed-wa-sp-${i}`,
            wardId: 'WARD-A',
            label: `SEM-${String(i).padStart(2, '0')}`,
            type: 'Semi-Private',
            dailyRate: BED_RATES['Semi-Private'],
            status: 'available'
        });
    }

    // 3. Ward B (General - 20 Beds)
    for (let i = 1; i <= 10; i++) {
        beds.push({
            id: `bed-wb-m-${i}`,
            wardId: 'WARD-B',
            label: `GEN-M-${String(i).padStart(2, '0')}`,
            type: 'General Male',
            dailyRate: BED_RATES['General Male'],
            status: 'available'
        });
    }
    for (let i = 11; i <= 20; i++) {
        beds.push({
            id: `bed-wb-f-${i}`,
            wardId: 'WARD-B',
            label: `GEN-F-${String(i).padStart(2, '0')}`,
            type: 'General Female',
            dailyRate: BED_RATES['General Female'],
            status: 'available'
        });
    }

    return beds;
};

/**
 * Allocates patients to beds and calculates financial metrics.
 * Since we don't have a real persistent bed state, we deterministically assign active patients.
 */
export const allocatePatientsToBeds = (patients: Patient[]): Bed[] => {
    const beds = generateHospitalInfrastructure();

    // Filter active patients (not discharged)
    const activePatients = patients.filter(p => !p.status || p.status !== 'Discharged');

    // Deterministic Assignment Strategy
    // 1. Red Triage -> ICU
    // 2. Yellow Triage -> Private/Semi
    // 3. Green Triage -> General

    const icuPatients = activePatients.filter(p => p.triage?.level === 'Red');
    const wardPatients = activePatients.filter(p => p.triage?.level === 'Yellow');
    const genPatients = activePatients.filter(p => !p.triage || p.triage.level === 'Green');

    let pIndex = 0;

    // Helper to assign
    const assign = (bed: Bed, patient: Patient) => {
        // Calculate LOS
        // Mock Admission Date: Assume admitted 2-5 days ago based on ID hash if not provided
        // Ideally admissionDate should be on patient object. If missing, mock it.

        const now = new Date();
        const mockDaysAgo = (patient.id.charCodeAt(0) % 5) + 1; // 1 to 5 days
        const admissionDate = new Date(now.getTime() - (mockDaysAgo * 24 * 60 * 60 * 1000));

        // In a real app, use patient.admissionDate

        const los = Math.max(1, mockDaysAgo);
        const currentBill = bed.dailyRate * los;

        // Mock Insurance Limit: 50% chance of having a low cap
        const hasInsuranceCap = patient.id.charCodeAt(1) % 2 === 0;
        const insuranceLimit = hasInsuranceCap ? (bed.dailyRate > 10000 ? 15000 : 5000) : undefined;

        bed.status = 'occupied';
        bed.patient = {
            id: patient.id,
            name: patient.name,
            gender: patient.gender,
            age: patient.age,
            triage: (patient.triage?.level as 'Red' | 'Yellow' | 'Green') || 'Green',
            admissionDate: admissionDate.toISOString(),
            lengthOfStay: los,
            currentBill,
            insuranceLimit
        };
    };

    // Fill ICU
    beds.filter(b => b.type === 'ICU').forEach(bed => {
        if (icuPatients.length > 0) assign(bed, icuPatients.shift()!);
    });

    // Fill Private/Semi
    beds.filter(b => b.type === 'Private' || b.type === 'Semi-Private').forEach(bed => {
        if (wardPatients.length > 0) assign(bed, wardPatients.shift()!);
    });

    // Fill General Male
    const genMale = genPatients.filter(p => p.gender === 'Male');
    beds.filter(b => b.type === 'General Male').forEach(bed => {
        if (genMale.length > 0) assign(bed, genMale.shift()!);
    });

    // Fill General Female
    const genFemale = genPatients.filter(p => p.gender === 'Female');
    beds.filter(b => b.type === 'General Female').forEach(bed => {
        if (genFemale.length > 0) assign(bed, genFemale.shift()!);
    });

    // If leftover patients, force fill empty beds (overflow logic)
    // Re-gather leftover general patients
    const leftoverGen = [...genMale, ...genFemale]; // Those who didn't fit in gender-specific beds
    const unmatched = [...icuPatients, ...wardPatients, ...leftoverGen];
    const emptyBeds = beds.filter(b => b.status === 'available');

    unmatched.forEach(p => {
        if (emptyBeds.length > 0) {
            assign(emptyBeds.shift()!, p);
        }
    });

    return beds;
};

/**
 * Calculates total active room revenue.
 */
export const calculateTotalRoomRevenue = (beds: Bed[]): number => {
    return beds.reduce((sum, bed) => sum + (bed.patient?.currentBill || 0), 0);
};
