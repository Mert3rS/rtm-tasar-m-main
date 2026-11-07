'use client'

import { createContext, useContext, useMemo } from 'react'
import { useTheme } from '@/components/theme/ThemeProvider'

export const sceneTokenNames = [
  'viewport',
  'floor',
  'wall',
  'light',
  'ground-light',
  'ink-shadow',
  'selection',
  'led',
  'led-emission',
  'metal',
  'wood-grain',
  'wood-base',
  'wood-dark',
  'counter',
  'drawer',
  'human',
  'gold',
  'bronze',
] as const
type SceneColors = Record<(typeof sceneTokenNames)[number], string>
export const SceneThemeContext = createContext<SceneColors | null>(null)

export function useSceneColors() {
  const colors = useContext(SceneThemeContext)
  if (!colors) throw new Error('Studio scene theme unavailable')
  return colors
}

export function useSceneTheme() {
  const { theme } = useTheme()
  return useMemo(() => {
    const root =
      document.querySelector(`[data-theme="${theme}"] .configurator-shell`) ||
      document.documentElement
    const styles = getComputedStyle(root)
    const read = (name: (typeof sceneTokenNames)[number]) =>
      styles.getPropertyValue(`--studio-${name}`).trim()
    return {
      viewport: read('viewport'),
      floor: read('floor'),
      wall: read('wall'),
      light: read('light'),
      'ground-light': read('ground-light'),
      'ink-shadow': read('ink-shadow'),
      selection: read('selection'),
      led: read('led'),
      'led-emission': read('led-emission'),
      metal: read('metal'),
      'wood-grain': read('wood-grain'),
      'wood-base': read('wood-base'),
      'wood-dark': read('wood-dark'),
      counter: read('counter'),
      drawer: read('drawer'),
      human: read('human'),
      gold: styles.getPropertyValue('--material-altin').trim(),
      bronze: styles.getPropertyValue('--material-bronz').trim(),
    }
  }, [theme])
}
