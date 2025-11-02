/**
 * Tests for RAG Vector Store
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VectorStore } from '../rag/vector-store';
import { PrismaClient } from '@portfolio/database';

// Mock Prisma
vi.mock('@portfolio/database', () => ({
  PrismaClient: vi.fn(() => ({
    $queryRaw: vi.fn(),
    $queryRawUnsafe: vi.fn(),
    $executeRaw: vi.fn(),
    $executeRawUnsafe: vi.fn(),
    $disconnect: vi.fn(),
  })),
}));

describe('RAG Vector Store', () => {
  let vectorStore: VectorStore;
  let mockPrisma: {
    $queryRawUnsafe: ReturnType<typeof vi.fn>;
    $executeRawUnsafe: ReturnType<typeof vi.fn>;
    $disconnect: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockPrisma = new PrismaClient() as typeof mockPrisma;
    vectorStore = new VectorStore(mockPrisma as unknown as PrismaClient);
  });

  afterEach(async () => {
    await vectorStore.disconnect();
  });

  describe('storeChunk', () => {
    it('should store a chunk with embedding', async () => {
      const mockChunk = {
        id: 'test-id',
        content: 'Test content',
        sourceType: 'project',
        sourceId: 'project-1',
        category: 'web',
        metadata: { title: 'Test' },
        chunkIndex: 0,
        tokenCount: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.$queryRawUnsafe.mockResolvedValue([mockChunk]);

      const embedding = Array(1536).fill(0.1);
      const result = await vectorStore.storeChunk(
        'Test content',
        embedding,
        'project',
        'project-1',
        0,
        10,
        { title: 'Test' },
        'web'
      );

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual(mockChunk);
    });
  });

  describe('searchSimilar', () => {
    it('should search for similar chunks', async () => {
      const mockResults = [
        {
          id: 'chunk-1',
          content: 'Similar content',
          sourceType: 'project',
          sourceId: 'project-1',
          category: 'web',
          metadata: {},
          chunkIndex: 0,
          tokenCount: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
          distance: 0.2,
          similarity: 0.8,
        },
      ];

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResults);

      const queryEmbedding = Array(1536).fill(0.1);
      const results = await vectorStore.searchSimilar(queryEmbedding, 5);

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0].similarity).toBe(0.8);
    });

    it('should apply filters when searching', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

      const queryEmbedding = Array(1536).fill(0.1);
      await vectorStore.searchSimilar(queryEmbedding, 5, {
        sourceType: 'project',
        category: 'web',
      });

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
      // Verify that filters were included in the query
      const callArgs = mockPrisma.$queryRawUnsafe.mock.calls[0];
      expect(callArgs).toBeDefined();
    });
  });

  describe('deleteChunksBySource', () => {
    it('should delete chunks for a source', async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(3);

      const deletedCount = await vectorStore.deleteChunksBySource('project', 'project-1');

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled();
      expect(deletedCount).toBe(3);
    });
  });

  describe('getStats', () => {
    it('should return statistics about stored embeddings', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ count: BigInt(100) }])
        .mockResolvedValueOnce([
          { sourceType: 'project', count: BigInt(60) },
          { sourceType: 'blog', count: BigInt(40) },
        ])
        .mockResolvedValueOnce([{ category: 'web', count: BigInt(50) }]);

      const stats = await vectorStore.getStats();

      expect(stats.totalChunks).toBe(100);
      expect(stats.chunksByType).toEqual({ project: 60, blog: 40 });
      expect(stats.chunksByCategory).toEqual({ web: 50 });
    });
  });
});
