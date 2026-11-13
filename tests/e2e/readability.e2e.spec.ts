import { expect, test } from '@playwright/test'
import { defaultConfig, encode, productNames, products } from '../../src/lib/configurator/config'
import { expectResponsiveContent } from '../helpers/responsive'

test('quote review uses the home font and readable copy across six products and five widths', async ({
  page,
}, info) => {
  test.setTimeout(180_000)
  page.setDefaultTimeout(15000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  // Read-only visual QA must not leave share records in the local CMS.
  await page.route('**/api/tasarim-baglanti', (route) => route.fulfill({ status: 503, body: '{}' }))
  await page.route('**/api/inquiry-token', (route) =>
    route.fulfill({ json: { token: 'readability-qa-token' } }),
  )
  await page.setViewportSize({ width: 320, height: 1000 })
  await page.goto(
    `http://localhost:3000/tasarim-olustur/teklif#c=${encode(defaultConfig(products[0]))}`,
  )
  await expect(page.locator('.dq-dimensions')).toBeVisible()
  // The persistent public header uses the homepage's font. Start directly on the
  // quote page so no departing homepage can start prefetches during replacement.
  const homeFont = await page
    .locator('.public-site.site-header-shell')
    .evaluate((node) => getComputedStyle(node).fontFamily)
  const documentEpoch = await page.evaluate(() => performance.timeOrigin)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const product of products) {
      const hash = `c=${encode(defaultConfig(product))}`
      await page.evaluate((nextHash) => {
        window.location.hash = nextHash
      }, hash)
      expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentEpoch)
      await expect(page.locator('.dq-design-column > h2')).toHaveText(productNames[product])
      await expect(page.locator('.dq-dimensions')).toBeVisible()
      await expectResponsiveContent(page)
      if (await page.locator('.dq-form-column .inquiry-form').count()) {
        const rows = await page
          .locator('.dq-form-column input[type="checkbox"]')
          .evaluateAll((inputs) =>
            inputs.map((input) => {
              const label = input.closest('label')
              if (!label) throw new Error('Checkbox must have a label')
              const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT)
              let text = walker.nextNode()
              while (text && !text.textContent?.trim()) text = walker.nextNode()
              if (!text) throw new Error('Checkbox label text missing')
              const range = document.createRange()
              range.selectNodeContents(text)
              const line = range.getClientRects()[0]
              if (!line) throw new Error('Checkbox label must be visible')
              const control = input.getBoundingClientRect()
              return {
                gap: line.left - control.right,
                topDifference: Math.abs(line.top - control.top),
                size: parseFloat(getComputedStyle(label).fontSize),
                height: label.getBoundingClientRect().height,
              }
            }),
          )
        expect(rows).toHaveLength(3)
        for (const row of rows) {
          expect(row.gap, 'Keep the checkbox and its own label together').toBeGreaterThanOrEqual(8)
          expect(row.gap).toBeLessThanOrEqual(18)
          expect(row.topDifference).toBeLessThanOrEqual(8)
          expect(row.size).toBeGreaterThanOrEqual(15)
          expect(row.height).toBeGreaterThanOrEqual(44)
        }
        const consent = page.getByRole('checkbox', {
          name: 'Aydınlatma metnini okudum.',
          exact: true,
        })
        await consent.focus()
        await page.keyboard.press('Space')
        await expect(consent).toBeChecked()
        await page.keyboard.press('Space')
        await expect(consent).not.toBeChecked()
      }
      const type = await page
        .locator('.dq-intro > p:not(.eyebrow,.dq-progress)')
        .evaluate((node) => ({
          font: getComputedStyle(node).fontFamily,
          size: parseFloat(getComputedStyle(node).fontSize),
        }))
      expect(type.font).toBe(homeFont)
      expect(type.size).toBeGreaterThanOrEqual(15)
      const expand = page.getByRole('button', { name: 'Detayları göster +', exact: true })
      if (width < 1024 && (await expand.isVisible())) await expand.click()
      await expect(page.locator('#quote-design-details')).toBeVisible()
      await expectResponsiveContent(page)
      expect(
        await page
          .locator('.dq-design-column dl > div')
          .first()
          .evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
      ).toBeGreaterThanOrEqual(15)
      if (product === 'tv' && [390, 1440].includes(width)) {
        await page.evaluate(() => {
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
          window.scrollTo(0, 0)
        })
        await page.screenshot({ path: info.outputPath(`quote-${width}-light.png`), fullPage: true })
        await page.getByRole('button', { name: 'Koyu temaya geç', exact: true }).click()
        await expectResponsiveContent(page)
        await page.screenshot({ path: info.outputPath(`quote-${width}-dark.png`), fullPage: true })
        await page.getByRole('button', { name: 'Açık temaya geç', exact: true }).click()
      }
      await page.getByRole('button', { name: 'Teknik çizimi büyüt', exact: true }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await dialog.getByRole('button').first().click()
      await expect(dialog).toBeHidden()
    }
  }
  expect(errors).toEqual([])
})
