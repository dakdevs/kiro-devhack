# Requirements Document

## Introduction

This feature establishes a local development environment for a Next.js application that can store and search Qwen3-4B embeddings using PostgreSQL with pgvector extension. The system will provide a complete vector database solution for semantic search capabilities using 2560-dimensional embeddings from the Qwen3-4B model via Alibaba's DashScope API. DashScope provides an OpenAI-compatible API endpoint, allowing us to use the existing OpenAI SDK by configuring it to point to DashScope's servers while leveraging Qwen3-4B's superior 2560-dimensional embedding capabilities.

## Requirements

### Requirement 1

**User Story:** As a developer, I want a containerized PostgreSQL database with pgvector extension, so that I can store and query high-dimensional embeddings locally.

#### Acceptance Criteria

1. WHEN I run `docker-compose up` THEN the system SHALL start PostgreSQL 16 with pgvector extension enabled
2. WHEN the database starts THEN the system SHALL create a database named "vectordb" with proper credentials
3. WHEN the pgvector extension is loaded THEN the system SHALL support halfvec data type for 2560-dimensional vectors
4. WHEN the container is running THEN the system SHALL expose PostgreSQL on localhost:5432

### Requirement 2

**User Story:** As a developer, I want a properly configured Drizzle ORM schema with pgvector support for 2560-dimensional Qwen3-4B embeddings, so that I can manage high-dimensional vector data with type safety.

#### Acceptance Criteria

1. WHEN I define the schema THEN the system SHALL include a documents table with id, content, metadata, embedding, and created_at fields
2. WHEN I use the embedding field THEN the system SHALL support vector(2560) data type specifically for Qwen3-4B's 2560-dimensional embeddings
3. WHEN I run migrations THEN the system SHALL create the table with proper HNSW cosine similarity index optimized for 2560-dimensional vectors
4. WHEN I query the database THEN the system SHALL provide type-safe operations through Drizzle ORM with proper vector type support
5. WHEN extending the existing schema THEN the system SHALL maintain compatibility with current authentication and job application tables
6. WHEN using vector type THEN the system SHALL provide full precision floating point accuracy for optimal similarity search results

### Requirement 3

**User Story:** As a developer, I want a database connection utility with vector serialization support, so that I can efficiently work with embeddings in my application.

#### Acceptance Criteria

1. WHEN I import the database connection THEN the system SHALL provide a configured Drizzle client with PostgreSQL pool
2. WHEN I need to store vectors THEN the system SHALL provide a helper function to serialize number arrays to pgvector format
3. WHEN the connection pool is created THEN the system SHALL use environment variables for database configuration
4. WHEN database operations fail THEN the system SHALL provide proper error handling

### Requirement 4

**User Story:** As a developer, I want an embedding client for Qwen3-4B model that uses DashScope API through the existing OpenAI SDK, so that I can generate 2560-dimensional embeddings for superior semantic search capabilities.

#### Acceptance Criteria

1. WHEN I call embed4B with an array of strings THEN the system SHALL return a 2D array of 2560-dimensional embeddings using Qwen3-4B model
2. WHEN I call embedOne4B with a single string THEN the system SHALL return a single 2560-dimensional embedding array using Qwen3-4B model
3. WHEN making API calls THEN the system SHALL use the existing OpenAI SDK configured with DashScope's base URL (https://dashscope-intl.aliyuncs.com/compatible-mode/v1)
4. WHEN calling the embedding API THEN the system SHALL specify the Qwen3-4B model name for 2560-dimensional embeddings
5. WHEN API calls fail THEN the system SHALL provide meaningful error messages with retry logic
6. WHEN using the embedding client THEN the system SHALL leverage the existing OpenAI package already installed in the project

### Requirement 5

**User Story:** As a developer, I want an API endpoint to ingest documents with embeddings, so that I can populate the vector database with searchable content.

#### Acceptance Criteria

1. WHEN I POST to /api/ingest with document array THEN the system SHALL accept content and metadata for each document
2. WHEN processing documents THEN the system SHALL generate embeddings using the embed4B function
3. WHEN storing documents THEN the system SHALL insert content, metadata, embeddings, and timestamps into the database
4. WHEN the operation completes THEN the system SHALL return success status with inserted document count
5. WHEN errors occur THEN the system SHALL return appropriate HTTP status codes with error details

### Requirement 6

**User Story:** As a developer, I want an API endpoint to search documents by semantic similarity, so that I can retrieve relevant content based on query text.

#### Acceptance Criteria

1. WHEN I POST to /api/search with query and k parameter THEN the system SHALL accept the search request
2. WHEN processing the query THEN the system SHALL generate an embedding using embedOne4B function
3. WHEN executing search THEN the system SHALL use pgvector cosine similarity with raw SQL through Drizzle
4. WHEN returning results THEN the system SHALL provide top-k documents with similarity scores
5. WHEN no results match THEN the system SHALL return an empty array with 200 status

### Requirement 7

**User Story:** As a developer, I want proper environment configuration that extends the existing setup, so that I can easily configure database connections and API keys for DashScope.

#### Acceptance Criteria

1. WHEN I check the .env file THEN the system SHALL maintain the existing DATABASE_URL for PostgreSQL connection
2. WHEN I check the .env file THEN the system SHALL include DASHSCOPE_API_KEY for the embedding API
3. WHEN I check the .env file THEN the system SHALL include DASHSCOPE_BASE_URL for the DashScope endpoint configuration
4. WHEN the application starts THEN the system SHALL validate required environment variables
5. WHEN environment variables are missing THEN the system SHALL provide clear error messages
6. WHEN using DashScope THEN the system SHALL configure the OpenAI client to use the DashScope-compatible endpoint

### Requirement 8

**User Story:** As a developer, I want convenient npm scripts for database management and development workflow, so that I can easily run migrations and start the full development environment.

#### Acceptance Criteria

1. WHEN I run `npm run db:migrate` THEN the system SHALL execute Drizzle migrations against the database
2. WHEN I run `pnpm dev` THEN the system SHALL start both the Docker containers and the Next.js development server
3. WHEN migrations run THEN the system SHALL create tables and indexes as defined in the schema
4. WHEN migration scripts execute THEN the system SHALL provide clear feedback on success or failure
5. WHEN the database is not available THEN the system SHALL provide helpful error messages
6. WHEN I run `pnpm dev:db` THEN the system SHALL start only the Docker database container

### Requirement 9

**User Story:** As a developer, I want clear documentation for setup and testing, so that I can quickly get the development environment running with a single command.

#### Acceptance Criteria

1. WHEN I read the README THEN the system SHALL provide step-by-step instructions for the complete setup process
2. WHEN I read the README THEN the system SHALL explain how `pnpm dev` starts both database and application
3. WHEN I read the README THEN the system SHALL include instructions for running database migrations
4. WHEN I read the README THEN the system SHALL provide examples for testing the ingest and search endpoints
5. WHEN I follow the setup instructions THEN the system SHALL result in a fully functional development environment
6. WHEN I run the single development command THEN the system SHALL handle Docker container startup automatically