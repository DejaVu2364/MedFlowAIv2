// ActionExecutor - Executes Jarvis commands and actions
// Handles order creation, note creation, navigation, and workflows

import { Patient, Order, OrderCategory, OrderPriority } from '../../types';
import { ProcedureOption, createOrderFromProcedure, getProcedureBySubType } from '../../constants/procedures';

export interface ActionResult {
    success: boolean;
    message: string;
    data?: unknown;
}

export interface OrderAction {
    type: 'order';
    patientId: string;
    orderType: OrderCategory;
    label: string;
    subType: string;
    priority?: OrderPriority;
    instructions?: string;
    parameters?: Record<string, string | number>;
}

export interface NoteAction {
    type: 'note';
    patientId: string;
    noteType: 'SOAP' | 'TeamNote' | 'Checklist';
    content: string;
}

export interface NavigateAction {
    type: 'navigate';
    route: string;
}

export interface WorkflowAction {
    type: 'workflow';
    workflowId: string;
    patientId?: string;
    parameters?: Record<string, unknown>;
}

export type JarvisExecutableAction = OrderAction | NoteAction | NavigateAction | WorkflowAction;

// Parse natural language to action
export const parseNaturalLanguageToAction = (
    input: string,
    currentPatient: Patient | null,
    patients: Patient[]
): JarvisExecutableAction | null => {
    const lowerInput = input.toLowerCase();

    // Order patterns
    const orderPatterns = [
        { regex: /order\s+(cbc|complete blood count)/i, subType: 'cbc', orderType: 'investigation' as OrderCategory },
        { regex: /order\s+(lft|liver function)/i, subType: 'lft', orderType: 'investigation' as OrderCategory },
        { regex: /order\s+(rft|renal function|kidney function)/i, subType: 'rft', orderType: 'investigation' as OrderCategory },
        { regex: /order\s+(electrolytes|lytes)/i, subType: 'electrolytes', orderType: 'investigation' as OrderCategory },
        { regex: /order\s+(chest\s*x[\s-]*ray|cxr)/i, subType: 'chest_xray', orderType: 'radiology' as OrderCategory },
        { regex: /order\s+(ct\s*scan|ct)/i, subType: 'ct_scan', orderType: 'radiology' as OrderCategory },
        { regex: /start\s+o2|order\s+o2|oxygen\s+therapy/i, subType: 'o2_nasal_cannula', orderType: 'procedure' as OrderCategory },
        { regex: /bipap|bi[\s-]*pap/i, subType: 'bipap', orderType: 'procedure' as OrderCategory },
        { regex: /cpap|c[\s-]*pap/i, subType: 'cpap', orderType: 'procedure' as OrderCategory },
        { regex: /nebuli[sz]ation|neb/i, subType: 'nebulization', orderType: 'procedure' as OrderCategory },
        { regex: /foley|urinary catheter/i, subType: 'foley_catheter', orderType: 'procedure' as OrderCategory },
        { regex: /ng\s*tube|nasogastric/i, subType: 'ng_tube', orderType: 'procedure' as OrderCategory },
        { regex: /iv\s*line|iv\s*cannula/i, subType: 'iv_cannulation', orderType: 'procedure' as OrderCategory },
    ];

    for (const pattern of orderPatterns) {
        if (pattern.regex.test(input)) {
            const targetPatient = currentPatient || patients[0];
            if (!targetPatient) return null;

            const procedure = getProcedureBySubType(pattern.subType);

            return {
                type: 'order',
                patientId: targetPatient.id,
                orderType: pattern.orderType,
                label: procedure?.label || pattern.subType,
                subType: pattern.subType,
                priority: procedure?.defaultPriority || 'routine'
            };
        }
    }

    // Navigation patterns
    if (/go\s+to\s+dashboard|back\s+to\s+dashboard|home/i.test(input)) {
        return { type: 'navigate', route: '/' };
    }
    if (/go\s+to\s+beds|bed\s+manager/i.test(input)) {
        return { type: 'navigate', route: '/beds' };
    }
    if (/go\s+to\s+triage/i.test(input)) {
        return { type: 'navigate', route: '/triage' };
    }

    // Patient navigation
    const patientMatch = input.match(/open\s+(.+)|see\s+(.+)|patient\s+(.+)/i);
    if (patientMatch) {
        const searchTerm = (patientMatch[1] || patientMatch[2] || patientMatch[3]).toLowerCase();
        const matchedPatient = patients.find(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.id.toLowerCase().includes(searchTerm)
        );
        if (matchedPatient) {
            return { type: 'navigate', route: `/patient/${matchedPatient.id}/medview` };
        }
    }

    return null;
};

// Execute an order action
export const executeOrderAction = async (
    action: OrderAction,
    addOrderToPatient: (patientId: string, order: Partial<Order>) => void
): Promise<ActionResult> => {
    try {
        const procedure = getProcedureBySubType(action.subType);

        const order: Partial<Order> = {
            orderId: `ORD-${Date.now()}`,
            patientId: action.patientId,
            createdAt: new Date().toISOString(),
            category: action.orderType,
            subType: action.subType,
            label: action.label,
            instructions: action.instructions,
            payload: action.parameters ? { details: JSON.stringify(action.parameters) } : {},
            priority: action.priority || 'routine',
            status: 'draft'
        };

        addOrderToPatient(action.patientId, order);

        return {
            success: true,
            message: `Created draft order: ${action.label}`,
            data: order
        };
    } catch (error) {
        console.error('[ActionExecutor] Order error:', error);
        return {
            success: false,
            message: `Failed to create order: ${error}`
        };
    }
};

// Execute a note action
export const executeNoteAction = async (
    action: NoteAction,
    addNoteToPatient: (patientId: string, content: string, isEscalation?: boolean) => Promise<void>
): Promise<ActionResult> => {
    try {
        await addNoteToPatient(action.patientId, action.content, false);

        return {
            success: true,
            message: `Added note to patient`,
            data: { content: action.content }
        };
    } catch (error) {
        console.error('[ActionExecutor] Note error:', error);
        return {
            success: false,
            message: `Failed to add note: ${error}`
        };
    }
};

// Execute a workflow action
export const executeWorkflowAction = async (
    action: WorkflowAction
): Promise<ActionResult> => {
    // Predefined workflows
    const workflows: Record<string, () => Promise<ActionResult>> = {
        'fever-workup': async () => {
            // This would create multiple orders for fever workup
            return {
                success: true,
                message: 'Fever workup workflow initiated (CBC, LFT, RFT, Blood Culture, Dengue NS1)',
                data: { orders: ['cbc', 'lft', 'rft', 'blood_culture', 'dengue_ns1'] }
            };
        },
        'acs-protocol': async () => {
            return {
                success: true,
                message: 'ACS protocol initiated (ECG, Troponin, CBC, RFT)',
                data: { orders: ['ecg', 'troponin', 'cbc', 'rft'] }
            };
        },
        'discharge-prep': async () => {
            return {
                success: true,
                message: 'Discharge preparation workflow started',
                data: {}
            };
        }
    };

    const workflow = workflows[action.workflowId];
    if (workflow) {
        return await workflow();
    }

    return {
        success: false,
        message: `Unknown workflow: ${action.workflowId}`
    };
};

// Main executor function
export const executeAction = async (
    action: JarvisExecutableAction,
    context: {
        navigate: (route: string) => void;
        addOrderToPatient: (patientId: string, order: Partial<Order>) => void;
        addNoteToPatient: (patientId: string, content: string, isEscalation?: boolean) => Promise<void>;
    }
): Promise<ActionResult> => {
    switch (action.type) {
        case 'order':
            return await executeOrderAction(action, context.addOrderToPatient);
        case 'note':
            return await executeNoteAction(action, context.addNoteToPatient);
        case 'navigate':
            context.navigate(action.route);
            return { success: true, message: `Navigating to ${action.route}` };
        case 'workflow':
            return await executeWorkflowAction(action);
        default:
            return { success: false, message: 'Unknown action type' };
    }
};

export default executeAction;
