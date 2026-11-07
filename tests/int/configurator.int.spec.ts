import { describe, expect, it } from 'vitest'
import {
  baseHeight,
  configSchema,
  decode,
  defaultConfig,
  encode,
  products,
  redistribute,
  resize,
  setHeight,
  setWidth,
  sum,
} from '@/lib/configurator/config'
import { validateInquiry } from '@/lib/contactValidation'

describe('Furniture configuration invariants', () => {
  it.each(products)('round-trips %s through a UTF-8 share URL', (m) => {
    const c = defaultConfig(m)
    c.r.main.g[0].ka[0] = 'Çekmece · günlük eşya'
    expect(configSchema.safeParse(c).success).toBe(true)
    expect(decode(`#c=${encode(c)}`)).toEqual(c)
  })
  it('preserves locked dimensions and distributes only available space', () => {
    expect(redistribute([60, 80, 60], [false, true, false], 240, 30)).toEqual([80, 80, 80])
    expect(() => redistribute([60, 80], [true, true], 160, 30)).toThrow()
    expect(() => redistribute([60, 80], [false, true], 100, 30)).toThrow()
    expect(redistribute([30, 300, 30], [false, false, false], 100, 30)).toEqual([30, 40, 30])
  })
  it('keeps rounded sums stable over many resizes', () => {
    const c = defaultConfig('gardirop')
    for (let i = 0; i < 200; i++) {
      resize(c, 'w', 90 + i * 1.23)
      expect(Math.abs(sum(c.r.main.w) - c.d.w)).toBeLessThan(0.011)
      expect(c.r.main.w.every((w) => w >= 30)).toBe(true)
    }
  })
  it('preserves locked cells while height or base changes', () => {
    const c = defaultConfig()
    resize(c, 'h', 220)
    expect(c.r.main.g[0].h[1]).toBe(55.5)
    expect(c.r.main.g[0].h[2]).toBe(80.5)
    c.o.baza = 'b8'
    resize(c, 'h', 220)
    expect(sum(c.r.main.g[0].h)).toBe(220 - baseHeight(c))
    expect(configSchema.safeParse(c).success).toBe(true)
  })
  it('moves section boundaries without changing the cabinet width', () => {
    const c = defaultConfig()
    setWidth(c, 0, 75)
    expect(c.r.main.w).toEqual([75, 45])
    c.r.main.lk[1] = true
    expect(() => setWidth(c, 0, 90)).toThrow()
    expect(() => setHeight(c, 0, 1, 40)).toThrow()
  })
  it('rejects invalid, oversized and structurally mismatched input', () => {
    expect(() => decode('#c=%%%')).toThrow()
    expect(() => decode('a'.repeat(30000))).toThrow()
    const c = defaultConfig()
    c.r.main.g[0].f.pop()
    expect(configSchema.safeParse(c).success).toBe(false)
    const other = defaultConfig()
    other.r.main.w = [30, 30]
    expect(configSchema.safeParse(other).success).toBe(false)
    expect(configSchema.safeParse({ ...defaultConfig(), admin: true }).success).toBe(false)
    const unsafe = defaultConfig()
    unsafe.o.renk = '__proto__'
    expect(configSchema.safeParse(unsafe).success).toBe(false)
  })
  it('accepts only validated design data at the server submission boundary', () => {
    const input = {
      inquiryType: 'quote',
      fullName: 'DEMO Test',
      email: 'demo@example.test',
      phone: '+905551112233',
      message: 'Özel ölçü mobilya tasarımı.',
      projectCategory: 'general',
      projectCity: 'İstanbul',
      designConfig: defaultConfig(),
      designConsent: true,
    }
    expect(validateInquiry(input).data?.designConfig).toEqual(defaultConfig())
    expect(validateInquiry({ ...input, designConsent: false }).errors?.form).toBeTruthy()
    expect(validateInquiry({ ...input, designConfig: { v: 2 } }).errors?.form).toBeTruthy()
    expect(
      validateInquiry({ ...input, designPreview: 'https://example.test/image.png' }).errors?.form,
    ).toBeTruthy()
    expect(validateInquiry({ ...input, inquiryType: 'contact' }).errors?.form).toBeTruthy()
  })
})
