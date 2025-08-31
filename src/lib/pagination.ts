import { SQL, sql } from 'drizzle-orm';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
  allowedSortFields?: string[];
}

export class PaginationHelper {
  private defaultLimit: number;
  private maxLimit: number;
  private allowedSortFields: string[];

  constructor(options: PaginationOptions = {}) {
    this.defaultLimit = options.defaultLimit || 20;
    this.maxLimit = options.maxLimit || 100;
    this.allowedSortFields = options.allowedSortFields || [];
  }

  // Validate and normalize pagination parameters
  validateParams(params: PaginationParams): Required<PaginationParams> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(
      this.maxLimit,
      Math.max(1, params.limit || this.defaultLimit)
    );

    let sortBy = params.sortBy || 'createdAt';
    if (this.allowedSortFields.length > 0 && !this.allowedSortFields.includes(sortBy)) {
      sortBy = this.allowedSortFields[0] || 'createdAt';
    }

    const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';

    return { page, limit, sortBy, sortOrder };
  }

  // Calculate offset for database queries
  getOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  // Create pagination result
  createResult<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): PaginationResult<T> {
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  // Generate SQL for sorting
  getSortSQL(sortBy: string, sortOrder: 'asc' | 'desc', tableColumns: Record<string, any>): SQL {
    const column = tableColumns[sortBy];
    if (!column) {
      throw new Error(`Invalid sort field: ${sortBy}`);
    }

    return sortOrder === 'asc' ? sql`${column} ASC` : sql`${column} DESC`;
  }
}

// Pre-configured pagination helpers for different entities
export const paginationHelpers = {
  jobPostings: new PaginationHelper({
    defaultLimit: 20,
    maxLimit: 50,
    allowedSortFields: ['createdAt', 'updatedAt', 'title', 'status', 'experienceLevel'],
  }),

  candidates: new PaginationHelper({
    defaultLimit: 15,
    maxLimit: 50,
    allowedSortFields: ['createdAt', 'name', 'matchScore', 'proficiencyScore'],
  }),

  interviews: new PaginationHelper({
    defaultLimit: 10,
    maxLimit: 50,
    allowedSortFields: ['scheduledStart', 'createdAt', 'status'],
  }),

  notifications: new PaginationHelper({
    defaultLimit: 25,
    maxLimit: 100,
    allowedSortFields: ['createdAt', 'type', 'read'],
  }),

  availability: new PaginationHelper({
    defaultLimit: 20,
    maxLimit: 100,
    allowedSortFields: ['startTime', 'createdAt', 'status'],
  }),

  skillMentions: new PaginationHelper({
    defaultLimit: 50,
    maxLimit: 200,
    allowedSortFields: ['createdAt', 'confidence', 'engagementLevel'],
  }),
};

// Cursor-based pagination for real-time data
export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

export interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
    limit: number;
  };
}

export class CursorPaginationHelper {
  private defaultLimit: number;
  private maxLimit: number;

  constructor(defaultLimit: number = 20, maxLimit: number = 100) {
    this.defaultLimit = defaultLimit;
    this.maxLimit = maxLimit;
  }

  validateParams(params: CursorPaginationParams): Required<CursorPaginationParams> {
    const limit = Math.min(
      this.maxLimit,
      Math.max(1, params.limit || this.defaultLimit)
    );
    const cursor = params.cursor || '';
    const direction = params.direction || 'forward';

    return { cursor, limit, direction };
  }

  // Encode cursor from timestamp and ID
  encodeCursor(timestamp: Date, id: string): string {
    const data = { timestamp: timestamp.toISOString(), id };
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  // Decode cursor to timestamp and ID
  decodeCursor(cursor: string): { timestamp: Date; id: string } | null {
    try {
      const data = JSON.parse(Buffer.from(cursor, 'base64').toString());
      return {
        timestamp: new Date(data.timestamp),
        id: data.id,
      };
    } catch {
      return null;
    }
  }

  createResult<T extends { id: string; createdAt: Date }>(
    data: T[],
    limit: number,
    requestedMore: boolean = false
  ): CursorPaginationResult<T> {
    const hasNext = data.length > limit;
    const hasPrev = requestedMore; // This would be determined by the query logic

    // Remove extra item if we fetched limit + 1
    if (hasNext) {
      data.pop();
    }

    let nextCursor: string | undefined;
    let prevCursor: string | undefined;

    if (data.length > 0) {
      const lastItem = data[data.length - 1];
      const firstItem = data[0];

      if (hasNext) {
        nextCursor = this.encodeCursor(lastItem.createdAt, lastItem.id);
      }
      if (hasPrev) {
        prevCursor = this.encodeCursor(firstItem.createdAt, firstItem.id);
      }
    }

    return {
      data,
      pagination: {
        hasNext,
        hasPrev,
        nextCursor,
        prevCursor,
        limit,
      },
    };
  }
}

// Search and filter utilities
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

export class SearchHelper {
  // Generate full-text search SQL
  static generateSearchSQL(
    query: string,
    searchFields: string[],
    tableColumns: Record<string, any>
  ): SQL {
    if (!query.trim()) {
      return sql`TRUE`;
    }

    const searchTerms = query.trim().split(/\s+/).map(term => `%${term}%`);
    const conditions: SQL[] = [];

    for (const field of searchFields) {
      const column = tableColumns[field];
      if (column) {
        for (const term of searchTerms) {
          conditions.push(sql`LOWER(${column}) LIKE LOWER(${term})`);
        }
      }
    }

    return conditions.length > 0 
      ? sql`(${sql.join(conditions, sql` OR `)})`
      : sql`TRUE`;
  }

  // Generate filter SQL
  static generateFilterSQL(
    filters: Record<string, any>,
    tableColumns: Record<string, any>
  ): SQL {
    const conditions: SQL[] = [];

    for (const [key, value] of Object.entries(filters)) {
      const column = tableColumns[key];
      if (!column || value === undefined || value === null) continue;

      if (Array.isArray(value)) {
        if (value.length > 0) {
          conditions.push(sql`${column} IN ${value}`);
        }
      } else if (typeof value === 'string') {
        conditions.push(sql`${column} = ${value}`);
      } else if (typeof value === 'number') {
        conditions.push(sql`${column} = ${value}`);
      } else if (typeof value === 'boolean') {
        conditions.push(sql`${column} = ${value}`);
      }
    }

    return conditions.length > 0 
      ? sql`(${sql.join(conditions, sql` AND `)})`
      : sql`TRUE`;
  }

  // Generate date range SQL
  static generateDateRangeSQL(
    dateRange: { start?: Date; end?: Date },
    dateColumn: any
  ): SQL {
    const conditions: SQL[] = [];

    if (dateRange.start) {
      conditions.push(sql`${dateColumn} >= ${dateRange.start}`);
    }
    if (dateRange.end) {
      conditions.push(sql`${dateColumn} <= ${dateRange.end}`);
    }

    return conditions.length > 0 
      ? sql`(${sql.join(conditions, sql` AND `)})`
      : sql`TRUE`;
  }
}

// Lazy loading utilities for large datasets
export class LazyLoader<T> {
  private loadFn: (offset: number, limit: number) => Promise<T[]>;
  private batchSize: number;
  private cache: Map<number, T[]> = new Map();

  constructor(
    loadFn: (offset: number, limit: number) => Promise<T[]>,
    batchSize: number = 50
  ) {
    this.loadFn = loadFn;
    this.batchSize = batchSize;
  }

  async loadBatch(batchIndex: number): Promise<T[]> {
    if (this.cache.has(batchIndex)) {
      return this.cache.get(batchIndex)!;
    }

    const offset = batchIndex * this.batchSize;
    const data = await this.loadFn(offset, this.batchSize);
    
    this.cache.set(batchIndex, data);
    return data;
  }

  async loadRange(startIndex: number, endIndex: number): Promise<T[]> {
    const startBatch = Math.floor(startIndex / this.batchSize);
    const endBatch = Math.floor(endIndex / this.batchSize);
    
    const batches = await Promise.all(
      Array.from({ length: endBatch - startBatch + 1 }, (_, i) =>
        this.loadBatch(startBatch + i)
      )
    );

    const allData = batches.flat();
    const localStartIndex = startIndex % this.batchSize;
    const localEndIndex = localStartIndex + (endIndex - startIndex);
    
    return allData.slice(localStartIndex, localEndIndex + 1);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Export utility functions
export const paginationUtils = {
  // Calculate total pages
  calculateTotalPages: (total: number, limit: number): number => {
    return Math.ceil(total / limit);
  },

  // Generate page numbers for pagination UI
  generatePageNumbers: (
    currentPage: number,
    totalPages: number,
    maxVisible: number = 5
  ): number[] => {
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  },

  // Validate page number
  validatePage: (page: number, totalPages: number): number => {
    return Math.max(1, Math.min(totalPages, page));
  },
};