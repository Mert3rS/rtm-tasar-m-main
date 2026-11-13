import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Additive: nine nullable media relationships; existing content and project covers stay intact.
// Local development uses adapter push. Do not apply this chain to the local push database.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "hero_images_center_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "hero_images_top_left_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "hero_images_top_center_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "hero_images_top_right_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "hero_images_middle_left_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "hero_images_middle_right_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "hero_images_bottom_left_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "hero_images_bottom_center_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "hero_images_bottom_right_id" integer;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_hero_images_center_id_media_id_fk" FOREIGN KEY ("hero_images_center_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_hero_images_top_left_id_media_id_fk" FOREIGN KEY ("hero_images_top_left_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_hero_images_top_center_id_media_id_fk" FOREIGN KEY ("hero_images_top_center_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_hero_images_top_right_id_media_id_fk" FOREIGN KEY ("hero_images_top_right_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_hero_images_middle_left_id_media_id_fk" FOREIGN KEY ("hero_images_middle_left_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_hero_images_middle_right_id_media_id_fk" FOREIGN KEY ("hero_images_middle_right_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_hero_images_bottom_left_id_media_id_fk" FOREIGN KEY ("hero_images_bottom_left_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_hero_images_bottom_center_id_media_id_fk" FOREIGN KEY ("hero_images_bottom_center_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_hero_images_bottom_right_id_media_id_fk" FOREIGN KEY ("hero_images_bottom_right_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_settings_hero_images_hero_images_center_idx" ON "site_settings" USING btree ("hero_images_center_id");
  CREATE INDEX "site_settings_hero_images_hero_images_top_left_idx" ON "site_settings" USING btree ("hero_images_top_left_id");
  CREATE INDEX "site_settings_hero_images_hero_images_top_center_idx" ON "site_settings" USING btree ("hero_images_top_center_id");
  CREATE INDEX "site_settings_hero_images_hero_images_top_right_idx" ON "site_settings" USING btree ("hero_images_top_right_id");
  CREATE INDEX "site_settings_hero_images_hero_images_middle_left_idx" ON "site_settings" USING btree ("hero_images_middle_left_id");
  CREATE INDEX "site_settings_hero_images_hero_images_middle_right_idx" ON "site_settings" USING btree ("hero_images_middle_right_id");
  CREATE INDEX "site_settings_hero_images_hero_images_bottom_left_idx" ON "site_settings" USING btree ("hero_images_bottom_left_id");
  CREATE INDEX "site_settings_hero_images_hero_images_bottom_center_idx" ON "site_settings" USING btree ("hero_images_bottom_center_id");
  CREATE INDEX "site_settings_hero_images_hero_images_bottom_right_idx" ON "site_settings" USING btree ("hero_images_bottom_right_id");`)
}

// Rollback discards the nine selections only, not the uploaded media. Export first.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_hero_images_center_id_media_id_fk";

  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_hero_images_top_left_id_media_id_fk";

  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_hero_images_top_center_id_media_id_fk";

  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_hero_images_top_right_id_media_id_fk";

  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_hero_images_middle_left_id_media_id_fk";

  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_hero_images_middle_right_id_media_id_fk";

  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_hero_images_bottom_left_id_media_id_fk";

  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_hero_images_bottom_center_id_media_id_fk";

  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_hero_images_bottom_right_id_media_id_fk";

  DROP INDEX "site_settings_hero_images_hero_images_center_idx";
  DROP INDEX "site_settings_hero_images_hero_images_top_left_idx";
  DROP INDEX "site_settings_hero_images_hero_images_top_center_idx";
  DROP INDEX "site_settings_hero_images_hero_images_top_right_idx";
  DROP INDEX "site_settings_hero_images_hero_images_middle_left_idx";
  DROP INDEX "site_settings_hero_images_hero_images_middle_right_idx";
  DROP INDEX "site_settings_hero_images_hero_images_bottom_left_idx";
  DROP INDEX "site_settings_hero_images_hero_images_bottom_center_idx";
  DROP INDEX "site_settings_hero_images_hero_images_bottom_right_idx";
  ALTER TABLE "site_settings" DROP COLUMN "hero_images_center_id";
  ALTER TABLE "site_settings" DROP COLUMN "hero_images_top_left_id";
  ALTER TABLE "site_settings" DROP COLUMN "hero_images_top_center_id";
  ALTER TABLE "site_settings" DROP COLUMN "hero_images_top_right_id";
  ALTER TABLE "site_settings" DROP COLUMN "hero_images_middle_left_id";
  ALTER TABLE "site_settings" DROP COLUMN "hero_images_middle_right_id";
  ALTER TABLE "site_settings" DROP COLUMN "hero_images_bottom_left_id";
  ALTER TABLE "site_settings" DROP COLUMN "hero_images_bottom_center_id";
  ALTER TABLE "site_settings" DROP COLUMN "hero_images_bottom_right_id";`)
}
