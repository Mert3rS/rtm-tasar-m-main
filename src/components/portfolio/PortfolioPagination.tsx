import Link from 'next/link'
import { portfolioHref } from '@/lib/portfolioQuery'
import type { PortfolioFilters } from '@/types/portfolio'

export function PortfolioPagination({
  filters,
  totalPages,
}: {
  filters: PortfolioFilters
  totalPages: number
}) {
  if (totalPages < 2) return null
  const pages = Array.from(
    new Set([1, ...Array.from({ length: 5 }, (_, index) => filters.page + index - 2), totalPages]),
  )
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
  return (
    <nav aria-label="Proje sayfaları" className="portfolio-pagination">
      {filters.page > 1 ? (
        <Link aria-label="Önceki sayfa" href={portfolioHref(filters, filters.page - 1)}>
          ←
        </Link>
      ) : null}
      {pages.map((page, index) => (
        <span className="pagination-item" key={page}>
          {index > 0 && page - pages[index - 1] > 1 ? (
            <span className="pagination-gap">…</span>
          ) : null}
          <Link
            aria-current={page === filters.page ? 'page' : undefined}
            href={portfolioHref(filters, page)}
          >
            {page}
          </Link>
        </span>
      ))}
      {filters.page < totalPages ? (
        <Link aria-label="Sonraki sayfa" href={portfolioHref(filters, filters.page + 1)}>
          →
        </Link>
      ) : null}
    </nav>
  )
}
