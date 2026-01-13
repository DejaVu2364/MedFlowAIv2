// Memory Configuration
// Centralized settings for the Episodic Memory module

export const MEMORY_SETTINGS = {
    // Feature flag
    enabled: import.meta.env.VITE_JARVIS_MEMORY_ENABLED !== 'false',

    // Embedding configuration
    embeddingModel: import.meta.env.VITE_EMBEDDING_MODEL || 'text-embedding-004',
    embeddingDimension: 768,

    // Cache settings
    cacheSize: 100,
    cacheTTL: 60 * 60 * 1000, // 1 hour

    // Retrieval settings
    maxEpisodesToRetrieve: 5,
    similarityThreshold: 0.65,

    // Retention (HIPAA compliance)
    retentionDays: 90,

    // Scale thresholds
    scaleWarningThreshold: 800,
    scaleCriticalThreshold: 1500,
};

// Re-export for backwards compatibility
export const DEFAULT_MEMORY_CONFIG = {
    enabled: MEMORY_SETTINGS.enabled,
    maxEpisodesToRetrieve: MEMORY_SETTINGS.maxEpisodesToRetrieve,
    similarityThreshold: MEMORY_SETTINGS.similarityThreshold,
    retentionDays: MEMORY_SETTINGS.retentionDays,
};
