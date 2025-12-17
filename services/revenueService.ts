import { GoogleGenAI, Type } from "@google/genai";
import { Patient } from "../types";

// --- Configuration ---
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.5-flash";

// Initialize Gemini (Safe Fallback)
const ai = new GoogleGenAI({ apiKey: API_KEY || "mock-key" });

// --- Type Definitions (Local) ---
export interface RevenueAuditResult {
    leakage_amount: number;
    missed_items: string[];
    denial_risk: "Low" | "Medium" | "High";
    policy_gaps: string[];
}

export const DEFAULT_AUDIT_RESULT: RevenueAuditResult = {
    leakage_amount: 0,
    missed_items: [],
    denial_risk: "Low",
    policy_gaps: []
};

// --- Pure Analysis Function ---
export const analyzeRevenueRisk = async (patient: Patient): Promise<RevenueAuditResult> => {
    // 1. Safety Check: API Key and Patient existence
    if (!API_KEY || !patient) {
        console.warn("Revenue Service: Missing API Key or Patient Data. Returning default.");
        return DEFAULT_AUDIT_RESULT;
    }

    // 2. Context Construction (Read-Only)
    const context = `
    Patient: ${patient.age}y ${patient.gender}
    Diagnosis/Problems: ${patient.activeProblems?.map(p => p.description).join(', ') || 'None documented'}
    Chief Complaint: ${patient.chiefComplaints?.map(c => c.complaint).join(', ')}
    
    Clinical Summary:
    History: ${JSON.stringify(patient.clinicalFile.sections.history)}
    GPE: ${JSON.stringify(patient.clinicalFile.sections.gpe)}
    
    Active Orders:
    ${patient.orders.filter(o => o.status !== 'cancelled').map(o => `- ${o.label} (${o.category})`).join('\n')}
    `;

    try {
        // 3. AI Call
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `You are a Senior Medical Coder and Revenue Integrity Specialist for an Indian Hospital. Your goal is to identify "Revenue Leakage" and "Denial Risk".
            
            Analyze the following patient record:
            ${context}

            TASK:
            1. Identify missed billables (standard of care for this diagnosis not found in orders).
            2. Estimate leakage amount in INR based on standard Indian private hospital rates.
            3. Assess Denial Risk based on medical necessity gaps.

            OUTPUT SCHEMA (JSON Only):
            {
              "leakage_amount": number,
              "missed_items": string[],
              "denial_risk": "Low" | "Medium" | "High",
              "policy_gaps": string[]
            }`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        leakage_amount: { type: Type.NUMBER, description: "Estimated loss in INR" },
                        missed_items: { type: Type.ARRAY, items: { type: Type.STRING } },
                        denial_risk: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                        policy_gaps: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["leakage_amount", "missed_items", "denial_risk", "policy_gaps"]
                }
            }
        });

        // 4. Parsing & Defensive Validation
        const text = response.text;
        if (!text) throw new Error("Empty response from AI");

        const parsed = JSON.parse(text);

        // Defensive Checks
        const safeLeakage = Math.max(0, typeof parsed.leakage_amount === 'number' ? parsed.leakage_amount : 0);

        const validRisks = ["Low", "Medium", "High"];
        const safeRisk = validRisks.includes(parsed.denial_risk) ? parsed.denial_risk as "Low" | "Medium" | "High" : "Low";

        const safeMissedItems = Array.isArray(parsed.missed_items)
            ? parsed.missed_items.filter((i: any) => typeof i === 'string')
            : [];

        const safePolicyGaps = Array.isArray(parsed.policy_gaps)
            ? parsed.policy_gaps.filter((i: any) => typeof i === 'string')
            : [];

        return {
            leakage_amount: safeLeakage,
            missed_items: safeMissedItems,
            denial_risk: safeRisk,
            policy_gaps: safePolicyGaps
        };

    } catch (error) {
        console.error("Revenue Service Analysis Failed:", error);
        return DEFAULT_AUDIT_RESULT;
    }
};
