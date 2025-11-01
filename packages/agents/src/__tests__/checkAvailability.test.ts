import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkAvailability } from '../tools/checkAvailability';
import { Decimal } from '@prisma/client/runtime/library';

const mockPrismaClient = {
  profile: {
    findFirst: vi.fn(),
  },
};

// Mock getPrismaClient
vi.mock('../lib/prisma', () => ({
  getPrismaClient: vi.fn(() => mockPrismaClient),
}));

describe('checkAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return available status', async () => {
    const mockProfile = {
      availability: 'available',
      hourlyRate: new Decimal(100),
      fullName: 'Rodrigo Vasconcelos de Barros',
    };

    vi.spyOn(mockPrismaClient.profile, 'findFirst').mockResolvedValue(mockProfile);

    const result = await checkAvailability({});

    expect(result.success).toBe(true);
    expect(result.availability).toBe('available');
    expect(result.hourlyRate).toBe(100);
    expect(result.message).toContain('currently available');
  });

  it('should return limited availability status', async () => {
    const mockProfile = {
      availability: 'limited',
      hourlyRate: new Decimal(150),
      fullName: 'Rodrigo Vasconcelos de Barros',
    };

    vi.spyOn(mockPrismaClient.profile, 'findFirst').mockResolvedValue(mockProfile);

    const result = await checkAvailability({});

    expect(result.success).toBe(true);
    expect(result.availability).toBe('limited');
    expect(result.hourlyRate).toBe(150);
    expect(result.message).toContain('part-time');
  });

  it('should return unavailable status', async () => {
    const mockProfile = {
      availability: 'unavailable',
      hourlyRate: null,
      fullName: 'Rodrigo Vasconcelos de Barros',
    };

    vi.spyOn(mockPrismaClient.profile, 'findFirst').mockResolvedValue(mockProfile);

    const result = await checkAvailability({});

    expect(result.success).toBe(true);
    expect(result.availability).toBe('unavailable');
    expect(result.hourlyRate).toBeNull();
    expect(result.message).toContain('not available');
  });

  it('should handle null hourly rate', async () => {
    const mockProfile = {
      availability: 'available',
      hourlyRate: null,
      fullName: 'Rodrigo Vasconcelos de Barros',
    };

    vi.spyOn(mockPrismaClient.profile, 'findFirst').mockResolvedValue(mockProfile);

    const result = await checkAvailability({});

    expect(result.success).toBe(true);
    expect(result.hourlyRate).toBeNull();
  });

  it('should return error when profile not found', async () => {
    vi.spyOn(mockPrismaClient.profile, 'findFirst').mockResolvedValue(null);

    const result = await checkAvailability({});

    expect(result.success).toBe(false);
    expect(result.error).toBe('Profile not found');
    expect(result.availability).toBeNull();
  });

  it('should handle database errors gracefully', async () => {
    vi.spyOn(mockPrismaClient.profile, 'findFirst').mockRejectedValue(new Error('Database error'));

    const result = await checkAvailability({});

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
    expect(result.availability).toBeNull();
  });
});
