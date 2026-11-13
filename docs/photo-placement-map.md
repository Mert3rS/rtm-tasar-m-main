# Fotoğraf yerleşimleri ve yönetimi

Admin → Site içeriği altında sayfayı seçin. **Fotoğraf yerleşim rehberi** bölümünde ilgili kayıt ve alanı seçin. Görsel kutusu doğru native Payload alanını açar; yeni fotoğraf yükleyebilir veya mevcut medyadan seçebilirsiniz. Native kayıtlarda aynı açıklamalar **Fotoğraf yerleşim rehberi** açılır alanındadır.

Her görsel alanında kullanım yeri, fotoğraf önerisi, kırpma/sıralama, diğer etkilenen alanlar ve yayınlama davranışı anlatılır. Koleksiyon önizlemeleri ilk sekiz kaydın son sürümüdür; diğer kayıtlar **Tüm kayıtlar / yeni kayıt** üzerinden yönetilir. Taslaklar ziyaretçiye yayınlanana kadar kapalıdır. Sadece Site ayarlarında Kaydet doğrudan uygulanır.

| Sitedeki yer | Gerçek kaynak | Davranış |
| --- | --- | --- |
| Ana sayfa ilk ekran ve açılan dokuzlu kolaj | `site-settings.heroImages` | Merkez ilk fotoğraftır; sekiz çevre konumu ayrı seçilir. Boş konumlar mevcut yayınlanmış proje kapaklarına döner. |
| Küre yanındaki proje kartı ve kaydırmalı Seçili işler | `projects.coverImage` | Yayınlanmış ilk dört seçili proje; aynı projenin arşiv/detay kapağıyla ortak. |
| Proje arşivi, detay kapağı, ilgili/seçili proje kartları | `projects.coverImage` | Proje kapağı değişikliği bütün kullanım yerlerine yansır. |
| Proje detay albümü | `projects.gallery[].image` | Kapak otomatik başa eklenir; tekrarlanan aynı URL tek slayttır. Native satır sırası korunur. |
| Ana sayfa hizmet alanı, hizmet listesi ve detay kapağı | `services.coverImage` | Ana sayfada en fazla dört aktif/yayınlanmış hizmet. Sabit videosu olan hizmette kapak, videonun posteridir; fotoğraf değiştirmek videoyu değiştirmez. |
| Hizmet detay albümü | `services.galleryImages[].image` | Kapaktan ayrı, sıralı ve büyütülebilen fotoğraflar. |
| Ana sayfa model karuseli, model katalog kartı ve detay kapağı | `design-models.coverImage` | Ana sayfada en fazla üç yayınlanmış, öne çıkarılmış model. İlgili model kartları da aynı kapağı kullanır. |
| Model detay albümü | `design-models.galleryImages[].image` | Katalog kapağından ayrı fotoğraf sırası. |
| Showroom arşiv kartı | `showrooms.coverImage` | Normal fotoğraftır; tur içini değiştirmez. |
| Showroom turunda bakılan görüntü | `showroom-scenes.panoramaImage` | Gerçek equirectangular JPEG/WebP, tam 2:1, 1024–8192 px genişlik. Showroom ve sahne birlikte yayınlanmış olmalıdır. |
| Tur altındaki sahne seçim düğmeleri | `showroom-scenes.thumbnailImage` | Normal küçük resim; boşsa 360° yazısı. Panorama otomatik küçük resim yerine kullanılmaz. |
| Hakkımızda giriş, hikâye ve toplu ekip fotoğrafı | `about-page.heroImage`, `storyImage`, `teamImage` | Üç ayrı alan; ana sayfa açılış fotoğraflarını değiştirmez. |
| Ekip üyelerinin adları üzerindeki portreler | `about-page.teamMembers[].image` | Her satır doğru kişiyle eşleştirilir. Portre yoksa ad/görev gösterilmeye devam eder. |
| Hakkımızda şirket albümü | `about-page.galleryImages[].image` | Proje/model galerilerinden bağımsızdır. Seçili proje fotoğrafları yine proje kapağından gelir. |
| Sosyal paylaşım önizlemesi | Proje/hizmet/model/showroom/About `seoImage` | Sayfa içindeki kapağı değiştirmez. Boşsa ilgili kapak; About için giriş fotoğrafı. Paylaşım platformu önceki görseli önbellekte tutabilir. |
| Kişiselleştirilmiş öneri kartları | Önerilen kaydın kapağı | Ayrı görsel yüklemesi yoktur; mevcut consent ve yayın kuralları korunur. |
| İletişim, Teklif Al, Çerez Politikası | Ayrı fotoğraf alanı yok | CMS logo kaydı mevcut navigasyon/footer marka çizimini değiştirmez. |

## Sabit görseller ve aktif olmayan bileşenler

- Hizmet videoları `ServiceShowcase.tsx` içindeki slug eşlemesinden `/assets/home/service-reels/*.webm` dosyalarına gider. Native fotoğraf alanı sadece kapağı/posteri değiştirir.
- Atölye tanıtımındaki çizim akışı `DesignStudioTeaser.tsx` ve `/assets/home/configurator-storyboard-v1.png` şerididir; tek fotoğrafla değiştirilmesi animasyonun yapısını bozacağından yükleme alanı gibi sunulmaz.
- Küre yüzeyi `/assets/globe/earth-blue-marble-2048.jpg` ve mevcut WebGL varlıklarından gelir. Proje görselleri yüzeyden bağımsızdır.
- Tasarım Oluştur sahnesinin oda, mobilya, malzeme ve ayna dokuları canvas/3B sahneden üretilir. Müşteri başvuru ekleri public galeri değildir.
- RTM marka çizimi `src/components/brand` altındadır. Site Settings `logo` yükleme alanı mevcut başlık/footer çizimini değiştirmez; bu durum panelde belirtilir.
- `AboutPreview` ve `ShowroomTeaser` dosyaları depoda bulunur fakat mevcut ana sayfa ağacında kullanılmaz. Bunlar için aktifmiş gibi yeni fotoğraf alanı veya içerik üretilmez.

## Geliştirme sözleşmesi

`src/lib/photoPlacements.ts` yerleşim açıklamalarını ve açık görsel DTO'larını paylaşır. `PhotoManager` server tarafından yetkili admin okumasıyla üretilmiş önizlemeleri gösterir. `PhotoFieldGuide` yalnızca bilinen native form alanlarının media ID'lerini okur; medya küçük resimlerini mevcut API üzerinden alır. Yeni yazma endpoint'i yoktur. Public sorguların yayın/aktif/erişim kuralları değişmez.

Native `ui` rehberleri kalıcı veri alanı eklemez; bu revizyon için yeni migration gerekmez. Önceki dokuz hero fotoğrafının migration'ı ayrı kalır. Tipler ve import map yeniden üretilir. Schema eşleme testi her upload alanının rehber ve doğru sekmeyle eşleştiğini doğrular; yeni upload alanı eklendiğinde bu haritayı da güncelleyin.

Yan panelin alan hedefi iframe üzerinde yalnızca bilinen alan anahtarı olarak tutulur. Native köprü hem belge hem form hazırlığı bitince izin verilen alanı kendi dokümanı içinde odaklar. Parent yükleme olayı veya ilk form durum mesajı, formun hazır olduğunun kanıtı olarak kullanılmaz. Kapatmada odak bekleyişi temizlenir; native kaydetme ve değişiklik uyarıları korunur.
