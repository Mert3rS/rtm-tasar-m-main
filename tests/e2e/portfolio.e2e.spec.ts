import { expect, test } from '@playwright/test'
import { getPayload } from 'payload'
import sharp from 'sharp'
import config from '../../src/payload.config'

test('empty portfolio and unknown project stay usable', async ({ page }) => {
  await page.goto('http://localhost:3000/projeler')
  await expect(page.getByRole('heading', { level: 1, name: 'Projelerimiz.' })).toBeVisible()
  await expect(page.getByRole('form', { name: 'Proje filtreleri' })).toBeVisible()
  expect(await page.locator('.portfolio-card').count()).toBeLessThanOrEqual(8)
  const response = await page.goto('http://localhost:3000/projeler/nonexistent-project-for-404-qa')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Bu sayfa henüz')
  await expect(page.getByRole('link', { name: 'Projelerimizi keşfedin' })).toHaveAttribute(
    'href',
    '/projeler',
  )
})

test('portfolio filtering, paging, details, SEO, gallery and homepage/globe links use published CMS data', async ({
  page,
  request,
}, testInfo) => {
  test.skip(
    process.env.RTM_CMS_E2E !== '1',
    'Opt-in temporary DEMO records in a local development DB.',
  )
  if (process.env.NODE_ENV === 'production') throw new Error('Development QA only')
  const host = new URL(process.env.DATABASE_URI || 'postgresql://localhost').hostname
  if (!['localhost', '127.0.0.1', '[::1]'].includes(host))
    throw new Error('A loopback DB is required')
  test.setTimeout(180_000)
  page.setDefaultTimeout(15_000)
  page.setDefaultNavigationTimeout(20_000)
  const payload = await getPayload({ config, key: 'phase4-portfolio-e2e' })
  const prefix = `phase4-qa-${crypto.randomUUID()}`
  const ids: {
    projects: number[]
    cities: number[]
    countries: number[]
    media: number[]
    categories: number[]
  } = { projects: [], cities: [], countries: [], media: [], categories: [] }
  const slugs: string[] = []
  const titles = Array.from({ length: 10 }, (_, i) => `DEMO Portföy ${String(i).padStart(2, '0')}`)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    for (const [index, code] of ['QX', 'QY'].entries()) {
      const country = await payload.create({
        collection: 'countries',
        depth: 0,
        data: { name: `DEMO Ülke ${index}`, code, slug: `${prefix}-country-${index}` },
      })
      ids.countries.push(country.id)
      const city = await payload.create({
        collection: 'cities',
        depth: 0,
        data: {
          name: `DEMO Şehir ${index}`,
          slug: `${prefix}-city-${index}`,
          country: country.id,
          latitude: 24 + index * 15,
          longitude: 18 + index * 20,
        },
      })
      ids.cities.push(city.id)
    }
    for (let index = 0; index < 3; index++) {
      const category = await payload.create({
        collection: 'project-categories',
        depth: 0,
        data: {
          name: `DEMO Kategori ${index}`,
          slug: `${prefix}-category-${index}`,
          displayOrder: index,
          active: true,
        },
      })
      ids.categories.push(category.id)
    }
    for (const [index, background] of ['#b2a18a', '#536758', '#8b7468'].entries()) {
      const data = await sharp({
        create: { width: 1280, height: index === 1 ? 1600 : 960, channels: 3, background },
      })
        .png()
        .toBuffer()
      const media = await payload.create({
        collection: 'media',
        depth: 0,
        data: { alt: `DEMO test görseli ${index + 1}, müşteri projesi değildir`, usage: 'image' },
        file: {
          data,
          mimetype: 'image/png',
          name: `${prefix}-image-${index}.png`,
          size: data.length,
        },
      })
      ids.media.push(media.id)
    }
    for (let index = 0; index < 11; index++) {
      const slug = `${prefix}-project-${index}`
      slugs.push(slug)
      const project = await payload.create({
        collection: 'projects',
        depth: 0,
        draft: index === 10,
        data: {
          title: titles[index] || 'DEMO Gizli Taslak',
          slug,
          shortDescription: 'Yalnızca geliştirme testi için geçici DEMO proje açıklaması.',
          city: ids.cities[index === 0 || index === 2 ? 0 : 1],
          coverImage: ids.media[0],
          gallery: index === 0 ? [{ image: ids.media[1] }, { image: ids.media[2] }] : [],
          categories: [
            ids.categories[index < 2 ? 0 : 1],
            ...(index === 0 ? [ids.categories[2]] : []),
          ],
          featured: index === 0,
          displayOrder: index,
          _status: index === 10 ? 'draft' : 'published',
          ...(index === 0
            ? {
                projectType: 'DEMO Konut',
                projectArea: 125,
                completionYear: 2025,
                seoTitle: 'DEMO Özel SEO Başlığı',
                seoDescription: 'DEMO onaylı public SEO açıklaması.',
                seoImage: ids.media[2],
                description: {
                  root: {
                    type: 'root',
                    version: 1,
                    format: '',
                    indent: 0,
                    direction: 'ltr',
                    children: [
                      {
                        type: 'paragraph',
                        version: 1,
                        format: '',
                        indent: 0,
                        direction: 'ltr',
                        textFormat: 0,
                        children: [
                          {
                            type: 'text',
                            version: 1,
                            text: 'DEMO zengin metin <script>window.__phase4Unsafe=true</script>',
                            format: 0,
                            detail: 0,
                            mode: 'normal',
                            style: '',
                          },
                        ],
                      },
                    ],
                  },
                },
              }
            : {}),
        },
      })
      ids.projects.push(project.id)
    }
    // A later saved draft of a published project must not leak its title or SEO.
    await payload.update({
      collection: 'projects',
      depth: 0,
      id: ids.projects[0],
      draft: true,
      data: { title: 'DEMO YAYINLANMAMIŞ YENİ BAŞLIK', seoTitle: 'DEMO GİZLİ SEO' },
    })
    await payload.update({
      collection: 'project-categories',
      depth: 0,
      id: ids.categories[2],
      data: { active: false },
    })

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('http://localhost:3000/projeler')
    await expect(page.locator('.portfolio-card')).toHaveCount(8)
    await expect(page.locator('.portfolio-card h3').first()).toHaveText(titles[0])
    await expect(page.getByText('DEMO Gizli Taslak', { exact: true })).toHaveCount(0)
    await expect(page.getByText('DEMO YAYINLANMAMIŞ YENİ BAŞLIK', { exact: true })).toHaveCount(0)
    await expect(
      page.locator('select[name="kategori"] option', { hasText: 'DEMO Kategori 2' }),
    ).toHaveCount(0)
    await page.getByRole('link', { name: 'Sonraki sayfa' }).click()
    await expect(page).toHaveURL(/sayfa=2/)
    await expect(page.locator('.portfolio-card')).toHaveCount(2)
    await expect(page.locator('.portfolio-card h3').first()).toHaveText(titles[8])
    await page.goBack({ waitUntil: 'commit', timeout: 15_000 })
    await expect(page.locator('.portfolio-card')).toHaveCount(8)

    await page.getByLabel('Kategori', { exact: true }).selectOption(`${prefix}-category-0`)
    await page.getByLabel('Ülke', { exact: true }).selectOption(`${prefix}-country-0`)
    await page.getByLabel('Şehir', { exact: true }).selectOption(`${prefix}-city-0`)
    await page.getByRole('button', { name: 'Filtrele' }).click()
    await expect(page).toHaveURL(/kategori=.*&ulke=.*&sehir=/)
    await expect(page.locator('.portfolio-card')).toHaveCount(1)
    await expect(page.locator('.portfolio-card h3')).toHaveText(titles[0])
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await page.reload()
    await expect(page.getByLabel('Kategori', { exact: true })).toHaveValue(`${prefix}-category-0`)
    await expect(page.locator('.portfolio-card')).toHaveCount(1)
    await page.screenshot({
      path: testInfo.outputPath('portfolio-filtered-light.png'),
      fullPage: true,
    })
    await page.getByRole('button', { name: 'Koyu tema' }).click()
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(16, 20, 17)')
    await page.screenshot({
      path: testInfo.outputPath('portfolio-filtered-dark.png'),
      fullPage: true,
    })
    await page.getByRole('link', { name: 'Tümü / Sıfırla' }).click()
    await expect(page).toHaveURL('http://localhost:3000/projeler')
    await expect(page.locator('.portfolio-card')).toHaveCount(8)
    await page.goto(`http://localhost:3000/projeler?kategori=missing-category-${prefix}`)
    await expect(
      page.getByRole('heading', { name: 'Bu seçimde henüz bir proje yok.' }),
    ).toBeVisible()

    await page.goto(`http://localhost:3000/projeler/${slugs[0]}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(titles[0])
    await expect(page).toHaveTitle('DEMO Özel SEO Başlığı')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'DEMO onaylı public SEO açıklaması.',
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
    await expect(page.getByText('DEMO GİZLİ SEO', { exact: true })).toHaveCount(0)
    await expect(page.locator('.project-richtext')).toContainText(
      '<script>window.__phase4Unsafe=true</script>',
    )
    expect(await page.evaluate(() => Reflect.get(window, '__phase4Unsafe'))).toBeUndefined()
    await expect(page.locator('.project-facts')).toContainText('125 m²')
    await expect(page.locator('.project-facts')).not.toContainText('Müşteri')
    const relatedTitles = await page.locator('.related-project-grid h3').allTextContents()
    expect(relatedTitles[0]).toBe(titles[1])
    expect(relatedTitles[1]).toBe(titles[2])
    expect(relatedTitles).not.toContain(titles[0])
    await expect(page.locator('.gallery-image-button')).toHaveCount(3)
    for (const image of await page.locator('.gallery-image-button img').all()) {
      await image.scrollIntoViewIfNeeded()
      await expect(image).toHaveJSProperty('complete', true)
      expect(
        await image.evaluate(
          (element) => element instanceof HTMLImageElement && element.naturalWidth > 0,
        ),
      ).toBe(true)
    }
    await page.screenshot({
      path: testInfo.outputPath('project-detail-desktop.png'),
      fullPage: true,
    })
    const trigger = page.locator('.gallery-image-button').first()
    await trigger.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByAltText('DEMO test görseli 1, müşteri projesi değildir')).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await expect(dialog.getByAltText('DEMO test görseli 2, müşteri projesi değildir')).toBeVisible()
    await page.getByRole('button', { name: 'Sonraki görsel' }).click()
    await expect(dialog.getByAltText('DEMO test görseli 3, müşteri projesi değildir')).toBeVisible()
    await page.keyboard.press('ArrowLeft')
    await expect(dialog.getByAltText('DEMO test görseli 2, müşteri projesi değildir')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()

    const draftResponse = await page.goto(`http://localhost:3000/projeler/${slugs[10]}`)
    expect(draftResponse?.status()).toBe(404)
    expect(await page.content()).not.toContain('DEMO Gizli Taslak')
    const unpublished = await request.get(
      `http://localhost:3000/api/projects?where[slug][equals]=${slugs[10]}`,
    )
    expect((await unpublished.json()).docs).toHaveLength(0)
    const anonymousWrite = await request.post('http://localhost:3000/api/projects', {
      data: { title: 'Should not be created' },
    })
    expect([401, 403]).toContain(anonymousWrite.status())

    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: width < 640 ? 844 : 900 })
      await page.goto('http://localhost:3000/projeler')
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      )
      await page.goto(`http://localhost:3000/projeler/${slugs[0]}`)
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      )
      if (width === 390 || width === 320) {
        await page.locator('.gallery-image-button').first().click()
        await expect(page.getByRole('dialog')).toBeVisible()
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
          false,
        )
        await page.getByRole('button', { name: 'Galeriyi kapat' }).click()
        await expect(page.locator('.gallery-image-button').first()).toBeFocused()
      }
    }
    await page.screenshot({
      path: testInfo.outputPath('project-detail-mobile.png'),
      fullPage: true,
    })

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('http://localhost:3000')
    const homeCard = page.locator('.featured-section .portfolio-card').first()
    await expect(homeCard.getByRole('heading')).toHaveText(titles[0])
    await homeCard.getByRole('link').click()
    await expect(page).toHaveURL(new RegExp(`/projeler/${slugs[0]}$`))
    await page.goto('http://localhost:3000')
    await page.getByRole('button', { name: /DEMO Şehir 0/ }).click()
    const globePanel = page.getByRole('region', { name: 'DEMO Şehir 0 projeleri' })
    await globePanel.getByRole('link', { name: 'Projeyi incele' }).click()
    await expect(page).toHaveURL(new RegExp(`/projeler/${slugs[0]}$`))
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(errors).toEqual([])
  } catch (error) {
    console.error('Portfolio QA failure before cleanup:', error)
    throw error
  } finally {
    for (const id of ids.projects.reverse())
      await payload.delete({ collection: 'projects', depth: 0, id })
    for (const id of ids.cities.reverse())
      await payload.delete({ collection: 'cities', depth: 0, id })
    for (const id of ids.media.reverse())
      await payload.delete({ collection: 'media', depth: 0, id })
    for (const id of ids.categories.reverse())
      await payload.delete({ collection: 'project-categories', depth: 0, id })
    for (const id of ids.countries.reverse())
      await payload.delete({ collection: 'countries', depth: 0, id })
    await payload.destroy()
  }
})
