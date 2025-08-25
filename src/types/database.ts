import { z } from 'zod';

// =============================================================================
// DATABASE UTILITY TYPES
// =============================================================================

// Generic database entity with common fields
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Database insert type (excludes auto-generated fields)
export type InsertEntity<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

// Database update type (makes all fields optional except id)
export type UpdateEntity<T extends BaseEntity> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> & {
  id: string;
};

// Database select options
export interface SelectOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

// Database filter operators
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'ilike';

// Database filter condition
export interface FilterCondition<T = any> {
  field: string;
  operator: FilterOperator;
  value: T;
}

// Database query builder
export interface QueryBuilder<T> {
  where?: FilterCondition[];
  select?: (keyof T)[];
  include?: string[];
  orderBy?: {
    field: keyof T;
    direction: 'asc' | 'desc';
  }[];
  limit?: number;
  offset?: number;
}

// =============================================================================
// API ERROR TYPES
// =============================================================================

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error categories
export type ErrorCategory = 
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'conflict'
  | 'rate_limit'
  | 'server_error'
  | 'external_service'
  | 'database'
  | 'network';

// Detailed error information
export interface ApiError {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  field?: string;
  details?: Record<string, any>;
  timestamp: Date;
  requestId?: string;
}

// Validation error details
export interface ValidationError extends ApiError {
  category: 'validation';
  field: string;
  value?: any;
  constraint?: string;
}

// Multiple validation errors
export interface ValidationErrors {
  errors: ValidationError[];
  message: string;
}

// Error response wrapper
export interface ErrorResponse {
  success: false;
  error: ApiError | ValidationErrors;
  requestId?: string;
  timestamp: Date;
}

// =============================================================================
// PAGINATION TYPES
// =============================================================================

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

// Cursor-based pagination
export interface CursorPagination {
  cursor?: string;
  limit?: number;
}

// Cursor pagination metadata
export interface CursorPaginationMeta {
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
  prevCursor?: string;
  limit: number;
}

// =============================================================================
// SEARCH AND FILTERING TYPES
// =============================================================================

// Search parameters
export interface SearchParams {
  query?: string;
  fields?: string[];
  fuzzy?: boolean;
  minScore?: number;
}

// Sort parameters
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

// Filter parameters
export interface FilterParams {
  [key: string]: any;
}

// Combined query parameters
export interface QueryParams extends PaginationParams {
  search?: SearchParams;
  sort?: SortParams[];
  filters?: FilterParams;
}

// =============================================================================
// AUDIT AND LOGGING TYPES
// =============================================================================

// Audit log entry
export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// Structured log entry
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: Error;
  requestId?: string;
  userId?: string;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

// Pagination validation
export const paginationParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

// Search validation
export const searchParamsSchema = z.object({
  query: z.string().min(1).optional(),
  fields: z.array(z.string()).optional(),
  fuzzy: z.boolean().default(false),
  minScore: z.number().min(0).max(1).optional(),
});

// Sort validation
export const sortParamsSchema = z.object({
  field: z.string().min(1),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

// Query parameters validation
export const queryParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  search: searchParamsSchema.optional(),
  sort: z.array(sortParamsSchema).optional(),
  filters: z.record(z.string(), z.any()).optional(),
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Create pagination metadata
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// Create cursor pagination metadata
export function createCursorPaginationMeta(
  items: any[],
  limit: number,
  getCursor: (item: any) => string
): CursorPaginationMeta {
  const hasNext = items.length === limit;
  const nextCursor = hasNext && items.length > 0 ? getCursor(items[items.length - 1]) : undefined;
  
  return {
    hasNext,
    hasPrev: false, // Would need additional logic to determine
    nextCursor,
    limit,
  };
}

// Create API error
export function createApiError(
  code: string,
  message: string,
  category: ErrorCategory,
  severity: ErrorSeverity = 'medium',
  details?: Record<string, any>
): ApiError {
  return {
    code,
    message,
    category,
    severity,
    details,
    timestamp: new Date(),
  };
}

// Create validation error
export function createValidationError(
  field: string,
  message: string,
  value?: any,
  constraint?: string
): ValidationError {
  return {
    code: 'VALIDATION_ERROR',
    message,
    category: 'validation',
    severity: 'medium',
    field,
    value,
    constraint,
    timestamp: new Date(),
  };
}

// Format Zod errors as validation errors
export function formatZodErrors(error: z.ZodError): ValidationErrors {
  const errors: ValidationError[] = error.issues.map(err => ({
    code: 'VALIDATION_ERROR',
    message: err.message,
    category: 'validation',
    severity: 'medium' as ErrorSeverity,
    field: err.path.join('.'),
    value: err.code === 'invalid_type' ? (err as any).received : undefined,
    constraint: err.code,
    timestamp: new Date(),
  }));

  return {
    errors,
    message: `Validation failed for ${errors.length} field(s)`,
  };
}

// Type guard for API error
export function isApiError(error: any): error is ApiError {
  return (
    error &&
    typeof error === 'object' &&
    typeof error.code === 'string' &&
    typeof error.message === 'string' &&
    typeof error.category === 'string' &&
    typeof error.severity === 'string'
  );
}

// Type guard for validation errors
export function isValidationErrors(error: any): error is ValidationErrors {
  return (
    error &&
    typeof error === 'object' &&
    Array.isArray(error.errors) &&
    typeof error.message === 'string'
  );
}

// Extract error message from various error types
export function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (isApiError(error)) {
    return error.message;
  }
  
  if (isValidationErrors(error)) {
    return error.message;
  }
  
  return 'An unknown error occurred';
}