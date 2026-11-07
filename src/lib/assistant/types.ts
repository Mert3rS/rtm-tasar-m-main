import type { Faq } from '@/payload-types'
import type { AnswerTopic } from './topics'
import type { ProductType } from './studio'

export type Lang = 'tr' | 'en'
export type RichContent = Faq['answer']

export type KnowledgeImage = { url: string; alt: string }
export type NamedRef = { slug: string; name: string }

export type KnowledgeProject = {
  slug: string
  title: string
  description?: string
  categories: NamedRef[]
  city?: NamedRef
  country?: NamedRef
  featured: boolean
  image?: KnowledgeImage
  summary?: string
}
export type KnowledgeService = {
  slug: string
  title: string
  description?: string
  image?: KnowledgeImage
  summary?: string
}
export type KnowledgeModel = {
  slug: string
  title: string
  description?: string
  categories: NamedRef[]
  modelType?: string
  image?: KnowledgeImage
}
export type KnowledgeShowroom = {
  slug: string
  title: string
  description?: string
  image?: KnowledgeImage
  projectSlug?: string
}
export type KnowledgeFaq = {
  id: string
  question: string
  answer: RichContent
  text: string
  category?: string
}
export type KnowledgeAction =
  | { kind: 'route'; label: string; href: string }
  | { kind: 'settings'; label: string; key: import('./links').SettingsLinkKey }
  | { kind: 'consent'; label: string }
export type KnowledgeAnswer = {
  id: string
  title: string
  topic: AnswerTopic
  triggers: string[]
  examples: string[]
  answer: RichContent
  text: string
  actions: KnowledgeAction[]
  priority: number
}
export type KnowledgeSettings = {
  companyName: string
  companyDescription?: string
  email?: string
  phone?: string
  whatsappHref?: string
  address?: string
  city?: string
  country?: string
  mapsHref?: string
  socials: { label: string; href: string }[]
  quoteFormEnabled: boolean
  contactFormEnabled: boolean
  privacyReady: boolean
  privacyNoticeUrl?: string
  cookiePolicyReady: boolean
  cookiePolicyUrl?: string
}
export type Knowledge = {
  settings: KnowledgeSettings
  about?: { heading?: string; subtitle?: string; summary?: string }
  assistant: {
    name: string
    fallback?: string
    synonymGroups: string[][]
  }
  projects: KnowledgeProject[]
  services: KnowledgeService[]
  models: KnowledgeModel[]
  showrooms: KnowledgeShowroom[]
  projectCategories: NamedRef[]
  modelCategories: NamedRef[]
  cities: (NamedRef & { countrySlug?: string })[]
  countries: NamedRef[]
  faqs: KnowledgeFaq[]
  answers: KnowledgeAnswer[]
}

export type EntityKey =
  | 'city'
  | 'country'
  | 'projectCategory'
  | 'modelCategory'
  | 'service'
  | 'model'
  | 'project'
  | 'showroom'
  | 'product'
export type Entities = Partial<Record<EntityKey, string>> & { product?: ProductType }

export type ConversationContext = {
  lastIntent?: string
  entities?: Entities
  turn?: number
}

export type PageContext =
  | { kind: 'project'; slug: string }
  | { kind: 'model'; slug: string }
  | { kind: 'service'; slug: string }
  | { kind: 'showroom'; slug: string }
  | { kind: 'studio' }
  | { kind: 'other'; path: string }

export type FlowId = 'start' | 'design' | 'quote' | 'examples'
export type FlowRequest = { id: FlowId; step: string; value?: string }

export type ReplyBlock = { type: 'text'; text: string } | { type: 'rich'; content: RichContent }
export type ReplyCard = {
  kind: 'project' | 'service' | 'model' | 'showroom' | 'faq' | 'page'
  title: string
  description?: string
  meta?: string
  href: string
  image?: KnowledgeImage
}
export type ReplyChip = { label: string; message?: string; flow?: FlowRequest; topic?: string }
export type ReplyAction = {
  label: string
  kind: 'internal' | 'external' | 'consent'
  href?: string
}
export type Confidence = 'high' | 'medium' | 'low'

export type AssistantReply = {
  lang: Lang
  intent: string
  confidence: Confidence
  /** Stable key for anonymous feedback counters, e.g. "intent:services" or "answer:12". */
  answerKey: string
  blocks: ReplyBlock[]
  cards: ReplyCard[]
  chips: ReplyChip[]
  actions: ReplyAction[]
  context: ConversationContext
  /** Low-confidence reply that may be logged (masked) when enabled and consented. */
  unanswered: boolean
}

export type EngineInput = {
  message?: string
  flow?: FlowRequest
  context?: ConversationContext
  page?: PageContext
}

/** Small engine contract. A future LLM-backed engine could implement it behind a flag. */
export interface ResponseEngine {
  respond(input: EngineInput, knowledge: Knowledge): AssistantReply
}
