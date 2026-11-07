import 'server-only'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { isIP } from 'node:net'
import type { Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { productionSiteUrl } from './seo'

export const visitorCookie = 'rtm-inquiry-visitor'
export const maxBodyBytes = 24 * 1024

export function digest(value: string) {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('Missing server configuration')
  return createHmac('sha256', secret).update(`inquiry:${value}`).digest('hex')
}

export function allowedOrigin(request: Request) {
  const production = productionSiteUrl()?.origin
  if (process.env.NODE_ENV === 'production') return production
  const url = new URL(request.url)
  return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ? url.origin : production
}

export function sameOrigin(request: Request, requireHeader = true) {
  const expected = allowedOrigin(request)
  const supplied = request.headers.get('origin')
  return Boolean(
    expected &&
    ((!requireHeader && !supplied) || supplied === expected) &&
    !['cross-site', 'same-site'].includes(request.headers.get('sec-fetch-site') || ''),
  )
}

export function newVisitor() {
  return randomBytes(24).toString('base64url')
}
export function validVisitor(value: string | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9_-]{32}$/.test(value))
}

export function formToken(visitor: string, now = Date.now()) {
  const timestamp = String(now)
  return `${timestamp}.${digest(`token:${visitor}:${timestamp}`)}`
}

export function validFormToken(value: unknown, visitor: string, now = Date.now()) {
  if (typeof value !== 'string' || !/^\d{13}\.[a-f0-9]{64}$/.test(value)) return false
  const timestamp = Number(value.split('.')[0])
  if (timestamp > now || now - timestamp > 60 * 60 * 1000) return false
  const expected = Buffer.from(formToken(visitor, timestamp))
  return timingSafeEqual(Buffer.from(value), expected)
}

export async function boundedJson(request: Request, limit = maxBodyBytes): Promise<unknown> {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new Error('Invalid content type')
  if (Number(request.headers.get('content-length') || 0) > limit) throw new Error('Body too large')
  const reader = request.body?.getReader()
  if (!reader) throw new Error('Empty body')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > limit) {
        await reader.cancel()
        throw new Error('Body too large')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export async function consumeRateLimit(
  payload: Payload,
  identity: string,
  limit: number,
  seconds: number,
) {
  const window = Math.floor(Date.now() / (seconds * 1000))
  const bucket = digest(`limit:${identity}:${window}`)
  const expires = new Date((window + 1) * seconds * 1000).toISOString()
  // Atomic PostgreSQL UPSERT: shared across all instances, no count/read race.
  const result = await payload.db.drizzle.execute(sql`
    INSERT INTO form_rate_limits (bucket, count, expires_at)
    VALUES (${bucket}, 1, ${expires})
    ON CONFLICT (bucket) DO UPDATE SET count = form_rate_limits.count + 1
    WHERE form_rate_limits.count < ${limit}
    RETURNING id
  `)
  return result.rows.length > 0
}

export async function allowSubmission(
  payload: Payload,
  request: Request,
  visitor: string,
  email: string,
) {
  await pruneRateLimits(payload)
  if (!(await consumeRateLimit(payload, 'global', 120, 60))) return false
  if (!(await consumeRateLimit(payload, `visitor:${visitor}`, 5, 900))) return false
  // The explicit design-quote variant permits no email. Do not put all such visitors in
  // a single shared empty-email bucket; visitor/IP/global limits still apply unchanged.
  if (email && !(await consumeRateLimit(payload, `email:${email}`, 3, 900))) return false
  const client = trustedClientIp(request)
  if (client.configured) {
    if (!client.ip) return false
    if (!(await consumeRateLimit(payload, `ip:${client.ip}`, 10, 900))) return false
  }
  return true
}

/** Remove expired fixed-window counters; shared by every limiter. */
export async function pruneRateLimits(payload: Payload) {
  await payload.db.drizzle.execute(sql`DELETE FROM form_rate_limits WHERE expires_at < now()`)
}

/**
 * Client IP only from a header the trusted proxy strips/replaces (INQUIRY_CLIENT_IP_HEADER).
 * Arbitrary X-Forwarded-For is never trusted. Raw IPs are only hashed into rate-limit buckets.
 * A configured but missing/invalid header means the request is rejected by callers.
 */
export function trustedClientIp(request: Request): { configured: boolean; ip?: string } {
  const header = process.env.INQUIRY_CLIENT_IP_HEADER
  if (header !== 'cf-connecting-ip' && header !== 'x-real-ip') return { configured: false }
  const ip = request.headers.get(header)?.trim()
  return { configured: true, ip: ip && isIP(ip) ? ip : undefined }
}

/** Generic multi-bucket check: every bucket must accept, evaluated in order. */
export async function allowBuckets(
  payload: Payload,
  request: Request,
  buckets: { identity: string; limit: number; seconds: number }[],
  ipLimit?: { prefix: string; limit: number; seconds: number },
) {
  await pruneRateLimits(payload)
  for (const bucket of buckets)
    if (!(await consumeRateLimit(payload, bucket.identity, bucket.limit, bucket.seconds)))
      return false
  if (ipLimit) {
    const client = trustedClientIp(request)
    if (client.configured) {
      if (!client.ip) return false
      if (
        !(await consumeRateLimit(
          payload,
          `${ipLimit.prefix}:ip:${client.ip}`,
          ipLimit.limit,
          ipLimit.seconds,
        ))
      )
        return false
    }
  }
  return true
}
