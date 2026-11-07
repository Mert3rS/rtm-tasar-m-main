import { z } from 'zod'

export const kitchenKinds = [
  'door',
  'drawers',
  'oven',
  'sink',
  'dishwasher',
  'glass',
  'open',
  'hood',
] as const
export const kitchenRowNames = {
  lower: 'Alt dolaplar',
  upper: 'Üst dolaplar',
  returnLower: 'Dönüş · alt dolaplar',
  returnUpper: 'Dönüş · üst dolaplar',
} as const
export type KitchenRowKey = keyof typeof kitchenRowNames
export type KitchenSelection = { row: KitchenRowKey; index: number }
export const kitchenKindNames: Record<(typeof kitchenKinds)[number], string> = {
  door: 'Kapaklı',
  drawers: 'Çekmeceli',
  oven: 'Ankastre fırın',
  sink: 'Evye dolabı',
  dishwasher: 'Bulaşık makinesi',
  glass: 'Cam vitrin',
  open: 'Açık raf',
  hood: 'Davlumbaz',
}
export const kitchenGlassTypes = ['seffaf', 'fume', 'buzlu', 'yivli'] as const
export const kitchenRowSchema = z
  .object({
    w: z.array(z.number().finite().min(30).max(600)).min(1).max(8),
    lk: z.array(z.boolean()).min(1).max(8),
    t: z.array(z.enum(kitchenKinds)).min(1).max(8),
    glass: z.array(z.enum(kitchenGlassTypes)).min(1).max(8),
  })
  .strict()
  .refine(
    (row) => [row.lk, row.t, row.glass].every((values) => values.length === row.w.length),
    'Mutfak modül dizileri tutarsız.',
  )
export const kitchenModulesSchema = z
  .object({
    lower: z.array(z.enum(kitchenKinds)).min(1).max(8),
    upper: kitchenRowSchema,
    returnLower: kitchenRowSchema,
    returnUpper: kitchenRowSchema,
    hob: z
      .object({ row: z.enum(['lower', 'returnLower']), index: z.number().int().min(0).max(7) })
      .strict()
      .nullable(),
  })
  .strict()
export type KitchenRow = z.infer<typeof kitchenRowSchema>
export type KitchenModules = z.infer<typeof kitchenModulesSchema>
export type KitchenKind = (typeof kitchenKinds)[number]

export function createKitchenRow(widths: number[], kinds?: KitchenKind[]): KitchenRow {
  return {
    w: [...widths],
    lk: widths.map(() => false),
    t: kinds ?? widths.map(() => 'door'),
    glass: widths.map(() => 'fume'),
  }
}
export function defaultKitchenModules(): KitchenModules {
  return {
    lower: ['drawers', 'oven', 'door', 'door', 'sink', 'dishwasher'],
    upper: createKitchenRow(
      [60, 60, 60, 60, 60, 60],
      ['glass', 'hood', 'door', 'door', 'door', 'glass'],
    ),
    returnLower: createKitchenRow([60, 60, 60]),
    returnUpper: createKitchenRow([60, 60, 60]),
    hob: { row: 'lower', index: 1 },
  }
}
