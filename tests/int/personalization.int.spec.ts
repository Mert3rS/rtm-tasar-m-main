import { beforeEach, describe, expect, it } from 'vitest'
import { initConsentStore, resetConsentStoreForTests, saveConsent } from '@/lib/consent/storage'
import {
  INTEREST_KEY,
  MAX_EVENTS,
  buildProfile,
  clearInterest,
  describeProfile,
  eventWeight,
  getInterestEvents,
  recordInterest,
  recommendationRequest,
  resetInterestMemory,
} from '@/lib/personalization/interest'
import { recommendationRequestSchema } from '@/lib/personalization/schema'

const day = 86_400_000
const grant = (personalization: boolean) => {
  resetConsentStoreForTests()
  initConsentStore('1', true)
  saveConsent({ functional: false, personalization, analytics: false, marketing: false })
}

beforeEach(() => {
  localStorage.clear()
  for (const part of document.cookie.split(';')) {
    const name = part.split('=')[0].trim()
    if (name) document.cookie = `${name}=; Path=/; Max-Age=0`
  }
  resetInterestMemory()
})

describe('Interest log', () => {
  it('collects nothing without Personalisation consent', () => {
    grant(false)
    recordInterest({ k: 'model', s: 'demo-gardirop', l: 'DEMO Gardırop', sig: [{ t: 'modelCategory', s: 'gardirop', l: 'Gardırop' }] })
    expect(localStorage.getItem(INTEREST_KEY)).toBeNull()
    expect(getInterestEvents()).toEqual([])
  })
  it('stores only slugs/labels, caps events and merges quick revisits', () => {
    grant(true)
    const now = Date.now()
    recordInterest({ k: 'project', s: 'demo-a', l: 'DEMO A' }, now)
    recordInterest({ k: 'project', s: 'demo-a', l: 'DEMO A' }, now + 60_000)
    expect(getInterestEvents()).toHaveLength(1)
    for (let index = 0; index < 70; index += 1) recordInterest({ k: 'model', s: `demo-${index}`, l: `DEMO ${index}` }, now + index)
    expect(getInterestEvents().length).toBeLessThanOrEqual(MAX_EVENTS)
    expect(Object.keys(getInterestEvents()[0]).sort()).toEqual(['at', 'd', 'k', 'l', 's', 'sig'])
  })
  it('rejects invalid input and drops events older than 30 days', () => {
    grant(true)
    recordInterest({ k: 'project', s: 'Not A Slug!', l: 'x' })
    expect(getInterestEvents()).toHaveLength(0)
    const old = Date.now() - 31 * day
    recordInterest({ k: 'project', s: 'demo-old', l: 'Old' }, old)
    resetInterestMemory()
    expect(getInterestEvents().find((event) => event.s === 'demo-old')).toBeUndefined()
  })
  it('decays with time and down-weights short visits', () => {
    const now = Date.now()
    const base = { k: 'project' as const, s: 'demo', l: 'DEMO', sig: [] }
    const fresh = eventWeight({ ...base, at: now, d: 60 }, now)
    const weekOld = eventWeight({ ...base, at: now - 7 * day, d: 60 }, now)
    const quick = eventWeight({ ...base, at: now, d: 3 }, now)
    expect(weekOld).toBeCloseTo(fresh / 2, 5)
    expect(quick).toBeLessThan(fresh / 3)
  })
  it('builds a plain-language profile and a bounded recommendation request', () => {
    const now = Date.now()
    const profile = buildProfile(
      [
        { k: 'model', s: 'demo-g', l: 'DEMO G', sig: [{ t: 'modelCategory', s: 'gardirop', l: 'Gardırop' }], at: now, d: 90 },
        { k: 'project', s: 'demo-i', l: 'DEMO İ', sig: [{ t: 'city', s: 'istanbul', l: 'İstanbul' }], at: now - day, d: 40 },
        { k: 'service', s: 'ic-mimari', l: 'İç Mimari', sig: [], at: now, d: 30 },
      ],
      now,
    )
    expect(describeProfile(profile)).toEqual(expect.arrayContaining(['Gardırop modelleri', 'İstanbul projeleri', 'İç Mimari hizmeti']))
    const request = recommendationRequest(profile, { type: 'model', slug: 'demo-g' })
    expect(recommendationRequestSchema.safeParse(request).success).toBe(true)
  })
  it('clears history on request', () => {
    grant(true)
    recordInterest({ k: 'project', s: 'demo', l: 'DEMO' })
    clearInterest()
    expect(localStorage.getItem(INTEREST_KEY)).toBeNull()
  })
  it('removes interest data immediately when consent is withdrawn', () => {
    grant(true)
    recordInterest({ k: 'project', s: 'demo', l: 'DEMO' })
    expect(localStorage.getItem(INTEREST_KEY)).not.toBeNull()
    saveConsent({ functional: false, personalization: false, analytics: false, marketing: false })
    expect(localStorage.getItem(INTEREST_KEY)).toBeNull()
  })
})

describe('Recommendation endpoint input', () => {
  it.each([
    { items: Array.from({ length: 11 }, (_, index) => ({ type: 'project', slug: `p-${index}` })) },
    { items: [{ type: 'inquiry', slug: 'x' }] },
    { items: [{ type: 'project', slug: '../admin' }] },
    { cities: ['a', 'b', 'c', 'd', 'e', 'f'] },
    { limit: 50 },
    { email: 'a@b.c' },
  ])('rejects invalid input %#', (value) => {
    expect(recommendationRequestSchema.safeParse(value).success).toBe(false)
  })
})
