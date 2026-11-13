'use client'

import { EditableRegion } from '@/components/site/EditableRegion'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { GlobeErrorBoundary } from '@/components/globe/GlobeErrorBoundary'
import { projectHref } from '@/lib/portfolioQuery'
import type { GlobeCity } from '@/types/globe'
import type { ProjectCardData } from '@/types/portfolio'
import { TextAnimate } from '@/components/site/TextAnimate'
import { useHomeMotion } from './HomeMotion'
import type { HomepageCopy } from '@/lib/homepageContent'

const AtlasGlobeCanvas = dynamic(() => import('@/components/globe/GlobeCanvas'), {
  ssr: false,
  loading: () => (
    <div className="featured-atlas-globe-loading" role="status">
      <span />
      Dünya hazırlanıyor
    </div>
  ),
})

function AtlasGlobeFallback() {
  return (
    <div className="featured-atlas-globe-fallback" role="img" aria-label="Dünya küresi">
      <span />
    </div>
  )
}

export function FeaturedAtlas({
  cities,
  projects,
  copy,
}: {
  cities: GlobeCity[]
  projects: ProjectCardData[]
  copy: HomepageCopy
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
      setActive((active + 1) % entries.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [active, entries.length, motion])

  function selectCity(cityId: string) {
    const next = entries.findIndex((candidate) => candidate.city.id === cityId)
    if (next >= 0) setActive(next)
  }

  return (
    <section
      className="section-space featured-atlas"
      aria-labelledby="featured-atlas-heading"
      id="one-cikan"
    >
      <div className="site-shell">
        <EditableRegion as="div" className="section-heading" data-rtm-edit="site-settings" data-rtm-field="homepage__atlasHeading" data-rtm-label="Proje rotası başlık ve açıklaması">
          <div>
            <p className="eyebrow">01 / PROJE ROTASI</p>
            <h2 id="featured-atlas-heading">
              <TextAnimate animation="slideUp" as="span" by="word" duration={0.56}>
                {copy.atlasHeading}
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
                  {copy.atlasEmphasis}
                </TextAnimate>
              </em>
            </h2>
          </div>
          <TextAnimate animation="fadeIn" as="p" by="line" className="section-intro" delay={0.16}>
            {copy.atlasDescription}
          </TextAnimate>
        </EditableRegion>
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
                  {String(active + 1).padStart(2, '0')} / {String(entries.length).padStart(2, '0')}
                </span>
              </div>
              <div className="featured-atlas-globe-stage">
                <div className="featured-atlas-globe-orbit" aria-hidden="true" />
                <GlobeErrorBoundary fallback={<AtlasGlobeFallback />}>
                  <AtlasGlobeCanvas
                    cities={visibleCities}
                    onSelectCity={selectCity}
                    selectedCityId={entry.city.id}
                    variant="atlas"
                  />
                </GlobeErrorBoundary>
                <div className="featured-atlas-globe-meta" aria-hidden="true">
                  <span>
                    <i /> CANLI PROJE ROTASI
                  </span>
                  <span>SÜRÜKLE / DÖNDÜR</span>
                </div>
              </div>
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
            <EditableRegion as="article" className="atlas-project-card" key={entry.project.id} data-rtm-edit={`projects:${entry.project.id}`} data-rtm-field="coverImage" data-rtm-label={`${entry.project.title} · Küre proje kartı`}>
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
                <span className="atlas-project-index">{String(active + 1).padStart(2, '0')}</span>
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
            </EditableRegion>
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
