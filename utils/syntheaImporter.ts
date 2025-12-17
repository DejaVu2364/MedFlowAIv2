import { Patient, VitalsMeasurements, ClinicalFile, ClinicalFileSections } from '../types';

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

// Rich medical data for realistic patient generation
const COMMON_CONDITIONS = [
    { condition: "Hypertension", drug: "Amlodipine 5mg OD" },
    { condition: "Type 2 Diabetes", drug: "Metformin 500mg BD" },
    { condition: "Hypothyroidism", drug: "Thyroxine 50mcg OD" },
    { condition: "Asthma", drug: "Salbutamol inhaler PRN" },
    { condition: "GERD", drug: "Pantoprazole 40mg OD" },
    { condition: "Hyperlipidemia", drug: "Atorvastatin 10mg OD" },
];

const COMMON_ALLERGIES = [
    { substance: "Penicillin", reaction: "Rash", severity: "Moderate" as const },
    { substance: "Sulfa drugs", reaction: "Urticaria", severity: "Moderate" as const },
    { substance: "Aspirin", reaction: "Bronchospasm", severity: "Severe" as const },
    { substance: "Shellfish", reaction: "Anaphylaxis", severity: "Severe" as const },
    { substance: "Dust", reaction: "Sneezing", severity: "Mild" as const },
];

const CHIEF_COMPLAINTS = [
    { complaint: "Fever", duration: "3 days", hpiTemplate: "fever with chills, no rash" },
    { complaint: "Cough", duration: "1 week", hpiTemplate: "dry cough, no hemoptysis" },
    { complaint: "Abdominal Pain", duration: "2 days", hpiTemplate: "epigastric pain, burning type, worse after meals" },
    { complaint: "Headache", duration: "1 day", hpiTemplate: "frontal headache, throbbing, no photophobia" },
    { complaint: "Breathlessness", duration: "4 hours", hpiTemplate: "sudden onset, worse on exertion" },
    { complaint: "Body Ache", duration: "2 days", hpiTemplate: "generalized body ache with fatigue" },
    { complaint: "Loose Stools", duration: "1 day", hpiTemplate: "watery stools x5 episodes, no blood" },
    { complaint: "Chest Discomfort", duration: "6 hours", hpiTemplate: "retrosternal heaviness, no radiation" },
];

const MOCK_VITALS_NORMAL: VitalsMeasurements = {
    pulse: 78,
    bp_sys: 120,
    bp_dia: 80,
    rr: 16,
    spo2: 98,
    temp_c: 37.0
};

const MOCK_VITALS_CRITICAL: VitalsMeasurements = {
    pulse: 120,
    bp_sys: 90,
    bp_dia: 60,
    rr: 30,
    spo2: 88,
    temp_c: 39.5
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

const generateRandomPatient = (index: number): Patient => {
    const isMale = Math.random() > 0.5;
    const firstName = isMale
        ? INDIAN_NAMES_MALE[Math.floor(Math.random() * INDIAN_NAMES_MALE.length)]
        : INDIAN_NAMES_FEMALE[Math.floor(Math.random() * INDIAN_NAMES_FEMALE.length)];
    const lastName = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
    const age = Math.floor(Math.random() * 60) + 18;
    const id = `PAT-SYN-${index + 100}`;

    // Safety check for clean strings
    const name = `${firstName} ${lastName}`.trim();

    // Random clinical data generation
    const hasPMH = Math.random() > 0.4; // 60% have past history
    const hasAllergy = Math.random() > 0.8; // 20% have allergies
    const randomComplaint = CHIEF_COMPLAINTS[Math.floor(Math.random() * CHIEF_COMPLAINTS.length)];
    const randomCondition = COMMON_CONDITIONS[Math.floor(Math.random() * COMMON_CONDITIONS.length)];
    const randomAllergy = COMMON_ALLERGIES[Math.floor(Math.random() * COMMON_ALLERGIES.length)];

    // Generate clinical file with data
    const clinicalFile = getEmptyClinicalFile(id);
    clinicalFile.sections.history = {
        ...clinicalFile.sections.history,
        complaints: [{ symptom: randomComplaint.complaint, duration: randomComplaint.duration }],
        hpi: `${age}${isMale ? 'M' : 'F'} presents with ${randomComplaint.complaint.toLowerCase()} for ${randomComplaint.duration}. ${randomComplaint.hpiTemplate}. ${hasPMH ? `Known case of ${randomCondition.condition}.` : 'No significant past history.'}`,
        past_medical_history: hasPMH ? `Known ${randomCondition.condition} on treatment` : '',
        drug_history: hasPMH ? randomCondition.drug : '',
        allergy_history: hasAllergy ? [randomAllergy] : [],
    };

    // Add vitals with slight variations
    const vitalsVariation = {
        pulse: MOCK_VITALS_NORMAL.pulse! + Math.floor(Math.random() * 20) - 10,
        bp_sys: MOCK_VITALS_NORMAL.bp_sys! + Math.floor(Math.random() * 20) - 10,
        bp_dia: MOCK_VITALS_NORMAL.bp_dia! + Math.floor(Math.random() * 10) - 5,
        rr: MOCK_VITALS_NORMAL.rr! + Math.floor(Math.random() * 4) - 2,
        spo2: Math.min(100, MOCK_VITALS_NORMAL.spo2! + Math.floor(Math.random() * 4) - 2),
        temp_c: MOCK_VITALS_NORMAL.temp_c! + (Math.random() * 1.5 - 0.5),
    };

    clinicalFile.sections.gpe = {
        ...clinicalFile.sections.gpe,
        vitals: vitalsVariation,
        general_appearance: 'well',
        build: 'normal',
        hydration: 'normal',
    };

    return {
        id,
        name,
        age,
        gender: isMale ? 'Male' : 'Female',
        contact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        status: 'Waiting for Doctor',
        registrationTime: new Date(Date.now() - Math.random() * 86400000 * 2).toISOString(),
        chiefComplaints: [{ complaint: randomComplaint.complaint, durationValue: 2, durationUnit: "days" }],
        aiTriage: { department: 'General Medicine', suggested_triage: 'Green' as const, confidence: 0.8, fromCache: false },
        triage: { level: 'Green' as const, reasons: [] },
        vitals: vitalsVariation,
        vitalsHistory: [],
        timeline: [],
        orders: [],
        results: [],
        clinicalFile,
        rounds: []
    };
};

export const generateSyntheaData = (): Patient[] => {
    const patients: Patient[] = [];

    // --- 1. Amitabh B (Revenue Risk + Full Clinical Demo) ---
    const amitabhFile = getEmptyClinicalFile('p-amitabh');
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
        registrationTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        chiefComplaints: [{ complaint: "Head Injury", durationValue: 2, durationUnit: "hours" }],
        aiTriage: { department: 'Emergency', suggested_triage: 'Yellow', confidence: 0.85, fromCache: false },
        triage: { level: 'Yellow', reasons: ['Head Trauma', 'LOC History'] },
        vitals: { pulse: 88, bp_sys: 150, bp_dia: 92, spo2: 97, temp_c: 37.1, rr: 18 },
        vitalsHistory: [],
        timeline: [],
        orders: [], // INTENTIONALLY EMPTY - Revenue leak demo
        results: [],
        clinicalFile: amitabhFile,
        rounds: []
    };
    patients.push(amitabh);

    // --- 2. Sania M (Bed Block - Discharge Ready Demo) ---
    const saniaFile = getEmptyClinicalFile('p-sania');
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
        registrationTime: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 days ago
        chiefComplaints: [{ complaint: "Fever", durationValue: 5, durationUnit: "days" }],
        aiTriage: { department: 'General Medicine', suggested_triage: 'Yellow', confidence: 0.9, fromCache: false },
        triage: { level: 'Green', reasons: ['Recovering'] },
        vitals: { pulse: 76, bp_sys: 110, bp_dia: 70, spo2: 99, temp_c: 36.8, rr: 16 },
        vitalsHistory: [],
        timeline: [],
        orders: [],
        results: [],
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
        }
    };
    patients.push(sania);

    // --- 3. Vikram S (TPA Risk - Unjustified Expensive Antibiotic) ---
    const vikramFile = getEmptyClinicalFile('p-vikram');
    vikramFile.sections.history = {
        complaints: [{ symptom: 'Fever', duration: '3 days' }],
        hpi: "52M admitted with fever for 3 days. Started on antibiotics.", // NO sepsis/culture mention - TPA RISK
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
        vitals: { pulse: 102, bp_sys: 134, bp_dia: 86, spo2: 96, temp_c: 38.5, rr: 20 },
        vitalsHistory: [],
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
                status: 'draft',
                createdBy: 'doc',
                createdAt: new Date().toISOString(),
                ai_provenance: { prompt_id: null, rationale: null },
                priority: 'routine',
                payload: {}
            }
        ]
    };
    patients.push(vikram);

    // --- 4. Rahul D (Critical - ICU Candidate) ---
    const rahulFile = getEmptyClinicalFile('p-rahul');
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
        vitals: MOCK_VITALS_CRITICAL,
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
        status: 'Waiting for Doctor',
        registrationTime: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        chiefComplaints: [{ complaint: "Chest Pain", durationValue: 1, durationUnit: "hours" }],
        aiTriage: { department: 'Emergency', suggested_triage: 'Red', confidence: 0.95, fromCache: false },
        triage: { level: 'Red', reasons: ['Unstable Vitals', 'Hypotension', 'ACS Criteria'] },
        vitals: MOCK_VITALS_CRITICAL,
        vitalsHistory: [],
        timeline: [],
        orders: [],
        results: [],
        clinicalFile: rahulFile,
        rounds: []
    };
    patients.push(rahul);

    // --- Generate Remaining 46 Patients ---
    for (let i = 4; i < 50; i++) {
        patients.push(generateRandomPatient(i));
    }

    return patients;
};
