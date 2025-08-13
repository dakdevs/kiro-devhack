# Implementation Plan

- [x] 1. Update Docker Compose and database configuration
  - Modify docker-compose.yml to ensure pgvector extension is properly configured
  - Update database initialization to support vector operations
  - Verify PostgreSQL 16 with pgvector extension setup
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Extend Drizzle schema with documents table
  - Add documents table definition with vector(2560) embedding field
  - Include id, content, metadata (JSONB), embedding, and created_at fields
  - Ensure compatibility with existing schema (user, jobApplications, etc.)
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 3. Create database migration for documents table and vector index
  - Generate Drizzle migration for new documents table
  - Add raw SQL migration to enable pgvector extension
  - Create HNSW index on embedding column with vector_cosine_ops
  - Optimize index parameters (m=16, ef_construction=64) for 2560 dimensions
  - _Requirements: 2.3, 2.4_

- [x] 4. Implement database connection utilities with vector support
  - Extend existing database connection in src/db/index.ts
  - Add vector serialization helper function (number[] to pgvector string format)
  - Add vector deserialization helper function (pgvector string to number[])
  - Implement error handling for vector operations
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 5. Create Qwen3-4B embedding client using OpenAI SDK
  - Implement src/embeddings.ts with DashScope API integration
  - Configure OpenAI client with DashScope base URL and API key
  - Create embed4B function for batch embedding generation
  - Create embedOne4B function for single text embedding
  - Add proper error handling and retry logic with exponential backoff
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 6. Update environment configuration
  - Add DASHSCOPE_API_KEY to .env.local
  - Add DASHSCOPE_BASE_URL configuration
  - Add QWEN_MODEL_NAME environment variable
  - Maintain existing DATABASE_URL and other configurations
  - Implement environment variable validation
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 7. Implement document ingestion API endpoint
  - Create src/app/api/ingest/route.ts with POST handler
  - Accept array of documents with content and metadata
  - Generate embeddings using embed4B function
  - Insert documents with embeddings into database using Drizzle
  - Return success response with inserted document count
  - Implement comprehensive error handling with appropriate HTTP status codes
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Implement semantic search API endpoint
  - Create src/app/api/search/route.ts with POST handler
  - Accept query text and optional k parameter for result count
  - Generate query embedding using embedOne4B function
  - Execute pgvector cosine similarity search using raw SQL through Drizzle
  - Return top-k results with similarity scores
  - Handle empty results gracefully with 200 status
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9. Update npm scripts for database management
  - Ensure db:migrate script works with new documents table
  - Add db:dev script to start Docker containers only
  - Update dev script to start both Docker and Next.js development server
  - Provide clear feedback on migration success/failure
  - Add helpful error messages when database is unavailable
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 10. Create comprehensive documentation and examples
  - Write README section with step-by-step setup instructions
  - Document how pnpm dev starts both database and application
  - Include database migration instructions
  - Provide example API calls for testing ingest endpoint
  - Provide example API calls for testing search endpoint
  - Document the complete development workflow
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 11. Add comprehensive error handling and validation
  - Implement Zod schemas for API request validation
  - Add input sanitization for document content and metadata
  - Implement rate limiting handling for DashScope API
  - Add proper logging for debugging and monitoring
  - Create meaningful error messages for all failure scenarios
  - _Requirements: 4.4, 5.5, 6.5, 7.5_

- [x] 12. Create unit tests for core functionality
  - Write tests for embedding client with mocked DashScope responses
  - Test vector serialization/deserialization utilities
  - Test database operations with documents table
  - Test error handling and retry logic
  - Ensure all tests pass and provide good coverage
  - _Requirements: 2.4, 3.4, 4.4_

- [x] 13. Create integration tests for API endpoints
  - Test complete ingest workflow with real embeddings
  - Test search functionality with vector similarity
  - Test error scenarios and edge cases
  - Verify API responses match expected formats
  - Test with various document sizes and content types
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 14. Performance optimization and final testing
  - Optimize HNSW index parameters for expected dataset size
  - Test vector search performance with sample data
  - Verify embedding generation performance and batch processing
  - Test complete development workflow from setup to usage
  - Ensure all requirements are met and system works end-to-end
  - _Requirements: All requirements verification_