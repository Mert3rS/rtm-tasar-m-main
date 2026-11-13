import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Additive only: moves approved interface copy into Site Settings without changing existing data.
// Local development uses adapter push; do not run the migration chain on that database.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "site_copy_nav_home" varchar DEFAULT 'Ana Sayfa';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_nav_projects" varchar DEFAULT 'Projeler';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_nav_models" varchar DEFAULT 'Modeller';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_nav_studio" varchar DEFAULT 'Tasarım Oluştur';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_nav_services" varchar DEFAULT 'Hizmetler';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_nav_showroom" varchar DEFAULT 'Showroom';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_nav_contact" varchar DEFAULT 'İletişim';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_nav_quote" varchar DEFAULT 'Teklif Al';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_footer_explore_label" varchar DEFAULT 'Keşfedin';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_footer_contact_label" varchar DEFAULT 'İletişim';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_footer_contact_heading" varchar DEFAULT 'Yeni bir mekânın
  ilk adımı, bir konuşma.';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_footer_signature" varchar DEFAULT 'Mobilya · Mekân · Tasarım';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_projects_eyebrow" varchar DEFAULT 'PROJE ARŞİVİ';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_projects_title" varchar DEFAULT 'Projelerimiz';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_projects_description" varchar DEFAULT 'Her projede estetik, işlevsellik ve ustalığı bir araya getiriyoruz.';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_models_eyebrow" varchar DEFAULT 'TASARIM KOLEKSİYONU';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_models_title" varchar DEFAULT 'Modellerimiz';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_models_description" varchar DEFAULT 'Farklı ihtiyaçlara ve yaşam alanlarına özel tasarım seçeneklerini keşfedin.';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_services_eyebrow" varchar DEFAULT 'ÇALIŞMA ALANLARIMIZ';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_services_title" varchar DEFAULT 'Tasarımdan';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_services_title_second" varchar DEFAULT 'uygulamaya';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_services_description" varchar DEFAULT 'Mekânların ihtiyaçlarına özel tasarım ve uygulama çözümleri.';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_showroom_eyebrow" varchar DEFAULT 'DİJİTAL DENEYİM';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_showroom_title" varchar DEFAULT 'Dijital';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_showroom_title_second" varchar DEFAULT 'Showroom';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_showroom_description" varchar DEFAULT 'Ekranın ötesine geçin. Mekânların detaylarını interaktif bir deneyimle inceleyin.';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_contact_eyebrow" varchar DEFAULT 'İLETİŞİM';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_contact_title" varchar DEFAULT 'Birlikte';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_contact_title_second" varchar DEFAULT 'tasarlayalım';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_contact_description" varchar DEFAULT 'Projenizi ve fikirlerinizi bizimle paylaşın. İlk adımı birlikte atalım.';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_quote_eyebrow" varchar DEFAULT 'İLETİŞİME GEÇİN';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_quote_title" varchar DEFAULT 'Projenizi';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_quote_title_second" varchar DEFAULT 'konuşalım';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_quote_description" varchar DEFAULT 'Mekânınızın ihtiyaçlarını ve proje fikrinizi paylaşın. İlk görüşme için gerekli bilgileri form üzerinden iletebilirsiniz.';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_corporate_cta_eyebrow" varchar DEFAULT 'BİRLİKTE BAŞLAYALIM / RTM TASARIM';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_corporate_cta_heading" varchar DEFAULT 'Hayalinizdeki Mekânı Birlikte Tasarlayalım.';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_corporate_cta_description" varchar DEFAULT 'Fikrinizi paylaşın; mekânınız için doğru tasarım yönünü birlikte kuralım.';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_corporate_cta_primary" varchar DEFAULT 'Projeniz İçin Teklif Alın';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_corporate_cta_secondary" varchar DEFAULT 'Projeleri keşfet';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_project_tour_eyebrow" varchar DEFAULT 'MEKÂNIN İÇİNE ADIM ATIN';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_project_tour_heading" varchar DEFAULT 'Mekânın İçinde';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_project_tour_description" varchar DEFAULT 'Işığı, ölçeği ve malzemeyi 360° keşfedin. İnteraktif sunum deneyimini açın.';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_project_tour_button" varchar DEFAULT 'Projeyi 360° Keşfedin';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_not_found_eyebrow" varchar DEFAULT '404 / SAYFA BULUNAMADI';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_not_found_heading" varchar DEFAULT 'Görünüşe göre';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_not_found_emphasis" varchar DEFAULT 'yolunuzu kaybettiniz.';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_not_found_description" varchar DEFAULT 'Aradığınız sayfa taşınmış, silinmiş veya henüz yayında olmayabilir.';
  ALTER TABLE "site_settings" ADD COLUMN "site_copy_not_found_button" varchar DEFAULT 'Ana sayfaya dön';`)
}

// Rollback removes only the configurable copy columns. Export customized copy before using down.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "site_copy_nav_home";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_nav_projects";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_nav_models";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_nav_studio";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_nav_services";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_nav_showroom";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_nav_contact";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_nav_quote";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_footer_explore_label";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_footer_contact_label";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_footer_contact_heading";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_footer_signature";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_projects_eyebrow";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_projects_title";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_projects_description";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_models_eyebrow";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_models_title";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_models_description";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_services_eyebrow";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_services_title";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_services_title_second";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_services_description";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_showroom_eyebrow";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_showroom_title";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_showroom_title_second";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_showroom_description";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_contact_eyebrow";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_contact_title";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_contact_title_second";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_contact_description";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_quote_eyebrow";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_quote_title";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_quote_title_second";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_quote_description";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_corporate_cta_eyebrow";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_corporate_cta_heading";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_corporate_cta_description";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_corporate_cta_primary";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_corporate_cta_secondary";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_project_tour_eyebrow";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_project_tour_heading";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_project_tour_description";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_project_tour_button";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_not_found_eyebrow";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_not_found_heading";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_not_found_emphasis";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_not_found_description";
  ALTER TABLE "site_settings" DROP COLUMN "site_copy_not_found_button";`)
}
