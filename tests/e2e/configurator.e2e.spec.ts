import { expect, test, type Page } from '@playwright/test'
import { decode, productNames, products } from '../../src/lib/configurator/config'

async function openOptions(page: Page) {
  await expect(page.locator('.dc-workspace')).toBeVisible()
  if (await page.locator('dialog[open]').count()) return
  if (
    (await page.locator('.dc-workspace.dc-panel-hidden').count()) ||
    (await page.locator('.dc-workspace[data-snap="closed"]').count())
  )
    await page.getByRole('button', { name: 'Seçenekler paneli', exact: true }).click()
}

// Phase 10: without an approved cookie policy the guide preference is not persisted, so the
// first-visit guide appears on every load. Dismiss it automatically except in the guide test.
test.beforeEach(async ({ page }, info) => {
  // Short-link persistence is exercised only by the opt-in design-quote CMS test.
  await page.route('**/api/tasarim-baglanti', (route) =>
    route.fulfill({ status: 503, json: { error: 'DEMO offline fallback' } }),
  )
  if (!info.title.includes('first-visit guide'))
    // Test fixture equivalent to the former 'seen' storage value: the guide never opens.
    await page.addInitScript(() => {
      const original = HTMLDialogElement.prototype.showModal
      HTMLDialogElement.prototype.showModal = function () {
        if (this.classList.contains('dc-guide')) return
        return original.call(this)
      }
    })
})

test('phase 8.2 room colors persist separately without remounting or changing design history', async ({
  page,
}) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('http://localhost:3000/tasarim-olustur')
  await openOptions(page)
  const canvas = page.locator('.dc-scene canvas')
  await expect(canvas).toBeVisible()
  const original = await canvas.elementHandle()
  await page.getByRole('button', { name: 'Mekân', exact: true }).click()
  const hex = page.getByRole('textbox', { name: 'Duvar rengi HEX', exact: true })
  const initialUrl = page.url()
  const undo = page.getByRole('button', { name: 'Geri al', exact: true })
  await expect(undo).toBeDisabled()
  await hex.fill('#102030')
  await hex.press('Enter')
  await expect(page.locator('.dc-room-color output').first()).toContainText('#102030')
  await hex.fill('#zzzzzz')
  await hex.press('Enter')
  await expect(page.locator('.dc-room-color [role="alert"]')).toContainText(
    'Son geçerli renk korundu',
  )
  await expect(page.locator('.dc-room-color output').first()).toContainText('#102030')
  await hex.fill('#102030')
  await hex.press('Enter')
  await page.getByLabel('Zemin rengi seçici', { exact: true }).fill('#506070')
  await page.getByLabel('Zemin rengi seçici', { exact: true }).blur()
  await expect(page.locator('.dc-room-color output').last()).toContainText('#506070')
  await page.getByRole('button', { name: 'Koyu temaya geç', exact: true }).click()
  await expect(hex).toHaveValue('#102030')
  expect(await canvas.evaluate((node, original) => node === original, original)).toBe(true)
  expect(page.url()).toBe(initialUrl)
  await expect(undo).toBeDisabled()
  // Phase 10: without Functional consent preferences live in this tab only (nothing stored).
  expect(await page.evaluate(() => localStorage.getItem('rtm-studio-scene-v1'))).toBeNull()
  await page.reload()
  await openOptions(page)
  await page.getByRole('button', { name: 'Mekân', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Duvar rengi HEX', exact: true })).not.toHaveValue(
    '#102030',
  )
  await page.getByRole('button', { name: 'Varsayılana dön', exact: true }).click()
  expect(await page.evaluate(() => localStorage.getItem('rtm-studio-scene-v1'))).toBeNull()
})

test('phase 8.2 fixed human scale in all views and all six product props retain the Canvas', async ({
  page,
}) => {
  test.setTimeout(180000)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('http://localhost:3000/tasarim-olustur')
  await openOptions(page)
  const canvas = page.locator('.dc-scene canvas')
  await expect(canvas).toBeVisible()
  const original = await canvas.elementHandle()
  await page.getByRole('button', { name: 'İnsan ölçeği', exact: true }).click()
  await expect(page.locator('.dc-scene [data-human-scale]')).toHaveText('180 cm', {
    timeout: 15000,
  })
  await page.getByRole('button', { name: 'Önden', exact: true }).click()
  await expect(page.locator('.dc-scene [data-human-scale]')).toBeVisible()
  await page.getByRole('button', { name: 'Teknik çizim', exact: true }).click()
  await expect(page.locator('.dc-technical.visible [data-human-scale]')).toContainText('180 cm')
  expect(await page.getByRole('spinbutton', { name: /İnsan|boyu|boy /i }).count()).toBe(0)
  await page.getByRole('button', { name: 'Üç boyutlu', exact: true }).click()
  await page.getByRole('button', { name: 'İç düzeni göster', exact: true }).click()
  for (const product of products) {
    await page.locator('.dc-products button').filter({ hasText: productNames[product] }).click()
    if (await page.locator('dialog[open]').count())
      await page
        .locator('dialog[open]')
        .getByRole('button', { name: /Ürünü değiştir/ })
        .click()
    await page.waitForTimeout(700)
    expect(await canvas.evaluate((node, original) => node === original, original)).toBe(true)
    await page.screenshot({ path: `test-results/phase8.2/product-${product}.png` })
    const design = decode(new URL(page.url()).hash)
    expect(design.m).toBe(product)
    expect(Object.keys(design)).toEqual(product === 'mutfak' ? ['v', 'm', 'k', 'd', 'r', 'o'] : product === 'gardirop' ? ['v', 'm', 'wardrobe', 'd', 'r', 'o'] : product === 'portmanto' ? ['v', 'm', 'entryway', 'd', 'r', 'o'] : product === 'banyo' ? ['v', 'm', 'bathroom', 'd', 'r', 'o'] : product === 'tv' ? ['v', 'm', 'tvUnit', 'd', 'r', 'o'] : ['v', 'm', 'd', 'r', 'o'])
  }
  const toggle = page.getByRole('button', { name: 'Eşyaları göster', exact: true })
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  // Phase 10: without Functional consent the props preference is tab-only.
  await page.reload()
  await openOptions(page)
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => localStorage.getItem('rtm-studio-scene-v1'))).toBeNull()
  expect(errors).toEqual([])
})

test('phase 8.2 studio contrast and room controls at five widths in both themes', async ({
  page,
}) => {
  test.setTimeout(240000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('http://localhost:3000/tasarim-olustur')
  await openOptions(page)
  await page.getByRole('button', { name: 'İnsan ölçeği', exact: true }).click()
  await page.getByRole('button', { name: 'Ölçüleri göster', exact: true }).click()
  for (const dark of [false, true]) {
    await page.setViewportSize({ width: 1440, height: 1000 })
    if (dark) await page.getByRole('button', { name: 'Koyu temaya geç', exact: true }).click()
    for (const wall of ['#ffffff', '#000000']) {
      await page.setViewportSize({ width: 1440, height: 1000 })
      const room = page.getByRole('button', { name: 'Mekân', exact: true })
      if ((await room.getAttribute('aria-expanded')) === 'false') await room.click()
      const input = page.getByRole('textbox', { name: 'Duvar rengi HEX', exact: true })
      await input.fill(wall)
      await input.press('Enter')
      for (const width of [1440, 1024, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.waitForTimeout(250)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        )
        await page.screenshot({
          path: `test-results/phase8.2/${dark ? 'dark' : 'light'}-${wall.slice(1)}-${width}.png`,
        })
      }
    }
  }
})

test('quote endpoint rejects untrusted, unsigned and oversized requests', async ({ request }) => {
  const endpoint = 'http://localhost:3000/api/teklif'
  expect(
    (
      await request.post(endpoint, { headers: { Origin: 'https://untrusted.example' }, data: {} })
    ).status(),
  ).toBe(403)
  expect(
    (
      await request.post(endpoint, { headers: { Origin: 'http://localhost:3000' }, data: {} })
    ).status(),
  ).toBe(400)
  expect(
    (
      await request.post(endpoint, {
        headers: { Origin: 'http://localhost:3000' },
        data: { message: 'x'.repeat(25000) },
      })
    ).status(),
  ).toBe(400)
})

test('WebGL renders on demand, survives theme changes and exports PNG', async ({ page }) => {
  test.setTimeout(120000)
  await page.addInitScript(() => {
    Reflect.set(window, 'rtmTestDraws', 0)
    const original = WebGL2RenderingContext.prototype.drawElements
    WebGL2RenderingContext.prototype.drawElements = function (
      mode: number,
      count: number,
      type: number,
      offset: number,
    ) {
      Reflect.set(window, 'rtmTestDraws', Number(Reflect.get(window, 'rtmTestDraws')) + 1)
      return original.call(this, mode, count, type, offset)
    }
    const instanced = WebGL2RenderingContext.prototype.drawElementsInstanced
    WebGL2RenderingContext.prototype.drawElementsInstanced = function (
      mode: number,
      count: number,
      type: number,
      offset: number,
      instances: number,
    ) {
      Reflect.set(window, 'rtmTestDraws', Number(Reflect.get(window, 'rtmTestDraws')) + 1)
      return instanced.call(this, mode, count, type, offset, instances)
    }
  })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('http://localhost:3000/tasarim-olustur')
  await openOptions(page)
  await page.waitForFunction(() => Number(Reflect.get(window, 'rtmTestDraws')) > 0)
  await page.waitForTimeout(2000)
  const canvas = page.locator('.dc-scene canvas')
  await expect(canvas).toBeVisible()
  const original = await canvas.elementHandle()
  await page.getByRole('button', { name: 'Koyu temaya geç', exact: true }).click()
  expect(await canvas.evaluate((node, original) => node === original, original)).toBe(true)
  await page.screenshot({ path: 'test-results/configurator-3d-dark.png' })
  await page.getByRole('button', { name: 'Kapakları aç / kapat' }).click()
  await page.waitForTimeout(2000)
  const before = await page.evaluate(() => Number(Reflect.get(window, 'rtmTestDraws')))
  await page.waitForTimeout(700)
  const after = await page.evaluate(() => Number(Reflect.get(window, 'rtmTestDraws')))
  expect(after - before).toBeLessThanOrEqual(10)
  await page.locator('.dc-export:not(.dc-more) summary').click()
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Önizleme · PNG' }).click()
  expect((await downloaded).suggestedFilename()).toBe('rtm-tasarim.png')
  expect(errors).toEqual([])
})

test('configuration persists, undo works and technical PDF downloads', async ({ page }) => {
  test.setTimeout(120000)
  await page.goto('http://localhost:3000/tasarim-olustur')
  await openOptions(page)
  await expect(page.getByRole('heading', { name: 'Ön tasarımınızı oluşturun.' })).toBeVisible()
  const width = page.getByRole('spinbutton', { name: 'Genişlik', exact: true })
  await width.fill('160')
  await width.press('Enter')
  await expect(width).toHaveValue('160')
  await expect.poll(() => { const hash = new URL(page.url()).hash; return hash ? decode(hash).d.w : 0 }).toBe(160)
  const savedUrl = page.url()
  await page.getByRole('link', { name: 'Tasarım seçeneklerine geç' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#design-options-content')).toBeFocused()
  await expect(width).toHaveValue('160')
  expect(page.url()).toBe(savedUrl)
  await page.getByRole('button', { name: 'Geri al', exact: true }).click()
  await expect(page.getByRole('spinbutton', { name: 'Genişlik', exact: true })).toHaveValue('120')
  await page.getByRole('button', { name: 'İleri al', exact: true }).click()
  await expect(page.getByRole('spinbutton', { name: 'Genişlik', exact: true })).toHaveValue('160')
  await page.waitForTimeout(400)
  await page.reload()
  await openOptions(page)
  await expect(page.getByRole('spinbutton', { name: 'Genişlik', exact: true })).toHaveValue('160')
  await page.getByRole('button', { name: 'Teknik çizim', exact: true }).click()
  await expect(page.locator('.dc-technical.visible svg')).toBeVisible()
  await page.locator('.dc-export:not(.dc-more) summary').click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Teknik çizim · PDF' }).click()
  expect((await download).suggestedFilename()).toBe('rtm-on-tasarim.pdf')
  await expect(
    page.getByRole('status').filter({ hasText: 'PDF dosyanız hazırlandı.' }),
  ).toBeVisible()
  await page.screenshot({ path: 'test-results/configurator-desktop.png', fullPage: true })
})

test('step navigation and summary selection stay synchronized with the editor', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('http://localhost:3000/tasarim-olustur')
  await openOptions(page)
  await page.getByRole('button', { name: 'Özet: Tasarım özeti', exact: true }).click()
  await expect(
    page.getByRole('complementary', { name: 'Tasarım özeti', exact: true }),
  ).toBeVisible()
  await page.getByTitle('Özet: 2. bölme 1. göz', { exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Bölme', exact: true })).toHaveValue('1')
  await expect(page.locator('.dc-steps button[aria-current="step"]')).toContainText('İç düzen')
  await expect(
    page.getByRole('status').filter({ hasText: '2. bölme, 1. göz seçildi.' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Teknik çizim', exact: true }).click()
  await page
    .locator('.dc-technical.visible')
    .getByRole('button', { name: /^1\. bölme 1\. göz/ })
    .press('Enter')
  await expect(page.getByRole('combobox', { name: 'Bölme', exact: true })).toHaveValue('0')
  await expect(page.getByTitle('Özet: 1. bölme 1. göz', { exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: 'Sonraki adım', exact: true }).click()
  await expect(page.locator('.dc-bottom-nav')).toContainText('Adım 4/6')
  await page.getByRole('button', { name: 'Önceki adım', exact: true }).click()
  await expect(page.locator('.dc-bottom-nav')).toContainText('Adım 3/6')
})

test('canvas selection opens the matching cell panel', async ({ page }) => {
  test.setTimeout(90000)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('http://localhost:3000/tasarim-olustur')
  await openOptions(page)
  await expect(page.locator('.dc-scene canvas')).toBeVisible()
  await page.getByRole('button', { name: 'Önden', exact: true }).click()
  await page.waitForTimeout(1000)
  const box = await page.locator('.dc-scene canvas').boundingBox()
  if (!box) throw new Error('Canvas not visible')
  const scale = Math.min(box.width / (1.2 * 1.3), box.height / (2 * 1.38))
  await page.mouse.click(box.x + box.width / 2 + 0.3 * scale, box.y + box.height / 2 - 0.06 * scale)
  await expect(page.getByRole('combobox', { name: 'Bölme', exact: true })).toHaveValue('1')
  await page.getByRole('combobox', { name: 'Bölme', exact: true }).selectOption('0')
  await expect(page.getByTitle('Özet: 1. bölme 1. göz', { exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('fullscreen retains the step bar and bottom navigation', async ({ page }) => {
  await page.goto('http://localhost:3000/tasarim-olustur')
  await openOptions(page)
  await page.getByRole('button', { name: 'Tam ekran', exact: true }).click()
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.tagName)).toBe('HTML')
  await expect(page.locator('.site-header')).toBeVisible()
  await expect(page.locator('.site-header .wordmark')).toBeVisible()
  await page.getByRole('button', { name: 'Sonraki adım', exact: true }).click()
  await expect(page.locator('.dc-steps button[aria-current="step"]')).toContainText('Bölmeler')
  await page.getByRole('button', { name: 'Tam ekran', exact: true }).click()
  await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true)
})

test('number controls keep focus, honor keyboard increments and reject impossible edits', async ({
  page,
}) => {
  await page.goto('http://localhost:3000/tasarim-olustur')
  await openOptions(page)
  const width = page.getByRole('spinbutton', { name: 'Genişlik', exact: true })
  await width.focus()
  await width.press('ArrowUp')
  await expect(width).toHaveValue('120.5')
  await expect(width).toBeFocused()
  await width.press('Shift+ArrowDown')
  await expect(width).toHaveValue('110.5')
  const height = page.getByRole('spinbutton', { name: 'Yükseklik', exact: true })
  await height.fill('100')
  await height.press('Enter')
  await expect(height).toHaveValue('200')
  await expect(page.getByRole('status').filter({ hasText: 'Kilitli ölçüler' })).toBeVisible()
})

test('boundary dragging previews dimensions, commits once and preserves locks', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('http://localhost:3000/tasarim-olustur')
  await openOptions(page)
  await expect(page.locator('.dc-scene canvas')).toBeVisible()
  await page.getByRole('button', { name: 'Önden', exact: true }).click()
  await page.waitForTimeout(1000)
  const box = await page.locator('.dc-scene canvas').boundingBox()
  if (!box) throw new Error('Canvas not visible')
  const scale = Math.min(box.width / (1.2 * 1.3), box.height / (2 * 1.38))
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 0.15 * scale, y, { steps: 10 })
  await expect(page.locator('.dc-scene-note')).toContainText('75 cm ↔ 45 cm')
  await page.mouse.up()
  await page
    .locator('.dc-steps')
    .getByRole('button', { name: /Bölmeler/ })
    .click()
  const first = page.getByRole('spinbutton', { name: '1. bölme genişliği', exact: true })
  await expect(first).toHaveValue('75')
  await page.getByRole('button', { name: 'Geri al', exact: true }).click()
  await expect(first).toHaveValue('60')
  await page.getByRole('button', { name: 'İleri al', exact: true }).click()
  await expect(first).toHaveValue('75')
  await page.getByRole('button', { name: '1. bölme genişlik kilidi', exact: true }).click()
  await page.mouse.move(x + 0.15 * scale, y)
  await page.mouse.down()
  await page.mouse.move(x + 0.2 * scale, y, { steps: 4 })
  await page.mouse.up()
  await expect(first).toHaveValue('75')
  await expect(first).toBeDisabled()
  await expect(
    page.getByRole('status').filter({ hasText: 'iki bölmenin kilidini açın' }),
  ).toBeVisible()
})

test('mobile sheet supports snap points, dragging and Escape focus return', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('http://localhost:3000/tasarim-olustur')
  await openOptions(page)
  const handle = page.getByRole('button', { name: 'Seçenekler panelinin yüksekliğini ayarla' })
  const workspace = page.locator('.dc-workspace')
  await expect(workspace).toHaveAttribute('data-snap', 'half')
  await handle.focus()
  await handle.press('End')
  await expect(workspace).toHaveAttribute('data-snap', 'full')
  await handle.press('Home')
  await expect(workspace).toHaveAttribute('data-snap', 'closed')
  await expect(page.getByRole('spinbutton', { name: 'Genişlik', exact: true })).toBeHidden()
  await handle.press('ArrowUp')
  await expect(workspace).toHaveAttribute('data-snap', 'half')
  const box = await handle.boundingBox()
  if (!box) throw new Error('Sheet handle not visible')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, box.y - 100, { steps: 8 })
  await page.mouse.up()
  await expect(workspace).toHaveAttribute('data-snap', 'full')
  await page.keyboard.press('Escape')
  await expect(workspace).toHaveAttribute('data-snap', 'closed')
  await expect(page.getByRole('button', { name: 'Seçenekler paneli', exact: true })).toBeFocused()
})

test('first-visit guide can be skipped, is not persisted without consent and can be opened again', async ({
  page,
}) => {
  await page.goto('http://localhost:3000/tasarim-olustur')
  const dialog = page.getByRole('dialog', { name: 'Ölçülerle başlayın.' })
  await expect(dialog).toBeVisible()
  await page.getByRole('button', { name: 'Devam et', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('Dokunun, düzenleyin.')
  await page.getByRole('button', { name: 'Rehberi atla' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Seçenekler paneli', exact: true })).toBeFocused()
  expect(await page.evaluate(() => localStorage.getItem('rtm-studio-guide-v1'))).toBeNull()
  await page.reload()
  // Phase 10: without Functional consent the guide shows again on a fresh load.
  await expect(dialog).toBeVisible()
  await page.getByRole('button', { name: 'Rehberi atla' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  await page.getByRole('button', { name: 'Rehber', exact: true }).click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('reduced motion disables decorative transitions and preserves the canvas across both themes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('http://localhost:3000/tasarim-olustur')
  await openOptions(page)
  const canvas = page.locator('.dc-scene canvas')
  await expect(canvas).toBeVisible()
  const original = await canvas.elementHandle()
  for (const theme of ['dark', 'light']) {
    // The toggle's label names the theme it switches to.
    await page
      .getByRole('button', {
        name: theme === 'dark' ? 'Koyu temaya geç' : 'Açık temaya geç',
        exact: true,
      })
      .click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    expect(await canvas.evaluate((node, original) => node === original, original)).toBe(true)
    expect(
      await page
        .locator('.dc-panel-content')
        .evaluate((node) => getComputedStyle(node).animationName),
    ).toBe('none')
  }
  await page.getByRole('button', { name: 'Kapakları aç / kapat' }).click()
  await expect(page.getByRole('button', { name: 'Kapakları aç / kapat' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('WebGL failure leaves the HTML editor, technical selection and PNG export usable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = new Proxy(HTMLCanvasElement.prototype.getContext, {
      apply(target, context, args) {
        if (String(args[0]).includes('webgl')) return null
        return Reflect.apply(target, context, args)
      },
    })
  })
  await page.goto('http://localhost:3000/tasarim-olustur')
  await openOptions(page)
  await expect(page.getByRole('spinbutton', { name: 'Genişlik', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Teknik çizim', exact: true }).click()
  await expect(page.locator('.dc-technical.visible svg')).toBeVisible()
  await page.locator('.dc-export:not(.dc-more) summary').click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Önizleme · PNG' }).click()
  expect((await download).suggestedFilename()).toBe('rtm-tasarim.png')
})

for (const width of [1440, 1024, 768, 390, 320]) {
  test(`studio fits ${width}px with accessible navigation in both themes`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('http://localhost:3000/tasarim-olustur')
    await openOptions(page)
    await expect(page.locator('.dc-scene canvas')).toBeVisible()
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark')
        await page.getByRole('button', { name: 'Koyu temaya geç', exact: true }).click()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      await expect(page.getByRole('button', { name: 'Sonraki adım', exact: true })).toBeVisible()
      const box = await page
        .getByRole('button', { name: 'Sonraki adım', exact: true })
        .boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44)
      await expect(
        page.getByLabel('Bu araç üretim/CNC çizimi değildir.', { exact: true }),
      ).toBeVisible()
      await page.screenshot({ path: `test-results/configurator-${width}-${theme}.png` })
    }
  })
}

test('invalid links recover, mobile stays within viewport and all steps work', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('http://localhost:3000/tasarim-olustur#c=invalid')
  await openOptions(page)
  await expect(
    page.getByRole('status').filter({ hasText: 'Varsayılan tasarım açıldı' }),
  ).toBeVisible()
  await expect(page.getByRole('spinbutton', { name: 'Genişlik', exact: true })).toHaveValue('120')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  for (const text of ['Bölmeler', 'İç düzen', 'Kapak ve renk', 'Kulp ve detaylar', 'Gönder']) {
    await page
      .locator('.dc-steps')
      .getByRole('button', { name: new RegExp(text) })
      .click()
    await expect(page.locator('.dc-panel-content')).toBeVisible()
  }
  await page
    .locator('.dc-steps')
    .getByRole('button', { name: /Ürün ve ölçü/ })
    .click()
  await page.screenshot({ path: 'test-results/configurator-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'Gardırop', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Ürünü değiştir' }).click()
  await expect(page.getByRole('spinbutton', { name: 'Yükseklik', exact: true })).toHaveValue('240')
})
