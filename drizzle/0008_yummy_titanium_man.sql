CREATE TABLE "recruiter_availability" (
	"id" text PRIMARY KEY NOT NULL,
	"recruiter_id" text NOT NULL,
	"cal_com_event_type_id" integer NOT NULL,
	"event_type_name" text NOT NULL,
	"event_type_slug" text NOT NULL,
	"duration" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"cal_com_data" jsonb,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_listings" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "job_listings" CASCADE;--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" ALTER COLUMN "job_posting_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" ADD COLUMN "cal_com_booking_id" integer;--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" ADD COLUMN "cal_com_event_type_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" ADD COLUMN "candidate_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" ADD COLUMN "candidate_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" ADD COLUMN "cal_com_data" jsonb;--> statement-breakpoint
ALTER TABLE "recruiter_profiles" ADD COLUMN "cal_com_username" text;--> statement-breakpoint
ALTER TABLE "recruiter_profiles" ADD COLUMN "cal_com_connected" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "recruiter_profiles" ADD COLUMN "cal_com_api_key" text;--> statement-breakpoint
ALTER TABLE "recruiter_profiles" ADD COLUMN "cal_com_user_id" integer;--> statement-breakpoint
ALTER TABLE "recruiter_profiles" ADD COLUMN "cal_com_schedule_id" integer;--> statement-breakpoint
ALTER TABLE "recruiter_availability" ADD CONSTRAINT "recruiter_availability_recruiter_id_recruiter_profiles_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recruiter_availability_recruiter_idx" ON "recruiter_availability" USING btree ("recruiter_id");--> statement-breakpoint
CREATE INDEX "recruiter_availability_event_type_idx" ON "recruiter_availability" USING btree ("cal_com_event_type_id");--> statement-breakpoint
CREATE INDEX "recruiter_availability_active_idx" ON "recruiter_availability" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "interview_sessions_scheduled_cal_com_booking_idx" ON "interview_sessions_scheduled" USING btree ("cal_com_booking_id");--> statement-breakpoint
CREATE INDEX "recruiter_profiles_cal_com_username_idx" ON "recruiter_profiles" USING btree ("cal_com_username");--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" DROP COLUMN "candidate_confirmed";--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" DROP COLUMN "recruiter_confirmed";