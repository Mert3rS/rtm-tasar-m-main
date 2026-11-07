'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import type { AssistantPublicSettings } from '@/lib/assistantSettings'
import { safeStorage } from '@/lib/consent/storage'
import { AssistantIcon } from './AssistantIcon'

const loadPanel = () => import('./AssistantPanel').then((module) => module.AssistantPanel)
const AssistantPanel = dynamic(loadPanel, { ssr: false })

/** Necessary, tab-scoped flag: the intro animation and phone greeting play once per tab. */
const INTRO_KEY = 'rtm-assistant-intro-v1'
const INTRO_DELAY = 2000
const INTRO_PLAY = 1400
const HINT_MS = 6000
const COMPACT_AFTER = 240
export const DEFAULT_LAUNCHER_SUBTITLE = 'Sorularınızı yanıtlayalım'

type Intro = 'pending' | 'entering' | 'shown'

/**
 * Bottom-right launcher. A light client component: the chat panel bundle is fetched on
 * hover/focus (prefetch) or first click, so it never competes with the hero, globe or the studio
 * WebGL scene. Every animation is transform/opacity only; the dock is fixed, so no layout shift.
 */
export function AssistantLauncher({ settings }: { settings: AssistantPublicSettings }) {
  const pathname = usePathname()
  const hiddenOnRoute =
    pathname?.startsWith('/admin') || pathname?.startsWith('/tasarim-olustur')
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [intro, setIntro] = useState<Intro>('pending')
  const [hint, setHint] = useState(false)
  const [compact, setCompact] = useState(false)
  const [width, setWidth] = useState(0)
  const button = useRef<HTMLButtonElement>(null)
  const introSeen = useRef<boolean | null>(null)

  useEffect(() => {
    if (hiddenOnRoute) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Read the tab flag once per mount (effects may run twice in development).
    if (introSeen.current === null) {
      introSeen.current = safeStorage.get(INTRO_KEY, 'session') === '1'
      if (!introSeen.current) safeStorage.set(INTRO_KEY, '1', 'necessary', 'session')
    }
    const seen = introSeen.current
    const phone = window.matchMedia('(max-width: 768px)').matches
    // Seen in this tab: appear at once. Reduced motion: no delay and no motion, but the phone
    // greeting still appears once. Otherwise: appear after ~2 s with one quiet ring.
    const delay = seen || reduced ? 0 : INTRO_DELAY
    const timers = [
      window.setTimeout(() => {
        setIntro(seen || reduced ? 'shown' : 'entering')
        if (!seen && phone) setHint(true)
      }, delay),
    ]
    if (!seen) {
      if (!reduced) timers.push(window.setTimeout(() => setIntro('shown'), delay + INTRO_PLAY))
      timers.push(window.setTimeout(() => setHint(false), delay + HINT_MS))
    }
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [hiddenOnRoute])

  // Desktop: collapse to the icon box while scrolling down, expand again when scrolling up.
  useEffect(() => {
    if (hiddenOnRoute) return
    const desktop = window.matchMedia('(min-width: 769px)')
    let last = window.scrollY
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const y = window.scrollY
        if (!desktop.matches || y < COMPACT_AFTER) setCompact(false)
        else if (Math.abs(y - last) > 6) setCompact(y > last)
        last = y
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [hiddenOnRoute])

  useEffect(() => {
    if (!hiddenOnRoute) return
    const frame = window.requestAnimationFrame(() => {
      setOpen(false)
      setHint(false)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [hiddenOnRoute])

  // The compact transform needs the expanded width (unitless) for its scale/translate math.
  useEffect(() => {
    const node = button.current
    if (!node || !('ResizeObserver' in window)) return
    const observer = new ResizeObserver(() => setWidth(Math.round(node.offsetWidth)))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    window.requestAnimationFrame(() => button.current?.focus())
  }, [])

  if (hiddenOnRoute) return null
  const subtitle = settings.tagline || DEFAULT_LAUNCHER_SUBTITLE
  return (
    <>
      <div
        className="assistant-dock"
        data-intro={intro}
        data-open={open ? 'true' : 'false'}
        data-compact={compact && !open && width > 0 ? 'true' : 'false'}
        style={width ? ({ '--lw': width } as CSSProperties) : undefined}
      >
        {hint && !open ? (
          <div className="assistant-hint">
            <p>Merhaba! Ben {settings.name}, size yardımcı olabilirim.</p>
            <button type="button" className="assistant-hint-close" aria-label="Karşılama mesajını kapat" onClick={() => setHint(false)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          </div>
        ) : null}
        <button
          ref={button}
          type="button"
          className="assistant-launcher"
          aria-expanded={open}
          aria-controls={mounted ? 'rtm-assistant-panel' : undefined}
          aria-haspopup="dialog"
          aria-label={open ? 'Sohbeti kapat' : `${settings.name} ile sohbet başlat`}
          onPointerEnter={() => void loadPanel()}
          onFocus={() => void loadPanel()}
          onClick={() => {
            setMounted(true)
            setHint(false)
            setOpen((value) => !value)
          }}
        >
          <span className="assistant-launcher-surface" aria-hidden="true" />
          <span className="assistant-launcher-mark" aria-hidden="true">
            <AssistantIcon className="assistant-launcher-icon" />
            <svg className="assistant-launcher-x" viewBox="0 0 24 24">
              <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            <span className="assistant-online-dot assistant-online-corner" />
          </span>
          <span className="assistant-launcher-text" aria-hidden="true">
            <strong>{settings.name}</strong>
            <span>
              <span className="assistant-online-dot" />
              {subtitle}
            </span>
          </span>
        </button>
      </div>
      {mounted ? <AssistantPanel open={open} onClose={close} settings={settings} /> : null}
    </>
  )
}
