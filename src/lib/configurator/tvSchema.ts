import { z } from 'zod'

export const tvLowerKinds = ['door', 'drawers', 'lift', 'open'] as const
export const tvUpperKinds = ['tower', 'glass', 'open', 'slats', 'tv'] as const
export const tvKindNames = {
  door: 'Kapaklı',
  drawers: 'Çekmeceli',
  lift: 'Yukarı açılır kapak',
  open: 'Açık raf',
  tower: 'Boy dolabı',
  glass: 'Cam vitrin',
  slats: 'Dikey çıta paneli',
  tv: 'TV alanı',
}
export type TvSelection = { row: 'lower' | 'upper'; index: number }
export const tvUnitSchema = z
  .object({
    lower: z.array(z.enum(tvLowerKinds)).min(1).max(8),
    drawers: z.array(z.number().int().min(2).max(3)).min(1).max(8),
    shelves: z.array(z.number().int().min(0).max(3)).min(1).max(8),
    upper: z
      .object({
        w: z.array(z.number().finite().min(30).max(500)).min(1).max(8),
        lk: z.array(z.boolean()).min(1).max(8),
        t: z.array(z.enum(tvUpperKinds)).min(1).max(8),
        glass: z
          .array(z.enum(['seffaf', 'fume', 'buzlu', 'yivli']))
          .min(1)
          .max(8),
        shelves: z.array(z.number().int().min(1).max(5)).min(1).max(8),
      })
      .strict()
      .refine(
        (row) =>
          [row.lk, row.t, row.glass, row.shelves].every((array) => array.length === row.w.length),
        'TV üst bölüm dizileri tutarsız.',
      ),
    upperHeight: z.number().finite().min(90).max(230),
    upperDepth: z.number().finite().min(20).max(40),
    floorGap: z.number().finite().min(15).max(35),
    backdrop: z.enum(['plain', 'stone', 'slats']),
    frameLed: z.boolean(),
    soundbar: z.boolean(),
    cableChannel: z.boolean(),
  })
  .strict()
  .refine(
    (v) => [v.drawers, v.shelves].every((array) => array.length === v.lower.length),
    'TV alt ünite dizileri tutarsız.',
  )
export type TvOptions = z.infer<typeof tvUnitSchema>
export function defaultTvUnit(): TvOptions {
  return {
    lower: ['door', 'drawers', 'drawers', 'door'],
    drawers: [2, 2, 2, 2],
    shelves: [1, 1, 1, 1],
    upper: {
      w: [40, 160, 40],
      lk: [false, false, false],
      t: ['slats', 'tv', 'glass'],
      glass: ['fume', 'fume', 'fume'],
      shelves: [3, 3, 3],
    },
    upperHeight: 160,
    upperDepth: 28,
    floorGap: 20,
    backdrop: 'stone',
    frameLed: true,
    soundbar: true,
    cableChannel: true,
  }
}
export function tvFitError(
  t: TvOptions,
  widths: number[],
  height: number,
  depth: number,
  base: number,
  inches: number,
): string | undefined {
  if (
    widths.length !== t.lower.length ||
    Math.abs(widths.reduce((a, n) => a + n, 0) - t.upper.w.reduce((a, n) => a + n, 0)) > 0.011
  )
    return 'TV ünitesinin alt ve üst genişlik toplamları eşleşmiyor.'
  const screen = t.upper.t.flatMap((kind, index) => (kind === 'tv' ? [index] : []))
  if (screen.length !== 1) return 'Üst bölümde tek bir TV alanı bulunmalı.'
  if (t.upper.w[screen[0]] < inches * 2.214 + 8 || t.upperHeight < inches * 1.245 + 24)
    return `${inches} inç TV için alan yetersiz. TV alanını veya üst yüksekliği artırın.`
  if (height < 35 || height > 90 || depth < 25 || depth > 65 || t.upperDepth > depth)
    return 'TV alt ünitesi 35–90 cm yüksek, 25–65 cm derin olmalı. Üst derinlik alt üniteden fazla olamaz.'
  if (t.lower.some((kind, i) => kind === 'drawers' && (height - base - 2) / t.drawers[i] < 10))
    return 'Çekmece yüksekliği yetersiz. Çekmece sayısını azaltın.'
}
