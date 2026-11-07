'use client'

import { useEffect, useRef, type ReactNode } from 'react'

const revealSelector = [
  '[data-archive-reveal]',
  '.project-gallery > [data-reveal]',
  '.catalog-grid > [data-reveal]',
].join(', ')

export function ArchiveMotion({
  children,
  className,
  motionKey,
}: {
  children: ReactNode
  className: string
  motionKey: string
}) {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root || !('IntersectionObserver' in window)) return

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motionQuery.matches) return

    const items = Array.from(root.querySelectorAll<HTMLElement>(revealSelector))
    const animations = new Set<Animation>()
    root.dataset.archiveMotion = 'on'

    items.forEach((item, index) => {
      item.dataset.archiveRevealIndex = String(index)
      item.style.opacity = '0'
      item.style.filter = 'blur(12px)'
      item.style.transform = 'translateY(30px) scale(0.985)'
    })

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue
          const item = entry.target
          const index = Number(item.dataset.archiveRevealIndex ?? 0)
          const animation = item.animate(
            [
              { opacity: 0, filter: 'blur(12px)', transform: 'translateY(30px) scale(0.985)' },
              { opacity: 1, filter: 'blur(0)', transform: 'translateY(0) scale(1)' },
            ],
            {
              delay: (index % 3) * 85,
              duration: 780,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              fill: 'both',
            },
          )
          animations.add(animation)
          animation.finished
            .then(() => {
              item.dataset.archiveRevealed = 'true'
              item.style.removeProperty('opacity')
              item.style.removeProperty('filter')
              item.style.removeProperty('transform')
              animations.delete(animation)
            })
            .catch(() => undefined)
          observer.unobserve(item)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
    )

    items.forEach((item) => observer.observe(item))

    return () => {
      observer.disconnect()
      animations.forEach((animation) => animation.cancel())
      items.forEach((item) => {
        item.style.removeProperty('opacity')
        item.style.removeProperty('filter')
        item.style.removeProperty('transform')
        delete item.dataset.archiveRevealIndex
      })
      delete root.dataset.archiveMotion
    }
  }, [motionKey])

  return (
    <main className={className} id="main-content" ref={rootRef}>
      {children}
    </main>
  )
}
