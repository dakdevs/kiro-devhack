# Design Document

## Overview

This design establishes a comprehensive vector database solution for Qwen3-4B embeddings within the existing Next.js application. The system leverages DashScope's OpenAI-compatible API to generate 2560-dimensional embeddings and stores them using PostgreSQL's pgvector extension with full precision vector data type for optimal accuracy.

The design integrates seamlessly with the existing codebase by:
- Extending the current Drizzle ORM schema with a new documents table
- Utilizing the already-installed OpenAI SDK configured for DashScope endpoints
- Maintaining compatibility with existing authentication and job application features
- Providing efficient vector similarity search capabilities

## Architecture

### System Components

```mermaid
graph TB
    Client[Next.js Client] --> API[API Routes]
    API --> EmbedClient[Embedding Client]
    API --> DB[Database Layer]
    EmbedClient --> DashScope[DashScope API]
    DB --> PostgreSQL[(PostgreSQL + pgvector)]
    
    subgraph "API Routes"
        Ingest[/api/ingest]
        Search[/api/search]
    end
    
    subgraph "Database Layer"
        Drizzle[Drizzle ORM]
        VectorUtils[Vector Utilities]
    end
    
    subgraph "Embedding Client"
        OpenAI[OpenAI SDK]
        QwenClient[Qwen3-4B Client]
    end
```

### Data Flow

1. **Ingestion Flow**: Client → /api/ingest → Embedding Client → DashScope → Database
2. **Search Flow**: Client → /api/search → Embedding Client → DashScope → Vector Search → Results

### Integration Points

- **Existing Schema**: New documents table alongside current user, job_applications, and interviews tables
- **Environment Config**: Extends current .env.local with DashScope-specific variables
- **Database Connection**: Uses existing Drizzle setup with enhanced vector utilities
- **Development Workflow**: Integrates with current Docker Compose and npm scripts

## Components and Interfaces

### Database Schema Extension

```typescript
// New documents table for vector storage
export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  embedding: vector('embedding', { dimensions: 2560 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Maintain existing tables (user, jobApplications, etc.)
```

### Embedding Client Interface

```typescript
interface EmbeddingClient {
  embed4B(inputs: string[]): Promise<number[][]>;
  embedOne4B(input: string): Promise<number[]>;
}

interface EmbeddingConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  dimensions: number;
}
```

### API Route Interfaces

```typescript
// Ingest API
interface IngestRequest {
  documents: Array<{
    content: string;
    metadata?: Record<string, any>;
  }>;
}

interface IngestResponse {
  success: boolean;
  inserted: number;
  errors?: string[];
}

// Search API
interface SearchRequest {
  query: string;
  k?: number;
  threshold?: number;
}

interface SearchResponse {
  results: Array<{
    id: string;
    content: string;
    metadata?: Record<string, any>;
    similarity: number;
  }>;
}
```

### Vector Utilities Interface

```typescript
interface VectorUtils {
  serializeVector(vector: number[]): string;
  deserializeVector(vectorString: string): number[];
  calculateSimilarity(vec1: number[], vec2: number[]): number;
}
```

## Data Models

### Documents Table Schema

```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding vector(2560),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- HNSW index for efficient cosine similarity search
CREATE INDEX documents_embedding_idx ON documents 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);
```

### Environment Configuration

```bash
# Existing variables (maintained)
DATABASE_URL="postgresql://postgres:password@localhost:5432/myapp"
OPENROUTER_API_KEY="..."
BETTER_AUTH_SECRET="..."

# New DashScope configuration
DASHSCOPE_API_KEY="sk-..."
DASHSCOPE_BASE_URL="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
QWEN_MODEL_NAME="text-embedding-v3"
```

### Vector Storage Format

- **Storage Type**: vector(2560) for full precision storage
- **Precision**: 32-bit floating point for maximum accuracy
- **Index Type**: HNSW with cosine distance for optimal search performance
- **Serialization**: pgvector format string for database operations

## Error Handling

### API Error Responses

```typescript
interface APIError {
  error: string;
  code: string;
  details?: any;
}

// Error codes
const ErrorCodes = {
  INVALID_INPUT: 'INVALID_INPUT',
  EMBEDDING_FAILED: 'EMBEDDING_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;
```

### Error Handling Strategy

1. **Input Validation**: Validate request payloads with Zod schemas
2. **API Failures**: Implement exponential backoff retry for DashScope API calls
3. **Database Errors**: Provide meaningful error messages for constraint violations
4. **Rate Limiting**: Handle DashScope API rate limits gracefully
5. **Logging**: Comprehensive error logging for debugging

### Retry Logic

```typescript
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};
```

## Testing Strategy

### Unit Tests

1. **Embedding Client Tests**
   - Mock DashScope API responses
   - Test error handling and retries
   - Validate embedding dimensions and format

2. **Vector Utilities Tests**
   - Test vector serialization/deserialization
   - Validate similarity calculations
   - Test edge cases (empty vectors, invalid formats)

3. **Database Operations Tests**
   - Test document insertion with embeddings
   - Test vector similarity queries
   - Test error handling for invalid data

### Integration Tests

1. **API Route Tests**
   - Test complete ingest workflow
   - Test search functionality with real embeddings
   - Test error scenarios and edge cases

2. **Database Integration Tests**
   - Test pgvector operations with real data
   - Test index performance with large datasets
   - Test migration scripts

### Performance Tests

1. **Embedding Generation Performance**
   - Batch processing efficiency
   - API response times
   - Rate limiting behavior

2. **Vector Search Performance**
   - Query response times with different dataset sizes
   - Index effectiveness
   - Memory usage patterns

### Test Data Strategy

- **Mock Embeddings**: Generate consistent test vectors for unit tests
- **Sample Documents**: Curated set of documents for integration testing
- **Performance Dataset**: Larger dataset for performance benchmarking

## Implementation Phases

### Phase 1: Database Setup
- Extend Docker Compose with pgvector configuration
- Create documents table schema with vector(2560) support
- Implement database migration scripts
- Add vector utility functions

### Phase 2: Embedding Client
- Configure OpenAI SDK for DashScope endpoint
- Implement embed4B and embedOne4B functions
- Add error handling and retry logic
- Create comprehensive tests

### Phase 3: API Routes
- Implement /api/ingest endpoint with batch processing
- Implement /api/search endpoint with vector similarity
- Add input validation and error handling
- Create API documentation

### Phase 4: Integration & Testing
- End-to-end testing of complete workflow
- Performance optimization
- Documentation and examples
- Development workflow integration

## Security Considerations

### API Key Management
- Store DashScope API key securely in environment variables
- Implement API key rotation strategy
- Monitor API usage and costs

### Input Validation
- Sanitize all user inputs before processing
- Validate document content length limits
- Prevent injection attacks in metadata fields

### Rate Limiting
- Implement client-side rate limiting for DashScope API
- Add request queuing for batch operations
- Monitor and alert on unusual usage patterns

### Data Privacy
- Ensure sensitive data is not logged
- Implement proper data retention policies
- Consider encryption for sensitive document content

## Performance Optimization

### Vector Storage Optimization
- Use full precision vector type for maximum accuracy
- Optimize HNSW index parameters for dataset size and 2560 dimensions
- Monitor storage usage and implement archiving strategies for old documents

### Query Optimization
- Use appropriate similarity thresholds
- Implement result caching for common queries
- Optimize batch processing for large datasets

### API Optimization
- Implement request batching for embedding generation
- Use connection pooling for database operations
- Add response caching where appropriate

## Monitoring and Observability

### Metrics to Track
- Embedding generation latency and success rates
- Vector search performance and accuracy
- Database storage usage and growth
- API usage and costs

### Logging Strategy
- Structured logging for all operations
- Error tracking and alerting
- Performance monitoring and profiling

### Health Checks
- Database connectivity and performance
- DashScope API availability and latency
- Vector index health and statistics