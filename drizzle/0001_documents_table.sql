-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint

-- Create documents table for Qwen3-4B embeddings (2560 dimensions)
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"embedding" vector(2560),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create HNSW index on embedding column with vector_cosine_ops
-- Optimized parameters for 2560 dimensions and expected dataset size:
-- m=32: Higher connectivity for better recall with high-dimensional vectors
-- ef_construction=128: Higher build quality for better search accuracy
CREATE INDEX "documents_embedding_idx" ON "documents" 
USING hnsw ("embedding" vector_cosine_ops) 
WITH (m = 32, ef_construction = 128);