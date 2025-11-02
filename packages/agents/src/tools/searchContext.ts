/**
 * Search Context Tool
 *
 * RAG-powered semantic search tool for finding relevant portfolio context.
 * Uses vector embeddings to retrieve the most relevant content chunks.
 */

import { z } from 'zod';
import { defaultRetrievalService } from '../rag';
import { logger } from '../lib/logger';

// Input schema for the tool
const searchContextSchema = z.object({
  query: z.string().describe('The search query or user question'),
  topK: z.number().optional().default(5).describe('Number of results to retrieve (default: 5)'),
  sourceType: z
    .enum(['project', 'blog', 'skill', 'experience'])
    .optional()
    .describe('Filter by content type'),
  category: z.string().optional().describe('Filter by category'),
});

export type SearchContextInput = z.infer<typeof searchContextSchema>;

/**
 * Tool definition for Claude
 */
export const searchContextTool = {
  name: 'searchContext',
  description:
    "Search portfolio content using semantic search. Finds the most relevant projects, blog posts, skills, and experience based on the user's query. Use this to provide context-aware responses about Rodrigo's work.",
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'The search query or user question',
      },
      topK: {
        type: 'number',
        description: 'Number of results to retrieve (default: 5)',
        default: 5,
      },
      sourceType: {
        type: 'string',
        enum: ['project', 'blog', 'skill', 'experience'],
        description: 'Filter by content type (optional)',
      },
      category: {
        type: 'string',
        description: 'Filter by category (optional)',
      },
    },
    required: ['query'],
  },
};

/**
 * Execute the search context tool
 */
export async function searchContext(input: SearchContextInput) {
  try {
    logger.info('Searching context', {
      query: input.query,
      topK: input.topK,
      sourceType: input.sourceType,
      category: input.category,
    });

    // Validate input
    const validated = searchContextSchema.parse(input);

    // Retrieve context using RAG
    const ragContext = await defaultRetrievalService.retrieveContext(validated.query, {
      topK: validated.topK,
      sourceType: validated.sourceType,
      category: validated.category,
      minSimilarity: 0.5, // Minimum similarity threshold
      includeMetadata: true,
    });

    // Format results for the agent
    const results = ragContext.contexts.map((ctx) => ({
      content: ctx.content,
      source: {
        type: ctx.sourceType,
        id: ctx.sourceId,
      },
      similarity: ctx.similarity,
      metadata: ctx.metadata,
    }));

    logger.info('Context search completed', {
      query: validated.query,
      resultsCount: results.length,
      avgSimilarity: ragContext.avgSimilarity,
      retrievalTimeMs: ragContext.retrievalTimeMs,
    });

    return {
      success: true,
      query: validated.query,
      results,
      totalResults: results.length,
      avgSimilarity: ragContext.avgSimilarity,
      retrievalTimeMs: ragContext.retrievalTimeMs,
    };
  } catch (error) {
    logger.error('Context search failed', { error, input });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Context search failed',
      query: input.query,
      results: [],
      totalResults: 0,
    };
  }
}

export default {
  searchContext,
  searchContextTool,
};
