import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../lib/logger';

/**
 * Error response messages for different API error scenarios
 */
export const ERROR_RESPONSES = {
  RATE_LIMIT: "I'm experiencing high demand right now. Please try again in a moment. In the meantime, feel free to explore the portfolio or contact Rodrigo directly.",
  SERVICE_UNAVAILABLE: "I'm temporarily unavailable. You can still reach Rodrigo at his email or LinkedIn. I'll be back shortly!",
  GENERAL_ERROR: "I encountered an error processing your message. Please try rephrasing your question, or contact Rodrigo directly for assistance.",
  STREAM_ERROR: "I'm sorry, I encountered an error. Please try again.",
} as const;

/**
 * Check if an error is an Anthropic API error and return appropriate response
 */
export function handleChatError(error: unknown, sessionId: string): { response: string; sessionId: string } {
  // Check for status property (works for both real and mocked APIError)
  const isAPIError = error instanceof Anthropic.APIError || (error && typeof error === 'object' && 'status' in error);

  if (isAPIError) {
    const status = (error as { status?: number }).status;

    if (status === 429) {
      return {
        response: ERROR_RESPONSES.RATE_LIMIT,
        sessionId,
      };
    } else if (status === 503) {
      return {
        response: ERROR_RESPONSES.SERVICE_UNAVAILABLE,
        sessionId,
      };
    }
  }

  logger.error('Chat error:', error);
  return {
    response: ERROR_RESPONSES.GENERAL_ERROR,
    sessionId,
  };
}

/**
 * Handle streaming chat errors
 */
export function* handleStreamError(error: unknown): Generator<string, void, unknown> {
  logger.error('Chat stream error:', error);
  yield ERROR_RESPONSES.STREAM_ERROR;
}