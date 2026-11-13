/* The only module allowed to touch document.cookie / Web Storage directly (eslint.config.mjs). */
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  effectiveConsent,
  parseConsent,
  readCookieValue,
  serializeConsent,
  type ConsentChoices,
  type ConsentRecord,
} from './cookie'
import {
  optionalCategories,
  registryEntry,
  storageRegistry,
  type ConsentCategory,
} from './registry'

export type ConsentSnapshot = {
  /** Effective policy version (`unconfigured` without an approved policy). */
  policyVersion: string
  policyReady: boolean
  decided: boolean
  choices: ConsentChoices
  record: ConsentRecord | null
}
type Area = 'local' | 'session'
export type StorageWriteResult = 'saved' | 'no-consent' | 'unavailable'

const channelName = 'rtm-consent'
const listeners = new Set<(snapshot: ConsentSnapshot) => void>()
let snapshot: ConsentSnapshot = {
  policyVersion: 'unconfigured',
  policyReady: false,
  decided: false,
  choices: { functional: false, personalization: false, analytics: false, marketing: false },
  record: null,
}
let channel: BroadcastChannel | null = null

function storageArea(area: Area): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return area === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function getConsentSnapshot() {
  return snapshot
}

export function hasConsent(category: ConsentCategory) {
  if (category === 'necessary') return true
  return snapshot.choices[category]
}

export function onConsentChange(listener: (snapshot: ConsentSnapshot) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emit() {
  for (const listener of [...listeners]) listener(snapshot)
}

/** Remove every registry key whose category is not granted. Runs immediately on revocation. */
export function purgeWithoutConsent() {
  for (const entry of storageRegistry) {
    if (hasConsent(entry.category)) continue
    if (entry.kind === 'localStorage') {
      try {
        storageArea('local')?.removeItem(entry.name)
      } catch {
        /* Storage blocked: nothing persisted to remove. */
      }
    } else if (entry.kind === 'sessionStorage') {
      try {
        storageArea('session')?.removeItem(entry.name)
      } catch {
        /* ignore */
      }
    } else if (!entry.httpOnly && typeof document !== 'undefined') {
      document.cookie = `${entry.name}=; Path=/; Max-Age=0; SameSite=Lax`
    }
  }
}

function readCookieRecord() {
  if (typeof document === 'undefined') return null
  try {
    return parseConsent(readCookieValue(document.cookie, CONSENT_COOKIE))
  } catch {
    return null
  }
}

/**
 * Restores the consent-gated theme before React hydrates. Kept in this module so
 * instrumentation-client never reads cookies or Web Storage directly.
 */
export function restoreInitialTheme(policyVersion: string) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.rtmJs = 'true'
  const { choices } = effectiveConsent(readCookieRecord(), policyVersion)
  const themeEntry = registryEntry('rtm-theme')
  if (!choices.functional || themeEntry?.category !== 'functional') return
  const saved = storageArea('local')?.getItem(themeEntry.name)
  document.documentElement.dataset.theme = saved === 'dark' ? 'dark' : 'light'
}

function applyRecord(record: ConsentRecord | null) {
  const { decided, choices } = effectiveConsent(record, snapshot.policyVersion)
  const previous = snapshot
  snapshot = { ...snapshot, decided, choices, record: decided ? record : null }
  if (decided) purgeWithoutConsent()
  const changed =
    previous.decided !== snapshot.decided ||
    optionalCategories.some((category) => previous.choices[category] !== snapshot.choices[category])
  if (changed) emit()
}

/** Called once by ConsentProvider in the browser with the server-known policy version. */
export function initConsentStore(policyVersion: string, policyReady: boolean) {
  if (typeof window === 'undefined') return
  snapshot = { ...snapshot, policyVersion, policyReady }
  applyRecord(readCookieRecord())
  if (!channel && 'BroadcastChannel' in window) {
    try {
      channel = new BroadcastChannel(channelName)
      channel.onmessage = () => applyRecord(readCookieRecord())
    } catch {
      channel = null
    }
  }
}

/** Re-read the cookie (focus/visibility fallback for browsers without BroadcastChannel). */
export function refreshConsentFromCookie() {
  applyRecord(readCookieRecord())
}

function randomId() {
  const bytes = new Uint8Array(18)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** Persist a decision locally. The browser decision stays valid even if the server log fails. */
export function saveConsent(choices: ConsentChoices): ConsentRecord {
  const record: ConsentRecord = {
    v: snapshot.policyVersion,
    c: snapshot.policyReady
      ? { ...choices, marketing: false }
      : { functional: false, personalization: false, analytics: false, marketing: false },
    t: new Date().toISOString(),
    id: snapshot.record?.id || randomId(),
  }
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(record)}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax${secure}`
  applyRecord(readCookieRecord() ?? record)
  try {
    channel?.postMessage('changed')
  } catch {
    /* Other tabs will re-read on focus. */
  }
  return record
}

/**
 * Consent-aware Web Storage wrapper. Reads of optional keys return null without consent so
 * values left from before a decision are never used; writes are refused without consent.
 */
export const safeStorage = {
  get(key: string, area: Area = 'local'): string | null {
    const entry = registryEntry(key)
    if (!entry || !hasConsent(entry.category)) return null
    try {
      return storageArea(area)?.getItem(key) ?? null
    } catch {
      return null
    }
  },
  set(key: string, value: string, category: ConsentCategory, area: Area = 'local'): StorageWriteResult {
    const entry = registryEntry(key)
    // Unregistered keys or mismatched categories are programming errors: never persist them.
    if (!entry || entry.category !== category || !hasConsent(category)) return 'no-consent'
    try {
      const storage = storageArea(area)
      if (!storage) return 'unavailable'
      storage.setItem(key, value)
      return 'saved'
    } catch {
      return 'unavailable'
    }
  },
  remove(key: string, area: Area = 'local') {
    try {
      storageArea(area)?.removeItem(key)
    } catch {
      /* ignore */
    }
  },
}

/** Test-only reset hook. */
export function resetConsentStoreForTests() {
  snapshot = {
    policyVersion: 'unconfigured',
    policyReady: false,
    decided: false,
    choices: { functional: false, personalization: false, analytics: false, marketing: false },
    record: null,
  }
  listeners.clear()
  channel?.close()
  channel = null
}
