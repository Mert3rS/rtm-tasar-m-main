/**
 * Link allowlist shared by CMS validation, the response engine and the client renderer.
 * Assistant actions may only point to known internal route patterns, approved Site Settings
 * links (resolved server-side) or the consent preferences panel.
 */

const slug = '[a-z0-9]+(?:-[a-z0-9]+)*'
export const internalRoutePatterns: RegExp[] = [
  /^\/$/,
  new RegExp(`^/projeler(?:/${slug})?$`),
  new RegExp(`^/hizmetler(?:/${slug})?$`),
  new RegExp(`^/modeller(?:/${slug})?$`),
  new RegExp(`^/showroom(?:/${slug})?$`),
  /^\/teklif-al$/,
  /^\/iletisim$/,
  /^\/tasarim-olustur$/,
  /^\/hakkimizda$/,
  /^\/sss$/,
  /^\/cerez-politikasi$/,
]
const queryKeys = new Set(['kategori', 'ulke', 'sehir', 'sayfa', 'urun'])

/** Validates an internal href (path + optional whitelisted query/hash). Returns the safe href. */
export function safeInternalHref(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 300 || /[\u0000- \\]/.test(value))
    return undefined
  if (!value.startsWith('/') || value.startsWith('//')) return undefined
  let url: URL
  try {
    url = new URL(value, 'https://internal.invalid')
  } catch {
    return undefined
  }
  if (url.origin !== 'https://internal.invalid') return undefined
  if (!internalRoutePatterns.some((pattern) => pattern.test(url.pathname))) return undefined
  for (const [key, val] of url.searchParams) {
    if (!queryKeys.has(key) || !/^[a-z0-9-]{1,80}$/.test(val)) return undefined
  }
  if (url.hash && !/^#[a-z0-9-]{1,60}$/.test(url.hash)) return undefined
  return `${url.pathname}${url.search}${url.hash}`
}

export const settingsLinkKeys = [
  'whatsapp',
  'email',
  'phone',
  'maps',
  'instagram',
  'facebook',
  'linkedin',
  'youtube',
  'privacyNotice',
  'cookiePolicy',
] as const
export type SettingsLinkKey = (typeof settingsLinkKeys)[number]

export const settingsLinkLabels: Record<SettingsLinkKey, string> = {
  whatsapp: "WhatsApp'tan yazın",
  email: 'E-posta gönderin',
  phone: 'Telefonla arayın',
  maps: 'Haritada görün',
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  privacyNotice: 'Aydınlatma metni',
  cookiePolicy: 'Çerez politikası',
}

/** Final client-side guard for rendered hrefs from the structured response. */
export function safeRenderedHref(
  value: unknown,
  approvedExternal: ReadonlySet<string>,
): string | undefined {
  const internal = safeInternalHref(value)
  if (internal) return internal
  if (typeof value !== 'string') return undefined
  return approvedExternal.has(value) ? value : undefined
}
