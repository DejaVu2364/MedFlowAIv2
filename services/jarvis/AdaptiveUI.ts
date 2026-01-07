// AdaptiveUI - Dashboard personalization based on doctor preferences

import { DoctorProfile } from '../../types/jarvis';
import { getDoctorProfile, saveDoctorProfile } from './DoctorMemory';

export interface DashboardConfig {
    defaultTab: 'queue' | 'active' | 'all';
    showVitalsCharts: boolean;
    showAIWhisperBar: boolean;
    showMorningBriefing: boolean;
    compactMode: boolean;
    darkMode: boolean;
    activePatientLimit: number;
    queuePatientLimit: number;
    insightPriority: 'high' | 'all';
}

// Default config
const defaultConfig: DashboardConfig = {
    defaultTab: 'queue',
    showVitalsCharts: true,
    showAIWhisperBar: true,
    showMorningBriefing: true,
    compactMode: false,
    darkMode: false,
    activePatientLimit: 5,
    queuePatientLimit: 5,
    insightPriority: 'all'
};

// Storage key
const CONFIG_KEY = 'jarvis_dashboard_config';

// Load dashboard config
export const loadDashboardConfig = (): DashboardConfig => {
    try {
        const stored = localStorage.getItem(CONFIG_KEY);
        if (stored) {
            return { ...defaultConfig, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.warn('[AdaptiveUI] Failed to load config:', e);
    }
    return { ...defaultConfig };
};

// Save dashboard config
export const saveDashboardConfig = (config: DashboardConfig): void => {
    try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
        console.warn('[AdaptiveUI] Failed to save config:', e);
    }
};

// Update a specific config value
export const updateConfig = <K extends keyof DashboardConfig>(
    key: K,
    value: DashboardConfig[K]
): DashboardConfig => {
    const config = loadDashboardConfig();
    config[key] = value;
    saveDashboardConfig(config);
    return config;
};

// Adapt config based on doctor behavior
export const adaptFromBehavior = (
    doctorId: string,
    action: 'dismiss_vitals' | 'dismiss_briefing' | 'dismiss_insight' | 'prefer_compact'
): void => {
    const config = loadDashboardConfig();
    const profile = getDoctorProfile(doctorId);

    switch (action) {
        case 'dismiss_vitals':
            // If vitals dismissed 3+ times, hide by default
            if (profile?.history.commonDismissals.filter(d => d.includes('vitals')).length >= 3) {
                config.showVitalsCharts = false;
                saveDashboardConfig(config);
            }
            break;

        case 'dismiss_briefing':
            // If briefing dismissed 3+ times, hide by default
            config.showMorningBriefing = false;
            saveDashboardConfig(config);
            break;

        case 'dismiss_insight':
            // Track dismissals to adjust priority
            break;

        case 'prefer_compact':
            config.compactMode = true;
            saveDashboardConfig(config);
            break;
    }
};

// Get adaptive greeting based on time and doctor patterns
export const getAdaptiveGreeting = (doctorName: string, profile?: DoctorProfile): string => {
    const hour = new Date().getHours();
    const firstName = doctorName.split(' ')[0];

    // Base greeting
    let greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    // Personalize based on history
    if (profile) {
        const patientsToday = profile.currentShift.patientsSeenToday.length;
        const acceptanceRate = profile.history.totalInteractions > 0
            ? Math.round((profile.history.suggestionsAccepted / profile.history.totalInteractions) * 100)
            : 0;

        if (patientsToday > 10) {
            greeting = `${greeting}, Dr. ${firstName}. Busy day!`;
        } else if (acceptanceRate > 80 && profile.history.totalInteractions > 20) {
            greeting = `${greeting}, Dr. ${firstName}. Great teamwork!`;
        } else {
            greeting = `${greeting}, Dr. ${firstName}`;
        }
    } else {
        greeting = `${greeting}, Dr. ${firstName}`;
    }

    return greeting;
};

// Determine if feature should be shown
export const shouldShowFeature = (
    feature: 'vitals' | 'briefing' | 'whisperBar' | 'insights',
    config: DashboardConfig
): boolean => {
    switch (feature) {
        case 'vitals':
            return config.showVitalsCharts;
        case 'briefing':
            return config.showMorningBriefing;
        case 'whisperBar':
            return config.showAIWhisperBar;
        case 'insights':
            return true; // Always show, but filter by priority
        default:
            return true;
    }
};

// Apply dark mode
export const applyDarkMode = (enabled: boolean): void => {
    if (enabled) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    updateConfig('darkMode', enabled);
};

// Toggle dark mode
export const toggleDarkMode = (): boolean => {
    const config = loadDashboardConfig();
    const newValue = !config.darkMode;
    applyDarkMode(newValue);
    return newValue;
};

// Initialize dark mode from config
export const initializeDarkMode = (): void => {
    const config = loadDashboardConfig();
    if (config.darkMode) {
        document.documentElement.classList.add('dark');
    }
};
