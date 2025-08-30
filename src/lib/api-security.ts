import { NextRequest, NextResponse } from 'next/server';
import { SecurityMiddleware, RequestSecurity, CSRFProtection } from '~/lib/security';
import { validateAndSanitizeSecure } from '~/lib/validation';
import { withErrorHandling } from '~/lib/error-handler';
import { logger } from '~/lib/logger';
import { z } from 'zod';

// API Security configuration
export interface APISecurityConfig {
  requireAuth?: boolean;
  requireRole?: 'candidate' | 'recruiter' | 'admin';
  requireCSRF?: boolean;
  allowedMethods?: string[];
  allowedContentTypes?: string[];
  rateLimit?: 'general' | 'aiApi' | 'scheduling' | 'jobPosting' | 'candidateMatching';
  validateOrigin?: boolean;
  maxRequestSize?: number;
  allowedFileTypes?: string[];
}

// Default security configuration
const DEFAULT_CONFIG: APISecurityConfig = {
  requireAuth: true,
  requireCSRF: true,
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedContentTypes: ['application/json'],
  rateLimit: 'general',
  validateOrigin: true,
  maxRequestSize: 1024 * 1024, // 1MB
};

// Security decorator for API routes
export function withAPISecurity(config: APISecurityConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = withErrorHandling(async function (request: NextRequest, ...args: any[]) {
      // Validate HTTP method
      if (!finalConfig.allowedMethods?.includes(request.method)) {
        return NextResponse.json(
          { success: false, error: 'Method not allowed' },
          { status: 405, headers: RequestSecurity.getSecurityHeaders() }
        );
      }

      // Validate request size
      if (finalConfig.maxRequestSize) {
        const contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > finalConfig.maxRequestSize) {
          return NextResponse.json(
            { success: false, error: 'Request too large' },
            { status: 413, headers: RequestSecurity.getSecurityHeaders() }
          );
        }
      }

      // Apply security middleware
      const user = await SecurityMiddleware.validateRequest(request, {
        requireAuth: finalConfig.requireAuth,
        requireRole: finalConfig.requireRole,
        requireCSRF: finalConfig.requireCSRF,
        allowedContentTypes: finalConfig.allowedContentTypes,
        rateLimit: finalConfig.rateLimit,
        validateOrigin: finalConfig.validateOrigin,
      });

      // Call the original method with security context
      const result = await originalMethod.call(this, request, { user, ...args });

      // Ensure response has security headers
      if (result instanceof NextResponse) {
        const headers = RequestSecurity.getSecurityHeaders();
        Object.entries(headers).forEach(([key, value]) => {
          result.headers.set(key, value);
        });
      }

      return result;
    });

    return descriptor;
  };
}

// Secure API route wrapper function
export function createSecureAPIRoute(
  handler: (request: NextRequest, context: { user?: any }) => Promise<NextResponse>,
  config: APISecurityConfig = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return withErrorHandling(async (request: NextRequest) => {
    // Validate HTTP method
    if (!finalConfig.allowedMethods?.includes(request.method)) {
      return SecurityMiddleware.createSecureResponse(
        { success: false, error: 'Method not allowed' },
        405
      );
    }

    // Validate request size
    if (finalConfig.maxRequestSize) {
      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > finalConfig.maxRequestSize) {
        return SecurityMiddleware.createSecureResponse(
          { success: false, error: 'Request too large' },
          413
        );
      }
    }

    // Apply security middleware
    const user = await SecurityMiddleware.validateRequest(request, {
      requireAuth: finalConfig.requireAuth,
      requireRole: finalConfig.requireRole,
      requireCSRF: finalConfig.requireCSRF,
      allowedContentTypes: finalConfig.allowedContentTypes,
      rateLimit: finalConfig.rateLimit,
      validateOrigin: finalConfig.validateOrigin,
    });

    // Call the handler with security context
    const result = await handler(request, { user });

    // Ensure response has security headers
    if (result instanceof NextResponse) {
      const headers = RequestSecurity.getSecurityHeaders();
      Object.entries(headers).forEach(([key, value]) => {
        result.headers.set(key, value);
      });
    }

    return result;
  });
}

// Secure request body parser with validation
export async function parseSecureRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
  options: {
    maxSize?: number;
    allowUnsafeContent?: boolean;
  } = {}
): Promise<T> {
  const { maxSize = 1024 * 1024, allowUnsafeContent = false } = options;

  try {
    // Check content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Invalid content type. Expected application/json');
    }

    // Get request body
    const body = await request.text();
    
    // Check size
    if (body.length > maxSize) {
      throw new Error(`Request body too large. Maximum size: ${maxSize} bytes`);
    }

    // Parse JSON
    let data: unknown;
    try {
      data = JSON.parse(body);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }

    // Validate and sanitize
    return validateAndSanitizeSecure(schema, data, {
      allowUnsafeContent,
      maxDepth: 10,
    });
  } catch (error) {
    logger.error('Failed to parse secure request body', {
      operation: 'api-security.parse-body',
    }, error as Error);
    throw error;
  }
}

// Secure query parameter parser
export function parseSecureQueryParams(
  request: NextRequest,
  allowedParams: string[] = []
): Record<string, string> {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    // Only allow whitelisted parameters
    if (allowedParams.length > 0 && !allowedParams.includes(key)) {
      continue;
    }

    // Sanitize parameter name and value
    const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '');
    const sanitizedValue = value.replace(/[<>'"&]/g, '');

    if (sanitizedKey && sanitizedValue) {
      params[sanitizedKey] = sanitizedValue;
    }
  }

  return params;
}

// File upload security validation
export async function validateFileUpload(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
    scanForMalware?: boolean;
  } = {}
): Promise<{ valid: boolean; errors: string[] }> {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
    scanForMalware = false,
  } = options;

  const errors: string[] = [];

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size exceeds maximum allowed size of ${maxSize} bytes`);
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !allowedExtensions.includes(extension)) {
    errors.push(`File extension .${extension} is not allowed`);
  }

  // Check filename for dangerous patterns
  if (/[<>:"/\\|?*\x00-\x1f]/.test(file.name)) {
    errors.push('Filename contains invalid characters');
  }

  // Basic malware scanning (check for suspicious patterns)
  if (scanForMalware) {
    try {
      const buffer = await file.arrayBuffer();
      const content = new Uint8Array(buffer);
      
      // Check for executable file signatures
      const signatures = [
        [0x4D, 0x5A], // PE executable
        [0x7F, 0x45, 0x4C, 0x46], // ELF executable
        [0xCA, 0xFE, 0xBA, 0xBE], // Mach-O executable
      ];

      for (const signature of signatures) {
        if (content.length >= signature.length) {
          let matches = true;
          for (let i = 0; i < signature.length; i++) {
            if (content[i] !== signature[i]) {
              matches = false;
              break;
            }
          }
          if (matches) {
            errors.push('File appears to be an executable and is not allowed');
            break;
          }
        }
      }
    } catch (error) {
      errors.push('Failed to scan file for malware');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Session security utilities
export class SessionSecurity {
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly IDLE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

  static validateSessionSecurity(
    sessionData: any,
    request: NextRequest
  ): { valid: boolean; reason?: string } {
    if (!sessionData) {
      return { valid: false, reason: 'No session data' };
    }

    // Check session expiration
    const now = Date.now();
    const sessionStart = new Date(sessionData.createdAt).getTime();
    const lastActivity = new Date(sessionData.updatedAt).getTime();

    if (now - sessionStart > this.SESSION_TIMEOUT) {
      return { valid: false, reason: 'Session expired' };
    }

    if (now - lastActivity > this.IDLE_TIMEOUT) {
      return { valid: false, reason: 'Session idle timeout' };
    }

    // Validate IP address consistency (optional, can be disabled for mobile users)
    const currentIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    if (sessionData.ipAddress && sessionData.ipAddress !== currentIP) {
      // Log suspicious activity but don't invalidate session
      // (IP can change legitimately for mobile users)
      logger.warn('Session IP address changed', {
        operation: 'session-security.ip-change',
        metadata: {
          sessionId: sessionData.id,
          oldIP: sessionData.ipAddress,
          newIP: currentIP,
        },
      });
    }

    // Validate User-Agent consistency
    const currentUA = request.headers.get('user-agent') || '';
    if (sessionData.userAgent && sessionData.userAgent !== currentUA) {
      // Log but don't invalidate (User-Agent can change with browser updates)
      logger.warn('Session User-Agent changed', {
        operation: 'session-security.ua-change',
        metadata: {
          sessionId: sessionData.id,
          oldUA: sessionData.userAgent,
          newUA: currentUA,
        },
      });
    }

    return { valid: true };
  }

  static generateSecureSessionId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// API response security wrapper
export function createSecureAPIResponse<T>(
  data: T,
  options: {
    status?: number;
    includeTimestamp?: boolean;
    includeRequestId?: boolean;
  } = {}
): NextResponse {
  const { status = 200, includeTimestamp = true, includeRequestId = false } = options;

  const response: any = {
    success: true,
    data,
  };

  if (includeTimestamp) {
    response.timestamp = new Date().toISOString();
  }

  if (includeRequestId) {
    response.requestId = Math.random().toString(36).substring(2, 15);
  }

  return SecurityMiddleware.createSecureResponse(response, status);
}

// Error response security wrapper
export function createSecureErrorResponse(
  error: string | Error,
  options: {
    status?: number;
    includeDetails?: boolean;
    logError?: boolean;
  } = {}
): NextResponse {
  const { status = 500, includeDetails = false, logError = true } = options;

  const errorMessage = error instanceof Error ? error.message : error;
  
  if (logError) {
    logger.error('API error occurred', {
      operation: 'api-security.error',
    }, error instanceof Error ? error : new Error(errorMessage));
  }

  const response: any = {
    success: false,
    error: includeDetails ? errorMessage : 'An error occurred',
  };

  // Only include error details in development
  if (includeDetails && process.env.NODE_ENV === 'development') {
    response.details = error instanceof Error ? error.stack : undefined;
  }

  return SecurityMiddleware.createSecureResponse(response, status);
}

// Export utility functions
export const apiSecurityUtils = {
  // Generate CSRF token for forms
  generateCSRFToken: (): string => {
    return CSRFProtection.generateToken();
  },

  // Validate request origin
  validateRequestOrigin: (request: NextRequest): boolean => {
    return RequestSecurity.validateOrigin(request);
  },

  // Get client IP address
  getClientIP: (request: NextRequest): string => {
    return request.headers.get('x-forwarded-for')?.split(',')[0] || 
           request.headers.get('x-real-ip') || 
           'unknown';
  },

  // Check if request is from a bot
  isBot: (request: NextRequest): boolean => {
    const userAgent = request.headers.get('user-agent') || '';
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
    ];
    return botPatterns.some(pattern => pattern.test(userAgent));
  },

  // Validate request timing (prevent replay attacks)
  validateRequestTiming: (timestamp: string, maxAge: number = 300000): boolean => {
    try {
      const requestTime = new Date(timestamp).getTime();
      const now = Date.now();
      return (now - requestTime) <= maxAge;
    } catch {
      return false;
    }
  },
};