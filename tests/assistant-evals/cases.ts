import type { ConversationContext, PageContext } from '@/lib/assistant/types'

export type EvalCase = {
  q: string
  /** One acceptable intent or a list of acceptable intents/fallbacks. */
  expect: string | string[]
  lang?: 'tr' | 'en'
  page?: PageContext
  context?: ConversationContext
  /** Extra assertion keys checked by the runner. */
  entity?: Record<string, string>
  note?: string
}

const FALLBACK = ['fallback', 'clarify']

export const evalCases: EvalCase[] = [
  // Selamlama / kimlik
  { q: 'Merhaba', expect: 'greeting' },
  { q: 'selam, nasılsınız?', expect: 'greeting' },
  { q: 'iyi günler', expect: 'greeting' },
  { q: 'Teşekkürler!', expect: 'thanks' },
  { q: 'çok sağolun yardımınız için', expect: 'thanks' },
  { q: 'görüşürüz', expect: 'goodbye' },
  { q: 'Sen bot musun?', expect: 'identity' },
  { q: 'gerçek bir insanla mı konuşuyorum', expect: 'identity' },
  // Hizmetler
  { q: 'Hangi hizmetleri veriyorsunuz?', expect: 'services' },
  { q: 'hizmetleriniz neler', expect: 'services' },
  { q: 'neler yapıyorsunuz?', expect: 'services' },
  { q: 'iç mimari hizmeti var mı', expect: 'services', entity: { service: 'demo-ic-mimari' } },
  { q: 'mutfak uygulama hizmetiniz hakkında bilgi', expect: 'services', entity: { service: 'demo-mutfak-uygulama' } },
  { q: 'hizmetlerinz neler acaba', expect: 'services', note: 'yazım hatası' },
  // Projeler
  { q: "Berlin'de projeniz var mı?", expect: 'projects', entity: { city: 'berlin' } },
  { q: 'istanbuldaki projeleriniz', expect: 'projects', entity: { city: 'istanbul' } },
  { q: 'İSTANBUL PROJELERİ', expect: 'projects', entity: { city: 'istanbul' } },
  { q: 'Almanya da iş yaptınız mı', expect: 'projects', entity: { country: 'almanya' } },
  { q: 'projelerinizi görmek istiyorum', expect: 'projects' },
  { q: 'yaptığınız işler', expect: ['projects', 'flow:examples'] },
  { q: 'referanslarınız neler', expect: 'projects' },
  { q: 'mutfak projeleri', expect: 'projects', entity: { projectCategory: 'mutfak' } },
  { q: 'Ankarada projeniz varmı', expect: 'projects', entity: { city: 'ankara' }, note: 'CMS şehri var, proje yok' },
  { q: 'Paris projeleriniz var mı', expect: 'projects', note: 'bilinmeyen şehir' },
  { q: 'öne çıkan projeleriniz', expect: 'featured_projects' },
  { q: 'projelerınız', expect: 'projects', note: 'ı/i karışması' },
  { q: 'izmir', expect: 'projects', entity: { city: 'izmir' } },
  // Modeller
  { q: 'mutfak modelleri', expect: 'models' },
  { q: 'gardırop modelleriniz var mı', expect: 'models' },
  { q: 'gardirop modelleri', expect: 'models' },
  { q: 'GARDIROP MODELLERİ', expect: 'models' },
  { q: 'katalog görebilir miyim', expect: 'models' },
  { q: 'tasarım modellerinizi gösterir misiniz', expect: 'models' },
  { q: 'DEMO Gardırop A hakkında bilgi', expect: 'models', entity: { model: 'demo-gardirop-a' } },
  { q: 'modellerinz', expect: 'models' },
  // Showroom
  { q: 'showroom var mı', expect: 'showroom' },
  { q: '360 derece tur', expect: 'showroom' },
  { q: 'sanal tur nasıl yapılıyor', expect: 'showroom' },
  // Atölye
  { q: 'kendi dolabımı tasarlamak istiyorum', expect: 'studio' },
  { q: 'Kendim tasarlamak istiyorum', expect: 'studio' },
  { q: 'tasarım atölyesi nasıl çalışıyor', expect: 'studio' },
  { q: 'üç boyutlu tasarım yapabilir miyim', expect: 'studio' },
  { q: 'konfigüratör nerede', expect: 'studio' },
  { q: 'pdf nasıl indiririm', expect: 'studio' },
  { q: 'tasarımımı nasıl paylaşırım bağlantı', expect: 'studio' },
  { q: 'kulp seçebilir miyim', expect: 'studio' },
  { q: 'insan ölçeği ne işe yarıyor', expect: 'studio' },
  { q: 'duvar rengini değiştirebilir miyim', expect: 'studio' },
  { q: 'bu çizim cnc için kullanılabilir mi', expect: 'studio' },
  { q: 'gardırop tasarla', expect: 'studio' },
  { q: 'bölme nasıl eklenir', expect: 'studio', page: { kind: 'studio' } },
  { q: 'iç düzeni nasıl değiştiririm', expect: 'studio', page: { kind: 'studio' } },
  { q: 'tasarla mutfak dolabı', expect: 'studio' },
  // Teklif
  { q: 'teklif almak istiyorum', expect: 'quote' },
  { q: 'Nasıl teklif alırım?', expect: 'quote' },
  { q: 'sipariş vermek istiyorum', expect: 'quote' },
  { q: 'fiyat teklifi almak istiyorum', expect: 'quote' },
  { q: 'teklf formu', expect: 'quote', note: 'yazım hatası' },
  // İletişim
  { q: 'telefon numaranız nedir', expect: 'contact' },
  { q: 'size nasıl ulaşabilirim', expect: 'contact' },
  { q: 'adresiniz nerede', expect: 'contact' },
  { q: 'whatsapp hattınız var mı', expect: 'contact' },
  { q: 'iletisim', expect: 'contact' },
  { q: 'mail adresiniz', expect: 'contact' },
  // Hakkımızda
  { q: 'firmanız hakkında bilgi', expect: 'about' },
  { q: 'kimsiniz', expect: ['about', 'identity'] },
  // Fiyat / süre / garanti / stok / saat
  { q: 'gardırop fiyatı ne kadar', expect: 'pricing' },
  { q: 'kaç para', expect: 'pricing' },
  { q: 'metrekare fiyatınız nedir', expect: 'pricing' },
  { q: 'indirim var mı', expect: 'pricing' },
  { q: 'ne zaman teslim edersiniz', expect: 'delivery' },
  { q: 'üretim kaç gün sürer', expect: 'delivery' },
  { q: 'garanti veriyor musunuz', expect: 'warranty' },
  { q: 'stokta var mı', expect: 'stock' },
  { q: 'çalışma saatleriniz', expect: 'hours' },
  { q: 'randevu alabilir miyim', expect: 'hours' },
  // Admin cevabı önceliği ve SSS
  { q: 'showroomunuzu ziyaret edebilir miyim', expect: 'answer:hours', note: 'admin cevabı yerleşik davranıştan önce' },
  { q: 'akrilik kapak nasıl temizlenir', expect: 'answer:general' },
  { q: 'laminat ile lake farkı nedir', expect: 'faq' },
  { q: 'ölçü alırken nelere dikkat etmeliyim', expect: 'faq' },
  // Gizlilik
  { q: 'çerezleri nasıl kapatırım', expect: 'privacy' },
  { q: 'kvkk aydınlatma metni', expect: 'privacy' },
  // Kişisel veri
  { q: 'benim mailim ali@example.com bana dönün', expect: 'personal_data' },
  { q: 'numaram 0555 123 45 67 arar mısınız', expect: 'personal_data' },
  // Site dışı / uygunsuz / danışmanlık
  { q: 'bugün hava durumu nasıl', expect: 'off_topic' },
  { q: 'dün akşamki maçın skoru', expect: 'off_topic' },
  { q: 'bana python kodu yaz', expect: 'off_topic' },
  { q: 'avukat tavsiye eder misiniz', expect: 'advice' },
  { q: 'salak bot', expect: 'inappropriate' },
  // Rehberli akışlar
  { q: 'projeme nereden başlamalıyım', expect: 'flow:start' },
  { q: 'bana yardım eder misin', expect: 'flow:start' },
  { q: 'örnek işlerinizi görmek istiyorum', expect: ['flow:examples', 'projects'] },
  // CMS'te olmayan bilgi / anlaşılmayan
  { q: 'yapay çim döşüyor musunuz', expect: FALLBACK },
  { q: 'asdkjh qwe', expect: FALLBACK },
  { q: 'ekip üyelerinizin isimleri', expect: ['about', ...FALLBACK] },
  // Eş anlamlı (admin)
  { q: 'komodin modelleri', expect: ['models', ...FALLBACK] },
  // Sadece varlık
  { q: 'mutfak', expect: ['clarify', 'models', 'projects'] },
  { q: 'gardirob', expect: ['clarify', 'models', 'studio'] },
  { q: 'mutfk', expect: ['clarify', 'models', 'projects'], note: 'yazım hatası' },
  // Sayfa bağlamı
  { q: 'bu proje nerede', expect: 'page_context', page: { kind: 'project', slug: 'demo-berlin-mutfak' } },
  { q: 'benzer projeler var mı', expect: 'page_context', page: { kind: 'project', slug: 'demo-izmir-ofis' } },
  { q: 'bu modelin kategorisi ne', expect: 'page_context', page: { kind: 'model', slug: 'demo-gardirop-a' } },
  // Bağlam takibi
  { q: 'Peki İstanbul?', expect: 'projects', context: { lastIntent: 'projects', entities: { city: 'berlin' } }, entity: { city: 'istanbul' } },
  { q: 'peki gardırop?', expect: 'models', context: { lastIntent: 'models', entities: { modelCategory: 'mutfak-modelleri' } } },
  { q: 'ya izmir', expect: 'projects', context: { lastIntent: 'projects' }, entity: { city: 'izmir' } },

  // English
  { q: 'Hello', expect: 'greeting', lang: 'en' },
  { q: 'hi there', expect: 'greeting', lang: 'en' },
  { q: 'thank you', expect: 'thanks', lang: 'en' },
  { q: 'What services do you offer?', expect: 'services', lang: 'en' },
  { q: 'Show me your projects', expect: 'projects', lang: 'en' },
  { q: 'Do you have projects in Berlin?', expect: 'projects', lang: 'en', entity: { city: 'berlin' } },
  { q: 'How can I contact you?', expect: 'contact', lang: 'en' },
  { q: 'What is your phone number', expect: 'contact', lang: 'en' },
  { q: 'I want a quote', expect: 'quote', lang: 'en' },
  { q: 'Can I design my own wardrobe?', expect: 'studio', lang: 'en' },
  { q: 'How does the configurator work?', expect: 'studio', lang: 'en' },
  { q: 'How much does a kitchen cost?', expect: 'pricing', lang: 'en' },
  { q: 'Are you a bot?', expect: 'identity', lang: 'en' },
  { q: 'virtual tour', expect: 'showroom', lang: 'en' },
  { q: 'goodbye', expect: 'goodbye', lang: 'en' },
  { q: 'cookie settings', expect: 'privacy', lang: 'en' },
  // Desteklenmeyen dil
  { q: 'Hallo, ich habe eine Frage und brauche Hilfe', expect: 'unsupported_language' },
  { q: 'Здравствуйте, у вас есть проекты?', expect: 'unsupported_language' },
]
