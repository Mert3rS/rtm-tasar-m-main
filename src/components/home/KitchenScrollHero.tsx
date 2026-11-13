'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import type { HomepageCopy } from '@/lib/homepageContent'
import { useHomeMotion } from './HomeMotion'
import './kitchen-scroll-hero.css'

const scenes = [
  {
    file: '01-empty.webp',
    title: 'Başlangıç.',
    label: 'Boş mekân',
    alt: 'Uygulama öncesinde boş mutfak alanı',
  },
  {
    file: '02-assembly.webp',
    title: 'Adım adım.',
    label: 'Montaj',
    alt: 'Mutfak dolaplarının montaj aşaması',
  },
  {
    file: '03-complete.webp',
    title: 'Yeni bir hâl.',
    label: 'Tamamlanan mutfak',
    alt: 'Yeşil dolapları ve ahşap adasıyla tamamlanan mutfak',
  },
  {
    file: '04-detail.webp',
    title: 'Bir başka açı.',
    label: 'Mekânın devamı',
    alt: 'Tamamlanan mutfağın oturma alanıyla birlikte yandan görünümü',
  },
  {
    file: '05-wide.webp',
    title: 'Bütüne bakış.',
    label: 'Geniş açı',
    alt: 'Ahşap ada ve yeşil mutfak dolaplarının geniş açılı görünümü',
  },
]

const clamp = (value: number) => Math.max(0, Math.min(1, value))
const smooth = (value: number) => {
  const t = clamp(value)
  return t * t * (3 - 2 * t)
}

/** Local experiment: five compressed photos; no video, canvas or per-scroll React renders. */
export function KitchenScrollHero({ copy }: { copy: HomepageCopy }) {
  const rootRef = useRef<HTMLElement>(null)
  const motion = useHomeMotion()
  const sentenceEnd = copy.heroHeading.search(/[.!?](?:\s|$)/)
  const heading = sentenceEnd >= 0 ? copy.heroHeading.slice(0, sentenceEnd + 1) : copy.heroHeading
  const description = sentenceEnd >= 0 ? copy.heroHeading.slice(sentenceEnd + 1).trim() : ''

  useEffect(() => {
    const root = rootRef.current
    if (!root || !motion) return
    const layers = [...root.querySelectorAll<HTMLElement>('.kitchen-story-photo')]
    const captions = [...root.querySelectorAll<HTMLElement>('.kitchen-story-caption')]
    const steps = [...root.querySelectorAll<HTMLElement>('.kitchen-story-step')]
    const progress = root.querySelector<HTMLElement>('.kitchen-story-progress span')
    const counter = root.querySelector<HTMLElement>('[data-story-counter]')
    const loaded = new Set<number>([0])
    let frame = 0
    let target = 0
    let current = 0
    let top = 0
    let distance = 1
    let active = true
    let disposed = false
    let previousTime = 0
    let lastVisible = -1

    // Decode before exposing a layer. Until then, retain the previous complete photo.
    layers.forEach((layer, index) => {
      const image = layer.querySelector('img')
      if (!image) return
      void image
        .decode()
        .then(() => {
          if (disposed) return
          loaded.add(index)
          requestDraw()
        })
        .catch(() => {
          /* Keep the last usable image when an asset fails. */
        })
    })

    function draw(time: number) {
      frame = 0
      if (disposed || !active || document.hidden) return
      const dt = previousTime ? Math.min(time - previousTime, 64) : 16.67
      previousTime = time
      current += (target - current) * (1 - Math.exp(-dt / 85))
      if (Math.abs(target - current) < 0.00015) current = target
      const position = current * (scenes.length - 1)
      let visible = 0
      layers.forEach((layer, index) => {
        const opacity = index === 0 ? 1 : smooth((position - index + 0.78) / 0.78)
        const ready = loaded.has(index)
        layer.style.opacity = String(ready ? opacity : 0)
        layer.style.transform = `scale(${1.035 - 0.035 * clamp(position - index + 1)})`
        if (ready && opacity > 0.5) visible = index
      })
      // Labels change only at scene boundaries; avoid replacing text on every frame.
      if (visible !== lastVisible) {
        captions.forEach((caption, index) => {
          caption.style.opacity = index === visible ? '1' : '0'
          caption.style.transform = index === visible ? 'translateY(0)' : 'translateY(14px)'
        })
        steps.forEach((step, index) => {
          step.dataset.active = String(index === visible)
        })
        if (counter) counter.textContent = String(visible + 1).padStart(2, '0')
        lastVisible = visible
      }
      if (progress) progress.style.transform = `scaleX(${current})`
      if (Math.abs(target - current) > 0.0001) requestDraw()
      else previousTime = 0
    }

    function requestDraw() {
      if (!frame && active && !document.hidden && !disposed) frame = requestAnimationFrame(draw)
    }
    function onScroll() {
      target = clamp((window.scrollY - top) / distance)
      requestDraw()
    }
    function measure() {
      top = root!.getBoundingClientRect().top + window.scrollY
      distance = Math.max(1, root!.offsetHeight - window.innerHeight)
      onScroll()
    }
    function onVisibility() {
      previousTime = 0
      requestDraw()
    }
    root.dataset.enhanced = 'true'
    const resize = new ResizeObserver(measure)
    resize.observe(root)
    const intersection = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting
      if (active) {
        previousTime = 0
        onScroll()
      }
    })
    intersection.observe(root)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    document.addEventListener('visibilitychange', onVisibility)
    measure()
    // Restore a deep scroll without playing through all preceding scenes.
    current = target
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      resize.disconnect()
      intersection.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
      document.removeEventListener('visibilitychange', onVisibility)
      delete root.dataset.enhanced
      layers.forEach((layer) => {
        layer.style.opacity = ''
        layer.style.transform = ''
      })
      captions.forEach((caption) => {
        caption.style.opacity = ''
        caption.style.transform = ''
      })
      steps.forEach((step) => {
        delete step.dataset.active
      })
      if (progress) progress.style.transform = ''
      if (counter) counter.textContent = '01'
    }
  }, [motion])

  return (
    <section className="kitchen-story" ref={rootRef} aria-labelledby="hero-heading">
      <div className="kitchen-story-stage">
        <div className="kitchen-story-topline" aria-hidden="true">
          <span>MEKÂNIN DÖNÜŞÜMÜ</span>
          <span>BAŞLANGIÇTAN BUGÜNE / 01—05</span>
        </div>
        <div className="kitchen-story-copy">
          <p className="kitchen-story-eyebrow">{copy.heroEyebrow}</p>
          <h1 id="hero-heading">{heading}</h1>
          {description ? <p className="kitchen-story-description">{description}</p> : null}
          <div className="kitchen-story-captions" aria-hidden="true">
            {scenes.map((scene, index) => (
              <div className="kitchen-story-caption" key={scene.file}>
                <span>
                  0{index + 1} / {scene.label}
                </span>
                <p>{scene.title}</p>
              </div>
            ))}
          </div>
          <Link className="kitchen-story-link" href="/projeler">
            {copy.heroButton} <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <figure className="kitchen-story-visual">
          <div className="kitchen-story-photos">
            {scenes.map((scene, index) => (
              <div className="kitchen-story-photo" key={scene.file}>
                <Image
                  src={`/assets/home/kitchen-experiment/${scene.file}`}
                  alt={scene.alt}
                  fill
                  sizes="(max-width: 767px) 92vw, 54vw"
                  unoptimized
                  loading="eager"
                  fetchPriority={index === 0 ? 'high' : 'low'}
                />
              </div>
            ))}
          </div>
          <figcaption>
            <span>BOŞ MEKÂN → MONTAJ → TAMAMLANAN MUTFAK</span>
            <span>
              <b data-story-counter>01</b> / 05
            </span>
          </figcaption>
        </figure>
        <div className="kitchen-story-bottom">
          <a href="#hero-sonrasi">
            KEŞFETMEK İÇİN KAYDIR <span aria-hidden="true">↓</span>
          </a>
          <ol aria-label="Dönüşüm aşamaları">
            {scenes.map((scene, index) => (
              <li className="kitchen-story-step" key={scene.file}>
                <span>0{index + 1}</span>
                <span>{scene.label}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="kitchen-story-progress" aria-hidden="true">
          <span />
        </div>
      </div>
      <span id="hero-sonrasi" />
    </section>
  )
}
