import type { ModelFilters } from '@/types/catalog'

export function parseModelQuery(
  query: Record<string, string | string[] | undefined>,
): ModelFilters {
  const page =
    typeof query.sayfa === 'string' && /^\d{1,6}$/.test(query.sayfa) ? Number(query.sayfa) : 1
  return {
    category:
      typeof query.kategori === 'string'
        ? query.kategori.slice(0, 120)
        : query.kategori
          ? '!invalid'
          : '',
    page: Math.max(1, page),
  }
}
export function modelsHref(filters: ModelFilters, page = filters.page) {
  const query = new URLSearchParams()
  if (filters.category) query.set('kategori', filters.category)
  if (page > 1) query.set('sayfa', String(page))
  return `/modeller${query.size ? `?${query.toString()}` : ''}`
}
export function catalogHref(kind: 'service' | 'model', slug: string) {
  return `/${kind === 'model' ? 'modeller' : 'hizmetler'}/${encodeURIComponent(slug)}`
}
export function validCatalogSlug(slug: string) {
  return slug.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}
