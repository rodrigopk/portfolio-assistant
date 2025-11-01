import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getProjectDetails } from '../tools/getProjectDetails';

const mockPrismaClient = {
  project: {
    findFirst: vi.fn(),
  },
};

// Mock getPrismaClient
vi.mock('../lib/prisma', () => ({
  getPrismaClient: vi.fn(() => mockPrismaClient),
}));

describe('getProjectDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should retrieve project by ID', async () => {
    const mockProject = {
      id: '123',
      title: 'Test Project',
      slug: 'test-project',
      description: 'A test project',
      longDescription: 'Detailed description',
      technologies: ['React', 'Node.js'],
      featured: true,
      category: 'web',
      githubUrl: 'https://github.com/test/project',
      liveUrl: 'https://test.com',
      imageUrl: 'https://test.com/image.jpg',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      githubStars: 42,
      githubForks: 10,
      lastCommit: new Date('2023-12-30'),
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(mockPrismaClient.project, 'findFirst').mockResolvedValue(mockProject);

    const result = await getProjectDetails({ projectId: '123' });

    expect(result.success).toBe(true);
    expect(result.project).toEqual(mockProject);
    expect(mockPrismaClient.project.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ id: '123' }, { slug: '123' }],
      },
    });
  });

  it('should retrieve project by slug', async () => {
    const mockProject = {
      id: '456',
      title: 'Slugged Project',
      slug: 'slugged-project',
      description: 'Project with slug',
      longDescription: null,
      technologies: ['Vue'],
      featured: false,
      category: 'web',
      githubUrl: null,
      liveUrl: null,
      imageUrl: null,
      startDate: null,
      endDate: null,
      githubStars: null,
      githubForks: null,
      lastCommit: null,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(mockPrismaClient.project, 'findFirst').mockResolvedValue(mockProject);

    const result = await getProjectDetails({ projectId: 'slugged-project' });

    expect(result.success).toBe(true);
    expect(result.project).toEqual(mockProject);
    expect(mockPrismaClient.project.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ id: 'slugged-project' }, { slug: 'slugged-project' }],
      },
    });
  });

  it('should return error when project not found', async () => {
    vi.spyOn(mockPrismaClient.project, 'findFirst').mockResolvedValue(null);

    const result = await getProjectDetails({ projectId: 'nonexistent' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Project not found');
    expect(result.project).toBeNull();
  });

  it('should handle database errors gracefully', async () => {
    vi.spyOn(mockPrismaClient.project, 'findFirst').mockRejectedValue(
      new Error('Connection timeout')
    );

    const result = await getProjectDetails({ projectId: '123' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Connection timeout');
    expect(result.project).toBeNull();
  });

  it('should handle empty projectId', async () => {
    vi.spyOn(mockPrismaClient.project, 'findFirst').mockResolvedValue(null);

    const result = await getProjectDetails({ projectId: '' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Project not found');
  });
});
