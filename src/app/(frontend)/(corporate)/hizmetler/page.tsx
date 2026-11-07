import { PageIntro } from '@/components/site/PageIntro'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServicesPage, CATALOG_PAGE_SIZE } from '@/lib/catalogData'
import { catalogHref, parseModelQuery } from '@/lib/catalogQuery'
import { portfolioMetadata } from '@/lib/seo'
import { CorporateCTA } from '@/components/catalog/CorporateCTA'
import { CatalogPagination } from '@/components/catalog/CatalogPagination'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
export async function generateMetadata({ searchParams }: Props) {
  const query = await searchParams
  return portfolioMetadata({
    title: 'Hizmetlerimiz | RTM Tasarım',
    description: 'Mekânların ihtiyaçlarına özel tasarım ve uygulama çözümleri.',
    path: '/hizmetler',
    noindex: Object.keys(query).length > 0,
  })
}
export default async function ServicesPage({ searchParams }: Props) {
  const { page } = parseModelQuery(await searchParams)
  const result = await getServicesPage(page)
  if (page > Math.max(1, result.totalPages))
    redirect(result.totalPages > 1 ? `/hizmetler?sayfa=${result.totalPages}` : '/hizmetler')
  return (
    <main id="main-content" className="corporate-list-page">
      <PageIntro
        number="03"
        eyebrow="ÇALIŞMA ALANLARIMIZ"
        title={
          <>
            Tasarımdan
            <br />
            uygulamaya<span className="accent">.</span>
          </>
        }
        description="Mekânların ihtiyaçlarına özel tasarım ve uygulama çözümleri."
      />
      <section className="site-shell service-editorial-list" aria-label="Hizmetler">
        {result.services.length ? (
          result.services.map((service, index) => (
            <article key={service.id} className="service-editorial-row">
              <Link
                className="service-editorial-image"
                href={catalogHref('service', service.slug)}
                aria-label={`${service.title} hizmetini incele`}
              >
                {service.cover ? (
                  <Image
                    alt={service.cover.alt}
                    src={service.cover.thumbnailUrl || service.cover.url}
                    fill
                    sizes="(min-width: 1024px) 48vw, 90vw"
                    className="object-cover"
                  />
                ) : (
                  <span className="catalog-image-empty micro-label">Görsel hazırlanıyor</span>
                )}
              </Link>
              <div className="service-editorial-copy">
                <span className="micro-label accent">
                  {String((page - 1) * CATALOG_PAGE_SIZE + index + 1).padStart(2, '0')} / Hizmet
                </span>
                <h2>{service.title}</h2>
                {service.shortDescription ? (
                  <p className="section-intro">{service.shortDescription}</p>
                ) : null}
                <Link className="text-link" href={catalogHref('service', service.slug)}>
                  Hizmeti İnceleyin ↗
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="archive-empty">
            <p className="eyebrow">Hizmetlerimiz hazırlanıyor</p>
            <h2>Birlikte yeni mekânlara.</h2>
            <p>Çalışma alanlarımıza ilişkin bilgiler yayınlandığında burada yer alacak.</p>
          </div>
        )}
        <CatalogPagination
          page={page}
          totalPages={result.totalPages}
          href={(number) => (number > 1 ? `/hizmetler?sayfa=${number}` : '/hizmetler')}
        />
      </section>
      <CorporateCTA />
    </main>
  )
}
