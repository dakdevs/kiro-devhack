ALTER TABLE "embeddings" ALTER COLUMN "embedding" SET DATA TYPE vector(768);--> statement-breakpoint
ALTER TABLE "user_responses" ALTER COLUMN "embedding" SET DATA TYPE vector(768);