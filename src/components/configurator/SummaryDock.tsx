'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { StudioIcon } from './StudioIcon'

export function SummaryDock({
  open,
  onOpenChange,
  onQuote,
  ready,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onQuote: () => void
  ready: boolean
  children: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const title = useId()
  useEffect(() => {
    const node = dialog.current
    if (!node) return
    if (open && !node.open) node.showModal()
    else if (!open && node.open) node.close()
  }, [open])
  return (
    <dialog
      ref={dialog}
      id="design-summary"
      className="dc-summary-dialog"
      aria-labelledby={title}
      data-open={open}
      onCancel={(event) => {
        event.preventDefault()
        onOpenChange(false)
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false)
      }}
      onClose={() => {
        onOpenChange(false)
        document.querySelector<HTMLButtonElement>('.dc-summary-toggle')?.focus()
      }}
    >
      <div className="dc-summary-heading">
        <div>
          <h2 id={title}>Tasarım özeti</h2>
          <p>Ölçülerinizi, bölme düzeninizi ve malzeme seçimlerinizi inceleyin.</p>
        </div>
        <button type="button" aria-label="Özeti kapat" onClick={() => onOpenChange(false)}>
          <StudioIcon name="close" />
        </button>
      </div>
      <div className="dc-summary-body">{children}</div>
      <footer className="dc-summary-actions">
        <p>Seçimleriniz teklif sayfasına aktarılır.</p>
        <button type="button" className="dc-primary" disabled={!ready} onClick={onQuote}>
          Teklif al <StudioIcon name="arrow" />
        </button>
      </footer>
    </dialog>
  )
}
