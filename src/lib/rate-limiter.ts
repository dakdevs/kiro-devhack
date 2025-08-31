import { cache, cacheKeys, cacheTTL } from './cache';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Maximum requests per window
  keyGenerator?: (identifier: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitInfo {
  totalHits: number;
  totalHitsInWindow: number;
  remainingPoints: number;
  msBeforeNext: number;
  isBlocked: boolean;
}

class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (id: string) => `rate_limit:${id}`,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };
  }

  async checkLimit(identifier: string): Promise<RateLimitInfo> {
    const key = this.config.keyGenerator!(identifier);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get current rate limit data
    const data = await cache.get<{
      requests: { timestamp: number; success?: boolean }[];
      totalHits: number;
    }>(key) || { requests: [], totalHits: 0 };

    // Filter requests within the current window
    const requestsInWindow = data.requests.filter(req => req.timestamp > windowStart);
    
    // Count requests based on configuration
    let countableRequests = requestsInWindow;
    if (this.config.skipSuccessfulRequests) {
      countableRequests = countableRequests.filter(req => req.success !== true);
    }
    if (this.config.skipFailedRequests) {
      countableRequests = countableRequests.filter(req => req.success !== false);
    }

    const totalHitsInWindow = countableRequests.length;
    const remainingPoints = Math.max(0, this.config.maxRequests - totalHitsInWindow);
    const isBlocked = totalHitsInWindow >= this.config.maxRequests;

    // Calculate time until next request is allowed
    let msBeforeNext = 0;
    if (isBlocked && requestsInWindow.length > 0) {
      const oldestRequest = requestsInWindow[0];
      msBeforeNext = (oldestRequest.timestamp + this.config.windowMs) - now;
    }

    return {
      totalHits: data.totalHits,
      totalHitsInWindow,
      remainingPoints,
      msBeforeNext: Math.max(0, msBeforeNext),
      isBlocked,
    };
  }

  async recordRequest(identifier: string, success?: boolean): Promise<void> {
    const key = this.config.keyGenerator!(identifier);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get current data
    const data = await cache.get<{
      requests: { timestamp: number; success?: boolean }[];
      totalHits: number;
    }>(key) || { requests: [], totalHits: 0 };

    // Add new request
    data.requests.push({ timestamp: now, success });
    data.totalHits += 1;

    // Clean up old requests
    data.requests = data.requests.filter(req => req.timestamp > windowStart);

    // Store updated data with TTL
    const ttlSeconds = Math.ceil(this.config.windowMs / 1000) + 60; // Add buffer
    await cache.set(key, data, ttlSeconds);
  }

  async reset(identifier: string): Promise<void> {
    const key = this.config.keyGenerator!(identifier);
    await cache.delete(key);
  }
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  // AI API calls - more restrictive
  aiApi: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (id: string) => `rate_limit:ai_api:${id}`,
  }),

  // Interview scheduling - moderate limits
  scheduling: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20,
    keyGenerator: (id: string) => `rate_limit:scheduling:${id}`,
  }),

  // General API calls - more permissive
  general: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (id: string) => `rate_limit:general:${id}`,
  }),

  // Job posting and analysis
  jobPosting: new RateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 5,
    keyGenerator: (id: string) => `rate_limit:job_posting:${id}`,
  }),

  // Candidate matching queries
  candidateMatching: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyGenerator: (id: string) => `rate_limit:candidate_matching:${id}`,
  }),

  // Notification sending
  notifications: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    keyGenerator: (id: string) => `rate_limit:notifications:${id}`,
  }),
};

// Rate limiting middleware for API routes
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return async (identifier: string) => {
    const limitInfo = await limiter.checkLimit(identifier);
    
    if (limitInfo.isBlocked) {
      const error = new Error('Rate limit exceeded');
      (error as any).status = 429;
      (error as any).retryAfter = Math.ceil(limitInfo.msBeforeNext / 1000);
      (error as any).limitInfo = limitInfo;
      throw error;
    }

    return limitInfo;
  };
}

// Utility functions
export const rateLimitUtils = {
  // Get identifier from request (IP, user ID, etc.)
  getIdentifier: (request: Request, userId?: string): string => {
    if (userId) return userId;
    
    // Try to get IP from headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || realIp || 'unknown';
    
    return ip;
  },

  // Create rate limit headers for response
  createHeaders: (limitInfo: RateLimitInfo, windowMs: number): Record<string, string> => {
    return {
      'X-RateLimit-Limit': limitInfo.totalHitsInWindow.toString(),
      'X-RateLimit-Remaining': limitInfo.remainingPoints.toString(),
      'X-RateLimit-Reset': new Date(Date.now() + limitInfo.msBeforeNext).toISOString(),
      'X-RateLimit-Window': windowMs.toString(),
    };
  },

  // Check if request should be rate limited
  shouldRateLimit: (request: Request): boolean => {
    // Skip rate limiting for certain conditions
    const userAgent = request.headers.get('user-agent') || '';
    
    // Skip for health checks
    if (userAgent.includes('health-check') || userAgent.includes('monitoring')) {
      return false;
    }

    return true;
  },
};

// Rate limiting decorator for service methods
// Rate limiting helper function for manual application
export async function applyRateLimit(limiter: RateLimiter, identifier: string, operation: string) {
  const limitInfo = await limiter.checkLimit(identifier);
  
  if (limitInfo.isBlocked) {
    throw new Error(`Rate limit exceeded for ${operation}. Try again in ${Math.ceil(limitInfo.msBeforeNext / 1000)} seconds.`);
  }
}

// Batch processing utilities to reduce API calls
export const batchUtils = {
  // Batch AI analysis requests
  createAIBatcher: <T, R>(
    processFn: (items: T[]) => Promise<R[]>,
    batchSize: number = 5,
    maxWaitMs: number = 1000
  ) => {
    let batch: { item: T; resolve: (result: R) => void; reject: (error: Error) => void }[] = [];
    let timeout: NodeJS.Timeout | null = null;

    const processBatch = async () => {
      if (batch.length === 0) return;

      const currentBatch = batch.splice(0);
      const items = currentBatch.map(b => b.item);

      try {
        const results = await processFn(items);
        currentBatch.forEach((b, index) => {
          b.resolve(results[index]);
        });
      } catch (error) {
        currentBatch.forEach(b => {
          b.reject(error as Error);
        });
      }
    };

    return (item: T): Promise<R> => {
      return new Promise((resolve, reject) => {
        batch.push({ item, resolve, reject });

        if (batch.length >= batchSize) {
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          processBatch();
        } else if (!timeout) {
          timeout = setTimeout(() => {
            timeout = null;
            processBatch();
          }, maxWaitMs);
        }
      });
    };
  },

  // Debounce function for reducing API calls
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    waitMs: number
  ): T => {
    let timeout: NodeJS.Timeout;
    
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), waitMs);
    }) as T;
  },
};