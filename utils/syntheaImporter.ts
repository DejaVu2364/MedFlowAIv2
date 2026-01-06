import { Patient, VitalsMeasurements, ClinicalFile, VitalsRecord, Order, Result } from '../types';

const INDIAN_NAMES_MALE = [
    "Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Reyansh", "Muhammad", "Krishna", "Ishaan", "Shaurya",
    "Atharv", "Advik", "Pranav", "Advaith", "Ayaan", "Dhruv", "Kabir", "Riyan", "Kian", "Aryan"
];

const INDIAN_NAMES_FEMALE = [
    "Saanvi", "Anya", "Aadhya", "Aaradhya", "Ananya", "Pari", "Diya", "Myra", "Saira", "Ira",
    "Naira", "Aahna", "Keya", "Siya", "Riya", "Vanya", "Misha", "Zara", "Fatima", "Kavya"
];

const SURNAMES = [
    "Patel", "Sharma", "Singh", "Kumar", "Gupta", "Reddy", "Rao", "Nair", "Iyer", "Khan",
    "Gowda", "Das", "Mukherjee", "Banerjee", "Verma", "Mehta", "Chopra", "Desai", "Joshi", "Bhat"
];

// Helper: Generate vitals history for a patient
const generateVitalsHistory = (patientId: string, days: number, baseVitals: VitalsMeasurements, trend: 'stable' | 'improving' | 'worsening'): VitalsRecord[] => {
    const history: VitalsRecord[] = [];
    const now = Date.now();

    for (let day = days; day >= 0; day--) {
        // 4 readings per day (every 6 hours)
        for (let reading = 0; reading < 4; reading++) {
            const timestamp = now - (day * 86400000) - (reading * 6 * 3600000);

            // Calculate trend factor
            let factor = 1;
            if (trend === 'improving') {
                factor = 1 - (days - day) / (days * 2); // Gradually normalize
            } else if (trend === 'worsening') {
                factor = 1 + (days - day) / (days * 3); // Gradually worsen
            }

            // Add randomness
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

// Helper: Deep copy to avoid shared references
const getEmptyClinicalFile = (patientId: string): ClinicalFile => ({
    id: `CF-${patientId}`,
    patientId: patientId,
    status: 'draft',
    aiSuggestions: {},
    sections: {
        history: { complaints: [], hpi: '', associated_symptoms: [], allergy_history: [], review_of_systems: {} },
        gpe: { flags: { pallor: false, icterus: false, cyanosis: false, clubbing: false, lymphadenopathy: false, edema: false } },
        systemic: {}
    }
});

export const generateSyntheaData = (): Patient[] => {
    const patients: Patient[] = [];

    // --- 1. Amitabh B (Revenue Risk + Full Clinical Demo) ---
    const amitabhFile = getEmptyClinicalFile('p-amitabh');
    amitabhFile.status = 'signed';
    amitabhFile.sections.history = {
        complaints: [{ symptom: 'Head Injury', duration: '2 hours' }],
        hpi: "45M brought by relatives after RTA. Alleged fall from motorcycle while going to work. +LOC for ~2 minutes at scene. Regained consciousness spontaneously. C/o headache, nausea x1 episode. No ENT bleed, no seizures. O/E: 5cm forehead laceration requiring suturing.",
        associated_symptoms: ['nausea', 'headache', 'brief LOC'],
        past_medical_history: "Known Hypertensive on Amlodipine 5mg OD for 3 years. No DM.",
        past_surgical_history: "Appendicectomy 2010",
        drug_history: "Amlodipine 5mg OD, Aspirin 75mg OD",
        allergy_history: [{ substance: 'Sulfa drugs', reaction: 'Urticaria', severity: 'Moderate' }],
        family_history: "Father: DM2, Mother: Hypertension, No FH of stroke/seizures",
        personal_social_history: "Non-smoker, occasional alcohol (social), works as accountant",
    };
    amitabhFile.sections.gpe = {
        vitals: { pulse: 88, bp_sys: 150, bp_dia: 92, spo2: 97, temp_c: 37.1, rr: 18 },
        general_appearance: 'ill',
        build: 'normal',
        hydration: 'normal',
        flags: { pallor: false, icterus: false, cyanosis: false, clubbing: false, lymphadenopathy: false, edema: false },
        height_cm: 172,
        weight_kg: 78,
        bmi: 26.4,
        remarks: "Laceration over left forehead, 5cm x 0.5cm, actively oozing. Tender over left parietal region. No step deformity.",
    };
    amitabhFile.sections.systemic = {
        cns: { summary: "GCS 15/15 (E4V5M6). Pupils 3mm PEARL. No neck stiffness. No focal neurological deficit. Cranial nerves intact." },
    };

    const amitabh: Patient = {
        id: 'p-amitabh',
        name: 'Amitabh B',
        age: 45,
        gender: 'Male',
        contact: '+91 9876543210',
        status: 'In Treatment',
        registrationTime: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
        chiefComplaints: [{ complaint: "Head Injury", durationValue: 2, durationUnit: "hours" }],
        aiTriage: { department: 'Emergency', suggested_triage: 'Yellow', confidence: 0.85, fromCache: false },
        triage: { level: 'Yellow', reasons: ['Head Trauma', 'LOC History'] },
        vitals: { pulse: 82, bp_sys: 138, bp_dia: 88, spo2: 98, temp_c: 36.9, rr: 16 },
        vitalsHistory: generateVitalsHistory('p-amitabh', 3, { pulse: 88, bp_sys: 150, bp_dia: 92, spo2: 97, temp_c: 37.1, rr: 18 }, 'improving'),
        timeline: [],
        orders: [
            {
                orderId: 'ord-ct-head',
                patientId: 'p-amitabh',
                category: 'investigation',
                subType: 'imaging',
                label: 'CT Brain Plain',
                status: 'completed',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 2.9 * 86400000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: 'Head injury with LOC requires CT to rule out intracranial bleed' },
                priority: 'urgent',
                payload: {}
            },
            {
                orderId: 'ord-suturing',
                patientId: 'p-amitabh',
                category: 'procedure',
                subType: 'minor',
                label: 'Wound Suturing - Forehead Laceration',
                status: 'completed',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 2.9 * 86400000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: null },
                priority: 'urgent',
                payload: {}
            },
            {
                orderId: 'ord-analgesia',
                patientId: 'p-amitabh',
                category: 'medication',
                subType: 'analgesic',
                label: 'Tab Paracetamol 650mg TDS',
                status: 'sent',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 2.8 * 86400000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: null },
                priority: 'routine',
                payload: {}
            }
        ],
        results: [
            {
                id: 'res-ct',
                patientId: 'p-amitabh',
                name: 'CT Brain Plain',
                value: 'No intracranial hemorrhage. No skull fracture. Soft tissue swelling left frontal region.',
                normalRange: 'N/A',
                unit: '',
                timestamp: new Date(Date.now() - 2.5 * 86400000).toISOString(),
                isAbnormal: false
            }
        ],
        clinicalFile: amitabhFile,
        activeProblems: [
            { id: 'prob-1', description: 'Closed Head Injury', status: 'monitor' },
            { id: 'prob-2', description: 'Forehead Laceration (sutured)', status: 'improving' },
            { id: 'prob-3', description: 'Hypertension - On Amlodipine', status: 'monitor' }
        ],
        rounds: [],
        paymentMode: 'Insurance',
        insuranceInfo: {
            provider: 'Star Health',
            policyNumber: 'STH-2024-78901',
            roomRentCap: 3000,
            overallCap: 500000
        },
        admissionDate: new Date(Date.now() - 3 * 86400000).toISOString(),
        bedAssignment: {
            bedId: 'bed-wa-1',
            wardId: 'WARD-A',
            bedLabel: 'WA-1',
            assignedAt: new Date(Date.now() - 3 * 86400000).toISOString()
        }
    };
    patients.push(amitabh);

    // --- 2. Sania M (Bed Block - Discharge Ready Demo) ---
    const saniaFile = getEmptyClinicalFile('p-sania');
    saniaFile.status = 'signed';
    saniaFile.sections.history = {
        complaints: [{ symptom: 'Fever', duration: '5 days' }],
        hpi: "28F admitted 5 days back with high-grade fever, body ache, and headache. Diagnosed with Dengue Fever based on NS1 positivity. Managed conservatively with IV fluids and antipyretics. Platelets dropped to 45,000 on day 3, now recovered to 1.2 lakh.",
        associated_symptoms: ['headache', 'body ache', 'retro-orbital pain'],
        past_medical_history: "No significant PMH",
        drug_history: "None regular",
        allergy_history: [],
        family_history: "No significant FH",
        personal_social_history: "Software engineer, non-smoker",
    };
    saniaFile.sections.gpe = {
        vitals: { pulse: 76, bp_sys: 110, bp_dia: 70, spo2: 99, temp_c: 36.8, rr: 16 },
        general_appearance: 'well',
        build: 'normal',
        hydration: 'normal',
        flags: { pallor: false, icterus: false, cyanosis: false, clubbing: false, lymphadenopathy: false, edema: false },
        remarks: "Afebrile, no rash, no petechiae",
    };

    const sania: Patient = {
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
        orders: [
            {
                orderId: 'ord-ns1',
                patientId: 'p-sania',
                category: 'investigation',
                subType: 'lab',
                label: 'Dengue NS1 Antigen',
                status: 'completed',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: null },
                priority: 'urgent',
                payload: {}
            },
            {
                orderId: 'ord-cbc',
                patientId: 'p-sania',
                category: 'investigation',
                subType: 'lab',
                label: 'Complete Blood Count',
                status: 'completed',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: null },
                priority: 'urgent',
                payload: {}
            }
        ],
        results: [
            {
                id: 'res-ns1',
                patientId: 'p-sania',
                name: 'Dengue NS1 Antigen',
                value: 'POSITIVE',
                normalRange: 'Negative',
                unit: '',
                timestamp: new Date(Date.now() - 4.8 * 86400000).toISOString(),
                isAbnormal: true
            },
            {
                id: 'res-platelet-1',
                patientId: 'p-sania',
                name: 'Platelet Count',
                value: '45,000',
                normalRange: '1.5-4.0 lakh',
                unit: '/μL',
                timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
                isAbnormal: true
            },
            {
                id: 'res-platelet-2',
                patientId: 'p-sania',
                name: 'Platelet Count',
                value: '1,20,000',
                normalRange: '1.5-4.0 lakh',
                unit: '/μL',
                timestamp: new Date(Date.now() - 0.5 * 86400000).toISOString(),
                isAbnormal: false
            }
        ],
        clinicalFile: saniaFile,
        rounds: [],
        dischargeSummary: {
            id: 'DS-SANIA',
            patientId: 'p-sania',
            doctorId: 'doc-1',
            status: 'finalized',
            generatedAt: new Date().toISOString(),
            finalizedAt: new Date().toISOString(),
            finalDiagnosis: 'Dengue Fever (NS1 Positive)',
            briefHistory: 'Fever for 5 days with thrombocytopenia',
            courseInHospital: 'Managed conservatively. Platelets recovered from 45K to 1.2L.',
            treatmentGiven: 'IV fluids, Paracetamol, Platelet monitoring',
            investigationsSummary: 'NS1: Positive, Platelets: 1.2 lakh (recovered)',
            conditionAtDischarge: 'Stable, afebrile for 48 hours',
            dischargeMeds: [{ name: 'Paracetamol 650mg', dosage: '650mg', frequency: 'SOS', duration: '5 days', instructions: 'For fever above 100F' }],
            dietAdvice: 'Papaya leaf juice, plenty of fluids',
            activityAdvice: 'Rest for 1 week, avoid strenuous activity',
            followUpInstructions: 'Review in 1 week with CBC',
            emergencyWarnings: 'Return if: bleeding gums, blood in stool/urine, severe abdominal pain, persistent vomiting'
        },
        paymentMode: 'Insurance',
        insuranceInfo: {
            provider: 'HDFC Ergo',
            policyNumber: 'HDFC-2024-12345',
            roomRentCap: 2500,
            overallCap: 300000
        },
        admissionDate: new Date(Date.now() - 5 * 86400000).toISOString(),
        activeProblems: [
            { id: 'prob-s1', description: 'Dengue Fever - Recovered', status: 'improving' }
        ],
        handoverSummary: 'ISBAR: Sania M, 28F. Dengue Fever, recovering. Platelets recovered to 1.2L. Afebrile 48hrs. Ready for discharge.'
        // No bed assignment - patient is discharge ready, bed freed
    };
    patients.push(sania);

    // --- 3. Vikram S (TPA Risk - Unjustified Expensive Antibiotic) ---
    const vikramFile = getEmptyClinicalFile('p-vikram');
    vikramFile.status = 'signed';
    vikramFile.sections.history = {
        complaints: [{ symptom: 'Fever', duration: '3 days' }],
        hpi: "52M admitted with fever for 3 days. Started on antibiotics.",
        associated_symptoms: ['chills', 'mild cough'],
        past_medical_history: "Type 2 DM on Metformin, HTN on Telmisartan",
        drug_history: "Metformin 500mg BD, Telmisartan 40mg OD",
        allergy_history: [{ substance: 'Penicillin', reaction: 'Rash', severity: 'Moderate' }],
        family_history: "Mother: DM2",
        personal_social_history: "Businessman, occasional smoker (5-10/day)",
    };
    vikramFile.sections.gpe = {
        vitals: { pulse: 102, bp_sys: 134, bp_dia: 86, spo2: 96, temp_c: 38.5, rr: 20 },
        general_appearance: 'ill',
        build: 'obese',
        hydration: 'mild',
        flags: { pallor: false, icterus: false, cyanosis: false, clubbing: false, lymphadenopathy: false, edema: false },
        height_cm: 170,
        weight_kg: 92,
        bmi: 31.8,
        remarks: "Febrile, toxic look, mild dehydration",
    };
    vikramFile.sections.systemic = {
        rs: { summary: "Bilateral air entry+, few scattered rhonchi. No crepts." },
    };

    const vikram: Patient = {
        id: 'p-vikram',
        name: 'Vikram S',
        age: 52,
        gender: 'Male',
        contact: '+91 9876543212',
        status: 'In Treatment',
        registrationTime: new Date(Date.now() - 2 * 86400000).toISOString(),
        chiefComplaints: [{ complaint: "Fever", durationValue: 3, durationUnit: "days" }],
        aiTriage: { department: 'General Medicine', suggested_triage: 'Yellow', confidence: 0.8, fromCache: false },
        triage: { level: 'Yellow', reasons: ['Infection', 'High-grade Fever'] },
        vitals: { pulse: 98, bp_sys: 128, bp_dia: 82, spo2: 97, temp_c: 37.8, rr: 18 },
        vitalsHistory: generateVitalsHistory('p-vikram', 2, { pulse: 102, bp_sys: 134, bp_dia: 86, spo2: 96, temp_c: 38.5, rr: 20 }, 'improving'),
        timeline: [],
        results: [],
        clinicalFile: vikramFile,
        rounds: [],
        orders: [
            {
                orderId: 'ord-meropenem',
                patientId: 'p-vikram',
                category: 'medication',
                subType: 'antibiotic',
                label: 'Inj. Meropenem 1gm IV TDS',
                status: 'sent',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 1.5 * 86400000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: null },
                priority: 'routine',
                payload: {}
            },
            {
                orderId: 'ord-blood-culture',
                patientId: 'p-vikram',
                category: 'investigation',
                subType: 'lab',
                label: 'Blood Culture & Sensitivity',
                status: 'sent',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 1.5 * 86400000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: null },
                priority: 'urgent',
                payload: {}
            }
        ],
        paymentMode: 'Insurance',
        insuranceInfo: {
            provider: 'ICICI Lombard',
            policyNumber: 'ICICI-2024-56789',
            roomRentCap: 4000,
            overallCap: 700000
        },
        admissionDate: new Date(Date.now() - 2 * 86400000).toISOString(),
        bedAssignment: {
            bedId: 'bed-wa-3',
            wardId: 'WARD-A',
            bedLabel: 'WA-3',
            assignedAt: new Date(Date.now() - 2 * 86400000).toISOString()
        }
    };
    patients.push(vikram);

    // --- 4. Rahul D (Critical - ICU Patient) ---
    const rahulFile = getEmptyClinicalFile('p-rahul');
    rahulFile.status = 'signed';
    rahulFile.sections.history = {
        complaints: [{ symptom: 'Chest Pain', duration: '30 minutes' }],
        hpi: "65M brought to ER with sudden onset central chest pain radiating to left arm for 30 minutes. Associated with sweating and nausea. Pain is crushing in nature, 8/10 severity. No relief with rest.",
        associated_symptoms: ['sweating', 'nausea', 'left arm pain', 'breathlessness'],
        past_medical_history: "Known DM2 for 10 years, HTN for 8 years. Previous CABG 5 years back.",
        past_surgical_history: "CABG x3 (2019)",
        drug_history: "Metformin 500mg BD, Glimepiride 2mg OD, Atorvastatin 40mg OD, Aspirin 75mg OD, Metoprolol 25mg BD",
        allergy_history: [],
        family_history: "Father: Died of MI at 58, Brother: CAD",
        personal_social_history: "Ex-smoker (quit 5 years), retired banker",
    };
    rahulFile.sections.gpe = {
        vitals: { pulse: 110, bp_sys: 95, bp_dia: 62, spo2: 89, temp_c: 37.2, rr: 28 },
        general_appearance: 'toxic',
        build: 'normal',
        hydration: 'normal',
        flags: { pallor: true, icterus: false, cyanosis: false, clubbing: false, lymphadenopathy: false, edema: true },
        remarks: "Cold extremities, diaphoretic, JVP raised",
    };
    rahulFile.sections.systemic = {
        cvs: { summary: "S1S2 +, soft S3 gallop. No murmur. Tachycardia present." },
        rs: { summary: "Bilateral basal crepitations. Reduced air entry bases." },
    };

    const rahul: Patient = {
        id: 'p-rahul',
        name: 'Rahul D',
        age: 65,
        gender: 'Male',
        contact: '+91 9876543213',
        status: 'In Treatment',
        registrationTime: new Date(Date.now() - 4 * 3600000).toISOString(), // 4 hours ago
        chiefComplaints: [{ complaint: "Chest Pain", durationValue: 1, durationUnit: "hours" }],
        aiTriage: { department: 'Emergency', suggested_triage: 'Red', confidence: 0.95, fromCache: false },
        triage: { level: 'Red', reasons: ['Unstable Vitals', 'Hypotension', 'ACS Criteria'] },
        vitals: { pulse: 98, bp_sys: 102, bp_dia: 68, spo2: 94, temp_c: 37.0, rr: 22 },
        vitalsHistory: generateVitalsHistory('p-rahul', 0, { pulse: 120, bp_sys: 90, bp_dia: 60, spo2: 88, temp_c: 37.2, rr: 30 }, 'improving'),
        timeline: [],
        orders: [
            {
                orderId: 'ord-ecg',
                patientId: 'p-rahul',
                category: 'investigation',
                subType: 'diagnostic',
                label: '12-Lead ECG',
                status: 'completed',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 3.5 * 3600000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: 'ACS workup' },
                priority: 'STAT',
                payload: {}
            },
            {
                orderId: 'ord-troponin',
                patientId: 'p-rahul',
                category: 'investigation',
                subType: 'lab',
                label: 'Troponin I (High Sensitivity)',
                status: 'completed',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 3.5 * 3600000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: null },
                priority: 'STAT',
                payload: {}
            },
            {
                orderId: 'ord-heparin',
                patientId: 'p-rahul',
                category: 'medication',
                subType: 'anticoagulant',
                label: 'Inj. Enoxaparin 60mg SC BD',
                status: 'sent',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: null },
                priority: 'STAT',
                payload: {}
            }
        ],
        results: [
            {
                id: 'res-ecg',
                patientId: 'p-rahul',
                name: '12-Lead ECG',
                value: 'ST elevation V1-V4, Q waves in leads II, III, aVF (old inferior MI)',
                normalRange: 'Normal sinus rhythm',
                unit: '',
                timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
                isAbnormal: true
            },
            {
                id: 'res-trop',
                patientId: 'p-rahul',
                name: 'Troponin I',
                value: '2.8',
                normalRange: '<0.04 ng/mL',
                unit: 'ng/mL',
                timestamp: new Date(Date.now() - 2.5 * 3600000).toISOString(),
                isAbnormal: true
            }
        ],
        clinicalFile: rahulFile,
        activeProblems: [
            { id: 'prob-r1', description: 'Acute Anterior STEMI', status: 'urgent' },
            { id: 'prob-r2', description: 'Cardiogenic Shock', status: 'urgent' },
            { id: 'prob-r3', description: 'Type 2 DM', status: 'monitor' }
        ],
        handoverSummary: 'ISBAR: Rahul D, 65M. STEMI with cardiogenic shock. On inotropes. Post-primary PCI. Critical - ICU care.',
        rounds: [],
        paymentMode: 'Cash',
        admissionDate: new Date(Date.now() - 4 * 3600000).toISOString(),
        bedAssignment: {
            bedId: 'bed-icu-1',
            wardId: 'ICU',
            bedLabel: 'ICU-1',
            assignedAt: new Date(Date.now() - 3.5 * 3600000).toISOString()
        }
    };
    patients.push(rahul);

    // --- 5. Priya K (New Admission - Waiting for Triage) ---
    const priyaFile = getEmptyClinicalFile('p-priya');
    priyaFile.sections.history = {
        complaints: [{ symptom: 'Abdominal Pain', duration: '6 hours' }],
        hpi: "32F presents with acute onset epigastric pain for 6 hours. Pain is burning in nature, radiating to back. Associated with nausea and 2 episodes of vomiting. No fever, no diarrhea.",
        associated_symptoms: ['nausea', 'vomiting', 'epigastric tenderness'],
        past_medical_history: "GERD on PPI, No DM/HTN",
        drug_history: "Pantoprazole 40mg OD",
        allergy_history: [],
        family_history: "No significant FH",
        personal_social_history: "Homemaker, non-smoker",
    };
    priyaFile.sections.gpe = {
        vitals: { pulse: 92, bp_sys: 124, bp_dia: 78, spo2: 99, temp_c: 37.3, rr: 18 },
        general_appearance: 'ill',
        build: 'normal',
        hydration: 'mild',
        flags: { pallor: false, icterus: false, cyanosis: false, clubbing: false, lymphadenopathy: false, edema: false },
        remarks: "Tender epigastrium, no guarding, no rigidity",
    };

    const priya: Patient = {
        id: 'p-priya',
        name: 'Priya K',
        age: 32,
        gender: 'Female',
        contact: '+91 9876543214',
        status: 'Waiting for Triage',
        registrationTime: new Date(Date.now() - 30 * 60000).toISOString(), // 30 min ago
        chiefComplaints: [{ complaint: "Abdominal Pain", durationValue: 6, durationUnit: "hours" }],
        aiTriage: { department: 'General Medicine', suggested_triage: 'Yellow', confidence: 0.75, fromCache: false },
        triage: { level: 'None', reasons: [] },
        vitals: { pulse: 92, bp_sys: 124, bp_dia: 78, spo2: 99, temp_c: 37.3, rr: 18 },
        vitalsHistory: [],
        timeline: [],
        orders: [],
        results: [],
        clinicalFile: priyaFile,
        rounds: [],
        paymentMode: 'Cash'
    };
    patients.push(priya);

    // --- 6. Mohammed A (General Ward - Stable) ---
    const mohammedFile = getEmptyClinicalFile('p-mohammed');
    mohammedFile.status = 'signed';
    mohammedFile.sections.history = {
        complaints: [{ symptom: 'Weakness', duration: '1 week' }],
        hpi: "58M presents with generalized weakness for 1 week. Also complains of increased thirst and frequent urination. Known diabetic, irregular with medications.",
        associated_symptoms: ['polyuria', 'polydipsia', 'weight loss'],
        past_medical_history: "DM2 for 12 years, on OHA. Irregular compliance.",
        drug_history: "Metformin 500mg BD (irregular)",
        allergy_history: [],
        family_history: "Father: DM2",
        personal_social_history: "Shop owner, non-smoker",
    };
    mohammedFile.sections.gpe = {
        vitals: { pulse: 84, bp_sys: 132, bp_dia: 84, spo2: 98, temp_c: 37.0, rr: 16 },
        general_appearance: 'fair',
        build: 'normal',
        hydration: 'mild',
        flags: { pallor: false, icterus: false, cyanosis: false, clubbing: false, lymphadenopathy: false, edema: false },
        remarks: "Dry tongue, reduced skin turgor",
    };

    const mohammed: Patient = {
        id: 'p-mohammed',
        name: 'Mohammed A',
        age: 58,
        gender: 'Male',
        contact: '+91 9876543215',
        status: 'In Treatment',
        registrationTime: new Date(Date.now() - 1 * 86400000).toISOString(),
        chiefComplaints: [{ complaint: "Weakness", durationValue: 7, durationUnit: "days" }],
        aiTriage: { department: 'General Medicine', suggested_triage: 'Green', confidence: 0.85, fromCache: false },
        triage: { level: 'Green', reasons: ['Uncontrolled DM'] },
        vitals: { pulse: 80, bp_sys: 128, bp_dia: 82, spo2: 99, temp_c: 36.9, rr: 16 },
        vitalsHistory: generateVitalsHistory('p-mohammed', 1, { pulse: 84, bp_sys: 132, bp_dia: 84, spo2: 98, temp_c: 37.0, rr: 16 }, 'stable'),
        timeline: [],
        orders: [
            {
                orderId: 'ord-hba1c',
                patientId: 'p-mohammed',
                category: 'investigation',
                subType: 'lab',
                label: 'HbA1c',
                status: 'completed',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 0.9 * 86400000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: null },
                priority: 'routine',
                payload: {}
            }
        ],
        results: [
            {
                id: 'res-hba1c',
                patientId: 'p-mohammed',
                name: 'HbA1c',
                value: '11.2',
                normalRange: '<7.0%',
                unit: '%',
                timestamp: new Date(Date.now() - 0.7 * 86400000).toISOString(),
                isAbnormal: true
            },
            {
                id: 'res-fbs',
                patientId: 'p-mohammed',
                name: 'Fasting Blood Sugar',
                value: '312',
                normalRange: '70-100 mg/dL',
                unit: 'mg/dL',
                timestamp: new Date(Date.now() - 0.9 * 86400000).toISOString(),
                isAbnormal: true
            }
        ],
        clinicalFile: mohammedFile,
        rounds: [],
        paymentMode: 'Corporate',
        admissionDate: new Date(Date.now() - 1 * 86400000).toISOString(),
        bedAssignment: {
            bedId: 'bed-wb-5',
            wardId: 'WARD-B',
            bedLabel: 'WB-5',
            assignedAt: new Date(Date.now() - 1 * 86400000).toISOString()
        }
    };
    patients.push(mohammed);

    // --- 7. Kavya R (Pediatric-age - Waiting for Doctor) ---
    const kavyaFile = getEmptyClinicalFile('p-kavya');
    kavyaFile.sections.history = {
        complaints: [{ symptom: 'Cough', duration: '4 days' }],
        hpi: "22F presents with dry cough for 4 days, now becoming productive. Associated with low-grade fever and sore throat. No breathlessness, no chest pain.",
        associated_symptoms: ['fever', 'sore throat', 'runny nose'],
        past_medical_history: "Childhood asthma, currently not on inhalers",
        drug_history: "None regular",
        allergy_history: [{ substance: 'Dust', reaction: 'Sneezing', severity: 'Mild' }],
        family_history: "Mother: Asthma",
        personal_social_history: "College student, non-smoker",
    };
    kavyaFile.sections.gpe = {
        vitals: { pulse: 88, bp_sys: 112, bp_dia: 72, spo2: 97, temp_c: 37.8, rr: 18 },
        general_appearance: 'fair',
        build: 'normal',
        hydration: 'normal',
        flags: { pallor: false, icterus: false, cyanosis: false, clubbing: false, lymphadenopathy: false, edema: false },
        remarks: "Mild pharyngeal congestion",
    };

    const kavya: Patient = {
        id: 'p-kavya',
        name: 'Kavya R',
        age: 22,
        gender: 'Female',
        contact: '+91 9876543216',
        status: 'Waiting for Doctor',
        registrationTime: new Date(Date.now() - 45 * 60000).toISOString(), // 45 min ago
        chiefComplaints: [{ complaint: "Cough", durationValue: 4, durationUnit: "days" }],
        aiTriage: { department: 'General Medicine', suggested_triage: 'Green', confidence: 0.9, fromCache: false },
        triage: { level: 'Green', reasons: ['URTI symptoms'] },
        vitals: { pulse: 88, bp_sys: 112, bp_dia: 72, spo2: 97, temp_c: 37.8, rr: 18 },
        vitalsHistory: [],
        timeline: [],
        orders: [],
        results: [],
        clinicalFile: kavyaFile,
        rounds: [],
        paymentMode: 'Cash'
    };
    patients.push(kavya);

    // --- 8. Retired Patient - Discharged (for stats) ---
    const dischargedFile = getEmptyClinicalFile('p-discharged');
    dischargedFile.status = 'signed';

    const discharged: Patient = {
        id: 'p-discharged',
        name: 'Arjun P',
        age: 35,
        gender: 'Male',
        contact: '+91 9876543217',
        status: 'Discharged',
        registrationTime: new Date(Date.now() - 7 * 86400000).toISOString(),
        chiefComplaints: [{ complaint: "Fever", durationValue: 3, durationUnit: "days" }],
        aiTriage: { department: 'General Medicine', suggested_triage: 'Green', confidence: 0.85, fromCache: false },
        triage: { level: 'Green', reasons: [] },
        vitals: { pulse: 72, bp_sys: 118, bp_dia: 76, spo2: 99, temp_c: 36.6, rr: 14 },
        vitalsHistory: [],
        timeline: [],
        orders: [],
        results: [],
        clinicalFile: dischargedFile,
        rounds: [],
        paymentMode: 'Cash'
    };
    patients.push(discharged);

    // --- 9. Robert Johnson (COPD Exacerbation - Critical) ---
    const robertFile = getEmptyClinicalFile('p-robert');
    robertFile.status = 'signed';
    robertFile.sections.history = {
        complaints: [{ symptom: 'Breathlessness', duration: '2 days' }],
        hpi: "68M known COPD patient with acute exacerbation. Severe dyspnea at rest, unable to complete sentences. Using accessory muscles. History of 3 admissions in past year for similar episodes.",
        associated_symptoms: ['wheezing', 'productive cough', 'chest tightness'],
        past_medical_history: "COPD GOLD Stage III, Ex-smoker (40 pack years), stopped 5 years ago",
        drug_history: "Tiotropium inhaler, Salbutamol PRN, Budesonide inhaler",
        allergy_history: [],
        family_history: "Father: COPD",
        personal_social_history: "Retired factory worker, ex-smoker",
    };
    robertFile.sections.gpe = {
        vitals: { pulse: 112, bp_sys: 145, bp_dia: 92, spo2: 88, temp_c: 37.5, rr: 32 },
        general_appearance: 'toxic',
        build: 'cachectic',
        hydration: 'normal',
        flags: { pallor: false, icterus: false, cyanosis: true, clubbing: true, lymphadenopathy: false, edema: true },
        remarks: "Barrel chest, pursed lip breathing, accessory muscle use",
    };

    const robert: Patient = {
        id: 'p-robert',
        name: 'Robert Johnson',
        age: 68,
        gender: 'Male',
        contact: '+91 9876543218',
        status: 'In Treatment',
        registrationTime: new Date(Date.now() - 6 * 3600000).toISOString(),
        chiefComplaints: [{ complaint: "Breathlessness", durationValue: 2, durationUnit: "days" }],
        aiTriage: { department: 'Pulmonology', suggested_triage: 'Red', confidence: 0.92, fromCache: false },
        triage: { level: 'Red', reasons: ['Hypoxia', 'Respiratory Distress'] },
        vitals: { pulse: 108, bp_sys: 140, bp_dia: 88, spo2: 91, temp_c: 37.3, rr: 28 },
        vitalsHistory: generateVitalsHistory('p-robert', 0, { pulse: 118, bp_sys: 150, bp_dia: 95, spo2: 85, temp_c: 37.8, rr: 36 }, 'improving'),
        timeline: [],
        orders: [
            {
                orderId: 'ord-neb',
                patientId: 'p-robert',
                category: 'medication',
                subType: 'bronchodilator',
                label: 'Nebulization - Salbutamol + Ipratropium',
                status: 'completed',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: null },
                priority: 'urgent',
                payload: {}
            }
        ],
        results: [
            {
                id: 'res-abg',
                patientId: 'p-robert',
                name: 'ABG',
                value: 'pH 7.32, pCO2 55, pO2 58, HCO3 28',
                normalRange: 'pH 7.35-7.45',
                unit: '',
                timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
                isAbnormal: true
            }
        ],
        clinicalFile: robertFile,
        activeProblems: [
            { id: 'prob-rob1', description: 'COPD Exacerbation', status: 'urgent' },
            { id: 'prob-rob2', description: 'Pneumonia', status: 'urgent' }
        ],
        rounds: [],
        paymentMode: 'Insurance',
        insuranceInfo: { provider: 'Max Bupa', policyNumber: 'MB-2024-9999', roomRentCap: 5000, overallCap: 1000000 },
        admissionDate: new Date(Date.now() - 6 * 3600000).toISOString(),
        bedAssignment: { bedId: 'bed-icu-2', wardId: 'ICU', bedLabel: 'ICU-2', assignedAt: new Date(Date.now() - 5 * 3600000).toISOString() }
    };
    patients.push(robert);

    // --- 10. Ananya S (Pregnancy - High Risk) ---
    const ananyaFile = getEmptyClinicalFile('p-ananya');
    ananyaFile.sections.history = {
        complaints: [{ symptom: 'Abdominal Pain', duration: '4 hours' }],
        hpi: "28F G2P1, 34 weeks pregnant with intermittent lower abdominal pain. Reports decreased fetal movements since morning. Previous LSCS for fetal distress.",
        associated_symptoms: ['reduced fetal movements', 'mild contractions'],
        past_medical_history: "GDM on diet control, Previous C-section",
        drug_history: "Iron, Calcium, Folic acid supplements",
        allergy_history: [],
        family_history: "Mother: DM2",
        personal_social_history: "Homemaker, non-smoker",
    };

    const ananya: Patient = {
        id: 'p-ananya',
        name: 'Ananya S',
        age: 28,
        gender: 'Female',
        contact: '+91 9876543219',
        status: 'In Treatment',
        registrationTime: new Date(Date.now() - 3 * 3600000).toISOString(),
        chiefComplaints: [{ complaint: "Abdominal Pain", durationValue: 4, durationUnit: "hours" }],
        aiTriage: { department: 'Obstetrics', suggested_triage: 'Yellow', confidence: 0.88, fromCache: false },
        triage: { level: 'Yellow', reasons: ['High-risk pregnancy', 'Reduced fetal movements'] },
        vitals: { pulse: 92, bp_sys: 128, bp_dia: 82, spo2: 99, temp_c: 37.0, rr: 18 },
        vitalsHistory: [],
        timeline: [],
        orders: [],
        results: [],
        clinicalFile: ananyaFile,
        activeProblems: [
            { id: 'prob-ana1', description: 'High-risk Pregnancy at 34 weeks', status: 'monitor' },
            { id: 'prob-ana2', description: 'Gestational DM', status: 'monitor' }
        ],
        rounds: [],
        paymentMode: 'Insurance',
        insuranceInfo: { provider: 'Star Health', policyNumber: 'SH-2024-MAT', roomRentCap: 3000, overallCap: 500000 },
        admissionDate: new Date(Date.now() - 3 * 3600000).toISOString(),
        bedAssignment: { bedId: 'bed-ldw-1', wardId: 'LDR', bedLabel: 'LDR-1', assignedAt: new Date(Date.now() - 2.5 * 3600000).toISOString() }
    };
    patients.push(ananya);

    // --- 11. Suresh K (Stroke - Neuro ICU) ---
    const sureshFile = getEmptyClinicalFile('p-suresh');
    sureshFile.status = 'signed';
    sureshFile.sections.history = {
        complaints: [{ symptom: 'Sudden weakness', duration: '2 hours' }],
        hpi: "62M brought with sudden onset right-sided weakness and slurred speech 2 hours ago. Wife noticed he couldn't lift his right arm while having breakfast. Known HTN, poor compliance.",
        associated_symptoms: ['facial droop', 'slurred speech', 'difficulty walking'],
        past_medical_history: "HTN for 10 years, non-compliant. No DM.",
        drug_history: "Amlodipine 5mg (irregular)",
        allergy_history: [],
        family_history: "Father: Stroke at 65",
        personal_social_history: "Retired teacher, smoker 20 pack years",
    };

    const suresh: Patient = {
        id: 'p-suresh',
        name: 'Suresh K',
        age: 62,
        gender: 'Male',
        contact: '+91 9876543220',
        status: 'In Treatment',
        registrationTime: new Date(Date.now() - 2.5 * 3600000).toISOString(),
        chiefComplaints: [{ complaint: "Right-sided weakness", durationValue: 2, durationUnit: "hours" }],
        aiTriage: { department: 'Neurology', suggested_triage: 'Red', confidence: 0.95, fromCache: false },
        triage: { level: 'Red', reasons: ['Stroke Window', 'Acute Neurological Deficit'] },
        vitals: { pulse: 88, bp_sys: 178, bp_dia: 105, spo2: 97, temp_c: 36.8, rr: 18 },
        vitalsHistory: [],
        timeline: [],
        orders: [
            {
                orderId: 'ord-ct-brain',
                patientId: 'p-suresh',
                category: 'investigation',
                subType: 'imaging',
                label: 'CT Brain Plain + Angiography',
                status: 'completed',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: 'Code Stroke Protocol' },
                priority: 'urgent',
                payload: {}
            }
        ],
        results: [
            {
                id: 'res-ct-stroke',
                patientId: 'p-suresh',
                name: 'CT Brain',
                value: 'Acute infarct left MCA territory. No hemorrhage.',
                normalRange: 'Normal',
                unit: '',
                timestamp: new Date(Date.now() - 1.5 * 3600000).toISOString(),
                isAbnormal: true
            }
        ],
        clinicalFile: sureshFile,
        activeProblems: [
            { id: 'prob-sur1', description: 'Acute Ischemic Stroke - Left MCA', status: 'urgent' },
            { id: 'prob-sur2', description: 'Hypertensive Emergency', status: 'urgent' }
        ],
        handoverSummary: 'ISBAR: Suresh K, 62M. Acute left MCA stroke. Post-thrombolysis. BP control ongoing. Neuro ICU.',
        rounds: [],
        paymentMode: 'Cash',
        admissionDate: new Date(Date.now() - 2.5 * 3600000).toISOString(),
        bedAssignment: { bedId: 'bed-nicu-1', wardId: 'NEURO-ICU', bedLabel: 'NICU-1', assignedAt: new Date(Date.now() - 2 * 3600000).toISOString() }
    };
    patients.push(suresh);

    // --- 12. Lakshmi D (Dialysis Patient - CKD) ---
    const lakshmiFile = getEmptyClinicalFile('p-lakshmi');
    lakshmiFile.status = 'signed';
    lakshmiFile.sections.history = {
        complaints: [{ symptom: 'Swelling', duration: '3 days' }],
        hpi: "55F CKD Stage 5 on MHD (Mon-Wed-Fri), missed last 2 sessions due to family reasons. Presents with bilateral pedal edema, facial puffiness, and mild dyspnea.",
        associated_symptoms: ['facial puffiness', 'reduced urine output', 'mild dyspnea'],
        past_medical_history: "CKD Stage 5 on dialysis, HTN, Anemia on EPO",
        drug_history: "Nifedipine 30mg OD, EPO injections, Calcium supplements",
        allergy_history: [],
        family_history: "No significant FH",
        personal_social_history: "Homemaker, vegetarian",
    };

    const lakshmi: Patient = {
        id: 'p-lakshmi',
        name: 'Lakshmi D',
        age: 55,
        gender: 'Female',
        contact: '+91 9876543221',
        status: 'In Treatment',
        registrationTime: new Date(Date.now() - 4 * 3600000).toISOString(),
        chiefComplaints: [{ complaint: "Swelling", durationValue: 3, durationUnit: "days" }],
        aiTriage: { department: 'Nephrology', suggested_triage: 'Yellow', confidence: 0.85, fromCache: false },
        triage: { level: 'Yellow', reasons: ['Missed dialysis', 'Fluid overload'] },
        vitals: { pulse: 94, bp_sys: 168, bp_dia: 98, spo2: 94, temp_c: 36.9, rr: 22 },
        vitalsHistory: [],
        timeline: [],
        orders: [
            {
                orderId: 'ord-dialysis',
                patientId: 'p-lakshmi',
                category: 'procedure',
                subType: 'dialysis',
                label: 'Emergency Hemodialysis',
                status: 'in_progress',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: null },
                priority: 'urgent',
                payload: {}
            }
        ],
        results: [
            {
                id: 'res-k',
                patientId: 'p-lakshmi',
                name: 'Serum Potassium',
                value: '6.2',
                normalRange: '3.5-5.0 mEq/L',
                unit: 'mEq/L',
                timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
                isAbnormal: true
            }
        ],
        clinicalFile: lakshmiFile,
        activeProblems: [
            { id: 'prob-lak1', description: 'CKD Stage 5 on MHD', status: 'monitor' },
            { id: 'prob-lak2', description: 'Hyperkalemia', status: 'urgent' }
        ],
        rounds: [],
        paymentMode: 'Insurance',
        insuranceInfo: { provider: 'Ayushman Bharat', policyNumber: 'AB-2024-KA', roomRentCap: 0, overallCap: 500000 },
        admissionDate: new Date(Date.now() - 4 * 3600000).toISOString(),
        bedAssignment: { bedId: 'bed-dial-1', wardId: 'DIALYSIS', bedLabel: 'DIAL-1', assignedAt: new Date(Date.now() - 3.5 * 3600000).toISOString() }
    };
    patients.push(lakshmi);

    // --- 13. Vihaan P (Pediatric - Seizure) ---
    const vihaanFile = getEmptyClinicalFile('p-vihaan');
    vihaanFile.sections.history = {
        complaints: [{ symptom: 'Seizure', duration: '1 hour' }],
        hpi: "8M brought with first episode of seizure at school. GTCS lasting 3 minutes, followed by post-ictal drowsiness. No fever, no trauma. Child was well until today.",
        associated_symptoms: ['post-ictal confusion', 'drowsiness'],
        past_medical_history: "Nil significant, vaccinations up to date",
        drug_history: "None",
        allergy_history: [],
        family_history: "Maternal uncle: Epilepsy",
        personal_social_history: "School going, normal development",
    };

    const vihaan: Patient = {
        id: 'p-vihaan',
        name: 'Vihaan P',
        age: 8,
        gender: 'Male',
        contact: '+91 9876543222',
        status: 'In Treatment',
        registrationTime: new Date(Date.now() - 90 * 60000).toISOString(),
        chiefComplaints: [{ complaint: "Seizure", durationValue: 1, durationUnit: "hours" }],
        aiTriage: { department: 'Pediatrics', suggested_triage: 'Yellow', confidence: 0.88, fromCache: false },
        triage: { level: 'Yellow', reasons: ['First seizure', 'Post-ictal state'] },
        vitals: { pulse: 98, bp_sys: 105, bp_dia: 68, spo2: 99, temp_c: 37.1, rr: 22 },
        vitalsHistory: [],
        timeline: [],
        orders: [
            {
                orderId: 'ord-eeg',
                patientId: 'p-vihaan',
                category: 'investigation',
                subType: 'diagnostic',
                label: 'EEG - Electroencephalogram',
                status: 'sent',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: 'First seizure workup' },
                priority: 'routine',
                payload: {}
            }
        ],
        results: [],
        clinicalFile: vihaanFile,
        activeProblems: [
            { id: 'prob-vih1', description: 'First episode seizure - under evaluation', status: 'monitor' }
        ],
        rounds: [],
        paymentMode: 'Cash',
        admissionDate: new Date(Date.now() - 90 * 60000).toISOString(),
        bedAssignment: { bedId: 'bed-ped-1', wardId: 'PEDIATRICS', bedLabel: 'PED-1', assignedAt: new Date(Date.now() - 60 * 60000).toISOString() }
    };
    patients.push(vihaan);

    // --- 14. Meera G (Post-op - Cholecystectomy) ---
    const meeraFile = getEmptyClinicalFile('p-meera');
    meeraFile.status = 'signed';
    meeraFile.sections.history = {
        complaints: [{ symptom: 'Post-operative care', duration: '1 day' }],
        hpi: "45F Day 1 post laparoscopic cholecystectomy for cholelithiasis. Surgery was uneventful. Tolerating liquids, pain controlled with analgesics.",
        associated_symptoms: ['mild pain at port sites'],
        past_medical_history: "Cholelithiasis, Obesity",
        drug_history: "Ursodiol 300mg BD (pre-op)",
        allergy_history: [],
        family_history: "Mother: Gallstones",
        personal_social_history: "Homemaker, vegetarian",
    };

    const meera: Patient = {
        id: 'p-meera',
        name: 'Meera G',
        age: 45,
        gender: 'Female',
        contact: '+91 9876543223',
        status: 'In Treatment',
        registrationTime: new Date(Date.now() - 1.5 * 86400000).toISOString(),
        chiefComplaints: [{ complaint: "Gallstones", durationValue: 2, durationUnit: "months" }],
        aiTriage: { department: 'Surgery', suggested_triage: 'Green', confidence: 0.9, fromCache: false },
        triage: { level: 'Green', reasons: ['Post-op Day 1', 'Stable'] },
        vitals: { pulse: 78, bp_sys: 118, bp_dia: 76, spo2: 99, temp_c: 36.8, rr: 16 },
        vitalsHistory: generateVitalsHistory('p-meera', 1, { pulse: 82, bp_sys: 122, bp_dia: 78, spo2: 98, temp_c: 37.0, rr: 18 }, 'stable'),
        timeline: [],
        orders: [
            {
                orderId: 'ord-paracetamol',
                patientId: 'p-meera',
                category: 'medication',
                subType: 'analgesic',
                label: 'Tab Paracetamol 650mg TDS',
                status: 'sent',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: null },
                priority: 'routine',
                payload: {}
            }
        ],
        results: [],
        clinicalFile: meeraFile,
        activeProblems: [
            { id: 'prob-mee1', description: 'Post Lap Cholecystectomy - Day 1', status: 'improving' }
        ],
        rounds: [],
        paymentMode: 'Insurance',
        insuranceInfo: { provider: 'New India', policyNumber: 'NI-2024-SUR', roomRentCap: 4000, overallCap: 400000 },
        admissionDate: new Date(Date.now() - 1.5 * 86400000).toISOString(),
        bedAssignment: { bedId: 'bed-surg-2', wardId: 'SURGICAL', bedLabel: 'SURG-2', assignedAt: new Date(Date.now() - 1.5 * 86400000).toISOString() }
    };
    patients.push(meera);

    // --- 15. Rajesh M (Waiting - Orthopedic consultation) ---
    const rajeshFile = getEmptyClinicalFile('p-rajesh');
    rajeshFile.sections.history = {
        complaints: [{ symptom: 'Knee Pain', duration: '2 months' }],
        hpi: "55M presents with bilateral knee pain, worse on climbing stairs. Morning stiffness for 15-20 minutes. No swelling, no redness.",
        associated_symptoms: ['stiffness', 'difficulty squatting'],
        past_medical_history: "HTN on medication, No DM",
        drug_history: "Amlodipine 5mg OD",
        allergy_history: [],
        family_history: "Father: Osteoarthritis",
        personal_social_history: "Farmer, non-smoker",
    };

    const rajesh: Patient = {
        id: 'p-rajesh',
        name: 'Rajesh M',
        age: 55,
        gender: 'Male',
        contact: '+91 9876543224',
        status: 'Waiting for Doctor',
        registrationTime: new Date(Date.now() - 60 * 60000).toISOString(),
        chiefComplaints: [{ complaint: "Knee Pain", durationValue: 2, durationUnit: "months" }],
        aiTriage: { department: 'Orthopedics', suggested_triage: 'Green', confidence: 0.85, fromCache: false },
        triage: { level: 'Green', reasons: ['Chronic joint pain'] },
        vitals: { pulse: 76, bp_sys: 138, bp_dia: 88, spo2: 99, temp_c: 36.8, rr: 16 },
        vitalsHistory: [],
        timeline: [],
        orders: [],
        results: [],
        clinicalFile: rajeshFile,
        rounds: [],
        paymentMode: 'Cash'
    };
    patients.push(rajesh);

    // --- 16. Fatima B (Asthma Attack) ---
    const fatimaFile = getEmptyClinicalFile('p-fatima');
    fatimaFile.sections.history = {
        complaints: [{ symptom: 'Wheezing', duration: '6 hours' }],
        hpi: "24F known asthmatic with acute exacerbation triggered by dust exposure during house cleaning. Unable to speak full sentences. Using rescue inhaler frequently without relief.",
        associated_symptoms: ['chest tightness', 'cough', 'breathlessness'],
        past_medical_history: "Bronchial Asthma since childhood, 2-3 attacks/year",
        drug_history: "Salbutamol inhaler PRN, Budesonide inhaler BD",
        allergy_history: [{ substance: 'Dust', reaction: 'Asthma exacerbation', severity: 'Severe' }],
        family_history: "Mother: Asthma",
        personal_social_history: "Student, non-smoker",
    };

    const fatima: Patient = {
        id: 'p-fatima',
        name: 'Fatima B',
        age: 24,
        gender: 'Female',
        contact: '+91 9876543225',
        status: 'In Treatment',
        registrationTime: new Date(Date.now() - 2 * 3600000).toISOString(),
        chiefComplaints: [{ complaint: "Wheezing", durationValue: 6, durationUnit: "hours" }],
        aiTriage: { department: 'Pulmonology', suggested_triage: 'Yellow', confidence: 0.9, fromCache: false },
        triage: { level: 'Yellow', reasons: ['Acute asthma', 'Speaking difficulty'] },
        vitals: { pulse: 108, bp_sys: 118, bp_dia: 76, spo2: 92, temp_c: 36.9, rr: 28 },
        vitalsHistory: generateVitalsHistory('p-fatima', 0, { pulse: 118, bp_sys: 122, bp_dia: 78, spo2: 88, temp_c: 37.0, rr: 32 }, 'improving'),
        timeline: [],
        orders: [
            {
                orderId: 'ord-neb-ast',
                patientId: 'p-fatima',
                category: 'medication',
                subType: 'bronchodilator',
                label: 'Nebulization - Salbutamol 2.5mg + Ipratropium',
                status: 'completed',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 1.5 * 3600000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: null },
                priority: 'urgent',
                payload: {}
            },
            {
                orderId: 'ord-steroid',
                patientId: 'p-fatima',
                category: 'medication',
                subType: 'steroid',
                label: 'Inj. Hydrocortisone 100mg IV',
                status: 'completed',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 1.5 * 3600000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: null },
                priority: 'urgent',
                payload: {}
            }
        ],
        results: [],
        clinicalFile: fatimaFile,
        activeProblems: [
            { id: 'prob-fat1', description: 'Acute Severe Asthma', status: 'urgent' }
        ],
        rounds: [],
        paymentMode: 'Cash',
        admissionDate: new Date(Date.now() - 2 * 3600000).toISOString(),
        bedAssignment: { bedId: 'bed-er-1', wardId: 'EMERGENCY', bedLabel: 'ER-1', assignedAt: new Date(Date.now() - 1.8 * 3600000).toISOString() }
    };
    patients.push(fatima);

    // --- 17. Anil T (GI Bleed) ---
    const anilFile = getEmptyClinicalFile('p-anil');
    anilFile.status = 'signed';
    anilFile.sections.history = {
        complaints: [{ symptom: 'Blood in vomit', duration: '1 day' }],
        hpi: "48M chronic alcoholic with multiple episodes of hematemesis since last night. Approximately 500ml fresh blood vomited. History of liver disease. Dark tarry stools x2.",
        associated_symptoms: ['melena', 'dizziness', 'weakness'],
        past_medical_history: "Alcoholic Liver Disease, Portal Hypertension, Previous variceal bleed 1 year ago",
        drug_history: "Propranolol 40mg BD, Lactulose",
        allergy_history: [],
        family_history: "Father: Alcoholism",
        personal_social_history: "Daily alcohol intake for 20 years",
    };

    const anil: Patient = {
        id: 'p-anil',
        name: 'Anil T',
        age: 48,
        gender: 'Male',
        contact: '+91 9876543226',
        status: 'In Treatment',
        registrationTime: new Date(Date.now() - 8 * 3600000).toISOString(),
        chiefComplaints: [{ complaint: "Hematemesis", durationValue: 1, durationUnit: "days" }],
        aiTriage: { department: 'Gastroenterology', suggested_triage: 'Red', confidence: 0.95, fromCache: false },
        triage: { level: 'Red', reasons: ['Active GI Bleed', 'Hemodynamic instability'] },
        vitals: { pulse: 112, bp_sys: 95, bp_dia: 62, spo2: 97, temp_c: 37.0, rr: 22 },
        vitalsHistory: generateVitalsHistory('p-anil', 0, { pulse: 122, bp_sys: 88, bp_dia: 58, spo2: 95, temp_c: 37.2, rr: 26 }, 'improving'),
        timeline: [],
        orders: [
            {
                orderId: 'ord-ogi',
                patientId: 'p-anil',
                category: 'procedure',
                subType: 'endoscopy',
                label: 'Emergency Upper GI Endoscopy',
                status: 'completed',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: 'Active variceal bleed' },
                priority: 'urgent',
                payload: {}
            }
        ],
        results: [
            {
                id: 'res-hb',
                patientId: 'p-anil',
                name: 'Hemoglobin',
                value: '6.8',
                normalRange: '13-17 g/dL',
                unit: 'g/dL',
                timestamp: new Date(Date.now() - 7 * 3600000).toISOString(),
                isAbnormal: true
            }
        ],
        clinicalFile: anilFile,
        activeProblems: [
            { id: 'prob-ani1', description: 'Upper GI Bleed - Variceal', status: 'urgent' },
            { id: 'prob-ani2', description: 'Decompensated Liver Disease', status: 'urgent' },
            { id: 'prob-ani3', description: 'Severe Anemia', status: 'urgent' }
        ],
        handoverSummary: 'ISBAR: Anil T, 48M. Variceal bleed post-EVL. 2 units PRBC transfused. On octreotide. ICU monitoring.',
        rounds: [],
        paymentMode: 'Cash',
        admissionDate: new Date(Date.now() - 8 * 3600000).toISOString(),
        bedAssignment: { bedId: 'bed-icu-3', wardId: 'ICU', bedLabel: 'ICU-3', assignedAt: new Date(Date.now() - 7 * 3600000).toISOString() }
    };
    patients.push(anil);

    // --- 18. Sneha R (UTI - Simple case) ---
    const snehaFile = getEmptyClinicalFile('p-sneha');
    snehaFile.sections.history = {
        complaints: [{ symptom: 'Burning urination', duration: '2 days' }],
        hpi: "26F presents with dysuria, increased frequency, and suprapubic discomfort for 2 days. No fever, no flank pain, no vaginal discharge.",
        associated_symptoms: ['frequency', 'urgency', 'suprapubic pain'],
        past_medical_history: "Previous UTI 6 months ago, treated with antibiotics",
        drug_history: "None regular",
        allergy_history: [],
        family_history: "No significant FH",
        personal_social_history: "Software engineer, married",
    };

    const sneha: Patient = {
        id: 'p-sneha',
        name: 'Sneha R',
        age: 26,
        gender: 'Female',
        contact: '+91 9876543227',
        status: 'Waiting for Doctor',
        registrationTime: new Date(Date.now() - 45 * 60000).toISOString(),
        chiefComplaints: [{ complaint: "Burning urination", durationValue: 2, durationUnit: "days" }],
        aiTriage: { department: 'General Medicine', suggested_triage: 'Green', confidence: 0.92, fromCache: false },
        triage: { level: 'Green', reasons: ['Uncomplicated UTI'] },
        vitals: { pulse: 78, bp_sys: 112, bp_dia: 72, spo2: 99, temp_c: 37.2, rr: 16 },
        vitalsHistory: [],
        timeline: [],
        orders: [],
        results: [],
        clinicalFile: snehaFile,
        rounds: [],
        paymentMode: 'Cash'
    };
    patients.push(sneha);

    // --- 19. Gopal V (Diabetic Foot) ---
    const gopalFile = getEmptyClinicalFile('p-gopal');
    gopalFile.status = 'signed';
    gopalFile.sections.history = {
        complaints: [{ symptom: 'Foot wound', duration: '2 weeks' }],
        hpi: "60M diabetic with non-healing ulcer on right foot for 2 weeks. Started as a small blister, now progressed with discharge and foul smell. Fever for 2 days.",
        associated_symptoms: ['fever', 'foul smelling discharge', 'swelling'],
        past_medical_history: "DM2 for 15 years, HTN, Peripheral neuropathy",
        drug_history: "Insulin Glargine 20U, Metformin 1g BD, Losartan 50mg OD",
        allergy_history: [],
        family_history: "Father: DM2, Amputation",
        personal_social_history: "Retired government employee",
    };

    const gopal: Patient = {
        id: 'p-gopal',
        name: 'Gopal V',
        age: 60,
        gender: 'Male',
        contact: '+91 9876543228',
        status: 'In Treatment',
        registrationTime: new Date(Date.now() - 1 * 86400000).toISOString(),
        chiefComplaints: [{ complaint: "Foot wound", durationValue: 2, durationUnit: "weeks" }],
        aiTriage: { department: 'Surgery', suggested_triage: 'Yellow', confidence: 0.88, fromCache: false },
        triage: { level: 'Yellow', reasons: ['Diabetic foot infection', 'Sepsis risk'] },
        vitals: { pulse: 96, bp_sys: 142, bp_dia: 88, spo2: 97, temp_c: 38.2, rr: 18 },
        vitalsHistory: generateVitalsHistory('p-gopal', 1, { pulse: 102, bp_sys: 148, bp_dia: 92, spo2: 96, temp_c: 38.8, rr: 20 }, 'improving'),
        timeline: [],
        orders: [
            {
                orderId: 'ord-piptaz',
                patientId: 'p-gopal',
                category: 'medication',
                subType: 'antibiotic',
                label: 'Inj. Piperacillin-Tazobactam 4.5g IV TDS',
                status: 'sent',
                createdBy: 'doc',
                createdAt: new Date(Date.now() - 0.8 * 86400000).toISOString(),
                ai_provenance: { prompt_id: null, rationale: 'Diabetic foot infection' },
                priority: 'urgent',
                payload: {}
            }
        ],
        results: [
            {
                id: 'res-wbc',
                patientId: 'p-gopal',
                name: 'WBC Count',
                value: '18,500',
                normalRange: '4000-11000 /μL',
                unit: '/μL',
                timestamp: new Date(Date.now() - 0.9 * 86400000).toISOString(),
                isAbnormal: true
            }
        ],
        clinicalFile: gopalFile,
        activeProblems: [
            { id: 'prob-gop1', description: 'Diabetic Foot Infection - Grade 3', status: 'urgent' },
            { id: 'prob-gop2', description: 'Uncontrolled DM2', status: 'monitor' }
        ],
        rounds: [],
        paymentMode: 'Insurance',
        insuranceInfo: { provider: 'Bajaj Allianz', policyNumber: 'BA-2024-DM', roomRentCap: 3000, overallCap: 400000 },
        admissionDate: new Date(Date.now() - 1 * 86400000).toISOString(),
        bedAssignment: { bedId: 'bed-surg-3', wardId: 'SURGICAL', bedLabel: 'SURG-3', assignedAt: new Date(Date.now() - 0.9 * 86400000).toISOString() }
    };
    patients.push(gopal);

    // --- 20. Deepa N (Migraine - Simple) ---
    const deepaFile = getEmptyClinicalFile('p-deepa');
    deepaFile.sections.history = {
        complaints: [{ symptom: 'Headache', duration: '1 day' }],
        hpi: "32F presents with severe throbbing left-sided headache for 1 day. Associated with nausea, photophobia. Similar episodes in past, usually relieved by rest and analgesics.",
        associated_symptoms: ['nausea', 'photophobia', 'phonophobia'],
        past_medical_history: "Migraine without aura, 2-3 episodes/month",
        drug_history: "Sumatriptan PRN, Paracetamol",
        allergy_history: [],
        family_history: "Mother: Migraine",
        personal_social_history: "IT professional, irregular sleep",
    };

    const deepa: Patient = {
        id: 'p-deepa',
        name: 'Deepa N',
        age: 32,
        gender: 'Female',
        contact: '+91 9876543229',
        status: 'Waiting for Triage',
        registrationTime: new Date(Date.now() - 20 * 60000).toISOString(),
        chiefComplaints: [{ complaint: "Headache", durationValue: 1, durationUnit: "days" }],
        aiTriage: { department: 'Neurology', suggested_triage: 'Green', confidence: 0.88, fromCache: false },
        triage: { level: 'None', reasons: [] },
        vitals: { pulse: 82, bp_sys: 118, bp_dia: 76, spo2: 99, temp_c: 36.8, rr: 16 },
        vitalsHistory: [],
        timeline: [],
        orders: [],
        results: [],
        clinicalFile: deepaFile,
        rounds: [],
        paymentMode: 'Cash'
    };
    patients.push(deepa);

    return patients;
};
