import { z } from 'zod'

export const wardrobeLayouts = [
  'long',
  'short',
  'double',
  'drawers',
  'shelves',
  'trousers',
  'shoes',
] as const
export const wardrobeDoors = ['solid', 'mirror', 'glass', 'open'] as const
export const wardrobeGlass = ['seffaf', 'fume', 'buzlu', 'yivli'] as const
export const wardrobeLayoutNames: Record<(typeof wardrobeLayouts)[number], string> = {
  long: 'Uzun askı',
  short: 'Kısa askı + raf',
  double: 'Çift askı',
  drawers: 'Askı + çekmece',
  shelves: 'Raflı',
  trousers: 'Pantolonluk + raf',
  shoes: 'Ayakkabılık',
}
export const wardrobeDoorNames: Record<(typeof wardrobeDoors)[number], string> = {
  solid: 'Standart kapak',
  mirror: 'Aynalı kapak',
  glass: 'Cam kapak',
  open: 'Açık bölüm',
}
export const wardrobeSchema = z
  .object({
    layouts: z.array(z.enum(wardrobeLayouts)).min(1).max(8),
    doors: z.array(z.enum(wardrobeDoors)).min(1).max(8),
    glass: z.array(z.enum(wardrobeGlass)).min(1).max(8),
    shelves: z.array(z.number().int().min(2).max(7)).min(1).max(8),
    drawers: z.array(z.number().int().min(2).max(4)).min(1).max(8),
    loft: z.boolean(),
    loftHeight: z.number().finite().min(30).max(60),
    slidingDoors: z
      .array(z.enum(['solid', 'mirror', 'glass']))
      .min(2)
      .max(4),
    slidingGlass: z.array(z.enum(wardrobeGlass)).min(2).max(4),
  })
  .strict()
  .refine(
    (value) =>
      [value.doors, value.glass, value.shelves, value.drawers].every(
        (values) => values.length === value.layouts.length,
      ) && value.slidingDoors.length === value.slidingGlass.length,
    'Gardırop bölme dizileri tutarsız.',
  )
export type WardrobeOptions = z.infer<typeof wardrobeSchema>
export function defaultWardrobe(): WardrobeOptions {
  return {
    layouts: ['short', 'drawers'],
    doors: ['solid', 'solid'],
    glass: ['fume', 'fume'],
    shelves: [4, 4],
    drawers: [3, 3],
    loft: true,
    loftHeight: 40,
    slidingDoors: ['solid', 'mirror'],
    slidingGlass: ['fume', 'fume'],
  }
}
export function wardrobeMinimumHeight(layout: WardrobeOptions['layouts'][number], drawers: number) {
  return layout === 'long' || layout === 'double'
    ? 160
    : layout === 'drawers'
      ? 90 + drawers * 20
      : layout === 'trousers'
        ? 130
        : 115
}
