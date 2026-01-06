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
 * PRIORITY: Uses real patient.bedAssignment first, then falls back to triage-based assignment.
 */
export const allocatePatientsToBeds = (patients: Patient[]): Bed[] => {
    const beds = generateHospitalInfrastructure();

    // Filter active patients (not discharged)
    const activePatients = patients.filter(p => !p.status || p.status !== 'Discharged');

    // Helper to assign a patient to a bed
    const assign = (bed: Bed, patient: Patient) => {
        const now = new Date();

        // Use REAL admission date if available, otherwise fallback to mock
        let admissionDate: Date;
        let los: number;

        if (patient.admissionDate) {
            admissionDate = new Date(patient.admissionDate);
            los = Math.max(1, Math.ceil((now.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)));
        } else {
            // Fallback: mock based on ID hash
            const mockDaysAgo = (patient.id.charCodeAt(0) % 5) + 1;
            admissionDate = new Date(now.getTime() - (mockDaysAgo * 24 * 60 * 60 * 1000));
            los = mockDaysAgo;
        }

        const currentBill = bed.dailyRate * los;

        // Use REAL insurance limit if available
        const insuranceLimit = patient.insuranceInfo?.roomRentCap ||
            (patient.paymentMode === 'Insurance' ? (bed.dailyRate > 10000 ? 15000 : 5000) : undefined);

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

    // STEP 1: First, honor patients with REAL bed assignments
    const patientsWithAssignment = activePatients.filter(p => p.bedAssignment?.bedId);
    const patientsWithoutAssignment = activePatients.filter(p => !p.bedAssignment?.bedId);

    patientsWithAssignment.forEach(patient => {
        const bed = beds.find(b => b.id === patient.bedAssignment!.bedId);
        if (bed && bed.status === 'available') {
            assign(bed, patient);
        }
    });

    // STEP 2: For unassigned patients, use triage-based allocation
    const icuPatients = patientsWithoutAssignment.filter(p => p.triage?.level === 'Red');
    const wardPatients = patientsWithoutAssignment.filter(p => p.triage?.level === 'Yellow');
    const genPatients = patientsWithoutAssignment.filter(p => !p.triage || p.triage.level === 'Green');

    // Fill ICU
    beds.filter(b => b.type === 'ICU' && b.status === 'available').forEach(bed => {
        if (icuPatients.length > 0) assign(bed, icuPatients.shift()!);
    });

    // Fill Private/Semi
    beds.filter(b => (b.type === 'Private' || b.type === 'Semi-Private') && b.status === 'available').forEach(bed => {
        if (wardPatients.length > 0) assign(bed, wardPatients.shift()!);
    });

    // Fill General Male
    const genMale = genPatients.filter(p => p.gender === 'Male');
    beds.filter(b => b.type === 'General Male' && b.status === 'available').forEach(bed => {
        if (genMale.length > 0) assign(bed, genMale.shift()!);
    });

    // Fill General Female
    const genFemale = genPatients.filter(p => p.gender === 'Female');
    beds.filter(b => b.type === 'General Female' && b.status === 'available').forEach(bed => {
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
