import {
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  TorusGeometry,
  Shape,
  ExtrudeGeometry,
  type Matrix4,
  type BufferGeometry,
} from 'three'
import type { PropKind } from './catalog'

type Vec = [number, number, number]
export type Form = 'box' | 'cylinder' | 'sphere' | 'ring' | 'garment'
export type Part = { form: Form; p: Vec; s: Vec; tone: number; rotation?: Vec; matrix?: Matrix4 }
const part = (form: Form, p: Vec, s: Vec, tone = 0, rotation?: Vec): Part => ({
  form,
  p,
  s,
  tone,
  rotation,
})
const box = (p: Vec, s: Vec, tone = 0) => part('box', p, s, tone)
const cyl = (p: Vec, s: Vec, tone = 0) => part('cylinder', p, s, tone)
const ring = (p: Vec, s: Vec, tone = 0, rotation?: Vec) => part('ring', p, s, tone, rotation)
const stack = (count: number, form: Form = 'box', tone = 0): Part[] =>
  Array.from({ length: count }, (_, i) =>
    part(form, [0, -0.5 + (i + 0.5) / count, 0], [0.94, 0.85 / count, 0.94], tone + (i % 2)),
  )
const bottle = (pump = false): Part[] => [
  cyl([0, -0.12, 0], [0.76, 0.74, 0.76]),
  cyl([0, 0.3, 0], [0.35, 0.16, 0.35], 2),
  box([pump ? 0.08 : 0, 0.43, 0], [pump ? 0.65 : 0.4, 0.12, 0.35], 2),
]
const basket = (): Part[] => [
  box([0, -0.45, 0], [1, 0.1, 1], 3),
  ...Array.from({ length: 7 }, (_, i) => [
    box([0, -0.4 + i * 0.13, -0.46], [1, 0.07, 0.06], 3),
    box([0, -0.4 + i * 0.13, 0.46], [1, 0.07, 0.06], 3),
    box([-0.46, -0.4 + i * 0.13, 0], [0.06, 0.07, 1], 3),
    box([0.46, -0.4 + i * 0.13, 0], [0.06, 0.07, 1], 3),
  ]).flat(),
]

/** Small reusable recipes in a unit bounding box; physical size comes from the catalog. */
export function propRecipe(kind: PropKind): Part[] {
  switch (kind) {
    case 'plates':
      return stack(4, 'cylinder')
    case 'bowls':
      return [0, 1, 2].flatMap((i) => [
        cyl([0, -0.37 + i * 0.27, 0], [0.65 + i * 0.1, 0.18, 0.65 + i * 0.1]),
        ring([0, -0.27 + i * 0.27, 0], [0.72 + i * 0.1, 0.72 + i * 0.1, 0.12], 0, [
          Math.PI / 2,
          0,
          0,
        ]),
      ])
    case 'glass':
      return [cyl([0, 0, 0], [0.85, 1, 0.85], 1), cyl([0, 0.49, 0], [0.65, 0.02, 0.65], 2)]
    case 'mug':
      return [cyl([-0.1, 0, 0], [0.68, 0.9, 0.95]), ring([0.27, 0.03, 0], [0.48, 0.6, 0.7], 0)]
    case 'jar':
      return [
        cyl([0, -0.04, 0], [0.85, 0.88, 0.85], 1),
        cyl([0, 0.43, 0], [0.95, 0.12, 0.95], 3),
        box([0, -0.02, 0.431], [0.48, 0.25, 0.015], 0),
      ]
    case 'spices':
      return [-0.34, 0, 0.34].flatMap((x) => [
        cyl([x, -0.04, 0], [0.27, 0.8, 0.85], 3),
        cyl([x, 0.41, 0], [0.29, 0.12, 0.9], 2),
      ])
    case 'bottle':
      return bottle()
    case 'pot':
      return [
        cyl([0, -0.06, 0], [0.78, 0.75, 0.95], 1),
        cyl([0, 0.34, 0], [0.8, 0.08, 0.98], 2),
        cyl([0, 0.44, 0], [0.15, 0.1, 0.18], 2),
        box([-0.44, 0.08, 0], [0.12, 0.1, 0.3], 2),
        box([0.44, 0.08, 0], [0.12, 0.1, 0.3], 2),
      ]
    case 'pan':
      return [
        cyl([-0.17, -0.08, 0], [0.62, 0.75, 1], 2),
        box([0.29, 0.05, 0], [0.42, 0.22, 0.13], 3),
      ]
    case 'board':
      return [box([0, -0.07, 0], [0.95, 0.85, 0.9], 3), box([0, 0.42, 0], [0.22, 0.16, 0.8], 3)]
    case 'trays':
      return [-0.3, 0, 0.3].map((z) => box([0, 0, z], [0.96, 0.96, 0.13], 1))
    case 'cutlery':
      return [
        box([0, -0.43, 0], [1, 0.1, 1], 3),
        ...Array.from({ length: 4 }, (_, i) => [
          box([-0.36 + i * 0.24, -0.1, 0], [0.025, 0.4, 0.9], 2),
          part('sphere', [-0.36 + i * 0.24, 0.08, -0.3], [0.13, 0.65, 0.24], 1),
        ]).flat(),
      ]
    case 'shirt':
    case 'coat':
    case 'jacket':
    case 'hanger':
      return [
        part(
          'garment',
          [0, -0.02, 0],
          [0.96, 0.94, 0.85],
          kind === 'jacket' ? 2 : kind === 'coat' ? 3 : 0,
        ),
        ring([0, 0.43, 0], [0.17, 0.13, 0.7], 2),
        box([0, 0.31, 0], [0.72, 0.025, 0.16], 3),
      ]
    case 'folded':
    case 'towels':
    case 'blankets':
    case 'scarf':
      return stack(3, 'box', kind === 'towels' ? 0 : 1)
    case 'trousers':
      return [...stack(2), box([0, 0.02, 0.46], [0.025, 0.85, 0.02], 2)]
    case 'shoes':
    case 'boots':
      return [-0.26, 0.26].flatMap((x) => [
        box([x, -0.2, 0], [0.43, 0.5, 0.95], 2),
        part('sphere', [x, -0.13, 0.19], [0.43, 0.48, 0.56], 1),
        box([x, -0.46, 0], [0.44, 0.08, 0.98], 3),
        ...(kind === 'boots' ? [box([x, 0.15, -0.25], [0.4, 0.7, 0.42], 2)] : []),
      ])
    case 'suitcase':
      return [
        box([0, -0.04, 0], [0.95, 0.86, 0.95], 3),
        ring([0, 0.43, 0], [0.35, 0.12, 0.8], 2),
        ...[-0.3, 0.3].map((x) => box([x, 0, 0.49], [0.04, 0.7, 0.02], 2)),
      ]
    case 'sockRolls':
    case 'towelRolls':
    case 'paperRolls':
      return [-0.33, 0, 0.33].map((x) =>
        part('cylinder', [x, 0, 0], [0.3, 0.94, 0.95], kind === 'paperRolls' ? 0 : 1, [
          Math.PI / 2,
          0,
          0,
        ]),
      )
    case 'bag':
      return [box([0, -0.12, 0], [0.95, 0.72, 0.85], 3), ring([0, 0.3, 0], [0.6, 0.4, 0.7], 2)]
    case 'hat':
      return [
        cyl([0, -0.4, 0], [1, 0.15, 1], 3),
        part('sphere', [0, -0.08, 0], [0.68, 0.8, 0.68], 3),
      ]
    case 'keyBowl':
      return [
        cyl([0, -0.12, 0], [1, 0.45, 1], 1),
        ring([0, 0.14, 0], [0.96, 0.96, 0.28], 0, [Math.PI / 2, 0, 0]),
        box([0, 0.2, 0], [0.3, 0.1, 0.1], 2),
      ]
    case 'entryBasket':
    case 'bathBasket':
    case 'basket':
      return basket()
    case 'lotion':
      return bottle()
    case 'pump':
      return bottle(true)
    case 'toothbrush':
      return [
        cyl([0, -0.18, 0], [0.94, 0.64, 0.94]),
        ...[-0.2, 0.15].map((x) => box([x, 0.16, 0], [0.1, 0.68, 0.12], 3)),
      ]
    case 'grooming':
      return [
        box([0, -0.38, 0], [1, 0.14, 1], 3),
        box([-0.2, 0, 0], [0.08, 0.3, 0.8], 2),
        ...Array.from({ length: 7 }, (_, i) =>
          box([-0.2, -0.02, -0.35 + i * 0.11], [0.3, 0.2, 0.025], 2),
        ),
        part('sphere', [0.25, 0, 0.15], [0.3, 0.55, 0.4], 1),
        box([0.25, 0, -0.14], [0.1, 0.3, 0.4], 3),
      ]
    case 'tv':
      return [
        box([0, 0.04, 0], [1, 0.87, 0.36], 2),
        box([0, 0.04, 0.2], [0.95, 0.79, 0.025], 1),
        box([0, -0.44, 0], [0.4, 0.07, 1], 2),
      ]
    case 'soundbar':
      return [box([0, 0, 0], [1, 0.9, 1], 2)]
    case 'books':
    case 'folders':
      return Array.from({ length: 5 }, (_, i) => [
        box(
          [-0.4 + i * 0.2, -0.03 + (i % 2) * 0.03, 0],
          [0.16, 0.91 - (i % 2) * 0.06, 0.95],
          i % 4,
        ),
        box([-0.4 + i * 0.2, 0.27, 0.485], [0.1, 0.035, 0.015], 0),
      ]).flat()
    case 'vase':
      return [
        part('sphere', [0, -0.12, 0], [0.98, 0.72, 0.98], 1),
        cyl([0, 0.26, 0], [0.4, 0.47, 0.4], 1),
      ]
    case 'sculpture':
      return [box([0, -0.44, 0], [0.9, 0.12, 0.9], 3), ring([0, 0.07, 0], [0.85, 0.85, 0.8], 1)]
    case 'plant':
      return [
        cyl([0, -0.28, 0], [0.65, 0.43, 0.65], 3),
        box([0, 0.06, 0], [0.04, 0.57, 0.04], 4),
        ...[-1, 1].flatMap((side) => [
          part('sphere', [side * 0.21, 0.1, 0], [0.5, 0.18, 0.35], 4),
          part('sphere', [side * 0.12, 0.35, 0], [0.38, 0.27, 0.3], 4),
        ]),
      ]
    case 'console':
      return [box([0, 0, 0], [0.97, 0.9, 0.95], 0), box([0, 0.05, 0.48], [0.86, 0.08, 0.025], 2)]
    case 'mediaBox':
      return [box([0, 0, 0], [0.95, 0.85, 0.95], 2), box([0, 0.1, 0.49], [0.4, 0.06, 0.015], 1)]
    case 'remote':
      return [
        box([0, 0, 0], [0.9, 0.8, 0.98], 2),
        ...Array.from({ length: 4 }, (_, i) =>
          box([0, 0.43, -0.3 + i * 0.18], [0.35, 0.1, 0.08], 0),
        ),
      ]
    case 'storageBox':
      return [
        box([0, -0.04, 0], [0.96, 0.87, 0.96], 3),
        box([0, 0.43, 0], [1, 0.14, 1], 1),
        box([0, 0.04, 0.49], [0.4, 0.2, 0.015], 0),
      ]
  }
}
export function createPropGeometry(form: Form): BufferGeometry {
  if (form === 'box') return new BoxGeometry(1, 1, 1)
  if (form === 'cylinder') return new CylinderGeometry(0.5, 0.5, 1, 12)
  if (form === 'sphere') return new SphereGeometry(0.5, 10, 6)
  if (form === 'ring') return new TorusGeometry(0.38, 0.08, 5, 12)
  const shape = new Shape()
  shape.moveTo(-0.12, 0.48)
  for (const [x, y] of [
    [-0.28, 0.4],
    [-0.5, 0.16],
    [-0.35, 0.02],
    [-0.24, 0.18],
    [-0.25, -0.5],
    [0.25, -0.5],
    [0.24, 0.18],
    [0.35, 0.02],
    [0.5, 0.16],
    [0.28, 0.4],
    [0.12, 0.48],
    [0.06, 0.39],
    [-0.06, 0.39],
  ])
    shape.lineTo(x, y)
  shape.closePath()
  const geometry = new ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false })
  geometry.translate(0, 0, -0.5)
  return geometry
}
