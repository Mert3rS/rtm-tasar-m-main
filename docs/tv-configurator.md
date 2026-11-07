# TV ünitesi tasarım atölyesi

`/tasarim-olustur?urun=tv` kaşmir alt konsol, ahşap çıta paneli, cam vitrin, taş dokulu TV paneli ve gizli LED çerçeve açar. Çerçeve 240, Minimal 200 ve Sinema 300 başlangıçları açık kullanıcı seçimiyle uygulanır ve geri alınabilir. Üçüncü düzen 85 inç, Minimal 55 inç, Çerçeve 65 inç ekranla başlar. CMS içeriği veya seed oluşturulmaz.

V2 tasarım JSON'undaki isteğe bağlı strict `tvUnit` alanı alt tipler, raf/çekmece sayıları, bağımsız üst genişlik/kilit/tip/cam/raf dizileri, üst ölçüler, panel dokusu, LED çerçeve, soundbar ve kablo kanalı seçimini tutar. Alt genişlik/kilitler `r.main` içindedir. Toplamlar eşit, bölme sayıları farklı olabilir. Kilitler korunur, geçersiz düzenleme atomik reddedilir. Üst bölme sayısının değiştirilmesi yeni kompozisyon kurar; kilitlerin açılması gerekir.

Alt tipler kapaklı, çekmeceli, yukarı açılır ve açık raftır. Üst tipler boy dolabı, cam vitrin, açık raf, çıta paneli ve TV alanıdır. Tek TV alanı zorunludur; bir başka üst bölmeye TV tipi verildiğinde mevcut tipler yer değiştirir ve ölçü kontrol edilir. Üst sırada eşitleme TV alanını koruyarak depolamaları eşitler. Alt yükseklik 35–90 cm (2 cm üst tabla dahil), derinlik 25–65 cm, üst derinlik 20–40 cm ve alt derinliği aşamaz. Asma montajda 15–35 cm zemin açıklığı vardır.

Ekran 16:9 oranla, inç başına yaklaşık 2.214 cm genişlik / 1.245 cm yükseklikle çizilir; alan yatayda en az 8 cm, düşeyde 24 cm ek boşluk ister. 55/65/75/85 inç seçimleri alana sığmazsa devre dışıdır. Ekran alanı genişletilerek daha büyük seçim açılır. Gerçek TV çerçevesi, askı aparatı ve havalandırması üretim öncesinde doğrulanır; kod marka/model uyumu veya izleme mesafesi iddiası içermez.

TV arkası panel düz, taş veya çıtalı olabilir; panel ve LED çerçeve ayrı açılıp kapatılır. Dikey çıta arkalığı alt ünite arkasından üst kota kadar devam eder. Cam, çerçeve, raf sayısı, LED, kapak modeli, kulp, iki renk, RAL ve gövde ayarları vardır. Altı kombinasyon sadece görünümü değiştirir. Eşyalar mevcut yerel geometrilerle fiziksel boyutta, ekran da yerel çizilmiş koyu yansıma dokusuyla gösterilir; haricî içerik/video/iframe yüklenmez. Eşya tercihi ekranı gizlemez.

`tvGeometry()` 3B, teknik çizim, kamera odağı, özet, teklif ve PDF'nin ortak ölçü kaynağıdır. Eski v2 bağlantılarına otomatik metadata eklenmez ve kanonik kimlikleri değişmez; eski düzen açık başlangıç seçimiyle dönüşür. Koleksiyon, migration, paket veya storage anahtarı eklenmez. Demand render, Canvas kimliği, reduced-motion, mobil düşük güç ve WebGL fallback korunur.

Kontroller: typecheck, lint, entegrasyon testleri, `tests/e2e/tv.e2e.spec.ts` ve production build. Tarayıcı testi CMS yazımı yapmaz. `.tools/tv-qa/` ekran görüntüleri ve PDF Git dışındadır.
