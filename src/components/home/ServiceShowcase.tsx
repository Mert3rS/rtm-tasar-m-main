'use client'

import { EditableRegion } from '@/components/site/EditableRegion'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { catalogHref } from '@/lib/catalogQuery'
import type { CatalogCardData } from '@/types/catalog'
import { useHomeMotion } from './HomeMotion'

const flowPhases = ['01 / Eskiz', '02 / Gövde', '03 / Detay', '04 / Malzeme', '05 / Mekân']

const serviceReels: Record<string, string> = {
  'sunum-ic-mimari': '/assets/home/service-reels/sunum-ic-mimari.webm',
  'sunum-malzeme-uygulama': '/assets/home/service-reels/sunum-malzeme-uygulama.webm',
  'sunum-ozel-mobilya': '/assets/home/service-reels/sunum-ozel-mobilya.webm',
  'sunum-proje-danismanligi': '/assets/home/service-reels/sunum-proje-danismanligi.webm',
}

function ServiceFlowReel({
  motion,
  playing,
  service,
}: {
  motion: boolean
  playing: boolean
  service: CatalogCardData
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoSource = serviceReels[service.slug]

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (motion && playing) {
      video.currentTime = 0
      void video.play().catch(() => undefined)
    } else {
      video.pause()
    }
  }, [motion, playing, videoSource])

  return (
    <div
      className={`service-flow-reel ${motion && playing ? 'is-playing' : 'is-paused'}`}
      aria-hidden="true"
    >
      <div className="service-flow-media">
        {service.cover ? (
          <Image
            src={service.cover.url}
            alt=""
            fill
            sizes="(min-width: 1000px) 58vw, 100vw"
            className="service-flow-poster"
          />
        ) : null}
        {videoSource ? (
          <video
            ref={videoRef}
            className="service-flow-video"
            autoPlay={motion && playing}
            loop
            muted
            playsInline
            poster={service.cover?.url}
            preload="auto"
          >
            <source src={videoSource} type="video/webm" />
          </video>
        ) : null}
      </div>
      <div className="service-flow-shade" />
      <div className="service-flow-focus" />
      <div className="service-flow-bar">
        <span>RTM / HİZMET VİDEOSU · 03 SN</span>
        <span className="service-flow-status"><i /> CANLI SÜREÇ</span>
      </div>
      <span className="service-flow-time">00:03</span>
      <span className="service-flow-mark">RTM</span>
      <div className="service-flow-phases">
        {flowPhases.map((phase) => <span key={phase}>{phase}</span>)}
      </div>
      <div className="service-flow-progress"><i /></div>
      <span className="service-visual-tag">{service.title}</span>
    </div>
  )
}

export function ServiceShowcase({ services }: { services: CatalogCardData[] }) {
  const motion = useHomeMotion()
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const current = services[index]

  useEffect(() => {
    if (!motion || !playing || services.length < 2) return
    const timer = window.setTimeout(
      () => setIndex((currentIndex) => (currentIndex + 1) % services.length),
      3000,
    )
    return () => window.clearTimeout(timer)
  }, [index, motion, playing, services.length])

  if (!current) return null
  const currentHref = catalogHref('service', current.slug)

  return (
    <div className="service-showcase service-line-showcase">
      <div className="service-showcase-copy">
        <span className="micro-label">
          {String(index + 1).padStart(2, '0')} / {String(services.length).padStart(2, '0')} —
          ÇALIŞMA ALANIMIZ
        </span>
        <EditableRegion as="div" key={current.id} className="service-copy-enter" data-rtm-edit={`services:${current.id}`} data-rtm-label={`${current.title} · Hizmet metinleri`}>
          <h3>{current.title}</h3>
          <p>{current.shortDescription}</p>
          <Link className="workshop-link" href={currentHref}>
            Hizmeti incele <span aria-hidden="true">↗</span>
          </Link>
        </EditableRegion>
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
      <Link
        aria-label={`${current.title} hizmetini incele`}
        className="service-showcase-visual"
        data-rtm-edit={`services:${current.id}`} data-rtm-label={`${current.title} · Kapak görseli`}
        data-rtm-field="coverImage"
        href={currentHref}
      >
        <div className="service-line-slide" key={`${current.id}-${playing ? 'playing' : 'paused'}`}>
          <ServiceFlowReel motion={motion} playing={playing} service={current} />
        </div>
      </Link>
    </div>
  )
}
