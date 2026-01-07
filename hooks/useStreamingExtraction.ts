// useStreamingExtraction.ts - Real-time extraction while speaking
// Shows partial results as doctor speaks

import { useState, useEffect, useRef, useCallback } from 'react';
import { Complaint, ClinicalFileSections } from '../../types';
import { chatWithGemini } from '../../services/geminiService';

export interface StreamingExtractionState {
    partialData: Partial<ClinicalFileSections>;
    extractedComplaints: Complaint[];
    isExtracting: boolean;
    lastExtractedAt: number | null;
}

// Lighter prompt for quick extraction during recording
const QUICK_EXTRACTION_PROMPT = `
Extract ONLY what is clearly stated in this conversation snippet.
Return JSON with found items only:

{
  "complaints": [{ "symptom": "string", "duration": "string or null" }],
  "vitals_mentioned": { "bp_sys": null, "bp_dia": null, "pulse": null, "spo2": null },
  "keywords": ["any medical keywords found"]
}

Conversation: "{{TRANSCRIPT}}"

Return ONLY valid JSON, no explanation.
`;

export const useStreamingExtraction = (
    transcript: string,
    isListening: boolean,
    debounceMs: number = 5000
) => {
    const [state, setState] = useState<StreamingExtractionState>({
        partialData: {},
        extractedComplaints: [],
        isExtracting: false,
        lastExtractedAt: null
    });

    const lastTranscriptRef = useRef<string>('');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const extractionCountRef = useRef<number>(0);

    // Quick extraction function
    const quickExtract = useCallback(async (text: string) => {
        if (text.length < 30) return; // Too short to extract

        setState(prev => ({ ...prev, isExtracting: true }));

        try {
            const prompt = QUICK_EXTRACTION_PROMPT.replace('{{TRANSCRIPT}}', text);
            const response = await chatWithGemini(
                [{ role: 'user', content: prompt }],
                'Extract clinical data. Return only JSON.'
            );

            if (!response) return;

            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return;

            const parsed = JSON.parse(jsonMatch[0]);

            // Merge new complaints with existing (deduplicate)
            const newComplaints = (parsed.complaints || []).filter((c: Complaint) => c.symptom);

            setState(prev => {
                // Merge complaints, avoiding duplicates
                const existingSymptoms = new Set(prev.extractedComplaints.map(c => c.symptom.toLowerCase()));
                const uniqueNew = newComplaints.filter(
                    (c: Complaint) => !existingSymptoms.has(c.symptom.toLowerCase())
                );

                return {
                    partialData: {
                        ...prev.partialData,
                        history: {
                            ...prev.partialData.history,
                            complaints: [...prev.extractedComplaints, ...uniqueNew]
                        }
                    },
                    extractedComplaints: [...prev.extractedComplaints, ...uniqueNew],
                    isExtracting: false,
                    lastExtractedAt: Date.now()
                };
            });

            extractionCountRef.current += 1;
        } catch (error) {
            console.error('[StreamingExtraction] Quick extract failed:', error);
            setState(prev => ({ ...prev, isExtracting: false }));
        }
    }, []);

    // Debounced extraction effect
    useEffect(() => {
        // Only extract if listening and transcript changed significantly
        if (!isListening) return;

        const newWords = transcript.split(' ').length;
        const lastWords = lastTranscriptRef.current.split(' ').length;

        // Require at least 10 new words before re-extracting
        if (newWords - lastWords < 10 && lastTranscriptRef.current.length > 0) {
            return;
        }

        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout
        timeoutRef.current = setTimeout(() => {
            if (transcript !== lastTranscriptRef.current) {
                lastTranscriptRef.current = transcript;
                quickExtract(transcript);
            }
        }, debounceMs);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [transcript, isListening, debounceMs, quickExtract]);

    // Reset when starting new recording
    const reset = useCallback(() => {
        setState({
            partialData: {},
            extractedComplaints: [],
            isExtracting: false,
            lastExtractedAt: null
        });
        lastTranscriptRef.current = '';
        extractionCountRef.current = 0;
    }, []);

    return {
        ...state,
        extractionCount: extractionCountRef.current,
        reset
    };
};

export default useStreamingExtraction;
