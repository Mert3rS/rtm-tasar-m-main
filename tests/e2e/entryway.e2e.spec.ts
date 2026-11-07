import { expect, test, type Page } from '@playwright/test'
import { decode } from '../../src/lib/configurator/config'

async function openEntryway(page: Page) {
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
  await page.goto('http://localhost:3000/tasarim-olustur?urun=portmanto')
  await expect(page.locator('.dc-scene canvas')).toHaveAttribute(
    'aria-label',
    'Etkileşimli dolap önizlemesi',
    { timeout: 30000 },
  )
  if (await page.locator('.dc-workspace.dc-panel-hidden').count())
    await page.getByRole('button', { name: 'Seçenekler paneli', exact: true }).click()
}

test('entryway seating, storage and finishes stay consistent through drawing, PDF and quote', async ({
  page,
}) => {
  test.setTimeout(180000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await openEntryway(page)
  const canvas = page.locator('.dc-scene canvas'),
    original = await canvas.elementHandle()
  await page.getByRole('button', { name: /Antre 120/ }).click()
  await expect.poll(() => decode(new URL(page.url()).hash).entryway?.cushion).toBe(false)
  await page.screenshot({ path: '.tools/entryway-qa/reference.png' })
  await page.getByRole('checkbox', { name: 'Oturma minderi', exact: true }).check()
  await page.getByRole('combobox', { name: 'Minder rengi', exact: true }).selectOption('olive')
  await page.locator('.dc-steps button').nth(1).click()
  await page.getByRole('button', { name: '1. vestiyer bölmesi kilidi', exact: true }).click()
  await page.locator('.dc-steps button').nth(0).click()
  const width = page.getByRole('spinbutton', { name: 'Genişlik', exact: true })
  await width.fill('140')
  await width.press('Enter')
  await expect.poll(() => decode(new URL(page.url()).hash).r.main.w).toEqual([60, 80])
  await page.locator('.dc-steps button').nth(2).click()
  await page.getByRole('combobox', { name: 'Askı kancası sayısı', exact: true }).selectOption('5')
  await page.getByRole('checkbox', { name: 'Dikey çıtalı arkalık', exact: true }).check()
  await page.getByRole('combobox', { name: 'Bank altı düzeni', exact: true }).selectOption('drawer')
  await page.getByRole('button', { name: 'Sonraki vestiyer bölmesi', exact: true }).click()
  await page.getByRole('button', { name: 'Cam kapak', exact: true }).click()
  await page.getByRole('combobox', { name: 'Vestiyer cam tipi', exact: true }).selectOption('yivli')
  await page.locator('.dc-steps button').nth(3).click()
  await page.getByRole('button', { name: /Meşe & fildişi/ }).click()
  await page
    .getByRole('combobox', { name: 'Vestiyer cam çerçevesi', exact: true })
    .selectOption('bronz')
  await page.getByRole('button', { name: '1. vestiyer bölmesini seç', exact: true }).click()
  await page.getByRole('button', { name: 'Bölmeye yaklaş', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Tüm vestiyeri göster', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.screenshot({ path: '.tools/entryway-qa/seat-focus.png' })
  await page.getByRole('button', { name: 'Tüm vestiyeri göster', exact: true }).click()
  await page.locator('.dc-steps button').nth(4).click()
  await page.getByRole('checkbox', { name: 'Bank altı LED', exact: true }).check()
  await page.getByRole('checkbox', { name: 'Raf altı LED', exact: true }).check()
  await page.getByRole('button', { name: 'Koyu temaya geç', exact: true }).click()
  expect(await canvas.evaluate((node, original) => node === original, original)).toBe(true)
  await page.screenshot({ path: '.tools/entryway-qa/oak-dark.png' })
  await page.getByRole('button', { name: 'Teknik çizim', exact: true }).click()
  await expect(page.locator('.dc-technical.visible')).toContainText('5 askı kancası')
  await expect(page.locator('.dc-technical.visible')).toContainText('Oturma 48 cm · minderli')
  await page.screenshot({ path: '.tools/entryway-qa/technical.png' })
  const design = decode(new URL(page.url()).hash)
  await page.reload()
  await expect(canvas).toHaveAttribute('aria-label', 'Etkileşimli dolap önizlemesi')
  await expect.poll(() => decode(new URL(page.url()).hash)).toEqual(design)
  await page.locator('.dc-quote-action').click()
  await expect(page).toHaveURL(/tasarim-olustur\/teklif/)
  await expect(page.locator('.dq-entryway-plan')).toContainText('Oturma yüksekliği 48 cm')
  for (const text of ['5 askı kancası', 'Bank altı çekmece', 'Yivli cam', 'Adaçayı'])
    await expect(page.locator('#quote-design-details')).toContainText(text)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '↓ PDF indir', exact: true }).first().click()
  await (await download).saveAs('.tools/entryway-qa/rtm-vestiyer.pdf')
  expect(errors).toEqual([])
})

test('entryway compact and family layouts support mirrors, deep hanging and mobile controls', async ({
  page,
}) => {
  test.setTimeout(150000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await openEntryway(page)
  await page.getByRole('button', { name: /Kompakt 90/ }).click()
  await expect.poll(() => decode(new URL(page.url()).hash).r.main.w).toEqual([40, 50])
  await page.screenshot({ path: '.tools/entryway-qa/compact.png' })
  await page.locator('.dc-steps button').nth(2).click()
  await page.getByRole('button', { name: 'Sonraki vestiyer bölmesi', exact: true }).click()
  await page.getByRole('button', { name: 'Askı dolabı', exact: true }).click()
  await expect.poll(() => decode(new URL(page.url()).hash).d.d).toBe(60)
  await page.locator('.dc-steps button').nth(0).click()
  await page.getByRole('button', { name: /Aile 180/ }).click()
  await page.locator('.dc-steps button').nth(2).click()
  await page.getByRole('button', { name: 'Sonraki vestiyer bölmesi', exact: true }).click()
  await page.getByRole('button', { name: 'Aynalı kapak', exact: true }).click()
  await page.getByRole('button', { name: 'Sonraki vestiyer bölmesi', exact: true }).click()
  await page.getByRole('combobox', { name: 'Vestiyer raf sayısı', exact: true }).selectOption('6')
  await page.screenshot({ path: '.tools/entryway-qa/family-mirror.png' })
  await page.getByRole('button', { name: 'İç düzeni göster', exact: true }).click()
  await page.screenshot({ path: '.tools/entryway-qa/family-open.png' })
  await page.getByRole('button', { name: 'Geri al', exact: true }).click()
  await page.getByRole('button', { name: 'İleri al', exact: true }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  await page.screenshot({ path: '.tools/entryway-qa/mobile.png' })
  if (await page.locator('.dc-workspace[data-snap="closed"]').count())
    await page.getByRole('button', { name: 'Seçenekler paneli', exact: true }).click()
  await expect(
    page.getByRole('combobox', { name: 'Vestiyer raf sayısı', exact: true }),
  ).toHaveValue('6')
  await page
    .getByRole('combobox', { name: 'Vestiyer raf sayısı', exact: true })
    .scrollIntoViewIfNeeded()
  await page.screenshot({ path: '.tools/entryway-qa/mobile-options.png' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.locator('.dc-quote-action').click()
  await expect(page.locator('.dq-entryway-plan')).toContainText('3 bölme')
  await expect(page.locator('#quote-design-details')).toContainText('Aynalı kapak')
  await expect(page.locator('#quote-design-details')).toContainText('6 raf')
  expect(errors).toEqual([])
})
