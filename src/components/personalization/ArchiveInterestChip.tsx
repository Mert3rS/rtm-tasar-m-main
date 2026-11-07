'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useConsent } from '@/components/consent/ConsentProvider'
import { useInterestProfile } from './useInterestProfile'
import { MIN_PROFILE_SCORE } from '@/lib/personalization/interest'

/**
 * Small, dismissable hint on /projeler and /modeller. Filters are never applied automatically.
 * The slot height is reserved only when Personalisation consent is known at render time, so the
 * chip appearing after mount causes no layout shift; without consent nothing is rendered.
 */
export function ArchiveInterestChip({ archive, current }: { archive: 'projects' | 'models'; current?: string }) {
  const { hasConsent } = useConsent()
  const profile = useInterestProfile()
  const [dismissed, setDismissed] = useState(false)
  if (!hasConsent('personalization')) return null
  const signal =
    profile && profile.total >= MIN_PROFILE_SCORE
      ? (archive === 'projects' ? profile.signals.projectCategory : profile.signals.modelCategory).find((item) => item.slug !== current)
      : undefined
  const base = archive === 'projects' ? '/projeler' : '/modeller'
  return (
    <div className="site-shell interest-chip-slot">
      {signal && !dismissed ? (
        <p className="interest-chip">
          <Link href={`${base}?kategori=${encodeURIComponent(signal.slug)}`}>
            {signal.label} {archive === 'projects' ? 'projelerine' : 'modellerine'} göz atın
          </Link>
          <button type="button" aria-label="Öneriyi kapat" onClick={() => setDismissed(true)}>
            ×
          </button>
        </p>
      ) : null}
    </div>
  )
}
