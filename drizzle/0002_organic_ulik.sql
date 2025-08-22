CREATE TABLE "job_applications_from_candidates" (
	"id" text PRIMARY KEY NOT NULL,
	"job_posting_id" text NOT NULL,
	"candidate_user_id" text NOT NULL,
	"cover_letter" text,
	"resume_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_postings" (
	"id" text PRIMARY KEY NOT NULL,
	"recruiter_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"requirements" text,
	"responsibilities" text,
	"salary_min" text,
	"salary_max" text,
	"location" text NOT NULL,
	"job_type" text NOT NULL,
	"experience_level" text,
	"skills" text,
	"benefits" text,
	"application_deadline" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiter_availability" (
	"id" text PRIMARY KEY NOT NULL,
	"recruiter_id" text NOT NULL,
	"job_posting_id" text,
	"day_of_week" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiter_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"company_name" text NOT NULL,
	"company_description" text,
	"company_website" text,
	"company_logo" text,
	"contact_email" text,
	"contact_phone" text,
	"google_calendar_id" text,
	"google_access_token" text,
	"google_refresh_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_applications_from_candidates" ADD CONSTRAINT "job_applications_from_candidates_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications_from_candidates" ADD CONSTRAINT "job_applications_from_candidates_candidate_user_id_user_id_fk" FOREIGN KEY ("candidate_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_recruiter_id_recruiter_profiles_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_availability" ADD CONSTRAINT "recruiter_availability_recruiter_id_recruiter_profiles_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_availability" ADD CONSTRAINT "recruiter_availability_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "recruiter_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;