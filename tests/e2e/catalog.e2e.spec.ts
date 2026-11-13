import { expect, test } from '@playwright/test'
import { getPayload } from 'payload'
import sharp from 'sharp'
import config from '../../src/payload.config'
import type { AboutPage, Project } from '../../src/payload-types'

const origin = 'http://localhost:3000'
async function loadPageImages(page: import('@playwright/test').Page) {
  for (const image of await page.locator('main img').all()) {
    await image.scrollIntoViewIfNeeded()
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0),
      )
      .toBe(true)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
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
          format: '',
          indent: 0,
          direction: 'ltr',
          textFormat: 0,
          children: [
            { type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' },
          ],
        },
      ],
    },
  }
}
const blankAbout = {
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
} satisfies Partial<AboutPage>

test('corporate routes handle empty content, unknown categories and 404 details', async ({
  page,
}) => {
  for (const [route, heading] of [
    ['/hakkimizda', 'Tasarım'],
    ['/hizmetler', 'Tasarımdan'],
    ['/modeller', 'Modellerimiz'],
  ]) {
    await page.goto(origin + route)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading)
  }
  await page.goto(`${origin}/modeller?kategori=nonexistent-catalog-category-qa`)
  await expect(page.getByText('Bu kategoride henüz bir model yok.')).toBeVisible()
  for (const route of ['/modeller/missing-model-qa', '/hizmetler/missing-service-qa']) {
    const response = await page.goto(origin + route)
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('yayında değil')
  }
})

test('published corporate content, model filters, galleries, relationships and CMS editing', async ({
  page,
  request,
  browser,
}, testInfo) => {
  test.skip(process.env.RTM_CMS_E2E !== '1', 'Opt-in local DEMO fixtures only')
  if (
    process.env.NODE_ENV === 'production' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(
      new URL(process.env.DATABASE_URI || 'postgresql://localhost').hostname,
    )
  )
    throw new Error('Local development DB required')
  test.setTimeout(240000)
  page.setDefaultTimeout(15000)
  const payload = await getPayload({ config, key: 'phase7-catalog-e2e' })
  const prefix = `phase7-qa-${crypto.randomUUID()}`
  const title = `DEMO ${prefix}`
  const original = await payload.findGlobal({ slug: 'about-page', draft: false, depth: 0 })
  const originalDraft = await payload.findGlobal({ slug: 'about-page', draft: true, depth: 0 })
  const history = await payload.findGlobalVersions({ slug: 'about-page', limit: 1, depth: 0 })
  if (history.totalDocs > 80)
    throw new Error('Use an isolated DB for QA when About history is near its retention limit')
  let lastAboutUpdate: string | null | undefined
  const ids: {
    media: number[]
    categories: number[]
    services: number[]
    models: number[]
    projects: number[]
    cities: number[]
    countries: number[]
    users: number[]
  } = {
    media: [],
    categories: [],
    services: [],
    models: [],
    projects: [],
    cities: [],
    countries: [],
    users: [],
  }
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    for (const [index, color] of ['#8e9b87', '#bdab90', '#607b85'].entries()) {
      const data = await sharp({
        create: { width: 1600, height: 1200, channels: 3, background: color },
      })
        .png()
        .toBuffer()
      const media = await payload.create({
        collection: 'media',
        depth: 0,
        data: {
          alt: `DEMO ${index} düz renk test görseli; müşteri tasarımı değildir`,
          usage: 'image',
        },
        file: { data, name: `${prefix}-${index}.png`, mimetype: 'image/png', size: data.length },
      })
      ids.media.push(media.id)
    }
    for (let index = 0; index < 3; index++) {
      const category = await payload.create({
        collection: 'model-categories',
        depth: 0,
        data: {
          name: `DEMO Model Kategorisi ${index}`,
          slug: `${prefix}-category-${index}`,
          active: index !== 2,
          displayOrder: -100 + index,
        },
      })
      ids.categories.push(category.id)
    }
    const country = await payload.create({
      collection: 'countries',
      depth: 0,
      data: { name: 'DEMO Katalog Ülkesi', code: 'QT', slug: `${prefix}-country` },
    })
    ids.countries.push(country.id)
    const city = await payload.create({
      collection: 'cities',
      depth: 0,
      data: {
        name: 'DEMO Katalog Şehri',
        slug: `${prefix}-city`,
        country: country.id,
        latitude: 34,
        longitude: 27,
      },
    })
    ids.cities.push(city.id)
    for (let index = 0; index < 2; index++) {
      const project = await payload.create({
        collection: 'projects',
        depth: 0,
        draft: index === 1,
        data: {
          title: index ? 'DEMO Gizli İlgili Proje' : 'DEMO Gerçek Proje Alanı QA',
          slug: `${prefix}-project-${index}`,
          shortDescription: 'Geçici DEMO proje ilişkisi.',
          city: city.id,
          coverImage: ids.media[0],
          _status: index ? 'draft' : 'published',
        },
      })
      ids.projects.push(project.id)
    }
    for (let index = 0; index < 3; index++) {
      const service = await payload.create({
        collection: 'services',
        depth: 0,
        draft: index === 2,
        data: {
          title:
            index === 0
              ? `${title} Hizmet`
              : index === 1
                ? 'DEMO Pasif Hizmet'
                : 'DEMO Gizli Hizmet',
          slug: `${prefix}-service-${index}`,
          active: index !== 1,
          featured: index === 0,
          displayOrder: -100 + index,
          shortDescription: 'DEMO onaylı test hizmeti açıklaması.',
          description: richText('DEMO hizmet anlatımı <script>window.__phase7Unsafe=true</script>'),
          coverImage: ids.media[0],
          galleryImages: [{ image: ids.media[1] }],
          relatedProjects: ids.projects,
          relatedModelCategories: [ids.categories[0]],
          seoTitle: index === 0 ? 'DEMO Hizmet SEO' : undefined,
          _status: index === 2 ? 'draft' : 'published',
        },
      })
      ids.services.push(service.id)
    }
    for (let index = 0; index < 11; index++) {
      const model = await payload.create({
        collection: 'design-models',
        depth: 0,
        draft: index === 10,
        data: {
          title: index === 10 ? 'DEMO Gizli Model' : `${title} Model ${index}`,
          slug: `${prefix}-model-${index}`,
          displayOrder: -100 + index,
          shortDescription: 'DEMO tasarım referansı; gerçek müşteri modeli değildir.',
          description: richText('DEMO model anlatımı ve örnek detaylar.'),
          coverImage: index === 8 ? undefined : ids.media[0],
          galleryImages:
            index === 0
              ? [{ image: ids.media[0] }, { image: ids.media[1] }, { image: ids.media[2] }]
              : [],
          categories: [
            ids.categories[index === 9 ? 1 : 0],
            ...(index === 0 ? [ids.categories[2]] : []),
          ],
          relatedServices: index === 0 ? [ids.services[0], ids.services[1], ids.services[2]] : [],
          relatedProjects: index === 0 ? ids.projects : [],
          featured: index < 2,
          modelType: index === 0 ? 'render' : undefined,
          seoTitle: index === 0 ? 'DEMO Model SEO' : undefined,
          _status: index === 10 ? 'draft' : 'published',
        },
      })
      ids.models.push(model.id)
    }
    const global = await payload.updateGlobal({
      slug: 'about-page',
      draft: false,
      depth: 0,
      data: {
        ...blankAbout,
        heading: `${title} Stüdyo`,
        subtitle: 'DEMO şirket tanıtımı; gerçek şirket iddiası değildir.',
        heroImage: ids.media[0],
        introduction: richText('DEMO giriş anlatımı.'),
        storyHeading: 'DEMO hikâyemiz',
        storyContent: richText('DEMO şirket hikâyesi.'),
        storyImage: ids.media[1],
        expertiseHeading: 'DEMO uzmanlık',
        expertiseItems: [{ title: 'DEMO yaklaşım', description: 'Geçici test açıklaması.' }],
        teamHeading: 'DEMO ekip',
        teamDescription: 'DEMO ekip tanıtımı; gerçek biyografi değildir.',
        teamMembers: [{ name: 'DEMO Ekip Üyesi', role: 'DEMO görev' }],
        processHeading: 'DEMO süreç',
        processSteps: [
          { title: 'DEMO ihtiyaç değerlendirmesi', description: 'Test için örnek adım.' },
        ],
        galleryImages: [{ image: ids.media[2] }],
        featuredProjects: ids.projects,
        seoTitle: 'DEMO Hakkımızda SEO',
        _status: 'published',
      },
    })
    lastAboutUpdate = global.updatedAt
    // Later drafts must not replace the last publication in either visible text or metadata.
    await payload.update({
      collection: 'services',
      id: ids.services[0],
      depth: 0,
      draft: true,
      data: {
        title: 'DEMO YAYINLANMAMIŞ HİZMET',
        seoTitle: 'PRIVATE SERVICE SEO',
        active: false,
        _status: 'draft',
      },
    })
    await payload.update({
      collection: 'design-models',
      id: ids.models[0],
      depth: 0,
      draft: true,
      data: { title: 'DEMO YAYINLANMAMIŞ MODEL', seoTitle: 'PRIVATE MODEL SEO', _status: 'draft' },
    })
    const draft = await payload.updateGlobal({
      slug: 'about-page',
      draft: true,
      depth: 0,
      data: {
        heading: `${prefix} PRIVATE ABOUT`,
        subtitle: 'PRIVATE ABOUT DESCRIPTION',
        seoTitle: 'PRIVATE ABOUT SEO',
        _status: 'draft',
      },
    })
    lastAboutUpdate = draft.updatedAt

    await page.goto(`${origin}/hakkimizda`)
    await expect(page).toHaveTitle('DEMO Hakkımızda SEO')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${title} Stüdyo`)
    await expect(page.getByRole('heading', { name: 'DEMO hikâyemiz' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'DEMO Ekip Üyesi' })).toBeVisible()
    expect(await page.content()).not.toContain('PRIVATE ABOUT')
    expect(await page.content()).not.toContain('DEMO Gizli İlgili Proje')
    await loadPageImages(page)
    await page.screenshot({ path: testInfo.outputPath('about-light.png'), fullPage: true })
    await page.goto(`${origin}/hizmetler`)
    await expect(page.getByRole('heading', { name: `${title} Hizmet` })).toBeVisible()
    expect(await page.content()).not.toContain('DEMO Pasif Hizmet')
    expect(await page.content()).not.toContain('DEMO Gizli Hizmet')
    await page.goto(`${origin}/hizmetler/${prefix}-service-0`)
    await expect(page).toHaveTitle('DEMO Hizmet SEO')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${title} Hizmet`)
    await expect(page.getByRole('heading', { name: 'İlgili Tasarım Modelleri' })).toBeVisible()
    await expect(page.locator('.project-richtext')).toContainText(
      '<script>window.__phase7Unsafe=true</script>',
    )
    await expect(page.locator('.project-richtext script')).toHaveCount(0)

    await page.goto(`${origin}/modeller?kategori=${prefix}-category-0`)
    await expect(page.locator('.catalog-card')).toHaveCount(8)
    await expect(page.getByLabel('Kategori', { exact: true })).toHaveValue(`${prefix}-category-0`)
    await page.getByRole('link', { name: 'Sonraki' }).click()
    await expect(page).toHaveURL(new RegExp(`kategori=${prefix}-category-0&sayfa=2$`))
    await expect(page.locator('.catalog-card')).toHaveCount(1)
    await page.getByRole('link', { name: 'Önceki' }).click()
    await page.getByLabel('Kategori', { exact: true }).selectOption(`${prefix}-category-1`)
    await page.getByRole('button', { name: 'Filtrele' }).click()
    await expect(page.locator('.catalog-card')).toHaveCount(1)
    await expect(page.locator('.catalog-card h3')).toHaveText(`${title} Model 9`)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
    await page.getByRole('link', { name: 'Filtreleri sıfırla' }).click()
    await expect(page).toHaveURL(`${origin}/modeller`)
    await expect(
      page
        .getByLabel('Kategori', { exact: true })
        .getByRole('option', { name: 'DEMO Model Kategorisi 2' }),
    ).toHaveCount(0)
    await page.goto(`${origin}/modeller?kategori=${prefix}-category-2`)
    await expect(page.locator('.catalog-card')).toHaveCount(0)
    await page.goto(`${origin}/modeller/${prefix}-model-0`)
    await expect(page).toHaveTitle('DEMO Model SEO')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${title} Model 0`)
    await expect(page.locator('.corporate-model-type')).toHaveText('Render')
    await expect(page.locator('.catalog-service-links').getByRole('link')).toHaveCount(1)
    expect(await page.content()).not.toContain('DEMO YAYINLANMAMIŞ MODEL')
    expect(await page.content()).not.toContain('DEMO Gizli İlgili Proje')
    await expect(page.locator('.gallery-image-button')).toHaveCount(3)
    const trigger = page.locator('.gallery-image-button').first()
    await trigger.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('dialog')).toContainText('2 / 3')
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
    await expect(
      page.getByRole('link', { name: 'Bu Model İçin Bilgi Alın' }).first(),
    ).toHaveAttribute('href', '/iletisim')
    await page.goto(`${origin}/modeller/${prefix}-model-8`)
    await expect(page.locator('.corporate-cover-empty')).toBeVisible()
    await expect(page.locator('.corporate-model-type')).toHaveCount(0)
    for (const route of [
      `/modeller/${prefix}-model-10`,
      `/hizmetler/${prefix}-service-1`,
      `/hizmetler/${prefix}-service-2`,
    ])
      expect((await page.goto(origin + route))?.status()).toBe(404)
    for (const collection of ['services', 'design-models', 'model-categories']) {
      const write = await request.post(`${origin}/api/${collection}`, {
        data: { title: 'Should not be created' },
      })
      expect([401, 403]).toContain(write.status())
    }
    const privateModels = await request.get(
      `${origin}/api/design-models?where[id][equals]=${ids.models[10]}`,
    )
    expect((await privateModels.json()).docs).toHaveLength(0)
    for (const [collection, id, privateTitle] of [
      ['design-models', ids.models[0], 'DEMO YAYINLANMAMIŞ MODEL'],
      ['services', ids.services[0], 'DEMO YAYINLANMAMIŞ HİZMET'],
    ]) {
      const latest = await request.get(
        `${origin}/api/${collection}?draft=true&where[id][equals]=${id}`,
      )
      expect(await latest.text()).not.toContain(privateTitle)
    }
    expect([401, 403]).toContain((await request.get(`${origin}/api/inquiries`)).status())
    expect([401, 403, 404]).toContain(
      (await request.get(`${origin}/api/globals/about-page?draft=true`)).status(),
    )
    const modelInProjects = await request.get(
      `${origin}/api/projects?where[slug][equals]=${prefix}-model-0`,
    )
    expect((await modelInProjects.json()).docs).toHaveLength(0)

    await page.goto(origin)
    await expect(
      page.locator('#hizmetler').getByRole('link', { name: `${title} Hizmet`, exact: true }),
    ).toBeVisible()
    await expect(page.locator('#studio')).toContainText(
      'DEMO şirket tanıtımı; gerçek şirket iddiası değildir.',
    )
    await expect(page.getByRole('heading', { name: 'Form. Doku. Karakter.' })).toBeVisible()
    await expect(page.locator('.home-model-preview .catalog-card')).toHaveCount(2)
    await page.locator('#dunya').scrollIntoViewIfNeeded()
    await expect(page.locator('.dotted-world')).toBeVisible()
    for (const [label, href] of [
      ['Modeller', '/modeller'],
      ['Hizmetler', '/hizmetler'],
      ['Hakkımızda', '/hakkimizda'],
    ])
      await expect(
        page
          .getByRole('navigation', { name: 'Ana menü', exact: true })
          .getByRole('link', { name: label, exact: true }),
      ).toHaveAttribute('href', href)

    await page.getByRole('button', { name: 'Koyu tema' }).click()
    const routes = [
      '/hakkimizda',
      '/hizmetler',
      `/hizmetler/${prefix}-service-0`,
      '/modeller',
      `/modeller/${prefix}-model-0`,
    ]
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 })
      for (const route of routes) {
        await page.goto(origin + route)
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
          false,
        )
        await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(16, 20, 17)')
      }
    }
    await loadPageImages(page)
    await page.screenshot({ path: testInfo.outputPath('model-dark-mobile.png'), fullPage: true })
    const menu = page.getByRole('button', { name: 'Menüyü aç' })
    await menu.click()
    await page
      .getByRole('navigation', { name: 'Mobil menü' })
      .getByRole('link', { name: /Hakkımızda/ })
      .click()
    await expect(page).toHaveURL(`${origin}/hakkimizda`)
    await expect(page.getByRole('navigation', { name: 'Mobil menü' })).toBeHidden()

    const password = crypto.randomUUID()
    const user = await payload.create({
      collection: 'users',
      depth: 0,
      data: { email: `${prefix}@example.invalid`, password },
    })
    ids.users.push(user.id)
    const admin = await browser.newPage()
    try {
      expect(
        (
          await admin.request.post(`${origin}/api/users/login`, {
            data: { email: user.email, password },
          })
        ).ok(),
      ).toBe(true)
      await admin.goto(`${origin}/admin/collections/design-models/${ids.models[0]}`)
      await expect(admin.locator('input[name="title"]')).toBeVisible()
      await admin.goto(`${origin}/admin/collections/services/${ids.services[0]}`)
      await expect(admin.locator('input[name="title"]')).toBeVisible()
      await admin.goto(`${origin}/admin/globals/about-page`)
      await expect(admin.getByRole('heading', { name: 'Hakkımızda sayfası' })).toBeVisible()
    } finally {
      await admin.close()
    }
    const unpublished = await payload.updateGlobal({
      slug: 'about-page',
      draft: false,
      depth: 0,
      data: { heading: `${prefix} unpublished about`, _status: 'draft' },
    })
    lastAboutUpdate = unpublished.updatedAt
    await page.goto(`${origin}/hakkimizda`)
    await expect(page.getByRole('heading', { level: 1 })).not.toContainText(prefix)
    await expect(
      page.getByText(
        'Şirketimiz, ekibimiz ve çalışma yaklaşımımız hakkında bilgiler yakında burada yer alacak.',
      ),
    ).toBeVisible()
    expect(errors).toEqual([])
  } finally {
    const current = await payload.findGlobal({ slug: 'about-page', draft: true, depth: 0 })
    if (current.heading?.includes(prefix) && current.updatedAt === lastAboutUpdate) {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...backup } = original
      await payload.updateGlobal({
        slug: 'about-page',
        draft: false,
        depth: 0,
        data: { ...blankAbout, ...backup, _status: original._status || 'draft' },
      })
      if (originalDraft._status === 'draft' && originalDraft.updatedAt !== original.updatedAt) {
        const {
          id: _draftId,
          createdAt: _draftCreatedAt,
          updatedAt: _draftUpdatedAt,
          ...draftBackup
        } = originalDraft
        await payload.updateGlobal({
          slug: 'about-page',
          draft: true,
          depth: 0,
          data: { ...blankAbout, ...draftBackup, _status: 'draft' },
        })
      }
      await payload.db.deleteVersions({
        globalSlug: 'about-page',
        where: { 'version.heading': { contains: prefix } },
      })
    }
    for (const id of ids.models.reverse())
      await payload.delete({ collection: 'design-models', id, depth: 0 })
    for (const id of ids.services.reverse())
      await payload.delete({ collection: 'services', id, depth: 0 })
    for (const id of ids.categories.reverse())
      await payload.delete({ collection: 'model-categories', id, depth: 0 })
    for (const id of ids.projects.reverse())
      await payload.delete({ collection: 'projects', id, depth: 0 })
    for (const id of ids.media.reverse())
      await payload.delete({ collection: 'media', id, depth: 0 })
    for (const id of ids.cities.reverse())
      await payload.delete({ collection: 'cities', id, depth: 0 })
    for (const id of ids.countries.reverse())
      await payload.delete({ collection: 'countries', id, depth: 0 })
    for (const id of ids.users.reverse())
      await payload.delete({ collection: 'users', id, depth: 0 })
    await payload.destroy()
  }
})
