'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect } from 'react'

import { useTheme } from '@payloadcms/ui'

export function AdminThemeToggle() {
  const { autoMode, setTheme, theme } = useTheme()

  useEffect(() => {
    if (autoMode) setTheme('light')
  }, [autoMode, setTheme])

  const isDark = theme === 'dark'

  return (
    <button
      aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      aria-pressed={isDark}
      className="rtm-admin-theme-toggle"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      type="button"
    >
      <Sun aria-hidden="true" className="rtm-admin-theme-toggle__sun" />
      <Moon aria-hidden="true" className="rtm-admin-theme-toggle__moon" />
      <span>{isDark ? 'Açık tema' : 'Koyu tema'}</span>
    </button>
  )
}
