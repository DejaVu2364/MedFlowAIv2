
import { GoogleGenAI, Type } from "@google/genai";
import { AITriageSuggestion, Department, TriageLevel, SOAPNote, TeamNote, FollowUpQuestion, ComposedHistory, Patient, Order, OrderCategory, PatientOverview, Vitals, ClinicalFileSections, OrderPriority, Round, VitalsRecord, DischargeSummary } from '../types';
import { getFromCache, setInCache } from './caching';


const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("VITE_GEMINI_API_KEY is not set. AI features will be disabled or mocked.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "mock-key" });

const flashModel = "gemini-2.5-flash";
const proModel = "gemini-2.5-pro";

const departmentValues: Department[] = ['Cardiology', 'Orthopedics', 'General Medicine', 'Obstetrics', 'Neurology', 'Emergency', 'Unknown'];
const triageLevelValues: TriageLevel[] = ['Red', 'Yellow', 'Green'];


export const classifyComplaint = async (complaint: string): Promise<{ data: AITriageSuggestion, fromCache: boolean }> => {
    const cacheKey = `classify:${complaint.toLowerCase().trim()}`;
    const cached = getFromCache<AITriageSuggestion>(cacheKey);
    if (cached) {
        return { data: cached, fromCache: true };
    }

    if (import.meta.env.VITE_TEST_MODE === 'true') {
        return {
            data: {
                department: 'General Medicine',
                suggested_triage: 'Green',
                confidence: 0.95
            },
            fromCache: false
        };
    }

    try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini API Timeout")), 15000));

        const apiCall = ai.models.generateContent({
            model: flashModel,
            contents: `You are a medical expert system. Based on the patient's chief complaint, classify it into the most likely medical department and suggest a triage level (Red, Yellow, or Green). Provide a confidence score from 0 to 1. Complaint: "${complaint}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        department: {
                            type: Type.STRING,
                            description: 'The suggested medical department.',
                            enum: departmentValues
                        },
                        suggested_triage: {
                            type: Type.STRING,
                            description: 'The suggested triage level (Red, Yellow, or Green).',
                            enum: triageLevelValues,
                        },
                        confidence: {
                            type: Type.NUMBER,
                            description: 'A confidence score between 0 and 1.',
                        },
                    },
                    required: ['department', 'suggested_triage', 'confidence'],
                },
            },
        });

        const response = await Promise.race([apiCall, timeoutPromise]) as any;

        const jsonString = response.text;
        const result: AITriageSuggestion = JSON.parse(jsonString);

        setInCache(cacheKey, result);
        return { data: result, fromCache: false };

    } catch (error) {
        console.error("Error classifying complaint with Gemini:", error);
        // Rethrow the error to be handled by the UI component, which can provide better user feedback.
        throw error;
    }
};

type SOAPNoteData = Omit<SOAPNote, 'id' | 'patientId' | 'author' | 'authorId' | 'role' | 'timestamp' | 'type'>;

export const generateSOAPFromTranscript = async (transcript: string): Promise<{ data: SOAPNoteData, fromCache: boolean }> => {
    const cacheKey = `soap:${transcript.slice(0, 100)}`; // Cache based on start of transcript
    const cached = getFromCache<SOAPNoteData>(cacheKey);
    if (cached) {
        return { data: cached, fromCache: true };
    }

    if (import.meta.env.VITE_TEST_MODE === 'true') {
        return {
            data: {
                transcript,
                s: 'Test Subjective',
                o: 'Test Objective',
                a: 'Test Assessment',
                p: 'Test Plan'
            },
            fromCache: false
        };
    }

    try {
        const response = await ai.models.generateContent({
            model: proModel, // Use Pro for more complex reasoning
            contents: `You are a medical scribe AI. Convert the following doctor's round transcript into a structured SOAP note. Ensure each section is concise and clinically relevant. Transcript: "${transcript}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        transcript: { type: Type.STRING, description: "The original transcript provided." },
                        s: { type: Type.STRING, description: "Subjective: The patient's reported symptoms and feelings." },
                        o: { type: Type.STRING, description: "Objective: The doctor's objective findings, vitals, and exam results mentioned." },
                        a: { type: Type.STRING, description: "Assessment: The primary diagnosis or differential diagnoses." },
                        p: { type: Type.STRING, description: "Plan: The treatment plan, including tests, medications, and follow-up." },
                    },
                    required: ['s', 'o', 'a', 'p', 'transcript'],
                },
            },
        });
        const jsonString = response.text;
        const result = JSON.parse(jsonString);
        setInCache(cacheKey, result);
        return { data: result, fromCache: false };
    } catch (error) {
        console.error("Error generating SOAP note:", error);
        const fallbackResult = {
            transcript,
            s: 'Could not generate from transcript.',
            o: 'Could not generate from transcript.',
            a: 'Could not generate from transcript.',
            p: 'Could not generate from transcript.',
        };
        return { data: fallbackResult, fromCache: false };
    }
};

type SummaryData = { summary: string, escalations: string[] };

export const summarizeInternNotes = async (notes: TeamNote[]): Promise<{ data: SummaryData, fromCache: boolean }> => {
    const noteTexts = notes.map(n => n.content).join('|');
    const cacheKey = `summary:${noteTexts.slice(0, 100)}`;
    const cached = getFromCache<SummaryData>(cacheKey);
    if (cached) {
        return { data: cached, fromCache: true };
    }

    if (import.meta.env.VITE_TEST_MODE === 'true') {
        return {
            data: {
                summary: 'Test Summary',
                escalations: ['Test Escalation']
            },
            fromCache: false
        };
    }

    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: `As a senior attending physician, review the following progress notes from interns. Provide a brief summary of the patient's status and create a list of key points or concerns that may require escalation or your direct attention. Notes:\n${noteTexts}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING, description: "A brief summary of the patient's overall status." },
                        escalations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of critical points needing attention." },
                    },
                    required: ['summary', 'escalations']
                }
            }
        });

        const jsonString = response.text;
        const result = JSON.parse(jsonString);
        setInCache(cacheKey, result);
        return { data: result, fromCache: false };
    } catch (error) {
        console.error("Error summarizing notes:", error);
        const fallbackResult = { summary: 'Failed to generate summary.', escalations: ['API error.'] };
        return { data: fallbackResult, fromCache: false };
    }
};

export const generateChecklist = async (diagnosis: string): Promise<{ data: string[], fromCache: boolean }> => {
    const cacheKey = `checklist:${diagnosis.toLowerCase().trim()}`;
    const cached = getFromCache<string[]>(cacheKey);
    if (cached) {
        return { data: cached, fromCache: true };
    }
    if (import.meta.env.VITE_TEST_MODE === 'true') {
        return { data: ['Test Checklist Item 1', 'Test Checklist Item 2'], fromCache: false };
    }
    try {
        const response = await ai.models.generateContent({
            model: flashModel,
            contents: `Create a standard clinical care checklist for a patient with the following assessment: "${diagnosis}". The checklist should include 5-7 key actions or monitoring points.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        checklist: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of checklist items." }
                    },
                    required: ['checklist']
                }
            }
        });
        const jsonString = response.text;
        const result = JSON.parse(jsonString);
        const checklistItems = result.checklist || [];
        setInCache(cacheKey, checklistItems);
        return { data: checklistItems, fromCache: false };
    } catch (error) {
        console.error("Error generating checklist:", error);
        const fallbackResult = ['Failed to generate checklist due to API error.'];
        return { data: fallbackResult, fromCache: false };
    }
};

export const chatWithGemini = async (history: { role: 'user' | 'ai'; content: string }[], context: string): Promise<string> => {
    try {
        const systemInstruction = `You are MedFlow AI, a helpful, warm, and intelligent clinical assistant. 
        You are chatting with a doctor about a specific patient.
        
        CONTEXT:
        ${context || "No specific patient context provided."}

        RULES:
        1. Be conversational but professional.
        2. Use the provided patient context to answer questions accurately.
        3. If you don't know something, ask clarifying questions.
        4. Always end your response with a newline and "AI-generated — verify clinically."
        5. Use Markdown for formatting (bolding key findings, bullet points).
        `;

        const chat = ai.models.generateContent({
            model: proModel,
            contents: history.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            })),
            config: {
                systemInstruction,
            },
        });

        const response = await chat;
        return response.text;
    } catch (error) {
        console.error("Error in chatWithGemini:", error);
        return "I'm having trouble connecting to the AI service right now. Please try again.";
    }
};

export const answerWithRAG = async (query: string, context: string): Promise<string> => {
    try {
        const systemInstruction = `You are MedFlow AI, a clinical assistant. 
        Answer the user's question based strictly on the provided patient context.
        
        CONTEXT:
        ${context}

        If the answer is not in the context, say "I don't have enough information in the patient record to answer that."
        `;

        const chat = ai.models.generateContent({
            model: proModel,
            contents: [{ role: 'user', parts: [{ text: query }] }],
            config: { systemInstruction },
        });

        const response = await chat;
        return response.text;
    } catch (error) {
        console.error("Error in answerWithRAG:", error);
        return "AI Service Error.";
    }
};


// --- PATIENT WORKSPACE AI HELPERS ---

export const generateOverviewSummary = async (patient: Patient): Promise<PatientOverview> => {
    const context = `
        Generate a concise overview for a clinician.
        Patient: ${patient.name}, ${patient.age}, ${patient.gender}.
        Chief Complaint: ${patient.chiefComplaints?.map(c => `${c.complaint} (${c.durationValue} ${c.durationUnit})`).join(', ') || 'None'}.
        Current Vitals: ${patient.vitals ? `Pulse: ${patient.vitals.pulse}, BP: ${patient.vitals.bp_sys}/${patient.vitals.bp_dia}, SpO2: ${patient.vitals.spo2}%` : 'Not recorded'}.
        Active Orders: ${patient.orders.filter(o => o.status === 'sent' || o.status === 'in_progress').map(o => o.label).join(', ') || 'None'}.
        Latest Round Summary: ${patient.rounds.find(r => r.status === 'signed')?.subjective || 'No rounds yet'}.
    `;
    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: `You are a clinical AI assistant. Based on the following data, generate a structured summary for the patient's overview tab. Each field should be a very brief, single line. \n\n${context}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING, description: "A one-line summary of the patient's current situation." },
                        vitalsSnapshot: { type: Type.STRING, description: "A brief summary of the current vitals (e.g., 'Stable', 'Febrile', 'Tachycardic')." },
                        activeOrders: { type: Type.STRING, description: "A count or brief list of active orders." },
                        recentResults: { type: Type.STRING, description: "Mention any significant recent results, or 'Pending'." },
                    },
                    required: ['summary', 'vitalsSnapshot', 'activeOrders', 'recentResults'],
                },
            },
        });
        return JSON.parse(response.text) as PatientOverview;
    } catch (error) {
        console.error("Error generating overview summary:", error);
        throw error;
    }
};

export const summarizeClinicalFile = async (sections: ClinicalFileSections): Promise<string> => {
    const context = `
        History: ${JSON.stringify(sections.history)}
        GPE: ${JSON.stringify(sections.gpe)}
        Systemic Exams: ${JSON.stringify(sections.systemic)}
    `;
    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: `Summarize the following clinical findings into a concise 3-4 line paragraph for a medical record.\n\n${context}`,
        });
        return response.text;
    } catch (error) {
        console.error("Error summarizing clinical file:", error);
        throw error;
    }
};

type SuggestedOrder = Omit<Order, 'orderId' | 'patientId' | 'createdBy' | 'createdAt' | 'status'>;

export const suggestOrdersFromClinicalFile = async (sections: ClinicalFileSections): Promise<SuggestedOrder[]> => {
    const historyText = JSON.stringify(sections.history);
    const gpeText = JSON.stringify(sections.gpe);
    const examsText = JSON.stringify(sections.systemic);

    const OrderCategoryEnum: OrderCategory[] = ["investigation", "radiology", "medication", "procedure", "nursing", "referral"];
    const OrderPriorityEnum: OrderPriority[] = ["routine", "urgent", "STAT"];

    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: `You are a clinical decision support AI. Given the patient's history and examination findings, suggest relevant initial orders. Format the output as a JSON array of order objects. Include a clinical rationale for each suggestion.
            History: "${historyText}"
            GPE: "${gpeText}"
            Exams: "${examsText}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggested_orders: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    category: { type: Type.STRING, enum: OrderCategoryEnum },
                                    subType: { type: Type.STRING, description: "e.g., CBC, Chest X-ray, Paracetamol" },
                                    label: { type: Type.STRING, description: "Human-readable label for the order." },
                                    priority: { type: Type.STRING, enum: OrderPriorityEnum },
                                    rationale: { type: Type.STRING, description: "Clinical rationale for suggesting this order." },
                                    payload: {
                                        type: Type.OBJECT,
                                        description: "Category-specific details for the order.",
                                        properties: {
                                            dose: { type: Type.STRING },
                                            route: { type: Type.STRING },
                                            frequency: { type: Type.STRING },
                                            region: { type: Type.STRING },
                                            modality: { type: Type.STRING },
                                            sampleType: { type: Type.STRING },
                                        }
                                    }
                                },
                                required: ['category', 'subType', 'label', 'priority', 'rationale']
                            }
                        }
                    },
                    required: ['suggested_orders']
                }
            }
        });
        const result = JSON.parse(response.text);

        // Map rationale to ai_provenance
        return (result.suggested_orders || []).map((o: any) => ({
            ...o,
            ai_provenance: {
                prompt_id: null,
                rationale: o.rationale
            }
        })) as SuggestedOrder[];

    } catch (error) {
        console.error("Error suggesting orders:", error);
        throw error;
    }
};

export const generateStructuredDischargeSummary = async (patient: Patient): Promise<Omit<DischargeSummary, 'id' | 'patientId' | 'doctorId' | 'status' | 'generatedAt'>> => {
    const context = `
        Patient: ${patient.name}, ${patient.age}, ${patient.gender}
        Chief Complaint: ${patient.chiefComplaints?.map(c => `${c.complaint} (${c.durationValue} ${c.durationUnit})`).join(', ') || 'None'}
        
        History & Exam:
        ${JSON.stringify(patient.clinicalFile.sections)}
        
        Hospital Course (Rounds):
        ${patient.rounds.map(r => `[${new Date(r.createdAt).toLocaleDateString()}] ${r.assessment} - ${r.plan.text}`).join('\n')}
        
        Results:
        ${patient.results.map(r => `${r.name}: ${r.value} ${r.unit}`).join(', ')}
        
        Treatments Given:
        ${patient.orders.filter(o => o.status === 'completed' && o.category === 'medication').map(o => o.label).join(', ')}

        Active Medications:
        ${patient.orders.filter(o => (o.status === 'in_progress' || o.status === 'sent') && o.category === 'medication').map(o => `${o.label} ${o.instructions || ''}`).join(', ')}
    `;

    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: `You are generating a formal Discharge Summary for MedFlow Hospital in Bangalore, India.
            CRITICAL INSTRUCTIONS:
            1. Use strictly Indian English spellings (e.g., 'Haemoglobin', 'Oedema', 'Paracetamol').
            2. REMOVE all American references. Use 'Casualty' instead of 'ER', 'Paracetamol' instead of 'Tylenol/Acetaminophen'.
            3. Ensure all generated names or addresses (if any) are Indian.
            4. Sign off as 'Dr. Harikrishnan S' if a name is required in the text.
            
            Based on the clinical data, populate the following structured fields. 
            For 'dischargeMeds', suggest a list of medications available in India.
            For 'finalDiagnosis', suggest the most specific ICD-10 compatible diagnosis string.
            
            \n\nPatient Clinical Data:\n${context}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        finalDiagnosis: { type: Type.STRING, description: "Primary diagnosis." },
                        briefHistory: { type: Type.STRING, description: "Concise history of present illness." },
                        courseInHospital: { type: Type.STRING, description: "Summary of hospital stay, treatments, and progress." },
                        treatmentGiven: { type: Type.STRING, description: "Summary of key treatments administered." },
                        investigationsSummary: { type: Type.STRING, description: "Key abnormal results and relevant negatives." },
                        conditionAtDischarge: { type: Type.STRING, description: "e.g., Stable, Afebrile, Ambulant." },
                        dischargeMeds: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    dosage: { type: Type.STRING },
                                    frequency: { type: Type.STRING },
                                    duration: { type: Type.STRING },
                                    instructions: { type: Type.STRING }
                                }
                            }
                        },
                        dietAdvice: { type: Type.STRING },
                        activityAdvice: { type: Type.STRING },
                        followUpInstructions: { type: Type.STRING },
                        emergencyWarnings: { type: Type.STRING, description: "Signs to return to ER immediately." }
                    },
                    required: ['finalDiagnosis', 'briefHistory', 'courseInHospital', 'treatmentGiven', 'investigationsSummary', 'conditionAtDischarge', 'dischargeMeds', 'dietAdvice', 'activityAdvice', 'followUpInstructions', 'emergencyWarnings']
                }
            }
        });

        const result = JSON.parse(response.text);
        // Sanitize dischargeMeds to remove nulls which might cause UI crashes
        if (Array.isArray(result.dischargeMeds)) {
            result.dischargeMeds = result.dischargeMeds.filter((m: any) => m !== null && m !== undefined);
        }
        return result;
    } catch (error) {
        console.error("Error generating structured discharge summary:", error);
        throw error;
    }
};

export const compileDischargeSummary = async (patient: Patient): Promise<string> => {
    // Deprecated for new workflow but kept for fallback compatibility if needed
    const structured = await generateStructuredDischargeSummary(patient);
    return JSON.stringify(structured);
};

export const getFollowUpQuestions = async (section: keyof ClinicalFileSections, seedText: string): Promise<FollowUpQuestion[]> => {
    try {
        const response = await ai.models.generateContent({
            model: flashModel,
            contents: `You are a clinical history-taking AI. For the "${section}" section, a clinician has provided the following seed information: "${seedText}". Generate 2 to 4 targeted follow-up questions to gather more details. For each question, suggest an answer type ('text' for free-form, 'options' for multiple choice), provide quick option choices if applicable, and include a brief rationale for why the question is clinically relevant.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING, description: "A unique ID for the question, e.g., 'q1'." },
                                    text: { type: Type.STRING, description: "The follow-up question." },
                                    answer_type: { type: Type.STRING, enum: ['text', 'options'] },
                                    quick_options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Optional suggested single-word answers." },
                                    rationale: { type: Type.STRING, description: "Rationale for why this question is important." }
                                },
                                required: ['id', 'text', 'answer_type', 'rationale']
                            }
                        }
                    },
                    required: ['questions']
                }
            }
        });
        const result = JSON.parse(response.text);
        return result.questions || [];
    } catch (error) {
        console.error(`Error getting follow-up questions for ${section}:`, error);
        throw error;
    }
};

export const composeHistoryParagraph = async (section: keyof ClinicalFileSections, seedText: string, answers: Record<string, string>): Promise<ComposedHistory> => {
    const qaText = Object.entries(answers).map(([q, a]) => `Q: ${q}\nA: ${a}`).join('\n');
    try {
        const response = await ai.models.generateContent({
            model: flashModel,
            contents: `You are a clinical documentation assistant. A clinician is documenting the "${section}" section. Based on their initial seed phrase and the follow-up Q&A, compose a concise, professional paragraph for the medical record. \n\nSeed: "${seedText}"\n\nQ&A:\n${qaText}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        paragraph: { type: Type.STRING, description: "The composed paragraph for the history section." }
                    },
                    required: ['paragraph']
                }
            }
        });
        const result = JSON.parse(response.text);
        return result || { paragraph: "Could not generate summary." };
    } catch (error) {
        console.error(`Error composing history for ${section}:`, error);
        return { paragraph: `Based on the initial report of "${seedText}", the following was noted: ${Object.values(answers).join('. ')}.` }; // Simple fallback
    }
};

// --- NEW ROUNDS AI FUNCTIONS ---

export const summarizeChangesSinceLastRound = async (lastRoundAt: string, patient: Patient): Promise<{ summary: string; highlights: string[] }> => {
    // This is a simplified version. A real implementation would fetch changes from a backend.
    const context = `
        Summarize changes since the last round at ${new Date(lastRoundAt).toLocaleString()}.
        Current Vitals: ${JSON.stringify(patient.vitals)}
        New Orders: ${patient.orders.filter(o => new Date(o.createdAt) > new Date(lastRoundAt)).map(o => o.label).join(', ') || 'None'}
    `;
    try {
        const response = await ai.models.generateContent({
            model: flashModel,
            contents: `Generate a 1-line summary and a short list of highlights (e.g., "New CXR report", "Hb ↑") based on the following patient data changes. \n\n${context}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['summary', 'highlights'],
                },
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error summarizing changes:", error);
        return { summary: "Failed to generate summary.", highlights: ["API error"] };
    }
};

export const generateSOAPForRound = async (patient: Patient): Promise<Partial<Round>> => {
    const context = `
        Patient Clinical File: ${JSON.stringify(patient.clinicalFile.sections)}
        Latest Vitals: ${JSON.stringify(patient.vitals)}
        Active Orders: ${patient.orders.filter(o => o.status === 'sent' || o.status === 'in_progress').map(o => o.label).join(', ')}
        Previous Round: ${JSON.stringify(patient.rounds.find(r => r.status === 'signed'))}
    `;
    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: `Generate a draft SOAP note for a new clinical round based on the provided patient context. \n\n${context}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subjective: { type: Type.STRING },
                        objective: { type: Type.STRING },
                        assessment: { type: Type.STRING },
                        plan: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING }
                            }
                        },
                    },
                    required: ['subjective', 'objective', 'assessment', 'plan'],
                },
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error generating SOAP for round:", error);
        throw error;
    }
};

export const crossCheckRound = async (patient: Patient, roundDraft: Round): Promise<{ contradictions: string[]; missingFollowups: string[] }> => {
    const context = `
        Patient History: ${JSON.stringify(patient.clinicalFile.sections.history)}
        Patient GPE: ${JSON.stringify(patient.clinicalFile.sections.gpe)}
        Draft Round Note: ${JSON.stringify(roundDraft)}
    `;
    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: `Cross-check the draft round note against the patient's history and GPE. Identify any direct contradictions or clear missing follow-ups. If none, return empty arrays. \n\n${context}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        contradictions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        missingFollowups: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['contradictions', 'missingFollowups'],
                },
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error cross-checking round:", error);
        return { contradictions: ["AI check failed. Please review manually."], missingFollowups: [] };
    }
};

// --- NEW VITALS TAB AI FUNCTION ---
export const summarizeVitals = async (vitalsHistory: VitalsRecord[]): Promise<{ summary: string }> => {
    const formattedHistory = vitalsHistory.slice(0, 10).map(v =>
        `At ${new Date(v.recordedAt).toLocaleTimeString()}: ` +
        Object.entries(v.measurements).map(([key, value]) => `${key.replace('_', ' ')}: ${value}`).join(', ')
    ).join('\n');

    const context = `Summarize the following recent vitals trend for a clinical handover note. Focus on stability, significant changes, and any abnormal readings. \n\n${formattedHistory}`;

    try {
        const response = await ai.models.generateContent({
            model: flashModel,
            contents: context,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING, description: "A concise summary of the vitals trend." },
                    },
                    required: ['summary'],
                },
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error summarizing vitals:", error);
        return { summary: "Failed to generate AI summary." };
    }
};

export const generateHandoverSummary = async (patient: Patient): Promise<string> => {
    const context = `
        Patient: ${patient.name}, ${patient.age}, ${patient.gender}, ID: ${patient.id}
        Diagnosis/Problem: ${patient.clinicalFile.aiSummary || patient.chiefComplaints?.map(c => c.complaint).join(', ')}
        
        Recent Rounds: ${patient.rounds.slice(0, 2).map(r => r.assessment + ' - ' + r.plan.text).join('; ')}
        Current Vitals: ${JSON.stringify(patient.vitals)}
        Active Treatments: ${patient.orders.filter(o => o.status === 'in_progress' || o.status === 'sent').map(o => o.label).join(', ')}
        Recent Investigations: ${patient.results.slice(0, 3).map(r => r.name + ' (' + r.value + ')').join(', ')}
    `;

    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: `Generate a structured ISBAR handover summary for the incoming doctor.
            Structure:
            1. Identification (Patient details)
            2. Situation (Current problem/diagnosis)
            3. Background (Brief history & complications if any)
            4. Assessment (Current status, stable/unstable, key results)
            5. Recommendation (To-do list for next shift)

            Keep it professional, concise, and bulleted.
            \n\nData: ${context}`,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating handover:", error);
        return "Failed to generate handover summary.";
    }
};

// --- NEW AI FUNCTIONS FOR MISSING FEATURES ---

export const scanForMissingInfo = async (section: keyof ClinicalFileSections, currentData: any): Promise<string[]> => {
    const context = JSON.stringify(currentData);
    try {
        const response = await ai.models.generateContent({
            model: flashModel,
            contents: `Analyze the following "${section}" section of a clinical file. Identify critical missing information that is standard for a complete medical record. Return a list of missing items. If nothing critical is missing, return an empty list. \n\nData: ${context}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        missing_items: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['missing_items']
                }
            }
        });
        const result = JSON.parse(response.text);
        return result.missing_items || [];
    } catch (error) {
        console.error("Error scanning for missing info:", error);
        return [];
    }
};

export const summarizeSection = async (section: keyof ClinicalFileSections, currentData: any): Promise<string> => {
    const context = JSON.stringify(currentData);
    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: `Summarize the findings of the "${section}" section into a concise, professional clinical paragraph. \n\nData: ${context}`,
        });
        return response.text;
    } catch (error) {
        console.error("Error summarizing section:", error);
        return "Failed to generate summary.";
    }
};

export const crossCheckClinicalFile = async (sections: ClinicalFileSections): Promise<string[]> => {
    const context = JSON.stringify(sections);
    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: `Review the entire clinical file for internal inconsistencies (e.g., "No allergies" in history but "Allergic to Penicillin" in notes, or "Diabetic" in history but "No history of diabetes" in another section). Return a list of specific inconsistencies found. \n\nFile: ${context}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        inconsistencies: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['inconsistencies']
                }
            }
        });
        const result = JSON.parse(response.text);
        return result.inconsistencies || [];
    } catch (error) {
        console.error("Error cross-checking file:", error);
        return [];
    }
};

export const checkOrderSafety = async (newOrder: Order, patient: Patient): Promise<{ safe: boolean; warning?: string }> => {
    const context = `
        Patient: ${patient.name}, Age: ${patient.age}
        Allergies: ${JSON.stringify(patient.clinicalFile.sections.history?.allergy_history || [])}
        Active Meds: ${patient.orders.filter(o => o.category === 'medication' && (o.status === 'in_progress' || o.status === 'sent')).map(o => o.label).join(', ')}
        Conditions: ${JSON.stringify(patient.clinicalFile.sections.history?.past_medical_history || '')}
        New Order: ${newOrder.label} (${newOrder.category})
    `;

    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: `Review the following medication order for safety against the patient's record. Check for allergies, drug-condition interactions, and major drug-drug interactions. \n\nContext: ${context}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        safe: { type: Type.BOOLEAN },
                        warning: { type: Type.STRING }
                    },
                    required: ['safe']
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error checking order safety:", error);
        return { safe: true }; // Default to safe if AI fails, to not block workflow (with caution)
    }
};

// --- SCRIBE & DRAFTING (Phase 4) ---

export interface SOAPDraftResponse {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    suggestedOrders: string[];
}

export const generateSOAPDraft = async (transcript: string): Promise<SOAPDraftResponse> => {
    // Check for API Key (Mocking Strategy)
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('YOUR_API_KEY')) {
        console.log("Mocking Gemini Response for Scribe...");
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
        return {
            subjective: "58y Male presents with acute retrosternal chest pain started 2 hours ago. Radiating to left arm. Associated with sweating. No nausea/vomiting. History of HTN.",
            objective: "Pt looks anxious. Diaphoretic. BP 160/90, HR 98 regular. Chest clear. CVS: S1 S2 heard, no murmurs. Abdomen soft.",
            assessment: "Acute Coronary Syndrome (ACS) - NSTE-ACS likely. Differential: Stable Angina, GERD.",
            plan: "Immediate ECG. Troponin T. Aspirin 300mg stat. Clopidogrel 300mg stat. Admit to CCU.",
            suggestedOrders: ["ECG", "Troponin I", "CBC", "Lipid Profile", "Aspirin 300mg PO", "Clopidogrel 300mg PO"]
        };
    }

    try {
        const prompt = `
        Act as an expert medical scribe. Convert the following transcript into a structured clinical note (SOAP format).
        Return purely JSON: { subjective, objective, assessment, plan, suggestedOrders: string[] }.
        
        Transcript: "${transcript}"
        `;

        const response = await ai.models.generateContent({
            model: proModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subjective: { type: Type.STRING },
                        objective: { type: Type.STRING },
                        assessment: { type: Type.STRING },
                        plan: { type: Type.STRING },
                        suggestedOrders: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });

        const text = response.text;
        return JSON.parse(text) as SOAPDraftResponse;
    } catch (error) {
        console.error("Gemini Scribe Error:", error);
        // Fallback Mock on Error
        return {
            subjective: "Error processing transcript.",
            objective: "Unable to extract objective findings.",
            assessment: "Processing Error.",
            plan: "Please review transcript manually.",
            suggestedOrders: []
        };
    }
};

export const suggestRevenueFlags = async (notes: string, orders: string[]): Promise<string[]> => {
    // Placeholder for Phase 5 logic
    return [];
};


export const generateClinicalFileFromTranscript = async (transcript: string): Promise<Partial<ClinicalFileSections>> => {
    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: `You are an advanced medical scribe AI. Your task is to listen to a doctor-patient conversation (transcript) and extract structured clinical data to populate the patient's Clinical File.
            
            Transcript: "${transcript}"
            
            Extract the following sections if present:
            - history: { complaints, hpi, past_medical_history, drug_history, family_history, personal_social_history, allergy_history }
            - gpe: { general_appearance, build, flags (pallor, icterus, etc.) }
            - systemic: { cvs, rs, abdomen, cns, msk } (summaries for each)
            
            Return a JSON object matching the ClinicalFileSections structure. Omit fields that are not mentioned.
            For 'complaints', return an array of { symptom, duration }.
            For 'allergy_history', return an array of { substance, reaction, severity }.
            For 'flags' in GPE, return a boolean map.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        history: {
                            type: Type.OBJECT,
                            properties: {
                                complaints: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            symptom: { type: Type.STRING },
                                            duration: { type: Type.STRING }
                                        }
                                    }
                                },
                                hpi: { type: Type.STRING },
                                past_medical_history: { type: Type.STRING },
                                drug_history: { type: Type.STRING },
                                family_history: { type: Type.STRING },
                                personal_social_history: { type: Type.STRING },
                                allergy_history: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            substance: { type: Type.STRING },
                                            reaction: { type: Type.STRING },
                                            severity: { type: Type.STRING }
                                        }
                                    }
                                }
                            }
                        },
                        gpe: {
                            type: Type.OBJECT,
                            properties: {
                                general_appearance: { type: Type.STRING },
                                build: { type: Type.STRING },
                                flags: {
                                    type: Type.OBJECT,
                                    properties: {
                                        pallor: { type: Type.BOOLEAN },
                                        icterus: { type: Type.BOOLEAN },
                                        cyanosis: { type: Type.BOOLEAN },
                                        clubbing: { type: Type.BOOLEAN },
                                        lad: { type: Type.BOOLEAN },
                                        edema: { type: Type.BOOLEAN }
                                    }
                                }
                            }
                        },
                        systemic: {
                            type: Type.OBJECT,
                            properties: {
                                cvs: { type: Type.OBJECT, properties: { summary: { type: Type.STRING } } },
                                rs: { type: Type.OBJECT, properties: { summary: { type: Type.STRING } } },
                                abdomen: { type: Type.OBJECT, properties: { summary: { type: Type.STRING } } },
                                cns: { type: Type.OBJECT, properties: { summary: { type: Type.STRING } } },
                                msk: { type: Type.OBJECT, properties: { summary: { type: Type.STRING } } }
                            }
                        }
                    }
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error generating clinical file from transcript:", error);
        throw error;
    }
};