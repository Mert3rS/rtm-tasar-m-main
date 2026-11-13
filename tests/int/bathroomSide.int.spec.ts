import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { configSchema, decode, defaultConfig, encode, sum } from '@/lib/configurator/config'
import {
  applyBathroomPreset,
  bathroomDetails,
  bathroomFocus,
  bathroomGeometry,
  bathroomSideOptions,
  normalizeBathroomSelection,
  setBathroomSideCell,
  setBathroomSideCellHeight,
  setBathroomSideCount,
  setBathroomSideDimension,
  setBathroomSideOption,
} from '@/lib/configurator/bathroom'
import { bathroomSideLimits } from '@/lib/configurator/bathroomSchema'
import { BathroomDrawing } from '@/components/configurator/BathroomDrawing'
import { designMessage } from '@/lib/configurator/summary'
import { designShareKey } from '@/lib/designShares'
import { validateInquiry } from '@/lib/contactValidation'

function reference() {
  const config = defaultConfig('banyo')
  applyBathroomPreset(config, 'reference')
  return config
}

describe('Editable bathroom tall cabinet', () => {
  it('preserves legacy canonical JSON and share IDs without materialising new fields', () => {
    const c = reference(),
      original = JSON.stringify(c)
    bathroomSideOptions(c)
    bathroomGeometry(c)
    expect(JSON.stringify(configSchema.parse(c))).toBe(original)
    expect(JSON.stringify(decode(encode(c)))).toBe(original)
    expect(designShareKey(decode(encode(c)), 'DEMO secret')).toBe(designShareKey(c, 'DEMO secret'))
    expect(c.bathroom?.sideCabinet).toEqual({ width: 42, height: 140, depth: 30, gap: 20 })
  })

  it('supports either side, independent mounting and front alignment without altering the vanity', () => {
    const c = reference(),
      lower = structuredClone(c.r),
      dimensions = structuredClone(c.d)
    setBathroomSideDimension(c, 'width', 55)
    setBathroomSideDimension(c, 'height', 180)
    setBathroomSideDimension(c, 'depth', 40)
    setBathroomSideDimension(c, 'floorGap', 50)
    setBathroomSideDimension(c, 'gap', 30)
    setBathroomSideOption(c, 'side', 'left')
    setBathroomSideOption(c, 'alignment', 'front')
    const g = bathroomGeometry(c)
    expect(g.totalWidth).toBe(185)
    expect(g.centerX).toBe(-42.5)
    expect(g.left).toBe(-135)
    expect(g.top).toBe(230)
    expect(g.sideCabinet).toMatchObject({ x: -107.5, bottom: 50, z: 6 })
    expect(bathroomFocus(c, { row: 'side', index: 0 })?.x).toBe(-1.075)
    expect(c.r).toEqual(lower)
    expect(c.d).toEqual(dimensions)
    expect(configSchema.safeParse(c).success).toBe(true)
    const drawing = renderToStaticMarkup(
      createElement(BathroomDrawing, { config: c, selection: { row: 'side', index: 0 } }),
    )
    expect(drawing).toContain('Sol boy dolabı')
    expect(drawing).toContain('55 × 180')
    expect(drawing).not.toMatch(/NaN|undefined/)
  })

  it('keeps eye heights consistent through resizing and retains independent kinds and finishes in every data flow', () => {
    const c = reference(),
      lower = structuredClone(c.r)
    setBathroomSideCount(c, 3)
    setBathroomSideCell(c, 0, { kind: 'drawers', drawers: 2 })
    setBathroomSideCell(c, 1, { kind: 'open', shelves: 0 })
    setBathroomSideCellHeight(c, 1, 30)
    setBathroomSideDimension(c, 'height', 160)
    setBathroomSideOption(c, 'finish', { malz: 'Lake', yuzey: 'Süper mat', renk: 'ceviz', ral: '' })
    const side = bathroomSideOptions(c)
    expect(sum(side.interior.h)).toBeCloseTo(160, 2)
    expect(side.interior.t).toEqual(['drawers', 'open', 'door'])
    expect(c.r).toEqual(lower)
    expect(decode(encode(c))).toEqual(c)
    expect(bathroomDetails(c).flat().join(' ')).toContain('Süper mat')
    const message = designMessage(c, 'https://rtm.example/t/DEMO')
    expect(message).toContain('Boy dolabı gözleri')
    expect(message).toContain('2 çekmece')
    expect(message).toContain('Açık raf')
    expect(message).toContain('Süper mat')
    expect(message).not.toMatch(/undefined|NaN/)
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

  it('keeps all settings when removed and re-added, and normalises a stale selection', () => {
    const c = reference()
    setBathroomSideCount(c, 2)
    setBathroomSideDimension(c, 'width', 50)
    const side = structuredClone(bathroomSideOptions(c))
    setBathroomSideOption(c, 'enabled', false)
    expect(bathroomGeometry(c).side).toEqual([])
    expect(bathroomGeometry(c).totalWidth).toBe(c.d.w)
    expect(normalizeBathroomSelection(c, { row: 'side', index: 5 }).row).toBe('lower')
    setBathroomSideOption(c, 'enabled', true)
    expect(bathroomSideOptions(c)).toEqual(side)
    expect(normalizeBathroomSelection(c, { row: 'side', index: 5 })).toEqual({
      row: 'side',
      index: 1,
    })
  })

  it.each(Object.entries(bathroomSideLimits))(
    'rejects out-of-range %s in externally supplied designs',
    (key, [min, max]) => {
      for (const value of [min - 1, max + 1, Infinity, NaN]) {
        const c = reference()
        expect(
          configSchema.safeParse({
            ...c,
            bathroom: { ...c.bathroom, sideCabinet: { ...c.bathroom?.sideCabinet, [key]: value } },
          }).success,
        ).toBe(false)
      }
    },
  )

  it('rejects inconsistent eyes, unknown fields and invalid palette names at the server boundary', () => {
    const c = reference()
    setBathroomSideCount(c, 2)
    const side = bathroomSideOptions(c)
    for (const patch of [
      { interior: { ...side.interior, h: [20, 20] } },
      { interior: { ...side.interior, t: ['door'] } },
      { interior: { ...side.interior, h: [18, 122], t: ['drawers', 'door'] } },
      { finish: { malz: 'Lake', yuzey: 'Mat', renk: 'invalid', ral: '' } },
      { customerEmail: 'private@example.test' },
    ])
      expect(
        configSchema.safeParse({
          ...c,
          bathroom: { ...c.bathroom, sideCabinet: { ...side, ...patch } },
        }).success,
      ).toBe(false)
    expect(() => setBathroomSideCellHeight(reference(), 4, 40)).toThrow()
    expect(() => setBathroomSideCount(reference(), 7)).toThrow()
  })
})
