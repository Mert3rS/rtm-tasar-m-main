import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The previous Blob release may already have these columns. Preserve existing keys.
// This is additive and contains no content writes. Never run the chain on a local push DB.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "prefix" varchar DEFAULT '';
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;`)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // These columns can predate this release and contain the only storage keys.
  // Rolling back application code is safe with the additive columns retained.
  throw new Error('Blob medya anahtarları otomatik silinmez; geri dönüş için kolonları koruyun.')
}
