import { z } from 'zod'
import { hasConsent, onConsentChange, safeStorage } from '../consent/storage'

/**
 * Browser-only interest log (localStorage `rtm-interest-v1`, Personalisation consent).
 * Only slugs/labels of published content are stored — never form data, messages or designs.
 */
export const INTEREST_KEY = 'rtm-interest-v1'
export const MAX_EVENTS = 50
export const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
const MERGE_WINDOW_MS = 30 * 60 * 1000
const HALF_LIFE_DAYS = 7
const CHANGE_EVENT = 'rtm-interest-change'

export const interestKinds = ['project', 'model', 'service', 'showroom', 'filter', 'studio', 'topic', 'city'] as const
export type InterestKind = (typeof interestKinds)[number]
export const signalTypes = ['projectCategory', 'modelCategory', 'city', 'country', 'product'] as const
export type SignalType = (typeof signalTypes)[number]

const label = z.string().min(1).max(80)
const slug = z.string().regex(/^[a-z0-9]+(?:[a-z0-9:-]*[a-z0-9])?$/).max(120)
const eventSchema = z
  .object({
    k: z.enum(interestKinds),
    s: slug,
    l: label,
    sig: z.array(z.object({ t: z.enum(signalTypes), s: slug, l: label }).strict()).max(8).default([]),
    at: z.number().int().positive(),
    d: z.number().min(0).max(3600).default(0),
  })
  .strict()
export type InterestEvent = z.infer<typeof eventSchema>
export type InterestInput = Omit<InterestEvent, 'at' | 'd' | 'sig'> & { sig?: InterestEvent['sig'] }

let memory: InterestEvent[] | null = null

function read(): InterestEvent[] {
  if (!hasConsent('personalization')) return []
  if (memory) return memory
  try {
    const raw = safeStorage.get(INTEREST_KEY)
    const parsed = z.array(eventSchema).safeParse(raw ? JSON.parse(raw) : [])
    memory = parsed.success ? prune(parsed.data) : []
  } catch {
    memory = []
  }
  return memory
}

function prune(events: InterestEvent[], now = Date.now()) {
  return events.filter((event) => now - event.at <= MAX_AGE_MS && event.at <= now + 60_000).slice(-MAX_EVENTS)
}

function write(events: InterestEvent[]) {
  memory = prune(events)
  safeStorage.set(INTEREST_KEY, JSON.stringify(memory), 'personalization')
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT))
}

/** Records a view; returns a function that adds the time spent when the view ends. */
export function recordInterest(input: InterestInput, now = Date.now()): (seconds: number) => void {
  if (!hasConsent('personalization')) return () => undefined
  const parsed = eventSchema.safeParse({ ...input, sig: input.sig || [], at: now, d: 0 })
  if (!parsed.success) return () => undefined
  const events = [...read()]
  const existing = events.findIndex(
    (event) => event.k === parsed.data.k && event.s === parsed.data.s && now - event.at < MERGE_WINDOW_MS,
  )
  // Re-entering the same page within 30 minutes refreshes it instead of inflating its score.
  if (existing >= 0) {
    const [event] = events.splice(existing, 1)
    events.push({ ...event, at: now, l: parsed.data.l, sig: parsed.data.sig })
  } else events.push(parsed.data)
  write(events)
  return (seconds: number) => {
    if (!hasConsent('personalization')) return
    const current = [...read()]
    const index = current.findIndex((event) => event.k === parsed.data.k && event.s === parsed.data.s)
    if (index < 0) return
    current[index] = { ...current[index], d: Math.min(3600, current[index].d + Math.max(0, seconds)) }
    write(current)
  }
}

export function clearInterest() {
  memory = []
  safeStorage.remove(INTEREST_KEY)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function getInterestEvents() {
  return read()
}

const kindWeight: Record<InterestKind, number> = {
  project: 1,
  model: 1,
  service: 1,
  showroom: 0.8,
  filter: 0.7,
  studio: 1,
  topic: 0.5,
  city: 0.7,
}

/** Time decay (7-day half-life) × dwell factor: under 10 s counts as a weak signal. */
export function eventWeight(event: InterestEvent, now = Date.now()) {
  const ageDays = Math.max(0, now - event.at) / 86_400_000
  const decay = 0.5 ** (ageDays / HALF_LIFE_DAYS)
  const dwell = event.k === 'filter' || event.k === 'topic' || event.k === 'city' ? 1 : event.d < 10 ? 0.3 : Math.min(2, 1 + event.d / 120)
  return kindWeight[event.k] * decay * dwell
}

export type InterestProfile = {
  total: number
  items: { type: 'project' | 'model' | 'service' | 'showroom'; slug: string; label: string; score: number }[]
  signals: Record<SignalType, { slug: string; label: string; score: number }[]>
}

export function buildProfile(events: InterestEvent[], now = Date.now()): InterestProfile {
  const items = new Map<string, InterestProfile['items'][number]>()
  const signals = Object.fromEntries(signalTypes.map((type) => [type, new Map<string, { slug: string; label: string; score: number }>()])) as Record<SignalType, Map<string, { slug: string; label: string; score: number }>>
  let total = 0
  for (const event of events) {
    const weight = eventWeight(event, now)
    total += weight
    if (event.k === 'project' || event.k === 'model' || event.k === 'service' || event.k === 'showroom') {
      const key = `${event.k}:${event.s}`
      const current = items.get(key)
      items.set(key, { type: event.k, slug: event.s, label: event.l, score: (current?.score || 0) + weight })
    }
    for (const signal of event.sig) {
      const map = signals[signal.t]
      const current = map.get(signal.s)
      map.set(signal.s, { slug: signal.s, label: signal.l, score: (current?.score || 0) + weight })
    }
  }
  const sorted = <T extends { score: number }>(values: Iterable<T>) => [...values].sort((a, b) => b.score - a.score)
  return {
    total,
    items: sorted(items.values()),
    signals: Object.fromEntries(signalTypes.map((type) => [type, sorted(signals[type].values())])) as InterestProfile['signals'],
  }
}

/** Enough signal to personalise honestly (no fake suggestions on thin data). */
export const MIN_PROFILE_SCORE = 0.9

export function recommendationRequest(profile: InterestProfile, exclude?: { type: InterestProfile['items'][number]['type']; slug: string }) {
  const top = <T extends { slug: string }>(values: T[], count: number) => values.slice(0, count).map(({ slug }) => slug)
  return {
    items: profile.items.slice(0, 10).map(({ type, slug }) => ({ type, slug })),
    projectCategories: top(profile.signals.projectCategory, 5),
    modelCategories: top(profile.signals.modelCategory, 5),
    cities: top(profile.signals.city, 5),
    countries: top(profile.signals.country, 3),
    exclude,
    limit: 4,
  }
}

/** Plain-language list for "Kaydedilen ilgi alanlarım" and "Neden bunu görüyorum?". */
export function describeProfile(profile: InterestProfile, max = 6) {
  const parts: { text: string; score: number }[] = [
    ...profile.signals.modelCategory.map((item) => ({ text: `${item.label} modelleri`, score: item.score })),
    ...profile.signals.projectCategory.map((item) => ({ text: `${item.label} projeleri`, score: item.score })),
    ...profile.signals.city.map((item) => ({ text: `${item.label} projeleri`, score: item.score })),
    ...profile.signals.country.map((item) => ({ text: `${item.label} projeleri`, score: item.score * 0.8 })),
    ...profile.signals.product.map((item) => ({ text: `${item.label} tasarımı`, score: item.score })),
    ...profile.items.filter((item) => item.type === 'service').map((item) => ({ text: `${item.label} hizmeti`, score: item.score })),
  ]
  const seen = new Set<string>()
  return parts
    .sort((a, b) => b.score - a.score)
    .filter(({ text }) => (seen.has(text) ? false : (seen.add(text), true)))
    .slice(0, max)
    .map(({ text }) => text)
}

export function onInterestChange(callback: () => void) {
  if (typeof window === 'undefined') return () => undefined
  const storage = (event: StorageEvent) => {
    if (event.key === INTEREST_KEY || event.key === null) {
      memory = null
      callback()
    }
  }
  const unsubscribeConsent = onConsentChange(() => {
    memory = null
    callback()
  })
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('storage', storage)
  return () => {
    unsubscribeConsent()
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('storage', storage)
  }
}

/** Test hook. */
export function resetInterestMemory() {
  memory = null
}
