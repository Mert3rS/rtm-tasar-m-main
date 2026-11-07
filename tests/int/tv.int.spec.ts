import { describe, expect, it } from 'vitest'
import { configSchema, decode, defaultConfig, encode, resize, sum } from '@/lib/configurator/config'
import {
  applyTvPreset,
  applyTvStyle,
  assertTvFits,
  normalizeTvSelection,
  setTvCount,
  setTvKind,
  setTvMount,
  setTvWidth,
  tvDetails,
  tvFocus,
  tvGeometry,
  tvStyles,
} from '@/lib/configurator/tv'
import { tvLowerKinds, tvUpperKinds } from '@/lib/configurator/tvSchema'
import { designMessage } from '@/lib/configurator/summary'
import { designShareKey } from '@/lib/designShares'
import { validateInquiry } from '@/lib/contactValidation'

describe('Advanced TV unit', () => {
  it.each(['reference', 'minimal', 'cinema'] as const)(
    'keeps the %s composition, screen and side cabinets within their declared bounds',
    (preset) => {
      const c = defaultConfig('tv')
      applyTvPreset(c, preset)
      const g = tvGeometry(c)
      expect(configSchema.safeParse(c).success).toBe(true)
      expect(sum(g.lower.map((u) => u.width))).toBe(c.d.w)
      expect(sum(g.upper.map((u) => u.width))).toBe(c.d.w)
      if (!g.area || !g.screen) throw new Error('Missing screen')
      expect(g.screen.width / g.screen.height).toBeCloseTo(16 / 9, 2)
      expect(g.screen.x - g.screen.width / 2).toBeGreaterThan(g.area.x - g.area.width / 2)
      expect(g.screen.x + g.screen.width / 2).toBeLessThan(g.area.x + g.area.width / 2)
      expect(g.screen.y - g.screen.height / 2).toBeGreaterThan(g.counter)
      expect(g.screen.y + g.screen.height / 2).toBeLessThan(g.top)
      expect(decode(encode(c))).toEqual(c)
      expect(designShareKey(decode(encode(c)), 'DEMO secret')).toBe(
        designShareKey(c, 'DEMO secret'),
      )
    },
  )
  it.each(tvLowerKinds)('fits %s lower storage without moving the screen', (kind) => {
    const c = defaultConfig('tv'),
      before = tvGeometry(c).screen
    setTvKind(c, { row: 'lower', index: 0 }, kind)
    expect(tvGeometry(c).screen).toEqual(before)
    expect(configSchema.safeParse(c).success).toBe(true)
  })
  it.each(tvUpperKinds.filter((kind) => kind !== 'tv'))(
    'fits a %s side section without removing the TV area',
    (kind) => {
      const c = defaultConfig('tv')
      setTvKind(c, { row: 'upper', index: 0 }, kind)
      expect(c.tvUnit?.upper.t.filter((value) => value === 'tv')).toHaveLength(1)
      expect(configSchema.safeParse(c).success).toBe(true)
    },
  )
  it('preserves independent lower and upper locks while resizing overall width', () => {
    const c = defaultConfig('tv')
    if (!c.tvUnit) throw new Error('Missing TV')
    c.r.main.lk[0] = true
    c.tvUnit.upper.lk[1] = true
    resize(c, 'w', 300)
    expect(c.r.main.w).toEqual([60, 80, 80, 80])
    expect(c.tvUnit.upper.w).toEqual([70, 160, 70])
    expect(() => setTvCount(c, 'upper', 4)).toThrow()
    expect(() => setTvWidth(c, { row: 'upper', index: 1 }, 180)).toThrow()
    expect(configSchema.safeParse(c).success).toBe(true)
  })
  it.each([1, 2, 3, 4, 5])('fits %i upper sections around a single retained screen', (count) => {
    const c = defaultConfig('tv')
    resize(c, 'w', 360)
    setTvCount(c, 'upper', count)
    expect(sum(c.tvUnit?.upper.w ?? [])).toBeCloseTo(360, 2)
    expect(c.tvUnit?.upper.t.filter((kind) => kind === 'tv')).toHaveLength(1)
    expect(configSchema.safeParse(c).success).toBe(true)
    expect(normalizeTvSelection(c, { row: 'upper', index: 20 }).index).toBe(count - 1)
    expect(tvFocus(c, { row: 'upper', index: 0 })?.height).toBeGreaterThan(1)
  })
  it('rejects oversized screens, missing TV areas and shallow upper storage', () => {
    const c = defaultConfig('tv')
    c.o.tv = 85
    expect(() => assertTvFits(c)).toThrow()
    expect(configSchema.safeParse(c).success).toBe(false)
    resize(c, 'w', 300)
    expect(configSchema.safeParse(c).success).toBe(true)
    expect(() => setTvKind(c, { row: 'upper', index: 1 }, 'open')).toThrow()
    const shallow = defaultConfig('tv')
    resize(shallow, 'd', 25)
    expect(configSchema.safeParse(shallow).success).toBe(false)
  })
  it.each(tvStyles)('applies $name without changing the dimensions or module types', (style) => {
    const c = defaultConfig('tv'),
      before = structuredClone(c.d),
      kinds = structuredClone(c.tvUnit?.upper.t)
    applyTvStyle(c, style.id)
    expect(c.d).toEqual(before)
    expect(c.tvUnit?.upper.t).toEqual(kinds)
    expect(configSchema.safeParse(c).success).toBe(true)
  })
  it('keeps floor mounting and actual fittings in the quote and server boundary', () => {
    const c = defaultConfig('tv'),
      t = c.tvUnit
    if (!t) throw new Error('Missing TV')
    setTvMount(c, 'ayak')
    t.upper.glass[2] = 'yivli'
    t.drawers[1] = 3
    const message = designMessage(c, 'https://rtm.example/t/DEMO')
    for (const text of ['65 inç TV', 'Yivli cam', '3 çekmece', 'Gizli LED çerçeve', 'Kablo kanalı'])
      expect(message).toContain(text)
    expect(tvDetails(c).flat().join(' ')).not.toContain('undefined')
    expect(
      validateInquiry({
        inquiryType: 'quote',
        fullName: 'DEMO Test',
        email: 'demo@example.test',
        phone: '+905551112233',
        projectCity: 'DEMO İl',
        message: 'TV ünitesi ön tasarımı.',
        projectCategory: 'general',
        designConfig: c,
        designConsent: true,
      }).data?.designConfig,
    ).toEqual(c)
  })
  it('preserves legacy canonical v2 JSON without adding TV metadata', () => {
    const c = defaultConfig('tv')
    delete c.tvUnit
    expect(JSON.stringify(configSchema.parse(c))).toBe(JSON.stringify(c))
    expect(decode(encode(c)).tvUnit).toBeUndefined()
  })
  it('rejects unknown fields, unbalanced arrays and cross-product data', () => {
    const c = defaultConfig('tv'),
      t = c.tvUnit
    expect(configSchema.safeParse({ ...defaultConfig(), tvUnit: t }).success).toBe(false)
    for (const patch of [
      { lower: [] },
      { drawers: [9] },
      { upper: { ...t?.upper, lk: [] } },
      { upperHeight: 15 },
      { customerEmail: 'private' },
    ])
      expect(configSchema.safeParse({ ...c, tvUnit: { ...t, ...patch } }).success).toBe(false)
  })
})
