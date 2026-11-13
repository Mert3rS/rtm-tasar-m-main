# Mobil uyumluluk kontrolü

Bu kontrol mevcut RTM tasarımını koruyarak responsive yerleşimi ve dokunmatik kullanımını doğrular. Gerçek telefon yerine Playwright’ın dokunmatik Chromium ve WebKit cihaz profilleri kullanılır. Fiziksel iPhone/Android klavyesi ve cihaz GPU performansı bu otomasyonla birebir ölçülmez.

## Düzeltilen sorunlar

- Çerez politikasının grid kolonu, tablonun 560 px minimum genişliğine göre büyüyor; telefonlarda metinler kesiliyordu. Kolon `minmax(0, 1fr)` ile sınırlandırıldı. Tablolar kendi alanında yatay kaydırılır; klavye odağı ve erişilebilir tablo bölgesi adı eklendi.
- Karakter animasyonlu üst başlıklarda flex `gap`, her harfe uygulanarak 320 px’de taşma oluşturuyordu. Animasyonlu üst başlık normal metin akışına alındı; sayfa numarasının daralarak bölünmesi engellendi.
- Public mobil menü, kısa yatay ekranın dışına uzanıyordu. Yüksekliği görünen ekranla sınırlandı ve menünün kendi dikey kaydırması açıldı. Safari dokunmatik tıklamadan sonra düğmeye odak vermediği için açılan menünün ilk bağlantısına açık odak taşınıyor; Escape ve odak geri dönüşü korunuyor.
- İletişim, teklif ve dokunmatik tasarım alanlarında küçük input yazıları mobil için 16 px’e getirildi. Admin’in görünür metin girişlerine de aynı düzen uygulandı.
- Tailwind’in `.table` sınıfı, Payload’ın aynı isimli kaydırma kapsayıcısını table kutusuna dönüştürüyordu. WebKit’te dolu liste tüm paneli genişletiyordu. Native liste kapsayıcısının blok ve yatay kaydırma davranışı geri getirildi; mobil seçim çubuğunun ekran dışına uzanması düzeltildi.

## Kapsam

`playwright.mobile.config.ts`, Chromium/Android ve WebKit/iPhone profillerini kullanır. Ana viewport’lar: 320×568, 390×844, 768×1024 ve 844×390. Sonuncusu kısa yatay ekranı sınar.

- Ana sayfa, projeler, modeller, hizmetler, showroom, Hakkımızda, iletişim, teklif, çerez politikası ve tasarım teklifi boş durumu.
- Yayınlanmış geçici DEMO projeler, hizmetler, modeller ve Hakkımızda görselleri; dikey/yatay fotoğraf galerileri, modal sınırları, sonraki fotoğraf ve odak geri dönüşü.
- Showroom detayında yayınlanmış iki sahne ve HTML sahne seçimi.
- Özel dolap, gardırop, mutfak, banyo, TV ünitesi ve portmanto: seçenekler, sayısal alanlar, özet, Canvas kimliğinin korunması ve dolu tasarım teklifi.
- İlk ziyaret çerez kartı, tercihler, açık/koyu tema, asistanın mobil açılması ve kapatılması. Asistan yanıtları testte taklit edilir; yeni başvuru veya kalıcı test sohbeti oluşturulmaz.
- Yönetimde 19 native koleksiyon listesi, üç global ve yedi oluşturma formu; 320/390/768 px. Kayıt oluşturma formları görüntülenir, gönderilmez.
- Geçersiz proje/model/hizmet/showroom ve tasarım bağlantısı sayfaları.

Test yalnızca `scrollWidth` karşılaştırmaz: `overflow: clip` altında görünmeden kesilebilecek önemli metin ve form kutularını da ölçer. Bilerek yatay kaydırılan tablolar ve ekran okuyucu metinleri ayrı ele alınır.

## Tekrar çalıştırma

İlk kapsamlı mobil taramada production derlemesi üzerinde **32/32 mobil senaryo** iki tarayıcıda geçti. Bu taramada 22 dosyada 323 birim/entegrasyon testi başarılıydı. Güncel görsel stüdyo/tipografi revizyonunda sayı **324** oldu; ayrıca **10 görsel stüdyo/teklif + 7 native admin + 2 yayınlanmış içerik** senaryosu geçti. `pnpm typecheck`, `pnpm lint` ve `pnpm build` başarılı. Safari’de dolu admin tablosu ve seçim çubuğu 320 px içinde ayrıca ölçüldü. DEMO kayıtlar ve geçici Hakkımızda içeriği temizlendi; gerçek içerikler korundu.

Yerel ortam Node v24.20.0 ve pnpm 11.28.6 kullanıyor. Projenin Node engine aralığı için sürüm uyarısı mevcut; runtime veya paket sürümleri bu responsive düzeltmede değiştirilmedi.

```powershell
pnpm exec playwright install chromium webkit
pnpm build
pnpm start
```

Ayrı terminalde:

```powershell
$env:RTM_CMS_E2E = '1'
pnpm exec playwright test --config=playwright.mobile.config.ts
```

Opt-in CMS testleri yalnızca yerel veritabanında çalışır. Oluşturulan kayıt ID’leriyle temizlenir. Hakkımızda’nın yayın/taslak yedeği ve mevcut sürümleri korunur; eşzamanlı değişiklik saptanırsa eski snapshot yazılmaz. Gerçek müşteri, hukuki metin veya portföy içeriği seed edilmez.

Yoğun taramada development HMR sırasında aralıklı context hataları görüldüğü için son doğrulama production derlemesiyle yapılır. Windows WebKit, belge değişirken iptal edilen Next prefetch isteklerini erişim hatası gibi raporlayabilir; tarama her yeni belgeye geçmeden önce önceki isteklerin tamamlanmasını bekler. Çalışma zamanı hataları topluca filtrelenmez. İlgili [Playwright hata kaydı](https://github.com/microsoft/playwright/issues/43120).

Ayrıntılı adımlar ve sonuçlar `.tools/mobile-report/index.html` altındadır; `pnpm exec playwright show-report .tools/mobile-report` ile açılabilir. Ekran görüntüleri `test-results` altındadır. `.tools/mobile-audit` ilk bulguların yerel tanılama görüntülerini içerir; bunlar Git’e eklenmez.

## Sayfa tipografisi ve teklif özeti

`readability.css`, Projeler/Modeller arşiv ve detayları ile `/tasarim-olustur/teklif` ekranını ana sayfanın `--font-workshop` (yerel Plus Jakarta Sans) ailesine bağlar. Açıklamalar 15–17 px, yardımcı metinler 13 px, kart başlıkları 24–32 px ölçeğindedir; başlıklar ana sayfanın bölüm hiyerarşisini izler. Filtreler ve düğmelerin dokunma alanları korunur. Uzun kategori/ad/ölçü metinleri taşmadan satıra geçer. Ana sayfa hero tasarımı değiştirilmez.

Teklif özeti artık masaüstünde ayrı bir iç kaydırma alanı kullanmaz; teknik çizim, malzeme ve ölçü bilgileri sayfa akışında okunur. Açık/koyu temanın mevcut semantik renkleri kullanılır. SVG teknik çizimin ölçekli çıktısı ve export geometrisi değiştirilmez; küçük teknik etiketler için “Teknik çizimi büyüt” diyalogu korunur. Mobilde detayları aç/kapat akışı devam eder.

`readability.e2e.spec.ts` altı ürün tipini 320/390/768/1024/1440 px genişliklerde, açık/koyu temada, çizim diyalogu ve gerçek hesaplanan font ölçümleriyle inceler. Test paylaşım endpoint’ini mock eder; kalıcı tasarım bağlantısı oluşturmaz. `mobile-cms.e2e.spec.ts` geçici yayınlanmış içeriklerde Projeler/Modeller fontlarını ana sayfayla karşılaştırır ve desktop arşiv görüntülerini de üretir.

Teklif tipografi testi doğrudan teklif sayfasından başlar; ana sayfayla ortak public header fontunu referans alır. Ürünler gerçek `hashchange` geri yükleme akışıyla değiştirilir ve belge kimliğinin korunması doğrulanır. Böylece ayrılan bir ana sayfanın belge değişimi sırasında başlattığı prefetch’ler WebKit tanılaması üretmez. Token ve kısa paylaşım istekleri mock edilir; hızlı görsel QA sunucunun form limitini tüketmez. Çalışma zamanı hataları filtrelenmez.
