import { z } from 'zod'

/** /api/recommendations input: at most 10 slugs of allowed public types. */
const slug = z
  .string()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const kind = z.enum(['project', 'model', 'service', 'showroom'])

export const recommendationRequestSchema = z
  .object({
    items: z.array(z.object({ type: kind, slug }).strict()).max(10).default([]),
    projectCategories: z.array(slug).max(5).default([]),
    modelCategories: z.array(slug).max(5).default([]),
    cities: z.array(slug).max(5).default([]),
    countries: z.array(slug).max(3).default([]),
    exclude: z.object({ type: kind, slug }).strict().optional(),
    limit: z.number().int().min(1).max(4).default(4),
  })
  .strict()
export type RecommendationRequest = z.infer<typeof recommendationRequestSchema>
