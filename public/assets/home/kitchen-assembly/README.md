# Fotoğraf referanslı 3B mutfak kurulumu — deneme

Kullanıcının sağladığı fotoğrafların renk ve yerleşim referansıyla üretilmiş
özgün Blender sahnesi. Fotoğraf slaytı, ölçülmüş rekonstrüksiyon veya gerçek
müşteri portföy kaydı değildir. Kamera her karede sabittir; mobilya parçaları
ayrı kurulum aşamalarında hareket eder.

Nesne gerçekliği revizyonu: saten boya ve ince kenarlar, lamelli/damarlı
ahşap tabla, metal/krom yansımaları, kıvrımlı evye, ocak ızgaraları, cihaz
fitilleri ve içi oyuk seramik detayları çevrimdışı sahnede modellenmiştir.
Önceki görsel sürüm `experiment/kitchen-assembly` dalında korunur.

- `desktop/frame_0001.jpg` … `frame_0150.jpg`: 1920 × 1200 doğal render, JPEG kalite 92 / 4:4:4.
- `mobile/frame_0001.jpg` … `frame_0100.jpg`: ayrı kamera, 720 × 1280 doğal render, JPEG kalite 90 / 4:4:4.
- `kitchen-assembly.mp4`: aynı masaüstü dizisinin sessiz izleme sürümü.
- `ready.json`: tüm kareler ve MP4 üretildiğinde encoder tarafından yazılır.

Kaynak: `scripts/render-reference-kitchen.py`.
Sıkıştırma: `scripts/encode-reference-kitchen.mjs`.
Davranış ve geri dönüş: `docs/kitchen-assembly-experiment.md`.

Eski film `public/assets/home/cinematic` altında aynen korunur.

HD revizyonu: 96 render örneği, 0,015 adaptif gürültü eşiği ve denoising.
Düşük çözünürlüklü kareler büyütülmez. Çözülmüş görsel havuzu 48 MiB piksel bütçesiyle sınırlıdır.
