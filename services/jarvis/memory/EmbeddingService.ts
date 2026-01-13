// Embedding Service
// Generates text embeddings using Google's text-embedding-004 model

import { GoogleGenAI } from '@google/genai';
import { getCachedEmbedding, setCachedEmbedding } from './EmbeddingCache';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const EMBEDDING_MODEL = 'text-embedding-004';

/**
 * Generate embedding for text using Google's embedding model
 * Uses cache to reduce API calls for repeated queries
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
        return [];
    }

    // Normalize text for better cache hits
    const normalizedText = text.trim().toLowerCase().slice(0, 2000);

    // Check cache first
    const cached = getCachedEmbedding(normalizedText);
    if (cached) {
        return cached;
    }

    // API key check
    if (!API_KEY || API_KEY === 'mock-key') {
        console.warn('[EmbeddingService] No API key, returning empty embedding');
        return [];
    }

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const result = await ai.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: [{ role: 'user', parts: [{ text: normalizedText }] }],
        });

        const embedding = result.embeddings?.[0]?.values || [];

        // Cache the result
        if (embedding.length > 0) {
            setCachedEmbedding(normalizedText, embedding);
        }

        return embedding;

    } catch (error) {
        console.error('[EmbeddingService] Error generating embedding:', error);
        return [];
    }
}

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
}
