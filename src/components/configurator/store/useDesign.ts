'use client'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { configSchema, defaultConfig, decode, encode, type Config } from '@/lib/configurator/config'
import { onConsentChange, safeStorage } from '@/lib/consent/storage'
import { applyBathroomPreset } from '@/lib/configurator/bathroom'

const DESIGN_KEY = 'rtm-design-v2'

type History = { past: Config[]; present: Config; future: Config[] }
type Action =
  { type: 'edit'; value: Config } | { type: 'restore'; value: Config } | { type: 'undo' | 'redo' }
function reducer(s: History, a: Action): History {
  if (a.type === 'restore') return { past: [], present: a.value, future: [] }
  if (a.type === 'edit')
    return JSON.stringify(s.present) === JSON.stringify(a.value)
      ? s
      : { past: [...s.past, s.present].slice(-60), present: a.value, future: [] }
  if (a.type === 'undo' && s.past.length)
    return {
      past: s.past.slice(0, -1),
      present: s.past[s.past.length - 1],
      future: [s.present, ...s.future],
    }
  if (a.type === 'redo' && s.future.length)
    return { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) }
  return s
}
export function useDesign() {
  const [history, dispatch] = useReducer(reducer, {
    past: [],
    present: defaultConfig(),
    future: [],
  })
  const [ready, setReady] = useState(false)
  const [resumed, setResumed] = useState(false)
  const [message, setMessage] = useState('')
  const saveTimer = useRef(0)
  const persist = useCallback((value: Config) => {
    window.history.replaceState(null, '', `#c=${encode(value)}`)
    if (safeStorage.set(DESIGN_KEY, JSON.stringify(value), 'functional') === 'unavailable')
      setMessage('Tarayıcı kaydı kullanılamıyor. Bağlantıyı kopyalayarak tasarımınızı saklayın.')
  }, [])
  useEffect(() => {
    function restore() {
      try {
        if (window.location.hash) {
          dispatch({ type: 'restore', value: decode(window.location.hash) })
          return
        }
        // Returns null without Functional consent: the design then lives in this tab and the #c= link.
        const saved = safeStorage.get(DESIGN_KEY)
        if (saved) {
          dispatch({ type: 'restore', value: configSchema.parse(JSON.parse(saved)) })
          setResumed(true)
        }
      } catch {
        dispatch({ type: 'restore', value: defaultConfig() })
        setMessage('Kayıtlı tasarım okunamadı. Varsayılan tasarım açıldı.')
      } finally {
        setReady(true)
      }
    }
    restore()
    window.addEventListener('hashchange', restore)
    return () => window.removeEventListener('hashchange', restore)
  }, [])
  useEffect(() => {
    if (!ready) return
    saveTimer.current = window.setTimeout(() => persist(history.present), 300)
    return () => clearTimeout(saveTimer.current)
  }, [history.present, ready, persist])
  useEffect(() => {
    if (!ready) return
    // Accepting Functional consent later keeps the current design as the local backup.
    return onConsentChange((snapshot) => {
      if (snapshot.choices.functional)
        safeStorage.set(DESIGN_KEY, JSON.stringify(history.present), 'functional')
    })
  }, [history.present, ready])
  const edit = useCallback(
    (recipe: (c: Config) => void) => {
      try {
        const c = structuredClone(history.present)
        recipe(c)
        dispatch({ type: 'edit', value: configSchema.parse(c) })
      } catch (error) {
        setMessage(
          error instanceof Error && !('issues' in error)
            ? error.message
            : 'Bu ölçü uygulanamadı. Bölme ve gözlerin minimum ölçülerini kontrol edin.',
        )
      }
    },
    [history.present],
  )
  return {
    config: history.present,
    // Commit before route navigation so a delayed hash write cannot interrupt the transition.
    flushSave: () => {
      clearTimeout(saveTimer.current)
      persist(history.present)
    },
    edit,
    ready,
    resumed,
    message,
    setMessage,
    undo: useCallback(() => dispatch({ type: 'undo' }), []),
    redo: useCallback(() => dispatch({ type: 'redo' }), []),
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    reset: (m: Config['m'] = 'ozel') => {
      const value = defaultConfig(m)
      if (m === 'banyo') applyBathroomPreset(value, 'reference')
      dispatch({ type: 'edit', value: configSchema.parse(value) })
      setResumed(false)
    },
  }
}
