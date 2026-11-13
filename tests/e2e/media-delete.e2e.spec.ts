import { expect, test } from '@playwright/test'
import { getPayload } from 'payload'
import sharp from 'sharp'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import config from '../../src/payload.config'
import { login } from '../helpers/login'
import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'

const origin = 'http://localhost:3000'

test.describe('Media archive row deletion', () => {
  test.skip(process.env.RTM_CMS_E2E !== '1', 'Opt-in local temporary DEMO fixtures only')
  test.setTimeout(180_000)
  test.beforeAll(seedTestUser)
  test.afterAll(cleanupTestUser)

  test('drawer X confirms/cancels, deletes only its file, retains search and still selects photos', async ({
    page,
  }, info) => {
    const keyWarnings: string[] = []
    page.on('console', (message) => {
      if (/Each child in a list|unique.*key.*prop/.test(message.text()))
        keyWarnings.push(message.text())
    })
    const payload = await getPayload({ config })
    const filenameField = payload.collections.media.config.fields.find(
      (field) => 'name' in field && field.name === 'filename',
    )
    if (
      !filenameField ||
      filenameField.type !== 'text' ||
      typeof filenameField.validate !== 'function'
    )
      throw new Error('Expected native filename validation')
    expect(await Reflect.apply(filenameField.validate, undefined, ['../blocked.png'])).toBe(
      'Invalid filename',
    )
    expect(await Reflect.apply(filenameField.validate, undefined, ['approved.png'])).toBe(true)
    const marker = `DEMO-media-delete-${crypto.randomUUID()}`
    const mediaIds: number[] = []
    let serviceId: number | undefined
    try {
      const buffer = await sharp({
        create: { width: 640, height: 400, channels: 3, background: '#4a6678' },
      })
        .png()
        .toBuffer()
      const files = []
      for (const suffix of ['delete', 'keep']) {
        const media = await payload.create({
          collection: 'media',
          data: { alt: `${marker} ${suffix}`, usage: 'image' },
          file: {
            data: buffer,
            mimetype: 'image/png',
            name: `${marker}-${suffix}.png`,
            size: buffer.length,
          },
        })
        files.push(media)
        mediaIds.push(media.id)
      }
      const [remove, keep] = files
      const service = await payload.create({
        collection: 'services',
        data: {
          title: marker,
          slug: marker.toLowerCase(),
          _status: 'draft',
          displayOrder: -999999,
        },
      })
      serviceId = service.id
      await login({ page, user: testUser })
      await page.locator('.rtm-visual-guide > summary').click()
      await expect(page.locator('.rtm-content-hub')).toBeVisible()
      await page.goto(`${origin}/admin?page=services`)
      const manager = page.getByRole('region', { name: 'Sayfanın fotoğraf alanları' })
      await manager
        .getByLabel('Düzenlenecek kayıt', { exact: true })
        .selectOption(`services:${service.id}`)
      await manager
        .getByRole('button', {
          name: 'Hizmet kapağı · animasyon, liste ve detay · fotoğraf seç veya yükle',
          exact: true,
        })
        .click()
      const form = page.frameLocator('iframe[title="İçerik düzenleme formu"]')
      const field = form.locator('#field-coverImage')
      await field.locator('.upload__listToggler').click()
      const drawer = form.locator('.list-drawer').last()
      const search = drawer.locator('.search-filter__input')
      await search.fill(marker)
      const deleteButton = drawer.getByRole('button', {
        name: `${remove.filename} fotoğrafını kalıcı sil`,
        exact: true,
      })
      await expect(deleteButton).toBeVisible({ timeout: 20_000 })
      await expect(drawer.locator('tbody tr')).toHaveCount(2)
      await expect(drawer.getByRole('columnheader', { name: /Güncellenme tarihi/ })).toHaveCount(0)
      const cell = deleteButton.locator('..')
      for (const width of [1440, 390, 1440]) {
        await page.setViewportSize({ width, height: 950 })
        const filename = cell.locator('.file__filename')
        await expect(filename).toHaveCSS('white-space', 'nowrap')
        const bounds = await filename.boundingBox()
        expect(bounds?.width).toBeGreaterThan(100)
        expect(bounds?.height).toBeLessThan(30)
        const cellBounds = await cell.boundingBox()
        expect(cellBounds?.height).toBeLessThan(80)
      }
      expect(keyWarnings).toEqual([])
      await drawer.screenshot({ path: info.outputPath('media-drawer-delete-actions.png') })
      await deleteButton.press('Enter')
      await expect(
        form.getByRole('heading', { name: 'Fotoğraf kalıcı olarak silinsin mi?' }),
      ).toBeVisible()
      await form.getByRole('button', { name: 'Vazgeç', exact: true }).click()
      await expect(deleteButton).toBeVisible()
      expect(
        (await payload.find({ collection: 'media', where: { id: { equals: remove.id } } }))
          .totalDocs,
      ).toBe(1)
      await deleteButton.click()
      await form.getByRole('button', { name: 'Fotoğrafı kalıcı sil', exact: true }).click()
      await expect(drawer.getByText(remove.filename || '', { exact: true })).toHaveCount(0, {
        timeout: 20_000,
      })
      await expect(drawer.locator('tbody tr')).toHaveCount(1)
      await expect(search).toHaveValue(marker)
      expect(
        (await payload.find({ collection: 'media', where: { id: { equals: remove.id } } }))
          .totalDocs,
      ).toBe(0)
      expect(
        (await payload.find({ collection: 'media', where: { id: { equals: keep.id } } })).totalDocs,
      ).toBe(1)
      const mediaDirectory = payload.collections.media.config.upload.staticDir
      if (!mediaDirectory || !remove.filename)
        throw new Error('Expected a local fixture upload path')
      await expect(stat(path.join(mediaDirectory, remove.filename))).rejects.toMatchObject({
        code: 'ENOENT',
      })
      await drawer.getByText(keep.filename || '', { exact: true }).click()
      await expect(field).toContainText(keep.filename || '')
      await expect(drawer).not.toBeVisible()
      expect(
        (await payload.findByID({ collection: 'services', id: service.id, depth: 0 })).coverImage,
      ).toBeFalsy()
    } finally {
      if (serviceId) await payload.delete({ collection: 'services', id: serviceId })
      for (const id of mediaIds) {
        if ((await payload.find({ collection: 'media', where: { id: { equals: id } } })).totalDocs)
          await payload.delete({ collection: 'media', id })
      }
    }
  })

  test('archive refreshes after deletion and existing panorama protection and anonymous denial stay enforced', async ({
    page,
    request,
  }) => {
    const payload = await getPayload({ config })
    const marker = `DEMO-media-delete-${crypto.randomUUID()}`
    const mediaIds: number[] = []
    let showroomId: number | undefined
    let sceneId: number | undefined
    try {
      const buffer = await sharp({
        create: { width: 1024, height: 512, channels: 3, background: '#4a6678' },
      })
        .jpeg()
        .toBuffer()
      const panorama = await payload.create({
        collection: 'media',
        data: { alt: `${marker} panorama`, usage: 'panorama' },
        file: {
          data: buffer,
          mimetype: 'image/jpeg',
          name: `${marker}-panorama.jpg`,
          size: buffer.length,
        },
      })
      mediaIds.push(panorama.id)
      const spare = await payload.create({
        collection: 'media',
        data: { alt: `${marker} spare`, usage: 'image' },
        file: {
          data: buffer,
          mimetype: 'image/jpeg',
          name: `${marker}-spare.jpg`,
          size: buffer.length,
        },
      })
      mediaIds.push(spare.id)
      const showroom = await payload.create({
        collection: 'showrooms',
        data: {
          title: marker,
          slug: marker.toLowerCase(),
          shortDescription: 'DEMO temporary deletion guard check',
          _status: 'published',
        },
      })
      showroomId = showroom.id
      const scene = await payload.create({
        collection: 'showroom-scenes',
        data: {
          title: marker,
          sceneKey: 'demo',
          showroom: showroom.id,
          panoramaImage: panorama.id,
          _status: 'published',
        },
      })
      sceneId = scene.id
      await login({ page, user: testUser })
      await page.goto(`${origin}/admin/collections/media`)
      const search = page.locator('.search-filter__input')
      await search.fill(marker)
      await page
        .getByRole('button', { name: `${spare.filename} fotoğrafını kalıcı sil`, exact: true })
        .click()
      await page.getByRole('button', { name: 'Fotoğrafı kalıcı sil', exact: true }).click()
      await expect(page.getByText(spare.filename || '', { exact: true })).toHaveCount(0, {
        timeout: 20_000,
      })
      await expect(page.locator('tbody tr')).toHaveCount(1)
      await expect(search).toHaveValue(marker)
      await page
        .getByRole('button', { name: `${panorama.filename} fotoğrafını kalıcı sil`, exact: true })
        .click()
      await page.getByRole('button', { name: 'Fotoğrafı kalıcı sil', exact: true }).click()
      await expect(page.locator('.rtm-media-delete-error')).toContainText('showroom sahnesinde', {
        timeout: 20_000,
      })
      expect(
        (await payload.find({ collection: 'media', where: { id: { equals: panorama.id } } }))
          .totalDocs,
      ).toBe(1)
      const anonymous = await request.delete(`${origin}/api/media/${panorama.id}`)
      expect([401, 403]).toContain(anonymous.status())
    } finally {
      if (sceneId) await payload.delete({ collection: 'showroom-scenes', id: sceneId })
      if (showroomId) await payload.delete({ collection: 'showrooms', id: showroomId })
      for (const id of mediaIds) {
        if ((await payload.find({ collection: 'media', where: { id: { equals: id } } })).totalDocs)
          await payload.delete({ collection: 'media', id })
      }
    }
  })
})
