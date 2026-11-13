import { z } from 'zod'
import { finishSchema } from './finishSchema'

export const bathroomLowerKinds = ['sink', 'drawers', 'door', 'open', 'washer'] as const
export const bathroomUpperKinds = ['mirror', 'door', 'glass', 'open'] as const
export const bathroomKindNames = {
  sink: 'Lavabo dolabı',
  drawers: 'Çekmeceli',
  door: 'Kapaklı',
  open: 'Açık raf',
  washer: 'Çamaşır makinesi',
  mirror: 'Aynalı dolap',
  glass: 'Cam vitrin',
}
export const bathroomSideKinds = ['door', 'drawers', 'open'] as const
export type BathroomSelection = { row: 'lower' | 'upper' | 'side'; index: number }
export const bathroomSideLimits = {
  width: [30, 60], height: [100, 180], depth: [20, 40], gap: [10, 40], floorGap: [0, 60],
} as const
export const bathroomSideRecommended = {
  width: [35, 50], height: [120, 160], depth: [25, 35], gap: [15, 30], floorGap: [20, 40],
} as const
export const bathroomSideSchema = z.object({
  width: z.number().finite().min(30).max(60),
  height: z.number().finite().min(100).max(180),
  depth: z.number().finite().min(20).max(40),
  gap: z.number().finite().min(10).max(40),
  // Optional additions keep existing v2 designs and share IDs byte-for-byte compatible.
  enabled: z.boolean().optional(),
  side: z.enum(['left', 'right']).optional(),
  floorGap: z.number().finite().min(0).max(60).optional(),
  alignment: z.enum(['back', 'front']).optional(),
  interior: z.object({
    h: z.array(z.number().finite().min(18).max(180)).min(1).max(6),
    t: z.array(z.enum(bathroomSideKinds)).min(1).max(6),
    shelves: z.array(z.number().int().min(0).max(4)).min(1).max(6),
    drawers: z.array(z.number().int().min(2).max(3)).min(1).max(6),
  }).strict().refine(
    (row) => [row.t, row.shelves, row.drawers].every((array) => array.length === row.h.length),
    'Boy dolabı göz dizileri tutarsız.',
  ).optional(),
  finish: finishSchema.optional(),
}).strict().superRefine((side, ctx) => {
  const interior = side.interior
  if (!interior) return
  if (Math.abs(interior.h.reduce((a, n) => a + n, 0) - side.height) > 0.011)
    ctx.addIssue({ code: 'custom', message: 'Boy dolabı göz yükseklikleri toplamı dolap yüksekliğiyle eşleşmeli.' })
  if (interior.h.some((height, i) => height < (interior.t[i] === 'drawers' ? interior.drawers[i] * 12 + 4 : (interior.shelves[i] + 1) * 8 + 4)))
    ctx.addIssue({ code: 'custom', message: 'Boy dolabı gözünde raf veya çekmece için yeterli yükseklik bırakın.' })
})
export type BathroomSideCabinet = z.infer<typeof bathroomSideSchema>
export function defaultBathroomSideCabinet(): BathroomSideCabinet {
  return { width: 42, height: 140, depth: 30, gap: 20 }
}
export const bathroomSchema = z
  .object({
    lower: z.array(z.enum(bathroomLowerKinds)).min(1).max(8),
    drawers: z.array(z.number().int().min(2).max(3)).min(1).max(8),
    shelves: z.array(z.number().int().min(1).max(3)).min(1).max(8),
    upper: z
      .object({
        w: z.array(z.number().finite().min(30).max(180)).min(1).max(6),
        lk: z.array(z.boolean()).min(1).max(6),
        t: z.array(z.enum(bathroomUpperKinds)).min(1).max(6),
        glass: z
          .array(z.enum(['seffaf', 'fume', 'buzlu', 'yivli']))
          .min(1)
          .max(6),
        shelves: z.array(z.number().int().min(1).max(4)).min(1).max(6),
      })
      .strict()
      .refine(
        (row) =>
          [row.lk, row.t, row.glass, row.shelves].every((array) => array.length === row.w.length),
        'Üst banyo dolabı dizileri tutarsız.',
      ),
    upperEnabled: z.boolean(),
    upperHeight: z.number().finite().min(50).max(95),
    upperDepth: z.number().finite().min(14).max(26),
    gap: z.number().finite().min(32).max(65),
    floorGap: z.number().finite().min(20).max(45),
    basin: z.enum(['inset', 'vessel', 'round']),
    sinkFront: z.enum(['drawers', 'doors']),
    mirrorShape: z.enum(['rectangle', 'round', 'capsule']),
    mirrorLed: z.boolean(),
    splashback: z.boolean(),
    towelRail: z.boolean(),
    sideCabinet: bathroomSideSchema.optional(),
  })
  .strict()
  .refine(
    (value) => [value.drawers, value.shelves].every((array) => array.length === value.lower.length),
    'Alt banyo dolabı dizileri tutarsız.',
  )
export type BathroomOptions = z.infer<typeof bathroomSchema>
export function defaultBathroom(): BathroomOptions {
  return {
    lower: ['sink'],
    drawers: [2],
    shelves: [1],
    upper: {
      w: [50, 50],
      lk: [false, false],
      t: ['mirror', 'glass'],
      glass: ['fume', 'fume'],
      shelves: [2, 1],
    },
    upperEnabled: true,
    upperHeight: 70,
    upperDepth: 18,
    gap: 38,
    floorGap: 35,
    basin: 'vessel',
    sinkFront: 'drawers',
    mirrorShape: 'capsule',
    mirrorLed: true,
    splashback: true,
    towelRail: true,
  }
}
export function bathroomFitError(
  b: BathroomOptions,
  widths: number[],
  height: number,
  depth: number,
  base: number,
  floating: boolean,
): string | undefined {
  if (
    b.lower.length !== widths.length ||
    Math.abs(b.upper.w.reduce((a, n) => a + n, 0) - widths.reduce((a, n) => a + n, 0)) > 0.011
  )
    return 'Banyo dolabı sıralarının ölçüleri eşleşmiyor.'
  const sinks = b.lower.filter((kind) => kind === 'sink').length
  if (sinks < 1 || sinks > 2) return 'Bir veya iki lavabo dolabı seçin.'
  if (height < 40 || height > 95 || depth < 40 || depth > 65)
    return 'Alt banyo dolabı yüksekliği 40–95 cm, derinliği 40–65 cm olmalı.'
  const counter = (floating ? b.floorGap : 0) + height
  if (counter < 70 || counter + (b.basin === 'inset' ? 0 : 12) > 110)
    return 'Lavabo üst yüzeyi zeminden 70–110 cm arasında olmalı. Montaj veya dolap yüksekliğini değiştirin.'
  for (const [index, kind] of b.lower.entries()) {
    if (kind === 'sink' && widths[index] < 55)
      return `${index + 1}. lavabo dolabı en az 55 cm genişlik ister.`
    if (
      kind === 'washer' &&
      (widths[index] < 60 || depth < 60 || height - base - 2 < 84 || floating)
    )
      return 'Çamaşır makinesi için en az 60 cm genişlik/derinlik, 84 cm net yükseklik ve zemine oturan düzen gerekir.'
    if (
      (kind === 'drawers' || (kind === 'sink' && b.sinkFront === 'drawers')) &&
      (height - base - 2) / b.drawers[index] < 12
    )
      return `${index + 1}. bölümde çekmece yüksekliği yetersiz. Çekmece sayısını azaltın.`
  }
}
