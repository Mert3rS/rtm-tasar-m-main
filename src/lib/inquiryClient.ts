/** One in-flight bootstrap per tab. Parallel form/share mounts must not race to set
 * different HttpOnly visitor cookies before either request has received its token.
 * Tokens are not persisted or cached after the bootstrap completes.
 */
let pending: Promise<string> | null = null
export function prepareInquiryToken(): Promise<string> {
  if (pending) return pending
  pending = (async () => {
    const response = await fetch('/api/inquiry-token', {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    })
    const body: unknown = await response.json()
    if (
      !response.ok ||
      !body ||
      typeof body !== 'object' ||
      !('token' in body) ||
      typeof body.token !== 'string'
    )
      throw new Error('Token unavailable')
    return body.token
  })().finally(() => {
    pending = null
  })
  return pending
}
