import type { PortfolioFilters, PortfolioQuery } from '@/types/portfolio'

function single(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : ''
}

export function parsePortfolioQuery(query: PortfolioQuery): PortfolioFilters {
  const rawPage = single(query.sayfa)
  const page = /^\d{1,6}$/.test(rawPage) ? Number(rawPage) : 1
  // Values are always parameterized by Payload. Limit their size before querying.
  return {
    category: single(query.kategori).slice(0, 120),
    country: single(query.ulke).slice(0, 120),
    city: single(query.sehir).slice(0, 120),
    page: Math.max(1, page),
  }
}

export function portfolioHref(filters: PortfolioFilters, page = filters.page) {
  const query = new URLSearchParams()
  if (filters.category) query.set('kategori', filters.category)
  if (filters.country) query.set('ulke', filters.country)
  if (filters.city) query.set('sehir', filters.city)
  if (page > 1) query.set('sayfa', String(page))
  return `/projeler${query.size ? `?${query.toString()}` : ''}`
}

export function projectHref(slug: string) {
  return `/projeler/${encodeURIComponent(slug)}`
}
