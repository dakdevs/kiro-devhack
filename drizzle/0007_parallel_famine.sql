CREATE TABLE "job_listings" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"description" text NOT NULL,
	"required_skills" jsonb NOT NULL,
	"preferred_skills" jsonb,
	"location" text NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"job_type" text DEFAULT 'full-time' NOT NULL,
	"experience_level" text NOT NULL,
	"remote_allowed" boolean DEFAULT false,
	"benefits" jsonb,
	"application_url" text,
	"contact_email" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "job_listings_title_idx" ON "job_listings" USING btree ("title");--> statement-breakpoint
CREATE INDEX "job_listings_company_idx" ON "job_listings" USING btree ("company");--> statement-breakpoint
CREATE INDEX "job_listings_location_idx" ON "job_listings" USING btree ("location");--> statement-breakpoint
CREATE INDEX "job_listings_experience_level_idx" ON "job_listings" USING btree ("experience_level");--> statement-breakpoint
CREATE INDEX "job_listings_status_idx" ON "job_listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_listings_job_type_idx" ON "job_listings" USING btree ("job_type");