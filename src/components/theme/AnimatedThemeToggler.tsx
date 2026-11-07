'use client'

import {
  useCallback,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
} from 'react'
import { flushSync } from 'react-dom'

type Theme = 'light' | 'dark'

type ViewTransitionLike = {
  ready: Promise<void>
  finished: Promise<void>
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => ViewTransitionLike
}

type ViewTransitionAnimationOptions = KeyframeAnimationOptions & {
  pseudoElement: string
}

type AnimatedThemeTogglerProps = Omit<ComponentPropsWithoutRef<'button'>, 'onClick'> & {
  duration?: number
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

function circleClipPaths(
  x: number,
  y: number,
  maxRadius: number,
  viewportWidth: number,
  viewportHeight: number,
): [string, string] {
  const point = `${(x / viewportWidth) * 100}% ${(y / viewportHeight) * 100}%`
  const referenceRadius = Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2
  return [`circle(0% at ${point})`, `circle(${(maxRadius / referenceRadius) * 100}% at ${point})`]
}

export function AnimatedThemeToggler({
  className,
  duration = 520,
  theme,
  onThemeChange,
  disabled,
  ...props
}: AnimatedThemeTogglerProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const transitioningRef = useRef(false)
  const activeAnimationRef = useRef<Animation | null>(null)

  const cancelAnimation = useCallback(() => {
    activeAnimationRef.current?.cancel()
    activeAnimationRef.current = null
  }, [])

  const clearTransitionState = useCallback(() => {
    const root = document.documentElement
    transitioningRef.current = false
    delete root.dataset.magicuiThemeVt
    root.style.removeProperty('--magicui-theme-toggle-vt-duration')
    root.style.removeProperty('--magicui-theme-vt-clip-from')
    cancelAnimation()
  }, [cancelAnimation])

  useEffect(() => clearTransitionState, [clearTransitionState])

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current
    const root = document.documentElement
    if (!button || disabled || transitioningRef.current || root.dataset.magicuiThemeVt === 'active')
      return

    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    const applyTheme = () => onThemeChange(nextTheme)
    const viewDocument = document as ViewTransitionDocument
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!viewDocument.startViewTransition || reducedMotion) {
      applyTheme()
      return
    }

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const { top, left, width, height } = button.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y),
    )
    const clipPath = circleClipPaths(x, y, maxRadius, viewportWidth, viewportHeight)

    root.dataset.magicuiThemeVt = 'active'
    root.style.setProperty('--magicui-theme-toggle-vt-duration', `${duration}ms`)
    root.style.setProperty('--magicui-theme-vt-clip-from', clipPath[0])
    transitioningRef.current = true

    const transition = viewDocument.startViewTransition(() => flushSync(applyTheme))
    transition.finished.finally(clearTransitionState).catch(() => {})
    transition.ready
      .then(() => {
        activeAnimationRef.current = root.animate(
          { clipPath },
          {
            duration,
            easing: 'ease-in-out',
            fill: 'forwards',
            pseudoElement: '::view-transition-new(root)',
          } as ViewTransitionAnimationOptions,
        )
      })
      .catch(clearTransitionState)
  }, [clearTransitionState, disabled, duration, onThemeChange, theme])

  return (
    <button
      {...props}
      className={className}
      disabled={disabled}
      onClick={toggleTheme}
      ref={buttonRef}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="theme-sun"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg
        aria-hidden="true"
        className="theme-moon"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <path d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5a8.6 8.6 0 1 0 10.7 10.7Z" />
      </svg>
    </button>
  )
}
