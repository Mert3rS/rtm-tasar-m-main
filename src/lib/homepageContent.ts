// Existing, approved interface copy. No company claims or portfolio records are seeded.
export const HOMEPAGE_DEFAULTS = {
  heroEyebrow: 'RTM / MOBİLYA & MEKÂN',
  heroHeading:
    'Bir mekânın hissini değiştiren detaylar. Özgün formlar, doğal dokular ve hayatına yer açan tasarımlar.',
  heroButton: 'Projeleri keşfet',
  ctaHeading: 'Hayalinizdeki tasarımı',
  ctaEmphasis: 'birlikte hayata geçirelim.',
  ctaDescription: 'Fikrinizi paylaşın; mekânınız için doğru tasarım yönünü birlikte kuralım.',
  atlasHeading: 'Öne çıkan',
  atlasEmphasis: 'tasarımlarımız.',
  atlasDescription: 'Şehirden projeye,\naynı tasarım çizgisinde.',
  projectsHeading: 'Yaşayan',
  projectsEmphasis: 'mekânlar.',
  projectsDescription: 'Her detayında tasarım,\nişçilik ve özgünlük.',
  servicesHeading: 'Fikirden',
  servicesEmphasis: 'mekâna.',
  modelsHeading: 'Form. Doku.',
  modelsEmphasis: 'Karakter.',
  studioHeading: 'Ekranın ötesine',
  studioEmphasis: 'adım atın.',
  studioDescription:
    'Ölçüleri, bölmeleri ve malzemeyi seçin; tasarımınızı üç boyutlu önizlemede adım adım şekillendirin.',
  studioButton: 'Tasarım oluşturmaya başla',
}

export type HomepageCopy = typeof HOMEPAGE_DEFAULTS

export const HOMEPAGE_SECTIONS: Array<{
  label: string
  description: string
  fields: Array<{ name: keyof HomepageCopy; label: string; multiline?: boolean }>
}> = [
  {
    label: '01 · Sinematik açılış / ilk ekran',
    description:
      'Mutfak animasyonunun ilk ekranındaki metinler. Ana başlığın ilk cümlesi büyük başlık, devamı açıklama olarak görünür. Animasyon kareleri ve Mekân / Malzeme / Detay bölüm yazıları uygulama dosyalarından gelir.',
    fields: [
      { name: 'heroEyebrow', label: 'Üstteki küçük başlık' },
      { name: 'heroHeading', label: 'Animasyonun üzerindeki ana başlık ve açıklama', multiline: true },
      { name: 'heroButton', label: 'Projeler sayfasına giden düğmenin metni' },
    ],
  },
  {
    label: '02 · Animasyon kapanışı ve iletişim çağrısı',
    description: 'Başlığın iki satırı hem animasyonun kapanışında hem hemen altındaki iletişim kartında kullanılır. Açıklama yalnızca iletişim kartında görünür.',
    fields: [
      { name: 'ctaHeading', label: 'Başlığın ilk satırı' },
      { name: 'ctaEmphasis', label: 'Başlığın vurgulu satırı' },
      { name: 'ctaDescription', label: 'Düğmelerin üzerindeki açıklama', multiline: true },
    ],
  },
  {
    label: '03 · Küre / proje rotası',
    description:
      'Kürenin ve seçili proje kartının üstündeki bölüm başlığı. Kartın fotoğrafı ve açıklaması ilgili projede düzenlenir.',
    fields: [
      { name: 'atlasHeading', label: 'Bölüm başlığı' },
      { name: 'atlasEmphasis', label: 'Başlığın vurgulu kısmı' },
      { name: 'atlasDescription', label: 'Başlığın yanındaki açıklama', multiline: true },
    ],
  },
  {
    label: '04 · Seçili işler / proje fotoğrafları',
    description: '“Öne çıkar” seçeneği açık yayınlanmış ilk dört projenin gösterildiği bölüm.',
    fields: [
      { name: 'projectsHeading', label: 'Bölüm başlığı' },
      { name: 'projectsEmphasis', label: 'Başlığın vurgulu kısmı' },
      { name: 'projectsDescription', label: 'Bölüm açıklaması', multiline: true },
    ],
  },
  {
    label: '05 · Hizmetler ve model koleksiyonu',
    description:
      'Burada yalnızca bölüm başlıkları değişir. Fotoğrafları ve kart açıklamalarını Hizmetler / Tasarım modelleri kayıtlarında düzenleyin.',
    fields: [
      { name: 'servicesHeading', label: 'Hizmetler başlığı' },
      { name: 'servicesEmphasis', label: 'Hizmetler vurgulu başlık' },
      { name: 'modelsHeading', label: 'Modeller başlığı' },
      { name: 'modelsEmphasis', label: 'Modeller vurgulu başlık' },
    ],
  },
  {
    label: '06 · Dijital tasarım atölyesi tanıtımı',
    description:
      'Ana sayfanın alt kısmındaki atölye tanıtımı. Yanındaki hareketli çizim, uygulamanın sabit tanıtım animasyonudur; müşteri proje fotoğrafı değildir.',
    fields: [
      { name: 'studioHeading', label: 'Başlığın ilk satırı' },
      { name: 'studioEmphasis', label: 'Başlığın vurgulu satırı' },
      { name: 'studioDescription', label: 'Atölye tanıtım açıklaması', multiline: true },
      { name: 'studioButton', label: 'Atölyeyi açan düğmenin metni' },
    ],
  },
]

export function resolveHomepageCopy(
  value?: Partial<Record<keyof HomepageCopy, string | null>> | null,
): HomepageCopy {
  const copy = { ...HOMEPAGE_DEFAULTS }
  for (const section of HOMEPAGE_SECTIONS) {
    for (const { name } of section.fields)
      copy[name] = value?.[name]?.trim() || HOMEPAGE_DEFAULTS[name]
  }
  return copy
}

/** Column-major order matches the actual sticky hero; center always uses the first source. */
export function heroSlots<T>(sources: T[]): Array<T | undefined> {
  return Array.from({ length: 9 }, (_, index) =>
    sources.length ? sources[(index === 4 ? 0 : index + 1) % sources.length] : undefined,
  )
}
