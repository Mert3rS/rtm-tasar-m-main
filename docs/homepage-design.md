# RTM — Public website redesign v2

11 Kasım 2026: en üstteki fotoğraf kolajı, kullanıcının yeni talebiyle boş odanın
yeşil mutfağa dönüştüğü özgün, kaydırmayla sürülen 3B filmle değiştirildi. Güncel kaynak ve kare üretimi
ve davranışlar: [Sinematik açılış](cinematic-hero.md). Aşağıdaki spotlight bölümü
önceki tasarımı belgeler; diğer ana sayfa bölümleri bu değişikliğin dışındadır.

Latest brief: replace the public website design entirely, use the supplied
Sumit011 spotlight hero, replace the globe with a flat dotted project map, and
preserve `/tasarim-olustur`. No schema, content records, access policies or inquiry
security was changed.

## Visual system and isolation

Plus Jakarta Sans and IBM Plex Mono are served locally. OFL notices accompany
fonts in `src/app/(frontend)/fonts`. The new graphite/light grey/chartreuse theme
uses semantic variables in `styles.css`; `workshop.css` contains public layout
rules scoped to `.public-site`. PublicDesign keeps the configurator outside that
scope. Its existing Manrope font, studio tokens, modelling controls and export behaviour
remain intact. The shared-header revision below replaces only its header/toolbar shell. The previous public palette is restored locally on the
configurator wrapper, including dark mode.

## Supplied hero reference

https://codepen.io/editor/sumit011/pen/01a177c1-8a8d-70ea-8cc8-19af0a14ffa7

The user supplied HTML, CSS and JS after direct access returned 403. SpotlightHero
implements those scroll phases using native sticky positioning and a bounded
requestAnimationFrame handler instead of global GSAP/Lenis scripts:

- Start on the centre image of a 3-by-3 gallery, at gallery scale 1/image scale 1.25.
- Over three viewport heights: gallery scale 1 -> 0.5, image scale 1.25 -> 1;
  logo scale 6 -> 1 (2 -> 1 on smaller screens), travelling from bottom left to top left.
- Footer shrinks/blurs/disappears; headline words and CTA reveal in sequence.
- A final viewport-height exit translates the inner composition up and fades to dark.

All imagery comes from existing published project DTOs. Repeated cells are a visual
composition, not additional projects. No reference-site portraits, stock images,
tracking scripts, checkout links or legal claims were imported. Reduced motion,
manual pause and no-JS show the full headline and working CTA without scroll pinning.
The effect cleans up observers, RAF and listeners; offscreen final values are not
repeatedly written. No new dependency was added.

## Flat project atlas

ProjectMap uses the same published/accessible homepage query as the portfolio.
No WebGL or third-party map service loads on the homepage. Its SVG land dots are
generated from Natural Earth 110m land polygons, public domain:
https://www.naturalearthdata.com/about/terms-of-use/

Source data:
https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson

Manual regeneration (no network request at runtime/build):
`node scripts/generate-world-map.mjs <local-ne_110m_land.geojson>`.
The tracked SVG has 3,192 land dots. City coordinates use the same projection.
Hover, click, focus/Enter and touch expose a persistent project preview with links
and pagination; the close action restores focus. City chips provide a second
accessible way to select crowded points. Zoom increases the separation of the
current European/Turkish project locations. Theme changes retain map selection.
The old globe modules remain unused to avoid unrelated dependency changes.

## Pages and verification

Home, projects/archive/detail, models/archive/detail, services/archive/detail,
about, contact, quote, showroom/archive/detail, header, footer, gallery and empty
states share the new design. The native CMS admin is unchanged. Galleries retain
native dialog focus/keyboard behaviour; the panoramic viewer lifecycle is intact.
Contact forms still require approved privacy content and all server protections.

Checks: `pnpm typecheck`, `pnpm lint`, `pnpm build`, frontend Playwright scenarios.
The redesign QA is read-only and does not seed/delete CMS records. Opt-in legacy
CMS tests now target the SVG atlas. The independent configurator browser check
compares its original computed styles and tests its existing WebGL/export behaviour.

## 4 Kasım revizyonu — ortak header ve kaydırmalı seçili projeler

- SiteHeader bütün ziyaretçi route'larında tek ve sabit görünür. Ana sayfaya özel
  şeffaf/gizlenen logo varyantı kaldırıldı. Tasarım Oluştur da aynı header'ı
  kullanır; tasarım eylemleri ayrı `dc-document-bar` araç çubuğundadır. Modelleme,
  kaydetme, adımlar ve dışa aktarma akışı korunur; çalışma alanı header yüksekliğini
  viewport'tan düşer. Native Payload admin bu kapsama girmez.
- FeaturedProjects, kullanıcının BDThemes dikey fotoğraf/metin referansını
  ScrollProjects ile kullanır. İlerleme sayfanın doğal scroll konumuna bağlıdır;
  wheel/touch olayları iptal edilmez, otomatik oynatma ve geçiş düğmeleri yoktur.
  Görsel, yarı saydam metin paneli ve aktif proje göstergesi birlikte ilerler.
  Geri kaydırma önceki projeye döner. Kaynak yine aynı yayınlanmış dört seçili
  proje DTO'sudur. Yeni paket, CMS alanı veya örnek kayıt eklenmedi.
- Sticky sahne yalnızca hareket açıkken ve en az iki proje varken etkinleşir.
  Hareket kapalıyken/no-JS bütün projeler normal belge akışında okunur. Gizlenen
  slaytlar tab sırasından çıkar; mevcut odak korunur. Observer, RAF ve listener
  cleanup; boyut değişiminde yeniden ölçüm vardır.
- Hero dışındaki ana sayfa başlıkları, bölüm aralıkları, şirket/hizmet/model ve
  showroom görselleri küçültüldü. Arşiv ve detay sayfalarının ölçüleri değişmedi.

Tarayıcı kontrolü ortak header'ın route'lar arası görünümünü, doğal scroll ile
ileri/geri proje geçişini, proje linklerini, mobil ve reduced-motion görünümünü,
Tasarım Oluştur'un mevcut WebGL/PNG ve mobil akışını kapsar. Salt okunur QA'dır.

## Kalıcı ortak header ve daha büyük çerçevesiz proje sahnesi

Ortak header ilk çizimden itibaren bütün public route'larda sabit ve görünürdür.
Hero'nun scroll aşamasına bağlı gizleme ve heroHeaderState kaldırılmıştır;
yukarı/aşağı kaydırma, hareket tercihi, tema veya mobil menü header'ı gizlemez.
Hero header yüksekliğinin altından başlar. Atölye ve showroom tam ekranı belge
kökünde açılır; header aynı DOM içinde kullanılabilir kalır. Showroom sahnesi
tam ekranda header'ın altını doldurur; arka içerik görünmez ve odaklanamaz.

Seçili proje sahnesi masaüstünde 620 px'e, mobilde 520 px'e kadar büyütüldü;
dış border ve arka plan paneli kaldırıldı. Native scroll ilerlemesi kısa süreli,
kare hızından bağımsız yumuşatma ile takip edilir. Fotoğraflar parallax/zoom,
metin ve bağlantılar kademeli konum/opaklık ve hafif bulanıklık geçişi kullanır.
Durağan görünümde bütün filtreler/transformlar temizlenir. Scroll event'leri
engellenmez; RAF yalnızca hareket tamamlanana kadar çalışır.
