/**
 * Retrieval Service
 *
 * Handles retrieval strategy and context injection for RAG.
 * Based on TECHNICAL_DOCUMENTATION.md Section 3.7.2 and 3.7.3
 *
 * Features:
 * - Query embedding generation
 * - Vector similarity search
 * - Result re-ranking by relevance
 * - Context formatting for LLM injection
 * - Metadata filtering
 */

import { generateEmbedding } from './embeddings';
import { VectorStore, type SearchResult } from './vector-store';
import { logger } from '../lib/logger';

// Default retrieval configuration
const DEFAULT_TOP_K = 5;
const DEFAULT_MIN_SIMILARITY = 0.5;
const DEFAULT_INCLUDE_METADATA = true;
const RETRIEVAL_MULTIPLIER = 2; // Retrieve 2x results for re-ranking

// Re-ranking score weights
const SIMILARITY_MULTIPLIER = 10; // Base similarity score multiplier
const KEYWORD_BOOST_WEIGHT = 0.5; // Weight for content keyword matches
const METADATA_BOOST_WEIGHT = 0.3; // Weight for metadata keyword matches
const PROJECT_TYPE_BOOST = 0.2; // Boost for project source type

// Formatting configuration
const SIMILARITY_DECIMAL_PRECISION = 2; // Decimal places for similarity display

export interface RetrievalOptions {
  topK?: number;
  sourceType?: string;
  category?: string;
  minSimilarity?: number;
  includeMetadata?: boolean;
}

export interface RetrievedContext {
  content: string;
  sourceType: string;
  sourceId: string;
  similarity: number;
  metadata?: Record<string, unknown>;
  chunkIndex: number;
}

export interface RAGContext {
  query: string;
  contexts: RetrievedContext[];
  formattedContext: string;
  totalChunks: number;
  avgSimilarity: number;
  retrievalTimeMs: number;
}

export class RetrievalService {
  private vectorStore: VectorStore;

  constructor(vectorStore?: VectorStore) {
    this.vectorStore = vectorStore || new VectorStore();
  }

  /**
   * Retrieve relevant context for a user query
   *
   * @param query - User's question or message
   * @param options - Retrieval options (topK, filters, etc.)
   * @returns RAG context with formatted text ready for LLM injection
   */
  async retrieveContext(query: string, options: RetrievalOptions = {}): Promise<RAGContext> {
    const startTime = Date.now();

    const {
      topK = DEFAULT_TOP_K,
      sourceType,
      category,
      minSimilarity = DEFAULT_MIN_SIMILARITY,
      includeMetadata = DEFAULT_INCLUDE_METADATA,
    } = options;

    try {
      // Step 1: Convert query to embedding
      logger.debug('Generating query embedding', { query });
      const { embedding } = await generateEmbedding(query);

      // Step 2: Search vector DB for similar chunks
      logger.debug('Searching for similar chunks', { topK, sourceType, category });
      const searchResults = await this.vectorStore.searchSimilar(
        embedding,
        topK * RETRIEVAL_MULTIPLIER, // Retrieve more results for re-ranking
        { sourceType, category }
      );

      // Step 3: Filter by minimum similarity
      const filteredResults = searchResults.filter((result) => result.similarity >= minSimilarity);

      // Step 4: Re-rank results
      const rerankedResults = this.reRankResults(filteredResults, query);

      // Step 5: Take top K after re-ranking
      const topResults = rerankedResults.slice(0, topK);

      // Step 6: Format context for LLM injection
      const contexts: RetrievedContext[] = topResults.map((result) => ({
        content: result.chunk.content,
        sourceType: result.chunk.sourceType,
        sourceId: result.chunk.sourceId,
        similarity: result.similarity,
        metadata: includeMetadata ? result.chunk.metadata : undefined,
        chunkIndex: result.chunk.chunkIndex,
      }));

      const formattedContext = this.formatContextForLLM(contexts);

      const retrievalTimeMs = Date.now() - startTime;
      const avgSimilarity =
        contexts.length > 0
          ? contexts.reduce((sum, c) => sum + c.similarity, 0) / contexts.length
          : 0;

      logger.info('Context retrieved successfully', {
        query,
        chunksFound: contexts.length,
        avgSimilarity,
        retrievalTimeMs,
      });

      return {
        query,
        contexts,
        formattedContext,
        totalChunks: contexts.length,
        avgSimilarity,
        retrievalTimeMs,
      };
    } catch (error) {
      logger.error('Context retrieval failed', { error, query });
      throw new Error(
        `Context retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Re-rank search results by relevance
   * Uses a combination of:
   * - Cosine similarity score
   * - Keyword matching
   * - Source type preference
   *
   * @param results - Initial search results
   * @param query - Original query for keyword matching
   * @returns Re-ranked results
   */
  private reRankResults(results: SearchResult[], query: string): SearchResult[] {
    const queryTerms = query.toLowerCase().split(/\s+/);

    // Calculate re-ranking score for each result
    const scoredResults = results.map((result) => {
      let score = result.similarity * SIMILARITY_MULTIPLIER; // Base score from similarity

      // Boost for keyword matches in content
      const contentLower = result.chunk.content.toLowerCase();
      const keywordMatches = queryTerms.filter((term) => contentLower.includes(term)).length;
      score += keywordMatches * KEYWORD_BOOST_WEIGHT;

      // Boost for metadata matches
      if (result.chunk.metadata) {
        const metadataStr = JSON.stringify(result.chunk.metadata).toLowerCase();
        const metadataMatches = queryTerms.filter((term) => metadataStr.includes(term)).length;
        score += metadataMatches * METADATA_BOOST_WEIGHT;
      }

      // Boost for "project" source type (most common queries)
      if (result.chunk.sourceType === 'project') {
        score += PROJECT_TYPE_BOOST;
      }

      return {
        ...result,
        rerankedScore: score,
      };
    });

    // Sort by re-ranked score
    scoredResults.sort((a, b) => b.rerankedScore - a.rerankedScore);

    return scoredResults;
  }

  /**
   * Format retrieved contexts for LLM injection
   * Based on TECHNICAL_DOCUMENTATION.md Section 3.7.3
   *
   * @param contexts - Retrieved contexts
   * @returns Formatted string ready for prompt injection
   */
  private formatContextForLLM(contexts: RetrievedContext[]): string {
    if (contexts.length === 0) {
      return 'No relevant context found.';
    }

    const sections = contexts.map((ctx, index) => {
      const parts = [
        `[Context ${index + 1}] (${ctx.sourceType}, similarity: ${ctx.similarity.toFixed(SIMILARITY_DECIMAL_PRECISION)})`,
        ctx.content,
      ];

      // Add metadata if available
      if (ctx.metadata) {
        const metadataStr = this.formatMetadata(ctx.metadata);
        if (metadataStr) {
          parts.push(`Metadata: ${metadataStr}`);
        }
      }

      return parts.join('\n');
    });

    return `Relevant information from portfolio:\n\n${sections.join('\n\n---\n\n')}`;
  }

  /**
   * Format metadata for display
   */
  private formatMetadata(metadata: Record<string, unknown>): string {
    const parts: string[] = [];

    if (metadata.title) {
      parts.push(`Title: ${metadata.title}`);
    }

    if (metadata.technologies && Array.isArray(metadata.technologies)) {
      parts.push(`Technologies: ${metadata.technologies.join(', ')}`);
    }

    if (metadata.tags && Array.isArray(metadata.tags)) {
      parts.push(`Tags: ${metadata.tags.join(', ')}`);
    }

    if (metadata.category) {
      parts.push(`Category: ${metadata.category}`);
    }

    return parts.join(', ');
  }

  /**
   * Inject RAG context into a chat prompt
   * Returns enhanced prompt with relevant context
   *
   * @param userMessage - User's message
   * @param ragContext - Retrieved RAG context
   * @returns Enhanced prompt with context injection
   */
  formatPromptWithContext(userMessage: string, ragContext: RAGContext): string {
    return `${ragContext.formattedContext}

---

User question: ${userMessage}

Please answer the user's question using the relevant information provided above. If the context doesn't contain relevant information, use your general knowledge about Rodrigo's portfolio.`;
  }

  /**
   * Quick retrieval for specific source
   * Optimized for direct content lookup
   */
  async retrieveBySource(sourceType: string, sourceId: string): Promise<RetrievedContext[]> {
    try {
      const chunks = await this.vectorStore.getChunksBySource(sourceType, sourceId);

      return chunks.map((chunk) => ({
        content: chunk.content,
        sourceType: chunk.sourceType,
        sourceId: chunk.sourceId,
        similarity: 1.0, // Direct lookup, not similarity-based
        metadata: chunk.metadata,
        chunkIndex: chunk.chunkIndex,
      }));
    } catch (error) {
      logger.error('Failed to retrieve by source', { error, sourceType, sourceId });
      throw new Error(
        `Failed to retrieve by source: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if retrieval performance meets SLA
   * Target: <200ms as specified in requirements
   */
  async performanceCheck(): Promise<{
    avgRetrievalTime: number;
    meetsRequirement: boolean;
    sampleSize: number;
  }> {
    const testQueries = [
      'React projects',
      'TypeScript experience',
      'full-stack development',
      'API design',
      'database optimization',
    ];

    const times: number[] = [];

    for (const query of testQueries) {
      const result = await this.retrieveContext(query, { topK: 5 });
      times.push(result.retrievalTimeMs);
    }

    const avgRetrievalTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    const meetsRequirement = avgRetrievalTime < 200;

    logger.info('Performance check completed', {
      avgRetrievalTime,
      meetsRequirement,
      times,
    });

    return {
      avgRetrievalTime,
      meetsRequirement,
      sampleSize: times.length,
    };
  }

  /**
   * Close connections
   */
  async disconnect(): Promise<void> {
    await this.vectorStore.disconnect();
  }
}

export default RetrievalService;
