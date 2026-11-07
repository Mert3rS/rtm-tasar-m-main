import { NextRequest, NextResponse } from 'next/server'
import {
  allowBuckets,
  boundedJson,
  sameOrigin,
  validFormToken,
  validVisitor,
  visitorCookie,
} from '@/lib/inquirySecurity'
import { getPublicPayload } from '@/lib/projectData'
import { getAssistantConfig } from '@/lib/assistantSettings'
import { feedbackRequestSchema } from '@/lib/assistant/schema'
import { recordFeedback } from '@/lib/assistant/analytics'
import { requestHasConsent } from '@/lib/consent/server'

export const runtime = 'nodejs'
const reply = (body: object, status: number) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

/** Anonymous 👍/👎 aggregate counter. Requires Analytics consent, checked server-side. */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return reply({ ok: false }, 403)
  let raw: unknown
  try {
    raw = await boundedJson(request, 1024)
  } catch {
    return reply({ ok: false }, 400)
  }
  const parsed = feedbackRequestSchema.safeParse(raw)
  const visitor = request.cookies.get(visitorCookie)?.value
  if (!parsed.success || !validVisitor(visitor) || !validFormToken(parsed.data.token, visitor))
    return reply({ ok: false }, 400)
  try {
    const config = await getAssistantConfig()
    if (!config.enabled) return reply({ ok: false, enabled: false }, 503)
    if (!(await requestHasConsent(request, 'analytics'))) return reply({ ok: false, consent: false }, 403)
    const payload = await getPublicPayload()
    const allowed = await allowBuckets(payload, request, [
      { identity: 'assistant-feedback:global', limit: 300, seconds: 60 },
      { identity: `assistant-feedback:visitor:${visitor}`, limit: 30, seconds: 3600 },
    ])
    if (!allowed) return reply({ ok: false }, 429)
    await recordFeedback(payload, parsed.data.answerKey, parsed.data.vote)
    return reply({ ok: true }, 200)
  } catch {
    return reply({ ok: false }, 503)
  }
}
