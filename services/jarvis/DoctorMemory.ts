// Doctor Memory Service - Persistence layer for Jarvis AI

import { DoctorProfile, DoctorPreferences, OrderPattern, InteractionHistory, ShiftContext } from '../types/jarvis';

const STORAGE_KEY = 'medflow_doctor_profile';

// Default preferences for new doctors
const defaultPreferences: DoctorPreferences = {
    orderPatterns: [],
    prefersDarkMode: false,
    defaultView: 'queue',
    showVitalsTrend: true,
    briefingStyle: 'concise',
    notificationLevel: 'critical'
};

const defaultHistory: InteractionHistory = {
    suggestionsAccepted: 0,
    suggestionsRejected: 0,
    commonDismissals: [],
    totalInteractions: 0
};

// Get doctor profile from localStorage
export const getDoctorProfile = (userId: string): DoctorProfile | null => {
    try {
        const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
        if (stored) {
            return JSON.parse(stored) as DoctorProfile;
        }
    } catch (e) {
        console.warn('[DoctorMemory] Failed to load profile:', e);
    }
    return null;
};

// Create new doctor profile
export const createDoctorProfile = (userId: string, name: string, email: string): DoctorProfile => {
    const profile: DoctorProfile = {
        id: userId,
        name,
        email,
        preferences: { ...defaultPreferences },
        history: { ...defaultHistory },
        currentShift: {
            startTime: new Date().toISOString(),
            patientsSeenToday: [],
            pendingActions: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    saveDoctorProfile(profile);
    return profile;
};

// Save doctor profile to localStorage
export const saveDoctorProfile = (profile: DoctorProfile): void => {
    try {
        profile.updatedAt = new Date().toISOString();
        localStorage.setItem(`${STORAGE_KEY}_${profile.id}`, JSON.stringify(profile));
    } catch (e) {
        console.error('[DoctorMemory] Failed to save profile:', e);
    }
};

// Get or create profile
export const getOrCreateProfile = (userId: string, name: string, email: string): DoctorProfile => {
    const existing = getDoctorProfile(userId);
    if (existing) {
        return existing;
    }
    return createDoctorProfile(userId, name, email);
};

// Learn from an order placement
export const learnOrderPattern = (
    profile: DoctorProfile,
    condition: string,
    orderLabel: string
): DoctorProfile => {
    const patterns = [...profile.preferences.orderPatterns];
    const existingPattern = patterns.find(p =>
        p.condition.toLowerCase() === condition.toLowerCase()
    );

    if (existingPattern) {
        // Update existing pattern
        if (!existingPattern.usualOrders.includes(orderLabel)) {
            existingPattern.usualOrders.push(orderLabel);
        }
        existingPattern.frequency++;
        existingPattern.lastUsed = new Date().toISOString();
    } else {
        // Create new pattern
        patterns.push({
            condition: condition.toLowerCase(),
            usualOrders: [orderLabel],
            frequency: 1,
            lastUsed: new Date().toISOString()
        });
    }

    const updatedProfile = {
        ...profile,
        preferences: {
            ...profile.preferences,
            orderPatterns: patterns
        }
    };

    saveDoctorProfile(updatedProfile);
    return updatedProfile;
};

// Record suggestion acceptance
export const recordSuggestionAccepted = (profile: DoctorProfile): DoctorProfile => {
    const updatedProfile = {
        ...profile,
        history: {
            ...profile.history,
            suggestionsAccepted: profile.history.suggestionsAccepted + 1,
            totalInteractions: profile.history.totalInteractions + 1
        }
    };
    saveDoctorProfile(updatedProfile);
    return updatedProfile;
};

// Record suggestion rejection
export const recordSuggestionRejected = (profile: DoctorProfile, reason?: string): DoctorProfile => {
    const dismissals = [...profile.history.commonDismissals];
    if (reason && !dismissals.includes(reason)) {
        dismissals.push(reason);
    }

    const updatedProfile = {
        ...profile,
        history: {
            ...profile.history,
            suggestionsRejected: profile.history.suggestionsRejected + 1,
            totalInteractions: profile.history.totalInteractions + 1,
            commonDismissals: dismissals.slice(-20) // Keep last 20
        }
    };
    saveDoctorProfile(updatedProfile);
    return updatedProfile;
};

// Record patient seen
export const recordPatientSeen = (profile: DoctorProfile, patientId: string): DoctorProfile => {
    const patientsSeenToday = [...profile.currentShift.patientsSeenToday];
    if (!patientsSeenToday.includes(patientId)) {
        patientsSeenToday.push(patientId);
    }

    const updatedProfile = {
        ...profile,
        currentShift: {
            ...profile.currentShift,
            patientsSeenToday
        }
    };
    saveDoctorProfile(updatedProfile);
    return updatedProfile;
};

// Get matching order pattern for a condition
export const getMatchingPattern = (
    profile: DoctorProfile,
    condition: string
): OrderPattern | null => {
    const normalizedCondition = condition.toLowerCase();
    return profile.preferences.orderPatterns.find(p =>
        normalizedCondition.includes(p.condition) && p.frequency >= 2
    ) || null;
};

// Get acceptance rate
export const getAcceptanceRate = (profile: DoctorProfile): number => {
    const total = profile.history.suggestionsAccepted + profile.history.suggestionsRejected;
    if (total === 0) return 0;
    return Math.round((profile.history.suggestionsAccepted / total) * 100);
};

// Start new shift
export const startNewShift = (profile: DoctorProfile): DoctorProfile => {
    const updatedProfile = {
        ...profile,
        currentShift: {
            startTime: new Date().toISOString(),
            patientsSeenToday: [],
            pendingActions: []
        }
    };
    saveDoctorProfile(updatedProfile);
    return updatedProfile;
};
