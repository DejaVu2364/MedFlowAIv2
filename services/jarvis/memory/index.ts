// Jarvis Episodic Memory Module
// Phase 2: Persistent memory for Jarvis Super Agent

// Type exports
export type { Episode, MemorySearchResult, MemoryConfig } from './types';
export type { VectorStore } from './VectorStoreAdapter';

// Config exports
export { MEMORY_SETTINGS, DEFAULT_MEMORY_CONFIG } from './config';

// Service exports
export { generateEmbedding, cosineSimilarity } from './EmbeddingService';
export { getCachedEmbedding, setCachedEmbedding, clearEmbeddingCache, getCacheStats } from './EmbeddingCache';
export { saveEpisode, updateEpisodeOutcome, cleanupOldEpisodes, deidentify, extractTags } from './EpisodicMemory';
export { searchMemory, getPatientHistory, formatEpisodesForContext, generateSessionId } from './MemoryRetrieval';
export { FirestoreVectorStore, getVectorStore, getScaleRecommendation } from './VectorStoreAdapter';
