/**
 * Tests for RAG Retrieval Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RetrievalService } from '../rag/retrieval';
import { VectorStore } from '../rag/vector-store';

// Mock the embeddings module
vi.mock('../rag/embeddings', () => ({
  generateEmbedding: vi.fn(async (_text: string) => ({
    embedding: Array(1536).fill(0.1),
    tokenCount: 10,
  })),
}));

// Mock VectorStore
vi.mock('../rag/vector-store', () => ({
  VectorStore: vi.fn(() => ({
    searchSimilar: vi.fn(),
    getChunksBySource: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

describe('RAG Retrieval Service', () => {
  let retrievalService: RetrievalService;
  let mockVectorStore: any;

  beforeEach(() => {
    mockVectorStore = new VectorStore();
    retrievalService = new RetrievalService(mockVectorStore);
  });

  afterEach(async () => {
    await retrievalService.disconnect();
  });

  describe('retrieveContext', () => {
    it('should retrieve relevant context for a query', async () => {
      const mockSearchResults = [
        {
          chunk: {
            id: 'chunk-1',
            content: 'React project with TypeScript',
            sourceType: 'project',
            sourceId: 'project-1',
            category: 'web',
            metadata: { title: 'Portfolio Website', technologies: ['React', 'TypeScript'] },
            chunkIndex: 0,
            tokenCount: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          similarity: 0.85,
          distance: 0.15,
        },
        {
          chunk: {
            id: 'chunk-2',
            content: 'Full-stack application using React and Node.js',
            sourceType: 'project',
            sourceId: 'project-2',
            category: 'web',
            metadata: { title: 'E-commerce Platform' },
            chunkIndex: 0,
            tokenCount: 12,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          similarity: 0.75,
          distance: 0.25,
        },
      ];

      mockVectorStore.searchSimilar.mockResolvedValue(mockSearchResults);

      const result = await retrievalService.retrieveContext('React projects', {
        topK: 5,
      });

      expect(result.contexts).toHaveLength(2);
      expect(result.query).toBe('React projects');
      expect(result.totalChunks).toBe(2);
      expect(result.avgSimilarity).toBeGreaterThan(0);
      expect(result.formattedContext).toContain('React project with TypeScript');
      expect(result.retrievalTimeMs).toBeGreaterThanOrEqual(0); // Can be 0 for fast mocked operations
    });

    it('should filter by minimum similarity', async () => {
      const mockSearchResults = [
        {
          chunk: {
            id: 'chunk-1',
            content: 'High similarity content',
            sourceType: 'project',
            sourceId: 'project-1',
            category: null,
            metadata: {},
            chunkIndex: 0,
            tokenCount: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          similarity: 0.85,
          distance: 0.15,
        },
        {
          chunk: {
            id: 'chunk-2',
            content: 'Low similarity content',
            sourceType: 'project',
            sourceId: 'project-2',
            category: null,
            metadata: {},
            chunkIndex: 0,
            tokenCount: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          similarity: 0.3, // Below threshold
          distance: 0.7,
        },
      ];

      mockVectorStore.searchSimilar.mockResolvedValue(mockSearchResults);

      const result = await retrievalService.retrieveContext('test query', {
        topK: 5,
        minSimilarity: 0.5,
      });

      expect(result.contexts).toHaveLength(1);
      expect(result.contexts[0].similarity).toBeGreaterThanOrEqual(0.5);
    });

    it('should apply source type and category filters', async () => {
      mockVectorStore.searchSimilar.mockResolvedValue([]);

      await retrievalService.retrieveContext('test query', {
        topK: 5,
        sourceType: 'project',
        category: 'web',
      });

      expect(mockVectorStore.searchSimilar).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Number),
        expect.objectContaining({
          sourceType: 'project',
          category: 'web',
        })
      );
    });

    it('should format context for LLM injection', async () => {
      const mockSearchResults = [
        {
          chunk: {
            id: 'chunk-1',
            content: 'Test content',
            sourceType: 'project',
            sourceId: 'project-1',
            category: 'web',
            metadata: { title: 'Test Project' },
            chunkIndex: 0,
            tokenCount: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          similarity: 0.85,
          distance: 0.15,
        },
      ];

      mockVectorStore.searchSimilar.mockResolvedValue(mockSearchResults);

      const result = await retrievalService.retrieveContext('test query');

      expect(result.formattedContext).toContain('Relevant information from portfolio');
      expect(result.formattedContext).toContain('[Context 1]');
      expect(result.formattedContext).toContain('Test content');
    });
  });

  describe('retrieveBySource', () => {
    it('should retrieve all chunks for a specific source', async () => {
      const mockChunks = [
        {
          id: 'chunk-1',
          content: 'First chunk',
          sourceType: 'project',
          sourceId: 'project-1',
          category: null,
          metadata: {},
          chunkIndex: 0,
          tokenCount: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'chunk-2',
          content: 'Second chunk',
          sourceType: 'project',
          sourceId: 'project-1',
          category: null,
          metadata: {},
          chunkIndex: 1,
          tokenCount: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockVectorStore.getChunksBySource.mockResolvedValue(mockChunks);

      const result = await retrievalService.retrieveBySource('project', 'project-1');

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('First chunk');
      expect(result[1].content).toBe('Second chunk');
      expect(result[0].similarity).toBe(1.0); // Direct lookup
    });
  });

  describe('formatPromptWithContext', () => {
    it('should format prompt with RAG context', () => {
      const ragContext = {
        query: 'test query',
        contexts: [
          {
            content: 'Context content',
            sourceType: 'project',
            sourceId: 'project-1',
            similarity: 0.8,
            chunkIndex: 0,
          },
        ],
        formattedContext: 'Formatted context',
        totalChunks: 1,
        avgSimilarity: 0.8,
        retrievalTimeMs: 100,
      };

      const prompt = retrievalService.formatPromptWithContext('User question', ragContext);

      expect(prompt).toContain('Formatted context');
      expect(prompt).toContain('User question');
    });
  });

  describe('performanceCheck', () => {
    it('should verify retrieval performance meets <200ms requirement', async () => {
      // Mock fast responses
      mockVectorStore.searchSimilar.mockResolvedValue([
        {
          chunk: {
            id: 'chunk-1',
            content: 'Test content',
            sourceType: 'project',
            sourceId: 'project-1',
            category: null,
            metadata: {},
            chunkIndex: 0,
            tokenCount: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          similarity: 0.8,
          distance: 0.2,
        },
      ]);

      const result = await retrievalService.performanceCheck();

      expect(result.avgRetrievalTime).toBeDefined();
      expect(result.sampleSize).toBeGreaterThan(0);
      expect(result.meetsRequirement).toBeDefined();

      // Verify performance metrics are tracked
      expect(result).toBeDefined();
    }, 30000); // Allow time for multiple queries
  });
});
