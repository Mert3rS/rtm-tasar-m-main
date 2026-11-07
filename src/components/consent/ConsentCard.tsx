'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { noOptionalConsent, type ConsentChoices, type ConsentSource } from '@/lib/consent/cookie'
import { ConsentIcon } from './ConsentIcon'
import { useConsent } from './ConsentProvider'

export type ConsentView = 'summary' | 'preferences'

export const allOptionalOn: ConsentChoices = {
  functional: true,
  personalization: true,
  analytics: true,
  marketing: false,
}

// The detailed view (registry tables, interest list) loads on first use; hover/focus prefetches.
const loadPreferences = () => import('./ConsentPreferences').then((module) => module.ConsentPreferences)
const ConsentPreferences = dynamic(loadPreferences, {
  ssr: false,
  loading: () => (
    <p className="consent-loading" role="status">
      Tercihler yükleniyor…
    </p>
  ),
})

const MOBILE_QUERY = '(max-width: 640px)'
const focusableSelector =
  'button:not([disabled]), a[href], summary, [tabindex]:not([tabindex="-1"])'

/**
 * Bottom-left consent card. Non-blocking (aria-modal=false, no scrim, no focus trap) except the
 * preferences view on phones, which becomes a full-height modal sheet. There is no close button:
 * the first-visit card only closes through a decision. Its height is published as
 * --consent-banner-height so phone-width fixed controls can sit above it.
 */
export function ConsentCard({
  view,
  onViewChange,
  leaving,
  decided,
  onDecide,
  onDismiss,
}: {
  view: ConsentView
  onViewChange: (view: ConsentView) => void
  leaving: boolean
  decided: boolean
  onDecide: (choices: ConsentChoices, source: ConsentSource) => void
  onDismiss: () => void
}) {
  const { policy } = useConsent()
  const ref = useRef<HTMLElement>(null)
  const titleId = useId()
  const descId = useId()
  const [mobile, setMobile] = useState(false)
  const modal = mobile && view === 'preferences'

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY)
    const update = () => setMobile(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const node = ref.current
    const root = document.documentElement
    if (!node) return
    const update = () =>
      root.style.setProperty('--consent-banner-height', `${Math.ceil(node.getBoundingClientRect().height)}px`)
    update()
    root.dataset.consentBanner = 'open'
    const observer = 'ResizeObserver' in window ? new ResizeObserver(update) : null
    observer?.observe(node)
    return () => {
      observer?.disconnect()
      delete root.dataset.consentBanner
      root.style.removeProperty('--consent-banner-height')
    }
  }, [])

  // Focus the current view's heading on open and on every view switch (no trap on desktop).
  useEffect(() => {
    if (leaving) return
    const frame = window.requestAnimationFrame(() => {
      ref.current?.querySelector<HTMLElement>('[data-consent-heading]')?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [view, leaving])

  // Phone preferences sheet: the rest of the page is inert while it is open.
  useEffect(() => {
    const node = ref.current
    if (!modal || !node) return
    const siblings = [...document.body.children].filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element !== node && !element.inert && element.tagName !== 'SCRIPT',
    )
    siblings.forEach((element) => {
      element.inert = true
    })
    document.documentElement.dataset.consentSheet = 'open'
    return () => {
      siblings.forEach((element) => {
        element.inert = false
      })
      delete document.documentElement.dataset.consentSheet
    }
  }, [modal])

  const back = () => (decided ? onDismiss() : onViewChange('summary'))

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && view === 'preferences') {
      event.stopPropagation()
      back()
      return
    }
    if (event.key !== 'Tab' || !modal || !ref.current) return
    const focusable = [...ref.current.querySelectorAll<HTMLElement>(focusableSelector)].filter(
      (element) => element.offsetParent !== null,
    )
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && (document.activeElement === first || !ref.current.contains(document.activeElement))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const title = policy.ready
    ? policy.bannerTitle || 'Deneyiminizi size göre şekillendirelim'
    : 'Çerez bilgilendirmesi'
  const description = policy.ready
    ? policy.bannerDescription ||
      'Zorunlu çerezler sitenin güvenli çalışması için her zaman açıktır. İzin verirseniz baktığınız içeriğe göre öneriler sunarız; tercihlerinizi istediğiniz zaman değiştirebilirsiniz.'
    : 'Bu sitede yalnızca güvenlik ve temel çalışma için zorunlu çerezler kullanılır. Onaylı çerez politikası yayınlanana kadar isteğe bağlı çerezler ve kalıcı tercih kayıtları kapalıdır.'

  return (
    <section
      ref={ref}
      className="consent-card"
      data-view={view}
      data-state={leaving ? 'leaving' : 'open'}
      role="dialog"
      aria-modal={modal ? 'true' : 'false'}
      aria-labelledby={titleId}
      aria-describedby={descId}
      onKeyDown={onKeyDown}
    >
      {view === 'summary' ? (
        <div className="consent-summary" key="summary">
          <div className="consent-card-top">
            <ConsentIcon className="consent-card-icon" />
            <p className="consent-kicker">RTM / ÇEREZLER</p>
          </div>
          <h2 className="consent-title" id={titleId} tabIndex={-1} data-consent-heading>
            {title}
          </h2>
          <p className="consent-text" id={descId}>
            {description}
          </p>
          <p className="consent-links">
            <Link href="/cerez-politikasi">Çerez politikası</Link>
            {policy.privacyHref ? (
              policy.privacyExternal ? (
                <a href={policy.privacyHref} target="_blank" rel="noopener noreferrer">
                  Aydınlatma metni ↗
                </a>
              ) : (
                <Link href={policy.privacyHref}>Aydınlatma metni</Link>
              )
            ) : null}
          </p>
          {policy.ready ? (
            <div className="consent-choice">
              <button type="button" className="consent-button consent-button-signal" onClick={() => onDecide(allOptionalOn, 'banner')}>
                Tümünü kabul et
              </button>
              <button type="button" className="consent-button consent-button-ink" onClick={() => onDecide({ ...noOptionalConsent }, 'banner')}>
                Tümünü reddet
              </button>
            </div>
          ) : (
            <div className="consent-choice consent-choice-single">
              <button type="button" className="consent-button consent-button-ink" onClick={() => onDecide({ ...noOptionalConsent }, 'banner')}>
                Anladım
              </button>
            </div>
          )}
          <button
            type="button"
            className="consent-manage"
            onPointerEnter={() => void loadPreferences()}
            onFocus={() => void loadPreferences()}
            onClick={() => onViewChange('preferences')}
          >
            Tercihleri yönet <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : (
        <ConsentPreferences
          key="preferences"
          titleId={titleId}
          descId={descId}
          backHint={decided ? 'Tercih kartını kapat' : 'Özet görünüme dön'}
          onBack={back}
          onCommit={(choices) => onDecide(choices, 'preferences')}
        />
      )}
    </section>
  )
}
