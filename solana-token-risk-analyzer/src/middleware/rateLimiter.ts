import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiter for API endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use API key if available, otherwise use IP
    return req.headers['x-api-key']?.toString() || req.ip || 'unknown';
  },
});

/**
 * Stricter rate limiter for analysis endpoints
 */
export const analysisRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 20, // 20 analysis requests per minute
  message: {
    success: false,
    error: 'Analysis rate limit exceeded. Please wait before making more requests.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for batch endpoints
 */
export const batchRateLimiter = rateLimit({
  windowMs: 60000,
  max: 5, // 5 batch requests per minute
  message: {
    success: false,
    error: 'Batch request rate limit exceeded',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
