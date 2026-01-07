// Respiratory Procedures - O2 Therapy, BiPAP, CPAP, etc.
// These are critical ICU/ER procedures for respiratory support

import { OrderCategory, OrderPriority } from '../types';

export interface ProcedureOption {
    label: string;
    subType: string;
    category: OrderCategory;
    defaultPriority: OrderPriority;
    requiresParameters?: boolean;
    parameters?: {
        name: string;
        type: 'number' | 'select' | 'text';
        label: string;
        options?: string[];
        unit?: string;
        defaultValue?: string | number;
    }[];
}

export const RESPIRATORY_PROCEDURES: ProcedureOption[] = [
    {
        label: 'O2 Therapy - Nasal Cannula',
        subType: 'o2_nasal_cannula',
        category: 'procedure',
        defaultPriority: 'urgent',
        requiresParameters: true,
        parameters: [
            { name: 'flowRate', type: 'number', label: 'Flow Rate', unit: 'L/min', defaultValue: 4 }
        ]
    },
    {
        label: 'O2 Therapy - Simple Face Mask',
        subType: 'o2_simple_mask',
        category: 'procedure',
        defaultPriority: 'urgent',
        requiresParameters: true,
        parameters: [
            { name: 'flowRate', type: 'number', label: 'Flow Rate', unit: 'L/min', defaultValue: 8 }
        ]
    },
    {
        label: 'O2 Therapy - Venturi Mask',
        subType: 'o2_venturi',
        category: 'procedure',
        defaultPriority: 'urgent',
        requiresParameters: true,
        parameters: [
            { name: 'fiO2', type: 'select', label: 'FiO2 Target', options: ['24%', '28%', '31%', '35%', '40%', '50%'] }
        ]
    },
    {
        label: 'O2 Therapy - Non-Rebreather Mask',
        subType: 'o2_nrb',
        category: 'procedure',
        defaultPriority: 'STAT',
        requiresParameters: true,
        parameters: [
            { name: 'flowRate', type: 'number', label: 'Flow Rate', unit: 'L/min', defaultValue: 15 }
        ]
    },
    {
        label: 'BiPAP',
        subType: 'bipap',
        category: 'procedure',
        defaultPriority: 'urgent',
        requiresParameters: true,
        parameters: [
            { name: 'ipap', type: 'number', label: 'IPAP', unit: 'cmH2O', defaultValue: 12 },
            { name: 'epap', type: 'number', label: 'EPAP', unit: 'cmH2O', defaultValue: 5 },
            { name: 'fiO2', type: 'number', label: 'FiO2', unit: '%', defaultValue: 40 }
        ]
    },
    {
        label: 'CPAP',
        subType: 'cpap',
        category: 'procedure',
        defaultPriority: 'urgent',
        requiresParameters: true,
        parameters: [
            { name: 'pressure', type: 'number', label: 'Pressure', unit: 'cmH2O', defaultValue: 8 },
            { name: 'fiO2', type: 'number', label: 'FiO2', unit: '%', defaultValue: 40 }
        ]
    },
    {
        label: 'High Flow Nasal Cannula (HFNC)',
        subType: 'hfnc',
        category: 'procedure',
        defaultPriority: 'urgent',
        requiresParameters: true,
        parameters: [
            { name: 'flowRate', type: 'number', label: 'Flow Rate', unit: 'L/min', defaultValue: 40 },
            { name: 'fiO2', type: 'number', label: 'FiO2', unit: '%', defaultValue: 50 }
        ]
    },
    {
        label: 'Nebulization',
        subType: 'nebulization',
        category: 'procedure',
        defaultPriority: 'routine',
        requiresParameters: true,
        parameters: [
            { name: 'medication', type: 'select', label: 'Medication', options: ['Salbutamol 2.5mg', 'Ipratropium 500mcg', 'Budesonide 0.5mg', 'Salbutamol + Ipratropium'] },
            { name: 'frequency', type: 'select', label: 'Frequency', options: ['Q4H', 'Q6H', 'Q8H', 'PRN', 'Stat + Q6H'] }
        ]
    },
    {
        label: 'Intubation & Mechanical Ventilation',
        subType: 'intubation',
        category: 'procedure',
        defaultPriority: 'STAT',
        requiresParameters: false
    }
];

export const VASCULAR_PROCEDURES: ProcedureOption[] = [
    {
        label: 'IV Cannulation',
        subType: 'iv_cannulation',
        category: 'procedure',
        defaultPriority: 'routine',
        requiresParameters: true,
        parameters: [
            { name: 'gauge', type: 'select', label: 'Gauge', options: ['18G', '20G', '22G', '24G'] },
            { name: 'site', type: 'select', label: 'Site', options: ['Forearm', 'Hand', 'Antecubital'] }
        ]
    },
    {
        label: 'Central Venous Catheter (CVC)',
        subType: 'central_line',
        category: 'procedure',
        defaultPriority: 'urgent',
        requiresParameters: true,
        parameters: [
            { name: 'site', type: 'select', label: 'Site', options: ['Internal Jugular', 'Subclavian', 'Femoral'] },
            { name: 'lumens', type: 'select', label: 'Lumens', options: ['Single', 'Double', 'Triple'] }
        ]
    },
    {
        label: 'Arterial Line',
        subType: 'arterial_line',
        category: 'procedure',
        defaultPriority: 'urgent',
        requiresParameters: true,
        parameters: [
            { name: 'site', type: 'select', label: 'Site', options: ['Radial', 'Femoral', 'Brachial'] }
        ]
    }
];

export const DRAINAGE_PROCEDURES: ProcedureOption[] = [
    {
        label: 'Foley Catheter Insertion',
        subType: 'foley_catheter',
        category: 'procedure',
        defaultPriority: 'routine',
        requiresParameters: true,
        parameters: [
            { name: 'size', type: 'select', label: 'Size', options: ['14Fr', '16Fr', '18Fr', '20Fr'] }
        ]
    },
    {
        label: 'Nasogastric (NG) Tube Insertion',
        subType: 'ng_tube',
        category: 'procedure',
        defaultPriority: 'routine',
        requiresParameters: true,
        parameters: [
            { name: 'size', type: 'select', label: 'Size', options: ['14Fr', '16Fr', '18Fr'] },
            { name: 'purpose', type: 'select', label: 'Purpose', options: ['Decompression', 'Feeding', 'Medication'] }
        ]
    },
    {
        label: 'Intercostal Drain (ICD) / Chest Tube',
        subType: 'chest_tube',
        category: 'procedure',
        defaultPriority: 'urgent',
        requiresParameters: true,
        parameters: [
            { name: 'size', type: 'select', label: 'Size', options: ['24Fr', '28Fr', '32Fr'] },
            { name: 'side', type: 'select', label: 'Side', options: ['Left', 'Right'] },
            { name: 'indication', type: 'select', label: 'Indication', options: ['Pneumothorax', 'Pleural Effusion', 'Hemothorax', 'Empyema'] }
        ]
    },
    {
        label: 'Lumbar Puncture',
        subType: 'lumbar_puncture',
        category: 'procedure',
        defaultPriority: 'urgent',
        requiresParameters: false
    }
];

export const NURSING_PROCEDURES: ProcedureOption[] = [
    {
        label: 'Strict I/O Monitoring',
        subType: 'io_monitoring',
        category: 'nursing',
        defaultPriority: 'routine'
    },
    {
        label: 'Hourly Vitals',
        subType: 'hourly_vitals',
        category: 'nursing',
        defaultPriority: 'urgent'
    },
    {
        label: 'Continuous SpO2 Monitoring',
        subType: 'spo2_monitoring',
        category: 'nursing',
        defaultPriority: 'routine'
    },
    {
        label: 'Blood Sugar Monitoring (QID)',
        subType: 'blood_sugar_qid',
        category: 'nursing',
        defaultPriority: 'routine'
    },
    {
        label: 'DVT Prophylaxis',
        subType: 'dvt_prophylaxis',
        category: 'nursing',
        defaultPriority: 'routine'
    },
    {
        label: 'Pressure Sore Care',
        subType: 'pressure_sore_care',
        category: 'nursing',
        defaultPriority: 'routine'
    }
];

// All procedures combined
export const ALL_PROCEDURES = [
    ...RESPIRATORY_PROCEDURES,
    ...VASCULAR_PROCEDURES,
    ...DRAINAGE_PROCEDURES,
    ...NURSING_PROCEDURES
];

// Helper to get procedure by subType
export const getProcedureBySubType = (subType: string): ProcedureOption | undefined => {
    return ALL_PROCEDURES.find(p => p.subType === subType);
};

// Helper to create order from procedure
export const createOrderFromProcedure = (
    procedure: ProcedureOption,
    patientId: string,
    createdBy: string,
    parameterValues?: Record<string, string | number>
) => ({
    orderId: `ORD-${Date.now()}`,
    patientId,
    createdBy,
    createdAt: new Date().toISOString(),
    category: procedure.category,
    subType: procedure.subType,
    label: procedure.label,
    instructions: parameterValues ?
        Object.entries(parameterValues).map(([k, v]) => `${k}: ${v}`).join(', ') : '',
    payload: {
        details: parameterValues ? JSON.stringify(parameterValues) : undefined
    },
    priority: procedure.defaultPriority,
    status: 'draft' as const
});
