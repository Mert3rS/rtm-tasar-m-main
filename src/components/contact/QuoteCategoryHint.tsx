'use client'

import { useState } from 'react'
import { useInterestProfile } from '@/components/personalization/useInterestProfile'
import { MIN_PROFILE_SCORE } from '@/lib/personalization/interest'

/**
 * Personalisation hint for the quote form. Never fills the field by itself: the visitor sees the
 * suggestion and decides. Nothing about the form is stored.
 */
export function QuoteCategoryHint({ categories, selectId }: { categories: { id: number; name: string }[]; selectId: string }) {
  const profile = useInterestProfile()
  const [hidden, setHidden] = useState(false)
  if (!profile || profile.total < MIN_PROFILE_SCORE || hidden) return null
  const normalize = (value: string) => value.toLocaleLowerCase('tr-TR').trim()
  const match = profile.signals.projectCategory
    .map((signal) => categories.find((category) => normalize(category.name) === normalize(signal.label)))
    .find(Boolean)
  if (!match) return null
  return (
    <p className="interest-suggestion inquiry-field-wide" role="note">
      <span>İlgilendiğiniz içeriklere göre: {match.name}</span>
      <button
        type="button"
        onClick={() => {
          const dropdown = document.getElementById(selectId)
          if (dropdown instanceof HTMLButtonElement) {
            dropdown.dispatchEvent(
              new CustomEvent('site-dropdown:set', { detail: String(match.id) }),
            )
            dropdown.focus()
          }
          setHidden(true)
        }}
      >
        Bu kategoriyi seç
      </button>
    </p>
  )
}
