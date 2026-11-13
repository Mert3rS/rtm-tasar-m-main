import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProjectGallery } from '@/components/portfolio/ProjectGallery'
import { ProjectInformation } from '@/components/portfolio/ProjectInformation'
import { ProjectCard } from '@/components/portfolio/ProjectCard'
import { getProjectBySlug, getRelatedProjects } from '@/lib/projectData'
import { portfolioMetadata } from '@/lib/seo'
import { projectHref } from '@/lib/portfolioQuery'
import { getShowroomForProject, showroomHref } from '@/lib/showroomData'
import { TrackInterest } from '@/components/personalization/TrackInterest'
import { InterestCards } from '@/components/personalization/InterestCards'
import { projectInterestSignals } from '@/lib/personalization/signals'
import { TextAnimate } from '@/components/site/TextAnimate'
import { getPublicSiteSettings } from '@/lib/siteSettings'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProjectBySlug((await params).slug)
  if (!project) notFound()
  return portfolioMetadata({
    title: project.seoTitle || `${project.title} | RTM Tasarım`,
    description:
      project.seoDescription || project.description || `${project.title} — RTM Tasarım projesi.`,
    path: projectHref(project.slug),
    image: project.seoImage || project.cover,
  })
}

export default async function ProjectPage({ params }: Props) {
  const project = await getProjectBySlug((await params).slug)
  if (!project) notFound()
  const [related, showroom, settings] = await Promise.all([
    getRelatedProjects(project),
    getShowroomForProject(project.numericId),
    getPublicSiteSettings(),
  ])
  // Repeating a cover in the CMS gallery does not create duplicate slides.
  const photos = [...(project.cover ? [project.cover] : []), ...project.gallery].filter(
    (image, index, all) => all.findIndex((item) => item.url === image.url) === index,
  )
  return (
    <main id="main-content" className="project-detail-page" data-rtm-edit={`projects:${project.numericId}`} data-rtm-label={`${project.title} · Proje detayı`}>
      <TrackInterest k="project" s={project.slug} l={project.title.slice(0, 80)} sig={projectInterestSignals(project)} />
      <header className="site-shell project-detail-heading">
        <Link className="text-link back-to-portfolio" href="/projeler">
          <span aria-hidden="true">←</span>Tüm projeler
        </Link>
        <div className="project-title-row">
          <div>
            <p className="eyebrow">
              {project.categories.map(({ name }) => name).join(' / ') || 'RTM Tasarım / Proje'}
            </p>
            <TextAnimate animation="blurInUp" as="h1" by="word" duration={0.64}>
              {project.title}
            </TextAnimate>
          </div>
          <TextAnimate animation="fadeIn" as="p" by="text" className="section-intro" delay={0.14}>
            {[project.cityName, project.countryName].filter(Boolean).join(' / ')}
          </TextAnimate>
        </div>
      </header>
      <div className="site-shell project-cover-wrap">
        {project.cover ? (
          <Image
            alt={project.cover.alt}
            className="project-cover-image"
            width={project.cover.width}
            height={project.cover.height}
            sizes="(min-width: 1440px) 1328px, 94vw"
            loading="eager"
            src={project.cover.url}
            data-rtm-edit={`projects:${project.numericId}`}
            data-rtm-field="coverImage"
            data-rtm-label={`${project.title} · Kapak görseli`}
          />
        ) : (
          <div className="project-cover-missing">
            <span className="micro-label">Proje görseli hazırlanıyor</span>
          </div>
        )}
      </div>
      <ProjectInformation project={project} />
      {showroom ? (
        <Link
          aria-label={`${showroom.title} 360° showroom’unu keşfedin`}
          className="site-shell project-showroom-cta"
          href={showroomHref(showroom.slug)}
        >
          <div>
            <p className="eyebrow">{settings.siteCopy.projectTourEyebrow}</p>
            <TextAnimate animation="slideUp" as="h2" by="word" duration={0.54}>
              {settings.siteCopy.projectTourHeading}
            </TextAnimate>
            <p className="section-intro">{settings.siteCopy.projectTourDescription}</p>
          </div>
          <span className="button-primary">
            {settings.siteCopy.projectTourButton}<span aria-hidden="true">↗</span>
          </span>
        </Link>
      ) : null}
      <ProjectGallery images={photos} title={project.title} editor={{ target: `projects:${project.numericId}`, field: 'gallery' }} />
      {related.length ? (
        <section aria-labelledby="related-heading" className="related-projects section-space">
          <div className="site-shell">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Keşfetmeye devam edin</p>
                <TextAnimate animation="blurInUp" as="h2" by="text" duration={0.6} id="related-heading">
                  Diğer Projelerimizi <em>Keşfedin</em>
                </TextAnimate>
              </div>
              <Link href="/projeler" className="text-link">
                Tüm projeler ↗
              </Link>
            </div>
            <div className="related-project-grid">
              {related.map((item, index) => (
                <ProjectCard index={index} key={item.id} project={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <InterestCards variant="detail" exclude={{ type: 'project', slug: project.slug }} />
      <div className="site-shell project-return">
        <Link href="/iletisim" className="text-link">
          Benzer Bir Proje İçin Teklif Alın ↗
        </Link>
        <Link href="/projeler" className="button-primary">
          Portföye dön<span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  )
}
