/**
 * Vector Store Service
 *
 * Handles database operations for vector embeddings using PostgreSQL with pgvector.
 * Based on TECHNICAL_DOCUMENTATION.md Section 3.7.1
 *
 * Features:
 * - Store and retrieve embeddings in PostgreSQL
 * - Vector similarity search using pgvector
 * - Metadata filtering for precise retrieval
 * - Batch operations for efficiency
 */

import { PrismaClient } from '@portfolio/database';
import { logger } from '../lib/logger';
import type { ChunkWithEmbedding } from './embeddings';

export interface ContentMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  technologies?: string[];
  category?: string;
  [key: string]: unknown;
}

export interface StoredChunk {
  id: string;
  content: string;
  sourceType: string;
  sourceId: string;
  category: string | null;
  metadata: ContentMetadata;
  chunkIndex: number;
  tokenCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  chunk: StoredChunk;
  similarity: number;
  distance: number;
}

export class VectorStore {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Store a single chunk with its embedding
   */
  async storeChunk(
    content: string,
    embedding: number[],
    sourceType: string,
    sourceId: string,
    chunkIndex: number,
    tokenCount: number,
    metadata?: ContentMetadata,
    category?: string
  ): Promise<StoredChunk> {
    try {
      // Format embedding as PostgreSQL vector literal
      const embeddingStr = `[${embedding.join(',')}]`;

      const query = `
        INSERT INTO "ContentChunk" (
          id, content, embedding, "sourceType", "sourceId", category,
          metadata, "chunkIndex", "tokenCount", "createdAt", "updatedAt"
        )
        VALUES (
          gen_random_uuid()::text,
          $1,
          $2::vector,
          $3,
          $4,
          $5,
          $6::jsonb,
          $7,
          $8,
          NOW(),
          NOW()
        )
        RETURNING *
      `;

      const chunks = await this.prisma.$queryRawUnsafe<StoredChunk[]>(
        query,
        content,
        embeddingStr,
        sourceType,
        sourceId,
        category || null,
        JSON.stringify(metadata || {}),
        chunkIndex,
        tokenCount
      );

      logger.debug('Chunk stored successfully', {
        sourceType,
        sourceId,
        chunkIndex,
        tokenCount,
      });

      return chunks[0];
    } catch (error) {
      logger.error('Failed to store chunk', { error, sourceType, sourceId });
      throw new Error(
        `Failed to store chunk: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Store multiple chunks in batch
   */
  async storeChunksBatch(
    chunks: ChunkWithEmbedding[],
    sourceType: string,
    sourceId: string,
    metadata?: ContentMetadata,
    category?: string
  ): Promise<StoredChunk[]> {
    const storedChunks: StoredChunk[] = [];

    for (const chunk of chunks) {
      const stored = await this.storeChunk(
        chunk.content,
        chunk.embedding,
        sourceType,
        sourceId,
        chunk.index,
        chunk.tokenCount,
        metadata,
        category
      );
      storedChunks.push(stored);
    }

    logger.info('Chunks stored in batch', {
      sourceType,
      sourceId,
      chunkCount: chunks.length,
    });

    return storedChunks;
  }

  /**
   * Search for similar chunks using cosine similarity
   *
   * @param queryEmbedding - Query embedding vector
   * @param topK - Number of results to return (default: 5)
   * @param filters - Optional filters for sourceType, category, etc.
   * @returns Array of search results with similarity scores
   */
  async searchSimilar(
    queryEmbedding: number[],
    topK: number = 5,
    filters?: {
      sourceType?: string;
      category?: string;
      sourceId?: string;
    }
  ): Promise<SearchResult[]> {
    try {
      const embeddingStr = `[${queryEmbedding.join(',')}]`;

      // Build WHERE clause based on filters
      const conditions: string[] = [];
      const params: (string | number)[] = [embeddingStr, embeddingStr, embeddingStr, topK];
      let paramIndex = 5;

      if (filters?.sourceType) {
        conditions.push(`"sourceType" = $${paramIndex}`);
        params.push(filters.sourceType);
        paramIndex++;
      }
      if (filters?.category) {
        conditions.push(`category = $${paramIndex}`);
        params.push(filters.category);
        paramIndex++;
      }
      if (filters?.sourceId) {
        conditions.push(`"sourceId" = $${paramIndex}`);
        params.push(filters.sourceId);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Perform vector similarity search using cosine distance
      // Note: 1 - (embedding <=> query) gives cosine similarity
      const query = `
        SELECT
          id,
          content,
          "sourceType",
          "sourceId",
          category,
          metadata,
          "chunkIndex",
          "tokenCount",
          "createdAt",
          "updatedAt",
          (embedding <=> $1::vector) as distance,
          (1 - (embedding <=> $2::vector)) as similarity
        FROM "ContentChunk"
        ${whereClause}
        ORDER BY embedding <=> $3::vector
        LIMIT $4
      `;

      const results = await this.prisma.$queryRawUnsafe<
        Array<{
          id: string;
          content: string;
          sourceType: string;
          sourceId: string;
          category: string | null;
          metadata: ContentMetadata;
          chunkIndex: number;
          tokenCount: number;
          createdAt: Date;
          updatedAt: Date;
          distance: number;
          similarity: number;
        }>
      >(query, ...params);

      const searchResults = results.map((row) => ({
        chunk: {
          id: row.id,
          content: row.content,
          sourceType: row.sourceType,
          sourceId: row.sourceId,
          category: row.category,
          metadata: row.metadata,
          chunkIndex: row.chunkIndex,
          tokenCount: row.tokenCount,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
        similarity: row.similarity,
        distance: row.distance,
      }));

      logger.info('Vector search completed', {
        topK,
        filters,
        resultsCount: searchResults.length,
        avgSimilarity:
          searchResults.length > 0
            ? searchResults.reduce((sum: number, r) => sum + r.similarity, 0) / searchResults.length
            : 0,
      });

      return searchResults;
    } catch (error) {
      logger.error('Vector search failed', { error, filters });
      throw new Error(
        `Vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete all chunks for a specific source
   */
  async deleteChunksBySource(sourceType: string, sourceId: string): Promise<number> {
    try {
      const result = await this.prisma.$executeRawUnsafe(
        `DELETE FROM "ContentChunk" WHERE "sourceType" = $1 AND "sourceId" = $2`,
        sourceType,
        sourceId
      );

      logger.info('Chunks deleted', { sourceType, sourceId, deletedCount: result });
      return result as number;
    } catch (error) {
      logger.error('Failed to delete chunks', { error, sourceType, sourceId });
      throw new Error(
        `Failed to delete chunks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update embeddings for a source (delete old, insert new)
   */
  async updateSourceEmbeddings(
    sourceType: string,
    sourceId: string,
    chunks: ChunkWithEmbedding[],
    metadata?: ContentMetadata,
    category?: string
  ): Promise<StoredChunk[]> {
    // Delete existing chunks
    await this.deleteChunksBySource(sourceType, sourceId);

    // Store new chunks
    return this.storeChunksBatch(chunks, sourceType, sourceId, metadata, category);
  }

  /**
   * Get all chunks for a specific source
   */
  async getChunksBySource(sourceType: string, sourceId: string): Promise<StoredChunk[]> {
    try {
      const chunks = await this.prisma.$queryRawUnsafe<StoredChunk[]>(
        `SELECT * FROM "ContentChunk" WHERE "sourceType" = $1 AND "sourceId" = $2 ORDER BY "chunkIndex" ASC`,
        sourceType,
        sourceId
      );

      return chunks;
    } catch (error) {
      logger.error('Failed to get chunks by source', { error, sourceType, sourceId });
      throw new Error(
        `Failed to get chunks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get statistics about stored embeddings
   */
  async getStats(): Promise<{
    totalChunks: number;
    chunksByType: Record<string, number>;
    chunksByCategory: Record<string, number>;
  }> {
    try {
      const totalChunks = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "ContentChunk"`
      );

      const byType = await this.prisma.$queryRawUnsafe<
        Array<{ sourceType: string; count: bigint }>
      >(`SELECT "sourceType", COUNT(*) as count FROM "ContentChunk" GROUP BY "sourceType"`);

      const byCategory = await this.prisma.$queryRawUnsafe<
        Array<{ category: string; count: bigint }>
      >(
        `SELECT category, COUNT(*) as count FROM "ContentChunk" WHERE category IS NOT NULL GROUP BY category`
      );

      return {
        totalChunks: Number(totalChunks[0]?.count || 0),
        chunksByType: Object.fromEntries(byType.map((row) => [row.sourceType, Number(row.count)])),
        chunksByCategory: Object.fromEntries(
          byCategory.map((row) => [row.category, Number(row.count)])
        ),
      };
    } catch (error) {
      logger.error('Failed to get stats', { error });
      throw new Error(
        `Failed to get stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export default VectorStore;
