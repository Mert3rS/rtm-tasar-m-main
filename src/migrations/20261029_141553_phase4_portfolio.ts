import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "project_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"display_order" numeric DEFAULT 0,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "projects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"project_categories_id" integer
  );
  
  CREATE TABLE "_projects_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"project_categories_id" integer
  );
  
  ALTER TABLE "media" ADD COLUMN "sizes_card_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_card_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_card_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_card_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_card_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_card_filename" varchar;
  ALTER TABLE "projects" ADD COLUMN "description" jsonb;
  ALTER TABLE "projects" ADD COLUMN "display_order" numeric DEFAULT 0;
  ALTER TABLE "projects" ADD COLUMN "project_type" varchar;
  ALTER TABLE "projects" ADD COLUMN "completion_year" numeric;
  ALTER TABLE "projects" ADD COLUMN "location_description" varchar;
  ALTER TABLE "projects" ADD COLUMN "client_name" varchar;
  ALTER TABLE "projects" ADD COLUMN "project_area" numeric;
  ALTER TABLE "projects" ADD COLUMN "seo_title" varchar;
  ALTER TABLE "projects" ADD COLUMN "seo_description" varchar;
  ALTER TABLE "projects" ADD COLUMN "seo_image_id" integer;
  ALTER TABLE "_projects_v" ADD COLUMN "version_description" jsonb;
  ALTER TABLE "_projects_v" ADD COLUMN "version_display_order" numeric DEFAULT 0;
  ALTER TABLE "_projects_v" ADD COLUMN "version_project_type" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_completion_year" numeric;
  ALTER TABLE "_projects_v" ADD COLUMN "version_location_description" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_client_name" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_project_area" numeric;
  ALTER TABLE "_projects_v" ADD COLUMN "version_seo_title" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_seo_description" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_seo_image_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "project_categories_id" integer;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_project_categories_fk" FOREIGN KEY ("project_categories_id") REFERENCES "public"."project_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_project_categories_fk" FOREIGN KEY ("project_categories_id") REFERENCES "public"."project_categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "project_categories_slug_idx" ON "project_categories" USING btree ("slug");
  CREATE INDEX "project_categories_display_order_idx" ON "project_categories" USING btree ("display_order");
  CREATE INDEX "project_categories_active_idx" ON "project_categories" USING btree ("active");
  CREATE INDEX "project_categories_updated_at_idx" ON "project_categories" USING btree ("updated_at");
  CREATE INDEX "project_categories_created_at_idx" ON "project_categories" USING btree ("created_at");
  CREATE INDEX "projects_rels_order_idx" ON "projects_rels" USING btree ("order");
  CREATE INDEX "projects_rels_parent_idx" ON "projects_rels" USING btree ("parent_id");
  CREATE INDEX "projects_rels_path_idx" ON "projects_rels" USING btree ("path");
  CREATE INDEX "projects_rels_project_categories_id_idx" ON "projects_rels" USING btree ("project_categories_id");
  CREATE INDEX "_projects_v_rels_order_idx" ON "_projects_v_rels" USING btree ("order");
  CREATE INDEX "_projects_v_rels_parent_idx" ON "_projects_v_rels" USING btree ("parent_id");
  CREATE INDEX "_projects_v_rels_path_idx" ON "_projects_v_rels" USING btree ("path");
  CREATE INDEX "_projects_v_rels_project_categories_id_idx" ON "_projects_v_rels" USING btree ("project_categories_id");
  ALTER TABLE "projects" ADD CONSTRAINT "projects_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_project_categories_fk" FOREIGN KEY ("project_categories_id") REFERENCES "public"."project_categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "projects_display_order_idx" ON "projects" USING btree ("display_order");
  CREATE INDEX "projects_seo_image_idx" ON "projects" USING btree ("seo_image_id");
  CREATE INDEX "_projects_v_version_version_display_order_idx" ON "_projects_v" USING btree ("version_display_order");
  CREATE INDEX "_projects_v_version_version_seo_image_idx" ON "_projects_v" USING btree ("version_seo_image_id");
  CREATE INDEX "payload_locked_documents_rels_project_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("project_categories_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_project_categories_fk";
   ALTER TABLE "project_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "project_categories" CASCADE;
  DROP TABLE "projects_rels" CASCADE;
  DROP TABLE "_projects_v_rels" CASCADE;
  ALTER TABLE "projects" DROP CONSTRAINT "projects_seo_image_id_media_id_fk";
  
  ALTER TABLE "_projects_v" DROP CONSTRAINT "_projects_v_version_seo_image_id_media_id_fk";
  
  DROP INDEX "media_sizes_card_sizes_card_filename_idx";
  DROP INDEX "projects_display_order_idx";
  DROP INDEX "projects_seo_image_idx";
  DROP INDEX "_projects_v_version_version_display_order_idx";
  DROP INDEX "_projects_v_version_version_seo_image_idx";
  DROP INDEX "payload_locked_documents_rels_project_categories_id_idx";
  ALTER TABLE "media" DROP COLUMN "sizes_card_url";
  ALTER TABLE "media" DROP COLUMN "sizes_card_width";
  ALTER TABLE "media" DROP COLUMN "sizes_card_height";
  ALTER TABLE "media" DROP COLUMN "sizes_card_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_card_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_card_filename";
  ALTER TABLE "projects" DROP COLUMN "description";
  ALTER TABLE "projects" DROP COLUMN "display_order";
  ALTER TABLE "projects" DROP COLUMN "project_type";
  ALTER TABLE "projects" DROP COLUMN "completion_year";
  ALTER TABLE "projects" DROP COLUMN "location_description";
  ALTER TABLE "projects" DROP COLUMN "client_name";
  ALTER TABLE "projects" DROP COLUMN "project_area";
  ALTER TABLE "projects" DROP COLUMN "seo_title";
  ALTER TABLE "projects" DROP COLUMN "seo_description";
  ALTER TABLE "projects" DROP COLUMN "seo_image_id";
  ALTER TABLE "_projects_v" DROP COLUMN "version_description";
  ALTER TABLE "_projects_v" DROP COLUMN "version_display_order";
  ALTER TABLE "_projects_v" DROP COLUMN "version_project_type";
  ALTER TABLE "_projects_v" DROP COLUMN "version_completion_year";
  ALTER TABLE "_projects_v" DROP COLUMN "version_location_description";
  ALTER TABLE "_projects_v" DROP COLUMN "version_client_name";
  ALTER TABLE "_projects_v" DROP COLUMN "version_project_area";
  ALTER TABLE "_projects_v" DROP COLUMN "version_seo_title";
  ALTER TABLE "_projects_v" DROP COLUMN "version_seo_description";
  ALTER TABLE "_projects_v" DROP COLUMN "version_seo_image_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "project_categories_id";`)
}
