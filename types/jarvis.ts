// Jarvis AI Types

export interface DoctorProfile {
    id: string;
    name: string;
    email: string;

    // Learned Preferences
    preferences: DoctorPreferences;

    // Interaction History
    history: InteractionHistory;

    // Current Session
    currentShift: ShiftContext;

    // Metadata
    createdAt: string;
    updatedAt: string;
}

export interface DoctorPreferences {
    // Order patterns learned over time
    orderPatterns: OrderPattern[];

    // UI preferences
    prefersDarkMode: boolean;
    defaultView: 'queue' | 'active' | 'all';
    showVitalsTrend: boolean;

    // Communication style
    briefingStyle: 'detailed' | 'concise';
    notificationLevel: 'all' | 'critical' | 'minimal';
}

export interface OrderPattern {
    condition: string;      // e.g., "fever"
    usualOrders: string[];  // e.g., ["CBC", "LFT"]
    frequency: number;      // Times this pattern occurred
    lastUsed: string;       // ISO timestamp
}

export interface InteractionHistory {
    suggestionsAccepted: number;
    suggestionsRejected: number;
    commonDismissals: string[];
    totalInteractions: number;
}

export interface ShiftContext {
    startTime: string;
    patientsSeenToday: string[];
    pendingActions: JarvisAction[];
}

export interface JarvisAction {
    id: string;
    type: 'order' | 'note' | 'alert' | 'followup';
    patientId: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    createdAt: string;
}

export interface JarvisInsight {
    id: string;
    patientId: string;
    patientName: string;
    category: 'vitals' | 'labs' | 'pattern' | 'wait' | 'medication';
    message: string;
    severity: 'high' | 'medium' | 'low';
    suggestedAction?: {
        label: string;
        type: 'order' | 'navigate' | 'dismiss';
        payload?: Record<string, unknown>;
    };
    isPersonalized: boolean;  // Based on learned patterns?
    createdAt: string;
}

export interface JarvisBriefing {
    greeting: string;
    summary: string;
    criticalCount: number;
    queueCount: number;
    dischargeReadyCount: number;
    topPriority?: {
        patientName: string;
        patientId: string;
        reason: string;
    };
}

export interface ConversationMessage {
    id: string;
    role: 'user' | 'jarvis';
    content: string;
    timestamp: string;
    context?: {
        patientId?: string;
        topic?: string;
    };
}
