// GitHub API types based on TECHNICAL_DOCUMENTATION.md Section 3.4 and 5.1.8
import { z } from 'zod';

/**
 * GitHub repository data from GitHub API
 */
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null | undefined;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  languages_url: string;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  archived: boolean;
  disabled: boolean;
  fork: boolean;
  private: boolean;
}

/**
 * GitHub language breakdown response
 */
export interface GitHubLanguages {
  [language: string]: number; // language name -> bytes of code
}

/**
 * Repository analysis result
 */
export interface RepositoryAnalysis {
  id: number;
  name: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string | null;
  technologies: string[];
  category: string;
  githubUrl: string;
  liveUrl: string | null;
  imageUrl: string | null;
  githubStars: number;
  githubForks: number;
  lastCommit: Date;
  featured: boolean;
  shouldImport: boolean;
}

/**
 * Sync job result
 */
export interface GitHubSyncResult {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  repositoriesAnalyzed: number;
  repositoriesImported: number;
  repositoriesUpdated: number;
  errors: string[];
}

/**
 * Response schema for POST /api/github/sync
 */
export interface GitHubSyncResponse {
  jobId: string;
  status: string;
  message: string;
}

/**
 * Zod schema for GitHub sync response
 */
export const githubSyncResponseSchema = z.object({
  jobId: z.string(),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  message: z.string(),
});
