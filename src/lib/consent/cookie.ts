import { z } from 'zod'
import type { OptionalCategory } from './registry'

/** Shared by the server layout, route handlers and the browser. No secrets or personal data. */
export const CONSENT_COOKIE = 'rtm-consent'
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365
/** Effective version while no approved cookie policy exists: only necessary storage runs. */
export const UNCONFIGURED_POLICY = 'unconfigured'
export const policyVersionPattern = /^[A-Za-z0-9._-]{1,32}$/

export type ConsentChoices = Record<OptionalCategory, boolean>
export type ConsentRecord = {
  /** Policy version the visitor answered. */
  v: string
  c: ConsentChoices
  /** ISO date of the decision. */
  t: string
  /** Random anonymous consent id (no link to identity). */
  id: string
}
export type ConsentSource = 'banner' | 'preferences' | 'revoke'

const bit = z.union([z.literal(0), z.literal(1)])
const cookieSchema = z
  .object({
    v: z.string().regex(policyVersionPattern),
    c: z.object({ f: bit, p: bit, a: bit, m: bit }).strict(),
    t: z.iso.datetime(),
    id: z.string().regex(/^[A-Za-z0-9_-]{16,40}$/),
  })
  .strict()

export const noOptionalConsent: ConsentChoices = {
  functional: false,
  personalization: false,
  analytics: false,
  marketing: false,
}

export function serializeConsent(record: ConsentRecord) {
  return encodeURIComponent(
    JSON.stringify({
      v: record.v,
      c: {
        f: record.c.functional ? 1 : 0,
        p: record.c.personalization ? 1 : 0,
        a: record.c.analytics ? 1 : 0,
        m: record.c.marketing ? 1 : 0,
      },
      t: record.t,
      id: record.id,
    }),
  )
}

export function parseConsent(raw: string | undefined | null): ConsentRecord | null {
  if (!raw || raw.length > 600) return null
  try {
    const parsed = cookieSchema.safeParse(JSON.parse(decodeURIComponent(raw)))
    if (!parsed.success) return null
    const { v, c, t, id } = parsed.data
    return {
      v,
      t,
      id,
      c: {
        functional: c.f === 1,
        personalization: c.p === 1,
        analytics: c.a === 1,
        marketing: c.m === 1,
      },
    }
  } catch {
    return null
  }
}

/**
 * A stored decision only counts for the currently effective policy version.
 * Without an approved policy every optional category is forced off.
 */
export function effectiveConsent(record: ConsentRecord | null, policyVersion: string) {
  const decided = Boolean(record && record.v === policyVersion)
  const choices: ConsentChoices =
    decided && record && policyVersion !== UNCONFIGURED_POLICY
      ? { ...record.c, marketing: false }
      : { ...noOptionalConsent }
  return { decided, choices }
}

export function readCookieValue(cookieHeader: string, name: string) {
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return undefined
}
