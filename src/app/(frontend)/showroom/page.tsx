import { PageIntro } from '@/components/site/PageIntro'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShowroomCard } from '@/components/showroom/ShowroomCard'
import { getShowroomsPage } from '@/lib/showroomData'
import { portfolioMetadata } from '@/lib/seo'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = await searchParams
  return portfolioMetadata({
    title: 'Dijital Showroom | RTM Tasarım',
    description: 'RTM Tasarım mekânlarını 360 derece panoramik sanal turlarla keşfedin.',
    path: '/showroom',
    noindex: Object.keys(query).length > 0,
  })
}

export default async function ShowroomsPage({ searchParams }: Props) {
  const query = await searchParams
  const page =
    typeof query.sayfa === 'string' && /^\d{1,6}$/.test(query.sayfa)
      ? Math.max(1, Number(query.sayfa))
      : 1
  const result = await getShowroomsPage(page)
  if (page > Math.max(result.totalPages, 1))
    redirect(`/showroom${result.totalPages > 1 ? `?sayfa=${result.totalPages}` : ''}`)
  return (
    <main className="showroom-list-page" id="main-content">
      <PageIntro
        number="04"
        eyebrow="DİJİTAL DENEYİM"
        title={
          <>
            Dijital
            <br />
            Showroom<span className="accent">.</span>
          </>
        }
        description="Ekranın ötesine geçin. Mekânların detaylarını interaktif bir deneyimle inceleyin."
      />
      <section aria-label="Showroom koleksiyonu" className="site-shell showroom-archive">
        {result.showrooms.length ? (
          <div className="showroom-grid">
            {result.showrooms.map((showroom) => (
              <ShowroomCard key={showroom.id} showroom={showroom} />
            ))}
          </div>
        ) : (
          <div className="archive-empty showroom-empty">
            <span className="showroom-empty-mark" aria-hidden="true">
              360°
            </span>
            <p className="eyebrow">Yeni bir perspektif hazırlanıyor</p>
            <h2>
              Mekânlarımızı yakında
              <br />
              <em>birlikte keşfedeceğiz.</em>
            </h2>
            <p>360° showroom deneyimlerimiz yayınlandığında burada yer alacak.</p>
            <Link href="/projeler" className="text-link">
              Projelerimizi keşfedin ↗
            </Link>
          </div>
        )}
        {result.totalPages > 1 ? (
          <nav aria-label="Showroom sayfaları" className="portfolio-pagination">
            {page > 1 ? (
              <Link
                aria-label="Önceki showroom sayfası"
                href={page === 2 ? '/showroom' : `/showroom?sayfa=${page - 1}`}
              >
                ←
              </Link>
            ) : null}
            <span className="muted mx-4 text-sm">
              {page} / {result.totalPages}
            </span>
            {page < result.totalPages ? (
              <Link aria-label="Sonraki showroom sayfası" href={`/showroom?sayfa=${page + 1}`}>
                →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    </main>
  )
}
