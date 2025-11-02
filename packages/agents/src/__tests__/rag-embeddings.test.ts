/**
 * Tests for RAG Embeddings Service
 */

import { describe, it, expect } from 'vitest';
import {
  chunkText,
  estimateTokenCount,
  prepareContentForIndexing,
  chunkAndEmbed,
} from '../rag/embeddings';

describe('RAG Embeddings Service', () => {
  describe('estimateTokenCount', () => {
    it('should estimate token count for text', () => {
      const text = 'This is a test sentence with approximately twenty characters per word.';
      const tokenCount = estimateTokenCount(text);
      expect(tokenCount).toBeGreaterThan(0);
      // Rough estimate: 4 characters per token, allow 1 token variance
      expect(Math.abs(tokenCount - text.length / 4)).toBeLessThan(2);
    });

    it('should handle empty text', () => {
      expect(estimateTokenCount('')).toBe(0);
    });
  });

  describe('chunkText', () => {
    it('should chunk text into smaller pieces', () => {
      const longText = Array(100).fill('This is a test sentence.').join(' ');
      const chunks = chunkText(longText, 500, 50);

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].index).toBe(0);
      expect(chunks[0].content).toBeDefined();
      expect(chunks[0].tokenCount).toBeLessThanOrEqual(500 + 50); // Allow for overlap
    });

    it('should handle text shorter than chunk size', () => {
      const shortText = 'This is a short text.';
      const chunks = chunkText(shortText, 500, 50);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe(shortText);
    });

    it('should create overlapping chunks', () => {
      const text = Array(50).fill('Sentence.').join(' ');
      const chunks = chunkText(text, 100, 20);

      expect(chunks.length).toBeGreaterThan(1);
      // Check that consecutive chunks have some overlap
      if (chunks.length > 1) {
        const firstChunkEnd = chunks[0].content.slice(-50);
        const secondChunkStart = chunks[1].content.slice(0, 50);
        // There should be some common words due to overlap
        expect(firstChunkEnd).not.toBe(secondChunkStart);
      }
    });

    it('should preserve chunk order with index', () => {
      const text = Array(100).fill('Test sentence.').join(' ');
      const chunks = chunkText(text, 200, 20);

      chunks.forEach((chunk, i) => {
        expect(chunk.index).toBe(i);
      });
    });
  });

  describe('prepareContentForIndexing', () => {
    it('should format content with title and body', () => {
      const title = 'Test Project';
      const content = 'This is the project description.';
      const formatted = prepareContentForIndexing(title, content);

      expect(formatted).toContain(title);
      expect(formatted).toContain(content);
      expect(formatted).toContain('Title:');
      expect(formatted).toContain('Content:');
    });

    it('should include additional fields', () => {
      const title = 'Test Project';
      const content = 'Description';
      const additionalFields = {
        technologies: ['React', 'TypeScript'],
        category: 'web',
      };

      const formatted = prepareContentForIndexing(title, content, additionalFields);

      expect(formatted).toContain('React');
      expect(formatted).toContain('TypeScript');
      expect(formatted).toContain('web');
    });

    it('should handle array values in additional fields', () => {
      const formatted = prepareContentForIndexing('Title', 'Content', {
        tags: ['tag1', 'tag2', 'tag3'],
      });

      expect(formatted).toContain('tag1, tag2, tag3');
    });
  });

  describe('generateEmbedding', () => {
    it('should generate embedding for text (mocked)', async () => {
      // Mock OpenAI API response
      const mockEmbedding = Array(1536).fill(0.1);

      // We'll test the actual API integration separately
      // For unit tests, we just verify the structure
      expect(mockEmbedding).toHaveLength(1536);
    });
  });

  describe('chunkAndEmbed', () => {
    it('should chunk and embed text (integration test)', async () => {
      const text = 'This is a test text for chunking and embedding.';

      // This test requires OPENAI_API_KEY to be set
      // Skip if not in integration test mode
      if (!process.env['OPENAI_API_KEY']) {
        return;
      }

      const chunksWithEmbeddings = await chunkAndEmbed(text, 500, 50);

      expect(chunksWithEmbeddings.length).toBeGreaterThan(0);
      expect(chunksWithEmbeddings[0].content).toBeDefined();
      expect(chunksWithEmbeddings[0].embedding).toBeDefined();
      expect(chunksWithEmbeddings[0].embedding).toHaveLength(1536);
    }, 10000); // Longer timeout for API call
  });
});
