import { describe, expect, it } from 'vitest'
import { configSchema, decode, defaultConfig, encode, resize, sum } from '@/lib/configurator/config'
import {
  applyKitchenPreset,
  ensureKitchenModules,
  kitchenCameraFocus,
  kitchenGeometry,
  kitchenModuleDetails,
  kitchenRow,
  setKitchenCount,
  setKitchenKind,
  setKitchenLength,
  setKitchenWidth,
} from '@/lib/configurator/kitchen'
import { applyKitchenStyle, kitchenStyles } from '@/lib/configurator/kitchenStyles'
import { designShareKey } from '@/lib/designShares'
import { designMessage } from '@/lib/configurator/summary'

describe('Independent kitchen modules', () => {
  it('resizes the upper row independently and preserves locked widths on overall resize', () => {
    const c = defaultConfig('mutfak'),
      originalLower = [...c.r.main.w]
    setKitchenCount(c, 'upper', 5)
    setKitchenWidth(c, 'upper', 0, 80)
    const modules = ensureKitchenModules(c)
    modules.upper.lk[0] = true
    expect(c.r.main.w).toEqual(originalLower)
    resize(c, 'w', 420)
    expect(modules.upper.w[0]).toBe(80)
    expect(sum(modules.upper.w)).toBe(420)
    expect(sum(c.r.main.w)).toBe(420)
    expect(() => setKitchenWidth(c, 'upper', 0, 90)).toThrow()
    expect(() => setKitchenCount(c, 'upper', 4)).toThrow()
    expect(configSchema.safeParse(c).success).toBe(true)
  })
  it('can transfer each appliance to the return without duplicating it', () => {
    const c = defaultConfig('mutfak')
    if (!c.k) throw new Error('Missing kitchen')
    c.k.layout = 'left'
    setKitchenKind(c, 'returnLower', 0, 'dishwasher')
    setKitchenKind(c, 'returnLower', 1, 'sink')
    setKitchenKind(c, 'returnLower', 2, 'oven')
    const modules = ensureKitchenModules(c)
    modules.hob = { row: 'returnLower', index: 2 }
    const g = kitchenGeometry(c)
    expect(g.sink?.row).toBe('returnLower')
    expect(g.ovenUnit?.row).toBe('returnLower')
    expect(g.dishwasher?.row).toBe('returnLower')
    expect(g.hob?.row).toBe('returnLower')
    expect(modules.lower).not.toContain('oven')
    expect(modules.lower).not.toContain('sink')
    expect(modules.lower).not.toContain('dishwasher')
    expect(configSchema.safeParse(c).success).toBe(true)
    expect(designMessage(c, 'https://rtm.example/t/DEMO')).toContain('Dönüş · alt dolaplar')
  })
  it.each(['left', 'right'] as const)(
    'orders return modules from the corner in a %s plan and focuses the actual unit',
    (layout) => {
      const c = defaultConfig('mutfak')
      if (!c.k) throw new Error('Missing kitchen')
      c.k.layout = layout
      const first = kitchenCameraFocus(c, { row: 'returnLower', index: 0 })
      const last = kitchenCameraFocus(c, { row: 'returnLower', index: 2 })
      expect(first?.z).toBeLessThan(last?.z ?? 0)
      expect(first?.x ? Math.sign(first.x) : 0).toBe(layout === 'left' ? -1 : 1)
      expect(Object.values(first ?? {}).every(Number.isFinite)).toBe(true)
    },
  )
  it('allows glass per upper module and keeps every setting in the canonical share', () => {
    const c = defaultConfig('mutfak')
    setKitchenKind(c, 'upper', 2, 'glass')
    ensureKitchenModules(c).upper.glass[2] = 'yivli'
    c.o.camc = 'bronz'
    c.o.baza = 'b10'
    resize(c, 'h', 88)
    c.o.tezgah = 'porselen'
    c.o.led = ['alt', 'ic', 'gola']
    const decoded = decode(encode(c))
    expect(decoded).toEqual(c)
    expect(designShareKey(decoded, 'DEMO secret')).toBe(designShareKey(c, 'DEMO secret'))
    expect(kitchenModuleDetails(c).flat().join(' ')).toContain('Yivli cam')
    expect(designMessage(c, 'https://rtm.example/t/DEMO')).toContain('Gola profil LED')
  })
  it('keeps earlier kitchen links canonical without inventing the new rows', () => {
    const c = defaultConfig('mutfak')
    if (!c.k) throw new Error('Missing kitchen')
    delete c.k.modules
    const bytes = JSON.stringify(c)
    expect(JSON.stringify(configSchema.parse(c))).toBe(bytes)
    expect(decode(encode(c)).k?.modules).toBeUndefined()
  })
  it.each(kitchenStyles)(
    'applies the $name style without changing the cabinet dimensions',
    (style) => {
      const c = defaultConfig('mutfak'),
        original = structuredClone(c.d)
      applyKitchenStyle(c, style.id)
      expect(c.d).toEqual(original)
      expect(configSchema.safeParse(c).success).toBe(true)
    },
  )
  it('builds the supplied 300 cm arrangement as an explicit preset', () => {
    const c = defaultConfig('mutfak')
    applyKitchenPreset(c, 'reference')
    const modules = ensureKitchenModules(c)
    expect(c.d.w).toBe(300)
    expect(c.r.main.w).toEqual([50, 60, 50, 80, 60])
    expect(c.r.main.lk).toEqual([false, true, false, true, true])
    expect(modules.lower).toEqual(['drawers', 'oven', 'door', 'sink', 'dishwasher'])
    expect(modules.upper.t).toEqual(['glass', 'hood', 'door', 'door', 'glass'])
    expect(c.o.camc).toBe('bronz')
    expect(configSchema.safeParse(c).success).toBe(true)
  })
  it('reduces unpinned return rows to fit a shorter wall and clears a removed hob', () => {
    const c = defaultConfig('mutfak')
    if (!c.k) throw new Error('Missing kitchen')
    c.k.layout = 'left'
    ensureKitchenModules(c).hob = { row: 'returnLower', index: 2 }
    setKitchenLength(c, 120)
    expect(kitchenRow(c, 'returnLower').w).toEqual([30, 30])
    expect(ensureKitchenModules(c).hob).toBeNull()
    expect(configSchema.safeParse(c).success).toBe(true)
  })
  it('rejects inconsistent rows, wrong kinds, duplicate appliances and extra input', () => {
    const c = defaultConfig('mutfak'),
      modules = ensureKitchenModules(c)
    expect(
      configSchema.safeParse({ ...c, k: { ...c.k, modules: { ...modules, recipient: 'private' } } })
        .success,
    ).toBe(false)
    modules.upper.w[0] += 20
    expect(configSchema.safeParse(c).success).toBe(false)
    modules.upper.w[0] -= 20
    modules.upper.t[0] = 'dishwasher'
    expect(configSchema.safeParse(c).success).toBe(false)
    modules.upper.t[0] = 'glass'
    modules.lower[0] = 'oven'
    expect(configSchema.safeParse(c).success).toBe(false)
  })
  it('omits a non-fitting appliance from both the geometry and the quote', () => {
    const c = defaultConfig('mutfak')
    resize(c, 'w', 180)
    expect(kitchenGeometry(c).ovenUnit).toBeUndefined()
    expect(kitchenModuleDetails(c).flat().join(' ')).not.toContain('Ankastre fırın')
    expect(kitchenModuleDetails(c).flat().join(' ')).not.toContain('Evye dolabı')
  })
})
