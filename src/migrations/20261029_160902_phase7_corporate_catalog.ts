import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_services_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__services_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_design_models_model_type" AS ENUM('concept', 'render', 'production-example');
  CREATE TYPE "public"."enum_design_models_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__design_models_v_version_model_type" AS ENUM('concept', 'render', 'production-example');
  CREATE TYPE "public"."enum__design_models_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_about_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__about_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "services_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"short_description" varchar,
  	"description" jsonb,
  	"cover_image_id" integer,
  	"featured" boolean DEFAULT false,
  	"display_order" numeric DEFAULT 0,
  	"active" boolean DEFAULT true,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_services_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "services_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"projects_id" integer,
  	"model_categories_id" integer
  );
  
  CREATE TABLE "_services_v_version_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_short_description" varchar,
  	"version_description" jsonb,
  	"version_cover_image_id" integer,
  	"version_featured" boolean DEFAULT false,
  	"version_display_order" numeric DEFAULT 0,
  	"version_active" boolean DEFAULT true,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__services_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_services_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"projects_id" integer,
  	"model_categories_id" integer
  );
  
  CREATE TABLE "design_models_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "design_models" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"short_description" varchar,
  	"description" jsonb,
  	"cover_image_id" integer,
  	"model_type" "enum_design_models_model_type",
  	"featured" boolean DEFAULT false,
  	"display_order" numeric DEFAULT 0,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_design_models_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "design_models_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"model_categories_id" integer,
  	"services_id" integer,
  	"projects_id" integer
  );
  
  CREATE TABLE "_design_models_v_version_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_design_models_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_short_description" varchar,
  	"version_description" jsonb,
  	"version_cover_image_id" integer,
  	"version_model_type" "enum__design_models_v_version_model_type",
  	"version_featured" boolean DEFAULT false,
  	"version_display_order" numeric DEFAULT 0,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__design_models_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_design_models_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"model_categories_id" integer,
  	"services_id" integer,
  	"projects_id" integer
  );
  
  CREATE TABLE "model_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"display_order" numeric DEFAULT 0,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "about_page_expertise_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "about_page_team_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "about_page_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "about_page_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "about_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Biz kimiz?',
  	"heading" varchar DEFAULT 'Tasarımın Her Detayında Ustalık.',
  	"subtitle" varchar,
  	"introduction" jsonb,
  	"hero_image_id" integer,
  	"story_heading" varchar,
  	"story_content" jsonb,
  	"story_image_id" integer,
  	"expertise_heading" varchar,
  	"expertise_description" varchar,
  	"team_heading" varchar,
  	"team_description" varchar,
  	"team_image_id" integer,
  	"process_heading" varchar,
  	"process_description" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"_status" "enum_about_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "about_page_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"projects_id" integer
  );
  
  CREATE TABLE "_about_page_v_version_expertise_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_about_page_v_version_team_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_about_page_v_version_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_about_page_v_version_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_about_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_eyebrow" varchar DEFAULT 'Biz kimiz?',
  	"version_heading" varchar DEFAULT 'Tasarımın Her Detayında Ustalık.',
  	"version_subtitle" varchar,
  	"version_introduction" jsonb,
  	"version_hero_image_id" integer,
  	"version_story_heading" varchar,
  	"version_story_content" jsonb,
  	"version_story_image_id" integer,
  	"version_expertise_heading" varchar,
  	"version_expertise_description" varchar,
  	"version_team_heading" varchar,
  	"version_team_description" varchar,
  	"version_team_image_id" integer,
  	"version_process_heading" varchar,
  	"version_process_description" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" integer,
  	"version__status" "enum__about_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_about_page_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"projects_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "design_models_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "model_categories_id" integer;
  ALTER TABLE "services_gallery_images" ADD CONSTRAINT "services_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_gallery_images" ADD CONSTRAINT "services_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_model_categories_fk" FOREIGN KEY ("model_categories_id") REFERENCES "public"."model_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_version_gallery_images" ADD CONSTRAINT "_services_v_version_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_version_gallery_images" ADD CONSTRAINT "_services_v_version_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_parent_id_services_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_model_categories_fk" FOREIGN KEY ("model_categories_id") REFERENCES "public"."model_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "design_models_gallery_images" ADD CONSTRAINT "design_models_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "design_models_gallery_images" ADD CONSTRAINT "design_models_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."design_models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "design_models" ADD CONSTRAINT "design_models_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "design_models" ADD CONSTRAINT "design_models_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "design_models_rels" ADD CONSTRAINT "design_models_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."design_models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "design_models_rels" ADD CONSTRAINT "design_models_rels_model_categories_fk" FOREIGN KEY ("model_categories_id") REFERENCES "public"."model_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "design_models_rels" ADD CONSTRAINT "design_models_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "design_models_rels" ADD CONSTRAINT "design_models_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_design_models_v_version_gallery_images" ADD CONSTRAINT "_design_models_v_version_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_design_models_v_version_gallery_images" ADD CONSTRAINT "_design_models_v_version_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_design_models_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_design_models_v" ADD CONSTRAINT "_design_models_v_parent_id_design_models_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."design_models"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_design_models_v" ADD CONSTRAINT "_design_models_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_design_models_v" ADD CONSTRAINT "_design_models_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_design_models_v_rels" ADD CONSTRAINT "_design_models_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_design_models_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_design_models_v_rels" ADD CONSTRAINT "_design_models_v_rels_model_categories_fk" FOREIGN KEY ("model_categories_id") REFERENCES "public"."model_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_design_models_v_rels" ADD CONSTRAINT "_design_models_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_design_models_v_rels" ADD CONSTRAINT "_design_models_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_expertise_items" ADD CONSTRAINT "about_page_expertise_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_team_members" ADD CONSTRAINT "about_page_team_members_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page_team_members" ADD CONSTRAINT "about_page_team_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_process_steps" ADD CONSTRAINT "about_page_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_gallery_images" ADD CONSTRAINT "about_page_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page_gallery_images" ADD CONSTRAINT "about_page_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page" ADD CONSTRAINT "about_page_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page" ADD CONSTRAINT "about_page_story_image_id_media_id_fk" FOREIGN KEY ("story_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page" ADD CONSTRAINT "about_page_team_image_id_media_id_fk" FOREIGN KEY ("team_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page" ADD CONSTRAINT "about_page_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page_rels" ADD CONSTRAINT "about_page_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_rels" ADD CONSTRAINT "about_page_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v_version_expertise_items" ADD CONSTRAINT "_about_page_v_version_expertise_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v_version_team_members" ADD CONSTRAINT "_about_page_v_version_team_members_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_page_v_version_team_members" ADD CONSTRAINT "_about_page_v_version_team_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v_version_process_steps" ADD CONSTRAINT "_about_page_v_version_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v_version_gallery_images" ADD CONSTRAINT "_about_page_v_version_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_page_v_version_gallery_images" ADD CONSTRAINT "_about_page_v_version_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v" ADD CONSTRAINT "_about_page_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_page_v" ADD CONSTRAINT "_about_page_v_version_story_image_id_media_id_fk" FOREIGN KEY ("version_story_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_page_v" ADD CONSTRAINT "_about_page_v_version_team_image_id_media_id_fk" FOREIGN KEY ("version_team_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_page_v" ADD CONSTRAINT "_about_page_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_page_v_rels" ADD CONSTRAINT "_about_page_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_about_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v_rels" ADD CONSTRAINT "_about_page_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "services_gallery_images_order_idx" ON "services_gallery_images" USING btree ("_order");
  CREATE INDEX "services_gallery_images_parent_id_idx" ON "services_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "services_gallery_images_image_idx" ON "services_gallery_images" USING btree ("image_id");
  CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");
  CREATE INDEX "services_cover_image_idx" ON "services" USING btree ("cover_image_id");
  CREATE INDEX "services_display_order_idx" ON "services" USING btree ("display_order");
  CREATE INDEX "services_active_idx" ON "services" USING btree ("active");
  CREATE INDEX "services_seo_image_idx" ON "services" USING btree ("seo_image_id");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE INDEX "services__status_idx" ON "services" USING btree ("_status");
  CREATE INDEX "services_rels_order_idx" ON "services_rels" USING btree ("order");
  CREATE INDEX "services_rels_parent_idx" ON "services_rels" USING btree ("parent_id");
  CREATE INDEX "services_rels_path_idx" ON "services_rels" USING btree ("path");
  CREATE INDEX "services_rels_projects_id_idx" ON "services_rels" USING btree ("projects_id");
  CREATE INDEX "services_rels_model_categories_id_idx" ON "services_rels" USING btree ("model_categories_id");
  CREATE INDEX "_services_v_version_gallery_images_order_idx" ON "_services_v_version_gallery_images" USING btree ("_order");
  CREATE INDEX "_services_v_version_gallery_images_parent_id_idx" ON "_services_v_version_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "_services_v_version_gallery_images_image_idx" ON "_services_v_version_gallery_images" USING btree ("image_id");
  CREATE INDEX "_services_v_parent_idx" ON "_services_v" USING btree ("parent_id");
  CREATE INDEX "_services_v_version_version_slug_idx" ON "_services_v" USING btree ("version_slug");
  CREATE INDEX "_services_v_version_version_cover_image_idx" ON "_services_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_services_v_version_version_display_order_idx" ON "_services_v" USING btree ("version_display_order");
  CREATE INDEX "_services_v_version_version_active_idx" ON "_services_v" USING btree ("version_active");
  CREATE INDEX "_services_v_version_version_seo_image_idx" ON "_services_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_services_v_version_version_updated_at_idx" ON "_services_v" USING btree ("version_updated_at");
  CREATE INDEX "_services_v_version_version_created_at_idx" ON "_services_v" USING btree ("version_created_at");
  CREATE INDEX "_services_v_version_version__status_idx" ON "_services_v" USING btree ("version__status");
  CREATE INDEX "_services_v_created_at_idx" ON "_services_v" USING btree ("created_at");
  CREATE INDEX "_services_v_updated_at_idx" ON "_services_v" USING btree ("updated_at");
  CREATE INDEX "_services_v_latest_idx" ON "_services_v" USING btree ("latest");
  CREATE INDEX "_services_v_rels_order_idx" ON "_services_v_rels" USING btree ("order");
  CREATE INDEX "_services_v_rels_parent_idx" ON "_services_v_rels" USING btree ("parent_id");
  CREATE INDEX "_services_v_rels_path_idx" ON "_services_v_rels" USING btree ("path");
  CREATE INDEX "_services_v_rels_projects_id_idx" ON "_services_v_rels" USING btree ("projects_id");
  CREATE INDEX "_services_v_rels_model_categories_id_idx" ON "_services_v_rels" USING btree ("model_categories_id");
  CREATE INDEX "design_models_gallery_images_order_idx" ON "design_models_gallery_images" USING btree ("_order");
  CREATE INDEX "design_models_gallery_images_parent_id_idx" ON "design_models_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "design_models_gallery_images_image_idx" ON "design_models_gallery_images" USING btree ("image_id");
  CREATE UNIQUE INDEX "design_models_slug_idx" ON "design_models" USING btree ("slug");
  CREATE INDEX "design_models_cover_image_idx" ON "design_models" USING btree ("cover_image_id");
  CREATE INDEX "design_models_featured_idx" ON "design_models" USING btree ("featured");
  CREATE INDEX "design_models_display_order_idx" ON "design_models" USING btree ("display_order");
  CREATE INDEX "design_models_seo_image_idx" ON "design_models" USING btree ("seo_image_id");
  CREATE INDEX "design_models_updated_at_idx" ON "design_models" USING btree ("updated_at");
  CREATE INDEX "design_models_created_at_idx" ON "design_models" USING btree ("created_at");
  CREATE INDEX "design_models__status_idx" ON "design_models" USING btree ("_status");
  CREATE INDEX "design_models_rels_order_idx" ON "design_models_rels" USING btree ("order");
  CREATE INDEX "design_models_rels_parent_idx" ON "design_models_rels" USING btree ("parent_id");
  CREATE INDEX "design_models_rels_path_idx" ON "design_models_rels" USING btree ("path");
  CREATE INDEX "design_models_rels_model_categories_id_idx" ON "design_models_rels" USING btree ("model_categories_id");
  CREATE INDEX "design_models_rels_services_id_idx" ON "design_models_rels" USING btree ("services_id");
  CREATE INDEX "design_models_rels_projects_id_idx" ON "design_models_rels" USING btree ("projects_id");
  CREATE INDEX "_design_models_v_version_gallery_images_order_idx" ON "_design_models_v_version_gallery_images" USING btree ("_order");
  CREATE INDEX "_design_models_v_version_gallery_images_parent_id_idx" ON "_design_models_v_version_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "_design_models_v_version_gallery_images_image_idx" ON "_design_models_v_version_gallery_images" USING btree ("image_id");
  CREATE INDEX "_design_models_v_parent_idx" ON "_design_models_v" USING btree ("parent_id");
  CREATE INDEX "_design_models_v_version_version_slug_idx" ON "_design_models_v" USING btree ("version_slug");
  CREATE INDEX "_design_models_v_version_version_cover_image_idx" ON "_design_models_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_design_models_v_version_version_featured_idx" ON "_design_models_v" USING btree ("version_featured");
  CREATE INDEX "_design_models_v_version_version_display_order_idx" ON "_design_models_v" USING btree ("version_display_order");
  CREATE INDEX "_design_models_v_version_version_seo_image_idx" ON "_design_models_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_design_models_v_version_version_updated_at_idx" ON "_design_models_v" USING btree ("version_updated_at");
  CREATE INDEX "_design_models_v_version_version_created_at_idx" ON "_design_models_v" USING btree ("version_created_at");
  CREATE INDEX "_design_models_v_version_version__status_idx" ON "_design_models_v" USING btree ("version__status");
  CREATE INDEX "_design_models_v_created_at_idx" ON "_design_models_v" USING btree ("created_at");
  CREATE INDEX "_design_models_v_updated_at_idx" ON "_design_models_v" USING btree ("updated_at");
  CREATE INDEX "_design_models_v_latest_idx" ON "_design_models_v" USING btree ("latest");
  CREATE INDEX "_design_models_v_rels_order_idx" ON "_design_models_v_rels" USING btree ("order");
  CREATE INDEX "_design_models_v_rels_parent_idx" ON "_design_models_v_rels" USING btree ("parent_id");
  CREATE INDEX "_design_models_v_rels_path_idx" ON "_design_models_v_rels" USING btree ("path");
  CREATE INDEX "_design_models_v_rels_model_categories_id_idx" ON "_design_models_v_rels" USING btree ("model_categories_id");
  CREATE INDEX "_design_models_v_rels_services_id_idx" ON "_design_models_v_rels" USING btree ("services_id");
  CREATE INDEX "_design_models_v_rels_projects_id_idx" ON "_design_models_v_rels" USING btree ("projects_id");
  CREATE UNIQUE INDEX "model_categories_slug_idx" ON "model_categories" USING btree ("slug");
  CREATE INDEX "model_categories_display_order_idx" ON "model_categories" USING btree ("display_order");
  CREATE INDEX "model_categories_active_idx" ON "model_categories" USING btree ("active");
  CREATE INDEX "model_categories_updated_at_idx" ON "model_categories" USING btree ("updated_at");
  CREATE INDEX "model_categories_created_at_idx" ON "model_categories" USING btree ("created_at");
  CREATE INDEX "about_page_expertise_items_order_idx" ON "about_page_expertise_items" USING btree ("_order");
  CREATE INDEX "about_page_expertise_items_parent_id_idx" ON "about_page_expertise_items" USING btree ("_parent_id");
  CREATE INDEX "about_page_team_members_order_idx" ON "about_page_team_members" USING btree ("_order");
  CREATE INDEX "about_page_team_members_parent_id_idx" ON "about_page_team_members" USING btree ("_parent_id");
  CREATE INDEX "about_page_team_members_image_idx" ON "about_page_team_members" USING btree ("image_id");
  CREATE INDEX "about_page_process_steps_order_idx" ON "about_page_process_steps" USING btree ("_order");
  CREATE INDEX "about_page_process_steps_parent_id_idx" ON "about_page_process_steps" USING btree ("_parent_id");
  CREATE INDEX "about_page_gallery_images_order_idx" ON "about_page_gallery_images" USING btree ("_order");
  CREATE INDEX "about_page_gallery_images_parent_id_idx" ON "about_page_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "about_page_gallery_images_image_idx" ON "about_page_gallery_images" USING btree ("image_id");
  CREATE INDEX "about_page_hero_image_idx" ON "about_page" USING btree ("hero_image_id");
  CREATE INDEX "about_page_story_image_idx" ON "about_page" USING btree ("story_image_id");
  CREATE INDEX "about_page_team_image_idx" ON "about_page" USING btree ("team_image_id");
  CREATE INDEX "about_page_seo_image_idx" ON "about_page" USING btree ("seo_image_id");
  CREATE INDEX "about_page__status_idx" ON "about_page" USING btree ("_status");
  CREATE INDEX "about_page_rels_order_idx" ON "about_page_rels" USING btree ("order");
  CREATE INDEX "about_page_rels_parent_idx" ON "about_page_rels" USING btree ("parent_id");
  CREATE INDEX "about_page_rels_path_idx" ON "about_page_rels" USING btree ("path");
  CREATE INDEX "about_page_rels_projects_id_idx" ON "about_page_rels" USING btree ("projects_id");
  CREATE INDEX "_about_page_v_version_expertise_items_order_idx" ON "_about_page_v_version_expertise_items" USING btree ("_order");
  CREATE INDEX "_about_page_v_version_expertise_items_parent_id_idx" ON "_about_page_v_version_expertise_items" USING btree ("_parent_id");
  CREATE INDEX "_about_page_v_version_team_members_order_idx" ON "_about_page_v_version_team_members" USING btree ("_order");
  CREATE INDEX "_about_page_v_version_team_members_parent_id_idx" ON "_about_page_v_version_team_members" USING btree ("_parent_id");
  CREATE INDEX "_about_page_v_version_team_members_image_idx" ON "_about_page_v_version_team_members" USING btree ("image_id");
  CREATE INDEX "_about_page_v_version_process_steps_order_idx" ON "_about_page_v_version_process_steps" USING btree ("_order");
  CREATE INDEX "_about_page_v_version_process_steps_parent_id_idx" ON "_about_page_v_version_process_steps" USING btree ("_parent_id");
  CREATE INDEX "_about_page_v_version_gallery_images_order_idx" ON "_about_page_v_version_gallery_images" USING btree ("_order");
  CREATE INDEX "_about_page_v_version_gallery_images_parent_id_idx" ON "_about_page_v_version_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "_about_page_v_version_gallery_images_image_idx" ON "_about_page_v_version_gallery_images" USING btree ("image_id");
  CREATE INDEX "_about_page_v_version_version_hero_image_idx" ON "_about_page_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_about_page_v_version_version_story_image_idx" ON "_about_page_v" USING btree ("version_story_image_id");
  CREATE INDEX "_about_page_v_version_version_team_image_idx" ON "_about_page_v" USING btree ("version_team_image_id");
  CREATE INDEX "_about_page_v_version_version_seo_image_idx" ON "_about_page_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_about_page_v_version_version__status_idx" ON "_about_page_v" USING btree ("version__status");
  CREATE INDEX "_about_page_v_created_at_idx" ON "_about_page_v" USING btree ("created_at");
  CREATE INDEX "_about_page_v_updated_at_idx" ON "_about_page_v" USING btree ("updated_at");
  CREATE INDEX "_about_page_v_latest_idx" ON "_about_page_v" USING btree ("latest");
  CREATE INDEX "_about_page_v_rels_order_idx" ON "_about_page_v_rels" USING btree ("order");
  CREATE INDEX "_about_page_v_rels_parent_idx" ON "_about_page_v_rels" USING btree ("parent_id");
  CREATE INDEX "_about_page_v_rels_path_idx" ON "_about_page_v_rels" USING btree ("path");
  CREATE INDEX "_about_page_v_rels_projects_id_idx" ON "_about_page_v_rels" USING btree ("projects_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_design_models_fk" FOREIGN KEY ("design_models_id") REFERENCES "public"."design_models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_model_categories_fk" FOREIGN KEY ("model_categories_id") REFERENCES "public"."model_categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_design_models_id_idx" ON "payload_locked_documents_rels" USING btree ("design_models_id");
  CREATE INDEX "payload_locked_documents_rels_model_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("model_categories_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "services_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_version_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "design_models_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "design_models" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "design_models_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_design_models_v_version_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_design_models_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_design_models_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "model_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_expertise_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_team_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_process_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_about_page_v_version_expertise_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_about_page_v_version_team_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_about_page_v_version_process_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_about_page_v_version_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_about_page_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_about_page_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_services_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_design_models_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_model_categories_fk";
  DROP TABLE "services_gallery_images" CASCADE;
  DROP TABLE "services" CASCADE;
  DROP TABLE "services_rels" CASCADE;
  DROP TABLE "_services_v_version_gallery_images" CASCADE;
  DROP TABLE "_services_v" CASCADE;
  DROP TABLE "_services_v_rels" CASCADE;
  DROP TABLE "design_models_gallery_images" CASCADE;
  DROP TABLE "design_models" CASCADE;
  DROP TABLE "design_models_rels" CASCADE;
  DROP TABLE "_design_models_v_version_gallery_images" CASCADE;
  DROP TABLE "_design_models_v" CASCADE;
  DROP TABLE "_design_models_v_rels" CASCADE;
  DROP TABLE "model_categories" CASCADE;
  DROP TABLE "about_page_expertise_items" CASCADE;
  DROP TABLE "about_page_team_members" CASCADE;
  DROP TABLE "about_page_process_steps" CASCADE;
  DROP TABLE "about_page_gallery_images" CASCADE;
  DROP TABLE "about_page" CASCADE;
  DROP TABLE "about_page_rels" CASCADE;
  DROP TABLE "_about_page_v_version_expertise_items" CASCADE;
  DROP TABLE "_about_page_v_version_team_members" CASCADE;
  DROP TABLE "_about_page_v_version_process_steps" CASCADE;
  DROP TABLE "_about_page_v_version_gallery_images" CASCADE;
  DROP TABLE "_about_page_v" CASCADE;
  DROP TABLE "_about_page_v_rels" CASCADE;
  DROP INDEX "payload_locked_documents_rels_services_id_idx";
  DROP INDEX "payload_locked_documents_rels_design_models_id_idx";
  DROP INDEX "payload_locked_documents_rels_model_categories_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "services_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "design_models_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "model_categories_id";
  DROP TYPE "public"."enum_services_status";
  DROP TYPE "public"."enum__services_v_version_status";
  DROP TYPE "public"."enum_design_models_model_type";
  DROP TYPE "public"."enum_design_models_status";
  DROP TYPE "public"."enum__design_models_v_version_model_type";
  DROP TYPE "public"."enum__design_models_v_version_status";
  DROP TYPE "public"."enum_about_page_status";
  DROP TYPE "public"."enum__about_page_v_version_status";`)
}
