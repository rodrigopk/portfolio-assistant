import { vi } from 'vitest';

// Create a mock Prisma client with all the methods needed by the API
const mockPrismaClient = {
  profile: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
  },
  project: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(() => Promise.resolve([])), // Default to empty array for projects
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn(() => Promise.resolve(0)), // Default count to 0
  },
  conversation: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
  },
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $transaction: vi.fn(),
};

// Mock the shared database package to avoid module compatibility issues
vi.mock('@portfolio/database', () => ({
  getPrismaClient: vi.fn(() => mockPrismaClient),
  disconnectPrisma: vi.fn(),
  PrismaClient: vi.fn(() => mockPrismaClient),
  ConversationRepository: vi.fn(),
}));

// Mock the local prisma module
vi.mock('../lib/prisma', () => ({
  prisma: mockPrismaClient,
  default: mockPrismaClient,
}));

// Mock Redis for API tests
vi.mock('../lib/redis', () => ({
  default: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    quit: vi.fn().mockResolvedValue('OK'),
    isReady: true,
  },
  redisClient: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    quit: vi.fn().mockResolvedValue('OK'),
    isOpen: true,
    isReady: true,
  },
  connectRedis: vi.fn().mockResolvedValue(undefined),
  disconnectRedis: vi.fn().mockResolvedValue(undefined),
  cache: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
    delPattern: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
  },
}));

// Export the mock for tests to access
export { mockPrismaClient };