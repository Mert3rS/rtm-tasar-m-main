import 'server-only'
import { cookies } from 'next/headers'
import { getPublicSiteSettings } from '../siteSettings'
import { CONSENT_COOKIE, effectiveConsent, parseConsent, readCookieValue } from './cookie'

/** Layout read: lets the first render know whether the banner is needed (no flash/hydration diff). */
export async function getServerConsent() {
  const [store, settings] = await Promise.all([cookies(), getPublicSiteSettings()])
  const record = parseConsent(store.get(CONSENT_COOKIE)?.value)
  const policy = settings.cookiePolicy
  return { record, policy, ...effectiveConsent(record, policy.version) }
}

/** Route handlers: server-side enforcement of a category before any analytics write. */
export async function requestHasConsent(request: Request, category: 'analytics' | 'personalization') {
  const settings = await getPublicSiteSettings()
  const record = parseConsent(readCookieValue(request.headers.get('cookie') || '', CONSENT_COOKIE))
  return effectiveConsent(record, settings.cookiePolicy.version).choices[category]
}
