// Unit tests for Jarvis Episodic Memory (Phase 2)

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase
vi.mock('../../services/firebase', () => ({
    db: null,
    isFirebaseInitialized: false
}));

// Mock Gemini API
vi.mock('@google/genai', () => ({
    GoogleGenAI: vi.fn().mockImplementation(() => ({
        models: {
            embedContent: vi.fn().mockResolvedValue({
                embeddings: [{ values: new Array(768).fill(0.1) }]
            })
        }
    }))
}));

import { deidentify, extractTags } from '../../services/jarvis/memory/EpisodicMemory';
import { cosineSimilarity } from '../../services/jarvis/memory/EmbeddingService';
import { getCachedEmbedding, setCachedEmbedding, clearEmbeddingCache, getCacheStats } from '../../services/jarvis/memory/EmbeddingCache';
import { formatEpisodesForContext, generateSessionId } from '../../services/jarvis/memory/MemoryRetrieval';
import { DEFAULT_MEMORY_CONFIG } from '../../services/jarvis/memory/types';

describe('De-identification', () => {
    it('should replace patient name with [PATIENT]', () => {
        const result = deidentify('Patient Gita Bhat has high fever', 'Gita Bhat');
        expect(result).toBe('Patient [PATIENT] has high fever');
    });

    it('should be case-insensitive for names', () => {
        const result = deidentify('GITA BHAT is stable', 'Gita Bhat');
        expect(result).toBe('[PATIENT] is stable');
    });

    it('should replace MRN patterns', () => {
        const result = deidentify('MRN: 12345 needs attention', 'Test');
        expect(result).toContain('[MRN]');
    });

    it('should replace phone numbers', () => {
        const result = deidentify('Call 9876543210 for updates', 'Test');
        expect(result).toBe('Call [PHONE] for updates');
    });

    it('should replace date patterns', () => {
        const result = deidentify('Admitted on 12/25/2025', 'Test');
        expect(result).toBe('Admitted on [DATE]');
    });

    it('should handle empty input', () => {
        expect(deidentify('', 'Test')).toBe('');
    });
});

describe('Tag Extraction', () => {
    it('should extract medical tags from text', () => {
        const tags = extractTags('Patient has sepsis with high fever and needs CBC');
        expect(tags).toContain('sepsis');
        expect(tags).toContain('fever');
        expect(tags).toContain('cbc');
    });

    it('should handle empty input', () => {
        expect(extractTags('')).toEqual([]);
    });

    it('should be case-insensitive', () => {
        const tags = extractTags('SEPSIS and FEVER detected');
        expect(tags).toContain('sepsis');
        expect(tags).toContain('fever');
    });
});

describe('Cosine Similarity', () => {
    it('should return 1 for identical vectors', () => {
        const a = [1, 0, 0];
        const b = [1, 0, 0];
        expect(cosineSimilarity(a, b)).toBe(1);
    });

    it('should return 0 for orthogonal vectors', () => {
        const a = [1, 0, 0];
        const b = [0, 1, 0];
        expect(cosineSimilarity(a, b)).toBe(0);
    });

    it('should return -1 for opposite vectors', () => {
        const a = [1, 0, 0];
        const b = [-1, 0, 0];
        expect(cosineSimilarity(a, b)).toBe(-1);
    });

    it('should handle empty vectors', () => {
        expect(cosineSimilarity([], [])).toBe(0);
    });

    it('should handle mismatched lengths', () => {
        expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
    });
});

describe('Embedding Cache', () => {
    beforeEach(() => {
        clearEmbeddingCache();
    });

    it('should cache embeddings', () => {
        const embedding = [0.1, 0.2, 0.3];
        setCachedEmbedding('test query', embedding);

        const cached = getCachedEmbedding('test query');
        expect(cached).toEqual(embedding);
    });

    it('should return null for uncached queries', () => {
        const cached = getCachedEmbedding('unknown query');
        expect(cached).toBeNull();
    });

    it('should track cache size', () => {
        setCachedEmbedding('query1', [1]);
        setCachedEmbedding('query2', [2]);

        const stats = getCacheStats();
        expect(stats.size).toBe(2);
    });
});

describe('Memory Context Formatting', () => {
    it('should format episodes for context injection', () => {
        const memories = [
            {
                episode: {
                    episodeId: 'EP-1',
                    patientId: 'PH-123',
                    patientName: 'Test',
                    doctorId: 'doc-1',
                    timestamp: '2025-01-10T10:00:00Z',
                    sessionId: 'SES-1',
                    summary: 'Discussed fever management',
                    userQuery: 'What about fever?',
                    jarvisResponse: 'Consider antipyretics',
                    toolsUsed: ['get_patient_summary'],
                    embedding: [],
                    tags: ['fever'],
                    confidence: 0.8
                },
                similarity: 0.85
            }
        ];

        const context = formatEpisodesForContext(memories);
        expect(context).toContain('Relevant Past Interactions');
        expect(context).toContain('85%');
    });

    it('should return empty string for no memories', () => {
        expect(formatEpisodesForContext([])).toBe('');
    });
});

describe('Session ID Generation', () => {
    it('should generate unique session IDs', () => {
        const id1 = generateSessionId();
        const id2 = generateSessionId();

        expect(id1).not.toBe(id2);
        expect(id1).toMatch(/^SES-/);
    });
});

describe('Memory Config', () => {
    it('should have reasonable defaults', () => {
        expect(DEFAULT_MEMORY_CONFIG.maxEpisodesToRetrieve).toBeLessThanOrEqual(10);
        expect(DEFAULT_MEMORY_CONFIG.similarityThreshold).toBeGreaterThan(0);
        expect(DEFAULT_MEMORY_CONFIG.retentionDays).toBe(90);
    });
});
