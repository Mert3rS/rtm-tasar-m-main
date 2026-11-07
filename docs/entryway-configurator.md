# Portmanto / vestiyer tasarım atölyesi

`/tasarim-olustur?urun=portmanto` gelişmiş vestiyer başlangıcını açar. Antre 120 (60 + 60 cm), Kompakt 90 (40 + 50 cm) ve Aile 180 (60 + 60 + 60 cm) düzenleri ziyaretçinin açık seçimiyle uygulanır ve geri alınabilir. CMS içeriği/seed oluşturulmaz.

V2 tasarım JSON'undaki isteğe bağlı, strict `entryway` alanı bölme başına iç düzen, ön yüz, cam, raf/kanca/çekmece sayısı, çıtalı arkalık ve bank altı düzenini tutar. Genişlikler ve kilitler mevcut `r.main` alanındadır. Bölmeler en az 40 cm; sayı değişimi kilitler açılınca yapılır. Toplam ölçü değişiminde kilitli genişlikler korunur. Geçersiz düzenlemeler mevcut atomik edit akışı tarafından reddedilir.

Oturma + ayakkabı, açık askılık, ayakkabılık, kapalı depolama, açık raf, askı dolabı ve çekmece + depolama düzenleri aynı `entrywayUnits()` geometrisini kullanır. Askı dolabı seçimi derinliği en az 60 cm yapar. Kancalar 2–6, raflar 2–7, çekmeceler 2–4 seçilebilir. Ayakkabılıkta en az 18 cm, diğer raflarda en az 12 cm nominal aralık doğrulanır. Sığmayan temsilî eşya gösterilmez.

Oturma yüksekliği 40–55 cm arası bitmiş üst yüzeydir: minder varsa 4 cm minder + 3 cm oturma tablası hesaba katılır. Bank altı açık ayakkabılık veya tek çekmece olabilir; açık ayakkabılık yeterli yükseklikte ara raf alır. Minder dört renkte, arkalık çıtalı seçilebilir. Bunlar görsel ön tasarımdır; oturma taşıma kapasitesi ve üretim tekniği iddiası değildir. Yerinde ölçü, bağlantı/donanım ve yük hesabı üretim öncesinde doğrulanmalıdır.

25–50 cm üst depolama toplam dış yüksekliğin içindedir. Açık askılık, bank ve açık rafın önünde dış kapak yoktur. Depolama bölmeleri standart, aynalı, cam veya açık olabilir. Geniş kapaklar dar kanatlara ayrılır. Üst bölüm camlı depolamada cam, diğer kapalı bölmelerde standart kapaktır. Açık bölmelerin üst depolaması da açıktır.

Altı renk/malzeme kombinasyonu, ortak renk paleti, RAL, gövde, kapak modeli, kulp ve askı metali, baza/metal ayak ve LED seçenekleri mevcut sistemle paylaşılır. Ayna stüdyo ışık ortamıyla temsilî PBR görünümüdür; canlı mekân/kamera görüntüsü değildir. Yeni haricî varlık, bağımlılık veya sürekli render döngüsü eklenmez. Canvas, reduced-motion ve düşük güç davranışı korunur.

Teknik çizim (WebGL fallback dahil), seçili bölmeye yaklaşma, tasarım özeti, teklif metni ve PDF aynı doğrulanan veriyi kullanır. Eski v2 bağlantılarına otomatik `entryway` eklenmez; eski kanonik paylaşım kimliği/klasik düzen korunur. Eski tasarım ancak başlangıç açıkça seçilince gelişmiş düzene dönüşür. Yeni koleksiyon/migration veya storage anahtarı yoktur; mevcut izin kontrollü kayıt/paylaşım akışı kullanılır.

Doğrulama: `pnpm typecheck`, `pnpm lint`, `pnpm test:int`, `pnpm exec playwright test tests/e2e/entryway.e2e.spec.ts --workers=1`, `pnpm build`. Tarayıcı testi CMS kaydı oluşturmaz. Görseller ve örnek PDF `.tools/entryway-qa/` altında Git dışında tutulur.
