// Jarvis Agent Loop
// Core ReAct (Reason + Act) loop for the agent

import { GoogleGenAI } from '@google/genai';
import { AgentContext, AgentResponse, AgentStep, PendingAction } from './types';
import { executeTool, getGeminiToolDeclarations } from './ToolExecutor';
import { AGENT_CONFIG } from './config';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Run the agent loop to answer a user query
 */
export async function runAgentLoop(
    userQuery: string,
    systemPrompt: string,
    context: AgentContext
): Promise<AgentResponse> {
    // Feature flag check
    if (!AGENT_CONFIG.enabled) {
        return {
            answer: "Agent mode is disabled. Please enable VITE_JARVIS_AGENT_ENABLED in your environment.",
            steps: [],
            toolsUsed: [],
            confidence: 0
        };
    }

    // API key check
    if (!API_KEY || API_KEY === 'mock-key') {
        return {
            answer: "Gemini API key not configured. Please set VITE_GEMINI_API_KEY.",
            steps: [],
            toolsUsed: [],
            confidence: 0
        };
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const steps: AgentStep[] = [];
    const toolsUsed: string[] = [];
    const pendingActions: PendingAction[] = [];
    let stepNumber = 0;

    // Build conversation history
    const conversationHistory: any[] = [
        {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nUser Query: ${userQuery}` }]
        }
    ];

    // Timeout promise
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
            const functionCallPart = content?.parts?.find((p: any) => p.functionCall);
            const functionCall = functionCallPart?.functionCall;

            if (functionCall && functionCall.name) {
                const toolName: string = functionCall.name;
                const toolArgs = functionCall.args || {};

                // Execute the tool
                const toolResult = await executeTool(
                    toolName,
                    toolArgs,
                    context
                );

                toolsUsed.push(toolName);

                steps.push({
                    stepNumber,
                    thought: `Decided to use tool: ${toolName}`,
                    action: { tool: toolName, params: toolArgs },
                    observation: toolResult,
                    isFinal: false
                });

                // Track pending actions for write operations
                if (toolResult.requiresConfirmation && toolResult.data) {
                    pendingActions.push({
                        actionId: `ACT-${Date.now()}-${stepNumber}`,
                        type: toolName.includes('order') ? 'order' : 'update',
                        description: `${toolResult.data.order || toolResult.data.action} for ${toolResult.data.patient || 'patient'}`,
                        payload: toolResult.data,
                        patientId: toolResult.data.patientId,
                        patientName: toolResult.data.patient
                    });
                }

                // Feed result back to model
                conversationHistory.push({
                    role: 'model',
                    parts: [{ functionCall: { name: toolName, args: toolArgs } }]
                });
                conversationHistory.push({
                    role: 'user',
                    parts: [{
                        functionResponse: {
                            name: toolName,
                            response: toolResult
                        }
                    }]
                });

                if (AGENT_CONFIG.debugMode) {
                    console.log(`[Jarvis Agent] Step ${stepNumber}: Tool ${toolName}`, toolResult);
                }

            } else {
                // No function call - this is the final text response
                const textPart = content?.parts?.find((p: any) => p.text);
                const textResponse = textPart?.text || AGENT_CONFIG.fallbackMessage;

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
                    toolsUsed: [...new Set(toolsUsed)],
                    confidence: toolsUsed.length > 0 ? 0.85 : 0.7,
                    pendingActions: pendingActions.length > 0 ? pendingActions : undefined
                };
            }
        }

        // Max steps reached - summarize what we found
        const summaryData = steps
            .filter(s => s.observation?.success)
            .map(s => s.observation?.data)
            .filter(Boolean);

        return {
            answer: `I gathered some information but couldn't complete the full analysis. Here's what I found:\n\n${JSON.stringify(summaryData, null, 2)}`,
            steps,
            toolsUsed: [...new Set(toolsUsed)],
            confidence: 0.5,
            pendingActions: pendingActions.length > 0 ? pendingActions : undefined
        };

    } catch (error: any) {
        console.error('[Jarvis Agent] Loop error:', error);

        // Return partial results if we have any
        if (steps.length > 0) {
            return {
                answer: `I encountered an issue but gathered some information: ${error.message}`,
                steps,
                toolsUsed: [...new Set(toolsUsed)],
                confidence: 0.3,
                pendingActions: pendingActions.length > 0 ? pendingActions : undefined
            };
        }

        return {
            answer: AGENT_CONFIG.fallbackMessage,
            steps: [],
            toolsUsed: [],
            confidence: 0
        };
    }
}

/**
 * Build the system prompt for the agent
 */
export function buildAgentSystemPrompt(context: AgentContext): string {
    const patientContext = context.currentPatient
        ? `
Current Patient Context:
- Name: ${context.currentPatient.name}
- Age: ${context.currentPatient.age}
- Gender: ${context.currentPatient.gender}
- Status: ${context.currentPatient.status}
- Chief Complaints: ${context.currentPatient.chiefComplaints?.map(c => c.complaint).join(', ') || 'None'}
`
        : 'No specific patient selected.';

    return `You are Jarvis, an advanced AI medical assistant for doctors in a hospital setting.

${patientContext}

You have access to the following tools to help answer questions:
1. get_patient_summary - Get full patient information
2. get_patient_vitals_history - Get vitals trend data
3. get_patient_medications - Get current medications
4. get_patient_orders - Get pending/completed orders
5. search_patients - Find patients by name, triage, or status
6. get_ops_metrics - Get hospital operational metrics
7. add_order - Stage an order (requires confirmation)
8. check_drug_interactions - Check for drug interactions

Guidelines:
- Use tools to get accurate, current information
- When adding orders, always confirm with the doctor first
- Provide clear, actionable responses
- Cite the data source when providing patient information
- If you're unsure, say so rather than guessing
- Be concise but thorough

Remember: You are assisting a busy doctor. Be efficient and accurate.`;
}
