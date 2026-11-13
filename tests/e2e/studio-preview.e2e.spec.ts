import { expect, test } from '@playwright/test'
import { decode } from '../../src/lib/configurator/config'

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 1024, height: 768 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]) {
  test(`material shortcut and spacious preview work at ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(90000)
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      const showModal = HTMLDialogElement.prototype.showModal
      HTMLDialogElement.prototype.showModal = function () {
        if (!this.classList.contains('dc-guide')) showModal.call(this)
      }
    })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('http://localhost:3000/tasarim-olustur?urun=tv')
    const canvas = page.locator('.dc-scene canvas')
    await expect(canvas).toHaveAttribute('aria-label', 'Etkileşimli dolap önizlemesi', { timeout: 30000 })
    const original = await canvas.elementHandle()
    await expect(page.locator('#design-summary')).toHaveAttribute('data-open', 'false')
    await expect(page.locator('.dc-summary-peek')).toHaveCount(0)
    const initial = await page.locator('.dc-viewport').boundingBox()
    expect(initial?.height).toBeGreaterThan(viewport.height * (viewport.width < 768 ? 0.54 : viewport.width < 1200 ? 0.6 : 0.65))
    const material = page.getByRole('button', { name: /^Malzeme ve rengi değiştir:/ })
    await expect(material).toBeInViewport({ ratio: 1 })
    await material.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.dc-steps button').nth(3)).toHaveAttribute('aria-current', 'step')
    const palette = page.locator('#design-color-palette .dc-swatches').first()
    await expect(palette.getByRole('button', { name: 'Kaşmir', exact: true })).toBeFocused()
    await palette.getByRole('button', { name: 'Gece mavisi', exact: true }).click()
    await expect.poll(() => decode(new URL(page.url()).hash).o.renk).toBe('gece-mavisi')
    await expect(material).toHaveAccessibleName(/Gece mavisi/)
    expect((await page.locator('.dc-viewport').boundingBox())?.height).toBeGreaterThan(viewport.width < 768 ? 175 : viewport.height * 0.4)
    expect(await canvas.evaluate((node, previous) => node === previous, original)).toBe(true)
    if (viewport.width < 768) {
      await page.locator('.dc-mobile-grip').press('Home')
      await page.getByRole('button', { name: 'Önizleme araçları', exact: true }).click()
      await expect(page.locator('#studio-scene-tools')).toBeVisible()
      const doors = page.getByRole('button', { name: 'Tüm kapakları aç', exact: true })
      await doors.click()
      await expect(page.getByRole('button', { name: 'Tüm kapakları kapat', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await page.keyboard.press('Escape')
      await expect(page.locator('#studio-scene-tools')).not.toBeVisible()
      await expect(page.locator('.dc-workspace')).toHaveAttribute('data-snap', 'closed')
    }
    {
      const before = await page.locator('.dc-viewport').boundingBox()
      await page.locator('.dc-summary-toggle').click()
      await expect(page.locator('#design-summary')).toHaveAttribute('data-open', 'true')
      expect(await page.locator('.dc-viewport').boundingBox()).toEqual(before)
      await page.getByRole('button', { name: 'Özeti kapat', exact: true }).click()
      await expect(page.locator('#design-summary')).not.toBeVisible()
      await expect(page.locator('.dc-summary-toggle')).toBeFocused()
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `.tools/preview-qa/studio-${viewport.width}.png` })
    expect(errors).toEqual([])
  })
}
