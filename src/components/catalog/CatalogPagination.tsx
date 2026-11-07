import Link from 'next/link'

export function CatalogPagination({
  page,
  totalPages,
  href,
}: {
  page: number
  totalPages: number
  href: (page: number) => string
}) {
  if (totalPages < 2) return null
  return (
    <nav className="portfolio-pagination" aria-label="Katalog sayfaları">
      {page > 1 ? <Link href={href(page - 1)}>← Önceki</Link> : null}
      <span className="micro-label muted mx-4">
        {page} / {totalPages}
      </span>
      {page < totalPages ? <Link href={href(page + 1)}>Sonraki →</Link> : null}
    </nav>
  )
}
