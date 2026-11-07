import { expect, test } from '@playwright/test'

test.setTimeout(120_000)
const origin = 'http://localhost:3000'
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLDialogElement.prototype.showModal
    HTMLDialogElement.prototype.showModal = function () {
      if (this.classList.contains('dc-guide')) return
      return original.call(this)
    }
  })
})

async function expectAtlasOrEmpty(page: import('@playwright/test').Page) {
  const map = page.locator('.featured-dotted-world')
  if (await map.count()) {
    await expect(map).toBeVisible()
    return true
  }
  await expect(page.locator('.featured-atlas-empty')).toContainText(
    'Öne çıkan projeler yayınlandığında burada yer alacak.',
  )
  return false
}

async function instantScroll(page: import('@playwright/test').Page, multiple: number) {
  await page.evaluate(
    (value) => window.scrollTo({ top: innerHeight * value, behavior: 'instant' }),
    multiple,
  )
}

test('supplied spotlight starts at its centre image and reveals the gallery and text on scroll', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(origin)
  const hero = page.locator('.spotlight-scroll')
  await expect(hero).toHaveAttribute('data-enhanced', 'true')
  await expect(page.locator('.site-header')).toBeVisible()
  await expect(page.locator('.hero-spotlight-item')).toHaveCount(9)
  await expect(page.locator('h1')).toHaveAttribute('aria-label', /Bir mekânın hissini/)
  if (
    await page
      .locator('.hero-spotlight-col:nth-child(2) .hero-spotlight-item:nth-child(2) img')
      .count()
  )
    await page.waitForFunction(() => {
      const image = document.querySelector<HTMLImageElement>(
        '.hero-spotlight-col:nth-child(2) .hero-spotlight-item:nth-child(2) img',
      )
      return image?.complete && image.naturalWidth > 0
    })
  else await expect(page.locator('.hero-spotlight-item .spotlight-empty')).toHaveCount(9)
  expect(
    await page
      .locator('.hero-spotlight-gallery')
      .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a),
  ).toBeCloseTo(1)
  await page.screenshot({ path: testInfo.outputPath('spotlight-start.png') })
  await instantScroll(page, 1.35)
  await page.waitForFunction(() =>
    document
      .querySelector<HTMLElement>('.hero-spotlight-gallery')
      ?.style.transform.includes('scale(0.5)'),
  )
  await expect(page.locator('.spotlight-cta')).toHaveCSS('opacity', '1')
  await expect(page.locator('.spotlight-logo')).toBeVisible()
  await expect(page.locator('.spotlight-overlay')).toHaveCSS('opacity', '0')
  await page.screenshot({ path: testInfo.outputPath('spotlight-gallery.png') })
  await expect(page.locator('.hero-spotlight-gallery canvas')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('featured atlas rotates projects, pauses on request and retains its state across themes', async ({
  page,
  context,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(origin)
  await page.locator('#one-cikan').scrollIntoViewIfNeeded()
  const map = page.locator('.featured-dotted-world')
  const populated = await expectAtlasOrEmpty(page)
  const originalMap = populated ? await map.elementHandle() : null
  await expect(page.locator('.featured-atlas canvas')).toHaveCount(0)
  const card = page.locator('.atlas-project-card')
  if (await card.count()) {
    const title = await card.locator('h3').textContent()
    const slides = await page.locator('.featured-atlas-city-list button').count()
    if (slides > 1) {
      await card.hover()
      await expect(card.locator('h3')).not.toHaveText(title || '', { timeout: 3500 })
      await expect(page.locator('.featured-map-marker.is-active .featured-map-badge')).toBeVisible()
      await page.emulateMedia({ reducedMotion: 'reduce' })
      const pausedTitle = await card.locator('h3').textContent()
      await page.waitForTimeout(2200)
      await expect(card.locator('h3')).toHaveText(pausedTitle || '')
    }
  }
  await page.getByRole('button', { name: 'Koyu tema' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  if (populated)
    expect(await map.evaluate((node, original) => node === original, originalMap)).toBe(true)
  // Phase 10: without Functional consent (no approved policy locally) the theme is tab-only.
  // Persistence and cross-tab sync with consent are covered in consent-assistant.e2e.spec.ts.
  expect(await page.evaluate(() => localStorage.getItem('rtm-theme'))).toBeNull()
  const second = await context.newPage()
  await second.goto(origin)
  await instantScroll(second, 1.35)
  await expect(second.locator('html')).toHaveAttribute('data-theme', 'light')
  await second.close()
  expect(errors).toEqual([])
})

test('featured atlas points and city chips work with keyboard', async ({ page }) => {
  await page.goto(origin)
  await page.locator('#one-cikan').scrollIntoViewIfNeeded()
  const marker = page.locator('.featured-dotted-world [role="button"]').first()
  if (!(await marker.count())) return
  await marker.focus()
  await page.keyboard.press('Enter')
  await expect(marker).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.atlas-project-card')).toBeVisible()
  const city = page.locator('.featured-atlas-city-list button').first()
  await city.click()
  await expect(city).toHaveAttribute('aria-pressed', 'true')
})

test('service copy and line study advance automatically and can be paused', async ({ page }) => {
  await page.goto(origin)
  const showcase = page.locator('.service-line-showcase')
  if (!(await showcase.count())) return
  await showcase.scrollIntoViewIfNeeded()
  await expect(showcase.locator('.service-line-study')).toBeVisible()
  const title = await showcase.locator('h3').textContent()
  if ((await showcase.locator('.service-progress-dots button').count()) < 2) return
  await expect(showcase.locator('h3')).not.toHaveText(title || '', { timeout: 3500 })
  await showcase.getByRole('button', { name: 'Otomatik hizmet akışını durdur' }).click()
  const pausedTitle = await showcase.locator('h3').textContent()
  await page.waitForTimeout(2200)
  await expect(showcase.locator('h3')).toHaveText(pausedTitle || '')
  await expect(page.locator('.studio-demo')).toHaveAttribute('href', '/tasarim-olustur')
})

for (const width of [1440, 1024, 768, 390, 320]) {
  test(`spotlight, page layout and atlas fit at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(origin)
    await instantScroll(page, 1.35)
    await expect(page.locator('.spotlight-cta')).toHaveCSS('opacity', '1')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    await page.locator('#one-cikan').scrollIntoViewIfNeeded()
    const populated = await expectAtlasOrEmpty(page)
    const box = await page
      .locator(populated ? '.featured-atlas-layout' : '.featured-atlas-empty')
      .boundingBox()
    expect(box?.x).toBeGreaterThanOrEqual(0)
    expect((box?.x || 0) + (box?.width || 0)).toBeLessThanOrEqual(width + 1)
    if (width === 390) {
      const city = page.locator('.featured-atlas-city-list button').first()
      if (await city.count()) await city.click({ force: true })
      if (populated) await expect(page.locator('.atlas-project-card')).toBeVisible()
      const menu = page.getByRole('button', { name: 'Menüyü aç' })
      await menu.click()
      await expect(page.getByRole('navigation', { name: 'Mobil menü' })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('navigation', { name: 'Mobil menü' })).toBeHidden()
      await expect(menu).toBeFocused()
      await page.screenshot({ path: testInfo.outputPath('mobile-featured-atlas.png') })
    }
  })
}

test('system reduced motion exposes a static hero and service selection still works', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(origin)
  await expect(page.locator('.home-experience')).toHaveAttribute('data-motion', 'off')
  await expect(page.locator('.spotlight-scroll')).not.toHaveAttribute('data-enhanced', 'true')
  await expect(page.locator('.spotlight-cta')).toHaveCSS('opacity', '1')
  await expect(page.locator('.spotlight-header h1')).toBeVisible()
  const next = page.getByRole('button', { name: 'Sonraki hizmet' })
  if (await next.count()) {
    const before = await page.locator('.service-showcase-copy h3').textContent()
    await next.click()
    await expect(page.locator('.service-showcase-copy h3')).not.toHaveText(before || '')
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.home-experience')).toHaveAttribute('data-motion', 'off')
  await expect(page.locator('.spotlight-scroll')).not.toHaveAttribute('data-enhanced', 'true')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(page.locator('.spotlight-scroll')).toHaveAttribute('data-enhanced', 'true')
})

test('public archives, details, gallery, corporate and contact pages use the new design', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 390, height: 844 })
  for (const path of [
    '/projeler',
    '/modeller',
    '/hizmetler',
    '/showroom',
    '/hakkimizda',
    '/iletisim',
    '/teklif-al',
  ]) {
    const response = await page.goto(origin + path)
    expect(response?.status()).toBe(200)
    await expect(page.locator('.workshop-page-intro')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  }
  for (const [path, card] of [
    ['/projeler', '.project-card-link'],
    ['/modeller', '.catalog-card > a'],
    ['/hizmetler', '.service-editorial-image'],
  ]) {
    await page.goto(origin + path)
    const link = page.locator('main').locator(card).first()
    if (!(await link.count())) continue
    await link.click()
    await expect(page.locator('main h1')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    const gallery = page.locator('.gallery-image-button').first()
    if (await gallery.count()) {
      await gallery.click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toBeHidden()
    }
  }
  expect(errors).toEqual([])
})

test('design configurator uses the shared header and keeps independent design controls', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(origin + '/tasarim-olustur')
  await expect(page.locator('.configurator-shell')).toHaveCount(1)
  await expect(page.locator('.configurator-shell .public-site')).toHaveCount(0)
  await expect(page.locator('.site-header')).toHaveCount(1)
  await expect(page.locator('.design-studio')).toHaveCSS(
    'background-color',
    await page
      .locator('.site-header')
      .evaluate((element) => getComputedStyle(element).backgroundColor),
  )
  await expect(page.getByRole('toolbar', { name: 'Tasarım araçları' })).toBeVisible()
  await expect(page.locator('.dc-stepbar')).toHaveCSS('height', '52px')
  await expect(page.locator('.dc-primary').first()).toHaveCSS(
    'background-color',
    await page
      .locator('.header-project-link')
      .evaluate((element) => getComputedStyle(element).backgroundColor),
  )
  const font = await page
    .locator('.design-studio')
    .evaluate((element) => getComputedStyle(element).fontFamily)
  expect(font).toBe(
    await page.locator('.site-header').evaluate((element) => getComputedStyle(element).fontFamily),
  )
})

test('featured atlas remains usable with WebGL unavailable and theme storage blocked', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { value: () => null })
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Storage unavailable')
      },
    })
  })
  await page.goto(origin)
  await page.locator('#one-cikan').scrollIntoViewIfNeeded()
  const populated = await expectAtlasOrEmpty(page)
  const city = page.locator('.featured-atlas-city-list button').first()
  if (await city.count()) await city.click()
  if (populated) await expect(page.locator('.atlas-project-card')).toBeVisible()
  await page.getByRole('button', { name: 'Koyu tema' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('header keeps its appearance with a compact height only on the configurator', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  let baseline: string | undefined
  for (const route of [
    '/',
    '/projeler',
    '/modeller',
    '/hizmetler',
    '/hakkimizda',
    '/iletisim',
    '/showroom',
    '/teklif-al',
    '/tasarim-olustur',
  ]) {
    await page.goto(origin + route)
    const header = page.locator('.site-header')
    await expect(header).toHaveCount(1)
    if (route === '/') {
      await expect(page.locator('.spotlight-scroll')).toHaveAttribute('data-enhanced', 'true')
      await expect(header).toBeVisible()
      await instantScroll(page, 1.15)
      await expect(header).toBeVisible()
      await expect(header).toHaveCSS('opacity', '1')
    }
    await expect(header.locator('.wordmark')).toBeVisible()
    await expect(header.locator('.desktop-nav')).not.toContainText('Hakkımızda')
    await expect(header.locator('.desktop-nav')).not.toContainText('İletişim')
    const appearance = await header.evaluate((element) => {
      const style = getComputedStyle(element)
      const logo = element.querySelector('.wordmark')
      const logoStyle = logo && getComputedStyle(logo)
      return JSON.stringify({
        background: style.backgroundColor,
        color: style.color,
        position: style.position,
        logoVisibility: logoStyle?.visibility,
        links: [...element.querySelectorAll('.desktop-nav a')].map((link) => link.textContent),
        font: style.fontFamily,
      })
    })
    if (!baseline) baseline = appearance
    expect(appearance).toBe(baseline)
    await expect(header.locator('.header-inner')).toHaveCSS(
      'height',
      route === '/tasarim-olustur' ? '56px' : '92px',
    )
    if (route === '/') {
      await instantScroll(page, 1.35)
      await expect(header).toHaveCSS('position', 'fixed')
      await expect(header.locator('.wordmark')).toBeVisible()
    }
  }
})

test('header stays visible and usable through scrolling, motion changes and mobile navigation', async ({
  page,
}) => {
  await page.goto(origin)
  const header = page.locator('.site-header')
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    for (const motion of ['no-preference', 'reduce'] as const) {
      await page.emulateMedia({ reducedMotion: motion })
      for (const scroll of [0, 0.4, 1.35, 3, 0]) {
        await instantScroll(page, scroll)
        await expect(header).toBeVisible()
        await expect(header).toHaveCSS('position', 'fixed')
        await expect(header).toHaveCSS('opacity', '1')
        await expect(header).not.toHaveAttribute('inert')
        await expect(header).not.toHaveAttribute('aria-hidden', 'true')
        expect(await header.evaluate((el) => Math.abs(el.getBoundingClientRect().top) < 1)).toBe(
          true,
        )
      }
    }
    if (width < 820) {
      await page.getByRole('button', { name: 'Menüyü aç', exact: true }).click()
      await expect(page.getByRole('navigation', { name: 'Mobil menü', exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Menüyü kapat', exact: true }).press('Escape')
      await expect(header).toBeVisible()
      await expect(page.getByRole('button', { name: 'Menüyü aç', exact: true })).toBeFocused()
    }
  }
  await page.getByRole('button', { name: 'Koyu temaya geç', exact: true }).click()
  await expect(header).toBeVisible()
})

test('header keeps its DOM identity during public navigation and remains on not-found pages', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('rtm-studio-guide-v1', 'seen'))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(origin)
  const header = page.locator('.site-header')
  const original = await header.elementHandle()
  for (const [label, path] of [
    ['Projeler', '/projeler'],
    ['Tasarım Oluştur', '/tasarim-olustur'],
    ['Ana Sayfa', '/'],
  ]) {
    await header.getByRole('link', { name: label, exact: true }).click()
    await expect(page).toHaveURL((url) => url.origin === origin && url.pathname === path, {
      timeout: 15000,
    })
    if (path === '/tasarim-olustur') await expect(page).toHaveURL(/#c=/)
    await expect(header).toBeVisible()
    expect(await header.evaluate((element, original) => element === original, original)).toBe(true)
  }
  await page.goto(origin + '/projeler/__header-missing-project__')
  await expect(header).toHaveCount(1)
  await expect(header).toBeVisible()
})

test('showroom fullscreen layout retains the header and excludes background navigation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(origin + '/showroom')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.home-experience')).toHaveAttribute('data-motion', 'off')
  // A DOM-only stage exercises the shared fullscreen CSS without creating CMS content.
  await page.locator('main').evaluate((main) => {
    const stage = document.createElement('div')
    stage.className = 'tour-stage'
    const button = document.createElement('button')
    button.textContent = 'Tam ekran düzenini aç'
    button.onclick = () => {
      void document.documentElement.requestFullscreen()
    }
    stage.append(button)
    main.prepend(stage)
  })
  await page.getByRole('button', { name: 'Tam ekran düzenini aç', exact: true }).click()
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.tagName)).toBe('HTML')
  await expect(page.locator('.site-header')).toBeVisible()
  await expect(page.locator('.tour-stage')).toBeVisible()
  await expect(page.locator('main h1')).toBeHidden()
  const geometry = await page.locator('.tour-stage').evaluate((stage) => ({
    top: stage.getBoundingClientRect().top,
    header: document.querySelector('.site-header')?.getBoundingClientRect().bottom,
    bottom: stage.getBoundingClientRect().bottom,
    height: innerHeight,
  }))
  expect(Math.abs(geometry.top - (geometry.header ?? 0))).toBeLessThanOrEqual(1)
  expect(geometry.bottom).toBe(geometry.height)
  await page.evaluate(() => document.exitFullscreen())
  await expect(page.locator('main h1')).toBeVisible()
  await expect(page.locator('.site-header')).toBeVisible()
})

test('selected project timeline reveals copy from left and imagery from right in document flow', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(origin)
  const story = page.locator('.project-timeline')
  if (!(await story.count())) return
  const titles = await story.locator('h3').allTextContents()
  await expect(story).toHaveAttribute('data-enhanced', 'true')
  await expect(story.locator('[inert]')).toHaveCount(0)
  const items = story.locator('.project-timeline-item')
  for (let i = 0; i < (await items.count()); i++) {
    const item = items.nth(i)
    await item.scrollIntoViewIfNeeded()
    await expect(item).toHaveAttribute('data-visible', 'true')
    await expect(item.getByRole('heading', { name: titles[i], exact: true })).toBeVisible()
    await expect(item.locator('.project-timeline-copy')).toHaveCSS('opacity', '1')
    await expect(item.locator('.project-timeline-image')).toHaveCSS('opacity', '1')
  }
  expect(await story.evaluate((element) => getComputedStyle(element).position)).not.toBe('sticky')
  await page.screenshot({ path: testInfo.outputPath('project-timeline-desktop.png') })
  await items.first().locator('.project-scroll-link').click()
  await expect(page).toHaveURL(/\/projeler\//)
  expect(errors).toEqual([])
})

test('project timeline works on mobile and remains fully visible with reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(origin)
  const story = page.locator('.project-timeline')
  if (!(await story.count())) return
  const titles = await story.locator('h3').allTextContents()
  await expect(story).toHaveAttribute('data-enhanced', 'true')
  const last = story.locator('.project-timeline-item').last()
  await last.scrollIntoViewIfNeeded()
  await expect(last).toHaveAttribute('data-visible', 'true')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(story).not.toHaveAttribute('data-enhanced', 'true')
  await expect(story.locator('[inert]')).toHaveCount(0)
  for (const title of titles)
    await expect(story.getByRole('heading', { name: title, exact: true })).toBeVisible()
  await expect(story.getByRole('link', { name: 'Projeyi incele' })).toHaveCount(titles.length)
})
