import { z } from 'zod'

export const entrywayLayouts = [
  'bench',
  'hooks',
  'shoes',
  'closed',
  'shelves',
  'hanging',
  'drawers',
] as const
export const entrywayFronts = ['solid', 'mirror', 'glass', 'open'] as const
export const entrywayLayoutNames: Record<(typeof entrywayLayouts)[number], string> = {
  bench: 'Oturma + ayakkabı',
  hooks: 'Açık askılık',
  shoes: 'Ayakkabılık',
  closed: 'Kapalı depolama',
  shelves: 'Açık raf',
  hanging: 'Askı dolabı',
  drawers: 'Çekmece + depolama',
}
export const entrywayFrontNames: Record<(typeof entrywayFronts)[number], string> = {
  solid: 'Standart kapak',
  mirror: 'Aynalı kapak',
  glass: 'Cam kapak',
  open: 'Açık bölüm',
}
export const entrywaySchema = z
  .object({
    layouts: z.array(z.enum(entrywayLayouts)).min(1).max(8),
    fronts: z.array(z.enum(entrywayFronts)).min(1).max(8),
    glass: z
      .array(z.enum(['seffaf', 'fume', 'buzlu', 'yivli']))
      .min(1)
      .max(8),
    shelves: z.array(z.number().int().min(2).max(7)).min(1).max(8),
    hooks: z.array(z.number().int().min(2).max(6)).min(1).max(8),
    drawers: z.array(z.number().int().min(2).max(4)).min(1).max(8),
    slats: z.array(z.boolean()).min(1).max(8),
    benchStorage: z
      .array(z.enum(['open', 'drawer']))
      .min(1)
      .max(8),
    seatHeight: z.number().finite().min(40).max(55),
    cushion: z.boolean(),
    cushionColor: z.enum(['sand', 'stone', 'charcoal', 'olive']),
    upper: z.boolean(),
    upperHeight: z.number().finite().min(25).max(50),
  })
  .strict()
  .refine(
    (value) =>
      [
        value.fronts,
        value.glass,
        value.shelves,
        value.hooks,
        value.drawers,
        value.slats,
        value.benchStorage,
      ].every((array) => array.length === value.layouts.length),
    'Vestiyer bölme dizileri tutarsız.',
  )
export type EntrywayOptions = z.infer<typeof entrywaySchema>
export function defaultEntryway(): EntrywayOptions {
  return {
    layouts: ['bench', 'closed'],
    fronts: ['open', 'solid'],
    glass: ['fume', 'fume'],
    shelves: [4, 4],
    hooks: [4, 4],
    drawers: [3, 3],
    slats: [true, false],
    benchStorage: ['open', 'open'],
    seatHeight: 48,
    cushion: true,
    cushionColor: 'sand',
    upper: true,
    upperHeight: 30,
  }
}
export function entrywayFitError(
  entry: EntrywayOptions,
  height: number,
  base: number,
  depth: number,
): string | undefined {
  const top = height - (entry.upper ? entry.upperHeight : 0),
    available = top - base
  for (const [index, layout] of entry.layouts.entries()) {
    if (
      layout === 'bench' &&
      (top - entry.seatHeight < 80 || entry.seatHeight - (entry.cushion ? 4 : 0) - 3 - base < 18)
    )
      return `${index + 1}. oturma bölmesinde ayakkabı ve askılık alanı yetersiz. Üst bölümü veya oturma yüksekliğini değiştirin.`
    if (layout === 'hooks' && available < 115)
      return `${index + 1}. açık askılık için net iç yükseklik en az 115 cm olmalı.`
    if (layout === 'hanging' && (available < 145 || depth < 60))
      return `${index + 1}. askı dolabı için net yükseklik en az 145 cm, derinlik en az 60 cm olmalı.`
    if (layout === 'drawers' && available < entry.drawers[index] * 18 + 70)
      return `${index + 1}. çekmeceli bölüm için yükseklik yetersiz.`
    if (layout === 'shoes' && available / (entry.shelves[index] + 1) < 18)
      return `${index + 1}. ayakkabılıkta raf aralığı 18 cm altında. Raf sayısını azaltın.`
    if (['closed', 'shelves'].includes(layout) && available / (entry.shelves[index] + 1) < 12)
      return `${index + 1}. depolama bölümünde raf aralığı 12 cm altında. Raf sayısını azaltın.`
  }
}
