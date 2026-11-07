import type { AnswerTopic } from './topics'

export type IntentId =
  | 'greeting'
  | 'thanks'
  | 'goodbye'
  | 'identity'
  | 'services'
  | 'projects'
  | 'featured_projects'
  | 'models'
  | 'showroom'
  | 'studio'
  | 'quote'
  | 'contact'
  | 'about'
  | 'pricing'
  | 'delivery'
  | 'warranty'
  | 'stock'
  | 'hours'
  | 'privacy'
  | 'start_flow'
  | 'examples_flow'
  | 'page_context'
  | 'general_info'

export type IntentDefinition = {
  id: IntentId
  topic: AnswerTopic
  /** Concept tokens (see vocabulary.ts) with weights. */
  keywords: Record<string, number>
  /** Folded phrases matched against the normalised message. */
  phrases?: string[]
  /** Example utterances (Turkish + English) for token-overlap similarity. */
  examples: string[]
}

export const intents: IntentDefinition[] = [
  {
    id: 'greeting',
    topic: 'general',
    keywords: { selam: 2.6 },
    examples: ['merhaba', 'selam nasılsınız', 'iyi günler', 'hello', 'hi there'],
  },
  {
    id: 'thanks',
    topic: 'general',
    keywords: { tesekkur: 2.8 },
    examples: ['teşekkür ederim', 'çok sağolun', 'thanks a lot', 'thank you'],
  },
  {
    id: 'goodbye',
    topic: 'general',
    keywords: { gorusuruz: 2.8 },
    examples: ['görüşürüz', 'hoşça kalın', 'iyi çalışmalar', 'goodbye', 'bye'],
  },
  {
    id: 'identity',
    topic: 'general',
    keywords: { bot: 2.8 },
    phrases: ['sen kimsin', 'kiminle konusuyorum', 'gercek biri', 'insan misin'],
    examples: ['sen bot musun', 'gerçek bir insanla mı konuşuyorum', 'are you a bot', 'who are you'],
  },
  {
    id: 'services',
    topic: 'services',
    keywords: { hizmet: 2.6, icmimari: 1.2 },
    phrases: ['ne is yapiyorsunuz', 'neler yapiyorsunuz', 'ne yapiyorsunuz', 'what do you do'],
    examples: [
      'hangi hizmetleri veriyorsunuz',
      'hizmetleriniz neler',
      'iç mimari hizmeti var mı',
      'what services do you offer',
    ],
  },
  {
    id: 'projects',
    topic: 'projects',
    keywords: { proje: 2.4, ornek: 0.8 },
    examples: [
      'projelerinizi görmek istiyorum',
      'berlinde projeniz var mı',
      'istanbuldaki projeler',
      'mutfak projeleri',
      'show me your projects',
      'do you have projects in berlin',
    ],
  },
  {
    id: 'featured_projects',
    topic: 'projects',
    keywords: { proje: 1.2, oneri: 1.8 },
    examples: ['öne çıkan projeleriniz', 'en iyi işleriniz', 'featured projects'],
  },
  {
    id: 'models',
    topic: 'models',
    keywords: { model: 2.4 },
    examples: [
      'tasarım modelleriniz',
      'mutfak modelleri',
      'gardırop modelleri var mı',
      'katalog görebilir miyim',
      'show me your models',
    ],
  },
  {
    id: 'showroom',
    topic: 'showroom',
    keywords: { showroom: 2.6 },
    examples: ['showroom var mı', '360 derece tur', 'sanal tur nasıl', 'virtual tour'],
  },
  {
    id: 'studio',
    topic: 'studio',
    keywords: {
      atolye: 2.6,
      bolme: 1.4,
      icduzen: 1.3,
      kulp: 1.4,
      pdf: 1.4,
      paylas: 1.1,
      insanolcegi: 1.6,
      mekanrengi: 1.3,
      cnc: 1.6,
      kapak: 0.9,
      olcu: 0.7,
    },
    phrases: ['kendi mobilyami', 'kendim tasarla', 'kendi dolabimi', 'design my own', 'design it myself'],
    examples: [
      'kendi dolabımı tasarlamak istiyorum',
      'tasarım atölyesi nasıl çalışıyor',
      'pdf nasıl indiririm',
      'üç boyutlu tasarım yapabilir miyim',
      'kulp seçebilir miyim',
      'can i design my own wardrobe',
      'how does the configurator work',
    ],
  },
  {
    id: 'quote',
    topic: 'quote',
    keywords: { teklif: 2.7, gonder: 0.4 },
    phrases: ['teklif almak', 'teklif istiyorum', 'get a quote', 'request a quote'],
    examples: [
      'teklif almak istiyorum',
      'nasıl teklif alırım',
      'sipariş vermek istiyorum',
      'teklif formu nasıl işliyor',
      'i want a quote',
    ],
  },
  {
    id: 'contact',
    topic: 'contact',
    keywords: { iletisim: 2.6 },
    phrases: ['size nasil ulasirim', 'nasil ulasabilirim', 'how can i contact', 'how do i reach'],
    examples: [
      'telefon numaranız nedir',
      'size nasıl ulaşabilirim',
      'adresiniz nerede',
      'whatsapp hattınız var mı',
      'how can i contact you',
    ],
  },
  {
    id: 'about',
    topic: 'about',
    keywords: { hakkimizda: 2.5 },
    examples: ['firmanız hakkında bilgi', 'kimsiniz', 'şirketiniz ne zaman kuruldu', 'about your company'],
  },
  {
    id: 'pricing',
    topic: 'pricing',
    keywords: { fiyat: 3 },
    examples: ['gardırop fiyatı ne kadar', 'kaç para', 'metrekare fiyatınız', 'how much does it cost'],
  },
  {
    id: 'delivery',
    topic: 'delivery',
    keywords: { teslim: 2.8 },
    examples: ['ne zaman teslim edersiniz', 'üretim kaç gün sürer', 'montaj süresi', 'how long is delivery'],
  },
  {
    id: 'warranty',
    topic: 'warranty',
    keywords: { garanti: 3 },
    examples: ['garanti veriyor musunuz', 'kaç yıl garanti', 'do you offer warranty'],
  },
  {
    id: 'stock',
    topic: 'stock',
    keywords: { stok: 2.8 },
    examples: ['stokta var mı', 'hazır ürününüz var mı', 'is it in stock'],
  },
  {
    id: 'hours',
    topic: 'hours',
    keywords: { randevu: 2.8 },
    examples: ['çalışma saatleriniz', 'randevu alabilir miyim', 'kaçta açıksınız', 'opening hours'],
  },
  {
    id: 'privacy',
    topic: 'privacy',
    keywords: { cerez: 2.8 },
    examples: ['çerezleri nasıl kapatırım', 'kvkk aydınlatma metni', 'verilerim saklanıyor mu', 'cookie settings'],
  },
  {
    id: 'start_flow',
    topic: 'general',
    keywords: { nereden: 2.4 },
    phrases: ['nereden baslamaliyim', 'nasil baslarim', 'yardim eder misin', 'where do i start'],
    examples: ['projeme nereden başlamalıyım', 'bana yardım eder misin', 'nasıl başlarım', 'where should i start'],
  },
  {
    id: 'examples_flow',
    topic: 'projects',
    keywords: { ornek: 1.6, proje: 0.6 },
    phrases: ['ornek islerinizi', 'yaptiginiz isleri'],
    examples: ['örnek işlerinizi görmek istiyorum', 'yaptığınız işlerden örnek', 'show me examples'],
  },
  {
    id: 'page_context',
    topic: 'projects',
    keywords: {},
    phrases: [
      'bu proje',
      'bu projede',
      'bu projenin',
      'burasi nerede',
      'bu nerede',
      'benzer projeler',
      'benzer proje',
      'bu model',
      'bu hizmet',
      'bu showroom',
      'bunun gibi',
      'this project',
      'similar projects',
      'where is this',
    ],
    examples: ['bu proje nerede', 'benzer projeler var mı', 'bu modelin kategorisi ne'],
  },
  {
    id: 'general_info',
    topic: 'general',
    keywords: { malzeme: 1.6, bakim: 1.8, olcu: 1.2 },
    examples: [
      'laminat ile lake farkı',
      'ölçü nasıl alınır',
      'akrilik kapak bakımı',
      'difference between lacquer and laminate',
    ],
  },
]

export const intentLabels: Record<IntentId, string> = {
  greeting: 'Selamlama',
  thanks: 'Teşekkür',
  goodbye: 'Vedalaşma',
  identity: 'Asistan hakkında',
  services: 'Hizmetler',
  projects: 'Projeler',
  featured_projects: 'Öne çıkan projeler',
  models: 'Tasarım modelleri',
  showroom: 'Showroom',
  studio: 'Tasarım atölyesi',
  quote: 'Teklif',
  contact: 'İletişim',
  about: 'Hakkımızda',
  pricing: 'Fiyat',
  delivery: 'Teslim süresi',
  warranty: 'Garanti',
  stock: 'Stok',
  hours: 'Çalışma saatleri',
  privacy: 'Gizlilik ve çerezler',
  start_flow: 'Nereden başlamalı',
  examples_flow: 'Örnek işler',
  page_context: 'Bu sayfa',
  general_info: 'Genel bilgi',
}

/** Words that clearly indicate an off-site topic. Folded forms. */
export const offTopicWords = new Set([
  'hava',
  'havadurumu',
  'futbol',
  'mac',
  'skor',
  'siyaset',
  'secim',
  'borsa',
  'bitcoin',
  'kripto',
  'doviz',
  'dolar',
  'euro',
  'tarif',
  'dizi',
  'sarki',
  'muzik',
  'odev',
  'python',
  'javascript',
  'burc',
  'fal',
  'weather',
  'football',
  'politics',
  'stock market',
  'recipe',
  'movie',
  'homework',
])
/** Legal/financial/medical advice requests are declined. */
export const adviceWords = new Set([
  'avukat',
  'dava',
  'mahkeme',
  'hukuki',
  'yatirim',
  'doktor',
  'ilac',
  'hastalik',
  'tedavi',
  'lawyer',
  'lawsuit',
  'investment',
  'doctor',
  'medicine',
])
export const inappropriateWords = new Set([
  'amk',
  'aq',
  'siktir',
  'orospu',
  'gerizekali',
  'salak',
  'aptal',
  'fuck',
  'shit',
  'idiot',
  'stupid',
])
