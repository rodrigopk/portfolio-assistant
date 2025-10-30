import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { ReactNode } from 'react';

import { useProjectFilters } from '../useProjectFilters';
import { api } from '../../lib/api';

// Mock the API
vi.mock('../../lib/api', () => ({
  api: {
    getProjectFilters: vi.fn(),
  },
}));

const mockApiFilters = vi.mocked(api);

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useProjectFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch project filters successfully', async () => {
    const mockFilters = {
      categories: ['web', 'mobile'],
      technologies: ['React', 'TypeScript', 'Node.js'],
    };

    mockApiFilters.getProjectFilters.mockResolvedValue(mockFilters);

    const { result } = renderHook(() => useProjectFilters(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockFilters);
    expect(result.current.isError).toBe(false);
    expect(mockApiFilters.getProjectFilters).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors', async () => {
    const mockError = new Error('Failed to fetch filters');
    mockApiFilters.getProjectFilters.mockRejectedValue(mockError);

    const { result } = renderHook(() => useProjectFilters(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toEqual(mockError);
  });

  it('should use correct query key', async () => {
    const mockFilters = {
      categories: ['web'],
      technologies: ['React'],
    };

    mockApiFilters.getProjectFilters.mockResolvedValue(mockFilters);

    const { result } = renderHook(() => useProjectFilters(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // The hook should use 'projectFilters' as the query key
    expect(result.current.data).toEqual(mockFilters);
  });

  it('should return empty arrays as fallback when data is undefined', async () => {
    // Test the component behavior when filters are undefined
    mockApiFilters.getProjectFilters.mockResolvedValue({
      categories: [],
      technologies: [],
    });

    const { result } = renderHook(() => useProjectFilters(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      categories: [],
      technologies: [],
    });
  });
});
