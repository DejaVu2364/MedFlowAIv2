// VectorStore Adapter Interface
// Abstraction layer for future migration to dedicated vector DB

import { Episode, MemorySearchResult } from './types';
import { cosineSimilarity } from './EmbeddingService';

/**
 * VectorStore interface for pluggable implementations
 * Currently: Firestore with client-side similarity
 * Future: Pinecone, Chroma, or pgvector
 */
export interface VectorStore {
    /**
     * Insert or update a vector
     */
    upsert(
        id: string,
        embedding: number[],
        metadata: Record<string, unknown>
    ): Promise<void>;

    /**
     * Query for similar vectors
     */
    query(
        embedding: number[],
        topK: number,
        filter?: Record<string, unknown>
    ): Promise<{ id: string; score: number; metadata?: Record<string, unknown> }[]>;

    /**
     * Delete a vector
     */
    delete(id: string): Promise<void>;

    /**
     * Get count of vectors
     */
    count(): Promise<number>;
}

/**
 * Firestore-based VectorStore implementation
 * Uses client-side cosine similarity (suitable for <1000 vectors)
 */
export class FirestoreVectorStore implements VectorStore {
    private episodes: Map<string, { embedding: number[]; metadata: Record<string, unknown> }> = new Map();

    async upsert(id: string, embedding: number[], metadata: Record<string, unknown>): Promise<void> {
        this.episodes.set(id, { embedding, metadata });
    }

    async query(
        queryEmbedding: number[],
        topK: number,
        _filter?: Record<string, unknown>
    ): Promise<{ id: string; score: number; metadata?: Record<string, unknown> }[]> {
        const results: { id: string; score: number; metadata?: Record<string, unknown> }[] = [];

        this.episodes.forEach((data, id) => {
            const score = cosineSimilarity(queryEmbedding, data.embedding);
            results.push({ id, score, metadata: data.metadata });
        });

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }

    async delete(id: string): Promise<void> {
        this.episodes.delete(id);
    }

    async count(): Promise<number> {
        return this.episodes.size;
    }
}

/**
 * Pinecone VectorStore placeholder
 * Implement when episode count exceeds scale threshold
 */
export class PineconeVectorStore implements VectorStore {
    constructor(_apiKey: string, _indexName: string) {
        // TODO: Initialize Pinecone client
        console.warn('[PineconeVectorStore] Not implemented - using placeholder');
    }

    async upsert(_id: string, _embedding: number[], _metadata: Record<string, unknown>): Promise<void> {
        throw new Error('PineconeVectorStore not implemented');
    }

    async query(_embedding: number[], _topK: number): Promise<{ id: string; score: number }[]> {
        throw new Error('PineconeVectorStore not implemented');
    }

    async delete(_id: string): Promise<void> {
        throw new Error('PineconeVectorStore not implemented');
    }

    async count(): Promise<number> {
        throw new Error('PineconeVectorStore not implemented');
    }
}

/**
 * Factory function to get the appropriate VectorStore
 * Auto-selects based on episode count and available credentials
 */
export function getVectorStore(episodeCount: number = 0): VectorStore {
    const pineconeKey = import.meta.env.VITE_PINECONE_API_KEY;
    const pineconeIndex = import.meta.env.VITE_PINECONE_INDEX;

    // If Pinecone is configured and we're at scale, use it
    if (pineconeKey && pineconeIndex && episodeCount > 1000) {
        console.log('[VectorStore] Using Pinecone for scale');
        return new PineconeVectorStore(pineconeKey, pineconeIndex);
    }

    // Default to Firestore-based store
    return new FirestoreVectorStore();
}

/**
 * Scale recommendations based on episode count
 */
export function getScaleRecommendation(episodeCount: number): {
    status: 'green' | 'yellow' | 'orange' | 'red';
    message: string;
} {
    if (episodeCount < 500) {
        return { status: 'green', message: 'Current approach works well' };
    } else if (episodeCount < 800) {
        return { status: 'yellow', message: 'Monitor performance' };
    } else if (episodeCount < 1500) {
        return { status: 'orange', message: 'Consider migrating to Pinecone' };
    } else {
        return { status: 'red', message: 'Performance degraded - migrate to Pinecone' };
    }
}
