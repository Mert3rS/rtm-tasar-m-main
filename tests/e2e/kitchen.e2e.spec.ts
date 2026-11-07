import { expect, test, type Page } from '@playwright/test'
import { decode } from '../../src/lib/configurator/config'

async function openKitchen(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/api/tasarim-baglanti', (route) =>
    route.fulfill({ status: 503, json: { error: 'DEMO offline fallback' } }),
  )
  await page.addInitScript(() => {
    const original = HTMLDialogElement.prototype.showModal
    HTMLDialogElement.prototype.showModal = function () {
      if (this.classList.contains('dc-guide')) return
      return original.call(this)
    }
  })
  await page.goto('http://localhost:3000/tasarim-olustur?urun=mutfak')
  await expect(page.locator('.dc-scene canvas')).toHaveAttribute(
    'aria-label',
    'Etkileşimli dolap önizlemesi',
    { timeout: 30000 },
  )
  if (await page.locator('.dc-workspace.dc-panel-hidden').count())
    await page.getByRole('button', { name: 'Seçenekler paneli', exact: true }).click()
}

test('independent upper widths, vitrin glass, finish presets and lighting survive a quote', async ({
  page,
}) => {
  test.setTimeout(120000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await openKitchen(page)
  const canvas = page.locator('.dc-scene canvas'),
    original = await canvas.elementHandle()
  await page.getByRole('button', { name: /Vitrinli 300/ }).click()
  await expect.poll(() => decode(new URL(page.url()).hash).d.w).toBe(300)
  await page.screenshot({ path: '.tools/kitchen-qa/reference-300.png' })
  await page.locator('.dc-steps button').nth(1).click()
  await page.getByRole('button', { name: 'Üst dolaplar', exact: true }).click()
  await page.getByRole('button', { name: 'Üst dolaplar modül artır', exact: true }).click()
  await expect.poll(() => decode(new URL(page.url()).hash).k?.modules?.upper.w.length).toBe(6)
  await page
    .getByRole('group', { name: 'Hızlı genişlik', exact: true })
    .getByRole('button', { name: '40', exact: true })
    .click()
  await page.getByRole('button', { name: 'Üst dolaplar 1. modül kilidi', exact: true }).click()
  await expect.poll(() => decode(new URL(page.url()).hash).r.main.w).toEqual([50, 60, 50, 80, 60])
  await page.screenshot({ path: '.tools/kitchen-qa/independent-upper.png' })
  await page.locator('.dc-steps button').nth(0).click()
  const width = page.getByRole('spinbutton', { name: 'Ana duvar genişliği', exact: true })
  await width.fill('320')
  await width.press('Enter')
  await expect.poll(() => decode(new URL(page.url()).hash).d.w).toBe(320)
  await expect.poll(() => decode(new URL(page.url()).hash).k?.modules?.upper.w[0]).toBe(40)
  await page.locator('.dc-steps button').nth(2).click()
  await page.getByRole('button', { name: 'Üst dolaplar', exact: true }).click()
  await page.getByRole('combobox', { name: 'Bu modülün camı', exact: true }).selectOption('yivli')
  await expect.poll(() => decode(new URL(page.url()).hash).k?.modules?.upper.glass[0]).toBe('yivli')
  await page.getByRole('button', { name: 'Seçime yaklaş', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Tüm mutfağı göster', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.screenshot({ path: '.tools/kitchen-qa/glass-focus.png' })
  await page.getByRole('button', { name: 'Tüm mutfağı göster', exact: true }).click()
  await page.locator('.dc-steps button').nth(3).click()
  await page.getByRole('button', { name: /Orman & krem/ }).click()
  await page.getByRole('combobox', { name: 'Cam çerçevesi', exact: true }).selectOption('bronz')
  await expect.poll(() => decode(new URL(page.url()).hash).o.iki).toBe(true)
  await page.screenshot({ path: '.tools/kitchen-qa/forest-cream.png' })
  await page.locator('.dc-steps button').nth(4).click()
  await page.getByRole('combobox', { name: 'Baza ve ayak', exact: true }).selectOption('b10')
  await page.getByRole('combobox', { name: 'Tezgâh', exact: true }).selectOption('porselen')
  await page.getByRole('checkbox', { name: 'Gola profil LED', exact: true }).check()
  await page.getByRole('checkbox', { name: 'İç aydınlatma', exact: true }).check()
  await page.getByRole('button', { name: 'Koyu temaya geç', exact: true }).click()
  await page.screenshot({ path: '.tools/kitchen-qa/lighting-dark.png' })
  expect(await canvas.evaluate((node, original) => node === original, original)).toBe(true)
  await expect.poll(() => decode(new URL(page.url()).hash).o.led.includes('gola')).toBe(true)
  const design = decode(new URL(page.url()).hash)
  await page.reload()
  await expect.poll(() => decode(new URL(page.url()).hash)).toEqual(design)
  await expect(canvas).toHaveAttribute('aria-label', 'Etkileşimli dolap önizlemesi')
  await page.locator('.dc-quote-action').click()
  await expect(page).toHaveURL(/tasarim-olustur\/teklif/)
  await expect(page.locator('.dq-kitchen-plan')).toContainText('Bulaşık makinesi')
  await expect(page.locator('#quote-design-details')).toContainText('Yivli cam')
  await expect(page.locator('#quote-design-details')).toContainText('Gola profil LED')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '↓ PDF indir', exact: true }).first().click()
  await (await download).saveAs('.tools/kitchen-qa/vitrinli-mutfak.pdf')
  expect(errors).toEqual([])
})

test('L return accepts appliances and upper modules independently on mobile', async ({ page }) => {
  test.setTimeout(120000)
  await openKitchen(page)
  await page.getByRole('button', { name: 'L · Sola dönüş', exact: true }).click()
  await page.locator('.dc-steps button').nth(2).click()
  await page.getByRole('button', { name: 'Dönüş · alt dolaplar', exact: true }).click()
  await page.getByRole('button', { name: /Bulaşık makinesi/, exact: true }).click()
  await page.getByRole('button', { name: 'Sonraki mutfak modülü', exact: true }).click()
  await page.getByRole('button', { name: /Evye dolabı/, exact: true }).click()
  await page.getByRole('button', { name: 'Sonraki mutfak modülü', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Bu modülde ocak', exact: true }).check()
  await expect
    .poll(() => decode(new URL(page.url()).hash).k?.modules?.returnLower.t)
    .toEqual(['dishwasher', 'sink', 'door'])
  await expect
    .poll(() => decode(new URL(page.url()).hash).k?.modules?.hob)
    .toEqual({ row: 'returnLower', index: 2 })
  await page.getByRole('button', { name: 'Dönüş · üst dolaplar', exact: true }).click()
  await page.getByRole('button', { name: /Cam vitrin/, exact: true }).click()
  await page.getByRole('combobox', { name: 'Bu modülün camı', exact: true }).selectOption('seffaf')
  await page.screenshot({ path: '.tools/kitchen-qa/return-appliances.png' })
  await page.getByRole('button', { name: 'Teknik çizim', exact: true }).click()
  await expect(page.locator('.dc-technical.visible')).toContainText('Bulaşık makinesi')
  await page.screenshot({ path: '.tools/kitchen-qa/independent-plan.png' })
  await page.getByRole('button', { name: 'Üç boyutlu', exact: true }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  if (await page.locator('.dc-workspace[data-snap="closed"]').count())
    await page.getByRole('button', { name: 'Seçenekler paneli', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Dönüş · üst dolaplar', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  await page.screenshot({ path: '.tools/kitchen-qa/rich-mobile.png' })
})

test('kitchen layouts keep the canvas, survive sharing and show the same quote plan', async ({
  page,
}) => {
  test.setTimeout(180000)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/api/tasarim-baglanti', (route) =>
    route.fulfill({ status: 503, json: { error: 'DEMO offline fallback' } }),
  )
  await page.addInitScript(() => {
    const original = HTMLDialogElement.prototype.showModal
    HTMLDialogElement.prototype.showModal = function () {
      if (this.classList.contains('dc-guide')) return
      return original.call(this)
    }
  })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('http://localhost:3000/tasarim-olustur?urun=mutfak')
  await expect(page.locator('.dc-workspace')).toBeVisible()
  const panel = page.getByRole('button', { name: 'Seçenekler paneli', exact: true })
  if (await page.locator('.dc-workspace.dc-panel-hidden').count()) await panel.click()
  const canvas = page.locator('.dc-scene canvas')
  await expect(canvas).toBeVisible()
  const original = await canvas.elementHandle()
  await expect(page.getByRole('button', { name: 'Düz mutfak', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(canvas).toHaveAttribute('aria-label', 'Etkileşimli dolap önizlemesi')
  await page.waitForTimeout(600)
  await page.screenshot({ path: '.tools/kitchen-qa/straight-desktop.png' })
  await page.getByRole('button', { name: 'L · Sola dönüş', exact: true }).click()
  const length = page.getByRole('spinbutton', { name: 'Dönüş duvarı uzunluğu', exact: true })
  await length.fill('280')
  await length.press('Enter')
  await expect.poll(() => decode(new URL(page.url()).hash).k?.length).toBe(280)
  await expect.poll(() => decode(new URL(page.url()).hash).k?.layout).toBe('left')
  await page.screenshot({ path: '.tools/kitchen-qa/left-desktop.png' })
  await page.getByRole('button', { name: 'L · Sağa dönüş', exact: true }).click()
  await expect.poll(() => decode(new URL(page.url()).hash).k?.layout).toBe('right')
  await page.getByRole('button', { name: 'Geri al', exact: true }).click()
  await expect(page.getByRole('button', { name: 'L · Sola dönüş', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: 'İleri al', exact: true }).click()
  await expect(page.getByRole('button', { name: 'L · Sağa dönüş', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: 'Koyu temaya geç', exact: true }).click()
  expect(await canvas.evaluate((node, original) => node === original, original)).toBe(true)
  await page.screenshot({ path: '.tools/kitchen-qa/right-dark.png' })
  await page.getByRole('button', { name: 'Teknik çizim', exact: true }).click()
  await expect(page.locator('.dc-technical.visible')).toContainText('Dönüş 280 cm')
  await page.screenshot({ path: '.tools/kitchen-qa/plan-desktop.png' })
  await page.reload()
  await expect.poll(() => decode(new URL(page.url()).hash).k?.layout).toBe('right')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(canvas).toBeVisible()
  await expect(canvas).toHaveAttribute('aria-label', 'Etkileşimli dolap önizlemesi')
  // Let the demand-rendered Canvas finish the viewport resize before capturing its pixels.
  await page.waitForTimeout(1200)
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true)
  await page.screenshot({ path: '.tools/kitchen-qa/mobile.png' })
  await panel.click()
  await expect(page.getByRole('button', { name: 'L · Sağa dönüş', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: 'L · Sağa dönüş', exact: true }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: '.tools/kitchen-qa/mobile-options.png' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.locator('.dc-quote-action').click()
  await expect(page).toHaveURL(/tasarim-olustur\/teklif/)
  await expect(page.locator('.dq-kitchen-plan')).toContainText('Dönüş duvarı 280 cm')
  await expect(page.locator('svg.design-drawing').first()).toHaveAttribute(
    'aria-label',
    /dönüş 280 cm/,
  )
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '↓ PDF indir', exact: true }).first().click()
  const pdf = await download
  expect(pdf.suggestedFilename()).toBe('rtm-on-tasarim.pdf')
  await pdf.saveAs('.tools/kitchen-qa/rtm-mutfak.pdf')
  expect(errors).toEqual([])
})
