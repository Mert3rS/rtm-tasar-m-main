import { EditableRegion } from '@/components/site/EditableRegion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowIcon } from '@/components/site/ArrowIcon'
import { projectHref } from '@/lib/portfolioQuery'
import type { ProjectCardData } from '@/types/portfolio'

export function ProjectCard({
  project,
  index = 0,
  variant = 'default',
}: {
  project: ProjectCardData
  index?: number
  variant?: 'default' | 'archive'
}) {
  const archive = variant === 'archive'
  const location = [project.cityName, project.countryName].filter(Boolean).join(' · ')
  const categoryNames = project.categories.map(({ name }) => name).join(' / ')

  return (
    <EditableRegion as="article"
      className={`portfolio-card${archive ? ' portfolio-card--archive' : ''}`}
      data-reveal
      data-rtm-edit={`projects:${project.id}`} data-rtm-label={`${project.title} · Kapak ve açıklamalar`}
      data-rtm-field="coverImage"
    >
      <Link
        aria-label={`${project.title} projesini inceleyin`}
        className="project-card-link"
        href={projectHref(project.slug)}
      >
        <div className="portfolio-image relative overflow-hidden">
          {project.coverImage ? (
            <Image
              alt={project.coverImage.alt}
              className="object-cover"
              fill
              loading={archive && index < 3 ? 'eager' : undefined}
              sizes={
                archive
                  ? '(min-width: 1200px) 30vw, (min-width: 700px) 46vw, 92vw'
                  : '(min-width: 1024px) 50vw, (min-width: 640px) 45vw, 90vw'
              }
              src={project.coverImage.url}
            />
          ) : (
            <span className="image-placeholder micro-label">Görsel hazırlanıyor</span>
          )}
          <div className="project-card-badges">
            <span className="project-index micro-label">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
          <span aria-hidden="true" className="project-card-arrow">
            <ArrowIcon diagonal />
          </span>
        </div>
        {archive ? (
          <div className="portfolio-card-content">
            <div className="portfolio-card-meta micro-label">
              <span>{location || 'Konum bilgisi hazırlanıyor'}</span>
              <span>{String(index + 1).padStart(2, '0')} / RTM</span>
            </div>
            <h3>{project.title}</h3>
            {project.description ? <p className="portfolio-card-description">{project.description}</p> : null}
            <div className="portfolio-card-footer">
              <span className="project-card-categories">{categoryNames || 'Proje'}</span>
              <span className="portfolio-card-cta">
                İncele <span aria-hidden="true">↗</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="portfolio-caption">
            <div>
              <h3>{project.title}</h3>
              <p className="muted mt-2 text-sm">{location}</p>
            </div>
            <span className="micro-label accent">Projeyi incele ↗</span>
          </div>
        )}
      </Link>
      {!archive && project.categories.length ? (
        <p className="project-card-categories">
          {categoryNames}
        </p>
      ) : null}
    </EditableRegion>
  )
}
