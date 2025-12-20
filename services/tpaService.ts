import { GoogleGenAI, Type } from "@google/genai";
import { Patient } from "../types";

// --- Configuration ---
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.5-flash";

// Initialize Gemini (Safe Fallback)
const ai = new GoogleGenAI({ apiKey: API_KEY || "mock-key" });

// --- Type Definitions ---
export interface PreAuthLetter {
    letterContent: string;
    diagnosis: string;
    treatmentPlan: string;
    expectedLOS: number;
    estimatedCost: number;
    medicalNecessity: string;
}

export interface TPARequest {
    id: string;
    patientId: string;
    patientName: string;
    insuranceProvider: string;
    requestType: 'PreAuth' | 'Claim' | 'Enhancement';
    requestedAmount: number;
    approvedAmount?: number;
    status: 'Pending' | 'Approved' | 'Partially Approved' | 'Rejected' | 'Query';
    submittedAt: Date;
    respondedAt?: Date;
    urgencyLevel: 'Low' | 'Medium' | 'High';
    aiGeneratedLetter?: string;
}

export const DEFAULT_PREAUTH_LETTER: PreAuthLetter = {
    letterContent: "",
    diagnosis: "",
    treatmentPlan: "",
    expectedLOS: 0,
    estimatedCost: 0,
    medicalNecessity: ""
};

/**
 * Generates a Pre-Authorization letter for TPA submission.
 * Uses AI to create a professionally written letter with medical justification.
 */
export const generatePreAuthLetter = async (patient: Patient): Promise<PreAuthLetter> => {
    // Safety Check
    if (!API_KEY || !patient) {
        console.warn("TPA Service: Missing API Key or Patient Data. Returning default.");
        return {
            ...DEFAULT_PREAUTH_LETTER,
            letterContent: `[DEMO MODE] Pre-Authorization request for ${patient?.name || 'patient'}. Please configure VITE_GEMINI_API_KEY for AI-generated letters.`,
            diagnosis: patient?.chiefComplaints?.[0]?.complaint || 'To be determined',
            treatmentPlan: 'Standard treatment protocol',
            expectedLOS: 5,
            estimatedCost: 150000,
            medicalNecessity: 'Medical evaluation required'
        };
    }

    // Build Context
    const context = `
    Patient: ${patient.name}, ${patient.age}y ${patient.gender}
    Chief Complaints: ${patient.chiefComplaints?.map(c => c.complaint).join(', ') || 'None documented'}
    
    Clinical Summary:
    History: ${JSON.stringify(patient.clinicalFile?.sections?.history || {})}
    GPE: ${JSON.stringify(patient.clinicalFile?.sections?.gpe || {})}
    Vitals: BP ${patient.vitals?.bp_sys}/${patient.vitals?.bp_dia}, HR ${patient.vitals?.pulse}, SpO2 ${patient.vitals?.spo2}%
    
    Active Orders:
    ${patient.orders?.filter(o => o.status !== 'cancelled').map(o => `- ${o.label} (${o.category})`).join('\n') || 'None'}
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `You are a Senior Medical Insurance Coordinator for an Indian Hospital. Generate a professional Pre-Authorization letter for TPA submission.

            Patient Context:
            ${context}

            TASK:
            1. Write a formal pre-authorization letter requesting approval.
            2. Include clear medical justification.
            3. Estimate Length of Stay (LOS) based on diagnosis.
            4. Provide estimated treatment cost in INR.

            OUTPUT SCHEMA (JSON Only):
            {
              "letterContent": "Full professional letter text with greeting, body, and signature block",
              "diagnosis": "Primary diagnosis",
              "treatmentPlan": "Brief treatment plan",
              "expectedLOS": number (days),
              "estimatedCost": number (in INR),
              "medicalNecessity": "Summary of why treatment is necessary"
            }`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        letterContent: { type: Type.STRING },
                        diagnosis: { type: Type.STRING },
                        treatmentPlan: { type: Type.STRING },
                        expectedLOS: { type: Type.NUMBER },
                        estimatedCost: { type: Type.NUMBER },
                        medicalNecessity: { type: Type.STRING }
                    },
                    required: ["letterContent", "diagnosis", "treatmentPlan", "expectedLOS", "estimatedCost", "medicalNecessity"]
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("Empty response from AI");

        const parsed = JSON.parse(text);

        return {
            letterContent: parsed.letterContent || "",
            diagnosis: parsed.diagnosis || "",
            treatmentPlan: parsed.treatmentPlan || "",
            expectedLOS: Math.max(1, parsed.expectedLOS || 5),
            estimatedCost: Math.max(10000, parsed.estimatedCost || 100000),
            medicalNecessity: parsed.medicalNecessity || ""
        };

    } catch (error) {
        console.error("TPA Service Pre-Auth Generation Failed:", error);
        return {
            ...DEFAULT_PREAUTH_LETTER,
            letterContent: `Error generating letter. Please try again.`,
            diagnosis: patient?.chiefComplaints?.[0]?.complaint || 'Unknown'
        };
    }
};

/**
 * Calculates expected package cost based on diagnosis and treatment.
 */
export const calculateExpectedCost = (patient: Patient, estimatedLOS: number): number => {
    // Base room charges (assuming average ward)
    const roomCharge = 5000 * estimatedLOS;

    // Medication estimates based on orders
    const medCount = patient.orders?.filter(o => o.category === 'medication').length || 0;
    const medCost = medCount * 2000;

    // Investigation estimates
    const invCount = patient.orders?.filter(o => o.category === 'investigation').length || 0;
    const invCost = invCount * 1500;

    // Procedure estimates (high-value items)
    const hasSurgery = patient.orders?.some(o =>
        o.label?.toLowerCase().includes('surgery') ||
        o.label?.toLowerCase().includes('procedure')
    );
    const surgCost = hasSurgery ? 50000 : 0;

    return roomCharge + medCost + invCost + surgCost + 10000; // +10K misc
};

/**
 * Analyzes claim rejection probability based on documentation.
 */
export const analyzeClaimRisk = (patient: Patient): { risk: 'Low' | 'Medium' | 'High'; reasons: string[] } => {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check for missing documentation
    if (!patient.clinicalFile?.sections?.history) {
        reasons.push('Missing clinical history');
        riskScore += 2;
    }

    if (!patient.chiefComplaints?.length) {
        reasons.push('No chief complaint documented');
        riskScore += 2;
    }

    // Check for high-value drugs without justification
    const highValueDrugs = ['meropenem', 'colistin', 'vancomycin', 'piperacillin'];
    const hasHighValueDrug = patient.orders?.some(o =>
        o.category === 'medication' &&
        highValueDrugs.some(d => o.label?.toLowerCase().includes(d))
    );

    if (hasHighValueDrug) {
        const hasCultureReport = patient.orders?.some(o =>
            o.label?.toLowerCase().includes('culture')
        );
        if (!hasCultureReport) {
            reasons.push('High-value antibiotics without culture report');
            riskScore += 3;
        }
    }

    // Determine risk level
    let risk: 'Low' | 'Medium' | 'High' = 'Low';
    if (riskScore >= 4) risk = 'High';
    else if (riskScore >= 2) risk = 'Medium';

    return { risk, reasons };
};

/**
 * Generates mock TPA requests for demo purposes.
 */
export const generateMockTPARequests = (patients: Patient[]): TPARequest[] => {
    const insuranceProviders = [
        'Star Health',
        'HDFC Ergo',
        'ICICI Lombard',
        'Max Bupa',
        'Bajaj Allianz'
    ];

    return patients
        .filter(p => p.status !== 'Discharged')
        .slice(0, 8) // Limit to 8 mock requests
        .map((patient, index) => {
            const submittedDaysAgo = Math.floor(Math.random() * 10);
            const isResolved = Math.random() > 0.5;

            return {
                id: `tpa-${patient.id}`,
                patientId: patient.id,
                patientName: patient.name,
                insuranceProvider: insuranceProviders[index % insuranceProviders.length],
                requestType: 'PreAuth' as const,
                requestedAmount: Math.floor(Math.random() * 200000) + 50000,
                approvedAmount: isResolved ? Math.floor(Math.random() * 150000) + 30000 : undefined,
                status: isResolved
                    ? (Math.random() > 0.3 ? 'Approved' : 'Partially Approved')
                    : (submittedDaysAgo > 2 ? 'Pending' : 'Pending') as TPARequest['status'],
                submittedAt: new Date(Date.now() - submittedDaysAgo * 24 * 60 * 60 * 1000),
                respondedAt: isResolved ? new Date() : undefined,
                urgencyLevel: submittedDaysAgo > 3 ? 'High' : submittedDaysAgo > 1 ? 'Medium' : 'Low'
            };
        });
};
