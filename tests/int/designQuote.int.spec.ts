import { describe, expect, it, vi } from 'vitest'
import sharp from 'sharp'
import { defaultConfig, products, productNames } from '@/lib/configurator/config'
import { designMessage } from '@/lib/configurator/summary'
import { designShareKey, resolveDesignShare } from '@/lib/designShares'
import { attachmentLimit, sanitizeAttachment } from '@/lib/inquiryAttachment'
import { validateInquiry, whatsappUrl } from '@/lib/contactValidation'
import { prepareInquiryToken } from '@/lib/inquiryClient'

describe('design quote boundaries', () => {
  it('coalesces simultaneous token bootstrap requests without persisting a token', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ token: 'DEMO token' })))
    vi.stubGlobal('fetch', fetcher)
    try {
      const first = prepareInquiryToken(),
        second = prepareInquiryToken()
      expect(first).toBe(second)
      expect(await first).toBe('DEMO token')
      expect(fetcher).toHaveBeenCalledTimes(1)
      fetcher.mockResolvedValue(new Response(JSON.stringify({ token: 'new token' })))
      expect(await prepareInquiryToken()).toBe('new token')
      expect(fetcher).toHaveBeenCalledTimes(2)
    } finally {
      vi.unstubAllGlobals()
    }
  })
  const input = {
    inquiryType: 'quote',
    designQuote: true,
    designConfig: defaultConfig(),
    designConsent: true,
    fullName: 'DEMO Test',
    phone: '+90 536 716 96 50',
    email: '',
    projectCity: 'DEMO il / ilçe',
    message: '',
  }
  it('allows optional email and note only for an explicit validated design quote', () => {
    expect(validateInquiry(input).data?.email).toBe('')
    expect(validateInquiry({ ...input, designQuote: false }).errors).toBeDefined()
    expect(validateInquiry({ ...input, designConfig: undefined }).errors).toBeDefined()
    expect(
      validateInquiry({ ...input, preferredContactMethod: 'email' }).errors?.email,
    ).toBeDefined()
  })
  it.each([
    { projectCity: '' },
    { message: 'a'.repeat(2001) },
    { requestSamples: 'yes' },
    { requestMeasurement: 1 },
    { preferredContactMethod: 'other' },
    { attachmentHandles: ['bad'] },
    { status: 'completed' },
    { attachments: [1] },
    { email: 'invalid' },
  ])('rejects invalid fields %j', (patch) => {
    expect(validateInquiry({ ...input, ...patch }).errors).toBeDefined()
  })
  it('normalizes the configured WhatsApp number and rejects a local zero prefix', () => {
    expect(new URL(whatsappUrl('+90 536 716 96 50') || '').pathname).toBe('/905367169650')
    expect(whatsappUrl('0536 716 96 50')).toBeUndefined()
  })
  it.each(products)('builds a Turkish multiline message from actual %s fields', (product) => {
    const c = defaultConfig(product)
    const url = 'https://rtm.example/t/abcdefghijkl'
    const message = designMessage(c, url)
    expect(message).toContain(`Ürün: ${productNames[product]}`)
    expect(message).toContain(`Ölçüler: ${c.d.w} × ${c.d.h} × ${c.d.d} cm`)
    expect(message).toContain('\n\nÇizim:\n')
    expect(message).not.toContain('undefined')
    expect(message).not.toContain('ankastre')
    expect(decodeURIComponent(encodeURIComponent(message))).toBe(message)
    expect(designMessage(c, url, { location: 'DEMO İlçe', note: 'Ölçü notu' })).toContain(
      'Konum: DEMO İlçe\nNot: Ölçü notu',
    )
    expect(message).not.toContain('Konum:')
  })
  it('produces deterministic, keyed canonical identifiers and rejects extra personal fields', () => {
    const c = defaultConfig()
    const reordered = { o: c.o, r: c.r, d: c.d, m: c.m, v: c.v }
    expect(designShareKey(c, 'DEMO secret')).toMatch(/^[\w-]{12}$/)
    expect(designShareKey(c, 'DEMO secret')).toBe(designShareKey(reordered, 'DEMO secret'))
    expect(designShareKey(c, 'DEMO secret')).not.toBe(designShareKey(c, 'different secret'))
    expect(() => designShareKey({ ...c, phone: '+905550000000' }, 'DEMO secret')).toThrow()
    expect(() => designShareKey(c, '')).toThrow()
  })
  it('does not resolve malformed or unknown short links', async () => {
    // A narrow mock verifies the lookup without touching CMS data.
    const find = vi.fn().mockResolvedValue({ docs: [] })
    const payload = { find }
    expect(await resolveDesignShare(payload, 'bad')).toBeNull()
    expect(find).not.toHaveBeenCalled()
    expect(await resolveDesignShare(payload, 'abcdefghijkl')).toBeNull()
    expect(find.mock.calls[0][0].where.and[1].expiresAt.greater_than).toBeDefined()
  })
  it('validates actual image bytes, caps dimensions, and strips EXIF/GPS', async () => {
    const image = await sharp({
      create: { width: 2300, height: 1000, channels: 3, background: 'gray' },
    })
      .jpeg()
      .withExif({
        IFD0: { Artist: 'DEMO personal metadata' },
        IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '40/1 0/1 0/1' },
      })
      .toBuffer()
    const sanitized = await sanitizeAttachment(image)
    const metadata = await sharp(sanitized).metadata()
    expect(metadata.width).toBe(2048)
    expect(metadata.exif).toBeUndefined()
    expect(metadata.xmp).toBeUndefined()
    expect(metadata.format).toBe('jpeg')
    await expect(
      sanitizeAttachment(
        Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'),
      ),
    ).rejects.toThrow()
    await expect(sanitizeAttachment(Buffer.from('not an image'))).rejects.toThrow()
    await expect(sanitizeAttachment(Buffer.alloc(attachmentLimit + 1))).rejects.toThrow()
  })
})
