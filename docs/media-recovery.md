# 13 Kasım 2026 medya kurtarma

Canlı kaynak: `https://rtm-tasar-m-main.vercel.app`. Public CMS'de sekiz medya
kaydı bulunmasına rağmen `/api/media/file/` kaynakları dosyaları sunamıyordu.
`d4a0868` senkronizasyonu `a25a19a` ve `b5ecc63` ile eklenen Blob adapterini,
Next Image uzak kaynak iznini ve panorama origin iznini kaldırmıştı.

Dosyalar mevcut sahip olunan depoda hâlâ erişilebiliyor:
`https://1qldjncltmptxwup.public.blob.vercel-storage.com`.

## Kurtarılan dosyalar

Her dosyanın orijinali ve `-960x720.jpg` önizlemesi yerel `media/` klasörüne
indirildi. Toplam 16 dosyada HTTP 200, CMS'deki byte boyutu, gerçek JPEG formatı
ve çözünürlük Sharp ile doğrulandı. SHA-256 manifesti Git dışındaki
`.tools/media-recovery/recovered-files.json` dosyasındadır. Var olan farklı bir
dosyanın üzerine yazılmaz. Yeni görsel üretilmedi, içerik veya ilişki değiştirilmedi.

| Dosya                  | Orijinal boyutu | Çözünürlük  |
| ---------------------- | --------------: | ----------- |
| sunum-living.jpg       |          374413 | 1536 × 1024 |
| sunum-kitchen.jpg      |          359165 | 1536 × 1024 |
| sunum-bedroom.jpg      |          382888 | 1536 × 1024 |
| sunum-dining.jpg       |          384999 | 1536 × 1024 |
| sunum-office.jpg       |          375419 | 1536 × 1024 |
| sunum-atelier.jpg      |          404636 | 1536 × 1024 |
| sunum-lebombo.jpg      |          437989 | 4096 × 2048 |
| sunum-brown-studio.jpg |          737824 | 4096 × 2048 |

CMS'deki mevcut `SUNUM / AI KONSEPT` ve `SUNUM / CC0` etiketleri korunur;
bu dosyalar gerçek müşteri portföyü olarak yeniden tanımlanmaz.

## Kalıcı düzeltme

- Payload ile aynı sürüm `@payloadcms/storage-vercel-blob@3.92.1`, yalnızca
  public `media` koleksiyonuna bağlanır. Token Vercel ortam secret yönetimindedir.
- Next Image ve panorama kontrolü yalnızca yukarıdaki tam HTTPS origin'ine izin
  verir; başka Blob hesapları, kullanıcı bilgisi, query ve fragment kabul edilmez.
- Native adapter eski `filename` ve boş prefix ile mevcut dosyaları çözer.
  Yeni dosyalarda random suffix kullanılır. Mevcut metadata yeniden yazılmaz.
- `alwaysInsertFields` ile yerel/production şeması aynı kalır. Yerel token yoksa
  dosyalar `media/` altında tutulur. Bu dizin Git'e eklenmez.
- `clientUploads: false` gerçek dosya byte doğrulamasını korur. Vercel'de 4 MiB
  sınır, multipart dahil 4.5 MB platform sınırının altında kalır; yerelde mevcut
  varsayılan 32 MiB devam eder. Özel başvuru ekleri bu adaptere dahil edilmez.

## Kontrollü yayın

1. Doğru Vercel ekibi `mert-b131`, proje `rtm-tasar-m-main`, bağlı kaynak repo
   `Mert3rS/rtm-tasar-m-main` doğrulanır. Mevcut depo kullanılır; yeni Blob deposu
   oluşturulmaz. Token değeri loglanmadan varlığı ve depo eşleşmesi doğrulanır.
2. Production şeması ve migration geçmişi okunur, yedek alınır.
   `20261113_115744_restore_vercel_blob_media` yalnızca eksik `media.prefix` ve
   `media._objectkey` kolonlarını ekler; mevcut değerleri korur. Daha önceki Blob
   release'inden kolonlar kalmışsa tekrar eklemez. Migration'ın `down` işlemi
   önceki storage anahtarlarını silebileceği için bilinçli olarak durur;
   uygulama rollback'inde additive kolonlar korunmalıdır.
3. Dolu production DB'de baseline zinciri körlemesine çalıştırılmaz. README'nin
   baseline benimseme prosedürü izlenir; yerel push DB'de migration çalıştırılmaz.
4. Production ortamıyla hazırlanan deployment test edilir. Sekiz orijinal,
   sekiz önizleme, Next Image, kart/galeri ve iki showroom sahnesi başarılı
   olmadan canlı düzeltme tamamlandı sayılmaz.

Yerel veritabanı incelemede boştu (medya/proje/model/hizmet/kullanıcı sayıları 0).
Dosyaların indirilmesi CMS kayıtlarını veya ilişkileri taşımaz. Public içeriğin
yerel kopyasını kurmak ayrı bir içerik aktarımı gerektirir; canlı DB'nin özel
verileri veya admin hesapları aktarılmadı.

## Doğrulama ve mevcut durum

- `pnpm typecheck` ve `pnpm lint` başarılı.
- `pnpm test:int -- tests/int/showroom.int.spec.ts`: 19/19 başarılı. Testler
  sahip olunan origin'i, başka hesap/credential/query/fragment reddini ve Vercel
  yükleme sınırını kapsar.
- `pnpm build` başarılı; yerel production sunucusunda 16 Blob dosyası Next Image
  üzerinden HTTP 200 ile işlenip Sharp ile okunabildi. Başka Blob hesabı HTTP 400
  ile reddedildi. Kurtarma önizlemesinde sekiz görsel tarayıcıda yüklendi.
- Görsel önizleme: Git dışındaki `.tools/media-recovery/recovered-preview.html`
  ve `recovered-preview.png`; test sonucu `verification.json`.
- Bu doğrulama canlı kart/galeri/showroom testinin yerine geçmez. Canlıya henüz
  yayın yapılmadı ve production migration'ı çalıştırılmadı: bağlı Vercel hesabı
  `mert-b131` ekibine erişemiyor (403); ekip yetkilendirmesi 404 döndü. Kullanıcı
  onayı için resmî Vercel CLI cihaz girişi başlatıldı. Yetkili girişten sonra
  yukarıdaki kontrollü yayın ve canlı doğrulama tamamlanmalıdır.
