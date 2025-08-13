CREATE TABLE "interview_chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"message_index" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(2560),
	"metadata" jsonb,
	"current_topic" text,
	"topic_depth" text DEFAULT '0',
	"engagement_level" text,
	"response_score" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_chat_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_name" text,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"total_messages" text DEFAULT '0',
	"max_depth_reached" text DEFAULT '0',
	"average_score" text DEFAULT '0',
	"topic_coverage" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "embedding" SET DATA TYPE vector(2560);--> statement-breakpoint
ALTER TABLE "interview_chat_messages" ADD CONSTRAINT "interview_chat_messages_session_id_interview_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_chat_messages" ADD CONSTRAINT "interview_chat_messages_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_chat_sessions" ADD CONSTRAINT "interview_chat_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;