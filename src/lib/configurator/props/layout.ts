import { baseHeight, type Config } from '../config'
import { productPropSets, propSizes, type PropKind, type PropZone } from './catalog'

export type PropPlacement = {
  kind: PropKind
  position: [number, number, number]
  size: [number, number, number]
  cell: string
  rotation?: number
}
export type PropRegion = {
  x: number
  bottom: number
  width: number
  height: number
  depth: number
  cell: string
  zone: PropZone
}
/** Same shelf count and positions as the cabinet boards. */
export function shelfCount(
  interior: Config['r']['main']['g'][number]['ic'][number],
  requested: number,
  height: number,
) {
  if (interior !== 'raf' && interior !== 'ayakkabi') return 0
  return requested === -1
    ? Math.min(10, Math.max(0, Math.floor(height / (interior === 'ayakkabi' ? 0.22 : 0.35)) - 1))
    : requested
}
export function fitProps(
  kinds: PropKind[],
  region: PropRegion,
  lowQuality = false,
): PropPlacement[] {
  const result: PropPlacement[] = []
  let left = region.x - region.width / 2 + 0.025
  const right = region.x + region.width / 2 - 0.025
  const candidates =
    region.zone === 'hanging'
      ? Array.from(
          { length: Math.min(7, Math.floor(region.width / 0.12)) },
          (_, i) => kinds[i % kinds.length],
        )
      : [...kinds, ...kinds]
  for (const kind of candidates) {
    if (!kind || (lowQuality && result.length >= 1) || result.length >= 5) break
    const hanging = region.zone === 'hanging'
    const originalSize = propSizes[kind]
    const size: [number, number, number] = hanging
      ? [originalSize[2], originalSize[1], originalSize[0]]
      : originalSize
    const [w, h, d] = size
    // 44 cm hangers face along the depth, spaced along the horizontal rail.
    const occupiedWidth = w
    if (
      h + (hanging ? 0.14 : 0.04) > region.height ||
      d + 0.05 > region.depth ||
      w + 0.05 > region.width
    )
      continue
    if (left + (hanging ? w : occupiedWidth) > right) continue
    const x = left + w / 2
    result.push({
      kind,
      size: [...size],
      cell: region.cell,
      rotation: hanging ? Math.PI / 2 : undefined,
      position: [
        x,
        hanging ? region.bottom + region.height - 0.12 - h / 2 : region.bottom + 0.018 + h / 2,
        0,
      ],
    })
    left += occupiedWidth + 0.035
  }
  return result
}
export function layoutProps(config: Config, lowQuality = false): PropPlacement[] {
  const result: PropPlacement[] = []
  const sets = productPropSets[config.m]
  const depth = config.d.d / 100
  const base = baseHeight(config) / 100
  let x = -config.d.w / 200
  config.r.main.w.forEach((width, s) => {
    const w = width / 100
    let bottom = base
    const g = config.r.main.g[s]
    g.h.forEach((height, i) => {
      const h = height / 100
      const interior = g.ic[i]
      const count = shelfCount(interior, g.rf[i], h)
      for (let level = 0; level <= count; level++) {
        const shelfHeight = h / (count + 1)
        const floor = bottom + level * shelfHeight
        const hanging = interior === 'aski'
        const zone: PropZone = hanging
          ? 'hanging'
          : g.f[i] === 'cekmece'
            ? 'drawer'
            : interior === 'ayakkabi'
              ? 'bottom'
              : floor + shelfHeight / 2 > (config.d.h / 100) * 0.72
                ? 'top'
                : floor < base + 0.12
                  ? 'bottom'
                  : 'middle'
        let kinds = sets[zone]
        if (zone === 'hanging' && (config.m === 'gardirop' || config.m === 'portmanto'))
          kinds = config.m === 'gardirop' ? (h > 1.35 ? ['coat'] : ['shirt']) : ['jacket', 'bag']
        // Drawer dividers and wire baskets reserve their physical interior space.
        const drawer = g.f[i] === 'cekmece'
        const basket = interior === 'sepet'
        const region: PropRegion = {
          x: x + w / 2,
          width: w - 0.036,
          bottom: floor + (basket ? 0.15 : drawer ? 0.04 : 0),
          height: shelfHeight - (basket ? 0.17 : drawer ? 0.07 : 0.02),
          depth: drawer ? depth * 0.7 - 0.04 : depth - 0.04,
          cell: `${s}-${i}`,
          zone,
        }
        const rotated = kinds.length
          ? kinds.map((_, j) => kinds[(j + s + i + level) % kinds.length])
          : []
        let fitted = fitProps(rotated, region, lowQuality)
        // A short gap can still hold a real lower item from this product's set.
        if (!fitted.length && zone !== 'hanging') fitted = fitProps(sets.drawer, region, lowQuality)
        result.push(...fitted)
      }
      bottom += h
    })
    x += w
  })
  if (config.m === 'tv' && config.d.w >= 80) {
    const width = Math.min(config.o.tv * 0.02214, (config.d.w / 100) * 0.75)
    result.push({
      kind: 'tv',
      position: [0, config.d.h / 100 + 0.02 + (width * 0.58) / 2, -depth * 0.2],
      size: [width, width * 0.58, 0.08],
      cell: 'surface',
    })
    if (config.d.w >= 120)
      result.push({
        kind: 'soundbar',
        position: [0, config.d.h / 100 + 0.0275, depth * 0.25],
        size: [0.6, 0.055, 0.08],
        cell: 'surface',
      })
  }
  return result.slice(0, lowQuality ? 48 : 160)
}
