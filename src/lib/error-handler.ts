/**
 * Error handling utilities for API routes and services
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { 
  BaseError, 
  ValidationError, 
  DatabaseError,
  ExternalServiceError,
  formatErrorResponse,
  isOperationalError 
} from './errors';
import { logger } from './logger';

/**
 * Generate a unique request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract request context for logging
 */
export function getRequestContext(request: NextRequest): {
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
} {
  return {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        undefined,
  };
}

/**
 * Handle errors in API routes with proper logging and response formatting
 */
export function handleApiError(
  error: unknown,
  request: NextRequest,
  requestId: string
): NextResponse {
  const requestContext = getRequestContext(request);
  
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationError = new ValidationError(
      'Validation failed',
      error.issues[0]?.path?.join('.'),
      error.issues[0]?.received
    );
    
    logger.error('Validation error in API request', {
      requestId,
      operation: `${requestContext.method} ${requestContext.url}`,
      metadata: {
        issues: error.issues,
        ...requestContext,
      },
    }, validationError);

    const response = formatErrorResponse(validationError, requestId);
    return NextResponse.json(response, { status: validationError.statusCode });
  }

  // Handle known operational errors
  if (error instanceof BaseError) {
    const logLevel = error.statusCode >= 500 ? 'error' : 'warn';
    
    if (logLevel === 'error') {
      logger.error('Operational error in API request', {
        requestId,
        operation: `${requestContext.method} ${requestContext.url}`,
        metadata: requestContext,
      }, error);
    } else {
      logger.warn('Client error in API request', {
        requestId,
        operation: `${requestContext.method} ${requestContext.url}`,
        metadata: requestContext,
      });
    }

    const response = formatErrorResponse(error, requestId);
    return NextResponse.json(response, { status: error.statusCode });
  }

  // Handle unknown errors
  const unknownError = error instanceof Error ? error : new Error(String(error));
  
  logger.error('Unexpected error in API request', {
    requestId,
    operation: `${requestContext.method} ${requestContext.url}`,
    metadata: requestContext,
  }, unknownError);

  const response = formatErrorResponse(unknownError, requestId);
  return NextResponse.json(response, { status: 500 });
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    try {
      const response = await handler(request, context);
      const duration = Date.now() - startTime;
      
      logger.logAPIRequest(
        request.method,
        new URL(request.url).pathname,
        response.status,
        duration,
        { requestId }
      );
      
      return response;
    } catch (error) {
      return handleApiError(error, request, requestId);
    }
  };
}

/**
 * Wrapper for service functions with error handling and logging
 */
export async function withServiceErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: {
    userId?: string;
    resourceId?: string;
    metadata?: Record<string, any>;
  }
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    logger.info(`Service operation completed: ${operation}`, {
      operation,
      duration,
      ...context,
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Convert database errors to our custom error types
    if (error instanceof Error && error.message.includes('database')) {
      const dbError = new DatabaseError(
        'Database operation failed',
        operation,
        undefined,
        error
      );
      
      logger.error(`Service operation failed: ${operation}`, {
        operation,
        duration,
        ...context,
      }, dbError);
      
      throw dbError;
    }
    
    // Convert external service errors
    if (error instanceof Error && (
      error.message.includes('fetch') || 
      error.message.includes('network') ||
      error.message.includes('timeout')
    )) {
      const serviceError = new ExternalServiceError(
        'External service call failed',
        operation,
        true,
        error
      );
      
      logger.error(`Service operation failed: ${operation}`, {
        operation,
        duration,
        ...context,
      }, serviceError);
      
      throw serviceError;
    }
    
    // Log and re-throw other errors
    logger.error(`Service operation failed: ${operation}`, {
      operation,
      duration,
      ...context,
    }, error as Error);
    
    throw error;
  }
}

/**
 * Retry mechanism for operations that might fail temporarily
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    retryCondition?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    retryCondition = (error) => {
      // Retry on network errors and rate limits
      return error instanceof ExternalServiceError && error.retryable;
    }
  } = options;

  let lastError: Error;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts || !retryCondition(lastError)) {
        throw lastError;
      }
      
      logger.warn(`Operation failed, retrying in ${currentDelay}ms (attempt ${attempt}/${maxAttempts})`, {
        operation: 'retry',
        metadata: { attempt, maxAttempts, delay: currentDelay },
      });
      
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= backoffMultiplier;
    }
  }

  throw lastError!;
}

/**
 * Circuit breaker pattern for external services
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeMs: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeMs) {
        this.state = 'half-open';
      } else {
        throw new ExternalServiceError('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      logger.warn('Circuit breaker opened due to repeated failures', {
        operation: 'circuit-breaker',
        metadata: { failures: this.failures, threshold: this.failureThreshold },
      });
    }
  }
}