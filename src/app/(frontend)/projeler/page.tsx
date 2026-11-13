import { PageIntro } from '@/components/site/PageIntro'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ProjectCard } from '@/components/portfolio/ProjectCard'
import { PortfolioFilters } from '@/components/portfolio/PortfolioFilters'
import { ArchiveInterestChip } from '@/components/personalization/ArchiveInterestChip'
import { TrackInterest } from '@/components/personalization/TrackInterest'
import { PortfolioPagination } from '@/components/portfolio/PortfolioPagination'
import { getPortfolioPage, PROJECT_PAGE_SIZE } from '@/lib/projectData'
import { parsePortfolioQuery, portfolioHref } from '@/lib/portfolioQuery'
import { portfolioMetadata } from '@/lib/seo'
import type { PortfolioQuery } from '@/types/portfolio'
import { ArchiveMotion } from '@/components/site/ArchiveMotion'
import { getPublicSiteSettings } from '@/lib/siteSettings'

type Props = { searchParams: Promise<PortfolioQuery> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = await searchParams
  const settings = await getPublicSiteSettings()
  return portfolioMetadata({
    title: `${settings.siteCopy.projectsTitle} | ${settings.companyName}`,
    description: settings.siteCopy.projectsDescription,
    path: '/projeler',
    noindex: Object.values(query).some((value) => value !== undefined && value !== ''),
  })
}

export default async function PortfolioPage({ searchParams }: Props) {
  const settings = await getPublicSiteSettings()
  const filters = parsePortfolioQuery(await searchParams)
  const result = await getPortfolioPage(filters)
  if (filters.page > Math.max(result.totalPages, 1))
    redirect(portfolioHref(filters, Math.max(result.totalPages, 1)))
  const filtered = Boolean(filters.category || filters.country || filters.city)
  // Interest signal from applied filters (published CMS options only; unknown values are ignored).
  const category = result.options.categories.find((item) => item.slug === filters.category)
  const country = result.options.countries.find((item) => item.slug === filters.country)
  const city = result.options.cities.find((item) => item.slug === filters.city)
  const filterSignals = [
    ...(category ? [{ t: 'projectCategory' as const, s: category.slug, l: category.name.slice(0, 80) }] : []),
    ...(country ? [{ t: 'country' as const, s: country.slug, l: country.name.slice(0, 80) }] : []),
    ...(city ? [{ t: 'city' as const, s: city.slug, l: city.name.slice(0, 80) }] : []),
  ]
  return (
    <ArchiveMotion
      className="portfolio-page"
      motionKey={`${filters.category}-${filters.country}-${filters.city}-${filters.page}`}
    >
      <PageIntro
        number="01"
        eyebrow={settings.siteCopy.projectsEyebrow}
        title={
          <>
            {settings.siteCopy.projectsTitle}<span className="accent">.</span>
          </>
        }
        description={settings.siteCopy.projectsDescription}
      />
      {filterSignals.length ? (
        <TrackInterest
          k="filter"
          s={`projeler-${filterSignals.map(({ s }) => s).join('-')}`.slice(0, 120)}
          l={filterSignals.map(({ l }) => l).join(' · ').slice(0, 80)}
          sig={filterSignals}
        />
      ) : null}
      <ArchiveInterestChip archive="projects" current={filters.category} />
      <section aria-label="Proje arşivi" className="site-shell portfolio-archive">
        <div className="archive-reveal-block" data-archive-reveal>
          <PortfolioFilters filters={filters} options={result.options} />
        </div>
        <div className="portfolio-results-heading" data-archive-reveal>
          <div>
            <span className="micro-label">{filtered ? 'Seçiminize göre' : 'Tüm projeler'}</span>
            <span aria-hidden="true" className="portfolio-results-line" />
          </div>
          <span className="portfolio-results-count">
            <strong>{result.totalDocs}</strong>
            <span>proje</span>
          </span>
        </div>
        {result.projects.length ? (
          <div className="project-gallery">
            {result.projects.map((project, index) => (
              <ProjectCard
                index={(filters.page - 1) * PROJECT_PAGE_SIZE + index}
                key={project.id}
                project={project}
                variant="archive"
              />
            ))}
          </div>
        ) : (
          <div className="archive-empty">
            <span aria-hidden="true" className="empty-architectural-mark">
              +
            </span>
            <p className="eyebrow">{filtered ? 'Aramaya devam' : 'Portföyümüz hazırlanıyor'}</p>
            <h2>
              {filtered ? 'Bu seçimde henüz bir proje yok.' : 'Yeni mekânlar, yeni hikâyeler.'}
            </h2>
            <p>
              {filtered
                ? 'Filtreleri değiştirerek diğer projelerimizi keşfedebilirsiniz.'
                : 'Yayınlanan projelerimizi burada bulabileceksiniz.'}
            </p>
            {filtered ? (
              <Link className="text-link" href="/projeler">
                Tüm projelere dön ↗
              </Link>
            ) : (
              <Link className="text-link" href="/">
                Ana sayfayı keşfedin ↗
              </Link>
            )}
          </div>
        )}
        <div data-archive-reveal>
          <PortfolioPagination filters={filters} totalPages={result.totalPages} />
        </div>
      </section>
    </ArchiveMotion>
  )
}
