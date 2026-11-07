import { describe, expect, it } from 'vitest'
import { fold, normalizeText, stem, fuzzyEqual, levenshtein } from '@/lib/assistant/normalize'
import { analyze, baseVocabulary, buildVocabulary } from '@/lib/assistant/vocabulary'
import { DeterministicEngine, detectLanguage } from '@/lib/assistant/engine'
import { containsPersonalData, maskPersonalData } from '@/lib/assistant/privacy'
import { safeInternalHref } from '@/lib/assistant/links'
import { assistantRequestSchema, feedbackRequestSchema, pageContextFromPath } from '@/lib/assistant/schema'
import { demoKnowledge, emptyKnowledge } from '../assistant-evals/fixture'
import { evalCases } from '../assistant-evals/cases'
import type { Knowledge } from '@/lib/assistant/types'

const engine = new DeterministicEngine()
const ask = (message: string, extra: Parameters<typeof engine.respond>[0] = {}, knowledge: Knowledge = demoKnowledge) =>
  engine.respond({ message, ...extra }, knowledge)

describe('Turkish normalisation', () => {
  it('lower-cases with Turkish rules and folds diacritics', () => {
    expect(normalizeText('İSTANBUL')).toBe('istanbul')
    expect(normalizeText('GARDIROP')).toBe('gardirop')
    expect(fold('gardırop çğıöşü')).toBe('gardirop cgiosu')
    expect(normalizeText("Berlin'de projeniz var mı? 😊")).toBe('berlin projeniz var mi')
  })
  it('stems common suffixes with consonant softening', () => {
    const lexicon = baseVocabulary.lexicon
    expect(stem('projeleriniz', lexicon)).toBe('proje')
    expect(stem('dolabi', lexicon)).toBe('dolap')
    expect(stem(fold('mutfağım'), lexicon)).toBe('mutfak')
    expect(stem('gardirob', lexicon)).toBe('gardirop')
  })
  it('tolerates typos by word length', () => {
    expect(levenshtein('mutfk', 'mutfak')).toBe(1)
    expect(fuzzyEqual('mutfk', 'mutfak')).toBe(true)
    expect(fuzzyEqual('gardrop', 'gardirop')).toBe(true)
    expect(fuzzyEqual('tv', 'te')).toBe(false)
  })
  it('maps synonyms and phrases to concepts', () => {
    expect(analyze('kaç para').concepts.has('fiyat')).toBe(true)
    expect(analyze('elbise dolabımı').concepts.has('gardirop')).toBe(true)
    expect(analyze('portmanto').concepts.has('vestiyer')).toBe(true)
    expect(analyze('üç boyutlu tasarlamak').concepts.has('atolye')).toBe(true)
    expect(analyze('sanal tur').concepts.has('showroom')).toBe(true)
    const custom = buildVocabulary([['komodin', 'şifonyer']])
    expect(analyze('şifonyer', custom).concepts.has('komodin')).toBe(true)
  })
})

describe('Intent recognition', () => {
  it('reaches the ≥90% evaluation target', () => {
    let ok = 0
    for (const testCase of evalCases) {
      const reply = ask(testCase.q, { page: testCase.page, context: testCase.context })
      const accepted = Array.isArray(testCase.expect) ? testCase.expect : [testCase.expect]
      if (accepted.includes(reply.intent)) ok += 1
    }
    expect(evalCases.length).toBeGreaterThanOrEqual(95)
    expect(ok / evalCases.length).toBeGreaterThanOrEqual(0.9)
  })
  it('uses confidence thresholds: high answers, medium clarifies, low falls back', () => {
    expect(ask('Hangi hizmetleri veriyorsunuz?').confidence).toBe('high')
    const medium = ask('mutfak')
    expect(medium.intent).toBe('clarify')
    expect(medium.chips.length).toBeGreaterThan(1)
    const low = ask('qwe rty zxc')
    expect(low.intent).toBe('fallback')
    expect(low.confidence).toBe('low')
    expect(low.unanswered).toBe(true)
  })
  it('extracts entities from published records (typo + case)', () => {
    expect(ask('İSTANBUL projeleri').context.entities?.city).toBe('istanbul')
    expect(ask('mutfk projeleri').context.entities?.projectCategory).toBe('mutfak')
    expect(ask('gardirob tasarla').context.entities?.product).toBe('gardirop')
  })
  it('keeps short conversation context', () => {
    const first = ask("Berlin'de projeniz var mı?")
    expect(first.context.entities?.city).toBe('berlin')
    const second = ask('Peki İstanbul?', { context: first.context })
    expect(second.intent).toBe('projects')
    expect(second.context.entities?.city).toBe('istanbul')
    expect(second.cards.map(({ href }) => href)).toContain('/projeler/demo-istanbul-gardirop')
  })
  it('prefers an admin answer over the built-in topic behaviour', () => {
    const reply = ask('showroomunuzu ziyaret edebilir miyim')
    expect(reply.intent).toBe('answer:hours')
    expect(reply.answerKey).toBe('answer:11')
    expect(reply.blocks[0].type).toBe('rich')
  })
  it('never invents pricing or durations without an approved answer', () => {
    const reply = ask('gardırop fiyatı ne kadar')
    expect(reply.intent).toBe('pricing')
    const text = JSON.stringify(reply.blocks)
    expect(text).not.toMatch(/\d+\s*(tl|₺|gün|hafta|euro)/i)
    expect(reply.actions.some((action) => action.href === '/teklif-al')).toBe(true)
  })
  it('only answers from provided published knowledge', () => {
    for (const question of ['projeleriniz', 'hizmetleriniz neler', 'modeller', 'showroom var mı', 'telefon numaranız']) {
      const reply = ask(question, {}, emptyKnowledge)
      expect(reply.cards).toHaveLength(0)
      expect(JSON.stringify(reply)).not.toContain('DEMO')
    }
    expect(ask('iletişim', {}, emptyKnowledge).blocks[0]).toMatchObject({ type: 'text' })
    // Quote form closed without an approved privacy notice → direct channels, no form promise.
    expect(JSON.stringify(ask('teklif almak istiyorum', {}, emptyKnowledge).blocks)).toContain('kapalı')
  })
  it('uses page context on detail pages', () => {
    const reply = ask('benzer projeler var mı', { page: { kind: 'project', slug: 'demo-berlin-mutfak' } })
    expect(reply.intent).toBe('page_context')
    expect(reply.context.entities?.project).toBe('demo-berlin-mutfak')
  })
  it('handles English and unsupported languages', () => {
    expect(detectLanguage('How can I contact you?')).toBe('en')
    expect(ask('What services do you offer?').lang).toBe('en')
    expect(ask('Здравствуйте').intent).toBe('unsupported_language')
  })
  it('runs guided flows step by step with a back chip', () => {
    const root = engine.respond({ flow: { id: 'start', step: 'root' } }, demoKnowledge)
    expect(root.chips.map(({ label }) => label)).toContain('Mutfak')
    const step = engine.respond({ flow: { id: 'start', step: 'space', value: 'mutfak' } }, demoKnowledge)
    expect(step.actions.some((action) => action.href?.startsWith('/tasarim-olustur'))).toBe(true)
    expect(step.chips.some((chip) => chip.flow?.step === 'root')).toBe(true)
  })
})

describe('Assistant privacy and link safety', () => {
  it('detects and masks personal data without echoing it', () => {
    expect(containsPersonalData('mailim ali@example.com')).toBe(true)
    expect(containsPersonalData('+90 555 123 45 67')).toBe(true)
    expect(containsPersonalData('TR33 0006 1005 1978 6457 8413 26')).toBe(true)
    expect(containsPersonalData('240 x 60 x 220 cm gardırop')).toBe(false)
    const masked = maskPersonalData('ali@example.com ve 0555 123 45 67, no 12345678901, kod 123456')
    expect(masked).toContain('[e-posta]')
    expect(masked).toContain('[telefon]')
    expect(masked).not.toMatch(/\d{3}/)
    const reply = ask('numaram 0555 123 45 67 beni arayın')
    expect(reply.intent).toBe('personal_data')
    expect(JSON.stringify(reply)).not.toContain('555')
    expect(reply.unanswered).toBe(false)
  })
  it('allows only known internal routes', () => {
    expect(safeInternalHref('/projeler?kategori=mutfak')).toBe('/projeler?kategori=mutfak')
    expect(safeInternalHref('/tasarim-olustur?urun=gardirop')).toBe('/tasarim-olustur?urun=gardirop')
    for (const bad of ['//evil.example', 'https://evil.example', '/admin', '/projeler?redirect=x', 'javascript:alert(1)', '/projeler/../admin', '/\\evil'])
      expect(safeInternalHref(bad)).toBeUndefined()
  })
  it('every reply link is internal or an approved settings link', () => {
    const external = new Set(['https://wa.me/900000000000?text=Merhaba', 'mailto:demo@example.com', 'tel:+900000000000'])
    for (const testCase of evalCases) {
      const reply = ask(testCase.q, { page: testCase.page, context: testCase.context })
      for (const card of reply.cards) expect(safeInternalHref(card.href)).toBe(card.href)
      for (const action of reply.actions)
        if (action.kind === 'internal') expect(safeInternalHref(action.href)).toBe(action.href)
        else if (action.kind === 'external') expect(external.has(action.href || '')).toBe(true)
    }
  })
})

describe('Assistant request validation', () => {
  const token = '1'.repeat(13) + '.' + 'a'.repeat(64)
  it('accepts small bounded messages or flow steps', () => {
    expect(assistantRequestSchema.safeParse({ token, message: 'Merhaba', path: '/' }).success).toBe(true)
    expect(assistantRequestSchema.safeParse({ token, flow: { id: 'design', step: 'product', value: 'gardirop' } }).success).toBe(true)
  })
  it.each([
    { token, message: 'a'.repeat(501) },
    { token },
    { token, message: 'x', flow: { id: 'start', step: 'root' } },
    { token, message: 'x', extra: true },
    { token, message: 'x', context: { entities: { city: 'Berlin; DROP' } } },
    { token, message: 'x', context: { lastIntent: '<script>' } },
    { token, flow: { id: 'admin', step: 'root' } },
  ])('rejects invalid payloads %#', (value) => {
    expect(assistantRequestSchema.safeParse(value).success).toBe(false)
  })
  it('derives page context only from known routes', () => {
    expect(pageContextFromPath('/projeler/demo-berlin')).toEqual({ kind: 'project', slug: 'demo-berlin' })
    expect(pageContextFromPath('/tasarim-olustur')).toEqual({ kind: 'studio' })
    expect(pageContextFromPath('//evil')).toBeUndefined()
    expect(pageContextFromPath('/projeler/<x>')).toBeUndefined()
  })
  it('validates feedback keys', () => {
    expect(feedbackRequestSchema.safeParse({ token, answerKey: 'intent:services', vote: 'up' }).success).toBe(true)
    expect(feedbackRequestSchema.safeParse({ token, answerKey: 'Robert"); DROP', vote: 'up' }).success).toBe(false)
  })
})
