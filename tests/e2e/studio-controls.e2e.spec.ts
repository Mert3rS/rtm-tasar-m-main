import { expect, test } from '@playwright/test'

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
]) {
  test(`studio controls remain readable and usable at ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(90000)
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.addInitScript(() => {
      const showModal = HTMLDialogElement.prototype.showModal
      HTMLDialogElement.prototype.showModal = function () {
        if (!this.classList.contains('dc-guide')) showModal.call(this)
      }
    })
    await page.goto('http://localhost:3000/tasarim-olustur?urun=portmanto')
    await expect(page.locator('.dc-scene canvas')).toHaveAttribute('aria-label', 'Etkileşimli dolap önizlemesi', { timeout: 30000 })
    if (await page.locator('.dc-workspace.dc-panel-hidden').count()) {
      await page.getByRole('button', { name: 'Seçenekler paneli', exact: true }).click()
    }
    if (viewport.width >= 1440) {
      const summary = page.getByRole('button', { name: 'Özet: Tasarım özeti', exact: true })
      if (await summary.getAttribute('aria-expanded') === 'false') await summary.click()
      await page.getByRole('button', { name: 'Özeti kapat', exact: true }).click()
    }
    const open = page.getByRole('button', { name: 'Tüm kapakları aç', exact: true })
    if (viewport.width < 768) await page.getByRole('button', { name: 'Önizleme araçları', exact: true }).click()
    await expect(open).toBeInViewport({ ratio: 1 })
    await expect(open).toContainText('Tüm kapakları aç')
    await open.click()
    await expect(page.getByRole('button', { name: 'Tüm kapakları kapat', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Tüm kapakları kapat', exact: true }).click()
    const layers = page.getByRole('button', { name: 'İç düzeni göster', exact: true })
    await layers.focus()
    const tooltip = page.getByRole('tooltip', { name: 'İç düzeni göster', exact: true })
    await expect(tooltip).toBeInViewport({ ratio: 1 })
    await expect(tooltip).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(tooltip).toBeHidden()
    await page.locator('.dc-steps button').nth(2).click()
    await page.getByRole('button', { name: 'Sonraki vestiyer bölmesi', exact: true }).click()
    const shelves = page.getByRole('combobox', { name: 'Vestiyer raf sayısı', exact: true })
    await shelves.scrollIntoViewIfNeeded()
    await shelves.click()
    await page.getByRole('option', { name: '3', exact: true }).click()
    await expect(shelves).toContainText('3')
    await page.screenshot({ path: `.tools/controls-qa/studio-${viewport.width}-light.png` })
    if (viewport.width < 1200) await page.getByRole('button', { name: 'Menüyü aç', exact: true }).click()
    await page.getByRole('button', { name: 'Koyu temaya geç', exact: true }).click()
    if (viewport.width < 1200) await page.keyboard.press('Escape')
    await page.screenshot({ path: `.tools/controls-qa/studio-${viewport.width}-dark.png` })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(errors).toEqual([])
  })
}
