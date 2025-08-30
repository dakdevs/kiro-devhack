/**
 * Custom error classes for the interview management system
 */

export class BaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  public readonly field?: string;
  public readonly value?: any;

  constructor(message: string, field?: string, value?: any) {
    super(message, 'VALIDATION_ERROR', 400);
    this.field = field;
    this.value = value;
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

export class NotFoundError extends BaseError {
  public readonly resource?: string;
  public readonly resourceId?: string;

  constructor(message: string, resource?: string, resourceId?: string) {
    super(message, 'NOT_FOUND_ERROR', 404);
    this.resource = resource;
    this.resourceId = resourceId;
  }
}

export class ConflictError extends BaseError {
  public readonly conflictType?: string;
  public readonly conflictingResource?: any;

  constructor(message: string, conflictType?: string, conflictingResource?: any) {
    super(message, 'CONFLICT_ERROR', 409);
    this.conflictType = conflictType;
    this.conflictingResource = conflictingResource;
  }
}

export class SchedulingError extends BaseError {
  public readonly conflicts?: Array<{
    type: string;
    conflictingSlot: any;
    description: string;
  }>;
  public readonly suggestedAlternatives?: any[];

  constructor(
    message: string,
    conflicts?: any[],
    suggestedAlternatives?: any[]
  ) {
    super(message, 'SCHEDULING_ERROR', 409);
    this.conflicts = conflicts;
    this.suggestedAlternatives = suggestedAlternatives;
  }
}

export class AIProcessingError extends BaseError {
  public readonly fallbackData?: any;
  public readonly retryable: boolean;
  public readonly originalError?: Error;

  constructor(
    message: string,
    fallbackData?: any,
    retryable: boolean = true,
    originalError?: Error
  ) {
    super(message, 'AI_PROCESSING_ERROR', 503);
    this.fallbackData = fallbackData;
    this.retryable = retryable;
    this.originalError = originalError;
  }
}

export class DatabaseError extends BaseError {
  public readonly operation?: string;
  public readonly table?: string;
  public readonly originalError?: Error;

  constructor(
    message: string,
    operation?: string,
    table?: string,
    originalError?: Error
  ) {
    super(message, 'DATABASE_ERROR', 500);
    this.operation = operation;
    this.table = table;
    this.originalError = originalError;
  }
}

export class ExternalServiceError extends BaseError {
  public readonly service?: string;
  public readonly retryable: boolean;
  public readonly originalError?: Error;

  constructor(
    message: string,
    service?: string,
    retryable: boolean = true,
    originalError?: Error
  ) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 503);
    this.service = service;
    this.retryable = retryable;
    this.originalError = originalError;
  }
}

export class RateLimitError extends BaseError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.retryAfter = retryAfter;
  }
}

/**
 * Type guard to check if an error is operational
 */
export function isOperationalError(error: Error): error is BaseError {
  return error instanceof BaseError && error.isOperational;
}

/**
 * Error response formatter for API endpoints
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

export function formatErrorResponse(
  error: Error,
  requestId?: string
): ErrorResponse {
  const baseResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  if (error instanceof BaseError) {
    baseResponse.error.code = error.code;
    baseResponse.error.message = error.message;

    // Add specific details based on error type
    if (error instanceof ValidationError) {
      baseResponse.error.details = {
        field: error.field,
        value: error.value,
      };
    } else if (error instanceof NotFoundError) {
      baseResponse.error.details = {
        resource: error.resource,
        resourceId: error.resourceId,
      };
    } else if (error instanceof SchedulingError) {
      baseResponse.error.details = {
        conflicts: error.conflicts,
        suggestedAlternatives: error.suggestedAlternatives,
      };
    } else if (error instanceof AIProcessingError) {
      baseResponse.error.details = {
        fallbackData: error.fallbackData,
        retryable: error.retryable,
      };
    } else if (error instanceof RateLimitError) {
      baseResponse.error.details = {
        retryAfter: error.retryAfter,
      };
    }
  }

  return baseResponse;
}