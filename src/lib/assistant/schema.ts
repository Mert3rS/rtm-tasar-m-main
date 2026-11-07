import { z } from 'zod'
import { products } from '@/lib/configurator/config'
import type { EngineInput, PageContext } from './types'

export const ASSISTANT_MAX_MESSAGE = 500
export const ASSISTANT_MAX_BODY = 8 * 1024

const slug = z
  .string()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const entitiesSchema = z
  .object({
    city: slug.optional(),
    country: slug.optional(),
    projectCategory: slug.optional(),
    modelCategory: slug.optional(),
    service: slug.optional(),
    model: slug.optional(),
    project: slug.optional(),
    showroom: slug.optional(),
    product: z.enum(products).optional(),
  })
  .strict()

export const contextSchema = z
  .object({
    lastIntent: z
      .string()
      .regex(/^[a-z_:]{1,40}$/)
      .optional(),
    entities: entitiesSchema.optional(),
    turn: z.number().int().min(0).max(999).optional(),
  })
  .strict()

export const flowSchema = z
  .object({
    id: z.enum(['start', 'design', 'quote', 'examples']),
    step: z.string().regex(/^[a-z]{1,16}$/),
    value: z
      .string()
      .regex(/^[a-z0-9:-]{1,80}$/)
      .optional(),
  })
  .strict()

export const assistantRequestSchema = z
  .object({
    token: z.string().max(100),
    message: z.string().max(ASSISTANT_MAX_MESSAGE).optional(),
    flow: flowSchema.optional(),
    context: contextSchema.optional(),
    path: z.string().max(200).optional(),
  })
  .strict()
  .refine((value) => Boolean(value.message?.trim()) !== Boolean(value.flow), {
    message: 'Provide either a message or a flow step.',
  })

export const feedbackRequestSchema = z
  .object({
    token: z.string().max(100),
    answerKey: z.string().regex(/^[a-z0-9_:-]{1,80}$/),
    vote: z.enum(['up', 'down']),
  })
  .strict()

/** Server-side page context from a client path. Only known public route shapes are accepted. */
export function pageContextFromPath(path: string | undefined): PageContext | undefined {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.length > 200) return undefined
  const clean = path.split(/[?#]/)[0]
  const match = clean.match(/^\/(projeler|modeller|hizmetler|showroom)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/)
  if (match) {
    const kind = { projeler: 'project', modeller: 'model', hizmetler: 'service', showroom: 'showroom' }[
      match[1]
    ] as 'project' | 'model' | 'service' | 'showroom'
    return { kind, slug: match[2] }
  }
  if (clean === '/tasarim-olustur') return { kind: 'studio' }
  if (/^\/[a-z0-9/-]{0,80}$/.test(clean)) return { kind: 'other', path: clean }
  return undefined
}

export function engineInput(value: z.infer<typeof assistantRequestSchema>): EngineInput {
  return {
    message: value.message?.trim(),
    flow: value.flow,
    context: value.context,
    page: pageContextFromPath(value.path),
  }
}
