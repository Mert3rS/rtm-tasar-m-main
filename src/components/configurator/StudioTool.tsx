'use client'

import { useEffect, useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function StudioTool({
  label, children, onClick, pressed, disabled = false, secondary = false, showLabel = false,
}: {
  label: string
  children: ReactNode
  onClick: () => void
  pressed?: boolean
  disabled?: boolean
  secondary?: boolean
  showLabel?: boolean
}) {
  const id = useId()
  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null)
  useEffect(() => {
    if (!anchor) return
    const dismiss = () => setAnchor(null)
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss() }
    window.addEventListener('resize', dismiss)
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('keydown', escape)
    return () => {
      window.removeEventListener('resize', dismiss)
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('keydown', escape)
    }
  }, [anchor])
  function reveal(button: HTMLButtonElement) {
    if (showLabel) return
    const bounds = button.getBoundingClientRect()
    setAnchor({
      left: Math.max(132, Math.min(window.innerWidth - 132, bounds.left + bounds.width / 2)),
      top: bounds.bottom + 8,
    })
  }
  return <>
    <button type="button"
      className={`dc-tool${secondary ? ' dc-secondary-scene-tool' : ''}${showLabel ? ' dc-tool-with-text' : ''}`}
      aria-label={label} aria-pressed={pressed} aria-describedby={anchor ? id : undefined}
      disabled={disabled}
      onPointerEnter={(event) => { if (event.pointerType !== 'touch') reveal(event.currentTarget) }}
      onPointerLeave={() => setAnchor(null)}
      onFocus={(event) => reveal(event.currentTarget)}
      onBlur={() => setAnchor(null)}
      onClick={() => { setAnchor(null); onClick() }}>
      {children}
      {showLabel ? <span>{label}</span> : null}
    </button>
    {anchor ? createPortal(
      <span id={id} role="tooltip" className="dc-floating-tooltip"
        style={{ left: anchor.left, top: anchor.top }}>{label}</span>, document.fullscreenElement ?? document.body,
    ) : null}
  </>
}
