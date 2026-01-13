// Memory Retrieval Service
// Semantic search over episodes using embeddings

import { db, isFirebaseInitialized } from '../../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Episode, MemorySearchResult, DEFAULT_MEMORY_CONFIG } from './types';
import { generateEmbedding, cosineSimilarity } from './EmbeddingService';
import { cleanupOldEpisodes, checkScaleWarning, deidentify } from './EpisodicMemory';

/**
 * Search memory for episodes related to query
 * Uses semantic similarity via embeddings
 */
export async function searchMemory(
    doctorId: string,
    queryText: string,
    patientId?: string,
    patientName?: string
): Promise<MemorySearchResult[]> {
    if (!DEFAULT_MEMORY_CONFIG.enabled) {
        return [];
    }

    if (!isFirebaseInitialized || !db) {
        return [];
    }

    try {
        // De-identify query before generating embedding
        const deidentifiedQuery = patientName
            ? deidentify(queryText, patientName)
            : queryText;

        // Generate embedding for query
        const queryEmbedding = await generateEmbedding(deidentifiedQuery);
        if (queryEmbedding.length === 0) {
            console.log('[MemoryRetrieval] Failed to generate query embedding');
            return [];
        }

        // Fetch recent episodes
        const episodesQuery = query(
            collection(db, 'jarvis_memory', doctorId, 'episodes'),
            orderBy('timestamp', 'desc'),
            limit(100)  // Limit for performance
        );

        const snapshot = await getDocs(episodesQuery);

        // Check scale warning
        checkScaleWarning(snapshot.docs.length);

        // Run lazy cleanup in background
        cleanupOldEpisodes(doctorId).catch(() => { });

        const episodes: Episode[] = snapshot.docs.map(doc => ({
            episodeId: doc.id,
            ...doc.data()
        } as Episode));

        // Optionally filter by patient (using hashed ID)
        const filtered = patientId
            ? episodes.filter(e => {
                // Simple substring match on hashed ID
                const hashPrefix = patientId.slice(0, 4).toLowerCase();
                return e.patientId.toLowerCase().includes(hashPrefix);
            })
            : episodes;

        // Compute similarities
        const results: MemorySearchResult[] = filtered
            .filter(e => e.embedding && Array.isArray(e.embedding) && e.embedding.length > 0)
            .map(episode => ({
                episode,
                similarity: cosineSimilarity(queryEmbedding, episode.embedding)
            }))
            .filter(r => r.similarity >= DEFAULT_MEMORY_CONFIG.similarityThreshold)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, DEFAULT_MEMORY_CONFIG.maxEpisodesToRetrieve);

        console.log(`[MemoryRetrieval] Found ${results.length} relevant memories`);
        return results;

    } catch (error) {
        console.error('[MemoryRetrieval] Search error:', error);
        return [];
    }
}

/**
 * Get recent episode history for a patient
 */
export async function getPatientHistory(
    doctorId: string,
    patientId: string,
    maxResults: number = 10
): Promise<Episode[]> {
    if (!isFirebaseInitialized || !db) return [];

    try {
        const snapshot = await getDocs(
            query(
                collection(db, 'jarvis_memory', doctorId, 'episodes'),
                orderBy('timestamp', 'desc'),
                limit(maxResults * 2)  // Over-fetch to filter
            )
        );

        const episodes = snapshot.docs
            .map(doc => ({
                episodeId: doc.id,
                ...doc.data()
            } as Episode))
            .filter(e => {
                // Match on hashed patient ID (partial match)
                const hashPrefix = patientId.slice(0, 4).toLowerCase();
                return e.patientId.toLowerCase().includes(hashPrefix);
            })
            .slice(0, maxResults);

        return episodes;

    } catch (error) {
        console.error('[MemoryRetrieval] History error:', error);
        return [];
    }
}

/**
 * Format episodes for injection into agent context
 */
export function formatEpisodesForContext(memories: MemorySearchResult[]): string {
    if (memories.length === 0) return '';

    const formatted = memories.map((r, i) => {
        const e = r.episode;
        const date = new Date(e.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        const confidence = (r.similarity * 100).toFixed(0);
        return `[Memory ${i + 1}] ${date}: ${e.summary.slice(0, 150)}... (${confidence}% match)`;
    }).join('\n');

    return `
--- Relevant Past Interactions ---
${formatted}
--- End Memory ---
`;
}

/**
 * Generate session ID for grouping related interactions
 */
export function generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 6);
    return `SES-${timestamp}-${random}`;
}
