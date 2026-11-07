import 'server-only'
import type { NextRequest } from 'next/server'
import type { Payload } from 'payload'
import {
  allowBuckets,
  sameOrigin,
  validFormToken,
  validVisitor,
  visitorCookie,
} from './inquirySecurity'

export function designRequestVisitor(request: NextRequest, token: unknown) {
  const visitor = request.cookies.get(visitorCookie)?.value
  return sameOrigin(request) && validVisitor(visitor) && validFormToken(token, visitor)
    ? visitor
    : null
}
export function allowDesignRequest(
  payload: Payload,
  request: Request,
  visitor: string,
  kind: string,
) {
  return allowBuckets(
    payload,
    request,
    [
      { identity: `${kind}:global`, limit: 120, seconds: 60 },
      { identity: `${kind}:visitor:${visitor}`, limit: 12, seconds: 900 },
    ],
    { prefix: kind, limit: 30, seconds: 900 },
  )
}
