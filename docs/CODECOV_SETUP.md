# Codecov Setup Instructions

## Issue

The CI pipeline is failing during the coverage upload step due to missing authentication token. Codecov rate-limits unauthenticated uploads, causing a 429 error.

## Root Cause

- No `CODECOV_TOKEN` is configured in GitHub Secrets
- The workflow attempts unauthenticated uploads which hit rate limits

## Solution Steps

### 1. Get Your Codecov Token

1. Visit [codecov.io](https://codecov.io)
2. Sign in with your GitHub account
3. Navigate to your repository: `rodrigopk/portfolio-assistant`
4. Go to Settings → General
5. Copy the "Repository Upload Token"

### 2. Add Token to GitHub Secrets

1. Go to: https://github.com/rodrigopk/portfolio-assistant/settings/secrets/actions
2. Click "New repository secret"
3. Enter the following:
   - **Name**: `CODECOV_TOKEN`
   - **Secret**: [paste your Codecov upload token]
4. Click "Add secret"

### 3. Verify the Fix

The CI workflow has been updated to use the token:

```yaml
- name: Upload coverage reports to Codecov
  uses: codecov/codecov-action@v3
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: ./apps/api/coverage/coverage-final.json,./apps/web/coverage/coverage-final.json,./packages/agents/coverage/coverage-final.json
    fail_ci_if_error: true
    verbose: true
```

Once you add the secret, the next CI run should successfully upload coverage reports.

## Alternative: Make Coverage Upload Non-Blocking (Optional)

If you want CI to pass even if Codecov upload fails, change:

```yaml
fail_ci_if_error: true
```

to:

```yaml
fail_ci_if_error: false
```

This is useful during initial setup or if Codecov service has issues.
