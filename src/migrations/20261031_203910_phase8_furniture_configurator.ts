import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "inquiries" ADD COLUMN "design_config" jsonb;
  ALTER TABLE "inquiries" ADD COLUMN "design_share_url" varchar;
  ALTER TABLE "inquiries" ADD COLUMN "design_preview" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "inquiries" DROP COLUMN "design_config";
  ALTER TABLE "inquiries" DROP COLUMN "design_share_url";
  ALTER TABLE "inquiries" DROP COLUMN "design_preview";`)
}
