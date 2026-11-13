# RTM Tasarım — müşteri içerik yönetimi

## Kullanım

Medya listesi dosya adı, alternatif metin ve görsel kullanımı sütunlarından oluşur; güncellenme tarihi listeden çıkarılmıştır, kayıt üzerindeki tarih verisi korunur. Dar düzenleme panelinde küçük resim, dosya adı ve kırmızı X aynı satırda kalır. Uzun dosya adları üç noktayla kısaltılır; üzerine gelince tamamı görünür. Telefon gibi çok dar ekranlarda tablo kendi içinde yatay kaydırılır.

Medya arşivinde her dosya adının sağındaki **kırmızı X**, silme yetkisi olan kullanıcıya kalıcı silme onayı açar. Aynı düğme fotoğraf seçme penceresinde de bulunur; fotoğrafın kendisine tıklamak seçim yapmaya devam eder. Silme mevcut Payload API'si üzerinden yapılır; yetki ve panorama referans hook'ları çalışır. Başarılı işlem listeyi arama/filtreleri koruyarak yeniler; son sayfadaki tek kayıt silinirse önceki sayfaya geçilir. Bu işlem yalnızca bir alandaki fotoğraf seçimini kaldırmak değildir: dosyayı arşivden ve sunucudan kalıcı siler. Salt dosya hücresi özelleştirildiği için yeni veri alanı veya migration eklenmez.

Tüm sayfaların kapak, galeri, ekip/portre, panorama ve sosyal paylaşım görselleri artık **Fotoğraf yerleşim rehberi** bölümündedir. Önce sayfa ve kaydı seçin; kutu doğru native alana götürür. Aynı rehber ilgili native kayıtta açılır bölüm olarak bulunur. [Alanların gerçek kaynakları ve görsel davranışları](photo-placement-map.md) ayrı haritada açıklanır. Rehberler `ui` alanıdır; veri şemasını veya yayın izinlerini değiştirmez.

### Güncel sinematik açılış

`/admin?page=home` ve Site ayarları → Ana sayfa açılışı, aktif animasyonun İlk açılış / Mekân / Malzeme / Detay / Kapanış karelerini gösterir. Önizleme ile public hero aynı varyant seçimini ve bölüm tanımlarını kullanır. Kareler, bölüm yazıları ve video bağlantısı uygulama dosyalarındadır; medya yüklemek bunları değiştirmez.

Ana sayfa metinleri sekmesinde ilk ekranın üst başlığı, ana başlığı ve proje bağlantısı düzenlenir. Ana başlığın ilk cümlesi başlık, devamı açıklamadır. Kapanış başlığı, animasyonun altındaki iletişim çağrısıyla aynı alanları kullanır. Açıklama yalnızca iletişim kartındadır.

`heroImages.center` yalnızca animasyon posteri de yüklenemezse kullanılacak yedek görseldir. Boşsa mevcut yayınlanmış proje kapağı yedek olabilir. Diğer sekiz alan native admin'de gizlenir, değerleri korunur. Yeni veri alanı veya migration eklenmemiştir. Hareket azaltma tercihi mevcut animasyonun son karesini gösterir.

### Ana sayfanın animasyonlu açılış fotoğrafları

Aşağıdaki dokuzlu kolaj açıklaması önceki tasarımın ve mevcut migration'ın geçmiş kaydıdır; güncel yönetim akışı yukarıdadır.

`/admin?page=home` üzerindeki fotoğraf planı iki aşamalıdır. **İlk açılış** yalnızca **01 · Merkez** fotoğrafını gösterir. **Kaydırınca açılan kolaj**, aynı fotoğrafın ortada kaldığı dokuzlu yerleşimi gösterir. Şema, sitedeki konum sırasını kullanır; gerçek animasyon ve mobil kırpma için aşağıdaki gerçek önizlemeyi kaydırın.

Bir kutuya dokunun: native Site ayarları formunda **Ana sayfa fotoğrafları** sekmesi ve ilgili fotoğraf alanı açılır. **Yeni oluştur** ile fotoğraf yükleyin ya da mevcut medyadan seçin. Fotoğrafta ne göründüğünü anlatan alternatif metni doldurun. **Kaydet** ile seçim siteye uygulanır. Yan paneli kapatınca plan ve gerçek önizleme yenilenir. Aynı ekran `/admin/globals/site-settings` üzerinden de açılabilir.

Konumlar: **01** merkez/ilk açılış; üst sıra soldan sağa **02–03–04**; orta sıra **05–01–06**; alt sıra **07–08–09**. Önce 01 için net bir genel mekân fotoğrafı, ardından çevreye uyumlu açılar ve detaylar seçin. Yatay JPEG/PNG/WebP/AVIF, tercihen en az 1920 px genişlik önerilir; bu bir yükleme zorunluluğu değildir. Kenarlar ekrana göre kırpılır. İlk fotoğrafın üzerine metin geleceği için önemli öğeleri merkeze yakın tutun.

Dokuz alan `site-settings.heroImages` altında bağımsız Media ilişkileridir; proje kapaklarını değiştirmez. Boş bırakılan her konum önceki yayınlanmış proje kapağı sıralamasına döner. Proje kapağı da yoksa konum boş kalır. Harita, seçilmiş fotoğraf ile otomatik proje kapağını ayırt eder. Sadece medya arşivine yüklemek yerleştirme yapmaz; fotoğrafı konuma seçip global ayarları kaydedin. Sahne/panorama dosyaları bu fotoğraf seçimlerine dahil edilmez.

`20261110_165225_homepage_hero_photos` migration ve snapshot'ı dokuz nullable Media ilişkisi, foreign key ve indeks ekler; mevcut veriyi silmez. Yerel geliştirmede adapter push kullanılır, migration zinciri çalıştırılmaz. Shared ortamda README'deki baseline benimseme süreci ardından kontrollü release adımında migration uygulanmalıdır. `down` dokuz konum seçimini kaldırır, medya dosyalarını silmez; geri alma öncesinde seçimleri dışa aktarın.

`/admin` açılışında **Site içeriği** görünür. Sol menüde **Site sayfaları** altında Ana Sayfa, Projeler, Modeller, Tasarım Oluştur, Hizmetler, Showroom, Hakkımızda, İletişim, Teklif Al ve Çerez Politikası bulunur. Seçim URL’de `?page=…` ile tutulur; doğrudan bağlantı ve tarayıcı geri/ileri çalışır. **İstatistikler** düğmesi önceki dashboard’a geçer.

Sağda sitenin gerçek public route’u aynı origin iframe içinde açılır; ayrı bir HTML kopyası kullanılmaz. Önizleme yalnızca **yayınlanmış** içeriği gösterir. Masaüstü (1440), tablet (768) ve telefon (390) seçenekleri aynı iframe’in viewport’unu değiştirir. Ölçek ekranın kullanılabilir alanına göre küçülür. Gerçek telefon donanımı veya mobil Safari performans testi yerine geçmez.

**Düzenleme açık** iken işaretli fotoğraf veya metne tıklamak ilgili kaydın **native Payload formunu yan panelde** açar. Medya seçimi, alt metin doğrulaması, erişim kontrolleri, form validasyonu, belge kilitleri ve taslak/yayınlama Payload’a aittir. Seçili alanın kendi sekmesi açılır ve alana kaydırılır. Yan panelin kaydetme durumu yalnızca aynı origin ve doğru iframe’den gelen form durum mesajlarıyla izlenir; bu kanal veri yazmaz. Kaydedilmemiş değişikliklerde kapatma onayı vardır. Kaydetme veya paneli kapatma önizlemeyi yeniler; taslağın yayınlanması ayrıca gerekir. Global Site ayarlarında Kaydet doğrudan yayına uygulanır.

**Gezinme açık** ile site içi bağlantılar gerçek detay sayfalarına gider. Önizlemede form gönderimleri engellenir; haricî bağlantılar için **Sitede aç** kullanılır. Düzenlenebilir alanlar bilinen koleksiyon/global hedeflerinden seçilir; serbest admin/API hedefi kabul edilmez. Public sayfadaki `data-rtm-*` nitelikleri tek başına düzenleme yetkisi vermez ve normal ziyaretçide etkileşim eklemez. Yeni bir ayrıcalıklı mutation endpoint’i veya public taslak sorgusu yoktur.

Sağdaki **İçeriği düzenle** alanı klavyeyle de kullanılabilir ve boş sayfalarda içerik ekleme yolunu gösterir. Altındaki **Fotoğraf yerleri ve içerik rehberi**, önceki görsel haritayı ve ayrıntılı alan açıklamalarını açar. Admin açık/koyu paleti public sitenin laciverti (`#103761`), açık gri/mavi yüzeyleri ve koyu lacivertinden uyarlanmıştır; native admin yapısı korunur.

- **Ana Sayfa:** Canlı yayın kaynaklarından oluşan dokuz konumlu fotoğraf haritası; metin bölümleri, seçili projeler, hizmetler ve modeller. Az proje varsa fotoğrafların tekrarlandığı açıkça belirtilir.
- **Projeler / Hizmetler / Modeller / Showroom:** İlk sekiz kaydın son sürümünden fotoğraf ve açıklama önizlemesi; tüm kayıtlar için liste bağlantısı. “Son kayıt: taslak” yayındaki içerikle aynı olduğu anlamına gelmez.
- **Hakkımızda:** Giriş, hikâye ve ekip fotoğrafları; diğer bölümlerin hangi editör sekmesinde olduğu.
- **İletişim ve footer:** Şirket açıklaması, iletişim ve sosyal profiller tek Site ayarları global’ından gelir.
- **Asistan ve politikalar:** İlgili native ayarlara ve onaylı içerik kaynaklarına yönlendirme.

Ana sayfanın mevcut metinleri **Site ayarları → Ana sayfa metinleri** sekmesinden yönetilir. Kaydetmek doğrudan yayına uygular; bu ayarlarda taslak mekanizması yoktur. Boş alanlar mevcut tasarım metinlerini kullanır. Bu davranış arayüzde açıklanır. Diğer koleksiyonların ve Hakkımızda’nın taslak/yayın akışı korunur.

Hero fotoğrafları artık dokuz ayrı yükleme alanından seçilir. Görsel haritası ile gerçek hero aynı `resolveHeroPhotos()` konum eşlemesini kullanır. Yalnızca boş konumlar için `getHomepageData()` içindeki yayınlanmış, erişilebilir, geçerli kapağı olan ilk dokuz proje ve önceki `heroSlots()` sıralaması kullanılır. Merkez için otomatik kaynak ilk projedir. **Öne çıkar** işareti hero seçiminden bağımsızdır.

Atölyenin hareketli storyboard’u ve RTM marka logosu uygulama varlıklarıdır; bunların yanlışlıkla bir CMS yüklemesinden yönetiliyormuş gibi sunulması önlenir. Arayüz etiketleri, animasyon kelimeleri, arşiv düğme etiketleri ve boş durum metinlerinin tamamı yeni bir sayfa oluşturucuya dönüştürülmez. Yeni alan ihtiyacı mevcut şema ve kaynak eşlemesi incelenerek ayrıca eklenmelidir.

Instagram mevcut `instagramUrl` alanından gelir. Kullanıcının verdiği `https://www.instagram.com/rtmtasarim/` bağlantısı yalnızca yerel Site ayarlarına kaydedilmiştir. Staging/production’da ilgili ayar ayrıca yönetilmelidir. Boş/geçersiz URL gizlenir; profil bağlantısı yeni sekmede `noopener noreferrer` ile açılır. Embed ve takip betiği yoktur. Footer’dan Hakkımızda bağlantısı kaldırılmıştır; sayfanın kendisi korunur.

## Görsel düzenleyici doğrulaması

Yerel production derlemesi çalışırken:

```powershell
$env:RTM_CMS_E2E = '1'
pnpm exec cross-env NODE_OPTIONS="--no-deprecation --import=tsx/esm" playwright test --config=playwright.visual.config.ts
```

Bu set Chromium ve WebKit’te gerçek sayfa geçişlerini, doğrudan metinden native forma erişimi, değişiklikleri bırakma onayını, sahte form-durum mesajının reddini, klavye odağının geri dönüşünü, 320–1440 px düzenini ve teklif özeti tipografisini kontrol eder. HTML raporu `.tools/visual-report/index.html` altındadır. Native panel mevcut Radix modal altyapısıyla portal içinde açılır; Payload’ın alanları yeniden yazılmaz.

`seedUser` temizliği yalnızca o koşuda oluşturulan kullanıcı ID’sine ait belge kilitlerini ve tercihleri siler, ardından test hesabını kaldırır. Tarayıcı önce kapatılır. Böylece Payload’da silinmiş kullanıcıya ait aktif kilit bırakılmaz. Başka kullanıcıların kilitlerine ve tercihlerine dokunulmaz. Eski, sahibi silinmiş bir kilit normal kilit süresi boyunca native editörü etkileyebilir; bu testler bu tür kayıtları topluca silmez ve kilitleme özelliğini kapatmaz.

## Şema ve release

`20261109_214356_admin_content_studio` sadece `site_settings` tablosuna yirmi metin sütunu ekler. Varsayılanlar sitede zaten kullanılan metinlerdir. Müşteri, proje, fotoğraf veya hukuki metin seed edilmez. JSON şema snapshot’ı migration ile birlikte tutulur.

Yerel geliştirme adapter push kullanır; **bu veritabanında migration zincirini çalıştırmayın**. Paylaşılan ortamlarda README’deki baseline benimseme ve kontrollü migration adımını izleyin. Migration `down`, yeni ana sayfa metinlerini siler; geri almadan önce bu alanları dışarı aktarın. Production migration çalıştırması bu değişiklik kapsamında yapılmamıştır.

## Geliştirmeyi sürdürmek için prompt

Güncel doğrulama: `pnpm typecheck`, `pnpm lint`, `pnpm build` ve 22 dosyada **324 birim/entegrasyon testi** başarılı. Üç tarayıcı setinde **19 senaryo** geçti: 10 görsel stüdyo/teklif tipografisi, 7 native admin kayıt/yayınlama ve 2 yayınlanmış içerik senaryosu. Chromium ve WebKit’te 320/390/768/1024/1440 px, açık/koyu tema, gerçek kapaktan editöre erişim, taslağın son yayını koruması, native yayınlama, ana sayfa metninin siteye yansıması, footer bağlantıları ve galeri/360° kontrolleri doğrulandı. Testler fiziksel telefon performans ölçümü değildir. DEMO kayıtlar temizlendi; Site ayarlarında test hesabına ait kilit kalmadığı ayrıca doğrulandı. Rapor `.tools/visual-report`, ek görüntüler `.tools/admin-content-qa` ve `.tools/published-content-check` altındadır. Ortam Node v24.20.0 kullandığı için proje engine aralığı uyarısı verir; desteklenen runtime’a geçiş bu çalışmada yapılmadı.

Aşağıdaki metin bir sonraki geliştirme oturumunda doğrudan kullanılabilir:

```text
RTM Tasarım’ın mevcut Next.js + Payload CMS uygulamasında müşteriye teslim edilebilir,
anlaşılır, estetik ve güvenilir bir içerik yönetimi deneyimi geliştir.

Önce AGENTS.md, docs/admin-content-studio.md, Payload config’i, native editör
özelleştirmelerini, bütün public sayfaları ve bunların veri sorgularını incele.
Çalışma ağacındaki mevcut değişiklikleri koru. Gerçek içerikleri silme, seed etme
veya uydurma. Paket sürümlerini ve mimariyi gereksiz yere değiştirme.

Hedef kullanıcı teknik bilgisi olmayan müşteridir. Müşteri bir fotoğraf veya metin
gördüğünde şunları açıkça anlayabilmeli:
1. Hangi sayfanın hangi bölümünde görünür?
2. Aynı içerik başka nerelerde paylaşılır?
3. Hangi native alanı düzenlemeliyim?
4. Değişiklik şu anda taslak mı, yayında mı, doğrudan kaydedilen ayar mı?
5. Henüz kaydedilmemiş değişiklik ve hata varsa ne yapmalıyım?

Mevcut Site içeriği ekranını temel al. Payload admin’i yeniden yazma; onun form,
ilişki seçimi, medya yükleme, doğrulama, kayıt kilidi, taslak, yayınlama ve sürüm
geçmişi özelliklerini koru. Yeni bir backend, ORM veya bağımsız CMS kurma.

İçerik mimarisi:
- Sayfa odaklı navigasyon: Ana Sayfa, Projeler, Hizmetler, Modeller, Showroom,
  Hakkımızda, İletişim/Footer, Asistan/Politikalar.
- Sitedeki yukarıdan aşağıya sıra ile yönetim ekranındaki bölüm sırası örtüşsün.
- Her bölümde gerçek veri önizlemesi, kısa görev açıklaması, kaynak alan adı,
  düzenleme bağlantısı ve mümkünse yayındaki bölümü açan bağlantı olsun.
- Kapak, galeri, panorama, portre ve SEO görsellerini anlaşılır biçimde ayır.
- Önizlemede bulunmayan kayıtlar için “Tüm kayıtları yönet” yolu görünür olsun.
- Aramada sonuç yoksa bunu belirt; sorgu hatasını boş içerik gibi gösterme.
- Sabit uygulama görsellerini ve kodla yönetilen etiketleri düzenlenebilir CMS
  alanıymış gibi sunma. Yeni alan gerekiyorsa önce gerçek kullanımını doğrula.

Ana sayfa:
- Onaylı hero, kaydırma animasyonu, küre, temalar ve reduced-motion davranışı korunsun.
- Fotoğraf haritası gerçek hero ile aynı seçim ve konumlandırma mantığını kullansın.
- Kapak değişikliğinin diğer kartları ve detay sayfasını etkilediğini açıkla.
- Public kaynakları sadece yayınlanmış, erişilebilir içerikten üret.
- İlk dokuz hero kaynağı, seçili ilk dört proje, en fazla dört aktif hizmet ve
  üç featured model sınırlarını koru; boşlukları sahte içerikle doldurma.
- Ana sayfa metinleri Site ayarları içindeki homepage grubundan gelsin;
  public DTO yalnızca açıkça seçilmiş alanları taşısın.

Görsel tasarım:
- Mevcut RTM markasına ve admin’in açık/koyu renk değişkenlerine uy.
- Düzenli boşluklar, net yazı hiyerarşisi, okunabilir kartlar ve dengeli köşeler kullan.
- Gereksiz grafikler, dekoratif sayaçlar, sahte başarı mesajları ve işlevsiz düğmeler ekleme.
- İlk ekranda müşterinin en sık görevlerini öne çıkar; teknik ayrıntıları yardımcı metinde tut.
- 1440, 1024, 768, 390 ve 320 px genişliklerinde taşma olmamalı.
- Klavye erişimi, görünür odak, erişilebilir adlar, yeterli kontrast ve dokunma alanları korunsun.
- Önizleme görsellerini uygun boyutta yükle; büyük dosyaları gereksiz yere indirme.
- Yeni storage anahtarı gerekirse consent registry ve safeStorage kurallarına uy.

Footer:
- Hakkımızda bağlantısını footer’da gösterme; route’u ve CMS içeriğini koru.
- Instagram Site ayarları → Sosyal medya → instagramUrl alanından yönetilsin.
- Onaylı profil https://www.instagram.com/rtmtasarim/ adresidir.
- Bağlantı yoksa öğeyi gizle; gerçek olmayan kullanıcı adı üretme.
- Instagram ikonunu metinle birlikte erişilebilir sun; takip betiği/iframe ekleme.

Güvenlik ve veri:
- Admin içerik sorgularında oturumu ve mevcut yetkileri doğrula.
- Public sorgularda overrideAccess:false, draft:false ve yayın/aktif filtrelerini koru.
- Trusted global okumaları yalnızca açık select + DTO ile yap; bildirim alıcısını,
  sırları ve kişisel veriyi public tarafa aktarma.
- Raw HTML render etme. Medya/panorama validasyonunu ve referans korumalarını bozma.
- Yeni şema değişiklikleri additive migration ve snapshot ile gelsin.
- Dev push DB’de migration zincirini çalıştırma; production release adımını belgeleyip
  kullanıcı açıkça istemedikçe production deploy/migration çalıştırma.

Doğrulama:
- pnpm generate:types ve gerekiyorsa pnpm generate:importmap çalıştır.
- pnpm typecheck, pnpm lint, ilgili anlamlı testler ve pnpm build başarılı olsun.
- CMS tarayıcı testini yalnız RTM_CMS_E2E=1 ve yerel DB’de çalıştır.
- DEMO kayıtlarını sadece oluşturduğun ID’lerle temizle. Değiştirdiğin global
  alanlarını yedekle; yalnızca kendi test değerini hâlâ taşıyan alanı geri al.
  Eşzamanlı kullanıcı düzenlemelerinin üstüne eski global snapshot yazma.
- Gerçek medya önizlemesinden doğru editöre ulaşmayı ve taslağın public hero’da
  görünmediğini doğrula. Native form validasyonu ve kayıt işlemini de kontrol et.
- Yapılmamış testi veya çalıştırılmamış production migration’ı başarılı diye bildirme.

Önce somut sorunları belirle, gerekli geliştirmeyi uygula, tarayıcıdan incele,
bulduğun sorunları düzelt. Sonunda değişiklikleri, doğrulama sonuçlarını ve kalan
somut sınırları kısa ve açık şekilde bildir. “Kusursuz” iddiası yerine kanıt sun.
```
