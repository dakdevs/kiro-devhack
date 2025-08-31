CREATE TABLE "candidate_availability" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"is_recurring" boolean DEFAULT false,
	"recurrence_pattern" jsonb,
	"status" text DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_job_matches" (
	"id" text PRIMARY KEY NOT NULL,
	"job_posting_id" text NOT NULL,
	"candidate_id" text NOT NULL,
	"match_score" numeric(5, 2) NOT NULL,
	"matching_skills" jsonb,
	"skill_gaps" jsonb,
	"overall_fit" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"read" boolean DEFAULT false,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_sessions_scheduled" (
	"id" text PRIMARY KEY NOT NULL,
	"job_posting_id" text NOT NULL,
	"candidate_id" text NOT NULL,
	"recruiter_id" text NOT NULL,
	"scheduled_start" timestamp NOT NULL,
	"scheduled_end" timestamp NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"interview_type" text DEFAULT 'video',
	"meeting_link" text,
	"notes" text,
	"candidate_confirmed" boolean DEFAULT false,
	"recruiter_confirmed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_postings" (
	"id" text PRIMARY KEY NOT NULL,
	"recruiter_id" text NOT NULL,
	"title" text NOT NULL,
	"raw_description" text NOT NULL,
	"extracted_skills" jsonb,
	"required_skills" jsonb,
	"preferred_skills" jsonb,
	"experience_level" text,
	"salary_min" integer,
	"salary_max" integer,
	"location" text,
	"remote_allowed" boolean DEFAULT false,
	"employment_type" text DEFAULT 'full-time',
	"status" text DEFAULT 'active' NOT NULL,
	"ai_confidence_score" numeric(3, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiter_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_name" text NOT NULL,
	"recruiting_for" text NOT NULL,
	"contact_email" text,
	"phone_number" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate_availability" ADD CONSTRAINT "candidate_availability_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_job_matches" ADD CONSTRAINT "candidate_job_matches_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_job_matches" ADD CONSTRAINT "candidate_job_matches_candidate_id_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_notifications" ADD CONSTRAINT "interview_notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" ADD CONSTRAINT "interview_sessions_scheduled_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" ADD CONSTRAINT "interview_sessions_scheduled_candidate_id_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions_scheduled" ADD CONSTRAINT "interview_sessions_scheduled_recruiter_id_recruiter_profiles_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_recruiter_id_recruiter_profiles_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "recruiter_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "candidate_availability_user_idx" ON "candidate_availability" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "candidate_availability_time_range_idx" ON "candidate_availability" USING btree ("start_time","end_time");--> statement-breakpoint
CREATE INDEX "candidate_availability_status_idx" ON "candidate_availability" USING btree ("status");--> statement-breakpoint
CREATE INDEX "candidate_job_matches_job_posting_idx" ON "candidate_job_matches" USING btree ("job_posting_id");--> statement-breakpoint
CREATE INDEX "candidate_job_matches_candidate_idx" ON "candidate_job_matches" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "candidate_job_matches_match_score_idx" ON "candidate_job_matches" USING btree ("match_score");--> statement-breakpoint
CREATE INDEX "candidate_job_matches_overall_fit_idx" ON "candidate_job_matches" USING btree ("overall_fit");--> statement-breakpoint
CREATE INDEX "interview_notifications_user_idx" ON "interview_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "interview_notifications_type_idx" ON "interview_notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "interview_notifications_read_idx" ON "interview_notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "interview_notifications_created_at_idx" ON "interview_notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "interview_sessions_scheduled_job_posting_idx" ON "interview_sessions_scheduled" USING btree ("job_posting_id");--> statement-breakpoint
CREATE INDEX "interview_sessions_scheduled_candidate_idx" ON "interview_sessions_scheduled" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "interview_sessions_scheduled_recruiter_idx" ON "interview_sessions_scheduled" USING btree ("recruiter_id");--> statement-breakpoint
CREATE INDEX "interview_sessions_scheduled_status_idx" ON "interview_sessions_scheduled" USING btree ("status");--> statement-breakpoint
CREATE INDEX "interview_sessions_scheduled_time_idx" ON "interview_sessions_scheduled" USING btree ("scheduled_start");--> statement-breakpoint
CREATE INDEX "job_postings_recruiter_idx" ON "job_postings" USING btree ("recruiter_id");--> statement-breakpoint
CREATE INDEX "job_postings_status_idx" ON "job_postings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_postings_title_idx" ON "job_postings" USING btree ("title");--> statement-breakpoint
CREATE INDEX "job_postings_location_idx" ON "job_postings" USING btree ("location");--> statement-breakpoint
CREATE INDEX "job_postings_experience_level_idx" ON "job_postings" USING btree ("experience_level");--> statement-breakpoint
CREATE INDEX "recruiter_profiles_user_idx" ON "recruiter_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recruiter_profiles_organization_idx" ON "recruiter_profiles" USING btree ("organization_name");