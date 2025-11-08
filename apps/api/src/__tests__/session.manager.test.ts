import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebSocket } from 'ws';

// Mock the Redis client first
vi.mock('../lib/redis', () => ({
  redisClient: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    expire: vi.fn(),
    setEx: vi.fn(),
    isOpen: true,
  },
}));

// Mock the logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { redisClient } from '../lib/redis';
import { SessionManager } from '../websocket/session.manager';

const mockRedisClient = redisClient as typeof redisClient & {
  set: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
  exists: ReturnType<typeof vi.fn>;
  expire: ReturnType<typeof vi.fn>;
  setEx: ReturnType<typeof vi.fn>;
};

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let mockWebSocket: WebSocket;

  beforeEach(() => {
    sessionManager = new SessionManager();
    mockWebSocket = {
      readyState: WebSocket.OPEN,
      close: vi.fn(),
    } as unknown as WebSocket;
    vi.clearAllMocks();
  });

  describe('registerSession', () => {
    it('should register a new session', async () => {
      const sessionId = 'test-session-123';
      mockRedisClient.setEx.mockResolvedValue('OK');

      await sessionManager.registerSession(sessionId, mockWebSocket);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        `websocket:session:${sessionId}`,
        expect.any(Number),
        expect.stringContaining(sessionId)
      );
    });

    it('should close existing connection when registering same session', async () => {
      const sessionId = 'test-session-123';
      const oldWebSocket = {
        readyState: WebSocket.OPEN,
        close: vi.fn(),
      } as unknown as WebSocket;

      mockRedisClient.setEx.mockResolvedValue('OK');

      // Register first session
      await sessionManager.registerSession(sessionId, oldWebSocket);

      // Register same session with new websocket
      await sessionManager.registerSession(sessionId, mockWebSocket);

      expect(oldWebSocket.close).toHaveBeenCalledWith(1000, 'New connection established');
    });

    it('should handle Redis errors gracefully', async () => {
      const sessionId = 'test-session-123';
      mockRedisClient.setEx.mockRejectedValue(new Error('Redis connection failed'));

      // Should not throw
      await expect(sessionManager.registerSession(sessionId, mockWebSocket)).resolves.not.toThrow();
    });
  });

  describe('unregisterSession', () => {
    it('should unregister a session', async () => {
      const sessionId = 'test-session-123';
      mockRedisClient.del.mockResolvedValue(1);

      await sessionManager.unregisterSession(sessionId);

      expect(mockRedisClient.del).toHaveBeenCalledWith(`websocket:session:${sessionId}`);
    });

    it('should handle Redis errors when unregistering', async () => {
      const sessionId = 'test-session-123';
      mockRedisClient.del.mockRejectedValue(new Error('Redis connection failed'));

      // Should not throw
      await expect(sessionManager.unregisterSession(sessionId)).resolves.not.toThrow();
    });
  });

  describe('canSendMessage', () => {
    it('should return true for first message', async () => {
      const sessionId = 'test-session-123';
      mockRedisClient.get.mockResolvedValue(
        JSON.stringify({
          sessionId,
          authenticated: true,
          messageCount: 0,
          firstMessageAt: Date.now(),
          lastMessageAt: Date.now(),
        })
      );

      const canSend = await sessionManager.canSendMessage(sessionId);
      expect(canSend).toBe(true);
    });

    it('should return false when rate limit exceeded', async () => {
      const sessionId = 'test-session-123';
      const now = Date.now();
      mockRedisClient.get.mockResolvedValue(
        JSON.stringify({
          sessionId,
          authenticated: true,
          messageCount: 25, // Exceeds default limit of 20
          firstMessageAt: now - 60000, // 1 minute ago
          lastMessageAt: now,
        })
      );

      const canSend = await sessionManager.canSendMessage(sessionId);
      expect(canSend).toBe(false);
    });

    it('should reset count after time window', async () => {
      const sessionId = 'test-session-123';
      const now = Date.now();
      mockRedisClient.get.mockResolvedValue(
        JSON.stringify({
          sessionId,
          authenticated: true,
          messageCount: 25,
          firstMessageAt: now - 11 * 60 * 1000, // 11 minutes ago (outside window)
          lastMessageAt: now - 11 * 60 * 1000,
        })
      );

      const canSend = await sessionManager.canSendMessage(sessionId);
      expect(canSend).toBe(true);
    });

    it('should return false for non-existent session', async () => {
      const sessionId = 'test-session-123';
      mockRedisClient.get.mockResolvedValue(null);

      const canSend = await sessionManager.canSendMessage(sessionId);
      expect(canSend).toBe(false);
    });
  });

  describe('incrementMessageCount', () => {
    it('should increment message count for existing session', async () => {
      const sessionId = 'test-session-123';
      const existingData = {
        sessionId,
        authenticated: true,
        messageCount: 5,
        firstMessageAt: Date.now() - 60000,
        lastMessageAt: Date.now() - 30000,
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingData));
      mockRedisClient.setEx.mockResolvedValue('OK');

      await sessionManager.incrementMessageCount(sessionId);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        `websocket:session:${sessionId}`,
        expect.any(Number),
        expect.stringContaining('"messageCount":6')
      );
    });

    it('should handle non-existent session', async () => {
      const sessionId = 'test-session-123';
      mockRedisClient.get.mockResolvedValue(null);

      // Should throw error for non-existent session
      await expect(sessionManager.incrementMessageCount(sessionId)).rejects.toThrow(
        'Session not found'
      );
    });
  });

  describe('cleanup', () => {
    it('should close all websocket connections', async () => {
      const sessionId1 = 'session-1';
      const sessionId2 = 'session-2';

      const ws1 = { readyState: WebSocket.OPEN, close: vi.fn() } as unknown as WebSocket;
      const ws2 = { readyState: WebSocket.OPEN, close: vi.fn() } as unknown as WebSocket;

      mockRedisClient.setEx.mockResolvedValue('OK');
      mockRedisClient.del.mockResolvedValue(1);

      await sessionManager.registerSession(sessionId1, ws1);
      await sessionManager.registerSession(sessionId2, ws2);

      await sessionManager.cleanup();

      expect(ws1.close).toHaveBeenCalled();
      expect(ws2.close).toHaveBeenCalled();
    });

    it('should not close already closed connections', async () => {
      const sessionId = 'session-1';
      const ws = { readyState: WebSocket.CLOSED, close: vi.fn() } as unknown as WebSocket;

      mockRedisClient.setEx.mockResolvedValue('OK');
      mockRedisClient.del.mockResolvedValue(1);
      await sessionManager.registerSession(sessionId, ws);

      await sessionManager.cleanup();

      expect(ws.close).not.toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('should return websocket for existing session', async () => {
      const sessionId = 'test-session-123';
      mockRedisClient.setEx.mockResolvedValue('OK');

      await sessionManager.registerSession(sessionId, mockWebSocket);
      const retrievedWs = sessionManager.getSession(sessionId);

      expect(retrievedWs).toBe(mockWebSocket);
    });

    it('should return undefined for non-existent session', () => {
      const sessionId = 'non-existent-session';
      const retrievedWs = sessionManager.getSession(sessionId);

      expect(retrievedWs).toBeUndefined();
    });
  });

  describe('hasSession', () => {
    it('should return true for existing session', async () => {
      const sessionId = 'test-session-123';
      mockRedisClient.setEx.mockResolvedValue('OK');

      await sessionManager.registerSession(sessionId, mockWebSocket);
      const hasSession = sessionManager.hasSession(sessionId);

      expect(hasSession).toBe(true);
    });

    it('should return false for non-existent session', () => {
      const sessionId = 'non-existent-session';
      const hasSession = sessionManager.hasSession(sessionId);

      expect(hasSession).toBe(false);
    });
  });

  describe('getActiveSessions', () => {
    it('should return all active session IDs', async () => {
      const sessionId1 = 'session-1';
      const sessionId2 = 'session-2';
      const ws1 = { readyState: WebSocket.OPEN, close: vi.fn() } as unknown as WebSocket;
      const ws2 = { readyState: WebSocket.OPEN, close: vi.fn() } as unknown as WebSocket;

      mockRedisClient.setEx.mockResolvedValue('OK');

      await sessionManager.registerSession(sessionId1, ws1);
      await sessionManager.registerSession(sessionId2, ws2);

      const activeSessions = sessionManager.getActiveSessions();

      expect(activeSessions).toContain(sessionId1);
      expect(activeSessions).toContain(sessionId2);
      expect(activeSessions).toHaveLength(2);
    });

    it('should return empty array when no sessions', () => {
      const activeSessions = sessionManager.getActiveSessions();
      expect(activeSessions).toEqual([]);
    });
  });

  describe('checkAndIncrementMessage', () => {
    it('should return true and increment for valid session', async () => {
      const sessionId = 'test-session-123';
      const now = Date.now();
      const sessionData = {
        sessionId,
        authenticated: true,
        messageCount: 5,
        firstMessageAt: now - 60000,
        lastMessageAt: now - 30000,
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(sessionData));
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await sessionManager.checkAndIncrementMessage(sessionId);

      expect(result).toBe(true);
      expect(mockRedisClient.setEx).toHaveBeenCalled();
    });

    it('should return false for non-existent session', async () => {
      const sessionId = 'test-session-123';
      mockRedisClient.get.mockResolvedValue(null);

      const result = await sessionManager.checkAndIncrementMessage(sessionId);

      expect(result).toBe(false);
    });
  });

  describe('getRemainingRequests', () => {
    it('should return remaining requests for valid session', async () => {
      const sessionId = 'test-session-123';
      const sessionData = {
        sessionId,
        authenticated: true,
        messageCount: 15,
        firstMessageAt: Date.now() - 60000,
        lastMessageAt: Date.now() - 30000,
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(sessionData));

      const remaining = await sessionManager.getRemainingRequests(sessionId);

      expect(remaining).toBe(5); // Assuming default limit of 20
    });

    it('should return 0 for non-existent session', async () => {
      const sessionId = 'test-session-123';
      mockRedisClient.get.mockResolvedValue(null);

      const remaining = await sessionManager.getRemainingRequests(sessionId);

      expect(remaining).toBe(0);
    });
  });

  describe('getResetTime', () => {
    it('should return reset time for valid session', async () => {
      const sessionId = 'test-session-123';
      const now = Date.now();
      const sessionData = {
        sessionId,
        authenticated: true,
        messageCount: 15,
        firstMessageAt: now - 60000, // 1 minute ago
        lastMessageAt: now - 30000,
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(sessionData));

      const resetTime = await sessionManager.getResetTime(sessionId);

      expect(resetTime).toBeGreaterThan(0);
    });

    it('should return 0 for non-existent session', async () => {
      const sessionId = 'test-session-123';
      mockRedisClient.get.mockResolvedValue(null);

      const resetTime = await sessionManager.getResetTime(sessionId);

      expect(resetTime).toBe(0);
    });
  });
});
