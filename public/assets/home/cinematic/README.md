# Konsept mutfak dönüşümü

Bu kareler aynı sabit kameradan render edilen özgün 3B sahnenin aşamalarıdır:
boş oda → açık gri dolaplar ve mermer yüzey → ada ve tabureler → pirinç sarkıtlar.
Dolap ve ada gövdesi, kullanıcının renk referansı `#D7DBDC` ile yeniden render edilmiştir.
Gerçek müşteri/portföy kaydı olarak kullanılmaz; arayüzde konsept olarak etiketlenir.

Geometri, malzemeler ve hareket kaynağı: `scripts/render-hero-kitchen.py`.
Stok model, video, doku veya HDRI içermez. Ücretli bir stok lisansına bağlı değildir.
Üretim ve yeniden render komutları: `docs/cinematic-hero.md`.

- `desktop/frame_0001.webp` … `frame_0150.webp`: 1920 × 1080.
- `mobile/frame_0001.webp` … `frame_0100.webp`: 720 × 1280 merkez kırpımı.
- `kitchen-transformation.mp4`: aynı dönüşümün 8 saniyelik izleme sürümü.

Ana sayfa kare dizisini yerel olarak yükler. MP4 yalnızca izleme bağlantısına
tıklandığında açılır; sayfa yüklenirken video dosyası indirilmez.
