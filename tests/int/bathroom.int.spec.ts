import { describe, expect, it } from 'vitest'
import { configSchema, decode, defaultConfig, encode, resize, sum } from '@/lib/configurator/config'
import {
  applyBathroomPreset,
  applyBathroomStyle,
  bathroomBasinSize,
  bathroomDetails,
  bathroomFocus,
  bathroomGeometry,
  bathroomStyles,
  normalizeBathroomSelection,
  setBathroomCount,
  setBathroomKind,
  setBathroomMount,
  setBathroomOption,
  setBathroomWidth,
} from '@/lib/configurator/bathroom'
import { bathroomLowerKinds, bathroomUpperKinds } from '@/lib/configurator/bathroomSchema'
import { designMessage } from '@/lib/configurator/summary'
import { validateInquiry } from '@/lib/contactValidation'
import { designShareKey } from '@/lib/designShares'

describe('Advanced bathroom', () => {
  it('keeps the reference mirror, open shelf and separate tall cabinet in the shared design', () => {
    const c = defaultConfig('banyo')
    applyBathroomPreset(c, 'reference')
    const g = bathroomGeometry(c)
    expect(c.bathroom?.lower).toEqual(['sink', 'open'])
    expect(c.bathroom?.mirrorShape).toBe('round')
    expect(c.bathroom?.upperEnabled).toBe(false)
    expect(g.sideCabinet).toMatchObject({ width: 42, height: 140, depth: 30, bottom: 35 })
    expect(g.sideCabinet && g.sideCabinet.x - g.sideCabinet.width / 2).toBe(c.d.w / 2 + 20)
    expect(g.totalWidth).toBe(162)
    expect(decode(encode(c))).toEqual(c)
    expect(designMessage(c, 'https://rtm.example/t/DEMO')).toContain('42 × 140 × 30 cm')
    expect(configSchema.safeParse({ ...c, bathroom: { ...c.bathroom, sideCabinet: { width: 2, height: 140, depth: 30, gap: 20 } } }).success).toBe(false)
  })
  it.each(['reference', 'compact', 'double'] as const)(
    'validates the %s preset with consistent counter and wall geometry',
    (preset) => {
      const c = defaultConfig('banyo')
      applyBathroomPreset(c, preset)
      const g = bathroomGeometry(c)
      expect(configSchema.safeParse(c).success).toBe(true)
      expect(g.counter).toBe(85)
      expect(g.top).toBe(193)
      expect(sum(g.lower.map((unit) => unit.width))).toBe(c.d.w)
      expect(sum(g.upper.map((unit) => unit.width))).toBe(c.d.w)
      expect(g.sinks).toHaveLength(preset === 'double' ? 2 : 1)
      expect(
        g.upper.every((unit) => unit.bottom > g.counter && unit.z - unit.depth / 2 === -c.d.d / 2),
      ).toBe(true)
      for (const unit of g.sinks) {
        const basin = bathroomBasinSize(c, unit)
        expect(basin.width).toBeLessThan(unit.width)
        expect(basin.depth + 12).toBeLessThanOrEqual(c.d.d)
        expect(basin.z + basin.depth / 2).toBeLessThan(c.d.d / 2)
      }
      expect(decode(encode(c))).toEqual(c)
      expect(designShareKey(decode(encode(c)), 'DEMO secret')).toBe(
        designShareKey(c, 'DEMO secret'),
      )
    },
  )
  it.each(bathroomLowerKinds)('fits the %s lower unit while keeping a separate sink', (kind) => {
    const c = defaultConfig('banyo')
    resize(c, 'w', 180)
    setBathroomCount(c, 'lower', 2)
    setBathroomKind(c, { row: 'lower', index: 1 }, kind)
    const g = bathroomGeometry(c)
    expect(g.lower.every((unit) => unit.height > 0 && unit.bottom >= 0)).toBe(true)
    expect(g.sinks.length).toBeGreaterThanOrEqual(1)
    expect(configSchema.safeParse(c).success).toBe(true)
    if (kind === 'washer') {
      expect(c.d.d).toBe(60)
      expect(c.d.h).toBe(88)
      expect(c.o.baza).toBe('b0')
      expect(g.lower[1].height).toBeGreaterThanOrEqual(84)
    }
  })
  it.each(bathroomUpperKinds)(
    'retains the %s upper bay with independent width and focus',
    (kind) => {
      const c = defaultConfig('banyo')
      setBathroomKind(c, { row: 'upper', index: 1 }, kind)
      setBathroomWidth(c, { row: 'upper', index: 0 }, 40)
      expect(c.r.main.w).toEqual([100])
      expect(c.bathroom?.upper.w).toEqual([40, 60])
      expect(bathroomFocus(c, { row: 'upper', index: 1 })?.y).toBeGreaterThan(1)
      expect(configSchema.safeParse(c).success).toBe(true)
    },
  )
  it('preserves locks independently when overall width changes', () => {
    const c = defaultConfig('banyo')
    resize(c, 'w', 120)
    setBathroomCount(c, 'lower', 2)
    setBathroomWidth(c, { row: 'lower', index: 0 }, 80)
    c.r.main.lk[0] = true
    if (!c.bathroom) throw new Error('Missing bathroom')
    c.bathroom.upper.lk[0] = true
    resize(c, 'w', 160)
    expect(c.r.main.w).toEqual([80, 80])
    expect(c.bathroom.upper.w).toEqual([60, 100])
    expect(() => setBathroomCount(c, 'lower', 3)).toThrow()
    expect(() => setBathroomWidth(c, { row: 'upper', index: 0 }, 70)).toThrow()
    expect(configSchema.safeParse(c).success).toBe(true)
  })
  it('rejects a missing sink, narrow basins, excessive sink counts and impossible heights', () => {
    const c = defaultConfig('banyo')
    expect(() => setBathroomKind(c, { row: 'lower', index: 0 }, 'door')).toThrow()
    expect(configSchema.safeParse(c).success).toBe(false)
    const narrow = defaultConfig('banyo')
    expect(() => resize(narrow, 'w', 50)).toThrow()
    const high = defaultConfig('banyo')
    resize(high, 'h', 95)
    expect(configSchema.safeParse(high).success).toBe(false)
    const triple = defaultConfig('banyo')
    resize(triple, 'w', 240)
    setBathroomCount(triple, 'lower', 3)
    setBathroomKind(triple, { row: 'lower', index: 1 }, 'sink')
    expect(() => setBathroomKind(triple, { row: 'lower', index: 2 }, 'sink')).toThrow()
  })
  it.each(['inset', 'vessel', 'round'] as const)(
    'keeps the %s basin and mounting options within the declared bounds',
    (basin) => {
      const c = defaultConfig('banyo')
      setBathroomOption(c, 'basin', basin)
      setBathroomMount(c, false)
      expect(c.d.h).toBe(85)
      expect(configSchema.safeParse(c).success).toBe(true)
      setBathroomMount(c, true)
      setBathroomOption(c, 'upperEnabled', false)
      expect(normalizeBathroomSelection(c, { row: 'upper', index: 7 })).toEqual({
        row: 'lower',
        index: 0,
      })
      expect(configSchema.safeParse(c).success).toBe(true)
      expect(bathroomDetails(c).flat().join(' ')).toContain('duvar aynası')
    },
  )
  it.each(bathroomStyles)('applies $name without changing the geometry', (style) => {
    const c = defaultConfig('banyo'),
      before = structuredClone(c.d)
    applyBathroomStyle(c, style.id)
    expect(c.d).toEqual(before)
    expect(configSchema.safeParse(c).success).toBe(true)
  })
  it('uses actual lower/upper choices in messages and validates submission data', () => {
    const c = defaultConfig('banyo'),
      b = c.bathroom
    if (!b) throw new Error('Missing bathroom')
    setBathroomKind(c, { row: 'upper', index: 1 }, 'glass')
    b.upper.glass[1] = 'yivli'
    b.drawers[0] = 3
    const message = designMessage(c, 'https://rtm.example/t/DEMO')
    for (const text of [
      '1 lavabo',
      'Yivli cam',
      '3 çekmece',
      'Ayna çevresi LED',
      'Tezgâh üst kotu 85 cm',
    ])
      expect(message).toContain(text)
    expect(message).not.toContain('undefined')
    expect(
      validateInquiry({
        inquiryType: 'quote',
        fullName: 'DEMO Test',
        email: 'demo@example.test',
        phone: '+905551112233',
        projectCity: 'DEMO İl',
        message: 'Banyo ön tasarımı.',
        projectCategory: 'general',
        designConfig: c,
        designConsent: true,
      }).data?.designConfig,
    ).toEqual(c)
  })
  it('keeps legacy v2 canonical JSON unchanged without adding bathroom metadata', () => {
    const c = defaultConfig('banyo')
    delete c.bathroom
    expect(JSON.stringify(configSchema.parse(c))).toBe(JSON.stringify(c))
    expect(decode(encode(c)).bathroom).toBeUndefined()
  })
  it('rejects unknown fields, invalid array lengths, cross-product metadata and unsupported fitting', () => {
    const c = defaultConfig('banyo'),
      b = c.bathroom
    expect(configSchema.safeParse({ ...defaultConfig(), bathroom: b }).success).toBe(false)
    for (const patch of [
      { lower: [] },
      { drawers: [4] },
      { floorGap: 99 },
      { upper: { ...b?.upper, lk: [] } },
      { customerEmail: 'private' },
    ])
      expect(configSchema.safeParse({ ...c, bathroom: { ...b, ...patch } }).success).toBe(false)
    c.o.acilim = 'surgulu'
    expect(configSchema.safeParse(c).success).toBe(false)
  })
})
