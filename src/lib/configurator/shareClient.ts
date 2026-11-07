import { designUrl, type Config } from './config'
import { prepareInquiryToken } from '../inquiryClient'

export async function preferredDesignUrl(c: Config, origin?: string) {
  const fallback = origin ? `${origin}/tasarim-olustur${new URL(designUrl(c)).hash}` : designUrl(c)
  try {
    const token = await prepareInquiryToken()
    const result = await fetch('/api/tasarim-baglanti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, design: c }),
      signal: AbortSignal.timeout(7000),
    })
    const body: unknown = await result.json()
    if (
      result.ok &&
      body &&
      typeof body === 'object' &&
      'path' in body &&
      typeof body.path === 'string' &&
      /^\/t\/[\w-]{12}$/.test(body.path)
    )
      return `${origin || window.location.origin}${body.path}`
  } catch {
    /* Short sharing is optional; the existing #c= link always remains usable. */
  }
  return fallback
}
