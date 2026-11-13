# Banyo dolabı tasarım atölyesi

`/tasarim-olustur?urun=banyo` asma alt dolap, ortada seramik lavabo, üstte aynalı dolap ve cam vitrin açar. Denge 100, Kompakt 80 ve Çift lavabo 160 başlangıçları ziyaretçinin açık seçimiyle uygulanır; işlem geri alınabilir. CMS kaydı veya seed oluşturulmaz.

İsteğe bağlı strict v2 `bathroom` alanı alt bölüm tipleri ve çekmece/raf sayılarını, bağımsız üst sıra genişlik/kilit/tip/cam/raf dizilerini, montaj boşluğu, lavabo, ayna ve aksesuarları tutar. Alt genişlikler/kilitler mevcut `r.main` içindedir. Üst ve alt toplam genişlikler aynı, bölme sayıları bağımsızdır. Kilitli genişlikler korunur. Geçersiz değişiklikler mevcut atomik edit akışında uygulanmaz.

Bir veya iki lavabo gerekir. Lavabo modülü en az 55 cm genişlik ister. Alt yükseklik 40–95 cm ve 2 cm tezgâh dahil; derinlik 40–65 cm. Asma açıklığı 20–45 cm; lavabo bitmiş üst kotu 70–110 cm arasında doğrulanır. Tezgâh üstü oval/yuvarlak çanaklar 12 cm yüksektir. Gömme lavaboda tezgâh geometrisi deliklidir; seramik çanak konkav geometri, gider ve batarya içerir. Lavabo üst çekmecesinde tesisat açıklığı vardır; üretim tipi/boşluğu ayrıca doğrulanmalıdır.

Alt sırada lavabo, çekmece, kapak, açık raf veya çamaşır makinesi alanı seçilir. Makine en az 60 cm genişlik/derinlik ve 84 cm net yükseklik ister; seçim 88 cm yüksek, bazasız zemine oturan düzen uygular. Görüntü temsili cihazdır; gerçek marka/model uyumu iddia edilmez.

Üst dolaplar 50–95 cm yüksek, 14–26 cm derin ve tezgâhtan 32–65 cm aralıktadır. Aynalı, standart kapak, cam vitrin ve açık raf bölme başına seçilir. Başlangıçtaki bronz çerçeveli vitrinde kozmetik şişelerinin sığdığı raf aralığı kullanılır. Şeffaf, füme, buzlu, yivli cam; çerçeve ve iç/raf LED seçenekleri vardır. Üst dolap kapatılırsa kapsül, yuvarlak veya dikdörtgen duvar aynası gösterilir.

Altı malzeme/renk kombinasyonu, ortak palet/RAL/gövde/kulp, batarya metali, baza/ayak, tezgâh, arka panel, havluluk ve LED ayarları görünümü tamamlar. Ayna yerel olarak çizilmiş stüdyo yansıma dokusu ve PBR ışık ortamını kullanır; gerçek mekân/canlı kamera yansıması değildir. Temsilî eşyalar mevcut geometrilerden fiziksel boyutta yerleştirilir, sığmayanlar gösterilmez. Yeni bağımlılık, haricî varlık, sürekli render döngüsü veya storage anahtarı yoktur.

`bathroomGeometry()` teknik çizim, kamera odağı, 3B, teklif ve PDF için tek ölçü kaynağıdır. Eski v2 JSON'a alan eklenmez; eski kanonik paylaşım kimliği ve klasik düzen korunur. Başlangıç seçimi eski tasarımı açıkça dönüştürür. Yeni koleksiyon/migration gerekmez. Gerçek duvar taşıma kapasitesi, tesisat, suya/neme uygun malzeme, elektrik ve üretim boşlukları ön tasarımdan çıkarılamaz; uygulamadan önce doğrulanmalıdır.

Kontroller: typecheck, lint, entegrasyon testleri, `tests/e2e/bathroom.e2e.spec.ts` ve production build. E2E CMS yazımı yapmaz; kısa bağlantıyı stub eder. `.tools/bathroom-qa/` görseller/PDF Git dışındadır. Hızlı düzenleme/geri al sonrasında teklif geçişini kesebilen gecikmiş hash yazımı `useDesign.flushSave()` ile yönlendirmeden önce tamamlanır.

## Banyo konfigüratörü: yerleşim ve boy dolabı

`/tasarim-olustur?urun=banyo` aynı konfigüratörü banyo başlangıcıyla açar. Header düzeni
yalnızca konfigüratörün compact header'ına, atölye stilleri `.configurator-shell` kapsamına
uygulanır. Diğer public sayfaların header yerleşimi ve ana sayfa hero'su değişmez.

### Arayüz dosyaları

- `src/app/(frontend)/styles.css`: açık/koyu tema için semantik `--studio-ui-*` renk,
  gölge, köşe ve boşluk değişkenleri.
- `src/app/(frontend)/design-quote.css`: 64 px header, masaüstü/tablet sağ adım rayı,
  mobil yatay adımlar, yatay özet kartları ve kısa ekran kaydırması.
- `src/components/site/SiteHeader.tsx`: mobil menüde iletişim ve tema kontrolleri,
  odak sınırı, Escape ve arka içeriğin inert davranışı.
- `src/components/configurator/Configurator.tsx`: aynı `go()` fonksiyonuyla doğrudan
  adım geçişi; araç çubuğu ve alt navigasyon mevcut işlevleriyle korunur.
- `SummaryDock.tsx` ve `DesignSummary.tsx`: yalnızca üst araç çubuğundaki Özet butonuyla
  açılan native modal dialog; Escape ile kapanır ve odağı butona döndürür. Her açılışta
  kapalı başlar; eski session tercihiyle otomatik açılmaz. Altta özet şeridi yoktur ve
  özet sahne yerleşiminde alan ayırmaz.
- Malzeme kartı mevcut `go(3)` yoluyla renk paletini açar, paneli palete kaydırır ve
  seçili renge odaklanır. Mobil sahne araçları native popover içinde erişilebilir kalır.
- `panels/BathroomSidePanel.tsx`: mevcut NumberField, SelectField, Toggle ve MaterialSwatch
  bileşenleriyle bağımsız boy dolabı ayarları.

### Veri modeli

Model `src/lib/configurator/bathroomSchema.ts` içindedir. Mevcut
`bathroom.sideCabinet.width/height/depth/gap` alanları korunur. Yeni alanlar isteğe bağlıdır:

| Alan | Anlamı |
| --- | --- |
| `enabled` | Kaldırma/ekleme; kapalıyken ayarlar silinmez. |
| `side` | `left` / `right`. |
| `floorGap` | Alt dolaptan bağımsız yerden yükseklik. |
| `alignment` | `back` / `front`; duvara veya tezgâhın ön kenarına hizalama. |
| `interior.h/t/shelves/drawers` | Göz yüksekliği, tipi, raf ve çekmece sayısı dizileri. |
| `finish.malz/yuzey/renk/ral` | Bağımsız kapak malzemesi/yüzeyi/rengi. Yoksa alt dolabı izler. |

`BathroomSelection.row` ayrıca `side` değerini kabul eder. Gözler sahneden, teknik
çizimden, özetten ve sol panelden seçilir. Göz sayısı 1–6'dır; göz yükseklikleri toplamı
boy dolabı yüksekliğine eşit olmalıdır. Raf/çekmece boşlukları ayrıca doğrulanır.
Boy dolabı ölçü sınırları genişlik 30–60, yükseklik 100–180, derinlik 20–40,
üniteler arası mesafe 10–40 ve yerden yükseklik 0–60 cm'dir.

Eski v2 tasarımlar okunurken yeni alanlar belgeye eklenmez; varsayılanlar yalnızca
`bathroomSideOptions()` okumasında çözülür. Eski canonical JSON ve paylaşım kimlikleri
korunur. Palette olmayan renkler, sınır dışı ölçüler ve tutarsız göz dizileri sunucunun
da kullandığı `configSchema` tarafından reddedilir. CMS şeması değişmediği için migration yoktur.

### İşlemler ve entegrasyon

`src/lib/configurator/bathroom.ts` içinde:

- `bathroomSideOptions()` eski ve yeni kayıtları aynı okuma modeliyle sunar.
- `setBathroomSideOption()` ekleme/kaldırma, konum, hizalama ve malzemeyi uygular.
- `setBathroomSideDimension()` bağımsız ölçüleri ve yükseklik değişiminde göz dağılımını günceller.
- `setBathroomSideCount()`, `setBathroomSideCellHeight()` ve `setBathroomSideCell()` gözleri düzenler.
- `bathroomGeometry()` toplam yerleşim genişliğini, sol sınırı, kamera merkezini ve göz konumlarını üretir.
- `bathroomDetails()` PDF ve teklif metinlerine ölçü, konum, göz ve malzeme bilgilerini taşır.

İşlemler mevcut `useDesign.edit()` / config doğrulaması / history yolunu kullanır.
Yeni kalıcılık anahtarı veya ayrı bir state deposu yoktur. Bağlantı, geri al/yinele,
teklif doğrulaması ve PDF aynı Config verisini kullanır. `BathroomDrawing.tsx` gözleri
ve sol/sağ yerleşimi çizer; `scene/BathroomCabinet.tsx` mevcut kapak ve eşya bileşenlerini
yeniden kullanır. Animasyon yalnızca boy dolabı yerleşim/ölçü değişimine eklenir;
reduced-motion'da hareket anında uygulanır. Canvas yeniden kurulmaz. Boy dolabı
geometrisi değişince temas gölgesi yenilenir. Banyo seçim çerçeveleri raycast almaz;
böylece dekoratif çerçeve başka bir bölmenin tıklamasını engellemez.

### Doğrulama

```sh
pnpm typecheck
pnpm lint
pnpm build
pnpm exec vitest run tests/int/bathroomSide.int.spec.ts tests/int/bathroom.int.spec.ts tests/int/configurator.int.spec.ts tests/int/designQuote.int.spec.ts tests/int/kitchen.int.spec.ts tests/int/kitchenModules.int.spec.ts tests/int/tv.int.spec.ts tests/int/wardrobe.int.spec.ts tests/int/entryway.int.spec.ts
pnpm exec playwright test tests/e2e/bathroom.e2e.spec.ts tests/e2e/studio-controls.e2e.spec.ts --workers=1 --reporter=line
```

Tarayıcı kapsamı: sahneden ve teknik çizimden seçim, ölçü/konum/iç düzen/malzeme,
geri al/yinele, yeniden yükleme, hash paylaşımı, PDF indirme, teklif sayfası, mobil
menü ve özet dialog'unun odağı, üç konumlu seçenek paneli ve taşma kontrolü.
Kısa bağlantı API'si testlerde 503 ile taklit edilerek mevcut hash fallback yolu denenir;
test CMS kaydı veya gerçek başvuru gönderimi yapılmaz.
