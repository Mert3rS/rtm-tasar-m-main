import { expect, test } from '@playwright/test'
import { getPayload } from 'payload'
import config from '../../src/payload.config'

const origin = 'http://localhost:3000'

test('communication pages and navigation work with existing settings', async ({ page }) => {
  await page.goto(`${origin}/iletisim`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Birliktetasarlayalım.')
  await expect(page.getByRole('banner').getByRole('link', { name: 'İletişim' })).toHaveAttribute(
    'href',
    '/iletisim',
  )
  await page.goto(`${origin}/teklif-al`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projenizikonuşalım.')
})

test('secure inquiries, idempotency, site settings and native admin management', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(process.env.RTM_CMS_E2E !== '1', 'Opt-in local DEMO fixtures only')
  if (
    process.env.NODE_ENV === 'production' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(
      new URL(process.env.DATABASE_URI || 'postgresql://localhost').hostname,
    )
  )
    throw new Error('Local development database required')
  test.setTimeout(180000)
  page.setDefaultTimeout(15000)
  const payload = await getPayload({ config, key: 'phase6-contact-e2e' })
  const prefix = `phase6-qa-${crypto.randomUUID()}`
  const name = `DEMO ${prefix}`
  const email = `${prefix}@example.invalid`
  const original = await payload.findGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    depth: 0,
  })
  let lastSettingsUpdate: string | null | undefined
  let categoryId: number | undefined
  let userId: number | undefined
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    const configured = await payload.updateGlobal({
      slug: 'site-settings',
      overrideAccess: true,
      depth: 0,
      data: {
        companyName: name,
        companyDescription: 'DEMO geçici iletişim ayarları.',
        contactEmail: 'demo-contact@example.invalid',
        phone: '+90 555 000 00 00',
        whatsappNumber: '+90 555 000 00 00',
        address: 'DEMO adres; gerçek müşteri bilgisi değildir.',
        city: 'DEMO şehir',
        country: 'DEMO ülke',
        googleMapsUrl: 'https://example.com/demo-map',
        instagramUrl: 'https://example.com/demo-social',
        notificationRecipientEmail: 'phase6-private-recipient@example.invalid',
        contactFormEnabled: true,
        quoteFormEnabled: true,
        defaultSeoTitle: 'DEMO Site Ayarları SEO',
        defaultSeoDescription: 'DEMO geçici metadata.',
        privacyNoticeContent:
          'DEMO QA metni; yasal aydınlatma metni değildir. Yalnızca yerel otomasyon içindir.',
        privacyNoticeUrl: null,
      },
    })
    lastSettingsUpdate = configured.updatedAt
    await page.goto(`${origin}/iletisim`)
    await expect(page).toHaveTitle(`İletişim | ${name}`)
    await expect(
      page.locator('main').getByRole('link', { name: 'demo-contact@example.invalid' }),
    ).toHaveAttribute('href', 'mailto:demo-contact@example.invalid')
    await expect(
      page.locator('main').getByRole('link', { name: /WhatsApp ile görüşelim/ }),
    ).toHaveAttribute('href', /^https:\/\/wa\.me\/905550000000\?text=/)
    expect(await page.content()).not.toContain('phase6-private-recipient@example.invalid')
    await page
      .getByText('Kişisel verilerin işlenmesine ilişkin aydınlatma metni', { exact: true })
      .click()
    await expect(page.getByText('DEMO QA metni;', { exact: false })).toBeVisible()
    await page.getByRole('button', { name: 'Mesajı Gönder' }).click()
    await expect(page.locator('form').getByRole('alert')).toContainText(
      'İşaretli alanları kontrol edin.',
    )
    await expect(page.locator('#inquiry-fullName')).toHaveAttribute('aria-invalid', 'true')
    await page.getByLabel('Ad soyad', { exact: false }).fill(name)
    await page.getByLabel('E-posta', { exact: false }).fill(email)
    await page.getByLabel('Konu', { exact: false }).fill('DEMO iletişim testi')
    await page
      .getByLabel('Mesajınız', { exact: false })
      .fill('DEMO yerel test mesajı. <img src=x onerror=alert(1)>')
    await page.screenshot({ path: testInfo.outputPath('contact-light.png'), fullPage: true })
    const tokenResponse = await page.request.get(`${origin}/api/inquiry-token`)
    const { token } = await tokenResponse.json()
    const contact = {
      inquiryType: 'contact',
      fullName: name,
      email,
      phone: '',
      subject: 'DEMO tekrar güvenliği',
      message: 'DEMO kayıt ve tekrar gönderim testi.',
      website: '',
      token,
      idempotencyKey: crypto.randomUUID(),
    }
    const post = (data: object, extraHeaders: Record<string, string> = {}) =>
      page.request.post(`${origin}/api/inquiry-submit`, {
        headers: { Origin: origin, ...extraHeaders },
        data,
      })
    for (const invalid of [
      { ...contact, email: 'bad' },
      { ...contact, status: 'completed' },
      { ...contact, website: 'spam' },
      { ...contact, token: 'tampered' },
    ])
      expect([400, 422]).toContain((await post(invalid)).status())
    expect((await post(contact, { Origin: 'https://evil.example' })).status()).toBe(403)
    expect((await post({ ...contact, message: 'x'.repeat(25000) })).status()).toBe(400)
    const results = await Promise.all([post(contact), post(contact)])
    expect(results.map((result) => result.status()).sort()).toEqual([200, 201])
    expect(
      (
        await post({ ...contact, message: 'DEMO aynı anahtarla farklı veri gönderilemez.' })
      ).status(),
    ).toBe(409)
    let records = await payload.find({
      collection: 'inquiries',
      overrideAccess: true,
      depth: 0,
      where: { email: { equals: email } },
    })
    expect(records.docs).toHaveLength(1)
    expect(records.docs[0]).toMatchObject({
      status: 'new',
      priority: 'normal',
      notificationStatus: 'disabled',
      fullName: name,
    })
    const id = records.docs[0].id
    const saved = page.waitForResponse(
      (response) => response.url().endsWith('/api/inquiry-submit') && response.status() === 201,
    )
    await page.getByRole('button', { name: 'Mesajı Gönder' }).click()
    await saved
    await expect(page.getByRole('status')).toContainText('Başvurunuz kaydedildi.')
    await expect(page.getByRole('status')).toBeFocused()
    expect(await page.content()).not.toContain('<img src="x"')
    for (const url of [
      '/api/inquiries',
      `/api/inquiries/${id}`,
      '/api/globals/site-settings',
      '/api/form-rate-limits',
    ])
      expect([401, 403]).toContain((await page.request.get(origin + url)).status())
    for (const method of ['post', 'patch', 'delete'] as const) {
      const url = method === 'post' ? `${origin}/api/inquiries` : `${origin}/api/inquiries/${id}`
      const response = await page.request[method](url, {
        data: { status: 'completed', internalNotes: 'forged' },
      })
      expect([400, 401, 403]).toContain(response.status())
    }

    const category = await payload.create({
      collection: 'project-categories',
      depth: 0,
      data: { name: `DEMO ${prefix} kategori`, slug: `${prefix}-category`, active: true },
    })
    categoryId = category.id
    await page.goto(`${origin}/teklif-al`)
    await expect(
      page
        .getByLabel('Proje kategorisi', { exact: false })
        .getByRole('option', { name: category.name }),
    ).toHaveCount(1)
    await page.getByRole('button', { name: 'Teklif Talebini Gönder' }).click()
    await expect(page.locator('#inquiry-phone')).toHaveAttribute('aria-invalid', 'true')
    await page.getByLabel('Ad soyad', { exact: false }).fill(name)
    await page.getByLabel('E-posta', { exact: false }).fill(`${prefix}-quote@example.invalid`)
    await page.getByLabel('Telefon', { exact: false }).fill('+90 555 000 00 01')
    await page.getByLabel('Proje kategorisi', { exact: false }).selectOption(String(category.id))
    await page.getByLabel('Projenin bulunduğu şehir', { exact: false }).fill('DEMO şehir')
    await page.getByLabel('Yaklaşık alan', { exact: false }).fill('125,5')
    await page
      .getByLabel('Projeniz hakkında', { exact: false })
      .fill('DEMO projenin ihtiyaçlarını anlatan test açıklaması.')
    await page.getByRole('button', { name: 'Koyu tema' }).click()
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(16, 20, 17)')
    for (const width of [1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 844 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      )
    }
    await page.screenshot({ path: testInfo.outputPath('quote-dark-mobile.png'), fullPage: true })
    const quoteSaved = page.waitForResponse(
      (response) => response.url().endsWith('/api/inquiry-submit') && response.status() === 201,
    )
    await page.getByRole('button', { name: 'Teklif Talebini Gönder' }).click()
    await quoteSaved
    await expect(page.getByRole('status')).toContainText('Başvurunuz kaydedildi.')
    records = await payload.find({
      collection: 'inquiries',
      overrideAccess: true,
      depth: 0,
      where: { email: { equals: `${prefix}-quote@example.invalid` } },
    })
    expect(records.docs[0]).toMatchObject({
      inquiryType: 'quote',
      projectCategory: category.id,
      estimatedArea: 125.5,
      projectCity: 'DEMO şehir',
    })
    const invalidCategory = {
      ...contact,
      inquiryType: 'quote',
      email: `${prefix}-invalid@example.invalid`,
      phone: '+90 555 000 00 00',
      projectCity: 'DEMO şehir',
      projectCategory: '999999999',
      idempotencyKey: crypto.randomUUID(),
    }
    expect((await post(invalidCategory)).status()).toBe(422)

    // Anonymous clients cannot bypass the shared database counters with simultaneous requests.
    const limited = await browser.newPage()
    try {
      const tokenReply = await limited.request.get(`${origin}/api/inquiry-token`)
      const { token: limitToken } = await tokenReply.json()
      const responses = await Promise.all(
        Array.from({ length: 6 }, (_, index) =>
          limited.request.post(`${origin}/api/inquiry-submit`, {
            headers: { Origin: origin },
            data: {
              ...contact,
              email: `${prefix}-limit@example.invalid`,
              token: limitToken,
              idempotencyKey: crypto.randomUUID(),
              subject: `DEMO sınır ${index}`,
            },
          }),
        ),
      )
      expect(responses.filter((response) => response.status() === 201)).toHaveLength(3)
      expect(responses.filter((response) => response.status() === 429)).toHaveLength(3)
    } finally {
      await limited.close()
    }

    // Native admin login and update: no separate dashboard, protected fields remain private.
    const password = crypto.randomUUID()
    const user = await payload.create({
      collection: 'users',
      depth: 0,
      data: { email: `${prefix}-admin@example.invalid`, password },
    })
    userId = user.id
    const admin = await browser.newPage()
    try {
      const login = await admin.request.post(`${origin}/api/users/login`, {
        data: { email: user.email, password },
      })
      expect(login.ok()).toBe(true)
      await admin.goto(`${origin}/admin/collections/inquiries/${id}`)
      await expect(admin.locator('textarea[name="internalNotes"]')).toBeVisible()
      const update = await admin.request.patch(`${origin}/api/inquiries/${id}`, {
        data: {
          status: 'reviewing',
          priority: 'high',
          internalNotes: 'DEMO yalnızca yöneticinin göreceği not.',
        },
      })
      expect(update.ok()).toBe(true)
      const managed = await payload.findByID({
        collection: 'inquiries',
        id,
        depth: 0,
        overrideAccess: true,
      })
      expect(managed).toMatchObject({
        status: 'reviewing',
        priority: 'high',
        internalNotes: 'DEMO yalnızca yöneticinin göreceği not.',
      })
      await admin.goto(`${origin}/admin/globals/site-settings`)
      await expect(admin.getByRole('heading', { name: 'Site ayarları' })).toBeVisible()
    } finally {
      await admin.close()
    }

    const disabled = await payload.updateGlobal({
      slug: 'site-settings',
      depth: 0,
      data: { contactFormEnabled: false },
    })
    lastSettingsUpdate = disabled.updatedAt
    await page.goto(`${origin}/iletisim`)
    await expect(page.getByText('Form şu anda gönderime kapalı.')).toBeVisible()
    expect(
      (
        await post({
          ...contact,
          email: `${prefix}-disabled@example.invalid`,
          idempotencyKey: crypto.randomUUID(),
        })
      ).status(),
    ).toBe(503)
    const noPrivacy = await payload.updateGlobal({
      slug: 'site-settings',
      depth: 0,
      data: { contactFormEnabled: true, privacyNoticeContent: null, privacyNoticeUrl: null },
    })
    lastSettingsUpdate = noPrivacy.updatedAt
    await page.goto(`${origin}/iletisim`)
    await expect(page.getByText(/Aydınlatma metnimiz hazırlanıyor/)).toBeVisible()
    await page.goto(origin)
    await expect(page).toHaveTitle('DEMO Site Ayarları SEO')
    await expect(
      page.getByRole('link', { name: 'Projenizi Konuşalım', exact: true }),
    ).toHaveAttribute('href', '/teklif-al')
    expect(errors).toEqual([])
  } finally {
    const own = await payload.find({
      collection: 'inquiries',
      overrideAccess: true,
      depth: 0,
      limit: 100,
      where: { fullName: { equals: name } },
    })
    for (const record of own.docs)
      await payload.delete({
        collection: 'inquiries',
        id: record.id,
        overrideAccess: true,
        depth: 0,
      })
    if (categoryId)
      await payload.delete({ collection: 'project-categories', id: categoryId, depth: 0 })
    if (userId) await payload.delete({ collection: 'users', id: userId, depth: 0 })
    const current = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    if (current.companyName === name && current.updatedAt === lastSettingsUpdate) {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...backup } = original
      await payload.updateGlobal({
        slug: 'site-settings',
        depth: 0,
        data: {
          companyName: null,
          companyDescription: null,
          logo: null,
          contactEmail: null,
          phone: null,
          whatsappNumber: null,
          address: null,
          city: null,
          country: null,
          googleMapsUrl: null,
          instagramUrl: null,
          facebookUrl: null,
          linkedinUrl: null,
          youtubeUrl: null,
          defaultSeoTitle: null,
          defaultSeoDescription: null,
          notificationRecipientEmail: null,
          contactFormEnabled: true,
          quoteFormEnabled: true,
          privacyNoticeContent: null,
          privacyNoticeUrl: null,
          ...backup,
        },
      })
    }
    await payload.destroy()
  }
})
