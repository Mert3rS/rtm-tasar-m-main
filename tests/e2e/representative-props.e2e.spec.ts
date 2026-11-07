import { expect, test } from '@playwright/test'
import { products } from '../../src/lib/configurator/config'

for (const product of products) {
  test(`${product} keeps its styled contents through object toggling and theme changes`, async ({ page }) => {
    test.setTimeout(90000)
    await page.setViewportSize({ width: 1600, height: 1000 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.addInitScript(() => {
      const original = HTMLDialogElement.prototype.showModal
      HTMLDialogElement.prototype.showModal = function () {
        if (!this.classList.contains('dc-guide')) original.call(this)
      }
    })
    await page.goto(`http://localhost:3000/tasarim-olustur?urun=${product}`)
    const canvas = page.locator('.dc-scene canvas')
    await expect(canvas).toHaveAttribute('aria-label', 'Etkileşimli dolap önizlemesi', { timeout: 30000 })
    const original = await canvas.elementHandle()
    await page.getByRole('button', { name: 'Tüm kapakları aç', exact: true }).click()
    const objects = page.getByRole('button', { name: 'Eşyaları göster', exact: true })
    await expect(objects).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Önden', exact: true }).click()
    await page.screenshot({ path: `.tools/props-qa/${product}-front.png` })
    await page.getByRole('button', { name: 'Üç boyutlu', exact: true }).click()
    await page.screenshot({ path: `.tools/props-qa/${product}-styled.png` })
    await objects.click()
    await expect(objects).toHaveAttribute('aria-pressed', 'false')
    await page.screenshot({ path: `.tools/props-qa/${product}-empty.png` })
    await objects.click()
    await page.getByRole('button', { name: 'Koyu temaya geç', exact: true }).click()
    await expect(canvas).toHaveAttribute('aria-label', 'Etkileşimli dolap önizlemesi')
    expect(await canvas.evaluate((node, saved) => node === saved, original)).toBe(true)
    await page.screenshot({ path: `.tools/props-qa/${product}-dark.png` })
    await page.setViewportSize({ width: 390, height: 844 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(errors).toEqual([])
  })
}
