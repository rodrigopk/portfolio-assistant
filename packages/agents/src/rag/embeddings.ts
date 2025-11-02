/**
 * Embeddings Service
 *
 * Handles text chunking and embedding generation for RAG implementation.
 * Based on TECHNICAL_DOCUMENTATION.md Section 3.7.1
 *
 * Features:
 * - Text chunking with configurable size and overlap
 * - OpenAI embedding generation (text-embedding-3-small)
 * - Token counting for chunk management
 * - Batch processing support
 */

import OpenAI from 'openai';
import { logger } from '../lib/logger';

// Default configuration based on technical docs
const CHUNK_SIZE = 500; // tokens
const CHUNK_OVERLAP = 50; // tokens
const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dimensions
const EMBEDDING_DIMENSIONS = 1536;

export interface TextChunk {
  content: string;
  index: number;
  tokenCount: number;
  startPosition: number;
  endPosition: number;
}

export interface EmbeddingResult {
  embedding: number[];
  tokenCount: number;
}

export interface ChunkWithEmbedding extends TextChunk {
  embedding: number[];
}

/**
 * Initialize OpenAI client
 */
function getOpenAIClient(): OpenAI {
  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
}

/**
 * Estimate token count for text
 * Simple estimation: ~4 characters per token for English text
 * For production, consider using tiktoken library for accurate counting
 */
export function estimateTokenCount(text: string): number {
  // Simple estimation: average 4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Split text into sentences for better chunk boundaries
 */
function splitIntoSentences(text: string): string[] {
  // Split on sentence boundaries (., !, ?) followed by space or newline
  return text.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.trim().length > 0);
}

/**
 * Chunk text into smaller pieces with overlap
 *
 * @param text - Text to chunk
 * @param chunkSize - Target chunk size in tokens (default: 500)
 * @param overlap - Number of tokens to overlap between chunks (default: 50)
 * @returns Array of text chunks
 */
export function chunkText(
  text: string,
  chunkSize: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP
): TextChunk[] {
  const sentences = splitIntoSentences(text);
  const chunks: TextChunk[] = [];

  let currentChunk: string[] = [];
  let currentTokenCount = 0;
  let chunkIndex = 0;
  let startPosition = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokenCount(sentence);

    // If adding this sentence exceeds chunk size and we have content
    if (currentTokenCount + sentenceTokens > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      const chunkContent = currentChunk.join(' ');
      chunks.push({
        content: chunkContent,
        index: chunkIndex,
        tokenCount: currentTokenCount,
        startPosition,
        endPosition: startPosition + chunkContent.length,
      });

      // Calculate overlap: keep last few sentences
      const overlapSentences: string[] = [];
      let overlapTokens = 0;

      for (let i = currentChunk.length - 1; i >= 0 && overlapTokens < overlap; i--) {
        const s = currentChunk[i];
        overlapSentences.unshift(s);
        overlapTokens += estimateTokenCount(s);
      }

      // Start new chunk with overlap
      currentChunk = overlapSentences;
      currentTokenCount = overlapTokens;
      startPosition += chunkContent.length - overlapSentences.join(' ').length;
      chunkIndex++;
    }

    // Add sentence to current chunk
    currentChunk.push(sentence);
    currentTokenCount += sentenceTokens;
  }

  // Add final chunk if there's remaining content
  if (currentChunk.length > 0) {
    const chunkContent = currentChunk.join(' ');
    chunks.push({
      content: chunkContent,
      index: chunkIndex,
      tokenCount: currentTokenCount,
      startPosition,
      endPosition: startPosition + chunkContent.length,
    });
  }

  logger.info('Text chunked successfully', {
    originalLength: text.length,
    chunkCount: chunks.length,
    avgTokensPerChunk: chunks.reduce((sum, c) => sum + c.tokenCount, 0) / chunks.length,
  });

  return chunks;
}

/**
 * Generate embedding for a single text
 *
 * @param text - Text to embed
 * @returns Embedding vector and token count
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const client = getOpenAIClient();

  try {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    const embedding = response.data[0].embedding;
    const tokenCount = response.usage.total_tokens;

    logger.debug('Embedding generated', {
      textLength: text.length,
      tokenCount,
      embeddingDimensions: embedding.length,
    });

    return {
      embedding,
      tokenCount,
    };
  } catch (error) {
    logger.error('Failed to generate embedding', { error });
    throw new Error(
      `Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate embeddings for multiple texts in batch
 *
 * @param texts - Array of texts to embed
 * @returns Array of embeddings
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<EmbeddingResult[]> {
  const client = getOpenAIClient();

  try {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    const results = response.data.map((item) => ({
      embedding: item.embedding,
      tokenCount: Math.ceil(response.usage.total_tokens / texts.length), // Approximate per-text count
    }));

    logger.info('Batch embeddings generated', {
      count: texts.length,
      totalTokens: response.usage.total_tokens,
    });

    return results;
  } catch (error) {
    logger.error('Failed to generate batch embeddings', { error });
    throw new Error(
      `Batch embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Chunk text and generate embeddings for all chunks
 *
 * @param text - Text to process
 * @param chunkSize - Target chunk size in tokens
 * @param overlap - Overlap between chunks in tokens
 * @returns Array of chunks with embeddings
 */
export async function chunkAndEmbed(
  text: string,
  chunkSize: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP
): Promise<ChunkWithEmbedding[]> {
  // Chunk the text
  const chunks = chunkText(text, chunkSize, overlap);

  if (chunks.length === 0) {
    return [];
  }

  // Generate embeddings for all chunks in batch
  const texts = chunks.map((chunk) => chunk.content);
  const embeddings = await generateEmbeddingsBatch(texts);

  // Combine chunks with their embeddings
  const chunksWithEmbeddings = chunks.map((chunk, index) => ({
    ...chunk,
    embedding: embeddings[index].embedding,
  }));

  logger.info('Text chunked and embedded', {
    textLength: text.length,
    chunkCount: chunksWithEmbeddings.length,
  });

  return chunksWithEmbeddings;
}

/**
 * Prepare content for RAG indexing
 * Combines title and description/content into a searchable text
 *
 * @param title - Content title
 * @param content - Main content
 * @param additionalFields - Additional fields to include (tags, technologies, etc.)
 * @returns Formatted text ready for chunking
 */
export function prepareContentForIndexing(
  title: string,
  content: string,
  additionalFields?: Record<string, string | string[]>
): string {
  const parts = [`Title: ${title}`, `Content: ${content}`];

  // Add additional fields
  if (additionalFields) {
    for (const [key, value] of Object.entries(additionalFields)) {
      if (Array.isArray(value)) {
        parts.push(`${key}: ${value.join(', ')}`);
      } else {
        parts.push(`${key}: ${value}`);
      }
    }
  }

  return parts.join('\n\n');
}

export default {
  chunkText,
  generateEmbedding,
  generateEmbeddingsBatch,
  chunkAndEmbed,
  prepareContentForIndexing,
  estimateTokenCount,
};
