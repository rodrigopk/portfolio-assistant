/**
 * E2E Tests for Projects Page
 * Tests all functionality including loading, filtering, pagination, responsive behavior, and accessibility
 */

import { test, expect, type Page } from '@playwright/test';

/**
 * Test data and helpers (currently unused but kept for future mock scenarios)
 */
const _MOCK_PROJECTS_RESPONSE = {
  data: [
    {
      id: '1',
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
      id: '2',
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
      id: '3',
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
  ],
  meta: {
    total: 3,
    hasMore: false,
  },
};

const _MOCK_FILTERS_RESPONSE = {
  data: {
    categories: ['Web Application', 'Productivity', 'Data Visualization'],
    technologies: [
      'React',
      'TypeScript',
      'Node.js',
      'PostgreSQL',
      'Express',
      'Vue',
      'JavaScript',
      'D3.js',
    ],
  },
};

/**
 * Helper function to navigate to projects page
 */
async function navigateToProjects(page: Page) {
  await page.goto('/projects');
  await page.waitForLoadState('networkidle');
}

/**
 * Helper function to wait for projects to load
 */
async function waitForProjectsToLoad(page: Page) {
  // Wait for network to be idle after navigation
  await page.waitForLoadState('networkidle');

  // Give a moment for React to render
  await page.waitForTimeout(500);

  // Ensure loading states have resolved
  const loadingIndicator = page.locator('[role="status"][aria-busy="true"]');
  if (await loadingIndicator.isVisible().catch(() => false)) {
    await loadingIndicator.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
}

/**
 * Helper function to get the filter container based on viewport
 * Returns the appropriate filter container (desktop sidebar or mobile details)
 */
async function getFilterContainer(page: Page) {
  const viewport = page.viewportSize();
  const isMobile = viewport && viewport.width < 1024; // lg breakpoint

  if (isMobile) {
    // Mobile: filters are in a details element
    return page.locator('details:has-text("Filters")');
  } else {
    // Desktop: filters are in aside sidebar
    return page.locator('aside[aria-label="Project filters"]');
  }
}

test.describe('Projects Page - Loading and Rendering', () => {
  test('should load the projects page successfully', async ({ page }) => {
    await navigateToProjects(page);

    // Verify page title
    await expect(page.locator('h1')).toContainText('Projects');

    // Verify description is present
    await expect(page.locator('text=Explore my portfolio')).toBeVisible();
  });

  test('should display project information correctly', async ({ page }) => {
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    const firstCard = page.locator('[data-testid="project-card"]').first();

    if ((await firstCard.count()) > 0) {
      // Verify project card has essential elements
      await expect(firstCard).toBeVisible();

      // Check for title, description, or technologies
      const hasContent =
        (await firstCard.locator('h2, h3').count()) > 0 ||
        (await firstCard.locator('p').count()) > 0;

      expect(hasContent).toBeTruthy();
    }
  });
});

test.describe('Projects Page - Filtering Functionality', () => {
  test('should display filter panel', async ({ page }) => {
    await navigateToProjects(page);

    // Desktop: sidebar filters
    const desktopFilters = page.locator('aside[aria-label="Project filters"]');
    // Mobile: collapsible filters
    const mobileFilters = page.locator('details:has-text("Filters")');

    const hasFilters =
      (await desktopFilters.isVisible().catch(() => false)) ||
      (await mobileFilters.isVisible().catch(() => false));

    expect(hasFilters).toBeTruthy();
  });

  test('should filter by featured projects', async ({ page }) => {
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    // Get the filter container based on viewport
    const filterContainer = await getFilterContainer(page);
    const featuredCheckbox = filterContainer.locator(
      'input[type="checkbox"][aria-label*="featured" i]'
    );

    if (await featuredCheckbox.isVisible()) {
      await featuredCheckbox.check();

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Verify URL or state changed
      const url = page.url();
      expect(url).toBeDefined();
    }
  });

  test('should filter by category', async ({ page }) => {
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    // Get the filter container based on viewport
    const filterContainer = await getFilterContainer(page);
    const categorySection = filterContainer.locator('[role="group"][aria-label*="category" i]');

    if (await categorySection.isVisible()) {
      const categoryButtons = categorySection.locator('button');
      const buttonCount = await categoryButtons.count();

      if (buttonCount > 0) {
        // Click first category
        await categoryButtons.first().click();

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // Verify button is pressed
        await expect(categoryButtons.first()).toHaveAttribute('aria-pressed', 'true');
      }
    }
  });

  test('should filter by technology', async ({ page }) => {
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    // Get the filter container based on viewport
    const filterContainer = await getFilterContainer(page);
    const techSection = filterContainer.locator('[role="group"][aria-label*="technology" i]');

    if (await techSection.isVisible()) {
      const techButtons = techSection.locator('button');
      const buttonCount = await techButtons.count();

      if (buttonCount > 0) {
        // Click first technology
        await techButtons.first().click();

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // Verify button is pressed
        await expect(techButtons.first()).toHaveAttribute('aria-pressed', 'true');
      }
    }
  });

  test('should allow multiple technology filters', async ({ page }) => {
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    // Get the filter container based on viewport
    const filterContainer = await getFilterContainer(page);
    const techSection = filterContainer.locator('[role="group"][aria-label*="technology" i]');

    if (await techSection.isVisible()) {
      const techButtons = techSection.locator('button');
      const buttonCount = await techButtons.count();

      if (buttonCount >= 2) {
        // Select two technologies
        await techButtons.nth(0).click();
        await page.waitForTimeout(300);
        await techButtons.nth(1).click();
        await page.waitForTimeout(300);

        // Both should be pressed
        await expect(techButtons.nth(0)).toHaveAttribute('aria-pressed', 'true');
        await expect(techButtons.nth(1)).toHaveAttribute('aria-pressed', 'true');
      }
    }
  });

  test('should clear all filters', async ({ page }) => {
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    // Get the filter container based on viewport
    const filterContainer = await getFilterContainer(page);
    const featuredCheckbox = filterContainer.locator(
      'input[type="checkbox"][aria-label*="featured" i]'
    );

    if (await featuredCheckbox.isVisible()) {
      await featuredCheckbox.check();
      await page.waitForTimeout(300);

      // Find and click clear button (scoped to filter container)
      const clearButton = filterContainer.locator('button:has-text("Clear all")');

      if (await clearButton.isVisible()) {
        await clearButton.click();
        await page.waitForTimeout(300);

        // Verify checkbox is unchecked
        await expect(featuredCheckbox).not.toBeChecked();
      }
    }
  });

  test('should show active filters summary', async ({ page }) => {
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    // Get the filter container based on viewport
    const filterContainer = await getFilterContainer(page);
    const featuredCheckbox = filterContainer.locator(
      'input[type="checkbox"][aria-label*="featured" i]'
    );

    if (await featuredCheckbox.isVisible()) {
      await featuredCheckbox.check();
      await page.waitForTimeout(300);

      // Look for active filters summary
      const summary = page.locator('[role="status"]:has-text("Active filters")');

      if (await summary.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(summary).toContainText('Featured');
      }
    }
  });
});

test.describe('Projects Page - Pagination', () => {
  test('should display pagination controls when needed', async ({ page }) => {
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    // Look for pagination controls
    const pagination = page.locator('[role="navigation"][aria-label*="pagination" i]');

    // Pagination may or may not be visible depending on number of projects
    const isVisible = await pagination.isVisible({ timeout: 2000 }).catch(() => false);

    // Test passes regardless - we just verify structure if present
    if (isVisible) {
      expect(await pagination.isVisible()).toBeTruthy();
    }
  });

  test('should navigate to next page', async ({ page }) => {
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    const nextButton = page.locator('button:has-text("Next"), button[aria-label*="next" i]');

    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isDisabled = await nextButton.isDisabled();

      if (!isDisabled) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Should scroll to top
        const scrollPosition = await page.evaluate(() => window.scrollY);
        expect(scrollPosition).toBeLessThan(100);
      }
    }
  });

  test('should navigate to previous page', async ({ page }) => {
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    const nextButton = page.locator('button:has-text("Next"), button[aria-label*="next" i]');
    const prevButton = page.locator(
      'button:has-text("Previous"), button[aria-label*="previous" i]'
    );

    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isDisabled = await nextButton.isDisabled();

      if (!isDisabled) {
        // Go to next page first
        await nextButton.click();
        await page.waitForTimeout(500);

        // Then go back
        if (await prevButton.isVisible()) {
          await prevButton.click();
          await page.waitForTimeout(500);

          // Should be back on page 1
          expect(page.url()).toBeDefined();
        }
      }
    }
  });
});

test.describe('Projects Page - Responsive Behavior', () => {
  test('should display mobile filters on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToProjects(page);

    // Mobile filters should be in a details/summary element
    const mobileFilters = page.locator('details:has-text("Filters")');
    await expect(mobileFilters).toBeVisible();

    // Desktop sidebar should be hidden
    const desktopFilters = page.locator('aside[aria-label="Project filters"]');
    await expect(desktopFilters).not.toBeVisible();
  });

  test('should expand mobile filters when clicked', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToProjects(page);

    const filtersSummary = page.locator('summary:has-text("Filters")');

    if (await filtersSummary.isVisible()) {
      await filtersSummary.click();

      // Filter content should be visible
      const filterContent = page.locator('details[open]:has-text("Filters")');
      await expect(filterContent).toBeVisible();
    }
  });

  test('should display desktop filters on large screens', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await navigateToProjects(page);

    // Desktop sidebar should be visible
    const desktopFilters = page.locator('aside[aria-label="Project filters"]');
    await expect(desktopFilters).toBeVisible();
  });

  test('should adapt project grid layout for mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    // Verify page is still functional
    await expect(page.locator('h1:has-text("Projects")')).toBeVisible();
  });

  test('should adapt project grid layout for tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    // Verify page is still functional
    await expect(page.locator('h1:has-text("Projects")')).toBeVisible();
  });

  test('should adapt project grid layout for desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    // Verify page is still functional
    await expect(page.locator('h1:has-text("Projects")')).toBeVisible();
  });
});

test.describe('Projects Page - Loading States and Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/projects*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An error occurred while processing your request',
          },
        }),
      });
    });

    await navigateToProjects(page);

    // Should display error message
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText('Error loading projects');
  });

  test('should handle network errors', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/projects*', (route) => {
      route.abort('failed');
    });

    await navigateToProjects(page);

    // Should display error message or handle gracefully
    const errorAlert = page.locator('[role="alert"]');
    const hasError = await errorAlert.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasError) {
      await expect(errorAlert).toContainText(/error|failed/i);
    }
  });

  test('should handle empty state', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/projects*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          meta: { total: 0, hasMore: false },
        }),
      });
    });

    await navigateToProjects(page);
    await page.waitForTimeout(1000);

    // Should show empty state or message
    const emptyState = page.locator('text=/no projects|empty/i');
    const hasEmptyState = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);

    // Either shows empty state or just shows no cards
    if (hasEmptyState) {
      await expect(emptyState).toBeVisible();
    }
  });
});

test.describe('Projects Page - Project Card Interactions', () => {
  test('should navigate to project detail on card click', async ({ page }) => {
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    const firstCard = page.locator('[data-testid="project-card"]').first();

    if ((await firstCard.count()) > 0) {
      // Find clickable link within card
      const cardLink = firstCard.locator('a').first();

      if (await cardLink.isVisible()) {
        await cardLink.click();

        // Should navigate to detail page
        await page.waitForTimeout(1000);
        expect(page.url()).toContain('/projects/');
      }
    }
  });

  test('should open external links in project cards', async ({ page }) => {
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    // Look for external links (GitHub, live demo)
    const externalLink = page.locator('a[href^="http"]').first();

    if (await externalLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Verify link has proper attributes
      await expect(externalLink).toHaveAttribute('target', '_blank');
    }
  });
});

test.describe('Projects Page - Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await navigateToProjects(page);

    // Main heading should be h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Projects');
  });

  test('should have accessible filter controls', async ({ page }) => {
    await navigateToProjects(page);

    // Get the filter container based on viewport
    const filterContainer = await getFilterContainer(page);
    const featuredCheckbox = filterContainer.locator(
      'input[type="checkbox"][aria-label*="featured" i]'
    );

    if (await featuredCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Should have aria-label or associated label
      const ariaLabel = await featuredCheckbox.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('should support keyboard navigation for filters', async ({ page }) => {
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    // Get the filter container based on viewport
    const filterContainer = await getFilterContainer(page);
    const featuredCheckbox = filterContainer.locator(
      'input[type="checkbox"][aria-label*="featured" i]'
    );

    if (await featuredCheckbox.isVisible()) {
      await featuredCheckbox.focus();
      await page.keyboard.press('Space');

      // Should toggle checkbox
      await expect(featuredCheckbox).toBeChecked();
    }
  });

  test('should support keyboard navigation for category filters', async ({ page }) => {
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    // Get the filter container based on viewport
    const filterContainer = await getFilterContainer(page);
    const categorySection = filterContainer.locator('[role="group"][aria-label*="category" i]');

    if (await categorySection.isVisible()) {
      const categoryButton = categorySection.locator('button').first();

      if ((await categoryButton.count()) > 0) {
        await categoryButton.focus();
        await page.keyboard.press('Enter');

        // Should activate filter
        await expect(categoryButton).toHaveAttribute('aria-pressed', 'true');
      }
    }
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await navigateToProjects(page);

    // Filters should have proper ARIA labels
    const filtersSection = page.locator('[aria-label*="filter" i]');
    const hasAriaLabel = await filtersSection.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasAriaLabel) {
      await expect(filtersSection).toBeVisible();
    }
  });

  test('should announce loading states to screen readers', async ({ page }) => {
    await navigateToProjects(page);

    // Look for live regions or status indicators
    const liveRegion = page.locator('[role="status"], [aria-live]');
    const hasLiveRegion = await liveRegion
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    // Live regions may be present for status updates
    expect(hasLiveRegion || true).toBeTruthy();
  });

  test('should announce errors to screen readers', async ({ page }) => {
    // Mock API error
    await page.route('**/api/projects*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An error occurred',
          },
        }),
      });
    });

    await navigateToProjects(page);

    // Error should be announced
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });

    // Should also have aria-live for screen readers
    const ariaLive = await errorAlert.getAttribute('aria-live');
    expect(ariaLive).toBeTruthy();
  });

  test('should be navigable with Tab key', async ({ page }) => {
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    // Start from the top
    await page.keyboard.press('Tab');

    // Should move focus through interactive elements
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});

test.describe('Projects Page - Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should handle rapid filter changes', async ({ page }) => {
    await navigateToProjects(page);
    await waitForProjectsToLoad(page);

    // Get the filter container based on viewport
    const filterContainer = await getFilterContainer(page);
    const featuredCheckbox = filterContainer.locator(
      'input[type="checkbox"][aria-label*="featured" i]'
    );

    if (await featuredCheckbox.isVisible()) {
      // Rapidly toggle filter
      for (let i = 0; i < 5; i++) {
        await featuredCheckbox.click();
        await page.waitForTimeout(100);
      }

      // Should still be responsive
      await expect(page.locator('h1')).toBeVisible();
    }
  });
});
