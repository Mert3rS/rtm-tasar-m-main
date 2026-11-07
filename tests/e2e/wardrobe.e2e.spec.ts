import { expect, test, type Page } from '@playwright/test'
import { decode } from '../../src/lib/configurator/config'

async function openWardrobe(page: Page) {
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
  await page.goto('http://localhost:3000/tasarim-olustur?urun=gardirop')
  await expect(page.locator('.dc-scene canvas')).toHaveAttribute(
    'aria-label',
    'Etkileşimli dolap önizlemesi',
    { timeout: 30000 },
  )
  if (await page.locator('.dc-workspace.dc-panel-hidden').count())
    await page.getByRole('button', { name: 'Seçenekler paneli', exact: true }).click()
}

test('wardrobe bays, interior fittings, glass and finishes stay consistent through PDF and quote', async ({
  page,
}) => {
  test.setTimeout(150000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await openWardrobe(page)
  const canvas = page.locator('.dc-scene canvas'),
    original = await canvas.elementHandle()
  await page.getByRole('button', { name: /Çift 200/ }).click()
  await expect.poll(() => decode(new URL(page.url()).hash).o.baza).toBe('b10')
  await page.screenshot({ path: '.tools/wardrobe-qa/reference-closed.png' })
  await page.locator('.dc-steps button').nth(1).click()
  await page.getByRole('button', { name: 'Gardırop bölme artır', exact: true }).click()
  await page
    .getByRole('group', { name: 'Gardırop hızlı genişlik' })
    .getByRole('button', { name: '80', exact: true })
    .click()
  await page.getByRole('button', { name: '1. gardırop bölmesi kilidi', exact: true }).click()
  await page.locator('.dc-steps button').nth(0).click()
  const width = page.getByRole('spinbutton', { name: 'Genişlik', exact: true })
  await width.fill('240')
  await width.press('Enter')
  await expect.poll(() => decode(new URL(page.url()).hash).r.main.w).toEqual([80, 80, 80])
  await page.locator('.dc-steps button').nth(2).click()
  await page.getByRole('button', { name: 'Çift askı', exact: true }).click()
  await page.getByRole('button', { name: 'Cam kapak', exact: true }).click()
  await page
    .getByRole('combobox', { name: 'Seçili bölmenin camı', exact: true })
    .selectOption('yivli')
  await page.getByRole('button', { name: 'Sonraki gardırop bölmesi', exact: true }).click()
  await page.getByRole('button', { name: 'Askı + çekmece', exact: true }).click()
  await page.getByRole('combobox', { name: 'İç çekmece sayısı', exact: true }).selectOption('4')
  await page.getByRole('button', { name: 'Sonraki gardırop bölmesi', exact: true }).click()
  await page.getByRole('button', { name: 'Ayakkabılık', exact: true }).click()
  await page.getByRole('combobox', { name: 'Raf sayısı', exact: true }).selectOption('6')
  await page.getByRole('button', { name: 'İç düzeni göster', exact: true }).click()
  await page.screenshot({ path: '.tools/wardrobe-qa/interior-open.png' })
  await page.locator('.dc-steps button').nth(3).click()
  await page.getByRole('button', { name: /Meşe & kaşmir/ }).click()
  await page
    .getByRole('combobox', { name: 'Gardırop cam çerçevesi', exact: true })
    .selectOption('bronz')
  await page.getByRole('button', { name: '1. gardırop bölmesini seç', exact: true }).click()
  await page.getByRole('button', { name: 'Bölmeye yaklaş', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Tüm gardırobu göster', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.screenshot({ path: '.tools/wardrobe-qa/bay-focus.png' })
  await page.getByRole('button', { name: 'Tüm gardırobu göster', exact: true }).click()
  await page.locator('.dc-steps button').nth(4).click()
  await page.getByRole('checkbox', { name: 'Raf altı LED', exact: true }).check()
  await page.getByRole('checkbox', { name: 'Üst iç aydınlatma', exact: true }).check()
  await page.getByRole('button', { name: 'Koyu temaya geç', exact: true }).click()
  expect(await canvas.evaluate((node, original) => node === original, original)).toBe(true)
  await page.screenshot({ path: '.tools/wardrobe-qa/oak-dark.png' })
  await page.getByRole('button', { name: 'Teknik çizim', exact: true }).click()
  await expect(page.locator('.dc-technical.visible')).toContainText('4 iç çekmece')
  await page.screenshot({ path: '.tools/wardrobe-qa/technical.png' })
  await expect.poll(() => decode(new URL(page.url()).hash).wardrobe?.drawers[1]).toBe(4)
  const design = decode(new URL(page.url()).hash)
  await page.reload()
  await expect(canvas).toHaveAttribute('aria-label', 'Etkileşimli dolap önizlemesi')
  await expect.poll(() => decode(new URL(page.url()).hash)).toEqual(design)
  await page.locator('.dc-quote-action').click()
  await expect(page).toHaveURL(/tasarim-olustur\/teklif/)
  await expect(page.locator('.dq-wardrobe-plan')).toContainText('40 cm üst depolama')
  await expect(page.locator('#quote-design-details')).toContainText('4 iç çekmece')
  await expect(page.locator('#quote-design-details')).toContainText('Yivli cam')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '↓ PDF indir', exact: true }).first().click()
  await (await download).saveAs('.tools/wardrobe-qa/rtm-gardirop.pdf')
  expect(errors).toEqual([])
})

test('independent sliding panels, mirrors and mobile controls preserve the design', async ({
  page,
}) => {
  test.setTimeout(150000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await openWardrobe(page)
  await page.getByRole('button', { name: /Vitrinli 300/ }).click()
  const depth = page.getByRole('spinbutton', { name: 'Derinlik', exact: true })
  await depth.fill('50')
  await depth.press('Enter')
  await page.locator('.dc-steps button').nth(3).click()
  await page.getByRole('button', { name: 'Sürgülü', exact: true }).click()
  await expect.poll(() => decode(new URL(page.url()).hash).d.d).toBe(60)
  await page.getByRole('combobox', { name: 'Sürgü paneli sayısı', exact: true }).selectOption('3')
  await page.getByRole('combobox', { name: '1. sürgü paneli', exact: true }).selectOption('glass')
  await page.getByRole('combobox', { name: '2. sürgü paneli', exact: true }).selectOption('mirror')
  await page.getByRole('combobox', { name: '1. sürgü camı', exact: true }).selectOption('fume')
  await expect
    .poll(() => decode(new URL(page.url()).hash).wardrobe?.slidingDoors)
    .toEqual(['glass', 'mirror', 'solid'])
  await page.screenshot({ path: '.tools/wardrobe-qa/sliding-mirror.png' })
  await page.getByRole('button', { name: 'Kapakları aç / kapat', exact: true }).click()
  await page.screenshot({ path: '.tools/wardrobe-qa/sliding-open.png' })
  await page.getByRole('button', { name: 'Geri al', exact: true }).click()
  await page.getByRole('button', { name: 'İleri al', exact: true }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(900)
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  await page.screenshot({ path: '.tools/wardrobe-qa/mobile.png' })
  if (await page.locator('.dc-workspace[data-snap="closed"]').count())
    await page.getByRole('button', { name: 'Seçenekler paneli', exact: true }).click()
  await expect(
    page.getByRole('combobox', { name: 'Sürgü paneli sayısı', exact: true }),
  ).toHaveValue('3')
  await page
    .getByRole('combobox', { name: 'Sürgü paneli sayısı', exact: true })
    .scrollIntoViewIfNeeded()
  await page.screenshot({ path: '.tools/wardrobe-qa/mobile-options.png' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.locator('.dc-quote-action').click()
  await expect(page.locator('.dq-wardrobe-plan')).toContainText('3 panelli sürgülü')
  await expect(page.locator('#quote-design-details')).toContainText('Aynalı kapak')
  expect(errors).toEqual([])
})
