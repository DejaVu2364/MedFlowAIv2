
// Phase 3: Simple In-Memory Cache for the current session
// In a production app, this could be backed by localStorage or sessionStorage
// with a proper eviction policy (like LRU). For this demo, a Map is sufficient.

const cache = new Map<string, { data: any, timestamp: number }>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Retrieves an item from the cache.
 * @param key The cache key.
 * @returns The cached data or null if not found or expired.
 */
export const getFromCache = <T>(key: string): T | null => {
    const entry = cache.get(key);
    if (!entry) {
        return null;
    }

    const isExpired = (Date.now() - entry.timestamp) > CACHE_TTL_MS;
    if (isExpired) {
        cache.delete(key);
        return null;
    }

    return entry.data as T;
};

/**
 * Adds an item to the cache.
 * @param key The cache key.
 * @param data The data to store.
 */
export const setInCache = <T>(key: string, data: T): void => {
    cache.set(key, { data, timestamp: Date.now() });
};
