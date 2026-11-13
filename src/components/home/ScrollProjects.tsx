'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ProjectCardData } from '@/types/portfolio'
import { projectHref } from '@/lib/portfolioQuery'
import { useHomeMotion } from './HomeMotion'

/** Normal document flow with directional reveals; every project remains reachable without sticky scroll. */
export function ScrollProjects({ projects }: { projects: ProjectCardData[] }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const motion = useHomeMotion()

  useEffect(() => {
    const root = rootRef.current
    if (!root || !motion || !('IntersectionObserver' in window)) return
    const items = root.querySelectorAll<HTMLElement>('.project-timeline-item')
    root.dataset.enhanced = 'true'
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue
          entry.target.dataset.visible = 'true'
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
    )
    items.forEach((item) => observer.observe(item))
    return () => {
      observer.disconnect()
      delete root.dataset.enhanced
      items.forEach((item) => delete item.dataset.visible)
    }
  }, [motion, projects])

  return (
    <div className="project-timeline" ref={rootRef} aria-label="Seçili proje zaman çizgisi">
      {projects.map((project, index) => (
        <article className="project-timeline-item" key={project.id} data-rtm-edit={`projects:${project.id}`} data-rtm-field="coverImage" data-rtm-label={`${project.title} · Seçili işler fotoğrafı`}>
          <Link
            className="project-timeline-card-link"
            href={projectHref(project.slug)}
            aria-label={`${project.title} projesini incele`}
          />
          <div className="project-timeline-copy">
            <div className="project-scroll-copy">
              <p className="eyebrow">
                {String(index + 1).padStart(2, '0')} /{' '}
                {[project.cityName, project.countryName].filter(Boolean).join(' · ') ||
                  'RTM TASARIM'}
              </p>
              <h3>{project.title}</h3>
              {project.description ? (
                <p className="project-scroll-description">{project.description}</p>
              ) : null}
              <span className="project-scroll-link" aria-hidden="true">
                Projeyi incele{' '}
                <svg aria-hidden="true" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="15" />
                  <path d="M8 16h15m-7-7 7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
          <div className="project-timeline-image">
            <div className="project-scroll-photo">
              {project.coverImage ? (
                <Image
                  src={project.coverImage.url}
                  alt={project.coverImage.alt}
                  fill
                  sizes="(min-width: 900px) 54vw, 92vw"
                  className="object-cover"
                />
              ) : (
                <span className="image-placeholder micro-label">Görsel hazırlanıyor</span>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
