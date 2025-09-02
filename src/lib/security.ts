import { NextRequest } from 'next/server';
import { auth } from '~/lib/auth';
import { rateLimiters, createRateLimitMiddleware, rateLimitUtils } from '~/lib/rate-limiter';
import { logger } from '~/lib/logger';
import { AuthenticationError, AuthorizationError, ValidationError } from '~/lib/errors';

// CSRF token management
export class CSRFProtection {
  private static readonly TOKEN_HEADER = 'x-csrf-token';
  private static readonly TOKEN_COOKIE = 'csrf-token';
  private static readonly TOKEN_LENGTH = 32;

  static generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < this.TOKEN_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static validateToken(request: NextRequest, expectedToken?: string): boolean {
    const headerToken = request.headers.get(this.TOKEN_HEADER);
    const cookieToken = request.cookies.get(this.TOKEN_COOKIE)?.value;
    
    if (!headerToken || !cookieToken) {
      return false;
    }

    // Tokens must match between header and cookie
    if (headerToken !== cookieToken) {
      return false;
    }

    // If expected token is provided, validate against it
    if (expectedToken && headerToken !== expectedToken) {
      return false;
    }

    return true;
  }

  static requireCSRF(request: NextRequest): void {
    const method = request.method.toUpperCase();
    
    // Only require CSRF for state-changing operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      if (!this.validateToken(request)) {
        throw new ValidationError('CSRF token validation failed', 'csrf', 'invalid');
      }
    }
  }
}

// Input sanitization and validation
export class InputSanitizer {
  // SQL injection prevention patterns
  private static readonly SQL_INJECTION_PATTERNS = [
    // Dangerous SQL keywords in suspicious contexts
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b.*\b(FROM|INTO|TABLE|DATABASE)\b)/gi,
    // SQL comments that could be used for injection
    /(--\s*$|\/\*.*\*\/)/gm,
    // Classic SQL injection patterns
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi,
    /\b(WAITFOR|DELAY)\b\s+(DELAY|TIME)/gi,
    // Union-based injection attempts
    /\bUNION\b\s+(ALL\s+)?SELECT\b/gi,
    // Hex-encoded or char-based injections
    /\b(CHAR|ASCII|HEX)\s*\(/gi,
  ];

  // XSS prevention patterns
  private static readonly XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^>]*>/gi,
  ];

  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Remove potential XSS patterns
    this.XSS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // HTML encode special characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized.trim();
  }

  static validateSQLSafety(input: string): boolean {
    return !this.SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
  }

  static sanitizeObject(obj: any, maxDepth: number = 10, currentDepth: number = 0): any {
    // Prevent infinite recursion and stack overflow
    if (currentDepth >= maxDepth) {
      return null;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, maxDepth, currentDepth + 1));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize both key and value
        const sanitizedKey = this.sanitizeString(key);
        sanitized[sanitizedKey] = this.sanitizeObject(value, maxDepth, currentDepth + 1);
      }
      return sanitized;
    }

    return obj;
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone);
  }

  static validateURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }
}

// Authentication and authorization helpers
export class SecurityAuth {
  static async requireAuth(request: NextRequest): Promise<{ userId: string; email: string }> {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      throw new AuthenticationError('Authentication required');
    }

    return {
      userId: session.user.id,
      email: session.user.email,
    };
  }

  static async requireRole(
    request: NextRequest, 
    requiredRole: 'candidate' | 'recruiter' | 'admin'
  ): Promise<{ userId: string; email: string; role: string }> {
    const user = await this.requireAuth(request);
    
    // Check role based on profile existence
    if (requiredRole === 'recruiter') {
      // Import here to avoid circular dependency
      const { recruiterProfileService } = await import('~/services/recruiter-profile');
      const hasRecruiterProfile = await recruiterProfileService.hasProfile(user.userId);
      
      if (!hasRecruiterProfile) {
        throw new AuthorizationError('Recruiter profile required. Please create a recruiter profile first.');
      }
    }
    
    // For candidates and admins, we can add similar checks later
    // For now, just validate that the user is authenticated
    
    return {
      ...user,
      role: requiredRole,
    };
  }

  static async requireResourceOwnership(
    request: NextRequest,
    resourceUserId: string
  ): Promise<{ userId: string; email: string }> {
    const user = await this.requireAuth(request);
    
    if (user.userId !== resourceUserId) {
      throw new AuthorizationError('Access denied: insufficient permissions');
    }

    return user;
  }
}

// Request validation and security headers
export class RequestSecurity {
  private static readonly ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://localhost:3000',
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean);

  static validateOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    
    if (!origin && !referer) {
      // Allow requests without origin/referer (e.g., direct API calls)
      return true;
    }

    const requestOrigin = origin || (referer ? new URL(referer).origin : null);
    
    if (!requestOrigin) {
      return false;
    }

    return this.ALLOWED_ORIGINS.includes(requestOrigin);
  }

  static validateContentType(request: NextRequest, expectedTypes: string[]): boolean {
    const contentType = request.headers.get('content-type');
    
    if (!contentType) {
      return expectedTypes.includes('none');
    }

    return expectedTypes.some(type => contentType.includes(type));
  }

  static getSecurityHeaders(): Record<string, string> {
    return {
      // Prevent XSS attacks
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      
      // HTTPS enforcement
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.moonshot.cn https://openrouter.ai",
        "frame-ancestors 'none'",
      ].join('; '),
      
      // Referrer policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions policy
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
  }

  static logSecurityEvent(
    event: 'auth_failure' | 'csrf_failure' | 'rate_limit' | 'suspicious_request',
    request: NextRequest,
    details?: any
  ): void {
    const ip = rateLimitUtils.getIdentifier(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const url = request.url;
    const method = request.method;

    logger.warn(`Security event: ${event}`, {
      operation: 'security.event',
      metadata: {
        event,
        ip,
        userAgent,
        url,
        method,
        details,
      },
    });
  }
}

// Comprehensive security middleware
export class SecurityMiddleware {
  static async validateRequest(
    request: NextRequest,
    options: {
      requireAuth?: boolean;
      requireRole?: 'candidate' | 'recruiter' | 'admin';
      requireCSRF?: boolean;
      allowedContentTypes?: string[];
      rateLimit?: 'general' | 'aiApi' | 'scheduling' | 'jobPosting' | 'candidateMatching';
      validateOrigin?: boolean;
    } = {}
  ): Promise<{ userId?: string; email?: string; role?: string }> {
    const {
      requireAuth = false,
      requireRole,
      requireCSRF = false,
      allowedContentTypes = ['application/json'],
      rateLimit = 'general',
      validateOrigin = true,
    } = options;

    // Validate origin
    if (validateOrigin && !RequestSecurity.validateOrigin(request)) {
      RequestSecurity.logSecurityEvent('suspicious_request', request, { reason: 'invalid_origin' });
      throw new ValidationError('Invalid request origin', 'origin', 'invalid');
    }

    // Validate content type for POST/PUT/PATCH requests
    const method = request.method.toUpperCase();
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (!RequestSecurity.validateContentType(request, allowedContentTypes)) {
        throw new ValidationError('Invalid content type', 'content-type', 'invalid');
      }
    }

    // Rate limiting
    const identifier = rateLimitUtils.getIdentifier(request);
    if (rateLimitUtils.shouldRateLimit(request)) {
      try {
        const rateLimitCheck = createRateLimitMiddleware(rateLimiters[rateLimit]);
        await rateLimitCheck(identifier);
      } catch (error) {
        RequestSecurity.logSecurityEvent('rate_limit', request, { limiter: rateLimit });
        throw error;
      }
    }

    // CSRF protection
    if (requireCSRF) {
      try {
        CSRFProtection.requireCSRF(request);
      } catch (error) {
        RequestSecurity.logSecurityEvent('csrf_failure', request);
        throw error;
      }
    }

    // Authentication
    let user: { userId: string; email: string; role?: string } | undefined;
    
    if (requireAuth || requireRole) {
      try {
        if (requireRole) {
          user = await SecurityAuth.requireRole(request, requireRole);
        } else {
          user = await SecurityAuth.requireAuth(request);
        }
      } catch (error) {
        RequestSecurity.logSecurityEvent('auth_failure', request, { 
          requireRole: requireRole || 'none' 
        });
        throw error;
      }
    }

    return user || {};
  }

  static createSecureResponse(data: any, status: number = 200): Response {
    const headers = RequestSecurity.getSecurityHeaders();
    
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  }
}

// Data encryption utilities (for sensitive data at rest)
export class DataEncryption {
  private static readonly ALGORITHM = 'AES-256-GCM';
  
  // Note: In production, use proper key management (AWS KMS, Azure Key Vault, etc.)
  private static getEncryptionKey(): string {
    const key = process.env.DATA_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('DATA_ENCRYPTION_KEY environment variable not set');
    }
    return key;
  }

  static async encryptSensitiveData(data: string): Promise<string> {
    // This is a placeholder implementation
    // In production, use proper encryption libraries like node:crypto
    try {
      // For now, just base64 encode (NOT secure - implement proper encryption)
      return Buffer.from(data).toString('base64');
    } catch (error) {
      logger.error('Failed to encrypt sensitive data', {
        operation: 'security.encrypt',
      }, error as Error);
      throw new Error('Encryption failed');
    }
  }

  static async decryptSensitiveData(encryptedData: string): Promise<string> {
    // This is a placeholder implementation
    try {
      // For now, just base64 decode (NOT secure - implement proper decryption)
      return Buffer.from(encryptedData, 'base64').toString();
    } catch (error) {
      logger.error('Failed to decrypt sensitive data', {
        operation: 'security.decrypt',
      }, error as Error);
      throw new Error('Decryption failed');
    }
  }
}

// Export utility functions
export const securityUtils = {
  // Generate secure random strings
  generateSecureToken: (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Validate password strength
  validatePasswordStrength: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  // Hash sensitive data for comparison
  hashData: async (data: string): Promise<string> => {
    // This would use bcrypt or similar in production
    return Buffer.from(data).toString('base64');
  },

  // Verify hashed data
  verifyHash: async (data: string, hash: string): Promise<boolean> => {
    const dataHash = await securityUtils.hashData(data);
    return dataHash === hash;
  },
};