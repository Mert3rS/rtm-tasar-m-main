import { z } from 'zod'

export const materialSchema = z.enum([
  'Akrilik',
  'Lake',
  'Laminat',
  'Ahşap kaplama',
  'MDF boyalı',
  'MDF-lam',
  'Glossmax',
  'High gloss',
])
export const surfaceSchema = z.enum(['Mat', 'Parlak', 'Süper mat', 'Dokulu'])
export const ralSchema = z
  .string()
  .max(12)
  .regex(/^(?:|(?:RAL\s*)?\d{4}|#[a-fA-F0-9]{6})$/)
export const finishSchema = z
  .object({
    malz: materialSchema,
    yuzey: surfaceSchema,
    renk: z.string().max(30),
    ral: ralSchema,
  })
  .strict()
