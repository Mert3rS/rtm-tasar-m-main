'use client'

import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from 'react'

const MotionContext = createContext(true)
const motionQuery = '(prefers-reduced-motion: reduce)'
const subscribe = (callback: () => void) => {
  const query = window.matchMedia(motionQuery)
  query.addEventListener('change', callback)
  return () => query.removeEventListener('change', callback)
}
export function useHomeMotion() {
  return useContext(MotionContext)
}

/** Progressive enhancement: content remains visible without JS or motion support. */
export function HomeMotion({ children }: { children: React.ReactNode }) {
  const reduced = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(motionQuery).matches,
    () => false,
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const active = !reduced

  useEffect(() => {
    const root = rootRef.current
    if (!root || !active || !('IntersectionObserver' in window)) return
    const items = root.querySelectorAll<HTMLElement>('[data-reveal]')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue
          entry.target.dataset.revealed = 'true'
          entry.target.animate(
            [
              { opacity: 0, transform: 'translateY(38px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            { duration: 850, easing: 'cubic-bezier(.16,1,.3,1)' },
          )
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.08 },
    )
    items.forEach((item) => {
      if (!item.dataset.revealed) observer.observe(item)
    })
    return () => {
      observer.disconnect()
      items.forEach((item) => item.getAnimations().forEach((animation) => animation.cancel()))
    }
  }, [active])

  return (
    <MotionContext value={active}>
      <div className="home-experience" data-motion={active ? 'on' : 'off'} ref={rootRef}>
        {children}
      </div>
    </MotionContext>
  )
}
