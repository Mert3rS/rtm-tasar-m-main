import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { boundedJson, sameOrigin } from '@/lib/inquirySecurity'
import { configSchema } from '@/lib/configurator/config'
import { saveDesignShare } from '@/lib/designShares'
import { allowDesignRequest, designRequestVisitor } from '@/lib/designRequestSecurity'

export const runtime = 'nodejs'
export async function POST(request: NextRequest) {
  const reply = (body: object, status: number) =>
    NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
  if (!sameOrigin(request)) return reply({ error: 'İstek doğrulanamadı.' }, 403)
  try {
    const raw = await boundedJson(request)
    if (
      !raw ||
      typeof raw !== 'object' ||
      Array.isArray(raw) ||
      !('design' in raw) ||
      !('token' in raw) ||
      Object.keys(raw).some((key) => !['design', 'token'].includes(key))
    )
      return reply({ error: 'Geçersiz istek.' }, 422)
    const visitor = designRequestVisitor(request, raw.token)
    if (!visitor) return reply({ error: 'İstek doğrulanamadı.' }, 403)
    const parsed = configSchema.safeParse(raw.design)
    if (!parsed.success) return reply({ error: 'Geçersiz tasarım.' }, 422)
    const payload = await getPayload({ config })
    if (!(await allowDesignRequest(payload, request, visitor, 'design-share')))
      return reply({ error: 'İstek sınırı aşıldı.' }, 429)
    return reply({ path: await saveDesignShare(payload, parsed.data) }, 200)
  } catch {
    return reply(
      { error: 'Bağlantı hazırlanamadı; uzun tasarım bağlantısını kullanabilirsiniz.' },
      503,
    )
  }
}
