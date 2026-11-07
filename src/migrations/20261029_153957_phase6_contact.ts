import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_inquiries_inquiry_type" AS ENUM('contact', 'quote');
  CREATE TYPE "public"."enum_inquiries_preferred_contact_method" AS ENUM('email', 'phone', 'whatsapp');
  CREATE TYPE "public"."enum_inquiries_status" AS ENUM('new', 'reviewing', 'contacted', 'quoted', 'completed', 'archived');
  CREATE TYPE "public"."enum_inquiries_priority" AS ENUM('normal', 'high');
  CREATE TYPE "public"."enum_inquiries_notification_status" AS ENUM('disabled', 'pending', 'accepted', 'failed');
  CREATE TABLE "inquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"inquiry_type" "enum_inquiries_inquiry_type" NOT NULL,
  	"full_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"subject" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"project_category_id" integer,
  	"project_category_label" varchar,
  	"project_city" varchar,
  	"estimated_area" numeric,
  	"estimated_budget_range" varchar,
  	"preferred_contact_method" "enum_inquiries_preferred_contact_method",
  	"status" "enum_inquiries_status" DEFAULT 'new' NOT NULL,
  	"priority" "enum_inquiries_priority" DEFAULT 'normal',
  	"internal_notes" varchar,
  	"submitted_at" timestamp(3) with time zone NOT NULL,
  	"notification_status" "enum_inquiries_notification_status" DEFAULT 'disabled',
  	"submission_key" varchar,
  	"submission_hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "form_rate_limits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bucket" varchar NOT NULL,
  	"count" numeric DEFAULT 0 NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"company_name" varchar,
  	"company_description" varchar,
  	"logo_id" integer,
  	"contact_email" varchar,
  	"phone" varchar,
  	"whatsapp_number" varchar,
  	"address" varchar,
  	"city" varchar,
  	"country" varchar,
  	"google_maps_url" varchar,
  	"instagram_url" varchar,
  	"facebook_url" varchar,
  	"linkedin_url" varchar,
  	"youtube_url" varchar,
  	"default_seo_title" varchar,
  	"default_seo_description" varchar,
  	"contact_form_enabled" boolean DEFAULT true,
  	"quote_form_enabled" boolean DEFAULT true,
  	"notification_recipient_email" varchar,
  	"privacy_notice_content" varchar,
  	"privacy_notice_url" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "inquiries_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "form_rate_limits_id" integer;
  ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_project_category_id_project_categories_id_fk" FOREIGN KEY ("project_category_id") REFERENCES "public"."project_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "inquiries_inquiry_type_idx" ON "inquiries" USING btree ("inquiry_type");
  CREATE INDEX "inquiries_project_category_idx" ON "inquiries" USING btree ("project_category_id");
  CREATE INDEX "inquiries_status_idx" ON "inquiries" USING btree ("status");
  CREATE INDEX "inquiries_submitted_at_idx" ON "inquiries" USING btree ("submitted_at");
  CREATE UNIQUE INDEX "inquiries_submission_key_idx" ON "inquiries" USING btree ("submission_key");
  CREATE INDEX "inquiries_updated_at_idx" ON "inquiries" USING btree ("updated_at");
  CREATE INDEX "inquiries_created_at_idx" ON "inquiries" USING btree ("created_at");
  CREATE UNIQUE INDEX "form_rate_limits_bucket_idx" ON "form_rate_limits" USING btree ("bucket");
  CREATE INDEX "form_rate_limits_expires_at_idx" ON "form_rate_limits" USING btree ("expires_at");
  CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inquiries_fk" FOREIGN KEY ("inquiries_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_form_rate_limits_fk" FOREIGN KEY ("form_rate_limits_id") REFERENCES "public"."form_rate_limits"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_inquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("inquiries_id");
  CREATE INDEX "payload_locked_documents_rels_form_rate_limits_id_idx" ON "payload_locked_documents_rels" USING btree ("form_rate_limits_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "inquiries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "form_rate_limits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_inquiries_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_form_rate_limits_fk";
  DROP TABLE "inquiries" CASCADE;
  DROP TABLE "form_rate_limits" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  
  DROP INDEX "payload_locked_documents_rels_inquiries_id_idx";
  DROP INDEX "payload_locked_documents_rels_form_rate_limits_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "inquiries_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "form_rate_limits_id";
  DROP TYPE "public"."enum_inquiries_inquiry_type";
  DROP TYPE "public"."enum_inquiries_preferred_contact_method";
  DROP TYPE "public"."enum_inquiries_status";
  DROP TYPE "public"."enum_inquiries_priority";
  DROP TYPE "public"."enum_inquiries_notification_status";`)
}
