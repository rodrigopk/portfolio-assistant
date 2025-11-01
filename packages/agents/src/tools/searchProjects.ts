import { z } from 'zod';
import { getPrismaClient } from '../lib/prisma';

export const searchProjectsSchema = z.object({
  query: z.string().optional().describe('Search query for project title or description'),
  technologies: z.array(z.string()).optional().describe('Array of technology names to filter by'),
});

export type SearchProjectsInput = z.infer<typeof searchProjectsSchema>;

export async function searchProjects(input: SearchProjectsInput) {
  const { query, technologies } = input;

  try {
    const prisma = getPrismaClient();
    const whereConditions: Record<string, unknown>[] = [];

    if (query) {
      whereConditions.push(
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { longDescription: { contains: query, mode: 'insensitive' } }
      );
    }

    if (technologies && technologies.length > 0) {
      whereConditions.push({
        technologies: { hasSome: technologies },
      });
    }

    const projects = await prisma.project.findMany({
      where: whereConditions.length > 0 ? { OR: whereConditions } : {},
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        technologies: true,
        category: true,
        githubUrl: true,
        liveUrl: true,
        featured: true,
      },
      orderBy: [{ featured: 'desc' }, { order: 'asc' }],
      take: 10,
    });

    return {
      success: true,
      projects,
      count: projects.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      projects: [],
      count: 0,
    };
  }
}

export const searchProjectsTool = {
  name: 'searchProjects',
  description:
    'Search portfolio projects by query text or filter by technologies. Returns relevant projects with their details.',
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'Search query for project title or description',
      },
      technologies: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of technology names to filter by (e.g., ["React", "TypeScript"])',
      },
    },
  },
};
