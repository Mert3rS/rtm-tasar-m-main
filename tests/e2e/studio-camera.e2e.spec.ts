import { expect, test, type Page } from '@playwright/test'
import { decode } from '../../src/lib/configurator/config'

async function matrix(page: Page) {
  return page.evaluate(() => {
    const captured: unknown = Reflect.get(window, '__studioViewMatrix')
    if (!Array.isArray(captured) || captured.length !== 16)
      throw new Error('No rendered camera matrix')
    return captured.filter((value): value is number => typeof value === 'number')
  })
}

const difference = (a: number[], b: number[]) =>
  Math.max(...a.map((value, index) => Math.abs(value - b[index])))

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    const showModal = HTMLDialogElement.prototype.showModal
    HTMLDialogElement.prototype.showModal = function () {
      if (!this.classList.contains('dc-guide')) showModal.call(this)
    }
    // Observe the real rendered camera without adding debug APIs to the application.
    const names = new WeakMap<WebGLUniformLocation, string>()
    const prototype = WebGL2RenderingContext.prototype
    const getLocation = prototype.getUniformLocation
    prototype.getUniformLocation = function (program, name) {
      const location = getLocation.call(this, program, name)
      if (location) names.set(location, name)
      return location
    }
    const upload = prototype.uniformMatrix4fv
    prototype.uniformMatrix4fv = function (location, transpose, data, offset = 0, length = 0) {
      if (location && names.get(location) === 'viewMatrix')
        Reflect.set(window, '__studioViewMatrix', Array.from(data).slice(offset, offset + 16))
      upload.call(this, location, transpose, data, offset, length)
    }
  })
})

for (const product of ['tv', 'banyo', 'mutfak', 'gardirop', 'portmanto', 'ozel']) {
  test(`focus fills the screen and restores the stage: ${product}`, async ({ page }) => {
    test.setTimeout(90000)
    await page.setViewportSize({ width: 1440, height: 950 })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`http://localhost:3000/tasarim-olustur?urun=${product}`)
    const canvas = page.locator('.dc-scene canvas')
    await expect(canvas).toHaveAttribute('role', 'img', { timeout: 45000 })
    await expect.poll(() => new URL(page.url()).hash.startsWith('#c=')).toBe(true)
    await expect.poll(() => decode(new URL(page.url()).hash).m).toBe(product)
    await expect.poll(async () => (await matrix(page)).length).toBe(16)
    const original = await canvas.elementHandle()
    const before = await page.locator('.dc-stage').boundingBox()
    const config = decode(new URL(page.url()).hash)
    await page.getByRole('button', { name: 'Odak modu', exact: true }).click()
    await expect(page.locator('.dc-expanded')).toHaveAttribute('data-focus', 'true')
    await expect.poll(async () => (await canvas.boundingBox())?.width).toBe(1440)
    expect((await canvas.boundingBox())?.height).toBeGreaterThan(850)
    await expect(page.locator('.dc-focus-exit')).toBeInViewport({ ratio: 1 })
    await page.screenshot({ path: `.tools/camera-qa/focus-${product}.png` })
    await page.keyboard.press('Escape')
    await expect(page.locator('.dc-expanded')).toHaveAttribute('data-focus', 'false')
    expect(await page.locator('.dc-stage').boundingBox()).toEqual(before)
    expect(await canvas.evaluate((node, previous) => node === previous, original)).toBe(true)
    expect(decode(new URL(page.url()).hash)).toEqual(config)
    expect(errors).toEqual([])
  })
}

for (const width of [1440, 390]) {
  test(`wheel, relative zoom, fit and reset remain consistent at ${width}px`, async ({ page }) => {
    test.setTimeout(90000)
    await page.setViewportSize({ width, height: 950 })
    await page.goto('http://localhost:3000/tasarim-olustur?urun=tv')
    const canvas = page.locator('.dc-scene canvas')
    await expect(canvas).toHaveAttribute('role', 'img', { timeout: 45000 })
    await expect.poll(async () => (await matrix(page)).length).toBe(16)
    if (width < 768)
      await page.getByRole('button', { name: 'Önizleme araçları', exact: true }).click()
    await page.getByRole('button', { name: 'Odak modu', exact: true }).click()
    if (width < 768) await page.keyboard.press('Escape') // Close the tools popover only.
    await expect(page.locator('.dc-expanded')).toHaveAttribute('data-focus', 'true')
    await expect.poll(async () => (await canvas.boundingBox())?.width).toBe(width)
    const box = await canvas.boundingBox()
    if (!box) throw new Error('Missing canvas')
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.4, { steps: 8 })
    await page.mouse.up()
    const rotated = await matrix(page)
    await page.mouse.wheel(0, -220)
    await expect.poll(async () => difference(await matrix(page), rotated)).toBeGreaterThan(0.02)
    const wheeled = await matrix(page)
    if (width < 768)
      await page.getByRole('button', { name: 'Önizleme araçları', exact: true }).click()
    await page.getByRole('button', { name: 'Yaklaş', exact: true }).click()
    await expect.poll(async () => difference(await matrix(page), wheeled)).toBeGreaterThan(0.02)
    await page.getByRole('button', { name: 'Uzaklaş', exact: true }).click()
    await expect.poll(async () => difference(await matrix(page), wheeled)).toBeLessThan(0.002)
    await page.getByRole('button', { name: 'Sığdır', exact: true }).click()
    await expect.poll(async () => difference(await matrix(page), wheeled)).toBeGreaterThan(0.02)
    const fitted = await matrix(page)
    // Fit preserves orientation; reset returns to the product's default viewing angle.
    expect(difference(fitted.slice(0, 12), wheeled.slice(0, 12))).toBeLessThan(0.002)
    await page.getByRole('button', { name: 'Kamerayı sıfırla', exact: true }).first().click()
    await expect
      .poll(async () => difference((await matrix(page)).slice(0, 12), fitted.slice(0, 12)))
      .toBeGreaterThan(0.01)
    if (width < 768) {
      await page.keyboard.press('Escape')
      await page.locator('.dc-view-tabs button').nth(1).click()
      await page.getByRole('button', { name: 'Önizleme araçları', exact: true }).click()
      await page.getByRole('button', { name: 'Sığdır', exact: true }).click()
      await page.keyboard.press('Escape')
      await page.locator('.dc-view-tabs button').nth(0).click()
      await page.getByRole('button', { name: 'Önizleme araçları', exact: true }).click()
      await page.keyboard.press('Escape')
    }
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true)
  })
}
