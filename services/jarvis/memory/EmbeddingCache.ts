// Embedding Cache
// LRU cache for embeddings to reduce API calls and latency

const CACHE_SIZE = 100;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
    embedding: number[];
    timestamp: number;
}

// Simple hash for cache key
function hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash = hash & hash;
    }
    return hash.toString(16);
}

const cache = new Map<string, CacheEntry>();

/**
 * Get cached embedding if exists and not expired
 */
export function getCachedEmbedding(text: string): number[] | null {
    const key = hashText(text);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        console.log('[EmbeddingCache] Cache hit');
        return cached.embedding;
    }

    // Clean up expired entry
    if (cached) {
        cache.delete(key);
    }

    return null;
}

/**
 * Store embedding in cache with LRU eviction
 */
export function setCachedEmbedding(text: string, embedding: number[]): void {
    const key = hashText(text);

    // LRU eviction - remove oldest if at capacity
    if (cache.size >= CACHE_SIZE) {
        const oldest = cache.keys().next().value;
        if (oldest) {
            cache.delete(oldest);
        }
    }

    cache.set(key, { embedding, timestamp: Date.now() });
}

/**
 * Clear the cache
 */
export function clearEmbeddingCache(): void {
    cache.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; maxSize: number } {
    return { size: cache.size, maxSize: CACHE_SIZE };
}
