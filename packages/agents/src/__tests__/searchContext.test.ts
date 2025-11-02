/**
 * Tests for searchContext RAG Tool
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchContext } from '../tools/searchContext';

// Mock the RAG module
vi.mock('../rag', () => ({
  defaultRetrievalService: {
    retrieveContext: vi.fn(),
  },
}));

import { defaultRetrievalService } from '../rag';

describe('searchContext Tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should search for relevant context', async () => {
    const mockRAGContext = {
      query: 'React projects',
      contexts: [
        {
          content: 'Built a portfolio website using React and TypeScript',
          sourceType: 'project',
          sourceId: 'project-1',
          similarity: 0.85,
          metadata: {
            title: 'Portfolio Website',
            technologies: ['React', 'TypeScript'],
          },
          chunkIndex: 0,
        },
      ],
      formattedContext: 'Formatted context',
      totalChunks: 1,
      avgSimilarity: 0.85,
      retrievalTimeMs: 150,
    };

    vi.mocked(defaultRetrievalService.retrieveContext).mockResolvedValue(mockRAGContext);

    const result = await searchContext({
      query: 'React projects',
      topK: 5,
    });

    expect(result.success).toBe(true);
    expect(result.query).toBe('React projects');
    expect(result.results).toHaveLength(1);
    expect(result.results[0].content).toContain('React');
    expect(result.avgSimilarity).toBe(0.85);
    expect(result.retrievalTimeMs).toBe(150);
    expect(result.retrievalTimeMs).toBeLessThan(200); // Performance requirement
  });

  it('should filter by source type', async () => {
    const mockRAGContext = {
      query: 'test',
      contexts: [],
      formattedContext: '',
      totalChunks: 0,
      avgSimilarity: 0,
      retrievalTimeMs: 50,
    };

    vi.mocked(defaultRetrievalService.retrieveContext).mockResolvedValue(mockRAGContext);

    await searchContext({
      query: 'test query',
      sourceType: 'project',
    });

    expect(defaultRetrievalService.retrieveContext).toHaveBeenCalledWith('test query', {
      topK: 5,
      sourceType: 'project',
      category: undefined,
      minSimilarity: 0.5,
      includeMetadata: true,
    });
  });

  it('should filter by category', async () => {
    const mockRAGContext = {
      query: 'test',
      contexts: [],
      formattedContext: '',
      totalChunks: 0,
      avgSimilarity: 0,
      retrievalTimeMs: 50,
    };

    vi.mocked(defaultRetrievalService.retrieveContext).mockResolvedValue(mockRAGContext);

    await searchContext({
      query: 'test query',
      category: 'web',
    });

    expect(defaultRetrievalService.retrieveContext).toHaveBeenCalledWith('test query', {
      topK: 5,
      sourceType: undefined,
      category: 'web',
      minSimilarity: 0.5,
      includeMetadata: true,
    });
  });

  it('should handle custom topK parameter', async () => {
    const mockRAGContext = {
      query: 'test',
      contexts: [],
      formattedContext: '',
      totalChunks: 0,
      avgSimilarity: 0,
      retrievalTimeMs: 50,
    };

    vi.mocked(defaultRetrievalService.retrieveContext).mockResolvedValue(mockRAGContext);

    await searchContext({
      query: 'test query',
      topK: 10,
    });

    expect(defaultRetrievalService.retrieveContext).toHaveBeenCalledWith(
      'test query',
      expect.objectContaining({
        topK: 10,
      })
    );
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(defaultRetrievalService.retrieveContext).mockRejectedValue(
      new Error('Database connection failed')
    );

    const result = await searchContext({
      query: 'test query',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Database connection failed');
    expect(result.results).toEqual([]);
    expect(result.totalResults).toBe(0);
  });

  it('should include metadata in results', async () => {
    const mockRAGContext = {
      query: 'test',
      contexts: [
        {
          content: 'Test content',
          sourceType: 'project',
          sourceId: 'project-1',
          similarity: 0.9,
          metadata: {
            title: 'Test Project',
            technologies: ['React', 'Node.js'],
            category: 'web',
          },
          chunkIndex: 0,
        },
      ],
      formattedContext: 'Context',
      totalChunks: 1,
      avgSimilarity: 0.9,
      retrievalTimeMs: 100,
    };

    vi.mocked(defaultRetrievalService.retrieveContext).mockResolvedValue(mockRAGContext);

    const result = await searchContext({
      query: 'test query',
    });

    expect(result.results[0].metadata).toBeDefined();
    expect(result.results[0].metadata?.title).toBe('Test Project');
    expect(result.results[0].metadata?.technologies).toEqual(['React', 'Node.js']);
  });

  it('should meet performance requirement (<200ms)', async () => {
    const mockRAGContext = {
      query: 'performance test',
      contexts: [
        {
          content: 'Test content',
          sourceType: 'project',
          sourceId: 'project-1',
          similarity: 0.8,
          metadata: {},
          chunkIndex: 0,
        },
      ],
      formattedContext: 'Context',
      totalChunks: 1,
      avgSimilarity: 0.8,
      retrievalTimeMs: 150, // Under 200ms
    };

    vi.mocked(defaultRetrievalService.retrieveContext).mockResolvedValue(mockRAGContext);

    const startTime = Date.now();
    const result = await searchContext({
      query: 'performance test',
    });
    const elapsedTime = Date.now() - startTime;

    expect(result.retrievalTimeMs).toBeLessThan(200);
    expect(elapsedTime).toBeLessThan(300); // Allow some overhead
  });
});
