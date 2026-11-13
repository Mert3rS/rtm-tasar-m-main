import type { Knowledge } from '@/lib/assistant/types'

/**
 * DEMO knowledge used only by tests/evals. It is never written to the CMS and is not client
 * content; names are obviously synthetic test records.
 */
const rich = (text: string) => ({
  root: {
    type: 'root',
    children: [
      { type: 'paragraph', version: 1, children: [{ type: 'text', text, version: 1 }] },
    ],
    direction: null,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})

export const demoKnowledge: Knowledge = {
  settings: {
    companyName: 'DEMO Atölye',
    email: 'demo@example.com',
    phone: '+90 000 000 00 00',
    whatsappHref: 'https://wa.me/900000000000?text=Merhaba',
    city: 'DEMO şehir',
    socials: [{ label: 'Instagram', href: 'https://instagram.com/demo' }],
    quoteFormEnabled: true,
    contactFormEnabled: true,
    privacyReady: true,
    cookiePolicyReady: true,
  },
  about: { heading: 'DEMO hakkımızda başlığı', subtitle: 'DEMO alt başlık' },
  assistant: { name: 'DEMO Asistan', synonymGroups: [['komodin', 'şifonyer', 'başucu dolabı']] },
  projects: [
    {
      slug: 'demo-berlin-mutfak',
      title: 'DEMO Berlin Mutfağı',
      description: 'DEMO açıklama',
      categories: [{ slug: 'mutfak', name: 'Mutfak' }],
      city: { slug: 'berlin', name: 'Berlin' },
      country: { slug: 'almanya', name: 'Almanya' },
      featured: true,
    },
    {
      slug: 'demo-istanbul-gardirop',
      title: 'DEMO İstanbul Gardırop',
      categories: [{ slug: 'yatak-odasi', name: 'Yatak Odası' }],
      city: { slug: 'istanbul', name: 'İstanbul' },
      country: { slug: 'turkiye', name: 'Türkiye' },
      featured: false,
    },
    {
      slug: 'demo-izmir-ofis',
      title: 'DEMO İzmir Ofis',
      categories: [{ slug: 'ic-mimari', name: 'İç Mimari' }],
      city: { slug: 'izmir', name: 'İzmir' },
      country: { slug: 'turkiye', name: 'Türkiye' },
      featured: false,
    },
  ],
  services: [
    { slug: 'demo-ic-mimari', title: 'İç Mimari Tasarım', description: 'DEMO hizmet açıklaması' },
    { slug: 'demo-mutfak-uygulama', title: 'Mutfak Uygulama', description: 'DEMO mutfak hizmeti' },
  ],
  models: [
    {
      slug: 'demo-gardirop-a',
      title: 'DEMO Gardırop A',
      categories: [{ slug: 'gardirop', name: 'Gardırop' }],
      modelType: 'Render',
    },
    {
      slug: 'demo-mutfak-b',
      title: 'DEMO Mutfak B',
      categories: [{ slug: 'mutfak-modelleri', name: 'Mutfak' }],
    },
  ],
  showrooms: [{ slug: 'demo-showroom', title: 'DEMO Showroom', projectSlug: 'demo-berlin-mutfak' }],
  projectCategories: [
    { slug: 'mutfak', name: 'Mutfak' },
    { slug: 'yatak-odasi', name: 'Yatak Odası' },
    { slug: 'ic-mimari', name: 'İç Mimari' },
  ],
  modelCategories: [
    { slug: 'gardirop', name: 'Gardırop' },
    { slug: 'mutfak-modelleri', name: 'Mutfak' },
  ],
  cities: [
    { slug: 'berlin', name: 'Berlin', countrySlug: 'almanya' },
    { slug: 'istanbul', name: 'İstanbul', countrySlug: 'turkiye' },
    { slug: 'izmir', name: 'İzmir', countrySlug: 'turkiye' },
    { slug: 'ankara', name: 'Ankara', countrySlug: 'turkiye' },
  ],
  countries: [
    { slug: 'almanya', name: 'Almanya' },
    { slug: 'turkiye', name: 'Türkiye' },
  ],
  faqs: [
    {
      id: '1',
      question: 'Laminat ile lake arasındaki fark nedir?',
      answer: rich('DEMO onaylı cevap: laminat/lake karşılaştırması.'),
      text: 'DEMO onaylı cevap: laminat/lake karşılaştırması.',
    },
    {
      id: '2',
      question: 'Ölçü alırken nelere dikkat etmeliyim?',
      answer: rich('DEMO onaylı ölçü alma ipuçları.'),
      text: 'DEMO onaylı ölçü alma ipuçları.',
    },
  ],
  answers: [
    {
      id: '10',
      title: 'Bakım önerileri',
      topic: 'general',
      triggers: ['bakım', 'temizlik'],
      examples: ['akrilik kapak nasıl temizlenir'],
      answer: rich('DEMO onaylı bakım cevabı.'),
      text: 'DEMO onaylı bakım cevabı.',
      actions: [{ kind: 'route', label: 'Teklif al', href: '/iletisim' }],
      priority: 0,
    },
    {
      id: '11',
      title: 'Showroom ziyareti',
      topic: 'hours',
      triggers: ['showroom ziyareti', 'ziyaret saatleri'],
      examples: ['showroomunuzu ziyaret edebilir miyim'],
      answer: rich('DEMO onaylı ziyaret cevabı.'),
      text: 'DEMO onaylı ziyaret cevabı.',
      actions: [],
      priority: 5,
    },
  ],
}

/** Knowledge with nothing published: the assistant must not invent anything. */
export const emptyKnowledge: Knowledge = {
  settings: {
    companyName: 'RTM Tasarım',
    socials: [],
    quoteFormEnabled: true,
    contactFormEnabled: true,
    privacyReady: false,
    cookiePolicyReady: false,
  },
  assistant: { name: 'Asistan', synonymGroups: [] },
  projects: [],
  services: [],
  models: [],
  showrooms: [],
  projectCategories: [],
  modelCategories: [],
  cities: [],
  countries: [],
  faqs: [],
  answers: [],
}
