/** Public routes and native editors allowed by the visual content studio. No arbitrary URLs. */
export const VISUAL_PAGES = [
  {
    id: 'home',
    title: 'Ana Sayfa',
    path: '/',
    editor: 'site-settings',
    hint: 'Sinematik açılış, bölüm metinleri ve yedek görsel',
  },
  {
    id: 'projects',
    title: 'Projeler',
    path: '/projeler',
    editor: 'projects',
    hint: 'Kapak, açıklama ve proje galerileri',
  },
  {
    id: 'models',
    title: 'Modeller',
    path: '/modeller',
    editor: 'design-models',
    hint: 'Model kapakları, metinleri ve galerileri',
  },
  {
    id: 'studio',
    title: 'Tasarım Oluştur',
    path: '/tasarim-olustur',
    editor: null,
    hint: 'Etkileşimli atölye uygulaması; ürün seçenekleri uygulama kodunda yönetilir.',
  },
  {
    id: 'services',
    title: 'Hizmetler',
    path: '/hizmetler',
    editor: 'services',
    hint: 'Hizmet kapakları ve açıklamaları',
  },
  {
    id: 'showroom',
    title: 'Showroom',
    path: '/showroom',
    editor: 'showrooms',
    hint: 'Showroom kapakları; 360° görseller Showroom sahnelerinde yönetilir.',
  },
  {
    id: 'about',
    title: 'Hakkımızda',
    path: '/hakkimizda',
    editor: 'about-page',
    hint: 'Şirket, hikâye, ekip ve görseller',
  },
  {
    id: 'contact',
    title: 'İletişim',
    path: '/iletisim',
    editor: 'site-settings',
    hint: 'İletişim bilgileri, sosyal medya ve form ayarları',
  },
  {
    id: 'cookies',
    title: 'Çerez Politikası',
    path: '/cerez-politikasi',
    editor: 'site-settings',
    hint: 'Onaylı politika, sürüm ve çerez tercihleri',
  },
] as const

const collections = new Set([
  'projects',
  'services',
  'design-models',
  'showrooms',
  'showroom-scenes',
  'media',
])
const globals = new Set(['site-settings', 'about-page', 'assistant-settings'])

export function visualEditorPath(target: string): string | null {
  if (globals.has(target)) return `/globals/${target}`
  const [collection, id, extra] = target.split(':')
  if (!collections.has(collection) || extra !== undefined) return null
  if (id === undefined) return `/collections/${collection}`
  if (!/^[1-9]\d*$/.test(id)) return null
  return `/collections/${collection}/${id}`
}

export function isPreviewPath(pathname: string): boolean {
  return VISUAL_PAGES.some(
    ({ path }) => pathname === path || (path !== '/' && pathname.startsWith(`${path}/`)),
  )
}
