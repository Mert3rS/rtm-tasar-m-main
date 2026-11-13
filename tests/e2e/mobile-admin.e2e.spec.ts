import { expect, test } from '@playwright/test'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'
import { login } from '../helpers/login'
import {
  expectReadableInputs,
  expectResponsiveContent,
  navigateMobilePage,
} from '../helpers/responsive'

const origin = 'http://localhost:3000'
test.use({ isMobile: true, hasTouch: true })
const collections = [
  'projects',
  'project-categories',
  'media',
  'showrooms',
  'showroom-scenes',
  'services',
  'design-models',
  'model-categories',
  'inquiries',
  'inquiry-attachments',
  'design-shares',
  'assistant-answers',
  'faqs',
  'assistant-unanswered',
  'assistant-feedback',
  'countries',
  'cities',
  'users',
  'consent-records',
]

test.describe('native admin on touch screens', () => {
  test.skip(process.env.RTM_CMS_E2E !== '1', 'Temporary local DEMO account only')
  test.setTimeout(240_000)
  test.beforeAll(async () => {
    await seedTestUser()
  })
  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('mobile navigation closes after selecting a page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await login({ page, user: testUser })
    await page.getByRole('button', { name: 'Yönetim menüsünü aç', exact: true }).tap()
    const menu = page.getByRole('dialog')
    await expect(menu).toBeVisible()
    await menu.locator('a[href="/admin/collections/projects"]').tap()
    await expect(page).toHaveURL((url) => url.pathname === '/admin/collections/projects')
    await expect(menu).toBeHidden()
    await expectResponsiveContent(page)
  })

  for (const width of [320, 390, 768]) {
    test(`all visible native lists and editing forms fit ${width}px`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 844 })
      await login({ page, user: testUser })
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      for (const collection of collections) {
        await test.step(collection, async () => {
          expect(
            (await navigateMobilePage(page, `${origin}/admin/collections/${collection}`))?.status(),
          ).toBe(200)
          await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
          await expectResponsiveContent(page)
        })
      }
      for (const slug of ['site-settings', 'about-page', 'assistant-settings']) {
        expect((await navigateMobilePage(page, `${origin}/admin/globals/${slug}`))?.status()).toBe(
          200,
        )
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
        await expectResponsiveContent(page)
        if (slug === 'site-settings' && width === 390)
          await page.screenshot({ path: info.outputPath('settings-phone.png'), caret: 'initial' })
      }
      for (const collection of [
        'projects',
        'services',
        'design-models',
        'showrooms',
        'showroom-scenes',
        'media',
        'users',
      ]) {
        expect(
          (
            await navigateMobilePage(page, `${origin}/admin/collections/${collection}/create`)
          )?.status(),
        ).toBe(200)
        await expect(page.locator('form').first()).toBeVisible()
        await expectResponsiveContent(page)
        await expectReadableInputs(page)
      }
      expect(errors).toEqual([])
    })
  }
})
