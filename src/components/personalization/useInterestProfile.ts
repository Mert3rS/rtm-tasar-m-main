'use client'

import { useEffect, useState } from 'react'
import { buildProfile, getInterestEvents, onInterestChange, type InterestProfile } from '@/lib/personalization/interest'
import { useConsent } from '@/components/consent/ConsentProvider'

/** Profile is read after mount only (never during SSR), so hydration output stays identical. */
export function useInterestProfile(): InterestProfile | null {
  const { hasConsent } = useConsent()
  const allowed = hasConsent('personalization')
  const [profile, setProfile] = useState<InterestProfile | null>(null)
  useEffect(() => {
    if (!allowed) return
    const update = () => setProfile(buildProfile(getInterestEvents()))
    update()
    return onInterestChange(update)
  }, [allowed])
  return allowed ? profile : null
}
