import { describe, it, expect } from 'vitest';
import { calculateOccupancy, deriveFocusGroups, FocusGroup } from '../../utils/dashboardLogicV2';
import { Patient, Order, DischargeSummary, Triage, TriageLevel } from '../../types';

// Mock Data Helper
const createMockPatient = (overrides: Partial<Patient> = {}): Patient => ({
    id: 'test-pat-1',
    name: 'Test Patient',
    age: 30,
    gender: 'Male',
    contact: '',
    chiefComplaints: [],
    status: 'In Treatment',
    triage: { level: 'Green', reasons: [] },
    registrationTime: new Date().toISOString(),
    timeline: [],
    orders: [],
    results: [],
    rounds: [],
    vitalsHistory: [],
    clinicalFile: {
        id: 'cf-1',
        patientId: 'test-pat-1',
        status: 'draft',
        sections: { history: {}, gpe: {}, systemic: {} }
    },
    ...overrides
});

describe('dashboardLogicV2', () => {

    describe('calculateOccupancy', () => {
        it('should return 0 occupancy for empty list', () => {
            const result = calculateOccupancy([], 10);
            expect(result).toEqual({ occupied: 0, total: 10, percentage: 0 });
        });

        it('should calculate correct percentage', () => {
            const patients = [
                createMockPatient({ status: 'In Treatment' }),
                createMockPatient({ status: 'Waiting for Doctor' }),
                createMockPatient({ status: 'Discharged' }) // Should not count
            ];
            const result = calculateOccupancy(patients, 10);
            expect(result.occupied).toBe(2);
            expect(result.percentage).toBe(20);
        });

        it('should cap at 100%', () => {
            const patients = Array(5).fill(createMockPatient({ status: 'In Treatment' }));
            const result = calculateOccupancy(patients, 4);
            expect(result.percentage).toBe(100);
        });
    });

    describe('deriveFocusGroups', () => {
        it('should identify Critical Triage patients', () => {
            const patients = [
                createMockPatient({
                    id: 'p1',
                    status: 'Waiting for Doctor',
                    triage: { level: 'Red', reasons: [] }
                }),
                createMockPatient({
                    id: 'p2',
                    status: 'Discharged',
                    triage: { level: 'Red', reasons: [] }
                })
            ];

            const inbox = deriveFocusGroups(patients);
            const criticalGroup = inbox.find(g => g.id === 'critical');

            expect(criticalGroup).toBeDefined();
            expect(criticalGroup?.count).toBe(1);
            expect(criticalGroup?.priority).toBe('high');
        });

        it('should count Draft Orders', () => {
            const draftOrder: Order = {
                orderId: 'o1', patientId: 'p1', createdBy: 'u1', createdAt: '', status: 'draft',
                category: 'medication', subType: 'pill', label: 'Paracetamol', priority: 'routine', payload: {}
            };
            const sentOrder: Order = { ...draftOrder, status: 'sent', orderId: 'o2' };

            const patients = [
                createMockPatient({ orders: [draftOrder, sentOrder] }),
                createMockPatient({ orders: [draftOrder] })
            ];

            const inbox = deriveFocusGroups(patients);
            const draftsGroup = inbox.find(g => g.id === 'drafts');

            expect(draftsGroup).toBeDefined();
            expect(draftsGroup?.count).toBe(2);
            expect(draftsGroup?.priority).toBe('medium');
        });

        it('should identify Ready for Discharge', () => {
            const dischargeSummary: DischargeSummary = {
                id: 'ds1', patientId: 'p1', doctorId: 'd1', status: 'draft',
                finalDiagnosis: '', briefHistory: '', courseInHospital: '', treatmentGiven: '',
                investigationsSummary: '', conditionAtDischarge: '', dischargeMeds: [],
                dietAdvice: '', activityAdvice: '', followUpInstructions: '', emergencyWarnings: ''
            };

            const patients = [
                createMockPatient({ status: 'In Treatment', dischargeSummary }),
                createMockPatient({ status: 'Discharged', dischargeSummary }) // Should ignore
            ];

            const inbox = deriveFocusGroups(patients);
            const dischargeGroup = inbox.find(g => g.id === 'discharge');

            expect(dischargeGroup).toBeDefined();
            expect(dischargeGroup?.count).toBe(1);
            expect(dischargeGroup?.priority).toBe('low');
        });

        it('should return empty array if no tasks', () => {
            const patients = [createMockPatient({ status: 'In Treatment' })];
            const inbox = deriveFocusGroups(patients);
            expect(inbox).toEqual([]);
        });
    });
});
