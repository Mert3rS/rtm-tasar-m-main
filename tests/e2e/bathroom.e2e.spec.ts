import { expect, test, type Page } from '@playwright/test'
import { decode } from '../../src/lib/configurator/config'

async function openBathroom(page: Page) {
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
  await page.goto('http://localhost:3000/tasarim-olustur?urun=banyo')
  await expect(page.locator('.dc-scene canvas')).toHaveAttribute(
    'aria-label',
    'Etkileşimli dolap önizlemesi',
    { timeout: 30000 },
  )
  if (await page.locator('.dc-workspace.dc-panel-hidden').count())
    await page.getByRole('button', { name: 'Seçenekler paneli', exact: true }).click()
}
test('bathroom vanity, independent upper cabinets and ceramic basin survive drawing, PDF and quote', async ({
  page,
}) => {
  test.setTimeout(180000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await openBathroom(page)
  const canvas = page.locator('.dc-scene canvas'),
    original = await canvas.elementHandle()
  await page.getByRole('button', { name: /Denge 100/ }).click()
  await expect.poll(() => decode(new URL(page.url()).hash).bathroom?.upper.w).toEqual([50, 50])
  await page.screenshot({ path: '.tools/bathroom-qa/reference.png' })
  const width = page.getByRole('spinbutton', { name: 'Genişlik', exact: true })
  await width.fill('140')
  await width.press('Enter')
  await page.locator('.dc-steps button').nth(1).click()
  await page.getByRole('button', { name: 'Alt dolaplar banyo bölme artır', exact: true }).click()
  const lowerWidth = page.getByRole('spinbutton', {
    name: 'Alt dolaplar 1. bölme genişliği',
    exact: true,
  })
  await lowerWidth.fill('90')
  await lowerWidth.press('Enter')
  await page
    .getByRole('button', { name: 'Alt dolaplar 1. banyo bölmesi kilidi', exact: true })
    .click()
  await page
    .getByRole('group', { name: 'Banyo dolap sırası', exact: true })
    .getByRole('button', { name: 'Üst dolaplar', exact: true })
    .click()
  await page.getByRole('button', { name: 'Üst dolaplar banyo bölme artır', exact: true }).click()
  const upperWidth = page.getByRole('spinbutton', {
    name: 'Üst dolaplar 1. bölme genişliği',
    exact: true,
  })
  await upperWidth.fill('60')
  await upperWidth.press('Enter')
  await page
    .getByRole('button', { name: 'Üst dolaplar 1. banyo bölmesi kilidi', exact: true })
    .click()
  await page.locator('.dc-steps button').nth(0).click()
  await width.fill('180')
  await width.press('Enter')
  await expect.poll(() => decode(new URL(page.url()).hash).r.main.w).toEqual([90, 90])
  await expect.poll(() => decode(new URL(page.url()).hash).bathroom?.upper.w).toEqual([60, 60, 60])
  await page.locator('.dc-steps button').nth(2).click()
  await page.getByRole('button', { name: 'Cam vitrin', exact: true }).click()
  await page.getByRole('combobox', { name: 'Banyo cam tipi', exact: true }).selectOption('yivli')
  await page.getByRole('combobox', { name: 'Banyo raf sayısı', exact: true }).selectOption('3')
  await page.getByRole('button', { name: 'Sonraki banyo bölmesi', exact: true }).click()
  await page.getByRole('button', { name: 'Kapaklı', exact: true }).click()
  await page
    .getByRole('group', { name: 'Banyo dolap sırası', exact: true })
    .getByRole('button', { name: 'Alt dolaplar', exact: true })
    .click()
  await page.getByRole('combobox', { name: 'Banyo çekmece sayısı', exact: true }).selectOption('3')
  await page.getByRole('button', { name: 'Sonraki banyo bölmesi', exact: true }).click()
  await page.getByRole('button', { name: 'Açık raf', exact: true }).click()
  await page.getByRole('combobox', { name: 'Banyo raf sayısı', exact: true }).selectOption('2')
  await page.locator('.dc-steps button').nth(3).click()
  await page.getByRole('button', { name: /Adaçayı spa/ }).click()
  await page
    .getByRole('combobox', { name: 'Banyo cam çerçevesi', exact: true })
    .selectOption('bronz')
  await page.getByRole('button', { name: 'Bölmeye yaklaş', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Tüm banyoyu göster', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Tüm banyoyu göster', exact: true }).click()
  await page.locator('.dc-steps button').nth(4).click()
  await page.getByRole('checkbox', { name: 'Raf altı LED', exact: true }).check()
  await page.getByRole('button', { name: 'Koyu temaya geç', exact: true }).click()
  expect(await canvas.evaluate((node, original) => node === original, original)).toBe(true)
  await page.screenshot({ path: '.tools/bathroom-qa/sage-dark.png' })
  await page.getByRole('button', { name: 'İç düzeni göster', exact: true }).click()
  await page.screenshot({ path: '.tools/bathroom-qa/interior.png' })
  await page.getByRole('button', { name: 'Teknik çizim', exact: true }).click()
  await expect(page.locator('.dc-technical.visible')).toContainText('3 çekmece')
  await expect(page.locator('.dc-technical.visible')).toContainText('Tezgâh üst kotu: 85 cm')
  await page.screenshot({ path: '.tools/bathroom-qa/technical.png' })
  const design = decode(new URL(page.url()).hash)
  await page.reload()
  await expect(canvas).toHaveAttribute('aria-label', 'Etkileşimli dolap önizlemesi', {
    timeout: 30000,
  })
  await expect.poll(() => decode(new URL(page.url()).hash)).toEqual(design)
  await page.locator('.dc-quote-action').click()
  await expect(page.locator('.dq-bathroom-plan')).toContainText('3 üst dolap')
  for (const text of ['3 çekmece', 'Yivli cam', '1 lavabo', 'Ayna çevresi LED'])
    await expect(page.locator('#quote-design-details')).toContainText(text)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '↓ PDF indir', exact: true }).first().click()
  await (await download).saveAs('.tools/bathroom-qa/rtm-banyo.pdf')
  expect(errors).toEqual([])
})
test('bathroom double vessel basins, wall mirrors and washer layout work on mobile', async ({
  page,
}) => {
  test.setTimeout(180000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await openBathroom(page)
  await page.getByRole('button', { name: /Çift lavabo 160/ }).click()
  await expect
    .poll(() => decode(new URL(page.url()).hash).bathroom?.lower)
    .toEqual(['sink', 'sink'])
  await page.screenshot({ path: '.tools/bathroom-qa/double.png' })
  await page.getByRole('checkbox', { name: 'Üst dolaplar', exact: true }).uncheck()
  await page
    .getByRole('combobox', { name: 'Duvar aynası biçimi', exact: true })
    .selectOption('round')
  await page.screenshot({ path: '.tools/bathroom-qa/round-mirrors.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  if (await page.locator('.dc-workspace[data-snap="closed"]').count())
    await page.getByRole('button', { name: 'Seçenekler paneli', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Üst dolaplar', exact: true })).not.toBeChecked()
  await page
    .getByRole('combobox', { name: 'Duvar aynası biçimi', exact: true })
    .selectOption('capsule')
  await page
    .getByRole('combobox', { name: 'Duvar aynası biçimi', exact: true })
    .scrollIntoViewIfNeeded()
  await page.screenshot({ path: '.tools/bathroom-qa/mobile.png' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.getByRole('button', { name: /Denge 100/ }).click()
  const width = page.getByRole('spinbutton', { name: 'Genişlik', exact: true })
  await width.fill('180')
  await width.press('Enter')
  await page.locator('.dc-steps button').nth(1).click()
  await page.getByRole('button', { name: 'Alt dolaplar banyo bölme artır', exact: true }).click()
  await page.locator('.dc-steps button').nth(2).click()
  await page.getByRole('button', { name: 'Sonraki banyo bölmesi', exact: true }).click()
  await page.getByRole('button', { name: 'Çamaşır makinesi', exact: true }).click()
  await expect.poll(() => decode(new URL(page.url()).hash).d.d).toBe(60)
  await expect.poll(() => decode(new URL(page.url()).hash).o.baza).toBe('b0')
  await page.getByRole('button', { name: 'Geri al', exact: true }).click()
  await page.getByRole('button', { name: 'İleri al', exact: true }).click()
  await page.screenshot({ path: '.tools/bathroom-qa/washer.png' })
  await page.locator('.dc-quote-action').click()
  await expect(page.locator('.dq-bathroom-plan')).toContainText('Zemine oturan')
  await expect(page.locator('#quote-design-details')).toContainText('Çamaşır makinesi')
  expect(errors).toEqual([])
})
