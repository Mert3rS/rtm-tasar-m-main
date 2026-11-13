import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const privacyNoticeContent = `Son güncelleme: 11 Kasım 2026

1. Veri sorumlusu
6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında veri sorumlusu RTM Tasarım’dır. Kişisel verilerle ilgili iletişim adresi rtmtasarim@gmail.com’dur. Fiziksel başvuru adresi kesinleştiğinde bu metin güncellenecektir.

2. İşlenen kişisel veriler
İletişim ve teklif formları üzerinden ad-soyad, e-posta adresi, telefon numarası, tercih edilen iletişim yöntemi, mesaj konusu ve içeriği; teklif taleplerinde ayrıca proje kategorisi, proje şehri, yaklaşık alan, belirtilen bütçe aralığı, ölçü veya numune talepleri işlenebilir. Ziyaretçinin kendi isteğiyle eklediği proje görselleri ile mobilya ön tasarım bilgileri de başvuruyla ilişkilendirilebilir. Form güvenliği için gönderim zamanı, tekilleştirilmiş gönderim anahtarı ve ham e-posta veya IP adresini içermeyen takma adlı hız sınırı kayıtları tutulur. Formlarda özel nitelikli kişisel veri paylaşılmamalıdır.

3. İşleme amaçları
Veriler yalnızca iletişim veya teklif talebini almak, talebi değerlendirmek, talep sahibiyle seçtiği kanal üzerinden iletişim kurmak, proje görüşmesini yürütmek, mükerrer veya kötüye kullanıma yönelik gönderimleri önlemek, sistem güvenliğini sağlamak ve gerektiğinde hukuki yükümlülükleri yerine getirmek amacıyla işlenir. Bu formlar üzerinden reklam, pazarlama, otomatik karar verme veya kullanıcı profili oluşturma faaliyeti yürütülmez.

4. Hukuki sebepler
Kişisel veriler elektronik ortamda doğrudan ilgili kişiden toplanır. İşleme faaliyeti, talebin niteliğine göre KVKK’nın 5. maddesindeki bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olma, veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi, bir hakkın tesisi, kullanılması veya korunması ve ilgili kişinin temel haklarına zarar vermemek kaydıyla veri sorumlusunun meşru menfaati hukuki sebeplerine dayanır. Aydınlatma metninin sunulması açık rıza talebi değildir.

5. Verilerin aktarılması
Verilere yalnızca talebi yönetmekle görevli yetkili RTM Tasarım kullanıcıları erişir. Formun teknik olarak işletilmesi için veriler, barındırma hizmeti sağlayıcısı Vercel’e ve Vercel Marketplace üzerinden bağlanacak PostgreSQL veritabanı sağlayıcısı Neon’a; e-posta bildirimi etkinleştirilirse yapılandırılan e-posta hizmeti sağlayıcısına; hukuki zorunluluk bulunması hâlinde yetkili kamu kurumlarına ve yargı mercilerine amaçla sınırlı olarak aktarılabilir. Yurt dışına aktarım gerektiren bir altyapı kullanılması hâlinde aktarım, KVKK’nın 9. maddesindeki şartlardan uygun olanı sağlanmadan production ortamında etkinleştirilmez.

6. Saklama süresi
İletişim ve teklif formu kayıtları ile başvuruya bağlı özel dosyalar, gönderim tarihinden itibaren en fazla 30 gün saklanır ve bu sürenin sonunda günlük otomatik bakım göreviyle silinir. Süresi dolmamış kayıtlar da ilgili kişinin hukuka uygun silme talebinin kabul edilmesi veya işleme amacının daha erken ortadan kalkması hâlinde silinebilir. Hız sınırı kayıtları güvenlik amacıyla daha kısa sürelerle tutulur ve süreleri dolduğunda temizlenir.

7. Veri güvenliği
Form gönderimleri sunucu tarafında doğrulanır; istek boyutu sınırlandırılır ve Origin kontrolü, imzalı ziyaretçi belirteci, sahte alan tuzağı, tekilleştirme anahtarı ve atomik hız sınırı uygulanır. Başvurular herkese açık değildir ve yalnızca kimliği doğrulanmış yönetici hesaplarınca görülebilir. Kişisel veriler URL’ye, tarayıcı kalıcı depolamasına, analitik sistemine veya uygulama loglarına yazılmaz.

8. İlgili kişinin hakları
KVKK’nın 11. maddesi kapsamında kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi isteme, işleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme, aktarılan tarafları bilme, eksik veya yanlış verilerin düzeltilmesini isteme, Kanundaki şartları oluştuğunda silme veya yok etme talep etme, düzeltme ve silme işlemlerinin aktarılan taraflara bildirilmesini isteme, yalnızca otomatik sistemlerle yapılan analiz sonucu aleyhinize bir durum oluşmasına itiraz etme ve hukuka aykırı işleme nedeniyle zararınızın giderilmesini talep etme haklarına sahipsiniz.

9. Başvuru yöntemi
KVKK kapsamındaki talepler, konu satırına “KVKK Başvurusu” yazılarak rtmtasarim@gmail.com adresine iletilebilir. Başvurunun e-posta ile yapılması hâlinde, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ uyarınca daha önce RTM Tasarım’a bildirilmiş ve sistemde kayıtlı e-posta adresinin kullanılması gerekir. Başvuruda ad-soyad, talep konusu ve başvuruyu doğrulamaya yetecek bilgiler bulunmalıdır; gereksiz kişisel veri paylaşılmamalıdır. KVKK’nın 13. maddesi ve ilgili Tebliğdeki diğer geçerli başvuru yöntemleri de kullanılabilir. Fiziksel başvuru kanalı, gerçek iş adresi kesinleştiğinde ayrıca yayımlanacaktır.

10. Güncellemeler
İşleme amaçları, saklama süresi, iletişim bilgileri veya kullanılan altyapı sağlayıcıları değişirse bu metin veri toplanmadan önce güncellenir. Güncel metne sitenin footer alanından, iletişim formundan ve KVKK aydınlatma sayfasından erişilebilir.`

async function main() {
  const payload = await getPayload({ config })
  await payload.updateGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    depth: 0,
    data: {
      companyName: 'RTM Tasarım',
      contactEmail: 'rtmtasarim@gmail.com',
      instagramUrl: 'https://www.instagram.com/rtmtasarim/',
      notificationRecipientEmail: 'rtmtasarim@gmail.com',
      address: null,
      city: null,
      country: null,
      contactFormEnabled: true,
      quoteFormEnabled: true,
      privacyNoticeContent,
      privacyNoticeUrl: null,
    },
  })
  payload.logger.info('Onaylanan iletişim ve KVKK ayarları kaydedildi.')
}

await main()
process.exit(0)
