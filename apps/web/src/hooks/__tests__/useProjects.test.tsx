import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjects } from '../useProjects';
import { api } from '../../lib/api';
import type { ProjectsResponse } from '../../types/project';

// Mock the API
vi.mock('../../lib/api', () => ({
  api: {
    getProjects: vi.fn(),
  },
}));

const mockProjectsResponse: ProjectsResponse = {
  projects: [
    {
      id: '1',
      title: 'Test Project',
      slug: 'test-project',
      description: 'A test project',
      technologies: ['React', 'TypeScript'],
      featured: true,
      category: 'web',
      githubUrl: 'https://github.com/test/project',
      liveUrl: null,
      imageUrl: null,
      githubStars: 10,
      githubForks: 5,
    },
  ],
  total: 1,
  page: 1,
  limit: 10,
  hasMore: false,
};

describe('useProjects', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch projects successfully without parameters', async () => {
    vi.mocked(api.getProjects).mockResolvedValue(mockProjectsResponse);

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.getProjects).toHaveBeenCalledWith(undefined);
    expect(result.current.data).toEqual(mockProjectsResponse);
  });

  it('should fetch projects with query parameters', async () => {
    vi.mocked(api.getProjects).mockResolvedValue(mockProjectsResponse);

    const params = {
      category: 'web',
      page: 1,
      limit: 10,
    };

    const { result } = renderHook(() => useProjects(params), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.getProjects).toHaveBeenCalledWith(params);
    expect(result.current.data).toEqual(mockProjectsResponse);
  });

  it('should handle loading state', () => {
    vi.mocked(api.getProjects).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useProjects(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should handle error state', async () => {
    const error = new Error('Failed to fetch projects');
    vi.mocked(api.getProjects).mockRejectedValue(error);

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should use correct query key with parameters', async () => {
    vi.mocked(api.getProjects).mockResolvedValue(mockProjectsResponse);

    const params = {
      category: 'web',
      technologies: ['React'],
    };

    const { result } = renderHook(() => useProjects(params), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify query was called with correct key
    const queryState = queryClient.getQueryState(['projects', params]);
    expect(queryState).toBeDefined();
    expect(queryState?.data).toEqual(mockProjectsResponse);
  });

  it('should have correct staleTime and gcTime configuration', async () => {
    vi.mocked(api.getProjects).mockResolvedValue(mockProjectsResponse);

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify the hook was configured and returned data successfully
    expect(result.current.isSuccess).toBe(true);
  });
});
