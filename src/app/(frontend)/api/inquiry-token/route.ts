import { NextRequest, NextResponse } from 'next/server'
import {
  formToken,
  newVisitor,
  sameOrigin,
  validVisitor,
  visitorCookie,
} from '@/lib/inquirySecurity'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!sameOrigin(request, false))
    return NextResponse.json(
      { message: 'İstek doğrulanamadı.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    )
  const existing = request.cookies.get(visitorCookie)?.value
  const visitor = validVisitor(existing) ? existing : newVisitor()
  const response = NextResponse.json(
    { token: formToken(visitor) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
  response.cookies.set(visitorCookie, visitor, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return response
}
