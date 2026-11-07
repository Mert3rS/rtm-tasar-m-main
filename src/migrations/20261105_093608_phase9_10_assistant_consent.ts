import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_assistant_answers_actions_kind" AS ENUM('route', 'settings', 'consent');
  CREATE TYPE "public"."enum_assistant_answers_actions_settings_link" AS ENUM('whatsapp', 'email', 'phone', 'maps', 'instagram', 'facebook', 'linkedin', 'youtube', 'privacyNotice', 'cookiePolicy');
  CREATE TYPE "public"."enum_assistant_answers_topic" AS ENUM('general', 'pricing', 'delivery', 'warranty', 'stock', 'hours', 'services', 'projects', 'models', 'showroom', 'studio', 'quote', 'contact', 'about', 'privacy');
  CREATE TYPE "public"."enum_assistant_answers_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__assistant_answers_v_version_actions_kind" AS ENUM('route', 'settings', 'consent');
  CREATE TYPE "public"."enum__assistant_answers_v_version_actions_settings_link" AS ENUM('whatsapp', 'email', 'phone', 'maps', 'instagram', 'facebook', 'linkedin', 'youtube', 'privacyNotice', 'cookiePolicy');
  CREATE TYPE "public"."enum__assistant_answers_v_version_topic" AS ENUM('general', 'pricing', 'delivery', 'warranty', 'stock', 'hours', 'services', 'projects', 'models', 'showroom', 'studio', 'quote', 'contact', 'about', 'privacy');
  CREATE TYPE "public"."enum__assistant_answers_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_faqs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__faqs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_consent_records_source" AS ENUM('banner', 'preferences', 'revoke');
  CREATE TABLE "assistant_answers_triggers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"phrase" varchar
  );
  
  CREATE TABLE "assistant_answers_example_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar
  );
  
  CREATE TABLE "assistant_answers_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"kind" "enum_assistant_answers_actions_kind" DEFAULT 'route',
  	"route" varchar,
  	"settings_link" "enum_assistant_answers_actions_settings_link"
  );
  
  CREATE TABLE "assistant_answers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"topic" "enum_assistant_answers_topic" DEFAULT 'general',
  	"answer" jsonb,
  	"priority" numeric DEFAULT 0,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_assistant_answers_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_assistant_answers_v_version_triggers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"phrase" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_assistant_answers_v_version_example_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_assistant_answers_v_version_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"kind" "enum__assistant_answers_v_version_actions_kind" DEFAULT 'route',
  	"route" varchar,
  	"settings_link" "enum__assistant_answers_v_version_actions_settings_link",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_assistant_answers_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_topic" "enum__assistant_answers_v_version_topic" DEFAULT 'general',
  	"version_answer" jsonb,
  	"version_priority" numeric DEFAULT 0,
  	"version_active" boolean DEFAULT true,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__assistant_answers_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb,
  	"category" varchar,
  	"display_order" numeric DEFAULT 0,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_faqs_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_faqs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_question" varchar,
  	"version_answer" jsonb,
  	"version_category" varchar,
  	"version_display_order" numeric DEFAULT 0,
  	"version_active" boolean DEFAULT true,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__faqs_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "assistant_unanswered" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"normalized" varchar NOT NULL,
  	"count" numeric DEFAULT 1 NOT NULL,
  	"last_seen_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "assistant_feedback" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"answer_key" varchar NOT NULL,
  	"helpful" numeric DEFAULT 0 NOT NULL,
  	"not_helpful" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "consent_records" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"consent_id" varchar NOT NULL,
  	"policy_version" varchar NOT NULL,
  	"functional" boolean DEFAULT false,
  	"personalization" boolean DEFAULT false,
  	"analytics" boolean DEFAULT false,
  	"marketing" boolean DEFAULT false,
  	"source" "enum_consent_records_source" NOT NULL,
  	"decided_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "assistant_settings_quick_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"question" varchar
  );
  
  CREATE TABLE "assistant_settings_synonym_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"words" varchar NOT NULL
  );
  
  CREATE TABLE "assistant_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT false,
  	"display_name" varchar,
  	"tagline" varchar,
  	"welcome_message" varchar,
  	"fallback_message" varchar,
  	"log_unanswered" boolean DEFAULT false,
  	"unanswered_retention_days" numeric DEFAULT 90,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "assistant_answers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "faqs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "assistant_unanswered_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "assistant_feedback_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "consent_records_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "cookie_policy_content" jsonb;
  ALTER TABLE "site_settings" ADD COLUMN "cookie_policy_url" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "cookie_policy_version" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "cookie_policy_updated_at" timestamp(3) with time zone;
  ALTER TABLE "site_settings" ADD COLUMN "consent_banner_title" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "consent_banner_description" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "consent_record_retention_days" numeric DEFAULT 365;
  ALTER TABLE "assistant_answers_triggers" ADD CONSTRAINT "assistant_answers_triggers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."assistant_answers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "assistant_answers_example_questions" ADD CONSTRAINT "assistant_answers_example_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."assistant_answers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "assistant_answers_actions" ADD CONSTRAINT "assistant_answers_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."assistant_answers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_assistant_answers_v_version_triggers" ADD CONSTRAINT "_assistant_answers_v_version_triggers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_assistant_answers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_assistant_answers_v_version_example_questions" ADD CONSTRAINT "_assistant_answers_v_version_example_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_assistant_answers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_assistant_answers_v_version_actions" ADD CONSTRAINT "_assistant_answers_v_version_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_assistant_answers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_assistant_answers_v" ADD CONSTRAINT "_assistant_answers_v_parent_id_assistant_answers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."assistant_answers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_faqs_v" ADD CONSTRAINT "_faqs_v_parent_id_faqs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."faqs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "assistant_settings_quick_questions" ADD CONSTRAINT "assistant_settings_quick_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."assistant_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "assistant_settings_synonym_groups" ADD CONSTRAINT "assistant_settings_synonym_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."assistant_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "assistant_answers_triggers_order_idx" ON "assistant_answers_triggers" USING btree ("_order");
  CREATE INDEX "assistant_answers_triggers_parent_id_idx" ON "assistant_answers_triggers" USING btree ("_parent_id");
  CREATE INDEX "assistant_answers_example_questions_order_idx" ON "assistant_answers_example_questions" USING btree ("_order");
  CREATE INDEX "assistant_answers_example_questions_parent_id_idx" ON "assistant_answers_example_questions" USING btree ("_parent_id");
  CREATE INDEX "assistant_answers_actions_order_idx" ON "assistant_answers_actions" USING btree ("_order");
  CREATE INDEX "assistant_answers_actions_parent_id_idx" ON "assistant_answers_actions" USING btree ("_parent_id");
  CREATE INDEX "assistant_answers_active_idx" ON "assistant_answers" USING btree ("active");
  CREATE INDEX "assistant_answers_updated_at_idx" ON "assistant_answers" USING btree ("updated_at");
  CREATE INDEX "assistant_answers_created_at_idx" ON "assistant_answers" USING btree ("created_at");
  CREATE INDEX "assistant_answers__status_idx" ON "assistant_answers" USING btree ("_status");
  CREATE INDEX "_assistant_answers_v_version_triggers_order_idx" ON "_assistant_answers_v_version_triggers" USING btree ("_order");
  CREATE INDEX "_assistant_answers_v_version_triggers_parent_id_idx" ON "_assistant_answers_v_version_triggers" USING btree ("_parent_id");
  CREATE INDEX "_assistant_answers_v_version_example_questions_order_idx" ON "_assistant_answers_v_version_example_questions" USING btree ("_order");
  CREATE INDEX "_assistant_answers_v_version_example_questions_parent_id_idx" ON "_assistant_answers_v_version_example_questions" USING btree ("_parent_id");
  CREATE INDEX "_assistant_answers_v_version_actions_order_idx" ON "_assistant_answers_v_version_actions" USING btree ("_order");
  CREATE INDEX "_assistant_answers_v_version_actions_parent_id_idx" ON "_assistant_answers_v_version_actions" USING btree ("_parent_id");
  CREATE INDEX "_assistant_answers_v_parent_idx" ON "_assistant_answers_v" USING btree ("parent_id");
  CREATE INDEX "_assistant_answers_v_version_version_active_idx" ON "_assistant_answers_v" USING btree ("version_active");
  CREATE INDEX "_assistant_answers_v_version_version_updated_at_idx" ON "_assistant_answers_v" USING btree ("version_updated_at");
  CREATE INDEX "_assistant_answers_v_version_version_created_at_idx" ON "_assistant_answers_v" USING btree ("version_created_at");
  CREATE INDEX "_assistant_answers_v_version_version__status_idx" ON "_assistant_answers_v" USING btree ("version__status");
  CREATE INDEX "_assistant_answers_v_created_at_idx" ON "_assistant_answers_v" USING btree ("created_at");
  CREATE INDEX "_assistant_answers_v_updated_at_idx" ON "_assistant_answers_v" USING btree ("updated_at");
  CREATE INDEX "_assistant_answers_v_latest_idx" ON "_assistant_answers_v" USING btree ("latest");
  CREATE INDEX "faqs_display_order_idx" ON "faqs" USING btree ("display_order");
  CREATE INDEX "faqs_active_idx" ON "faqs" USING btree ("active");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE INDEX "faqs__status_idx" ON "faqs" USING btree ("_status");
  CREATE INDEX "_faqs_v_parent_idx" ON "_faqs_v" USING btree ("parent_id");
  CREATE INDEX "_faqs_v_version_version_display_order_idx" ON "_faqs_v" USING btree ("version_display_order");
  CREATE INDEX "_faqs_v_version_version_active_idx" ON "_faqs_v" USING btree ("version_active");
  CREATE INDEX "_faqs_v_version_version_updated_at_idx" ON "_faqs_v" USING btree ("version_updated_at");
  CREATE INDEX "_faqs_v_version_version_created_at_idx" ON "_faqs_v" USING btree ("version_created_at");
  CREATE INDEX "_faqs_v_version_version__status_idx" ON "_faqs_v" USING btree ("version__status");
  CREATE INDEX "_faqs_v_created_at_idx" ON "_faqs_v" USING btree ("created_at");
  CREATE INDEX "_faqs_v_updated_at_idx" ON "_faqs_v" USING btree ("updated_at");
  CREATE INDEX "_faqs_v_latest_idx" ON "_faqs_v" USING btree ("latest");
  CREATE UNIQUE INDEX "assistant_unanswered_normalized_idx" ON "assistant_unanswered" USING btree ("normalized");
  CREATE INDEX "assistant_unanswered_last_seen_at_idx" ON "assistant_unanswered" USING btree ("last_seen_at");
  CREATE INDEX "assistant_unanswered_updated_at_idx" ON "assistant_unanswered" USING btree ("updated_at");
  CREATE INDEX "assistant_unanswered_created_at_idx" ON "assistant_unanswered" USING btree ("created_at");
  CREATE UNIQUE INDEX "assistant_feedback_answer_key_idx" ON "assistant_feedback" USING btree ("answer_key");
  CREATE INDEX "assistant_feedback_updated_at_idx" ON "assistant_feedback" USING btree ("updated_at");
  CREATE INDEX "assistant_feedback_created_at_idx" ON "assistant_feedback" USING btree ("created_at");
  CREATE INDEX "consent_records_consent_id_idx" ON "consent_records" USING btree ("consent_id");
  CREATE INDEX "consent_records_decided_at_idx" ON "consent_records" USING btree ("decided_at");
  CREATE INDEX "consent_records_updated_at_idx" ON "consent_records" USING btree ("updated_at");
  CREATE INDEX "consent_records_created_at_idx" ON "consent_records" USING btree ("created_at");
  CREATE INDEX "assistant_settings_quick_questions_order_idx" ON "assistant_settings_quick_questions" USING btree ("_order");
  CREATE INDEX "assistant_settings_quick_questions_parent_id_idx" ON "assistant_settings_quick_questions" USING btree ("_parent_id");
  CREATE INDEX "assistant_settings_synonym_groups_order_idx" ON "assistant_settings_synonym_groups" USING btree ("_order");
  CREATE INDEX "assistant_settings_synonym_groups_parent_id_idx" ON "assistant_settings_synonym_groups" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_assistant_answers_fk" FOREIGN KEY ("assistant_answers_id") REFERENCES "public"."assistant_answers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_assistant_unanswered_fk" FOREIGN KEY ("assistant_unanswered_id") REFERENCES "public"."assistant_unanswered"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_assistant_feedback_fk" FOREIGN KEY ("assistant_feedback_id") REFERENCES "public"."assistant_feedback"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_consent_records_fk" FOREIGN KEY ("consent_records_id") REFERENCES "public"."consent_records"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_assistant_answers_id_idx" ON "payload_locked_documents_rels" USING btree ("assistant_answers_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_assistant_unanswered_id_idx" ON "payload_locked_documents_rels" USING btree ("assistant_unanswered_id");
  CREATE INDEX "payload_locked_documents_rels_assistant_feedback_id_idx" ON "payload_locked_documents_rels" USING btree ("assistant_feedback_id");
  CREATE INDEX "payload_locked_documents_rels_consent_records_id_idx" ON "payload_locked_documents_rels" USING btree ("consent_records_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "assistant_answers_triggers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "assistant_answers_example_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "assistant_answers_actions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "assistant_answers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_assistant_answers_v_version_triggers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_assistant_answers_v_version_example_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_assistant_answers_v_version_actions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_assistant_answers_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_faqs_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "assistant_unanswered" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "assistant_feedback" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "consent_records" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "assistant_settings_quick_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "assistant_settings_synonym_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "assistant_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "assistant_answers_triggers" CASCADE;
  DROP TABLE "assistant_answers_example_questions" CASCADE;
  DROP TABLE "assistant_answers_actions" CASCADE;
  DROP TABLE "assistant_answers" CASCADE;
  DROP TABLE "_assistant_answers_v_version_triggers" CASCADE;
  DROP TABLE "_assistant_answers_v_version_example_questions" CASCADE;
  DROP TABLE "_assistant_answers_v_version_actions" CASCADE;
  DROP TABLE "_assistant_answers_v" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "_faqs_v" CASCADE;
  DROP TABLE "assistant_unanswered" CASCADE;
  DROP TABLE "assistant_feedback" CASCADE;
  DROP TABLE "consent_records" CASCADE;
  DROP TABLE "assistant_settings_quick_questions" CASCADE;
  DROP TABLE "assistant_settings_synonym_groups" CASCADE;
  DROP TABLE "assistant_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_assistant_answers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_faqs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_assistant_unanswered_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_assistant_feedback_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_consent_records_fk";
  
  DROP INDEX "payload_locked_documents_rels_assistant_answers_id_idx";
  DROP INDEX "payload_locked_documents_rels_faqs_id_idx";
  DROP INDEX "payload_locked_documents_rels_assistant_unanswered_id_idx";
  DROP INDEX "payload_locked_documents_rels_assistant_feedback_id_idx";
  DROP INDEX "payload_locked_documents_rels_consent_records_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "assistant_answers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "faqs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "assistant_unanswered_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "assistant_feedback_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "consent_records_id";
  ALTER TABLE "site_settings" DROP COLUMN "cookie_policy_content";
  ALTER TABLE "site_settings" DROP COLUMN "cookie_policy_url";
  ALTER TABLE "site_settings" DROP COLUMN "cookie_policy_version";
  ALTER TABLE "site_settings" DROP COLUMN "cookie_policy_updated_at";
  ALTER TABLE "site_settings" DROP COLUMN "consent_banner_title";
  ALTER TABLE "site_settings" DROP COLUMN "consent_banner_description";
  ALTER TABLE "site_settings" DROP COLUMN "consent_record_retention_days";
  DROP TYPE "public"."enum_assistant_answers_actions_kind";
  DROP TYPE "public"."enum_assistant_answers_actions_settings_link";
  DROP TYPE "public"."enum_assistant_answers_topic";
  DROP TYPE "public"."enum_assistant_answers_status";
  DROP TYPE "public"."enum__assistant_answers_v_version_actions_kind";
  DROP TYPE "public"."enum__assistant_answers_v_version_actions_settings_link";
  DROP TYPE "public"."enum__assistant_answers_v_version_topic";
  DROP TYPE "public"."enum__assistant_answers_v_version_status";
  DROP TYPE "public"."enum_faqs_status";
  DROP TYPE "public"."enum__faqs_v_version_status";
  DROP TYPE "public"."enum_consent_records_source";`)
}
