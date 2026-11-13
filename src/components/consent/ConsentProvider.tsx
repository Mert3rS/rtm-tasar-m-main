'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  getConsentSnapshot,
  hasConsent,
  initConsentStore,
  onConsentChange,
  refreshConsentFromCookie,
  saveConsent,
  type ConsentSnapshot,
} from '@/lib/consent/storage'
import type { ConsentChoices, ConsentSource } from '@/lib/consent/cookie'
import type { ConsentCategory } from '@/lib/consent/registry'
import { ConsentCard, type ConsentView } from './ConsentCard'

export type ConsentPolicy = {
  ready: boolean
  version: string
  privacyHref?: string
  privacyExternal?: boolean
  bannerTitle?: string
  bannerDescription?: string
}

type ConsentContextValue = {
  snapshot: ConsentSnapshot
  policy: ConsentPolicy
  save: (choices: ConsentChoices, source: ConsentSource) => void
  openPreferences: () => void
  announcement: string
}

const OPEN_EVENT = 'rtm-open-consent-preferences'
const LEAVE_MS = 280
const TOAST_MS = 3000
const ConsentContext = createContext<ConsentContextValue | null>(null)

/** Opens the consent card in its preferences view from anywhere (footer, assistant, policy page). */
export function openConsentPreferences() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}
export { hasConsent, onConsentChange }

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function ConsentProvider({
  children,
  policy,
  initialDecided,
  initialChoices,
}: {
  children: ReactNode
  policy: ConsentPolicy
  initialDecided: boolean
  initialChoices: ConsentChoices
}) {
  // Initialise the browser store during the first client render, before children effects read it.
  // initConsentStore is idempotent and a no-op on the server.
  useState(() => {
    initConsentStore(policy.version, policy.ready)
    return true
  })
  const serverSnapshot = useMemo<ConsentSnapshot>(
    () => ({
      policyVersion: policy.version,
      policyReady: policy.ready,
      decided: initialDecided,
      choices: initialChoices,
      record: null,
    }),
    [policy.version, policy.ready, initialDecided, initialChoices],
  )
  // The server reads the consent cookie, so an already-decided visitor never sees the card flash.
  const snapshot = useSyncExternalStore(
    (callback) => onConsentChange(callback),
    getConsentSnapshot,
    () => serverSnapshot,
  )
  const [reopened, setReopened] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [view, setView] = useState<ConsentView>('summary')
  const [announcement, setAnnouncement] = useState('')
  const returnFocus = useRef<HTMLElement | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const list = timers.current
    // Development only: leave room for the Next.js dev indicator in the bottom-left corner.
    if (process.env.NODE_ENV === 'development') document.documentElement.dataset.devIndicator = 'true'
    return () => list.forEach((id) => window.clearTimeout(id))
  }, [])
  const later = (callback: () => void, ms: number) => {
    timers.current.push(window.setTimeout(callback, ms))
  }

  useEffect(() => {
    const open = () => {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      setLeaving(false)
      setView('preferences')
      setReopened(true)
    }
    const refresh = () => {
      if (document.visibilityState === 'visible') refreshConsentFromCookie()
    }
    window.addEventListener(OPEN_EVENT, open)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener(OPEN_EVENT, open)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  // Focus returns to the opener after the card has unmounted and the re-open button is visible.
  const [focusPending, setFocusPending] = useState(false)
  const restoreFocus = useCallback(() => setFocusPending(true), [])

  /** Slide the card out (instant with reduced motion), then unmount it. */
  const closeCard = useCallback(() => {
    setReopened(false)
    if (reducedMotion()) {
      setView('summary')
      restoreFocus()
      return
    }
    setLeaving(true)
    timers.current.push(
      window.setTimeout(() => {
        setLeaving(false)
        setView('summary')
        restoreFocus()
      }, LEAVE_MS),
    )
  }, [restoreFocus])

  const save = useCallback((choices: ConsentChoices, source: ConsentSource) => {
    const previous = getConsentSnapshot()
    const revoked =
      previous.decided &&
      (Object.keys(choices) as (keyof ConsentChoices)[]).some(
        (key) => previous.choices[key] && !choices[key],
      )
    const record = saveConsent(choices)
    // Anonymous proof; failure never changes the browser decision.
    void fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        consentId: record.id,
        policyVersion: record.v,
        choices: record.c,
        source: revoked ? 'revoke' : source,
      }),
    }).catch(() => undefined)
  }, [])

  const decide = (choices: ConsentChoices, source: ConsentSource) => {
    save(choices, source)
    closeCard()
    setAnnouncement('Tercihleriniz kaydedildi')
    later(() => setAnnouncement(''), TOAST_MS)
  }

  const openPreferences = useCallback(() => openConsentPreferences(), [])
  const value = useMemo(
    () => ({ snapshot, policy, save, openPreferences, announcement }),
    [snapshot, policy, save, openPreferences, announcement],
  )
  const cardVisible = !snapshot.decided || reopened || leaving

  useEffect(() => {
    if (!focusPending || cardVisible) return
    const frame = window.requestAnimationFrame(() => {
      const target = returnFocus.current
      returnFocus.current = null
      setFocusPending(false)
      if (target?.isConnected) target.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [focusPending, cardVisible])

  return (
    <ConsentContext value={value}>
      {children}
      {cardVisible ? (
        <ConsentCard
          view={view}
          onViewChange={setView}
          leaving={leaving}
          decided={snapshot.decided}
          onDecide={decide}
          onDismiss={closeCard}
        />
      ) : null}
      <p className="consent-toast" role="status" aria-live="polite" data-visible={announcement ? 'true' : 'false'}>
        {announcement ? (
          <>
            <span className="consent-toast-mark" aria-hidden="true" />
            {announcement}
          </>
        ) : null}
      </p>
    </ConsentContext>
  )
}

export function useConsent() {
  const context = useContext(ConsentContext)
  if (!context) throw new Error('useConsent must be used inside ConsentProvider')
  return {
    ...context,
    hasConsent: (category: ConsentCategory) =>
      category === 'necessary' ? true : context.snapshot.choices[category],
  }
}

/** Renders children only while the category is granted; future scripts must sit behind it. */
export function ConsentGate({
  category,
  children,
  fallback = null,
}: {
  category: ConsentCategory
  children: ReactNode
  fallback?: ReactNode
}) {
  const { hasConsent: granted } = useConsent()
  return <>{granted(category) ? children : fallback}</>
}
