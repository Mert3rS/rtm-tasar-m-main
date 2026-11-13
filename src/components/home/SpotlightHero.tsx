'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, type CSSProperties } from 'react'
import { EditableRegion } from '@/components/site/EditableRegion'
import type { HeroPhoto } from '@/lib/homepageHero'
import type { HomepageCopy } from '@/lib/homepageContent'
import {
  FRAME_COUNT,
  MOBILE_FRAME_COUNT,
  SCROLL_HEIGHT_VH,
  SMOOTHING,
  HERO_FILM,
  ASSEMBLY_FILM,
  HERO_CHAPTERS as chapters,
  type HeroVariant,
  heroFramePath,
} from '@/lib/heroSequence'
import { useHomeMotion } from './HomeMotion'

const clamp = (value: number) => Math.min(1, Math.max(0, value))
const range = (value: number, from: number, to: number) => clamp((value - from) / (to - from))
const heroStyle: CSSProperties & { '--hero-scroll-height': string } = {
  '--hero-scroll-height': `${SCROLL_HEIGHT_VH}svh`,
}

/** Reversible frame sequence. The poster and CMS photo survive canvas/network failures. */
export function SpotlightHero({
  photos,
  copy,
  variant = 'original',
}: {
  photos: HeroPhoto[]
  copy: HomepageCopy
  variant?: HeroVariant
}) {
  const film = variant === 'assembly' ? ASSEMBLY_FILM : HERO_FILM
  const rootRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const motion = useHomeMotion()
  const sentenceEnd = copy.heroHeading.search(/[.!?](?:\s|$)/)
  const title = sentenceEnd >= 0 ? copy.heroHeading.slice(0, sentenceEnd + 1) : copy.heroHeading
  const description = sentenceEnd >= 0 ? copy.heroHeading.slice(sentenceEnd + 1).trim() : ''
  const titleWords = title.split(/\s+/)
  const emphasis = titleWords.splice(-2).join(' ')
  const fallback = photos.find((photo) => photo.position === 'center')?.image

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: false })
    const stage = root?.querySelector<HTMLElement>('.cinematic-stage')
    if (
      !root ||
      !canvas ||
      !context ||
      !stage ||
      !motion ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return
    const surface = { root, canvas, context, stage }
    const nativeFrame = variant === 'assembly' ? frameRef.current : null
    const progressBar = root.querySelector<HTMLElement>('.cinematic-progress span')
    const scrim = root.querySelector<HTMLElement>('.cinematic-scrim')
    const story = root.querySelector<HTMLElement>('.cinematic-chapters')

    const mobile = matchMedia('(max-width: 767px)')
    const intro = root.querySelector<HTMLElement>('.cinematic-intro')
    const finale = root.querySelector<HTMLElement>('.cinematic-finale')
    const captions = root.querySelectorAll<HTMLElement>('.cinematic-chapter')
    const marks = root.querySelectorAll<HTMLElement>('.cinematic-chapter-mark')
    const images = new Map<number, HTMLImageElement>()
    const available = new Map<number, Blob>()
    const decoding = new Set<number>()
    const pending = new Set<HTMLImageElement>()
    let controller = new AbortController()
    let disposed = false
    let generation = 0
    let frame = 0
    let target = 0
    let current = 0
    let lastDrawn = -1
    let lastProgress = -1
    let width = 0
    let height = 0
    let count = mobile.matches ? MOBILE_FRAME_COUNT : FRAME_COUNT
    let inView = true
    let resizePending = true

    async function decode(index: number) {
      const blob = available.get(index)
      if (!blob || images.has(index) || decoding.has(index) || decoding.size >= 2) return
      const version = generation
      const url = URL.createObjectURL(blob)
      const image = new window.Image()
      decoding.add(index)
      pending.add(image)
      image.src = url
      try {
        await image.decode()
        if (disposed || version !== generation) return
        images.set(index, image)
        // Full-resolution assembly frames share a 48 MiB decoded pixel budget.
        // Retain the original film's existing 12-frame limit.
        const limit = nativeFrame
          ? Math.max(
              2,
              Math.min(
                12,
                Math.floor((48 * 1024 * 1024) / (image.naturalWidth * image.naturalHeight * 4)),
              ),
            )
          : 12
        if (images.size > limit) {
          const wanted = Math.round(current * (count - 1))
          const furthest = [...images.keys()].sort(
            (a, b) => Math.abs(b - wanted) - Math.abs(a - wanted),
          )[0]
          images.delete(furthest)
        }
        requestDraw()
      } catch {
        // A corrupt frame is skipped; the nearest working frame/poster stays visible.
        if (version === generation) available.delete(index)
      } finally {
        URL.revokeObjectURL(url)
        pending.delete(image)
        if (version === generation) decoding.delete(index)
      }
    }

    function fade(element: HTMLElement | null, opacity: number, travel = 0) {
      if (!element) return
      const nextOpacity = String(opacity)
      const transform = `translateY(${travel}px)`
      if (element.style.opacity !== nextOpacity) element.style.opacity = nextOpacity
      if (element.style.transform !== transform) element.style.transform = transform
      // Invisible CTAs must not intercept clicks or remain in the tab sequence.
      if (element.inert !== opacity < 0.05) element.inert = opacity < 0.05
    }

    function variable(name: string, value: string) {
      // Scope animated variables to their consumer rather than invalidating
      // inherited styles throughout the full assembly stage each frame.
      const scope = nativeFrame
        ? name === '--hero-progress'
          ? progressBar
          : name === '--hero-story'
            ? story
            : scrim
        : surface.root
      const style = (scope || surface.root).style
      if (style.getPropertyValue(name) !== value) {
        style.setProperty(name, value)
      }
    }

    function draw() {
      frame = 0
      if (disposed || document.hidden || !inView) return
      const delta = target - current
      current = Math.abs(delta) < 0.0001 ? target : current + delta * SMOOTHING
      if (resizePending) {
        const bounds = surface.stage.getBoundingClientRect()
        const dpr = Math.min(devicePixelRatio || 1, 2)
        width = Math.round(bounds.width * dpr)
        height = Math.round(bounds.height * dpr)
        surface.canvas.width = width
        surface.canvas.height = height
        lastDrawn = -1
        resizePending = false
      }
      const requested = Math.round(current * (count - 1))
      let nearest = -1
      let distance = Infinity
      for (const index of available.keys()) {
        const gap = Math.abs(index - requested)
        if (gap < distance) {
          nearest = index
          distance = gap
        }
      }
      if (!images.has(nearest)) void decode(nearest)
      if (!images.has(nearest)) {
        nearest =
          [...images.keys()].sort((a, b) => Math.abs(a - requested) - Math.abs(b - requested))[0] ??
          -1
      }
      const image = images.get(nearest)
      if (image && nearest !== lastDrawn && width && height) {
        const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
        const w = image.naturalWidth * scale
        const h = image.naturalHeight * scale
        if (nativeFrame) {
          // Reuse decoded nodes instead of uploading canvas pixels on every frame.
          nativeFrame.replaceChildren(image)
        } else {
          surface.context.drawImage(image, (width - w) / 2, (height - h) / 2, w, h)
        }
        lastDrawn = nearest
        surface.root.dataset.canvasReady = 'true'
        surface.canvas.dataset.frame = String(nearest)
      }
      if (nativeFrame)
        void decode(Math.max(0, Math.min(count - 1, requested + (target >= current ? 1 : -1))))
      if (lastProgress !== current) {
        fade(intro, 1 - range(current, 0.01, 0.12), -40 * range(current, 0, 0.12))
        fade(finale, range(current, 0.9, 0.98), 24 * (1 - range(current, 0.9, 0.98)))
        captions.forEach((caption, index) => {
          const chapter = chapters[index]
          const opacity =
            range(current, chapter.start, chapter.start + 0.04) *
            (1 - range(current, chapter.end - 0.04, chapter.end))
          fade(caption, opacity, 16 * (1 - opacity))
        })
        marks.forEach((mark, index) => {
          const active = String(current >= index / 3 && current < (index + 1) / 3)
          if (mark.dataset.active !== active) mark.dataset.active = active
        })
        variable('--hero-progress', String(current))
        variable('--hero-intro', String(1 - range(current, 0.02, 0.15)))
        variable('--hero-ending', String(range(current, 0.88, 1)))
        variable(
          '--hero-story',
          String(range(current, 0.18, 0.24) * (1 - range(current, 0.84, 0.9))),
        )
        const started = String(target > 0.006)
        if (surface.root.dataset.started !== started) surface.root.dataset.started = started
        lastProgress = current
      }
      if (current !== target) requestDraw()
    }

    function requestDraw() {
      if (!frame && !disposed && !document.hidden && inView) frame = requestAnimationFrame(draw)
    }

    function measure() {
      const bounds = surface.root.getBoundingClientRect()
      target = clamp(
        -bounds.top / Math.max(1, surface.root.offsetHeight - surface.stage.offsetHeight),
      )
      requestDraw()
    }

    async function loadFrames() {
      const version = ++generation
      controller.abort()
      controller = new AbortController()
      const signal = controller.signal
      const isMobile = mobile.matches
      count = isMobile ? MOBILE_FRAME_COUNT : FRAME_COUNT
      images.clear()
      available.clear()
      nativeFrame?.replaceChildren()
      decoding.clear()
      delete surface.root.dataset.canvasReady
      lastDrawn = -1
      let next = 0
      let completed = 0
      let warned = false
      surface.root.dataset.loading = 'true'
      surface.root.style.setProperty('--hero-loaded', '0')
      async function load(index: number) {
        try {
          const response = await fetch(heroFramePath(index, isMobile, variant), { signal })
          if (!response.ok) throw new Error('Frame unavailable')
          const blob = await response.blob()
          if (disposed || version !== generation) return
          available.set(index, blob)
          if (index === 0) await decode(index)
          requestDraw()
        } catch {
          if (!disposed && version === generation && !warned) {
            warned = true
            console.warn(
              '[RTM hero] Kare dizisi eksik veya yüklenemedi; mevcut kare/görsel kullanılacak.',
            )
          }
        } finally {
          if (!disposed && version === generation) {
            completed++
            surface.root.style.setProperty('--hero-loaded', String(completed / count))
          }
        }
      }
      // First frame is decoded before the four bounded background workers begin.
      await load(next++)
      if (disposed || version !== generation) return
      const worker = async () => {
        while (next < count && !disposed && version === generation) await load(next++)
      }
      await Promise.all(Array.from({ length: 4 }, worker))
      if (!disposed && version === generation) surface.root.dataset.loading = 'false'
    }

    const resize = () => {
      resizePending = true
      measure()
    }
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame)
        frame = 0
      } else measure()
    }
    const sourceChanged = () => {
      void loadFrames()
      resize()
    }
    const observer = new ResizeObserver(resize)
    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView) measure()
      else {
        cancelAnimationFrame(frame)
        frame = 0
      }
    })
    root.dataset.enhanced = 'true'
    observer.observe(stage)
    intersection.observe(root)
    measure()
    void loadFrames()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', visibility)
    mobile.addEventListener('change', sourceChanged)
    return () => {
      disposed = true
      generation++
      controller.abort()
      cancelAnimationFrame(frame)
      observer.disconnect()
      intersection.disconnect()
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', visibility)
      mobile.removeEventListener('change', sourceChanged)
      pending.forEach((image) => {
        image.src = ''
      })
      nativeFrame?.replaceChildren()
      images.clear()
      available.clear()
      for (const element of [intro, finale, ...captions]) {
        element?.removeAttribute('style')
        if (element) element.inert = false
      }
      for (const key of ['enhanced', 'canvasReady', 'loading', 'started']) delete root.dataset[key]
      for (const key of ['progress', 'intro', 'ending', 'story', 'loaded'])
        root.style.removeProperty(`--hero-${key}`)
      for (const element of [progressBar, scrim, story]) {
        for (const key of ['progress', 'intro', 'ending', 'story'])
          element?.style.removeProperty(`--hero-${key}`)
      }
    }
  }, [motion, variant])

  return (
    <section
      className="cinematic-hero"
      id="top"
      aria-labelledby="hero-heading"
      ref={rootRef}
      style={heroStyle}
    >
      <link
        rel="preload"
        as="image"
        href={heroFramePath(0, false, variant)}
        media="(min-width: 768px) and (prefers-reduced-motion: no-preference)"
      />
      <link
        rel="preload"
        as="image"
        href={heroFramePath(0, true, variant)}
        media="(max-width: 767px) and (prefers-reduced-motion: no-preference)"
      />
      <div className="cinematic-stage">
        <div className="cinematic-media">
          {fallback ? (
            <Image
              className="cinematic-cms-fallback"
              src={fallback.url}
              alt={fallback.alt}
              fill
              sizes="100vw"
            />
          ) : null}
          <picture className="cinematic-poster">
            <source
              media="(max-width: 767px) and (prefers-reduced-motion: reduce)"
              srcSet={heroFramePath(MOBILE_FRAME_COUNT - 1, true, variant)}
            />
            <source
              media="(prefers-reduced-motion: reduce)"
              srcSet={heroFramePath(FRAME_COUNT - 1, false, variant)}
            />
            <source media="(max-width: 767px)" srcSet={heroFramePath(0, true, variant)} />
            <Image
              src={heroFramePath(0, false, variant)}
              alt={film.alt}
              fill
              unoptimized
              sizes="100vw"
              loading="eager"
              fetchPriority="high"
              onError={(event) => {
                event.currentTarget.style.opacity = '0'
              }}
            />
          </picture>
          <canvas
            ref={canvasRef}
            className="cinematic-canvas"
            role="img"
            aria-label={film.alt}
            aria-hidden={variant === 'assembly' ? true : undefined}
          />
          {variant === 'assembly' ? (
            <div
              ref={frameRef}
              className="cinematic-native-frame"
              role="img"
              aria-label={film.alt}
            />
          ) : null}
        </div>
        <div className="cinematic-scrim" aria-hidden="true" />
        <div className="cinematic-topline" aria-hidden="true">
          <span>RTM TASARIM</span>
          <span>MEKÂNA DAİR.</span>
        </div>
        <div className="cinematic-intro">
          <EditableRegion
            as="p"
            className="cinematic-eyebrow"
            data-rtm-edit="site-settings"
            data-rtm-field="homepage__heroEyebrow"
            data-rtm-label="Açılış üst başlığı"
          >
            <span aria-hidden="true" />
            {copy.heroEyebrow}
          </EditableRegion>
          <EditableRegion
            as="h1"
            id="hero-heading"
            aria-label={copy.heroHeading}
            data-rtm-edit="site-settings"
            data-rtm-field="homepage__heroHeading"
            data-rtm-label="Açılış ana başlığı"
          >
            {titleWords.join(' ')} <em>{emphasis}</em>
          </EditableRegion>
          {description ? <p className="cinematic-description">{description}</p> : null}
          <div className="cinematic-actions">
            <Link className="cinematic-button" href="/iletisim">
              Birlikte tasarlayalım <span aria-hidden="true">↗</span>
            </Link>
            <Link
              className="cinematic-text-link"
              href="/projeler"
              data-rtm-edit="site-settings"
              data-rtm-field="homepage__heroButton"
              data-rtm-label="Açılış düğme metni"
            >
              {copy.heroButton} <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <div className="cinematic-chapters" aria-hidden="true">
          {chapters.map((chapter) => (
            <div className="cinematic-chapter" key={chapter.number}>
              <span className="cinematic-chapter-number">{chapter.number} / 03</span>
              <p>{chapter.title}</p>
              <span className="cinematic-chapter-note">{chapter.note}</span>
            </div>
          ))}
        </div>
        <div className="cinematic-finale">
          <p className="cinematic-eyebrow">FİKİRDEN MEKÂNA</p>
          <h2>
            {copy.ctaHeading}
            <br />
            <em>{copy.ctaEmphasis}</em>
          </h2>
          <Link className="cinematic-button" href="/iletisim">
            Birlikte tasarlayalım <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="cinematic-bottom">
          <a className="cinematic-scroll-cue" href="#hero-sonrasi">
            <span className="cinematic-scroll-arrow" aria-hidden="true">
              ↓
            </span>
            <span>HİKÂYEYİ KAYDIR</span>
          </a>
          <div className="cinematic-chapter-marks" aria-hidden="true">
            {chapters.map((chapter) => (
              <span
                className="cinematic-chapter-mark"
                key={chapter.number}
                data-active={chapter.number === '01'}
              >
                <b>{chapter.number}</b>
                {chapter.title.replace('.', '')}
              </span>
            ))}
          </div>
          <a className="cinematic-credit" href={film.href} target="_blank" rel="noreferrer">
            {film.label}
            <span>{film.author} ↗</span>
          </a>
        </div>
        <div className="cinematic-progress" aria-hidden="true">
          <span />
        </div>
        <div className="cinematic-loading" aria-hidden="true">
          <span />
        </div>
      </div>
      <span className="cinematic-end-anchor" id="hero-sonrasi" />
    </section>
  )
}
