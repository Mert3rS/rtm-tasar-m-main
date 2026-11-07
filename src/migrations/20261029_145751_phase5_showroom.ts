import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_media_usage" AS ENUM('image', 'panorama');
  CREATE TYPE "public"."enum_showrooms_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__showrooms_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_showroom_scenes_hotspots_type" AS ENUM('scene', 'info');
  CREATE TYPE "public"."enum_showroom_scenes_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__showroom_scenes_v_version_hotspots_type" AS ENUM('scene', 'info');
  CREATE TYPE "public"."enum__showroom_scenes_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "showrooms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"short_description" varchar,
  	"description" jsonb,
  	"cover_image_id" integer,
  	"related_project_id" integer,
  	"featured" boolean DEFAULT false,
  	"display_order" numeric DEFAULT 0,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_showrooms_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_showrooms_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_short_description" varchar,
  	"version_description" jsonb,
  	"version_cover_image_id" integer,
  	"version_related_project_id" integer,
  	"version_featured" boolean DEFAULT false,
  	"version_display_order" numeric DEFAULT 0,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__showrooms_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "showroom_scenes_hotspots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"type" "enum_showroom_scenes_hotspots_type" DEFAULT 'scene',
  	"yaw" numeric,
  	"pitch" numeric,
  	"target_scene_id" integer,
  	"information_text" varchar
  );
  
  CREATE TABLE "showroom_scenes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"showroom_id" integer,
  	"title" varchar,
  	"scene_key" varchar,
  	"panorama_image_id" integer,
  	"thumbnail_image_id" integer,
  	"description" varchar,
  	"display_order" numeric DEFAULT 0,
  	"initial_yaw" numeric DEFAULT 0,
  	"initial_pitch" numeric DEFAULT 0,
  	"initial_hfov" numeric DEFAULT 90,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_showroom_scenes_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_showroom_scenes_v_version_hotspots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"type" "enum__showroom_scenes_v_version_hotspots_type" DEFAULT 'scene',
  	"yaw" numeric,
  	"pitch" numeric,
  	"target_scene_id" integer,
  	"information_text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_showroom_scenes_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_showroom_id" integer,
  	"version_title" varchar,
  	"version_scene_key" varchar,
  	"version_panorama_image_id" integer,
  	"version_thumbnail_image_id" integer,
  	"version_description" varchar,
  	"version_display_order" numeric DEFAULT 0,
  	"version_initial_yaw" numeric DEFAULT 0,
  	"version_initial_pitch" numeric DEFAULT 0,
  	"version_initial_hfov" numeric DEFAULT 90,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__showroom_scenes_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "media" ADD COLUMN "usage" "enum_media_usage" DEFAULT 'image' NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "showrooms_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "showroom_scenes_id" integer;
  ALTER TABLE "showrooms" ADD CONSTRAINT "showrooms_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "showrooms" ADD CONSTRAINT "showrooms_related_project_id_projects_id_fk" FOREIGN KEY ("related_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "showrooms" ADD CONSTRAINT "showrooms_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_showrooms_v" ADD CONSTRAINT "_showrooms_v_parent_id_showrooms_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."showrooms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_showrooms_v" ADD CONSTRAINT "_showrooms_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_showrooms_v" ADD CONSTRAINT "_showrooms_v_version_related_project_id_projects_id_fk" FOREIGN KEY ("version_related_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_showrooms_v" ADD CONSTRAINT "_showrooms_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "showroom_scenes_hotspots" ADD CONSTRAINT "showroom_scenes_hotspots_target_scene_id_showroom_scenes_id_fk" FOREIGN KEY ("target_scene_id") REFERENCES "public"."showroom_scenes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "showroom_scenes_hotspots" ADD CONSTRAINT "showroom_scenes_hotspots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."showroom_scenes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "showroom_scenes" ADD CONSTRAINT "showroom_scenes_showroom_id_showrooms_id_fk" FOREIGN KEY ("showroom_id") REFERENCES "public"."showrooms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "showroom_scenes" ADD CONSTRAINT "showroom_scenes_panorama_image_id_media_id_fk" FOREIGN KEY ("panorama_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "showroom_scenes" ADD CONSTRAINT "showroom_scenes_thumbnail_image_id_media_id_fk" FOREIGN KEY ("thumbnail_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_showroom_scenes_v_version_hotspots" ADD CONSTRAINT "_showroom_scenes_v_version_hotspots_target_scene_id_showroom_scenes_id_fk" FOREIGN KEY ("target_scene_id") REFERENCES "public"."showroom_scenes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_showroom_scenes_v_version_hotspots" ADD CONSTRAINT "_showroom_scenes_v_version_hotspots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_showroom_scenes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_showroom_scenes_v" ADD CONSTRAINT "_showroom_scenes_v_parent_id_showroom_scenes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."showroom_scenes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_showroom_scenes_v" ADD CONSTRAINT "_showroom_scenes_v_version_showroom_id_showrooms_id_fk" FOREIGN KEY ("version_showroom_id") REFERENCES "public"."showrooms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_showroom_scenes_v" ADD CONSTRAINT "_showroom_scenes_v_version_panorama_image_id_media_id_fk" FOREIGN KEY ("version_panorama_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_showroom_scenes_v" ADD CONSTRAINT "_showroom_scenes_v_version_thumbnail_image_id_media_id_fk" FOREIGN KEY ("version_thumbnail_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "showrooms_slug_idx" ON "showrooms" USING btree ("slug");
  CREATE INDEX "showrooms_cover_image_idx" ON "showrooms" USING btree ("cover_image_id");
  CREATE INDEX "showrooms_related_project_idx" ON "showrooms" USING btree ("related_project_id");
  CREATE INDEX "showrooms_display_order_idx" ON "showrooms" USING btree ("display_order");
  CREATE INDEX "showrooms_seo_image_idx" ON "showrooms" USING btree ("seo_image_id");
  CREATE INDEX "showrooms_updated_at_idx" ON "showrooms" USING btree ("updated_at");
  CREATE INDEX "showrooms_created_at_idx" ON "showrooms" USING btree ("created_at");
  CREATE INDEX "showrooms__status_idx" ON "showrooms" USING btree ("_status");
  CREATE INDEX "_showrooms_v_parent_idx" ON "_showrooms_v" USING btree ("parent_id");
  CREATE INDEX "_showrooms_v_version_version_slug_idx" ON "_showrooms_v" USING btree ("version_slug");
  CREATE INDEX "_showrooms_v_version_version_cover_image_idx" ON "_showrooms_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_showrooms_v_version_version_related_project_idx" ON "_showrooms_v" USING btree ("version_related_project_id");
  CREATE INDEX "_showrooms_v_version_version_display_order_idx" ON "_showrooms_v" USING btree ("version_display_order");
  CREATE INDEX "_showrooms_v_version_version_seo_image_idx" ON "_showrooms_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_showrooms_v_version_version_updated_at_idx" ON "_showrooms_v" USING btree ("version_updated_at");
  CREATE INDEX "_showrooms_v_version_version_created_at_idx" ON "_showrooms_v" USING btree ("version_created_at");
  CREATE INDEX "_showrooms_v_version_version__status_idx" ON "_showrooms_v" USING btree ("version__status");
  CREATE INDEX "_showrooms_v_created_at_idx" ON "_showrooms_v" USING btree ("created_at");
  CREATE INDEX "_showrooms_v_updated_at_idx" ON "_showrooms_v" USING btree ("updated_at");
  CREATE INDEX "_showrooms_v_latest_idx" ON "_showrooms_v" USING btree ("latest");
  CREATE INDEX "showroom_scenes_hotspots_order_idx" ON "showroom_scenes_hotspots" USING btree ("_order");
  CREATE INDEX "showroom_scenes_hotspots_parent_id_idx" ON "showroom_scenes_hotspots" USING btree ("_parent_id");
  CREATE INDEX "showroom_scenes_hotspots_target_scene_idx" ON "showroom_scenes_hotspots" USING btree ("target_scene_id");
  CREATE INDEX "showroom_scenes_showroom_idx" ON "showroom_scenes" USING btree ("showroom_id");
  CREATE INDEX "showroom_scenes_scene_key_idx" ON "showroom_scenes" USING btree ("scene_key");
  CREATE INDEX "showroom_scenes_panorama_image_idx" ON "showroom_scenes" USING btree ("panorama_image_id");
  CREATE INDEX "showroom_scenes_thumbnail_image_idx" ON "showroom_scenes" USING btree ("thumbnail_image_id");
  CREATE INDEX "showroom_scenes_display_order_idx" ON "showroom_scenes" USING btree ("display_order");
  CREATE INDEX "showroom_scenes_updated_at_idx" ON "showroom_scenes" USING btree ("updated_at");
  CREATE INDEX "showroom_scenes_created_at_idx" ON "showroom_scenes" USING btree ("created_at");
  CREATE INDEX "showroom_scenes__status_idx" ON "showroom_scenes" USING btree ("_status");
  CREATE UNIQUE INDEX "showroom_sceneKey_idx" ON "showroom_scenes" USING btree ("showroom_id","scene_key");
  CREATE INDEX "_showroom_scenes_v_version_hotspots_order_idx" ON "_showroom_scenes_v_version_hotspots" USING btree ("_order");
  CREATE INDEX "_showroom_scenes_v_version_hotspots_parent_id_idx" ON "_showroom_scenes_v_version_hotspots" USING btree ("_parent_id");
  CREATE INDEX "_showroom_scenes_v_version_hotspots_target_scene_idx" ON "_showroom_scenes_v_version_hotspots" USING btree ("target_scene_id");
  CREATE INDEX "_showroom_scenes_v_parent_idx" ON "_showroom_scenes_v" USING btree ("parent_id");
  CREATE INDEX "_showroom_scenes_v_version_version_showroom_idx" ON "_showroom_scenes_v" USING btree ("version_showroom_id");
  CREATE INDEX "_showroom_scenes_v_version_version_scene_key_idx" ON "_showroom_scenes_v" USING btree ("version_scene_key");
  CREATE INDEX "_showroom_scenes_v_version_version_panorama_image_idx" ON "_showroom_scenes_v" USING btree ("version_panorama_image_id");
  CREATE INDEX "_showroom_scenes_v_version_version_thumbnail_image_idx" ON "_showroom_scenes_v" USING btree ("version_thumbnail_image_id");
  CREATE INDEX "_showroom_scenes_v_version_version_display_order_idx" ON "_showroom_scenes_v" USING btree ("version_display_order");
  CREATE INDEX "_showroom_scenes_v_version_version_updated_at_idx" ON "_showroom_scenes_v" USING btree ("version_updated_at");
  CREATE INDEX "_showroom_scenes_v_version_version_created_at_idx" ON "_showroom_scenes_v" USING btree ("version_created_at");
  CREATE INDEX "_showroom_scenes_v_version_version__status_idx" ON "_showroom_scenes_v" USING btree ("version__status");
  CREATE INDEX "_showroom_scenes_v_created_at_idx" ON "_showroom_scenes_v" USING btree ("created_at");
  CREATE INDEX "_showroom_scenes_v_updated_at_idx" ON "_showroom_scenes_v" USING btree ("updated_at");
  CREATE INDEX "_showroom_scenes_v_latest_idx" ON "_showroom_scenes_v" USING btree ("latest");
  CREATE INDEX "version_showroom_version_sceneKey_idx" ON "_showroom_scenes_v" USING btree ("version_showroom_id","version_scene_key");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_showrooms_fk" FOREIGN KEY ("showrooms_id") REFERENCES "public"."showrooms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_showroom_scenes_fk" FOREIGN KEY ("showroom_scenes_id") REFERENCES "public"."showroom_scenes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_showrooms_id_idx" ON "payload_locked_documents_rels" USING btree ("showrooms_id");
  CREATE INDEX "payload_locked_documents_rels_showroom_scenes_id_idx" ON "payload_locked_documents_rels" USING btree ("showroom_scenes_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_showrooms_fk";
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_showroom_scenes_fk";
   ALTER TABLE "showrooms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_showrooms_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "showroom_scenes_hotspots" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "showroom_scenes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_showroom_scenes_v_version_hotspots" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_showroom_scenes_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "showrooms" CASCADE;
  DROP TABLE "_showrooms_v" CASCADE;
  DROP TABLE "showroom_scenes_hotspots" CASCADE;
  DROP TABLE "showroom_scenes" CASCADE;
  DROP TABLE "_showroom_scenes_v_version_hotspots" CASCADE;
  DROP TABLE "_showroom_scenes_v" CASCADE;
  DROP INDEX "payload_locked_documents_rels_showrooms_id_idx";
  DROP INDEX "payload_locked_documents_rels_showroom_scenes_id_idx";
  ALTER TABLE "media" DROP COLUMN "usage";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "showrooms_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "showroom_scenes_id";
  DROP TYPE "public"."enum_media_usage";
  DROP TYPE "public"."enum_showrooms_status";
  DROP TYPE "public"."enum__showrooms_v_version_status";
  DROP TYPE "public"."enum_showroom_scenes_hotspots_type";
  DROP TYPE "public"."enum_showroom_scenes_status";
  DROP TYPE "public"."enum__showroom_scenes_v_version_hotspots_type";
  DROP TYPE "public"."enum__showroom_scenes_v_version_status";`)
}
