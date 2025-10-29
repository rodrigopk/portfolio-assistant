import { cache } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { ProfileResponse } from '../types/profile.types';

const PROFILE_CACHE_KEY = 'profile:main';
const CACHE_TTL_SECONDS = 60 * 60; // 60 minutes as per TECHNICAL_DOCUMENTATION.md Section 5.1.1

/**
 * Profile Service
 * Handles business logic for profile operations with Redis caching
 */
export class ProfileService {
  /**
   * Get profile with Redis caching (60 min TTL)
   * Returns only public-facing fields as per API spec
   */
  async getProfile(): Promise<ProfileResponse | null> {
    try {
      // Try to get from cache first
      const cached = await cache.get<ProfileResponse>(PROFILE_CACHE_KEY);
      if (cached) {
        logger.debug('Profile fetched from cache');
        return cached;
      }

      // Cache miss - fetch from database
      logger.debug('Profile cache miss - fetching from database');
      const profile = await prisma.profile.findFirst({
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!profile) {
        logger.warn('No profile found in database');
        return null;
      }

      // Transform to public response format (exclude sensitive fields)
      const profileResponse: ProfileResponse = {
        fullName: profile.fullName,
        title: profile.title,
        bio: profile.bio,
        location: profile.location,
        availability: profile.availability,
        githubUrl: profile.githubUrl,
        linkedinUrl: profile.linkedinUrl,
      };

      // Cache the result
      await cache.set(PROFILE_CACHE_KEY, profileResponse, CACHE_TTL_SECONDS);
      logger.debug('Profile cached successfully');

      return profileResponse;
    } catch (error) {
      logger.error('Error fetching profile:', error);
      throw error;
    }
  }

  /**
   * Invalidate profile cache
   * Should be called when profile is updated
   */
  async invalidateCache(): Promise<void> {
    try {
      await cache.del(PROFILE_CACHE_KEY);
      logger.debug('Profile cache invalidated');
    } catch (error) {
      logger.error('Error invalidating profile cache:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const profileService = new ProfileService();
