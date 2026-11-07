# RTM Tasarım

RTM Tasarım'ın kurumsal web sitesi ve içerik yönetim altyapısıdır. Uygulama; public web arayüzünü, Payload CMS yönetim panelini ve API katmanını aynı Next.js projesinde birleştirir.

Depoda **Faz 1–7** kurumsal site/CMS, portföy, showroom, iletişim ve katalog altyapısı; **Faz 8–8.2** mobilya tasarım atölyesi, **Faz 9** haricî servis kullanmayan site asistanı ve **Faz 10** çerez onayı/ilgi bazlı kişiselleştirme bulunur. Güncel public tasarım ve ana sayfa revizyonları [tasarım notlarında](docs/homepage-design.md) açıklanır; aşağıdaki eski faz bölümleri geliştirme geçmişini de içerir.

## Teknoloji yığını

- Next.js 16.3.3 (App Router)
- React 19.2.6
- TypeScript (strict mode)
- Payload CMS 3.92.1
- Payload PostgreSQL adapteri
- PostgreSQL 17 (Docker Compose)
- Tailwind CSS 4.3.3
- Three.js 0.186.1
- react-globe.gl 2.38.0
- ESLint 9
- pnpm 11.28.6

## Gereksinimler

- Node.js 22.23.4 veya Payload tarafından desteklenen daha yeni bir sürüm (`^22.23.4 || >=24.22.1`)
- pnpm 11.x
- Git
- Docker Desktop ve Docker Compose (yerel PostgreSQL için)

Node sürümü `.node-version` ve `.nvmrc` dosyalarında sabitlenmiştir. Corepack kullanıyorsanız:

```bash
corepack enable
corepack prepare pnpm@11.28.6 --activate
```

## Kurulum

1. Bağımlılıkları kurun:

   ```bash
   pnpm install
   ```

2. Ortam dosyasını oluşturun:

   ```powershell
   Copy-Item .env.example .env
   ```

   macOS/Linux için:

   ```bash
   cp .env.example .env
   ```

3. `.env` içindeki `PAYLOAD_SECRET` değerini uzun ve rastgele bir değerle değiştirin. Örneğin `openssl rand -hex 32` kullanabilirsiniz.

4. PostgreSQL'i ve geliştirme sunucusunu başlatın:

   ```bash
   pnpm db:up
   pnpm dev
   ```

Ana sayfa: [http://localhost:3000](http://localhost:3000)  
Payload yönetim paneli: [http://localhost:3000/admin](http://localhost:3000/admin)

## Ortam değişkenleri

| Değişken | Açıklama |
| --- | --- |
| `DATABASE_URI` | PostgreSQL bağlantı adresi; tanımlı değilse Vercel entegrasyonlarının `DATABASE_URL` veya `DATABASE_POSTGRES_URL` değişkeni kullanılır |
| `PAYLOAD_SECRET` | Payload oturum ve token imzalama anahtarı; gizli tutulmalıdır |
| `NEXT_PUBLIC_SERVER_URL` | Uygulamanın public adresi |
| `SITE_URL` | Gerçek HTTPS production kökü; canonical ve sosyal paylaşım URL'leri için önceliklidir. Yerelde boş bırakın. |
| `BLOB_READ_WRITE_TOKEN` | Production medya yüklemelerini Vercel Blob'da kalıcı tutar; Vercel Blob bağlantısı tarafından sağlanır ve gizli tutulmalıdır |

`.env` Git tarafından yok sayılır. Gerçek sırları `.env.example` dosyasına yazmayın.

## Geliştirme komutları

```bash
pnpm dev                 # Geliştirme sunucusu
pnpm build               # Production derlemesi
pnpm start               # Derlenmiş uygulamayı çalıştırır
pnpm lint                # ESLint kontrolü
pnpm typecheck           # TypeScript kontrolü
pnpm generate:types      # Payload tiplerini yeniden üretir
pnpm generate:importmap  # Admin import map dosyasını yeniler
pnpm db:up               # PostgreSQL container'ını başlatır
pnpm db:down             # PostgreSQL container'ını durdurur
pnpm db:logs             # PostgreSQL loglarını izler
pnpm content:export      # Paylaşılabilir CMS + medya snapshot'ı oluşturur
pnpm content:verify      # Snapshot checksum bütünlüğünü doğrular
pnpm content:check       # Dump'ı geçici veritabanına geri yükleyerek test eder
pnpm content:import      # Doğrulanmış snapshot'ı otomatik yedekle yerel ortama kurar
```

## Ekip içeriğini güvenli eşitleme

Git yalnızca uygulama kodunu ve `public/` altındaki statik varlıkları taşır. Payload kayıtları
yerel PostgreSQL volume'unda, CMS yüklemeleri ise Git tarafından izlenmeyen `media/` klasöründe
tutulur. Hero, proje atlası, hizmet animasyonları ve model karuseli için bu iki kaynak eşleşmiş
olmalıdır.

İçeriğin çalıştığı bilgisayarda PostgreSQL'i başlatıp ekip snapshot'ı oluşturun:

```bash
pnpm db:up
pnpm content:export -- --name ana-sayfa-icerigi
```

Araç `.content-snapshots/ana-sayfa-icerigi` altında PostgreSQL custom dump, `media/` kopyası ve
her dosyanın SHA-256 checksum'ını içeren manifest üretir. Ekip export'u kullanıcıları, oturumları,
başvuruları, rate-limit kayıtlarını ve Payload'ın özel yönetim durumunu taşımaz. Snapshot klasörü
Git tarafından yok sayılır; güvenli bir ekip kanalıyla, tercihen şifreli arşiv olarak aktarılmalıdır.

Alıcı bilgisayarda önce dosya bütünlüğünü ve gerçek geri yüklenebilirliği doğrulayın:

```bash
pnpm content:verify -- .content-snapshots/ana-sayfa-icerigi
pnpm content:check -- .content-snapshots/ana-sayfa-icerigi
```

Uygulama sunucusunu durdurduktan sonra yerel içeriği kurun:

```bash
pnpm content:import -- .content-snapshots/ana-sayfa-icerigi --confirm-replace-local
```

Import hedef veritabanını değiştirmeden önce mevcut DB ve `media/` durumunun tam yerel yedeğini
alır. Dump tek transaction içinde geri yüklenir; medya atomik klasör değişimiyle kurulur. İşlem
yarıda kalırsa araç otomatik yedekten geri dönmeye çalışır. Ekip snapshot'ı admin hesabı taşımadığı
için alıcı ilk yerel yönetici hesabını `/admin` üzerinden oluşturur. Snapshot'ları veya veritabanı
dumplarını repoya eklemeyin; gerçek müşteri/başvuru verisini geliştirme paketi olarak paylaşmayın.

## İlk yönetici hesabı

1. PostgreSQL ve geliştirme sunucusunun çalıştığından emin olun.
2. Tarayıcıda `http://localhost:3000/admin` adresini açın.
3. İlk kullanıcı formunda e-posta ve güçlü bir parola belirleyin.
4. İlk hesap oluşturulduktan sonra yeni kullanıcı oluşturma ve tüm içerik değişiklikleri kimlik doğrulaması gerektirir.

## CMS koleksiyonları

- `users`: Payload kimlik doğrulaması ve yönetici erişimi
- `media`: Görsel yüklemeleri ve zorunlu alternatif metin
- `countries`: Ülke adı, ISO kodu ve slug
- `cities`: Şehir, ülke ilişkisi ve koordinatlar
- `projects`: Proje bilgileri, şehir, kapak, galeri, öne çıkarma ve taslak/yayın durumu
- `project-categories`: CMS'den düzenlenen, çoklu proje ilişkisi kurulabilen aktif/pasif kategoriler

Anonim API kullanıcıları yalnızca yayındaki projeleri okuyabilir. İçerik oluşturma, güncelleme ve silme işlemleri kimlik doğrulamış yöneticilerle sınırlıdır.

## Etkileşimli proje küresi

Ana sayfa Server Component olarak Payload Local API'den proje verisini alır. Sorgu hem `overrideAccess: false` kullanır hem de `_status = published` koşulunu açıkça uygular. Yalnızca yayındaki projelere sahip, geçerli koordinatlı şehirler tarayıcıya serileştirilir.

WebGL bileşeni ayrı bir Client Component'tir ve `next/dynamic` ile yalnızca tarayıcıda yüklenir. Küre:

- Boştayken yavaşça otomatik döner.
- Fare ve dokunma ile elle döndürülebilir.
- Şehir seçildiğinde otomatik dönmeyi durdurur ve kamerayı lokasyona taşır.
- Seçilen şehrin yayındaki proje kartlarını gösterir.
- `prefers-reduced-motion`, WebGL hata durumu ve erişilebilir HTML şehir listesi için fallback sağlar.
- Veritabanı boşken sahte proje oluşturmadan açıklayıcı boş durum gösterir.

Dünya dokusu yerel olarak `public/assets/globe/earth-blue-marble-2048.jpg` yolundan sunulur. Kaynak, kredi ve NASA kullanım koşulları [varlık notunda](public/assets/globe/README.md) belgelenmiştir.

Yeni bir lokasyonun kürede görünmesi için:

1. Admin panelinde ülke ve koordinatları geçerli bir şehir oluşturun.
2. Bu şehirle ilişkili, kapak görseli bulunan bir proje oluşturun.
3. Projeyi `published` durumuna getirin.

Taslak projeler ve yalnızca taslak projesi bulunan şehirler public küre verisine dahil edilmez.

## Ana sayfa ve tema sistemi — Faz 3

- Ana sayfa Server Component olarak kalır. `getHomepageData()`, tek Payload Local API sorgusundan küre şehirlerini ve en fazla dört `featured` proje kartını üretir. Faz 4 ile kartlar kategori ve çalışan proje bağlantıları içerir.
- `src/components/home`: HeroSection, FeaturedProjects, ServicesSection ve AboutPreview. `src/components/site`: navigasyon, footer ve ortak ok simgesi.
- Küre ilk hero'nun içinde yer alır. Şehir paneli yalnızca seçim olduğunda açılır; mobilde kürenin altında gösterilir. Çok projeli şehirlerde önceki/sonraki kontrolleri vardır. Escape paneli kapatır ve şehir seçimine odağı döndürür.
- Varsayılan tema açıktır; işletim sistemi tercihi varsayılanı değiştirmez. `ThemeProvider` ve `ThemeToggle`, tercihi `localStorage['rtm-theme']` içinde saklar ve sekmeler arasında eşitler. Depolama engelliyken mevcut sekmede tema değiştirmek yine çalışır.
- Frontend layout'undaki sabit inline betik, kaydedilen temayı ilk çizimden önce uygular. `suppressHydrationWarning` yalnızca değişen kök HTML özniteliğindedir; React tüketicileri `useSyncExternalStore` ile senkronize edilir. İleride katı CSP eklenirse bu sabit betiğe hash veya nonce tanımlanmalıdır.
- Renkler `styles.css` içindeki semantik değişkenlerde merkezileştirilir; Tailwind 4 bunları `@theme inline` ile kullanır. CSS geçişleri ve küre hareketleri reduced-motion tercihine uyar. Tema değişimi WebGL bileşenini yeniden mount etmez.
- Native Payload admin teması bağımsızdır. Faz 3 tema sistemi için paket veya şema değişikliği yapılmamıştır; Faz 4 şema eklemeleri aşağıdadır.
- İletişim bilgileri henüz doğrulanmadığı için yayınlanmaz. Hizmet etiketleri başlangıç içeriğidir ve `ServicesSection.tsx` içindeki tek diziden düzenlenebilir. Mimari çizgiler CSS çalışmasıdır; müşteri projesi/fotoğrafı olarak sunulmaz.

### Tarayıcı doğrulaması

Geliştirme sunucusu ve yerel PostgreSQL çalışırken:

```bash
pnpm test:e2e --workers=1
pnpm test:int
pnpm typecheck
pnpm lint
pnpm build
```

Tema, kalıcılık, sekme eşitleme, mobil menü, WebGL fallback ve 1440/1024/768/390/320px yerleşimleri test edilir.

CMS işaretçi/panel ve featured sıralaması testi **isteğe bağlıdır**; yalnızca yerel geliştirme veritabanına karşı çalıştırın:

```powershell
$env:RTM_CMS_E2E = '1'
pnpm test:e2e tests/e2e/cms-globe.e2e.spec.ts --workers=1
Remove-Item Env:\RTM_CMS_E2E
```

Bu test benzersiz slug'lı, açıkça DEMO etiketli kayıtlar ve düz renk test görseli oluşturur. Normal koşuda atlanır; production modunda çalışmaz. `finally` bloğu yalnızca testin oluşturduğu ID'leri siler; gerçek kayıtlara dokunmaz. Test işlemi zorla sonlandırılırsa `phase3-qa-` slug/filename önekli ve DEMO etiketli kayıtları admin'den proje → şehir → medya → ülke sırasıyla inceleyip kaldırabilirsiniz. Otomatik production seed veya kalıcı demo içeriği yoktur.

## Portföy ve proje detayları — Faz 4

### Route ve veri akışı

- `/projeler`: sunucuda filtrelenen, sekizer proje gösteren portföy arşivi.
- `/projeler/[slug]`: yayınlanmış proje, zengin açıklama, isteğe bağlı bilgiler, galeri ve ilgili projeler.
- Olmayan veya yalnızca taslak durumundaki slug'lar `notFound()` ile 404 verir. CMS hataları ayrı hata ekranında gösterilir.
- Header ve footer aynı kimlikle tüm public sayfalarda kullanılır. Ana sayfa kartları, “Tüm Projeleri Gör” ve küredeki “Projeyi incele” bağlantıları bu route'lara gider.
- `src/lib/projectData.ts` public sorgu kurallarını, belge dönüşümünü, filtre seçeneklerini, detayları ve ilgili projeleri paylaşır. `getGlobeData.ts` aynı kurallarla küre verisini üretir. Route'lar Server Component olarak kalır; galeri büyütme Client Component'tir.
- Public proje sorguları **`overrideAccess: false`, `draft: false` ve `_status = published`** kullanır. Metadatada aynı memoize edilmiş yayınlanmış belge okunur. Sonradan kaydedilmiş yayınlanmamış değişiklikler public içeriğe karışmaz.
- Liste sorguları yalnızca kart için gereken alanları seçer. Şehir/ülke/kategori/medya `depth: 2` ile toplu populate edilir; her kart için ayrı sorgu açılmaz. İlgili projeler en fazla üç sonuçla kategori → şehir → diğer yayınlar sırasını izler.
- Sıralama `displayOrder ASC, createdAt DESC, id DESC` şeklindedir; sayfalar arası sıra kararlıdır.
- React `cache()` yalnızca aynı sunucu isteği içindeki tekrarları birleştirir. Kalıcı içerik cache'i ve revalidation hook'u yoktur. Kaydetme/yayınlama/yayından kaldırma bir sonraki istekte görünür; tarayıcıda eski sayfadaysanız yenileyin.

### CMS'de yeni proje ekleme

1. `/admin` içinde Project Categories üzerinden kategori adı ve URL slug'ı girin. `displayOrder` sırasını ve `active` durumunu belirleyin. Örnek kategoriler otomatik eklenmez.
2. Ülke ve koordinatlı şehir kaydını oluşturun veya mevcut kaydı seçin.
3. Media üzerinden kapak/galeri fotoğraflarını yükleyin; her görsele açıklayıcı alt metin girin.
4. Projects içinde başlık, benzersiz küçük harfli/tireli slug, kısa açıklama, şehir ve kapak seçin. İstenirse birden fazla kategori atayın ve Lexical editöründe uzun anlatımı yazın.
5. `featured` ana sayfada gösterir; `displayOrder` listelerde küçükten büyüğe sıralar. Yıl, proje türü, m² alan, konum açıklaması ve müşteri adı isteğe bağlıdır. Müşteri adı yalnızca public paylaşım onayı varsa girilmelidir.
6. Galeri satırlarına Media görselleri ekleyip sıralayın. Galeri kapakla başlar; aynı URL tekrar eklenirse tek slayt gösterilir. Boş görsel ilişkileri atlanır.
7. Taslak olarak kaydedebilir veya native Publish işlemiyle yayınlayabilirsiniz. Taslakları görüntüleyen ayrı public preview sistemi bu fazda yoktur.

Aktif olmayan kategoriler public filtrelerde ve etiketlerde görünmez; proje ilişkileri ve projenin yayın durumu korunur. Kategorisi olmayan projeler de yayınlanabilir.

### Filtreler ve sayfalama

GET formu URL'yi tek durum kaynağı olarak kullanır; ek tarayıcı state'i veya özel API yoktur:

```text
/projeler?kategori=ic-mimari
/projeler?ulke=almanya&sehir=berlin
/projeler?kategori=ic-mimari&ulke=almanya&sayfa=2
```

“Filtrele” seçimleri uygular ve ilk sayfaya döner. “Tümü / Sıfırla” temiz URL'ye gider. Ülke uygulandıktan sonra şehir seçenekleri o ülkeye daralır. Geri/ileri ve doğrudan bağlantılar desteklenir; bilinmeyen veya birbiriyle uyuşmayan filtreler sonuç üretmez. Kategori, ülke ve şehir seçenekleri gerçek CMS kayıtlarından gelir.

### Görseller ve erişilebilir galeri

Yeni yüklemelerde 960×720 `card` türevi üretilir; kartlar bunu kullanır. Eski medyada türev yoksa orijinale dönülür; mevcut görseller silinmez veya otomatik yeniden işlenmez. Detay ve galeride orijinal oranlar korunur; `next/image` responsive boyutlar ve optimizasyon sağlar.

Native `dialog` büyütme ekranı odağı içeride tutar. Önceki/sonraki, sağ/sol ok tuşları, Escape, kapatma düğmesi ve yatay dokunma hareketi desteklenir. Kapanınca odak açan görsele döner. Mevcut tema ve reduced-motion tercihleri aynen kullanılır. Uzun metin React/Lexical JSX dönüşümüyle render edilir; raw HTML eklenmez, link protokolleri sınırlandırılır. Görseller ayrı galeriden yönetilir.

### SEO

`seoTitle`, `seoDescription`, `seoImage` isteğe bağlıdır; yoksa proje başlığı, kısa açıklaması ve kapak kullanılır. `generateMetadata` yayınlanmış veriden başlık, açıklama, Open Graph ve Twitter metadatası üretir.

Canonical/paylaşım için gerçek HTTPS origin'ini `SITE_URL` ile yapılandırın. Yoksa doğrulanmış `NEXT_PUBLIC_SERVER_URL` denenir. Localhost, IP, hatalı protokol veya kimlik bilgisi içeren adreslerden canonical üretilmez; yerelde canonical ve mutlak paylaşım görseli bilinçli olarak yoktur. Filtre/sayfalama kombinasyonları `noindex, follow` alır ve yapılandırılmışsa arşiv canonical'ına işaret eder.

### Faz 4 migration'ları

- `20261029_141446_phase3_baseline`: Önceki şemanın başlangıç snapshot'ı; yalnızca boş veritabanını kurmak içindir.
- `20261029_141553_phase4_portfolio`: kategori tablolarını, ilişkileri, isteğe bağlı proje/sürüm alanlarını ve medya kart boyutunu ekler. `up` içinde veri silme veya mevcut kolon silme yoktur.
- Yerel `rtm_tasarim` geliştirme veritabanı native push ile güncellenir; burada `pnpm payload migrate` çalıştırmayın.
- Yeni staging/production veritabanında migration zinciri kontrollü release adımında, production ortam ayarlarıyla `pnpm payload migrate` üzerinden çalıştırılmalıdır. Runtime otomatik migration eklenmemiştir.
- Önceden push ile kurulmuş dolu bir staging/production veritabanı varsa başlangıç migration'ı doğrudan çalıştırılamaz: önce yedek alınmalı, gerçek şema baseline ile karşılaştırılmalı ve yalnızca doğrulanmış baseline uygulanmış olarak kaydedilmelidir. Ardından Faz 4 migration'ı çalıştırılır. Bu benimseme adımı deployment sırasında ayrıca incelenmelidir.
- `down` yeni alan/kategori verisini kaldırır; baseline rollback bütün şemayı kaldırır. Production'da otomatik rollback/reset/fresh çalıştırmayın.

Şema değişiklikleri sonrası `pnpm generate:types` çalıştırılmıştır. İzole QA veritabanında baseline → eski proje/şehir/medya/sürüm verisi → Faz 4 migration sırası doğrulanmıştır.

### Faz 4 tarayıcı testleri

```powershell
$env:RTM_CMS_E2E = '1'
pnpm test:e2e --workers=1
Remove-Item Env:\RTM_CMS_E2E
pnpm test:int
pnpm typecheck
pnpm lint
pnpm build
```

`portfolio.e2e.spec.ts` kategori/ülke/şehir kombinasyonları, sayfalama, sonradan kaydedilen taslağın gizlenmesi, detay/metadata, 404, anonim yazma engeli, ilgili projeler, galeri/klavye/odak, tema, ana sayfa/küre bağlantıları ve beş ekran genişliğini doğrular. Test kayıtları benzersiz `phase4-qa-` slug/filename öneki ve DEMO etiketi taşır; düz renk görseller müşteri fotoğrafı değildir. Temizlik yalnızca testin oluşturduğu ID'lerle yapılır. İşlem zorla kesilirse bu önekli DEMO kayıtlarını admin'den inceleyerek proje → şehir → medya → kategori → ülke sırasıyla kaldırın. Production veya uzak veritabanında CMS yazan test çalışmaz.

## Dijital showroom — Faz 5

### Mimari ve kütüphane seçimi

`/showroom` sekizer kayıt gösteren sunucu taraflı arşivdir; `/showroom/[slug]` yayınlanmış showroom açıklaması, SEO ve interaktif turu birleştirir. Veri erişimi `src/lib/showroomData.ts`, hafif tarayıcı tipleri `src/types/showroom.ts`, UI `src/components/showroom` altındadır. Header/footer bağlantıları, alt ana sayfa teaser'ı ve yalnızca ilişkili yayınlanmış showroom varsa proje detayındaki “Projeyi 360° Keşfedin” CTA'sı mevcut tasarıma eklenmiştir.

[Pannellum referansı](https://pannellum.org/documentation/reference/) ve [Marzipano API'si](https://www.marzipano.net/docs.html) karşılaştırıldı. Pannellum 2.5.7; equirectangular görüntüler, native çoklu sahne/hotspot, dokunma, kamera ve yaşam döngüsü API'leri ile ek runtime bağımlılığı gerektirmediği için seçildi. `pannellum` ve yalnızca geliştirme için `@types/pannellum` eklendi. İkinci bir 3B render yığını eklenmedi.

`PanoramaViewer.tsx` yalnızca tarayıcıda dinamik yüklenir. Pannellum npm paketi browser-global olduğundan modül effect içinde yüklenir; API community tipleriyle kullanılır. Aynı instance `loadScene` ile tekrar kullanılır; tema değişimi remount oluşturmaz. Sahne config'leri URL içerir, yalnızca seçilen panorama indirilir; arka planda bütün panoramalar preload edilmez. Thumbnail'lar mevcut optimize medya türevlerini kullanır. ResizeObserver, event handler ve viewer cleanup yapılır; yükleme süresi aşımı, WebGL context kaybı, hata ve tekrar deneme akışı vardır. Mobil cihazın GPU sınırı nedeniyle azami çözünürlükteki dosya her cihazda açılamayabilir.

UI mevcut semantik tema değişkenlerini kullanır; panorama renklerine filtre uygulanmaz. Otomatik kamera dönüşü yoktur. Reduced-motion geçişleri ve hareket ataleti azaltır. Klavye kontrolleri, etiketli hotspot düğmeleri, HTML sahne/hotspot alternatifleri, odak geri dönüşü ve WebGL çalışmasa da kullanılabilen açıklama/thumbnail listesi bulunur. Fullscreen API yalnızca destekleniyorsa gösterilir.

### Koleksiyonlar, erişim ve ilişki bütünlüğü

- `showrooms`: başlık, slug, kısa/uzun açıklama, isteğe bağlı kapak, proje ilişkisi, featured, sıra ve SEO; native drafts/publish.
- `showroom-scenes`: zorunlu showroom, başlık, showroom içinde benzersiz `sceneKey`, doğrulanmış panorama, isteğe bağlı thumbnail/açıklama, sıra, başlangıç yaw/pitch/FOV ve hotspot dizisi; native drafts/publish.
- Hotspot tipi `scene` veya `info`; etiket, yaw/pitch, aynı showroom'a ait hedef sahne veya düz bilgi metni taşır. Yaw −180…180, pitch −90…90, FOV 50…110 derece aralığındadır. Her sahnede en fazla 40 hotspot bulunur.

Anonim okuma yalnızca yayınlanmış showroom'lar ve hem kendisi hem parent'ı yayınlanmış sahneler içindir. Public Local API sorguları açıkça `overrideAccess: false`, `draft: false` ve yayın filtresi kullanır; sonradan kaydedilmiş taslak değişiklikleri sayfaya karışmaz. Mutasyonlar kimlik doğrulaması gerektirir. Metadata da aynı güvenli detay sorgusunu kullanır; mevcut doğrulanmış `SITE_URL` canonical kuralları korunur.

`validateShowroomScene` aynı parent ve benzersiz anahtar kontrollerini yapar; oluşturulmuş sahne başka parent'a taşınamaz. DB'de bileşik unique index eşzamanlı aynı anahtar oluşturmayı da engeller. Taslak hedefe geçiş admin'de kurulabilir; hedef yayınlanana kadar public DTO bu hotspot'u çıkarır. Böylece iki sahnenin birbirine bağlanması için yayınlama döngüsü oluşmaz. CMS metinleri raw HTML olarak render edilmez.

Referans doğrulama/silme hook'ları bütünlük kontrolü için **`overrideAccess: true`** ve mevcut `req` transaction'ını kullanır; bu sonuçlar public içerik olarak dönmez. Kontroller yeniden çalıştırılabilir, veri yazmaz; hata durumunda alan bazlı ValidationError üretip işlemi durdurur. Yayın ve son taslak ayrı kontrol edilir. Gelen hotspot bağlantısı olan sahne, sahnesi olan showroom ve sahnede kullanılan panorama silinemez; kullanılan panorama normal görsele çevrilemez. Silmek için önce kaynak hotspot'ları kaldırıp kaynak sahneleri yayınlayın, ardından sahne → showroom → kullanılmayan medya sırasını izleyin. Eski sürüm geçmişi arşivdir; public ilişki kaynağı değildir.

### İlk showroom'u ekleme

1. `/admin` → Media'da kullanım türünü **360° Panorama** seçin, açıklayıcı alt metin girin ve gerçek equirectangular dosyayı yükleyin. Normal mekân fotoğrafını panorama olarak kullanmayın.
2. Showrooms'ta başlık, benzersiz slug ve kısa açıklama girin. İsteğe bağlı normal kapak, uzun açıklama, SEO ve onaylı mevcut proje ilişkisini seçin. `featured` ana sayfa teaser görseli için, `displayOrder` sıralama için kullanılır.
3. Showroom Scenes'te parent showroom'u seçip her oda için ayrı sahne oluşturun. `sceneKey` aynı showroom içinde benzersiz olmalıdır. Panorama seçin; başlangıç yönü ve FOV ile ilk kadrajı ayarlayın. Küçük önizleme için ayrı normal thumbnail yükleyebilirsiniz.
4. Önce hedef sahneleri oluşturun; sonra Hotspots satırlarında `Geçiş` ve aynı showroom içindeki hedefi seçin. Bilgi noktalarında açıklama girin. Konumlar panorama koordinatlarıdır: yaw yatay, pitch düşey açıdır; viewer'da deneyerek ince ayar yapın.
5. Ziyaretçiye açılacak sahneleri ve showroom'u native **Publish** ile yayınlayın. Sıralamada ilk sahne turun başlangıcıdır. Proje bağlantısı iki yönde otomatik görünür; ayrıca frontend kodu değişmez.
6. `/showroom/[slug]` üzerinde masaüstü, dokunmatik, iki tema ve hotspot'ları kontrol edin. Tamamen taslak showroom 404 verir. Sahne yoksa açıklama ve “360° turu yakında” durumu gösterilir, boş WebGL açılmaz.

### Panorama dosyaları ve barındırma

- JPEG veya WebP, tam **2:1**, genişlik **1024–8192 px**. Başlangıç önerisi **4096×2048**, makul kaliteyle tercihen **2–8 MB**; sınıra yakın dosyaları gerçek mobil cihazda test edin. 8192×4096 yalnızca kaynak gerçekten gerektiriyorsa kullanılmalıdır.
- `MEDIA_MAX_UPLOAD_MB` varsayılan **32**, izin verilen yapılandırma 1–256 MB; bütün medya yüklemelerine uygulanır. Hosting/proxy body limiti bununla uyumlu olmalıdır. Geçersiz ayar güvenli 32 MB varsayılanına döner.
- Sharp dosyanın gerçek byte içeriğini çözümler; MIME, boyut, oran ve panorama uzantısı kontrol edilir. Sadece uzantıya güvenilmez. Yanlış tür, normal fotoğraf veya fazla büyük dosya alan hatasıyla reddedilir. Meta alanlarını değiştirerek dosya boyutu/türü taklit edilemez.
- Orijinal panorama yeniden sıkıştırılmaz; mevcut card/thumbnail türevleri ayrıdır. CMS crop/resize işlemleri panoramalarda reddedilir. Hatalı kaynağı editör dışında doğru biçimde dışa aktarın ve yeniden yükleyin.
- Yerel Media upload sistemi kullanılır. Public panorama URL'leri yalnızca uygulamanın `/api/media/file/` yolundan kabul edilir. S3 adapterine geçerken kalıcı depolama yapılandırmasına ek olarak `managedMediaUrl` içinde yalnızca sahip olunan bucket/CDN origin'i için açık allowlist eklenmeli; rastgele haricî URL kabul edilmemelidir.

### Migration ve test

`20261029_145751_phase5_showroom` yeni showroom/sahne/hotspot tablolarını, sürümleri, indeksleri, kilit ilişkilerini ve Media `usage` alanını ekler. Mevcut medya `image` varsayılanını alır. `up` mevcut içeriği silmez. İzole QA veritabanında baseline → Faz 4 → eski proje/şehir/medya kaydı → Faz 5 sırası çalıştırılıp ilişkilerin ve eski verilerin korunduğu doğrulandı. Yerel push veritabanında migration zincirini çalıştırmayın; yukarıdaki baseline benimseme notu geçerlidir. `down` yeni fazın verilerini kaldırır ve otomatik rollback için uygun değildir. Payload tipleri/import map yeniden üretildi.

```powershell
pnpm db:up
pnpm dev
# Ayrı terminalde:
pnpm typecheck
pnpm lint
pnpm test:int
$env:RTM_CMS_E2E = '1'
pnpm test:e2e --workers=1
Remove-Item Env:\RTM_CMS_E2E
pnpm build
```

`showroom.e2e.spec.ts` gerçek Chromium WebGL ile iki sahne, JPEG/WebP, hotspot, zoom, fare/dokunma, fullscreen (destekleniyorsa), tema sırasında instance korunması, tekrar geçişler, yükleme hatası/tekrar deneme, WebGL'siz fallback, boş durumlar, SEO, anonim erişim ve proje bağlantılarını doğrular. Sentetik geometrik DEMO test desenleri müşteri içeriği değildir; yalnızca opt-in yerel testte üretilip `finally` içinde oluşturulan ID'lerle silinir. Kesilen testten kalan `phase5-qa-` etiketli kayıtları inceleyip önce hotspot'ları temizleyip yayınlayın; sonra sahne → showroom → proje → medya → şehir → ülke sırasıyla kaldırın. Gerçek panoramalar sağlanmadığından gerçek mekânların görüntü kalitesi ve cihaz başına performans onayı henüz yapılamaz.

Yaygın sorunlar: Boş listede yayın durumunu kontrol edin. Sahne görünmüyorsa parent/sahne yayını ve Media kullanım türünü kontrol edin. Geçiş görünmüyorsa hedefin yayınını kontrol edin. Yükleme hatasında ağ isteği, hosting boyut limiti ve GPU kapasitesini kontrol edin; daha küçük 2:1 kaynak deneyin. Yayından kaldırma sonraki istekte görünür; kalıcı CMS cache'i eklenmemiştir. WebGL yoksa HTML liste kullanılabilir, yeniden deneme viewer'ı temiz kurar.

### Sonraki faz: gerçek varlıklar ve GLB

Önce onaylı referans video, gerçek panoramalar, oda isimleri/açıklamaları, hotspot planı ve portföy eşleştirmesi alınmalıdır. Mevcut uygulama belirli bir referans videoyu kopyaladığını iddia etmez. GLB/GLTF sağlandığında mevcut showroom parent/proje/SEO yapısı korunup sahneye `sceneType` ve modele özel native Media ilişkisi eklenebilir; DTO discriminated union ile panorama veya model provider'ına yönlendirilir. R3F/Drei ancak gerçek model gereksinimiyle, ayrı dinamik client bileşeninde ve kontrollü migration ile eklenmelidir; bu fazda kullanılmayan model alanı veya render motoru yoktur.

## İletişim, teklif ve site ayarları — Faz 6

### Site ayarlarını yapılandırma

`/admin` → **Site ayarları** global'ında dört sekme bulunur:

1. **Şirket ve iletişim:** şirket adı/açıklaması, isteğe bağlı footer logosu, public e-posta, telefon, WhatsApp, adres, şehir/ülke ve harita bağlantısı. Gerçek, onaylı bilgileri girin; boş bilgiler gizlenir. Varsayılan RTM wordmark'ı ve mevcut tasarım korunur.
2. **Sosyal medya:** Instagram, Facebook, LinkedIn, YouTube için HTTPS adresleri. Kimlik bilgisi içeren/geçersiz URL kabul edilmez.
3. **Site ve formlar:** varsayılan SEO başlığı/açıklaması, iletişim ve teklif formu açma/kapama, private bildirim alıcısı. SEO varsayılanları root metadata'ya uygulanır; proje/showroom/sayfa özel metadatası önceliklidir.
4. **Aydınlatma metni:** müşteri ve hukuk danışmanı tarafından onaylı gerçek KVKK aydınlatma metni veya HTTPS bağlantısı. Otomatik hukuki metin üretilmez. **Metin veya bağlantı bulunmadan formlar hem arayüzde hem sunucuda kapalıdır.** Bağlantının içeriğinin/onayının takibi içerik yöneticisinin sorumluluğudur.

Hiçbir iletişim bilgisi otomatik doldurulmaz. İsteğe bağlı alanların yokluğu sayfayı bozmaz. `site-settings` REST/GraphQL okuması ve güncellemesi yalnızca mevcut `users` yöneticilerine açıktır. Frontend `getPublicSiteSettings()` üzerinden açık bir public alan seçimiyle hafif DTO alır. Bu trusted Local API okuması kasıtlı `overrideAccess: true` kullanır; bildirim alıcısı ve sunucu sırları DTO'ya alınmaz. SMTP parolaları CMS'ye kaydedilmez. React cache yalnızca aynı istekte tekrarları birleştirir; ayar değişiklikleri sonraki sayfa isteğinde görünür.

### Form ve başvuru akışı

- `/iletisim`: gerçek ayarlar, sosyal/harita/WhatsApp bağlantıları; ad soyad, e-posta, isteğe bağlı telefon, konu ve mesaj.
- `/teklif-al`: ad soyad, e-posta, telefon, mevcut aktif proje kategorisi, serbest şehir, proje açıklaması; isteğe bağlı alan, bütçe aralığı ve iletişim tercihi. Kategori koleksiyonu çoğaltılmaz. Aktif kategori yoksa **Genel proje başvurusu** seçilebilir; sunucu kategori durumunu tekrar doğrular.
- Ana sayfa “Projenizi Konuşalım”, proje detayı “Benzer Bir Proje İçin Teklif Alın”, showroom “Bu Tasarım İçin Bilgi Alın” bağlantıları `/teklif-al` adresine gider. URL'ye kişisel bilgi veya doğrulanmamış proje metadata'sı taşınmaz.

Sayfalar ve açıklamalar Server Component; yalnızca form etkileşimi küçük Client Component'tir. Mevcut tema, reduced-motion ve navigasyon kullanılır. Açık label, gerekli alan işareti, alan hatası/özet bağlantıları, pending/disabled, odaklanan başarı/hata duyuruları ve 320 px düzeni vardır. Form yanıtı başarılı saklamadan sonra gösterilir; e-posta gönderildiği veya belirli saatte dönüş yapılacağı söylenmez. Form değerleri localStorage, analytics veya URL'ye yazılmaz. JavaScript çalışmazsa ziyaretçi yapılandırılmış doğrudan iletişim kanallarını kullanabilir.

Yeni büyük form/validasyon kütüphanesi eklenmedi. Ortak `contactValidation.ts` istemcide erken geri bildirim ve sunucuda zorunlu doğrulama için kullanılır. Sunucu sabit alan allowlist'i, tip/uzunluk, e-posta/telefon, NFC/trim normalizasyonu, kota/alan ve kategori kontrolleri yapar. Mesaj en fazla 5000 karakter; istek 24 KiB sınırını chunked body'de de aşamaz. Metin raw HTML olarak render edilmez. Route Handler; açık HTTP durumları, sınırlı JSON gövdesi ve browser cookie/token doğrulaması için seçildi.

### Başvuruları admin'de yönetme

`inquiries` → **Başvurular** listesi gönderim tarihine göre en yeniden başlar. Tür ve durum filtrelenebilir. Durumlar: Yeni → İnceleniyor → İletişime geçildi → Teklif verildi → Tamamlandı / Arşivlendi. Normal/Yüksek öncelik ve iç notlar native Payload admin'de düzenlenir. Bu durumlar otomatik müşteri e-postası göndermez. Formdan gelen yaklaşık bütçe, fiyat teklifi veya otomatik hesaplama değildir.

Koleksiyonda public read/create/update/delete kapalıdır; mevcut kimliği doğrulanmış `users` hesapları yönetici olarak kullanılır, yeni müşteri hesabı/rol sistemi yoktur. Public `/api/inquiry-submit` yalnızca **tek bir `inquiries` kaydı oluşturabilir**. Local API'nin kurulu sürümde varsayılan `overrideAccess: true` olduğu kaynak koddan doğrulanmıştır; endpoint bunu açıkça kullanır ve yalnızca doğrulanmış alanlardan sabit bir create nesnesi kurar. Status, priority, internalNotes, notificationStatus gibi client alanları reddedilir. Public yanıtta başvuru belgesi/ID/iç not bulunmaz. Protected alanları değiştiren public update veya keyfi collection parametresi yoktur.

Başvurular için otomatik silme/retention süresi eklenmedi. **Arşivleme silme değildir.** Yetkili admin native Delete ile silebilir. Müşterinin onaylı saklama/silme politikası, veritabanı yedekleri ve SMTP sağlayıcısındaki kopyalar için süreç production öncesinde belirlenmelidir. Ayrıntılı kişisel veri loglama ve başvuru versiyon geçmişi eklenmedi.

### Spam ve tekrar gönderim koruması

`GET /api/inquiry-token` aynı origin için HttpOnly/SameSite Strict anonim ziyaretçi cookie'si ve PAYLOAD_SECRET ile imzalı, ziyaretçiye bağlı, bir saat geçerli token verir. Production cookie Secure'dür. POST tam Origin eşleşmesi ve Fetch Metadata kontrolü ister; production'da gerçek HTTPS `SITE_URL` (veya doğrulanan `NEXT_PUBLIC_SERVER_URL`) zorunludur. CORS wildcard yoktur. Honeypot doluysa kayıt yapılmaz.

Tarayıcı pending sırasında tekrar göndermeyi engeller. Her form UUID idempotency anahtarı taşır; sunucu cookie'ye bağlı HMAC anahtarını ve normalize payload HMAC'ini tutar. Unique DB index eşzamanlı tekrarların tek kayıt/tek bildirim olmasını sağlar. Aynı anahtar ve aynı içerik kayıtlı sonucu döndürür; farklı içerik 409 verir. Bağlantı hatası sonrası aynı formdan tekrar deneme güvenlidir. Token süresi dolmuşsa sayfayı yenileyin. Sayfayı yenileyip yeni anahtarla aynı içeriği tekrar göndermek otomatik birleştirilmez; kota koruması geçerlidir.

`form-rate-limits` admin'de gizli, bütün public/admin CRUD erişimleri kapalı altyapı koleksiyonudur. Mevcut Payload PostgreSQL adapterinin parametreli SQL UPSERT'i atomik sayaç tutar; ikinci ORM/servis ve in-memory tek-instance sınırı yoktur:

- Ziyaretçi cookie'si başına 15 dakikada 5 deneme.
- Normalize e-posta başına 15 dakikada 3 deneme.
- Uygulama geneli dakikada 120 deneme.
- İsteğe bağlı güvenilir proxy IP'si başına 15 dakikada 10 deneme.

Sabit zaman pencereleri kullanılır; reddedilen/kategori hatalı denemeler kotayı tüketebilir. Sayaçlarda raw IP/e-posta yoktur, HMAC bucket saklanır. Süresi dolmuş sayaçlar sonraki gönderimde silinir. IP kuralı için `INQUIRY_CLIENT_IP_HEADER=cf-connecting-ip` veya `x-real-ip` yalnızca proxy bu başlığı istemciden silip kendisi yazıyorsa ayarlanmalıdır; uygulamaya doğrudan erişim engellenmelidir. Keyfi X-Forwarded-For güvenilir sayılmaz. Başlık yapılandırılıp istekten eksik/bozuk gelirse gönderim reddedilir. Proxy doğrulaması yokken cookie+e-posta+global kotalar çalışır; yüksek saldırı trafiği için hosting WAF/edge sınırları ayrıca ayarlanmalıdır. Veritabanı/kota hatasında işlem güvenli biçimde 503 verir; stack trace, secret veya kişisel veri döndürülmez.

### İsteğe bağlı SMTP

[Resmî Payload e-posta adapteri](https://payloadcms.com/docs/email/overview) olan `@payloadcms/email-nodemailer` mevcut Payload ile aynı **3.92.1** sürümünde eklendi. `.env.example` örneği:

```dotenv
# SITE_URL=https://your-approved-production-domain
# SMTP_HOST=smtp.your-provider.example
SMTP_PORT=587
# SMTP_USER=
# SMTP_PASSWORD=
# SMTP_FROM_EMAIL=
# INQUIRY_NOTIFICATION_RECIPIENT_ALLOWLIST=
# INQUIRY_CLIENT_IP_HEADER=
```

Host ve geçerli from adresi gerekir; kullanıcı/parola ya birlikte girilmeli ya da onaylı relay için ikisi de boş olmalıdır. 465 implicit TLS, diğer portlar production'da zorunlu STARTTLS kullanır; TLS doğrulaması kapatılmaz. Connection/greeting timeout 5 sn, socket timeout 7 sn'dir. Adapter startup sırasında ağ doğrulaması yapmaz ve Ethereal hesabı açmaz; gerçek gönderim yapılandırılmış transport üzerinden olur. Sırlar server environment yönetiminde tutulmalıdır.

**Site ayarları → Bildirim alıcısı** adresi ayrıca sunucudaki virgülle ayrılmış `INQUIRY_NOTIFICATION_RECIPIENT_ALLOWLIST` içinde olmalıdır. Yalnızca müşteri tarafından sahipliği/doğruluğu onaylanmış kurumsal adresleri allowlist'e ekleyin; formdaki ziyaretçi e-postası bildirim alıcısı olarak kullanılmaz. SMTP veya onaylı alıcı eksikse başvuru yine saklanır ve bildirim **kapalı** kalır. Otomatik müşteri yanıtı yoktur.

Kayıt önce veritabanına yazılır; ardından aynı istek içinde tek bildirim denenir. Düz metin bildirim başvuru türü, iletişim/proje bilgileri ve admin kayıt referansını içerir; dosya/URL okuma kapalıdır. Durumlar **disabled**, **pending**, **accepted**, **failed**. Accepted yalnızca SMTP transport kabulüdür, teslim kanıtı değildir. SMTP hatası kaydı silmez ve formun saklama başarısını değiştirmez. Sonuç yazılamazsa pending kalabilir; bu belirsizlikte otomatik yeniden gönderim yapılmaz. Background queue/otomatik retry eklenmedi. Gerçek SMTP kimlik bilgileri bulunmadığından production teslimi doğrulanmış değildir; DNS/SPF/DKIM/DMARC, doğrulanmış alıcı ve uçtan uca teslim kontrolü yayın öncesi yapılmalıdır.

### WhatsApp ve yayın hazırlığı

WhatsApp numarasını uluslararası ülke koduyla girin. Yerel 0 önekli veya geçersiz numarada bağlantı gösterilmez. Normalizasyon sonucu `https://wa.me/<digits>?text=...` oluşturulur. Bağlantı yalnızca kullanıcının tıklamasıyla açılır; otomatik mesaj/API yoktur. İletişim, teklif ve footer'da aynı küçük bileşen kullanılır.

Production öncesi: gerçek şirket/iletişim bilgileri, onaylı aydınlatma metni, form bayrakları, HTTPS origin, uzun ortak PAYLOAD_SECRET, kontrollü migration, kalıcı medya, proxy body/time sınırları, SMTP ve doğrulanmış alıcılar, yönetici hesapları ve veri saklama süreci tamamlanmalıdır. Aydınlatma metni ve hosting/SMTP sağlayıcılarına kişisel veri aktarımı müşterinin hukuk danışmanı tarafından değerlendirilmelidir; uygulama hukuki uygunluk garantisi vermez.

### Migration ve testler

`20261029_153957_phase6_contact` yalnızca inquiries/form-rate-limits/site-settings tablolarını, yeni enum/index/ilişkileri ve kilit referanslarını ekler. Mevcut proje/showroom/medya kolonlarını silmez. İzole QA veritabanında önceki migration zinciri → eski portföy/showroom/sahne/medya ilişkileri → Faz 6 sırası çalıştırılıp eski kayıtların korunduğu ve yeni kayıtların saklandığı doğrulandı. Yerel `rtm_tasarim` native push kullanır; migration zincirini burada çalıştırmayın. Dolu staging/production için mevcut baseline benimseme notları geçerlidir. `down` Faz 6 başvurularını/ayarlarını kaldırır; otomatik rollback yapılmamalıdır. Payload tipleri/import map yeniden üretilir.

```powershell
pnpm db:up
pnpm dev
# Ayrı terminalde:
pnpm typecheck
pnpm lint
pnpm test:int
$env:RTM_CMS_E2E = '1'
pnpm test:e2e --workers=1
Remove-Item Env:\RTM_CMS_E2E
pnpm build
```

`contact.int.spec.ts` doğrulama, korunmuş alanlar, URL/telefon, imza/origin/body sınırlarını; `inquiryNotifications.int.spec.ts` yapılandırmasız, SMTP kabul/hata ve sonucu yazamama davranışını mock transport ile doğrular. Bunlar gerçek SMTP teslim testi değildir. `contact.e2e.spec.ts` gerçek tarayıcı ve yerel DB ile form kaydı, eşzamanlı idempotency/kota, public erişim engeli, native admin yönetimi, ayarlar/WhatsApp/SEO, aydınlatma yokluğu, kapalı form, tema ve mobil düzeni sınar. CMS yazan test opt-in ve yalnızca loopback development DB'de çalışır. Geçici DEMO Site Settings yedeklenip geri alınır; farklı updatedAt tespit edilirse eşzamanlı kullanıcı düzenlemesi ezilmez. Başvuru/kategori/yönetici temizliği sadece oluşturulan ID'lerle sınırlıdır. Kesilen testten kalan `phase6-qa-` DEMO kayıtlarını admin'den inceleyin; gerçek veriler üzerinde toplu silme yapmayın. Production veya gerçek müşteri aydınlatma metni yerine test metni bırakmayın.

## Kurumsal içerik, hizmetler ve tasarım kataloğu — Faz 7

### Route'lar ve içerik ayrımı

- `/hakkimizda`: CMS'den giriş, hikâye, uzmanlık, ekip, çalışma yaklaşımı, şirket galerisi ve seçili tamamlanmış projeler.
- `/hizmetler`, `/hizmetler/[slug]`: aktif/yayınlanmış hizmet arşivi ve açıklama, galeri, ilgili proje/model ve teklif CTA'ları içeren detay.
- `/modeller`, `/modeller/[slug]`: kategori filtresi/sayfalama ve galeri, isteğe bağlı referans sınıfı, ilgili model/hizmet/proje içeren tasarım kataloğu.

**Projects** tamamlanmış işleri ve gerçek konumları temsil eder; küre yalnızca Projects verisini kullanmaya devam eder. **Design Models** tasarım/ürün referanslarıdır, tamamlanmış proje veya üretim kanıtı olarak sunulmaz ve küreye eklenmez. Model kategorileri bu nedenle `project-categories` yerine ayrı `model-categories` koleksiyonundadır; mevcut teklif formunun proje kategorileri korunur. İlişki kurmak bir modeli tamamlanmış proje yapmaz. Hizmet, kategori, ekip üyesi, süreç, yetkinlik veya müşteri görseli otomatik seed edilmez.

### Hakkımızda içeriğini düzenleme

`/admin` → **Hakkımızda sayfası** (`about-page`) tek global'dır. Giriş, Hikâye ve uzmanlık, Ekip, Yaklaşım ve görseller, SEO sekmelerini kullanın. Başlık/alt başlık, Lexical anlatım, gerçek görseller, uzmanlık maddeleri ve süreç adımlarını onaylı kaynaklardan girin. Ekip üyeleri ve portreler isteğe bağlıdır. Önerilen giriş başlığını yayımlamadan önce inceleyin; admin açıklamasındaki öneri metni kalıcı müşteri içeriği olarak eklenmez.

Native **Save Draft / Publish** kullanılır. Taslak kaydı public sayfayı değiştirmez; son yayın korunur. Yayından kaldırma sonraki istekte nötr boş duruma döner. Global'ın REST/GraphQL okuması/güncellemesi admin-only'dir. Public `getAboutPage()` yalnızca bu global'ın `draft: false` snapshot'ını kasıtlı `overrideAccess: true` ile açık select/DTO üzerinden alır ve `_status: published` kontrol eder. İlgili proje başlıkları/görselleri ayrı public sorguyla çözülür; admin yetkisi projelere taşınmaz. Gerçek metin/görsel yoksa hikâye/ekip blokları uydurulmaz; çizgi çalışması ve tanıtım boş durumu kullanılır.

### Hizmet ekleme ve düzenleme

1. **Hizmetler** (`services`) içinde başlık ve benzersiz küçük harf/tireli slug girin. Kısa açıklama, zengin anlatım ve görseller isteğe bağlıdır.
2. Kapak ve galeri görsellerini mevcut Media üzerinden, açıklayıcı alt metinle yükleyin. Galeri sırasını CMS'den belirleyin.
3. Gerçek ilgili projeleri ve varsa model kategorilerini seçin. Detayda yalnızca yayınlanmış projeler gösterilir. İlgili model listesi, modelin hizmet ilişkisi veya hizmetin aktif model kategorileri üzerinden en fazla üç yayınlanmış kayıt getirir.
4. `active` ve native **Publish** birlikte public görünürlüğü belirler. Pasif veya tamamen taslak hizmet detayları 404 verir. `displayOrder` küçükten büyüğe; eşitlikte oluşturulma tarihi ve ID azalan sıralanır. `featured` ana sayfada öncelik verir; en fazla dört hizmet gösterilir.

Hizmet listesi sekizli sayfalanır. Fotoğraf veya açıklama yoksa düzen bozulmadan hazırlık/bilgi durumları gösterilir. React içinde hizmet tanımı tutulmaz.

### Model kategorisi ve model ekleme

1. **Model kategorileri** (`model-categories`) içinde ad/slug girin; istenirse açıklama ve sıra belirleyin. Pasif kategori filtre ve public etiketlerden kalkar; model ilişkisini silmez ve modeli kendiliğinden yayından kaldırmaz.
2. **Tasarım modelleri** (`design-models`) içinde ad/slug, kısa/uzun açıklama, kategori ve kapak ekleyin. Kategori ve görseller zorunlu değildir.
3. Galeri satırlarına Media görsellerini ekleyip sıralayın. Kapak galeriye otomatik dahil edilir; aynı URL tekrarı tek görsele indirilir. Mevcut native dialog galeri, ok tuşları, Escape, odak geri dönüşü ve dokunma davranışı paylaşılır; yeni galeri kütüphanesi yoktur.
4. Referans sınıfını yalnızca doğrulanan bilgi varsa seçin: Konsept/tasarım örneği, Render veya Doğrulanmış üretim örneği. Üretim kanıtı yoksa üretim örneği seçmeyin; alan boş kalabilir.
5. Varsa gerçek ilgili hizmet/projeleri ilişkilendirin. Pasif/taslak hizmetler ve taslak projeler ziyaretçiden gizlenir. `featured` ana sayfada öne çıkarır; en fazla üç yayınlanmış model gösterilir. Hiç uygun model yoksa ana sayfa önizlemesi gizlenir.
6. Native **Publish** ile yayınlayın. Sonradan kaydedilen taslak, yayınlanmış başlığı veya SEO'yu değiştirmez. Tamamen taslak/bilinmeyen model URL'si 404 verir.

Model filtreleri GET formu ve paylaşılabilir URL kullanır: `/modeller?kategori=onayli-kategori&sayfa=2`. Kategori değişiminde ilk sayfaya dönülür; sıfırlama temiz `/modeller` URL'sine gider. Bilinmeyen/pasif kategori sonuç üretmez. Tekrarlanan kategori parametresi sessizce tüm modellere dönüşmez. Arşiv sekizer sonuç getirir; tüm model belgeleri tarayıcıya yüklenmez. İlgili modeller aynı aktif kategoriden en fazla üç kayıttır; kategorisiz modelde diğer yayınlar önerilir.

### Ana sayfa, SEO, erişim ve performans

Hero, küre ve mevcut proje galerisi korunmuştur. `ServicesSection` en fazla dört aktif/yayınlanmış hizmeti; `AboutPreview` yayınlanmış global başlığı, alt başlığı ve gerçek giriş görselini; `ModelPreview` en fazla üç featured/yayınlanmış modeli kullanır. Önceki sabit hizmet ve şirket tanıtımları kaldırılmıştır. İçerik yokken sahte iş gösterilmez. Menü/footer artık gerçek Modeller/Hizmetler/Hakkımızda route'larına gider; eski ana sayfa section ID'leri mevcut bağlantılar için kalır. Mevcut Site Settings iletişim/sosyal alanları kullanılmaya devam eder.

Yeni sayfa/veri bileşenleri Server Component'tir; sadece mevcut galeri etkileşimi Client Component kalır. Veri yardımcıları `catalogData.ts`, `aboutData.ts`; URL sınırları `catalogQuery.ts`; hafif DTO'lar `types/catalog.ts`; UI `components/catalog` altındadır. Sorgular sayfalı veya sınırlıdır; ilişkiler toplu çözülür, her kart için sorgu açılmaz. Kapak/card boyutları, responsive Next Image, alt metin ve mevcut Media saklama sistemi paylaşılır.

Public koleksiyon sorguları **`overrideAccess: false`, `draft: false` ve yayın filtresi** kullanır. Services ayrıca `active` ister; model kategorileri aktif olmalıdır. Native admin write erişimi kimlik doğrulaması gerektirir. Hakkımızda'nın trusted okuması dışındaki public veri erişiminde yetki yükseltilmez. Inquiries ve Site Settings güvenlik kuralları değişmez. Zengin metin mevcut güvenli JSX converter'larıyla render edilir; raw HTML eklenmez.

`seoTitle`, `seoDescription`, `seoImage` alanları varsa önceliklidir; yoksa yayınlanmış başlık/kısa açıklama/kapak kullanılır. Arşiv ve Hakkımızda metadata'sı server-render edilir. Mevcut doğrulanmış `SITE_URL` canonical kuralları paylaşılır; localhost canonical üretilmez. Filtre/sayfalama URL'leri `noindex, follow` alır. Kalıcı CMS cache'i yoktur; React `cache()` sadece aynı istekte tekrarları birleştirir. Kaydetme/yayınlama/pasifleştirme sonraki istekte görünür.

### Migration ve doğrulama

`20261029_160902_phase7_corporate_catalog` yeni üç koleksiyon, About global'ı, native sürümler/galeriler/ilişkiler ve kilit referanslarını ekler. `up` mevcut fazların verisini veya kolonlarını silmez. İzole QA veritabanında önceki migration zinciri → eski proje/şehir/medya/showroom/sahne/inquiry/site-settings verisi → Faz 7 uygulanmış; eski ilişkiler ve private notların korunduğu, yeni içeriklerin saklanabildiği doğrulanmıştır. Aynı izole DB'de Faz 7 rollback'i de önceki verileri korumuştur. `down` yeni fazın içeriğini siler; production'da otomatik rollback için kullanılmamalıdır. Yerel push DB'ye migration zincirini çalıştırmayın; mevcut staging baseline benimseme süreci geçerlidir.

```powershell
pnpm db:up
pnpm dev
# Ayrı terminalde:
pnpm typecheck
pnpm lint
pnpm test:int
$env:RTM_CMS_E2E = '1'
pnpm test:e2e --workers=1
Remove-Item Env:\RTM_CMS_E2E
pnpm build
```

`catalog.int.spec.ts` URL/filtre sınırlarını; `catalog.e2e.spec.ts` CMS düzenleme, yayın sonrası taslak gizliliği, ilişkiler, filtre/sayfalama, SEO, galeri/klavye/odak, ana sayfa entegrasyonu, eksik görsel, public erişim ve 1440/1024/768/390/320 px düzenlerini doğrular. Opt-in yerel testler yalnızca açık DEMO kayıtları/düz renk test görselleri kullanır; gerçek tasarım veya ekip fotoğrafı değildir. About public/taslak snapshot'ları yedeklenip geri alınır; testin etiketli global sürümleri ve oluşturduğu ID'ler temizlenir. Eşzamanlı About değişikliği tespit edilirse ayarlar ezilmez. Sürüm geçmişi saklama sınırına yakın veritabanında test yerine izole QA veritabanı kullanın. Kesilen testten kalan `phase7-qa-` DEMO kayıtlarını admin'den tek tek inceleyin; toplu gerçek içerik silmeyin.

Gerçek şirket hikâyesi, ekip bilgileri/fotoğrafları, hizmet listesi, model görselleri ve üretim sınıflandırma kanıtları henüz müşteri tarafından girilmelidir. Test görselleri gerçek varlıklarla görsel onay veya içerik doğrulaması yerine geçmez. Sonraki faz için onaylı gerçek içerik girişi ve production yayın hazırlığı önerilir.

## Mobilya tasarım atölyesi — Faz 8

`/tasarim-olustur`, mevcut Next.js/Payload uygulamasında çalışır; ayrı Vite uygulaması veya backend yoktur. Ana sayfa/küre tasarımı korunur. Altı ürün başlangıcı, altı düzenleme adımı, ölçü kilitleri, 60 değişikliklik geçmiş, renk/malzeme/donanım seçimi, 3B/ortografik/teknik görünümler, sürüklenebilir bölme sınırları ve mobil panel bulunur. Bölme tipi teknik sınıflandırmadır; gözlerin tanımlanmış dış ölçülerini değiştirmez. Bu araç üretim/CNC çizimi veya donanım çakışma analizi değildir.

Yerel çalıştırma:

```bash
pnpm install
pnpm db:up
pnpm dev
```

Adresi açın: `http://localhost:3000/tasarim-olustur`. Tema mevcut `rtm-theme` tercihini kullanır; site varsayılanı açık kalır. Referanstaki koyu görünüm tema düğmesiyle seçilebilir.

`src/lib/configurator/config.ts` v2 şeması hem tarayıcıda hem sunucuda Zod ile doğrulanır. Bölme toplamları, göz toplamları, dizi uzunlukları, ürün sınırları ve renk allowlist'i denetlenir. Kilitli ölçüler korunur; uygulanamayan düzenleme atomik olarak reddedilip açıklanır. URL `#c=` içinde UTF-8/base64url; yalnızca tasarımın yerel yedeği `rtm-design-v2` anahtarındadır. Başvuru kişisel bilgileri bu kayda veya URL'ye yazılmaz. Paylaşılan bağlantı tasarımın bağımsız bir kopyasıdır; ortak düzenleme değildir. Göz etiketlerine kişisel bilgi girilmemelidir.

React Three Fiber/Drei ve mevcut Three.js kullanılır. Canvas browser tarafında dinamik yüklenir; `frameloop="demand"`, instanced gövde/raf geometrileri, sınırlı DPR, mobilde 512 px gölge, tek seferlik düşük çözünürlüklü stüdyo ortam haritası ve yerel prosedürel ahşap/sıva dokuları kullanılır. Haricî HDRI/font/model indirme zorunluluğu yoktur. Kapaklar tıklama veya araç çubuğuyla açılır; reduced-motion desteklenir. Tema Canvas'ı remount etmez. WebGL hata durumunda HTML seçenekler ve SVG teknik çizim çalışır. 60 FPS cihazlar arasında garanti edilmez; gerçek hedef cihazlarda son performans kabulü ayrıca yapılmalıdır.

PDF ve QR üretim paketleri yalnızca indirmede yüklenir. A4 yatay PDF ön görünüş, yan kesit, dış/bölme/göz ölçüleri, malzeme listesi, ayrıntılı göz/donanım eki, İstanbul tarih bilgisi ve tıklanabilir paylaşım bağlantısını içerir. Çok büyük bağlantı QR kapasitesini aşarsa tıklanabilir bağlantı korunur. PNG mevcut Canvas'tan; WebGL yoksa teknik çizimden hazırlanır. Türkçe metin PDF içine yerel canvas ile çizilir.

`POST /api/teklif`, `/api/inquiry-submit` ile aynı handler'ı kullanır. Exact Origin, imzalı cookie/token, honeypot, UUID idempotency, atomik PostgreSQL rate limit, 24 KiB stream limiti ve mevcut privacy/SMTP koşulları aynen uygulanır. Tasarım sunucuda yeniden doğrulanır; paylaşım adresi sunucuda oluşturulur. Küçük PNG, Sharp ile gerçek PNG ve en fazla 128×128 px olarak doğrulanır. Tasarım, bağlantı ve önizleme private `inquiries` kaydına eklenir; public medya yüklemesi yapılmaz. İstek sınırını aşacaksa küçük PNG çıkarılır; tasarım ve form metni sınırı aşarsa gönderim açıklamayla durdurulur. `InquiryForm.endpoint` prop'u varsayılan yerel endpoint'i değiştirmek içindir; güvenlik protokolünü uygulamayan haricî endpoint'e yönlendirilmemelidir. Bildirim gönderilmesi SMTP ve CMS ayarlarına bağlıdır.

Onaylı CMS aydınlatma metni/HTTPS bağlantısı ve etkin teklif formu olmadan gönderim UI ve endpoint'te kapalıdır; tasarım/paylaşım/indirme kullanılabilir. Hukuki metin, fiyat, şirket içeriği veya müşteri projesi oluşturulmaz.

`20261031_203910_phase8_furniture_configurator` yalnızca inquiries tablosuna üç nullable kolon ekler. `up` mevcut verileri silmez; `down` bu üç kolondaki tasarım verilerini kaldırır. Migration oluşturuldu ve SQL'i incelendi; yerel push veritabanına migration zinciri uygulanmadı. Shared/production ortamda yukarıdaki baseline benimseme sürecinin ardından kontrollü release adımında uygulanmalıdır.

```bash
pnpm typecheck
pnpm lint
pnpm test:int
pnpm test:e2e tests/e2e/configurator.e2e.spec.ts --workers=1
pnpm build
```

Konfigüratör birim testleri ölçü/lock invariants, UTF-8 URL round-trip ve güvensiz veriyi; tarayıcı testleri kayıt/yenileme, undo/redo, PDF/PNG, mobil yerleşim, ürün değişimi, gerçek WebGL çizimi, boşta çizimin durması ve temada Canvas kimliğini denetler. Tarayıcı testleri CMS'ye içerik veya başvuru yazmaz; gerçek SMTP teslimi ve staging migration çalıştırması bu testlerin kapsamında değildir. Lighthouse ≥95 ve düşük güçlü gerçek cihaz kabulü ayrıca ölçülmelidir.

Performans yaklaşımı: [R3F on-demand rendering](https://r3f.docs.pmnd.rs/advanced/scaling-performance), [Drei controls](https://drei.docs.pmnd.rs/controls/introduction).

### Görsel ve deneyim revizyonu — Faz 8.1

Atölye mevcut Faz 8 mimarisinde geliştirilmiştir. Numaralı ve tıklanabilir adımlar, sabit alt gezinme, sahneyle aynı göz seçimini paylaşan daraltılabilir tasarım özeti ve kapalı/yarım/tam kademeli mobil panel bulunur. Mobil tutamak sürükleme, ok tuşları, Home/End ve Escape ile kullanılabilir. Kapatıldığında panel içeriği klavye dolaşımından çıkar; Escape odağı seçenekler düğmesine döndürür. İlk ziyaretin üç adımlık rehberi atlanabilir; yalnızca rehber tercihi `rtm-studio-guide-v1` anahtarında saklanır. Depolama engellendiğinde rehber ve tasarım seçenekleri çalışmaya devam eder.

Ölçü alanları sayı ve slider'ı birlikte sunar; ok tuşları 0,5 cm, Shift ile 10 cm değiştirir. “Önerilen” bant, mevcut ürün başlangıç ölçüsünün sınırlar içinde kalan ±%10 çevresidir; ergonomik/üretim uygunluğu garantisi değildir. Bölme ve gözlerde eşit dağıtım mevcut kilit kurallarını kullanır. Sürükleme sırasında iki komşunun ölçüsü gösterilir; eşit genişliğe ve diğer bölmelerin genişliğine 1 cm yakınlıkta hizalama uygulanır. Düzenleme bırakıldığında mevcut atomik kontrolle tek seferde kaydedilir. Özet ve teknik çizimden göz seçimi panelle eşleşir; seçimler erişilebilir durum metniyle duyurulur.

Açık/koyu arayüz ve sahne renkleri `styles.css` semantik token'larını paylaşır. Yeni stiller atölyeye kapsamlanmıştır; ortak tema tercihi ve diğer sayfaların yazı tipi değişmez. Faz 8.1'de kullanılan route'a özel Cormorant Garamond ve DM Sans, Faz 8.2'de kaldırılmıştır. Atölye artık ana sitenin yerel Plus Jakarta Sans / IBM Plex Mono fontlarını paylaşır; haricî font isteği gerekmez. İkonlar yerel SVG; swatch ve sahne dokuları prosedüreldir.

Sahne; ACES tone mapping, mat/parlak yüzeyler, akrilik/lake kaplama farkı, temas gölgesi, sade insan silueti, ölçü çizgileri, iç düzen görünümü ve duvarın arkasına geçmeyen orbit kullanır. Kamera sığdırma ve renk geçişleri demand çizimde çalışır; reduced-motion tercihinde anlık uygulanır. Tema Canvas'ı yeniden oluşturmaz. Ortam haritası tek kare/64 px, temas gölgesi tek kare; DPR sınırlıdır. Ardışık etkin karelerde düşük hız saptanırsa DPR ve gölge kalitesi düşer; boşta geçen süre bu hesaba katılmaz. Geometri, doku ve malzemelerin temizliği korunur. PDF/QR yalnızca indirmede yüklenir; SVG renkleri dışa aktarılmadan önce aktif temadan çözümlenir. Kopyalama ve indirme durum bildirimi gösterir.

v2 şema, eski `#c=` bağlantıları, `rtm-design-v2`, ölçü hesaplamaları, 60 adımlık geçmiş ve başvuru güvenliği korunmuştur. Payload şeması/migration veya yeni bağımlılık eklenmemiştir. Gönderim adımı mevcut aydınlatma ve form etkinlik koşullarına bağlıdır; kapalı form tasarlama ve indirmeyi engellemez. “Bu araç üretim/CNC çizimi değildir” açıklaması görünürdür.

Doğrulama komutları yukarıdaki Faz 8 komutlarıdır. Konfigüratör tarayıcı paketi; önceki güvenlik, kayıt, undo/redo, PDF/PNG ve boşta çizim kontrollerine ek olarak adım gezinmesi, gerçek Canvas seçimi, özet/teknik çizim/panel eşleşmesi, mobil panel sürükleme/klavye/odak, rehber, reduced-motion ve her iki temada 1440/1024/768/390/320 px ekran görüntülerini kapsar. Tarayıcı testleri CMS'ye içerik veya başvuru yazmaz. Gerçek cihazda LCP <2,5 s, INP <200 ms, CLS <0,05 ve Lighthouse Accessibility ≥95 ayrı kabul hedefleridir; otomatik işlev testlerinin geçmesi bu performans hedeflerini kanıtlamaz. Gerçek SMTP teslimi, fiziksel dokunmatik cihaz davranışı ve üretim donanımı uygunluğu bu doğrulamanın dışındadır.

Yerel doğrulamada `pnpm typecheck`, `pnpm lint`, 66 int testi, 18 konfigüratör E2E testi ve `pnpm build` geçti. Son reduced-motion düzenlemesinden sonra kamera/Canvas/boşta çizim testleri ayrıca tekrar geçti. Paylaşım bağlantısını bozmadan seçeneklere odaklanan skip bağlantısı, sürüklemenin tek undo işlemi oluşturması ve tam ekranda alt/adım gezinmesinin kullanılabilir kalması da kontrol edildi. Şema, migration, seed veya başvuru kaydı oluşturulmadı.

Üretim derlemesinde Lighthouse 13.6.0 ile, rehber tercihi saklanıp HTTP önbelleği temizlenerek alınan mobil açık tema ölçümü:

| Ölçüm | Yerel sonuç |
| --- | --- |
| Accessibility | 100/100; başarısız otomatik erişilebilirlik kontrolü yok |
| Performance | 73/100 |
| LCP | 0,6 s |
| CLS | 0 |
| TBT | 1.780 ms |

Masaüstü koyu temada Accessibility 100/100 ve başarısız otomatik kontrol sayısı sıfırdır. HTML/JSON raporları `test-results/phase8.1-lighthouse-{mobile,dark}.report.*` altında üretilir (Git'e eklenmez). LCP ve CLS bu yerel koşuda hedef içindedir; açılışta WebGL/JavaScript yükü hâlâ yüksek olduğundan performans hedeflerinin tamamı sağlandı denemez. TBT, INP değildir; gerçek kullanıcı INP'si ve düşük güçlü fiziksel cihaz kabulü ayrıca ölçülmelidir. Ölçüm production altyapısı veya 60 FPS garantisi oluşturmaz. Gerçek SMTP teslimi test edilmedi. Doğrulama ortamındaki Node 24.20.0, projenin `>=24.22.1` koşulunun altında kaldığı için pnpm engine uyarısı verir; desteklenen Node sürümünde release doğrulaması tekrarlanmalıdır.

### Ortak header görünürlüğü

Public header `PublicDesign` ortak frontend kabuğunda tek kez oluşturulur; route içerikleri ve loading/error sınırlarının dışında kalır. Sayfalar arası geçişte aynı DOM korunur. Hero kaydırma aşaması, hareket tercihi, tema ve mobil menü header'ı gizlemez; hero header yüksekliğinin altından başlar. Atölye ve showroom tam ekran düğmeleri header'ı da içeren belge kökünü açar. Showroom bu durumda header'ın altında ekranı doldurur; arkada kalan içerik gizlenerek klavye dolaşımından çıkarılır. Native Payload admin değiştirilmez.

### Mekân, ölçek ve temsili eşyalar — Faz 8.2

`/tasarim-olustur` ana sitenin semantik renklerini, Plus Jakarta Sans / IBM Plex Mono yazı tiplerini ve köşeli lime CTA'larını kullanır. Atölyeye özel `StudioSans.woff2`, `StudioSerif.woff2`, `StudioSerifItalic.woff2`, font README ve OFL dosyaları kaldırıldı. Public sayfaların ve Payload admin'in tema kuralları korunur.

- Tek ortak prosedürel insan profili tam **180 cm** yüksekliğindedir (yaklaşık 7,5 baş). Boy ayarı yoktur. Figür ve tikli ölçü çizgisi birlikte açılır; WebGL'de kamera karşısında kalan etiket, Önden ve SVG teknik çizimde aynı ölçüyü gösterir. Kamera, insan ve TV dahil görünür yüksekliğe sığar.
- **Mekân** düğmesi seçenekler panelinin başında duvar/zemin renk seçicilerini, doğrulanan `#RRGGBB` girişlerini, isimli swatch'ları, dokulu/düz zemin ve varsayılanlara dönüşü açar. Geçersiz hex son geçerli rengi değiştirmez. Renkler açık/koyu temadan bağımsızdır; hiç seçilmemiş renk aktif temanın sahne token'ından gelir. Figür/ölçü çizgisi ve gerektiğinde dolap dış konturu arka plan parlaklığına göre açık/koyu mürekkeple çizilir; etiket kartları opak semantik yüzey kullanır.
- `rtm-studio-scene-v1` yalnızca `{ wall, floor, textured, props }` görüntü tercihlerini saklar. Renkler null olduğunda tema varsayılanları kullanılır. Bozuk/eksik kayıt ve engellenen storage güvenli varsayılanlara döner. React Strict Mode'un effect tekrarı kayıt okunmadan varsayılan yazamaz. Picker güncellemeleri RAF ile birleştirilir; kayıt blur/pointer bırakma, son değişimden 350 ms sonra veya sayfadan çıkışta yapılır.
- Oda yüzeyleri sRGB renk ve nötr prosedürel dokuyu tone mapping dışında kullanır; dolabın mevcut ACES aydınlatması korunur. Düz zemin dokusuzdur. Tercihler Canvas kimliğini değiştirmez ve `frameloop="demand"` korunur. PNG mevcut Canvas'ın renklerini/eşyalarını alır; teknik SVG/PDF oda rengini ve eşyaları almaz.

Ürün eşlemeleri `src/lib/configurator/props/catalog.ts`, metre cinsinden deterministik yerleşim `props/layout.ts`, düşük poligonlu tekrar kullanılabilir geometri tarifleri `props/geometry.ts` içindedir:

| Ürün | Temsili eşya seti |
| --- | --- |
| Mutfak | Tabak/kase, bardak/kupa, kavanoz/baharat/şişe, tencere/tava, tahta/tepsi, çekmece çatal-bıçak |
| Gardırop | Askılı gömlek/uzun palto, katlı kıyafet/pantolon, ayakkabı/bot, kutu/bavul, çorap ruloları |
| Portmanto | Askılı mont/çanta, şapka/atkı, ayakkabı/bot, anahtar kabı ve sepet |
| Banyo | Katlı/rulo havlu, losyon/pompa/diş fırçası bardağı, sepet/kâğıt rulo, çekmece düzenleyici |
| TV | Üst yüzeyde TV/soundbar, kitap/vazo/heykel/bitki, konsol/medya kutusu, kumanda |
| Özel ölçü | Etiketli kutu, kitap/klasör, katlı örtü/sepet; boruda nötr askılı siluet |

Her set gözün raf/boru/çekmece türünü okur. Mevcut raf aralıklarıyla aynı hesap kullanılır; eşyalar gerçek boyutlarında sığmadığında atlanır veya o ürüne ait daha alçak alternatif kullanılır. Borudaki askılar 44 cm derinlik yönünde, boru boyunca aralıklı dizilir. Kapalı kapakların içeriği gizlenir; tek kapak açma ve İç düzen seçimi içeriği açar. Çekmece içeriği açık çekmeceye taşınır. Geometri/materyaller form ve tona göre InstancedMesh gruplarında paylaşılır ve kullanılmadığında temizlenir. Eşyalar ilk Canvas çiziminden sonra ve görünür olduklarında tembel yüklenir; yalnızca seçili ürünün tarifleri üretilir. Mobil/düşük performans modunda raf başına bir eşya ve toplam 48; normal modda toplam 160 eşya sınırı vardır. Eşyalarda animasyon veya haricî model/doku yoktur.

v2 şema, `#c=`, `rtm-design-v2`, undo/redo, ölçü/kilit hesapları ve private başvuru protokolü görüntü tercihlerinden bağımsızdır. Payload şeması, migration, seed ve proje içeriği eklenmedi; yeni proje bağımlılığı yoktur. Lighthouse yalnızca geçici `pnpm dlx` aracıyla çalıştırılır.

Doğrulama: `pnpm typecheck`, `pnpm lint`, **79 int testi**, konfigüratörün **21 E2E testi** ve `pnpm build`. Yeni testler hex/storage/Strict Mode, otomatik kontrast, gerçek mesh sınırları, ürün ayrımı/deterministik yerleşim, sabit insan ölçüsü, kalıcılık, Canvas kimliği ve undo/URL ayrımını kapsar. `test-results/phase8.2/product-{mutfak,gardirop,portmanto,banyo,tv,ozel}.png` altı ürünün İç düzen ekran görüntüleridir; iki tema × iki uç duvar rengi × beş genişlik (1440/1024/768/390/320) aynı klasöre yazılır. Bunlar Git'e eklenmez.

Production derlemesinde Lighthouse **13.6.0**, mobil emülasyon/4× CPU yavaşlatma, rehber tercihi saklı ve HTTP cache temiz koşuda alınan yerel ölçümler:

| Durum | Performance | Accessibility | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- |
| Açık tema / eşyalar açık | 71 | 100 | 0,72 sn | 0 | 3.129 ms |
| Açık tema / eşyalar kapalı | 70 | 100 | 0,72 sn | 0 | 3.054 ms |
| Koyu tema / eşyalar açık | 70 | 100 | 0,70 sn | 0 | 4.377 ms |

İki temada da başarısız otomatik erişilebilirlik kontrolü kalmadı. Araç çubuğunun seçili düğme kontrastı ve ortak wordmark'ın görünür metni kapsayan erişilebilir adı düzeltildi; header'ın görünümü değişmedi. Tam HTML/JSON raporları `.tools/phase8.2-qa/phase8.2-lighthouse-mobile{,-props-off,-dark}.report.*` altındadır (Git'e eklenmez). Aynı derlemedeki açık/kapalı karşılaştırma tek koşudur; TBT farkı 75 ms'dir ve tekrar varyansı nedeniyle tek başına nedensellik kanıtı değildir. Faz 8.1 raporundaki 73/1.780 ms ile karşılaştırıldığında güncel açılış yükü daha yüksektir; arada public header/font/arayüz revizyonları da bulunduğundan farkın tamamı eşyalara atfedilemez. Eşya geometrisi ilk WebGL çiziminden sonra, yalnızca görünür seçili ürün için tembel yüklenir; buna rağmen performans hedeflerinin tamamı sağlandı denemez.

Fiziksel cihaz/GPU, gerçek kullanıcı INP'si, ekran/picker renk kalibrasyonu, SMTP teslimi ve üretim uygulanabilirliği otomatik QA ile doğrulanmış sayılmaz. Node 24.20.0 mevcut engine koşulunun altında olduğundan desteklenen sürümde release doğrulaması gerekir.

## Asistan — Faz 9

### Mimari ve "harici servis yok" ilkesi

Site geneli asistan **hiçbir haricî yapay zekâ servisi, LLM SDK'sı, API anahtarı veya üçüncü taraf sohbet servisi kullanmaz**. Ziyaretçi mesajı yalnızca uygulamanın kendi sunucusunda, bellekte işlenir ve site dışına gönderilmez. Yeni paket veya ortam değişkeni eklenmedi.

| Katman | Dosya | Görev |
| --- | --- | --- |
| Normalizasyon | `src/lib/assistant/normalize.ts` | `tr-TR` küçük harf (İ/i, I/ı), noktalama/emoji temizliği, ASCII katlama (ç→c…), kesme işaretli eklerin atılması, sözlük destekli hafif kök bulma (k/ğ, p/b, t/d yumuşaması), Levenshtein (≤3 harf tam, 4–7 harf 1, 8+ harf 2 hata) |
| Sözlük | `src/lib/assistant/vocabulary.ts` | Temel eş anlamlı grupları + admin'in ek grupları, çok kelimeli ifadeler ("kaç para", "iç düzen"), kavram çıkarımı |
| Niyetler | `src/lib/assistant/intents.ts` | Anahtar kelime ağırlıkları, ifadeler ve TR/EN örnek cümleler; site dışı/danışmanlık/uygunsuz kelime listeleri |
| Motor | `src/lib/assistant/engine.ts` | `ResponseEngine` arayüzünü uygulayan `DeterministicEngine`: varlık çıkarımı, niyet puanı (anahtar kelime + ifade + örnek benzerliği), güven eşikleri, bağlam/sayfa bağlamı, rehberli akışlar ve yapılandırılmış yanıt |
| Bilgi | `src/lib/assistant/knowledge.ts` | Yayınlanmış içerikten hafif arama bilgisi (server-only) |
| Atölye bilgisi | `src/lib/assistant/studio.ts` | `/tasarim-olustur` aracının kendi özellik açıklamaları (şirket içeriği değildir) |
| Güvenlik | `links.ts`, `privacy.ts`, `schema.ts` | Bağlantı allowlist'i, kişisel veri tespiti/maskeleme, Zod istek şemaları |
| UI | `src/components/assistant/*` | Hafif başlatıcı + ilk etkileşimde `next/dynamic` ile yüklenen panel |

Güven eşikleri: yüksek güvende doğrudan cevap; orta güvende "Bunu mu demek istediniz?" ile 2–3 seçenek; düşük güvende CMS'teki geri dönüş mesajı, popüler konular, site içi arama sonuçları ve iletişim seçenekleri. Kısa bağlam (son niyet + varlıklar) sekmedeki `sessionStorage` sohbetiyle birlikte tutulur, her istekte şemayla sınırlı biçimde gönderilir ve sunucuda doğrulanır ("Berlin'de projeniz var mı?" → "Peki İstanbul?"). Sayfa bağlamı yalnızca yol (`/projeler/[slug]` vb.) olarak gönderilir; tasarım verisi veya kişisel veri gönderilmez. Türkçe ana dildir; temel İngilizce niyetler İngilizce şablonla yanıtlanır, desteklenmeyen dilde iki dilli kısa yönlendirme verilir.

İleride bir dil modeli eklenmek istenirse `ResponseEngine` arayüzünün arkasına yeni bir uygulama yazılabilir; bu fazda böyle bir kod, bağımlılık veya ortam değişkeni yoktur.

### Uydurma yok

Her cevap ya admin'in onayladığı **Asistan cevapları/SSS** içeriğinden ya da yayınlanmış proje, hizmet, model, showroom, Site Ayarları ve Hakkımızda verisinden kurulur. Fiyat, indirim, teslim süresi, stok, garanti, üretim uygunluğu, çalışma saati ve randevu soruları söz verilmeden teklif/iletişim kanallarına yönlendirilir; bu konularda yalnızca admin'in ilgili **Konu** ile girdiği onaylı cevap aynen verilir. Boş Site Ayarları alanları gösterilmez; hiçbir bilgi yoksa bu dürüstçe söylenir. Tasarım modelleri tamamlanmış proje gibi sunulmaz. Hukuki/finansal/tıbbi danışmanlık verilmez. Form gönderme, kayıt oluşturma veya tasarım değiştirme yetkisi yoktur.

### Bilgi indeksi ve cache

`getAssistantKnowledge()` koleksiyonlarda **`overrideAccess: false`, `draft: false` ve `_status = published`** (hizmet, SSS ve cevaplarda ayrıca `active`) kullanır. Site Ayarları, Hakkımızda ve Asistan ayarları mevcut trusted DTO yollarından açık `select` ile okunur; bildirim alıcısı, SMTP veya kayıt anahtarları indekse girmez. Koleksiyon başına sınır: 300 proje/model, 100 hizmet/showroom, 300 SSS/cevap.

İndeks süreç belleğinde **60 sn TTL** ile tutulur ve eşzamanlı istekleri birleştirir. Bu, projenin "kalıcı CMS cache yok" ilkesine bir istisnadır ve bilinçli olarak kısa tutulmuştur: yayınlama/yayından kaldırma asistana **en geç 60 sn** içinde yansır; sayfalar etkilenmez. Alternatif olarak normalize edilmiş arama kolonları ve PostgreSQL `pg_trgm`/tam metin sorgusu değerlendirildi; Türkçe kök bulma ve eş anlamlıların uygulama katmanında zaten gerektiği, içerik hacminin küçük olduğu ve ek migration/eklenti gerektireceği için bellek içi indeks seçildi. Çok instance'lı dağıtımda her instance kendi indeksini tutar.

### CMS yönetimi ve iyileştirme döngüsü

- **Asistan → Asistan ayarları** (`assistant-settings`, admin-only): aç/kapat (varsayılan kapalı), görünen ad, kısa tanıtım, karşılama mesajı, en fazla 6 hızlı soru, anlaşılamadı mesajı, ek eş anlamlılar (her satıra virgülle ayrılmış kelimeler), yanıtlanamayan soruları kaydetme (varsayılan kapalı) ve saklama süresi.
- **Asistan cevapları** (`assistant-answers`, native draft/publish): başlık, konu, tetikleyiciler, örnek sorular, Lexical cevap, en fazla 4 aksiyon düğmesi (yalnızca izinli site içi route, Site Ayarları bağlantısı veya çerez tercihleri paneli), öncelik, aktiflik. Aynı konudaki yerleşik davranıştan önceliklidir; kişisel veri ve bağlantı kuralları yine geçerlidir.
- **Sık sorulan sorular** (`faqs`, native draft/publish): asistan arar; yayınlananlar `/sss` sayfasında gösterilir.
- **Yanıtlanamayan sorular** (`assistant-unanswered`, private): yalnızca admin anahtarı açık **ve** ziyaretçi Analitik iznini vermişse (sunucu cookie'den doğrular) düşük güvenli sorular e-posta/telefon/uzun sayılar maskelenerek, ziyaretçi kimliği ve IP olmadan, normalize biçime göre sayaçla birleştirilir. Süresi dolanlar sonraki yazımda silinir.
- **Asistan geri bildirimleri** (`assistant-feedback`, private): 👍/👎 yalnızca Analitik izniyle, cevap konusu bazında anonim toplam sayaçtır.

Döngü: yanıtlanamayan soruları ve 👎 alan konuları inceleyin → Asistan cevabı veya SSS yazın / eş anlamlı ekleyin → yayınlayın (≤60 sn içinde etkin). Hiçbir cevap, SSS, karşılama metni veya şirket bilgisi otomatik seed edilmez.

### Güvenlik ve sınırlar

`POST /api/assistant` mevcut Faz 6 altyapısını kullanır: exact Origin + Fetch Metadata (`sameOrigin`), `/api/inquiry-token` ile alınan, HttpOnly ziyaretçi cookie'sine bağlı imzalı token, CORS wildcard yok, 8 KiB stream gövde sınırı, Zod ile `.strict()` şema (mesaj ≤500 karakter, bağlam/akış alanları regex/enum). `form-rate-limits` atomik sayaçlarında ayrı bucket'lar:

| Bucket | Sınır |
| --- | --- |
| Ziyaretçi | dakikada 15, saatte 120 mesaj |
| Uygulama geneli | dakikada 300 mesaj |
| Güvenilir proxy IP'si (`INQUIRY_CLIENT_IP_HEADER`) | dakikada 30 |
| Geri bildirim | genel dakikada 300, ziyaretçi saatte 30 |

Cevaplar yalnızca yapılandırılmış JSON'dur (metin blokları, Lexical bloklar, kartlar, chip'ler, aksiyonlar); raw HTML yoktur, Lexical mevcut güvenli JSX converter'larıyla (`src/components/portfolio/richTextConverters.tsx`) render edilir. Kart/aksiyon bağlantıları sunucuda ve istemcide route allowlist'ine (`links.ts`) göre doğrulanır; haricî bağlantı yalnızca Site Ayarları'ndaki doğrulanmış WhatsApp/e-posta/telefon/harita/sosyal adreslerdir. Loglara mesaj, ziyaretçi kimliği veya veritabanı ayrıntısı yazılmaz. Asistan kapalıysa layout widget kodunu hiç göndermez ve endpoint `503 { enabled: false }` döner. Kişisel veri kalıbı algılanırsa mesaj saklanmaz ve ziyaretçi teklif formuna yönlendirilir.

### Arayüz

**Başlatıcı (sağ alt, kenarlardan 24 px; ≤768 px'te 16 px).** Masaüstünde ~64 px yüksekliğinde köşeli kart düğme: solda lime zeminli 44 px ikon kutusu, sağda görünen ad ve önünde lime "çevrimiçi" noktası olan alt satır. Görünen ad Asistan ayarlarındaki **Görünen ad** alanından gelir (boşsa "RTM Tasarım Yardımcısı"); alt satır **Başlatıcı alt satırı** alanından gelir (eski "Kısa tanıtım" alanı, şema değişmedi; boşsa "Sorularınızı yanıtlayalım"). İkon markaya özel yerel SVG'dir (`AssistantIcon`): köşeli konuşma balonu içinde dolap cephesi motifi. Panel avatarında da aynı ikon kullanılır. Hover'da kart 2 px kalkar, gölge opaklıkla artar, balon "nefes" alır; focus-visible lime halka gösterir. Sekmedeki ilk yüklemede ~2 sn sonra aşağıdan belirir ve çevrimiçi noktasından tek bir halka yayılır. Aşağı kaydırınca masaüstünde 56 px ikon kutusuna daralır, yukarı kaydırma/hover/odakta genişler. Tüm hareketler yalnızca transform/opacity'dir. ≤768 px'te 56 px kare lime düğme ve köşe noktası; ilk ziyarette ~6 sn "Merhaba! Ben … size yardımcı olabilirim." etiketi görünür (dokununca/kapatınca gider). Tanıtım bayrağı `sessionStorage['rtm-assistant-intro-v1']` içinde tutulur (zorunlu, sekme içi). Reduced-motion'da gecikme ve animasyon yoktur. Erişilebilir ad "… ile sohbet başlat", açıkken "Sohbeti kapat"; `aria-expanded`/`aria-controls` güncellenir.

**Panel.** Masaüstünde başlatıcının yerinde, sağ alt köşede açılan kompakt kutudur (360 px genişlik, içeriğe göre boyutlanır, en fazla 520 px; başlatıcı açıkken arkasında gizlenir). Sağ alttan büyüyerek açılır (280 ms; reduced-motion'da anında). Bundle hover/focus'ta önceden, ilk tıklamada `next/dynamic` ile yüklenir. Açılır açılmaz karşılama mesajı (CMS **Karşılama mesajı**, boşsa koddaki varsayılan) ve ≤6 hızlı başlangıç chip'i görünür; "yazıyor" göstergesi ≤350 ms'dir. Chip'ler CMS hızlı sorularından veya varsayılanlardan, izin varsa ilgi bazlı chip'lerden gelir. Bulunulan sayfaya göre bağlamsal bir chip eklenir: proje detayı "Bu projeye benzer işler", model detayı "Bu modeli nasıl sipariş ederim?", hizmet detayı "Bu hizmet hakkında bilgi", atölye "Atölye nasıl kullanılır?". Sohbet **yalnızca chip'lerle** ilerler, serbest metin girişi yoktur (b0089b2 kararı korundu). Başlıkta avatar, ad, "● Çevrimiçi · Otomatik asistan", ikon düğmeli "Sohbeti temizle"/kapat ve "RTM / YARDIMCI" etiketi bulunur. Asistan balonları solda avatarla gösterilir (ardışık mesajda avatar tekrarlanmaz), kullanıcı balonları sağda koyu karşıt token'la. Saat yalnızca hover/odakta görünür. İçerik kartlarında görsel, monospace tür etiketi, başlık, kısa açıklama ve "İncele →" vardır; yatay şerit halindedir. Aksiyonlar ikonludur, "Teklif al" lime renktedir. Hata/limit durumları ikonlu bilgi kartıdır; hatada "Tekrar dene" vardır. ≤768 px'te modal tam yükseklik sheet'tir (odak tuzağı, üst tutamaktan aşağı sürükleyerek kapatma, odak klavye açmamak için başlığa gider). Masaüstünde modal olmayan dialog'dur ve odak ilk chip'e gider. Escape kapatır ve odak başlatıcıya döner; cevap beklenirken odak sayfaya düşse de Escape çalışır. Yeni cevap `aria-live="polite"` ile bir kez duyurulur. Sekmede önceki sohbet varsa karşılama tekrar oynatılmaz, kalınan yerden devam edilir; "Sohbeti temizle" yeni karşılama başlatır.

**Sabit öğe yığını.** Konumlar `assistant-consent.css` başındaki ortak değişkenlerle yönetilir: `--rtm-fixed-base` (atölye alt gezinmesinin yüksekliği, Configurator yayınlar), `--float-gutter`, `--float-gap`, `--consent-lift` (≤640 px'te çerez kartı açıkken başlatıcıyı kartın üstüne taşır) ve yalnızca development'ta Next.js "N" göstergesi için `--dev-offset` (`html[data-dev-indicator]`; production düzeni değişmez). Atölyede başlatıcı alt gezinmenin üstündedir; mobil seçenek paneli yarım/tam açıkken (`html[data-studio-sheet]`) ve mobil çerez tercih sheet'i açıkken gizlenir. Eski "Azaltılmış hareket" düğmesi `fe06428` ana sayfa revizyonunda kaldırıldığından yığında yer almaz. `/admin` içinde render edilmez. Sohbet yalnızca `sessionStorage['rtm-assistant-v1']` içinde tutulur. Stiller yalnızca semantik token'larla yazıldı; yeni hex eklenmedi (başlatıcı yüzeyi `--foreground`/`--background` ters çevrilerek türetilir).

## Çerez onayı ve kişiselleştirme — Faz 10

> Metinler, kategori sınıflandırması ve saklama süreleri **müşterinin hukuk danışmanı tarafından onaylanmalıdır**. Uygulama KVKK veya başka bir mevzuata uygunluk garantisi vermez.

### Depolama envanteri

Tek kaynak `src/lib/consent/registry.ts`'dir; tercih paneli ve `/cerez-politikasi` tablosu buradan üretilir. Üçüncü taraf takip, reklam veya analitik betiği yoktur.

| Ad | Tür | Kategori | Amaç | Süre |
| --- | --- | --- | --- | --- |
| `rtm-consent` | Cookie (SameSite=Lax, prod'da Secure) | Zorunlu | Politika sürümü, kategori seçimleri, tarih, rastgele anonim izin kimliği | 12 ay |
| `rtm-inquiry-visitor` | HttpOnly cookie | Zorunlu | Form/asistan kötüye kullanım koruması | 30 gün |
| `payload-token` | HttpOnly cookie | Zorunlu | Yalnızca admin oturumu | Payload oturumu |
| `rtm-assistant-v1` | sessionStorage | Zorunlu (**hukuki onaya tabi**) | Ziyaretçinin başlattığı sohbet, sekme içinde | Sekme kapanana kadar |
| `rtm-assistant-intro-v1` | sessionStorage | Zorunlu (**hukuki onaya tabi**) | Başlatıcı tanıtımı ve mobil karşılama etiketi bu sekmede gösterildi (`1`); içerik yok | Sekme kapanana kadar |
| `rtm-theme` | localStorage | İşlevsel | Tema tercihi | Siz silene kadar |
| `rtm-design-v2` | localStorage | İşlevsel | Atölye tasarımının yerel yedeği | Siz silene kadar |
| `rtm-studio-guide-v1` | localStorage | İşlevsel | Atölye rehberi görüldü | Siz silene kadar |
| `rtm-studio-scene-v1` | localStorage | İşlevsel | Atölye duvar/zemin/eşya görünümü | Siz silene kadar |
| `rtm-interest-v1` | localStorage | Kişiselleştirme | Görüntülenen yayınlanmış içerik slug/etiketleri (≤50 olay, ≤30 gün) | 30 gün |

Analitik kategorisi tarayıcıda kalıcı kayıt oluşturmaz; yalnızca sunucudaki anonim yanıtlanamayan soru listesi ve 👍/👎 sayaçlarını açar. Pazarlama kategorisi kullanılmadığı için gösterilmez; registry'de `inUse: true` yapılarak ileride eklenebilir. İşlevsel kayıtların "açık talep edilen hizmet" kapsamında muaf sayılıp sayılamayacağı hukuk danışmanına bırakıldı; varsayılan olarak ihtiyatlı biçimde izne bağlıdır.

### İzin akışı ve geri alma

- **Site ayarları → Çerez politikası** sekmesi: Lexical politika metni veya HTTPS bağlantısı, politika sürümü, son güncelleme tarihi, banner başlık/açıklaması, izin kaydı saklama süresi. Metin/bağlantı **ve** sürüm yoksa isteğe bağlı kategoriler hem tarayıcıda hem sunucuda kapalıdır, banner yalnızca zorunlu çerezleri bildirir ("Anladım"), admin'de uyarı görünür. Hukuki metin otomatik üretilmez.
- Layout `rtm-consent` cookie'sini sunucuda okur; banner ihtiyacı ilk render'da bilinir (yanıp sönme/hydration farkı yok). Sürüm değişirse izin yeniden sorulur. İnline tema betiği yalnızca geçerli sürüm için İşlevsel izin varsa `rtm-theme` okur; katı CSP eklenirse bu betik politika sürümüne göre değiştiğinden hash/nonce buna göre üretilmelidir.
- **Çerez kartı (sol alt).** İlk ziyarette veya politika sürümü değişince ekranın sol altında, kenarlardan 24 px boşlukla ~412 px'lik bir kart açılır (`ConsentCard`). Sayfayı kilitlemez ve karartmaz; `role="dialog"`, `aria-modal="false"`, `aria-labelledby`/`aria-describedby` kullanır. Odak başlığa gider ama tuzak yoktur. Aşağıdan 14 px kayarak 280 ms'de belirir; reduced-motion'da animasyon yoktur. Sabit konumlu olduğu için layout shift üretmez. Kartta "RTM / ÇEREZLER" etiketi, kalkan ikonu, başlık, iki cümlelik açıklama ve "Çerez politikası"/"Aydınlatma metni" bağlantıları bulunur (aydınlatma bağlantısı yalnızca CMS'te varsa gösterilir). "Tümünü kabul et" (lime) ile "Tümünü reddet" (koyu) eşit boyut ve ağırlıktadır; altında tam genişlikte "Tercihleri yönet →" vardır. **Kapatma (×) düğmesi yoktur**: kart yalnızca bir seçimle kapanır, gezinmek/kaydırmak izin sayılmaz. ≤640 px'te kenarlardan 12 px boşluklu tam genişlik karttır, yüksekliği en fazla %70'tir ve düğmeler alt altadır.
- "Tercihleri yönet" aynı kartı yerinde genişletir (sol altta kalır, en fazla ~560 px, içerik kartta kayar). Görünüm `next/dynamic` ile ilk kullanımda yüklenir; hover/focus'ta önceden yüklenir. "← Geri" ile özete dönülür; karar verilmişken Geri/Escape kartı kapatır ve odak açan öğeye döner. Her kategoride başlık, açıklama, `role="switch"` anahtar (lime aktif durum, odak halkası) ve "Ayrıntılar" (registry'den ad/amaç/süre/tür tablosu) bulunur. Zorunlu kategori kilitli ve "Her zaman açık" etiketlidir; kullanılmayan kategoriler gösterilmez. Kişiselleştirmede "Kaydedilen ilgi alanlarım" listesi ve "Geçmişimi temizle" vardır. Altta sabit eylem satırında "Seçimlerimi kaydet", "Tümünü kabul et" ve "Tümünü reddet" yer alır. ≤640 px'te tercih görünümü modal tam yükseklik sheet olur (`aria-modal="true"`, odak tuzağı, arka plan `inert`). Kaydedince kart aşağı kayarak kapanır ve sol altta 3 sn "Tercihleriniz kaydedildi" bildirimi (`aria-live="polite"`) görünür. Kutular önceden işaretli değildir.
- **Tekrar erişim.** Karar sonrası sol altta 36 px çizgi ikonlu "Çerez tercihleri" düğmesi (tooltip) görünür ve kartı doğrudan tercih görünümünde açar. Yalnızca masaüstünde (>768 px) gösterilir, atölyede gizlenir. Footer bağlantısı, politika sayfası ve asistan aksiyonu aynı kartı `openConsentPreferences()` ile açar.
- İstemci API: `useConsent()`, `hasConsent(category)`, `onConsentChange()`, `openConsentPreferences()`, `<ConsentGate category>`; depolama yalnızca `safeStorage.get/set/remove` (`src/lib/consent/storage.ts`) üzerinden yapılır. ESLint `no-restricted-globals/properties` kuralı bu dosya dışında `localStorage`, `sessionStorage` ve `document.cookie` kullanımını yasaklar.
- Geri alma (izin vermek kadar kolay: footer "Çerez tercihleri", asistan aksiyonu, politika sayfası "Tercihleri değiştir") ilgili kategorinin registry'deki bütün anahtarlarını **anında** siler; tema/atölye sekme içi moda geçer, kişiselleştirilmiş bölümler sayfa yenilemeden kaybolur. Sekmeler `BroadcastChannel` ve focus/visibility yeniden okumasıyla eşitlenir. Paylaşım bağlantısı (`#c=`) ve PDF/PNG indirme izinden bağımsızdır.
- İzin kanıtı: `POST /api/consent` → private `consent-records` (anonim izin kimliği, politika sürümü, seçimler, kaynak `banner/preferences/revoke`, tarih; IP/kişisel veri yok; public CRUD kapalı, admin okuma). Exact Origin, 2 KiB gövde, Zod ve rate limit (genel dakikada 300, izin kimliği saatte 20, güvenilir IP saatte 30). Saklama süresi CMS'ten gelir, süresi dolanlar sonraki kayıtta silinir. Kayıt başarısız olsa da ziyaretçinin seçimi tarayıcıda geçerlidir.

### İlgi bazlı kişiselleştirme

Yalnızca Kişiselleştirme izniyle çalışır; izin yoksa hiçbir ilgi verisi toplanmaz. Sinyaller: proje/hizmet/model/showroom detay görüntüleme, portföy/model filtreleri, harita şehir seçimi, atölyede seçilen ürün tipi (ölçü/içerik değil), asistanda tıklanan konu chip'leri (mesaj metni değil). Veri **yalnızca tarayıcıda** `rtm-interest-v1` içindedir: en fazla 50 olay, 30 günden eski olaylar silinir, 30 dakika içindeki tekrar ziyaret puanı şişirmez, 10 sn altı ziyaret düşük ağırlık alır, 7 günlük yarı ömürle azalır. Sunucuda profil tutulmaz.

`POST /api/recommendations` yalnızca en yüksek puanlı en fazla 10 slug ve birkaç kategori/şehir slug'ını alır (Zod), yalnızca yayınlanmış/aktif içerikten hafif kart DTO'su döndürür, istekleri loglamaz/saklamaz; Origin, Kişiselleştirme cookie'si ve rate limit (genel dakikada 600, güvenilir IP dakikada 60) uygular. Kullanım: ana sayfada seçili projelerden sonra "Sizin için seçtiklerimiz" (en fazla 4 kart; yeterli veri yoksa hiç görünmez), detaylarda "İlginizi çekebilir", `/projeler` ve `/modeller`'de kapatılabilir kategori önerisi (filtre otomatik uygulanmaz; yer yalnızca izin sunucuda biliniyorsa ayrılır), asistanda ilgiye göre chip'ler, atölyede "… ile başlamak ister misiniz?" önerisi (mevcut tasarımı değiştirmez, ürün değiştirme onayını açar; asistanın `?urun=` bağlantısı da aynı öneriyi kullanır), teklif formunda kategori önerisi (alan ziyaretçi seçmeden doldurulmaz). Her kişiselleştirilmiş bölümde "Neden bunu görüyorum?", "Tercihleri yönet" ve "Geçmişi temizle" vardır. Bölümler server render'ı bekletmez, sayfa içeriğinin altında veya ayrılmış yerde istemcide doldurulur; sayfa başına tek küçük istek atılır.

### Hukuk danışmanı onayı gereken noktalar

Çerez politikası ve aydınlatma metni; kategori sınıflandırması (özellikle `rtm-assistant-v1` ve işlevsel kayıtların muafiyeti); banner metinleri; izin kaydı ve yanıtlanamayan soru saklama süreleri; anonim izin kimliğinin kişisel veri niteliği; asistan uyarı metni.

### Migration

`20261105_093608_phase9_10_assistant_consent` yalnızca yeni tabloları (`assistant_answers` + sürümler/diziler, `faqs` + sürümler, `assistant_unanswered`, `assistant_feedback`, `consent_records`, `assistant_settings` + diziler), kilit ilişkilerini ve `site_settings` çerez kolonlarını ekler; `up` içinde DROP/DELETE yoktur, mevcut veri silinmez. `down` bu fazın verilerini kaldırır; production'da otomatik rollback için kullanılmamalıdır. Yerel push veritabanında migration zinciri çalıştırılmadı; shared ortamda mevcut baseline benimseme notları geçerlidir. Payload tipleri ve import map yeniden üretildi.

### Test ve değerlendirme

```powershell
pnpm typecheck
pnpm lint
pnpm test:int
pnpm eval:assistant          # tests/assistant-evals: TR + EN sorular, doğru niyet oranı (hedef ≥%90)
pnpm test:e2e --workers=1
$env:RTM_CMS_E2E = '1'; pnpm test:e2e tests/e2e/consent-assistant.e2e.spec.ts --workers=1; Remove-Item Env:\RTM_CMS_E2E
pnpm build
```

Int testleri normalizasyon/kök/eş anlamlı/yazım hatası, güven eşikleri, varlık ve bağlam, admin cevabı önceliği, uydurmama, yayınlanmamış/private veri sızmaması (sahte Payload ile sorgu argümanları), bağlantı allowlist'i, kişisel veri maskeleme, istek şeması ve rate limit bucket'ları, izin cookie'si ve sürüm değişikliği, `safeStorage`, geri almada silme, ilgi puanı/decay ve öneri girdisini kapsar. Eval seti DEMO fikstür bilgisiyle (CMS'e yazılmaz) çalışır. Mevcut E2E testleri `tests/e2e/consent-state.json` ile "yalnızca zorunlu" kararıyla başlar; consent/asistan spec'i boş durumdan başlar. Varsayılan (opt-in olmayan) consent/asistan testleri CMS'e yazmaz: `/api/consent`, `/api/inquiry-token` ve `/api/assistant` istekleri yerelde taklit edilir. Bu testler kart konumunu, kapatma düğmesi olmadığını, yerinde genişlemeyi, tekrar erişimi, mobil sheet'i, başlatıcı/panel davranışını, bağlamsal chip'i, oturum devamını, reduced-motion'ı ve iki temada beş genişlikte çakışmasızlığı kapsar. CMS testi geçici DEMO politika/ayar/proje oluşturur, yalnızca oluşturduğu ID'leri siler ve global'leri yalnızca araya başka düzenleme girmediyse geri alır; kesilirse `phase10-qa-` önekli DEMO kayıtlarını admin'den inceleyin.

### Bilinen sınırlamalar

- Asistan kural ve arama tabanlıdır; serbest, çok adımlı veya karmaşık soruları bir dil modeli kadar esnek anlayamaz. Kalitesi CMS'e girilen Asistan cevapları, SSS ve eş anlamlı içeriğine bağlıdır.
- Eval seti geliştiriciler tarafından hazırlanmış DEMO bilgiyle ölçer; gerçek içerik ve gerçek ziyaretçi soruları ile ayrıca değerlendirilmelidir.
- Bilgi indeksi 60 sn'ye kadar eski olabilir; çok instance'lı dağıtımda instance'lar ayrı indeks tutar.
- Onaylı politika girilmeden tema/atölye tercihleri yalnızca sekme içinde çalışır (Faz 3/8 kalıcılık davranışı bilinçli olarak izne bağlandı).
- İlgi verisi cihaza/tarayıcıya özeldir; cihazlar arası eşitleme yoktur.

## Veritabanı ve migration yaklaşımı

Payload, geliştirme modunda yerel şemayı PostgreSQL'e otomatik olarak aktarır. Staging ve production ortamlarında şema değişiklikleri migration dosyalarıyla yönetilmelidir:

```bash
pnpm payload migrate:create
pnpm payload migrate
```

Production veritabanında geliştirme `push` akışı ile migration akışını karıştırmayın.

## Geniş atölye ve tasarıma özel teklif — Faz 8.3

### Yerleşim ve akış

Atölye header'ı yalnızca `/tasarim-olustur` üzerinde 56 px'dir. Adımlar ve belge eylemleri 52 px, alt gezinme 56 px'dir; sahne araçları ve durum bilgisi canvas üzerinde durur. 1600 px altında seçenekler başlangıçta 56 px ikon rayıdır; seçenek düğmesi, raydaki adımlar veya Ctrl/Cmd+B ile 320 px panele açılır. Bu başlangıç tercihi, 1440×900'de canvas alanı hedefini açık 320 px panelle aynı anda sağlamanın geometrik olarak mümkün olmamasından kaynaklanır. Özet bu genişlikte varsayılan kapalıdır; açılması sahneyi daraltmaz. 1600 px ve üzerinde özet yan sütun olabilir. `F`/Escape odak modunu açar/kapatır; Fullscreen API düğmesi ayrıdır. Tema ve paneller Canvas'ı yeniden oluşturmaz; kamera resize sonrası demand çizimde yeniden sığar. Elle kullanılan kamera ölçü düzenlemesinde korunur; Sığdır her zaman yeniden kadrajlar.

İlk 1440×900 ölçümü **816×385 px**, yeni başlangıç yerleşimi **1384×736 px (%78,6)** canvas verdi. Diğer kabul boyutları E2E `boundingBox` denetimindedir. Mobilde kapalı/yarım/tam sheet korunur; başlangıç kapalıdır, yarım konumda sahneye en az `55dvh` ayrılır. İpucu ve özet tercihi registry'deki gerekli sessionStorage anahtarları üzerinden `safeStorage` ile tutulur. Yeni kişisel bilgi storage anahtarı yoktur.

Üst CTA ve Gönder adımı `/tasarim-olustur/teklif#c=…` adresine gider. Sayfa mevcut strict v2 şemasını istemcide tekrar doğrular; yalnızca hash yokken izinli `rtm-design-v2` yedeğini dener. Geçersiz hash veya yedek boş durum gösterir, form açmaz. Düzenle bağlantısı aynı v2 tasarımını geri taşır. Sunucu kabuğu yalnızca public ayar DTO'sunu verir. Teklif sayfası WebGL/Three yüklemez; aktif tema token'larıyla mevcut SVG çizimi, native dialog büyütme ve tembel PDF/QR dışa aktarımı kullanır. Büyük 3B snapshot depolaması eklenmemiştir; bu sürüm teknik çizim gösterir.

### Başvuru ve özel ekler

Tasarım başvurusu açık `designQuote: true` varyantıdır: ad/telefon/il-ilçe zorunlu; e-posta ve en fazla 2000 karakter not isteğe bağlıdır. İletişim tercihi e-posta ise adres gerekir. Yerinde ölçü ve numune seçenekleri nullable admin alanlarıdır. Diğer iletişim/teklif formlarının e-posta ve mesaj zorunluluğu korunur. Form değerleri URL, storage veya analytics'e yazılmaz. Başarı kartı saklamayı bildirir; SMTP teslimi veya yanıt süresi vaat etmez.

`/api/teklif`, mevcut handler ve exact Origin, ziyaretçiye bağlı imzalı token, honeypot, UUID idempotency, DB unique index, atomik Postgres rate limit ve 24 KiB stream sınırını kullanır. Tasarım ve ek sahipliği sunucuda tekrar doğrulanır; paylaşım adresi sunucuda kurulur. Aydınlatma metni/onaylı HTTPS bağlantısı ve etkin teklif formu olmadan hem form hem ek yükleme kapalıdır. İndirme ve yapılandırılmış WhatsApp paylaşımı bağımsız kalır. Genel `inquiries.email` nullable olmuştur; genel formlarda sunucu doğrulaması zorunluluğu sürdürür.

Ekler `POST /api/teklif/ek` üzerinden ayrı binary isteklerdir. En fazla üç dosya; tarayıcıda 2048 px uzun kenara JPEG dönüşümü ve ilerleme/önizleme/kaldırma vardır. HEIC tarayıcıda çözülemiyorsa JPEG/WebP öneren hata gösterilir; decoder bağımlılığı eklenmemiştir. Kaynak istemci limiti 25 MB, sunucuda dosya başına **5 MiB stream limiti**, 40 milyon giriş pikseli ve yalnızca gerçek JPEG/PNG/WebP kabulü vardır. Sharp yeniden kodlama EXIF/GPS/XMP'yi siler. Public Media kullanılmaz: `inquiry-attachments` ve `private-inquiry-attachments/` dizini yönetici erişimlidir. Dosya URL'si Payload'ın yetkili file endpoint'inden geçer; bu dizini web sunucusunda public static dizine eşlemeyin. Kalıcı deployment diski/yedekleme gereklidir; public CDN'e taşımayın.

Ekler ziyaretçi + gönderim UUID'sinin HMAC anahtarına bağlıdır; üç slot DB unique index'i eşzamanlı yüklemeyi de sınırlar. Kaldırma aynı Origin/token/sahiplik denetiminden geçer ve gönderilmiş başvurunun ekini silemez. Yükleme hatası metin başvurusunu engellemez; başarısız ekler gönderime dahil edilmez. Geçici, **hiçbir zaman başvuruya bağlanmamış** ekler 24 saat sonra temizlenebilir. `markInquiryAttachments` hook'u `linkedAt` bilgisini native başvuru transaction'ında aynı `req` ile, sadece ilk bağlanmada yazar. Tekrarlanabilir; hata bütün işlemi geri alır. `overrideAccess: true` yalnızca zaten yetkilendirilmiş sabit ek ID'lerinin bu bütünlük metadatası içindir. Başvuru silinse bile daha önce bağlanmış dosyalar otomatik geçici temizliğe girmez; retention yönetici politikasına kalır. Başvuru ve dosya birlikte değerlendirilmelidir, arşivleme silme değildir.

`pnpm design-data:prune` yalnızca süresi dolmuş bağlantıları ve süresi dolmuş/başvuru ilişkisi bulunmayan ekleri temizler. Production işletiminde bu komutu örneğin saatlik bakım işi olarak ayrıca zamanlayın; uygulama kendisi kalıcı scheduler başlatmaz. Yükleme endpoint'inde sınırlı fırsatçı temizlik de vardır. Komut kaynak kodu veri silme yönünden incelenmelidir; migration veya bütün başvurular için otomatik silme değildir. Bağlı ekler için müşteri tarafından onaylı saklama/silme politikası gereklidir.

### WhatsApp ve kısa bağlantılar

Numara yalnızca Site Ayarları → Şirket ve iletişim → WhatsApp'tan, mevcut normalizasyondan gelir. **+90 536 716 96 50 → 905367169650 yalnızca geçici test numarasıdır; production öncesi şirketin onaylı numarasıyla değiştirilmelidir.** Otomatik seed edilmez; opt-in QA'da geçici girilip eski ayar geri alınır. Numara yoksa/geçersizse düğme gizlenir. `wa.me/<digits>?text=<encodeURIComponent(mesaj)>` yalnızca ziyaretçi tıklamasıyla yeni sekmede açılır. WhatsApp API'si veya otomatik mesaj yoktur.

Mesaj Türkçe satırlarla ürün, gerçek v2 ölçü/bölme/göz/malzeme/donanım değerlerini ve tasarım bağlantısını içerir. v2'de ayrı cihaz, üst-alt mutfak dolabı veya tezgâh yüksekliği verisi bulunmadığından bu ayrıntılar uydurulmaz. Ad ve telefon eklenmez. Konum/not ancak **Bilgilerimi de ekle** işaretlenirse eklenir; mesaj önizlemesi gönderilecek metni gösterir. Origin doğrulanmış `SITE_URL` / `NEXT_PUBLIC_SERVER_URL`'den, geliştirmede mevcut origin'den gelir. Localhost bağlantısı başka cihazdan erişilebilir değildir; canlı alan adıyla paylaşım testini ayrıca yapın.

WhatsApp düğmesi teklif sayfasında tasarım kartının üstünde, ürün adı ve ölçülerin hemen altındadır; mobilde detaylar kapalıyken de görünür. Yanındaki mesaj önizlemesi çizim URL'sini ve özellikleri gösterir. Tıklama ilgili numaranın sohbetini doldurulmuş mesajla açar; iletim ancak ziyaretçi WhatsApp'ta **Gönder** düğmesine bastığında gerçekleşir. Form göndermek WhatsApp mesajı göndermez.

`POST /api/tasarim-baglanti` aynı Origin/token/atomik limit kurallarıyla yalnızca strict v2 verisini kabul eder. Zod'un kanonik alan sırasına göre JSON + PAYLOAD_SECRET HMAC-SHA256, 12 karakter base64url anahtarı üretir. Private `design-shares` tasarım dışında form bilgisi saklamaz; göz etiketlerine kişisel bilgi girilmemelidir. `/t/<kimlik>` yalnızca geçerli/süresi dolmamış kaydı mevcut `#c=` formatına yönlendirir; bilinmeyen kimlik 404'tür. Varsayılan süre 180 gün, CMS Site Ayarları'nda 1–3650 gün aralığında değişebilir; süresi dolmuş aynı tasarım tekrar paylaşılırsa yenilenir. PAYLOAD_SECRET değişikliği yeni paylaşımların kimliğini değiştirir, eski kayıtların okunmasını engellemez.

Kopyalama, WhatsApp, teklif kaydı ve teklif sayfasının PDF/QR'ı kısa bağlantıyı tercih eder. Hata/limit/zaman aşımında uzun v2 bağlantısı korunur. Kurumsal paylaşım PNG'si mevcut renk token'larından üretilmiştir; atölye ve kısa bağlantı metadata'sında kullanılır. Tasarıma özel OG görseli sonraki adımdır; redirect ve WhatsApp crawler önbelleği nedeniyle canlı önizleme ayrıca doğrulanmalıdır.

### Migration ve doğrulama

`20261105_215849_phase8_3_design_quote` ve snapshot'ı yeni private tabloları, ilişkileri, unique indeksleri, nullable başvuru seçimlerini ve süre ayarını ekler; e-posta NOT NULL koşulunu gevşetir. **`up` mevcut veriyi silmez.** Yerel push DB'de migration zinciri çalıştırılmadı. Shared ortamda yukarıdaki baseline benimseme ve kontrollü release sürecini uygulayın. `down` yeni faz verisini kaldırır; e-postasız kayıt varsa NOT NULL'a dönüş bilinçli olarak durur, kişisel veri uydurulmaz/silinmez. Tipler ve import map yeniden üretilir.

`designQuote.int.spec.ts` mesaj/normalizasyon, şema allowlist'i, kanonik HMAC, bilinmeyen kimlik, gerçek dosya türü/limit/EXIF temizliğini kapsar. `design-quote.e2e.spec.ts` canvas bütçeleri, odak, Canvas kimliği, gidiş/dönüş, boş durum, dialog odak dönüşü, iki tema ve responsive ekranları kontrol eder. Opt-in yerel DEMO testi gerçek başvuru/idempotency, ekle/kaldır, anonim ve admin dosya erişimi, kısa URL redirect'i, WhatsApp href/kişisel bilgi tercihi ve kapalı formu sınar. Global ayarlar `updatedAt` eşleşmeden geri yazılmaz; temizlik yalnızca testin oluşturduğu ID'lerledir. Eski admin testindeki sabit kullanıcıyı silen seed de kaldırılmıştır; artık opt-in ve benzersiz DEMO ID temizliği kullanır.

```powershell
pnpm generate:types
pnpm generate:importmap
pnpm typecheck
pnpm lint
pnpm test:int
pnpm test:e2e --workers=1
$env:RTM_CMS_E2E = '1'
pnpm test:e2e tests/e2e/design-quote.e2e.spec.ts --workers=1
Remove-Item Env:\RTM_CMS_E2E
pnpm build
```

Ekran görüntüleri `test-results/phase8.3/quote-{width}-{theme}.png`, opt-in koşuda form görselleri `quote-form-{width}-{theme}.png`, örnek WhatsApp metni `whatsapp-message.txt`; atölye görselleri mevcut `configurator-{width}-{theme}.png` dosyalarındadır. Playwright yeni koşuda test-results'ı temizler; paylaşılacak raporları ayrı artifact dizinine alın. Gerçek cihazda WhatsApp açılışı, canlı alan adında OG önizlemesi, SMTP teslimi ve staging/production migration uygulaması bu yerel testlerle doğrulanmış sayılmaz. Mevcut Node 24.20.0 proje engine sınırının altındadır; release desteklenen Node sürümünde tekrar doğrulanmalıdır.

### Faz 8.3 teslim ölçümleri

Son yerel doğrulama: `typecheck`, `lint`, production `build`, **154 integration testi**, genel E2E koşusunda **62 başarılı / 10 opt-in atlanan test** ve ayrıca **1 başarılı opt-in CMS senaryosu**. Son erişilebilirlik düzenlemesinden sonra ilgili teklif/yerleşim testleri tekrar geçti (6 başarılı, 1 opt-in atlanan). Geçici DEMO başvurular, ekler ve kısa bağlantılar ID bazında temizlendi; değiştirilmiş global ayarlar geri alındı.

| Viewport | Canvas | Viewport alanı |
| --- | --- | --- |
| 1440 × 900 | 1384 × 736 px | %78,6 |
| 1280 × 720 | 1224 × 556 px | %73,8 |
| 390 × 844 | 390 × 644 px | %76,3 |

Production sunucusunda Lighthouse 13.6 mobil emülasyon ve Chromium yazılımsal GPU ile, ilk ziyaret/çerez kartı açıkken ölçüldü. Puanlar gerçek cihaz performansının garantisi değildir.

| Ölçüm | Performans | Erişilebilirlik | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- |
| Faz 8.2 atölye açık tema, önceki kayıt | 71 | 100 | 0,72 sn | 0 | 3129 ms |
| Faz 8.3 atölye açık tema | 62 | 100 | 1,25 sn | 0,0000036 | 6417 ms |
| Faz 8.3 teklif açık tema | 85 | 100 | 1,73 sn | 0 | 404 ms |

LCP iki sayfada da 2,5 sn hedefinin altındadır. Atölye CLS değeri raporda yuvarlandığında 0'dır; ham ölçüm mutlak sıfır değildir. Önceki koşunun ziyaret/rehber koşulları aynı olmadığından karşılaştırma yön gösterir. Daha büyük 3B canvas yazılımsal GPU koşusunda yüksek TBT üretmektedir; performans puanında iyileşme iddia edilmez. Gerçek mobil GPU üzerinde profil çıkarma ve sahne başlatma maliyetini azaltma açık performans işidir.

Paylaşılabilir yerel çıktılar `.tools/phase8.3-qa/` altında korunmuştur: `studio-1440-light.png`, `studio-1440-dark.png`, `studio-1440-options.png`, `studio-1280-light.png`, `studio-390-light.png`; `quote-final/quote-form-{width}-{theme}.png` (1440/1024/768/390/320), `quote-final/whatsapp-message.txt`, `measurements.json`, `changed-files.txt` ve `lighthouse-{studio,quote}.report.html/json`. Önceki görünüm kullanıcının görevde paylaştığı referanstır; başlangıç ölçümü yukarıdadır, ayrı bir önce ekran görüntüsü teslim artifact'inde korunmamıştır. Bu dizin Git'e dahil değildir.

## Dağıtım notları

- Node.js sunucusu ve erişilebilir bir PostgreSQL servisi gerekir.
- `DATABASE_URI`, `PAYLOAD_SECRET` ve `NEXT_PUBLIC_SERVER_URL` platformun secret/environment yönetiminde tanımlanmalıdır.
- Production öncesi migration'lar çalıştırılmalıdır.
- `20261107_144050_vercel_blob_media` migration'ı Media kayıtlarına yalnızca Blob nesne anahtarı alanlarını ekler; mevcut medya kaydını veya dosyayı silmez.
- Public `media` koleksiyonu `BLOB_READ_WRITE_TOKEN` bulunduğunda Vercel Blob kullanır ve tarayıcıdan doğrudan yükleme ile Vercel'in sunucu yükleme sınırını aşmaz. Yerelde token yoksa mevcut yerel depolama devam eder.
- Private `inquiry-attachments` public Blob'a bağlanmamıştır. Teklif eki özelliği açılmadan önce yetkili indirmeyi koruyan kalıcı private storage tasarlanmalıdır.
- HTTPS kullanılmalı; veritabanı ve yönetim sırları repoya eklenmemelidir.
# rtm-tasar-m-main
