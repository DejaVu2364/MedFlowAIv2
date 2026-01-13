// Unit tests for Jarvis Agent (Phase 1: Tool Use)
// Tests tool registry, executor, and agent loop

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Gemini API
vi.mock('@google/genai', () => ({
    GoogleGenAI: vi.fn().mockImplementation(() => ({
        models: {
            generateContent: vi.fn()
        }
    }))
}));

// Import after mocks - correct path from tests/unit to services/jarvis/agent
import { JARVIS_TOOLS, getTool, getToolNames } from '../../services/jarvis/agent/ToolRegistry';
import { executeTool, validateToolParams } from '../../services/jarvis/agent/ToolExecutor';
import { AGENT_CONFIG } from '../../services/jarvis/agent/config';
import type { AgentContext } from '../../services/jarvis/agent/types';

// Mock patient data
const mockPatient = {
    id: 'P-001',
    name: 'Gita Bhat',
    age: 45,
    gender: 'Female',
    status: 'In Treatment',
    triage: { level: 'Yellow' as const, reasons: ['Fever'] },
    chiefComplaints: [{ complaint: 'High fever', duration: '2 days' }],
    vitals: {
        pulse: 98,
        bp_sys: 130,
        bp_dia: 85,
        spo2: 96,
        temp_c: 38.5,
        rr: 18
    },
    orders: [
        { orderId: 'O-1', label: 'CBC', category: 'investigation', status: 'sent' as const, priority: 'routine' as const, createdAt: new Date().toISOString() },
        { orderId: 'O-2', label: 'Paracetamol 500mg', category: 'medication', status: 'completed' as const, priority: 'routine' as const, createdAt: new Date().toISOString() }
    ],
    activeProblems: [{ description: 'Fever', status: 'active' }],
    results: [
        { id: 'R-1', name: 'Hemoglobin', value: '12.5', unit: 'g/dL', isAbnormal: false }
    ]
};

const mockContext: AgentContext = {
    currentPatient: mockPatient as any,
    allPatients: [mockPatient as any],
    currentUser: {
        id: 'doc-001',
        name: 'Dr. Smith',
        email: 'smith@hospital.com',
        role: 'doctor'
    }
};

describe('Agent Tool Registry', () => {
    it('should have 8 tools registered', () => {
        expect(JARVIS_TOOLS.length).toBe(8);
    });

    it('should have all expected tools', () => {
        const toolNames = getToolNames();
        expect(toolNames).toContain('get_patient_summary');
        expect(toolNames).toContain('get_patient_vitals_history');
        expect(toolNames).toContain('get_patient_medications');
        expect(toolNames).toContain('get_patient_orders');
        expect(toolNames).toContain('search_patients');
        expect(toolNames).toContain('get_ops_metrics');
        expect(toolNames).toContain('add_order');
        expect(toolNames).toContain('check_drug_interactions');
    });

    it('should get tool by name', () => {
        const tool = getTool('get_patient_summary');
        expect(tool).toBeDefined();
        expect(tool?.name).toBe('get_patient_summary');
    });

    it('should return undefined for unknown tool', () => {
        const tool = getTool('nonexistent_tool');
        expect(tool).toBeUndefined();
    });
});

describe('Tool Execution', () => {
    describe('get_patient_summary', () => {
        it('should return patient summary for valid patient', async () => {
            const result = await executeTool('get_patient_summary', { patient_identifier: 'Gita' }, mockContext);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.name).toBe('Gita Bhat');
            expect(result.data.age).toBe(45);
            expect(result.data.vitals).toBeDefined();
        });

        it('should fail for unknown patient', async () => {
            const result = await executeTool('get_patient_summary', { patient_identifier: 'Unknown Patient' }, mockContext);

            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });
    });

    describe('get_patient_medications', () => {
        it('should return medication orders', async () => {
            const result = await executeTool('get_patient_medications', { patient_identifier: 'Gita' }, mockContext);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].name).toBe('Paracetamol 500mg');
        });
    });

    describe('search_patients', () => {
        it('should find patients by name', async () => {
            const result = await executeTool('search_patients', { name: 'Gita' }, mockContext);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].name).toBe('Gita Bhat');
        });

        it('should filter by triage level', async () => {
            const result = await executeTool('search_patients', { triage_level: 'Yellow' }, mockContext);

            expect(result.success).toBe(true);
            expect(result.data.length).toBeGreaterThan(0);
        });
    });

    describe('get_ops_metrics', () => {
        it('should return operational metrics', async () => {
            const result = await executeTool('get_ops_metrics', {}, mockContext);

            expect(result.success).toBe(true);
            expect(result.data.totalPatients).toBe(1);
            expect(result.data.inTreatment).toBe(1);
        });
    });

    describe('add_order', () => {
        it('should require confirmation for orders', async () => {
            const result = await executeTool('add_order', {
                patient_identifier: 'Gita',
                order_label: 'Blood Culture',
                category: 'investigation',
                priority: 'routine'
            }, mockContext);

            expect(result.success).toBe(true);
            expect(result.requiresConfirmation).toBe(true);
            expect(result.data.action).toBe('PENDING_CONFIRMATION');
        });
    });

    describe('check_drug_interactions', () => {
        it('should detect known interactions', async () => {
            const result = await executeTool('check_drug_interactions', {
                drugs: ['Warfarin', 'Aspirin']
            }, mockContext);

            expect(result.success).toBe(true);
            expect(result.data.interactionCount).toBeGreaterThan(0);
        });

        it('should return no interactions for safe combinations', async () => {
            const result = await executeTool('check_drug_interactions', {
                drugs: ['Paracetamol', 'Omeprazole']
            }, mockContext);

            expect(result.success).toBe(true);
            expect(result.data.interactionCount).toBe(0);
        });
    });

    describe('unknown tool', () => {
        it('should return error for unknown tool', async () => {
            const result = await executeTool('fake_tool', {}, mockContext);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Unknown tool');
        });
    });
});

describe('Tool Parameter Validation', () => {
    it('should validate required parameters', () => {
        const result = validateToolParams('get_patient_summary', {});
        expect(result.valid).toBe(false);
        expect(result.error).toContain('patient_identifier');
    });

    it('should pass with valid parameters', () => {
        const result = validateToolParams('get_patient_summary', { patient_identifier: 'test' });
        expect(result.valid).toBe(true);
    });

    it('should fail for unknown tool', () => {
        const result = validateToolParams('unknown', {});
        expect(result.valid).toBe(false);
    });
});

describe('Agent Configuration', () => {
    it('should have reasonable guardrails', () => {
        expect(AGENT_CONFIG.maxSteps).toBeLessThanOrEqual(10);
        expect(AGENT_CONFIG.timeoutMs).toBeLessThanOrEqual(30000);
    });

    it('should require confirmation for add_order', () => {
        expect(AGENT_CONFIG.requireConfirmation.add_order).toBe(true);
    });
});
