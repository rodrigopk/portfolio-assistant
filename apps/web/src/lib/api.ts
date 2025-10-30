import type { ProjectsListResponse, ProjectsQueryParams, ProjectDetail } from '../types/project';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
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
        error.error?.code,
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

    return fetchApi<ProjectsListResponse>(endpoint);
  },

  async getProjectBySlug(slug: string): Promise<ProjectDetail> {
    return fetchApi<ProjectDetail>(`/api/projects/${slug}`);
  },
};

export { ApiError };
