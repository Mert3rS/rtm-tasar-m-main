import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Additive migration; never run the baseline chain against a local push database.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "inquiries_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "inquiry_attachments_id" integer
  );

  CREATE TABLE "design_shares" (
    "id" serial PRIMARY KEY NOT NULL,
    "share_key" varchar NOT NULL,
    "design" jsonb NOT NULL,
    "expires_at" timestamp(3) with time zone NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "inquiry_attachments" (
    "id" serial PRIMARY KEY NOT NULL,
    "linked_at" timestamp(3) with time zone,
    "slot" numeric NOT NULL,
    "handle" varchar NOT NULL,
    "submission_key" varchar NOT NULL,
    "expires_at" timestamp(3) with time zone NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "url" varchar,
    "thumbnail_u_r_l" varchar,
    "filename" varchar,
    "mime_type" varchar,
    "filesize" numeric,
    "width" numeric,
    "height" numeric,
    "focal_x" numeric,
    "focal_y" numeric
  );

  ALTER TABLE "inquiries" ALTER COLUMN "email" DROP NOT NULL;
  ALTER TABLE "inquiries" ADD COLUMN "request_measurement" boolean;
  ALTER TABLE "inquiries" ADD COLUMN "request_samples" boolean;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "design_shares_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "inquiry_attachments_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "design_share_retention_days" numeric DEFAULT 180;
  ALTER TABLE "inquiries_rels" ADD CONSTRAINT "inquiries_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inquiries_rels" ADD CONSTRAINT "inquiries_rels_inquiry_attachments_fk" FOREIGN KEY ("inquiry_attachments_id") REFERENCES "public"."inquiry_attachments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "inquiries_rels_order_idx" ON "inquiries_rels" USING btree ("order");
  CREATE INDEX "inquiries_rels_parent_idx" ON "inquiries_rels" USING btree ("parent_id");
  CREATE INDEX "inquiries_rels_path_idx" ON "inquiries_rels" USING btree ("path");
  CREATE INDEX "inquiries_rels_inquiry_attachments_id_idx" ON "inquiries_rels" USING btree ("inquiry_attachments_id");
  CREATE UNIQUE INDEX "design_shares_share_key_idx" ON "design_shares" USING btree ("share_key");
  CREATE INDEX "design_shares_expires_at_idx" ON "design_shares" USING btree ("expires_at");
  CREATE INDEX "design_shares_updated_at_idx" ON "design_shares" USING btree ("updated_at");
  CREATE INDEX "design_shares_created_at_idx" ON "design_shares" USING btree ("created_at");
  CREATE UNIQUE INDEX "inquiry_attachments_handle_idx" ON "inquiry_attachments" USING btree ("handle");
  CREATE INDEX "inquiry_attachments_linked_at_idx" ON "inquiry_attachments" USING btree ("linked_at");
  CREATE INDEX "inquiry_attachments_submission_key_idx" ON "inquiry_attachments" USING btree ("submission_key");
  CREATE INDEX "inquiry_attachments_expires_at_idx" ON "inquiry_attachments" USING btree ("expires_at");
  CREATE INDEX "inquiry_attachments_updated_at_idx" ON "inquiry_attachments" USING btree ("updated_at");
  CREATE INDEX "inquiry_attachments_created_at_idx" ON "inquiry_attachments" USING btree ("created_at");
  CREATE UNIQUE INDEX "inquiry_attachments_filename_idx" ON "inquiry_attachments" USING btree ("filename");
  CREATE UNIQUE INDEX "submissionKey_slot_idx" ON "inquiry_attachments" USING btree ("submission_key","slot");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_design_shares_fk" FOREIGN KEY ("design_shares_id") REFERENCES "public"."design_shares"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inquiry_attachments_fk" FOREIGN KEY ("inquiry_attachments_id") REFERENCES "public"."inquiry_attachments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_design_shares_id_idx" ON "payload_locked_documents_rels" USING btree ("design_shares_id");
  CREATE INDEX "payload_locked_documents_rels_inquiry_attachments_id_idx" ON "payload_locked_documents_rels" USING btree ("inquiry_attachments_id");`)
}

// Destructive rollback of the new feature. Null emails intentionally prevent rollback;
// review those inquiries explicitly instead of deleting or inventing personal information.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_design_shares_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_inquiry_attachments_fk";
  ALTER TABLE "inquiries_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "design_shares" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inquiry_attachments" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "inquiries_rels" CASCADE;
  DROP TABLE "design_shares" CASCADE;
  DROP TABLE "inquiry_attachments" CASCADE;

  DROP INDEX "payload_locked_documents_rels_design_shares_id_idx";
  DROP INDEX "payload_locked_documents_rels_inquiry_attachments_id_idx";
  ALTER TABLE "inquiries" ALTER COLUMN "email" SET NOT NULL;
  ALTER TABLE "inquiries" DROP COLUMN "request_measurement";
  ALTER TABLE "inquiries" DROP COLUMN "request_samples";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "design_shares_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "inquiry_attachments_id";
  ALTER TABLE "site_settings" DROP COLUMN "design_share_retention_days";`)
}
