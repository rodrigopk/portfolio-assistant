import type {
  ProjectsListResponse,
  ProjectsQueryParams,
  ProjectDetail,
  ProjectFilters,
  ProjectSummary,
} from '../types/project';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Custom error class for API errors
 * Extends Error to include HTTP status and error code
 */
class ApiError extends Error {
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
  status: number;
  code?: string;
}

/**
 * Generic fetch wrapper for API calls
 * Handles request formatting, response parsing, and error handling
 *
 * @template T - The expected response type
 * @param endpoint - The API endpoint path (e.g., '/api/projects')
 * @param options - Optional fetch request options
 * @returns Promise resolving to the parsed response data
 * @throws {ApiError} When the API request fails
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.error?.message || 'An error occurred',
        response.status,
        error.error?.code
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error occurred', 0);
  }
}

/**
 * API client for interacting with the backend
 * Provides methods for fetching projects, project details, and filter options
 */
export const api = {
  /**
   * Fetch a list of projects with optional filtering and pagination
   *
   * @param params - Optional query parameters for filtering and pagination
   * @returns Promise resolving to projects list with metadata
   */
  async getProjects(params?: ProjectsQueryParams): Promise<ProjectsListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.featured !== undefined) {
      queryParams.append('featured', String(params.featured));
    }
    if (params?.category) {
      queryParams.append('category', params.category);
    }
    if (params?.tech && params.tech.length > 0) {
      queryParams.append('tech', params.tech.join(','));
    }
    if (params?.limit) {
      queryParams.append('limit', String(params.limit));
    }
    if (params?.offset) {
      queryParams.append('offset', String(params.offset));
    }

    const query = queryParams.toString();
    const endpoint = `/api/projects${query ? `?${query}` : ''}`;

    const response = await fetchApi<{
      data: ProjectSummary[];
      meta: { total: number; hasMore: boolean };
    }>(endpoint);

    // Transform backend ApiResponse format to frontend expected format
    return {
      projects: response.data || [],
      total: response.meta?.total || 0,
      hasMore: response.meta?.hasMore || false,
    };
  },

  /**
   * Fetch detailed information for a specific project
   *
   * @param slug - The unique slug identifier for the project
   * @returns Promise resolving to project details
   */
  async getProjectBySlug(slug: string): Promise<ProjectDetail> {
    const response = await fetchApi<{ data: ProjectDetail }>(`/api/projects/${slug}`);
    return response.data;
  },

  /**
   * Fetch available filter options (categories and technologies)
   *
   * @returns Promise resolving to unique categories and technologies
   */
  async getProjectFilters(): Promise<ProjectFilters> {
    const response = await fetchApi<{ data: ProjectFilters }>('/api/projects/filters');
    return response.data;
  },
};

export { ApiError };
