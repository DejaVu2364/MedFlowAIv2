// ProactiveSuggestions.test.ts - Unit tests for proactive suggestions

import { describe, it, expect, beforeEach } from 'vitest';
import {
    checkVitalsThresholds,
    detectMissingFields,
    checkTimeBased,
    getAllSuggestions,
    suggestionToInsight
} from '../services/jarvis/ProactiveSuggestions';
import { Patient } from '../types';

// Mock patient factory
const createMockPatient = (overrides: Partial<Patient> = {}): Patient => ({
    id: 'test-patient-1',
    name: 'Test Patient',
    age: 45,
    gender: 'Male',
    registrationTime: new Date().toISOString(),
    status: 'In Treatment',
    triage: { level: 'Yellow', chiefComplaint: 'Chest pain' },
    vitals: {
        bp_sys: 120,
        bp_dia: 80,
        pulse: 72,
        rr: 16,
        spo2: 98,
        temp_c: 36.8,
        timestamp: new Date().toISOString()
    },
    orders: [],
    results: [],
    notes: [],
    clinicalFile: {
        status: 'draft',
        sections: {
            history: {},
            gpe: {},
            systemic: {}
        }
    },
    ...overrides
} as Patient);

describe('ProactiveSuggestions', () => {
    describe('checkVitalsThresholds', () => {
        it('returns empty array for normal vitals', () => {
            const patient = createMockPatient();
            const suggestions = checkVitalsThresholds(patient);

            const vitalAlerts = suggestions.filter(s => s.type === 'vitals_alert');
            expect(vitalAlerts).toHaveLength(0);
        });

        it('alerts when SpO2 < 92% (low)', () => {
            const patient = createMockPatient({
                vitals: { ...createMockPatient().vitals!, spo2: 90 }
            });
            const suggestions = checkVitalsThresholds(patient);

            expect(suggestions).toContainEqual(
                expect.objectContaining({
                    id: 'vitals_spo2_low',
                    severity: 'medium'
                })
            );
        });

        it('alerts critical when SpO2 < 88%', () => {
            const patient = createMockPatient({
                vitals: { ...createMockPatient().vitals!, spo2: 85 }
            });
            const suggestions = checkVitalsThresholds(patient);

            expect(suggestions).toContainEqual(
                expect.objectContaining({
                    id: 'vitals_spo2_critical',
                    severity: 'high'
                })
            );
        });

        it('alerts when systolic BP > 180', () => {
            const patient = createMockPatient({
                vitals: { ...createMockPatient().vitals!, bp_sys: 190, bp_dia: 100 }
            });
            const suggestions = checkVitalsThresholds(patient);

            const bpAlert = suggestions.find(s => s.id === 'vitals_bp_high');
            expect(bpAlert).toBeDefined();
            expect(bpAlert?.severity).toBe('high');
            expect(bpAlert?.message).toContain('190');
        });

        it('alerts when systolic BP < 90 (hypotension)', () => {
            const patient = createMockPatient({
                vitals: { ...createMockPatient().vitals!, bp_sys: 85, bp_dia: 55 }
            });
            const suggestions = checkVitalsThresholds(patient);

            expect(suggestions).toContainEqual(
                expect.objectContaining({
                    id: 'vitals_bp_low',
                    severity: 'high'
                })
            );
        });

        it('alerts when HR > 120 (tachycardia)', () => {
            const patient = createMockPatient({
                vitals: { ...createMockPatient().vitals!, pulse: 130 }
            });
            const suggestions = checkVitalsThresholds(patient);

            expect(suggestions).toContainEqual(
                expect.objectContaining({
                    id: 'vitals_hr_high',
                    message: expect.stringContaining('130')
                })
            );
        });

        it('alerts when HR < 50 (bradycardia)', () => {
            const patient = createMockPatient({
                vitals: { ...createMockPatient().vitals!, pulse: 45 }
            });
            const suggestions = checkVitalsThresholds(patient);

            expect(suggestions).toContainEqual(
                expect.objectContaining({
                    id: 'vitals_hr_low'
                })
            );
        });

        it('alerts when temp > 38.5 (fever)', () => {
            const patient = createMockPatient({
                vitals: { ...createMockPatient().vitals!, temp_c: 39.2 }
            });
            const suggestions = checkVitalsThresholds(patient);

            expect(suggestions).toContainEqual(
                expect.objectContaining({
                    id: 'vitals_fever',
                    message: expect.stringContaining('39.2')
                })
            );
        });

        it('alerts when RR > 24 (tachypnea)', () => {
            const patient = createMockPatient({
                vitals: { ...createMockPatient().vitals!, rr: 28 }
            });
            const suggestions = checkVitalsThresholds(patient);

            expect(suggestions).toContainEqual(
                expect.objectContaining({
                    id: 'vitals_rr_high'
                })
            );
        });

        it('returns empty for patient without vitals', () => {
            const patient = createMockPatient({ vitals: undefined });
            const suggestions = checkVitalsThresholds(patient);

            expect(suggestions).toHaveLength(0);
        });
    });

    describe('detectMissingFields', () => {
        it('detects missing allergy history', () => {
            const suggestions = detectMissingFields({
                history: {
                    complaints: [{ symptom: 'fever', duration: '2 days' }]
                }
            });

            expect(suggestions).toContainEqual(
                expect.objectContaining({
                    id: 'missing_allergy_history',
                    severity: 'high'
                })
            );
        });

        it('detects missing drug history', () => {
            const suggestions = detectMissingFields({
                history: {
                    complaints: [{ symptom: 'fever' }],
                    allergy_history: []
                }
            });

            expect(suggestions).toContainEqual(
                expect.objectContaining({
                    id: 'missing_drug_history'
                })
            );
        });

        it('detects missing complaints', () => {
            const suggestions = detectMissingFields({
                history: {}
            });

            expect(suggestions).toContainEqual(
                expect.objectContaining({
                    id: 'missing_complaints'
                })
            );
        });

        it('no alerts when all fields present', () => {
            const suggestions = detectMissingFields({
                history: {
                    complaints: [{ symptom: 'pain' }],
                    allergy_history: [{ substance: 'NKDA', reaction: '', severity: '' }],
                    drug_history: 'None'
                }
            });

            expect(suggestions).toHaveLength(0);
        });

        it('includes suggested questions', () => {
            const suggestions = detectMissingFields({ history: {} });

            const allergyMissing = suggestions.find(s => s.id === 'missing_allergy_history');
            expect(allergyMissing?.suggestedQuestion).toContain('allerg');
        });
    });

    describe('checkTimeBased', () => {
        it('alerts when patient waiting > 4 hours with pending labs', () => {
            const fourHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
            const patient = createMockPatient({
                registrationTime: fourHoursAgo,
                status: 'In Treatment',
                orders: [{ id: '1', category: 'investigation', item: 'CBC', status: 'pending' }] as any
            });

            const suggestions = checkTimeBased(patient);

            expect(suggestions).toContainEqual(
                expect.objectContaining({
                    id: 'time_labs_delayed',
                    type: 'time_based'
                })
            );
        });

        it('alerts when discharged without summary', () => {
            const patient = createMockPatient({
                status: 'Discharged',
                dischargeSummary: undefined
            });

            const suggestions = checkTimeBased(patient);

            expect(suggestions).toContainEqual(
                expect.objectContaining({
                    id: 'discharge_summary_pending',
                    type: 'workflow'
                })
            );
        });
    });

    describe('getAllSuggestions', () => {
        it('combines all suggestion types', () => {
            const patient = createMockPatient({
                vitals: { ...createMockPatient().vitals!, spo2: 88 },
                clinicalFile: {
                    status: 'draft',
                    sections: { history: {}, gpe: {}, systemic: {} }
                }
            });

            const suggestions = getAllSuggestions(patient);

            // Should have vitals alert and missing field alerts
            expect(suggestions.some(s => s.type === 'vitals_alert')).toBe(true);
            expect(suggestions.some(s => s.type === 'missing_field')).toBe(true);
        });
    });

    describe('suggestionToInsight', () => {
        it('converts suggestion to JarvisInsight format', () => {
            const suggestion = {
                id: 'vitals_spo2_low',
                type: 'vitals_alert' as const,
                severity: 'medium' as const,
                message: 'SpO2 is 90%',
                action: { type: 'order' as const, payload: { subType: 'o2' } }
            };

            const insight = suggestionToInsight(suggestion, 'patient-123');

            expect(insight.id).toBe('vitals_spo2_low');
            expect(insight.patientId).toBe('patient-123');
            expect(insight.category).toBe('vitals');
            expect(insight.suggestedAction?.type).toBe('order');
        });

        it('maps documentation type correctly', () => {
            const suggestion = {
                id: 'missing_allergy_history',
                type: 'missing_field' as const,
                severity: 'high' as const,
                message: 'Allergy history not documented'
            };

            const insight = suggestionToInsight(suggestion);

            expect(insight.category).toBe('documentation');
        });
    });
});
