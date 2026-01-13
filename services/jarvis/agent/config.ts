// Jarvis Agent Configuration
// Feature flags, guardrails, and settings

export const AGENT_CONFIG = {
    // Feature Flag - disable to revert to simple chat
    enabled: import.meta.env.VITE_JARVIS_AGENT_ENABLED !== 'false',

    // Guardrails
    maxSteps: 5,           // Maximum tool calls per query (prevent infinite loops)
    timeoutMs: 15000,      // 15 second hard timeout
    maxTokensPerTurn: 4000,// Token budget for cost control

    // Model Selection
    model: 'gemini-2.5-flash', // Fast model for tool use

    // Fallback message when agent fails
    fallbackMessage: "I wasn't able to complete that request. Please try rephrasing or ask a simpler question.",

    // Write operations requiring user confirmation
    requireConfirmation: {
        add_order: true,      // Confirm before adding orders
        create_note: true,    // Confirm before creating notes
        update_vitals: true,  // Confirm before updating vitals
    } as Record<string, boolean>,

    // Logging
    debugMode: import.meta.env.DEV,
};

// Tool categories for organization
export type ToolCategory = 'read' | 'write' | 'search' | 'analyze';

// Priority levels for tool results
export type ResultPriority = 'high' | 'medium' | 'low';
