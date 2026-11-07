import { describe, expect, it } from 'vitest'
import { configSchema, decode, defaultConfig, encode, resize, sum } from '@/lib/configurator/config'
import {
  applyWardrobePreset,
  applyWardrobeStyle,
  assertWardrobeFits,
  setSlidingCount,
  setWardrobeCount,
  setWardrobeLayout,
  setWardrobeLoft,
  setWardrobeSystem,
  setWardrobeWidth,
  wardrobeDetails,
  wardrobeMainHeight,
  wardrobeStyles,
  wardrobeUnits,
  wardrobeSlidingPanels,
} from '@/lib/configurator/wardrobe'
import { wardrobeLayouts } from '@/lib/configurator/wardrobeSchema'
import { designShareKey } from '@/lib/designShares'
import { designMessage } from '@/lib/configurator/summary'
import { validateInquiry } from '@/lib/contactValidation'

describe('Advanced wardrobe', () => {
  it.each([2, 3, 4])(
    'keeps %i sliding panels on separate tracks and within the external width',
    (count) => {
      const c = defaultConfig('gardirop')
      setWardrobeSystem(c, 'surgulu')
      setSlidingCount(c, count)
      const panels = wardrobeSlidingPanels(c),
        halfWidth = c.d.w / 200
      expect(new Set(panels.map((panel) => panel.zOffset)).size).toBe(count)
      for (const panel of panels)
        for (const center of [panel.x, panel.localX, panel.stackX]) {
          expect(center - panel.width / 2).toBeGreaterThanOrEqual(-halfWidth - 0.00001)
          expect(center + panel.width / 2).toBeLessThanOrEqual(halfWidth + 0.00001)
        }
    },
  )
  it.each(wardrobeLayouts)(
    'keeps the %s interior within the declared main body and share',
    (layout) => {
      const c = defaultConfig('gardirop')
      setWardrobeLayout(c, 0, layout)
      const unit = wardrobeUnits(c)[0]
      expect(sum(unit.zones.map((zone) => zone.height))).toBeCloseTo(wardrobeMainHeight(c), 5)
      expect(
        unit.zones.every(
          (zone) =>
            zone.height > 0 &&
            zone.bottom >= unit.bottom &&
            zone.bottom + zone.height <= unit.bottom + unit.height + 0.001,
        ),
      ).toBe(true)
      expect(decode(encode(c))).toEqual(c)
      expect(configSchema.safeParse(c).success).toBe(true)
    },
  )
  it('preserves width locks and resizes the other bays only', () => {
    const c = defaultConfig('gardirop')
    setWardrobeCount(c, 3)
    setWardrobeWidth(c, 0, 80)
    c.r.main.lk[0] = true
    resize(c, 'w', 240)
    expect(c.r.main.w).toEqual([80, 80, 80])
    expect(() => setWardrobeWidth(c, 0, 90)).toThrow()
    expect(() => setWardrobeCount(c, 4)).toThrow()
    expect(configSchema.safeParse(c).success).toBe(true)
  })
  it('requires enough height for rods and drawers and rejects impossible edits', () => {
    const c = defaultConfig('gardirop')
    setWardrobeLayout(c, 0, 'double')
    resize(c, 'h', 180)
    expect(() => assertWardrobeFits(c)).toThrow(/yükseklik/)
    expect(configSchema.safeParse(c).success).toBe(false)
    setWardrobeLoft(c, false)
    expect(configSchema.safeParse(c).success).toBe(true)
  })
  it('retains hinge choices when switching to independently configured sliding panels', () => {
    const c = defaultConfig('gardirop')
    if (!c.wardrobe) throw new Error('Missing wardrobe')
    c.wardrobe.doors[0] = 'glass'
    c.wardrobe.glass[0] = 'yivli'
    resize(c, 'd', 50)
    setWardrobeSystem(c, 'surgulu')
    expect(c.d.d).toBe(60)
    expect(c.o.kulp).toBe('gomme')
    setSlidingCount(c, 3)
    c.wardrobe.slidingDoors[2] = 'mirror'
    const decoded = decode(encode(c))
    expect(decoded.wardrobe?.slidingDoors).toHaveLength(3)
    expect(designShareKey(decoded, 'DEMO secret')).toBe(designShareKey(c, 'DEMO secret'))
    setWardrobeSystem(c, 'mentese')
    expect(c.wardrobe.doors[0]).toBe('glass')
    expect(c.wardrobe.glass[0]).toBe('yivli')
    expect(configSchema.safeParse(c).success).toBe(true)
  })
  it.each(wardrobeStyles)('applies $name without changing dimensions', (style) => {
    const c = defaultConfig('gardirop'),
      dimensions = structuredClone(c.d)
    applyWardrobeStyle(c, style.id)
    expect(c.d).toEqual(dimensions)
    expect(configSchema.safeParse(c).success).toBe(true)
  })
  it.each(['reference', 'compact', 'showcase'] as const)(
    'validates the %s preset without persisting CMS content',
    (preset) => {
      const c = defaultConfig('gardirop')
      applyWardrobePreset(c, preset)
      expect(configSchema.safeParse(c).success).toBe(true)
      expect(sum(c.r.main.w)).toBe(c.d.w)
      expect(c.wardrobe?.layouts.length).toBe(c.r.main.w.length)
    },
  )
  it('preserves legacy v2 canonical data without automatically adding a wardrobe', () => {
    const legacy = defaultConfig('gardirop')
    delete legacy.wardrobe
    const canonical = JSON.stringify(legacy)
    expect(JSON.stringify(configSchema.parse(legacy))).toBe(canonical)
    expect(decode(encode(legacy)).wardrobe).toBeUndefined()
  })
  it('rejects wrong-product, invalid arrays, incompatible depths and extra fields at the boundary', () => {
    const c = defaultConfig('gardirop'),
      wd = c.wardrobe
    expect(configSchema.safeParse({ ...defaultConfig(), wardrobe: wd }).success).toBe(false)
    expect(configSchema.safeParse({ ...c, wardrobe: { ...wd, doors: [] } }).success).toBe(false)
    expect(
      configSchema.safeParse({ ...c, wardrobe: { ...wd, customerEmail: 'private' } }).success,
    ).toBe(false)
    setWardrobeSystem(c, 'surgulu')
    resize(c, 'd', 50)
    expect(configSchema.safeParse(c).success).toBe(false)
    resize(c, 'd', 60)
    const result = validateInquiry({
      inquiryType: 'quote',
      fullName: 'DEMO Test',
      email: 'demo@example.test',
      phone: '+905551112233',
      projectCity: 'DEMO İl',
      message: 'Gardırop ön tasarımı.',
      projectCategory: 'general',
      designConfig: c,
      designConsent: true,
    })
    expect(result.data?.designConfig).toEqual(c)
  })
  it('describes real bay choices and the selected panel count in the quote', () => {
    const c = defaultConfig('gardirop')
    if (!c.wardrobe) throw new Error('Missing wardrobe')
    setWardrobeLayout(c, 1, 'drawers')
    c.wardrobe.drawers[1] = 4
    setWardrobeSystem(c, 'surgulu')
    setSlidingCount(c, 3)
    c.wardrobe.slidingDoors[0] = 'glass'
    c.wardrobe.slidingGlass[0] = 'yivli'
    expect(wardrobeDetails(c).flat().join(' ')).toContain('4 iç çekmece')
    const message = designMessage(c, 'https://rtm.example/t/DEMO')
    expect(message).toContain('3 panelli sürgülü')
    expect(message).toContain('Yivli cam')
    expect(message).not.toContain('undefined')
  })
})
