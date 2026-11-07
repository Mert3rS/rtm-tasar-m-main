'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  defaultScenePreferences,
  readScenePreferences,
  saveScenePreferences,
  type ScenePreferences,
} from '@/lib/configurator/scenePreferences'
import { safeStorage } from '@/lib/consent/storage'

/** Consent-aware Storage adapter: reads/writes only with Functional consent. */
const consentStorage = {
  getItem: (key: string) => safeStorage.get(key),
  setItem: (key: string, value: string) => {
    safeStorage.set(key, value, 'functional')
  },
}

export function useScenePreferences() {
  const [preferences, setPreferences] = useState(defaultScenePreferences)
  const current = useRef(defaultScenePreferences)
  const hydrated = useRef(false)
  const frame = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    frame.current = requestAnimationFrame(() => {
      try {
        current.current = readScenePreferences(consentStorage)
      } catch {
        current.current = { ...defaultScenePreferences }
      }
      hydrated.current = true
      setPreferences(current.current)
    })
    return () => {
      cancelAnimationFrame(frame.current)
      clearTimeout(timer.current)
    }
  }, [])
  const persist = useCallback(() => {
    clearTimeout(timer.current)
    // React development effect replay must never overwrite a saved preference before reading it.
    if (!hydrated.current) return
    saveScenePreferences(consentStorage, current.current)
  }, [])
  useEffect(() => {
    window.addEventListener('pagehide', persist)
    return () => {
      window.removeEventListener('pagehide', persist)
      persist()
    }
  }, [persist])
  const update = useCallback(
    (patch: Partial<ScenePreferences>, commit = true) => {
      current.current = { ...current.current, ...patch }
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => setPreferences(current.current))
      clearTimeout(timer.current)
      if (commit) persist()
      else timer.current = setTimeout(persist, 350)
    },
    [persist],
  )
  return { preferences, update, persist, reset: () => update({ ...defaultScenePreferences }) }
}
