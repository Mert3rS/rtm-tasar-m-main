'use client'

import {
  createContext,
  useContext,
  useLayoutEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { onConsentChange, safeStorage } from '@/lib/consent/storage'

export type Theme = 'light' | 'dark'
export const THEME_STORAGE_KEY = 'rtm-theme'

function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function serverTheme(): Theme {
  return 'light'
}

function subscribe(callback: () => void) {
  window.addEventListener('rtm-theme-change', callback)
  return () => window.removeEventListener('rtm-theme-change', callback)
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  window.dispatchEvent(new Event('rtm-theme-change'))
}

function setTheme(theme: Theme) {
  applyTheme(theme)
  // Persists only with Functional consent; otherwise the choice lives in this tab only.
  safeStorage.set(THEME_STORAGE_KEY, theme, 'functional')
}

const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>({
  theme: 'light',
  setTheme,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme)

  useLayoutEffect(() => {
    function restorePreference() {
      const saved = safeStorage.get(THEME_STORAGE_KEY)
      // Without consent (or nothing saved) the in-tab theme stays as it is.
      if (saved === 'dark' || saved === 'light') applyTheme(saved)
      else applyTheme(readTheme())
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === THEME_STORAGE_KEY || event.key === null) restorePreference()
    }

    restorePreference()
    window.addEventListener('storage', handleStorage)
    // Granting Functional consent keeps the theme chosen in this tab; revoking leaves it in-tab.
    const unsubscribe = onConsentChange((snapshot) => {
      if (snapshot.choices.functional) safeStorage.set(THEME_STORAGE_KEY, readTheme(), 'functional')
    })
    return () => {
      window.removeEventListener('storage', handleStorage)
      unsubscribe()
    }
  }, [])

  return <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>
}

export function useTheme() {
  return useContext(ThemeContext)
}
