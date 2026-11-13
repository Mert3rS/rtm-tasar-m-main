import { expect, test } from '@playwright/test'
import { decode } from '../../src/lib/configurator/config'

for (const scenario of [
  { width: 1440, height: 1000, product: 'tv', dark: false },
  { width: 390, height: 844, product: 'tv', dark: true },
  { width: 360, height: 800, product: 'banyo', dark: false },
]) {
  test(`readable summary keeps its quote action visible at ${scenario.width}px`, async ({ page }) => {
    test.setTimeout(90000)
    await page.setViewportSize({ width: scenario.width, height: scenario.height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      const showModal = HTMLDialogElement.prototype.showModal
      HTMLDialogElement.prototype.showModal = function () {
        if (!this.classList.contains('dc-guide')) showModal.call(this)
      }
    })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`http://localhost:3000/tasarim-olustur?urun=${scenario.product}`)
    await expect.poll(() => new URL(page.url()).hash).toContain('#c=')
    await expect.poll(() => decode(new URL(page.url()).hash).m).toBe(scenario.product)
    const config = decode(new URL(page.url()).hash)
    if (scenario.dark) {
      await page.getByRole('button', { name: 'Menüyü aç', exact: true }).click()
      await page.getByRole('button', { name: 'Koyu temaya geç', exact: true }).click()
      await page.keyboard.press('Escape')
    }
    const viewport = await page.locator('.dc-viewport').boundingBox()
    await page.locator('.dc-summary-toggle').click()
    const summary = page.getByRole('dialog', { name: 'Tasarım özeti', exact: true })
    await expect(summary).toBeVisible()
    expect(await page.locator('.dc-viewport').boundingBox()).toEqual(viewport)
    const action = summary.getByRole('button', { name: 'Teklif al', exact: true })
    await expect(action).toBeInViewport({ ratio: 1 })
    const headingSize = await summary.locator('.dc-summary-section h3').first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize))
    expect(headingSize).toBeGreaterThanOrEqual(18)
    expect(await summary.locator('.dc-summary-cards > .dc-summary-section').evaluateAll((cards) => cards.every((card) => card.scrollHeight <= card.clientHeight + 1))).toBe(true)
    await expect(summary.getByRole('heading', { name: 'Malzeme ve detaylar', exact: true })).toHaveCount(0)
    await expect(summary.locator('.dc-summary-finish')).toHaveCount(0)
    await expect(summary.locator('.dc-summary-size')).toBeVisible()
    await expect(summary.locator('.dc-summary-cards > .dc-summary-section').first()).toBeVisible()
    await summary.locator('.dc-summary-body').evaluate((node) => node.scrollTo({ top: node.scrollHeight }))
    await expect(summary.locator('.dc-neutral-note')).toBeInViewport()
    await expect(action).toBeInViewport({ ratio: 1 })
    await page.screenshot({ path: `.tools/summary-qa/summary-${scenario.width}.png` })
    await action.click()
    await expect(page).toHaveURL(/\/tasarim-olustur\/teklif#c=/)
    await expect(page.locator('#quote-design-details')).toContainText(config.o.malz)
    expect(decode(new URL(page.url()).hash)).toEqual(config)
    expect(errors).toEqual([])
  })
}
