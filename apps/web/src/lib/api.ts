import type {
  ProjectsListResponse,
  ProjectsQueryParams,
  ProjectDetail,
  ProjectFilters,
  ProjectSummary,
} from '../types/project';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

export const api = {
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

  async getProjectBySlug(slug: string): Promise<ProjectDetail> {
    const response = await fetchApi<{ data: ProjectDetail }>(`/api/projects/${slug}`);
    return response.data;
  },

  async getProjectFilters(): Promise<ProjectFilters> {
    const response = await fetchApi<{ data: ProjectFilters }>('/api/projects/filters');
    return response.data;
  },
};

export { ApiError };
