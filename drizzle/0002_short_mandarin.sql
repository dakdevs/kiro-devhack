CREATE TABLE "recruiter_availability" (
	"id" text PRIMARY KEY NOT NULL,
	"recruiter_id" text NOT NULL,
	"cal_com_event_type_id" text NOT NULL,
	"event_type_name" text NOT NULL,
	"duration" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"cal_com_data" jsonb,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recruiter_profiles" ADD COLUMN "cal_com_username" text;--> statement-breakpoint
ALTER TABLE "recruiter_profiles" ADD COLUMN "cal_com_connected" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "recruiter_availability" ADD CONSTRAINT "recruiter_availability_recruiter_id_recruiter_profiles_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recruiter_availability_recruiter_idx" ON "recruiter_availability" USING btree ("recruiter_id");--> statement-breakpoint
CREATE INDEX "recruiter_availability_event_type_idx" ON "recruiter_availability" USING btree ("cal_com_event_type_id");--> statement-breakpoint
CREATE INDEX "recruiter_availability_active_idx" ON "recruiter_availability" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "recruiter_profiles_cal_com_username_idx" ON "recruiter_profiles" USING btree ("cal_com_username");