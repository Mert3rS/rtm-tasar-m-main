# RTM Tasarım — AI Geliştirme Rehberi

## Proje amacı ve mimari

Bu depo RTM Tasarım'ın kurumsal web sitesi, proje portföyü ve içerik yönetim sistemidir. Next.js App Router ile Payload CMS aynı uygulama ve deployment birimi içinde çalışır. Ayrı bir backend servisi, Prisma veya ikinci bir ORM eklemeyin.

Ana teknoloji yığını: Next.js, React, strict TypeScript, Payload CMS, Payload PostgreSQL adapteri, PostgreSQL, Tailwind CSS, ESLint ve pnpm.

## Klasör kuralları

- `src/app/(frontend)`: Public App Router sayfaları ve layout'ları.
- `src/app/(payload)`: Payload tarafından gereken admin ve API route'ları. Resmî şablon yapısını koruyun.
- `src/collections`: Her Payload koleksiyonu ayrı ve isimlendirilmiş bir config dosyasında.
- `src/access`: Paylaşılan erişim kontrol fonksiyonları.
- `src/components`: Gelecekte ortak UI bileşenleri; server/client ayrımını dosya seviyesinde belirgin tutun.
- `src/components/three`: Gelecekteki WebGL/3B Client Component'leri. İlgili faz gelmeden oluşturmayın veya 3B bağımlılık eklemeyin.
- `src/payload.config.ts`: Merkezi Payload kaydı. Koleksiyonları burada açıkça kaydedin.
- `media/`: Yalnızca yerel geliştirme yüklemeleri; Git'e eklenmez.

## TypeScript ve kod kalitesi

- `strict` modunu kapatmayın; `any`, `@ts-ignore` ve zorlamalı type assertion kullanımından kaçının.
- Payload ve Next.js'in sağladığı tipleri kullanın. Şema değişikliğinden sonra `pnpm generate:types` çalıştırın.
- Server Component varsayılandır. Yalnızca tarayıcı API'leri, state, event handler veya WebGL gerektiğinde dosyaya `'use client'` ekleyin.
- Küçük, amaç odaklı ve yeniden kullanılabilir bileşenler yazın. Kullanım ortaya çıkmadan soyutlama katmanı eklemeyin.
- Değişikliklerden sonra en az `pnpm typecheck` ve `pnpm lint`; altyapı veya route değişikliğinde `pnpm build` çalıştırın.

## Payload CMS kuralları

- Native Payload field ve relationship tiplerini tercih edin.
- Public okuma erişimini bilinçli tanımlayın. Projelerde anonim kullanıcı sadece `_status: published` belgelerini okuyabilmelidir.
- Create/update/delete işlemleri varsayılan olarak kimlik doğrulaması gerektirir.
- Upload alanları `media` koleksiyonuyla ilişkili olmalı; her görselde anlamlı alt metin tutulmalıdır.
- Admin panelini yeniden yazmayın; Payload'ın native admin arayüzünü kullanın.
- Hook eklerken tekrarlanabilirlik, hata davranışı ve access override etkisini belgeleyin.

## Veritabanı ve migration

- Yerelde `DATABASE_URI` ve Compose PostgreSQL kullanın. Bağlantı bilgisini kaynak koduna sabitlemeyin.
- Geliştirme ortamında Payload Postgres adapterinin varsayılan `push` akışı kullanılabilir.
- Paylaşılan/staging/production şema değişiklikleri için migration oluşturun ve repoya ekleyin.
- Production'da otomatik push ve migration akışlarını karıştırmayın. Migration'lar deployment'tan önce veya kontrollü release adımında çalışmalıdır.
- Migration veya seed komutunu veri kaybı olasılığı açısından incelemeden çalıştırmayın.

## Güvenlik

- `.env`, secret, token, gerçek müşteri verisi ve production kimlik bilgilerini commit etmeyin.
- `PAYLOAD_SECRET` production'da uzun, rastgele ve ortam secret yönetiminde saklanan bir değer olmalıdır.
- Yeni koleksiyonlarda erişim kurallarını açıkça tanımlayın; varsayılan public mutasyon erişimine güvenmeyin.
- Kullanıcı girdisini sunucu sınırında doğrulayın; hata mesajlarında secret veya bağlantı ayrıntısı sızdırmayın.
- Bağımlılık, dosya yükleme ve haricî URL girdilerini en az yetki ilkesiyle ele alın.

## Bağımlılık yönetimi

- Yalnızca pnpm kullanın; lockfile'ları karıştırmayın.
- Yeni paket eklemeden önce mevcut platform API'leriyle çözülüp çözülemeyeceğini değerlendirin.
- Stable sürümleri ve Payload/Next.js resmî uyumluluk aralıklarını kullanın; beta, canary ve experimental paket eklemeyin.
- Payload paketlerini aynı sürümde tutun. Next.js veya Payload güncellemesinden önce resmî uyumluluk matrisini kontrol edin.
- Paket değişikliğinde `pnpm-lock.yaml` dosyasını güncelleyin ve build doğrulaması yapın.

## Gelecekteki 3B geliştirme

- Three.js, React Three Fiber, Drei, globe ve GSAP bağımlılıklarını yalnızca ilgili faz başladığında ekleyin.
- Canvas/WebGL deneyimlerini dinamik yüklenen, izole Client Component'lerde tutun; public sayfanın geri kalanı Server Component kalmalıdır.
- Düşük güçlü cihazlar, hareket azaltma tercihi, klavye erişimi ve WebGL olmayan fallback deneyimi tasarımın parçasıdır.
- 3B varlıkları sıkıştırın, lazy-load edin ve performans bütçesini ölçün. Ana thread'i gereksiz animasyonlarla bloke etmeyin.

## Çalışma beklentisi

### Frontend tema ve ana sayfa kuralları

- Public frontend renklerini `src/app/(frontend)/styles.css` içindeki semantik CSS değişkenlerinden kullanın; Payload admin temasını değiştirmeyin.
- `ThemeProvider` açık temayı varsayılan kabul eder ve `rtm-theme` localStorage anahtarını kullanır. Tema değişiminde küreyi key ile yeniden mount etmeyin.
- Küre hero içinde kalır. Statik ana sayfa bölümleri `src/components/home`, ortak navigasyon/footer `src/components/site`, tema etkileşimi `src/components/theme` içindedir.
- `getHomepageData()` yalnızca yayınlanmış ve erişilebilir projelerden küre/galeri verisini aynı sunucu sorgusunda üretir. Şema değişmeden ek pazarlama alanları veya müşteri iddiaları uydurmayın.
- CMS tarayıcı testi sadece açıkça `RTM_CMS_E2E=1` ile yerel ortamda çalışır; test verisi temizliği sadece oluşturduğu ID'lerle sınırlandırılır.

### Portföy geliştirme kuralları — Faz 4

- Arşiv `/projeler`, detay `/projeler/[slug]` altında kalır; onaylı ana sayfa hero tasarımını değiştirmeyin.
- Public veri sorgularını `src/lib/projectData.ts` üzerinden paylaşın. `overrideAccess: false`, `draft: false`, yayın filtresi ve hafif DTO ayrımını koruyun; metadata da aynı güvenli detay sorgusunu kullanmalıdır.
- Proje sıralaması `displayOrder, -createdAt, -id`; arşiv sayfa boyutu sekizdir. Filtreler `kategori/ulke/sehir/sayfa` URL parametrelerinden gelir. Sonuçsuz/geçersiz seçimleri sessizce tüm sonuçlara çevirmeyin.
- Kategoriler `project-categories` koleksiyonundadır; örnek kategori veya müşteri içeriğini otomatik seed etmeyin. Pasif kategori proje ilişkilerini silmez.
- Yeni portfolio UI bileşenleri `src/components/portfolio` içindedir. Lightbox native dialog kullanır; klavye/odak ve reduced-motion davranışlarını koruyun.
- Rich text raw HTML olarak render edilmez. Canonical origin için `SITE_URL` doğrulanır; localhost/IP canonical üretmeyin.
- Kalıcı CMS içerik cache'i yoktur; React cache yalnızca bir istekte tekrarları birleştirir. Yeni kalıcı cache eklenirse yayın/yayından kaldırma invalidation'ı da tasarlanmalıdır.
- Migration'lar `src/migrations` altındadır. Yerel push veritabanında bu migration zincirini çalıştırmayın; baseline mevcut tabloyu yeniden kurmak için kullanılamaz. Dolu staging/production baseline benimseme adımı README'de açıklanmıştır.

### Showroom geliştirme kuralları — Faz 5

- Route'lar `/showroom` ve `/showroom/[slug]`; koleksiyonlar `showrooms` ve `showroom-scenes`. Public sorgular `src/lib/showroomData.ts` içindedir; yayın, erişim ve hafif DTO kurallarını koruyun. Sahne parent'ı da yayınlanmış olmalıdır.
- Pannellum yalnızca dinamik browser bileşeninde yüklenir. Viewer instance sahne değişiminde yeniden kurulmaz; event/observer/destroy cleanup korunmalıdır. Tema viewer'ı remount etmez. Mevcut küre ve hero mimarisini değiştirmeyin.
- Media `usage: panorama` yalnızca gerçek JPEG/WebP, tam 2:1, 1024–8192 px genişlik kabul eder; Sharp gerçek byte içeriğini doğrular. Orijinalleri yeniden sıkıştırmayın/crop etmeyin. `MEDIA_MAX_UPLOAD_MB` default32 sınırı bütün yüklemelere uygulanır.
- Hotspot hedefi aynı parent'a aittir; sceneKey parent içinde benzersizdir. Oluşturulmuş sahne parent'ı değişmez. Taslak hedef public DTO'da gizlenir. Referans koruma hook'larında `overrideAccess: true` yalnızca transaction içindeki bütünlük kontrolleri içindir; public read'de kullanmayın.
- Silme sırası: gelen hotspot'ları kaldırıp kaynak sahneleri yayınlayın; sonra sahne → showroom → kullanılmayan medya. Yayınlanmış referans ve son taslak ayrı kontrol edilir. Hook'lar veri yazmaz, alan hatasıyla işlemi durdurur.
- Yönetilmeyen haricî panorama URL'lerini kabul etmeyin. S3/CDN geçişinde yalnızca sahip olunan origin için açık allowlist ve kalıcı Media adapteri birlikte eklenmelidir.
- HTML sahne/hotspot listesi WebGL hatasında da kalır. Reduced-motion, klavye, odak geri dönüşü, retry ve fullscreen destek tespiti korunmalıdır. Boş sahnede viewer açmayın.
- Gerçek müşteri panoraması olmadan kalıcı DEMO seed yapmayın. `showroom.e2e.spec.ts` yalnızca opt-in yerel testte geçici geometrik desenler üretir. GLB geldiğinde mevcut parent/proje/SEO yapısını koruyarak sceneType/provider genişletmesi planlayın; şu anda R3F/Drei eklemeyin.
- Faz 5 migration'ı additive'dir. Yerel push DB'de zinciri çalıştırmayın; shared ortamda README baseline benimseme sürecini izleyin.

### İletişim ve başvuru kuralları — Faz 6

- `/iletisim` ve `/teklif-al` mevcut tasarım/tema içinde kalır. Etkileşim `src/components/contact` altında; sayfa metni ve ayar erişimi sunucudadır. Yeni büyük form kütüphanesi eklemeyin.
- `site-settings` global'ı admin-only okunur/güncellenir. Public `getPublicSiteSettings()` yalnızca açık select/DTO alanlarını trusted Local API ile alır. Bildirim alıcısı veya sunucu sırları browser'a aktarılmaz. SMTP sırlarını CMS'ye koymayın.
- `inquiries` kişisel veri içerir; public CRUD kapalıdır. Public submission endpoint'i yalnızca doğrulanmış alanlardan yeni başvuru create eder; keyfi collection, update veya korunan alan input'u eklemeyin. `overrideAccess: true` sadece belgelenmiş trusted create/lookup/notification işlemleri içindir.
- Sunucudaki doğrulamayı client validasyonuyla değiştirmeyin. 24 KiB body limiti stream için de uygulanır. Cookie'ye bağlı imzalı token, exact Origin, honeypot, UUID idempotency ve DB unique index korunmalıdır. Raw HTML, kişisel veri URL/log/analytics/localStorage'a eklenmez.
- `form-rate-limits` private altyapı koleksiyonudur; atomik sayaç mevcut Postgres adapterindedir. In-memory limiter'a düşmeyin. IP başlığı yalnızca proxy'nin sıfırladığı `cf-connecting-ip`/`x-real-ip` olabilir; rastgele X-Forwarded-For'a güvenmeyin. HMAC bucket'lar ham IP/e-posta tutmaz, süresi dolanlar sonraki gönderimde silinir.
- Onaylı aydınlatma metni/HTTPS bağlantısı olmadan formlar hem UI hem endpoint'te kapalıdır. Hukuki metin veya gerçek iletişim bilgisi uydurmayın. Marketing izni/otomatik fiyat/yanıt süresi sözü eklemeyin.
- SMTP adapteri Payload ile aynı sürümdedir. Bildirim yalnızca SMTP + CMS alıcısı + sunucu allowlist'i birlikte uygunsa gider. Başvuru önce saklanır; bildirim hatası silme veya kayıt başarısızlığına dönüşmez. `accepted` teslim kanıtı değildir. Sonuç yazılamazsa pending belirsizliğinde otomatik resend yapmayın.
- Başvuru retention'ı otomatik değildir; native admin Delete ayrı, Archive ayrı işlemdir. Yeni otomatik silme/personal-data export eklemeden müşteri politikasını netleştirin.
- Faz 6 migration'ı additive'dir; yerel push DB'de zinciri çalıştırmayın. CMS E2E yalnızca opt-in yerelde geçici DEMO içerikle çalışır; global ayarları yedekleyip geri alın ve eşzamanlı kullanıcı düzenlemelerini ezmeyin.

### Kurumsal içerik ve model kataloğu — Faz 7

- `/hakkimizda`, `/hizmetler[/slug]`, `/modeller[/slug]` kurumsal route'larıdır. `about-page` native drafts global'ı, `services`, `design-models`, `model-categories` koleksiyonları kullanılır. Site Settings iletişim bilgilerini çoğaltmayın.
- Design Models tamamlanmış Projects değildir; model kayıtlarını küreye eklemeyin. Model kategorileri proje kategorilerinden ayrıdır. ModelType yalnızca doğrulanmış kaynakla atanır; default üretim iddiası yoktur. Gerçek şirket/ekip/süreç/hizmet/model içeriği otomatik seed edilmez.
- Public sorgular `catalogData.ts` ve `aboutData.ts` içindedir; koleksiyonlarda `overrideAccess: false`, `draft: false`, yayın filtresi; hizmetlerde ayrıca aktiflik korunur. About admin-only global'ın trusted okuması sadece published snapshot + açık DTO içindir; seçili projeler yeniden public yetkiyle okunur. Metadata aynı güvenli detay sorgularını kullanır.
- Arşivler sekizli, ana sayfa hizmetleri en fazla dört, featured modeller en fazla üç sonuçla sınırlıdır. Sıralama `displayOrder, -createdAt, -id`. Kategori URL parametresi `kategori`, sayfa `sayfa`; bilinmeyen/pasif kategoriyi tüm sonuçlara çevirmeyin. Pasif kategori modeli silmez/yayından kaldırmaz.
- Mevcut ProjectGallery ve ProjectDescription paylaşılır; galeriye opsiyonel heading/eyebrow verilebilir. Native dialog klavye/odak/dokunma ve güvenli rich text kurallarını koruyun; yeni galeri/render bağımlılığı eklemeyin.
- Ana sayfa hizmet ve şirket metni CMS'den gelir; yayınlanmış içerik yokken boş durum kullanılır. Model önizlemesi içeriksizken gizlenir. Hero, küre, proje portföyü, showroom ve Faz 6 başvuru güvenliğini değiştirmeyin.
- About değişikliği son yayını taslakla ezmemelidir. Kalıcı cache yoktur; yeni kalıcı cache eklenirse yayın/pasifleştirme invalidation'ı tasarlanmalıdır.
- Faz 7 migration'ı additive'dir; dev push DB'de zinciri çalıştırmayın. CMS QA yalnızca opt-in yerelde DEMO kayıtlarla çalışır; global published/draft yedeği, sürüm geçmişi ve eşzamanlı kullanıcı düzenlemeleri korunmalıdır. Üretime test içeriği bırakmayın.

### Asistan — Faz 9

- Asistan deterministiktir (`src/lib/assistant`); haricî AI/LLM servisi, SDK, API anahtarı veya üçüncü taraf sohbet servisi eklemeyin. Gelecekte model eklenecekse yalnızca `ResponseEngine` arayüzü arkasında ve ayrı onayla.
- Cevaplar yalnızca yayınlanmış CMS verisi ve onaylı Asistan cevapları/SSS'ten kurulur. Fiyat, süre, garanti, stok, saat bilgisini kodda yazmayın; bilgi uydurmayın.
- Bilgi indeksi public kurallarla (`overrideAccess: false`, `draft: false`, yayın/aktif filtresi) ve trusted DTO yollarıyla okunur; 60 sn TTL dışında kalıcı cache eklemeyin.
- `/api/assistant` Faz 6 güvenliğini (exact Origin, imzalı token, `boundedJson`, `allowBuckets`) kullanır; mesaj/kişisel veri loglanmaz. Bağlantılar `links.ts` allowlist'inden geçmelidir. Yeni niyet eklerken `tests/assistant-evals` setini güncelleyip `pnpm eval:assistant` ≥%90 kalmalıdır.

### Çerez onayı ve kişiselleştirme — Faz 10

- Her yeni cookie/localStorage/sessionStorage anahtarı önce `src/lib/consent/registry.ts`'ye eklenir ve yalnızca `safeStorage` ile kullanılır; doğrudan Web Storage/`document.cookie` ESLint ile yasaktır.
- Zorunlu olmayan özellik/betik `hasConsent`/`ConsentGate` arkasında çalışır; geri almada registry anahtarları silinir. Üçüncü taraf takip/reklam/analitik betiği eklemeyin; Pazarlama kategorisi gerçek kullanım olmadan gösterilmez.
- Onaylı politika (metin/HTTPS bağlantısı + sürüm) yokken isteğe bağlı kategoriler kapalıdır; hukuki metin üretmeyin. Sunucuda analitik/kişiselleştirme yazımı cookie'den izin doğrulanmadan yapılmaz.
- İlgi verisi yalnızca tarayıcıda tutulur; sunucuda profil oluşturmayın. `/api/recommendations` yalnızca yayınlanmış içerik döndürür ve isteği saklamaz.

Kapsamı dar tutun, mevcut kullanıcı değişikliklerini koruyun ve doğrulamadığınız sonucu çalışıyor diye bildirmeyin. Yeni içerik uydurmayın; gerçek müşteri/portföy içeriği yalnızca onaylı kaynaktan eklenmelidir.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
