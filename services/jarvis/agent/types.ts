// Jarvis Agent Types
// Phase 1: Tool Use Implementation

import { Patient } from '../../../types';

// User type (simplified for agent context)
export interface AgentUser {
    id: string;
    name: string;
    email?: string;
    role: string;
}

// Tool Definition for Gemini Function Calling
export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, any>; // JSON Schema format
    handler: (params: any, context: AgentContext) => Promise<ToolResult>;
}

// Result from tool execution
export interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
    rationale?: string; // Explainability - why this result
    requiresConfirmation?: boolean; // For write operations
}

// Context available to tools during execution
export interface AgentContext {
    currentPatient: Patient | null;
    allPatients: Patient[];
    currentUser: AgentUser;
    updatePatient?: (id: string, updater: (p: Patient) => Patient) => void;
}

// A single step in the agent reasoning loop
export interface AgentStep {
    stepNumber: number;
    thought: string;
    action: { tool: string; params: any } | null;
    observation: ToolResult | null;
    isFinal: boolean;
}

// Final response from the agent
export interface AgentResponse {
    answer: string;
    steps: AgentStep[];
    toolsUsed: string[];
    confidence: number; // 0-1
    sources?: string[];
    pendingActions?: PendingAction[];
}

// Action that requires user confirmation before execution
export interface PendingAction {
    actionId: string;
    type: 'order' | 'note' | 'update';
    description: string;
    payload: Record<string, any>;
    patientId?: string;
    patientName?: string;
}
