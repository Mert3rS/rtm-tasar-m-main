import { expect as baseExpect, test } from '@playwright/test'
import { login } from '../helpers/login'
import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'
import { expectResponsiveContent } from '../helpers/responsive'
import { getPayload } from 'payload'
import config from '../../src/payload.config'
import sharp from 'sharp'

const origin = 'http://localhost:3000'
// Native Payload fields initialize and mount lazily; allow the bounded focus wait to finish.
const expect = baseExpect.configure({ timeout: 15_000 })

test.describe('Visual content studio', () => {
  test.skip(process.env.RTM_CMS_E2E !== '1', 'Local temporary DEMO account only')
  test.setTimeout(180_000)
  test.beforeAll(seedTestUser)
  test.afterAll(cleanupTestUser)

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(20000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await login({ page, user: testUser })
  })

  test('about photo cards open the correct native image, portrait, gallery and sharing tabs', async ({
    page,
  }, info) => {
    await page.goto(`${origin}/admin?page=about`)
    const manager = page.getByRole('region', { name: 'Sayfanın fotoğraf alanları' })
    await expect(manager.locator('.rtm-photo-placement')).toHaveCount(6)
    for (const [label, field, tab] of [
      ['01 · Hakkımızda giriş fotoğrafı', 'heroImage', 'Giriş'],
      ['02 · Şirket hikâyesinin yanındaki fotoğraf', 'storyImage', 'Hikâye ve uzmanlık'],
      ['03 · Ekibin toplu fotoğrafı', 'teamImage', 'Ekip'],
      ['04 · Ekip üyelerinin portreleri', 'teamMembers', 'Ekip'],
      ['05 · Şirket fotoğraf albümü', 'galleryImages', 'Yaklaşım ve görseller'],
      ['Sosyal paylaşım görseli', 'seoImage', 'SEO'],
    ]) {
      await manager
        .getByRole('button', { name: `${label} · fotoğraf seç veya yükle`, exact: true })
        .click()
      const form = page.frameLocator('iframe[title="İçerik düzenleme formu"]')
      await expect(form.getByRole('button', { name: tab, exact: true })).toHaveClass(
        /tabs-field__tab-button--active/,
        { timeout: 15_000 },
      )
      await expect(form.locator(`#field-${field}`)).toBeInViewport()
      await page.getByRole('button', { name: 'Düzenleyiciyi kapat', exact: true }).click()
    }
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      await expectResponsiveContent(page)
    }
    await manager.screenshot({ path: info.outputPath('about-photo-placement-guide.png') })
  })

  test('catalog and showroom placement cards retain the exact document and native field', async ({
    page,
  }) => {
    const payload = await getPayload({ config })
    const marker = `DEMO-photos-${crypto.randomUUID()}`
    const created: Array<{ collection: 'services' | 'design-models' | 'showrooms'; id: number }> =
      []
    let mediaId: number | undefined
    try {
      const buffer = await sharp({
        create: { width: 1200, height: 800, channels: 3, background: '#435869' },
      })
        .jpeg()
        .toBuffer()
      const media = await payload.create({
        collection: 'media',
        data: { alt: `${marker} geometric test photo`, usage: 'image' },
        file: { data: buffer, mimetype: 'image/jpeg', name: `${marker}.jpg`, size: buffer.length },
      })
      mediaId = media.id
      const service = await payload.create({
        collection: 'services',
        data: {
          title: marker,
          slug: `${marker}-service`.toLowerCase(),
          coverImage: media.id,
          _status: 'draft',
          displayOrder: -999999,
        },
      })
      created.push({ collection: 'services', id: service.id })
      const model = await payload.create({
        collection: 'design-models',
        data: {
          title: marker,
          slug: `${marker}-model`.toLowerCase(),
          coverImage: media.id,
          galleryImages: [{ image: media.id }],
          _status: 'draft',
          displayOrder: -999999,
        },
      })
      created.push({ collection: 'design-models', id: model.id })
      const showroom = await payload.create({
        collection: 'showrooms',
        data: {
          title: marker,
          slug: `${marker}-showroom`.toLowerCase(),
          shortDescription: 'DEMO temporary photo-placement check',
          coverImage: media.id,
          _status: 'draft',
          displayOrder: -999999,
        },
      })
      created.push({ collection: 'showrooms', id: showroom.id })
      for (const [route, target, label, field, tab] of [
        [
          'services',
          `services:${service.id}`,
          'Hizmet kapağı · animasyon, liste ve detay',
          'coverImage',
          'Hizmet',
        ],
        [
          'models',
          `design-models:${model.id}`,
          'Model detayı · fotoğraf albümü',
          'galleryImages',
          'Model',
        ],
        ['showroom', `showrooms:${showroom.id}`, 'Sosyal paylaşım görseli', 'seoImage', 'SEO'],
      ]) {
        await page.goto(`${origin}/admin?page=${route}`)
        const manager = page.getByRole('region', { name: 'Sayfanın fotoğraf alanları' })
        await manager.getByLabel('Düzenlenecek kayıt', { exact: true }).selectOption(target)
        await manager
          .getByRole('button', { name: `${label} · fotoğraf seç veya yükle`, exact: true })
          .click()
        const form = page.frameLocator('iframe[title="İçerik düzenleme formu"]')
        await expect(form.getByRole('button', { name: tab, exact: true })).toHaveClass(
          /tabs-field__tab-button--active/,
        )
        await expect(form.locator(`#field-${field}`)).toBeInViewport()
        const frame = page.locator('iframe[title="İçerik düzenleme formu"]')
        await expect(frame).toHaveAttribute('src', new RegExp(target.replace(':', '/')))
        if (route === 'models') {
          await form.locator('.rtm-photo-manager > summary').click()
          await expect(form.locator('.rtm-photo-placement-preview img')).toHaveCount(2)
        }
        await page.getByRole('button', { name: 'Düzenleyiciyi kapat', exact: true }).click()
      }
    } finally {
      for (const record of created.reverse()) await payload.delete(record)
      if (mediaId) await payload.delete({ collection: 'media', id: mediaId })
    }
  })

  test('selects a fallback photo without changing the cinematic sequence', async ({
    page,
  }) => {
    const payload = await getPayload({ config })
    const original = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    const marker = `DEMO-hero-${crypto.randomUUID()}`
    const buffer = await sharp({
      create: { width: 1600, height: 900, channels: 3, background: '#337788' },
    })
      .png()
      .toBuffer()
    const media = await payload.create({
      collection: 'media',
      data: { alt: `${marker} geometric test image`, usage: 'image' },
      file: { name: `${marker}.png`, data: buffer, mimetype: 'image/png', size: buffer.length },
    })
    try {
      const map = page.locator('.rtm-visual-studio > .rtm-hero-photos')
      await map
        .locator('.rtm-hero-fallback')
        .click()
      const form = page.frameLocator('iframe[title="İçerik düzenleme formu"]')
      const field = form.locator('#field-heroImages__center')
      await expect(field).toBeInViewport()
      const remove = field.locator('.relationship-content__remove')
      if (await remove.count()) await remove.click()
      await field.locator('.upload__listToggler').click()
      await form.getByText(media.filename || `${marker}.png`, { exact: true }).click()
      await expect(field).toContainText(media.filename || `${marker}.png`)
      await form.getByRole('button', { name: 'Kaydet', exact: true }).click()
      await expect
        .poll(
          async () =>
            (await payload.findGlobal({ slug: 'site-settings', depth: 0 })).heroImages?.center,
        )
        .toBe(media.id)
      await page.getByRole('button', { name: 'Düzenleyiciyi kapat', exact: true }).click()
      await expect(map.locator('.rtm-hero-fallback img')).toHaveAttribute('src', media.url || '')
      await page.goto(origin)
      const center = page.locator('.cinematic-cms-fallback')
      await expect(center).toHaveAttribute(
        'src',
        new RegExp(encodeURIComponent(media.filename || marker)),
      )
      const current = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
      expect(current.heroImages?.topLeft).toBe(original.heroImages?.topLeft)
      expect(current.homepage).toEqual(original.homepage)
    } finally {
      // Restore this field only while it still holds this run's unique photo ID.
      const current = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
      if (current.heroImages?.center === media.id) {
        await payload.updateGlobal({
          slug: 'site-settings',
          data: { heroImages: { center: original.heroImages?.center ?? null } },
        })
      }
      const restored = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
      if (!Object.values(restored.heroImages || {}).includes(media.id))
        await payload.delete({ collection: 'media', id: media.id })
    }
  })

  test('shows cinematic stages and opens only the fallback photo field', async ({ page }, info) => {
    const map = page.locator('.rtm-visual-studio > .rtm-hero-photos')
    for (const label of ['İlk açılış', 'Mekân.', 'Malzeme.', 'Detay.', 'Kapanış']) {
      const button = map.getByRole('button', { name: label, exact: true })
      await button.click()
      await expect(button).toHaveAttribute('aria-pressed', 'true')
      await expect(map.locator('figcaption strong')).toHaveText(label)
      await expect.poll(() => map.locator('.rtm-hero-sequence-preview img').evaluate(
        (image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
      )).toBe(true)
    }
    await map.locator('.rtm-hero-fallback').click()
    const form = page.frameLocator('iframe[title="İçerik düzenleme formu"]')
    await expect(form.getByRole('button', { name: 'Ana sayfa açılışı', exact: true }))
      .toHaveClass(/tabs-field__tab-button--active/)
    await expect(form.locator('#field-heroImages__center')).toBeInViewport()
    await expect(form.locator('#field-heroImages__topLeft')).toBeHidden()
    await page.getByRole('button', { name: 'Düzenleyiciyi kapat', exact: true }).click()
    await page.setViewportSize({ width: 390, height: 844 })
    await expectResponsiveContent(page)
    await map.scrollIntoViewIfNeeded()
    await map.screenshot({ path: info.outputPath('hero-sequence-mobile.png') })
  })

  test('preview hydrates without attribute mismatches and keeps keyboard editing after reloads', async ({
    page,
  }) => {
    const hydrationErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error' && /hydrat|didn't match/i.test(message.text()))
        hydrationErrors.push(message.text())
    })
    page.on('pageerror', (error) => hydrationErrors.push(error.message))
    await page.reload()
    const preview = page.frameLocator('iframe[title="Ana Sayfa gerçek site önizlemesi"]')
    const heading = preview.locator('#hero-heading')
    await expect(heading).toHaveAttribute('tabindex', '0')
    await expect(preview.locator('[aria-hidden="true"] [data-rtm-edit][tabindex="0"]')).toHaveCount(
      0,
    )
    await page.getByRole('button', { name: 'Düzenleme açık', exact: true }).click()
    await expect(heading).not.toHaveAttribute('tabindex')
    await page.getByRole('button', { name: 'Gezinme açık', exact: true }).click()
    await expect(heading).toHaveAttribute('tabindex', '0')
    await page.getByRole('button', { name: 'Önizlemeyi yenile', exact: true }).click()
    await expect(heading).toHaveAttribute('tabindex', '0')
    await heading.focus()
    await heading.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Düzenleyiciyi kapat', exact: true }).click()
    await expect(heading).toHaveAttribute('tabindex', '0')
    expect(hydrationErrors).toEqual([])
  })

  test('all sidebar pages load their real public page and retain browser history', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error' && /hydrat|didn't match/i.test(message.text()))
        errors.push(message.text())
    })
    for (const [id, title, path] of [
      ['projects', 'Projeler', '/projeler'],
      ['models', 'Modeller', '/modeller'],
      ['studio', 'Tasarım Oluştur', '/tasarim-olustur'],
      ['services', 'Hizmetler', '/hizmetler'],
      ['showroom', 'Showroom', '/showroom'],
      ['about', 'Hakkımızda', '/hakkimizda'],
      ['contact', 'İletişim', '/iletisim'],
      ['cookies', 'Çerez Politikası', '/cerez-politikasi'],
      ['home', 'Ana Sayfa', '/'],
    ]) {
      await page
        .locator('[aria-label="Site sayfaları"]')
        .locator(`a[href="/admin?page=${id}"]`)
        .click()
      await expect(page).toHaveURL(`${origin}/admin?page=${id}`)
      const iframe = page.locator(`iframe[title="${title} gerçek site önizlemesi"]`)
      await expect(iframe).toHaveAttribute('src', `${path}?rtmPreview=0`)
      await expect(iframe.contentFrame().locator('body main')).toBeVisible()
      await expect(iframe.contentFrame().locator('html')).toHaveAttribute(
        'data-rtm-edit-mode',
        'true',
      )
      await expectResponsiveContent(page)
    }
    await page.goBack()
    await expect(
      page.locator('iframe[title="Çerez Politikası gerçek site önizlemesi"]'),
    ).toBeVisible()
    expect(errors).toEqual([])
  })

  test('opens native form from real text, protects unsaved edits and ignores forged messages', async ({
    page,
  }) => {
    const preview = page.frameLocator('iframe[title="Ana Sayfa gerçek site önizlemesi"]')
    await preview.locator('#hero-heading').click()
    const form = page.frameLocator('iframe[title="İçerik düzenleme formu"]')
    const field = form.getByLabel('Fotoğrafın üzerindeki ana başlık', { exact: true })
    await expect(field).toBeVisible()
    await field.fill('DEMO kaydedilmeyen önizleme testi')
    // Same-origin messages from any window except the native editor are ignored.
    await page.evaluate(() =>
      window.postMessage(
        { type: 'rtm-native-form', modified: false, processing: false },
        window.location.origin,
      ),
    )
    await Promise.all([
      page.waitForEvent('dialog', { timeout: 5000 }).then((dialog) => dialog.dismiss()),
      page.getByRole('button', { name: 'Düzenleyiciyi kapat', exact: true }).click(),
    ])
    await expect(page.getByRole('dialog')).toBeVisible()
    await Promise.all([
      page.waitForEvent('dialog', { timeout: 5000 }).then((dialog) => dialog.accept()),
      page.getByRole('button', { name: 'Düzenleyiciyi kapat', exact: true }).click(),
    ])
    await expect(page.getByRole('dialog')).toBeHidden()
    await page.getByRole('button', { name: 'Footer ve Instagram', exact: true }).click()
    await expect(form.getByLabel('Şirket açıklaması', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Düzenleyiciyi kapat', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'Footer ve Instagram', exact: true }),
    ).toBeFocused()
  })

  test('browses actual site links and resizes the existing iframe without remounting', async ({
    page,
  }) => {
    const preview = page.locator('iframe[title="Ana Sayfa gerçek site önizlemesi"]')
    await expect(preview.contentFrame().locator('#hero-heading')).toBeVisible()
    await preview.evaluate((frame) => frame.setAttribute('data-identity', 'retained'))
    for (const label of ['Telefon', 'Tablet', 'Masaüstü']) {
      await page.getByRole('button', { name: label, exact: true }).click()
      await expect(preview).toHaveAttribute('data-identity', 'retained')
      await expect(preview.contentFrame().locator('html')).toHaveAttribute(
        'data-rtm-edit-mode',
        'true',
      )
    }
    await page.getByRole('button', { name: 'Düzenleme açık', exact: true }).click()
    await preview.contentFrame().locator('.spotlight-cta').click()
    await expect(preview).toHaveAttribute('src', '/projeler?rtmPreview=0')
    await expect(preview.contentFrame().locator('main h1')).toBeVisible()
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('preview, mobile navigation, editor and both palettes fit 320–1440px', async ({
    page,
  }, info) => {
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      await expectResponsiveContent(page)
      const bounds = await page.locator('.rtm-visual-frame').boundingBox()
      if (!bounds) throw new Error('Preview bounds missing')
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1)
      await page.getByRole('button', { name: 'Sayfa içeriğini aç', exact: true }).click()
      const form = page.locator('iframe[title="İçerik düzenleme formu"]').contentFrame()
      await expect(
        form.getByLabel('Fotoğrafın üzerindeki ana başlık', { exact: true }),
      ).toBeVisible()
      const inner = await page.locator('iframe[title="İçerik düzenleme formu"]').elementHandle()
      const native = await inner?.contentFrame()
      if (!native) throw new Error('Native editor frame missing')
      // Check the embedded editor's own viewport as well as the outer panel.
      expect(
        await native.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true)
      if (width === 390) await page.screenshot({ path: info.outputPath('native-editor-phone.png') })
      await page.getByRole('button', { name: 'Düzenleyiciyi kapat', exact: true }).click()
    }
    await page.getByRole('button', { name: 'Koyu temaya geç', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expectResponsiveContent(page)
    await page.screenshot({ path: info.outputPath('studio-dark.png') })
    await page.getByRole('button', { name: 'Açık temaya geç', exact: true }).click()
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('button', { name: 'Yönetim menüsünü aç', exact: true }).click()
    const menu = page.getByRole('dialog')
    await menu.locator('a[href="/admin?page=about"]').click()
    await expect(menu).toBeHidden()
    await expect(page.locator('iframe[title="Hakkımızda gerçek site önizlemesi"]')).toBeVisible()
    await expectResponsiveContent(page)
  })
})
