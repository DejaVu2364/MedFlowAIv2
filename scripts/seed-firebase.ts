/**
 * Firebase Seeding Script
 * Run: npx ts-node --esm scripts/seed-firebase.ts
 * Or add to package.json: "seed": "tsx scripts/seed-firebase.ts"
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

// Firebase config - uses the same values as the app
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBxQxFHxELG9P2G-EWGfjXOr0Dl0fzq1EM",
    authDomain: "medflowai-19269.firebaseapp.com",
    projectId: "medflowai-19269",
    storageBucket: "medflowai-19269.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Import the Synthea data generator
// Note: We need to copy the generator logic here since we can't import from .ts in Node easily

interface VitalsMeasurements {
    pulse?: number | null;
    bp_sys?: number | null;
    bp_dia?: number | null;
    spo2?: number | null;
    temp_c?: number | null;
    rr?: number | null;
}

interface VitalsRecord {
    vitalId: string;
    patientId: string;
    recordedBy: string;
    recordedAt: string;
    source: string;
    measurements: VitalsMeasurements;
}

// Generate vitals history
const generateVitalsHistory = (patientId: string, days: number, baseVitals: VitalsMeasurements, trend: 'stable' | 'improving' | 'worsening'): VitalsRecord[] => {
    const history: VitalsRecord[] = [];
    const now = Date.now();

    for (let day = days; day >= 0; day--) {
        for (let reading = 0; reading < 4; reading++) {
            const timestamp = now - (day * 86400000) - (reading * 6 * 3600000);

            let factor = 1;
            if (trend === 'improving') {
                factor = 1 - (days - day) / (days * 2);
            } else if (trend === 'worsening') {
                factor = 1 + (days - day) / (days * 3);
            }

            const randomFactor = 0.95 + Math.random() * 0.1;

            history.push({
                vitalId: `v-${patientId}-${day}-${reading}`,
                patientId,
                recordedBy: 'Nurse Station',
                recordedAt: new Date(timestamp).toISOString(),
                source: reading === 0 ? 'nurse' : 'monitor',
                measurements: {
                    pulse: Math.round((baseVitals.pulse || 72) * factor * randomFactor),
                    bp_sys: Math.round((baseVitals.bp_sys || 120) * factor * randomFactor),
                    bp_dia: Math.round((baseVitals.bp_dia || 80) * factor * randomFactor),
                    spo2: Math.min(100, Math.round((baseVitals.spo2 || 98) / factor * randomFactor)),
                    temp_c: Math.round(((baseVitals.temp_c || 37) * factor * randomFactor) * 10) / 10,
                    rr: Math.round((baseVitals.rr || 16) * factor * randomFactor),
                }
            });
        }
    }

    return history;
};

// Helper to remove undefined values
const sanitizeForFirestore = (obj: any): any => {
    if (obj === undefined) return null;
    if (obj === null) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);

    const newObj: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value === undefined) {
                newObj[key] = null;
            } else {
                newObj[key] = sanitizeForFirestore(value);
            }
        }
    }
    return newObj;
};

// Generate demo patients (simplified version of syntheaImporter.ts)
const generateDemoPatients = () => {
    const patients: any[] = [];

    // 1. Amitabh B - Head Injury
    patients.push({
        id: 'p-amitabh',
        name: 'Amitabh B',
        age: 45,
        gender: 'Male',
        contact: '+91 9876543210',
        status: 'In Treatment',
        registrationTime: new Date(Date.now() - 3 * 86400000).toISOString(),
        chiefComplaints: [{ complaint: "Head Injury", durationValue: 2, durationUnit: "hours" }],
        aiTriage: { department: 'Emergency', suggested_triage: 'Yellow', confidence: 0.85, fromCache: false },
        triage: { level: 'Yellow', reasons: ['Head Trauma', 'LOC History'] },
        vitals: { pulse: 82, bp_sys: 138, bp_dia: 88, spo2: 98, temp_c: 36.9, rr: 16 },
        vitalsHistory: generateVitalsHistory('p-amitabh', 3, { pulse: 88, bp_sys: 150, bp_dia: 92, spo2: 97, temp_c: 37.1, rr: 18 }, 'improving'),
        timeline: [],
        orders: [
            { orderId: 'ord-ct-head', patientId: 'p-amitabh', category: 'investigation', subType: 'imaging', label: 'CT Brain Plain', status: 'completed', createdBy: 'doc', createdAt: new Date(Date.now() - 2.9 * 86400000).toISOString(), ai_provenance: { prompt_id: null, rationale: 'Head injury with LOC' }, priority: 'urgent', payload: {} }
        ],
        results: [
            { id: 'res-ct', patientId: 'p-amitabh', name: 'CT Brain Plain', value: 'No intracranial hemorrhage', normalRange: 'N/A', unit: '', timestamp: new Date().toISOString(), isAbnormal: false }
        ],
        clinicalFile: {
            id: 'CF-p-amitabh',
            patientId: 'p-amitabh',
            status: 'signed',
            aiSuggestions: {},
            sections: {
                history: {
                    complaints: [{ symptom: 'Head Injury', duration: '2 hours' }],
                    hpi: "45M brought by relatives after RTA. Head injury with brief LOC.",
                    past_medical_history: "Known Hypertensive",
                    drug_history: "Amlodipine 5mg OD",
                    allergy_history: [{ substance: 'Sulfa drugs', reaction: 'Urticaria', severity: 'Moderate' }]
                },
                gpe: {
                    vitals: { pulse: 88, bp_sys: 150, bp_dia: 92, spo2: 97, temp_c: 37.1, rr: 18 },
                    general_appearance: 'ill',
                    build: 'normal',
                    flags: { pallor: false, icterus: false, cyanosis: false, clubbing: false, lymphadenopathy: false, edema: false }
                },
                systemic: { cns: { summary: "GCS 15/15. Pupils PEARL." } }
            }
        },
        rounds: [],
        paymentMode: 'Insurance',
        insuranceInfo: { provider: 'Star Health', policyNumber: 'STH-2024-78901', roomRentCap: 3000, overallCap: 500000 },
        admissionDate: new Date(Date.now() - 3 * 86400000).toISOString(),
        bedAssignment: { bedId: 'bed-wa-1', wardId: 'WARD-A', bedLabel: 'WA-1', assignedAt: new Date(Date.now() - 3 * 86400000).toISOString() }
    });

    // 2. Sania M - Dengue (Discharge Ready)
    patients.push({
        id: 'p-sania',
        name: 'Sania M',
        age: 28,
        gender: 'Female',
        contact: '+91 9876543211',
        status: 'In Treatment',
        registrationTime: new Date(Date.now() - 5 * 86400000).toISOString(),
        chiefComplaints: [{ complaint: "Fever", durationValue: 5, durationUnit: "days" }],
        aiTriage: { department: 'General Medicine', suggested_triage: 'Yellow', confidence: 0.9, fromCache: false },
        triage: { level: 'Green', reasons: ['Recovering'] },
        vitals: { pulse: 76, bp_sys: 110, bp_dia: 70, spo2: 99, temp_c: 36.8, rr: 16 },
        vitalsHistory: generateVitalsHistory('p-sania', 5, { pulse: 102, bp_sys: 100, bp_dia: 65, spo2: 97, temp_c: 39.2, rr: 22 }, 'improving'),
        timeline: [],
        orders: [],
        results: [
            { id: 'res-ns1', patientId: 'p-sania', name: 'Dengue NS1', value: 'POSITIVE', normalRange: 'Negative', unit: '', timestamp: new Date().toISOString(), isAbnormal: true }
        ],
        clinicalFile: {
            id: 'CF-p-sania',
            patientId: 'p-sania',
            status: 'signed',
            sections: {
                history: { complaints: [{ symptom: 'Fever', duration: '5 days' }], hpi: "28F with Dengue Fever, recovering." },
                gpe: { vitals: { pulse: 76, bp_sys: 110, bp_dia: 70, spo2: 99, temp_c: 36.8, rr: 16 }, general_appearance: 'well', flags: {} },
                systemic: {}
            }
        },
        rounds: [],
        dischargeSummary: { id: 'DS-SANIA', status: 'finalized', finalDiagnosis: 'Dengue Fever' },
        paymentMode: 'Insurance',
        bedAssignment: { bedId: 'bed-wb-2', wardId: 'WARD-B', bedLabel: 'WB-2', assignedAt: new Date(Date.now() - 5 * 86400000).toISOString() }
    });

    // 3. Vikram S - TPA Risk
    patients.push({
        id: 'p-vikram',
        name: 'Vikram S',
        age: 52,
        gender: 'Male',
        contact: '+91 9876543212',
        status: 'In Treatment',
        registrationTime: new Date(Date.now() - 2 * 86400000).toISOString(),
        chiefComplaints: [{ complaint: "Fever", durationValue: 3, durationUnit: "days" }],
        triage: { level: 'Yellow', reasons: ['Infection'] },
        vitals: { pulse: 98, bp_sys: 128, bp_dia: 82, spo2: 97, temp_c: 37.8, rr: 18 },
        vitalsHistory: generateVitalsHistory('p-vikram', 2, { pulse: 102, bp_sys: 134, bp_dia: 86, spo2: 96, temp_c: 38.5, rr: 20 }, 'improving'),
        orders: [
            { orderId: 'ord-meropenem', patientId: 'p-vikram', category: 'medication', subType: 'antibiotic', label: 'Inj. Meropenem 1gm IV TDS', status: 'sent', createdBy: 'doc', createdAt: new Date().toISOString(), priority: 'routine', payload: {} }
        ],
        clinicalFile: { id: 'CF-p-vikram', patientId: 'p-vikram', status: 'signed', sections: { history: { complaints: [{ symptom: 'Fever', duration: '3 days' }], hpi: "52M with fever, on Meropenem." }, gpe: {}, systemic: {} } },
        paymentMode: 'Insurance',
        insuranceInfo: { provider: 'ICICI Lombard', policyNumber: 'ICICI-2024-56789', roomRentCap: 4000, overallCap: 700000 },
        bedAssignment: { bedId: 'bed-wa-3', wardId: 'WARD-A', bedLabel: 'WA-3', assignedAt: new Date().toISOString() }
    });

    // 4. Rahul D - Critical ICU
    patients.push({
        id: 'p-rahul',
        name: 'Rahul D',
        age: 65,
        gender: 'Male',
        contact: '+91 9876543213',
        status: 'In Treatment',
        registrationTime: new Date(Date.now() - 4 * 3600000).toISOString(),
        chiefComplaints: [{ complaint: "Chest Pain", durationValue: 1, durationUnit: "hours" }],
        triage: { level: 'Red', reasons: ['ACS', 'Hypotension'] },
        vitals: { pulse: 98, bp_sys: 102, bp_dia: 68, spo2: 94, temp_c: 37.0, rr: 22 },
        vitalsHistory: generateVitalsHistory('p-rahul', 0, { pulse: 120, bp_sys: 90, bp_dia: 60, spo2: 88, temp_c: 37.2, rr: 30 }, 'improving'),
        orders: [],
        results: [
            { id: 'res-trop', patientId: 'p-rahul', name: 'Troponin I', value: '2.8', normalRange: '<0.04', unit: 'ng/mL', timestamp: new Date().toISOString(), isAbnormal: true }
        ],
        clinicalFile: { id: 'CF-p-rahul', patientId: 'p-rahul', status: 'signed', sections: { history: { complaints: [{ symptom: 'Chest Pain', duration: '30 min' }], hpi: "65M with STEMI." }, gpe: {}, systemic: {} } },
        paymentMode: 'Cash',
        bedAssignment: { bedId: 'bed-icu-1', wardId: 'ICU', bedLabel: 'ICU-1', assignedAt: new Date().toISOString() }
    });

    // 5. Priya K - Waiting for Triage
    patients.push({
        id: 'p-priya',
        name: 'Priya K',
        age: 32,
        gender: 'Female',
        contact: '+91 9876543214',
        status: 'Waiting for Triage',
        registrationTime: new Date(Date.now() - 30 * 60000).toISOString(),
        chiefComplaints: [{ complaint: "Abdominal Pain", durationValue: 6, durationUnit: "hours" }],
        triage: { level: 'None', reasons: [] },
        vitals: { pulse: 92, bp_sys: 124, bp_dia: 78, spo2: 99, temp_c: 37.3, rr: 18 },
        vitalsHistory: [],
        clinicalFile: { id: 'CF-p-priya', patientId: 'p-priya', status: 'draft', sections: { history: { complaints: [{ symptom: 'Abdominal Pain', duration: '6 hours' }] }, gpe: {}, systemic: {} } },
        paymentMode: 'Cash'
    });

    // 6. Mohammed A - Stable Ward
    patients.push({
        id: 'p-mohammed',
        name: 'Mohammed A',
        age: 58,
        gender: 'Male',
        contact: '+91 9876543215',
        status: 'In Treatment',
        registrationTime: new Date(Date.now() - 1 * 86400000).toISOString(),
        chiefComplaints: [{ complaint: "Weakness", durationValue: 7, durationUnit: "days" }],
        triage: { level: 'Green', reasons: ['Uncontrolled DM'] },
        vitals: { pulse: 80, bp_sys: 128, bp_dia: 82, spo2: 99, temp_c: 36.9, rr: 16 },
        vitalsHistory: generateVitalsHistory('p-mohammed', 1, { pulse: 84, bp_sys: 132, bp_dia: 84, spo2: 98, temp_c: 37.0, rr: 16 }, 'stable'),
        results: [
            { id: 'res-hba1c', patientId: 'p-mohammed', name: 'HbA1c', value: '11.2', normalRange: '<7.0%', unit: '%', timestamp: new Date().toISOString(), isAbnormal: true }
        ],
        clinicalFile: { id: 'CF-p-mohammed', patientId: 'p-mohammed', status: 'signed', sections: { history: { complaints: [{ symptom: 'Weakness', duration: '1 week' }], hpi: "58M with uncontrolled DM." }, gpe: {}, systemic: {} } },
        paymentMode: 'Corporate',
        bedAssignment: { bedId: 'bed-wb-5', wardId: 'WARD-B', bedLabel: 'WB-5', assignedAt: new Date().toISOString() }
    });

    // 7. Kavya R - Waiting for Doctor
    patients.push({
        id: 'p-kavya',
        name: 'Kavya R',
        age: 22,
        gender: 'Female',
        contact: '+91 9876543216',
        status: 'Waiting for Doctor',
        registrationTime: new Date(Date.now() - 45 * 60000).toISOString(),
        chiefComplaints: [{ complaint: "Cough", durationValue: 4, durationUnit: "days" }],
        triage: { level: 'Green', reasons: ['URTI'] },
        vitals: { pulse: 88, bp_sys: 112, bp_dia: 72, spo2: 97, temp_c: 37.8, rr: 18 },
        vitalsHistory: [],
        clinicalFile: { id: 'CF-p-kavya', patientId: 'p-kavya', status: 'draft', sections: { history: { complaints: [{ symptom: 'Cough', duration: '4 days' }] }, gpe: {}, systemic: {} } },
        paymentMode: 'Cash'
    });

    // 8. Arjun P - Discharged
    patients.push({
        id: 'p-discharged',
        name: 'Arjun P',
        age: 35,
        gender: 'Male',
        contact: '+91 9876543217',
        status: 'Discharged',
        registrationTime: new Date(Date.now() - 7 * 86400000).toISOString(),
        chiefComplaints: [{ complaint: "Fever", durationValue: 3, durationUnit: "days" }],
        triage: { level: 'Green', reasons: [] },
        vitals: { pulse: 72, bp_sys: 118, bp_dia: 76, spo2: 99, temp_c: 36.6, rr: 14 },
        clinicalFile: { id: 'CF-p-discharged', patientId: 'p-discharged', status: 'signed', sections: { history: {}, gpe: {}, systemic: {} } },
        paymentMode: 'Cash'
    });

    return patients;
};

async function main() {
    console.log('🚀 Starting Firebase seeding...');

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('✅ Firebase initialized');

    // Clear existing patients
    console.log('🗑️  Clearing existing patients...');
    const patientsRef = collection(db, 'patients');
    const existingDocs = await getDocs(patientsRef);
    for (const docSnapshot of existingDocs.docs) {
        await deleteDoc(doc(db, 'patients', docSnapshot.id));
    }
    console.log(`   Deleted ${existingDocs.size} existing patients`);

    // Generate and seed new patients
    const patients = generateDemoPatients();
    console.log(`📝 Seeding ${patients.length} demo patients...`);

    for (const patient of patients) {
        const sanitized = sanitizeForFirestore(patient);
        await setDoc(doc(db, 'patients', patient.id), sanitized);
        console.log(`   ✓ ${patient.name} (${patient.id})`);
    }

    console.log('\n✅ Firebase seeding complete!');
    console.log(`   ${patients.length} patients added to Firestore`);
    process.exit(0);
}

main().catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
});
