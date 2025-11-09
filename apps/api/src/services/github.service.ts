// eslint-disable-next-line import/no-unresolved
import { Octokit } from '@octokit/rest';
import { v4 as uuidv4 } from 'uuid';

import { prisma } from '../lib/prisma';
import { cache } from '../lib/redis';
import {
  GitHubLanguages,
  GitHubRepository,
  GitHubSyncResult,
  RepositoryAnalysis,
} from '../types/github.types';
import { logger } from '../utils/logger';

const GITHUB_TOKEN = process.env['GITHUB_TOKEN'];
const GITHUB_USERNAME = process.env['GITHUB_USERNAME'];
const SYNC_RESULTS_CACHE_PREFIX = 'github:sync:';
const SYNC_RESULTS_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * GitHub Service
 * Handles GitHub API interactions and repository synchronization
 * Per TECHNICAL_DOCUMENTATION.md Section 3.4
 */
export class GitHubService {
  private octokit: Octokit | null = null;

  constructor() {
    // Lazy initialization - octokit will be created when first needed
  }

  /**
   * Get or create Octokit instance
   * Validates environment variables on first use
   */
  private getOctokit(): Octokit {
    if (this.octokit) {
      return this.octokit;
    }

    if (!GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }
    if (!GITHUB_USERNAME) {
      throw new Error('GITHUB_USERNAME environment variable is required');
    }

    this.octokit = new Octokit({
      auth: GITHUB_TOKEN,
    });

    return this.octokit;
  }

  /**
   * Trigger GitHub sync job
   * Creates a job ID and starts the sync process
   * Per TECHNICAL_DOCUMENTATION.md Section 5.1.8
   */
  async triggerSync(): Promise<{ jobId: string; status: string }> {
    const jobId = uuidv4();
    const syncResult: GitHubSyncResult = {
      jobId,
      status: 'queued',
      startedAt: new Date(),
      repositoriesAnalyzed: 0,
      repositoriesImported: 0,
      repositoriesUpdated: 0,
      errors: [],
    };

    // Store initial sync result in cache
    await cache.set(`${SYNC_RESULTS_CACHE_PREFIX}${jobId}`, syncResult, SYNC_RESULTS_TTL_SECONDS);

    // Start sync process asynchronously (in production, this would use Bull queue)
    this.performSync(jobId).catch((error) => {
      logger.error('Error in sync process:', error);
    });

    logger.info('GitHub sync job triggered', { jobId });
    return { jobId, status: 'queued' };
  }

  /**
   * Perform the actual GitHub sync
   * Fetches repositories and updates database
   * Per TECHNICAL_DOCUMENTATION.md Section 3.4.1
   */
  private async performSync(jobId: string): Promise<void> {
    try {
      // Update status to processing
      const syncResult = await this.getSyncResult(jobId);
      if (!syncResult) {
        logger.error('Sync result not found', { jobId });
        return;
      }

      syncResult.status = 'processing';
      await cache.set(`${SYNC_RESULTS_CACHE_PREFIX}${jobId}`, syncResult, SYNC_RESULTS_TTL_SECONDS);

      logger.info('Starting GitHub sync', { jobId });

      // Fetch all repositories for the user
      const repositories = await this.fetchAllRepositories();
      syncResult.repositoriesAnalyzed = repositories.length;

      logger.info('Repositories fetched from GitHub', {
        jobId,
        count: repositories.length,
      });

      // Analyze each repository
      for (const repo of repositories) {
        try {
          const analysis = await this.analyzeRepository(repo);

          if (!analysis.shouldImport) {
            logger.debug('Skipping repository', { name: repo.name });
            continue;
          }

          // Check if project already exists
          const existingProject = await prisma.project.findFirst({
            where: {
              OR: [{ githubUrl: analysis.githubUrl }, { slug: analysis.slug }],
            },
          });

          if (existingProject) {
            // Update existing project
            await prisma.project.update({
              where: { id: existingProject.id },
              data: {
                title: analysis.title,
                description: analysis.description,
                longDescription: analysis.longDescription,
                technologies: analysis.technologies,
                githubUrl: analysis.githubUrl,
                liveUrl: analysis.liveUrl,
                githubStars: analysis.githubStars,
                githubForks: analysis.githubForks,
                lastCommit: analysis.lastCommit,
                updatedAt: new Date(),
              },
            });

            syncResult.repositoriesUpdated++;
            logger.info('Project updated from GitHub', {
              slug: analysis.slug,
              stars: analysis.githubStars,
            });
          } else {
            // Create new project
            await prisma.project.create({
              data: {
                title: analysis.title,
                slug: analysis.slug,
                description: analysis.description,
                longDescription: analysis.longDescription,
                technologies: analysis.technologies,
                featured: analysis.featured,
                category: analysis.category,
                githubUrl: analysis.githubUrl,
                liveUrl: analysis.liveUrl,
                imageUrl: analysis.imageUrl,
                githubStars: analysis.githubStars,
                githubForks: analysis.githubForks,
                lastCommit: analysis.lastCommit,
                order: 0,
              },
            });

            syncResult.repositoriesImported++;
            logger.info('Project imported from GitHub', {
              slug: analysis.slug,
              stars: analysis.githubStars,
            });
          }

          // Invalidate project caches
          await cache.delPattern('projects:*');
        } catch (error) {
          const errorMessage = `Error processing repository ${repo.name}: ${error}`;
          logger.error(errorMessage);
          syncResult.errors.push(errorMessage);
        }
      }

      // Mark sync as completed
      syncResult.status = 'completed';
      syncResult.completedAt = new Date();
      await cache.set(`${SYNC_RESULTS_CACHE_PREFIX}${jobId}`, syncResult, SYNC_RESULTS_TTL_SECONDS);

      logger.info('GitHub sync completed', {
        jobId,
        imported: syncResult.repositoriesImported,
        updated: syncResult.repositoriesUpdated,
        errors: syncResult.errors.length,
      });
    } catch (error) {
      logger.error('Fatal error in GitHub sync:', error);

      // Update sync result with error
      const syncResult = await this.getSyncResult(jobId);
      if (syncResult) {
        syncResult.status = 'failed';
        syncResult.completedAt = new Date();
        syncResult.errors.push(`Fatal error: ${error}`);
        await cache.set(
          `${SYNC_RESULTS_CACHE_PREFIX}${jobId}`,
          syncResult,
          SYNC_RESULTS_TTL_SECONDS
        );
      }
    }
  }

  /**
   * Fetch all repositories for the configured user
   * Per TECHNICAL_DOCUMENTATION.md Section 3.4.1
   */
  private async fetchAllRepositories(): Promise<GitHubRepository[]> {
    try {
      const repositories: GitHubRepository[] = [];
      let page = 1;
      const perPage = 100;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const response = await this.getOctokit().repos.listForUser({
          username: GITHUB_USERNAME!,
          per_page: perPage,
          page,
          sort: 'updated',
          direction: 'desc',
        });

        repositories.push(...(response.data as GitHubRepository[]));

        if (response.data.length < perPage) {
          break;
        }

        page++;
      }

      // Filter out forks, archived, and disabled repositories
      return repositories.filter(
        (repo: GitHubRepository) => !repo.fork && !repo.archived && !repo.disabled && !repo.private
      );
    } catch (error) {
      logger.error('Error fetching repositories from GitHub:', error);
      throw error;
    }
  }

  /**
   * Analyze a repository and extract project information
   * Per TECHNICAL_DOCUMENTATION.md Section 3.4.2
   */
  private async analyzeRepository(repo: GitHubRepository): Promise<RepositoryAnalysis> {
    try {
      // Fetch language breakdown
      const languages = await this.fetchLanguages(repo.full_name);
      const technologies = Object.keys(languages).filter((lang) => lang !== 'Other');

      // Determine category based on languages and topics
      const category = this.determineCategory(languages, repo.topics);

      // Generate slug from repository name
      const slug = repo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // Determine if repository should be featured (e.g., high stars, recent activity)
      const featured = repo.stargazers_count >= 10;

      // Check if repository should be imported (has meaningful content)
      const shouldImport = this.shouldImportRepository(repo);

      const analysis: RepositoryAnalysis = {
        id: repo.id,
        name: repo.name,
        slug,
        title: this.formatTitle(repo.name),
        description: repo.description || `A ${repo.language || 'software'} project`,
        longDescription: repo.description,
        technologies,
        category,
        githubUrl: repo.html_url,
        liveUrl: repo.homepage || null,
        imageUrl: null, // Could be extracted from README in the future
        githubStars: repo.stargazers_count,
        githubForks: repo.forks_count,
        lastCommit: new Date(repo.pushed_at),
        featured,
        shouldImport,
      };

      return analysis;
    } catch (error) {
      logger.error('Error analyzing repository:', { repo: repo.name, error });
      throw error;
    }
  }

  /**
   * Fetch language breakdown for a repository
   */
  private async fetchLanguages(fullName: string): Promise<GitHubLanguages> {
    try {
      const [owner, repo] = fullName.split('/');
      if (!owner || !repo) {
        return {};
      }
      const response = await this.getOctokit().repos.listLanguages({
        owner,
        repo,
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching languages:', { fullName, error });
      return {};
    }
  }

  /**
   * Determine project category based on languages and topics
   * Per TECHNICAL_DOCUMENTATION.md Section 3.4.2
   */
  private determineCategory(languages: GitHubLanguages, topics: string[]): string {
    // Check topics first
    if (topics.includes('mobile') || topics.includes('ios') || topics.includes('android')) {
      return 'mobile';
    }
    if (topics.includes('backend') || topics.includes('api')) {
      return 'backend';
    }
    if (topics.includes('frontend') || topics.includes('web')) {
      return 'web';
    }
    if (topics.includes('cli') || topics.includes('tool')) {
      return 'tool';
    }

    // Check languages
    const languageNames = Object.keys(languages);
    if (
      languageNames.some((lang) =>
        ['TypeScript', 'JavaScript', 'HTML', 'CSS', 'Vue', 'React'].includes(lang)
      )
    ) {
      return 'web';
    }
    if (languageNames.some((lang) => ['Swift', 'Kotlin', 'Java', 'Dart'].includes(lang))) {
      return 'mobile';
    }
    if (languageNames.some((lang) => ['Python', 'Ruby', 'Go', 'Rust', 'Java'].includes(lang))) {
      return 'backend';
    }

    return 'other';
  }

  /**
   * Determine if repository should be imported
   * Per TECHNICAL_DOCUMENTATION.md Section 3.4.3
   */
  private shouldImportRepository(repo: GitHubRepository): boolean {
    // Don't import if no description
    if (!repo.description || repo.description.trim().length === 0) {
      return false;
    }

    // Don't import if no activity in 3+ years
    const lastUpdated = new Date(repo.pushed_at);
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    if (lastUpdated < threeYearsAgo) {
      return false;
    }

    // Import if it has stars or forks (shows community interest)
    if (repo.stargazers_count > 0 || repo.forks_count > 0) {
      return true;
    }

    // Import if recently updated (within 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (lastUpdated > sixMonthsAgo) {
      return true;
    }

    return false;
  }

  /**
   * Format repository name to a readable title
   */
  private formatTitle(name: string): string {
    return name
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get sync result by job ID
   */
  async getSyncResult(jobId: string): Promise<GitHubSyncResult | null> {
    return await cache.get<GitHubSyncResult>(`${SYNC_RESULTS_CACHE_PREFIX}${jobId}`);
  }
}

// Export singleton instance
export const githubService = new GitHubService();
