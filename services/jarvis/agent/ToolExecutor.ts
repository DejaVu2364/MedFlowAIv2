// Jarvis Tool Executor
// Executes tools and handles errors, confirmations

import { ToolResult, AgentContext } from './types';
import { JARVIS_TOOLS, getTool } from './ToolRegistry';
import { AGENT_CONFIG } from './config';

/**
 * Execute a tool by name with given parameters
 */
export async function executeTool(
    toolName: string,
    params: Record<string, any>,
    context: AgentContext
): Promise<ToolResult> {
    const tool = getTool(toolName);

    if (!tool) {
        return { success: false, error: `Unknown tool: ${toolName}` };
    }

    // Check if tool requires confirmation
    const needsConfirmation = AGENT_CONFIG.requireConfirmation[toolName];

    try {
        const result = await tool.handler(params, context);

        // Mark write operations as requiring confirmation
        if (needsConfirmation && result.success && result.data) {
            result.requiresConfirmation = true;
        }

        if (AGENT_CONFIG.debugMode) {
            console.log(`[Jarvis Tool] ${toolName}:`, { params, result });
        }

        return result;

    } catch (error: any) {
        console.error(`[Jarvis Tool] Execution error: ${toolName}`, error);
        return {
            success: false,
            error: error.message || 'Tool execution failed.'
        };
    }
}

/**
 * Convert tool definitions to Gemini API function declarations format
 */
export function getGeminiToolDeclarations() {
    return JARVIS_TOOLS.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
    }));
}

/**
 * Validate tool parameters against schema (basic validation)
 */
export function validateToolParams(
    toolName: string,
    params: Record<string, any>
): { valid: boolean; error?: string } {
    const tool = getTool(toolName);
    if (!tool) {
        return { valid: false, error: `Unknown tool: ${toolName}` };
    }

    const required = tool.parameters.required || [];
    for (const field of required) {
        if (params[field] === undefined || params[field] === null) {
            return { valid: false, error: `Missing required parameter: ${field}` };
        }
    }

    return { valid: true };
}
