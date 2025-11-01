/**
 * Simple logger utility for the agents package
 * In production, this could be replaced with winston or another logging library
 */
declare class Logger {
  private shouldLog;
  error(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}
export declare const logger: Logger;
export {};
