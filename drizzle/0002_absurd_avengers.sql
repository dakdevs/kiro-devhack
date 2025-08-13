ALTER TABLE "documents" ALTER COLUMN "embedding" SET DATA TYPE vector(2000);
--> statement-breakpoint

-- Create HNSW index on embedding column with vector_cosine_ops
-- Optimized parameters: m=16, ef_construction=64 for 2000 dimensions
CREATE INDEX "documents_embedding_idx" ON "documents" 
USING hnsw ("embedding" vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);