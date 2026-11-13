import { intents, intentLabels, offTopicWords, adviceWords, inappropriateWords, type IntentId } from './intents'
import { analyze, buildVocabulary, type Analysis, type Vocabulary } from './vocabulary'
import { fuzzyEqual, normalizeText } from './normalize'
import { containsPersonalData } from './privacy'
import { productFromConcepts, productInfo, studioFeatures, studioHref, studioSteps, type ProductType } from './studio'
import { safeInternalHref, settingsLinkLabels, type SettingsLinkKey } from './links'
import type {
  AssistantReply,
  Confidence,
  EngineInput,
  Entities,
  FlowRequest,
  Knowledge,
  KnowledgeAnswer,
  KnowledgeFaq,
  Lang,
  NamedRef,
  PageContext,
  ReplyAction,
  ReplyBlock,
  ReplyCard,
  ReplyChip,
  ResponseEngine,
} from './types'

/* ------------------------------------------------------------------ preparation */

type EntityCandidate = { key: keyof Entities; slug: string; name: string; terms: string[] }
type SearchDoc = { card: ReplyCard; title: Set<string>; body: Set<string> }
type Prepared = {
  vocabulary: Vocabulary
  entities: EntityCandidate[]
  intentExamples: Map<IntentId, Set<string>[]>
  answers: { answer: KnowledgeAnswer; triggers: string[][]; examples: Set<string>[] }[]
  faqs: { faq: KnowledgeFaq; terms: Set<string>; answerTerms: Set<string> }[]
  search: SearchDoc[]
  citiesWithProjects: NamedRef[]
  categoriesWithProjects: NamedRef[]
}

const preparedCache = new WeakMap<Knowledge, Prepared>()

function termsOf(text: string, vocabulary: Vocabulary) {
  return analyze(text, vocabulary).terms
}

function prepare(knowledge: Knowledge): Prepared {
  const cached = preparedCache.get(knowledge)
  if (cached) return cached
  const names = [
    ...knowledge.cities.map(({ name }) => name),
    ...knowledge.countries.map(({ name }) => name),
    ...knowledge.projectCategories.map(({ name }) => name),
    ...knowledge.modelCategories.map(({ name }) => name),
    ...knowledge.services.map(({ title }) => title),
    ...knowledge.models.map(({ title }) => title),
    ...knowledge.projects.map(({ title }) => title),
    ...knowledge.showrooms.map(({ title }) => title),
  ]
  const vocabulary = buildVocabulary(knowledge.assistant.synonymGroups, names)
  const candidate = (key: keyof Entities, slug: string, name: string): EntityCandidate => ({
    key,
    slug,
    name,
    terms: termsOf(name, vocabulary),
  })
  const entities: EntityCandidate[] = [
    ...knowledge.cities.map((item) => candidate('city', item.slug, item.name)),
    ...knowledge.countries.map((item) => candidate('country', item.slug, item.name)),
    ...knowledge.projectCategories.map((item) => candidate('projectCategory', item.slug, item.name)),
    ...knowledge.modelCategories.map((item) => candidate('modelCategory', item.slug, item.name)),
    ...knowledge.services.map((item) => candidate('service', item.slug, item.title)),
    ...knowledge.models.map((item) => candidate('model', item.slug, item.title)),
    ...knowledge.projects.map((item) => candidate('project', item.slug, item.title)),
    ...knowledge.showrooms.map((item) => candidate('showroom', item.slug, item.title)),
  ].filter((item) => item.terms.length)
  const intentExamples = new Map<IntentId, Set<string>[]>()
  for (const intent of intents)
    intentExamples.set(
      intent.id,
      intent.examples.map((example) => new Set(termsOf(example, vocabulary))),
    )
  const answers = knowledge.answers.map((answer) => ({
    answer,
    triggers: answer.triggers.map((trigger) => termsOf(trigger, vocabulary)).filter((t) => t.length),
    examples: [answer.title, ...answer.examples].map((example) => new Set(termsOf(example, vocabulary))),
  }))
  const faqs = knowledge.faqs.map((faq) => ({
    faq,
    terms: new Set(termsOf(faq.question, vocabulary)),
    answerTerms: new Set(termsOf(faq.text.slice(0, 600), vocabulary)),
  }))
  const search: SearchDoc[] = []
  const doc = (card: ReplyCard, title: string, body: string) =>
    search.push({
      card,
      title: new Set(termsOf(title, vocabulary)),
      body: new Set(termsOf(body.slice(0, 800), vocabulary)),
    })
  for (const project of knowledge.projects)
    doc(
      projectCard(project),
      project.title,
      [
        project.description,
        project.summary,
        project.city?.name,
        project.country?.name,
        ...project.categories.map(({ name }) => name),
      ]
        .filter(Boolean)
        .join(' '),
    )
  for (const service of knowledge.services)
    doc(serviceCard(service), service.title, [service.description, service.summary].filter(Boolean).join(' '))
  for (const model of knowledge.models)
    doc(
      modelCard(model),
      model.title,
      [model.description, ...model.categories.map(({ name }) => name)].filter(Boolean).join(' '),
    )
  for (const showroom of knowledge.showrooms)
    doc(showroomCard(showroom), showroom.title, showroom.description || '')
  const cityMap = new Map<string, NamedRef>()
  const categoryMap = new Map<string, NamedRef>()
  for (const project of knowledge.projects) {
    if (project.city) cityMap.set(project.city.slug, project.city)
    for (const category of project.categories) categoryMap.set(category.slug, category)
  }
  const prepared: Prepared = {
    vocabulary,
    entities,
    intentExamples,
    answers,
    faqs,
    search,
    citiesWithProjects: [...cityMap.values()],
    categoriesWithProjects: [...categoryMap.values()],
  }
  preparedCache.set(knowledge, prepared)
  return prepared
}

/* ------------------------------------------------------------------ cards */

function projectCard(project: Knowledge['projects'][number]): ReplyCard {
  return {
    kind: 'project',
    title: project.title,
    description: project.description,
    meta: [project.city?.name, project.country?.name].filter(Boolean).join(' / ') || undefined,
    href: `/projeler/${project.slug}`,
    image: project.image,
  }
}
function serviceCard(service: Knowledge['services'][number]): ReplyCard {
  return {
    kind: 'service',
    title: service.title,
    description: service.description,
    href: `/hizmetler/${service.slug}`,
    image: service.image,
  }
}
function modelCard(model: Knowledge['models'][number]): ReplyCard {
  return {
    kind: 'model',
    title: model.title,
    description: model.description,
    meta: [model.categories.map(({ name }) => name).join(', '), model.modelType]
      .filter(Boolean)
      .join(' · ') || undefined,
    href: `/modeller/${model.slug}`,
    image: model.image,
  }
}
function showroomCard(showroom: Knowledge['showrooms'][number]): ReplyCard {
  return {
    kind: 'showroom',
    title: showroom.title,
    description: showroom.description,
    meta: '360° tur',
    href: `/showroom/${showroom.slug}`,
    image: showroom.image,
  }
}

/* ------------------------------------------------------------------ helpers */

function overlap(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0
  let common = 0
  for (const term of a) if (b.has(term)) common += 1
  return common / (a.size + b.size - common)
}
function containsTerms(message: Set<string>, required: string[]) {
  return required.every((term) =>
    [...message].some((candidate) => candidate === term || fuzzyEqual(candidate, term)),
  )
}
function phraseIn(text: string, phrase: string) {
  return ` ${text} `.includes(` ${phrase} `)
}
const t = (lang: Lang, tr: string, en: string) => (lang === 'en' ? en : tr)

const englishMarkers = new Set([
  'the', 'what', 'how', 'do', 'does', 'you', 'your', 'can', 'is', 'are', 'hello', 'hi', 'thanks',
  'thank', 'please', 'want', 'services', 'projects', 'contact', 'quote', 'price', 'where', 'who',
  'show', 'me', 'have', 'design', 'my', 'own', 'wardrobe', 'kitchen', 'offer', 'tour', 'about',
  'company', 'bye', 'goodbye', 'cost', 'much', 'long', 'delivery', 'models', 'bot', 'need', 'help',
  'get', 'i', 'a', 'any', 'in', 'of', 'to', 'for', 'there', 'configurator', 'virtual', 'cookies',
  'privacy', 'phone', 'email', 'address', 'reach', 'examples', 'work', 'portfolio', 'warranty',
  'stock', 'opening', 'hours', 'start', 'should', 'tool', 'similar', 'this', 'cookie', 'settings',
])
const turkishMarkers = new Set([
  've', 'bir', 'mi', 'mu', 'var', 'nasil', 'ne', 'icin', 'merhaba', 'nedir', 'neler', 'istiyorum',
  'hangi', 'nerede', 'kac', 'bu', 'sizin', 'misiniz', 'musunuz', 'yok', 'olarak', 'acaba', 'ben',
  'bana', 'lutfen', 'tesekkurler', 'peki', 'evet', 'hayir', 'tamam', 'selam',
])
const foreignMarkers = new Set([
  'der', 'die', 'das', 'und', 'ich', 'nicht', 'ist', 'sie', 'hallo', 'bonjour', 'je', 'est', 'les',
  'une', 'pour', 'avec', 'hola', 'gracias', 'que', 'por', 'para', 'ciao', 'grazie', 'privet',
])

export function detectLanguage(message: string): Lang | 'unsupported' {
  const letters = message.match(/\p{L}/gu) || []
  if (letters.length) {
    const nonLatin = letters.filter((char) => !/\p{Script=Latin}/u.test(char)).length
    if (nonLatin / letters.length > 0.5) return 'unsupported'
  }
  if (/[çğışöüÇĞİŞÖÜ]/.test(message)) return 'tr'
  const words = normalizeText(message).split(' ').filter(Boolean)
  let en = 0
  let tr = 0
  let foreign = 0
  for (const word of words) {
    if (englishMarkers.has(word)) en += 1
    if (turkishMarkers.has(word)) tr += 1
    if (foreignMarkers.has(word)) foreign += 1
  }
  if (foreign >= 2 && foreign > en && foreign > tr) return 'unsupported'
  return en > tr && en >= 1 ? 'en' : 'tr'
}

/* ------------------------------------------------------------------ entities */

const genericNameTerms = new Set(['tasarim', 'hizmet', 'model', 'proje', 'uygulama', 'atolye'])

export function extractEntities(analysis: Analysis, prepared: Prepared): Entities {
  const entities: Entities = {}
  const messageTerms = new Set(analysis.terms)
  const best = new Map<keyof Entities, { slug: string; size: number }>()
  for (const candidate of prepared.entities) {
    const matched = candidate.terms.filter((term) => containsTerms(messageTerms, [term]))
    const distinctive = matched.filter((term) => !genericNameTerms.has(term))
    // Full match, or a multi-word name missing one generic word ("iç mimari" → "İç Mimari Tasarım").
    const full = matched.length === candidate.terms.length
    const partial =
      candidate.terms.length >= 2 &&
      matched.length >= candidate.terms.length - 1 &&
      distinctive.length >= 1 &&
      candidate.terms.filter((term) => !matched.includes(term)).every((term) => genericNameTerms.has(term))
    if (!full && !partial) continue
    const size = matched.length + (full ? 0.5 : 0)
    const current = best.get(candidate.key)
    if (!current || size > current.size) best.set(candidate.key, { slug: candidate.slug, size })
  }
  for (const [key, value] of best) if (key !== 'product') entities[key] = value.slug
  const product = productFromConcepts(analysis.concepts)
  if (product) entities.product = product
  return entities
}

/* ------------------------------------------------------------------ classification */

type Ranked = { kind: 'intent'; id: IntentId; score: number } | { kind: 'answer'; answer: KnowledgeAnswer; score: number } | { kind: 'faq'; faq: KnowledgeFaq; score: number }

function scoreIntents(analysis: Analysis, prepared: Prepared, entities: Entities, page?: PageContext) {
  const messageTerms = new Set(analysis.terms)
  const scores = new Map<IntentId, number>()
  for (const intent of intents) {
    let score = 0
    for (const [concept, weight] of Object.entries(intent.keywords))
      if (analysis.concepts.has(concept)) score += weight
    if (intent.phrases?.some((phrase) => phraseIn(analysis.text, phrase) || phraseIn(analysis.stemText, phrase)))
      score += 2.6
    const examples = prepared.intentExamples.get(intent.id) || []
    let similarity = 0
    for (const example of examples) similarity = Math.max(similarity, overlap(messageTerms, example))
    score += 1.6 * similarity
    scores.set(intent.id, score)
  }
  const add = (id: IntentId, value: number) => scores.set(id, (scores.get(id) || 0) + value)
  if (entities.city || entities.country) add('projects', 1.4)
  if (entities.projectCategory && !analysis.concepts.has('model')) add('projects', 0.5)
  if (entities.modelCategory && !analysis.concepts.has('proje')) add('models', 0.5)
  if (entities.service) add('services', 2.2)
  if (entities.model) add('models', 2.2)
  if (entities.project) add('projects', 2)
  if (entities.showroom) add('showroom', 2)
  if (entities.product && analysis.concepts.has('model')) add('models', 0.6)
  if (entities.product && (analysis.concepts.has('atolye') || analysis.concepts.has('ozelolcu')))
    add('studio', 0.8)
  if (page?.kind === 'studio') {
    for (const concept of Object.keys(studioFeatures)) if (analysis.concepts.has(concept)) add('studio', 1.2)
    if (entities.product) add('studio', 0.8)
  }
  if (page && page.kind !== 'other' && page.kind !== 'studio' && (scores.get('page_context') || 0) > 0)
    add('page_context', 1)
  else scores.set('page_context', 0)
  // "teklif almak" style phrases outrank the price deflection; price alone stays price.
  if (analysis.concepts.has('teklif') && analysis.concepts.has('fiyat')) add('pricing', -1.6)
  return scores
}

function scoreAnswers(analysis: Analysis, prepared: Prepared) {
  const messageTerms = new Set(analysis.terms)
  return prepared.answers.map(({ answer, triggers, examples }) => {
    let score = 0
    let hits = 0
    for (const trigger of triggers) if (containsTerms(messageTerms, trigger)) hits += 1
    if (hits) score += 2.6 + Math.min(hits - 1, 3) * 0.4
    let similarity = 0
    for (const example of examples) similarity = Math.max(similarity, overlap(messageTerms, example))
    score += 2.4 * similarity + (similarity >= 0.75 ? 1 : 0)
    if (score > 0) score += Math.max(-1, Math.min(1, answer.priority / 100))
    return { answer, score }
  })
}

function scoreFaqs(analysis: Analysis, prepared: Prepared) {
  const messageTerms = new Set(analysis.terms)
  return prepared.faqs.map(({ faq, terms, answerTerms }) => {
    const similarity = overlap(messageTerms, terms)
    let common = 0
    for (const term of messageTerms) if (terms.has(term)) common += 1
    let bodyHits = 0
    for (const term of messageTerms) if (answerTerms.has(term)) bodyHits += 1
    return { faq, score: 3.2 * similarity + Math.min(common, 3) * 0.35 + Math.min(bodyHits, 3) * 0.1 }
  })
}

function confidenceOf(top: number, second: number): Confidence {
  if (top >= 2.3 && (top - second >= 0.45 || top >= 3.4)) return 'high'
  if (top >= 1.15) return 'medium'
  return 'low'
}

/* ------------------------------------------------------------------ engine */

const restrictedTopics = new Set<IntentId>(['pricing', 'delivery', 'warranty', 'stock', 'hours'])
const followUpIntents = new Set<IntentId>(['projects', 'models', 'services', 'showroom', 'studio'])

type Draft = Omit<AssistantReply, 'context' | 'lang'> & { entities?: Entities }

export class DeterministicEngine implements ResponseEngine {
  respond(input: EngineInput, knowledge: Knowledge): AssistantReply {
    const prepared = prepare(knowledge)
    const message = (input.message || '').trim()
    const lang: Lang = message ? (detectLanguage(message) === 'en' ? 'en' : 'tr') : 'tr'
    const finish = (draft: Draft): AssistantReply => ({
      lang,
      intent: draft.intent,
      confidence: draft.confidence,
      answerKey: draft.answerKey,
      blocks: draft.blocks,
      cards: draft.cards.slice(0, 6),
      chips: draft.chips.slice(0, 6),
      actions: dedupeActions(draft.actions).slice(0, 4),
      unanswered: draft.unanswered,
      context: {
        lastIntent: draft.intent,
        entities: { ...(draft.entities || {}) },
        turn: Math.min((input.context?.turn || 0) + 1, 999),
      },
    })
    const replies = new Replies(knowledge, prepared, lang, input.page)
    if (input.flow) return finish(replies.flow(input.flow))
    if (!message) return finish(replies.welcome())
    if (containsPersonalData(message)) return finish(replies.personalData())
    if (detectLanguage(message) === 'unsupported') return finish(replies.unsupportedLanguage())

    const analysis = analyze(message, prepared.vocabulary)
    const words = new Set([...analysis.text.split(' '), ...analysis.stems])
    if ([...words].some((word) => inappropriateWords.has(word))) return finish(replies.inappropriate())
    if ([...words].some((word) => adviceWords.has(word))) return finish(replies.advice())

    const entities = extractEntities(analysis, prepared)
    const scores = scoreIntents(analysis, prepared, entities, input.page)
    const ranked: Ranked[] = [
      ...[...scores].map(([id, score]) => ({ kind: 'intent' as const, id, score })),
      ...scoreAnswers(analysis, prepared).map(({ answer, score }) => ({ kind: 'answer' as const, answer, score })),
      ...scoreFaqs(analysis, prepared).map(({ faq, score }) => ({ kind: 'faq' as const, faq, score })),
    ].sort((a, b) => b.score - a.score)
    let top = ranked[0]
    // "General info" only exists to route to approved FAQ/answers; any reasonable match wins.
    if (top?.kind === 'intent' && top.id === 'general_info') {
      const approved = ranked.find((item) => item.kind !== 'intent' && item.score >= 0.9)
      if (approved) top = { ...approved, score: Math.max(approved.score, top.score) }
    }
    const second = ranked.find((item) => !sameCandidate(item, top) && !(item.kind === 'intent' && item.id === 'general_info'))
    const keywordScore = intents.reduce(
      (max, intent) =>
        Math.max(
          max,
          Object.entries(intent.keywords).reduce(
            (sum, [concept, weight]) => sum + (analysis.concepts.has(concept) ? weight : 0),
            0,
          ),
        ),
      0,
    )

    // Admin answer for the same topic wins over the built-in behaviour.
    if (top?.kind === 'intent') {
      const intent = intents.find((item) => item.id === (top as { id: IntentId }).id)
      const topicAnswer = ranked.find(
        (item): item is Extract<Ranked, { kind: 'answer' }> =>
          item.kind === 'answer' && item.score >= 1.1 && item.answer.topic === intent?.topic && intent?.topic !== 'general',
      )
      if (topicAnswer && topicAnswer.score >= top.score - 0.6) top = topicAnswer
    }

    // Follow-up: "Peki İstanbul?" reuses the previous intent with the new entity.
    const lastIntent = input.context?.lastIntent as IntentId | undefined
    const hasEntity = Object.keys(entities).length > 0
    if (hasEntity && keywordScore < 1 && lastIntent && followUpIntents.has(lastIntent)) {
      const merged = mergeFollowUp(input.context?.entities, entities, lastIntent)
      return finish({ ...replies.intent(lastIntent, analysis, merged), confidence: 'high' })
    }

    const confidence = confidenceOf(top?.score || 0, second?.score || 0)
    if (confidence === 'low' || !top) {
      if ([...words].some((word) => offTopicWords.has(word))) return finish(replies.offTopic())
      if (hasEntity) return finish(replies.entityOnly(entities, analysis))
      return finish(replies.fallback(analysis))
    }
    if (confidence === 'medium') {
      const options = ranked
        .filter((item) => item.score >= Math.max(0.9, (top?.score || 0) - 1))
        .filter((item, index, all) => all.findIndex((other) => sameCandidate(other, item)) === index)
        .slice(0, 3)
      if (options.length > 1) return finish(replies.clarify(options, entities, analysis))
      if (hasEntity && top.kind === 'intent' && !followUpIntents.has(top.id) && keywordScore < 1)
        return finish(replies.entityOnly(entities, analysis))
    }
    if (top.kind === 'answer') return finish(replies.adminAnswer(top.answer, confidence, entities))
    if (top.kind === 'faq') return finish(replies.faq(top.faq, confidence, entities))
    const draft = replies.intent(top.id, analysis, entities)
    return finish({ ...draft, confidence: draft.confidence === 'low' ? 'low' : confidence })
  }
}

function sameCandidate(a: Ranked | undefined, b: Ranked | undefined) {
  if (!a || !b || a.kind !== b.kind) return false
  if (a.kind === 'intent' && b.kind === 'intent') return a.id === b.id
  if (a.kind === 'answer' && b.kind === 'answer') return a.answer.id === b.answer.id
  if (a.kind === 'faq' && b.kind === 'faq') return a.faq.id === b.faq.id
  return false
}

function mergeFollowUp(previous: Entities | undefined, next: Entities, intent: IntentId): Entities {
  const merged: Entities = { ...(previous || {}) }
  // A new location replaces the previous one instead of intersecting with it.
  if (next.city || next.country) {
    delete merged.city
    delete merged.country
  }
  if (intent === 'projects' && next.projectCategory) delete merged.projectCategory
  if (intent === 'models' && next.modelCategory) delete merged.modelCategory
  delete merged.project
  delete merged.model
  delete merged.service
  return { ...merged, ...next }
}

function dedupeActions(actions: ReplyAction[]) {
  return actions.filter(
    (action, index) =>
      actions.findIndex((other) => other.href === action.href && other.kind === action.kind) === index,
  )
}

/* ------------------------------------------------------------------ reply builders */

class Replies {
  constructor(
    private knowledge: Knowledge,
    private prepared: Prepared,
    private lang: Lang,
    private page?: PageContext,
  ) {}

  private text(tr: string, en: string): ReplyBlock {
    return { type: 'text', text: t(this.lang, tr, en) }
  }
  private link(labelTr: string, labelEn: string, href: string): ReplyAction {
    return { label: t(this.lang, labelTr, labelEn), kind: 'internal', href: safeInternalHref(href) || '/' }
  }
  private chip(labelTr: string, labelEn: string, message?: string, topic?: string): ReplyChip {
    return { label: t(this.lang, labelTr, labelEn), message: message || t(this.lang, labelTr, labelEn), topic }
  }
  private popularChips(): ReplyChip[] {
    const chips: ReplyChip[] = []
    if (this.knowledge.services.length) chips.push(this.chip('Hizmetler', 'Services', undefined, 'services'))
    if (this.knowledge.projects.length) chips.push(this.chip('Projeler', 'Projects', undefined, 'projects'))
    if (this.knowledge.models.length) chips.push(this.chip('Modeller', 'Models', undefined, 'models'))
    chips.push(this.chip('Kendim tasarlamak istiyorum', 'Design it myself', undefined, 'studio'))
    chips.push({ label: t(this.lang, 'Projeme nereden başlamalıyım?', 'Where should I start?'), flow: { id: 'start', step: 'root' }, topic: 'start' })
    chips.push(this.chip('Teklif almak istiyorum', 'Get a quote', undefined, 'quote'))
    chips.push(this.chip('İletişim', 'Contact', undefined, 'contact'))
    return chips
  }
  private contactActions(): ReplyAction[] {
    const s = this.knowledge.settings
    const actions: ReplyAction[] = []
    if (s.contactFormEnabled && s.privacyReady)
      actions.push(this.link('İletişime geç', 'Contact us', '/iletisim'))
    if (s.whatsappHref) actions.push({ label: t(this.lang, settingsLinkLabels.whatsapp, 'Write on WhatsApp'), kind: 'external', href: s.whatsappHref })
    actions.push(this.link('İletişim', 'Contact', '/iletisim'))
    return actions
  }
  private base(intent: string, confidence: Confidence = 'high'): Draft {
    return { intent, confidence, answerKey: `intent:${intent}`, blocks: [], cards: [], chips: [], actions: [], unanswered: false }
  }

  welcome(): Draft {
    return { ...this.base('welcome'), chips: this.popularChips() }
  }

  personalData(): Draft {
    return {
      ...this.base('personal_data'),
      blocks: [
        this.text(
          'Lütfen e-posta, telefon veya kimlik gibi kişisel bilgilerinizi sohbete yazmayın; bu mesajdaki bilgiler kaydedilmedi. Bilgilerinizi güvenle teklif formu üzerinden iletebilirsiniz.',
          'Please do not share personal details such as e-mail or phone numbers in the chat; nothing from this message was stored. You can share them safely through the quote form.',
        ),
      ],
      actions: this.contactActions(),
    }
  }

  unsupportedLanguage(): Draft {
    return {
      ...this.base('unsupported_language', 'low'),
      blocks: [
        {
          type: 'text',
          text: 'Şu anda Türkçe ve temel İngilizce destekliyorum. / I can currently help in Turkish and basic English.',
        },
      ],
      chips: [
        { label: 'Hizmetler', message: 'Hizmetler' },
        { label: 'Services', message: 'Services' },
        { label: 'İletişim', message: 'İletişim' },
        { label: 'Contact', message: 'Contact' },
      ],
      actions: [this.link('İletişim', 'Contact', '/iletisim')],
    }
  }

  inappropriate(): Draft {
    return {
      ...this.base('inappropriate', 'low'),
      blocks: [this.text('Size yardımcı olmak isterim; lütfen sitemizdeki konulara dönelim.', "I'd like to help; let's stay on topics related to our site.")],
      chips: this.popularChips(),
    }
  }

  advice(): Draft {
    return {
      ...this.base('advice', 'high'),
      blocks: [
        this.text(
          'Hukuki, finansal veya tıbbi konularda danışmanlık veremiyorum. Kişisel verilerle ilgili sorularınız için aydınlatma metnine ve çerez politikasına göz atabilirsiniz.',
          'I cannot give legal, financial or medical advice. For personal data questions please see our privacy notice and cookie policy.',
        ),
      ],
      actions: this.privacyActions(),
    }
  }

  offTopic(): Draft {
    return {
      ...this.base('off_topic', 'high'),
      blocks: [
        this.text(
          `Bu konuda yardımcı olamıyorum. ${this.knowledge.settings.companyName} hizmetleri, projeleri, modelleri ve tasarım atölyesiyle ilgili sorularınızı yanıtlayabilirim.`,
          `I can't help with that. I can answer questions about ${this.knowledge.settings.companyName}'s services, projects, models and design studio.`,
        ),
      ],
      chips: this.popularChips(),
    }
  }

  private privacyActions(): ReplyAction[] {
    const s = this.knowledge.settings
    const actions: ReplyAction[] = [{ label: t(this.lang, 'Çerez tercihleri', 'Cookie preferences'), kind: 'consent' }]
    actions.push(this.link('Çerez politikası', 'Cookie policy', '/cerez-politikasi'))
    if (s.privacyNoticeUrl) actions.push({ label: t(this.lang, 'Aydınlatma metni', 'Privacy notice'), kind: 'external', href: s.privacyNoticeUrl })
    else if (s.privacyReady) actions.push(this.link('Aydınlatma metni', 'Privacy notice', '/iletisim#aydinlatma-metni'))
    return actions
  }

  fallback(analysis: Analysis): Draft {
    const results = this.searchCards(analysis)
    const message =
      this.knowledge.assistant.fallback ||
      t(
        this.lang,
        'Bunu tam anlayamadım. Sorunuzu farklı kelimelerle yazabilir veya aşağıdaki konulardan birini seçebilirsiniz.',
        "I didn't quite understand. Try rephrasing or pick one of the topics below.",
      )
    return {
      ...this.base('fallback', 'low'),
      blocks: [
        { type: 'text', text: message },
        ...(results.length
          ? [this.text('Sitede bulduğum ilgili içerikler:', 'Related content I found on the site:')]
          : []),
      ],
      cards: results,
      chips: this.popularChips(),
      actions: this.contactActions(),
      unanswered: true,
    }
  }

  private searchCards(analysis: Analysis) {
    const terms = new Set(analysis.terms)
    if (!terms.size) return []
    return this.prepared.search
      .map((doc) => {
        let score = 0
        for (const term of terms) {
          if (doc.title.has(term)) score += 2
          else if (doc.body.has(term)) score += 1
        }
        return { doc, score }
      })
      .filter(({ score }) => score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ doc }) => doc.card)
  }

  clarify(options: Ranked[], entities: Entities, analysis: Analysis): Draft {
    const chips: ReplyChip[] = options.map((option) => {
      if (option.kind === 'answer') return { label: option.answer.title.slice(0, 48), message: option.answer.title, topic: `answer:${option.answer.id}` }
      if (option.kind === 'faq') return { label: option.faq.question.slice(0, 48), message: option.faq.question, topic: `faq:${option.faq.id}` }
      return { label: intentLabels[option.id], message: this.intentPrompt(option.id, entities), topic: option.id }
    })
    return {
      ...this.base('clarify', 'medium'),
      blocks: [this.text('Bunu mu demek istediniz?', 'Did you mean one of these?')],
      chips,
      cards: this.searchCards(analysis).slice(0, 2),
      entities,
    }
  }

  private entityName(key: keyof Entities, slug?: string) {
    if (!slug) return undefined
    const list: NamedRef[] =
      key === 'city'
        ? this.knowledge.cities
        : key === 'country'
          ? this.knowledge.countries
          : key === 'projectCategory'
            ? this.knowledge.projectCategories
            : key === 'modelCategory'
              ? this.knowledge.modelCategories
              : []
    return list.find((item) => item.slug === slug)?.name
  }

  private intentPrompt(id: IntentId, entities: Entities) {
    const place = this.entityName('city', entities.city) || this.entityName('country', entities.country)
    const product = entities.product ? productInfo[entities.product].label : undefined
    if (id === 'projects') return [place, this.entityName('projectCategory', entities.projectCategory), 'projeleri'].filter(Boolean).join(' ')
    if (id === 'models') return [this.entityName('modelCategory', entities.modelCategory) || product, 'modelleri'].filter(Boolean).join(' ')
    if (id === 'studio') return product ? `${product} tasarlamak istiyorum` : 'Tasarım atölyesi'
    return intentLabels[id]
  }

  /** Message with only a recognised entity, e.g. "mutfak" or "Berlin". */
  entityOnly(entities: Entities, analysis: Analysis): Draft {
    if ((entities.city || entities.country) && !entities.product && !entities.modelCategory)
      return this.intent('projects', analysis, entities)
    if (entities.service) return this.intent('services', analysis, entities)
    if (entities.model) return this.intent('models', analysis, entities)
    if (entities.project) return this.intent('projects', analysis, entities)
    if (entities.showroom) return this.intent('showroom', analysis, entities)
    const chips: ReplyChip[] = []
    const product = entities.product ? productInfo[entities.product] : undefined
    const projectCategory = this.entityName('projectCategory', entities.projectCategory)
    const modelCategory = this.entityName('modelCategory', entities.modelCategory)
    if (projectCategory) chips.push({ label: `${projectCategory} projeleri`, message: `${projectCategory} projeleri`, topic: 'projects' })
    if (modelCategory || (product && this.knowledge.models.length))
      chips.push({ label: `${modelCategory || product?.label} modelleri`, message: `${modelCategory || product?.label} modelleri`, topic: 'models' })
    if (product) chips.push({ label: `${product.label} tasarla`, message: `${product.label} tasarlamak istiyorum`, topic: 'studio' })
    if (!chips.length) return this.fallback(analysis)
    return {
      ...this.base('clarify', 'medium'),
      blocks: [this.text('Bunu mu demek istediniz?', 'Did you mean one of these?')],
      chips,
      entities,
    }
  }

  adminAnswer(answer: KnowledgeAnswer, confidence: Confidence, entities: Entities): Draft {
    const s = this.knowledge.settings
    const actions: ReplyAction[] = []
    for (const action of answer.actions) {
      if (action.kind === 'route') {
        const href = safeInternalHref(action.href)
        if (href) actions.push({ label: action.label, kind: 'internal', href })
      } else if (action.kind === 'consent') actions.push({ label: action.label, kind: 'consent' })
      else {
        const href = settingsHref(s, action.key)
        if (href) actions.push({ label: action.label, kind: href.startsWith('/') ? 'internal' : 'external', href })
      }
    }
    return {
      ...this.base(`answer:${answer.topic}`, confidence),
      answerKey: `answer:${answer.id}`,
      blocks: [{ type: 'rich', content: answer.answer }],
      actions,
      chips: this.popularChips().slice(0, 3),
      entities,
    }
  }

  faq(faq: KnowledgeFaq, confidence: Confidence, entities: Entities): Draft {
    return {
      ...this.base('faq', confidence),
      answerKey: `faq:${faq.id}`,
      blocks: [this.text(faq.question, faq.question), { type: 'rich', content: faq.answer }],
      actions: [],
      chips: this.popularChips().slice(0, 3),
      entities,
    }
  }

  intent(id: IntentId, analysis: Analysis, entities: Entities): Draft {
    switch (id) {
      case 'greeting':
        return {
          ...this.base(id),
          blocks: [
            this.text(
              `Merhaba! Ben ${this.knowledge.assistant.name}, ${this.knowledge.settings.companyName} sitesinin otomatik asistanıyım. Hizmetler, projeler, modeller, showroom ve tasarım atölyesi hakkında yardımcı olabilirim.`,
              `Hello! I'm ${this.knowledge.assistant.name}, the automated assistant of ${this.knowledge.settings.companyName}. I can help with services, projects, models, showrooms and the design studio.`,
            ),
          ],
          chips: this.popularChips(),
        }
      case 'thanks':
        return { ...this.base(id), blocks: [this.text('Rica ederim! Başka bir konuda yardımcı olabilir miyim?', "You're welcome! Anything else I can help with?")], chips: this.popularChips().slice(0, 4) }
      case 'goodbye':
        return { ...this.base(id), blocks: [this.text('Görüşmek üzere! İhtiyacınız olduğunda buradayım.', 'See you! I am here whenever you need.')] }
      case 'identity':
        return {
          ...this.base(id),
          blocks: [
            this.text(
              'Ben otomatik bir asistanım, gerçek bir kişi değilim. Cevaplarımı yalnızca bu sitede yayınlanmış içerikten hazırlarım. Ekibimizle konuşmak isterseniz iletişim seçeneklerini kullanabilirsiniz.',
              'I am an automated assistant, not a person. My answers come only from content published on this site. You can reach our team through the contact options.',
            ),
          ],
          actions: this.contactActions(),
        }
      case 'services':
        return this.services(analysis, entities)
      case 'projects':
      case 'featured_projects':
        return this.projects(id, analysis, entities)
      case 'models':
        return this.models(entities)
      case 'showroom':
        return this.showroom(entities)
      case 'studio':
        return this.studio(analysis, entities)
      case 'quote':
        return this.quote(entities)
      case 'contact':
        return this.contact()
      case 'about':
        return this.about()
      case 'privacy':
        return {
          ...this.base(id),
          blocks: [
            this.text(
              'Zorunlu olmayan çerezler ve kalıcı tarayıcı kayıtları yalnızca izninizle çalışır. Tercihlerinizi istediğiniz an değiştirebilir veya geri alabilirsiniz. Sohbet mesajlarınız varsayılan olarak saklanmaz.',
              'Non-essential cookies and persistent browser storage run only with your consent. You can change or withdraw it at any time. Chat messages are not stored by default.',
            ),
          ],
          actions: this.privacyActions(),
        }
      case 'start_flow':
        return this.flow({ id: 'start', step: 'root' })
      case 'examples_flow':
        return this.flow({ id: 'examples', step: 'root' })
      case 'page_context':
        return this.pageContext(analysis, entities)
      case 'general_info':
        return { ...this.fallback(analysis), intent: 'general_info' }
      default:
        if (restrictedTopics.has(id)) return this.restricted(id)
        return this.fallback(analysis)
    }
  }

  private restricted(id: IntentId): Draft {
    const subject: Record<string, [string, string]> = {
      pricing: ['Fiyat ve bütçe', 'Pricing'],
      delivery: ['Teslim ve üretim süresi', 'Delivery times'],
      warranty: ['Garanti', 'Warranty'],
      stock: ['Stok ve üretim uygunluğu', 'Stock and availability'],
      hours: ['Çalışma saatleri ve randevu', 'Opening hours and appointments'],
    }
    const [tr, en] = subject[id] || ['Bu konu', 'This topic']
    return {
      ...this.base(id),
      blocks: [
        this.text(
          `${tr} konusunda size bilgi veremiyorum. Bu konuda net bilgi için ekibimizle iletişime geçebilirsiniz.`,
          `${en}: I can't give details on this. For accurate information please contact our team.`,
        ),
      ],
      actions: this.contactActions(),
    }
  }

  private services(analysis: Analysis, entities: Entities): Draft {
    const list = this.knowledge.services
    const draft = this.base('services')
    if (entities.service) {
      const service = list.find((item) => item.slug === entities.service)
      if (service)
        return {
          ...draft,
          blocks: [this.text(service.description || service.title, service.description || service.title)],
          cards: [serviceCard(service)],
          actions: [this.link('Hizmeti incele', 'View service', `/hizmetler/${service.slug}`), ...this.contactActions().slice(0, 1)],
          chips: list.filter((item) => item.slug !== service.slug).slice(0, 3).map((item) => ({ label: item.title.slice(0, 48), message: item.title, topic: 'services' })),
          entities,
        }
    }
    if (!list.length)
      return {
        ...draft,
        blocks: [this.text('Henüz yayınlanmış bir hizmet bilgisi bulunmuyor. Ekibimize iletişim sayfasından ulaşabilirsiniz.', 'No services have been published yet. You can reach our team via the contact page.')],
        actions: this.contactActions(),
      }
    const askedSpecific = analysis.residual.length > 0 || analysis.concepts.has('icmimari')
    return {
      ...draft,
      blocks: [
        askedSpecific && !entities.service
          ? this.text('Bu adla yayınlanmış bir hizmet bulamadım. Mevcut hizmetlerimiz:', "I couldn't find a published service with that name. Our services:")
          : this.text(`Yayınlanmış ${list.length} hizmetimiz var:`, `We have ${list.length} published services:`),
      ],
      cards: list.slice(0, 6).map(serviceCard),
      actions: [this.link('Tüm hizmetler', 'All services', '/hizmetler'), ...this.contactActions().slice(0, 1)],
      entities,
    }
  }

  private projects(id: IntentId, analysis: Analysis, entities: Entities): Draft {
    const all = this.knowledge.projects
    const draft = this.base(id === 'featured_projects' ? 'featured_projects' : 'projects')
    if (entities.project) {
      const project = all.find((item) => item.slug === entities.project)
      if (project)
        return {
          ...draft,
          blocks: [this.text(project.description || project.title, project.description || project.title)],
          cards: [projectCard(project)],
          actions: [this.link('Projeyi incele', 'View project', `/projeler/${project.slug}`)],
          entities,
        }
    }
    if (!all.length)
      return {
        ...draft,
        blocks: [this.text('Henüz yayınlanmış bir projemiz bulunmuyor.', 'There are no published projects yet.')],
        actions: [this.link('Projeler', 'Projects', '/projeler'), ...this.contactActions().slice(0, 1)],
      }
    let results = all
    if (entities.city) results = results.filter((item) => item.city?.slug === entities.city)
    if (entities.country) results = results.filter((item) => item.country?.slug === entities.country)
    if (entities.projectCategory) results = results.filter((item) => item.categories.some((c) => c.slug === entities.projectCategory))
    if (id === 'featured_projects') results = results.filter((item) => item.featured).concat(results.filter((item) => !item.featured))
    const city = this.entityName('city', entities.city)
    const country = this.entityName('country', entities.country)
    const category = this.entityName('projectCategory', entities.projectCategory)
    const filterLabel = [city || country, category].filter(Boolean).join(' · ')
    const query = new URLSearchParams()
    if (entities.projectCategory) query.set('kategori', entities.projectCategory)
    if (entities.country) query.set('ulke', entities.country)
    if (entities.city) query.set('sehir', entities.city)
    const archiveHref = `/projeler${query.size ? `?${query}` : ''}`
    const locations = this.prepared.citiesWithProjects
      .filter((item) => item.slug !== entities.city)
      .slice(0, 4)
      .map((item) => ({ label: `${item.name} projeleri`, message: `${item.name} projeleri`, topic: 'projects' }))
    if (!results.length)
      return {
        ...draft,
        blocks: [
          this.text(
            `${filterLabel || 'Bu arama'} için yayınlanmış bir projemiz şu anda bulunmuyor.${locations.length ? ' Projelerimizin bulunduğu diğer konumlar:' : ''}`,
            `There are no published projects for ${filterLabel || 'this search'} right now.`,
          ),
        ],
        chips: locations,
        actions: [this.link('Tüm projeler', 'All projects', '/projeler')],
        entities,
      }
    const unknownPlace = !filterLabel && looksLikePlace(analysis)
    return {
      ...draft,
      blocks: [
        unknownPlace
          ? this.text('Aradığınız konuma ait yayınlanmış bir proje bulamadım. Diğer projelerimize göz atabilirsiniz:', "I couldn't find published projects for that place. Here are other projects:")
          : filterLabel
            ? this.text(`${filterLabel} için ${results.length} yayınlanmış proje buldum:`, `I found ${results.length} published projects for ${filterLabel}:`)
            : this.text('Yayınlanmış projelerimizden bazıları:', 'Some of our published projects:'),
      ],
      cards: results.slice(0, 6).map(projectCard),
      chips: unknownPlace || !filterLabel ? locations : [],
      actions: [this.link(filterLabel ? 'Sonuçları portföyde aç' : 'Tüm projeler', filterLabel ? 'Open in portfolio' : 'All projects', archiveHref)],
      entities,
    }
  }

  private models(entities: Entities): Draft {
    const all = this.knowledge.models
    const draft = this.base('models')
    const note = this.text(
      'Not: Tasarım modelleri referans/katalog kayıtlarıdır; tamamlanmış müşteri projesi değildir.',
      'Note: design models are catalogue references, not completed client projects.',
    )
    if (entities.model) {
      const model = all.find((item) => item.slug === entities.model)
      if (model)
        return {
          ...draft,
          blocks: [
            this.text(model.description || model.title, model.description || model.title),
            ...(model.modelType ? [this.text(`Referans sınıfı: ${model.modelType}.`, `Reference type: ${model.modelType}.`)] : []),
            note,
          ],
          cards: [modelCard(model)],
          actions: [this.link('Modeli incele', 'View model', `/modeller/${model.slug}`)],
          entities,
        }
    }
    if (!all.length)
      return {
        ...draft,
        blocks: [this.text('Henüz yayınlanmış bir tasarım modelimiz bulunmuyor.', 'No design models have been published yet.')],
        actions: [this.link('Tasarım atölyesini aç', 'Open design studio', studioHref(entities.product))],
        entities,
      }
    let category = entities.modelCategory
    if (!category && entities.product) {
      const concepts = productInfo[entities.product].concepts
      category = this.knowledge.modelCategories.find((item) =>
        analyze(item.name, this.prepared.vocabulary).terms.some((term) => concepts.includes(term)),
      )?.slug
    }
    const results = category ? all.filter((item) => item.categories.some((c) => c.slug === category)) : all
    const categoryName = this.entityName('modelCategory', category) || (entities.product ? productInfo[entities.product].label : undefined)
    const href = category ? `/modeller?kategori=${category}` : '/modeller'
    if (!results.length)
      return {
        ...draft,
        blocks: [this.text(`${categoryName || 'Bu kategori'} için yayınlanmış bir model bulunmuyor.`, `There are no published models for ${categoryName || 'this category'}.`)],
        chips: this.knowledge.modelCategories.slice(0, 4).map((item) => ({ label: `${item.name} modelleri`, message: `${item.name} modelleri`, topic: 'models' })),
        actions: [this.link('Tüm modeller', 'All models', '/modeller'), this.link('Kendin tasarla', 'Design it yourself', studioHref(entities.product))],
        entities,
      }
    return {
      ...draft,
      blocks: [
        this.text(
          categoryName ? `${categoryName} için ${results.length} tasarım modeli:` : 'Tasarım modellerimizden bazıları:',
          categoryName ? `${results.length} design models for ${categoryName}:` : 'Some of our design models:',
        ),
        note,
      ],
      cards: results.slice(0, 6).map(modelCard),
      actions: [this.link('Modelleri incele', 'Browse models', href), this.link('Kendin tasarla', 'Design it yourself', studioHref(entities.product))],
      entities,
    }
  }

  private showroom(entities: Entities): Draft {
    const list = this.knowledge.showrooms
    const draft = this.base('showroom')
    const selected = entities.showroom ? list.filter((item) => item.slug === entities.showroom) : list
    if (!list.length)
      return {
        ...draft,
        blocks: [this.text('Şu anda yayınlanmış bir 360° showroom turu bulunmuyor.', 'There is no published 360° showroom tour yet.')],
        actions: [this.link('Projeler', 'Projects', '/projeler')],
      }
    return {
      ...draft,
      blocks: [this.text('360° showroom turlarımızda mekânların içinde gezinebilirsiniz:', 'Explore our spaces in 360° tours:')],
      cards: selected.slice(0, 6).map(showroomCard),
      actions: [this.link('Showroom', 'Showroom', '/showroom')],
      entities,
    }
  }

  private studio(analysis: Analysis, entities: Entities): Draft {
    const draft = this.base('studio')
    const feature = Object.keys(studioFeatures).find((concept) => analysis.concepts.has(concept))
    const product = entities.product
    if (feature && !(product && !analysis.concepts.has(feature))) {
      const [tr, en] = studioFeatures[feature]
      return {
        ...draft,
        answerKey: `studio:${feature}`,
        blocks: [this.text(tr, en)],
        actions: [this.link('Tasarım atölyesini aç', 'Open design studio', studioHref(product))],
        chips: ['pdf', 'paylas', 'cnc', 'gonder']
          .filter((item) => item !== feature)
          .slice(0, 3)
          .map((item) => this.chip(studioChipLabel(item), studioChipLabel(item), undefined, 'studio')),
        entities,
      }
    }
    if (product) {
      const info = productInfo[product]
      return {
        ...draft,
        answerKey: `studio:product:${product}`,
        blocks: [
          this.text(
            `${info.label} için tasarım atölyesini açabilirsiniz. Adımlar: ${studioSteps.join(' → ')}. Tasarımınızı PDF/PNG olarak indirebilir veya bağlantıyla paylaşabilirsiniz. Bu araç üretim/CNC çizimi değildir.`,
            `You can open the design studio for a ${info.labelEn}. Steps: dimensions → sections → compartments → fronts & colour → hardware → summary. It is not a production drawing.`,
          ),
        ],
        actions: [this.link(`${info.label} tasarla`, `Design a ${info.labelEn}`, studioHref(product))],
        chips: this.knowledge.models.length ? [{ label: `${info.label} modelleri`, message: `${info.label} modelleri`, topic: 'models' }] : [],
        entities,
      }
    }
    return {
      ...draft,
      blocks: [
        this.text(
          `Tasarım atölyesinde mobilyanızı altı adımda tasarlayabilirsiniz: ${studioSteps.join(' → ')}. Ürün tipleri: ${Object.values(productInfo).map(({ label }) => label).join(', ')}. Ölçü kilitleri, insan ölçeği, mekân rengi, PDF/PNG indirme ve paylaşım bağlantısı bulunur. Bu araç üretim/CNC çizimi değildir.`,
          'In the design studio you design your furniture in six steps: dimensions, sections, compartments, fronts and colour, hardware, summary. You can download PDF/PNG or share a link. It is not a production drawing.',
        ),
      ],
      actions: [this.link('Tasarım atölyesini aç', 'Open design studio', '/tasarim-olustur')],
      chips: (['mutfak', 'gardirop', 'portmanto', 'banyo', 'tv', 'ozel'] as ProductType[]).map((item) => ({
        label: t(this.lang, productInfo[item].label, productInfo[item].labelEn),
        flow: { id: 'design', step: 'product', value: item },
        topic: `studio:${item}`,
      })),
      entities,
    }
  }

  private quote(entities: Entities): Draft {
    const s = this.knowledge.settings
    const draft = this.base('quote')
    if (!s.contactFormEnabled || !s.privacyReady)
      return {
        ...draft,
        blocks: [this.text('İletişim formu şu anda gönderime kapalı. Mevcut iletişim kanallarımızdan bize ulaşabilirsiniz.', 'The contact form is currently closed. Please use our contact channels.')],
        actions: this.contactActions(),
        entities,
      }
    return {
      ...draft,
      blocks: [
        this.text(
          'İletişim sayfasındaki proje formunda ad soyad, e-posta, telefon ve en fazla 500 karakterlik proje açıklaması istenir. Lütfen kişisel bilgilerinizi sohbete yazmayın, doğrudan formu kullanın.',
          'The project form on the contact page asks for your name, e-mail, phone and a project description of up to 500 characters. Please do not share personal data in the chat; use the form directly.',
        ),
        this.text('Tasarım atölyesinde hazırladığınız tasarımı da teklifinize ekleyebilirsiniz.', 'You can also attach a design created in the design studio.'),
      ],
      actions: [this.link('İletişime geç', 'Contact us', '/iletisim'), this.link('Tasarım atölyesi', 'Design studio', studioHref(entities.product))],
      entities,
    }
  }

  private contact(): Draft {
    const s = this.knowledge.settings
    const lines: string[] = []
    if (s.email) lines.push(`E-posta: ${s.email}`)
    if (s.phone) lines.push(`Telefon: ${s.phone}`)
    if (s.whatsappHref) lines.push(t(this.lang, 'WhatsApp hattımız mevcut.', 'WhatsApp is available.'))
    const place = [s.address, s.city, s.country].filter(Boolean).join(', ')
    if (place) lines.push(`${t(this.lang, 'Adres', 'Address')}: ${place}`)
    const actions: ReplyAction[] = []
    if (s.whatsappHref) actions.push({ label: t(this.lang, settingsLinkLabels.whatsapp, 'WhatsApp'), kind: 'external', href: s.whatsappHref })
    if (s.email) actions.push({ label: t(this.lang, settingsLinkLabels.email, 'E-mail'), kind: 'external', href: `mailto:${s.email}` })
    if (s.phone) {
      const tel = settingsHref(s, 'phone')
      if (tel) actions.push({ label: t(this.lang, settingsLinkLabels.phone, 'Call'), kind: 'external', href: tel })
    }
    if (s.mapsHref) actions.push({ label: t(this.lang, settingsLinkLabels.maps, 'Map'), kind: 'external', href: s.mapsHref })
    actions.push(this.link('İletişim sayfası', 'Contact page', '/iletisim'))
    if (!lines.length && !s.socials.length)
      return {
        ...this.base('contact'),
        blocks: [this.text('Sitede henüz yayınlanmış bir iletişim bilgisi bulunmuyor. İletişim sayfasını kontrol edebilirsiniz.', 'No contact details have been published yet. Please check the contact page.')],
        actions,
      }
    if (s.socials.length) lines.push(`${t(this.lang, 'Sosyal medya', 'Social media')}: ${s.socials.map(({ label }) => label).join(', ')}`)
    return { ...this.base('contact'), blocks: lines.map((line) => ({ type: 'text' as const, text: line })), actions }
  }

  private about(): Draft {
    const about = this.knowledge.about
    const s = this.knowledge.settings
    const text = [about?.heading, about?.subtitle, about?.summary].filter(Boolean).join(' — ') || s.companyDescription
    return {
      ...this.base('about'),
      blocks: [
        text
          ? { type: 'text', text }
          : this.text('Hakkımızda içeriği henüz yayınlanmadı.', 'Our about page has not been published yet.'),
      ],
      actions: [this.link('Hakkımızda', 'About us', '/hakkimizda')],
    }
  }

  private pageContext(analysis: Analysis, entities: Entities): Draft {
    const page = this.page
    const draft = this.base('page_context')
    if (page?.kind === 'project') {
      const project = this.knowledge.projects.find((item) => item.slug === page.slug)
      if (project) {
        const similar = this.knowledge.projects
          .filter((item) => item.slug !== project.slug)
          .map((item) => ({
            item,
            score:
              item.categories.filter((c) => project.categories.some((own) => own.slug === c.slug)).length * 2 +
              (item.city?.slug && item.city.slug === project.city?.slug ? 1 : 0),
          }))
          .filter(({ score }) => score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map(({ item }) => projectCard(item))
        const place = [project.city?.name, project.country?.name].filter(Boolean).join(' / ')
        const categories = project.categories.map(({ name }) => name).join(', ')
        return {
          ...draft,
          blocks: [
            this.text(
              `${project.title}${place ? ` — konum: ${place}` : ''}${categories ? `. Kategori: ${categories}` : ''}.`,
              `${project.title}${place ? ` — location: ${place}` : ''}.`,
            ),
            similar.length
              ? this.text('Benzer projeler:', 'Similar projects:')
              : this.text('Bu projeye benzer başka yayınlanmış proje bulunmuyor.', 'No similar published projects yet.'),
          ],
          cards: similar,
          actions: [this.link('Benzer bir proje için teklif al', 'Get a quote for a similar project', '/iletisim')],
          entities: { ...entities, project: project.slug },
        }
      }
    }
    if (page?.kind === 'model') {
      const model = this.knowledge.models.find((item) => item.slug === page.slug)
      if (model) {
        const similar = this.knowledge.models
          .filter((item) => item.slug !== model.slug && item.categories.some((c) => model.categories.some((own) => own.slug === c.slug)))
          .slice(0, 3)
          .map(modelCard)
        return {
          ...draft,
          blocks: [
            this.text(
              `${model.title}${model.categories.length ? ` — kategori: ${model.categories.map(({ name }) => name).join(', ')}` : ''}${model.modelType ? `. Referans sınıfı: ${model.modelType}` : ''}. Bu bir tasarım modelidir; tamamlanmış proje değildir.`,
              `${model.title} is a design model, not a completed project.`,
            ),
          ],
          cards: similar,
          actions: [this.link('Benzerini tasarla', 'Design a similar one', '/tasarim-olustur'), this.link('Bilgi al', 'Ask about it', '/iletisim')],
          entities: { ...entities, model: model.slug },
        }
      }
    }
    if (page?.kind === 'service') {
      const service = this.knowledge.services.find((item) => item.slug === page.slug)
      if (service)
        return { ...draft, blocks: [this.text(service.description || service.title, service.description || service.title)], actions: [this.link('Teklif al', 'Get a quote', '/iletisim')], entities: { ...entities, service: service.slug } }
    }
    if (page?.kind === 'showroom') {
      const showroom = this.knowledge.showrooms.find((item) => item.slug === page.slug)
      if (showroom) {
        const project = this.knowledge.projects.find((item) => item.slug === showroom.projectSlug)
        return {
          ...draft,
          blocks: [this.text(showroom.description || showroom.title, showroom.description || showroom.title)],
          cards: project ? [projectCard(project)] : [],
          actions: [this.link('Bu tasarım için bilgi al', 'Ask about this design', '/iletisim')],
          entities: { ...entities, showroom: showroom.slug },
        }
      }
    }
    return this.fallback(analysis)
  }

  flow(request: FlowRequest): Draft {
    const back: ReplyChip = { label: t(this.lang, '← Başa dön', '← Back'), flow: { id: request.id, step: 'root' } }
    const draft = this.base(`flow:${request.id}`)
    if (request.id === 'start') {
      const spaces: [string, string, ProductType | undefined, string][] = [
        ['mutfak', 'Mutfak', 'mutfak', 'mutfak'],
        ['yatak', 'Yatak odası', 'gardirop', 'yatakodasi'],
        ['antre', 'Antre / giriş', 'portmanto', 'vestiyer'],
        ['banyo', 'Banyo', 'banyo', 'banyo'],
        ['salon', 'Salon', 'tv', 'salon'],
        ['diger', 'Diğer', 'ozel', 'ozelolcu'],
      ]
      const chosen = spaces.find(([value]) => value === request.value)
      if (request.step !== 'space' || !chosen)
        return {
          ...draft,
          blocks: [this.text('Hangi mekân için düşünüyorsunuz?', 'Which space are you planning?')],
          chips: spaces.map(([value, label]) => ({ label, flow: { id: 'start', step: 'space', value }, topic: `space:${value}` })),
        }
      const [, label, product, concept] = chosen
      const services = this.knowledge.services.filter((item) =>
        analyze(`${item.title} ${item.description || ''}`, this.prepared.vocabulary).concepts.has(concept),
      )
      const productConcepts = product ? productInfo[product].concepts : []
      const models = this.knowledge.models.filter((item) =>
        item.categories.some((category) =>
          analyze(category.name, this.prepared.vocabulary).terms.some((term) => term === concept || productConcepts.includes(term)),
        ),
      )
      return {
        ...draft,
        blocks: [
          this.text(
            `${label} için önerilerim: ${[services.length ? 'ilgili hizmetler' : '', models.length ? 'tasarım modelleri' : '', 'tasarım atölyesinde ilk taslak', 'iletişim sayfasındaki proje formu'].filter(Boolean).join(', ')}.`,
            `For ${label}: related services, models, a first draft in the design studio and the project form on the contact page.`,
          ),
        ],
        cards: [...services.slice(0, 2).map(serviceCard), ...models.slice(0, 2).map(modelCard)],
        actions: [
          this.link(product ? `${productInfo[product].label} tasarla` : 'Tasarım atölyesi', 'Design studio', studioHref(product)),
          ...(this.knowledge.settings.contactFormEnabled && this.knowledge.settings.privacyReady
            ? [this.link('İletişime geç', 'Contact us', '/iletisim')]
            : this.contactActions()),
        ],
        chips: [back],
        entities: product ? { product } : {},
      }
    }
    if (request.id === 'design') {
      const product = (Object.keys(productInfo) as ProductType[]).find((item) => item === request.value)
      if (request.step !== 'product' || !product)
        return {
          ...draft,
          blocks: [this.text('Hangi ürünü tasarlamak istersiniz?', 'Which product would you like to design?')],
          chips: (Object.keys(productInfo) as ProductType[]).map((item) => ({
            label: t(this.lang, productInfo[item].label, productInfo[item].labelEn),
            flow: { id: 'design', step: 'product', value: item },
            topic: `studio:${item}`,
          })),
        }
      return { ...this.studio(analyze(''), { product }), intent: 'flow:design', chips: [back] }
    }
    if (request.id === 'quote') {
      const categories = this.knowledge.projectCategories
      if (request.step !== 'type' || !request.value)
        return {
          ...draft,
          blocks: [this.text('Hangi tür proje için teklif almak istiyorsunuz?', 'What kind of project is it?')],
          chips: (categories.length ? categories.slice(0, 5).map(({ slug, name }) => ({ label: name, value: slug })) : [
            { label: 'Mutfak', value: 'mutfak' },
            { label: 'Gardırop', value: 'gardirop' },
            { label: 'Diğer', value: 'diger' },
          ]).map(({ label, value }) => ({ label, flow: { id: 'quote', step: 'type', value }, topic: `quote:${value}` })),
        }
      return { ...this.quote({}), intent: 'flow:quote', chips: [back] }
    }
    // examples
    const [kind, slug] = (request.value || '').split(':')
    if (request.step === 'pick' && slug) {
      const entities: Entities = kind === 'city' ? { city: slug } : { projectCategory: slug }
      return { ...this.projects('projects', analyze(''), entities), intent: 'flow:examples', chips: [back] }
    }
    const chips: ReplyChip[] = [
      ...this.prepared.categoriesWithProjects.slice(0, 4).map(({ slug: value, name }) => ({ label: name, flow: { id: 'examples' as const, step: 'pick', value: `cat:${value}` }, topic: 'projects' })),
      ...this.prepared.citiesWithProjects.slice(0, 4).map(({ slug: value, name }) => ({ label: name, flow: { id: 'examples' as const, step: 'pick', value: `city:${value}` }, topic: 'projects' })),
    ]
    if (!chips.length)
      return { ...this.projects('projects', analyze(''), {}), intent: 'flow:examples' }
    return {
      ...draft,
      blocks: [this.text('Hangi kategori veya şehirdeki işlerimizi görmek istersiniz?', 'Which category or city would you like to see?')],
      chips,
      actions: [this.link('Tüm projeler', 'All projects', '/projeler')],
    }
  }
}

function studioChipLabel(feature: string) {
  return (
    {
      pdf: 'PDF/PNG nasıl indirilir?',
      paylas: 'Paylaşım bağlantısı',
      cnc: 'Üretim çizimi mi?',
      gonder: 'Tasarımı nasıl gönderirim?',
      olcu: 'Ölçüler',
    }[feature] || feature
  )
}

/** A capitalised or apostrophe-suffixed word suggests the visitor named a place we don't know. */
function looksLikePlace(analysis: Analysis) {
  return analysis.residual.some((term) => term.length >= 4) && /\p{Lu}\p{Ll}+['’]|\s\p{Lu}\p{Ll}{2,}/u.test(analysis.raw)
}

function settingsHref(s: Knowledge['settings'], key: SettingsLinkKey): string | undefined {
  switch (key) {
    case 'whatsapp':
      return s.whatsappHref
    case 'email':
      return s.email ? `mailto:${s.email}` : undefined
    case 'phone':
      return s.phone ? `tel:${s.phone.replace(/[\s().-]/g, '')}` : undefined
    case 'maps':
      return s.mapsHref
    case 'privacyNotice':
      return s.privacyNoticeUrl || (s.privacyReady ? '/kvkk-aydinlatma-metni' : undefined)
    case 'cookiePolicy':
      return '/cerez-politikasi'
    default:
      return s.socials.find((social) => social.label.toLowerCase() === key)?.href
  }
}

export const defaultEngine: ResponseEngine = new DeterministicEngine()
