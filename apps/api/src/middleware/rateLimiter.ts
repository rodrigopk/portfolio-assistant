import rateLimit from 'express-rate-limit';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '600000', 10); // 10 minutes default
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); // 100 requests default

export const rateLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for certain IPs or routes if needed
  skip: (req) => {
    // Skip for health check endpoint
    return req.path === '/api/health';
  },
});

// Stricter rate limiter for sensitive endpoints
export const strictRateLimiter = rateLimit({
  windowMs: 3600000, // 1 hour
  max: 5,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
