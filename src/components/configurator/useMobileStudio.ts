'use client'

import { useSyncExternalStore } from 'react'

const query = '(max-width: 820px)'
function subscribe(callback: () => void) {
  const media = matchMedia(query)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}
export function useMobileStudio() {
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(query).matches,
    () => false,
  )
}
