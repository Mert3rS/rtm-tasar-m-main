import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  CONSENT_COOKIE,
  UNCONFIGURED_POLICY,
  effectiveConsent,
  parseConsent,
  serializeConsent,
} from '@/lib/consent/cookie'
import {
  getConsentSnapshot,
  hasConsent,
  initConsentStore,
  onConsentChange,
  resetConsentStoreForTests,
  safeStorage,
  saveConsent,
} from '@/lib/consent/storage'
import { storageRegistry, visibleOptionalCategories } from '@/lib/consent/registry'

const all = { functional: true, personalization: true, analytics: true, marketing: false }
const none = { functional: false, personalization: false, analytics: false, marketing: false }

function clearCookies() {
  for (const part of document.cookie.split(';')) {
    const name = part.split('=')[0].trim()
    if (name) document.cookie = `${name}=; Path=/; Max-Age=0`
  }
}

beforeEach(() => {
  resetConsentStoreForTests()
  clearCookies()
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(() => resetConsentStoreForTests())

describe('Consent cookie', () => {
  it('round-trips and rejects tampered values', () => {
    const record = { v: '2026-11', c: { ...all }, t: new Date().toISOString(), id: 'abcdefghijklmnopqrstuv' }
    expect(parseConsent(serializeConsent(record))).toEqual(record)
    expect(parseConsent('%7B%22v%22%3A1%7D')).toBeNull()
    expect(parseConsent('not-json')).toBeNull()
    expect(parseConsent(encodeURIComponent(JSON.stringify({ ...JSON.parse(decodeURIComponent(serializeConsent(record))), extra: 1 })))).toBeNull()
  })
  it('asks again when the policy version changes', () => {
    const record = { v: '1', c: { ...all }, t: new Date().toISOString(), id: 'abcdefghijklmnopqrstuv' }
    expect(effectiveConsent(record, '1')).toEqual({ decided: true, choices: all })
    expect(effectiveConsent(record, '2').decided).toBe(false)
    expect(effectiveConsent(record, '2').choices).toEqual(none)
  })
  it('forces optional categories off without an approved policy', () => {
    const record = { v: UNCONFIGURED_POLICY, c: { ...all }, t: new Date().toISOString(), id: 'abcdefghijklmnopqrstuv' }
    expect(effectiveConsent(record, UNCONFIGURED_POLICY)).toEqual({ decided: true, choices: none })
  })
  it('never shows the unused marketing category', () => {
    expect(visibleOptionalCategories).not.toContain('marketing')
  })
})

describe('safeStorage and revocation', () => {
  it('does not write or read optional keys without consent', () => {
    initConsentStore('1', true)
    localStorage.setItem('rtm-theme', 'dark') // legacy value from before a decision
    expect(safeStorage.get('rtm-theme')).toBeNull()
    expect(safeStorage.set('rtm-theme', 'dark', 'functional')).toBe('no-consent')
    expect(safeStorage.set('rtm-interest-v1', '[]', 'personalization')).toBe('no-consent')
    // Unregistered keys or wrong categories are never persisted.
    expect(safeStorage.set('random-key', 'x', 'necessary')).toBe('no-consent')
    expect(safeStorage.set('rtm-theme', 'x', 'necessary')).toBe('no-consent')
  })
  it('writes after consent and the necessary session key always', () => {
    initConsentStore('1', true)
    expect(safeStorage.set('rtm-assistant-v1', '{}', 'necessary', 'session')).toBe('saved')
    saveConsent(all)
    expect(document.cookie).toContain(`${CONSENT_COOKIE}=`)
    expect(hasConsent('functional')).toBe(true)
    expect(safeStorage.set('rtm-theme', 'dark', 'functional')).toBe('saved')
    expect(safeStorage.get('rtm-theme')).toBe('dark')
  })
  it('deletes every key of a revoked category immediately and notifies listeners', () => {
    initConsentStore('1', true)
    saveConsent(all)
    for (const key of ['rtm-theme', 'rtm-design-v2', 'rtm-studio-guide-v1', 'rtm-studio-scene-v1'])
      safeStorage.set(key, 'x', 'functional')
    safeStorage.set('rtm-interest-v1', '[]', 'personalization')
    const seen: boolean[] = []
    const off = onConsentChange((snapshot) => seen.push(snapshot.choices.functional))
    saveConsent({ ...all, functional: false, personalization: false })
    off()
    expect(seen).toEqual([false])
    for (const entry of storageRegistry.filter((item) => item.kind === 'localStorage'))
      expect(localStorage.getItem(entry.name)).toBeNull()
  })
  it('keeps the decision in the browser with a random anonymous id', () => {
    initConsentStore('7', true)
    const record = saveConsent(none)
    expect(record.id).toMatch(/^[A-Za-z0-9_-]{16,40}$/)
    expect(getConsentSnapshot().decided).toBe(true)
    // Re-initialising (new tab) reads the same decision from the cookie.
    resetConsentStoreForTests()
    initConsentStore('7', true)
    expect(getConsentSnapshot().record?.id).toBe(record.id)
    // A new policy version invalidates it.
    resetConsentStoreForTests()
    initConsentStore('8', true)
    expect(getConsentSnapshot().decided).toBe(false)
  })
  it('lists every storage key with category, purpose and duration', () => {
    for (const entry of storageRegistry) {
      expect(entry.purpose.length).toBeGreaterThan(10)
      expect(entry.duration).toBeTruthy()
      expect(entry.provider).toContain('birinci taraf')
    }
    expect(storageRegistry.map(({ name }) => name)).toEqual(
      expect.arrayContaining(['rtm-consent', 'rtm-inquiry-visitor', 'rtm-theme', 'rtm-design-v2', 'rtm-studio-guide-v1', 'rtm-studio-scene-v1', 'rtm-interest-v1', 'rtm-assistant-v1']),
    )
  })
})
