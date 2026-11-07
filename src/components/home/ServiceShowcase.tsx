'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import type { CatalogCardData } from '@/types/catalog'
import { catalogHref } from '@/lib/catalogQuery'
import { useHomeMotion } from './HomeMotion'

const drawings = [
  [
    'M62 296 206 94l154 62 98 182H108Z',
    'M206 94v202M360 156v140M108 338l98-42 252 42',
    'M238 149h86v92h-86zM127 279h55v59',
    'M86 363h397M108 378h350',
  ],
  [
    'M76 102h398v252H76z',
    'M76 192h398M214 102v252M356 192v162',
    'M106 132h79v34h-79zM244 221h82v104h-82z',
    'M386 223h58v58h-58zM386 297h58v28h-58z',
    'M55 83h440M55 372h440',
  ],
  [
    'M74 330 201 119h187l96 211Z',
    'M201 119 74 330M388 119l96 211M201 119l94 211M388 119 295 330',
    'M146 330v-79h91v79M352 330v-126h72v126',
    'M98 350h362M122 369h314',
    'M166 205h55M331 175h71',
  ],
  [
    'M70 120h410v224H70z',
    'M107 152h154v160H107zM287 152h155v72H287zM287 246h72v66h-72zM378 246h64v66h-64z',
    'M107 232h154M184 152v160',
    'M54 102h442M54 362h442',
    'M92 383h365',
  ],
]

const surfaces = [
  'M108 338 206 94l154 62 98 182Z',
  'M76 102h398v252H76Z',
  'M74 330 201 119h187l96 211Z',
  'M70 120h410v224H70Z',
]

type LineStyle = CSSProperties & { '--line-index': number }

function LineStudy({ variant }: { variant: number }) {
  const paths = drawings[variant % drawings.length]
  return (
    <svg viewBox="0 0 540 430" aria-hidden="true" className="service-line-study">
      <g className="line-study-grid">
        {Array.from({ length: 9 }, (_, index) => (
          <path key={`v-${index}`} d={`M${55 + index * 54} 65v320`} />
        ))}
        {Array.from({ length: 7 }, (_, index) => (
          <path key={`h-${index}`} d={`M55 ${65 + index * 54}h430`} />
        ))}
      </g>
      <path className="line-study-surface" d={surfaces[variant % surfaces.length]} />
      <g className="line-study-construction">
        <circle cx="270" cy="222" r="151" />
        <path d="M57 222h426M270 65v320M91 92l358 276M449 92 91 368" />
      </g>
      <g className="line-study-rough">
        {paths.map((path) => <path key={`rough-${path}`} d={path} />)}
      </g>
      <g className="line-study-drawing">
        {paths.map((path, index) => {
          const style: LineStyle = { '--line-index': index }
          return <path key={path} d={path} pathLength={1} style={style} />
        })}
      </g>
      <g className="line-study-measures">
        <path d="M70 395h410M70 388v14M480 388v14" />
        <path d="M36 82v276M29 82h14M29 358h14" />
        <text x="244" y="418">RTM / 01</text>
        <text x="18" y="235" transform="rotate(-90 18 235)">ÖLÇEK 1:20</text>
      </g>
      <circle className="line-study-pencil" cx="0" cy="0" r="4" />
    </svg>
  )
}

export function ServiceShowcase({ services }: { services: CatalogCardData[] }) {
  const motion = useHomeMotion()
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const current = services[index]

  useEffect(() => {
    if (!motion || !playing || services.length < 2) return
    const timer = window.setInterval(
      () => setIndex((currentIndex) => (currentIndex + 1) % services.length),
      2000,
    )
    return () => window.clearInterval(timer)
  }, [motion, playing, services.length])

  if (!current) return null
  return (
    <div className="service-showcase service-line-showcase">
      <div className="service-showcase-copy">
        <span className="micro-label">
          {String(index + 1).padStart(2, '0')} / {String(services.length).padStart(2, '0')} —
          ÇALIŞMA ALANIMIZ
        </span>
        <div key={current.id} className="service-copy-enter">
          <h3>{current.title}</h3>
          <p>{current.shortDescription}</p>
          <Link className="workshop-link" href={catalogHref('service', current.slug)}>
            Hizmeti incele <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="service-showcase-navigation" role="group" aria-label="Hizmet seçimi">
          <button
            type="button"
            aria-label="Önceki hizmet"
            onClick={() => setIndex((index + services.length - 1) % services.length)}
          >
            ↑
          </button>
          <div className="service-progress-dots">
            {services.map((service, i) => (
              <button
                type="button"
                key={service.id}
                aria-label={service.title}
                aria-pressed={index === i}
                onClick={() => setIndex(i)}
              >
                <span />
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Sonraki hizmet"
            onClick={() => setIndex((index + 1) % services.length)}
          >
            ↓
          </button>
          {services.length > 1 ? (
            <button
              type="button"
              className="service-play-control"
              aria-label={playing && motion ? 'Otomatik hizmet akışını durdur' : 'Otomatik hizmet akışını başlat'}
              aria-pressed={!playing}
              onClick={() => setPlaying((currentPlaying) => !currentPlaying)}
            >
              {playing && motion ? 'Ⅱ' : '▷'}
            </button>
          ) : null}
        </div>
      </div>
      <div className="service-showcase-visual" aria-hidden="true">
        <div className="service-line-slide" key={current.id}>
          <LineStudy variant={index} />
          <span className="service-sketch-note">ÇİZGİ / MEKÂN / DETAY</span>
        </div>
        <span className="service-visual-tag">{current.title}</span>
      </div>
    </div>
  )
}
