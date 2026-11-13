import { expect, test, type Page, type Route } from '@playwright/test'
import { getPayload } from 'payload'
import sharp from 'sharp'
import config from '../../src/payload.config'

const origin = 'http://localhost:3000'
const widths = [1440, 1024, 768, 390, 320]
// These specs start without a consent decision.
test.use({ storageState: { cookies: [], origins: [] } })

type Box = { x: number; y: number; width: number; height: number } | null
const consentCookie = async (page: Page) =>
  (await page.context().cookies()).find((cookie) => cookie.name === 'rtm-consent')
const optionalStorage = (page: Page) =>
  page.evaluate(() =>
    [
      'rtm-theme',
      'rtm-design-v2',
      'rtm-studio-guide-v1',
      'rtm-studio-scene-v1',
      'rtm-interest-v1',
    ].filter((key) => localStorage.getItem(key) !== null),
  )
function overlap(a: Box, b: Box) {
  if (!a || !b) return false
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}
const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)

const consentCard = (page: Page) => page.locator('.consent-card')
/** Waits until React has hydrated (a click before hydration is a no-op). */
async function hydrated(page: Page) {
  await expect(page.locator('html')).toHaveAttribute('data-consent-banner', 'open')
}

/** The studio guide opens shortly after load; dismiss it if it appears. */
async function skipStudioGuide(page: Page) {
  const guide = page.getByRole('dialog', { name: 'Ölçülerle başlayın.' })
  if (
    await guide.waitFor({ state: 'visible', timeout: 6000 }).then(
      () => true,
      () => false,
    )
  )
    await page.getByRole('button', { name: 'Rehberi atla' }).click()
}

/** Canned assistant answers: the default (non-opt-in) suite never writes rate-limit rows to the CMS. */
async function mockAssistant(page: Page) {
  let count = 0
  await page.route('**/api/inquiry-token', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"token":"e2e-mock-token"}',
    }),
  )
  await page.route('**/api/assistant', async (route: Route) => {
    count += 1
    const request = route.request().postDataJSON() as { message?: string; path?: string }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        reply: {
          lang: 'tr',
          intent: 'services',
          confidence: 'high',
          answerKey: 'intent:services',
          blocks: [
            {
              type: 'text',
              text: `Örnek cevap ${count}: ${request.message ?? ''} (${request.path ?? ''})`,
            },
          ],
          cards: [],
          chips: [{ label: 'Takip sorusu', message: 'Takip sorusu' }],
          actions: [{ label: 'Teklif al', kind: 'internal', href: '/iletisim' }],
          context: { turn: count },
        },
      }),
    })
  })
}

test.describe('consent card without an approved policy (default local state)', () => {
  // Non-opt-in tests must not write to the CMS: answer the consent proof request locally.
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/consent', (route) =>
      route.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true}' }),
    )
  })

  test('first visit: bottom-left non-modal card, no close button, page stays usable, decision closes it', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(origin)
    const card = consentCard(page)
    await expect(card).toBeVisible()
    await hydrated(page)
    await expect(card).toHaveAttribute('role', 'dialog')
    await expect(card).toHaveAttribute('aria-modal', 'false')
    await expect(page.getByRole('dialog', { name: 'Çerez bilgilendirmesi' })).toBeVisible()
    await expect(card.getByText('yalnızca güvenlik ve temel çalışma için zorunlu')).toBeVisible()
    await expect(card.getByRole('link', { name: 'Çerez politikası' })).toHaveAttribute(
      'href',
      '/cerez-politikasi',
    )
    // Focus moves to the heading; no close (×) button exists.
    await expect(card.locator('[data-consent-heading]')).toBeFocused()
    await expect(card.getByRole('button', { name: /kapat|×/i })).toHaveCount(0)
    const box = await card.boundingBox()
    expect(box && Math.round(box.x)).toBe(24)
    expect(box && Math.round(900 - (box.y + box.height))).toBeGreaterThanOrEqual(24)
    expect(box && box.width).toBeLessThanOrEqual(420)
    // No scrim/lock: the page remains interactive (theme works in-tab without persistence).
    await page.getByRole('button', { name: 'Koyu tema' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(await optionalStorage(page)).toEqual([])
    await expect(card).toBeVisible()
    await card.getByRole('button', { name: 'Anladım' }).click()
    await expect(card).toHaveCount(0)
    await expect(page.locator('.consent-toast')).toHaveText('Tercihleriniz kaydedildi')
    await expect(page.locator('.consent-toast')).toHaveAttribute('data-visible', 'false', {
      timeout: 5000,
    })
    expect((await consentCookie(page))?.value).toContain('unconfigured')
    await page.reload()
    await expect(consentCard(page)).toHaveCount(0)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    expect(await optionalStorage(page)).toEqual([])
  })

  test('manage preferences expands in place and goes back; switches and details', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(origin)
    await hydrated(page)
    const card = consentCard(page)
    const summaryBox = await card.boundingBox()
    await card.getByRole('button', { name: 'Tercihleri yönet' }).click()
    const prefs = page.getByRole('dialog', { name: 'Çerez tercihleri' })
    await expect(prefs).toBeVisible()
    await expect(prefs.locator('[data-consent-heading]')).toBeFocused()
    const prefsBox = await prefs.boundingBox()
    // Same bottom-left anchor; grows upward, at most ~560 px.
    expect(Math.round(prefsBox?.x || 0)).toBe(Math.round(summaryBox?.x || 0))
    expect(
      Math.abs(prefsBox!.y + prefsBox!.height - (summaryBox!.y + summaryBox!.height)),
    ).toBeLessThan(2)
    expect(prefsBox!.height).toBeGreaterThan(summaryBox!.height)
    expect(prefsBox!.height).toBeLessThanOrEqual(561)
    await expect(prefs.getByText('Her zaman açık')).toBeVisible()
    for (const name of ['İşlevsel / Tercih', 'Kişiselleştirme', 'Analitik'])
      await expect(prefs.getByRole('switch', { name })).toBeDisabled()
    await expect(prefs.getByText('Pazarlama')).toHaveCount(0)
    await prefs.getByText('Ayrıntılar').first().click()
    await expect(prefs.getByRole('table').first()).toBeVisible()
    await expect(prefs.getByRole('table').first().getByRole('columnheader')).toHaveText([
      'Ad',
      'Amaç',
      'Süre',
      'Tür',
    ])
    // Escape (undecided) and ← Geri both return to the summary; the card never closes without a decision.
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Çerez bilgilendirmesi' })).toBeVisible()
    await card.getByRole('button', { name: 'Tercihleri yönet' }).click()
    await prefs.getByRole('button', { name: 'Geri' }).click()
    await expect(page.getByRole('dialog', { name: 'Çerez bilgilendirmesi' })).toBeVisible()
  })

  test('re-access: bottom-left icon, footer and policy page open preferences directly with focus return', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${origin}/cerez-politikasi`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Çerez politikası')
    for (const name of [
      'rtm-consent',
      'rtm-inquiry-visitor',
      'rtm-theme',
      'rtm-design-v2',
      'rtm-interest-v1',
      'rtm-assistant-v1',
      'rtm-assistant-intro-v1',
    ])
      await expect(page.locator('main').getByText(name, { exact: true })).toBeVisible()
    await hydrated(page)
    await consentCard(page).getByRole('button', { name: 'Anladım' }).click()
    await expect(consentCard(page)).toHaveCount(0)
    const reopen = page.locator('.consent-reopen')
    await expect(reopen).toBeVisible()
    await expect(reopen).toHaveAccessibleName('Çerez tercihleri')
    const reopenBox = await reopen.boundingBox()
    expect(reopenBox!.width).toBeGreaterThanOrEqual(32)
    expect(reopenBox!.width).toBeLessThanOrEqual(36)
    await reopen.click()
    const prefs = page.getByRole('dialog', { name: 'Çerez tercihleri' })
    await expect(prefs).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(prefs).toHaveCount(0)
    await expect(reopen).toBeFocused()
    const change = page.getByRole('button', { name: 'Tercihleri değiştir' })
    await change.click()
    await expect(prefs).toBeVisible()
    await prefs.getByRole('button', { name: 'Geri' }).click()
    await expect(prefs).toHaveCount(0)
    await expect(change).toBeFocused()
    const footer = page.locator('footer').getByRole('button', { name: 'Çerez tercihleri' })
    await footer.click()
    await expect(prefs).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(footer).toBeFocused()
    // Mobile: no floating re-open button (footer and assistant action remain).
    await page.setViewportSize({ width: 390, height: 780 })
    await expect(reopen).toBeHidden()
  })

  test('admin has no card or assistant; endpoints enforce origin', async ({ page, request }) => {
    await page.goto(`${origin}/admin`)
    await expect(page.locator('.consent-card')).toHaveCount(0)
    await expect(page.locator('.assistant-launcher')).toHaveCount(0)
    for (const path of [
      '/api/assistant',
      '/api/consent',
      '/api/recommendations',
      '/api/assistant/feedback',
    ]) {
      const response = await request.post(`${origin}${path}`, {
        headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' },
        data: {},
      })
      expect(response.status()).toBe(403)
    }
    const oversized = await request.post(`${origin}/api/recommendations`, {
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      data: { items: 'x'.repeat(5000) },
    })
    expect(oversized.status()).toBe(400)
  })

  test('mobile: full-width card, preferences become a modal sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 })
    await page.goto(origin)
    await hydrated(page)
    const card = consentCard(page)
    const box = await card.boundingBox()
    expect(Math.round(box!.x)).toBe(12)
    expect(Math.round(box!.width)).toBe(390 - 24)
    expect(box!.height).toBeLessThanOrEqual(780 * 0.7 + 1)
    await card.getByRole('button', { name: 'Tercihleri yönet' }).click()
    const prefs = page.getByRole('dialog', { name: 'Çerez tercihleri' })
    await expect(prefs).toHaveAttribute('aria-modal', 'true')
    const sheet = await prefs.boundingBox()
    expect(Math.round(sheet!.height)).toBe(780)
    expect(
      await page.evaluate(() => document.querySelector('main')?.closest('[inert]') !== null),
    ).toBe(true)
    // Focus stays inside the sheet.
    for (let i = 0; i < 25; i += 1) await page.keyboard.press('Tab')
    expect(await prefs.evaluate((node) => node.contains(document.activeElement))).toBe(true)
    await prefs.getByRole('button', { name: 'Geri' }).click()
    expect(await page.evaluate(() => document.querySelector('[inert]') === null)).toBe(true)
  })

  test('reduced motion: card and launcher appear without animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(origin)
    await hydrated(page)
    expect(await consentCard(page).evaluate((node) => node.getAnimations().length)).toBe(0)
    const dock = page.locator('.assistant-dock')
    if (await dock.count())
      await expect(dock).toHaveAttribute('data-intro', 'shown', { timeout: 1000 })
  })

  test('screenshots: card and launcher in both themes never overlap', async ({ page }, info) => {
    test.setTimeout(240000)
    for (const theme of ['light', 'dark'] as const) {
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(origin)
        await hydrated(page)
        if (theme === 'dark') await page.getByRole('button', { name: 'Koyu tema' }).click()
        const launcher = page.locator('.assistant-launcher')
        if (await launcher.count()) {
          await expect(page.locator('.assistant-dock')).not.toHaveAttribute(
            'data-intro',
            'pending',
            { timeout: 5000 },
          )
          await page.waitForTimeout(600)
          expect(
            overlap(await consentCard(page).boundingBox(), await launcher.boundingBox()),
            `card×launcher @${width}`,
          ).toBe(false)
        }
        const box = await consentCard(page).boundingBox()
        expect(box && box.x >= 0 && box.x + box.width <= width + 1).toBe(true)
        expect(await noHorizontalScroll(page)).toBe(true)
        await page.screenshot({ path: info.outputPath(`consent-card-${theme}-${width}.png`) })
      }
    }
  })
})

test.describe('assistant launcher and chat panel (mocked replies)', () => {
  // A necessary-only decision so the consent card does not cover these flows.
  test.use({ storageState: 'tests/e2e/consent-state.json' })
  test.beforeEach(async ({ page }) => {
    await mockAssistant(page)
    await page.goto(origin)
    test.skip(
      (await page.locator('.assistant-launcher').count()) === 0,
      'Assistant disabled in this CMS',
    )
  })

  test('desktop: bottom-right card launcher, chat starts with welcome + chips, Escape returns focus', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const launcher = page.locator('.assistant-launcher')
    await expect(page.locator('.assistant-dock')).toHaveAttribute('data-intro', /entering|shown/, {
      timeout: 5000,
    })
    const box = await launcher.boundingBox()
    expect(Math.round(1440 - (box!.x + box!.width))).toBe(24)
    expect(Math.round(box!.height)).toBe(64)
    await expect(launcher).toHaveAccessibleName(/ile sohbet başlat$/)
    await expect(launcher).toHaveAttribute('aria-expanded', 'false')
    await launcher.click()
    await expect(page.locator('#rtm-assistant-panel')).toBeVisible({ timeout: 15000 })
    const panel = page.locator('#rtm-assistant-panel')
    await expect(launcher).toHaveAttribute('aria-expanded', 'true')
    await expect(launcher).toHaveAttribute('aria-controls', 'rtm-assistant-panel')
    await expect(launcher).toHaveAttribute('aria-label', 'Sohbeti kapat')
    await expect(panel).toHaveAttribute('aria-modal', 'false')
    // Compact corner panel: replaces the launcher in the bottom-right corner (measured after the open animation).
    await panel.evaluate((node) =>
      Promise.all(node.getAnimations().map((animation) => animation.finished)),
    )
    const panelBox = await panel.boundingBox()
    expect(panelBox!.width).toBeLessThanOrEqual(361)
    expect(panelBox!.height).toBeLessThanOrEqual(521)
    expect(Math.round(1440 - (panelBox!.x + panelBox!.width))).toBe(24)
    expect(Math.abs(900 - (panelBox!.y + panelBox!.height) - 24)).toBeLessThanOrEqual(1)
    await expect(panel.getByText('Çevrimiçi · Otomatik asistan')).toBeVisible()
    // Welcome + 3–6 chips without typing anything (typing indicator ≤ 400 ms).
    await expect(panel.locator('.assistant-message-bot').first()).toBeVisible({ timeout: 800 })
    const chips = panel.locator('.assistant-chips').first().locator('.assistant-chip')
    expect(await chips.count()).toBeGreaterThanOrEqual(3)
    expect(await chips.count()).toBeLessThanOrEqual(6)
    // Chip-only conversation: no free-text input; focus starts on the first suggestion.
    await expect(panel.getByRole('textbox')).toHaveCount(0)
    await expect(chips.first()).toBeFocused()
    await chips.first().click()
    await expect(panel.locator('.assistant-message-user').last()).toHaveText(/Siz: /)
    await expect(panel.locator('.assistant-turn').last()).toContainText('Örnek cevap 1')
    await expect(
      panel.locator('.assistant-turn').last().getByRole('link', { name: 'Teklif al' }),
    ).toHaveClass(/assistant-action-signal/)
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(launcher).toBeFocused()
    // Same tab: the conversation continues where it left off.
    await page.reload()
    await page.locator('.assistant-launcher').click()
    await expect(panel.locator('.assistant-typing')).toHaveCount(0)
    await expect(panel.locator('.assistant-turn')).toHaveCount(1)
    expect(await page.evaluate(() => Boolean(sessionStorage.getItem('rtm-assistant-v1')))).toBe(
      true,
    )
    expect(
      await page.evaluate(() => Object.keys(localStorage).some((key) => key.includes('assistant'))),
    ).toBe(false)
    await panel.getByRole('button', { name: 'Sohbeti temizle' }).click()
    await expect(panel.locator('.assistant-turn')).toHaveCount(0)
    await expect(panel.locator('.assistant-message-bot').first()).toBeVisible()
  })

  test('contextual chip on the studio page; launcher sits above the bottom navigation', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${origin}/tasarim-olustur`)
    await skipStudioGuide(page)
    const launcher = page.locator('.assistant-launcher')
    await expect(launcher).toBeVisible({ timeout: 10000 })
    expect(
      overlap(await launcher.boundingBox(), await page.locator('.dc-bottom-nav').boundingBox()),
    ).toBe(false)
    await expect(page.locator('.consent-reopen')).toBeHidden()
    await launcher.click()
    const chip = page
      .locator('#rtm-assistant-panel')
      .getByRole('button', { name: 'Atölye nasıl kullanılır?' })
    await expect(chip).toBeVisible()
    await chip.click()
    await expect(page.locator('#rtm-assistant-panel .assistant-turn').last()).toContainText(
      '/tasarim-olustur',
    )
  })

  test('phone: square launcher, one-time greeting, modal sheet with heading focus', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 780 })
    // Clear only after the first load has hydrated and written its own tab flag.
    await expect(page.locator('.assistant-dock')).not.toHaveAttribute('data-intro', 'pending', {
      timeout: 15000,
    })
    await page.evaluate(() => sessionStorage.clear())
    await page.reload()
    await mockAssistant(page)
    const launcher = page.locator('.assistant-launcher')
    const hint = page.locator('.assistant-hint')
    await expect(hint).toBeVisible({ timeout: 15000 })
    await expect(hint).toContainText('size yardımcı olabilirim')
    const box = await launcher.boundingBox()
    expect(Math.round(box!.width)).toBe(56)
    expect(Math.round(390 - (box!.x + box!.width))).toBe(16)
    await hint.getByRole('button', { name: 'Karşılama mesajını kapat' }).click()
    await expect(hint).toHaveCount(0)
    await page.reload()
    await page.waitForTimeout(3000)
    await expect(hint).toHaveCount(0)
    await launcher.click()
    const panel = page.locator('#rtm-assistant-panel')
    await expect(panel).toHaveAttribute('aria-modal', 'true')
    await expect(panel.locator('[data-assistant-heading]')).toBeFocused()
    await expect(launcher).toBeHidden()
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(launcher).toBeFocused()
  })

  test('phone studio: launcher hides while the options sheet is open', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 })
    await page.goto(`${origin}/tasarim-olustur`)
    await skipStudioGuide(page)
    // Phase 8.3 starts with a closed sheet to reserve the larger scene. Opening it hides the launcher.
    await page.getByRole('button', { name: 'Seçenekler paneli', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-studio-sheet', /half|full/)
    await expect(page.locator('.assistant-dock')).toBeHidden()
  })

  test('screenshots: open panel in both themes, five widths', async ({ page }, info) => {
    test.setTimeout(240000)
    for (const theme of ['light', 'dark'] as const) {
      for (const width of widths) {
        await page.setViewportSize({ width, height: 860 })
        await page.goto(origin)
        if (theme === 'dark') await page.getByRole('button', { name: 'Koyu tema' }).click()
        await expect(page.locator('.assistant-dock')).not.toHaveAttribute('data-intro', 'pending', {
          timeout: 5000,
        })
        await page.locator('.assistant-launcher').click()
        await expect(page.locator('#rtm-assistant-panel')).toBeVisible({ timeout: 15000 })
        await expect(page.locator('#rtm-assistant-panel .assistant-chip').first()).toBeVisible()
        expect(await noHorizontalScroll(page)).toBe(true)
        await page.screenshot({ path: info.outputPath(`assistant-panel-${theme}-${width}.png`) })
        await page.keyboard.press('Escape')
      }
    }
  })
})

test.describe('CMS-backed consent, personalisation and assistant', () => {
  test('approved DEMO policy: flows, storage, sync, versioning, assistant and interests', async ({
    page,
  }, info) => {
    test.skip(process.env.RTM_CMS_E2E !== '1', 'Opt-in local DEMO fixtures only')
    if (
      process.env.NODE_ENV === 'production' ||
      !['localhost', '127.0.0.1', '[::1]'].includes(
        new URL(process.env.DATABASE_URI || 'postgresql://localhost').hostname,
      )
    )
      throw new Error('Local development database required')
    test.setTimeout(420000)
    page.setDefaultTimeout(15000)
    const payload = await getPayload({ config, key: 'phase10-consent-e2e' })
    const prefix = `phase10-qa-${crypto.randomUUID().slice(0, 8)}`
    const version = `qa-${Date.now()}`
    const site = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true, depth: 0 })
    const assistant = await payload.findGlobal({
      slug: 'assistant-settings',
      overrideAccess: true,
      depth: 0,
    })
    const ids = {
      countries: [] as number[],
      cities: [] as number[],
      categories: [] as number[],
      media: [] as number[],
      projects: [] as number[],
    }
    let siteUpdated: string | null | undefined
    let assistantUpdated: string | null | undefined
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    try {
      siteUpdated = (
        await payload.updateGlobal({
          slug: 'site-settings',
          overrideAccess: true,
          depth: 0,
          data: {
            cookiePolicyContent: {
              root: {
                type: 'root',
                version: 1,
                direction: null,
                format: '',
                indent: 0,
                children: [
                  {
                    type: 'paragraph',
                    version: 1,
                    children: [
                      {
                        type: 'text',
                        version: 1,
                        text: 'DEMO QA çerez politikası; hukuki metin değildir.',
                      },
                    ],
                  },
                ],
              },
            },
            cookiePolicyVersion: version,
            privacyNoticeContent:
              site.privacyNoticeContent || 'DEMO QA aydınlatma metni; hukuki metin değildir.',
          },
        })
      ).updatedAt
      assistantUpdated = (
        await payload.updateGlobal({
          slug: 'assistant-settings',
          overrideAccess: true,
          depth: 0,
          data: {
            enabled: true,
            displayName: 'DEMO Asistan',
            tagline: 'DEMO alt satır',
            welcomeMessage: 'DEMO karşılama mesajı.',
          },
        })
      ).updatedAt
      const country = await payload.create({
        collection: 'countries',
        depth: 0,
        data: { name: 'DEMO Ülke QA', code: 'QZ', slug: `${prefix}-country` },
      })
      ids.countries.push(country.id)
      const city = await payload.create({
        collection: 'cities',
        depth: 0,
        data: {
          name: 'DEMO Şehir QA',
          slug: `${prefix}-city`,
          country: country.id,
          latitude: 41,
          longitude: 29,
        },
      })
      ids.cities.push(city.id)
      const category = await payload.create({
        collection: 'project-categories',
        depth: 0,
        data: { name: 'DEMO Gardırop QA', slug: `${prefix}-cat`, active: true },
      })
      ids.categories.push(category.id)
      const data = await sharp({
        create: { width: 960, height: 720, channels: 3, background: '#88927c' },
      })
        .png()
        .toBuffer()
      const media = await payload.create({
        collection: 'media',
        depth: 0,
        data: { alt: 'DEMO düz renk test görseli', usage: 'image' },
        file: { data, mimetype: 'image/png', name: `${prefix}.png`, size: data.length },
      })
      ids.media.push(media.id)
      const project = await payload.create({
        collection: 'projects',
        depth: 0,
        data: {
          title: 'DEMO QA Projesi',
          slug: `${prefix}-project`,
          shortDescription: 'DEMO geçici proje.',
          city: city.id,
          coverImage: media.id,
          categories: [category.id],
          _status: 'published',
        },
      })
      ids.projects.push(project.id)

      // 1) Card with equal-size accept/reject (lime vs. dark, both prominent) and a manage option.
      await page.goto(origin)
      await hydrated(page)
      const card = consentCard(page)
      await expect(
        page.getByRole('dialog', { name: 'Deneyiminizi size göre şekillendirelim' }),
      ).toBeVisible()
      const accept = card.getByRole('button', { name: 'Tümünü kabul et' })
      const reject = card.getByRole('button', { name: 'Tümünü reddet' })
      const [acceptBox, rejectBox] = [await accept.boundingBox(), await reject.boundingBox()]
      expect(Math.abs((acceptBox?.width || 0) - (rejectBox?.width || 0))).toBeLessThan(2)
      expect(Math.abs((acceptBox?.height || 0) - (rejectBox?.height || 0))).toBeLessThan(2)
      const fills = await Promise.all(
        [accept, reject].map((button) =>
          button.evaluate((node) => [
            getComputedStyle(node).backgroundColor,
            getComputedStyle(node).fontWeight,
            getComputedStyle(node).fontSize,
          ]),
        ),
      )
      expect(fills[0][0]).not.toBe('rgba(0, 0, 0, 0)')
      expect(fills[1][0]).not.toBe('rgba(0, 0, 0, 0)')
      expect(fills[0][0]).not.toBe(fills[1][0])
      expect(fills[0].slice(1)).toEqual(fills[1].slice(1))

      // 2) Reject: theme + studio work in-tab only, nothing optional persisted, no strip/chips.
      await reject.click()
      await expect(card).toHaveCount(0)
      await page.getByRole('button', { name: 'Koyu tema' }).click()
      expect(await optionalStorage(page)).toEqual([])
      await page.goto(`${origin}/tasarim-olustur`)
      const guide = page.getByRole('dialog', { name: 'Ölçülerle başlayın.' })
      if (await guide.isVisible()) await page.getByRole('button', { name: 'Rehberi atla' }).click()
      await page.waitForTimeout(800)
      expect(await optionalStorage(page)).toEqual([])
      await page.goto(`${origin}/projeler/${prefix}-project`)
      await page.waitForTimeout(500)
      await page.goto(origin)
      expect(await optionalStorage(page)).toEqual([])
      await expect(page.locator('[data-personalized="true"]')).toHaveCount(0)

      // 3) Accept via the preferences view with the keyboard; toast; second tab syncs instantly.
      const prefs = page.getByRole('dialog', { name: 'Çerez tercihleri' })
      await expect(async () => {
        await page.locator('.consent-reopen').click()
        await expect(prefs).toBeVisible({ timeout: 2000 })
      }).toPass({ timeout: 30000 })
      for (const name of ['İşlevsel / Tercih', 'Kişiselleştirme', 'Analitik']) {
        const toggle = prefs.getByRole('switch', { name })
        await expect(toggle).toHaveAttribute('aria-checked', 'false')
        await toggle.focus()
        await page.keyboard.press('Space')
        await expect(toggle).toHaveAttribute('aria-checked', 'true')
      }
      await prefs.getByRole('switch', { name: 'Analitik' }).press('Enter')
      await expect(prefs.getByRole('switch', { name: 'Analitik' })).toHaveAttribute(
        'aria-checked',
        'false',
      )
      await prefs.getByRole('switch', { name: 'Analitik' }).press('Enter')
      await prefs.getByRole('button', { name: 'Seçimlerimi kaydet' }).click()
      await expect(prefs).toHaveCount(0)
      await expect(page.locator('.consent-toast')).toHaveText('Tercihleriniz kaydedildi')
      await page.getByRole('button', { name: 'Koyu tema' }).click()
      await expect.poll(() => page.evaluate(() => localStorage.getItem('rtm-theme'))).toBe('dark')
      const second = await page.context().newPage()
      await second.goto(origin)
      await expect(second.locator('html')).toHaveAttribute('data-theme', 'dark')
      await expect(second.locator('.consent-card')).toHaveCount(0)
      await second.getByRole('button', { name: 'Açık temaya geç' }).click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
      await second.goto(`${origin}/tasarim-olustur`)
      const studioGuide = second.getByRole('dialog', { name: 'Ölçülerle başlayın.' })
      await expect(studioGuide).toBeVisible()
      await second.getByRole('button', { name: 'Rehberi atla' }).click()
      await expect
        .poll(() => second.evaluate(() => localStorage.getItem('rtm-studio-guide-v1')))
        .toBe('seen')
      await expect
        .poll(() => second.evaluate(() => Boolean(localStorage.getItem('rtm-design-v2'))))
        .toBe(true)
      await second.goto(origin)

      // 4) Interests: dwell on a project, then the homepage strip, assistant chips and the
      //    "Kaydedilen ilgi alanlarım" list appear.
      await page.goto(`${origin}/projeler/${prefix}-project`)
      await page.waitForTimeout(11000)
      await page.goto(origin)
      const strip = page.locator('[data-personalized="true"]')
      await expect(strip).toBeVisible({ timeout: 20000 })
      await expect(strip.getByRole('heading', { name: 'Sizin için seçtiklerimiz' })).toBeVisible()
      await strip.getByText('Neden bunu görüyorum?').click()
      await expect(
        strip.getByText(/DEMO Gardırop QA projeleri|DEMO Şehir QA projeleri/i),
      ).toBeVisible()
      await page.screenshot({
        path: info.outputPath('phase10-interest-strip.png'),
        fullPage: false,
      })
      await page.locator('.consent-reopen').click()
      await expect(prefs.getByText('Kaydedilen ilgi alanlarım')).toBeVisible()
      await expect(prefs.locator('.consent-interest-list li')).not.toHaveCount(0)
      await prefs.getByRole('button', { name: 'Geri' }).click()

      // 5) Assistant: launcher everywhere public, CMS name/subtitle/welcome, chips, flows, cards.
      for (const path of [
        '/',
        '/projeler',
        '/hizmetler',
        '/modeller',
        '/showroom',
        '/iletisim',
        '/iletisim',
        '/hakkimizda',
        '/tasarim-olustur',
        '/cerez-politikasi',
      ])
        await page
          .goto(`${origin}${path}`)
          .then(() => expect(page.locator('.assistant-launcher')).toBeAttached())
      await page.goto(`${origin}/admin`)
      await expect(page.locator('.assistant-launcher')).toHaveCount(0)
      await page.goto(`${origin}/projeler/${prefix}-project`)
      const launcher = page.locator('.assistant-launcher')
      await expect(launcher).toHaveAccessibleName('DEMO Asistan ile sohbet başlat')
      await expect(page.locator('.assistant-launcher-text')).toContainText('DEMO alt satır')
      await page.waitForLoadState('networkidle')
      await launcher.click()
      const panel = page.getByRole('dialog', { name: 'DEMO Asistan' })
      await expect(panel).toBeVisible()
      await expect(panel.getByText('DEMO karşılama mesajı.')).toBeVisible()
      await expect(
        panel
          .getByRole('button', { name: /DEMO Şehir QA projelerimiz|tasarlamak ister misiniz/ })
          .first(),
      ).toBeVisible()
      await expect(panel.getByRole('button', { name: 'Bu projeye benzer işler' })).toBeVisible()
      await expect(panel.getByRole('textbox')).toHaveCount(0)
      await expect(panel.locator('.assistant-chip').first()).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(panel).toBeHidden()
      await expect(launcher).toBeFocused()
      await page.goto(origin)
      await page.locator('.assistant-launcher').click()
      // The knowledge index may be up to 60 s old: retry the chip until the DEMO project is indexed.
      await expect(async () => {
        await expect(panel.locator('.assistant-typing')).toHaveCount(0)
        await panel.getByRole('button', { name: 'Projelerinizi göster' }).last().click()
        await expect(
          panel.locator('.assistant-turn').last().locator('.assistant-card'),
        ).not.toHaveCount(0, { timeout: 5000 })
      }).toPass({ timeout: 90000, intervals: [5000, 10000] })
      await expect(
        panel.locator('.assistant-turn').last().locator('.assistant-card').first(),
      ).toContainText('İncele →')
      await expect(
        panel.getByRole('group', { name: 'Bu cevap yardımcı oldu mu?' }).last(),
      ).toBeVisible()
      // A reply without its own suggestions falls back to the main menu chips.
      await panel.getByRole('button', { name: 'Hizmetleriniz neler?' }).first().click()
      await expect(
        panel
          .locator('.assistant-turn')
          .last()
          .getByRole('button', { name: 'Teklif nasıl alırım?' }),
      ).toBeVisible()
      await page.route('**/api/assistant', (route) =>
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: '{"ok":false,"message":"DEMO hata"}',
        }),
      )
      await panel.getByRole('button', { name: 'Hizmetleriniz neler?' }).last().click()
      await expect(panel.getByRole('alert')).toContainText('DEMO hata')
      await page.unroute('**/api/assistant')
      await panel.getByRole('button', { name: 'Tekrar dene' }).click()
      await expect(panel.getByRole('alert')).toHaveCount(0)
      await panel.getByRole('button', { name: 'Sohbeti temizle' }).click()
      await expect(panel.locator('.assistant-message-user')).toHaveCount(0)
      // Choosing a product opens the studio with that product applied (and undoable).
      await panel
        .getByRole('button', { name: 'Kendi dolabımı tasarlamak istiyorum' })
        .first()
        .click()
      await panel
        .locator('.assistant-turn')
        .last()
        .getByRole('button', { name: 'TV ünitesi', exact: true })
        .click()
      await expect(page).toHaveURL(/\/tasarim-olustur/)
      await expect(panel).toBeHidden()
      await expect(page.locator('.dc-products button[aria-pressed="true"]')).toContainText('TV')
      await expect.poll(() => new URL(page.url()).searchParams.get('urun')).toBeNull()
      await page.goto(origin)

      // 6) Revoke: everything optional disappears immediately in both tabs, strip goes away.
      await expect(async () => {
        await page.locator('footer').getByRole('button', { name: 'Çerez tercihleri' }).click()
        await expect(prefs).toBeVisible({ timeout: 2000 })
      }).toPass({ timeout: 30000 })
      await prefs.getByRole('button', { name: 'Tümünü reddet' }).click()
      await expect.poll(() => optionalStorage(page)).toEqual([])
      await expect(page.locator('[data-personalized="true"]')).toHaveCount(0)
      await second.bringToFront()
      await expect.poll(() => optionalStorage(second)).toEqual([])
      await second.close()

      // 7) Policy version change asks again.
      siteUpdated = (
        await payload.updateGlobal({
          slug: 'site-settings',
          overrideAccess: true,
          depth: 0,
          data: { cookiePolicyVersion: `${version}-b` },
        })
      ).updatedAt
      await page.goto(origin)
      await expect(page.locator('.consent-card')).toBeVisible()

      // 8) No overlap: card + launcher; studio bottom nav + launcher + card.
      for (const width of widths) {
        await page.setViewportSize({ width, height: 860 })
        await page.goto(origin)
        await hydrated(page)
        await expect(page.locator('.assistant-dock')).not.toHaveAttribute('data-intro', 'pending', {
          timeout: 5000,
        })
        await page.waitForTimeout(500)
        const boxes = await Promise.all(
          ['.consent-card', '.assistant-launcher'].map((selector) =>
            page.locator(selector).boundingBox(),
          ),
        )
        expect(
          overlap(boxes[0], boxes[1]),
          `card×launcher @${width} ${JSON.stringify(boxes)}`,
        ).toBe(false)
        await page.screenshot({ path: info.outputPath(`phase9-10-home-${width}.png`) })
        await page.goto(`${origin}/tasarim-olustur`)
        const guideDialog = page.getByRole('dialog', { name: 'Ölçülerle başlayın.' })
        if (await guideDialog.isVisible())
          await page.getByRole('button', { name: 'Rehberi atla' }).click()
        await hydrated(page)
        const nav = await page.locator('.dc-bottom-nav').boundingBox()
        expect(
          overlap(await page.locator('.consent-card').boundingBox(), nav),
          `studio card×nav @${width}`,
        ).toBe(false)
        if (await page.locator('.assistant-dock').isVisible())
          expect(
            overlap(await page.locator('.assistant-launcher').boundingBox(), nav),
            `studio launcher×nav @${width}`,
          ).toBe(false)
      }
      expect(errors).toEqual([])
    } finally {
      for (const id of ids.projects)
        await payload.delete({ collection: 'projects', id, depth: 0, overrideAccess: true })
      for (const id of ids.media)
        await payload.delete({ collection: 'media', id, depth: 0, overrideAccess: true })
      for (const id of ids.categories)
        await payload.delete({
          collection: 'project-categories',
          id,
          depth: 0,
          overrideAccess: true,
        })
      for (const id of ids.cities)
        await payload.delete({ collection: 'cities', id, depth: 0, overrideAccess: true })
      for (const id of ids.countries)
        await payload.delete({ collection: 'countries', id, depth: 0, overrideAccess: true })
      // Restore globals only if nobody else edited them meanwhile.
      const currentSite = await payload.findGlobal({
        slug: 'site-settings',
        overrideAccess: true,
        depth: 0,
      })
      if (currentSite.updatedAt === siteUpdated)
        await payload.updateGlobal({
          slug: 'site-settings',
          overrideAccess: true,
          depth: 0,
          data: {
            cookiePolicyContent: site.cookiePolicyContent ?? null,
            cookiePolicyVersion: site.cookiePolicyVersion ?? null,
            privacyNoticeContent: site.privacyNoticeContent ?? null,
          },
        })
      const currentAssistant = await payload.findGlobal({
        slug: 'assistant-settings',
        overrideAccess: true,
        depth: 0,
      })
      if (currentAssistant.updatedAt === assistantUpdated)
        await payload.updateGlobal({
          slug: 'assistant-settings',
          overrideAccess: true,
          depth: 0,
          data: {
            enabled: assistant.enabled ?? false,
            displayName: assistant.displayName ?? null,
            tagline: assistant.tagline ?? null,
            welcomeMessage: assistant.welcomeMessage ?? null,
          },
        })
      // Consent proofs created by this run carry the unique QA policy version.
      await payload.delete({
        collection: 'consent-records',
        overrideAccess: true,
        where: { policyVersion: { like: version } },
      })
      await payload.destroy()
    }
  })
})
