'use client'

import { useState } from 'react'
import { products, productNames, type Config } from '@/lib/configurator/config'
import { useInterestProfile } from '@/components/personalization/useInterestProfile'
import { MIN_PROFILE_SCORE } from '@/lib/personalization/interest'

/**
 * With Personalisation consent, suggests starting with the product type the visitor chose last.
 * It never changes the current design itself: accepting opens the existing "change product"
 * confirmation. (An explicit `?urun=` link is applied directly by the Configurator.)
 */
export function StudioSuggestion({ current, onChoose }: { current: Config['m']; onChoose: (m: Config['m']) => void }) {
  const profile = useInterestProfile()
  const [dismissed, setDismissed] = useState(false)
  const suggestion =
    profile && profile.total >= MIN_PROFILE_SCORE
      ? products.find((item) => item === profile.signals.product[0]?.slug)
      : undefined
  if (!suggestion || suggestion === current || dismissed) return null
  return (
    <p className="interest-suggestion" role="note">
      <span>{productNames[suggestion]} ile başlamak ister misiniz?</span>
      <button type="button" onClick={() => onChoose(suggestion)}>
        Evet, {productNames[suggestion].toLocaleLowerCase('tr-TR')}
      </button>
      <button type="button" onClick={() => setDismissed(true)} aria-label="Öneriyi kapat">
        ×
      </button>
    </p>
  )
}
