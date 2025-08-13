import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { documents } from '~/db/schema';
import { embed4B } from '~/embeddings';
import { nanoid } from 'nanoid';
import { 
  IngestRequestSchema, 
  ingestRateLimiter, 
  classifyError, 
  getClientIdentifier, 
  getRequestMetadata 
} from '~/lib/validation';
import { logger, generateRequestId, PerformanceTimer, errorTracker, healthMonitor } from '~/lib/logger';



/**
 * Response schema for successful ingestion
 */
interface IngestResponse {
  success: true;
  message: string;
  insertedCount: number;
  documentIds: string[];
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
 * POST /api/ingest
 * 
 * Ingests documents with automatic embedding generation using Qwen3-4B model.
 * Accepts an array of documents with content and optional metadata.
 * 
 * @param request - NextRequest containing document array
 * @returns NextResponse with success/error status
 */
export async function POST(request: NextRequest): Promise<NextResponse<IngestResponse | ErrorResponse>> {
  const requestId = generateRequestId();
  const timer = new PerformanceTimer();
  const clientId = getClientIdentifier(request);
  const metadata = getRequestMetadata(request);
  
  logger.setRequestId(requestId);
  logger.apiRequest('POST', '/api/ingest', { clientId, ...metadata });
  
  try {
    // Rate limiting check
    if (!ingestRateLimiter.isAllowed(clientId)) {
      logger.rateLimitExceeded(clientId, '/api/ingest');
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
            'X-RateLimit-Remaining': ingestRateLimiter.getRemainingRequests(clientId).toString(),
            'X-RateLimit-Reset': new Date(ingestRateLimiter.getResetTime(clientId)).toISOString(),
          }
        }
      );
    }
    
    timer.mark('rate_limit_check');
    
    // Parse and validate request body
    const body = await request.json();
    timer.mark('json_parse');
    
    const validatedData = IngestRequestSchema.parse(body);
    timer.mark('validation');
    
    const { documents: inputDocuments } = validatedData;
    
    // Extract content for embedding generation
    const contentArray = inputDocuments.map(doc => doc.content);
    
    logger.info(`Starting ingestion of ${inputDocuments.length} documents`, {
      documentCount: inputDocuments.length,
      totalContentLength: contentArray.reduce((sum, content) => sum + content.length, 0),
    });
    
    // Generate embeddings using Qwen3-4B model
    let embeddings: number[][];
    try {
      logger.embeddingRequest('batch_embed', contentArray.length);
      const embeddingStart = Date.now();
      
      embeddings = await embed4B(contentArray);
      
      const embeddingDuration = Date.now() - embeddingStart;
      timer.mark('embedding_generation');
      
      logger.embeddingResponse('batch_embed', embeddings.length, embeddingDuration);
    } catch (embeddingError) {
      const error = embeddingError instanceof Error ? embeddingError : new Error('Unknown embedding error');
      logger.embeddingError('batch_embed', error);
      errorTracker.track(error, { operation: 'batch_embed', inputCount: contentArray.length });
      
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
    
    // Verify embedding count matches document count
    if (embeddings.length !== inputDocuments.length) {
      const error = new Error(`Embedding count mismatch: expected ${inputDocuments.length}, got ${embeddings.length}`);
      logger.error('Embedding count mismatch', {
        expected: inputDocuments.length,
        actual: embeddings.length,
      });
      errorTracker.track(error, { operation: 'embedding_validation' });
      healthMonitor.recordRequest(timer.getDuration(), true);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Embedding generation error',
          details: error.message,
        },
        { status: 500 }
      );
    }
    
    // Prepare documents for database insertion
    const documentsToInsert = inputDocuments.map((doc, index) => ({
      id: nanoid(),
      content: doc.content,
      metadata: doc.metadata || {},
      embedding: embeddings[index]!,
    }));
    
    // Insert documents into database
    let insertedDocuments;
    try {
      const dbStart = Date.now();
      
      insertedDocuments = await db
        .insert(documents)
        .values(documentsToInsert)
        .returning({ id: documents.id });
      
      const dbDuration = Date.now() - dbStart;
      timer.mark('database_insert');
      
      logger.databaseQuery('INSERT INTO documents', dbDuration, {
        insertCount: documentsToInsert.length,
      });
    } catch (dbError) {
      const error = dbError instanceof Error ? dbError : new Error('Unknown database error');
      logger.databaseError('document_insert', error);
      errorTracker.track(error, { operation: 'document_insert', documentCount: documentsToInsert.length });
      
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
    
    // Return success response
    const totalDuration = timer.getDuration();
    const response: IngestResponse = {
      success: true,
      message: `Successfully ingested ${insertedDocuments.length} documents`,
      insertedCount: insertedDocuments.length,
      documentIds: insertedDocuments.map(doc => doc.id),
    };
    
    logger.apiResponse('POST', '/api/ingest', 201, totalDuration, {
      insertedCount: insertedDocuments.length,
      performanceMarkers: timer.getMarkers(),
    });
    
    healthMonitor.recordRequest(totalDuration, false);
    
    return NextResponse.json(response, { 
      status: 201,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': totalDuration.toString(),
      }
    });
    
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error('Ingest API error', { endpoint: '/api/ingest' }, err);
    errorTracker.track(err, { operation: 'ingest_api', endpoint: '/api/ingest' });
    
    const classifiedError = classifyError(error);
    const totalDuration = timer.getDuration();
    
    logger.apiResponse('POST', '/api/ingest', classifiedError.statusCode, totalDuration, {
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
 * GET /api/ingest
 * 
 * Returns API documentation and usage information
 */
export async function GET(): Promise<NextResponse> {
  const documentation = {
    endpoint: '/api/ingest',
    method: 'POST',
    description: 'Ingest documents with automatic Qwen3-4B embedding generation',
    requestSchema: {
      documents: [
        {
          content: 'string (required, 1-50000 chars)',
          metadata: 'object (optional)',
        },
      ],
    },
    responseSchema: {
      success: 'boolean',
      message: 'string',
      insertedCount: 'number',
      documentIds: 'string[]',
    },
    limits: {
      maxDocuments: 100,
      maxContentLength: 50000,
    },
    examples: {
      request: {
        documents: [
          {
            content: 'This is a sample document about machine learning.',
            metadata: {
              title: 'ML Introduction',
              category: 'education',
              tags: ['ml', 'ai', 'tutorial'],
            },
          },
          {
            content: 'Another document about vector databases and semantic search.',
            metadata: {
              title: 'Vector Databases',
              category: 'technology',
              tags: ['vectors', 'search', 'database'],
            },
          },
        ],
      },
      response: {
        success: true,
        message: 'Successfully ingested 2 documents',
        insertedCount: 2,
        documentIds: ['abc123', 'def456'],
      },
    },
  };
  
  return NextResponse.json(documentation);
}