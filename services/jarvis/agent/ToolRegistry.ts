// Jarvis Tool Registry
// Defines all available tools for the agent with Gemini Function Calling format

import { ToolDefinition, AgentContext, ToolResult } from './types';
import { Patient } from '../../../types';

// Helper: Fuzzy patient search
function findPatient(identifier: string, patients: Patient[]): Patient | undefined {
    const lower = identifier.toLowerCase();
    return patients.find(p =>
        p.id.toLowerCase() === lower ||
        p.name.toLowerCase().includes(lower)
    );
}

// ============================================
// TOOL DEFINITIONS
// ============================================

export const JARVIS_TOOLS: ToolDefinition[] = [
    // ============================================
    // READ TOOLS
    // ============================================
    {
        name: 'get_patient_summary',
        description: 'Get a structured summary of a patient including demographics, vitals, problems, and status. Use when user asks to "summarize" or "tell me about" a patient.',
        parameters: {
            type: 'object',
            properties: {
                patient_identifier: {
                    type: 'string',
                    description: 'Patient name or ID. Can be partial match.'
                }
            },
            required: ['patient_identifier']
        },
        handler: async (params: { patient_identifier: string }, ctx: AgentContext): Promise<ToolResult> => {
            const patient = findPatient(params.patient_identifier, ctx.allPatients);
            if (!patient) {
                return { success: false, error: `Patient "${params.patient_identifier}" not found.` };
            }
            return {
                success: true,
                data: {
                    name: patient.name,
                    age: patient.age,
                    gender: patient.gender,
                    status: patient.status,
                    triage: patient.triage,
                    chiefComplaints: patient.chiefComplaints,
                    vitals: patient.vitals,
                    activeProblems: patient.activeProblems,
                    pendingOrders: patient.orders?.filter(o => o.status === 'draft' || o.status === 'sent' || o.status === 'scheduled').length || 0,
                    recentLabs: patient.results?.slice(0, 3).map(r => ({
                        name: r.name,
                        value: r.value,
                        isAbnormal: r.isAbnormal
                    }))
                },
                rationale: 'Retrieved from patient store.'
            };
        }
    },
    {
        name: 'get_patient_vitals_history',
        description: 'Get the last N vital sign recordings for a patient. Use when user asks about "vitals trend", "last vitals", or "vitals history".',
        parameters: {
            type: 'object',
            properties: {
                patient_identifier: { type: 'string', description: 'Patient name or ID.' },
                count: { type: 'number', description: 'Number of recent records to return. Default 3.' }
            },
            required: ['patient_identifier']
        },
        handler: async (params: { patient_identifier: string; count?: number }, ctx: AgentContext): Promise<ToolResult> => {
            const patient = findPatient(params.patient_identifier, ctx.allPatients);
            if (!patient) return { success: false, error: 'Patient not found.' };

            const history = patient.vitalsHistory?.slice(0, params.count || 3) || [];
            if (history.length === 0) {
                // Fallback to current vitals if no history
                if (patient.vitals) {
                    return {
                        success: true,
                        data: [{
                            recordedAt: 'Current',
                            pulse: patient.vitals.pulse,
                            bp: `${patient.vitals.bp_sys}/${patient.vitals.bp_dia}`,
                            spo2: patient.vitals.spo2,
                            temp: patient.vitals.temp_c,
                            rr: patient.vitals.rr
                        }],
                        rationale: 'No vitals history, showing current vitals.'
                    };
                }
                return { success: true, data: [], rationale: 'No vitals recorded for this patient.' };
            }
            return {
                success: true,
                data: history.map(v => ({
                    recordedAt: new Date(v.recordedAt).toLocaleString(),
                    pulse: v.measurements.pulse,
                    bp: `${v.measurements.bp_sys}/${v.measurements.bp_dia}`,
                    spo2: v.measurements.spo2,
                    temp: v.measurements.temp_c,
                    rr: v.measurements.rr
                })),
                rationale: `Retrieved ${history.length} records from vitals history.`
            };
        }
    },
    {
        name: 'get_patient_medications',
        description: 'Get the current medications for a patient. Use when user asks about "meds", "medications", or "drugs".',
        parameters: {
            type: 'object',
            properties: {
                patient_identifier: { type: 'string', description: 'Patient name or ID.' }
            },
            required: ['patient_identifier']
        },
        handler: async (params: { patient_identifier: string }, ctx: AgentContext): Promise<ToolResult> => {
            const patient = findPatient(params.patient_identifier, ctx.allPatients);
            if (!patient) return { success: false, error: 'Patient not found.' };

            const meds = patient.orders?.filter(o => o.category === 'medication') || [];
            return {
                success: true,
                data: meds.map(m => ({ name: m.label, status: m.status, priority: m.priority })),
                rationale: `Found ${meds.length} medication orders.`
            };
        }
    },
    {
        name: 'get_patient_orders',
        description: 'Get pending or all orders for a patient. Use when user asks about "orders", "labs", "tests".',
        parameters: {
            type: 'object',
            properties: {
                patient_identifier: { type: 'string', description: 'Patient name or ID.' },
                status_filter: {
                    type: 'string',
                    enum: ['all', 'pending', 'completed'],
                    description: 'Filter by status. Default: pending.'
                }
            },
            required: ['patient_identifier']
        },
        handler: async (params: { patient_identifier: string; status_filter?: string }, ctx: AgentContext): Promise<ToolResult> => {
            const patient = findPatient(params.patient_identifier, ctx.allPatients);
            if (!patient) return { success: false, error: 'Patient not found.' };

            let orders = patient.orders || [];
            const filter = params.status_filter || 'pending';
            if (filter === 'pending') orders = orders.filter(o => o.status !== 'completed');
            if (filter === 'completed') orders = orders.filter(o => o.status === 'completed');

            return {
                success: true,
                data: orders.map(o => ({
                    label: o.label,
                    category: o.category,
                    status: o.status,
                    priority: o.priority
                })),
                rationale: `Found ${orders.length} ${filter} orders.`
            };
        }
    },
    {
        name: 'search_patients',
        description: 'Search for patients by name, status, or triage level. Use when user asks "who are my critical patients" or "find patient named...".',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Partial name match.' },
                triage_level: {
                    type: 'string',
                    enum: ['Red', 'Yellow', 'Green'],
                    description: 'Filter by triage.'
                },
                status: { type: 'string', description: 'Filter by status (e.g., "In Treatment", "Waiting")' }
            }
        },
        handler: async (params: { name?: string; triage_level?: string; status?: string }, ctx: AgentContext): Promise<ToolResult> => {
            let results = ctx.allPatients;

            if (params.name) {
                results = results.filter(p => p.name.toLowerCase().includes(params.name!.toLowerCase()));
            }
            if (params.triage_level) {
                results = results.filter(p => p.triage?.level === params.triage_level);
            }
            if (params.status) {
                results = results.filter(p => p.status?.toLowerCase().includes(params.status!.toLowerCase()));
            }

            return {
                success: true,
                data: results.slice(0, 10).map(p => ({
                    id: p.id,
                    name: p.name,
                    triage: p.triage?.level,
                    status: p.status,
                    chiefComplaint: p.chiefComplaints?.[0]?.complaint
                })),
                rationale: `Found ${results.length} matching patients (showing up to 10).`
            };
        }
    },
    {
        name: 'get_ops_metrics',
        description: 'Get hospital operational metrics like bed occupancy, critical count, pending discharges. Use when user asks about "ops", "beds", "hospital status".',
        parameters: {
            type: 'object',
            properties: {}
        },
        handler: async (_params: Record<string, never>, ctx: AgentContext): Promise<ToolResult> => {
            const patients = ctx.allPatients;
            const inTreatment = patients.filter(p => p.status === 'In Treatment').length;
            const critical = patients.filter(p => p.triage?.level === 'Red').length;
            const yellow = patients.filter(p => p.triage?.level === 'Yellow').length;
            const pendingDischarge = patients.filter(p =>
                p.dischargeSummary?.status === 'finalized' || p.status === 'Discharged'
            ).length;

            return {
                success: true,
                data: {
                    totalPatients: patients.length,
                    inTreatment,
                    criticalCount: critical,
                    yellowCount: yellow,
                    pendingDischarge,
                    occupancyEstimate: `${Math.round((inTreatment / Math.max(patients.length, 1)) * 100)}%`
                },
                rationale: 'Calculated from current patient roster.'
            };
        }
    },

    // ============================================
    // WRITE TOOLS (Require Confirmation)
    // ============================================
    {
        name: 'add_order',
        description: 'Stage a new order (medication, lab, imaging) for a patient. REQUIRES USER CONFIRMATION before execution. Use when user says "order CBC" or "add medication".',
        parameters: {
            type: 'object',
            properties: {
                patient_identifier: { type: 'string', description: 'Patient name or ID.' },
                order_label: { type: 'string', description: 'The order to add (e.g., "Complete Blood Count", "Paracetamol 500mg").' },
                category: {
                    type: 'string',
                    enum: ['investigation', 'medication', 'radiology', 'procedure', 'nursing', 'referral'],
                    description: 'Order category.'
                },
                priority: {
                    type: 'string',
                    enum: ['routine', 'urgent', 'STAT'],
                    description: 'Order priority. Default: routine.'
                }
            },
            required: ['patient_identifier', 'order_label', 'category']
        },
        handler: async (params: {
            patient_identifier: string;
            order_label: string;
            category: string;
            priority?: string
        }, ctx: AgentContext): Promise<ToolResult> => {
            const patient = findPatient(params.patient_identifier, ctx.allPatients);
            if (!patient) return { success: false, error: 'Patient not found.' };

            // Return pending action - actual execution happens after user confirms
            return {
                success: true,
                data: {
                    action: 'PENDING_CONFIRMATION',
                    patient: patient.name,
                    patientId: patient.id,
                    order: params.order_label,
                    category: params.category,
                    priority: params.priority || 'routine'
                },
                rationale: 'Order staged. Awaiting doctor confirmation.',
                requiresConfirmation: true
            };
        }
    },
    {
        name: 'check_drug_interactions',
        description: 'Check for drug-drug interactions given a list of medications. Use when user asks about interactions or safety.',
        parameters: {
            type: 'object',
            properties: {
                drugs: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of drug names to check.'
                }
            },
            required: ['drugs']
        },
        handler: async (params: { drugs: string[] }, _ctx: AgentContext): Promise<ToolResult> => {
            // Known interactions database (simplified)
            const knownInteractions: Record<string, string[]> = {
                'warfarin': ['aspirin', 'ibuprofen', 'nsaids', 'naproxen'],
                'metformin': ['contrast dye', 'alcohol'],
                'ace inhibitors': ['potassium supplements', 'spironolactone'],
                'digoxin': ['amiodarone', 'verapamil'],
                'lithium': ['nsaids', 'ace inhibitors', 'diuretics'],
                'ssris': ['maois', 'tramadol', 'triptans'],
            };

            const found: { pair: string[]; severity: string; note: string }[] = [];
            const drugsLower = params.drugs.map(d => d.toLowerCase());

            for (const drug of drugsLower) {
                for (const [key, interactions] of Object.entries(knownInteractions)) {
                    if (drug.includes(key)) {
                        for (const otherDrug of drugsLower) {
                            if (interactions.some(i => otherDrug.includes(i))) {
                                found.push({
                                    pair: [drug, otherDrug],
                                    severity: 'Moderate to Severe',
                                    note: `${drug} may interact with ${otherDrug}. Monitor closely.`
                                });
                            }
                        }
                    }
                }
            }

            return {
                success: true,
                data: {
                    interactions: found,
                    checkedDrugs: params.drugs,
                    interactionCount: found.length
                },
                rationale: found.length > 0
                    ? `Found ${found.length} potential interaction(s). Review carefully.`
                    : 'No known interactions found in our database.'
            };
        }
    }
];

// Get tool by name
export function getTool(name: string): ToolDefinition | undefined {
    return JARVIS_TOOLS.find(t => t.name === name);
}

// Get all tool names
export function getToolNames(): string[] {
    return JARVIS_TOOLS.map(t => t.name);
}
