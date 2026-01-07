
import { ClinicalFileSections, Order, VitalsMeasurements, TriageLevel, ActiveProblem, Result } from '../types';

export interface ClinicalScenario {
    id: string;
    conditionName: string; // e.g. "Acute Appendicitis"
    triageLevel: TriageLevel;
    chiefComplaint: { symptom: string, duration: string, value: number, unit: 'hours' | 'days' | 'weeks' };

    // History
    history: {
        hpi: string;
        associated_symptoms: string[];
        past_medical_history: string;
        drug_history: string;
        family_history: string;
        personal_social_history: string;
    };

    // Examination
    gpe: {
        general_appearance: 'well' | 'ill' | 'toxic' | 'cachectic' | '';
        remarks: string; // e.g. "Pallor +, Icterus -"
    };
    systemic: ClinicalFileSections['systemic']; // The critical part user missed

    // Vitals (Base target values, generator will add noise)
    targetVitals: VitalsMeasurements;

    // Clinical Logic
    activeProblems: { description: string, status: 'urgent' | 'monitor' | 'improving' }[];

    // Orders & Results (Interconnected)
    suggestedOrders: {
        label: string;
        category: Order['category'];
        subType: string;
        priority: Order['priority'];
        status: Order['status'];
        // Ideally result is linked here for coherence
        result?: {
            name: string;
            value: string;
            isAbnormal: boolean;
            unit?: string;
        };
    }[];
}

export const SCENARIOS: ClinicalScenario[] = [
    {
        id: 'dengue_fever',
        conditionName: 'Dengue Fever',
        triageLevel: 'Yellow',
        chiefComplaint: { symptom: 'High Fever', duration: '3 days', value: 3, unit: 'days' },
        history: {
            hpi: "Patient presents with high grade fever (103F) for 3 days, associated with severe retro-orbital headache and generalized myalgia ('breakbone fever'). Reports nausea and 2 episodes of non-bilious vomiting. No bleeding manifestations reported so far. Hydration status is borderline adequate.",
            associated_symptoms: ['retro-orbital pain', 'myalgia', 'nausea', 'arthralgia'],
            past_medical_history: "Nil significant.",
            drug_history: "Paracetamol 650mg SOS",
            family_history: "No similar illness in family",
            personal_social_history: "Student, lives in hostel. Mosquito breeding sites nearby reported."
        },
        gpe: {
            general_appearance: 'ill',
            remarks: "Febrile, flushed face. Skin rash (erythematous) visible on forearms. Tourniquet test negative. No petechiae. Mucosa moist.",
        },
        systemic: {
            abdomen: {
                inspection: "Flat, moves with respiration. No dilated veins.",
                palpation: "Soft, mild tenderness in Right Hypochondrium. Liver palpable 2cm below costal margin, soft consistency.",
                percussion: "Dull note over liver span (14cm).",
                auscultation: "Bowel sounds present."
            },
            cvs: { summary: "S1S2 normal, no murmurs. Tachycardia present." },
            rs: { summary: "Bilateral air entry equal. Clear." },
            cns: { summary: "Conscious, Oriented. No focal deficit." }
        },
        targetVitals: { temp_c: 39.0, pulse: 110, bp_sys: 100, bp_dia: 70, spo2: 98, rr: 20 },
        activeProblems: [
            { description: 'Dengue Fever with Warning Signs', status: 'urgent' },
            { description: 'Thrombocytopenia (monitor)', status: 'monitor' }
        ],
        suggestedOrders: [
            { label: 'Dengue NS1 Antigen', category: 'investigation', subType: 'lab', priority: 'STAT', status: 'completed', result: { name: 'Dengue NS1', value: 'POSITIVE', isAbnormal: true } },
            { label: 'Complete Blood Count', category: 'investigation', subType: 'lab', priority: 'urgent', status: 'completed', result: { name: 'Platelet Count', value: '85,000', unit: '/uL', isAbnormal: true } },
            { label: 'IV Fluids (RL)', category: 'medication', subType: 'fluid', priority: 'routine', status: 'in_progress' }
        ]
    },
    {
        id: 'acute_mi',
        conditionName: 'Acute Anterior Wall MI',
        triageLevel: 'Red',
        chiefComplaint: { symptom: 'Chest Pain', duration: '45 mins', value: 45, unit: 'hours' }, // treated as <1 hour
        history: {
            hpi: "Patient complains of sudden onset central chest pain starting 45 minutes ago. Describes it as 'crushing' and 'elephant sitting on chest'. Radiating to left jaw and shoulder. Profuse sweating reported. History of exertional dyspnea for 1 month.",
            associated_symptoms: ['diaphoresis', 'palpitations', 'nausea', 'dyspnea'],
            past_medical_history: "Hypertension (10 years), Smoker (20 pack-years).",
            drug_history: "Amlodipine 5mg OD (irregular)",
            family_history: "Father died of MI at 50",
            personal_social_history: "Chronic smoker, sedentary lifestyle."
        },
        gpe: {
            general_appearance: 'toxic',
            remarks: "Anxious, clutching chest (Levine's sign +). Cold clammy skin. Profuse sweating.",
        },
        systemic: {
            cvs: {
                inspection: "Apex beat not visible.",
                palpation: "Apex beat palpable in 5th ICS, MCL.",
                auscultation: "S1 S2 heard. S4 gallop present. No murmurs.",
                summary: "Tachycardic. S4 gallop."
            },
            rs: { summary: "Bibasilar crackles (incipient LVF)." },
            abdomen: { summary: "Soft, non-tender." },
            cns: { summary: "Alert, Oriented." }
        },
        targetVitals: { temp_c: 36.5, pulse: 115, bp_sys: 160, bp_dia: 100, spo2: 94, rr: 26 },
        activeProblems: [
            { description: 'Acute Anterior Wall STEMI', status: 'urgent' },
            { description: 'Hypertensive Emergency', status: 'urgent' }
        ],
        suggestedOrders: [
            { label: '12 Lead ECG', category: 'procedure', subType: 'diagnostic', priority: 'STAT', status: 'completed', result: { name: 'ECG', value: 'ST Elevation V1-V4', isAbnormal: true } },
            { label: 'Troponin I', category: 'investigation', subType: 'lab', priority: 'STAT', status: 'completed', result: { name: 'Troponin I', value: '15.2', unit: 'ng/mL', isAbnormal: true } },
            { label: 'Loading Dose (Aspirin + Clopidogrel)', category: 'medication', subType: 'antiplatelet', priority: 'STAT', status: 'completed' },
            { label: 'Cardiology Consult', category: 'referral', subType: 'internal', priority: 'STAT', status: 'sent' }
        ]
    },
    {
        id: 'pneumonia',
        conditionName: 'Lobar Pneumonia',
        triageLevel: 'Yellow',
        chiefComplaint: { symptom: 'Productive Cough', duration: '5 days', value: 5, unit: 'days' },
        history: {
            hpi: "Productive cough with rusty sputum for 5 days. High grade fever with chills and rigors. Right sided pleuritic chest pain on deep inspiration. Complaint of breathlessness on exertion.",
            associated_symptoms: ['fever', 'chills', 'pleuritic chest pain'],
            past_medical_history: "Type 2 Diabetes Mellitus (controlled).",
            drug_history: "Metformin 500mg BD",
            family_history: "Nil",
            personal_social_history: "Non-smoker."
        },
        gpe: {
            general_appearance: 'ill',
            remarks: "Febrile, tachypneic. Using accessory muscles of respiration.",
        },
        systemic: {
            rs: {
                inspection: "Reduced chest movement on Right side.",
                palpation: "Increased vocal fremitus Right Lower Zone.",
                percussion: "Dull note on percussion Right Lower Zone.",
                auscultation: "Bronchial breath sounds Right Lower Zone. Coarse crepitations present.",
                summary: "Signs of consolidation Right Lower Lobe."
            },
            cvs: { summary: "Normal heart sounds." },
            abdomen: { summary: "Soft, non-tender." }
        },
        targetVitals: { temp_c: 38.8, pulse: 102, bp_sys: 110, bp_dia: 70, spo2: 92, rr: 28 },
        activeProblems: [
            { description: 'Right Lower Lobe Pneumonia', status: 'urgent' },
            { description: 'Hypoxia', status: 'monitor' }
        ],
        suggestedOrders: [
            { label: 'Chest X-Ray PA View', category: 'radiology', subType: 'xray', priority: 'urgent', status: 'completed', result: { name: 'CXR', value: 'Homogenous opacity RLL', isAbnormal: true } },
            { label: 'Sputum Culture', category: 'investigation', subType: 'micro', priority: 'routine', status: 'sent' },
            { label: 'Inj. Ceftriaxone 1g', category: 'medication', subType: 'antibiotic', priority: 'urgent', status: 'in_progress' }
        ]
    },
    {
        id: 'acute_appendicitis',
        conditionName: 'Acute Appendicitis',
        triageLevel: 'Yellow',
        chiefComplaint: { symptom: 'Abdominal Pain', duration: '1 day', value: 1, unit: 'days' },
        history: {
            hpi: "Pain started in periumbilical region yesterday, now migrated to Right Iliac Fossa (RIF). Pain is sharp, constant. Associated with anorexia and nausea. One episode of vomiting.",
            associated_symptoms: ['anorexia', 'nausea', 'vomiting'],
            past_medical_history: "Nil.",
            drug_history: "Nil",
            family_history: "Nil",
            personal_social_history: "Student."
        },
        gpe: {
            general_appearance: 'ill',
            remarks: "Lying still in bed (peritonitis). Flushed.",
        },
        systemic: {
            abdomen: {
                inspection: "Movement restricted in RIF.",
                palpation: "Tenderness at McBurney's point. Rebound tenderness positive. Guarding present.",
                percussion: "Tenderness on percussion.",
                auscultation: "Bowel sounds sluggish.",
                summary: "Signs of acute RIF peritonitis."
            },
            cvs: { summary: "Normal." },
            rs: { summary: "Clear." }
        },
        targetVitals: { temp_c: 37.8, pulse: 96, bp_sys: 120, bp_dia: 70, spo2: 99, rr: 18 },
        activeProblems: [
            { description: 'Acute Appendicitis', status: 'urgent' }
        ],
        suggestedOrders: [
            { label: 'USG Abdomen', category: 'radiology', subType: 'usg', priority: 'urgent', status: 'completed', result: { name: 'USG', value: 'Inflamed appendix, non-compressible, 9mm', isAbnormal: true } },
            { label: 'Surgical Consult', category: 'referral', subType: 'surgery', priority: 'urgent', status: 'completed' },
            { label: 'NPO Instructions', category: 'nursing', subType: 'diet', priority: 'STAT', status: 'in_progress' } // 'active' mapped to 'in_progress' later
        ]
    },
    {
        id: 'copd',
        conditionName: 'COPD Exacerbation',
        triageLevel: 'Red',
        chiefComplaint: { symptom: 'Breathlessness', duration: '2 hours', value: 2, unit: 'hours' },
        history: {
            hpi: "Known COPD patient (GOLD C). Sudden worsening of breathlessness since morning. Increased sputum production (greenish). Unable to speak in full sentences.",
            associated_symptoms: ['cough', 'wheeze'],
            past_medical_history: "COPD (5 years). Smoker.",
            drug_history: "Inhalers (LAMA+LABA)",
            family_history: "Nil",
            personal_social_history: "Smoker."
        },
        gpe: {
            general_appearance: 'toxic',
            remarks: "Cyanosis +, Clubbing +. Pursed lip breathing. Sititng in tripod position.",
        },
        systemic: {
            rs: {
                inspection: "Barrel chest. Intercostal indrawing.",
                percussion: "Hyperresonant note.",
                auscultation: "Air entry reduced bilaterally. Polyphonic wheeze all over chest.",
                summary: "Acute bronchospasm."
            },
            cvs: { summary: "Heart sounds faint." }
        },
        targetVitals: { temp_c: 37.0, pulse: 120, bp_sys: 140, bp_dia: 90, spo2: 86, rr: 32 },
        activeProblems: [
            { description: 'Acute Exacerbation of COPD', status: 'urgent' },
            { description: 'Type 2 Respiratory Failure', status: 'urgent' }
        ],
        suggestedOrders: [
            { label: 'ABG', category: 'investigation', subType: 'lab', priority: 'STAT', status: 'completed', result: { name: 'ABG', value: 'pH 7.30, pCO2 60, pO2 55', isAbnormal: true } },
            { label: 'Nebulization (Salbutamol+Ipratropium)', category: 'medication', subType: 'neb', priority: 'STAT', status: 'in_progress' },
            { label: 'BiPAP Support', category: 'procedure', subType: 'ventilation', priority: 'urgent', status: 'in_progress' }
        ]
    }
];
