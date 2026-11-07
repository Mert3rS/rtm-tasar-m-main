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
import { getAssistantKnowledge } from '@/lib/assistant/knowledge'
import { defaultEngine } from '@/lib/assistant/engine'
import { ASSISTANT_MAX_BODY, assistantRequestSchema, engineInput } from '@/lib/assistant/schema'
import { recordUnanswered } from '@/lib/assistant/analytics'
import { requestHasConsent } from '@/lib/consent/server'

export const runtime = 'nodejs'

const reply = (body: object, status: number, extra: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...extra } })

/**
 * Deterministic site assistant. No external AI service; the message is processed in memory to
 * build a structured reply and is never logged. Optional masked "unanswered" logging requires the
 * admin switch AND the visitor's Analytics consent (verified from the consent cookie here).
 */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return reply({ ok: false, message: 'İstek doğrulanamadı.' }, 403)
  let config
  try {
    config = await getAssistantConfig()
  } catch {
    return reply({ ok: false, enabled: false, message: 'Asistan şu anda kullanılamıyor.' }, 503)
  }
  if (!config.enabled)
    return reply({ ok: false, enabled: false, message: 'Asistan şu anda kapalı.' }, 503)
  let raw: unknown
  try {
    raw = await boundedJson(request, ASSISTANT_MAX_BODY)
  } catch {
    return reply({ ok: false, message: 'Mesaj okunamadı veya boyut sınırını aşıyor.' }, 400)
  }
  const parsed = assistantRequestSchema.safeParse(raw)
  if (!parsed.success)
    return reply({ ok: false, message: 'Mesaj en fazla 500 karakter olabilir.' }, 400)
  const visitor = request.cookies.get(visitorCookie)?.value
  if (!validVisitor(visitor) || !validFormToken(parsed.data.token, visitor))
    return reply({ ok: false, code: 'token', message: 'Oturum yenilenmeli.' }, 401)
  try {
    const payload = await getPublicPayload()
    const allowed = await allowBuckets(
      payload,
      request,
      [
        { identity: 'assistant:global', limit: 300, seconds: 60 },
        { identity: `assistant:visitor:${visitor}`, limit: 15, seconds: 60 },
        { identity: `assistant:visitor-hour:${visitor}`, limit: 120, seconds: 3600 },
      ],
      { prefix: 'assistant', limit: 30, seconds: 60 },
    )
    if (!allowed)
      return reply(
        { ok: false, message: 'Çok fazla mesaj gönderildi. Lütfen biraz sonra tekrar deneyin.' },
        429,
        { 'Retry-After': '60' },
      )
    const knowledge = await getAssistantKnowledge()
    const answer = defaultEngine.respond(engineInput(parsed.data), knowledge)
    if (answer.unanswered && parsed.data.message && config.logUnanswered) {
      try {
        if (await requestHasConsent(request, 'analytics'))
          await recordUnanswered(payload, parsed.data.message, config.unansweredRetentionDays)
      } catch {
        // Improvement logging must never affect the visitor's answer.
      }
    }
    // `unanswered` is an internal flag; the client only needs the structured reply.
    const { unanswered: _unanswered, ...publicReply } = answer
    return reply({ ok: true, reply: publicReply }, 200)
  } catch {
    // No message text, visitor id or database detail is logged or returned.
    return reply({ ok: false, message: 'Asistan şu anda cevap veremiyor. Tekrar deneyin.' }, 503)
  }
}
