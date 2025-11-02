import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../lib/logger';

describe('Logger', () => {
  const originalEnv = process.env;
  const mockConsole = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods
    global.console = {
      ...global.console,
      ...mockConsole,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetAllMocks();
  });

  describe('shouldLog logic', () => {
    it('should not log in test environment', () => {
      process.env['NODE_ENV'] = 'test';

      logger.error('test error');
      logger.warn('test warning');
      logger.info('test info');
      logger.debug('test debug');

      expect(mockConsole.error).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.debug).not.toHaveBeenCalled();
    });

    it('should log in development environment', () => {
      process.env['NODE_ENV'] = 'development';

      logger.error('test error');
      logger.warn('test warning');
      logger.info('test info');
      logger.debug('test debug');

      expect(mockConsole.error).toHaveBeenCalledWith('[ChatAgent Error] test error');
      expect(mockConsole.warn).toHaveBeenCalledWith('[ChatAgent Warn] test warning');
      expect(mockConsole.info).toHaveBeenCalledWith('[ChatAgent Info] test info');
      expect(mockConsole.debug).toHaveBeenCalledWith('[ChatAgent Debug] test debug');
    });

    it('should log in production environment except debug', () => {
      process.env['NODE_ENV'] = 'production';

      logger.error('test error');
      logger.warn('test warning');
      logger.info('test info');
      logger.debug('test debug');

      expect(mockConsole.error).toHaveBeenCalledWith('[ChatAgent Error] test error');
      expect(mockConsole.warn).toHaveBeenCalledWith('[ChatAgent Warn] test warning');
      expect(mockConsole.info).toHaveBeenCalledWith('[ChatAgent Info] test info');
      expect(mockConsole.debug).not.toHaveBeenCalled(); // Debug only in development
    });

    it('should log when NODE_ENV is undefined', () => {
      delete process.env['NODE_ENV'];

      logger.error('test error');
      logger.warn('test warning');
      logger.info('test info');

      expect(mockConsole.error).toHaveBeenCalledWith('[ChatAgent Error] test error');
      expect(mockConsole.warn).toHaveBeenCalledWith('[ChatAgent Warn] test warning');
      expect(mockConsole.info).toHaveBeenCalledWith('[ChatAgent Info] test info');
    });
  });

  describe('error method', () => {
    beforeEach(() => {
      process.env['NODE_ENV'] = 'development';
    });

    it('should log error messages with correct format', () => {
      logger.error('Something went wrong');

      expect(mockConsole.error).toHaveBeenCalledWith('[ChatAgent Error] Something went wrong');
    });

    it('should log error with additional arguments', () => {
      const errorObj = new Error('Test error');
      const metadata = { userId: '123', action: 'create' };

      logger.error('Operation failed', errorObj, metadata);

      expect(mockConsole.error).toHaveBeenCalledWith(
        '[ChatAgent Error] Operation failed',
        errorObj,
        metadata
      );
    });

    it('should handle multiple arguments correctly', () => {
      logger.error('Error with data:', 'string arg', 123, true, { key: 'value' });

      expect(mockConsole.error).toHaveBeenCalledWith(
        '[ChatAgent Error] Error with data:',
        'string arg',
        123,
        true,
        { key: 'value' }
      );
    });
  });

  describe('warn method', () => {
    beforeEach(() => {
      process.env['NODE_ENV'] = 'development';
    });

    it('should log warning messages with correct format', () => {
      logger.warn('This is a warning');

      expect(mockConsole.warn).toHaveBeenCalledWith('[ChatAgent Warn] This is a warning');
    });

    it('should log warning with additional arguments', () => {
      const data = { retryCount: 3 };

      logger.warn('Retry limit reached', data);

      expect(mockConsole.warn).toHaveBeenCalledWith('[ChatAgent Warn] Retry limit reached', data);
    });
  });

  describe('info method', () => {
    beforeEach(() => {
      process.env['NODE_ENV'] = 'development';
    });

    it('should log info messages with correct format', () => {
      logger.info('Process completed successfully');

      expect(mockConsole.info).toHaveBeenCalledWith(
        '[ChatAgent Info] Process completed successfully'
      );
    });

    it('should log info with additional arguments', () => {
      const stats = { processed: 100, errors: 0 };

      logger.info('Batch processing complete', stats);

      expect(mockConsole.info).toHaveBeenCalledWith(
        '[ChatAgent Info] Batch processing complete',
        stats
      );
    });
  });

  describe('debug method', () => {
    it('should log debug messages only in development environment', () => {
      process.env['NODE_ENV'] = 'development';

      logger.debug('Debug information');

      expect(mockConsole.debug).toHaveBeenCalledWith('[ChatAgent Debug] Debug information');
    });

    it('should not log debug messages in production environment', () => {
      process.env['NODE_ENV'] = 'production';

      logger.debug('Debug information');

      expect(mockConsole.debug).not.toHaveBeenCalled();
    });

    it('should not log debug messages when NODE_ENV is undefined', () => {
      delete process.env['NODE_ENV'];

      logger.debug('Debug information');

      expect(mockConsole.debug).not.toHaveBeenCalled();
    });

    it('should log debug with additional arguments in development', () => {
      process.env['NODE_ENV'] = 'development';
      const debugData = { step: 1, state: 'processing' };

      logger.debug('Current state', debugData);

      expect(mockConsole.debug).toHaveBeenCalledWith('[ChatAgent Debug] Current state', debugData);
    });
  });

  describe('logger instance', () => {
    it('should be a singleton instance', async () => {
      const module1 = await import('../lib/logger');
      const module2 = await import('../lib/logger');

      expect(module1.logger).toBe(module2.logger);
    });

    it('should have all required methods', () => {
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });
});
