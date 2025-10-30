import { WebSocket } from 'ws';

import { redisClient } from '../lib/redis';
import { DEFAULT_RATE_LIMIT, RateLimitConfig, SessionData } from '../types/websocket.types';
import { logger } from '../utils/logger';

export class SessionManager {
  private sessions: Map<string, WebSocket>;
  private rateLimitConfig: RateLimitConfig;
  private lastRedisWarningTime: number = 0;
  private readonly REDIS_WARNING_THROTTLE_MS = 60000; // Log warning once per minute

  constructor(rateLimitConfig: RateLimitConfig = DEFAULT_RATE_LIMIT) {
    this.sessions = new Map();
    this.rateLimitConfig = rateLimitConfig;
  }

  /**
   * Register a new WebSocket connection with a session ID
   */
  async registerSession(sessionId: string, ws: WebSocket): Promise<void> {
    // Remove existing connection for this session if any
    if (this.sessions.has(sessionId)) {
      const oldWs = this.sessions.get(sessionId);
      if (oldWs && oldWs.readyState === WebSocket.OPEN) {
        oldWs.close(1000, 'New connection established');
      }
    }

    this.sessions.set(sessionId, ws);

    // Initialize session data in Redis
    const sessionData: SessionData = {
      sessionId,
      authenticated: true,
      messageCount: 0,
      firstMessageAt: Date.now(),
      lastMessageAt: Date.now(),
    };

    await this.setSessionData(sessionId, sessionData);
    logger.info(`Session registered: ${sessionId}`);
  }

  /**
   * Unregister a session
   */
  async unregisterSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    await this.deleteSessionData(sessionId);
    logger.info(`Session unregistered: ${sessionId}`);
  }

  /**
   * Get WebSocket connection for a session
   */
  getSession(sessionId: string): WebSocket | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Check if a session exists
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Get all active session IDs
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Check if a session can send a message (rate limiting)
   */
  async canSendMessage(sessionId: string): Promise<boolean> {
    const sessionData = await this.getSessionData(sessionId);
    if (!sessionData) {
      return false;
    }

    const now = Date.now();
    const windowStart = now - this.rateLimitConfig.windowMs;

    // Reset counter if window has passed
    if (sessionData.firstMessageAt < windowStart) {
      sessionData.messageCount = 0;
      sessionData.firstMessageAt = now;
    }

    return sessionData.messageCount < this.rateLimitConfig.maxRequests;
  }

  /**
   * Check rate limit and increment atomically
   * Returns true if message can be sent (and increments counter), false if rate limited
   */
  async checkAndIncrementMessage(sessionId: string): Promise<boolean> {
    const sessionData = await this.getSessionData(sessionId);
    if (!sessionData) {
      return false;
    }

    const now = Date.now();
    const windowStart = now - this.rateLimitConfig.windowMs;

    // Reset counter if window has passed
    if (sessionData.firstMessageAt < windowStart) {
      sessionData.messageCount = 1;
      sessionData.firstMessageAt = now;
      sessionData.lastMessageAt = now;
      await this.setSessionData(sessionId, sessionData);
      return true;
    }

    // Check if under rate limit
    if (sessionData.messageCount < this.rateLimitConfig.maxRequests) {
      sessionData.messageCount += 1;
      sessionData.lastMessageAt = now;
      await this.setSessionData(sessionId, sessionData);
      return true;
    }

    // Rate limit exceeded
    return false;
  }

  /**
   * Increment message count for a session
   */
  async incrementMessageCount(sessionId: string): Promise<void> {
    const sessionData = await this.getSessionData(sessionId);
    if (!sessionData) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const now = Date.now();
    const windowStart = now - this.rateLimitConfig.windowMs;

    // Reset counter if window has passed
    if (sessionData.firstMessageAt < windowStart) {
      sessionData.messageCount = 1;
      sessionData.firstMessageAt = now;
    } else {
      sessionData.messageCount += 1;
    }

    sessionData.lastMessageAt = now;
    await this.setSessionData(sessionId, sessionData);
  }

  /**
   * Get remaining requests for a session
   */
  async getRemainingRequests(sessionId: string): Promise<number> {
    const sessionData = await this.getSessionData(sessionId);
    if (!sessionData) {
      return 0;
    }

    const now = Date.now();
    const windowStart = now - this.rateLimitConfig.windowMs;

    // Reset counter if window has passed
    if (sessionData.firstMessageAt < windowStart) {
      return this.rateLimitConfig.maxRequests;
    }

    return Math.max(0, this.rateLimitConfig.maxRequests - sessionData.messageCount);
  }

  /**
   * Get time until rate limit resets (in milliseconds)
   */
  async getResetTime(sessionId: string): Promise<number> {
    const sessionData = await this.getSessionData(sessionId);
    if (!sessionData) {
      return 0;
    }

    const now = Date.now();
    const windowEnd = sessionData.firstMessageAt + this.rateLimitConfig.windowMs;
    const resetTime = Math.max(0, windowEnd - now);

    return resetTime;
  }

  /**
   * Log Redis unavailability warning with rate limiting to prevent log noise
   */
  private logRedisUnavailableWarning(): void {
    const now = Date.now();
    if (now - this.lastRedisWarningTime >= this.REDIS_WARNING_THROTTLE_MS) {
      logger.warn(
        'Redis is not connected. WebSocket session data will not be persisted. This message is rate-limited to once per minute.'
      );
      this.lastRedisWarningTime = now;
    }
  }

  /**
   * Store session data in Redis
   */
  private async setSessionData(sessionId: string, data: SessionData): Promise<void> {
    // Check if Redis is connected before attempting operation
    if (!redisClient.isOpen) {
      this.logRedisUnavailableWarning();
      logger.debug(`Unable to store session data for ${sessionId} - Redis not connected`);
      return;
    }

    try {
      const key = `websocket:session:${sessionId}`;
      const ttlSeconds = Math.ceil(this.rateLimitConfig.windowMs / 1000) + 60; // Add 1 minute buffer
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
      logger.error(`Failed to set session data for ${sessionId}:`, error);
      // Don't throw - allow WebSocket functionality to continue without Redis
      this.logRedisUnavailableWarning();
    }
  }

  /**
   * Get session data from Redis
   */
  private async getSessionData(sessionId: string): Promise<SessionData | null> {
    // Check if Redis is connected before attempting operation
    if (!redisClient.isOpen) {
      logger.debug(`Redis is not connected. Unable to retrieve session data for ${sessionId}.`);
      return null;
    }

    try {
      const key = `websocket:session:${sessionId}`;
      const data = await redisClient.get(key);
      if (!data) {
        return null;
      }
      return JSON.parse(data) as SessionData;
    } catch (error) {
      logger.error(`Failed to get session data for ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Delete session data from Redis
   */
  private async deleteSessionData(sessionId: string): Promise<void> {
    // Check if Redis is connected before attempting operation
    if (!redisClient.isOpen) {
      logger.debug(`Redis is not connected. Unable to delete session data for ${sessionId}.`);
      return;
    }

    try {
      const key = `websocket:session:${sessionId}`;
      await redisClient.del(key);
    } catch (error) {
      logger.error(`Failed to delete session data for ${sessionId}:`, error);
    }
  }

  /**
   * Clean up all sessions
   */
  async cleanup(): Promise<void> {
    logger.info('Cleaning up WebSocket sessions...');

    // Close all WebSocket connections
    for (const [sessionId, ws] of this.sessions.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Server shutting down');
      }
      await this.deleteSessionData(sessionId);
    }

    this.sessions.clear();
    logger.info('WebSocket sessions cleaned up');
  }
}
