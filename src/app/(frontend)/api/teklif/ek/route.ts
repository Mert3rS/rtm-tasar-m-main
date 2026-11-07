import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { boundedJson, digest, sameOrigin } from '@/lib/inquirySecurity'
import { designRequestVisitor, allowDesignRequest } from '@/lib/designRequestSecurity'
import { attachmentLimit, sanitizeAttachment } from '@/lib/inquiryAttachment'
import { safeHttpsUrl } from '@/lib/contactValidation'

export const runtime = 'nodejs'
export async function POST(request: NextRequest) {
  const reply = (body: object, status: number) =>
    NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
  if (!sameOrigin(request)) return reply({ error: 'İstek doğrulanamadı.' }, 403)
  const visitor = designRequestVisitor(request, request.headers.get('x-form-token'))
  const uuid = request.headers.get('x-submission-key') || ''
  if (!visitor || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(uuid))
    return reply({ error: 'İstek doğrulanamadı.' }, 403)
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(request.headers.get('content-type') || '')
  )
    return reply({ error: 'JPEG, PNG veya WebP seçin.' }, 415)
  if (Number(request.headers.get('content-length') || 0) > attachmentLimit)
    return reply({ error: 'Dosya en fazla 5 MB olabilir.' }, 413)
  try {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({
      slug: 'site-settings',
      overrideAccess: true,
      depth: 0,
      select: { quoteFormEnabled: true, privacyNoticeContent: true, privacyNoticeUrl: true },
    })
    if (
      settings.quoteFormEnabled === false ||
      (!settings.privacyNoticeContent?.trim() && !safeHttpsUrl(settings.privacyNoticeUrl))
    )
      return reply({ error: 'Form gönderime kapalı.' }, 503)
    if (!(await allowDesignRequest(payload, request, visitor, 'inquiry-upload')))
      return reply({ error: 'Yükleme sınırı aşıldı.' }, 429)
    const submissionKey = digest(`submission:${visitor}:${uuid}`)
    const existing = await payload.find({
      collection: 'inquiry-attachments',
      overrideAccess: true,
      depth: 0,
      limit: 3,
      where: { submissionKey: { equals: submissionKey } },
    })
    const slot = [0, 1, 2].find((value) => !existing.docs.some((doc) => doc.slot === value))
    if (slot === undefined) return reply({ error: 'En fazla üç dosya yükleyebilirsiniz.' }, 422)
    const reader = request.body?.getReader()
    if (!reader) return reply({ error: 'Dosya boş.' }, 400)
    const chunks: Uint8Array[] = []
    let size = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > attachmentLimit) {
          await reader.cancel()
          return reply({ error: 'Dosya en fazla 5 MB olabilir.' }, 413)
        }
        chunks.push(value)
      }
    } finally {
      reader.releaseLock()
    }
    const bytes = await sanitizeAttachment(Buffer.concat(chunks))
    const handle = randomUUID()
    // Trusted create: only re-encoded image bytes and server-derived ownership fields are stored.
    await payload.create({
      collection: 'inquiry-attachments',
      overrideAccess: true,
      data: {
        handle,
        submissionKey,
        slot,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
      file: { data: bytes, mimetype: 'image/jpeg', name: `${handle}.jpg`, size: bytes.length },
    })
    // Bounded opportunistic cleanup. Never delete an attachment referenced by any inquiry.
    const expired = await payload.find({
      collection: 'inquiry-attachments',
      overrideAccess: true,
      depth: 0,
      limit: 10,
      where: {
        and: [
          { expiresAt: { less_than: new Date().toISOString() } },
          { linkedAt: { exists: false } },
        ],
      },
    })
    for (const attachment of expired.docs) {
      const referenced = await payload.count({
        collection: 'inquiries',
        overrideAccess: true,
        where: { attachments: { contains: attachment.id } },
      })
      if (!referenced.totalDocs)
        await payload.delete({
          collection: 'inquiry-attachments',
          id: attachment.id,
          overrideAccess: true,
        })
    }
    return reply({ handle }, 201)
  } catch {
    return reply({ error: 'Görsel yüklenemedi. Dosya olmadan talebinizi gönderebilirsiniz.' }, 422)
  }
}

export async function DELETE(request: NextRequest) {
  const reply = (body: object, status: number) =>
    NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
  const visitor = designRequestVisitor(request, request.headers.get('x-form-token'))
  const uuid = request.headers.get('x-submission-key') || ''
  if (!visitor || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(uuid))
    return reply({ error: 'İstek doğrulanamadı.' }, 403)
  try {
    const raw = await boundedJson(request, 1024)
    if (
      !raw ||
      typeof raw !== 'object' ||
      Array.isArray(raw) ||
      Object.keys(raw).length !== 1 ||
      !('handle' in raw) ||
      typeof raw.handle !== 'string'
    )
      return reply({ error: 'Geçersiz ek.' }, 422)
    const payload = await getPayload({ config })
    if (!(await allowDesignRequest(payload, request, visitor, 'inquiry-remove')))
      return reply({ error: 'İstek sınırı aşıldı.' }, 429)
    const result = await payload.find({
      collection: 'inquiry-attachments',
      overrideAccess: true,
      depth: 0,
      limit: 1,
      where: {
        and: [
          { handle: { equals: raw.handle } },
          { submissionKey: { equals: digest(`submission:${visitor}:${uuid}`) } },
        ],
      },
    })
    const doc = result.docs[0]
    if (!doc) return reply({ success: true }, 200)
    if (doc.linkedAt) return reply({ error: 'Gönderilmiş başvurunun eki kaldırılamaz.' }, 409)
    const submitted = await payload.count({
      collection: 'inquiries',
      overrideAccess: true,
      where: { submissionKey: { equals: doc.submissionKey } },
    })
    if (submitted.totalDocs)
      return reply({ error: 'Gönderilmiş başvurunun eki kaldırılamaz.' }, 409)
    await payload.delete({ collection: 'inquiry-attachments', overrideAccess: true, id: doc.id })
    return reply({ success: true }, 200)
  } catch {
    return reply({ error: 'Ek kaldırılamadı.' }, 503)
  }
}
