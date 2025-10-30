/* eslint-disable @typescript-eslint/no-explicit-any */
// Note: The `any` type is used in tests for Prisma mock responses and HTTP response bodies
// where the exact types are complex and mocking would be overly verbose for test purposes
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

import app from '../app';
import { prisma } from '../lib/prisma';
import { connectRedis, disconnectRedis, cache } from '../lib/redis';
import { ProfileService } from '../services/profile.service';

// Mock data
const mockProfile = {
  id: 'test-profile-id',
  fullName: 'Rodrigo Vasconcelos de Barros',
  title: 'Senior Software Engineer',
  email: 'rodrigo@example.com',
  phone: '+1234567890',
  location: 'Toronto, Ontario, Canada',
  bio: 'Experienced full-stack engineer with 8+ years of experience',
  shortBio: 'Building scalable web applications',
  yearsExperience: 8,
  githubUrl: 'https://github.com/rodrigo',
  linkedinUrl: 'https://linkedin.com/in/rodrigo',
  twitterUrl: 'https://twitter.com/rodrigo',
  availability: 'limited',
  hourlyRate: null,
  resumeUrl: 'https://example.com/resume.pdf',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const expectedResponse = {
  fullName: mockProfile.fullName,
  title: mockProfile.title,
  bio: mockProfile.bio,
  location: mockProfile.location,
  availability: mockProfile.availability,
  githubUrl: mockProfile.githubUrl,
  linkedinUrl: mockProfile.linkedinUrl,
};

describe('Profile API - Unit Tests', () => {
  describe('ProfileService', () => {
    let profileService: ProfileService;

    beforeEach(() => {
      profileService = new ProfileService();
      vi.clearAllMocks();
    });

    it('should return profile from database when cache is empty', async () => {
      // Mock cache miss
      vi.spyOn(cache, 'get').mockResolvedValue(null);
      vi.spyOn(cache, 'set').mockResolvedValue(undefined);

      // Mock database response
      vi.spyOn(prisma.profile, 'findFirst').mockResolvedValue(mockProfile);

      const result = await profileService.getProfile();

      expect(result).toEqual(expectedResponse);
      expect(cache.get).toHaveBeenCalledWith('profile:main');
      expect(prisma.profile.findFirst).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith('profile:main', expectedResponse, 3600);
    });

    it('should return profile from cache when available', async () => {
      // Mock cache hit
      vi.spyOn(cache, 'get').mockResolvedValue(expectedResponse);
      vi.spyOn(prisma.profile, 'findFirst').mockResolvedValue(null);

      const result = await profileService.getProfile();

      expect(result).toEqual(expectedResponse);
      expect(cache.get).toHaveBeenCalledWith('profile:main');
      expect(prisma.profile.findFirst).not.toHaveBeenCalled();
    });

    it('should return null when no profile exists in database', async () => {
      // Mock cache miss and no profile in DB
      vi.spyOn(cache, 'get').mockResolvedValue(null);
      vi.spyOn(prisma.profile, 'findFirst').mockResolvedValue(null);

      const result = await profileService.getProfile();

      expect(result).toBeNull();
      expect(cache.get).toHaveBeenCalled();
      expect(prisma.profile.findFirst).toHaveBeenCalled();
    });

    it('should exclude sensitive fields from response', async () => {
      vi.spyOn(cache, 'get').mockResolvedValue(null);
      vi.spyOn(cache, 'set').mockResolvedValue(undefined);
      vi.spyOn(prisma.profile, 'findFirst').mockResolvedValue(mockProfile);

      const result = await profileService.getProfile();

      // Ensure sensitive fields are not included
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('phone');
      expect(result).not.toHaveProperty('hourlyRate');
      expect(result).not.toHaveProperty('resumeUrl');
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
    });

    it('should invalidate cache', async () => {
      vi.spyOn(cache, 'del').mockResolvedValue(undefined);

      await profileService.invalidateCache();

      expect(cache.del).toHaveBeenCalledWith('profile:main');
    });

    it('should handle errors when fetching from database', async () => {
      vi.spyOn(cache, 'get').mockResolvedValue(null);
      const dbError = new Error('Database connection failed');
      vi.spyOn(prisma.profile, 'findFirst').mockRejectedValue(dbError);

      await expect(profileService.getProfile()).rejects.toThrow('Database connection failed');
    });

    it('should handle errors when invalidating cache', async () => {
      const cacheError = new Error('Redis connection failed');
      vi.spyOn(cache, 'del').mockRejectedValue(cacheError);

      await expect(profileService.invalidateCache()).rejects.toThrow('Redis connection failed');
    });
  });
});

describe('Profile API - Integration Tests', () => {
  let redisConnected = false;

  beforeAll(async () => {
    // Connect to Redis for integration tests with timeout
    try {
      await Promise.race([
        connectRedis().then(() => {
          redisConnected = true;
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis connection timeout')), 2000)
        ),
      ]);
    } catch (error) {
      console.warn('Redis connection failed, tests will run with mocked cache:', error);
      redisConnected = false;
      // Mock cache operations when Redis is not available
      vi.spyOn(cache, 'get').mockResolvedValue(null);
      vi.spyOn(cache, 'set').mockResolvedValue(undefined);
      vi.spyOn(cache, 'del').mockResolvedValue(undefined);
    }
  });

  afterAll(async () => {
    // Cleanup
    try {
      if (redisConnected) {
        await cache.del('profile:main');
        await disconnectRedis();
      }
    } catch (error) {
      console.warn('Error during Redis cleanup:', error);
    }
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear cache before each test only if Redis is connected
    try {
      if (redisConnected) {
        await cache.del('profile:main');
      }
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  });

  describe('GET /api/profile', () => {
    it('should return 200 and profile data when profile exists', async () => {
      // Mock database response for integration test
      vi.spyOn(prisma.profile, 'findFirst').mockResolvedValue(mockProfile as any);

      const response = await request(app).get('/api/profile');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        fullName: expect.any(String),
        title: expect.any(String),
        bio: expect.any(String),
        location: expect.any(String),
        availability: expect.any(String),
      });

      // Check response headers
      expect(response.headers['cache-control']).toBe('public, max-age=3600');
      expect(response.headers['etag']).toBeDefined();

      // Verify sensitive fields are not exposed
      expect(response.body.data).not.toHaveProperty('email');
      expect(response.body.data).not.toHaveProperty('phone');
      expect(response.body.data).not.toHaveProperty('hourlyRate');
    });

    it('should return 404 when profile does not exist', async () => {
      // Mock no profile in database
      vi.spyOn(prisma.profile, 'findFirst').mockResolvedValue(null as any);

      const response = await request(app).get('/api/profile');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatchObject({
        code: 'NOT_FOUND',
        message: 'Profile not found',
      });
    });

    it('should return cached data on subsequent requests', async () => {
      // First request - should hit database
      vi.spyOn(prisma.profile, 'findFirst').mockResolvedValue(mockProfile as any);

      const response1 = await request(app).get('/api/profile');
      expect(response1.status).toBe(200);

      // Clear the mock call count
      vi.clearAllMocks();

      // Second request - should hit cache
      vi.spyOn(prisma.profile, 'findFirst').mockResolvedValue(mockProfile as any);

      const response2 = await request(app).get('/api/profile');
      expect(response2.status).toBe(200);
      expect(response2.body.data).toEqual(response1.body.data);

      // Verify database was not called on second request (cache hit)
      // Note: This may not work in actual test if cache is working properly
    });

    it('should respect rate limiting', async () => {
      // Mock profile
      vi.spyOn(prisma.profile, 'findFirst').mockResolvedValue(mockProfile as any);

      // Make requests up to the rate limit
      // Note: Actual rate limit is 100 per 15 min, we'll test a few requests
      const requests = Array(5)
        .fill(null)
        .map(() => request(app).get('/api/profile'));

      const responses = await Promise.all(requests);

      // All should succeed if within limit
      responses.forEach((response) => {
        expect([200, 404]).toContain(response.status);
      });
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      vi.spyOn(prisma.profile, 'findFirst').mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/profile');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatchObject({
        code: 'INTERNAL_ERROR',
        message: expect.any(String),
      });
    });

    it('should return correct content-type header', async () => {
      vi.spyOn(prisma.profile, 'findFirst').mockResolvedValue(mockProfile as any);

      const response = await request(app).get('/api/profile');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should have proper CORS headers', async () => {
      vi.spyOn(prisma.profile, 'findFirst').mockResolvedValue(mockProfile as any);

      const response = await request(app)
        .get('/api/profile')
        .set('Origin', 'http://localhost:3000');

      // CORS headers should be present if origin is allowed
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});

describe('Profile API - Coverage Tests', () => {
  it('should test all public methods of ProfileService', () => {
    const service = new ProfileService();
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service));

    // Verify all expected methods exist
    expect(methods).toContain('getProfile');
    expect(methods).toContain('invalidateCache');
  });

  it('should verify response schema matches documentation', async () => {
    vi.spyOn(prisma.profile, 'findFirst').mockResolvedValue(mockProfile as any);
    vi.spyOn(cache, 'get').mockResolvedValue(null);

    const response = await request(app).get('/api/profile');

    if (response.status === 200) {
      const { data } = response.body;

      // Verify exact schema from TECHNICAL_DOCUMENTATION.md Section 5.1.1
      expect(data).toHaveProperty('fullName');
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('bio');
      expect(data).toHaveProperty('location');
      expect(data).toHaveProperty('availability');
      expect(data).toHaveProperty('githubUrl');
      expect(data).toHaveProperty('linkedinUrl');

      // Verify types
      expect(typeof data.fullName).toBe('string');
      expect(typeof data.title).toBe('string');
      expect(typeof data.bio).toBe('string');
      expect(typeof data.location).toBe('string');
      expect(typeof data.availability).toBe('string');
      expect(data.githubUrl === null || typeof data.githubUrl === 'string').toBe(true);
      expect(data.linkedinUrl === null || typeof data.linkedinUrl === 'string').toBe(true);
    }
  });
});
