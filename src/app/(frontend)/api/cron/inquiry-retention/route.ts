import { getPayload } from 'payload'
import config from '@/payload.config'
import { pruneExpiredInquiries } from '@/lib/inquiryRetention'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ success: false }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const result = await pruneExpiredInquiries(payload)
  return Response.json(
    { success: true, ...result },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
