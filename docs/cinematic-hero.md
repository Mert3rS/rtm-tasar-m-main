# Kaydırmayla sürülen ana sayfa filmi

Ana sayfanın açılışı `SpotlightHero.tsx` içinde, Next.js uygulamasına entegredir;
ayrı bir `index.html`, oynatıcı paketi veya üçüncü taraf runtime isteği yoktur.
Hero sonrasında mevcut ana sayfa bölümleri normal akışında devam eder.

## Özgün konsept dönüşümü

Kullanıcının ücretsiz, yeşil dolaplı bir mutfağın boş odada adım adım oluşması
talebi için özgün bir 3B sahne hazırlanmıştır. Son renk revizyonunda dolaplar ve
ada gövdesi kullanıcının açık gri referansına göre değiştirilmiştir. İstenen özelliklerde kullanımı
doğrulanmış ücretsiz bir hazır stok klip bulunamadığından video bu proje için
üretilmiştir. Kamera ve oda geometrisi bütün karelerde sabittir.

Sahne kaynağı: `scripts/render-hero-kitchen.py`. Blender 4.5 LTS ile oluşturulur.
Geometri, malzemeler, mermer deseni, ışıklar ve animasyon bu dosyada tanımlıdır;
indirilen stok video/model/doku veya haricî üretim API'si kullanılmaz.
Blender yalnızca geliştiricinin çevrimdışı varlık üretim aracıdır; uygulamaya
bağımlılık veya tarayıcıda çalışan yeni bir 3B katman eklenmez.

Görünür kaynak bağlantısı “Konsept mutfak dönüşümü / 3B görselleştirme” etiketiyle
aynı filmin yerel MP4 sürümünü açar. Konsept, CMS portföyüne veya gerçek müşteri
projelerine eklenmez. İncelenen ücretli/filigranlı adaylar yalnızca yok sayılan
`.tools` klasöründe tutulur ve public varlıklara dahil edilmez.

Animasyon sırası:

1. Boş oda, ham zemin, çıplak tavan kirişleri ve askı kabloları.
2. Tavan/zemin bitişi, açık gri dolapların sırayla yükselmesi, mermer arka yüzey.
3. Açık gri gövdeli mermer ada, evye, pirinç armatür ve tabureler.
4. Pirinç sarkıtlar, sıcak aydınlatma ve küçük son detaylar.

Bu bir fotoğraf slaytı veya kamera panı değildir; kareler aynı 3B sahnenin
farklı kurulum durumlarından render edilir. Yukarı kaydırmak aynı kurulum
durumlarını ters sırada gösterir. Film ses içermez.

## Yapı ve ayarlar

`src/lib/heroSequence.ts`:

- `FRAME_COUNT = 150`, `FRAME_PATH`: masaüstü kare sayısı ve yolu.
- `MOBILE_FRAME_COUNT = 100`, `MOBILE_FRAME_PATH`: 768 px altı için kareler.
- `SCROLL_HEIGHT_VH = 500`: kaydırma mesafesi.
- `SMOOTHING = 0.12`: rAF yumuşatma oranı.
- `HERO_FILM`: görünür kaynak ve erişilebilir görsel açıklaması.

```text
public/assets/home/cinematic/
  desktop/frame_0001.webp ... frame_0150.webp  (1920 × 1080)
  mobile/frame_0001.webp ... frame_0100.webp   (720 × 1280)
```

Blender ile kaynak PNG karelerini üretin (NVIDIA OptiX varsa GPU kullanılır;
yoksa CPU/OpenImageDenoise kullanılır). `--frames 1,150` yalnızca baş/sonu,
`--frames 1:150` bütün diziyi üretir. Örnek komut:

```sh
blender --background --python scripts/render-hero-kitchen.py -- --output .tools/hero-video/concept-final --frames 1:150 --width 1920 --height 1080 --samples 16
```

Ardından WebP dizisini ve 8 saniyelik MP4 sürümünü üretin. ffmpeg de yalnızca
geliştirici aracıdır. Sabit kalan başlangıç/bitiş durumları render betiğinde
aynı kareden kopyalanır; bu aralıklarda sahnede hareket yoktur.

```sh
ffmpeg -framerate 18.75 -i .tools/hero-video/concept-final/frame_%04d.png -frames:v 150 -c:v libwebp -quality 78 -compression_level 5 public/assets/home/cinematic/desktop/frame_%04d.webp
ffmpeg -framerate 18.75 -i .tools/hero-video/concept-final/frame_%04d.png -vf "fps=12.5,scale=-2:1280,crop=720:1280" -frames:v 100 -c:v libwebp -quality 76 -compression_level 5 public/assets/home/cinematic/mobile/frame_%04d.webp
ffmpeg -framerate 18.75 -i .tools/hero-video/concept-final/frame_%04d.png -c:v libx264 -pix_fmt yuv420p -g 1 -keyint_min 1 -crf 22 -an -movflags +faststart public/assets/home/cinematic/kitchen-transformation.mp4
```

Mobil set yatay renderin merkezinden kırpılır. Üretim `.blend`/PNG dosyaları
`.tools` içinde kalır; yalnızca sıkıştırılmış WebP dizileri ve MP4 public'e eklenir.
MP4 ana sayfa açılırken indirilmez; yalnızca kaynak bağlantısıyla açılır.

## Davranış ve korumalar

- Ana sayfa yenilendiğinde tarayıcının eski kaydırma konumu yerine sayfa başı ve
  ilk kare gösterilir. Root layout'taki `beforeInteractive` betiği yalnızca `/`
  üzerindeki `reload` gezinmesinde çalışır; bağlantı/geri gezinmesini değiştirmez.
- Dolap/ada malzemesi referans `#D7DBDC` rengidir (sRGB → linear dönüşümü ve
  mevcut güçlü ışık için parlaklık düzeltmesi kaynak betiktedir). Render ışığı
  ve gölgeler yüzeyin görünen tonunu doğal olarak etkiler.
- Header başlıkları ve iletişim düğmesi `styles.css` içindeki `--header-*`
  değişkenlerini kullanır; açık temada referans lacivert `#103761` uygulanır.
- Açılış, bölüm ve kapanış başlıkları sitenin `--foreground` antrasit rengini;
  italik vurgular ve açıklamalar `--muted` grisi ile aynı paleti kullanır.
  Hero düğmeleri `--button` lacivertini kullanır; koyu tema ortak token'ları izler.
- İlk kare responsive preload/poster ile görünür; kalan kareler dört eşzamanlı
  istekle yüklenir. Kaydırma hiçbir zaman kilitlenmez.
- Sıkıştırılmış kareler Blob olarak tutulur; çözümlenmiş görseller 12 kareyle,
  eşzamanlı decode ikiyle, canvas DPI 2 ile sınırlıdır.
- Eksik kare için en yakın mevcut kare kullanılır; bozuk/eksik kaynakta poster,
  CMS merkez fotoğrafı veya gradient kalır ve tek açıklayıcı uyarı verilir.
- Sekme görünmezken ve hero ekran dışındayken çizim durur. Unmount/ekran boyutu
  değişiminde eski istekler iptal edilir; object URL, observer ve event temizliği vardır.
- Reduced motion: yalnızca son kare ve statik başlık, 100svh yükseklik; scrub yoktur.
  Canvas kullanılamıyorsa poster ve bağlantılar aynı şekilde çalışır.
- Görünmez CTA'lar `inert` olur. Klavye odak halkaları ve ana içeriğe geçiş korunur.
- Başlık/açıklama mevcut CMS ana başlığından ayrılır; ilk cümle başlık, devamı
  açıklamadır. CMS metinleri ve proje sorguları değiştirilmez. Eski dokuzlu fotoğraf
  seçimleri silinmez; merkez fotoğraf yalnızca film yüklenemediğinde yedektir.
- Renkler `styles.css` semantik `--hero-*` değişkenlerinden, fontlar mevcut yerel
  Cormorant Garamond dosyalarından gelir. Tema canvas bileşenini yeniden mount etmez.

Doğrulama: `pnpm typecheck`, `pnpm lint` ve hedefli frontend Playwright testleri.
CMS yazımı veya seed gerekmez.
