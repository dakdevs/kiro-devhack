import { z } from 'zod';

/**
 * Enhanced validation schemas for API requests
 */

// Document content validation with sanitization
export const DocumentContentSchema = z
  .string()
  .min(1, 'Document content cannot be empty')
  .max(50000, 'Document content too large (max 50,000 characters)')
  .transform((content) => {
    // Basic sanitization - remove null bytes and excessive whitespace
    return content
      .replace(/\0/g, '') // Remove null bytes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  })
  .refine((content) => content.length > 0, {
    message: 'Document content cannot be empty after sanitization',
  });

// Metadata validation with sanitization
export const MetadataSchema = z
  .record(z.string(), z.any())
  .optional()
  .default({})
  .transform((metadata) => {
    if (!metadata) return {};
    
    // Sanitize metadata keys and values
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      // Sanitize key - remove special characters, limit length
      const sanitizedKey = key
        .replace(/[^\w\-_.]/g, '')
        .substring(0, 100);
      
      if (sanitizedKey.length === 0) continue;
      
      // Sanitize value based on type
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = value
          .replace(/\0/g, '') // Remove null bytes
          .substring(0, 1000); // Limit string length
      } else if (typeof value === 'number' && isFinite(value)) {
        sanitized[sanitizedKey] = value;
      } else if (typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
      } else if (Array.isArray(value)) {
        // Sanitize array elements (strings only, limit size)
        sanitized[sanitizedKey] = value
          .filter((item) => typeof item === 'string')
          .map((item) => item.replace(/\0/g, '').substring(0, 100))
          .slice(0, 20); // Limit array size
      }
      // Skip other types (objects, functions, etc.)
    }
    
    return sanitized;
  })
  .refine((metadata) => Object.keys(metadata).length <= 50, {
    message: 'Too many metadata fields (max 50)',
  });

// Document schema for ingestion
export const DocumentSchema = z.object({
  content: DocumentContentSchema,
  metadata: MetadataSchema,
});

// Ingest request schema
export const IngestRequestSchema = z.object({
  documents: z
    .array(DocumentSchema)
    .min(1, 'At least one document is required')
    .max(100, 'Maximum 100 documents per batch')
    .refine((docs) => {
      // Check total content length across all documents
      const totalLength = docs.reduce((sum, doc) => sum + doc.content.length, 0);
      return totalLength <= 500000; // 500KB total limit
    }, {
      message: 'Total content length exceeds limit (max 500KB per batch)',
    }),
});

// Search query validation with sanitization
export const SearchQuerySchema = z
  .string()
  .min(1, 'Query cannot be empty')
  .max(1000, 'Query too long (max 1000 characters)')
  .transform((query) => {
    // Sanitize query - remove null bytes, normalize whitespace
    return query
      .replace(/\0/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  })
  .refine((query) => query.length > 0, {
    message: 'Query cannot be empty after sanitization',
  })
  .refine((query) => {
    // Prevent potential injection attacks
    const suspiciousPatterns = [
      /--/,           // SQL comment
      /\/\*/,         // SQL block comment
      /;.*drop/i,     // SQL injection attempt
      /;.*delete/i,   // SQL injection attempt
      /;.*update/i,   // SQL injection attempt
      /;.*insert/i,   // SQL injection attempt
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(query));
  }, {
    message: 'Query contains potentially unsafe content',
  });

// Search request schema
export const SearchRequestSchema = z.object({
  query: SearchQuerySchema,
  k: z
    .number()
    .int()
    .min(1, 'k must be at least 1')
    .max(100, 'k cannot exceed 100')
    .optional()
    .default(10),
  threshold: z
    .number()
    .min(0, 'Threshold must be non-negative')
    .max(1, 'Threshold cannot exceed 1')
    .optional()
    .default(0.0),
});

/**
 * Input sanitization utilities
 */

export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - remove potentially dangerous tags
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

export function sanitizeFilename(filename: string): string {
  // Sanitize filename for safe storage
  return filename
    .replace(/[^\w\-_.]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Rate limiting utilities
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || now > entry.resetTime) {
      // New window or expired entry
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return Date.now() + this.windowMs;
    }
    return entry.resetTime;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

// Global rate limiters
export const ingestRateLimiter = new RateLimiter(50, 60000); // 50 requests per minute
export const searchRateLimiter = new RateLimiter(200, 60000); // 200 requests per minute

// Cleanup rate limiters periodically
setInterval(() => {
  ingestRateLimiter.cleanup();
  searchRateLimiter.cleanup();
}, 300000); // Cleanup every 5 minutes

/**
 * Error classification utilities
 */

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  EXTERNAL_API = 'external_api',
  DATABASE = 'database',
  INTERNAL = 'internal',
}

export interface ClassifiedError {
  category: ErrorCategory;
  code: string;
  message: string;
  details?: string;
  retryable: boolean;
  statusCode: number;
}

export function classifyError(error: unknown): ClassifiedError {
  if (error instanceof z.ZodError) {
    return {
      category: ErrorCategory.VALIDATION,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      retryable: false,
      statusCode: 400,
    };
  }

  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return {
      category: ErrorCategory.VALIDATION,
      code: 'INVALID_JSON',
      message: 'Invalid JSON in request body',
      details: error.message,
      retryable: false,
      statusCode: 400,
    };
  }

  if (error instanceof Error) {
    // DashScope API errors
    if (error.message.includes('DashScope') || error.message.includes('embedding')) {
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return {
          category: ErrorCategory.RATE_LIMIT,
          code: 'EMBEDDING_RATE_LIMIT',
          message: 'Embedding API rate limit exceeded',
          details: error.message,
          retryable: true,
          statusCode: 429,
        };
      }

      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return {
          category: ErrorCategory.AUTHENTICATION,
          code: 'EMBEDDING_AUTH_ERROR',
          message: 'Invalid embedding API credentials',
          details: error.message,
          retryable: false,
          statusCode: 401,
        };
      }

      return {
        category: ErrorCategory.EXTERNAL_API,
        code: 'EMBEDDING_API_ERROR',
        message: 'Embedding generation failed',
        details: error.message,
        retryable: true,
        statusCode: 500,
      };
    }

    // Database errors
    if (error.message.includes('database') || error.message.includes('connection')) {
      return {
        category: ErrorCategory.DATABASE,
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
        details: error.message,
        retryable: true,
        statusCode: 500,
      };
    }

    // Vector operation errors
    if (error.message.includes('vector') || error.message.includes('dimension')) {
      return {
        category: ErrorCategory.VALIDATION,
        code: 'VECTOR_ERROR',
        message: 'Vector operation failed',
        details: error.message,
        retryable: false,
        statusCode: 400,
      };
    }
  }

  // Default internal error
  return {
    category: ErrorCategory.INTERNAL,
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    details: error instanceof Error ? error.message : 'Unknown error occurred',
    retryable: false,
    statusCode: 500,
  };
}

/**
 * Request context utilities
 */

export function getClientIdentifier(request: Request): string {
  // Try to get client identifier from various sources
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  
  const ip = forwarded?.split(',')[0]?.trim() || realIp || remoteAddr || 'unknown';
  
  // Include user agent for better identification
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const userAgentHash = userAgent.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return `${ip}:${userAgentHash}`;
}

export function getRequestMetadata(request: Request) {
  return {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length'),
    timestamp: new Date().toISOString(),
  };
}