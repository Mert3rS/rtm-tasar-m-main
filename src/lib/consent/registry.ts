/**
 * Single source of truth for every cookie / Web Storage key the public site uses.
 * Consent checks, revocation cleanup and the cookie policy table all read this file.
 * Add a row here before introducing any new browser storage; the ESLint rule forbids
 * direct Web Storage access outside `src/lib/consent/storage.ts`.
 *
 * Classification is a conservative technical proposal and must be approved by the
 * client's legal counsel. It is not a legal compliance guarantee.
 */

export const consentCategories = [
  'necessary',
  'functional',
  'personalization',
  'analytics',
  'marketing',
] as const
export type ConsentCategory = (typeof consentCategories)[number]
export type OptionalCategory = Exclude<ConsentCategory, 'necessary'>
export const optionalCategories = [
  'functional',
  'personalization',
  'analytics',
  'marketing',
] as const satisfies readonly OptionalCategory[]

export type StorageKind = 'cookie' | 'localStorage' | 'sessionStorage'

export type StorageEntry = {
  name: string
  kind: StorageKind
  provider: string
  purpose: string
  duration: string
  category: ConsentCategory
  /** HttpOnly cookies are set by the server and cannot be deleted from the browser. */
  httpOnly?: boolean
  /** Needs explicit legal review before it can be treated as exempt. */
  legalReview?: string
}

export type CategoryInfo = {
  id: ConsentCategory
  title: string
  description: string
  example: string
  /** Hidden when no storage of this category exists in the codebase. */
  inUse: boolean
}

const firstParty = 'RTM Tasarım (birinci taraf)'

export const storageRegistry: StorageEntry[] = [
  {
    name: 'rtm-studio-summary-v1',
    kind: 'sessionStorage',
    provider: firstParty,
    purpose: 'Bu sekmedeki atölye özet paneli tercihi.',
    duration: 'Sekme kapanana kadar',
    category: 'necessary',
  },
  {
    name: 'rtm-studio-hint-v1',
    kind: 'sessionStorage',
    provider: firstParty,
    purpose: 'İlk sahne etkileşiminden sonra kullanım ipucunu gizler.',
    duration: 'Sekme kapanana kadar',
    category: 'necessary',
  },
  {
    name: 'rtm-consent',
    kind: 'cookie',
    provider: firstParty,
    purpose:
      'Çerez tercihlerinizi, politika sürümünü ve anonim izin kimliğini saklar; seçiminizin tekrar sorulmamasını sağlar.',
    duration: '12 ay',
    category: 'necessary',
  },
  {
    name: 'rtm-inquiry-visitor',
    kind: 'cookie',
    provider: firstParty,
    purpose:
      'Teklif/iletişim formu ve asistan isteklerini kötüye kullanıma karşı korumak için rastgele, anonim güvenlik kimliği.',
    duration: '30 gün',
    category: 'necessary',
    httpOnly: true,
  },
  {
    name: 'payload-token',
    kind: 'cookie',
    provider: firstParty,
    purpose: 'Yalnızca yönetim paneline giriş yapan yetkililerin oturumu.',
    duration: 'Oturum süresince (Payload ayarı)',
    category: 'necessary',
    httpOnly: true,
  },
  {
    name: 'rtm-assistant-v1',
    kind: 'sessionStorage',
    provider: firstParty,
    purpose:
      'Asistanla yaptığınız sohbeti yalnızca bu sekmede tutar; sekme kapanınca silinir. Sunucuda saklanmaz.',
    duration: 'Sekme kapanana kadar',
    category: 'necessary',
    legalReview:
      'Ziyaretçinin açıkça başlattığı hizmet için gerekli kabul edilmiştir; hukuk danışmanı onayına tabidir.',
  },
  {
    name: 'rtm-assistant-intro-v1',
    kind: 'sessionStorage',
    provider: firstParty,
    purpose:
      'Asistan başlatıcısının tanıtım animasyonunu ve mobil karşılama etiketini bu sekmede bir kez gösterdiğini hatırlar. İçerik veya kişisel veri tutmaz.',
    duration: 'Sekme kapanana kadar',
    category: 'necessary',
    legalReview:
      'Arayüzün aynı sekmede tekrar tekrar dikkat çekmemesi için gerekli kabul edilmiştir; hukuk danışmanı onayına tabidir.',
  },
  {
    name: 'rtm-theme',
    kind: 'localStorage',
    provider: firstParty,
    purpose: 'Açık/koyu tema tercihinizi sonraki ziyaretlerde hatırlar.',
    duration: 'Siz silene kadar',
    category: 'functional',
  },
  {
    name: 'rtm-design-v2',
    kind: 'localStorage',
    provider: firstParty,
    purpose:
      'Tasarım atölyesindeki çalışmanızın yerel yedeği. Kişisel başvuru bilgisi içermez. Paylaşım bağlantısı bundan bağımsız çalışır.',
    duration: 'Siz silene kadar',
    category: 'functional',
  },
  {
    name: 'rtm-studio-guide-v1',
    kind: 'localStorage',
    provider: firstParty,
    purpose: 'Atölye tanıtım rehberini gördüğünüzü hatırlar.',
    duration: 'Siz silene kadar',
    category: 'functional',
  },
  {
    name: 'rtm-studio-scene-v1',
    kind: 'localStorage',
    provider: firstParty,
    purpose: 'Atölyedeki duvar/zemin rengi ve temsili eşya görünüm tercihleri.',
    duration: 'Siz silene kadar',
    category: 'functional',
  },
  {
    name: 'rtm-interest-v1',
    kind: 'localStorage',
    provider: firstParty,
    purpose:
      'Baktığınız yayınlanmış proje, model, hizmet ve kategorilerin kısa listesi (en fazla 50 kayıt, 30 gün). Yalnızca tarayıcınızda tutulur.',
    duration: '30 gün (olay bazında)',
    category: 'personalization',
  },
]

export const categoryInfo: Record<ConsentCategory, CategoryInfo> = {
  necessary: {
    id: 'necessary',
    title: 'Zorunlu',
    description:
      'Sitenin güvenli çalışması, form/asistan kötüye kullanım koruması ve çerez tercihinizin kaydı için gereklidir. Kapatılamaz.',
    example: 'Formunuzun spam korumasıyla güvenle gönderilmesi.',
    inUse: true,
  },
  functional: {
    id: 'functional',
    title: 'İşlevsel / Tercih',
    description:
      'Seçimlerinizi sonraki ziyaretlerde hatırlar. İzin vermezseniz bu özellikler yalnızca açık sekmede çalışır.',
    example: 'Koyu temanın ve atölyedeki tasarımınızın hatırlanması.',
    inUse: true,
  },
  personalization: {
    id: 'personalization',
    title: 'Kişiselleştirme',
    description:
      'Baktığınız içeriklere göre öneriler gösterir. Veriler yalnızca tarayıcınızda tutulur, sunucuda profil oluşturulmaz.',
    example: 'Baktığınız projelere göre öneriler ve asistanda size özel kısayollar.',
    inUse: true,
  },
  analytics: {
    id: 'analytics',
    title: 'Analitik',
    description:
      'Birinci taraf, anonim ve toplu ölçüm: asistanın yanıtlayamadığı soruların maskelenmiş listesi ve yanıt beğeni sayaçları. Tarayıcıda kalıcı kayıt oluşturmaz; ham IP veya kişisel veri tutulmaz.',
    example: 'Asistanın daha iyi cevaplar verecek şekilde geliştirilmesi.',
    inUse: true,
  },
  marketing: {
    id: 'marketing',
    title: 'Pazarlama',
    description: 'Şu anda kullanılmıyor.',
    example: '',
    inUse: false,
  },
}

/** Optional categories shown in the UI: only those backed by real usage. */
export const visibleOptionalCategories = optionalCategories.filter(
  (category) => categoryInfo[category].inUse,
)

export function registryEntry(name: string) {
  return storageRegistry.find((entry) => entry.name === name)
}

export function entriesFor(category: ConsentCategory) {
  return storageRegistry.filter((entry) => entry.category === category)
}
