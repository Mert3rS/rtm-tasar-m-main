import { test, expect, Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'
import { getPayload } from 'payload'
import config from '../../src/payload.config'
import sharp from 'sharp'
import { safeHttpsUrl } from '../../src/lib/contactValidation'

test.setTimeout(120_000)

test.describe('Admin Panel', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(process.env.RTM_CMS_E2E !== '1', 'Opt-in local DEMO fixtures only')
  let page: Page
  const pageErrors: string[] = []

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()
    page.setDefaultTimeout(20_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error' && /hydrat/i.test(message.text()))
        pageErrors.push(message.text())
    })

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await page.context().close()
    await cleanupTestUser()
    expect(pageErrors).toEqual([])
  })

  test('can navigate to dashboard', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    const dashboardArtifact = page.getByRole('heading', {
      name: 'Sitenizin her detayı, elinizin altında.',
    })
    await expect(dashboardArtifact).toBeVisible()
  })

  test('maps site pages to native editors and keeps analytics available', async () => {
    await page.getByText('Fotoğraf yerleri ve içerik rehberi', { exact: true }).click()
    await expect(page.getByRole('heading', { name: 'İlk ekranın fotoğraf haritası' })).toBeVisible()
    const pages = page.getByRole('navigation', { name: 'Yönetilecek site sayfası' })
    await pages.getByRole('button', { name: 'Projeler' }).click()
    await expect(
      page.getByRole('heading', { name: 'Proje kapakları ve anlatımları' }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Tüm kayıtları yönet' })).toHaveAttribute(
      'href',
      '/admin/collections/projects',
    )
    await page.getByRole('searchbox').fill('olmayan-demo-baslik-9381')
    await expect(
      page.getByRole('status').filter({ hasText: 'eşleşen içerik bulunamadı' }),
    ).toBeVisible()
    await page.getByRole('searchbox').clear()
    await pages.getByRole('button', { name: 'İletişim ve footer' }).click()
    await expect(
      page.getByRole('heading', { name: 'Footer, iletişim bilgileri ve Instagram' }),
    ).toBeVisible()
    await page
      .getByRole('navigation', { name: 'Yönetim görünümü' })
      .getByRole('button', { name: 'İstatistikler' })
      .click()
    await expect(page.getByRole('heading', { name: 'Genel Bakış' })).toBeVisible()
    await page
      .getByRole('navigation', { name: 'Yönetim görünümü' })
      .getByRole('button', { name: 'Site içeriği' })
      .click()
  })

  test('shows native home copy fields and remains usable on mobile', async () => {
    await page.goto('http://localhost:3000/admin/globals/site-settings')
    await page.getByRole('button', { name: 'Ana sayfa metinleri', exact: true }).click()
    await expect(page.getByLabel('Fotoğrafın üzerindeki ana başlık', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Atölye tanıtım açıklaması', { exact: true })).toBeVisible()
    await page.goto('http://localhost:3000/admin')
    await mkdir('.tools/admin-content-qa', { recursive: true })
    await page.screenshot({
      path: '.tools/admin-content-qa/desktop.png',
      fullPage: true,
      caret: 'initial',
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByText('Fotoğraf yerleri ve içerik rehberi', { exact: true }).click()
    await expect(page.getByRole('heading', { name: 'İlk ekranın fotoğraf haritası' })).toBeVisible()
    const fits = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    )
    expect(fits).toBe(true)
    await page.screenshot({
      path: '.tools/admin-content-qa/mobile.png',
      fullPage: true,
      caret: 'initial',
    })
    for (const width of [320, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true)
    }
    await page.getByRole('button', { name: 'Koyu temaya geç', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.screenshot({
      path: '.tools/admin-content-qa/dark.png',
      fullPage: true,
      caret: 'initial',
    })
    await page.getByRole('button', { name: 'Açık temaya geç', exact: true }).click()
  })

  test('applies a home copy change and preserves unrelated settings', async () => {
    const payload = await getPayload({ config })
    const original = await payload.findGlobal({
      slug: 'site-settings',
      depth: 0,
      overrideAccess: true,
    })
    const marker = `DEMO içerik kontrolü ${crypto.randomUUID()}`
    try {
      await page.setViewportSize({ width: 1440, height: 1000 })
      await page.goto('http://localhost:3000/admin')
      const preview = page.frameLocator('iframe[title="Ana Sayfa gerçek site önizlemesi"]')
      await preview.locator('#hero-heading').click()
      const editor = page.frameLocator('iframe[title="İçerik düzenleme formu"]')
      await expect(page.getByRole('dialog')).toBeVisible()
      await editor.getByLabel('Fotoğrafın üzerindeki ana başlık', { exact: true }).fill(marker)
      await editor.getByRole('button', { name: 'Kaydet', exact: true }).click()
      await expect
        .poll(
          async () =>
            (await payload.findGlobal({ slug: 'site-settings', depth: 0 })).homepage?.heroHeading,
        )
        .toBe(marker)
      await page.getByRole('button', { name: 'Düzenleyiciyi kapat', exact: true }).click()
      await expect(preview.locator('#hero-heading')).toHaveAttribute('aria-label', marker)
      await page.goto('http://localhost:3000')
      await expect(page.getByRole('heading', { level: 1 })).toHaveAttribute('aria-label', marker)
      const footer = page.getByRole('contentinfo')
      const instagram = safeHttpsUrl(original.instagramUrl)
      if (instagram)
        await expect(footer.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
          'href',
          instagram,
        )
      else await expect(footer.getByRole('link', { name: 'Instagram' })).toHaveCount(0)
      await expect(footer.getByRole('link', { name: 'Hakkımızda', exact: true })).toHaveCount(0)
      const current = await payload.findGlobal({
        slug: 'site-settings',
        depth: 0,
        overrideAccess: true,
      })
      expect(current.homepage?.studioHeading).toBe(original.homepage?.studioHeading)
      expect(current.instagramUrl).toBe(original.instagramUrl)
    } finally {
      const current = await payload.findGlobal({
        slug: 'site-settings',
        depth: 0,
        overrideAccess: true,
      })
      // Restore only our field, only while it still contains this run's unique marker.
      // Concurrent edits to any other setting are never written back from the snapshot.
      if (current.homepage?.heroHeading === marker) {
        await payload.updateGlobal({
          slug: 'site-settings',
          overrideAccess: true,
          data: { homepage: { heroHeading: original.homepage?.heroHeading ?? null } },
        })
      }
    }
  })

  test('links a real cover preview to its project editor and excludes its draft', async () => {
    const payload = await getPayload({ config })
    const suffix = crypto.randomUUID()
    const ids: { media?: number; country?: number; city?: number; project?: number } = {}
    try {
      const buffer = await sharp({
        create: { width: 320, height: 240, channels: 3, background: '#18344a' },
      })
        .jpeg()
        .toBuffer()
      const media = await payload.create({
        collection: 'media',
        data: { alt: `DEMO geçici kapak ${suffix}`, usage: 'image' },
        file: {
          data: buffer,
          mimetype: 'image/jpeg',
          name: `demo-admin-${suffix}.jpg`,
          size: buffer.length,
        },
      })
      ids.media = media.id
      const country = await payload.create({
        collection: 'countries',
        data: { name: `DEMO ${suffix}`, code: 'ZZ', slug: `demo-${suffix}` },
      })
      ids.country = country.id
      const city = await payload.create({
        collection: 'cities',
        data: {
          name: `DEMO ${suffix}`,
          country: country.id,
          slug: `demo-city-${suffix}`,
          latitude: 0,
          longitude: 0,
        },
      })
      ids.city = city.id
      const project = await payload.create({
        collection: 'projects',
        data: {
          title: `DEMO kapak ${suffix}`,
          slug: `demo-project-${suffix}`,
          shortDescription: 'DEMO geçici fotoğraf konumu testi.',
          city: city.id,
          coverImage: media.id,
          displayOrder: -2147483647,
          _status: 'published',
        },
      })
      ids.project = project.id
      await page.goto('http://localhost:3000/admin')
      const preview = page.frameLocator('iframe[title="Ana Sayfa gerçek site önizlemesi"]')
      const cover = preview.locator('.hero-spotlight-item').nth(4)
      await expect(cover).toHaveAttribute('data-rtm-edit', `projects:${project.id}`)
      await cover.click({ position: { x: 80, y: 180 } })
      const form = page.frameLocator('iframe[title="İçerik düzenleme formu"]')
      await expect(form.getByLabel('Proje adı', { exact: false })).toHaveValue(project.title)
      const draftTitle = `${project.title} taslak`
      await form.getByLabel('Proje adı', { exact: false }).fill(draftTitle)
      await form.getByRole('button', { name: 'Taslağı kaydet', exact: true }).click()
      await expect
        .poll(
          async () =>
            (await payload.findByID({ collection: 'projects', id: project.id, draft: true })).title,
        )
        .toBe(draftTitle)
      expect(
        (await payload.findByID({ collection: 'projects', id: project.id, draft: false })).title,
      ).toBe(project.title)
      await form.getByRole('button', { name: /^(Yayınla|Değişiklikleri yayınla)$/ }).click()
      await expect
        .poll(
          async () =>
            (await payload.findByID({ collection: 'projects', id: project.id, draft: false }))
              .title,
        )
        .toBe(draftTitle)
      await page.getByRole('button', { name: 'Düzenleyiciyi kapat', exact: true }).click()
      await page.getByText('Fotoğraf yerleri ve içerik rehberi', { exact: true }).click()
      const map = page.getByRole('region', { name: 'İlk ekranın fotoğraf haritası' })
      const source = map.getByRole('link', { name: new RegExp(`Merkez.*${project.title}`) })
      await expect(source).toHaveAttribute('href', `/admin/collections/projects/${project.id}`)
      await expect(source.locator('img')).toBeVisible()
      await source.click()
      await expect(page.getByLabel('Proje adı', { exact: false })).toHaveValue(draftTitle)
      await payload.update({ collection: 'projects', id: project.id, data: { _status: 'draft' } })
      await page.goto('http://localhost:3000/admin')
      await page.getByText('Fotoğraf yerleri ve içerik rehberi', { exact: true }).click()
      await expect(
        page
          .getByRole('region', { name: 'İlk ekranın fotoğraf haritası' })
          .getByRole('link', { name: new RegExp(project.title) }),
      ).toHaveCount(0)
    } finally {
      if (ids.project) await payload.delete({ collection: 'projects', id: ids.project })
      if (ids.city) await payload.delete({ collection: 'cities', id: ids.city })
      if (ids.country) await payload.delete({ collection: 'countries', id: ids.country })
      if (ids.media) await payload.delete({ collection: 'media', id: ids.media })
    }
  })

  test('can navigate to list view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users')
    await expect(page).toHaveURL('http://localhost:3000/admin/collections/users')
    const listViewArtifact = page.getByRole('heading', { name: 'Kullanıcılar', exact: true })
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users/create')
    await expect(page).toHaveURL(/\/admin\/collections\/users\/create/)
    const editViewArtifact = page.locator('input[name="email"]')
    await expect(editViewArtifact).toBeVisible()
  })
})
