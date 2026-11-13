import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Additive only: existing site settings and portfolio data are preserved.
// Defaults reproduce the existing approved home interface copy. No content is seeded.
// Local development uses adapter push; do not run the migration chain on that database.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "homepage_hero_eyebrow" varchar DEFAULT 'RTM / MOBİLYA & MEKÂN';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_hero_heading" varchar DEFAULT 'Bir mekânın hissini değiştiren detaylar. Özgün formlar, doğal dokular ve hayatına yer açan tasarımlar.';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_hero_button" varchar DEFAULT 'Projeleri keşfet';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_cta_heading" varchar DEFAULT 'Hayalinizdeki tasarımı';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_cta_emphasis" varchar DEFAULT 'birlikte hayata geçirelim.';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_cta_description" varchar DEFAULT 'Fikrinizi paylaşın; mekânınız için doğru tasarım yönünü birlikte kuralım.';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_atlas_heading" varchar DEFAULT 'Öne çıkan';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_atlas_emphasis" varchar DEFAULT 'tasarımlarımız.';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_atlas_description" varchar DEFAULT E'Şehirden projeye,\naynı tasarım çizgisinde.';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_projects_heading" varchar DEFAULT 'Yaşayan';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_projects_emphasis" varchar DEFAULT 'mekânlar.';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_projects_description" varchar DEFAULT E'Her detayında tasarım,\nişçilik ve özgünlük.';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_services_heading" varchar DEFAULT 'Fikirden';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_services_emphasis" varchar DEFAULT 'mekâna.';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_models_heading" varchar DEFAULT 'Form. Doku.';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_models_emphasis" varchar DEFAULT 'Karakter.';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_studio_heading" varchar DEFAULT 'Ekranın ötesine';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_studio_emphasis" varchar DEFAULT 'adım atın.';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_studio_description" varchar DEFAULT 'Ölçüleri, bölmeleri ve malzemeyi seçin; tasarımınızı üç boyutlu önizlemede adım adım şekillendirin.';
  ALTER TABLE "site_settings" ADD COLUMN "homepage_studio_button" varchar DEFAULT 'Tasarım oluşturmaya başla';`)
}

// Rollback discards only the new home copy columns; export them before using down.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "homepage_hero_eyebrow";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_hero_heading";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_hero_button";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_cta_heading";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_cta_emphasis";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_cta_description";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_atlas_heading";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_atlas_emphasis";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_atlas_description";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_projects_heading";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_projects_emphasis";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_projects_description";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_services_heading";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_services_emphasis";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_models_heading";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_models_emphasis";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_studio_heading";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_studio_emphasis";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_studio_description";
  ALTER TABLE "site_settings" DROP COLUMN "homepage_studio_button";`)
}
