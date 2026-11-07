import { NextRequest, NextResponse } from 'next/server'
import { allowBuckets, boundedJson, sameOrigin } from '@/lib/inquirySecurity'
import { getPublicPayload } from '@/lib/projectData'
import { getRecommendations } from '@/lib/personalization/recommendations'
import { recommendationRequestSchema } from '@/lib/personalization/schema'
import { requestHasConsent } from '@/lib/consent/server'

export const runtime = 'nodejs'
const reply = (body: object, status: number) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

/**
 * Interest-based cards. Input is validated and used only to build this response; the request is
 * neither logged nor stored. Requires the Personalisation consent cookie.
 */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return reply({ ok: false }, 403)
  let raw: unknown
  try {
    raw = await boundedJson(request, 4096)
  } catch {
    return reply({ ok: false }, 400)
  }
  const parsed = recommendationRequestSchema.safeParse(raw)
  if (!parsed.success) return reply({ ok: false }, 400)
  try {
    if (!(await requestHasConsent(request, 'personalization'))) return reply({ ok: false }, 403)
    const payload = await getPublicPayload()
    const allowed = await allowBuckets(
      payload,
      request,
      [{ identity: 'recommendations:global', limit: 600, seconds: 60 }],
      { prefix: 'recommendations', limit: 60, seconds: 60 },
    )
    if (!allowed) return reply({ ok: false }, 429)
    return reply({ ok: true, cards: await getRecommendations(parsed.data) }, 200)
  } catch {
    return reply({ ok: false }, 503)
  }
}
