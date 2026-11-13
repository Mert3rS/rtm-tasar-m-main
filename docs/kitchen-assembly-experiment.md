# Fotoğraf referanslı mutfak kurulum animasyonu

Deneme dalı: `experiment/kitchen-assembly`. Orijinal gri mutfak filmi ve tüm
varlıkları korunur. `http://localhost:3000/?hero=original` önceki filmi açar.
`RTM_HERO_EXPERIMENT=1` ve tamamlanmış render işareti `ready.json` birlikte
varsa ana sayfa yeni kurulumu gösterir. Bayrak kapalıysa eski film kullanılır.

Nesne/malzeme gerçekliği revizyonu `experiment/kitchen-realism` dalındadır.
Önceki kurulum sürümü `experiment/kitchen-assembly` dalında ve `f1e7909`
commit'inde korunur. Bu revizyon yalnızca çevrimdışı sahneyi ve üretilen
kareleri değiştirir; tarayıcı oynatma koduna veya CMS'ye dokunmaz.

Revizyonda saten boyanın mikro dokusu ve vernik yansıması, ayrı ahşap
lamellerin ton/damar farkları, yönlü fırçalanmış metal, krom armatür,
kesintisiz kıvrımlı evye haznesi ve süzgeci, ocak ızgaraları, fırın kontrol
paneli, buzdolabı fitilleri/havalandırması, spot iç reflektörleri ve içi
oyuk seramik kâse kullanılır. Ön dolgu ışığı azaltılarak pencere yönü ve
temas gölgeleri belirginleştirilir. Masaüstü ve mobil kaynakları 96 örnek, 0,015 adaptif gürültü eşiği ve
denoising ile yeniden render edilir. Aynı pozdaki kareler yalnızca pratik ışık
enerjileri de aynıysa yeniden kullanılır; kapanış ışıkları kare kare ilerler.

Bu çalışma, kullanıcının sağladığı fotoğraflardaki yeşil shaker dolaplar,
açık raf, siyah tezgâh, tuğla arka yüzey, çelik buzdolabı, ahşap ada ve
çerçeveli açıklıktan yola çıkan özgün bir 3B canlandırmadır. Ölçülmüş veya
birebir fotogrametrik bir rekonstrüksiyon değildir; gerçek müşteri projesi
olarak CMS'ye eklenmez. Görünür kaynak etiketi bunu 3B canlandırma olarak belirtir.

Sahne `scripts/render-reference-kitchen.py` içinde geometri, prosedürel
malzemeler, ışık ve sabit kamerayla tanımlıdır. Blender yalnızca çevrimdışı
üretim aracıdır. Fotoğraflar arasında geçiş veya tarayıcıda 3B render yoktur;
mevcut SpotlightHero, 150 masaüstü / 100 mobil JPEG kareyi kaydırmayla sürer.
Mobil için ayrı sabit kamera ve gerçek 720×1280 render kullanılır.
JPEG teslimleri masaüstünde doğal 1920×1200, mobilde doğal 720×1280 çözünürlüğü korur. Yeni varyant, mevcut bounded yükleme/decode motoruyla
çözülmüş görsel düğümlerini doğrudan gösterir; her karede canvas'a piksel
kopyalamaz. Çözülmüş kare havuzu 48 MiB piksel bütçesiyle sınırlıdır (masaüstü 5, mobil 12 kare; en fazla iki eşzamanlı decode). Orijinal film canvas
çizimini ve WebP dosyalarını sürdürür. Değişmeyen etiket/opacity/inert değerleri yeniden yazılmaz.
HD revizyonunda JPEG kalitesi masaüstü 92, mobil 90 ve renk örneklemesi 4:4:4'tür.
MP4 CRF 18 ile üretilir. Yükleme boyutu ve genişlik/yükseklik bilgileri `ready.json`
içindedir; ziyaretçi yalnızca kendi ekranına uygun diziyi indirir. 1920×1200 kaynak,
1920×1080 ekranı mevcut cover kadrajıyla doldurur; 4K ekranlarda doğal 4K değildir.
Encoder düşük çözünürlüklü PNG kabul etmez; yapay büyütme uygulanmaz.


Kurulum sırası: boş oda → açık dolap gövdeleri → raf/arka yüzey/tezgâh →
yeşil kapaklar ve evye → cihazlar → ada gövdesi ve ahşap tablası → yeşil
çerçeve/spotlar ve aydınlatma. Parçalar kendi ölçülerini koruyarak hareket eder.
Yukarı kaydırmak kurulumu geri sarar. Tema değişimi viewer'ı yeniden kurmaz;
reduced-motion, poster, hata yedeği ve bellek/decode sınırları mevcut motorla paylaşılır.

## Yeniden üretme

Blender 4.5 LTS ile masaüstü kaynak karelerini üretin:

```powershell
blender --background --python scripts/render-reference-kitchen.py -- --output .tools/reference-desktop --frames 1:150 --width 1920 --height 1200 --samples 96
```

Mobil için aynı zaman çizelgesinden 100 kare örnekleyin:

```powershell
$taskFrames = (0..99 | ForEach-Object { [math]::Floor(($_ * 149 / 99) + 0.5) + 1 }) -join ','
blender --background --python scripts/render-reference-kitchen.py -- --output .tools/reference-mobile --frames $taskFrames --width 720 --height 1280 --samples 96 --mobile
node scripts/encode-reference-kitchen.mjs .tools/reference-desktop .tools/reference-mobile <ffmpeg-exe> .tools/hd-delivery
```

Önce ayrı teslim dizininde bütün karelerin çözünürlüğünü ve dosyalarını doğrulayın; sonra
desktop/mobile dizinleri ile MP4 dosyasını public alana kopyalayıp `ready.json` dosyasını
en son kopyalayın. Encoder tüm kareler ve sessiz MP4 tamamlanmadan `ready.json` yazmaz. Kaynak PNG
ve Blender dosyaları `.tools` içinde kalır; yalnızca JPEG kareler/MP4 public'e
eklenir. Haricî servis, ücretli model/doku, uygulama bağımlılığı, seed veya CMS
şeması eklenmez. Fotoğraf slayt denemesinin kaydı önceki Git commit'inde korunur.

## Doğrulama ve sınırlar

HD revizyonunda 150 masaüstü ve 100 mobil JPEG'in tamamı gerçek decode ve
çözünürlük kontrolünden, MP4 de tam decode kontrolünden geçti. Karelerin toplamı
26.160.128 byte (24,9 MiB); istemci yalnızca seçilen ekran dizisini yükler.
Yerel tarayıcı kontrolü 1920×1200 / 720×1280 kaynakları, boş oda → kurulum →
aydınlatma adımlarını, aynı piksele geri sarmayı, temada bileşen kimliğini,
mobil taşma olmamasını, reduced-motion son karesini ve eski film yolunu doğruladı.
Sayfa hatası görülmedi; CMS verisi yazılmadı.

HD sürümün geliştirme sunucusunda 3 saniyelik hızlı kaydırma ölçümü 151 rAF
aralığı, p95 33,4 ms ve 50 ms üzerinde sıfır aralık verdi. 4× CPU yavaşlatmada
41 aralık, p95 100,1 ms ve 50 ms üzerinde 37 aralık ölçüldü. Bu bir yerel
headless stres testidir; gerçek cihazda 60 FPS garantisi veya production
performans ölçümü değildir. Typecheck, lint ve production build başarılıdır.

Aşağıdaki performans sayıları önceki sürümün geçmiş ölçümleridir.

`pnpm typecheck`, `pnpm lint` ve `pnpm build` geçti. Yerel Playwright kontrolü
boş oda/gövdeler/kapaklar/ada/ışık karelerini, geri sarınca aynı çözümlenmiş
görsel piksellerine dönüşü, tema değişiminde aynı bileşenin korunmasını,
mobil kaynak seçimini, taşma olmamasını, reduced-motion son karesini ve eski
film bağlantısını doğruladı. Tarayıcı hatası görülmedi; CMS yazımı yapılmadı.

İlk kurulum sürümünün üretim derlemesinde 3 saniyelik hızlı tam-dizi taramasının headless ölçümü
119 rAF aralığı, p95 33,4 ms ve 50 ms üzerinde bir aralıktı. 4× CPU yavaşlatmalı
aynı stres testi 36 aralık ve p95 133,3 ms verdi. Düşük güçlü cihaz simülasyonu
hâlâ yavaşlama gösterir; her cihazda 60 FPS garanti edilmez. Bu yerel headless
ölçüm gerçek telefon testi yerine geçmez. Sahne boyutu ve bellek havuzu
sınırlıdır; daha ileri cihaz optimizasyonu ayrı bir performans çalışmasıdır.
