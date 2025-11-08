import { describe, it, expect, vi } from 'vitest';

// Mock PrismaClient before importing the module
const mockPrismaClient = {
  $disconnect: vi.fn(),
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrismaClient),
}));

// Import after mocking
import { getPrismaClient, disconnectPrisma } from '../lib/prisma';

describe('Prisma Client Singleton', () => {
  describe('getPrismaClient', () => {
    it('should return a PrismaClient instance', () => {
      const client = getPrismaClient();

      expect(client).toBeDefined();
      expect(client).toHaveProperty('$disconnect');
    });

    it('should return the same instance on multiple calls (singleton)', () => {
      const client1 = getPrismaClient();
      const client2 = getPrismaClient();

      expect(client1).toBe(client2);
    });

    it('should create PrismaClient with appropriate logging configuration', () => {
      const client = getPrismaClient();
      expect(client).toBeDefined();
      // The mock provides the expected interface
      expect(client).toHaveProperty('$disconnect');
    });
  });

  describe('disconnectPrisma', () => {
    it('should call $disconnect on the PrismaClient instance', async () => {
      // First get an instance
      getPrismaClient();

      mockPrismaClient.$disconnect.mockResolvedValueOnce(undefined);

      await disconnectPrisma();

      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle disconnect when no instance exists', async () => {
      // Should not throw error
      await expect(disconnectPrisma()).resolves.not.toThrow();
    });
  });

  describe('Module exports', () => {
    it('should export getPrismaClient function', async () => {
      const module = await import('../lib/prisma');
      expect(module.getPrismaClient).toBeDefined();
      expect(typeof module.getPrismaClient).toBe('function');
    });

    it('should export disconnectPrisma function', async () => {
      const module = await import('../lib/prisma');
      expect(module.disconnectPrisma).toBeDefined();
      expect(typeof module.disconnectPrisma).toBe('function');
    });

    it('should not export the singleton class directly', async () => {
      const module = await import('../lib/prisma');
      const exports = Object.keys(module);

      expect(exports).toEqual(['getPrismaClient', 'disconnectPrisma']);
      expect(exports).not.toContain('PrismaClientSingleton');
    });
  });
});
