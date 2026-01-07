// ClinicalExtractor.test.ts - Unit tests for clinical data extraction

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractClinicalDataFromTranscript, mapHistoryFields, mapGPEFields } from '../services/jarvis/ClinicalExtractor';

// Mock the Gemini service
vi.mock('../services/geminiService', () => ({
    chatWithGemini: vi.fn()
}));

import { chatWithGemini } from '../services/geminiService';
const mockChatWithGemini = chatWithGemini as any;

describe('ClinicalExtractor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('extractClinicalDataFromTranscript', () => {
        it('returns empty result for empty transcript', async () => {
            const result = await extractClinicalDataFromTranscript('');

            expect(result.extractedFields).toEqual({});
            expect(result.missingFields).toContain('transcript_empty');
        });

        it('returns empty result for whitespace-only transcript', async () => {
            const result = await extractClinicalDataFromTranscript('   \n\t  ');

            expect(result.missingFields).toContain('transcript_empty');
        });

        it('extracts chief complaints with duration', async () => {
            mockChatWithGemini.mockResolvedValueOnce(JSON.stringify({
                history: {
                    complaints: [
                        { symptom: 'chest pain', duration: '3 days', severity: 'moderate' }
                    ],
                    hpi: 'Patient presents with chest pain for 3 days'
                },
                missingCritical: ['allergy_history'],
                suggestedQuestions: ['Do you have any drug allergies?'],
                confidence: { complaints: 0.9, hpi: 0.85 }
            }));

            const result = await extractClinicalDataFromTranscript(
                'Patient has chest pain for 3 days, moderate severity'
            );

            expect(result.extractedFields.history?.complaints).toHaveLength(1);
            expect(result.extractedFields.history?.complaints?.[0].symptom).toBe('chest pain');
            expect(result.extractedFields.history?.complaints?.[0].duration).toBe('3 days');
            expect(result.confidence.complaints).toBe(0.9);
        });

        it('detects missing allergy history', async () => {
            mockChatWithGemini.mockResolvedValueOnce(JSON.stringify({
                history: {
                    complaints: [{ symptom: 'fever', duration: '2 days' }]
                },
                missingCritical: ['allergy_history', 'drug_history'],
                suggestedQuestions: ['Do you have any drug allergies?'],
                confidence: { complaints: 0.8 }
            }));

            const result = await extractClinicalDataFromTranscript(
                'Patient has fever for 2 days'
            );

            expect(result.missingFields).toContain('allergy_history');
            expect(result.suggestedQuestions.length).toBeGreaterThan(0);
        });

        it('extracts allergy history when mentioned', async () => {
            mockChatWithGemini.mockResolvedValueOnce(JSON.stringify({
                history: {
                    complaints: [],
                    allergy_history: [
                        { substance: 'Penicillin', reaction: 'rash', severity: 'Moderate' }
                    ]
                },
                missingCritical: [],
                confidence: { allergy_history: 0.95 }
            }));

            const result = await extractClinicalDataFromTranscript(
                'Patient is allergic to penicillin, gets rash'
            );

            expect(result.extractedFields.history?.allergy_history).toHaveLength(1);
            expect(result.extractedFields.history?.allergy_history?.[0].substance).toBe('Penicillin');
            expect(result.missingFields).not.toContain('allergy_history');
        });

        it('extracts GPE flags when mentioned', async () => {
            mockChatWithGemini.mockResolvedValueOnce(JSON.stringify({
                gpe: {
                    general_appearance: 'ill',
                    flags: {
                        pallor: true,
                        icterus: false,
                        edema: true
                    }
                },
                confidence: { gpe: 0.88 }
            }));

            const result = await extractClinicalDataFromTranscript(
                'Patient looks ill, pallor present, bilateral pedal edema'
            );

            expect(result.extractedFields.gpe?.general_appearance).toBe('ill');
            expect(result.extractedFields.gpe?.flags?.pallor).toBe(true);
            expect(result.extractedFields.gpe?.flags?.edema).toBe(true);
            expect(result.extractedFields.gpe?.flags?.icterus).toBe(false);
        });

        it('extracts systemic exam findings', async () => {
            mockChatWithGemini.mockResolvedValueOnce(JSON.stringify({
                systemic: {
                    cvs: {
                        auscultation: 'S1S2 normal, no murmur',
                        summary: 'CVS normal'
                    },
                    rs: {
                        auscultation: 'bilateral crepts',
                        summary: 'RS: bilateral crepts'
                    }
                },
                confidence: { systemic: 0.82 }
            }));

            const result = await extractClinicalDataFromTranscript(
                'On cardiovascular exam S1S2 normal no murmur. Respiratory exam shows bilateral crepts'
            );

            expect(result.extractedFields.systemic?.cvs?.auscultation).toContain('S1S2');
            expect(result.extractedFields.systemic?.rs?.auscultation).toContain('crepts');
        });

        it('handles malformed JSON response gracefully', async () => {
            mockChatWithGemini.mockResolvedValueOnce('This is not valid JSON');

            const result = await extractClinicalDataFromTranscript(
                'Some patient conversation'
            );

            expect(result.extractedFields).toEqual({});
            expect(result.missingFields).toContain('extraction_failed');
        });

        it('handles API error gracefully', async () => {
            mockChatWithGemini.mockRejectedValueOnce(new Error('API Error'));

            const result = await extractClinicalDataFromTranscript(
                'Some patient conversation'
            );

            expect(result.extractedFields).toEqual({});
            expect(result.missingFields).toContain('extraction_failed');
        });
    });

    describe('quickExtractComplaints', () => {
        it('extracts complaints quickly', async () => {
            mockChatWithGemini.mockResolvedValueOnce(JSON.stringify([
                { symptom: 'headache', duration: '1 day', severity: 'mild' }
            ]));

            // Import the function directly for this test
            const { quickExtractComplaints } = await import('../services/jarvis/ClinicalExtractor');
            const result = await quickExtractComplaints('Patient has headache since yesterday');

            expect(result).toHaveLength(1);
            expect(result[0].symptom).toBe('headache');
        });
    });
});
