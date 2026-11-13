import { expect, test } from '@playwright/test'
import {
  expectReadableInputs,
  expectResponsiveContent,
  mobileViewports,
  navigateMobilePage,
} from '../helpers/responsive'
import { decode } from '../../src/lib/configurator/config'

const origin = 'http://localhost:3000'
const routes = [
  '/',
  '/projeler',
  '/modeller',
  '/hizmetler',
  '/showroom',
  '/hakkimizda',
  '/iletisim',
  '/cerez-politikasi',
  '/tasarim-olustur/teklif',
]

test.setTimeout(180_000)
test.use({ reducedMotion: 'reduce', isMobile: true, hasTouch: true })
test.beforeEach(({ page }) => {
  page.setDefaultTimeout(20_000)
})

for (const viewport of mobileViewports) {
  test(`public pages fit ${viewport.width}×${viewport.height} with readable forms and scrollable menus`, async ({
    page,
  }, info) => {
    await page.setViewportSize(viewport)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    for (const route of routes) {
      await test.step(route, async () => {
        const response = await navigateMobilePage(page, origin + route)
        expect(response?.status()).toBe(200)
        await expect(page.locator('main h1')).toBeVisible()
        await expectResponsiveContent(page)
        await expectReadableInputs(page)
        const menu = page.getByRole('button', { name: 'Menüyü aç', exact: true })
        await menu.tap()
        const navigation = page.getByRole('navigation', { name: 'Mobil menü', exact: true })
        await expect(navigation).toBeVisible()
        await expect(navigation.getByRole('link').first()).toBeFocused()
        const bounds = await navigation.boundingBox()
        expect(
          (bounds?.y || 0) + (bounds?.height || 0),
          'Menu must fit short landscape screens',
        ).toBeLessThanOrEqual(viewport.height + 1)
        const lastLink = navigation.getByRole('link').last()
        await lastLink.scrollIntoViewIfNeeded()
        await expect(lastLink).toBeInViewport({ ratio: 1 })
        await page.keyboard.press('Escape')
        await expect(navigation).toBeHidden()
        await expect(menu).toBeFocused()
        if (route === '/cerez-politikasi') {
          const table = page.getByRole('region', { name: 'Zorunlu kayıt tablosu' })
          await table.focus()
          if (viewport.width < 560) {
            expect(
              await table.evaluate((element) => element.scrollWidth > element.clientWidth),
            ).toBe(true)
            await table.evaluate((element) => {
              element.scrollLeft = element.scrollWidth
            })
            expect(await table.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
          }
          await page.screenshot({
            path: info.outputPath(`policy-${viewport.width}.png`),
            fullPage: true,
            caret: 'initial',
          })
        }
      })
    }
    for (const route of [
      '/projeler/mobile-missing',
      '/hizmetler/mobile-missing',
      '/modeller/mobile-missing',
      '/showroom/mobile-missing',
      '/t/mobile-missing',
    ]) {
      expect((await navigateMobilePage(page, origin + route))?.status()).toBe(404)
      await expectResponsiveContent(page)
      await expect(page.getByRole('button', { name: 'Menüyü aç', exact: true })).toBeVisible()
    }
    expect(errors).toEqual([])
  })
}

test.describe('first-visit overlays', () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    test(`consent and assistant stay reachable at ${viewport.width}×${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await page.route('**/api/consent', (route) => route.fulfill({ status: 204 }))
      await page.route('**/api/inquiry-token', (route) =>
        route.fulfill({ json: { token: 'mobile-test-token' } }),
      )
      await page.route('**/api/assistant', (route) =>
        route.fulfill({
          json: {
            ok: true,
            reply: {
              lang: 'tr',
              intent: 'services',
              confidence: 'high',
              answerKey: 'mobile-test',
              blocks: [{ type: 'text', text: 'DEMO mobil yanıt' }],
              cards: [],
              chips: [],
              actions: [],
              context: { turn: 1 },
            },
          },
        }),
      )
      await navigateMobilePage(page, origin)
      const card = page.locator('.consent-card')
      await expect(card).toBeVisible()
      await expect(card).toBeInViewport({ ratio: 1 })
      const manage = card.getByRole('button', { name: /Tercihleri yönet/ })
      if (await manage.count()) await manage.tap()
      else {
        await card.getByRole('button', { name: 'Anladım', exact: true }).tap()
        await expect(card).toBeHidden()
        await page.getByRole('button', { name: 'Çerez tercihleri', exact: true }).tap()
      }
      await expect(
        card.getByRole('heading', { name: 'Çerez tercihleri', exact: true }),
      ).toBeFocused()
      const bounds = await card.boundingBox()
      expect(bounds?.height).toBeLessThanOrEqual(viewport.height)
      expect(bounds?.width).toBeLessThanOrEqual(viewport.width)
      const acknowledge = card.getByRole('button', { name: 'Anladım', exact: true })
      if (await acknowledge.count()) await acknowledge.tap()
      else await card.getByRole('button', { name: 'Tümünü reddet', exact: true }).tap()
      await expect(card).toBeHidden()
      const launcher = page.locator('.assistant-launcher')
      if (await launcher.count()) {
        await launcher.locator('.assistant-launcher-mark').tap()
        const panel = page.locator('#rtm-assistant-panel')
        await expect(panel).toBeVisible()
        await expect(panel).toBeInViewport({ ratio: 1 })
        await panel.locator('.assistant-chip').first().tap()
        await expect(panel).toContainText('DEMO mobil yanıt')
        await panel.getByRole('button', { name: 'Sohbeti kapat', exact: true }).tap()
        await expect(panel).toBeHidden()
      }
    })
  }
})

test('touch navigation, forms and cookie preferences remain usable in both themes', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await navigateMobilePage(page, origin + '/iletisim')
  const phone = page.locator('main input[name="phone"]')
  await phone.tap()
  await phone.fill('+90 555 000 00 00')
  await expect(phone).toBeFocused()
  await expectReadableInputs(page)
  await page.getByRole('button', { name: 'Koyu temaya geç', exact: true }).tap()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expectResponsiveContent(page)
  await page.screenshot({
    path: info.outputPath('contact-dark-phone.png'),
    fullPage: true,
    caret: 'initial',
  })
  const menu = page.getByRole('button', { name: 'Menüyü aç', exact: true })
  await menu.tap()
  await page
    .getByRole('navigation', { name: 'Mobil menü', exact: true })
    .getByRole('link', { name: 'Modeller', exact: false })
    .tap()
  await expect(page).toHaveURL(origin + '/modeller')
  await expect(page.getByRole('navigation', { name: 'Mobil menü', exact: true })).toBeHidden()
  await expectResponsiveContent(page)
  await navigateMobilePage(page, origin + '/cerez-politikasi')
  await page.getByRole('button', { name: 'Tercihleri değiştir', exact: true }).tap()
  const preferences = page.getByRole('dialog')
  await expect(preferences).toBeVisible()
  await expect(
    preferences.getByRole('heading', { name: 'Çerez tercihleri', exact: true }),
  ).toBeFocused()
  const box = await preferences.boundingBox()
  expect(box?.width).toBeLessThanOrEqual(390)
  expect(box?.height).toBeLessThanOrEqual(844)
  await page.keyboard.press('Escape')
  await expect(preferences).toBeHidden()
})

for (const viewport of mobileViewports) {
  test(`six studio products, options, summary and quote fit ${viewport.width}×${viewport.height}`, async ({
    page,
  }, info) => {
    test.setTimeout(240_000)
    await page.setViewportSize(viewport)
    // Inspect the quote layout using its full encoded design URL; do not leave shared DEMO links.
    await page.route('**/api/tasarim-baglanti', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }),
    )
    for (const product of ['ozel', 'gardirop', 'mutfak', 'banyo', 'tv', 'portmanto']) {
      await test.step(product, async () => {
        await navigateMobilePage(page, `${origin}/tasarim-olustur?urun=${product}`)
        await expect
          .poll(() => {
            const hash = new URL(page.url()).hash
            return hash.startsWith('#c=') ? decode(hash).m : undefined
          })
          .toBe(product)
        await expect(page.locator('.dc-scene canvas, .dc-webgl-fallback').first()).toBeVisible({
          timeout: 45_000,
        })
        const guide = page.locator('dialog.dc-guide[open]')
        if (await guide.count())
          await guide.getByRole('button', { name: 'Rehberi kapat', exact: true }).tap()
        const canvas = (await page.locator('.dc-scene canvas').count())
          ? await page.locator('.dc-scene canvas').elementHandle()
          : null
        await expectResponsiveContent(page)
        if (viewport.width < 768 || (await page.locator('.dc-workspace.dc-panel-hidden').count()))
          await page.getByRole('button', { name: 'Seçenekler paneli', exact: true }).tap()
        const firstNumber = page.locator('.dc-number input').first()
        await expect(firstNumber).toBeVisible()
        await firstNumber.tap()
        await expectReadableInputs(page)
        await firstNumber.press('Tab')
        if (viewport.width < 768) await page.locator('.dc-mobile-grip').press('Home')
        else await page.getByRole('button', { name: 'Seçenekler paneli', exact: true }).tap()
        await page.locator('.dc-summary-toggle').tap()
        const summary = page.locator('#design-summary')
        await expect(summary).toBeVisible()
        await expect(page.getByRole('button', { name: 'Özeti kapat', exact: true })).toBeInViewport(
          { ratio: 1 },
        )
        await page.getByRole('button', { name: 'Özeti kapat', exact: true }).tap()
        if (canvas)
          expect(
            await page
              .locator('.dc-scene canvas')
              .evaluate((node, original) => node === original, canvas),
          ).toBe(true)
        await expectResponsiveContent(page)
        if (product === 'tv') {
          await page.locator('.dc-quote-action').tap()
          await expect(page).toHaveURL(/\/tasarim-olustur\/teklif#c=/)
          await expect(page.locator('.dq-page')).toBeVisible()
          await expectResponsiveContent(page)
          await expectReadableInputs(page)
          if (viewport.width === 390)
            await page.screenshot({
              path: info.outputPath('design-quote-phone.png'),
              fullPage: true,
              caret: 'initial',
            })
        }
      })
    }
  })
}
