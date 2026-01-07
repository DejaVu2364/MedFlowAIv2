
import { Patient, VitalsMeasurements, ClinicalFile, VitalsRecord, Order, Result } from '../types';
import { SCENARIOS, ClinicalScenario } from './clinicalScenarios';

const INDIAN_NAMES_MALE = [
    "Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Reyansh", "Muhammad", "Krishna", "Ishaan", "Shaurya",
    "Atharv", "Advik", "Pranav", "Advaith", "Ayaan", "Dhruv", "Kabir", "Riyan", "Kian", "Aryan",
    "Vikram", "Sanjay", "Rajesh", "Manoj", "Kiran", "Amit", "Rahul", "Rohit", "Vivek", "Suresh"
];

const INDIAN_NAMES_FEMALE = [
    "Saanvi", "Anya", "Aadhya", "Aaradhya", "Ananya", "Pari", "Diya", "Myra", "Saira", "Ira",
    "Naira", "Aahna", "Keya", "Siya", "Riya", "Vanya", "Misha", "Zara", "Fatima", "Kavya",
    "Priya", "Sneha", "Anjali", "Meera", "Lakshmi", "Gita", "Sita", "Radha", "Parvati", "Neah"
];

const SURNAMES = [
    "Patel", "Sharma", "Singh", "Kumar", "Gupta", "Reddy", "Rao", "Nair", "Iyer", "Khan",
    "Gowda", "Das", "Mukherjee", "Banerjee", "Verma", "Mehta", "Chopra", "Desai", "Joshi", "Bhat",
    "Malhotra", "Kapoor", "Jain", "Saxena", "Yadav", "Mishra", "Pandey", "Choudhury", "Fernandes", "Dsouza"
];

// Helper: Generate vitals history for a patient
const generateVitalsHistory = (patientId: string, days: number, baseVitals: VitalsMeasurements, trend: 'stable' | 'improving' | 'worsening'): VitalsRecord[] => {
    const history: VitalsRecord[] = [];
    const now = Date.now();
    const recordsPerDay = 4;

    for (let day = 0; day <= days; day++) {
        for (let reading = 0; reading < recordsPerDay; reading++) {
            // Reverse chronological: 'day 0' is today.
            const timestamp = now - (day * 86400000) - (reading * (86400000 / recordsPerDay));

            // Calculate trend factor (1.0 = baseline)
            let factor = 1;
            if (trend === 'improving') {
                // Older records (higher 'day') were worse (further from normal)
                factor = 1 + (day * 0.1);
            } else if (trend === 'worsening') {
                // Older records (higher 'day') were better (closer to normal)
                factor = 1 - (day * 0.05);
            }

            // Add randomness (+/- 5%)
            const randomFactor = 0.95 + Math.random() * 0.1;
            const netFactor = factor * randomFactor;

            history.push({
                vitalId: `v-${patientId}-${day}-${reading}`,
                patientId,
                recordedBy: 'Nurse Station',
                recordedAt: new Date(timestamp).toISOString(),
                source: reading === 0 ? 'nurse' : 'monitor',
                measurements: {
                    pulse: Math.round((baseVitals.pulse || 72) * netFactor),
                    bp_sys: Math.round((baseVitals.bp_sys || 120) * netFactor),
                    bp_dia: Math.round((baseVitals.bp_dia || 80) * netFactor),
                    spo2: Math.min(100, Math.round((baseVitals.spo2 || 98) / netFactor)), // Inverse relationship typically
                    temp_c: Math.round(((baseVitals.temp_c || 37) * netFactor) * 10) / 10,
                    rr: Math.round((baseVitals.rr || 16) * netFactor),
                }
            });
        }
    }

    return history.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)); // Newest first
};

const createPatientFromScenario = (index: number, scenario: ClinicalScenario): Patient => {
    const isFemale = Math.random() > 0.5;
    const firstName = isFemale
        ? INDIAN_NAMES_FEMALE[Math.floor(Math.random() * INDIAN_NAMES_FEMALE.length)]
        : INDIAN_NAMES_MALE[Math.floor(Math.random() * INDIAN_NAMES_MALE.length)];
    const lastName = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
    const name = `${firstName} ${lastName}`;
    const age = 18 + Math.floor(Math.random() * 60);
    const pid = `P-${2024000 + index}`;
    const regTime = new Date(Date.now() - (Math.random() * 5 * 86400000)).toISOString(); // 0-5 days ago

    // Deep copy objects
    const clinicalFile: ClinicalFile = {
        id: `CF-${pid}`,
        patientId: pid,
        status: 'signed', // Auto-sign for coherence
        signedAt: regTime,
        signedBy: 'doc-auto',
        aiSuggestions: {},
        sections: {
            history: { ...scenario.history, complaints: [] }, // Complaints handled in chiefComplaints
            gpe: { ...scenario.gpe, vitals: scenario.targetVitals, flags: { pallor: false, icterus: false, cyanosis: false, clubbing: false, lymphadenopathy: false, edema: false } },
            systemic: JSON.parse(JSON.stringify(scenario.systemic)) // Deep copy!
        },
        // Auto-fill GPE flags based on remarks if detected
        // (Skipping for brevity, reliant on scenario accuracy)
    };

    // Add Complaints to History for viewing consistency
    const complaintObj = {
        symptom: scenario.chiefComplaint.symptom,
        duration: scenario.chiefComplaint.duration
    };
    if (clinicalFile.sections.history) {
        clinicalFile.sections.history.complaints = [complaintObj];
    }

    // Orders & Results
    const orders: Order[] = scenario.suggestedOrders.map((template, idx) => {
        const orderId = `ORD-${pid}-${idx}`;
        const timestamp = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
        return {
            orderId,
            patientId: pid,
            createdBy: 'doc-auto',
            createdAt: timestamp,
            category: template.category,
            subType: template.subType,
            label: template.label,
            status: template.status as any, // Cast for safety
            priority: template.priority,
            payload: {},
            ai_provenance: { prompt_id: null, rationale: 'Protocol driven' }
        };
    });

    const results: Result[] = [];
    scenario.suggestedOrders.forEach((template, idx) => {
        if (template.result && template.status === 'completed') {
            results.push({
                id: `RES-${pid}-${idx}`,
                patientId: pid,
                orderId: `ORD-${pid}-${idx}`,
                name: template.result.name,
                value: template.result.value,
                isAbnormal: template.result.isAbnormal,
                unit: template.result.unit || '',
                timestamp: new Date().toISOString(),
                status: 'final'
            });
        }
    });

    return {
        id: pid,
        name,
        age,
        gender: isFemale ? 'Female' : 'Male',
        contact: `+91 ${9000000000 + Math.floor(Math.random() * 10000000)}`,
        status: 'In Treatment',
        registrationTime: regTime,
        triage: { level: scenario.triageLevel, reasons: [scenario.conditionName] },
        aiTriage: { department: 'Emergency', suggested_triage: scenario.triageLevel, confidence: 0.9, fromCache: false },
        chiefComplaints: [{
            complaint: scenario.chiefComplaint.symptom,
            durationValue: scenario.chiefComplaint.value,
            durationUnit: scenario.chiefComplaint.unit
        }],
        vitals: scenario.targetVitals,
        vitalsHistory: generateVitalsHistory(pid, 2, scenario.targetVitals, 'stable'),
        timeline: [],
        clinicalFile,
        orders,
        results,
        rounds: [],
        activeProblems: scenario.activeProblems.map((p, i) => ({
            id: `PROB-${pid}-${i}`,
            description: p.description,
            status: p.status
        })),
        handoverSummary: `Admitted for ${scenario.conditionName}. Stable.`
    };
};

export const generateSyntheaData = (): Patient[] => {
    const patients: Patient[] = [];
    const TOTAL_PATIENTS = 20;

    for (let i = 0; i < TOTAL_PATIENTS; i++) {
        // Round-robin selection of scenarios
        const scenarioIndex = i % SCENARIOS.length;
        const scenario = SCENARIOS[scenarioIndex];

        // Add random variation to vitals for uniqueness even within same scenario
        const variedScenario = JSON.parse(JSON.stringify(scenario)); // Deep copy
        if (variedScenario.targetVitals.pulse) variedScenario.targetVitals.pulse += Math.floor(Math.random() * 10) - 5;
        if (variedScenario.targetVitals.bp_sys) variedScenario.targetVitals.bp_sys += Math.floor(Math.random() * 10) - 5;
        // Keep name consistent though for logic

        patients.push(createPatientFromScenario(i + 1, variedScenario));
    }

    return patients;
};
