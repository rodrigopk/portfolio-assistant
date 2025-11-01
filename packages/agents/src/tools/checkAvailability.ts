import { z } from 'zod';
import { getPrismaClient } from '../lib/prisma';

export const checkAvailabilitySchema = z.object({});

export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;

export async function checkAvailability(_input: CheckAvailabilityInput) {
  try {
    const prisma = getPrismaClient();
    // Get the profile to check availability
    const profile = await prisma.profile.findFirst({
      select: {
        availability: true,
        hourlyRate: true,
        fullName: true,
      },
    });

    if (!profile) {
      return {
        success: false,
        error: 'Profile not found',
        availability: null,
      };
    }

    const availabilityMessages: Record<string, string> = {
      available: `${profile.fullName} is currently available for freelance projects.`,
      limited: `${profile.fullName} is available for part-time freelance work while maintaining a full-time position.`,
      unavailable: `${profile.fullName} is currently not available for new projects.`,
    };

    return {
      success: true,
      availability: profile.availability,
      hourlyRate: profile.hourlyRate ? Number(profile.hourlyRate) : null,
      message: availabilityMessages[profile.availability] || 'Availability status unknown',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      availability: null,
    };
  }
}

export const checkAvailabilityTool = {
  name: 'checkAvailability',
  description:
    'Get current freelance availability status for Rodrigo. Returns availability status (available/limited/unavailable) and hourly rate if applicable.',
  input_schema: {
    type: 'object' as const,
    properties: {},
  },
};
