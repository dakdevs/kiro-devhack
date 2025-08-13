-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify pgvector extension is loaded
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

-- Set up database for optimal vector operations with 2000-dimensional embeddings
-- Increase work_mem for better vector operations performance
ALTER SYSTEM SET work_mem = '256MB';

-- Optimize for vector operations
ALTER SYSTEM SET shared_preload_libraries = 'vector';

-- Reload configuration
SELECT pg_reload_conf();