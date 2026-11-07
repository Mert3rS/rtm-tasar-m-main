import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { defaultConfig, encode } from '../../src/lib/configurator/config'

const origin = 'http://localhost:3000'
test.beforeEach(async ({ page }) => {
  // Non-CMS tests never create share records. The real endpoint is exercised by the opt-in test.
  await page.route('**/api/tasarim-baglanti', (route) =>
    route.fulfill({ status: 503, json: { error: 'DEMO offline fallback' } }),
  )
  await page.addInitScript(() => {
    const original = HTMLDialogElement.prototype.showModal
    HTMLDialogElement.prototype.showModal = function () {
      if (this.classList.contains('dc-guide')) return
      return original.call(this)
    }
  })
})
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]) {
  test(`canvas budget ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto(`${origin}/tasarim-olustur`)
    const canvas = page.locator('.dc-scene canvas')
    await expect(canvas).toBeVisible()
    await expect(async () => {
      const box = await canvas.boundingBox()
      expect(box).not.toBeNull()
      if (!box) return
      expect(box.height).toBeGreaterThanOrEqual(
        viewport.width === 1440 ? 680 : viewport.width === 1280 ? 520 : viewport.height * 0.55,
      )
      if (viewport.width === 1440)
        expect(
          (box.width * box.height) / (viewport.width * viewport.height),
        ).toBeGreaterThanOrEqual(0.65)
    }).toPass()
    if (viewport.width === 390) {
      const original = await canvas.elementHandle()
      await page.getByRole('button', { name: 'Diğer sahne araçları', exact: true }).click()
      await expect(page.locator('#studio-scene-extras')).toBeVisible()
      await page.getByRole('button', { name: 'Bilgi kartlarını göster / gizle', exact: true }).click()
      await expect(page.locator('.dc-viewport')).toHaveAttribute('data-chips', 'false')
      expect(await canvas.evaluate((node, previous) => node === previous, original)).toBe(true)
    }
  })
}
test('focus, options and summary preserve Canvas identity; quote and back preserve v2', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${origin}/tasarim-olustur`)
  const canvas = page.locator('.dc-scene canvas')
  await expect(canvas).toBeVisible()
  await expect(async () => {
    expect((await canvas.boundingBox())?.height).toBe(736)
  }).toPass()
  const original = await canvas.elementHandle()
  const before = await canvas.boundingBox()
  await page.getByRole('button', { name: 'Özet: Tasarım özeti', exact: true }).click()
  await expect(page.locator('#design-summary')).toBeVisible()
  expect(await canvas.boundingBox()).toEqual(before)
  await page.getByRole('button', { name: 'Özeti kapat', exact: true }).click()
  await page.keyboard.press('Control+b')
  await expect(page.locator('.dc-workspace')).not.toHaveClass(/dc-panel-hidden/)
  expect(await canvas.evaluate((node, previous) => node === previous, original)).toBe(true)
  await page.keyboard.press('f')
  await expect(page.locator('main')).toHaveAttribute('data-focus', 'true')
  await expect(page.getByRole('button', { name: 'Odak modundan çık · Esc' })).toBeVisible()
  await expect(async () => {
    expect((await canvas.boundingBox())?.height).toBe(900)
  }).toPass()
  await page.keyboard.press('Escape')
  expect(await canvas.evaluate((node, previous) => node === previous, original)).toBe(true)
  const hash = new URL(page.url()).hash
  await page.locator('.dc-quote-action').click()
  await expect(page).toHaveURL(new RegExp('/tasarim-olustur/teklif#c='))
  expect(new URL(page.url()).hash).toBe(hash)
  await expect(page.locator('.dq-design-column h2')).toHaveText('Özel ölçü')
  await expect(page.locator('canvas')).toHaveCount(0)
  await page.getByRole('link', { name: '← Tasarımı düzenle' }).click()
  expect(new URL(page.url()).hash).toBe(hash)
})
test('missing and invalid hash show an empty state without a submit form', async ({ page }) => {
  for (const hash of ['', '#c=invalid']) {
    await page.goto(`${origin}/tasarim-olustur/teklif${hash}`)
    await expect(page.getByRole('heading', { name: 'Henüz bir tasarım bulunamadı' })).toBeVisible()
    await expect(page.locator('form')).toHaveCount(0)
  }
})
test('design drawing dialog restores focus and responsive themes have no horizontal overflow', async ({
  page,
}) => {
  test.setTimeout(120000)
  await page.goto(`${origin}/tasarim-olustur/teklif#c=${encode(defaultConfig('mutfak'))}`)
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value
      }, theme)
      await expect(page.locator('.dq-drawing')).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true)
      await page.screenshot({
        path: `test-results/phase8.3/quote-${width}-${theme}.png`,
        fullPage: true,
      })
    }
  }
  const enlarge = page.getByRole('button', { name: 'Teknik çizimi büyüt' })
  await enlarge.click()
  await expect(page.getByRole('dialog', { name: 'Büyütülmüş teknik çizim' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(enlarge).toBeFocused()
})

test('opt-in local design submission, private attachments, short links and WhatsApp', async ({
  page,
  request,
}) => {
  test.skip(process.env.RTM_CMS_E2E !== '1', 'Opt-in local DEMO fixtures only')
  if (
    process.env.NODE_ENV === 'production' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(
      new URL(process.env.DATABASE_URI || 'postgresql://localhost').hostname,
    )
  )
    throw new Error('Local development database required')
  test.setTimeout(180000)
  const [{ getPayload }, { default: config }, { default: sharp }] = await Promise.all([
    import('payload'),
    import('../../src/payload.config'),
    import('sharp'),
  ])
  const payload = await getPayload({ config, key: 'phase8-3-qa' })
  const marker = `DEMO phase8-3-${crypto.randomUUID()}`
  const c = defaultConfig('mutfak')
  c.r.main.g[0].ka[0] = marker
  const original = await payload.findGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    depth: 0,
  })
  let updatedAt: string | null | undefined
  const inquiryIds: number[] = [],
    attachmentIds: number[] = [],
    shareIds: number[] = []
  const uploadHandles: string[] = []
  page.on('response', async (response) => {
    if (
      response.url().endsWith('/api/teklif/ek') &&
      response.request().method() === 'POST' &&
      response.status() === 201
    ) {
      const body: unknown = await response.json()
      if (body && typeof body === 'object' && 'handle' in body && typeof body.handle === 'string')
        uploadHandles.push(body.handle)
    }
  })
  let userId: number | undefined
  try {
    const updated = await payload.updateGlobal({
      slug: 'site-settings',
      overrideAccess: true,
      data: {
        quoteFormEnabled: true,
        privacyNoticeContent: 'DEMO QA geçici metin; hukuki metin değildir.',
        privacyNoticeUrl: null,
        whatsappNumber: '+90 536 716 96 50',
      },
    })
    updatedAt = updated.updatedAt
    await page.unroute('**/api/tasarim-baglanti')
    // Warm the dev-only route compilation before testing the client's bounded fallback timeout.
    const security = await page.request.get(`${origin}/api/inquiry-token`)
    const securityBody = await security.json()
    const createdShare = await page.request.post(`${origin}/api/tasarim-baglanti`, {
      headers: { Origin: origin },
      data: { token: securityBody.token, design: c },
    })
    expect(createdShare.status()).toBe(200)
    const sharedPath = (await createdShare.json()).path
    const created = await payload.find({
      collection: 'design-shares',
      overrideAccess: true,
      where: { shareKey: { equals: sharedPath.split('/').at(-1) } },
    })
    shareIds.push(...created.docs.map((doc) => doc.id))
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${origin}/tasarim-olustur/teklif#c=${encode(c)}`)
    await expect(page.getByRole('button', { name: 'Çizimimi gönder', exact: true })).toBeEnabled()
    await expect(page.locator('.dq-whatsapp-share').getByRole('link', { name: 'WhatsApp’tan gönder' })).toBeInViewport()
    await expect(async () => {
      const href = await page
        .locator('.dq-design-column')
        .getByRole('link', { name: 'WhatsApp’tan gönder' })
        .getAttribute('href')
      expect(href).toBeTruthy()
      const link = new URL(href || '')
      expect(link.pathname).toBe('/905367169650')
      expect(link.searchParams.get('text')).toContain('/t/')
    }).toPass()
    const whatsappHref = await page
      .locator('.dq-design-column')
      .getByRole('link', { name: 'WhatsApp’tan gönder' })
      .getAttribute('href')
    const message = new URL(whatsappHref || '').searchParams.get('text') || ''
    const short = message.split('\n').at(-1) || ''
    const share = await payload.find({
      collection: 'design-shares',
      overrideAccess: true,
      where: { shareKey: { equals: new URL(short).pathname.split('/').at(-1) } },
    })
    expect(share.docs.map((doc) => doc.id)).toEqual(shareIds)
    const redirected = await request.get(short, { maxRedirects: 0 })
    expect([307, 308]).toContain(redirected.status())
    expect(redirected.headers().location).toContain('/tasarim-olustur#c=')
    expect((await request.get(`${origin}/t/unknownabc12`)).status()).toBe(404)
    await mkdir('test-results/phase8.3', { recursive: true })
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 })
      for (const theme of ['light', 'dark']) {
        const toggle = page.getByRole('button', {
          name: theme === 'dark' ? 'Koyu temaya geç' : 'Açık temaya geç',
          exact: true,
        })
        if (await toggle.count()) await toggle.click()
        await page.evaluate(() => {
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
          window.scrollTo({ top: 0, behavior: 'instant' })
        })
        await page.screenshot({
          path: `test-results/phase8.3/quote-form-${width}-${theme}.png`,
          fullPage: true,
        })
      }
    }
    await page.setViewportSize({ width: 1440, height: 900 })
    const resetTheme = page.getByRole('button', { name: 'Açık temaya geç', exact: true })
    if (await resetTheme.count()) await resetTheme.click()
    await page.getByRole('button', { name: 'Çizimimi gönder', exact: true }).click()
    await expect(page.locator('form [role="alert"]')).toContainText('aydınlatma')
    await page.getByLabel('Aydınlatma metnini okudum.').check()
    await page.getByRole('button', { name: 'Çizimimi gönder', exact: true }).click()
    await expect(page.locator('form [role="alert"]')).toContainText('kontrol')
    await page.getByLabel('Ad soyad', { exact: false }).fill(marker)
    await page.getByLabel('Telefon', { exact: false }).fill('+90 555 000 00 00')
    await page.getByLabel('Projenin konumu', { exact: false }).fill('DEMO il / ilçe')
    await page.getByLabel('Eklemek istedikleriniz', { exact: false }).fill('DEMO pencere notu')
    await page.getByText('Mesaj önizlemesi', { exact: true }).click()
    expect(
      new URL(
        (await page
          .locator('.dq-design-column')
          .getByRole('link', { name: 'WhatsApp’tan gönder' })
          .getAttribute('href')) || '',
      ).searchParams.get('text'),
    ).not.toContain('DEMO pencere notu')
    await page.getByLabel('Bilgilerimi de ekle', { exact: false }).check()
    const personalMessage =
      new URL(
        (await page
          .locator('.dq-design-column')
          .getByRole('link', { name: 'WhatsApp’tan gönder' })
          .getAttribute('href')) || '',
      ).searchParams.get('text') || ''
    expect(personalMessage).toContain('DEMO pencere notu')
    expect(personalMessage).not.toContain(marker)
    expect(personalMessage).not.toContain('+90 555')
    await mkdir('test-results/phase8.3', { recursive: true })
    await writeFile('test-results/phase8.3/whatsapp-message.txt', message, 'utf8')
    const image = await sharp({
      create: { width: 100, height: 100, channels: 3, background: 'gray' },
    })
      .png()
      .toBuffer()
    await page
      .getByLabel('Mekân fotoğrafı veya eskiz', { exact: false })
      .setInputFiles({ name: 'DEMO-eskiz.png', mimeType: 'image/png', buffer: image })
    await expect(page.locator('.dq-attachments progress')).toHaveAttribute('value', '100')
    await page.locator('.dq-attachments').getByRole('button', { name: 'Kaldır' }).click()
    await expect(page.locator('.dq-attachments progress')).toHaveCount(0)
    await page
      .getByLabel('Mekân fotoğrafı veya eskiz', { exact: false })
      .setInputFiles({ name: 'DEMO-eskiz.png', mimeType: 'image/png', buffer: image })
    await expect(page.locator('.dq-attachments progress')).toHaveAttribute('value', '100')
    await page.getByLabel('Yerinde ölçü alınmasını istiyorum').check()
    await page.getByLabel('Aydınlatma metnini okudum.').check()
    const submission = page.waitForRequest(
      (req) => req.url().endsWith('/api/teklif') && req.method() === 'POST',
    )
    await page.getByRole('button', { name: 'Çizimimi gönder', exact: true }).click()
    const sent = await submission
    await expect(page.getByRole('heading', { name: 'Talebiniz alındı' })).toBeVisible()
    const found = await payload.find({
      collection: 'inquiries',
      overrideAccess: true,
      depth: 0,
      where: { fullName: { equals: marker } },
    })
    inquiryIds.push(...found.docs.map((doc) => doc.id))
    expect(found.totalDocs).toBe(1)
    expect(found.docs[0].email).toBeFalsy()
    expect(found.docs[0].requestMeasurement).toBe(true)
    expect(found.docs[0].designShareUrl).toBe(short)
    const attachments = found.docs[0].attachments || []
    const attachment = attachments[0]
    expect(typeof attachment).toBe('number')
    if (typeof attachment === 'number') {
      attachmentIds.push(attachment)
      const file = await payload.findByID({
        collection: 'inquiry-attachments',
        id: attachment,
        overrideAccess: true,
      })
      expect(file.linkedAt).toBeTruthy()
      expect((await request.get(`${origin}${file.url}`)).status()).toBeGreaterThanOrEqual(400)
      const email = `phase8-3-${crypto.randomUUID()}@example.invalid`,
        password = crypto.randomUUID()
      const user = await payload.create({
        collection: 'users',
        data: { email, password },
        overrideAccess: true,
      })
      userId = user.id
      const login = await request.post(`${origin}/api/users/login`, { data: { email, password } })
      expect(login.ok()).toBe(true)
      expect((await request.get(`${origin}${file.url}`)).status()).toBe(200)
    }
    const retry = await page.request.post(`${origin}/api/teklif`, {
      headers: { Origin: origin },
      data: sent.postDataJSON(),
    })
    expect(retry.status()).toBe(200)
    expect(
      (
        await payload.count({
          collection: 'inquiries',
          overrideAccess: true,
          where: { fullName: { equals: marker } },
        })
      ).totalDocs,
    ).toBe(1)
    const closed = await payload.updateGlobal({
      slug: 'site-settings',
      overrideAccess: true,
      data: { privacyNoticeContent: null, privacyNoticeUrl: null },
    })
    updatedAt = closed.updatedAt
    await page.reload()
    await expect(page.getByRole('button', { name: 'Çizimimi gönder', exact: true })).toHaveCount(0)
    await expect(
      page.locator('.dq-design-column').getByRole('link', { name: 'WhatsApp’tan gönder' }),
    ).toBeVisible()
    await page.screenshot({ path: 'test-results/phase8.3/quote-form-closed.png', fullPage: true })
  } finally {
    const submitted = await payload.find({
      collection: 'inquiries',
      overrideAccess: true,
      depth: 0,
      where: { fullName: { equals: marker } },
    })
    inquiryIds.push(...submitted.docs.map((doc) => doc.id))
    if (uploadHandles.length) {
      const uploads = await payload.find({
        collection: 'inquiry-attachments',
        overrideAccess: true,
        depth: 0,
        where: { handle: { in: uploadHandles } },
      })
      attachmentIds.push(...uploads.docs.map((doc) => doc.id))
    }
    for (const id of new Set(inquiryIds))
      await payload.delete({ collection: 'inquiries', id, overrideAccess: true })
    for (const id of new Set(attachmentIds))
      await payload.delete({ collection: 'inquiry-attachments', id, overrideAccess: true })
    for (const id of new Set(shareIds))
      await payload.delete({ collection: 'design-shares', id, overrideAccess: true })
    if (userId) await payload.delete({ collection: 'users', id: userId, overrideAccess: true })
    const latest = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })
    if (latest.updatedAt === updatedAt)
      await payload.updateGlobal({
        slug: 'site-settings',
        overrideAccess: true,
        data: {
          quoteFormEnabled: original.quoteFormEnabled,
          privacyNoticeContent: original.privacyNoticeContent,
          privacyNoticeUrl: original.privacyNoticeUrl,
          whatsappNumber: original.whatsappNumber,
        },
      })
    else
      throw new Error(
        'Concurrent Site Settings edit: original values were not restored automatically.',
      )
  }
})
