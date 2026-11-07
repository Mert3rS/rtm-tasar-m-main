'use client'

import { useEffect, useRef } from 'react'

export type SheetSnap = 'closed' | 'half' | 'full'
const snaps: SheetSnap[] = ['closed', 'half', 'full']

export function MobileSheetHandle({
  snap,
  onSnap,
}: {
  snap: SheetSnap
  onSnap: (snap: SheetSnap) => void
}) {
  const start = useRef<number | null>(null)
  const frame = useRef(0)
  useEffect(() => () => cancelAnimationFrame(frame.current), [])
  return (
    <button
      type="button"
      className="dc-mobile-grip"
      aria-label={`${snap === 'closed' ? 'Seçenekleri aç' : snap === 'half' ? 'Seçenekler · Yarım panel' : 'Seçenekler · Tam panel'} — Seçenekler panelinin yüksekliğini ayarla`}
      aria-expanded={snap !== 'closed'}
      aria-controls="design-options-content"
      onClick={(e) => {
        if (!e.defaultPrevented)
          onSnap(snap === 'closed' ? 'half' : snap === 'half' ? 'full' : 'half')
      }}
      onPointerDown={(e) => {
        start.current = e.clientY
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (start.current === null) return
        const delta = start.current - e.clientY
        const node = e.currentTarget.closest<HTMLElement>('.dc-panel')
        cancelAnimationFrame(frame.current)
        frame.current = requestAnimationFrame(() =>
          node?.style.setProperty('--sheet-drag', `${-delta * 0.15}px`),
        )
      }}
      onPointerUp={(e) => {
        cancelAnimationFrame(frame.current)
        e.currentTarget.closest<HTMLElement>('.dc-panel')?.style.removeProperty('--sheet-drag')
        if (start.current !== null && Math.abs(start.current - e.clientY) > 25) {
          const direction = e.clientY < start.current ? 1 : -1
          onSnap(snaps[Math.max(0, Math.min(2, snaps.indexOf(snap) + direction))])
          // Suppress the synthetic click after an intentional drag.
          e.currentTarget.addEventListener('click', (event) => event.preventDefault(), {
            once: true,
            capture: true,
          })
        }
        start.current = null
      }}
      onPointerCancel={(e) => {
        start.current = null
        cancelAnimationFrame(frame.current)
        e.currentTarget.closest<HTMLElement>('.dc-panel')?.style.removeProperty('--sheet-drag')
      }}
      onKeyDown={(e) => {
        if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
          e.preventDefault()
          e.stopPropagation()
          onSnap(
            e.key === 'Home'
              ? 'closed'
              : e.key === 'End'
                ? 'full'
                : snaps[
                    Math.max(0, Math.min(2, snaps.indexOf(snap) + (e.key === 'ArrowUp' ? 1 : -1)))
                  ],
          )
        }
      }}
    >
      <span />
      <span>
        {snap === 'closed'
          ? 'Seçenekleri aç'
          : snap === 'half'
            ? 'Seçenekler · Yarım panel'
            : 'Seçenekler · Tam panel'}
      </span>
    </button>
  )
}
