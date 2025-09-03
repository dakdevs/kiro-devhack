// Import server config conditionally to avoid client-side access
let serverConfig: any = null;
try {
  if (typeof window === 'undefined') {
    serverConfig = require('~/config/server-config').serverConfig;
  }
} catch (error) {
  // Server config not available in client environment
}

// In-memory cache for development, Redis for production
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Maximum number of entries

  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    // Clean up expired entries if cache is getting full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data: value, expiresAt });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      maxSize: this.maxSize
    };
  }
}

// Redis cache implementation for production
class RedisCache {
  private redis: any = null;

  constructor() {
    // Initialize Redis connection in production
    if (serverConfig?.app?.nodeEnv === 'production') {
      // TODO: Initialize Redis client when available
      console.warn('Redis cache not implemented yet, falling back to memory cache');
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    if (!this.redis) {
      // Fallback to memory cache
      memoryCache.set(key, value, ttlSeconds);
      return;
    }

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Redis cache set error:', error);
      // Fallback to memory cache
      memoryCache.set(key, value, ttlSeconds);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) {
      // Fallback to memory cache
      return memoryCache.get<T>(key);
    }

    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis cache get error:', error);
      // Fallback to memory cache
      return memoryCache.get<T>(key);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.redis) {
      memoryCache.delete(key);
      return;
    }

    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis cache delete error:', error);
      memoryCache.delete(key);
    }
  }

  async clear(): Promise<void> {
    if (!this.redis) {
      memoryCache.clear();
      return;
    }

    try {
      await this.redis.flushall();
    } catch (error) {
      console.error('Redis cache clear error:', error);
      memoryCache.clear();
    }
  }
}

// Global cache instances
const memoryCache = new MemoryCache();
const redisCache = new RedisCache();

// Cache interface
export interface Cache {
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> | void;
  get<T>(key: string): Promise<T | null> | T | null;
  delete(key: string): Promise<void> | void;
  clear(): Promise<void> | void;
}

// Export the appropriate cache based on environment
export const cache: Cache = serverConfig?.app?.nodeEnv === 'production' ? redisCache : memoryCache;

// Cache key generators
export const cacheKeys = {
  // User-related caches
  userProfile: (userId: string) => `user:profile:${userId}`,
  userSkills: (userId: string) => `user:skills:${userId}`,
  userAvailability: (userId: string) => `user:availability:${userId}`,
  
  // Job-related caches
  jobPosting: (jobId: string) => `job:posting:${jobId}`,
  jobCandidates: (jobId: string, page: number = 1) => `job:candidates:${jobId}:page:${page}`,
  jobStats: (recruiterId: string) => `job:stats:${recruiterId}`,
  candidateJobs: (candidateId: string) => `candidate:jobs:${candidateId}`,
  
  // AI analysis caches
  aiAnalysis: (contentHash: string) => `ai:analysis:${contentHash}`,
  skillExtraction: (text: string, context?: string) => `skills:extract:${cacheUtils.generateContentHash(text + (context || ''))}`,
  candidateMatching: (jobId: string, candidateId: string) => `match:${jobId}:${candidateId}`,
  
  // Notification caches
  userNotifications: (userId: string) => `notifications:${userId}`,
  unreadCount: (userId: string) => `notifications:unread:${userId}`,
  
  // Interview scheduling caches
  interviewSessions: (userId: string) => `interviews:${userId}`,
  mutualAvailability: (candidateId: string, recruiterId: string) => `availability:mutual:${candidateId}:${recruiterId}`,
};

// Cache TTL constants (in seconds)
export const cacheTTL = {
  short: 60,        // 1 minute
  medium: 300,      // 5 minutes
  long: 1800,       // 30 minutes
  veryLong: 3600,   // 1 hour
  daily: 86400,     // 24 hours
};

// Utility functions for cache management
export const cacheUtils = {
  // Generate hash for content-based caching
  generateContentHash: (content: string): string => {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  },

  // Invalidate related caches
  invalidateUserCaches: async (userId: string): Promise<void> => {
    await Promise.all([
      cache.delete(cacheKeys.userProfile(userId)),
      cache.delete(cacheKeys.userSkills(userId)),
      cache.delete(cacheKeys.userAvailability(userId)),
      cache.delete(cacheKeys.userNotifications(userId)),
      cache.delete(cacheKeys.unreadCount(userId)),
      cache.delete(cacheKeys.interviewSessions(userId)),
    ]);
  },

  invalidateJobCaches: async (jobId: string, recruiterId?: string): Promise<void> => {
    const promises = [
      cache.delete(cacheKeys.jobPosting(jobId)),
      cache.delete(cacheKeys.jobCandidates(jobId)),
    ];

    if (recruiterId) {
      // Clear all job-related caches for this recruiter
      promises.push(
        cache.delete(cacheKeys.jobStats(recruiterId)),
        // Clear common pagination patterns
        cache.delete(`${cacheKeys.jobStats(recruiterId)}:page:1:limit:5:status:all:search:none`),
        cache.delete(`${cacheKeys.jobStats(recruiterId)}:page:1:limit:20:status:all:search:none`),
        cache.delete(`${cacheKeys.jobStats(recruiterId)}:page:1:limit:5:status:active:search:none`),
        cache.delete(`${cacheKeys.jobStats(recruiterId)}:page:1:limit:20:status:active:search:none`),
      );
    }

    await Promise.all(promises);
  },

  invalidateRecruiterDashboardCaches: async (recruiterId: string): Promise<void> => {
    // Clear all dashboard-related caches for a recruiter
    const patterns = [
      cacheKeys.jobStats(recruiterId),
      // Common pagination patterns for dashboard
      `${cacheKeys.jobStats(recruiterId)}:page:1:limit:5:status:all:search:none`,
      `${cacheKeys.jobStats(recruiterId)}:page:1:limit:20:status:all:search:none`,
      `${cacheKeys.jobStats(recruiterId)}:page:1:limit:5:status:active:search:none`,
      `${cacheKeys.jobStats(recruiterId)}:page:1:limit:20:status:active:search:none`,
      // Additional patterns that might be cached
      `${cacheKeys.jobStats(recruiterId)}:page:1:limit:10:status:all:search:none`,
      `${cacheKeys.jobStats(recruiterId)}:page:1:limit:10:status:active:search:none`,
    ];

    console.log('[CACHE-UTILS] Invalidating recruiter dashboard caches:', patterns);
    await Promise.all(patterns.map(pattern => cache.delete(pattern)));
  },

  // Get cache statistics (for monitoring)
  getStats: () => {
    if (memoryCache) {
      return memoryCache.getStats();
    }
    return { message: 'Cache statistics not available' };
  },
};

// Cache warming utilities
export const cacheWarming = {
  // Warm up user-related caches
  warmUserCaches: async (userId: string) => {
    // This would be called after user login or profile updates
    // Implementation would fetch and cache commonly accessed user data
  },

  // Warm up job-related caches
  warmJobCaches: async (jobId: string) => {
    // This would be called after job posting creation
    // Implementation would pre-calculate and cache job matching data
  },
};