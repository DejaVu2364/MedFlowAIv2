// ConversationManager - Context tracking and pronoun resolution for Jarvis

import { Patient } from '../../types';
import { ConversationMessage } from '../../types/jarvis';

export interface ConversationContext {
    currentPatient: Patient | null;
    lastMentionedPatient: Patient | null;
    recentTopics: string[];
    recentEntities: {
        patientNames: string[];
        labTests: string[];
        medications: string[];
        conditions: string[];
    };
    sessionStart: string;
}

// Storage key
const CONTEXT_KEY = 'jarvis_conversation_context';

// Initialize context
const createEmptyContext = (): ConversationContext => ({
    currentPatient: null,
    lastMentionedPatient: null,
    recentTopics: [],
    recentEntities: {
        patientNames: [],
        labTests: [],
        medications: [],
        conditions: []
    },
    sessionStart: new Date().toISOString()
});

let conversationContext: ConversationContext = createEmptyContext();
let messageHistory: ConversationMessage[] = [];

// Set current patient (when viewing a patient)
export const setCurrentPatient = (patient: Patient | null): void => {
    conversationContext.currentPatient = patient;
    if (patient) {
        conversationContext.lastMentionedPatient = patient;
        addEntity('patientNames', patient.name);
    }
};

// Get current context
export const getContext = (): ConversationContext => conversationContext;

// Add a topic to recent topics
export const addTopic = (topic: string): void => {
    const topics = conversationContext.recentTopics;
    if (!topics.includes(topic.toLowerCase())) {
        topics.unshift(topic.toLowerCase());
        conversationContext.recentTopics = topics.slice(0, 10); // Keep last 10
    }
};

// Add an entity
const addEntity = (type: keyof ConversationContext['recentEntities'], value: string): void => {
    const entities = conversationContext.recentEntities[type];
    if (!entities.includes(value)) {
        entities.unshift(value);
        conversationContext.recentEntities[type] = entities.slice(0, 5);
    }
};

// Extract entities from text
export const extractEntities = (text: string, patients: Patient[]): void => {
    const lowerText = text.toLowerCase();

    // Check for patient names
    patients.forEach(patient => {
        if (lowerText.includes(patient.name.toLowerCase()) ||
            lowerText.includes(patient.name.split(' ')[0].toLowerCase())) {
            addEntity('patientNames', patient.name);
            conversationContext.lastMentionedPatient = patient;
        }
    });

    // Check for common lab tests
    const labTests = ['cbc', 'lft', 'rft', 'electrolytes', 'hba1c', 'lipid', 'thyroid', 'creatinine', 'platelet', 'hemoglobin', 'wbc'];
    labTests.forEach(test => {
        if (lowerText.includes(test)) {
            addEntity('labTests', test.toUpperCase());
            addTopic('labs');
        }
    });

    // Check for common conditions
    const conditions = ['fever', 'dengue', 'diabetes', 'hypertension', 'pneumonia', 'covid', 'infection', 'pain', 'injury'];
    conditions.forEach(condition => {
        if (lowerText.includes(condition)) {
            addEntity('conditions', condition);
            addTopic(condition);
        }
    });

    // Check for medications
    const medications = ['paracetamol', 'aspirin', 'insulin', 'metformin', 'antibiotic', 'iv fluids', 'oxygen'];
    medications.forEach(med => {
        if (lowerText.includes(med)) {
            addEntity('medications', med);
            addTopic('medications');
        }
    });
};

// Resolve pronouns in user input
export const resolvePronouns = (input: string, patients: Patient[]): string => {
    let resolved = input;
    const context = conversationContext;

    // Patterns to resolve
    const patientPronouns = [
        /\b(her|him|them|this patient|that patient|the patient)\b/gi,
        /\bwhat about (her|him|them)\b/gi,
        /\bhow is (she|he|they)\b/gi,
        /\b(she|he|they) (has|have|is|are)\b/gi
    ];

    // Get reference patient
    const referencePatient = context.currentPatient || context.lastMentionedPatient;

    if (referencePatient) {
        patientPronouns.forEach(pattern => {
            if (pattern.test(input)) {
                // Add patient name context to the query
                resolved = `${input} [Context: referring to ${referencePatient.name}]`;
            }
        });
    }

    // Resolve "it" for labs/tests
    const itPatterns = [
        /\b(it|that|those results?)\b.*\b(dropped?|increased?|changed?|normal)\b/gi,
        /\bcheck if (it|that) (dropped?|increased?|changed?)\b/gi,
        /\bwhat about (it|that|those)\b/gi
    ];

    if (context.recentEntities.labTests.length > 0) {
        itPatterns.forEach(pattern => {
            if (pattern.test(input)) {
                const lastTest = context.recentEntities.labTests[0];
                resolved = `${input} [Context: referring to ${lastTest}]`;
            }
        });
    }

    return resolved;
};

// Add message to history
export const addMessage = (message: ConversationMessage, patients: Patient[]): void => {
    messageHistory.push(message);
    messageHistory = messageHistory.slice(-20); // Keep last 20

    // Extract entities from the message
    extractEntities(message.content, patients);
};

// Get message history
export const getMessageHistory = (): ConversationMessage[] => messageHistory;

// Build context string for Gemini
export const buildContextString = (): string => {
    const ctx = conversationContext;
    let contextStr = '';

    if (ctx.currentPatient) {
        contextStr += `Current patient in focus: ${ctx.currentPatient.name}\n`;
    }

    if (ctx.lastMentionedPatient && ctx.lastMentionedPatient.id !== ctx.currentPatient?.id) {
        contextStr += `Last mentioned patient: ${ctx.lastMentionedPatient.name}\n`;
    }

    if (ctx.recentTopics.length > 0) {
        contextStr += `Recent topics: ${ctx.recentTopics.slice(0, 5).join(', ')}\n`;
    }

    if (ctx.recentEntities.labTests.length > 0) {
        contextStr += `Recently discussed labs: ${ctx.recentEntities.labTests.join(', ')}\n`;
    }

    return contextStr;
};

// Reset context (e.g., on logout or new session)
export const resetContext = (): void => {
    conversationContext = createEmptyContext();
    messageHistory = [];
};

// Check if context is stale (> 1 hour)
export const isContextStale = (): boolean => {
    const sessionStart = new Date(conversationContext.sessionStart).getTime();
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return sessionStart < oneHourAgo;
};
