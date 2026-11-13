import { expect, test } from '@playwright/test'
import { getPayload } from 'payload'
import sharp from 'sharp'
import config from '../../src/payload.config'
import type { AboutPage, Project } from '../../src/payload-types'
import { expectResponsiveContent, mobileViewports, navigateMobilePage } from '../helpers/responsive'

const origin = 'http://localhost:3000'
test.use({ isMobile: true, hasTouch: true })
const blankAbout: Partial<AboutPage> = {
  eyebrow: null,
  heading: null,
  subtitle: null,
  introduction: null,
  heroImage: null,
  storyHeading: null,
  storyContent: null,
  storyImage: null,
  expertiseHeading: null,
  expertiseDescription: null,
  expertiseItems: [],
  teamHeading: null,
  teamDescription: null,
  teamImage: null,
  teamMembers: [],
  processHeading: null,
  processDescription: null,
  processSteps: [],
  galleryImages: [],
  featuredProjects: [],
  seoTitle: null,
  seoDescription: null,
  seoImage: null,
}
function richText(text: string): NonNullable<Project['description']> {
  return {
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
          children: [
            { type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' },
          ],
        },
      ],
    },
  }
}

test('published content, galleries, about and panorama controls fit touch screens', async ({
  page,
}, info) => {
  test.skip(process.env.RTM_CMS_E2E !== '1', 'Temporary local DEMO records only')
  if (
    process.env.NODE_ENV === 'production' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(
      new URL(process.env.DATABASE_URI || 'postgresql://localhost').hostname,
    )
  )
    throw new Error('Local development database required')
  test.setTimeout(300_000)
  page.setDefaultTimeout(20_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const payload = await getPayload({ config })
  const prefix = `mobile-qa-${crypto.randomUUID()}`
  const title = `DEMO ${prefix}`
  const description = 'DEMO geçici mobil görünüm testi; müşteri içeriği değildir.'
  const ids: {
    media: number[]
    projects: number[]
    models: number[]
    services: number[]
    showrooms: number[]
    scenes: number[]
    cities: number[]
    countries: number[]
    aboutVersions: Array<string | number>
  } = {
    media: [],
    projects: [],
    models: [],
    services: [],
    showrooms: [],
    scenes: [],
    cities: [],
    countries: [],
    aboutVersions: [],
  }
  const original = await payload.findGlobal({ slug: 'about-page', depth: 0, draft: false })
  const originalDraft = await payload.findGlobal({ slug: 'about-page', depth: 0, draft: true })
  const history = await payload.findGlobalVersions({ slug: 'about-page', depth: 0, limit: 1 })
  if (history.totalDocs > 80)
    throw new Error('Use an isolated database to protect About version retention')
  let lastAboutUpdate: string | null | undefined
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    for (const [index, dimensions] of [
      { width: 1280, height: 960 },
      { width: 960, height: 1280 },
      { width: 1024, height: 512 },
    ].entries()) {
      const buffer = await sharp({
        create: { ...dimensions, channels: 3, background: index === 1 ? '#b4a48e' : '#34556b' },
      })
        .jpeg()
        .toBuffer()
      const media = await payload.create({
        collection: 'media',
        data: {
          alt: `${title} geçici geometrik test görseli ${index}`,
          usage: index === 2 ? 'panorama' : 'image',
        },
        file: {
          data: buffer,
          name: `${prefix}-${index}.jpg`,
          mimetype: 'image/jpeg',
          size: buffer.length,
        },
      })
      ids.media.push(media.id)
    }
    const usedCountries = await payload.find({
      collection: 'countries',
      depth: 0,
      limit: 0,
      pagination: false,
      select: { code: true },
    })
    const code = ['QX', 'QY', 'QZ', 'XQ', 'ZX'].find(
      (candidate) => !usedCountries.docs.some((country) => country.code === candidate),
    )
    if (!code) throw new Error('No unused DEMO country code available')
    const country = await payload.create({
      collection: 'countries',
      data: { name: `${title} Ülke`, code, slug: `${prefix}-country` },
    })
    ids.countries.push(country.id)
    const city = await payload.create({
      collection: 'cities',
      data: {
        name: `${title} Şehir`,
        slug: `${prefix}-city`,
        country: country.id,
        latitude: 40,
        longitude: 29,
      },
    })
    ids.cities.push(city.id)
    const project = await payload.create({
      collection: 'projects',
      data: {
        title,
        slug: prefix,
        shortDescription: description,
        description: richText(description),
        coverImage: ids.media[0],
        gallery: [{ image: ids.media[1] }],
        city: city.id,
        featured: true,
        displayOrder: -2147483647,
        _status: 'published',
      },
    })
    ids.projects.push(project.id)
    const service = await payload.create({
      collection: 'services',
      data: {
        title,
        slug: prefix,
        shortDescription: description,
        description: richText(description),
        coverImage: ids.media[0],
        galleryImages: [{ image: ids.media[1] }],
        active: true,
        featured: true,
        displayOrder: -2147483647,
        _status: 'published',
      },
    })
    ids.services.push(service.id)
    const model = await payload.create({
      collection: 'design-models',
      data: {
        title,
        slug: prefix,
        shortDescription: description,
        description: richText(description),
        coverImage: ids.media[0],
        galleryImages: [{ image: ids.media[1] }],
        featured: true,
        displayOrder: -2147483647,
        _status: 'published',
      },
    })
    ids.models.push(model.id)
    const showroom = await payload.create({
      collection: 'showrooms',
      data: {
        title,
        slug: prefix,
        shortDescription: description,
        coverImage: ids.media[0],
        displayOrder: -2147483647,
        _status: 'published',
      },
    })
    ids.showrooms.push(showroom.id)
    for (const index of [0, 1]) {
      const scene = await payload.create({
        collection: 'showroom-scenes',
        data: {
          showroom: showroom.id,
          sceneKey: `scene-${index}`,
          title: `DEMO sahne ${index + 1}`,
          description,
          panoramaImage: ids.media[2],
          thumbnailImage: ids.media[0],
          displayOrder: index,
          _status: 'published',
        },
      })
      ids.scenes.push(scene.id)
    }
    const about = await payload.updateGlobal({
      slug: 'about-page',
      draft: false,
      data: {
        ...blankAbout,
        heading: title,
        subtitle: description,
        heroImage: ids.media[0],
        storyHeading: 'DEMO hikâye',
        storyContent: richText(description),
        storyImage: ids.media[1],
        teamHeading: 'DEMO ekip',
        teamImage: ids.media[0],
        teamMembers: [{ name: 'DEMO kişi', role: 'Geçici test kaydı', image: ids.media[1] }],
        galleryImages: [{ image: ids.media[0] }, { image: ids.media[1] }],
        _status: 'published',
      },
    })
    lastAboutUpdate = about.updatedAt
    const versions = await payload.findGlobalVersions({
      slug: 'about-page',
      depth: 0,
      limit: 20,
      where: { 'version.heading': { equals: title } },
    })
    ids.aboutVersions.push(...versions.docs.map((version) => version.id))
    let homeFont = ''
    for (const viewport of [...mobileViewports, { width: 1440, height: 1000 }]) {
      await page.setViewportSize(viewport)
      for (const route of [
        '/',
        '/projeler',
        '/hizmetler',
        '/modeller',
        '/showroom',
        `/projeler/${prefix}`,
        `/hizmetler/${prefix}`,
        `/modeller/${prefix}`,
        '/hakkimizda',
        `/showroom/${prefix}`,
      ]) {
        await test.step(`${viewport.width}×${viewport.height} ${route}`, async () => {
          expect((await navigateMobilePage(page, origin + route))?.status()).toBe(200)
          await expectResponsiveContent(page)
          if (route === '/')
            homeFont = await page
              .locator('.public-site')
              .last()
              .evaluate((node) => getComputedStyle(node).fontFamily)
          if (route === '/projeler' || route === '/modeller') {
            const selector =
              route === '/projeler' ? '.portfolio-card-description' : '.catalog-card-description'
            const style = await page
              .locator(selector)
              .first()
              .evaluate((node) => ({
                size: parseFloat(getComputedStyle(node).fontSize),
                font: getComputedStyle(node).fontFamily,
              }))
            expect(style.size).toBeGreaterThanOrEqual(15)
            expect(style.font).toBe(homeFont)
            if (viewport.width === 1440)
              await page.screenshot({
                path: info.outputPath(`${route.slice(1)}-desktop.png`),
                fullPage: true,
              })
          }
          if (viewport.width === 390 && route.endsWith(prefix))
            await page.screenshot({
              path: info.outputPath(`${route.split('/')[1]}-phone.png`),
              fullPage: true,
              caret: 'initial',
            })
          if (/^\/(projeler|hizmetler|modeller)\//.test(route)) {
            const trigger = page.locator('.gallery-image-button').first()
            await trigger.tap()
            const dialog = page.getByRole('dialog')
            await expect(dialog).toBeVisible()
            const bounds = await dialog.boundingBox()
            expect(bounds?.width).toBeLessThanOrEqual(viewport.width)
            expect(bounds?.height).toBeLessThanOrEqual(viewport.height)
            const image = await dialog.locator('img').getAttribute('src')
            await dialog.getByRole('button', { name: 'Sonraki görsel', exact: true }).tap()
            await expect(dialog.locator('img')).not.toHaveAttribute('src', image || '')
            await dialog.getByRole('button', { name: 'Galeriyi kapat', exact: true }).tap()
            await expect(dialog).toHaveCount(0)
            await expect(trigger).toBeFocused()
          }
          if (route === `/showroom/${prefix}`) {
            const scenes = page.getByRole('list', { name: 'Showroom sahneleri' })
            await scenes.getByRole('button').last().tap()
            await expect(scenes.getByRole('button').last()).toHaveAttribute('aria-pressed', 'true')
            await expectResponsiveContent(page)
          }
        })
      }
    }
    expect(errors).toEqual([])
  } finally {
    const current = await payload.findGlobal({ slug: 'about-page', depth: 0, draft: true })
    if (lastAboutUpdate && current.updatedAt !== lastAboutUpdate)
      throw new Error(
        'Concurrent About edit detected; preserve fixtures for manual review instead of overwriting user changes',
      )
    if (lastAboutUpdate) {
      const { id: _id, createdAt: _created, updatedAt: _updated, ...backup } = original
      await payload.updateGlobal({
        slug: 'about-page',
        draft: false,
        data: { ...blankAbout, ...backup },
      })
      if (originalDraft._status === 'draft' && originalDraft.updatedAt !== original.updatedAt) {
        const {
          id: _draftId,
          createdAt: _draftCreated,
          updatedAt: _draftUpdated,
          ...draftBackup
        } = originalDraft
        await payload.updateGlobal({
          slug: 'about-page',
          draft: true,
          data: { ...blankAbout, ...draftBackup },
        })
      }
      if (ids.aboutVersions.length)
        await payload.db.deleteVersions({
          globalSlug: 'about-page',
          where: { id: { in: ids.aboutVersions } },
        })
    }
    for (const id of ids.scenes.reverse())
      await payload.delete({ collection: 'showroom-scenes', id })
    for (const id of ids.showrooms) await payload.delete({ collection: 'showrooms', id })
    for (const id of ids.models) await payload.delete({ collection: 'design-models', id })
    for (const id of ids.services) await payload.delete({ collection: 'services', id })
    for (const id of ids.projects) await payload.delete({ collection: 'projects', id })
    for (const id of ids.cities) await payload.delete({ collection: 'cities', id })
    for (const id of ids.countries) await payload.delete({ collection: 'countries', id })
    for (const id of ids.media) await payload.delete({ collection: 'media', id })
  }
})
