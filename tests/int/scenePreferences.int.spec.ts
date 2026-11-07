import { describe, expect, it } from 'vitest'
import {
  contrastInk,
  defaultScenePreferences,
  hexColor,
  readScenePreferences,
  saveScenePreferences,
} from '@/lib/configurator/scenePreferences'
import { baseHeight, defaultConfig, products, type Config } from '@/lib/configurator/config'
import { fitProps, layoutProps, shelfCount } from '@/lib/configurator/props/layout'
import { productPropSets } from '@/lib/configurator/props/catalog'
import { HUMAN_HEIGHT, humanProfile } from '@/lib/configurator/humanProfile'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, StrictMode, type ReactNode } from 'react'
import { useScenePreferences } from '@/components/configurator/useScenePreferences'
import { propRecipe, createPropGeometry } from '@/lib/configurator/props/geometry'
import { Object3D } from 'three'
import { initConsentStore, resetConsentStoreForTests, saveConsent } from '@/lib/consent/storage'

describe('studio viewing preferences', () => {
  it('ignores stored preferences without Functional consent (Phase 10)', async () => {
    resetConsentStoreForTests()
    initConsentStore('1', true)
    localStorage.setItem('rtm-studio-scene-v1', JSON.stringify({ wall: '#123456', floor: null, textured: true, props: false }))
    const hook = renderHook(() => useScenePreferences())
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(hook.result.current.preferences.wall).toBeNull()
    hook.unmount()
    localStorage.removeItem('rtm-studio-scene-v1')
  })
  it('preserves stored preferences through React Strict Mode effect replay', async () => {
    resetConsentStoreForTests()
    initConsentStore('1', true)
    saveConsent({ functional: true, personalization: false, analytics: false, marketing: false })
    localStorage.setItem(
      'rtm-studio-scene-v1',
      JSON.stringify({ wall: '#123456', floor: null, textured: true, props: false }),
    )
    const hook = renderHook(() => useScenePreferences(), {
      wrapper: ({ children }: { children: ReactNode }) => createElement(StrictMode, null, children),
    })
    await waitFor(() => expect(hook.result.current.preferences.wall).toBe('#123456'))
    expect(hook.result.current.preferences.props).toBe(false)
    hook.unmount()
    expect(JSON.parse(localStorage.getItem('rtm-studio-scene-v1') || '{}').wall).toBe('#123456')
    localStorage.removeItem('rtm-studio-scene-v1')
  })
  it('accepts only full hex colors', () => {
    expect(hexColor.parse('#AbCd09')).toBe('#abcd09')
    for (const invalid of ['red', '#fff', '#gggggg', '#ffffff00', '', '<svg>'])
      expect(hexColor.safeParse(invalid).success).toBe(false)
  })
  it('falls back on corrupt, missing, or inaccessible storage', () => {
    for (const raw of [null, '{', '[]', 'null', '{"wall":"red"}', '{"props":"yes"}'])
      expect(readScenePreferences({ getItem: () => raw, setItem: () => {} })).toEqual(
        defaultScenePreferences,
      )
    expect(
      readScenePreferences({ getItem: () => '{"wall":"#123456"}', setItem: () => {} }),
    ).toEqual({ ...defaultScenePreferences, wall: '#123456' })
    const blocked = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
    }
    expect(readScenePreferences(blocked)).toEqual(defaultScenePreferences)
    expect(() => saveScenePreferences(blocked, defaultScenePreferences)).not.toThrow()
  })
  it('chooses contrasting ink and fixes the human scale at exactly 180 cm', () => {
    expect(contrastInk('#ffffff')).toBe('dark')
    expect(contrastInk('#000000')).toBe('light')
    expect(contrastInk('#c4d600')).toBe('dark')
    expect(Math.max(...humanProfile.map((p) => p[1]))).toBeCloseTo(HUMAN_HEIGHT, 8)
    expect(Math.min(...humanProfile.map((p) => p[1]))).toBe(0)
  })
})

describe('representative object placement', () => {
  it('keeps every real mesh inside its declared physical bounding box', () => {
    const kinds = new Set(
      Object.values(productPropSets).flatMap((sets) => Object.values(sets).flat()),
    )
    kinds.add('tv')
    kinds.add('soundbar')
    for (const kind of kinds)
      for (const part of propRecipe(kind)) {
        const geometry = createPropGeometry(part.form)
        geometry.computeBoundingBox()
        const transform = new Object3D()
        transform.position.set(...part.p)
        transform.scale.set(...part.s)
        transform.rotation.set(...(part.rotation ?? [0, 0, 0]))
        transform.updateMatrix()
        const bounds = geometry.boundingBox?.clone().applyMatrix4(transform.matrix)
        expect(bounds, kind).toBeDefined()
        for (const axis of ['x', 'y', 'z'] as const) {
          expect(bounds?.min[axis], `${kind} ${axis} min`).toBeGreaterThanOrEqual(-0.50001)
          expect(bounds?.max[axis], `${kind} ${axis} max`).toBeLessThanOrEqual(0.50001)
        }
        geometry.dispose()
      }
  })
  it.each(products)('%s uses its own set, deterministically, at real sizes', (product) => {
    const config = defaultConfig(product)
    const first = layoutProps(config)
    expect(first.length).toBeGreaterThan(0)
    expect(layoutProps(structuredClone(config))).toEqual(first)
    const allowed = new Set(Object.values(productPropSets[product]).flat())
    for (const p of first) {
      if (p.cell === 'surface') {
        expect(product).toBe('tv')
        continue
      }
      expect(allowed.has(p.kind)).toBe(true)
      const [s, i] = p.cell.split('-').map(Number)
      const x = -config.d.w / 200 + config.r.main.w.slice(0, s).reduce((a, b) => a + b, 0) / 100
      expect(p.position[0] - p.size[0] / 2).toBeGreaterThanOrEqual(x + 0.018)
      expect(p.position[0] + p.size[0] / 2).toBeLessThanOrEqual(
        x + config.r.main.w[s] / 100 - 0.018 + 1e-8,
      )
      expect(p.size[2]).toBeLessThan(config.d.d / 100 - 0.04)
      const bottom = baseHeight(config) / 100 + config.r.main.g[s].h.slice(0, i).reduce((a, b) => a + b, 0) / 100
      expect(p.position[1] - p.size[1] / 2).toBeGreaterThanOrEqual(bottom)
      expect(p.position[1] + p.size[1] / 2).toBeLessThanOrEqual(
        bottom + config.r.main.g[s].h[i] / 100,
      )
    }
    expect(layoutProps(config, true).length).toBeLessThanOrEqual(first.length)
  })
  it('never invents kitchen hangers or mixes dishes into a wardrobe', () => {
    expect(Object.values(productPropSets.mutfak).flat()).not.toContain('shoes')
    expect(productPropSets.mutfak.hanging).toEqual([])
    expect(Object.values(productPropSets.gardirop).flat()).not.toContain('plates')
    const c = defaultConfig('mutfak')
    c.r.main.g.forEach((g) => g.ic.fill('aski'))
    expect(layoutProps(c)).toEqual([])
  })
  it('omits oversized items and respects shelf gaps at extreme dimensions', () => {
    expect(
      fitProps(['coat', 'pot'], {
        x: 0,
        bottom: 0,
        width: 0.3,
        height: 0.05,
        depth: 0.2,
        cell: '0-0',
        zone: 'middle',
      }),
    ).toEqual([])
    expect(shelfCount('ayakkabi', -1, 0.9)).toBe(3)
    const config: Config = defaultConfig('ozel')
    config.d.d = 20
    for (const p of layoutProps(config)) expect(p.size[2] + 0.05).toBeLessThanOrEqual(0.16)
  })
})
