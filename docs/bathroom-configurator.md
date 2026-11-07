# Banyo dolabı tasarım atölyesi

`/tasarim-olustur?urun=banyo` asma alt dolap, ortada seramik lavabo, üstte aynalı dolap ve cam vitrin açar. Denge 100, Kompakt 80 ve Çift lavabo 160 başlangıçları ziyaretçinin açık seçimiyle uygulanır; işlem geri alınabilir. CMS kaydı veya seed oluşturulmaz.

İsteğe bağlı strict v2 `bathroom` alanı alt bölüm tipleri ve çekmece/raf sayılarını, bağımsız üst sıra genişlik/kilit/tip/cam/raf dizilerini, montaj boşluğu, lavabo, ayna ve aksesuarları tutar. Alt genişlikler/kilitler mevcut `r.main` içindedir. Üst ve alt toplam genişlikler aynı, bölme sayıları bağımsızdır. Kilitli genişlikler korunur. Geçersiz değişiklikler mevcut atomik edit akışında uygulanmaz.

Bir veya iki lavabo gerekir. Lavabo modülü en az 55 cm genişlik ister. Alt yükseklik 40–95 cm ve 2 cm tezgâh dahil; derinlik 40–65 cm. Asma açıklığı 20–45 cm; lavabo bitmiş üst kotu 70–110 cm arasında doğrulanır. Tezgâh üstü oval/yuvarlak çanaklar 12 cm yüksektir. Gömme lavaboda tezgâh geometrisi deliklidir; seramik çanak konkav geometri, gider ve batarya içerir. Lavabo üst çekmecesinde tesisat açıklığı vardır; üretim tipi/boşluğu ayrıca doğrulanmalıdır.

Alt sırada lavabo, çekmece, kapak, açık raf veya çamaşır makinesi alanı seçilir. Makine en az 60 cm genişlik/derinlik ve 84 cm net yükseklik ister; seçim 88 cm yüksek, bazasız zemine oturan düzen uygular. Görüntü temsili cihazdır; gerçek marka/model uyumu iddia edilmez.

Üst dolaplar 50–95 cm yüksek, 14–26 cm derin ve tezgâhtan 32–65 cm aralıktadır. Aynalı, standart kapak, cam vitrin ve açık raf bölme başına seçilir. Başlangıçtaki bronz çerçeveli vitrinde kozmetik şişelerinin sığdığı raf aralığı kullanılır. Şeffaf, füme, buzlu, yivli cam; çerçeve ve iç/raf LED seçenekleri vardır. Üst dolap kapatılırsa kapsül, yuvarlak veya dikdörtgen duvar aynası gösterilir.

Altı malzeme/renk kombinasyonu, ortak palet/RAL/gövde/kulp, batarya metali, baza/ayak, tezgâh, arka panel, havluluk ve LED ayarları görünümü tamamlar. Ayna yerel olarak çizilmiş stüdyo yansıma dokusu ve PBR ışık ortamını kullanır; gerçek mekân/canlı kamera yansıması değildir. Temsilî eşyalar mevcut geometrilerden fiziksel boyutta yerleştirilir, sığmayanlar gösterilmez. Yeni bağımlılık, haricî varlık, sürekli render döngüsü veya storage anahtarı yoktur.

`bathroomGeometry()` teknik çizim, kamera odağı, 3B, teklif ve PDF için tek ölçü kaynağıdır. Eski v2 JSON'a alan eklenmez; eski kanonik paylaşım kimliği ve klasik düzen korunur. Başlangıç seçimi eski tasarımı açıkça dönüştürür. Yeni koleksiyon/migration gerekmez. Gerçek duvar taşıma kapasitesi, tesisat, suya/neme uygun malzeme, elektrik ve üretim boşlukları ön tasarımdan çıkarılamaz; uygulamadan önce doğrulanmalıdır.

Kontroller: typecheck, lint, entegrasyon testleri, `tests/e2e/bathroom.e2e.spec.ts` ve production build. E2E CMS yazımı yapmaz; kısa bağlantıyı stub eder. `.tools/bathroom-qa/` görseller/PDF Git dışındadır. Hızlı düzenleme/geri al sonrasında teklif geçişini kesebilen gecikmiş hash yazımı `useDesign.flushSave()` ile yönlendirmeden önce tamamlanır.
