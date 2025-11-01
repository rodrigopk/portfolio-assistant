/**
 * Simple logger utility for the agents package
 * In production, this could be replaced with winston or another logging library
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private shouldLog(_level: LogLevel): boolean {
    const nodeEnv = process.env['NODE_ENV'];
    if (nodeEnv === 'test') {
      return false; // Don't log during tests
    }
    return true;
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      // eslint-disable-next-line no-console
      console.error(`[ChatAgent Error] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      // eslint-disable-next-line no-console
      console.warn(`[ChatAgent Warn] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.info(`[ChatAgent Info] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug') && process.env['NODE_ENV'] === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[ChatAgent Debug] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
