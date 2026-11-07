'use client'

import { AnimatedThemeToggler } from './AnimatedThemeToggler'
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <AnimatedThemeToggler
      aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
      aria-pressed={theme === 'dark'}
      className="icon-button theme-toggle"
      duration={560}
      onThemeChange={setTheme}
      theme={theme}
      title="Açık / koyu tema"
    />
  )
}
