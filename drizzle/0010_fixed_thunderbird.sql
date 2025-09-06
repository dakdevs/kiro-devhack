ALTER TABLE "recruiter_availability" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "recruiter_availability" CASCADE;--> statement-breakpoint
DROP INDEX "recruiter_profiles_cal_com_username_idx";--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" ALTER COLUMN "recruiter_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "recruiter_profiles" ADD COLUMN "cal_com_event_type_id" integer;--> statement-breakpoint
CREATE INDEX "recruiter_profiles_cal_com_user_idx" ON "recruiter_profiles" USING btree ("cal_com_user_id");