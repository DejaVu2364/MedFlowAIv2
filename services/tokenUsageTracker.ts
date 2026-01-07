// Token Usage Tracker for Gemini API
// Provides rate limiting, usage tracking, and persistence

interface TokenUsageRecord {
    timestamp: number;
    inputTokens: number;
    outputTokens: number;
    model: string;
    operation: string;
}

interface TokenUsageStats {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCalls: number;
    callsThisHour: number;
    callsToday: number;
    lastCallAt: number | null;
    history: TokenUsageRecord[];
}

const STORAGE_KEY = 'medflow_token_usage';
const MAX_HISTORY = 100;
const RATE_LIMIT_PER_MINUTE = 15; // Conservative limit for free tier

// Initialize from localStorage
const loadUsageStats = (): TokenUsageStats => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Failed to load token usage stats:', e);
    }
    return {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCalls: 0,
        callsThisHour: 0,
        callsToday: 0,
        lastCallAt: null,
        history: []
    };
};

let usageStats = loadUsageStats();

// Save to localStorage
const saveUsageStats = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(usageStats));
    } catch (e) {
        console.warn('Failed to save token usage stats:', e);
    }
};

// Cleanup old records and update hourly/daily counts
const cleanupAndUpdateCounts = () => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Filter out records older than 24h for history
    usageStats.history = usageStats.history
        .filter(r => r.timestamp > oneDayAgo)
        .slice(-MAX_HISTORY);

    // Update counts
    usageStats.callsThisHour = usageStats.history.filter(r => r.timestamp > oneHourAgo).length;
    usageStats.callsToday = usageStats.history.filter(r => r.timestamp > oneDayAgo).length;
};

// Check rate limit
export const checkRateLimit = (): { allowed: boolean; waitMs: number; reason?: string } => {
    cleanupAndUpdateCounts();

    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const recentCalls = usageStats.history.filter(r => r.timestamp > oneMinuteAgo);

    if (recentCalls.length >= RATE_LIMIT_PER_MINUTE) {
        const oldestRecent = Math.min(...recentCalls.map(r => r.timestamp));
        const waitMs = (oldestRecent + 60 * 1000) - now;
        return {
            allowed: false,
            waitMs,
            reason: `Rate limit: ${RATE_LIMIT_PER_MINUTE}/min. Wait ${Math.ceil(waitMs / 1000)}s`
        };
    }

    return { allowed: true, waitMs: 0 };
};

// Estimate tokens (rough approximation - Gemini doesn't always return token count)
const estimateTokens = (text: string): number => {
    // Rough estimate: 1 token ≈ 4 characters for English
    return Math.ceil(text.length / 4);
};

// Record a new API call
export const recordApiCall = (
    operation: string,
    model: string,
    inputText: string,
    outputText: string
) => {
    const inputTokens = estimateTokens(inputText);
    const outputTokens = estimateTokens(outputText);

    const record: TokenUsageRecord = {
        timestamp: Date.now(),
        inputTokens,
        outputTokens,
        model,
        operation
    };

    usageStats.history.push(record);
    usageStats.totalInputTokens += inputTokens;
    usageStats.totalOutputTokens += outputTokens;
    usageStats.totalCalls += 1;
    usageStats.lastCallAt = record.timestamp;

    cleanupAndUpdateCounts();
    saveUsageStats();

    // Emit custom event for UI updates
    window.dispatchEvent(new CustomEvent('tokenUsageUpdated', { detail: getUsageStats() }));
};

// Get current usage stats
export const getUsageStats = (): TokenUsageStats & { estimatedCost: number } => {
    cleanupAndUpdateCounts();

    // Gemini Flash pricing (approximate): $0.075 per 1M input tokens, $0.30 per 1M output tokens
    const inputCost = (usageStats.totalInputTokens / 1_000_000) * 0.075;
    const outputCost = (usageStats.totalOutputTokens / 1_000_000) * 0.30;

    return {
        ...usageStats,
        estimatedCost: inputCost + outputCost
    };
};

// Reset stats (for debugging)
export const resetUsageStats = () => {
    usageStats = {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCalls: 0,
        callsThisHour: 0,
        callsToday: 0,
        lastCallAt: null,
        history: []
    };
    saveUsageStats();
    window.dispatchEvent(new CustomEvent('tokenUsageUpdated', { detail: getUsageStats() }));
};

// Check if should use cache (for rate limiting)
export const shouldUseCache = (patientId: string, cacheKey: string): boolean => {
    const cached = localStorage.getItem(`overview_cache_${patientId}`);
    if (!cached) return false;

    try {
        const { timestamp, data } = JSON.parse(cached);
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        return timestamp > oneHourAgo && data;
    } catch {
        return false;
    }
};

// Get cached overview
export const getCachedOverview = (patientId: string): any | null => {
    const cached = localStorage.getItem(`overview_cache_${patientId}`);
    if (!cached) return null;

    try {
        const { timestamp, data } = JSON.parse(cached);
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        if (timestamp > oneHourAgo) return data;
    } catch {
        // ignore
    }
    return null;
};

// Set cached overview
export const setCachedOverview = (patientId: string, data: any) => {
    localStorage.setItem(`overview_cache_${patientId}`, JSON.stringify({
        timestamp: Date.now(),
        data
    }));
};
