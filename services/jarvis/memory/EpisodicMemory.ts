// Episodic Memory Service
// Saves and manages episodes in Firestore with HIPAA-compliant de-identification

import { db, isFirebaseInitialized } from '../../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit, writeBatch, doc, updateDoc } from 'firebase/firestore';
import { Episode, DEFAULT_MEMORY_CONFIG } from './types';
import { generateEmbedding } from './EmbeddingService';

// ============================================
// DE-IDENTIFICATION (HIPAA Compliance)
// ============================================

/**
 * De-identify text before embedding - removes PII
 * Patient names stored for display but NOT included in embedding
 */
export function deidentify(text: string, patientName: string): string {
    if (!text) return '';

    let result = text;

    // Replace patient name with [PATIENT]
    if (patientName) {
        const nameRegex = new RegExp(patientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        result = result.replace(nameRegex, '[PATIENT]');
    }

    // Replace MRN patterns
    result = result.replace(/\b(MRN|ID|mrn|id)[:\s]*[\w-]+/gi, '[MRN]');

    // Replace phone numbers (10+ digits)
    result = result.replace(/\+?\d{10,}/g, '[PHONE]');

    // Replace specific date formats (keep relative dates like "yesterday")
    result = result.replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, '[DATE]');

    return result;
}

// ============================================
// TAG EXTRACTION
// ============================================

const MEDICAL_TAGS = [
    'sepsis', 'fever', 'infection', 'diabetes', 'hypertension', 'cardiac',
    'respiratory', 'renal', 'hepatic', 'neurological', 'cbc', 'electrolytes',
    'imaging', 'ct', 'mri', 'x-ray', 'xray', 'ecg', 'discharge', 'admission',
    'antibiotic', 'pain', 'surgery', 'emergency', 'critical', 'stable',
    'medication', 'dosage', 'allergy', 'vitals', 'blood pressure', 'oxygen'
];

/**
 * Extract medical tags from text
 */
export function extractTags(text: string): string[] {
    if (!text) return [];
    const lower = text.toLowerCase();
    return MEDICAL_TAGS.filter(tag => lower.includes(tag));
}

// ============================================
// EPISODE SUMMARY GENERATION
// ============================================

/**
 * Generate summary for embedding from interaction
 */
function generateEpisodeSummary(
    userQuery: string,
    jarvisResponse: string,
    toolsUsed: string[]
): string {
    const tools = toolsUsed.length > 0 ? ` Tools used: ${toolsUsed.join(', ')}.` : '';
    // Truncate response for summary
    const shortResponse = jarvisResponse.length > 200
        ? jarvisResponse.slice(0, 200) + '...'
        : jarvisResponse;
    return `Query: "${userQuery}" Response: ${shortResponse}${tools}`;
}

// ============================================
// PATIENT ID HASHING
// ============================================

/**
 * Simple hash for patient ID (obfuscation, not cryptographic)
 */
function hashPatientId(patientId: string): string {
    let hash = 0;
    for (let i = 0; i < patientId.length; i++) {
        const char = patientId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `PH-${Math.abs(hash).toString(16)}`;
}

// ============================================
// SAVE EPISODE
// ============================================

/**
 * Save an episode to Firestore with embedding
 */
export async function saveEpisode(
    doctorId: string,
    patientId: string,
    patientName: string,
    userQuery: string,
    jarvisResponse: string,
    toolsUsed: string[],
    confidence: number,
    sessionId: string
): Promise<string | null> {
    if (!DEFAULT_MEMORY_CONFIG.enabled) {
        console.log('[EpisodicMemory] Memory disabled');
        return null;
    }

    if (!isFirebaseInitialized || !db) {
        console.log('[EpisodicMemory] Firebase not initialized');
        return null;
    }

    try {
        // De-identify content before embedding
        const deidentifiedQuery = deidentify(userQuery, patientName);
        const deidentifiedResponse = deidentify(jarvisResponse, patientName);
        const summary = generateEpisodeSummary(deidentifiedQuery, deidentifiedResponse, toolsUsed);

        // Generate embedding from de-identified content
        const textForEmbedding = `${deidentifiedQuery} ${summary}`;
        const embedding = await generateEmbedding(textForEmbedding);

        if (embedding.length === 0) {
            console.warn('[EpisodicMemory] Failed to generate embedding, skipping save');
            return null;
        }

        const episode: Omit<Episode, 'episodeId'> = {
            patientId: hashPatientId(patientId),
            patientName,  // Stored for display, NOT in embedding
            doctorId,
            timestamp: new Date().toISOString(),
            sessionId,
            summary,
            userQuery,
            jarvisResponse: jarvisResponse.slice(0, 1000), // Limit storage
            toolsUsed,
            outcome: 'none',
            embedding,
            tags: extractTags(userQuery + ' ' + jarvisResponse),
            confidence
        };

        const docRef = await addDoc(
            collection(db, 'jarvis_memory', doctorId, 'episodes'),
            episode
        );

        console.log('[EpisodicMemory] Episode saved:', docRef.id);
        return docRef.id;

    } catch (error) {
        console.error('[EpisodicMemory] Error saving episode:', error);
        return null;
    }
}

// ============================================
// UPDATE EPISODE OUTCOME
// ============================================

/**
 * Update the outcome of an episode (accepted/rejected/modified)
 */
export async function updateEpisodeOutcome(
    doctorId: string,
    episodeId: string,
    outcome: 'accepted' | 'rejected' | 'modified'
): Promise<void> {
    if (!isFirebaseInitialized || !db) return;

    try {
        await updateDoc(
            doc(db, 'jarvis_memory', doctorId, 'episodes', episodeId),
            { outcome }
        );
        console.log('[EpisodicMemory] Outcome updated:', episodeId, outcome);
    } catch (error) {
        console.error('[EpisodicMemory] Error updating outcome:', error);
    }
}

// ============================================
// CLEANUP OLD EPISODES (HIPAA Retention)
// ============================================

const SCALE_WARNING_THRESHOLD = 800;

/**
 * Clean up episodes older than retention period
 */
export async function cleanupOldEpisodes(doctorId: string): Promise<number> {
    if (!isFirebaseInitialized || !db) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DEFAULT_MEMORY_CONFIG.retentionDays);

    try {
        const snapshot = await getDocs(
            query(
                collection(db, 'jarvis_memory', doctorId, 'episodes'),
                where('timestamp', '<', cutoffDate.toISOString()),
                limit(50)  // Batch limit
            )
        );

        if (snapshot.empty) return 0;

        const batch = writeBatch(db);
        snapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();

        console.log(`[EpisodicMemory] Cleaned up ${snapshot.docs.length} old episodes`);
        return snapshot.docs.length;

    } catch (error) {
        console.error('[EpisodicMemory] Cleanup error:', error);
        return 0;
    }
}

/**
 * Check scale and warn if approaching limits
 */
export function checkScaleWarning(episodeCount: number): void {
    if (episodeCount > SCALE_WARNING_THRESHOLD) {
        console.warn(
            `[EpisodicMemory] ⚠️ Scale warning: ${episodeCount} episodes. ` +
            `Consider migrating to dedicated vector DB for better performance.`
        );
    }
}
