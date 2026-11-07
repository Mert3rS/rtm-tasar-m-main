'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import type { GlobeCity } from '@/types/globe'
import { projectHref } from '@/lib/portfolioQuery'

export function CityProjectPanel({ city, onClose }: { city: GlobeCity; onClose: () => void }) {
  const [projectIndex, setProjectIndex] = useState(0)
  const project = city.projects[projectIndex]

  return (
    <section aria-label={`${city.name} projeleri`} className="city-project-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="micro-label accent">{city.countryName}</p>
          <h2 className="mt-1 text-2xl tracking-tight">{city.name}</h2>
          <p className="muted mt-1 text-xs">{city.projectCount} yayındaki proje</p>
        </div>
        <button
          aria-label="Kapat ve başlangıç görünümüne dön"
          className="icon-button panel-close"
          onClick={onClose}
          type="button"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
          >
            <path d="m6 6 12 12M6 18 18 6" />
          </svg>
        </button>
      </div>
      {project ? (
        <article className="mt-5">
          <Link
            aria-label={`${project.title} projesini inceleyin`}
            className="panel-image relative block aspect-[16/9] overflow-hidden"
            href={projectHref(project.slug)}
          >
            {project.coverImage ? (
              <Image
                alt={project.coverImage.alt}
                className="object-cover"
                fill
                sizes="(min-width: 768px) 320px, 90vw"
                src={project.coverImage.url}
              />
            ) : (
              <span className="image-placeholder micro-label">Görsel hazırlanıyor</span>
            )}
          </Link>
          <h3 className="mt-4 text-lg tracking-tight">
            <Link href={projectHref(project.slug)}>{project.title}</Link>
          </h3>
          {project.description ? (
            <p className="muted mt-2 line-clamp-3 text-sm leading-relaxed">{project.description}</p>
          ) : null}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
            <Link className="micro-label accent" href={projectHref(project.slug)}>
              Projeyi incele ↗
            </Link>
            {city.projects.length > 1 ? (
              <div aria-label="Proje seçimi" className="project-pagination">
                <button
                  aria-label="Önceki proje"
                  className="icon-button"
                  onClick={() =>
                    setProjectIndex(
                      (projectIndex + city.projects.length - 1) % city.projects.length,
                    )
                  }
                  type="button"
                >
                  ←
                </button>
                <span className="text-xs tabular-nums">
                  {projectIndex + 1} / {city.projects.length}
                </span>
                <button
                  aria-label="Sonraki proje"
                  className="icon-button"
                  onClick={() => setProjectIndex((projectIndex + 1) % city.projects.length)}
                  type="button"
                >
                  →
                </button>
              </div>
            ) : null}
          </div>
        </article>
      ) : null}
    </section>
  )
}
