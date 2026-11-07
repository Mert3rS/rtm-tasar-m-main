import {
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  TorusGeometry,
  Shape,
  ExtrudeGeometry,
  LatheGeometry,
  Vector2,
  type Matrix4,
  type BufferGeometry,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { PropKind } from './catalog'

type Vec = [number, number, number]
export type Form = 'box' | 'softBox' | 'cylinder' | 'sphere' | 'ring' | 'garment' | 'dish' | 'bowl' | 'cup' | 'vessel' | 'leaf'
export type Part = { form: Form; p: Vec; s: Vec; tone: number; rotation?: Vec; matrix?: Matrix4 }
const part = (form: Form, p: Vec, s: Vec, tone = 0, rotation?: Vec): Part => ({
  form,
  p,
  s,
  tone,
  rotation,
})
const box = (p: Vec, s: Vec, tone = 0) => part('box', p, s, tone)
const soft = (p: Vec, s: Vec, tone = 0) => part('softBox', p, s, tone)
const cyl = (p: Vec, s: Vec, tone = 0) => part('cylinder', p, s, tone)
const ring = (p: Vec, s: Vec, tone = 0, rotation?: Vec) => part('ring', p, s, tone, rotation)
const bottle = (pump = false): Part[] => [
  cyl([0, -0.12, 0], [0.76, 0.74, 0.76]),
  cyl([0, 0.3, 0], [0.35, 0.16, 0.35], 2),
  box([pump ? 0.08 : 0, 0.43, 0], [pump ? 0.65 : 0.4, 0.12, 0.35], 2),
]
const basket = (): Part[] => [
  soft([0, -0.45, 0], [0.98, 0.1, 0.98], 6),
  ...Array.from({ length: 7 }, (_, i) => [
    soft([0, -0.4 + i * 0.13, -0.46], [0.98, 0.065, 0.06], 6),
    soft([0, -0.4 + i * 0.13, 0.46], [0.98, 0.065, 0.06], 6),
    soft([-0.46, -0.4 + i * 0.13, 0], [0.06, 0.065, 0.98], 6),
    soft([0.46, -0.4 + i * 0.13, 0], [0.06, 0.065, 0.98], 6),
  ]).flat(),
  ...[-0.3, 0, 0.3].flatMap((x) => [box([x, 0, 0.465], [0.025, 0.86, 0.015], 3), box([x, 0, -0.465], [0.025, 0.86, 0.015], 3)]),
]
const linen = (tone: number, count = 3): Part[] => Array.from({ length: count }, (_, i) => {
  const y = -0.5 + (i + 0.5) / count
  return [
    soft([0, y, 0], [0.94 - i * 0.025, 0.85 / count, 0.94 - i * 0.025], i === 1 ? 0 : tone),
    box([0, y - 0.06 / count, 0.465 - i * 0.0125], [0.82 - i * 0.025, 0.018 / count, 0.009], 1),
    box([0.32, y, 0.47 - i * 0.0125], [0.012, 0.7 / count, 0.009], 1),
  ]
}).flat()

/** Small reusable recipes in a unit bounding box; physical size comes from the catalog. */
export function propRecipe(kind: PropKind, variant = 0): Part[] {
  const textile = [0, 5, 7, 6][variant % 4]
  switch (kind) {
    case 'plates':
      return Array.from({ length: 5 }, (_, i) => part('dish', [0, -0.39 + i * 0.19, 0], [0.96, 0.18, 0.96], 0))
    case 'bowls':
      return [0, 1, 2].map((i) => part('bowl', [0, -0.2 + i * 0.2, 0], [0.78 + i * 0.08, 0.55, 0.78 + i * 0.08], i === 1 ? 5 : 0))
    case 'glass':
      return [part('cup', [0, 0, 0], [0.9, 0.96, 0.9], 9), cyl([0, -0.46, 0], [0.76, 0.035, 0.76], 9)]
    case 'mug':
      return [part('cup', [-0.1, 0, 0], [0.68, 0.9, 0.93], variant % 2 ? 5 : 0), ring([0.28, 0.02, 0], [0.46, 0.66, 0.5], variant % 2 ? 5 : 0)]
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
          kind === 'coat' ? (variant % 2 ? 6 : 7) : textile,
        ),
        ring([0, 0.44, 0], [0.13, 0.1, 0.25], 2),
        part('box', [-0.17, 0.32, 0], [0.37, 0.018, 0.14], 3, [0, 0, 0.25]),
        part('box', [0.17, 0.32, 0], [0.37, 0.018, 0.14], 3, [0, 0, -0.25]),
        // Collar, placket and pockets remain legible when doors are opened.
        part('softBox', [-0.07, 0.32, 0.39], [0.13, 0.13, 0.045], 1, [0, 0, 0.35]),
        part('softBox', [0.07, 0.32, 0.39], [0.13, 0.13, 0.045], 1, [0, 0, -0.35]),
        box([0, -0.03, 0.414], [0.016, 0.62, 0.015], 1),
        ...[-0.22, -0.04, 0.14].map((y) => part('sphere', [0.012, y, 0.433], [0.02, 0.013, 0.025], 2)),
        ...(kind !== 'hanger' ? [soft([0.13, 0.08, 0.42], [0.12, 0.13, 0.014], 1)] : []),
      ]
    case 'folded':
    case 'towels':
    case 'handTowels':
    case 'blankets':
    case 'scarf':
      return linen(kind === 'towels' || kind === 'handTowels' ? (variant % 2 ? 5 : 0) : textile)
    case 'trousers':
      return [...linen(7, 2), box([0, 0.02, 0.46], [0.025, 0.85, 0.02], 2)]
    case 'shoes':
    case 'boots':
      return [-0.26, 0.26].flatMap((x) => [
        soft([x, -0.2, -0.01], [0.43, 0.5, 0.94], kind === 'boots' ? 6 : 0),
        part('sphere', [x, -0.13, 0.19], [0.42, 0.48, 0.56], kind === 'boots' ? 6 : 0),
        soft([x, -0.44, 0], [0.44, 0.1, 0.98], 1),
        ...[-0.13, -0.03, 0.07].map((z) => box([x, 0.055, z], [0.29, 0.018, 0.022], 1)),
        ...(kind === 'boots' ? [soft([x, 0.15, -0.25], [0.4, 0.68, 0.42], 6)] : []),
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
      return [soft([0, -0.12, 0], [0.94, 0.72, 0.85], 6), ring([0, 0.27, 0], [0.58, 0.45, 0.55], 6), box([0, 0.05, 0.432], [0.13, 0.08, 0.015], 10), box([0, -0.12, 0.435], [0.012, 0.6, 0.012], 1)]
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
    case 'soapSet':
      return [
        soft([0, -0.43, 0], [0.96, 0.1, 0.92], 6),
        cyl([-0.24, -0.06, 0], [0.35, 0.65, 0.65], 8),
        box([-0.2, 0.35, 0], [0.33, 0.1, 0.22], 2),
        soft([0.24, -0.2, 0.02], [0.34, 0.38, 0.62], 0),
        box([-0.24, -0.04, 0.33], [0.2, 0.12, 0.009], 0),
      ]
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
          [7, 0, 5, 6, 1][i],
        ),
        box([-0.4 + i * 0.2, 0.27, 0.485], [0.1, 0.035, 0.015], 0),
      ]).flat()
    case 'booksHorizontal':
      return [0, 1, 2].flatMap((i) => [
        soft([i % 2 ? 0.025 : -0.015, -0.33 + i * 0.31, 0], [0.93 - (i % 2) * 0.05, 0.27, 0.91], [6, 7, 5][i]),
        box([i % 2 ? 0.025 : -0.015, -0.33 + i * 0.31, 0.46], [0.87 - (i % 2) * 0.05, 0.18, 0.012], 0),
      ])
    case 'candle':
      return [part('cup', [0, -0.06, 0], [0.92, 0.86, 0.92], 8), cyl([0, 0.25, 0], [0.73, 0.06, 0.73], 0), box([0, 0.31, 0], [0.018, 0.08, 0.018], 2)]
    case 'vase':
      return [part('vessel', [0, 0, 0], [0.96, 0.98, 0.96], variant % 2 ? 8 : 0)]
    case 'sculpture':
      return [box([0, -0.44, 0], [0.9, 0.12, 0.9], 3), ring([0, 0.07, 0], [0.85, 0.85, 0.8], 1)]
    case 'plant':
      return [
        part('bowl', [0, -0.28, 0], [0.65, 0.43, 0.65], 8),
        cyl([0, -0.12, 0], [0.5, 0.015, 0.5], 3),
        box([0, 0.06, 0], [0.04, 0.57, 0.04], 4),
        ...[-1, 1].flatMap((side) => [
          part('leaf', [side * 0.21, 0.1, 0], [0.5, 0.18, 0.35], 4),
          part('leaf', [side * 0.12, 0.35, 0], [0.38, 0.27, 0.3], 4),
          part('leaf', [0, 0.23, side * 0.18], [0.18, 0.3, 0.4], 5),
        ]),
      ]
    case 'console':
      return [soft([0, 0, 0], [0.97, 0.9, 0.95], 0), box([0, 0.05, 0.48], [0.86, 0.08, 0.025], 2), cyl([0.36, -0.12, 0.485], [0.025, 0.025, 0.015], 5)]
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
        soft([0, -0.04, 0], [0.96, 0.87, 0.96], 6),
        soft([0, 0.43, 0], [1, 0.14, 1], 1),
        box([0, 0.04, 0.49], [0.4, 0.2, 0.015], 0),
      ]
  }
}
export function createPropGeometry(form: Form): BufferGeometry {
  if (form === 'box') return new BoxGeometry(1, 1, 1)
  if (form === 'softBox') return new RoundedBoxGeometry(1, 1, 1, 2, 0.08)
  if (form === 'cylinder') return new CylinderGeometry(0.5, 0.5, 1, 20)
  if (form === 'sphere' || form === 'leaf') return new SphereGeometry(0.5, 16, 10)
  if (form === 'ring') return new TorusGeometry(0.38, 0.08, 8, 24)
  if (form === 'dish' || form === 'bowl' || form === 'cup' || form === 'vessel') {
    const profile = form === 'dish'
      ? [[0, -0.45], [0.25, -0.45], [0.36, -0.28], [0.49, 0.24], [0.49, 0.4], [0.44, 0.43], [0.32, -0.04], [0, -0.1]]
      : form === 'bowl'
        ? [[0, -0.48], [0.22, -0.48], [0.34, -0.31], [0.45, 0.06], [0.49, 0.45], [0.45, 0.48], [0.39, 0.07], [0.28, -0.26], [0, -0.33]]
        : form === 'cup'
          ? [[0, -0.49], [0.36, -0.49], [0.42, -0.44], [0.48, 0.46], [0.46, 0.49], [0.43, 0.46], [0.37, -0.37], [0, -0.39]]
          : [[0, -0.49], [0.3, -0.49], [0.44, -0.38], [0.49, -0.1], [0.43, 0.16], [0.23, 0.3], [0.21, 0.48], [0.16, 0.49], [0.16, 0.29], [0.33, 0.1], [0.38, -0.12], [0, -0.38]]
    return new LatheGeometry(profile.map(([radius, height]) => new Vector2(radius, height)), 24)
  }
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
  const geometry = new ExtrudeGeometry(shape, { depth: 0.86, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.05, bevelSegments: 2 })
  geometry.translate(0, 0, -0.43)
  return geometry
}
