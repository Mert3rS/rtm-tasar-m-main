'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { clearInterest, describeProfile, MIN_PROFILE_SCORE, recommendationRequest } from '@/lib/personalization/interest'
import { safeInternalHref } from '@/lib/assistant/links'
import { openConsentPreferences } from '@/components/consent/ConsentProvider'
import { useInterestProfile } from './useInterestProfile'

type Card = {
  kind: 'project' | 'model' | 'service' | 'showroom'
  slug: string
  title: string
  href: string
  description?: string
  image?: { url: string; alt: string }
}
const kindLabel = { project: 'Proje', model: 'Model', service: 'Hizmet', showroom: 'Showroom' }

/**
 * Interest-based cards. Renders nothing on the server, without consent, with thin interest data
 * or with no results (no fake suggestions). Placed below existing content so filling it later
 * cannot shift what the visitor is looking at. One small request per page view.
 */
export function InterestCards({
  variant,
  exclude,
}: {
  variant: 'home' | 'detail'
  exclude?: { type: Card['kind']; slug: string }
}) {
  const profile = useInterestProfile()
  const [cards, setCards] = useState<Card[]>([])
  const requested = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const enough = Boolean(profile && profile.total >= MIN_PROFILE_SCORE)
  const excludeKey = exclude ? `${exclude.type}:${exclude.slug}` : ''

  // Abort only on unmount: profile updates on the same page must not cancel the single request.
  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    if (!enough || !profile || requested.current) return
    requested.current = true
    controller.current = new AbortController()
    const [type, slug] = excludeKey.split(':')
    fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        recommendationRequest(profile, type && slug ? { type: type as Card['kind'], slug } : undefined),
      ),
      signal: controller.current.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: unknown) => {
        if (body && typeof body === 'object' && 'cards' in body && Array.isArray(body.cards)) setCards(body.cards as Card[])
      })
      .catch(() => undefined)
  }, [enough, profile, excludeKey])

  if (!profile || !enough || !cards.length) return null
  const reasons = describeProfile(profile, 3)
  return (
    <section className="interest-section" aria-labelledby={`interest-${variant}`} data-personalized="true">
      <div className="site-shell interest-section-inner">
        <div className="interest-header">
          <div>
            <p className="interest-kicker">KİŞİSELLEŞTİRİLMİŞ</p>
            <h2 id={`interest-${variant}`}>{variant === 'home' ? 'Sizin için seçtiklerimiz' : 'İlginizi çekebilir'}</h2>
          </div>
          <details className="interest-why">
            <summary>Neden bunu görüyorum?</summary>
            <p>
              {reasons.length
                ? `Daha önce baktığınız ${reasons.join(', ')} içeriklerine göre öneriliyor.`
                : 'Bu sitede baktığınız içeriklere göre öneriliyor.'}{' '}
              Bu bilgi yalnızca tarayıcınızda tutulur.
            </p>
            <div className="interest-why-actions">
              <button type="button" className="consent-link-button" onClick={() => openConsentPreferences()}>
                Tercihleri yönet
              </button>
              <button type="button" className="consent-link-button" onClick={() => clearInterest()}>
                Geçmişi temizle
              </button>
            </div>
          </details>
        </div>
        <ul className="interest-grid">
          {cards.map((card) => {
            const href = safeInternalHref(card.href)
            if (!href) return null
            return (
              <li key={`${card.kind}-${card.slug}`}>
                <Link className="interest-card" href={href}>
                  {card.image ? (
                    <Image src={card.image.url} alt={card.image.alt} width={480} height={360} sizes="(min-width: 1024px) 25vw, (min-width: 520px) 50vw, 100vw" />
                  ) : (
                    <span className="assistant-card-placeholder" aria-hidden="true" />
                  )}
                  <span className="interest-kind">{kindLabel[card.kind]}</span>
                  <strong>{card.title}</strong>
                  {card.description ? <span className="muted">{card.description}</span> : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
