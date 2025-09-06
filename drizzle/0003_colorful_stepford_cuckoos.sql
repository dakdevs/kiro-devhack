ALTER TABLE "interview_sessions_scheduled" ALTER COLUMN "job_posting_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "recruiter_availability" ALTER COLUMN "cal_com_event_type_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" ADD COLUMN "cal_com_booking_id" integer;--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" ADD COLUMN "cal_com_event_type_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" ADD COLUMN "candidate_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" ADD COLUMN "candidate_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" ADD COLUMN "cal_com_data" jsonb;--> statement-breakpoint
ALTER TABLE "recruiter_availability" ADD COLUMN "event_type_slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "recruiter_profiles" ADD COLUMN "cal_com_api_key" text;--> statement-breakpoint
ALTER TABLE "recruiter_profiles" ADD COLUMN "cal_com_user_id" integer;--> statement-breakpoint
ALTER TABLE "recruiter_profiles" ADD COLUMN "cal_com_schedule_id" integer;--> statement-breakpoint
CREATE INDEX "interview_sessions_scheduled_cal_com_booking_idx" ON "interview_sessions_scheduled" USING btree ("cal_com_booking_id");--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" DROP COLUMN "candidate_confirmed";--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" DROP COLUMN "recruiter_confirmed";