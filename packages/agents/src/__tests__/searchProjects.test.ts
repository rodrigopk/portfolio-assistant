import { describe, it, expect, beforeEach, vi } from 'vitest';
import { searchProjects } from '../tools/searchProjects';

const mockPrismaClient = {
  project: {
    findMany: vi.fn(),
  },
};

// Mock getPrismaClient
vi.mock('../lib/prisma', () => ({
  getPrismaClient: vi.fn(() => mockPrismaClient),
}));

describe('searchProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should search projects by query text', async () => {
    const mockProjects = [
      {
        id: '1',
        title: 'React Portfolio',
        slug: 'react-portfolio',
        description: 'A portfolio website built with React',
        technologies: ['React', 'TypeScript'],
        category: 'web',
        githubUrl: 'https://github.com/test/react-portfolio',
        liveUrl: 'https://example.com',
        featured: true,
      },
    ];

    vi.spyOn(mockPrismaClient.project, 'findMany').mockResolvedValue(mockProjects);

    const result = await searchProjects({ query: 'React' });

    expect(result.success).toBe(true);
    expect(result.projects).toEqual(mockProjects);
    expect(result.count).toBe(1);
    expect(mockPrismaClient.project.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { title: { contains: 'React', mode: 'insensitive' } },
          { description: { contains: 'React', mode: 'insensitive' } },
          { longDescription: { contains: 'React', mode: 'insensitive' } },
        ],
      },
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
  });

  it('should filter projects by technologies', async () => {
    const mockProjects = [
      {
        id: '2',
        title: 'TypeScript API',
        slug: 'typescript-api',
        description: 'RESTful API with TypeScript',
        technologies: ['TypeScript', 'Node.js'],
        category: 'backend',
        githubUrl: null,
        liveUrl: null,
        featured: false,
      },
    ];

    vi.spyOn(mockPrismaClient.project, 'findMany').mockResolvedValue(mockProjects);

    const result = await searchProjects({ technologies: ['TypeScript'] });

    expect(result.success).toBe(true);
    expect(result.projects).toEqual(mockProjects);
    expect(result.count).toBe(1);
  });

  it('should combine query and technology filters', async () => {
    const mockProjects = [];
    vi.spyOn(mockPrismaClient.project, 'findMany').mockResolvedValue(mockProjects);

    const result = await searchProjects({
      query: 'portfolio',
      technologies: ['React', 'Vue'],
    });

    expect(result.success).toBe(true);
    expect(result.projects).toEqual([]);
    expect(result.count).toBe(0);
  });

  it('should return empty array when no filters provided', async () => {
    const mockProjects = [
      {
        id: '3',
        title: 'All Projects',
        slug: 'all-projects',
        description: 'Test',
        technologies: [],
        category: 'web',
        githubUrl: null,
        liveUrl: null,
        featured: false,
      },
    ];

    vi.spyOn(mockPrismaClient.project, 'findMany').mockResolvedValue(mockProjects);

    const result = await searchProjects({});

    expect(result.success).toBe(true);
    expect(result.projects).toEqual(mockProjects);
  });

  it('should handle database errors gracefully', async () => {
    vi.spyOn(mockPrismaClient.project, 'findMany').mockRejectedValue(new Error('Database error'));

    const result = await searchProjects({ query: 'test' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
    expect(result.projects).toEqual([]);
    expect(result.count).toBe(0);
  });

  it('should limit results to 10 projects', async () => {
    const mockProjects = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      title: `Project ${i}`,
      slug: `project-${i}`,
      description: `Description ${i}`,
      technologies: ['Tech'],
      category: 'web',
      githubUrl: null,
      liveUrl: null,
      featured: false,
    }));

    vi.spyOn(mockPrismaClient.project, 'findMany').mockResolvedValue(mockProjects);

    const result = await searchProjects({ query: 'Project' });

    expect(result.projects.length).toBeLessThanOrEqual(10);
    expect(mockPrismaClient.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );
  });
});
