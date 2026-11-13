import { photoPlacement } from '@/lib/photoPlacements'

/** Native Payload owns the controls. Wait for its tab and lazy fields before focusing. */
export function focusPhotoField(doc: Document, kind: string, field: string): () => void {
  const placement = photoPlacement(kind, field)
  if (!placement) return () => undefined
  let tabSelected = false
  let scrolled = false
  const focus = () => {
    if (placement.tab) {
      const tab = [...doc.querySelectorAll<HTMLButtonElement>('.tabs-field__tab-button')].find(
        (button) => button.textContent?.trim() === placement.tab,
      )
      if (!tab) return false
      if (!tabSelected || !tab.classList.contains('tabs-field__tab-button--active')) {
        tab.click()
        tabSelected = true
        if (!tab.classList.contains('tabs-field__tab-button--active')) return false
      }
    }
    const node = doc.getElementById(`field-${field}`)
    if (!node || node.offsetParent === null) {
      // Tab content after the illustrated guide is lazily mounted as one RenderFields block.
      const active = [...doc.querySelectorAll<HTMLElement>('.tabs-field__tab')].find(
        (node) => node.offsetParent !== null,
      )
      if (!scrolled && active) {
        active.scrollIntoView({ block: 'end' })
        scrolled = true
      }
      return false
    }
    node.scrollIntoView({ block: 'center' })
    const control = node.matches('input,textarea,select,button,[tabindex]')
      ? node
      : node.querySelector<HTMLElement>('button,input,select,[tabindex]')
    if (!control) return false
    control.focus({ preventScroll: true })
    return true
  }
  // A DOM load or a sibling's effect does not guarantee this tab has hydrated.
  // Retry only until the real tab selection and lazy upload control are ready.
  let frame = 0
  const attempt = () => {
    if (!focus()) frame = window.requestAnimationFrame(attempt)
  }
  frame = window.requestAnimationFrame(attempt)
  const timeout = window.setTimeout(() => cancelAnimationFrame(frame), 10000)
  return () => {
    cancelAnimationFrame(frame)
    clearTimeout(timeout)
  }
}
