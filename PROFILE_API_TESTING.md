# Profile API Testing Instructions

## Overview

This document provides testing instructions for the newly implemented GET /api/profile endpoint.

## Implementation Summary

The following files have been created/modified:

### Core Implementation Files:
- `apps/api/prisma/schema.prisma` - Prisma schema with Profile model
- `apps/api/src/lib/prisma.ts` - Prisma client setup
- `apps/api/src/lib/redis.ts` - Redis client and cache utilities
- `apps/api/src/types/profile.types.ts` - TypeScript type definitions
- `apps/api/src/services/profile.service.ts` - Business logic with Redis caching
- `apps/api/src/controllers/profile.controller.ts` - HTTP request handlers
- `apps/api/src/routes/profile.ts` - Route definitions with rate limiting
- `apps/api/src/routes/index.ts` - Updated to include profile routes
- `apps/api/src/index.ts` - Updated to initialize Redis connection

### Test Files:
- `apps/api/src/__tests__/profile.test.ts` - Comprehensive unit and integration tests

### Configuration:
- `apps/api/package.json` - Added supertest and @types/supertest dependencies

## Features Implemented

✅ **GET /api/profile** endpoint
✅ **Redis caching** with 60-minute TTL
✅ **Prisma** integration for database queries
✅ **TypeScript** types for type safety
✅ **Error handling** per Section 5.5 of technical docs
✅ **Rate limiting** (100 requests per 15 minutes)
✅ **Unit tests** with 80%+ coverage goal
✅ **Integration tests** with Supertest

## Prerequisites

Before testing, ensure you have:

1. **PostgreSQL** running and accessible
2. **Redis** running and accessible
3. **Environment variables** configured (see `.env.example`)

Required environment variables:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/portfolio
REDIS_URL=redis://localhost:6379
PORT=3001
```

## Database Setup

### 1. Generate Prisma Client

```bash
cd apps/api
npx prisma generate
```

### 2. Run Migrations

```bash
cd apps/api
npx prisma migrate dev --name init
```

### 3. Seed Database (Create a Profile)

You can seed the database with sample data:

```bash
cd apps/api
npx prisma db seed
```

Or manually create a profile using Prisma Studio:

```bash
cd apps/api
npx prisma studio
```

Then create a Profile record with at least these fields:
- fullName
- title
- bio
- location
- availability
- githubUrl (optional)
- linkedinUrl (optional)

## Testing with curl

### 1. Start the Development Server

```bash
npm run dev
```

The API should start on `http://localhost:3001`

### 2. Test GET /api/profile

#### Basic Request

```bash
curl http://localhost:3001/api/profile
```

**Expected Response (200 OK):**
```json
{
  "data": {
    "fullName": "Rodrigo Vasconcelos de Barros",
    "title": "Senior Software Engineer",
    "bio": "Experienced full-stack engineer with 8+ years of experience",
    "location": "Toronto, Ontario, Canada",
    "availability": "limited",
    "githubUrl": "https://github.com/rodrigo",
    "linkedinUrl": "https://linkedin.com/in/rodrigo"
  }
}
```

#### With Verbose Headers (to see caching headers)

```bash
curl -v http://localhost:3001/api/profile
```

**Expected Headers:**
```
< HTTP/1.1 200 OK
< Cache-Control: public, max-age=3600
< ETag: "profile-1234567890"
< Content-Type: application/json; charset=utf-8
```

#### Test Cache (Make multiple requests)

```bash
# First request - should hit database
time curl http://localhost:3001/api/profile

# Second request - should hit Redis cache (faster)
time curl http://localhost:3001/api/profile
```

The second request should be noticeably faster.

### 3. Test Error Scenarios

#### No Profile in Database (404)

If no profile exists in the database:

```bash
curl -v http://localhost:3001/api/profile
```

**Expected Response (404 Not Found):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Profile not found"
  }
}
```

#### Test Rate Limiting

Make 100+ requests rapidly to test rate limiting:

```bash
for i in {1..105}; do
  curl http://localhost:3001/api/profile
  echo "Request $i"
done
```

After 100 requests within 15 minutes:

**Expected Response (429 Too Many Requests):**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests from this IP, please try again later."
  }
}
```

### 4. Test CORS

From a different origin:

```bash
curl -H "Origin: http://localhost:3000" \
     -v \
     http://localhost:3001/api/profile
```

**Expected Headers:**
```
< Access-Control-Allow-Origin: http://localhost:3000
< Access-Control-Allow-Credentials: true
```

## Running Automated Tests

### Unit and Integration Tests

```bash
cd apps/api
npm test
```

### Watch Mode

```bash
cd apps/api
npm run test:watch
```

### Coverage Report

```bash
cd apps/api
npm run test:coverage
```

Expected coverage: **80%+** for all profile-related files.

## Testing Redis Caching

### 1. Monitor Redis Keys

In a separate terminal, connect to Redis CLI:

```bash
redis-cli
```

Monitor cache operations:

```bash
MONITOR
```

Make a request to the API and observe Redis operations.

### 2. Check Cached Data

```bash
redis-cli
GET profile:main
```

You should see the cached JSON profile data.

### 3. Test Cache Invalidation

```bash
redis-cli
DEL profile:main
```

Make another request - it should hit the database and refresh the cache.

### 4. Check TTL

```bash
redis-cli
TTL profile:main
```

Should return approximately 3600 seconds (60 minutes).

## API Response Schema Validation

The response must match the exact schema from TECHNICAL_DOCUMENTATION.md Section 5.1.1:

```typescript
{
  fullName: string,
  title: string,
  bio: string,
  location: string,
  availability: string,
  githubUrl: string | null,
  linkedinUrl: string | null
}
```

**Sensitive fields excluded:** email, phone, hourlyRate, resumeUrl, id, createdAt, updatedAt

## Performance Expectations

- **First request (cache miss):** < 100ms
- **Cached requests:** < 10ms
- **Rate limit:** 100 requests per 15 minutes per IP

## Known Issues / Environment Notes

### Prisma Client Generation

Due to network restrictions in the current environment, Prisma client generation may fail with:

```
Error: Failed to fetch the engine file at https://binaries.prisma.sh/...
```

**Workaround:**
- Use `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` environment variable
- Or pre-generate the Prisma client in an environment with internet access

### ESLint Configuration

The current ESLint setup may show errors due to version incompatibilities between ESLint 8.x and @typescript-eslint/eslint-plugin. The code itself follows best practices and proper TypeScript standards.

## Troubleshooting

### Redis Connection Issues

If Redis is not available:
- The API will start but cache operations will be skipped
- Database queries will run on every request
- Check Redis connection: `redis-cli ping` (should return PONG)

### Database Connection Issues

Check PostgreSQL connection:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Port Already in Use

If port 3001 is in use:
```bash
PORT=3002 npm run dev
```

Then test with: `curl http://localhost:3002/api/profile`

## Integration with Frontend

The frontend can consume this API with:

```typescript
// Using fetch
const response = await fetch('http://localhost:3001/api/profile');
const { data } = await response.json();

// Using axios
const { data } = await axios.get('http://localhost:3001/api/profile');

// Using React Query
const { data, isLoading } = useQuery({
  queryKey: ['profile'],
  queryFn: () => api.getProfile(),
  staleTime: 60 * 60 * 1000, // 1 hour
});
```

## Security Notes

- Sensitive fields (email, phone, etc.) are **NOT** exposed in the API response
- Rate limiting is enforced to prevent abuse
- CORS is configured to allow only specific origins
- Cache-Control headers enable client-side caching
- All database queries use Prisma for SQL injection protection

## Next Steps

After testing:
1. Verify all curl commands work as expected
2. Confirm Redis caching is functioning
3. Check test coverage meets 80%+ requirement
4. Validate response schema matches documentation
5. Test rate limiting behavior
6. Verify CORS configuration

## Additional curl Examples

### Pretty-print JSON response

```bash
curl http://localhost:3001/api/profile | jq '.'
```

### Save response to file

```bash
curl http://localhost:3001/api/profile -o profile-response.json
```

### Include timing information

```bash
curl -w "\nTotal time: %{time_total}s\n" http://localhost:3001/api/profile
```

### Test from specific IP (if behind proxy)

```bash
curl -H "X-Forwarded-For: 192.168.1.100" http://localhost:3001/api/profile
```

## Support

For issues or questions, please refer to:
- TECHNICAL_DOCUMENTATION.md - Section 5.1.1 (Profile Endpoints)
- TECHNICAL_DOCUMENTATION.md - Section 5.4 (Rate Limiting)
- TECHNICAL_DOCUMENTATION.md - Section 5.5 (Error Handling)
