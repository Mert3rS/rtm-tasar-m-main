import { expect, test } from '@playwright/test'
import { getPayload } from 'payload'
import sharp from 'sharp'
import config from '../../src/payload.config'

test('showroom collection and missing showroom work without content', async ({ page }) => {
  await page.goto('http://localhost:3000/showroom')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Dijital\s*Showroom\./)
  const response = await page.goto('http://localhost:3000/showroom/nonexistent-showroom-qa')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('şu anda yayında değil')
})

test('CMS panorama validation, immersive viewer, public access and project links', async ({
  page,
  browser,
  request,
}, testInfo) => {
  test.skip(process.env.RTM_CMS_E2E !== '1', 'Opt-in local DEMO fixture only.')
  if (
    process.env.NODE_ENV === 'production' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(
      new URL(process.env.DATABASE_URI || 'postgresql://localhost').hostname,
    )
  )
    throw new Error('Local development DB required')
  test.setTimeout(180_000)
  page.setDefaultTimeout(15_000)
  const payload = await getPayload({ config, key: 'phase5-showroom-e2e' })
  const prefix = `phase5-qa-${crypto.randomUUID()}`
  const ids: {
    media: number[]
    showrooms: number[]
    scenes: number[]
    projects: number[]
    cities: number[]
    countries: number[]
  } = { media: [], showrooms: [], scenes: [], projects: [], cities: [], countries: [] }
  const panoramas: { id: number; filename: string }[] = []
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    // A test pattern, not an interior or a client panorama. Never retained as content.
    const pattern = Buffer.from(
      `<svg width="2048" height="1024" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="g" width="256" height="256" patternUnits="userSpaceOnUse"><rect width="256" height="256" fill="#b0a28b"/><rect x="4" y="4" width="122" height="248" fill="#456158"/><path d="M0 128h256M128 0v256" stroke="#eee8d8" stroke-width="8"/></pattern></defs><rect width="2048" height="1024" fill="url(#g)"/><circle cx="1024" cy="512" r="180" fill="#92765d"/><text x="800" y="530" fill="white" font-size="45">DEMO 360 TEST</text></svg>`,
    )
    const jpeg = await sharp(pattern).jpeg({ quality: 85 }).toBuffer()
    const webp = await sharp(pattern).tint('#557a85').webp({ quality: 80 }).toBuffer()
    for (const [index, data] of [jpeg, webp].entries()) {
      const media = await payload.create({
        collection: 'media',
        depth: 0,
        data: {
          alt: `DEMO geometrik panorama test deseni ${index + 1}; müşteri mekânı değildir`,
          usage: 'panorama',
        },
        file: {
          data,
          name: `${prefix}-pano-${index}.${index ? 'webp' : 'jpg'}`,
          mimetype: index ? 'image/webp' : 'image/jpeg',
          size: data.length,
        },
      })
      ids.media.push(media.id)
      panoramas.push({ id: media.id, filename: media.filename || '' })
    }
    const original = await request.get(
      `http://localhost:3000/api/media/file/${panoramas[0].filename}`,
    )
    expect(original.ok()).toBe(true)
    expect((await original.body()).equals(jpeg)).toBe(true)
    const ordinary = await sharp({
      create: { width: 1280, height: 960, channels: 3, background: '#9b8b72' },
    })
      .jpeg()
      .toBuffer()
    await expect(
      payload.create({
        collection: 'media',
        depth: 0,
        data: { alt: 'DEMO invalid panorama', usage: 'panorama' },
        file: {
          data: ordinary,
          name: `${prefix}-invalid.jpg`,
          mimetype: 'image/jpeg',
          size: ordinary.length,
        },
      }),
    ).rejects.toMatchObject({
      data: {
        errors: expect.arrayContaining([
          expect.objectContaining({ message: expect.stringMatching(/2:1/) }),
        ]),
      },
    })
    await expect(
      payload.create({
        collection: 'media',
        depth: 0,
        data: { alt: 'DEMO incorrect mime', usage: 'panorama' },
        file: {
          data: jpeg,
          name: `${prefix}-wrong.webp`,
          mimetype: 'image/webp',
          size: jpeg.length,
        },
      }),
    ).rejects.toThrow()

    const country = await payload.create({
      collection: 'countries',
      depth: 0,
      data: { name: 'DEMO Showroom Ülkesi', code: 'QS', slug: `${prefix}-country` },
    })
    ids.countries.push(country.id)
    const city = await payload.create({
      collection: 'cities',
      depth: 0,
      data: {
        name: 'DEMO Showroom Şehri',
        slug: `${prefix}-city`,
        country: country.id,
        latitude: 24,
        longitude: 18,
      },
    })
    ids.cities.push(city.id)
    const project = await payload.create({
      collection: 'projects',
      depth: 0,
      data: {
        title: 'DEMO Showroom Portföy Projesi',
        slug: `${prefix}-project`,
        shortDescription: 'Yalnızca QA için DEMO kayıt.',
        city: city.id,
        coverImage: panoramas[0].id,
        _status: 'published',
      },
    })
    ids.projects.push(project.id)
    for (let index = 0; index < 3; index++) {
      const showroom = await payload.create({
        collection: 'showrooms',
        depth: 0,
        draft: index === 1,
        data: {
          title: ['DEMO Gezilebilir Showroom', 'DEMO Gizli Showroom', 'DEMO Hazırlanan Showroom'][
            index
          ],
          slug: `${prefix}-showroom-${index}`,
          shortDescription: 'Geçici DEMO showroom; gerçek müşteri içeriği değildir.',
          coverImage: panoramas[0].id,
          relatedProject: project.id,
          featured: index === 0,
          displayOrder: index,
          _status: index === 1 ? 'draft' : 'published',
          seoTitle: index === 0 ? 'DEMO Showroom SEO' : undefined,
        },
      })
      ids.showrooms.push(showroom.id)
    }
    for (let index = 0; index < 4; index++) {
      const scene = await payload.create({
        collection: 'showroom-scenes',
        depth: 0,
        draft: index === 2,
        data: {
          title: [
            'DEMO Giriş',
            'DEMO İkinci Sahne',
            'DEMO Gizli Sahne',
            'DEMO Gizli Parent Sahnesi',
          ][index],
          sceneKey: ['giris', 'ikinci', 'gizli', 'parent-gizli'][index],
          showroom: ids.showrooms[index === 3 ? 1 : 0],
          panoramaImage: panoramas[index % 2].id,
          description: 'Geometrik geliştirme test sahnesi.',
          displayOrder: index,
          initialYaw: 0,
          initialPitch: 0,
          initialHfov: 90,
          _status: index === 2 ? 'draft' : 'published',
        },
      })
      ids.scenes.push(scene.id)
    }
    await expect(
      payload.create({
        collection: 'showroom-scenes',
        depth: 0,
        data: {
          title: 'DEMO duplicate',
          showroom: ids.showrooms[0],
          sceneKey: 'giris',
          panoramaImage: panoramas[0].id,
          _status: 'draft',
        },
      }),
    ).rejects.toMatchObject({
      data: {
        errors: expect.arrayContaining([
          expect.objectContaining({ message: expect.stringMatching(/anahtarı/) }),
        ]),
      },
    })
    await expect(
      payload.update({
        collection: 'showroom-scenes',
        id: ids.scenes[0],
        depth: 0,
        data: {
          hotspots: [
            {
              type: 'scene',
              label: 'DEMO invalid cross-showroom',
              yaw: 0,
              pitch: 0,
              targetScene: ids.scenes[3],
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      data: {
        errors: expect.arrayContaining([
          expect.objectContaining({ message: expect.stringMatching(/aynı showroom/) }),
        ]),
      },
    })
    await expect(
      payload.update({
        collection: 'showroom-scenes',
        id: ids.scenes[0],
        depth: 0,
        data: { initialYaw: 181 },
      }),
    ).rejects.toThrow()
    await payload.update({
      collection: 'showroom-scenes',
      id: ids.scenes[0],
      depth: 0,
      data: {
        hotspots: [
          {
            type: 'scene',
            label: 'DEMO İkinci Sahneye Geç',
            yaw: 0,
            pitch: 0,
            targetScene: ids.scenes[1],
          },
          {
            type: 'info',
            label: 'DEMO Malzeme Bilgisi',
            yaw: 25,
            pitch: 0,
            informationText: 'DEMO bilgi <img src=x onerror=alert(1)>; yalnızca düz metin.',
          },
          {
            type: 'scene',
            label: 'DEMO Gizli Geçiş',
            yaw: -25,
            pitch: 0,
            targetScene: ids.scenes[2],
          },
        ],
      },
    })
    await payload.update({
      collection: 'showroom-scenes',
      id: ids.scenes[1],
      depth: 0,
      data: {
        hotspots: [
          { type: 'scene', label: 'DEMO Girişe Dön', yaw: 0, pitch: 0, targetScene: ids.scenes[0] },
        ],
      },
    })
    await expect(
      payload.delete({ collection: 'showroom-scenes', id: ids.scenes[1], depth: 0 }),
    ).rejects.toMatchObject({
      data: {
        errors: expect.arrayContaining([
          expect.objectContaining({ message: expect.stringMatching(/yönlendiriyor/) }),
        ]),
      },
    })
    await expect(
      payload.delete({ collection: 'media', id: panoramas[0].id, depth: 0 }),
    ).rejects.toMatchObject({
      data: {
        errors: expect.arrayContaining([
          expect.objectContaining({ message: expect.stringMatching(/sahnesinde/) }),
        ]),
      },
    })
    await payload.update({
      collection: 'showrooms',
      id: ids.showrooms[0],
      depth: 0,
      draft: true,
      data: { title: 'DEMO YAYINLANMAMIŞ SHOWROOM BAŞLIĞI', seoTitle: 'DEMO GİZLİ SHOWROOM SEO' },
    })
    await payload.update({
      collection: 'showroom-scenes',
      id: ids.scenes[1],
      depth: 0,
      draft: true,
      data: { title: 'DEMO YAYINLANMAMIŞ SAHNE BAŞLIĞI' },
    })

    const originalLoads = new Set<string>()
    page.on('request', (req) => {
      for (const pano of panoramas)
        if (new URL(req.url()).pathname === `/api/media/file/${pano.filename}`)
          originalLoads.add(pano.filename)
    })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('http://localhost:3000/showroom')
    await expect(page.getByRole('heading', { name: 'DEMO Gezilebilir Showroom' })).toBeVisible()
    await expect(page.getByText('DEMO Gizli Showroom', { exact: true })).toHaveCount(0)
    await page.goto(`http://localhost:3000/showroom/${prefix}-showroom-0`)
    await expect(page).toHaveTitle('DEMO Showroom SEO')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('DEMO Gezilebilir Showroom')
    await expect(page.getByRole('link', { name: 'Bu Tasarım İçin Bilgi Alın' })).toHaveAttribute(
      'href',
      '/teklif-al',
    )
    await expect(page.getByRole('button', { name: 'Yakınlaştır', exact: true })).toBeEnabled({
      timeout: 30_000,
    })
    await expect(page.locator('.panorama-canvas canvas')).toBeVisible()
    await expect(
      page.getByRole('list', { name: 'Showroom sahneleri' }).getByRole('button'),
    ).toHaveCount(2)
    expect(await page.content()).not.toContain('DEMO Gizli Geçiş')
    expect(await page.content()).not.toContain('DEMO YAYINLANMAMIŞ SAHNE BAŞLIĞI')
    expect(originalLoads.has(panoramas[0].filename)).toBe(true)
    expect(originalLoads.has(panoramas[1].filename)).toBe(false)
    const initialCanvas = await page.locator('.panorama-canvas canvas').elementHandle()
    await page.getByRole('button', { name: 'Koyu tema' }).click()
    expect(
      await page
        .locator('.panorama-canvas canvas')
        .evaluate((node, original) => node === original, initialCanvas),
    ).toBe(true)
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(16, 20, 17)')
    await page.screenshot({ path: testInfo.outputPath('showroom-dark.png'), fullPage: true })
    const info = page
      .locator('.tour-hotspot')
      .filter({ has: page.locator('span', { hasText: 'DEMO Malzeme Bilgisi' }) })
    await info.click()
    await expect(page.getByRole('complementary', { name: 'Sahne bilgisi' })).toContainText(
      '<img src=x onerror=alert(1)>',
    )
    await expect(
      page.getByRole('complementary', { name: 'Sahne bilgisi' }).locator('img'),
    ).toHaveCount(0)
    await page.getByRole('button', { name: 'Bilgiyi kapat' }).click()
    await expect(info).toBeFocused()
    await page
      .locator('.tour-hotspot')
      .filter({ has: page.locator('span', { hasText: 'DEMO İkinci Sahneye Geç' }) })
      .click()
    await expect(page.locator('.tour-active-info h2')).toHaveText('DEMO İkinci Sahne')
    await expect(page.getByRole('button', { name: 'Yakınlaştır', exact: true })).toBeEnabled()
    expect(originalLoads.has(panoramas[1].filename)).toBe(true)
    await page.getByRole('button', { name: 'İlk sahneye dön' }).click()
    await expect(page.locator('.tour-active-info h2')).toHaveText('DEMO Giriş')
    await expect(page.getByRole('button', { name: 'Yakınlaştır', exact: true })).toBeEnabled()
    const selector = page.getByRole('combobox', { name: 'Aktif sahne' })
    for (let index = 0; index < 8; index++) {
      await selector.selectOption(String(ids.scenes[index % 2]))
      await expect(page.locator('.tour-active-info h2')).toHaveText(
        index % 2 ? 'DEMO İkinci Sahne' : 'DEMO Giriş',
      )
      await expect(page.getByRole('button', { name: 'Yakınlaştır', exact: true })).toBeEnabled()
    }
    await expect(page.locator('.panorama-canvas canvas')).toHaveCount(1)
    const canvas = page.locator('.panorama-canvas canvas')
    const beforeZoom = await canvas.screenshot()
    await page.getByRole('button', { name: 'Yakınlaştır', exact: true }).click()
    await page.waitForTimeout(350)
    expect((await canvas.screenshot()).equals(beforeZoom)).toBe(false)
    const bounds = await canvas.boundingBox()
    if (!bounds) throw new Error('Canvas size unavailable')
    const beforeDrag = await canvas.screenshot()
    await page.mouse.move(bounds.x + bounds.width * 0.45, bounds.y + bounds.height * 0.55)
    await page.mouse.down()
    await page.mouse.move(bounds.x + bounds.width * 0.7, bounds.y + bounds.height * 0.62, {
      steps: 12,
    })
    await page.mouse.up()
    expect((await canvas.screenshot()).equals(beforeDrag)).toBe(false)
    if (await page.getByRole('button', { name: 'Tam ekran', exact: true }).count()) {
      await page.getByRole('button', { name: 'Tam ekran', exact: true }).click()
      await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true)
      await page.getByRole('button', { name: 'Tam ekrandan çık' }).click()
      await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false)
    }
    for (const width of [1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 844 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      )
    }
    await page.screenshot({ path: testInfo.outputPath('showroom-mobile.png'), fullPage: true })
    const recovery = await browser.newPage()
    try {
      let failNext = true
      await recovery.route(`**/api/media/file/${panoramas[0].filename}`, async (route) => {
        if (failNext) {
          failNext = false
          await route.abort('failed')
        } else await route.continue()
      })
      await recovery.goto(`http://localhost:3000/showroom/${prefix}-showroom-0`)
      await expect(recovery.getByRole('heading', { name: '360° görünüm açılamadı.' })).toBeVisible()
      await recovery.getByRole('button', { name: 'Yeniden dene' }).click()
      await expect(recovery.getByRole('button', { name: 'Yakınlaştır', exact: true })).toBeEnabled()
      await expect(recovery.locator('.panorama-canvas canvas')).toHaveCount(1)
    } finally {
      await recovery.close()
    }
    const touch = await browser.newPage({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      reducedMotion: 'reduce',
    })
    try {
      await touch.goto(`http://localhost:3000/showroom/${prefix}-showroom-0`)
      await expect(touch.getByRole('button', { name: 'Yakınlaştır', exact: true })).toBeEnabled()
      const touchCanvas = touch.locator('.panorama-canvas canvas')
      await touchCanvas.scrollIntoViewIfNeeded()
      const touchBounds = await touchCanvas.boundingBox()
      if (!touchBounds) throw new Error('Touch canvas size unavailable')
      const beforeTouch = await touchCanvas.screenshot()
      const cdp = await touch.context().newCDPSession(touch)
      const x = touchBounds.x + touchBounds.width * 0.3
      const y = touchBounds.y + touchBounds.height * 0.4
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y }],
      })
      for (let step = 1; step <= 12; step++)
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: x + step * 10, y: y + step * 2 }],
        })
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      expect((await touchCanvas.screenshot()).equals(beforeTouch)).toBe(false)
      await cdp.detach()
    } finally {
      await touch.close()
    }
    const fallback = await browser.newPage({ viewport: { width: 390, height: 844 } })
    try {
      await fallback.addInitScript(() =>
        Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { value: () => null }),
      )
      await fallback.goto(`http://localhost:3000/showroom/${prefix}-showroom-0`)
      await expect(fallback.getByRole('heading', { name: '360° görünüm açılamadı.' })).toBeVisible({
        timeout: 30_000,
      })
      await expect(
        fallback.getByRole('list', { name: 'Showroom sahneleri' }).getByRole('button'),
      ).toHaveCount(2)
    } finally {
      await fallback.close()
    }
    await page.goto(`http://localhost:3000/showroom/${prefix}-showroom-2`)
    await expect(page.getByText('Bu showroom’un 360° turu yakında.')).toBeVisible()
    await expect(page.locator('.panorama-canvas')).toHaveCount(0)
    const draftResponse = await page.goto(`http://localhost:3000/showroom/${prefix}-showroom-1`)
    expect(draftResponse?.status()).toBe(404)
    const parentSceneAccess = await request.get(
      `http://localhost:3000/api/showroom-scenes?where[id][equals]=${ids.scenes[3]}`,
    )
    expect((await parentSceneAccess.json()).docs).toHaveLength(0)
    const draftSceneAccess = await request.get(
      `http://localhost:3000/api/showroom-scenes?where[id][equals]=${ids.scenes[2]}`,
    )
    expect((await draftSceneAccess.json()).docs).toHaveLength(0)
    const write = await request.post('http://localhost:3000/api/showrooms', {
      data: { title: 'Should not be created' },
    })
    expect([401, 403]).toContain(write.status())
    await page.goto(`http://localhost:3000/projeler/${prefix}-project`)
    await expect(
      page.getByRole('link', { name: 'Benzer Bir Proje İçin Teklif Alın' }),
    ).toHaveAttribute('href', '/teklif-al')
    await page.getByRole('link', { name: 'Projeyi 360° Keşfedin' }).click()
    await expect(page).toHaveURL(new RegExp(`/showroom/${prefix}-showroom-0$`))
    await page.getByRole('link', { name: 'Portföy projesini inceleyin' }).click()
    await expect(page).toHaveURL(new RegExp(`/projeler/${prefix}-project$`))
    await page.goto('http://localhost:3000')
    await expect(page.getByRole('link', { name: "Dijital Showroom'a Git" })).toHaveAttribute(
      'href',
      '/showroom',
    )
    expect(errors).toEqual([])
  } catch (error) {
    console.error('Showroom QA failure:', error)
    throw error
  } finally {
    // Remove outgoing links first so reference-protection hooks stay enabled throughout cleanup.
    for (const id of ids.scenes)
      await payload.update({
        collection: 'showroom-scenes',
        id,
        depth: 0,
        data: { hotspots: [], _status: 'published' },
      })
    for (const id of ids.scenes.reverse())
      await payload.delete({ collection: 'showroom-scenes', id, depth: 0 })
    for (const id of ids.showrooms.reverse())
      await payload.delete({ collection: 'showrooms', id, depth: 0 })
    for (const id of ids.projects.reverse())
      await payload.delete({ collection: 'projects', id, depth: 0 })
    for (const id of ids.media.reverse())
      await payload.delete({ collection: 'media', id, depth: 0 })
    for (const id of ids.cities.reverse())
      await payload.delete({ collection: 'cities', id, depth: 0 })
    for (const id of ids.countries.reverse())
      await payload.delete({ collection: 'countries', id, depth: 0 })
    await payload.destroy()
  }
})
