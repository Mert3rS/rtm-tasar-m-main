import { describe, expect, it } from 'vitest'
import {
  baseHeight,
  configSchema,
  decode,
  defaultConfig,
  encode,
  resize,
  sum,
} from '@/lib/configurator/config'
import {
  applyEntrywayPreset,
  applyEntrywayStyle,
  assertEntrywayFits,
  entrywayDetails,
  entrywayStyles,
  entrywayUnits,
  setEntrywayCount,
  setEntrywayLayout,
  setEntrywayOption,
  setEntrywayWidth,
} from '@/lib/configurator/entryway'
import { entrywayLayouts } from '@/lib/configurator/entrywaySchema'
import { designMessage } from '@/lib/configurator/summary'
import { validateInquiry } from '@/lib/contactValidation'
import { designShareKey } from '@/lib/designShares'

describe('Advanced entryway', () => {
  it.each(entrywayLayouts)(
    'keeps %s zones within the declared dimensions and shared configuration',
    (layout) => {
      const c = defaultConfig('portmanto')
      setEntrywayLayout(c, 0, layout)
      const unit = entrywayUnits(c)[0]
      expect(
        unit.zones.every(
          (zone) =>
            zone.height > 0 &&
            zone.bottom >= unit.bottom &&
            zone.bottom + zone.height <= unit.top + 0.001,
        ),
      ).toBe(true)
      expect(unit.x - unit.width / 2).toBeGreaterThanOrEqual(-c.d.w / 2)
      expect(configSchema.safeParse(c).success).toBe(true)
      expect(decode(encode(c))).toEqual(c)
      expect(designShareKey(decode(encode(c)), 'DEMO secret')).toBe(
        designShareKey(c, 'DEMO secret'),
      )
    },
  )
  it.each([false, true])('uses the finished seat height with cushion=%s', (cushion) => {
    const c = defaultConfig('portmanto')
    setEntrywayOption(c, 'cushion', cushion)
    for (const height of [40, 48, 55]) {
      setEntrywayOption(c, 'seatHeight', height)
      const unit = entrywayUnits(c)[0]
      expect(unit.seatBoardTop + (cushion ? 4 : 0)).toBe(height)
      expect(unit.zones[0].bottom + unit.zones[0].height + 3).toBe(unit.seatBoardTop)
      expect(unit.zones[0].height).toBeGreaterThanOrEqual(18)
    }
  })
  it('preserves locks and prevents impossible widths and counts', () => {
    const c = defaultConfig('portmanto')
    resize(c, 'w', 180)
    setEntrywayCount(c, 3)
    setEntrywayWidth(c, 0, 80)
    c.r.main.lk[0] = true
    resize(c, 'w', 200)
    expect(c.r.main.w).toEqual([80, 60, 60])
    expect(() => setEntrywayWidth(c, 0, 70)).toThrow()
    expect(() => setEntrywayCount(c, 4)).toThrow()
    c.r.main.lk[0] = false
    expect(() => setEntrywayWidth(c, 0, 130)).toThrow()
    expect(sum(c.r.main.w)).toBe(c.d.w)
  })
  it('adds enough depth for hanging and rejects insufficient height or shoe spacing', () => {
    const c = defaultConfig('portmanto')
    setEntrywayLayout(c, 1, 'hanging')
    expect(c.d.d).toBe(60)
    resize(c, 'h', 160)
    expect(() => assertEntrywayFits(c)).toThrow()
    expect(configSchema.safeParse(c).success).toBe(false)
    const shoes = defaultConfig('portmanto')
    setEntrywayLayout(shoes, 0, 'shoes')
    setEntrywayLayout(shoes, 1, 'shoes')
    resize(shoes, 'h', 100)
    expect(() => assertEntrywayFits(shoes)).toThrow()
    expect(configSchema.safeParse(shoes).success).toBe(false)
  })
  it.each(['reference', 'compact', 'family'] as const)(
    'validates the %s preset and retains exact widths',
    (preset) => {
      const c = defaultConfig('portmanto')
      applyEntrywayPreset(c, preset)
      expect(c.r.main.w).toEqual(
        preset === 'family' ? [60, 60, 60] : preset === 'compact' ? [40, 50] : [60, 60],
      )
      expect(configSchema.safeParse(c).success).toBe(true)
      expect(c.r.main.g.every((g) => sum(g.h) === c.d.h - baseHeight(c))).toBe(true)
    },
  )
  it.each(entrywayStyles)('applies $name without changing dimensions or open layouts', (style) => {
    const c = defaultConfig('portmanto'),
      dimensions = structuredClone(c.d)
    applyEntrywayStyle(c, style.id)
    expect(c.d).toEqual(dimensions)
    expect(entrywayUnits(c)[0].front).toBe('open')
    expect(configSchema.safeParse(c).success).toBe(true)
  })
  it('describes actual hooks, slats, drawers, cushion and glass in quotes', () => {
    const c = defaultConfig('portmanto'),
      entry = c.entryway
    if (!entry) throw new Error('Missing entryway')
    entry.hooks[0] = 6
    entry.benchStorage[0] = 'drawer'
    entry.fronts[1] = 'glass'
    entry.glass[1] = 'yivli'
    const message = designMessage(c, 'https://rtm.example/t/DEMO')
    for (const text of [
      '6 askı kancası',
      'Dikey çıtalı',
      'Bank altı çekmece',
      'Minderli',
      'Yivli cam',
    ])
      expect(message).toContain(text)
    expect(message).not.toContain('undefined')
    expect(entrywayDetails(c)).toHaveLength(3)
    expect(
      validateInquiry({
        inquiryType: 'quote',
        fullName: 'DEMO Test',
        email: 'demo@example.test',
        phone: '+905551112233',
        projectCity: 'DEMO İl',
        message: 'Vestiyer ön tasarımı.',
        projectCategory: 'general',
        designConfig: c,
        designConsent: true,
      }).data?.designConfig,
    ).toEqual(c)
  })
  it('keeps legacy v2 canonical data unchanged without adding metadata', () => {
    const legacy = defaultConfig('portmanto')
    delete legacy.entryway
    expect(JSON.stringify(configSchema.parse(legacy))).toBe(JSON.stringify(legacy))
    expect(decode(encode(legacy)).entryway).toBeUndefined()
  })
  it('rejects wrong products, unbalanced arrays, invalid bounds and unknown fields', () => {
    const c = defaultConfig('portmanto'),
      entry = c.entryway
    expect(configSchema.safeParse({ ...defaultConfig(), entryway: entry }).success).toBe(false)
    for (const patch of [
      { fronts: [] },
      { hooks: [8, 4] },
      { seatHeight: 35 },
      { upperHeight: 80 },
      { customerEmail: 'private' },
    ])
      expect(configSchema.safeParse({ ...c, entryway: { ...entry, ...patch } }).success).toBe(false)
    c.o.acilim = 'surgulu'
    expect(configSchema.safeParse(c).success).toBe(false)
  })
})
