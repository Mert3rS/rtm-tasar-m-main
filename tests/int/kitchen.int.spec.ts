import { describe, expect, it } from 'vitest'
import { createHmac } from 'node:crypto'
import { configSchema, decode, defaultConfig, encode, resize } from '@/lib/configurator/config'
import {
  kitchenDescription,
  kitchenGeometry,
  kitchenHeight,
  setKitchenLength,
} from '@/lib/configurator/kitchen'
import { designDetails } from '@/lib/configurator/summary'
import { designShareKey } from '@/lib/designShares'
import { validateInquiry } from '@/lib/contactValidation'

describe('Kitchen plans', () => {
  it.each(['straight', 'left', 'right'] as const)(
    'preserves the %s plan across sharing and server validation',
    (layout) => {
      const c = defaultConfig('mutfak')
      if (!c.k) throw new Error('Kitchen options missing')
      c.k.layout = layout
      setKitchenLength(c, 280)
      expect(decode(encode(c))).toEqual(c)
      const parsed = configSchema.parse(c)
      expect(designShareKey(parsed, 'DEMO-only-secret')).toBe(designShareKey(c, 'DEMO-only-secret'))
      const result = validateInquiry({
        inquiryType: 'quote',
        fullName: 'DEMO Test',
        email: 'demo@example.test',
        phone: '+905551112233',
        message: 'Mutfak ön tasarımı.',
        projectCategory: 'general',
        projectCity: 'İstanbul',
        designConfig: c,
        designConsent: true,
      })
      expect(result.data?.designConfig).toEqual(c)
      expect(kitchenHeight(c)).toBe(220)
      expect(designDetails(c).find(([label]) => label === 'Mutfak yerleşimi')?.[1]).toContain(
        'Evye ve batarya',
      )
    },
  )
  it('keeps legacy v2 shares byte-compatible and does not infer fixtures', () => {
    const legacy = defaultConfig('mutfak')
    delete legacy.k
    const canonical = JSON.stringify(legacy)
    expect(JSON.stringify(configSchema.parse(legacy))).toBe(canonical)
    expect(designShareKey(legacy, 'DEMO-only-secret')).toBe(
      createHmac('sha256', 'DEMO-only-secret')
        .update(`design-share:v1:${canonical}`)
        .digest('base64url')
        .slice(0, 12),
    )
    expect(decode(encode(legacy)).k).toBeUndefined()
    expect(kitchenDescription(legacy)).toBe('')
  })
  it.each(['left', 'right'] as const)(
    'reserves the %s corner without double counting return length',
    (layout) => {
      const c = defaultConfig('mutfak')
      if (!c.k) throw new Error('Kitchen options missing')
      c.k.layout = layout
      const geometry = kitchenGeometry(c)
      expect(geometry.modules.reduce((total, module) => total + module.width, 0)).toBe(
        c.d.w - c.d.d,
      )
      expect(geometry.returnWidth + c.d.d).toBe(c.k.length)
      expect(geometry.sink).not.toBe(geometry.hob)
      expect(geometry.modules.every((module) => module.width > 0)).toBe(true)
      setKitchenLength(c, 400)
      expect(kitchenGeometry(c).returnCount).toBe(c.k.modules?.returnLower.w.length)
    },
  )
  it('rejects impossible corners, out-of-range dimensions and unapproved fields', () => {
    const c = defaultConfig('mutfak')
    if (!c.k) throw new Error('Kitchen options missing')
    c.k.layout = 'left'
    resize(c, 'd', 70)
    resize(c, 'w', 180)
    expect(configSchema.safeParse(c).success).toBe(false)
    resize(c, 'w', 360)
    c.k.length = 119
    expect(configSchema.safeParse(c).success).toBe(false)
    c.k.length = 240
    expect(configSchema.safeParse({ ...c, k: { ...c.k, price: 123 } }).success).toBe(false)
    expect(configSchema.safeParse({ ...defaultConfig(), k: c.k }).success).toBe(false)
    resize(c, 'h', 120)
    expect(configSchema.safeParse(c).success).toBe(false)
  })
  it('omits disabled and non-fitting fixtures from the actual plan and quote', () => {
    const c = defaultConfig('mutfak')
    if (!c.k) throw new Error('Kitchen options missing')
    c.k.hob = false
    expect(kitchenGeometry(c).hob).toBeUndefined()
    expect(kitchenDescription(c)).toContain('Ankastre fırın')
    c.k.oven = false
    expect(kitchenDescription(c)).not.toContain('Ankastre fırın')
    c.k.sink = false
    expect(kitchenGeometry(c).sink).toBeUndefined()
    c.k.hob = true
    resize(c, 'w', 180)
    expect(kitchenGeometry(c).hob).toBeUndefined()
    expect(kitchenDescription(c)).not.toContain('Ocak')
    c.o.tezgah = 'yok'
    expect(kitchenGeometry(c).sink).toBeUndefined()
  })
})
