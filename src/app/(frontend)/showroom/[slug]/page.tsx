import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ShowroomExperience } from '@/components/showroom/ShowroomExperience'
import { ProjectDescription } from '@/components/portfolio/ProjectDescription'
import { getShowroomBySlug, showroomHref } from '@/lib/showroomData'
import { portfolioMetadata } from '@/lib/seo'
import { projectHref } from '@/lib/portfolioQuery'
import { TrackInterest } from '@/components/personalization/TrackInterest'
import { TextAnimate } from '@/components/site/TextAnimate'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const showroom = await getShowroomBySlug((await params).slug)
  if (!showroom) notFound()
  return portfolioMetadata({
    title: showroom.seoTitle || `${showroom.title} — Dijital Showroom | RTM Tasarım`,
    description: showroom.seoDescription || showroom.shortDescription,
    path: showroomHref(showroom.slug),
    image: showroom.seoImage || showroom.cover,
  })
}

export default async function ShowroomPage({ params }: Props) {
  const showroom = await getShowroomBySlug((await params).slug)
  if (!showroom) notFound()
  return (
    <main className="showroom-detail-page" id="main-content" data-rtm-edit={`showrooms:${showroom.id}`} data-rtm-label={`${showroom.title} · Showroom`}>
      <TrackInterest k="showroom" s={showroom.slug} l={showroom.title.slice(0, 80)} />
      <header className="site-shell showroom-detail-heading">
        <Link className="text-link" href="/showroom">
          ← Tüm showroom’lar
        </Link>
        <div className="showroom-heading-row">
          <div>
            <p className="eyebrow">Dijital showroom / İnteraktif deneyim</p>
            <TextAnimate animation="blurInUp" as="h1" by="word" duration={0.64}>
              {showroom.title}
            </TextAnimate>
          </div>
          <TextAnimate
            animation="fadeIn"
            as="p"
            by="text"
            className="section-intro"
            delay={0.14}
            duration={0.68}
          >
            {showroom.shortDescription}
          </TextAnimate>
        </div>
      </header>
      <div className="site-shell">
        <ShowroomExperience scenes={showroom.scenes} />
      </div>
      <section className="site-shell showroom-description-section">
        <div>
          <Link className="text-link mb-8" href="/iletisim">
            Bu Tasarım İçin Bilgi Alın ↗
          </Link>
          {showroom.description ? (
            <>
              <p className="eyebrow">Mekân hakkında</p>
              <ProjectDescription content={showroom.description} />
            </>
          ) : null}
        </div>
        {showroom.relatedProject ? (
          <div className="showroom-related-project">
            <p className="micro-label accent">İlgili proje</p>
            <TextAnimate animation="slideUp" as="h2" by="word" duration={0.54}>
              {showroom.relatedProject.title}
            </TextAnimate>
            <Link className="text-link" href={projectHref(showroom.relatedProject.slug)}>
              Portföy projesini inceleyin ↗
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  )
}
