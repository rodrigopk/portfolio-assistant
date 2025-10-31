/**
 * E2E Test Setup
 * Global setup and teardown for Playwright tests
 * Handles test data seeding, cleanup, and environment validation
 */

import type { FullConfig, Page, Response, Route } from '@playwright/test';

/**
 * API Configuration
 */
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Test data for seeding
 */
export const TEST_PROJECTS = [
  {
    id: 'test-project-1',
    title: 'E-Commerce Platform',
    slug: 'e-commerce-platform',
    description: 'A full-stack e-commerce platform with real-time inventory',
    technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    featured: true,
    category: 'Web Application',
    githubUrl: 'https://github.com/test/ecommerce',
    liveUrl: 'https://ecommerce.example.com',
    imageUrl: '/images/ecommerce.jpg',
    githubStars: 142,
    githubForks: 23,
  },
  {
    id: 'test-project-2',
    title: 'Task Management App',
    slug: 'task-management-app',
    description: 'A collaborative task management application',
    technologies: ['React', 'TypeScript', 'Express'],
    featured: false,
    category: 'Productivity',
    githubUrl: 'https://github.com/test/tasks',
    liveUrl: null,
    imageUrl: null,
    githubStars: 45,
    githubForks: 8,
  },
  {
    id: 'test-project-3',
    title: 'Weather Dashboard',
    slug: 'weather-dashboard',
    description: 'Real-time weather visualization dashboard',
    technologies: ['Vue', 'JavaScript', 'D3.js'],
    featured: true,
    category: 'Data Visualization',
    githubUrl: 'https://github.com/test/weather',
    liveUrl: 'https://weather.example.com',
    imageUrl: '/images/weather.jpg',
    githubStars: 89,
    githubForks: 15,
  },
];

export const TEST_CATEGORIES = ['Web Application', 'Productivity', 'Data Visualization'];
export const TEST_TECHNOLOGIES = [
  'React',
  'TypeScript',
  'Node.js',
  'PostgreSQL',
  'Express',
  'Vue',
  'JavaScript',
  'D3.js',
];

/**
 * Check if API is ready
 */
async function waitForApi(maxAttempts = 30, delayMs = 1000): Promise<boolean> {
  console.log('Waiting for API to be ready...');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
      });

      if (response.ok) {
        console.log('API is ready!');
        return true;
      }
    } catch {
      // API not ready yet
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.error('API failed to become ready in time');
  return false;
}

/**
 * Seed test data
 */
async function seedTestData(): Promise<void> {
  try {
    // Note: This is a placeholder implementation
    // In a real scenario, you would call your API endpoints to seed data
    // or connect directly to the database

    console.log('Test data seeding would happen here');
    console.log('In production, this would:');
    console.log('1. Clear existing test data');
    console.log('2. Seed projects, categories, and technologies');
    console.log('3. Set up test users if needed');

    // Example: If you have a seed endpoint
    // await fetch(`${API_BASE_URL}/api/test/seed`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ projects: TEST_PROJECTS }),
    // });
  } catch (error) {
    console.error('Failed to seed test data:', error);
    throw error;
  }
}

/**
 * Cleanup test data
 */
async function cleanupTestData(): Promise<void> {
  try {
    console.log('Test data cleanup would happen here');
    console.log('In production, this would:');
    console.log('1. Remove all test data');
    console.log('2. Reset database state');
    console.log('3. Clear any cached data');

    // Example: If you have a cleanup endpoint
    // await fetch(`${API_BASE_URL}/api/test/cleanup`, {
    //   method: 'POST',
    // });
  } catch (error) {
    console.error('Failed to cleanup test data:', error);
    // Don't throw here - we want tests to continue even if cleanup fails
  }
}

/**
 * Global setup function
 * Runs once before all tests
 */
export default async function globalSetup(config: FullConfig) {
  console.log('=== E2E Test Setup ===');
  console.log(`Base URL: ${config.projects[0]?.use?.baseURL || 'Not configured'}`);
  console.log(`API URL: ${API_BASE_URL}`);

  // Wait for API to be ready
  const apiReady = await waitForApi();
  if (!apiReady) {
    throw new Error('API is not ready - cannot run tests');
  }

  // Seed test data
  await seedTestData();

  console.log('=== Setup Complete ===');
}

/**
 * Global teardown function
 * Runs once after all tests
 */
export async function globalTeardown() {
  console.log('=== E2E Test Teardown ===');

  // Cleanup test data
  await cleanupTestData();

  console.log('=== Teardown Complete ===');
}

/**
 * Test utilities
 */
export const testUtils = {
  /**
   * Wait for element with retry
   */
  async waitForSelector(page: Page, selector: string, timeout = 5000): Promise<void> {
    await page.waitForSelector(selector, { timeout });
  },

  /**
   * Get API response from network
   */
  async waitForApiResponse(page: Page, urlPattern: string | RegExp): Promise<Response> {
    return page.waitForResponse((response: Response) => {
      const url = response.url();
      return typeof urlPattern === 'string' ? url.includes(urlPattern) : urlPattern.test(url);
    });
  },

  /**
   * Mock API response
   */
  async mockApiResponse(
    page: Page,
    urlPattern: string | RegExp,
    responseData: unknown
  ): Promise<void> {
    await page.route(urlPattern, (route: Route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responseData),
      });
    });
  },

  /**
   * Mock API error
   */
  async mockApiError(page: Page, urlPattern: string | RegExp, status = 500): Promise<void> {
    await page.route(urlPattern, (route: Route) => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An error occurred while processing your request',
          },
        }),
      });
    });
  },

  /**
   * Take screenshot with name
   */
  async screenshot(page: Page, name: string): Promise<void> {
    await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  },
};
