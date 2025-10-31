# E2E Testing Documentation

This directory contains end-to-end (E2E) tests for the portfolio web application using Playwright.

## Overview

The E2E tests validate the Projects page functionality, including:

- Page loading and rendering
- Filtering by category, technology, and featured status
- Pagination functionality
- Responsive behavior (mobile/desktop/tablet)
- Loading states and error handling
- Project card interactions
- Accessibility (keyboard navigation, screen readers)

## Setup

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Running API server on port 3001 (or configured VITE_API_URL)

### Installation

Install Playwright and browsers:

```bash
cd apps/web
npm install
npx playwright install
```

Or install specific browsers:

```bash
npx playwright install chromium firefox webkit
```

## Running Tests

### All Tests

Run all tests across all configured browsers:

```bash
npm run test:e2e
```

### Specific Browser

Run tests on a specific browser:

```bash
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

### Mobile Device Testing

Run tests on mobile device configurations:

```bash
npm run test:e2e -- --project="Mobile Chrome"
npm run test:e2e -- --project="Mobile Safari"
```

### Headed Mode

Run tests with browser UI visible:

```bash
npm run test:e2e:headed
```

### Debug Mode

Run tests in debug mode with Playwright Inspector:

```bash
npm run test:e2e:debug
```

### UI Mode

Run tests in Playwright UI mode for interactive debugging:

```bash
npm run test:e2e:ui
```

### Specific Test File

Run a specific test file:

```bash
npm run test:e2e tests/e2e/projects.spec.ts
```

### Specific Test Case

Run a specific test case:

```bash
npm run test:e2e -g "should load the projects page successfully"
```

## Test Structure

### Test Files

- `projects.spec.ts` - Comprehensive tests for the Projects page

### Support Files

- `setup.ts` - Global setup, test utilities, and data seeding
- `playwright.config.ts` (root) - Playwright configuration

## Test Organization

Tests are organized into describe blocks by functionality:

1. **Loading and Rendering** - Basic page load and display tests
2. **Filtering Functionality** - Category, technology, and featured filters
3. **Pagination** - Page navigation and controls
4. **Responsive Behavior** - Mobile, tablet, and desktop layouts
5. **Loading States and Error Handling** - API errors and loading states
6. **Project Card Interactions** - Card clicks and external links
7. **Accessibility** - ARIA labels, keyboard navigation, screen readers
8. **Performance** - Load times and responsiveness

## Configuration

### Environment Variables

- `PLAYWRIGHT_BASE_URL` - Base URL for the web application (default: http://localhost:5173)
- `VITE_API_URL` - API server URL (default: http://localhost:3001)

### Playwright Config

Key configuration options in `playwright.config.ts`:

```typescript
{
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
}
```

## CI Integration

Tests run automatically on every pull request via GitHub Actions (`.github/workflows/e2e.yml`).

### Workflow Features

- **Parallel Execution** - Tests run across multiple browsers simultaneously
- **Database Setup** - PostgreSQL and Redis services are configured
- **Automatic Screenshots** - Failures capture screenshots automatically
- **Video Recording** - Failed tests record video
- **Trace Files** - Detailed traces for debugging failures
- **Test Artifacts** - Results, screenshots, and videos uploaded for 7 days

### Viewing CI Results

1. Go to the GitHub Actions tab
2. Select the E2E Tests workflow run
3. Download artifacts (screenshots, videos, traces) from failed tests
4. View the HTML report artifact for detailed results

## Test Data

### Mock Data

The tests use mock API responses for predictable testing. Mock data is defined in `setup.ts`:

- `MOCK_PROJECTS_RESPONSE` - Sample projects data
- `MOCK_FILTERS_RESPONSE` - Sample filter options

### Test Utilities

Helper functions in `setup.ts`:

- `waitForApiResponse()` - Wait for specific API calls
- `mockApiResponse()` - Mock API responses
- `mockApiError()` - Mock API error responses
- `screenshot()` - Take custom screenshots

## Writing New Tests

### Example Test

```typescript
test('should filter by category', async ({ page }) => {
  await page.goto('/projects');
  await page.waitForLoadState('networkidle');

  // Find and click a category filter
  const categoryButton = page.locator('[role="group"][aria-label*="category" i] button').first();
  await categoryButton.click();

  // Verify filter is active
  await expect(categoryButton).toHaveAttribute('aria-pressed', 'true');
});
```

### Best Practices

1. **Use Semantic Selectors** - Prefer role-based and aria-label selectors over CSS classes
2. **Wait for Network** - Use `waitForLoadState('networkidle')` for API calls
3. **Accessibility First** - Test with keyboard navigation and screen reader attributes
4. **Mobile Testing** - Test responsive behavior across device sizes
5. **Error Scenarios** - Test both success and error paths
6. **Isolation** - Each test should be independent and not rely on others
7. **Descriptive Names** - Use clear, descriptive test names

### Selectors Priority

1. User-facing attributes (role, aria-label, data-testid)
2. Text content
3. CSS selectors (last resort)

Example:

```typescript
// Good - semantic and resilient
page.locator('[role="button"][aria-label="Submit"]');
page.getByRole('button', { name: 'Submit' });
page.locator('[data-testid="submit-button"]');

// Avoid - fragile and implementation-dependent
page.locator('.btn-primary.submit-btn');
```

## Debugging

### Debug Failed Tests

1. Run in headed mode to see browser:

   ```bash
   npm run test:e2e:headed
   ```

2. Use debug mode with Playwright Inspector:

   ```bash
   npm run test:e2e:debug
   ```

3. View trace files:
   ```bash
   npx playwright show-trace test-results/[test-name]/trace.zip
   ```

### Common Issues

**Tests timeout**

- Increase timeout in test or config
- Check if API server is running
- Verify network conditions

**Flaky tests**

- Add proper wait conditions
- Use `waitForSelector` with timeout
- Check for race conditions

**Element not found**

- Verify selector is correct
- Check if element is in viewport
- Wait for page to be fully loaded

## Reports

### HTML Report

After running tests, view the HTML report:

```bash
npx playwright show-report
```

The report includes:

- Test results summary
- Screenshots of failures
- Video recordings
- Test traces
- Console logs
- Network activity

### JSON Report

Test results are also output in JSON format:

```
test-results/results.json
```

### JUnit Report

For CI integration:

```
test-results/junit.xml
```

## Performance

### Parallel Execution

Tests run in parallel by default. Configure parallelism:

```typescript
// playwright.config.ts
workers: process.env.CI ? 4 : undefined,
```

### Test Isolation

Each test runs in isolation with:

- Fresh browser context
- Clean storage state
- Independent API state

### Optimization Tips

1. Use `page.goto()` efficiently
2. Minimize unnecessary waits
3. Reuse browser contexts when possible
4. Use fixtures for common setup
5. Group related tests in describe blocks

## Maintenance

### Updating Tests

When updating the application:

1. Update test data in `setup.ts`
2. Update selectors if UI changes
3. Add tests for new features
4. Update this README if structure changes

### Reviewing Failures

1. Check screenshots and videos
2. Review trace files
3. Verify API responses
4. Check console logs
5. Confirm expected behavior

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Accessibility Testing Guide](https://playwright.dev/docs/accessibility-testing)

## Support

For issues or questions:

1. Check this documentation
2. Review Playwright docs
3. Check CI logs and artifacts
4. Create an issue in the repository
