// Episodic Memory Types
// Phase 2: Memory persistence for Jarvis

export interface Episode {
    episodeId: string;           // UUID: `EP-{timestamp}-{random}`
    patientId: string;           // Hashed for privacy
    patientName: string;         // Display only (NOT in embedding)
    doctorId: string;
    timestamp: string;           // ISO 8601
    sessionId: string;           // Groups related turns
    summary: string;             // Human-readable summary
    userQuery: string;           // Doctor's original question
    jarvisResponse: string;      // What Jarvis said
    toolsUsed: string[];         // Tools used in response
    outcome?: 'accepted' | 'rejected' | 'modified' | 'none';
    embedding: number[];         // 768-dim vector
    tags: string[];              // Medical tags for filtering
    confidence: number;          // 0-1 from agent response
}

export interface MemorySearchResult {
    episode: Episode;
    similarity: number;  // 0-1, cosine similarity
}

export interface MemoryConfig {
    enabled: boolean;
    maxEpisodesToRetrieve: number;
    similarityThreshold: number;  // Only return if similarity > threshold
    retentionDays: number;        // Auto-delete after N days (HIPAA)
}

export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
    enabled: import.meta.env.VITE_JARVIS_MEMORY_ENABLED !== 'false',
    maxEpisodesToRetrieve: 5,
    similarityThreshold: 0.65,
    retentionDays: 90,  // 3 months
};
