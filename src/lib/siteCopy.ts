export const SITE_COPY_DEFAULTS = {
  navHome: 'Ana Sayfa',
  navProjects: 'Projeler',
  navModels: 'Modeller',
  navStudio: 'Tasarım Oluştur',
  navServices: 'Hizmetler',
  navShowroom: 'Showroom',
  navContact: 'İletişim',
  navQuote: 'Teklif Al',
  footerExploreLabel: 'Keşfedin',
  footerContactLabel: 'İletişim',
  footerContactHeading: 'Yeni bir mekânın\nilk adımı, bir konuşma.',
  footerSignature: 'Mobilya · Mekân · Tasarım',
  projectsEyebrow: 'PROJE ARŞİVİ',
  projectsTitle: 'Projelerimiz',
  projectsDescription: 'Her projede estetik, işlevsellik ve ustalığı bir araya getiriyoruz.',
  modelsEyebrow: 'TASARIM KOLEKSİYONU',
  modelsTitle: 'Modellerimiz',
  modelsDescription: 'Farklı ihtiyaçlara ve yaşam alanlarına özel tasarım seçeneklerini keşfedin.',
  servicesEyebrow: 'ÇALIŞMA ALANLARIMIZ',
  servicesTitle: 'Tasarımdan',
  servicesTitleSecond: 'uygulamaya',
  servicesDescription: 'Mekânların ihtiyaçlarına özel tasarım ve uygulama çözümleri.',
  showroomEyebrow: 'DİJİTAL DENEYİM',
  showroomTitle: 'Dijital',
  showroomTitleSecond: 'Showroom',
  showroomDescription:
    'Ekranın ötesine geçin. Mekânların detaylarını interaktif bir deneyimle inceleyin.',
  contactEyebrow: 'İLETİŞİM',
  contactTitle: 'Birlikte',
  contactTitleSecond: 'tasarlayalım',
  contactDescription: 'Projenizi ve fikirlerinizi bizimle paylaşın. İlk adımı birlikte atalım.',
  quoteEyebrow: 'İLETİŞİME GEÇİN',
  quoteTitle: 'Projenizi',
  quoteTitleSecond: 'konuşalım',
  quoteDescription:
    'Mekânınızın ihtiyaçlarını ve proje fikrinizi paylaşın. İlk görüşme için gerekli bilgileri form üzerinden iletebilirsiniz.',
  corporateCtaEyebrow: 'BİRLİKTE BAŞLAYALIM / RTM TASARIM',
  corporateCtaHeading: 'Hayalinizdeki Mekânı Birlikte Tasarlayalım.',
  corporateCtaDescription:
    'Fikrinizi paylaşın; mekânınız için doğru tasarım yönünü birlikte kuralım.',
  corporateCtaPrimary: 'Projeniz İçin Teklif Alın',
  corporateCtaSecondary: 'Projeleri keşfet',
  projectTourEyebrow: 'MEKÂNIN İÇİNE ADIM ATIN',
  projectTourHeading: 'Mekânın İçinde',
  projectTourDescription:
    'Işığı, ölçeği ve malzemeyi 360° keşfedin. İnteraktif sunum deneyimini açın.',
  projectTourButton: 'Projeyi 360° Keşfedin',
  notFoundEyebrow: '404 / SAYFA BULUNAMADI',
  notFoundHeading: 'Görünüşe göre',
  notFoundEmphasis: 'yolunuzu kaybettiniz.',
  notFoundDescription:
    'Aradığınız sayfa taşınmış, silinmiş veya henüz yayında olmayabilir.',
  notFoundButton: 'Ana sayfaya dön',
} as const

export type SiteCopy = { -readonly [Key in keyof typeof SITE_COPY_DEFAULTS]: string }

export const SITE_COPY_SECTIONS: Array<{
  label: string
  description: string
  fields: Array<{ name: keyof SiteCopy; label: string; multiline?: boolean }>
}> = [
  {
    label: '01 · Menü ve footer',
    description: 'Üst menü, mobil menü ve footer bağlantılarında görünen ortak metinler.',
    fields: [
      { name: 'navHome', label: 'Ana sayfa bağlantısı' },
      { name: 'navProjects', label: 'Projeler bağlantısı' },
      { name: 'navModels', label: 'Modeller bağlantısı' },
      { name: 'navStudio', label: 'Tasarım oluştur bağlantısı' },
      { name: 'navServices', label: 'Hizmetler bağlantısı' },
      { name: 'navShowroom', label: 'Showroom bağlantısı' },
      { name: 'navContact', label: 'İletişim bağlantısı' },
      { name: 'navQuote', label: 'Teklif bağlantısı' },
      { name: 'footerExploreLabel', label: 'Footer keşfet başlığı' },
      { name: 'footerContactLabel', label: 'Footer iletişim başlığı' },
      { name: 'footerContactHeading', label: 'Footer iletişim çağrısı', multiline: true },
      { name: 'footerSignature', label: 'Footer marka satırı' },
    ],
  },
  {
    label: '02 · Arşiv sayfalarının giriş metinleri',
    description: 'Projeler, modeller, hizmetler ve showroom sayfalarının büyük giriş başlıkları.',
    fields: [
      { name: 'projectsEyebrow', label: 'Projeler küçük başlık' },
      { name: 'projectsTitle', label: 'Projeler ana başlık' },
      { name: 'projectsDescription', label: 'Projeler açıklama', multiline: true },
      { name: 'modelsEyebrow', label: 'Modeller küçük başlık' },
      { name: 'modelsTitle', label: 'Modeller ana başlık' },
      { name: 'modelsDescription', label: 'Modeller açıklama', multiline: true },
      { name: 'servicesEyebrow', label: 'Hizmetler küçük başlık' },
      { name: 'servicesTitle', label: 'Hizmetler başlık ilk satır' },
      { name: 'servicesTitleSecond', label: 'Hizmetler başlık ikinci satır' },
      { name: 'servicesDescription', label: 'Hizmetler açıklama', multiline: true },
      { name: 'showroomEyebrow', label: 'Showroom küçük başlık' },
      { name: 'showroomTitle', label: 'Showroom başlık ilk satır' },
      { name: 'showroomTitleSecond', label: 'Showroom başlık ikinci satır' },
      { name: 'showroomDescription', label: 'Showroom açıklama', multiline: true },
    ],
  },
  {
    label: '03 · İletişim ve teklif sayfaları',
    description: 'İletişim ve teklif formu sayfalarının ziyaretçiye görünen giriş metinleri.',
    fields: [
      { name: 'contactEyebrow', label: 'İletişim küçük başlık' },
      { name: 'contactTitle', label: 'İletişim başlık ilk satır' },
      { name: 'contactTitleSecond', label: 'İletişim başlık ikinci satır' },
      { name: 'contactDescription', label: 'İletişim açıklama', multiline: true },
      { name: 'quoteEyebrow', label: 'Teklif küçük başlık' },
      { name: 'quoteTitle', label: 'Teklif başlık ilk satır' },
      { name: 'quoteTitleSecond', label: 'Teklif başlık ikinci satır' },
      { name: 'quoteDescription', label: 'Teklif açıklama', multiline: true },
    ],
  },
  {
    label: '04 · Ortak çağrılar ve 360° proje alanı',
    description: 'Kurumsal sayfalardaki teklif çağrısı ve proje detayındaki 360° tur kartı.',
    fields: [
      { name: 'corporateCtaEyebrow', label: 'Ortak çağrı küçük başlık' },
      { name: 'corporateCtaHeading', label: 'Ortak çağrı ana başlık' },
      { name: 'corporateCtaDescription', label: 'Ortak çağrı açıklama', multiline: true },
      { name: 'corporateCtaPrimary', label: 'Ortak çağrı ana düğme' },
      { name: 'corporateCtaSecondary', label: 'Ortak çağrı ikinci bağlantı' },
      { name: 'projectTourEyebrow', label: '360° kart küçük başlık' },
      { name: 'projectTourHeading', label: '360° kart başlık' },
      { name: 'projectTourDescription', label: '360° kart açıklama', multiline: true },
      { name: 'projectTourButton', label: '360° kart düğmesi' },
    ],
  },
  {
    label: '05 · 404 sayfası',
    description: 'Bulunamayan adreslerde gösterilen hata sayfasının metinleri.',
    fields: [
      { name: 'notFoundEyebrow', label: 'Küçük başlık' },
      { name: 'notFoundHeading', label: 'Ana başlık' },
      { name: 'notFoundEmphasis', label: 'Vurgulu başlık' },
      { name: 'notFoundDescription', label: 'Açıklama', multiline: true },
      { name: 'notFoundButton', label: 'Ana sayfa düğmesi' },
    ],
  },
]

export function resolveSiteCopy(
  value?: Partial<Record<keyof SiteCopy, string | null>> | null,
): SiteCopy {
  const copy = { ...SITE_COPY_DEFAULTS } as SiteCopy
  for (const section of SITE_COPY_SECTIONS) {
    for (const { name } of section.fields) copy[name] = value?.[name]?.trim() || copy[name]
  }
  return copy
}
