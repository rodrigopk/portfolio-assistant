export interface ProjectSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  technologies: string[];
  featured: boolean;
  category: string;
  githubUrl: string | null;
  liveUrl: string | null;
  imageUrl: string | null;
  githubStars: number | null;
  githubForks: number | null;
}

export interface ProjectDetail extends ProjectSummary {
  longDescription: string | null;
  startDate: string | null;
  endDate: string | null;
  lastCommit: string | null;
}

export interface ProjectsListResponse {
  projects: ProjectSummary[];
  total: number;
  hasMore: boolean;
}

export interface ProjectFilters {
  categories: string[];
  technologies: string[];
}

export interface ProjectsQueryParams {
  featured?: boolean;
  category?: string;
  tech?: string[];
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T> {
  data?: T;
  meta?: {
    total?: number;
    hasMore?: boolean;
    limit?: number;
    offset?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
