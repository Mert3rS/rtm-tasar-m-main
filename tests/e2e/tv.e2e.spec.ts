import { expect, test, type Page } from '@playwright/test'
import { decode } from '../../src/lib/configurator/config'

async function openTv(page: Page) {
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
  await page.goto('http://localhost:3000/tasarim-olustur?urun=tv')
  await expect(page.locator('.dc-scene canvas')).toHaveAttribute(
    'aria-label',
    'Etkileşimli dolap önizlemesi',
    { timeout: 30000 },
  )
  if (await page.locator('.dc-workspace.dc-panel-hidden').count())
    await page.getByRole('button', { name: 'Seçenekler paneli', exact: true }).click()
}
test('TV feature wall, independent storage, glass and LED settings reach drawing, PDF and quote', async ({
  page,
}) => {
  test.setTimeout(180000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await openTv(page)
  const canvas = page.locator('.dc-scene canvas'),
    original = await canvas.elementHandle()
  await page.getByRole('button', { name: /Çerçeve 240/ }).click()
  await page.screenshot({ path: '.tools/tv-qa/reference.png' })
  await page.locator('.dc-steps button').nth(1).click()
  await page.getByRole('button', { name: 'Alt ünite 1. TV bölmesi kilidi', exact: true }).click()
  await page
    .getByRole('group', { name: 'TV dolap sırası', exact: true })
    .getByRole('button', { name: 'Üst bölüm', exact: true })
    .click()
  await page.getByRole('button', { name: 'Üst bölüm 2. TV bölmesi kilidi', exact: true }).click()
  await page.locator('.dc-steps button').nth(0).click()
  const width = page.getByRole('spinbutton', { name: 'Genişlik', exact: true })
  await width.fill('300')
  await width.press('Enter')
  await expect.poll(() => decode(new URL(page.url()).hash).r.main.w).toEqual([60, 80, 80, 80])
  await expect.poll(() => decode(new URL(page.url()).hash).tvUnit?.upper.w).toEqual([70, 160, 70])
  await page.locator('.dc-steps button').nth(2).click()
  await page.getByRole('button', { name: 'Sonraki TV bölmesi', exact: true }).click()
  await page.getByRole('button', { name: 'Sonraki TV bölmesi', exact: true }).click()
  await page.getByRole('combobox', { name: 'TV vitrin camı', exact: true }).selectOption('yivli')
  await page.getByRole('combobox', { name: 'TV raf sayısı', exact: true }).selectOption('4')
  await page
    .getByRole('group', { name: 'TV dolap sırası', exact: true })
    .getByRole('button', { name: 'Alt ünite', exact: true })
    .click()
  await page.getByRole('button', { name: 'Sonraki TV bölmesi', exact: true }).click()
  await page.getByRole('combobox', { name: 'TV çekmece sayısı', exact: true }).selectOption('3')
  await page.getByRole('button', { name: 'Sonraki TV bölmesi', exact: true }).click()
  await page.getByRole('button', { name: 'Yukarı açılır kapak', exact: true }).click()
  await page.locator('.dc-steps button').nth(3).click()
  await page.getByRole('button', { name: /Orman & ceviz/ }).click()
  await page.getByRole('combobox', { name: 'TV cam çerçevesi', exact: true }).selectOption('bronz')
  await page.getByRole('button', { name: 'Bölmeye yaklaş', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Tüm üniteyi göster', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Tüm üniteyi göster', exact: true }).click()
  await page.locator('.dc-steps button').nth(4).click()
  await expect(page.getByRole('button', { name: '85″', exact: true })).toBeDisabled()
  await page
    .getByRole('combobox', { name: 'TV arkası panel dokusu', exact: true })
    .selectOption('slats')
  await page.getByRole('checkbox', { name: 'Gizli LED çerçeve', exact: true }).uncheck()
  await page.getByRole('checkbox', { name: 'Gizli LED çerçeve', exact: true }).check()
  await page.getByRole('button', { name: 'Koyu temaya geç', exact: true }).click()
  expect(await canvas.evaluate((node, original) => node === original, original)).toBe(true)
  await page.screenshot({ path: '.tools/tv-qa/forest-dark.png' })
  await page.getByRole('button', { name: 'İç düzeni göster', exact: true }).click()
  await page.screenshot({ path: '.tools/tv-qa/interior.png' })
  await page.getByRole('button', { name: 'Teknik çizim', exact: true }).click()
  await expect(page.locator('.dc-technical.visible')).toContainText('3 çekmece')
  await expect(page.locator('.dc-technical.visible')).toContainText('65″ TV')
  await page.screenshot({ path: '.tools/tv-qa/technical.png' })
  const design = decode(new URL(page.url()).hash)
  await page.reload()
  await expect(canvas).toHaveAttribute('aria-label', 'Etkileşimli dolap önizlemesi', {
    timeout: 30000,
  })
  await expect.poll(() => decode(new URL(page.url()).hash)).toEqual(design)
  await page.locator('.dc-quote-action').click()
  await expect(page.locator('.dq-tv-plan')).toContainText('65 inç TV')
  for (const text of ['3 çekmece', 'Yivli cam', 'Gizli LED çerçeve', 'Çıtalı TV arkası panel'])
    await expect(page.locator('#quote-design-details')).toContainText(text)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '↓ PDF indir', exact: true }).first().click()
  await (await download).saveAs('.tools/tv-qa/rtm-tv-unitesi.pdf')
  expect(errors).toEqual([])
})
test('TV cinema and minimal presets preserve screen fitting and mobile controls', async ({
  page,
}) => {
  test.setTimeout(150000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await openTv(page)
  await page.getByRole('button', { name: /Sinema 300/ }).click()
  await expect.poll(() => decode(new URL(page.url()).hash).o.tv).toBe(85)
  await page.screenshot({ path: '.tools/tv-qa/cinema.png' })
  await page.getByRole('button', { name: /Minimal 200/ }).click()
  await page.screenshot({ path: '.tools/tv-qa/minimal.png' })
  await page.locator('.dc-steps button').nth(4).click()
  await page.getByRole('button', { name: '75″', exact: true }).click()
  await expect.poll(() => decode(new URL(page.url()).hash).o.tv).toBe(75)
  await expect(page.getByRole('button', { name: '85″', exact: true })).toBeEnabled()
  await page.getByRole('checkbox', { name: 'Soundbar alanı', exact: true }).uncheck()
  await page.getByRole('checkbox', { name: 'TV arkası panel', exact: true }).uncheck()
  await page.getByRole('combobox', { name: 'TV baza ve montaj', exact: true }).selectOption('ayak')
  await page.getByRole('button', { name: 'Geri al', exact: true }).click()
  await page.getByRole('button', { name: 'İleri al', exact: true }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  if (await page.locator('.dc-workspace[data-snap="closed"]').count())
    await page.getByRole('button', { name: 'Seçenekler paneli', exact: true }).click()
  await expect(
    page.getByRole('checkbox', { name: 'TV arkası panel', exact: true }),
  ).not.toBeChecked()
  await page
    .getByRole('checkbox', { name: 'Gizli LED çerçeve', exact: true })
    .scrollIntoViewIfNeeded()
  await page.screenshot({ path: '.tools/tv-qa/mobile.png' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.locator('.dc-quote-action').click()
  await expect(page.locator('.dq-tv-plan')).toContainText('75 inç TV')
  await expect(page.locator('#quote-design-details')).toContainText('TV arkası panel yok')
  expect(errors).toEqual([])
})
