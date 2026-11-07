'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  categoryInfo,
  entriesFor,
  visibleOptionalCategories,
  type ConsentCategory,
} from '@/lib/consent/registry'
import { noOptionalConsent, type ConsentChoices } from '@/lib/consent/cookie'
import { buildProfile, clearInterest, describeProfile, getInterestEvents } from '@/lib/personalization/interest'
import { allOptionalOn } from './ConsentCard'
import { useConsent } from './ConsentProvider'

const kindLabel = { cookie: 'Çerez', localStorage: 'Yerel depolama', sessionStorage: 'Sekme depolaması' }

function StorageTable({ category }: { category: ConsentCategory }) {
  const entries = entriesFor(category)
  if (!entries.length) return <p className="consent-empty">Bu kategoride kayıt yok.</p>
  return (
    <div className="consent-table-wrap">
      <table className="consent-table">
        <thead>
          <tr>
            <th scope="col">Ad</th>
            <th scope="col">Amaç</th>
            <th scope="col">Süre</th>
            <th scope="col">Tür</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.name}>
              <td>
                <code>{entry.name}</code>
              </td>
              <td>
                {entry.purpose}
                {entry.legalReview ? <small> {entry.legalReview}</small> : null}
              </td>
              <td>{entry.duration}</td>
              <td>{kindLabel[entry.kind]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Detailed view rendered inside the consent card (loaded on demand). Switches are role="switch"
 * buttons; nothing is persisted until one of the footer actions is chosen.
 */
export function ConsentPreferences({
  titleId,
  descId,
  backHint,
  onBack,
  onCommit,
}: {
  titleId: string
  descId: string
  backHint: string
  onBack: () => void
  onCommit: (choices: ConsentChoices) => void
}) {
  const { snapshot, policy } = useConsent()
  const [choices, setChoices] = useState<ConsentChoices>(() => ({ ...snapshot.choices }))
  // Read once from this browser only; the list never leaves the device.
  const [interests, setInterests] = useState<string[]>(() =>
    snapshot.choices.personalization ? describeProfile(buildProfile(getInterestEvents()), 10) : [],
  )
  const [message, setMessage] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const optionalDisabled = !policy.ready

  // This view loads on demand, so it focuses its own heading once mounted.
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div className="consent-prefs">
      <div className="consent-prefs-bar">
        <button type="button" className="consent-back" onClick={onBack} aria-describedby={`${titleId}-back`}>
          <span aria-hidden="true">←</span> Geri
        </button>
        <span className="consent-sr" id={`${titleId}-back`}>
          {backHint}
        </span>
        <p className="consent-kicker">RTM / GİZLİLİK</p>
      </div>
      <div className="consent-prefs-body">
        <h2 ref={heading} className="consent-title" id={titleId} tabIndex={-1} data-consent-heading>
          Çerez tercihleri
        </h2>
        <p className="consent-text" id={descId}>
          Zorunlu olmayan kategoriler yalnızca izninizle çalışır. Geri aldığınız kategoriye ait kayıtlar tarayıcınızdan hemen silinir.{' '}
          <Link href="/cerez-politikasi">Çerez politikası</Link>
        </p>
        {optionalDisabled ? (
          <p className="consent-notice" role="note">
            Onaylı çerez politikası henüz yayınlanmadığı için isteğe bağlı kategoriler kapalıdır. Site yalnızca zorunlu çerezlerle çalışır.
          </p>
        ) : null}
        <ul className="consent-categories">
          {(['necessary', ...visibleOptionalCategories] as ConsentCategory[]).map((category) => {
            const info = categoryInfo[category]
            const locked = category === 'necessary'
            const checked = locked || choices[category as keyof ConsentChoices]
            const headingId = `${titleId}-${category}`
            return (
              <li key={category} className="consent-category">
                <div className="consent-category-head">
                  <div>
                    <h3 id={headingId}>{info.title}</h3>
                    <p id={`${headingId}-desc`}>{info.description}</p>
                  </div>
                  {locked ? (
                    <span className="consent-always">Her zaman açık</span>
                  ) : (
                    <button
                      type="button"
                      role="switch"
                      className="consent-switch"
                      aria-checked={checked}
                      aria-labelledby={headingId}
                      aria-describedby={`${headingId}-desc`}
                      disabled={optionalDisabled}
                      onClick={() =>
                        setChoices((current) => ({ ...current, [category]: !current[category as keyof ConsentChoices] }))
                      }
                    >
                      <span aria-hidden="true" />
                    </button>
                  )}
                </div>
                <details className="consent-details">
                  <summary>Ayrıntılar</summary>
                  <StorageTable category={category} />
                </details>
                {category === 'personalization' && snapshot.choices.personalization ? (
                  <div className="consent-interest">
                    <p className="consent-interest-title">Kaydedilen ilgi alanlarım</p>
                    {interests.length ? (
                      <ul className="consent-interest-list">
                        {interests.map((interest) => (
                          <li key={interest}>{interest}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="consent-empty">Kayıtlı ilgi alanı yok.</p>
                    )}
                    <button
                      type="button"
                      className="consent-link-button"
                      disabled={!interests.length}
                      onClick={() => {
                        clearInterest()
                        setInterests([])
                        setMessage('İlgi geçmişiniz temizlendi.')
                      }}
                    >
                      Geçmişimi temizle
                    </button>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
        <p className="consent-live-inline" role="status" aria-live="polite">
          {message}
        </p>
      </div>
      <footer className="consent-prefs-actions">
        {policy.ready ? (
          <>
            <button
              type="button"
              className="consent-button consent-button-signal consent-button-wide"
              onClick={() => onCommit({ ...choices, marketing: false })}
            >
              Seçimlerimi kaydet
            </button>
            <button type="button" className="consent-button consent-button-outline" onClick={() => onCommit(allOptionalOn)}>
              Tümünü kabul et
            </button>
            <button type="button" className="consent-button consent-button-outline" onClick={() => onCommit({ ...noOptionalConsent })}>
              Tümünü reddet
            </button>
          </>
        ) : (
          <button type="button" className="consent-button consent-button-ink consent-button-wide" onClick={() => onCommit({ ...noOptionalConsent })}>
            Anladım
          </button>
        )}
      </footer>
    </div>
  )
}
