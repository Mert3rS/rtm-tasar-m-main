import { expect, test } from '@playwright/test'
import { getPayload } from 'payload'
import sharp from 'sharp'
import config from '../../src/payload.config'

// Opt-in: creates explicitly labeled temporary records in the local development DB.
// Cleanup uses only IDs returned by this test, never a broad delete query.
test('published CMS content drives markers, project switching and featured ordering', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(
    process.env.RTM_CMS_E2E !== '1',
    'Run with RTM_CMS_E2E=1 against the local development database.',
  )
  if (process.env.NODE_ENV === 'production') throw new Error('CMS browser QA is development-only.')
  const databaseHost = new URL(process.env.DATABASE_URI || 'postgresql://localhost').hostname
  if (!['localhost', '127.0.0.1', '[::1]'].includes(databaseHost)) {
    throw new Error('CMS browser QA requires a loopback development database.')
  }
  test.setTimeout(90_000)
  const payload = await getPayload({ config })
  const suffix = crypto.randomUUID()
  const projectIds: number[] = []
  const cityIds: number[] = []
  let countryId: number | undefined
  let mediaId: number | undefined

  try {
    const country = await payload.create({
      collection: 'countries',
      data: { code: 'QA', name: 'DEMO QA Ülkesi', slug: `phase3-qa-${suffix}` },
    })
    countryId = country.id
    const city = await payload.create({
      collection: 'cities',
      data: {
        country: country.id,
        latitude: 24,
        longitude: 18,
        name: 'DEMO QA Merkez',
        slug: `phase3-qa-city-${suffix}`,
      },
    })
    cityIds.push(city.id)
    const draftCity = await payload.create({
      collection: 'cities',
      data: {
        country: country.id,
        latitude: -20,
        longitude: 110,
        name: 'DEMO QA Taslak Şehir',
        slug: `phase3-qa-draft-city-${suffix}`,
      },
    })
    cityIds.push(draftCity.id)
    const image = await sharp({
      create: { width: 640, height: 400, channels: 3, background: '#9b8b72' },
    })
      .png()
      .toBuffer()
    const media = await payload.create({
      collection: 'media',
      data: { alt: 'DEMO QA düz renk test görseli, müşteri projesi değildir', usage: 'image' },
      file: {
        data: image,
        mimetype: 'image/png',
        name: `phase3-qa-${suffix}.png`,
        size: image.length,
      },
    })
    mediaId = media.id
    for (const entry of [
      { title: 'DEMO QA A Projesi', featured: false, cityId: city.id, published: true },
      { title: 'DEMO QA B Öne Çıkan', featured: true, cityId: city.id, published: true },
      { title: 'DEMO QA Gizli Taslak', featured: true, cityId: draftCity.id, published: false },
    ]) {
      const project = await payload.create({
        collection: 'projects',
        draft: !entry.published,
        data: {
          _status: entry.published ? 'published' : 'draft',
          city: entry.cityId,
          coverImage: media.id,
          featured: entry.featured,
          displayOrder: projectIds.length,
          shortDescription: 'Yalnızca otomatik geliştirme testi için geçici DEMO kaydı.',
          slug: `phase3-qa-${projectIds.length}-${suffix}`,
          title: entry.title,
        },
      })
      projectIds.push(project.id)
    }

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('http://localhost:3000')
    await page.locator('#dunya').scrollIntoViewIfNeeded()
    const map = page.locator('.dotted-world')
    await expect(map).toBeVisible()
    await expect(page.getByRole('button', { name: /DEMO QA Merkez/ })).toBeVisible()
    await expect(page.getByText('DEMO QA Gizli Taslak')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /DEMO QA Taslak Şehir/ })).toHaveCount(0)
    const galleryTitles = await page.locator('.portfolio-card h3').allTextContents()
    expect(galleryTitles).toContain('DEMO QA B Öne Çıkan')
    expect(galleryTitles).not.toContain('DEMO QA A Projesi')
    await page.getByRole('button', { name: /DEMO QA Merkez/ }).click()
    const panel = page.getByRole('region', { name: 'DEMO QA Merkez projeleri' })
    await expect(panel).toBeVisible()
    await expect(panel.getByText('2 yayındaki proje')).toBeVisible()
    await expect(panel.getByRole('heading', { name: 'DEMO QA A Projesi' })).toBeVisible()
    await page.getByRole('button', { name: 'Sonraki proje' }).click()
    await expect(panel.getByRole('heading', { name: 'DEMO QA B Öne Çıkan' })).toBeVisible()
    await expect(panel.locator('img')).toBeVisible()
    await page.getByRole('button', { name: 'Koyu tema' }).click()
    await expect(panel).toBeVisible()
    await expect(panel.getByRole('heading', { name: 'DEMO QA B Öne Çıkan' })).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath('selected-city-dark.png'), fullPage: true })
    await page.getByRole('button', { name: 'Kapat ve başlangıç görünümüne dön' }).click()
    await expect(panel).toHaveCount(0)

    await page
      .getByRole('button', { name: /DEMO QA Merkez/ })
      .first()
      .hover()
    await expect(panel).toBeVisible()
    await expect(page.locator('canvas')).toHaveCount(0)

    const mobilePage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
    })
    try {
      await mobilePage.goto('http://localhost:3000')
      await mobilePage.locator('#dunya').scrollIntoViewIfNeeded()
      await mobilePage.getByRole('button', { name: /DEMO QA Merkez/ }).click()
      await expect(
        mobilePage.getByRole('region', { name: 'DEMO QA Merkez projeleri' }),
      ).toBeVisible()
      const cardBox = await mobilePage.locator('.city-project-panel').boundingBox()
      const globeBox = await mobilePage.locator('.dotted-world').boundingBox()
      if (!cardBox || !globeBox) throw new Error('Mobile panel dimensions unavailable')
      expect(cardBox.y).toBeGreaterThan(globeBox.y + globeBox.height)
      expect(
        await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      ).toBe(false)
    } finally {
      await mobilePage.close()
    }
  } finally {
    for (const id of projectIds.reverse()) await payload.delete({ collection: 'projects', id })
    for (const id of cityIds.reverse()) await payload.delete({ collection: 'cities', id })
    if (mediaId !== undefined) await payload.delete({ collection: 'media', id: mediaId })
    if (countryId !== undefined) await payload.delete({ collection: 'countries', id: countryId })
    await payload.destroy()
  }
})
