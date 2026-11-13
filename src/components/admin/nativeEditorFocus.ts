import { HOMEPAGE_SECTIONS } from '@/lib/homepageContent'
import { HERO_POSITIONS } from '@/lib/homepageHero'
import { photoPlacement } from '@/lib/photoPlacements'
import { SITE_COPY_SECTIONS } from '@/lib/siteCopy'
import { focusPhotoField } from './photoFieldFocus'

export function isNativeEditorField(kind: string, field: string): boolean {
  if (photoPlacement(kind, field)?.field === field) return true
  if (kind !== 'site-settings') return false
  return (
    ['companyDescription', 'contactEmail', 'privacyNoticeContent', 'cookiePolicyVersion'].includes(
      field,
    ) ||
    HERO_POSITIONS.some(({ key }) => field === `heroImages__${key}`) ||
    SITE_COPY_SECTIONS.some((section) =>
      section.fields.some(({ name }) => field === `siteCopy__${name}`),
    ) ||
    HOMEPAGE_SECTIONS.some((section) =>
      section.fields.some(({ name }) => field === `homepage__${name}`),
    )
  )
}

/** Focus runs inside the hydrated native document, never from a parent's load event. */
export function focusNativeEditorField(doc: Document, kind: string, field: string): () => void {
  if (!isNativeEditorField(kind, field)) return () => undefined
  if (photoPlacement(kind, field)?.field === field) return focusPhotoField(doc, kind, field)
  const hero = field.startsWith('heroImages__')
  const homeSection = HOMEPAGE_SECTIONS.find((section) =>
    section.fields.some(({ name }) => field === `homepage__${name}`),
  )
  const siteCopySection = SITE_COPY_SECTIONS.find((section) =>
    section.fields.some(({ name }) => field === `siteCopy__${name}`),
  )
  const tabLabel = hero
    ? 'Ana sayfa açılışı'
    : homeSection
      ? 'Ana sayfa metinleri'
        : siteCopySection
          ? 'Sayfa ve menü metinleri'
      : field === 'privacyNoticeContent'
        ? 'Aydınlatma metni'
        : field === 'cookiePolicyVersion'
          ? 'Çerez politikası'
          : 'Şirket ve iletişim'
  let selected = false
  let scrolled = false
  let opened = false
  let panelScrolled = false
  let frame = 0
  const focus = () => {
    const tab = [...doc.querySelectorAll<HTMLButtonElement>('.tabs-field__tab-button')].find(
      (button) => button.textContent?.trim() === tabLabel,
    )
    if (!tab) return false
    if (!selected || !tab.classList.contains('tabs-field__tab-button--active')) {
      tab.click()
      selected = true
      if (!tab.classList.contains('tabs-field__tab-button--active')) return false
    }
    if (!panelScrolled) {
      const panel = [...doc.querySelectorAll<HTMLElement>('.tabs-field__tab')].find(
        (node) => node.offsetParent !== null,
      )
      if (!panel) return false
      // Native tab children are lazy even when their own input does not yet exist.
      panel.scrollIntoView({ block: 'start' })
      panelScrolled = true
    }
    const section = homeSection
      ? [...doc.querySelectorAll<HTMLElement>('.collapsible-field')].find(
          (node) =>
            node.querySelector('.collapsible__header-wrap')?.textContent?.trim() ===
            homeSection.label,
        )
      : siteCopySection
        ? [...doc.querySelectorAll<HTMLElement>('.collapsible-field')].find(
            (node) =>
              node.querySelector('.collapsible__header-wrap')?.textContent?.trim() ===
              siteCopySection.label,
          )
      : hero
        ? doc.getElementById('field-heroImages')
        : null
    if ((homeSection || siteCopySection || hero) && (!section || section.offsetParent === null))
      return false
    if (section && !scrolled) {
      section.scrollIntoView({ block: 'start' })
      scrolled = true
    }
    if (section?.querySelector('.collapsible--collapsed') && !opened) {
      section.querySelector<HTMLButtonElement>('.collapsible__toggle')?.click()
      opened = true
      return false
    }
    const node = doc.getElementById(`field-${field}`)
    if (!node || node.offsetParent === null) return false
    const control = hero ? node.querySelector<HTMLElement>('button,input,[tabindex]') : node
    if (!control) return false
    node.scrollIntoView({ block: 'center' })
    control.focus({ preventScroll: true })
    return true
  }
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
