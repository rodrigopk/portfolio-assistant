import { z } from 'zod';
import { getPrismaClient } from '../lib/prisma';

export const getProjectDetailsSchema = z.object({
  projectId: z.string().describe('The ID or slug of the project to retrieve'),
});

export type GetProjectDetailsInput = z.infer<typeof getProjectDetailsSchema>;

export async function getProjectDetails(input: GetProjectDetailsInput) {
  const { projectId } = input;

  try {
    const prisma = getPrismaClient();
    // Try to find by ID first, then by slug
    const project = await prisma.project.findFirst({
      where: {
        OR: [{ id: projectId }, { slug: projectId }],
      },
    });

    if (!project) {
      return {
        success: false,
        error: 'Project not found',
        project: null,
      };
    }

    return {
      success: true,
      project,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project: null,
    };
  }
}

export const getProjectDetailsTool = {
  name: 'getProjectDetails',
  description:
    'Retrieve full details of a specific project by its ID or slug. Returns complete project information including long description, GitHub stats, and dates.',
  input_schema: {
    type: 'object' as const,
    properties: {
      projectId: {
        type: 'string',
        description: 'The ID or slug of the project to retrieve',
      },
    },
    required: ['projectId'],
  },
};
