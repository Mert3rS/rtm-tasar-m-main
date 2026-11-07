# Gardırop tasarım atölyesi

`/tasarim-olustur?urun=gardirop` gelişmiş gardırop başlangıcını açar. Çift 200, Kompakt 160 ve Vitrinli 300 düzenleri yalnızca ziyaretçinin açık seçimiyle uygulanır; CMS içeriği veya seed oluşturulmaz. İşlem geri alınabilir.

V2 tasarım şemasındaki isteğe bağlı `wardrobe` nesnesi bölüm başına iç düzeni, ana kapak türünü, camı, raf/çekmece sayısını ve üst depolamayı tutar. Genişlikler ve kilitler mevcut `r.main` içindedir. Bölmeler en az 45 cm; düzenin gerektirdiği net iç yükseklik ayrıca doğrulanır. Kilitli ölçüler korunur, imkânsız düzenleme atomik reddedilir. Üst depolama 30–60 cm arasında, toplam yüksekliğin içindedir. Menteşeli kapaklarda üst depolamanın dış kapakları standarttır.

Uzun askı, kısa askı + raf, çift askı, askı + çekmece, raflı, pantolonluk ve ayakkabılık düzenleri `wardrobeUnits()` tarafından aynı ölçülerden oluşturulur. İç çekmeceler 2–4, raflar 2–7 seçilebilir. Temsilî eşyalar gerçek boyut sınırlarına göre mevcut prop geometrilerinden yerleştirilir; sığmayan eşya büyütülmez. Telefonlarda eşya sayısı azaltılır. Dikey iç LED, raf altı ve üst iç aydınlatma isteğe bağlıdır.

Menteşeli ana kapaklar bölüm başına standart, aynalı, cam veya açık seçilebilir. Geniş bölmelerde kapaklar dar kanatlara ayrılır. Sürgülü seçim en az 60 cm derinlik ve gömme kulp uygular; 2–4 dış panel iç bölmelerden bağımsızdır. Panel türü/camı ayrı seçilir; menteşeli bölüm seçimleri sürgülüye geçişte kaybolmaz. Panel konumları `wardrobeSlidingPanels()` içindedir; açılmada dış genişlik sınırları aşılmaz ve paneller ayrı ray derinliklerinde kalır. Ray, menteşe ve üretim boşlukları teknik doğrulama ister.

Ayna, yerel stüdyo ışık ortamıyla temsili PBR yansımasıdır; gerçek mekânın canlı yansıması veya kamera görüntüsü değildir. Haricî görsel, kamera erişimi, iframe, yeni render kütüphanesi veya sürekli çalışan yansıma döngüsü eklenmez. Mevcut Canvas ve reduced-motion davranışı korunur. Yeni storage anahtarı yoktur; tasarım mevcut izin kontrollü kayıt ve paylaşım akışını kullanır.

Teknik çizim, bölüm seçimi, teklif metni ve PDF aynı domain verisini kullanır. Eski v2 bağlantılarına `wardrobe` varsayılanı eklenmez; eski kanonik paylaşım kimliği ve klasik editör korunur. Eski gardırop tasarımı bir başlangıç açıkça seçildiğinde gelişmiş modele dönüşür. Yeni koleksiyon/migration gerekmez; veriler mevcut doğrulanan tasarım JSON alanındadır. Fiyat, üretim garantisi veya gerçek ürün/marka iddiası yoktur.

Doğrulama: `pnpm typecheck`, `pnpm lint`, `pnpm test:int`, `pnpm exec playwright test tests/e2e/wardrobe.e2e.spec.ts --workers=1`, `pnpm build`. Tarayıcı testleri CMS kaydı oluşturmaz. Görseller ve örnek PDF `.tools/wardrobe-qa/` altında Git dışında tutulur.
