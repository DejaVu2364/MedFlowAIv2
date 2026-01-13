# Phase 1: Tool Use — ULTRATHINK Implementation Plan

> **Objective:** Transform Jarvis from a text-only chatbot into an **Agentic AI** that can execute functions to read/write patient data, check drug interactions, and perform structured actions.

---

## 1. Executive Summary

| Attribute | Value |
|---|---|
| **Scope** | Implement Gemini Function Calling with 8 core tools |
| **Dependencies** | `@google/genai` (existing), `PatientContext` (existing) |
| **New Files** | 5 new TypeScript files |
| **Modified Files** | 2 existing files |
| **Estimated Effort** | 3-4 days |
| **Risk Level** | Medium (isolated change, feature-flagged) |

---

## 2. Architectural Analysis (ULTRATHINK)

### 2.1 Current State Inspection

**`geminiService.ts` (Lines 1-100):**
- ✅ `GoogleGenAI` SDK already imported from `@google/genai`
- ✅ `Type` enum imported for JSON schema definitions
- ✅ `responseSchema` pattern already used (e.g., `classifyComplaint`)
- ✅ Model aliases defined: `flashModel`, `proModel`
- ⚠️ **Gap:** No function calling (`tools`) configuration exists yet

**`PatientContext.tsx`:**
- ✅ `patients` array accessible
- ✅ `updateStateAndDb` for writes
- ✅ `addOrder`, `updateVitals`, etc. already exist
- ⚠️ **Gap:** Not exposed to Jarvis agent loop

### 2.2 Technical Decision: Agent Loop Location

| Option | Pros | Cons | Decision |
|---|---|---|---|
| **A: In `geminiService.ts`** | Centralized | Tightly coupled | ❌ |
| **B: In `JarvisGlobalProvider.tsx`** | Near UI state | Mixes concerns | ❌ |
| **C: New `services/jarvis/agent/`** | Clean separation | More files | ✅ **Selected** |

**Rationale:** Separation of concerns. Agent logic is complex enough to warrant its own module. Allows unit testing without UI dependencies.

---

## 3. File-Level Implementation Plan

### 3.1 New Files

```
services/
└── jarvis/
    └── agent/
        ├── AgentLoop.ts        # Core ReAct loop
        ├── ToolRegistry.ts     # Tool definitions and schemas
        ├── ToolExecutor.ts     # Executes tools, handles errors
        ├── types.ts            # Agent-specific types
        └── config.ts           # Guardrails, timeouts, feature flags
```

---

### 3.2 Detailed File Specifications

#### **File 1: `services/jarvis/agent/types.ts`**

```typescript
// Agent Types
export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, any>; // JSON Schema
    handler: (params: any, context: AgentContext) => Promise<ToolResult>;
}

export interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
    rationale?: string; // Explainability
}

export interface AgentContext {
    currentPatient: Patient | null;
    allPatients: Patient[];
    currentUser: User;
    updatePatient: (id: string, updater: (p: Patient) => Patient) => void;
}

export interface AgentStep {
    stepNumber: number;
    thought: string;
    action: { tool: string; params: any } | null;
    observation: ToolResult | null;
    isFinal: boolean;
}

export interface AgentResponse {
    answer: string;
    steps: AgentStep[];
    toolsUsed: string[];
    confidence: number; // 0-1
    sources?: string[];
}
```

---

#### **File 2: `services/jarvis/agent/config.ts`**

```typescript
// Agent Configuration & Guardrails
export const AGENT_CONFIG = {
    // Feature Flag
    enabled: import.meta.env.VITE_JARVIS_AGENT_ENABLED !== 'false',
    
    // Guardrails
    maxSteps: 5,           // Prevent infinite loops
    timeoutMs: 15000,      // 15 second hard timeout
    maxTokensPerTurn: 4000,// Cost control
    
    // Model Selection
    model: 'gemini-2.5-flash', // Fast for tool use
    
    // Fallback
    fallbackMessage: "I wasn't able to complete that request. Please try rephrasing or ask a simpler question.",
    
    // Trust Calibration
    requireConfirmation: {
        addOrder: true,      // Confirm before adding orders
        createNote: true,    // Confirm before creating notes
        updateVitals: true,  // Confirm before updating vitals
    }
};
```

---

#### **File 3: `services/jarvis/agent/ToolRegistry.ts`**

```typescript
import { Type } from '@google/genai';
import { ToolDefinition } from './types';

// Tool Definitions (Gemini Function Calling Format)
export const JARVIS_TOOLS: ToolDefinition[] = [
    // === READ TOOLS ===
    {
        name: 'get_patient_summary',
        description: 'Get a structured summary of a patient including demographics, vitals, problems, and status. Use when user asks to "summarize" or "tell me about" a patient.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                patient_identifier: {
                    type: Type.STRING,
                    description: 'Patient name or ID. Can be partial match.'
                }
            },
            required: ['patient_identifier']
        },
        handler: async (params, ctx) => {
            const patient = findPatient(params.patient_identifier, ctx.allPatients);
            if (!patient) return { success: false, error: `Patient "${params.patient_identifier}" not found.` };
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
                    pendingOrders: patient.orders?.filter(o => o.status === 'draft').length || 0
                },
                rationale: 'Retrieved from in-memory patient store.'
            };
        }
    },
    {
        name: 'get_patient_vitals_history',
        description: 'Get the last N vital sign recordings for a patient. Use when user asks about "vitals trend", "last vitals", or "vitals history".',
        parameters: {
            type: Type.OBJECT,
            properties: {
                patient_identifier: { type: Type.STRING, description: 'Patient name or ID.' },
                count: { type: Type.NUMBER, description: 'Number of recent records to return. Default 3.' }
            },
            required: ['patient_identifier']
        },
        handler: async (params, ctx) => {
            const patient = findPatient(params.patient_identifier, ctx.allPatients);
            if (!patient) return { success: false, error: `Patient not found.` };
            const history = patient.vitalsHistory?.slice(0, params.count || 3) || [];
            if (history.length === 0) {
                return { success: true, data: [], rationale: 'No vitals history recorded for this patient.' };
            }
            return {
                success: true,
                data: history.map(v => ({
                    recordedAt: v.recordedAt,
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
            type: Type.OBJECT,
            properties: {
                patient_identifier: { type: Type.STRING, description: 'Patient name or ID.' }
            },
            required: ['patient_identifier']
        },
        handler: async (params, ctx) => {
            const patient = findPatient(params.patient_identifier, ctx.allPatients);
            if (!patient) return { success: false, error: `Patient not found.` };
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
            type: Type.OBJECT,
            properties: {
                patient_identifier: { type: Type.STRING, description: 'Patient name or ID.' },
                status_filter: { type: Type.STRING, enum: ['all', 'pending', 'completed'], description: 'Filter by status. Default: pending.' }
            },
            required: ['patient_identifier']
        },
        handler: async (params, ctx) => {
            const patient = findPatient(params.patient_identifier, ctx.allPatients);
            if (!patient) return { success: false, error: `Patient not found.` };
            let orders = patient.orders || [];
            if (params.status_filter === 'pending') orders = orders.filter(o => o.status !== 'completed');
            if (params.status_filter === 'completed') orders = orders.filter(o => o.status === 'completed');
            return {
                success: true,
                data: orders.map(o => ({ label: o.label, category: o.category, status: o.status })),
                rationale: `Found ${orders.length} orders.`
            };
        }
    },
    {
        name: 'search_patients',
        description: 'Search for patients by name, status, or triage level. Use when user asks "who are my critical patients" or "find patient named...".',
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'Partial name match.' },
                triage_level: { type: Type.STRING, enum: ['Red', 'Yellow', 'Green'], description: 'Filter by triage.' },
                status: { type: Type.STRING, description: 'Filter by status (e.g., "In Treatment", "Waiting")' }
            }
        },
        handler: async (params, ctx) => {
            let results = ctx.allPatients;
            if (params.name) results = results.filter(p => p.name.toLowerCase().includes(params.name.toLowerCase()));
            if (params.triage_level) results = results.filter(p => p.triage?.level === params.triage_level);
            if (params.status) results = results.filter(p => p.status?.toLowerCase().includes(params.status.toLowerCase()));
            return {
                success: true,
                data: results.slice(0, 10).map(p => ({ id: p.id, name: p.name, triage: p.triage?.level, status: p.status })),
                rationale: `Found ${results.length} matching patients.`
            };
        }
    },

    // === WRITE TOOLS (Require Confirmation) ===
    {
        name: 'add_order',
        description: 'Add a new order (medication, lab, imaging) for a patient. REQUIRES USER CONFIRMATION before execution.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                patient_identifier: { type: Type.STRING, description: 'Patient name or ID.' },
                order_label: { type: Type.STRING, description: 'The order to add (e.g., "Complete Blood Count", "Paracetamol 500mg").' },
                category: { type: Type.STRING, enum: ['investigation', 'medication', 'radiology', 'procedure', 'nursing', 'referral'] },
                priority: { type: Type.STRING, enum: ['routine', 'urgent', 'STAT'], description: 'Order priority. Default: routine.' }
            },
            required: ['patient_identifier', 'order_label', 'category']
        },
        handler: async (params, ctx) => {
            const patient = findPatient(params.patient_identifier, ctx.allPatients);
            if (!patient) return { success: false, error: `Patient not found.` };
            // Note: Actual write happens ONLY after user confirmation in UI
            return {
                success: true,
                data: {
                    action: 'PENDING_CONFIRMATION',
                    patient: patient.name,
                    order: params.order_label,
                    category: params.category,
                    priority: params.priority || 'routine'
                },
                rationale: 'Order staged. Awaiting doctor confirmation before adding to chart.'
            };
        }
    },
    {
        name: 'check_drug_interactions',
        description: 'Check for drug-drug interactions given a list of medications. Use when user asks about interactions or safety.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                drugs: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of drug names to check.' }
            },
            required: ['drugs']
        },
        handler: async (params, ctx) => {
            // Simplified interaction check (would call external API in production)
            const knownInteractions: Record<string, string[]> = {
                'Warfarin': ['Aspirin', 'Ibuprofen', 'NSAIDs'],
                'Metformin': ['Contrast Dye'],
                'ACE Inhibitors': ['Potassium Supplements', 'Spironolactone']
            };
            const found: { pair: string[]; severity: string; note: string }[] = [];
            for (const drug of params.drugs) {
                const interactsWith = knownInteractions[drug] || [];
                for (const other of params.drugs) {
                    if (interactsWith.some(i => other.toLowerCase().includes(i.toLowerCase()))) {
                        found.push({ pair: [drug, other], severity: 'Moderate', note: `${drug} may interact with ${other}.` });
                    }
                }
            }
            return {
                success: true,
                data: { interactions: found, checkedDrugs: params.drugs },
                rationale: found.length > 0 ? `Found ${found.length} potential interaction(s).` : 'No known interactions found.'
            };
        }
    },
    {
        name: 'get_ops_metrics',
        description: 'Get hospital operational metrics like bed occupancy, TPA status, pending discharges. Use when user asks about "ops", "beds", "hospital status".',
        parameters: { type: Type.OBJECT, properties: {} },
        handler: async (params, ctx) => {
            const patients = ctx.allPatients;
            const inTreatment = patients.filter(p => p.status === 'In Treatment').length;
            const critical = patients.filter(p => p.triage?.level === 'Red').length;
            const pendingDischarge = patients.filter(p => p.status === 'Discharged' || p.dischargeSummary?.status === 'finalized').length;
            return {
                success: true,
                data: {
                    totalPatients: patients.length,
                    inTreatment,
                    criticalCount: critical,
                    pendingDischarge,
                    occupancyEstimate: `${Math.round((inTreatment / Math.max(patients.length, 1)) * 100)}%`
                },
                rationale: 'Calculated from current patient roster.'
            };
        }
    }
];

// Helper: Fuzzy patient search
function findPatient(identifier: string, patients: Patient[]): Patient | undefined {
    const lower = identifier.toLowerCase();
    return patients.find(p => 
        p.id.toLowerCase() === lower || 
        p.name.toLowerCase().includes(lower)
    );
}
```

---

#### **File 4: `services/jarvis/agent/ToolExecutor.ts`**

```typescript
import { ToolDefinition, ToolResult, AgentContext } from './types';
import { JARVIS_TOOLS } from './ToolRegistry';
import { AGENT_CONFIG } from './config';

export async function executeTool(
    toolName: string,
    params: Record<string, any>,
    context: AgentContext
): Promise<ToolResult> {
    const tool = JARVIS_TOOLS.find(t => t.name === toolName);
    
    if (!tool) {
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
    
    // Check if tool requires confirmation
    if (AGENT_CONFIG.requireConfirmation[toolName as keyof typeof AGENT_CONFIG.requireConfirmation]) {
        // Return special result indicating confirmation needed
        const result = await tool.handler(params, context);
        if (result.success && result.data) {
            result.data.requiresConfirmation = true;
        }
        return result;
    }
    
    try {
        const result = await tool.handler(params, context);
        return result;
    } catch (error: any) {
        console.error(`[Jarvis] Tool execution error: ${toolName}`, error);
        return { success: false, error: error.message || 'Tool execution failed.' };
    }
}

// Convert tool definitions to Gemini API format
export function getGeminiToolDeclarations() {
    return JARVIS_TOOLS.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
    }));
}
```

---

#### **File 5: `services/jarvis/agent/AgentLoop.ts`**

```typescript
import { GoogleGenAI } from '@google/genai';
import { AgentContext, AgentResponse, AgentStep } from './types';
import { executeTool, getGeminiToolDeclarations } from './ToolExecutor';
import { AGENT_CONFIG } from './config';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || 'mock-key' });

export async function runAgentLoop(
    userQuery: string,
    systemPrompt: string,
    context: AgentContext
): Promise<AgentResponse> {
    // Feature flag check
    if (!AGENT_CONFIG.enabled) {
        return {
            answer: "Agent mode is disabled. Please enable VITE_JARVIS_AGENT_ENABLED.",
            steps: [],
            toolsUsed: [],
            confidence: 0
        };
    }

    const steps: AgentStep[] = [];
    const toolsUsed: string[] = [];
    let stepNumber = 0;
    let conversationHistory: any[] = [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Query: ${userQuery}` }] }
    ];

    const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Agent timeout')), AGENT_CONFIG.timeoutMs)
    );

    try {
        while (stepNumber < AGENT_CONFIG.maxSteps) {
            stepNumber++;

            // Call Gemini with tools
            const response = await Promise.race([
                ai.models.generateContent({
                    model: AGENT_CONFIG.model,
                    contents: conversationHistory,
                    config: {
                        tools: [{ functionDeclarations: getGeminiToolDeclarations() }]
                    }
                }),
                timeoutPromise
            ]);

            const candidate = response.candidates?.[0];
            const content = candidate?.content;

            // Check for function call
            const functionCall = content?.parts?.find((p: any) => p.functionCall)?.functionCall;

            if (functionCall) {
                // Execute the tool
                const toolResult = await executeTool(
                    functionCall.name,
                    functionCall.args || {},
                    context
                );

                toolsUsed.push(functionCall.name);
                steps.push({
                    stepNumber,
                    thought: `Decided to use tool: ${functionCall.name}`,
                    action: { tool: functionCall.name, params: functionCall.args },
                    observation: toolResult,
                    isFinal: false
                });

                // Feed result back to model
                conversationHistory.push({
                    role: 'model',
                    parts: [{ functionCall: functionCall }]
                });
                conversationHistory.push({
                    role: 'user',
                    parts: [{
                        functionResponse: {
                            name: functionCall.name,
                            response: toolResult
                        }
                    }]
                });
            } else {
                // No function call - this is the final text response
                const textResponse = content?.parts?.find((p: any) => p.text)?.text || AGENT_CONFIG.fallbackMessage;
                
                steps.push({
                    stepNumber,
                    thought: 'Generated final response.',
                    action: null,
                    observation: null,
                    isFinal: true
                });

                return {
                    answer: textResponse,
                    steps,
                    toolsUsed,
                    confidence: toolsUsed.length > 0 ? 0.85 : 0.7 // Higher confidence when tools were used
                };
            }
        }

        // Max steps reached
        return {
            answer: `I gathered some information but couldn't complete the full analysis. Here's what I found: ${JSON.stringify(steps.map(s => s.observation?.data).filter(Boolean))}`,
            steps,
            toolsUsed,
            confidence: 0.5
        };

    } catch (error: any) {
        console.error('[Jarvis Agent] Loop error:', error);
        return {
            answer: AGENT_CONFIG.fallbackMessage,
            steps,
            toolsUsed,
            confidence: 0
        };
    }
}
```

---

### 3.3 Modified Files

#### **Modify: `services/jarvis/JarvisGlobalProvider.tsx`**

**Changes:**
1.  Import `runAgentLoop` from `agent/AgentLoop.ts`
2.  Replace direct `chatWithGemini` call with `runAgentLoop`
3.  Handle `requiresConfirmation` responses with UI prompt


#### **Modify: `.env.example`**

```env
# Jarvis Agent Mode (set to 'false' to disable)
VITE_JARVIS_AGENT_ENABLED=true
```

---

## 4. Edge Cases & Error Handling

| Scenario | Handling |
|---|---|
| Patient not found | Return friendly error: "I couldn't find a patient named X." |
| Tool timeout | Catch, return partial result if available |
| Max steps reached | Summarize what was gathered, admit incompleteness |
| API rate limit | Return gracefully, suggest retry |
| Write tool without confirmation | Stage action, don't execute until user confirms |
| Prompt injection attempt | Input sanitization in AgentLoop before sending to LLM |

---

## 5. Testing Strategy

### 5.1 Unit Tests

```typescript
// tests/unit/jarvis-agent.test.ts
describe('Jarvis Agent Tools', () => {
    it('get_patient_summary returns correct fields', async () => {
        const result = await executeTool('get_patient_summary', { patient_identifier: 'Gita' }, mockContext);
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('name');
        expect(result.data).toHaveProperty('vitals');
    });

    it('handles unknown patient gracefully', async () => {
        const result = await executeTool('get_patient_summary', { patient_identifier: 'NonExistent' }, mockContext);
        expect(result.success).toBe(false);
        expect(result.error).toContain('not found');
    });

    it('check_drug_interactions detects Warfarin-Aspirin', async () => {
        const result = await executeTool('check_drug_interactions', { drugs: ['Warfarin', 'Aspirin'] }, mockContext);
        expect(result.data.interactions.length).toBeGreaterThan(0);
    });
});
```

### 5.2 Integration Tests

```typescript
// tests/e2e/jarvis-agent.spec.ts
test('Jarvis can answer "summarize Gita" using tools', async ({ page }) => {
    await page.goto('/patient/P-2024001/vitals');
    await page.click('[data-testid="jarvis-toggle"]');
    await page.fill('textarea', 'Summarize Gita');
    await page.keyboard.press('Enter');
    
    // Wait for agent response
    await expect(page.locator('text=Gita')).toBeVisible({ timeout: 20000 });
    // Verify tool was used
    await expect(page.locator('text=vitals')).toBeVisible();
});
```

---

## 6. Rollback Procedure

1.  **Immediate:** Set `VITE_JARVIS_AGENT_ENABLED=false` in `.env`
2.  **Code:** Revert to previous `chatWithGemini` call in `JarvisGlobalProvider.tsx`
3.  **Verification:** Run existing chat tests to confirm old behavior restored

---

## 7. Success Metrics

| Metric | Target | How to Measure |
|---|---|---|
| Tool Usage Rate | >50% of queries use at least one tool | Log `toolsUsed.length > 0` |
| Response Accuracy | >90% of tool results are correct | Manual spot-check |
| Latency (P95) | <5 seconds | Track `runAgentLoop` duration |
| Error Rate | <5% | Track `catch` block hits |

---

## 8. Acceptance Criteria

- [ ] Jarvis can answer "Summarize Gita Bhat" using `get_patient_summary`
- [ ] Jarvis can answer "What are Gita's last 3 vitals?" using `get_patient_vitals_history`
- [ ] Jarvis can answer "Check interactions for Warfarin and Aspirin"
- [ ] Jarvis stages an order but does NOT execute until confirmed
- [ ] Agent loop terminates gracefully on timeout
- [ ] Feature flag disables agent mode completely
- [ ] Unit tests pass
- [ ] E2E test captures agent flow
