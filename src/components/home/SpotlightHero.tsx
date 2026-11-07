'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLayoutEffect, useRef } from 'react'
import { MorphingText } from '@/components/site/MorphingText'
import type { GlobeProject } from '@/types/globe'
import { useHomeMotion } from './HomeMotion'

const headline =
  'Bir mekânın hissini değiştiren detaylar. Özgün formlar, doğal dokular ve hayatına yer açan tasarımlar.'
const morphingWords = ['Mekân.', 'Malzeme.', 'Yeni ihtimaller.'] as const
const clamp = (value: number) => Math.min(1, Math.max(0, value))
const range = (value: number, start: number, end: number) => clamp((value - start) / (end - start))

/** User-supplied Sumit011 spotlight: identical scroll phases, native sticky/RAF lifecycle. */
export function SpotlightHero({ projects }: { projects: GlobeProject[] }) {
  const rootRef = useRef<HTMLElement>(null)
  const motion = useHomeMotion()
  const sources = projects.filter((project) => project.coverImage)
  const images = Array.from({ length: 9 }, (_, index) =>
    sources.length ? sources[(index === 4 ? 0 : index + 1) % sources.length] : undefined,
  )

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !motion) return
    const stage = root.querySelector<HTMLElement>('.spotlight-stage')
    const gallery = root.querySelector<HTMLElement>('.hero-spotlight-gallery')
    const logo = root.querySelector<HTMLElement>('.spotlight-logo')
    const footer = root.querySelector<HTMLElement>('.spotlight-footer')
    const inner = root.querySelector<HTMLElement>('.spotlight-inner')
    const overlay = root.querySelector<HTMLElement>('.spotlight-overlay')
    const words = root.querySelectorAll<HTMLElement>('.spotlight-word, .spotlight-cta')
    if (!stage || !gallery || !logo || !footer || !inner || !overlay) return
    let frame = 0
    let lastProgress = -1
    let lastHeight = -1
    let lastWidth = -1
    root.dataset.enhanced = 'true'
    const update = () => {
      frame = 0
      const height = stage.clientHeight
      const distance = -root.getBoundingClientRect().top
      const heroTravel = height * 1.2
      const progress = clamp(distance / Math.max(1, heroTravel))
      const galleryProgress = range(progress, 0, 0.75)
      if (progress === lastProgress && height === lastHeight && window.innerWidth === lastWidth)
        return
      lastProgress = progress
      lastHeight = height
      lastWidth = window.innerWidth
      const scale = window.innerWidth <= 1000 ? 1.8 : 4.3
      gallery.style.transform = `translate(-50%, -50%) scale(${1 - 0.5 * galleryProgress})`
      root.style.setProperty('--spotlight-image-scale', String(1.25 - 0.25 * galleryProgress))
      root.style.setProperty('--spotlight-shade', `${16 + 44 * range(progress, 0.05, 0.35)}%`)
      const travel = height - logo.offsetHeight * (scale - (scale - 1) * galleryProgress) - 64
      logo.style.transform = `translateY(${-travel * galleryProgress}px) scale(${scale - (scale - 1) * galleryProgress})`
      const footerProgress = range(progress, 0.05, 0.25)
      footer.style.opacity = String(1 - footerProgress)
      footer.style.filter = `blur(${20 * footerProgress}px)`
      footer.style.scale = String(1 - 0.25 * footerProgress)
      words.forEach((word, index) => {
        const step = 0.7 / words.length
        word.style.opacity = String(
          range(progress, 0.1 + index * step, 0.1 + index * step + step * 3),
        )
      })
      inner.style.transform = 'translateY(0)'
      overlay.style.opacity = '0'
      root.style.setProperty('--spotlight-progress', `${progress * 100}%`)
    }
    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    const observer = new ResizeObserver(requestUpdate)
    observer.observe(stage)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      observer.disconnect()
      delete root.dataset.enhanced
      for (const element of [gallery, logo, footer, inner, overlay, ...words])
        element.removeAttribute('style')
      root.style.removeProperty('--spotlight-image-scale')
      root.style.removeProperty('--spotlight-shade')
      root.style.removeProperty('--spotlight-progress')
    }
  }, [motion])

  return (
    <section className="spotlight-scroll" id="top" aria-labelledby="hero-heading" ref={rootRef}>
      <div className="spotlight-stage">
        <div className="spotlight-inner">
          <div className="hero-spotlight-gallery" aria-hidden="true">
            {[0, 1, 2].map((column) => (
              <div className="hero-spotlight-col" key={column}>
                {images.slice(column * 3, column * 3 + 3).map((project, row) => (
                  <div className="hero-spotlight-item" key={row}>
                    {project?.coverImage ? (
                      <Image
                        src={project.coverImage.url}
                        alt=""
                        fill
                        sizes={column === 1 && row === 1 ? '100vw' : '70vw'}
                        preload={column === 1 && row === 1}
                        className="object-cover"
                      />
                    ) : (
                      <div className="spotlight-empty" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="spotlight-gallery-shade" />
          <div className="spotlight-header">
            <p className="spotlight-word spotlight-eyebrow">RTM / MOBİLYA & MEKÂN</p>
            <h1 id="hero-heading" aria-label={headline}>
              {headline.split(' ').map((word, index) => (
                <span className="spotlight-word" aria-hidden="true" key={index}>
                  {word}{' '}
                </span>
              ))}
            </h1>
            <Link className="spotlight-cta" href="/projeler">
              Projeleri keşfet <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <a className="spotlight-logo" href="#studio" aria-label="RTM Tasarım — atölyeyi keşfet">
            <svg viewBox="0 0 220 70" aria-hidden="true">
              <text x="0" y="58" fontSize="78" fontWeight="800" letterSpacing="-6">
                rtm.
              </text>
            </svg>
          </a>
          <div className="spotlight-footer">
            <MorphingText className="spotlight-morph" texts={morphingWords} />
            <span>Kaydır, başka bir açıdan bak ↓</span>
          </div>
        </div>
        <div className="spotlight-overlay" aria-hidden="true" />
        <div className="spotlight-progress" aria-hidden="true" />
      </div>
    </section>
  )
}
