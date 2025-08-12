-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Example table with vector column
-- CREATE TABLE IF NOT EXISTS embeddings (
--   id SERIAL PRIMARY KEY,
--   content TEXT NOT NULL,
--   embedding vector(1536),
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Example index for vector similarity search
-- CREATE INDEX IF NOT EXISTS embeddings_embedding_idx ON embeddings 
-- USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);