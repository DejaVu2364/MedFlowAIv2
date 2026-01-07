// ClinicalExtractor.ts - Extracts clinical data from conversation transcripts
// Uses Gemini to parse doctor-patient dialogue into structured ClinicalFileSections

import {
    HistorySectionData,
    GPESectionData,
    SystemicExamSectionData,
    Complaint,
    Allergy,
    ClinicalFileSections
} from '../../types';
import { chatWithGemini } from '../geminiService';

export interface ExtractionResult {
    extractedFields: Partial<ClinicalFileSections>;
    missingFields: string[];
    suggestedQuestions: string[];
    confidence: Record<string, number>;
    rawResponse?: string;
}

const CLINICAL_EXTRACTION_PROMPT = `
You are a clinical AI assistant analyzing a doctor-patient conversation transcript.

TRANSCRIPT:
"""
{{TRANSCRIPT}}
"""

Extract clinical information into this EXACT JSON structure. Use null for fields not mentioned.
Only extract information that is EXPLICITLY stated in the conversation.

{
  "history": {
    "complaints": [
      { "symptom": "string", "duration": "string", "severity": "mild|moderate|severe|null", "notes": "string|null" }
    ],
    "hpi": "narrative string describing the illness",
    "past_medical_history": "string|null",
    "past_surgical_history": "string|null",
    "drug_history": "string|null",
    "allergy_history": [
      { "substance": "string", "reaction": "string", "severity": "Mild|Moderate|Severe" }
    ],
    "family_history": "string|null",
    "personal_social_history": "string|null"
  },
  "gpe": {
    "general_appearance": "well|fair|ill|toxic|cachectic|null",
    "build": "normal|obese|cachectic|null",
    "hydration": "normal|mild|moderate|severe|null",
    "flags": {
      "pallor": true|false|null,
      "icterus": true|false|null,
      "cyanosis": true|false|null,
      "clubbing": true|false|null,
      "lymphadenopathy": true|false|null,
      "edema": true|false|null
    },
    "vitals_mentioned": {
      "bp_sys": "number|null",
      "bp_dia": "number|null",
      "pulse": "number|null",
      "rr": "number|null",
      "spo2": "number|null",
      "temp_c": "number|null"
    },
    "remarks": "string|null"
  },
  "systemic": {
    "cvs": { "inspection": "", "palpation": "", "percussion": "", "auscultation": "", "summary": "" },
    "rs": { "inspection": "", "palpation": "", "percussion": "", "auscultation": "", "summary": "" },
    "cns": { "inspection": "", "palpation": "", "percussion": "", "auscultation": "", "summary": "" },
    "abdomen": { "inspection": "", "palpation": "", "percussion": "", "auscultation": "", "summary": "" }
  },
  "missingCritical": ["list of critical missing fields like allergy_history, drug_history"],
  "suggestedQuestions": [
    "Question to ask for missing information",
    "Another question if needed"
  ],
  "confidence": {
    "complaints": 0.0-1.0,
    "hpi": 0.0-1.0,
    "allergy_history": 0.0-1.0
  }
}

RULES:
1. Extract ONLY what is explicitly stated - do not infer
2. For systemic exam, look for terms like "S1S2 normal", "bilateral crepts", "soft non-tender"
3. Confidence = 0 if not mentioned, 1.0 if clearly stated
4. missingCritical should include: allergy_history, drug_history if not mentioned
5. suggestedQuestions should help fill gaps
6. Return ONLY valid JSON, no markdown or explanation
`;

export const extractClinicalDataFromTranscript = async (
    transcript: string
): Promise<ExtractionResult> => {
    if (!transcript.trim()) {
        return {
            extractedFields: {},
            missingFields: ['transcript_empty'],
            suggestedQuestions: [],
            confidence: {}
        };
    }

    const prompt = CLINICAL_EXTRACTION_PROMPT.replace('{{TRANSCRIPT}}', transcript);

    try {
        const response = await chatWithGemini(
            [{ role: 'user', content: prompt }],
            'You are a clinical data extraction assistant. Return only valid JSON.'
        );

        if (!response) {
            throw new Error('Empty response from Gemini');
        }

        // Parse JSON response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Map to our types
        const extractedFields: Partial<ClinicalFileSections> = {
            history: mapHistoryFields(parsed.history),
            gpe: mapGPEFields(parsed.gpe),
            systemic: mapSystemicFields(parsed.systemic)
        };

        return {
            extractedFields,
            missingFields: parsed.missingCritical || [],
            suggestedQuestions: parsed.suggestedQuestions || [],
            confidence: parsed.confidence || {},
            rawResponse: response
        };
    } catch (error) {
        console.error('[ClinicalExtractor] Extraction failed:', error);
        return {
            extractedFields: {},
            missingFields: ['extraction_failed'],
            suggestedQuestions: ['Could not extract data. Please try again.'],
            confidence: {}
        };
    }
};

// Map raw history response to HistorySectionData
const mapHistoryFields = (raw: any): Partial<HistorySectionData> | undefined => {
    if (!raw) return undefined;

    const complaints: Complaint[] = (raw.complaints || []).map((c: any) => ({
        symptom: c.symptom || '',
        duration: c.duration || '',
        severity: c.severity || '',
        notes: c.notes || ''
    })).filter((c: Complaint) => c.symptom);

    const allergies: Allergy[] = (raw.allergy_history || []).map((a: any) => ({
        substance: a.substance || '',
        reaction: a.reaction || '',
        severity: a.severity || ''
    })).filter((a: Allergy) => a.substance);

    return {
        complaints: complaints.length > 0 ? complaints : undefined,
        hpi: raw.hpi || undefined,
        past_medical_history: raw.past_medical_history || undefined,
        past_surgical_history: raw.past_surgical_history || undefined,
        drug_history: raw.drug_history || undefined,
        allergy_history: allergies.length > 0 ? allergies : undefined,
        family_history: raw.family_history || undefined,
        personal_social_history: raw.personal_social_history || undefined
    };
};

// Map raw GPE response to GPESectionData
const mapGPEFields = (raw: any): Partial<GPESectionData> | undefined => {
    if (!raw) return undefined;

    return {
        general_appearance: raw.general_appearance || undefined,
        build: raw.build || undefined,
        hydration: raw.hydration || undefined,
        flags: raw.flags ? {
            pallor: raw.flags.pallor ?? false,
            icterus: raw.flags.icterus ?? false,
            cyanosis: raw.flags.cyanosis ?? false,
            clubbing: raw.flags.clubbing ?? false,
            lymphadenopathy: raw.flags.lymphadenopathy ?? false,
            edema: raw.flags.edema ?? false
        } : undefined,
        remarks: raw.remarks || undefined
    };
};

// Map raw systemic response to SystemicExamSectionData
const mapSystemicFields = (raw: any): Partial<SystemicExamSectionData> | undefined => {
    if (!raw) return undefined;

    const mapSystem = (sys: any) => {
        if (!sys) return undefined;
        const hasData = sys.inspection || sys.palpation || sys.percussion || sys.auscultation || sys.summary;
        if (!hasData) return undefined;
        return {
            inspection: sys.inspection || '',
            palpation: sys.palpation || '',
            percussion: sys.percussion || '',
            auscultation: sys.auscultation || '',
            summary: sys.summary || ''
        };
    };

    return {
        cvs: mapSystem(raw.cvs),
        rs: mapSystem(raw.rs),
        cns: mapSystem(raw.cns),
        abdomen: mapSystem(raw.abdomen)
    };
};

// Quick extraction for incremental updates (lighter prompt)
export const quickExtractComplaints = async (
    transcript: string
): Promise<Complaint[]> => {
    const prompt = `
Extract chief complaints from this conversation. Return JSON array only:
[{ "symptom": "string", "duration": "string", "severity": "mild|moderate|severe|null" }]

Transcript: "${transcript}"
`;

    try {
        const response = await chatWithGemini(
            [{ role: 'user', content: prompt }],
            ''
        );

        const jsonMatch = response?.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error('[ClinicalExtractor] Quick extract failed:', e);
    }

    return [];
};

export default extractClinicalDataFromTranscript;
