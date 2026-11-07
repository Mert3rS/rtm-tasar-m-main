import { PageIntro } from '@/components/site/PageIntro'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CatalogCard } from '@/components/catalog/CatalogCard'
import { CatalogPagination } from '@/components/catalog/CatalogPagination'
import { CorporateCTA } from '@/components/catalog/CorporateCTA'
import { getModelsPage, CATALOG_PAGE_SIZE } from '@/lib/catalogData'
import { modelsHref, parseModelQuery } from '@/lib/catalogQuery'
import { portfolioMetadata } from '@/lib/seo'
import { ArchiveInterestChip } from '@/components/personalization/ArchiveInterestChip'
import { TrackInterest } from '@/components/personalization/TrackInterest'
import { ArchiveMotion } from '@/components/site/ArchiveMotion'
import { ModelFilters } from '@/components/catalog/ModelFilters'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
export async function generateMetadata({ searchParams }: Props) {
  const query = await searchParams
  return portfolioMetadata({
    title: 'Modellerimiz | RTM Tasarım',
    description: 'Farklı ihtiyaçlara ve yaşam alanlarına özel tasarım seçeneklerini keşfedin.',
    path: '/modeller',
    noindex: Object.values(query).some((value) => value !== undefined && value !== ''),
  })
}
export default async function ModelsPage({ searchParams }: Props) {
  const filters = parseModelQuery(await searchParams)
  const result = await getModelsPage(filters)
  if (filters.page > Math.max(result.totalPages, 1))
    redirect(modelsHref(filters, Math.max(result.totalPages, 1)))
  const known = result.categories.some((category) => category.slug === filters.category)
  const activeCategory = result.categories.find((category) => category.slug === filters.category)
  return (
    <ArchiveMotion
      className="corporate-list-page models-page"
      motionKey={`${filters.category}-${filters.page}`}
    >
      <PageIntro
        number="02"
        eyebrow="TASARIM KOLEKSİYONU"
        title={
          <>
            Modellerimiz<span className="accent">.</span>
          </>
        }
        description="Farklı ihtiyaçlara ve yaşam alanlarına özel tasarım seçeneklerini keşfedin."
      />
      {activeCategory ? (
        <TrackInterest
          k="filter"
          s={`modeller-${activeCategory.slug}`.slice(0, 120)}
          l={activeCategory.name.slice(0, 80)}
          sig={[{ t: 'modelCategory', s: activeCategory.slug, l: activeCategory.name.slice(0, 80) }]}
        />
      ) : null}
      <ArchiveInterestChip archive="models" current={filters.category} />
      <section className="site-shell catalog-archive" aria-label="Model kataloğu">
        <ModelFilters
          categories={result.categories}
          category={filters.category}
          known={known}
        />
        <div className="portfolio-results-heading" data-archive-reveal>
          <span className="micro-label">
            {filters.category ? 'Seçiminize göre' : 'Tüm modeller'}
          </span>
          <span className="muted text-xs">{result.totalDocs} model</span>
        </div>
        {result.models.length ? (
          <div className="catalog-grid">
            {result.models.map((model, index) => (
              <CatalogCard
                key={model.id}
                item={model}
                index={(filters.page - 1) * CATALOG_PAGE_SIZE + index}
              />
            ))}
          </div>
        ) : (
          <div className="archive-empty">
            <span className="empty-architectural-mark" aria-hidden="true">
              +
            </span>
            <p className="eyebrow">
              {filters.category ? 'Aramaya devam' : 'Koleksiyon hazırlanıyor'}
            </p>
            <h2>
              {filters.category
                ? 'Bu kategoride henüz bir model yok.'
                : 'Yeni tasarımlara yer açıyoruz.'}
            </h2>
            <p>Yayınlanan tasarım modellerini burada keşfedebilirsiniz.</p>
            {filters.category ? (
              <Link href="/modeller" className="text-link">
                Tüm modellere dön ↗
              </Link>
            ) : null}
          </div>
        )}
        <div data-archive-reveal>
          <CatalogPagination
            page={filters.page}
            totalPages={result.totalPages}
            href={(page) => modelsHref(filters, page)}
          />
        </div>
      </section>
      <div data-archive-reveal>
        <CorporateCTA />
      </div>
    </ArchiveMotion>
  )
}
