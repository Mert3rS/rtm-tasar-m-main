import { expect, type Page } from '@playwright/test'

export const mobileViewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
]

export async function navigateMobilePage(page: Page, url: string) {
  // Avoid WebKit's document-replacement diagnostic for aborted Next prefetches.
  // https://github.com/microsoft/playwright/issues/43120
  // UI readiness is still checked explicitly by each caller after navigation.
  await page.waitForLoadState('networkidle')
  return page.goto(url)
}

/** Checks real content bounds, even when an ancestor clips horizontal overflow. */
export async function expectResponsiveContent(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  const issues = await page.evaluate(() => {
    const width = innerWidth
    const outside: string[] = []
    for (const node of document.querySelectorAll<HTMLElement>(
      'main h1,main h2,main h3,main p,main form,main input:not([type="hidden"]),main textarea,main select,form input:not([type="hidden"]),form textarea,form select',
    )) {
      const box = node.getBoundingClientRect()
      if (
        !box.width ||
        !box.height ||
        (box.width <= 1 && box.height <= 1) ||
        getComputedStyle(node).visibility === 'hidden' ||
        node.closest('[aria-hidden="true"], [inert]')
      )
        continue
      let parent = node.parentElement
      let scrollable = false
      while (parent) {
        if (
          parent.scrollWidth > parent.clientWidth + 1 &&
          /auto|scroll/.test(getComputedStyle(parent).overflowX)
        ) {
          scrollable = true
          break
        }
        parent = parent.parentElement
      }
      if (!scrollable && (box.left < -1 || box.right > width + 1))
        outside.push(
          `${node.tagName}.${node.className}: ${Math.round(box.left)}–${Math.round(box.right)}`,
        )
      if (
        !scrollable &&
        /^(H[1-3]|P)$/.test(node.tagName) &&
        node.scrollWidth > node.clientWidth + 1
      )
        outside.push(`${node.tagName}.${node.className}: text exceeds its container`)
    }
    return { scrollWidth: document.documentElement.scrollWidth, width, outside }
  })
  expect(issues.scrollWidth, 'Page must fit the viewport').toBeLessThanOrEqual(issues.width + 1)
  expect(issues.outside, 'Important content must fit even inside overflow:clip containers').toEqual(
    [],
  )
}

export async function expectReadableInputs(page: Page) {
  for (const input of await page
    .locator(
      'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="hidden"]):not([type="file"]), textarea, select',
    )
    .all()) {
    if (!(await input.isVisible())) continue
    if (
      await input.evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        return (
          bounds.width <= 1 ||
          bounds.height <= 1 ||
          Boolean(element.closest('[aria-hidden="true"]'))
        )
      })
    )
      continue
    expect(
      await input.evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
      `${await input.getAttribute('name') || await input.getAttribute('class') || 'Text control'} must avoid iOS focus zoom`,
    ).toBeGreaterThanOrEqual(16)
  }
}
