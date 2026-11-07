'use client'

import { useEffect } from 'react'
import { recordInterest, type InterestInput } from '@/lib/personalization/interest'
import { useConsent } from '@/components/consent/ConsentProvider'

/**
 * Records one view of published content (Personalisation consent only) and adds the dwell time
 * when the visitor leaves. Renders nothing; no layout impact.
 */
export function TrackInterest(props: InterestInput) {
  const { hasConsent } = useConsent()
  const allowed = hasConsent('personalization')
  const key = JSON.stringify(props)
  useEffect(() => {
    if (!allowed) return
    const input = JSON.parse(key) as InterestInput
    const started = Date.now()
    const finish = recordInterest(input)
    let done = false
    const end = () => {
      if (done) return
      done = true
      finish((Date.now() - started) / 1000)
    }
    window.addEventListener('pagehide', end)
    return () => {
      window.removeEventListener('pagehide', end)
      end()
    }
  }, [allowed, key])
  return null
}
