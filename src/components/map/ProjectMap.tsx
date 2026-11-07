'use client'

import { useEffect, useRef, useState } from 'react'
import { recordInterest } from '@/lib/personalization/interest'
import type { GlobeCity } from '@/types/globe'
import { CityProjectPanel } from '@/components/globe/CityProjectPanel'

export const projectMapPoint = (lat: number, lng: number) => ({
  x: ((lng + 180) / 360) * 1000,
  y: ((85 - lat) / 145) * 440,
})

export function ProjectMap({ cities }: { cities: GlobeCity[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const chipList = useRef<HTMLDivElement>(null)
  const selected = cities.find((city) => city.id === selectedId)
  const highlighted = cities.find((city) => city.id === hoveredId) || selected
  const view = zoom
    ? { x: 465, y: 90, width: 295, height: 129.8 }
    : { x: 0, y: 0, width: 1000, height: 440 }
  const factor = view.width / 1000
  useEffect(() => {
    // Personalisation (consent-gated inside recordInterest): only the chosen city's public slug.
    if (!selected?.slug) return
    recordInterest({
      k: 'city',
      s: selected.slug,
      l: selected.name,
      sig: [
        { t: 'city', s: selected.slug, l: selected.name },
        ...(selected.countrySlug ? [{ t: 'country' as const, s: selected.countrySlug, l: selected.countryName }] : []),
      ],
    })
  }, [selected?.slug, selected?.name, selected?.countrySlug, selected?.countryName])
  function close() {
    setSelectedId(null)
    setHoveredId(null)
    chipList.current
      ?.querySelector<HTMLButtonElement>(`button[data-city-id="${selectedId}"]`)
      ?.focus()
  }
  return (
    <section className="project-map-section" aria-labelledby="map-heading" id="dunya">
      <div className="site-shell">
        <div className="workshop-section-heading" data-reveal>
          <p className="eyebrow">04 / PROJE ATLASI</p>
          <h2 id="map-heading">
            Tasarımın
            <br />
            <span>izini sür.</span>
          </h2>
          <p>
            Bir noktaya yaklaşın.
            <br />O şehirdeki projeleri keşfedin.
          </p>
        </div>
        <div className="project-map-layout">
          <div className="project-map-canvas">
            <div className="map-toolbar">
              <span className="micro-label">
                {cities.length} şehir / {cities.reduce((sum, city) => sum + city.projectCount, 0)}{' '}
                proje
              </span>
              <button type="button" aria-pressed={zoom} onClick={() => setZoom(!zoom)}>
                {zoom ? 'Dünya görünümü −' : 'Yakınlaş +'}
              </button>
            </div>
            <svg
              viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
              className="dotted-world"
              aria-label="Noktalı dünya proje haritası"
              role="group"
            >
              <defs>
                <mask id="world-dot-mask">
                  <image href="/assets/map/world-dots.svg" width="1000" height="440" />
                </mask>
              </defs>
              <rect
                width="1000"
                height="440"
                mask="url(#world-dot-mask)"
                className="world-land-dots"
              />
              {cities.map((city) => {
                const point = projectMapPoint(city.lat, city.lng)
                const active = highlighted?.id === city.id
                return (
                  <g
                    key={city.id}
                    transform={`translate(${point.x},${point.y})`}
                    className={`map-marker ${active ? 'is-active' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${city.name}, ${city.countryName}: ${city.projectCount} proje`}
                    aria-pressed={selectedId === city.id}
                    onPointerEnter={() => {
                      setHoveredId(city.id)
                      setSelectedId(city.id)
                    }}
                    onPointerLeave={() => setHoveredId(null)}
                    onFocus={() => {
                      setHoveredId(city.id)
                      setSelectedId(city.id)
                    }}
                    onBlur={() => setHoveredId(null)}
                    onClick={() => setSelectedId(city.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelectedId(city.id)
                      }
                      if (event.key === 'Escape') close()
                    }}
                  >
                    <title>{`${city.name} — ${city.projectCount} proje`}</title>
                    <circle r={14 * factor} className="map-hit-target" />
                    <circle r={(active ? 10 : 7) * factor} className="map-marker-ring" />
                    <circle r={(active ? 4 : 3) * factor} className="map-marker-dot" />
                  </g>
                )
              })}
            </svg>
            <div className="map-legend">
              <span>
                <i /> Yayındaki projeler
              </span>
              <span>Görmek için üzerine gelin veya dokunun</span>
            </div>
            <div className="map-cities" ref={chipList} aria-label="Proje şehirleri">
              {cities.map((city) => (
                <button
                  type="button"
                  data-city-id={city.id}
                  key={city.id}
                  aria-pressed={selectedId === city.id}
                  onPointerEnter={() => {
                    setHoveredId(city.id)
                    setSelectedId(city.id)
                  }}
                  onPointerLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(city.id)}
                  onClick={() => setSelectedId(city.id)}
                >
                  <span>{city.name}</span>
                  <small>{city.projectCount}</small>
                </button>
              ))}
            </div>
          </div>
          <div
            className="map-project-preview"
            aria-live="polite"
            onKeyDown={(event) => {
              if (event.key === 'Escape') close()
            }}
          >
            {selected ? (
              <CityProjectPanel key={selected.id} city={selected} onClose={close} />
            ) : (
              <div className="map-preview-empty">
                <span className="map-empty-cross" aria-hidden="true">
                  ↗
                </span>
                <p className="eyebrow">YAKINDAN BAK</p>
                <h3>
                  Bir şehir.
                  <br />
                  Yeni bir hikâye.
                </h3>
                <p>
                  {cities.length
                    ? 'Haritadaki noktalardan veya şehir listesinden birini seçin.'
                    : 'Yayınlanan projeler haritada burada yer alacak.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
