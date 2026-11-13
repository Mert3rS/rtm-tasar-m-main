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
  const atlas = page.locator('.featured-atlas-layout')
  if (await atlas.count()) {
    await expect(page.locator('.featured-atlas-globe-stage')).toBeVisible()
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

test('cinematic hero scrubs forward and backward, reveals chapters and continues in normal flow', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(origin)
  const hero = page.locator('.cinematic-hero')
  const canvas = hero.locator('canvas')
  await expect(hero).toHaveAttribute('data-enhanced', 'true')
  await expect(hero).toHaveAttribute('data-canvas-ready', 'true')
  await expect(hero).toHaveAttribute('data-loading', 'false')
  await expect(page.locator('.site-header')).toHaveAttribute('data-over-hero', 'true')
  await expect(hero.locator('h1')).toBeVisible()
  await expect(hero.locator('.cinematic-finale')).toHaveAttribute('inert', '')
  const originalCanvas = await canvas.elementHandle()
  await page.locator('.theme-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await canvas.evaluate((element, original) => element === original, originalCanvas)).toBe(
    true,
  )
  await page.locator('.theme-toggle').click()
  await page.screenshot({ path: testInfo.outputPath('cinematic-start.png') })
  for (const [progress, chapter] of [
    [0.32, 0],
    [0.54, 1],
    [0.76, 2],
  ] as const) {
    await hero.evaluate((element, progress) => {
      if (!(element instanceof HTMLElement)) throw new Error('Expected an HTML hero section')
      window.scrollTo({
        top: element.offsetTop + (element.offsetHeight - innerHeight) * progress,
        behavior: 'instant',
      })
    }, progress)
    await expect
      .poll(async () => Number(await canvas.getAttribute('data-frame')))
      .toBeCloseTo(Math.round(progress * 149), 0)
    await expect(hero.locator('.cinematic-chapter').nth(chapter)).toHaveCSS('opacity', '1')
    await expect(hero.locator('.cinematic-stage')).toHaveCSS('position', 'sticky')
    expect(
      await hero.locator('.cinematic-stage').evaluate((e) => e.getBoundingClientRect().top),
    ).toBe(0)
  }
  await instantScroll(page, 3.98)
  await expect(hero.locator('.cinematic-finale')).toHaveCSS('opacity', '1')
  await expect(hero.locator('.cinematic-intro')).toHaveAttribute('inert', '')
  await page.screenshot({ path: testInfo.outputPath('cinematic-finale.png') })
  await instantScroll(page, 0)
  await expect.poll(async () => Number(await canvas.getAttribute('data-frame'))).toBe(0)
  await expect(hero.locator('.cinematic-intro')).toHaveCSS('opacity', '1')
  await expect(hero.locator('.cinematic-finale')).toHaveAttribute('inert', '')
  await hero.locator('.cinematic-scroll-cue').click()
  await expect(page.locator('.site-header')).toHaveAttribute('data-over-hero', 'false')
  expect(errors).toEqual([])
})

for (const width of [1440, 390]) {
  test(`homepage refresh returns to the first animation frame at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(origin)
    const hero = page.locator('.cinematic-hero')
    await expect(hero).toHaveAttribute('data-canvas-ready', 'true')
    for (const position of [2, 6]) {
      await instantScroll(page, position)
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(900)
      await page.reload()
      await expect(hero).toHaveAttribute('data-loading', 'false')
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
      await expect(hero.locator('canvas')).toHaveAttribute('data-frame', '0')
      await expect(hero.locator('.cinematic-intro')).toHaveCSS('opacity', '1')
      await expect(page.locator('.site-header')).toHaveAttribute('data-over-hero', 'true')
    }
    if (width === 1440) {
      await expect(page.locator('.desktop-nav a').first()).toHaveCSS('color', 'rgb(16, 55, 97)')
    } else {
      await page.getByRole('button', { name: 'Menüyü aç' }).click()
      await expect(page.locator('.mobile-nav > a').first()).toHaveCSS('color', 'rgb(16, 55, 97)')
      await page.getByRole('button', { name: 'Menüyü kapat' }).click()
    }
    await expect(page.locator('.header-actions .header-project-link')).toHaveCSS(
      'background-color',
      'rgb(16, 55, 97)',
    )
    // Anchor navigation still advances the story after refreshing.
    await hero.locator('.cinematic-scroll-cue').click()
    await expect(page.locator('.site-header')).toHaveAttribute('data-over-hero', 'false')
    // Refresh also starts at the top when the story's anchor remains in the URL.
    await page.reload()
    await expect(hero).toHaveAttribute('data-loading', 'false')
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
    await expect(hero.locator('canvas')).toHaveAttribute('data-frame', '0')
  })
}

test('missing film frames retain a usable poster fallback and normal navigation', async ({
  page,
}) => {
  const errors: string[] = []
  const warnings: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text())
  })
  await page.route('**/assets/home/cinematic/**', (route) =>
    route.fulfill({ status: 404, body: '' }),
  )
  await page.goto(origin)
  const hero = page.locator('.cinematic-hero')
  await expect(hero).toHaveAttribute('data-loading', 'false')
  await expect(hero).not.toHaveAttribute('data-canvas-ready', 'true')
  await expect(hero.locator('h1')).toBeVisible()
  await expect(hero.locator('.cinematic-intro .cinematic-button')).toHaveAttribute(
    'href',
    '/iletisim',
  )
  expect(warnings.filter((warning) => warning.includes('[RTM hero]'))).toHaveLength(1)
  expect(errors).toEqual([])
})

test('canvas unavailable leaves a static, accessible opening with working links', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
        if (this.classList.contains('cinematic-canvas')) return null
        return original.apply(this, args)
      },
    })
  })
  await page.goto(origin)
  await expect(page.locator('.cinematic-hero')).not.toHaveAttribute('data-enhanced', 'true')
  await expect(page.locator('.cinematic-intro h1')).toBeVisible()
  await expect(page.locator('.cinematic-intro .cinematic-text-link')).toHaveAttribute(
    'href',
    '/projeler',
  )
})

test('featured atlas rotates projects, pauses on request and retains its state across themes', async ({
  page,
  context,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(origin)
  await page.locator('#one-cikan').scrollIntoViewIfNeeded()
  const map = page.locator('.featured-atlas-globe-stage .globe-canvas')
  const populated = await expectAtlasOrEmpty(page)
  if (populated) await expect(map).toBeVisible()
  const originalMap = populated ? await map.elementHandle() : null
  await expect(page.locator('.featured-atlas canvas')).toHaveCount(populated ? 1 : 0)
  const card = page.locator('.atlas-project-card')
  if (await card.count()) {
    const title = await card.locator('h3').textContent()
    const slides = await page.locator('.featured-atlas-city-list button').count()
    if (slides > 1) {
      await card.hover()
      await expect(card.locator('h3')).not.toHaveText(title || '', { timeout: 7500 })
      await expect(page.locator('.atlas-globe-location.is-active')).toBeVisible()
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
  if (!(await expectAtlasOrEmpty(page))) return
  const marker = page.locator('.atlas-globe-location').first()
  await marker.waitFor({ state: 'visible' })
  await expect(page.locator('.atlas-globe-location')).toHaveCount(1)
  await expect(page.locator('.atlas-globe-location-label')).toHaveCount(0)
  await marker.focus()
  await page.keyboard.press('Enter')
  await expect(marker).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.atlas-project-card')).toBeVisible()
  const city = page.locator('.featured-atlas-city-list button[aria-pressed="false"]').first()
  if (await city.count()) {
    const cityName = (await city.textContent())?.trim() || ''
    await city.click()
    await expect(page.locator('.featured-atlas .globe-canvas')).toHaveAttribute(
      'data-atlas-route',
      /.+-.+/,
    )
    await expect(page.locator('.atlas-globe-location')).toHaveCount(0)
    await expect(page.locator('.atlas-globe-location')).toHaveCount(1, { timeout: 3000 })
    await expect(page.locator('.atlas-globe-location')).toHaveAttribute(
      'aria-label',
      new RegExp(cityName, 'i'),
    )
    await expect(
      page.locator('.featured-atlas-city-list button', { hasText: cityName }),
    ).toHaveAttribute('aria-pressed', 'true')
  }
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
  test(`cinematic hero, page layout and atlas fit at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(origin)
    await expect(page.locator('.cinematic-intro')).toHaveCSS('opacity', '1')
    await expect(page.locator('.cinematic-poster img')).toHaveJSProperty(
      'currentSrc',
      `${origin}/assets/home/cinematic/${width < 768 ? 'mobile' : 'desktop'}/frame_0001.webp`,
    )
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
  await expect(page.locator('.cinematic-hero')).not.toHaveAttribute('data-enhanced', 'true')
  await expect(page.locator('.cinematic-intro')).toHaveCSS('opacity', '1')
  await expect(page.locator('.cinematic-intro h1')).toBeVisible()
  await expect(page.locator('.cinematic-poster img')).toHaveJSProperty(
    'currentSrc',
    `${origin}/assets/home/cinematic/desktop/frame_0150.webp`,
  )
  expect(await page.locator('.cinematic-hero').evaluate((hero) => hero.clientHeight)).toBe(
    await page.evaluate(() => innerHeight),
  )
  const next = page.getByRole('button', { name: 'Sonraki hizmet' })
  if (await next.count()) {
    const before = await page.locator('.service-showcase-copy h3').textContent()
    await next.click()
    await expect(page.locator('.service-showcase-copy h3')).not.toHaveText(before || '')
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.home-experience')).toHaveAttribute('data-motion', 'off')
  await expect(page.locator('.cinematic-hero')).not.toHaveAttribute('data-enhanced', 'true')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(page.locator('.cinematic-hero')).toHaveAttribute('data-enhanced', 'true')
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
  // Studio surfaces, actions and toolbar sizes follow their own configured theme tokens.
  const studioTheme = await page.locator('.design-studio').evaluate((element) => {
    const probe = document.createElement('span')
    probe.hidden = true
    element.append(probe)
    probe.style.backgroundColor = 'var(--studio-ui-bg)'
    const background = getComputedStyle(probe).backgroundColor
    probe.style.backgroundColor = 'var(--studio-ui-button)'
    const button = getComputedStyle(probe).backgroundColor
    const toolbarHeight = getComputedStyle(element)
      .getPropertyValue('--studio-toolbar-height')
      .trim()
    probe.remove()
    return { background, button, toolbarHeight }
  })
  await expect(page.locator('.design-studio')).toHaveCSS('background-color', studioTheme.background)
  await expect(page.getByRole('toolbar', { name: 'Tasarım araçları' })).toBeVisible()
  await expect(page.locator('.dc-stepbar')).toHaveCSS('height', studioTheme.toolbarHeight)
  await expect(page.locator('.dc-primary').first()).toHaveCSS(
    'background-color',
    studioTheme.button,
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

test('header preserves public navigation with a cinematic home treatment and compact configurator', async ({
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
    '/tasarim-olustur',
  ]) {
    await page.goto(origin + route)
    const header = page.locator('.site-header')
    await expect(header).toHaveCount(1)
    if (route === '/') {
      await expect(page.locator('.cinematic-hero')).toHaveAttribute('data-enhanced', 'true')
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
    if (route !== '/' && route !== '/tasarim-olustur') {
      if (!baseline) baseline = appearance
      expect(appearance).toBe(baseline)
    }
    await expect(header.locator('.header-inner')).toHaveCSS(
      'height',
      route === '/tasarim-olustur' ? '64px' : '92px',
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
