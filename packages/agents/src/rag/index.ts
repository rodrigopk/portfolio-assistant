/**
 * RAG (Retrieval Augmented Generation) Module
 *
 * Exports all RAG functionality for vector-based semantic search
 * Based on TECHNICAL_DOCUMENTATION.md Section 3.7
 */

export {
  chunkText,
  generateEmbedding,
  generateEmbeddingsBatch,
  chunkAndEmbed,
  prepareContentForIndexing,
  estimateTokenCount,
  type TextChunk,
  type EmbeddingResult,
  type ChunkWithEmbedding,
} from './embeddings';

export {
  VectorStore,
  type ContentMetadata,
  type StoredChunk,
  type SearchResult,
} from './vector-store';

export {
  RetrievalService,
  type RetrievalOptions,
  type RetrievedContext,
  type RAGContext,
} from './retrieval';

// Re-export default instances for convenience
import { VectorStore } from './vector-store';
import { RetrievalService } from './retrieval';

export const defaultVectorStore = new VectorStore();
export const defaultRetrievalService = new RetrievalService(defaultVectorStore);
