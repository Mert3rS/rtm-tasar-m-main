import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sql } from '@payloadcms/db-postgres'
import { allowBuckets, boundedJson, sameOrigin } from '@/lib/inquirySecurity'
import { getPublicPayload } from '@/lib/projectData'
import { getPublicSiteSettings } from '@/lib/siteSettings'

export const runtime = 'nodejs'
const reply = (body: object, status: number) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

const schema = z
  .object({
    consentId: z.string().regex(/^[A-Za-z0-9_-]{16,40}$/),
    policyVersion: z.string().regex(/^[A-Za-z0-9._-]{1,32}$/),
    choices: z
      .object({
        functional: z.boolean(),
        personalization: z.boolean(),
        analytics: z.boolean(),
        marketing: z.boolean(),
      })
      .strict(),
    source: z.enum(['banner', 'preferences', 'revoke']),
  })
  .strict()

/**
 * Anonymous consent proof. The browser decision is already effective before this call; failure
 * here never changes it. No IP, user agent or personal data is stored. Retention comes from
 * Site Settings → Çerez politikası and expired rows are removed on the next write.
 */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return reply({ ok: false }, 403)
  let raw: unknown
  try {
    raw = await boundedJson(request, 2048)
  } catch {
    return reply({ ok: false }, 400)
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return reply({ ok: false }, 400)
  const data = parsed.data
  try {
    const [payload, settings] = await Promise.all([getPublicPayload(), getPublicSiteSettings()])
    if (data.policyVersion !== settings.cookiePolicy.version) return reply({ ok: false }, 409)
    const allowed = await allowBuckets(
      payload,
      request,
      [
        { identity: 'consent:global', limit: 300, seconds: 60 },
        { identity: `consent:id:${data.consentId}`, limit: 20, seconds: 3600 },
      ],
      { prefix: 'consent', limit: 30, seconds: 3600 },
    )
    if (!allowed) return reply({ ok: false }, 429)
    const config = await payload.findGlobal({
      slug: 'site-settings',
      overrideAccess: true,
      depth: 0,
      select: { consentRecordRetentionDays: true },
    })
    const retention = Math.min(3650, Math.max(30, config.consentRecordRetentionDays || 365))
    await payload.db.drizzle.execute(
      sql`DELETE FROM consent_records WHERE decided_at < now() - make_interval(days => ${retention})`,
    )
    // Fixed collection, create only, validated fields; optional categories are forced off
    // when no approved policy exists, mirroring the browser.
    const optional = settings.cookiePolicy.ready
    await payload.create({
      collection: 'consent-records',
      overrideAccess: true,
      depth: 0,
      data: {
        consentId: data.consentId,
        policyVersion: data.policyVersion,
        functional: optional && data.choices.functional,
        personalization: optional && data.choices.personalization,
        analytics: optional && data.choices.analytics,
        marketing: false,
        source: data.source,
        decidedAt: new Date().toISOString(),
      },
    })
    return reply({ ok: true }, 201)
  } catch {
    return reply({ ok: false }, 503)
  }
}
