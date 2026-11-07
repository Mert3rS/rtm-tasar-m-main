'use client'

import { openConsentPreferences } from './ConsentProvider'

export function CookiePreferencesButton({
  className = 'footer-consent-button',
  children = 'Çerez tercihleri',
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <button type="button" className={className} onClick={() => openConsentPreferences()}>
      {children}
    </button>
  )
}
