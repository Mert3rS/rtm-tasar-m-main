import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { safeHttpsUrl, validateInquiry } from '@/lib/contactValidation'
import {
  allowSubmission,
  boundedJson,
  digest,
  sameOrigin,
  validFormToken,
  validVisitor,
  visitorCookie,
} from '@/lib/inquirySecurity'
import { notifyInquiry } from '@/lib/inquiryNotifications'
import { encode } from '@/lib/configurator/config'
import sharp from 'sharp'
import { saveDesignShare } from '@/lib/designShares'
import { productionSiteUrl } from '@/lib/seo'

export const runtime = 'nodejs'
const success = {
  success: true,
  message: 'Başvurunuz kaydedildi. Paylaştığınız bilgiler üzerinden sizinle iletişime geçeceğiz.',
}
const reply = (body: object, status: number, extra: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...extra } })

export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return reply({ success: false, message: 'İstek doğrulanamadı. Sayfayı yenileyin.' }, 403)
  let raw: unknown
  try {
    raw = await boundedJson(request)
  } catch {
    return reply(
      { success: false, message: 'Form okunamadı veya gönderim boyutu sınırını aşıyor.' },
      400,
    )
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    return reply({ success: false, message: 'Geçerli bir form gönderin.' }, 400)
  const input: Record<string, unknown> = Object.fromEntries(Object.entries(raw))
  const visitor = request.cookies.get(visitorCookie)?.value
  if (
    !validVisitor(visitor) ||
    !validFormToken(input.token, visitor) ||
    typeof input.idempotencyKey !== 'string' ||
    !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(input.idempotencyKey) ||
    typeof input.website !== 'string' ||
    input.website !== ''
  )
    return reply(
      { success: false, message: 'Gönderim doğrulanamadı. Sayfayı yenileyip tekrar deneyin.' },
      400,
    )
  const validated = validateInquiry(input)
  if (validated.errors)
    return reply(
      { success: false, message: 'İşaretli alanları kontrol edin.', errors: validated.errors },
      422,
    )
  const data = validated.data
  if (data.designPreview) {
    try {
      const png = Buffer.from(data.designPreview.split(',')[1], 'base64')
      const metadata = await sharp(png, { limitInputPixels: 16384 }).metadata()
      if (
        metadata.format !== 'png' ||
        !metadata.width ||
        !metadata.height ||
        metadata.width > 128 ||
        metadata.height > 128
      )
        throw new Error('Invalid preview')
    } catch {
      return reply(
        { success: false, message: 'Tasarım önizlemesi okunamadı. Sayfayı yenileyin.' },
        422,
      )
    }
  }
  try {
    const payload = await getPayload({ config })
    const key = digest(`submission:${visitor}:${input.idempotencyKey}`)
    const hash = digest(JSON.stringify(data))
    // This trusted read stays server-side and only resolves this visitor's opaque retry key.
    async function previous() {
      const result = await payload.find({
        collection: 'inquiries',
        overrideAccess: true,
        depth: 0,
        limit: 1,
        pagination: false,
        select: { submissionHash: true },
        where: { submissionKey: { equals: key } },
      })
      if (!result.docs[0]) return null
      return result.docs[0].submissionHash === hash
        ? reply(success, 200)
        : reply(
            { success: false, message: 'Bu gönderim anahtarı kullanılmış. Sayfayı yenileyin.' },
            409,
          )
    }
    const existing = await previous()
    if (existing) return existing
    const settings = await payload.findGlobal({
      slug: 'site-settings',
      overrideAccess: true,
      depth: 0,
      select: {
        contactFormEnabled: true,
        quoteFormEnabled: true,
        privacyNoticeContent: true,
        privacyNoticeUrl: true,
        notificationRecipientEmail: true,
      },
    })
    if (
      (data.inquiryType === 'contact' ? settings.contactFormEnabled : settings.quoteFormEnabled) ===
        false ||
      (!settings.privacyNoticeContent?.trim() && !safeHttpsUrl(settings.privacyNoticeUrl))
    )
      return reply(
        {
          success: false,
          message:
            'Bu form şu anda gönderime kapalı. Mevcut iletişim kanallarımızı kullanabilirsiniz.',
        },
        503,
      )
    if (!(await allowSubmission(payload, request, visitor, data.email)))
      return reply(
        { success: false, message: 'Çok fazla gönderim yapıldı. Bir süre sonra tekrar deneyin.' },
        429,
        { 'Retry-After': '900' },
      )
    let categoryLabel: string | undefined
    if (data.inquiryType === 'quote' && input.designQuote !== true) {
      const categories = await payload.find({
        collection: 'project-categories',
        overrideAccess: false,
        depth: 0,
        limit: 1,
        where: data.projectCategory
          ? { and: [{ id: { equals: data.projectCategory } }, { active: { equals: true } }] }
          : { active: { equals: true } },
      })
      if (
        (data.projectCategory && !categories.docs.length) ||
        (!data.projectCategory && categories.docs.length)
      )
        return reply(
          {
            success: false,
            message: 'Proje kategorisini yeniden seçin.',
            errors: { projectCategory: 'Geçerli bir kategori seçin.' },
          },
          422,
        )
      categoryLabel = categories.docs[0]?.name || 'Genel proje başvurusu'
    }
    const attachments: number[] = []
    for (const handle of data.attachmentHandles || []) {
      // Trusted lookup is constrained to this visitor AND this idempotent submission.
      const found = await payload.find({
        collection: 'inquiry-attachments',
        overrideAccess: true,
        depth: 0,
        limit: 1,
        where: {
          and: [
            { handle: { equals: handle } },
            { submissionKey: { equals: key } },
            { expiresAt: { greater_than: new Date().toISOString() } },
          ],
        },
      })
      if (!found.docs[0])
        return reply(
          { success: false, message: 'Dosya eki bulunamadı. Eki kaldırıp tekrar deneyin.' },
          422,
        )
      attachments.push(found.docs[0].id)
    }
    let designShareUrl: string | undefined
    if (data.designConfig) {
      const origin = productionSiteUrl()?.origin || request.nextUrl.origin
      let path = `/tasarim-olustur#c=${encode(data.designConfig)}`
      try {
        path = await saveDesignShare(payload, data.designConfig)
      } catch {
        /* Long link fallback. */
      }
      designShareUrl = `${origin}${path}`
    }
    let inquiry
    try {
      // Fixed collection, create only, validated allowlist. Never spread the raw request into the Local API.
      inquiry = await payload.create({
        collection: 'inquiries',
        overrideAccess: true,
        depth: 0,
        data: {
          fullName: data.fullName,
          email: data.email || undefined,
          phone: data.phone,
          inquiryType: data.inquiryType,
          subject: data.subject,
          message: data.message,
          projectCategory: data.projectCategory,
          projectCategoryLabel: categoryLabel,
          projectCity: data.projectCity,
          estimatedArea: data.estimatedArea,
          estimatedBudgetRange: data.estimatedBudgetRange,
          preferredContactMethod: data.preferredContactMethod,
          requestMeasurement: data.requestMeasurement,
          requestSamples: data.requestSamples,
          attachments,
          status: 'new',
          priority: 'normal',
          submittedAt: new Date().toISOString(),
          notificationStatus: 'disabled',
          submissionKey: key,
          submissionHash: hash,
          ...(data.designConfig
            ? {
                designConfig: data.designConfig,
                designShareUrl,
                designPreview: data.designPreview,
              }
            : {}),
        },
      })
    } catch {
      // The unique DB index resolves concurrent retries without a second inquiry or notification.
      const raced = await previous()
      if (raced) return raced
      throw new Error('Inquiry storage failed')
    }
    await notifyInquiry(payload, inquiry, settings.notificationRecipientEmail)
    return reply(success, 201)
  } catch {
    // No request bodies, e-mail addresses, credentials or database errors are logged or returned.
    return reply(
      {
        success: false,
        message:
          'Başvurunuz şu anda kaydedilemedi. Bilgileriniz formda korunuyor; lütfen yeniden deneyin.',
      },
      503,
    )
  }
}
