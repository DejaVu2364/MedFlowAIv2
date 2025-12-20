
import { Patient, Vitals, Triage, TriageLevel, TeamNote, SOAPNote, User, AuditEvent, AITriageSuggestion, Round, Result, VitalsRecord, VitalsMeasurements, Order, OrderStatus } from '../types';

export const MOCK_DOCTOR: User = { id: 'user-doc-1', name: 'Dr. Harikrishnan S', email: 'doctor@medflow.ai', role: 'Doctor' };
export const MOCK_INTERN: User = { id: 'user-int-1', name: 'Dr. Rohan Joshi', email: 'intern@medflow.ai', role: 'Intern' };

export const MOCK_USERS: User[] = [MOCK_DOCTOR, MOCK_INTERN];

export const MOCK_USER_CREDENTIALS = {
    'doctor@medflow.ai': 'password123',
    'intern@medflow.ai': 'password123',
};

export const findUserByEmail = (email: string): User | undefined => {
    return MOCK_USERS.find(user => user.email.toLowerCase() === email.toLowerCase());
};

const NAMES = [
    "Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Reyansh", "Muhammad", "Krishna", "Ishaan", "Shaurya",
    "Diya", "Saanvi", "Ananya", "Aadhya", "Pari", "Fatima", "Myra", "Kiara", "Riya", "Meera",
    "Rohan", "Rahul", "Amit", "Suresh", "Ramesh", "Priya", "Sneha", "Anjali", "Sunita", "Anita",
    "Vikram", "Sanjay", "Rajesh", "Manoj", "Kiran", "Lakshmi", "Gita", "Sita", "Radha", "Parvati",
    "Ibrahim", "Yusuf", "Zain", "Omar", "Ali", "Ayesha", "Zoya", "Sara", "Maryam", "Hana"
];

const SURNAMES = [
    "Sharma", "Patel", "Reddy", "Singh", "Kumar", "Gupta", "Das", "Nair", "Iyer", "Khan",
    "Joshi", "Mehta", "Shah", "Agarwal", "Verma", "Rao", "Gowda", "Fernandes", "Dsouza", "Ali",
    "Ahmed", "Siddiqui", "Mishra", "Pandey", "Yadav", "Choudhury", "Malhotra", "Bhat", "Kulkarni", "Deshmukh"
];

interface DetailedScenario {
    name: string;
    complaint: string;
    hpi: string;
    pmh: string; // Past Medical History
    dh: string; // Drug History
    fh: string; // Family History
    sh: string; // Social History
    vitals: VitalsMeasurements;
    triage: TriageLevel;
    orders: { label: string, category: string, status: string, result?: string }[];
    assessment: string;
    plan: string;
}

const SCENARIOS: DetailedScenario[] = [
    {
        name: "Dengue Fever",
        complaint: "High fever with body ache and headache",
        hpi: "Patient presents with high grade fever (up to 102F) for 3 days, associated with severe myalgia, retro-orbital headache and nausea. Reports one episode of gum bleeding this morning. No history of cough or cold.",
        pmh: "Nil significant. No known comorbidities.",
        dh: "Takes occasional Paracetamol for headache. No known drug allergies.",
        fh: "No significant family history.",
        sh: "Student. Lives in a hostel. Reports mosquitoes in the area.",
        vitals: { temp_c: 39.2, pulse: 112, bp_sys: 100, bp_dia: 68, spo2: 98, rr: 20 },
        triage: "Yellow",
        orders: [
            { label: "Complete Blood Count (CBC)", category: "investigation", status: "completed", result: "Platelets 85,000 (Low), Hct 45%, WBC 2.8" },
            { label: "Dengue Serology (NS1, IgM, IgG)", category: "investigation", status: "completed", result: "NS1 Positive" },
            { label: "Paracetamol 500mg PO", category: "medication", status: "in_progress" },
            { label: "Normal Saline 500ml Bolus", category: "medication", status: "completed" }
        ],
        assessment: "Dengue Fever with warning signs (Thrombocytopenia)",
        plan: "Admit to ward. Hourly vitals. Monitor fluid balance. Push oral fluids. Avoid NSAIDs."
    },
    {
        name: "Acute Gastroenteritis",
        complaint: "Vomiting and loose stools",
        hpi: "History of multiple episodes (8-10) of watery diarrhea and vomiting since last night after consuming outside food. Complaints of generalized weakness and cramps. No blood in stool.",
        pmh: "History of Acid Peptic Disease.",
        dh: "Pantoprazole 40mg OD.",
        fh: "Father has Hypertension.",
        sh: "Software Engineer. Mixed diet. Non-smoker.",
        vitals: { temp_c: 37.5, pulse: 105, bp_sys: 108, bp_dia: 70, spo2: 97, rr: 18 },
        triage: "Yellow",
        orders: [
            { label: "Stool Routine & Microscopy", category: "investigation", status: "sent", result: "Pending" },
            { label: "Serum Electrolytes", category: "investigation", status: "completed", result: "Na 135, K 3.2 (Mild Hypokalemia)" },
            { label: "Ondansetron 4mg IV", category: "medication", status: "completed" },
            { label: "Lactated Ringers 1L", category: "medication", status: "in_progress" }
        ],
        assessment: "Acute Gastroenteritis with moderate dehydration",
        plan: "IV rehydration. Probiotics. Soft diet. Monitor urine output."
    },
    {
        name: "Type 2 Diabetes (Uncontrolled)",
        complaint: "Giddiness and increased thirst",
        hpi: "Known diabetic for 10 years, ran out of medications 1 week ago. Presents with polyuria, polydipsia and generalized fatigue. Complains of blurring of vision.",
        pmh: "Type 2 Diabetes Mellitus (10y). Hypertension (5y).",
        dh: "Metformin 500mg BD (Missed). Telmisartan 40mg OD.",
        fh: "Mother and Father both diabetic.",
        sh: "Retired teacher. Sedentary lifestyle.",
        vitals: { temp_c: 36.8, pulse: 88, bp_sys: 130, bp_dia: 80, spo2: 98, rr: 16 },
        triage: "Green",
        orders: [
            { label: "Random Blood Sugar", category: "investigation", status: "completed", result: "385 mg/dL (High)" },
            { label: "Urine Ketones", category: "investigation", status: "completed", result: "Negative" },
            { label: "HbA1c", category: "investigation", status: "completed", result: "10.2%" },
            { label: "Insulin Regular", category: "medication", status: "sent" }
        ],
        assessment: "Uncontrolled Type 2 DM, Hyperglycemia",
        plan: "Stat insulin correction. Restart oral hypoglycemics. Ophthalmology consult. Diet counseling."
    },
    {
        name: "Hypertensive Urgency",
        complaint: "Severe headache and neck pain",
        hpi: "Complains of severe occipital headache since morning. Described as throbbing. Associated with nausea. Known hypertensive, non-compliant with meds for 2 weeks.",
        pmh: "Systemic Hypertension diagnosed 3 years ago.",
        dh: "Amlodipine 5mg OD (Irregular).",
        fh: "Father died of Stroke at 60.",
        sh: "Smoker (5 pack years). Alcohol: Occasional.",
        vitals: { temp_c: 37.0, pulse: 90, bp_sys: 180, bp_dia: 110, spo2: 99, rr: 18 },
        triage: "Red",
        orders: [
            { label: "ECG (12 Lead)", category: "procedure", status: "completed", result: "LVH, No ischemic changes" },
            { label: "Serum Creatinine", category: "investigation", status: "completed", result: "1.1 mg/dL" },
            { label: "Amlodipine 5mg PO", category: "medication", status: "completed" },
            { label: "Fundoscopy", category: "referral", status: "completed", result: "Grade 2 Hypertensive Retinopathy" }
        ],
        assessment: "Hypertensive Urgency",
        plan: "Oral antihypertensives. Monitor BP q1h. Rule out end organ damage. Restart Amlodipine."
    },
    {
        name: "Acute Appendicitis",
        complaint: "Pain in right lower abdomen",
        hpi: "Pain started around umbilicus yesterday and migrated to RLQ over 12 hours. Pain is sharp, continuous. Associated with 2 episodes of vomiting and anorexia.",
        pmh: "Nil significant.",
        dh: "Nil.",
        fh: "Nil significant.",
        sh: "Student.",
        vitals: { temp_c: 37.8, pulse: 96, bp_sys: 120, bp_dia: 80, spo2: 99, rr: 18 },
        triage: "Yellow",
        orders: [
            { label: "Ultrasound Abdomen", category: "radiology", status: "completed", result: "Inflamed appendix, 8mm diameter, minimal free fluid" },
            { label: "Complete Blood Count (CBC)", category: "investigation", status: "completed", result: "WBC 14,000 (High), Neutrophilia" },
            { label: "General Surgery Consult", category: "referral", status: "completed" },
            { label: "NPO", category: "nursing", status: "in_progress" }
        ],
        assessment: "Acute Appendicitis",
        plan: "NPO. IV Antibiotics (Ceftriaxone + Metronidazole). Plan for Laparoscopic Appendectomy."
    },
    {
        name: "Fracture Distal Radius",
        complaint: "Pain and swelling in right wrist",
        hpi: "History of slip and fall on outstretched hand (FOOSH) 2 hours ago while playing. Immediate pain, swelling and deformity at right wrist.",
        pmh: "History of asthma in childhood.",
        dh: "Nil.",
        fh: "Nil.",
        sh: "Right handed. Plays cricket.",
        vitals: { temp_c: 37.0, pulse: 100, bp_sys: 130, bp_dia: 85, spo2: 99, rr: 20 },
        triage: "Yellow",
        orders: [
            { label: "X-Ray Right Wrist AP/Lat", category: "radiology", status: "completed", result: "Extra-articular fracture distal radius (Colles)" },
            { label: "Orthopedics Consult", category: "referral", status: "completed" },
            { label: "Splint Application", category: "procedure", status: "completed" },
            { label: "Paracetamol 500mg", category: "medication", status: "completed" }
        ],
        assessment: "Closed Colles Fracture Right Wrist",
        plan: "Below elbow slab application. Analgesics. Ortho review for cast vs fixation."
    },
    {
        name: "Community Acquired Pneumonia",
        complaint: "Productive cough and breathlessness",
        hpi: "Cough with yellowish sputum for 5 days. High grade fever with chills. Progressive shortness of breath on exertion for 2 days. Right sided chest pain on coughing.",
        pmh: "COPD (Smoker).",
        dh: "Inhalers (Salbutamol + Ipratropium).",
        fh: "Nil.",
        sh: "Chronic Smoker (20 pack years).",
        vitals: { temp_c: 38.5, pulse: 102, bp_sys: 110, bp_dia: 70, spo2: 92, rr: 24 },
        triage: "Red",
        orders: [
            { label: "CXR - PA View", category: "radiology", status: "completed", result: "Right lower lobe homogeneous opacity (Consolidation)" },
            { label: "Complete Blood Count (CBC)", category: "investigation", status: "completed", result: "WBC 16,000" },
            { label: "Ceftriaxone 1g IV", category: "medication", status: "in_progress" },
            { label: "Azithromycin 500mg PO", category: "medication", status: "in_progress" },
            { label: "Oxygen 2L via Nasal Prongs", category: "nursing", status: "in_progress" }
        ],
        assessment: "Right Lower Lobe Pneumonia (CAP)",
        plan: "Admit. IV Antibiotics. Oxygen support to maintain SpO2 >94%. Nebulization. Chest PT."
    },
    {
        name: "Acute MI (Inferior Wall)",
        complaint: "Chest pain and sweating",
        hpi: "Sudden onset central chest pain 1 hour ago. Radiating to left arm and jaw. Heaviness type. Associated with profuse sweating and nausea.",
        pmh: "Diabetes, Dyslipidemia.",
        dh: "Metformin, Atorvastatin.",
        fh: "Brother had MI at 45.",
        sh: "Sedentary.",
        vitals: { temp_c: 36.5, pulse: 56, bp_sys: 90, bp_dia: 60, spo2: 96, rr: 22 },
        triage: "Red",
        orders: [
            { label: "ECG (12 Lead)", category: "procedure", status: "completed", result: "ST elevation in II, III, aVF. Reciprocal changes in I, aVL." },
            { label: "Troponin I", category: "investigation", status: "completed", result: "Positive (>10 ng/ml)" },
            { label: "Aspirin 300mg", category: "medication", status: "completed" },
            { label: "Clopidogrel 300mg", category: "medication", status: "completed" },
            { label: "Cardiology Consult", category: "referral", status: "completed" }
        ],
        assessment: "Acute Inferior Wall Myocardial Infarction",
        plan: "Loading dose given. Urgent Cath Lab activation for Primary PCI. IV fluids."
    }
];

let patients: Patient[] = [];

// Helper to generate history records for vitals chart
const generateVitalsHistory = (baseVitals: VitalsMeasurements, patientId: string, doctorId: string): VitalsRecord[] => {
    const history: VitalsRecord[] = [];
    const now = Date.now();
    // Create 3-5 records over the last 24 hours
    const count = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
        const timeOffset = (count - i) * 4 * 60 * 60 * 1000; // 4 hours apart
        const recordedAt = new Date(now - timeOffset).toISOString();

        // Add slight random variation to simulate realistic trends
        const vary = (val: number | null | undefined) => val ? Math.round(val + (Math.random() * 6 - 3)) : null;

        const record: VitalsRecord = {
            vitalId: `VIT-${patientId}-${i}`,
            patientId: patientId,
            recordedAt: recordedAt,
            recordedBy: doctorId,
            source: 'manual',
            measurements: {
                pulse: vary(baseVitals.pulse),
                bp_sys: vary(baseVitals.bp_sys),
                bp_dia: vary(baseVitals.bp_dia),
                spo2: vary(baseVitals.spo2),
                temp_c: baseVitals.temp_c ? parseFloat((baseVitals.temp_c + (Math.random() * 0.6 - 0.3)).toFixed(1)) : null,
                rr: vary(baseVitals.rr)
            }
        };
        history.push(record);
    }
    // Add the current/latest record
    history.push({
        vitalId: `VIT-${patientId}-curr`,
        patientId: patientId,
        recordedAt: new Date().toISOString(),
        recordedBy: doctorId,
        source: 'manual',
        measurements: baseVitals
    });

    return history.reverse(); // Newest first
};

import { generateSyntheaData } from '../utils/syntheaImporter';

export const seedPatients = async (): Promise<Patient[]> => {
    // Use the rich Synthea demo data with fully populated patients
    return generateSyntheaData();
};

export const calculateTriageFromVitals = (vitals: VitalsMeasurements): Triage => {
    const reasons: string[] = [];
    let level: TriageLevel = 'Green';

    if (vitals.spo2 != null && vitals.spo2 < 90) {
        reasons.push(`Low SpO2 (${vitals.spo2}%)`);
        level = 'Red';
    }
    if (vitals.bp_sys != null && vitals.bp_sys < 90) {
        reasons.push(`Low Systolic BP (${vitals.bp_sys} mmHg)`);
        level = 'Red';
    }

    if (level !== 'Red') {
        if (vitals.rr != null && vitals.rr > 24) {
            reasons.push(`High Respiratory Rate (${vitals.rr}/min)`);
            level = 'Yellow';
        }
        if (vitals.pulse != null && vitals.pulse > 120) {
            reasons.push(`High Heart Rate (${vitals.pulse} bpm)`);
            level = 'Yellow';
        }
    }

    if (reasons.length === 0) {
        reasons.push('Vitals are stable.');
    }

    return { level, reasons };
};

export const logAuditEventToServer = (event: AuditEvent) => {
    console.log('--- AUDIT EVENT LOGGED TO SERVER---', event);
};
