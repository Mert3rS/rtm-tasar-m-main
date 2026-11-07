'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { projectMapPoint } from '@/components/map/ProjectMap'
import { projectHref } from '@/lib/portfolioQuery'
import type { GlobeCity } from '@/types/globe'
import type { ProjectCardData } from '@/types/portfolio'
import { TextAnimate } from '@/components/site/TextAnimate'
import { useHomeMotion } from './HomeMotion'

export function FeaturedAtlas({
  cities,
  projects,
}: {
  cities: GlobeCity[]
  projects: ProjectCardData[]
}) {
  const motion = useHomeMotion()
  const entries = useMemo(
    () =>
      projects.flatMap((project) => {
        const city = cities.find((candidate) =>
          candidate.projects.some((item) => item.id === project.id),
        )
        return city ? [{ project, city }] : []
      }),
    [cities, projects],
  )
  const visibleCities = useMemo(
    () => cities.filter((city) => entries.some((entry) => entry.city.id === city.id)),
    [cities, entries],
  )
  const [active, setActive] = useState(0)
  const entry = entries[active % Math.max(entries.length, 1)]

  useEffect(() => {
    if (!motion || entries.length < 2) return
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % entries.length)
    }, 2000)
    return () => window.clearInterval(timer)
  }, [entries.length, motion])

  function selectCity(cityId: string) {
    const next = entries.findIndex((candidate) => candidate.city.id === cityId)
    if (next >= 0) setActive(next)
  }

  return (
    <section className="section-space featured-atlas" aria-labelledby="featured-atlas-heading" id="one-cikan">
      <div className="site-shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 / PROJE ROTASI</p>
            <h2 id="featured-atlas-heading">
              <TextAnimate animation="blurInUp" as="span" by="word" duration={0.55}>
                Öne çıkan
              </TextAnimate>{' '}
              <em>
                <TextAnimate
                  animation="blurInUp"
                  as="span"
                  by="character"
                  delay={0.12}
                  duration={0.48}
                  stagger={0.022}
                >
                  tasarımlarımız.
                </TextAnimate>
              </em>
            </h2>
          </div>
          <TextAnimate animation="fadeIn" as="p" by="line" className="section-intro" delay={0.16}>
            {'Şehirden projeye,\naynı tasarım çizgisinde.'}
          </TextAnimate>
        </div>
        {entry ? (
          <div className="featured-atlas-layout">
            <div className="featured-atlas-map">
              <div className="featured-atlas-map-heading">
                <span className="micro-label">SEÇİLİ ŞEHİR</span>
                <p>
                  {entry.city.name}
                  <span>{entry.city.countryName}</span>
                </p>
                <span className="micro-label">
                  {String(active + 1).padStart(2, '0')} /{' '}
                  {String(entries.length).padStart(2, '0')}
                </span>
              </div>
              <svg
                viewBox="390 30 420 236"
                className="featured-dotted-world"
                aria-label="Öne çıkan projelerin şehir haritası"
                role="group"
              >
                <defs>
                  <mask id="featured-world-dot-mask">
                    <image href="/assets/map/world-dots.svg" width="1000" height="440" />
                  </mask>
                </defs>
                <rect
                  width="1000"
                  height="440"
                  mask="url(#featured-world-dot-mask)"
                  className="featured-world-land"
                />
                {visibleCities.map((city) => {
                  const point = projectMapPoint(city.lat, city.lng)
                  const selected = city.id === entry.city.id
                  const badgeWidth = Math.min(150, Math.max(82, city.name.length * 7 + 30))
                  const badgeX = point.x > 760 ? -badgeWidth - 18 : 18
                  return (
                    <g
                      key={city.id}
                      transform={`translate(${point.x},${point.y})`}
                      className={`featured-map-marker ${selected ? 'is-active' : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${city.name}, ${city.countryName}`}
                      aria-pressed={selected}
                      onClick={() => selectCity(city.id)}
                      onFocus={() => selectCity(city.id)}
                      onPointerEnter={() => selectCity(city.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          selectCity(city.id)
                        }
                      }}
                    >
                      <circle r="22" className="featured-map-hit" />
                      <circle r={selected ? 12 : 8} className="featured-map-ring" />
                      <circle r={selected ? 4 : 3} className="featured-map-dot" />
                      {selected ? (
                        <g className="featured-map-badge" transform={`translate(${badgeX}, -39)`}>
                          <rect width={badgeWidth} height="29" rx="14.5" />
                          <text x={badgeWidth / 2} y="18.5" textAnchor="middle">
                            {city.name}
                          </text>
                        </g>
                      ) : null}
                    </g>
                  )
                })}
              </svg>
              <div className="featured-atlas-city-list" aria-label="Öne çıkan proje şehirleri">
                {visibleCities.map((city) => (
                  <button
                    type="button"
                    key={city.id}
                    aria-pressed={city.id === entry.city.id}
                    onClick={() => selectCity(city.id)}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>
            <article className="atlas-project-card" key={entry.project.id}>
              <Link
                className="atlas-project-image"
                href={projectHref(entry.project.slug)}
                aria-label={`${entry.project.title} projesini incele`}
              >
                {entry.project.coverImage ? (
                  <Image
                    src={entry.project.coverImage.url}
                    alt={entry.project.coverImage.alt}
                    fill
                    sizes="(min-width: 900px) 48vw, 92vw"
                    className="object-cover"
                  />
                ) : (
                  <span className="image-placeholder micro-label">Görsel hazırlanıyor</span>
                )}
                <span className="atlas-project-index">
                  {String(active + 1).padStart(2, '0')}
                </span>
              </Link>
              <div className="atlas-project-copy">
                <p className="eyebrow">
                  {entry.city.name.toLocaleUpperCase('tr-TR')} /{' '}
                  {entry.city.countryName.toLocaleUpperCase('tr-TR')}
                </p>
                <h3>{entry.project.title}</h3>
                {entry.project.description ? <p>{entry.project.description}</p> : null}
                <Link className="text-link" href={projectHref(entry.project.slug)}>
                  Projeyi incele <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </article>
          </div>
        ) : (
          <div className="featured-atlas-empty">
            <p className="eyebrow">PROJE ROTASI</p>
            <h3>Öne çıkan projeler yayınlandığında burada yer alacak.</h3>
          </div>
        )}
      </div>
    </section>
  )
}
