// Project API types based on TECHNICAL_DOCUMENTATION.md Section 5.1.2
import { z } from 'zod';

/**
 * Zod schema for validating GET /api/projects query parameters
 */
export const projectsQuerySchema = z.object({
  featured: z
    .string()
    .optional()
    .transform((val: string | undefined) => val === 'true'),
  category: z.string().optional(),
  tech: z
    .string()
    .optional()
    .transform((val: string | undefined) => (val ? val.split(',').map((t: string) => t.trim()) : undefined)),
  limit: z
    .string()
    .optional()
    .transform((val: string | undefined) => (val ? parseInt(val, 10) : 20))
    .refine((val: number) => val > 0 && val <= 100, { message: 'Limit must be between 1 and 100' }),
  offset: z
    .string()
    .optional()
    .transform((val: string | undefined) => (val ? parseInt(val, 10) : 0))
    .refine((val: number) => val >= 0, { message: 'Offset must be non-negative' }),
});

export type ProjectsQueryParams = {
  featured?: boolean;
  category?: string;
  tech?: string[];
  limit?: number;
  offset?: number;
};

/**
 * Zod schema for validating project slug parameter
 */
export const projectSlugSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export type ProjectSlugParams = z.infer<typeof projectSlugSchema>;

/**
 * Project response schema for list view (summary)
 * As specified in API documentation Section 5.1.2
 */
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

/**
 * Project response schema for detail view
 * As specified in API documentation Section 5.1.2
 */
export interface ProjectDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string | null;
  technologies: string[];
  featured: boolean;
  category: string;
  githubUrl: string | null;
  liveUrl: string | null;
  imageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  githubStars: number | null;
  githubForks: number | null;
  lastCommit: string | null;
}

/**
 * Response schema for GET /api/projects
 */
export interface ProjectsListResponse {
  projects: ProjectSummary[];
  total: number;
  hasMore: boolean;
}

/**
 * Full Project model from database
 */
export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string | null;
  technologies: string[];
  featured: boolean;
  category: string;
  githubUrl: string | null;
  liveUrl: string | null;
  imageUrl: string | null;
  startDate: Date | null;
  endDate: Date | null;
  githubStars: number | null;
  githubForks: number | null;
  lastCommit: Date | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
