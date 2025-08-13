import { NextRequest, NextResponse } from 'next/server';
import { db, serializeVector } from '~/db';
import { documents } from '~/db/schema';
import { embedOne4B } from '~/embeddings';
import { sql } from 'drizzle-orm';
import { 
  SearchRequestSchema, 
  searchRateLimiter, 
  classifyError, 
  getClientIdentifier, 
  getRequestMetadata 
} from '~/lib/validation';
import { logger, generateRequestId, PerformanceTimer, errorTracker, healthMonitor } from '~/lib/logger';



/**
 * Search result interface
 */
interface SearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
  createdAt: string;
}

/**
 * Response schema for successful search
 */
interface SearchResponse {
  success: true;
  query: string;
  results: SearchResult[];
  count: number;
  executionTime: number;
}

/**
 * Error response schema
 */
interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

/**
 * POST /api/search
 * 
 * Performs semantic search using Qwen3-4B embeddings and pgvector cosine similarity.
 * Accepts a query string and returns the most similar documents.
 * 
 * @param request - NextRequest containing search query and parameters
 * @returns NextResponse with search results or error
 */
export async function POST(request: NextRequest): Promise<NextResponse<SearchResponse | ErrorResponse>> {
  const requestId = generateRequestId();
  const timer = new PerformanceTimer();
  const clientId = getClientIdentifier(request);
  const metadata = getRequestMetadata(request);
  
  logger.setRequestId(requestId);
  logger.apiRequest('POST', '/api/search', { clientId, ...metadata });
  
  try {
    // Rate limiting check
    if (!searchRateLimiter.isAllowed(clientId)) {
      logger.rateLimitExceeded(clientId, '/api/search');
      healthMonitor.recordRequest(timer.getDuration(), true);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          details: 'Too many requests. Please try again later.',
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': searchRateLimiter.getRemainingRequests(clientId).toString(),
            'X-RateLimit-Reset': new Date(searchRateLimiter.getResetTime(clientId)).toISOString(),
          }
        }
      );
    }
    
    timer.mark('rate_limit_check');
    
    // Parse and validate request body
    const body = await request.json();
    timer.mark('json_parse');
    
    const validatedData = SearchRequestSchema.parse(body);
    timer.mark('validation');
    
    const { query, k, threshold } = validatedData;
    
    logger.info(`Starting semantic search`, {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      k,
      threshold,
      queryLength: query.length,
    });
    
    // Generate query embedding using Qwen3-4B model
    let queryEmbedding: number[];
    try {
      logger.embeddingRequest('single_embed', 1, { queryLength: query.length });
      const embeddingStart = Date.now();
      
      queryEmbedding = await embedOne4B(query);
      
      const embeddingDuration = Date.now() - embeddingStart;
      timer.mark('embedding_generation');
      
      logger.embeddingResponse('single_embed', 1, embeddingDuration, {
        dimensions: queryEmbedding.length,
      });
    } catch (embeddingError) {
      const error = embeddingError instanceof Error ? embeddingError : new Error('Unknown embedding error');
      logger.embeddingError('single_embed', error, { query: query.substring(0, 100) });
      errorTracker.track(error, { operation: 'single_embed', query: query.substring(0, 100) });
      
      const classifiedError = classifyError(embeddingError);
      healthMonitor.recordRequest(timer.getDuration(), true);
      
      return NextResponse.json(
        {
          success: false,
          error: classifiedError.message,
          details: classifiedError.details,
        },
        { status: classifiedError.statusCode }
      );
    }
    
    // Serialize query embedding for pgvector
    const serializedQueryEmbedding = serializeVector(queryEmbedding);
    
    // Execute semantic search using pgvector cosine similarity
    let searchResults;
    try {
      const searchStart = Date.now();
      
      // Use raw SQL for pgvector cosine similarity search
      // The <=> operator in pgvector computes cosine distance (1 - cosine similarity)
      // We convert it back to similarity by doing (1 - distance)
      searchResults = await db.execute(sql`
        SELECT 
          id,
          content,
          metadata,
          created_at,
          (1 - (embedding <=> ${serializedQueryEmbedding}::vector)) as similarity
        FROM documents
        WHERE (1 - (embedding <=> ${serializedQueryEmbedding}::vector)) >= ${threshold}
        ORDER BY embedding <=> ${serializedQueryEmbedding}::vector
        LIMIT ${k}
      `);
      
      const searchDuration = Date.now() - searchStart;
      timer.mark('database_search');
      
      logger.databaseQuery('VECTOR SIMILARITY SEARCH', searchDuration, {
        resultCount: searchResults.length,
        k,
        threshold,
      });
    } catch (dbError) {
      const error = dbError instanceof Error ? dbError : new Error('Unknown database error');
      logger.databaseError('vector_search', error, { query: query.substring(0, 100), k, threshold });
      errorTracker.track(error, { operation: 'vector_search', query: query.substring(0, 100) });
      
      const classifiedError = classifyError(dbError);
      healthMonitor.recordRequest(timer.getDuration(), true);
      
      return NextResponse.json(
        {
          success: false,
          error: classifiedError.message,
          details: classifiedError.details,
        },
        { status: classifiedError.statusCode }
      );
    }
    
    // Format results
    const formattedResults: SearchResult[] = searchResults.map((row: any) => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata || {},
      similarity: parseFloat(row.similarity.toFixed(6)), // Round to 6 decimal places
      createdAt: row.created_at.toISOString(),
    }));
    
    const totalDuration = timer.getDuration();
    
    // Return successful search response
    const response: SearchResponse = {
      success: true,
      query,
      results: formattedResults,
      count: formattedResults.length,
      executionTime: totalDuration,
    };
    
    logger.apiResponse('POST', '/api/search', 200, totalDuration, {
      resultCount: formattedResults.length,
      averageSimilarity: formattedResults.length > 0 
        ? formattedResults.reduce((sum, r) => sum + r.similarity, 0) / formattedResults.length 
        : 0,
      performanceMarkers: timer.getMarkers(),
    });
    
    healthMonitor.recordRequest(totalDuration, false);
    
    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': totalDuration.toString(),
      }
    });
    
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error('Search API error', { endpoint: '/api/search' }, err);
    errorTracker.track(err, { operation: 'search_api', endpoint: '/api/search' });
    
    const classifiedError = classifyError(error);
    const totalDuration = timer.getDuration();
    
    logger.apiResponse('POST', '/api/search', classifiedError.statusCode, totalDuration, {
      error: classifiedError.category,
      errorCode: classifiedError.code,
    });
    
    healthMonitor.recordRequest(totalDuration, true);
    
    return NextResponse.json(
      {
        success: false,
        error: classifiedError.message,
        details: classifiedError.details,
      },
      { 
        status: classifiedError.statusCode,
        headers: {
          'X-Request-ID': requestId,
          'X-Response-Time': totalDuration.toString(),
        }
      }
    );
  } finally {
    logger.clearRequestId();
  }
}

/**
 * GET /api/search
 * 
 * Returns API documentation and usage information
 */
export async function GET(): Promise<NextResponse> {
  const documentation = {
    endpoint: '/api/search',
    method: 'POST',
    description: 'Perform semantic search using Qwen3-4B embeddings and pgvector cosine similarity',
    requestSchema: {
      query: 'string (required, 1-1000 chars) - The search query text',
      k: 'number (optional, 1-100, default: 10) - Number of results to return',
      threshold: 'number (optional, 0-1, default: 0.0) - Minimum similarity threshold',
    },
    responseSchema: {
      success: 'boolean',
      query: 'string - The original search query',
      results: [
        {
          id: 'string - Document ID',
          content: 'string - Document content',
          metadata: 'object - Document metadata',
          similarity: 'number - Cosine similarity score (0-1)',
          createdAt: 'string - ISO timestamp',
        },
      ],
      count: 'number - Number of results returned',
      executionTime: 'number - Query execution time in milliseconds',
    },
    similarityScoring: {
      description: 'Uses pgvector cosine similarity',
      range: '0.0 (completely different) to 1.0 (identical)',
      algorithm: 'Cosine similarity between query and document embeddings',
      model: 'Qwen3-4B (2560 dimensions)',
    },
    limits: {
      maxQueryLength: 1000,
      maxResults: 100,
      defaultResults: 10,
      minThreshold: 0.0,
      maxThreshold: 1.0,
    },
    examples: {
      request: {
        query: 'machine learning algorithms',
        k: 5,
        threshold: 0.7,
      },
      response: {
        success: true,
        query: 'machine learning algorithms',
        results: [
          {
            id: 'doc123',
            content: 'Machine learning algorithms are computational methods...',
            metadata: {
              title: 'ML Algorithms Guide',
              category: 'education',
              tags: ['ml', 'algorithms'],
            },
            similarity: 0.892456,
            createdAt: '2024-01-15T10:30:00.000Z',
          },
        ],
        count: 1,
        executionTime: 45,
      },
    },
    tips: [
      'Use specific queries for better results',
      'Adjust threshold to filter low-quality matches',
      'Higher k values return more results but may include less relevant ones',
      'Similarity scores above 0.8 typically indicate high relevance',
      'Similarity scores below 0.3 may indicate poor matches',
    ],
  };
  
  return NextResponse.json(documentation);
}