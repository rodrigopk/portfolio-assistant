import { describe, it, expect } from 'vitest';
import { handleChatError, handleStreamError, ERROR_RESPONSES } from '../utils/error-handler';

describe('error-handler', () => {
  describe('handleChatError', () => {
    it('should handle rate limit errors', () => {
      const error = { status: 429 };
      const result = handleChatError(error, 'test-session');

      expect(result).toEqual({
        response: ERROR_RESPONSES.RATE_LIMIT,
        sessionId: 'test-session',
      });
    });

    it('should handle service unavailable errors', () => {
      const error = { status: 503 };
      const result = handleChatError(error, 'test-session');

      expect(result).toEqual({
        response: ERROR_RESPONSES.SERVICE_UNAVAILABLE,
        sessionId: 'test-session',
      });
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');
      const result = handleChatError(error, 'test-session');

      expect(result).toEqual({
        response: ERROR_RESPONSES.GENERAL_ERROR,
        sessionId: 'test-session',
      });
    });

    it('should handle API errors with other status codes', () => {
      const error = { status: 500 };
      const result = handleChatError(error, 'test-session');

      expect(result).toEqual({
        response: ERROR_RESPONSES.GENERAL_ERROR,
        sessionId: 'test-session',
      });
    });
  });

  describe('handleStreamError', () => {
    it('should yield stream error message', () => {
      const error = new Error('Stream error');
      const generator = handleStreamError(error);
      const result = generator.next();

      expect(result.value).toBe(ERROR_RESPONSES.STREAM_ERROR);
      expect(result.done).toBe(false);

      const nextResult = generator.next();
      expect(nextResult.done).toBe(true);
    });
  });
});
