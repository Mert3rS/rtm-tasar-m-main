import 'server-only'
import type { Where } from 'payload'
import { getPublicPayload, isPopulated, projectCard, projectImage, projectSummarySelect } from '../projectData'
import { getPublicSiteSettings } from '../siteSettings'
import { getAboutPage } from '../aboutData'
import { getAssistantConfig } from '../assistantSettings'
import { lexicalText } from '../lexicalText'
import { safeInternalHref, settingsLinkKeys } from './links'
import { answerTopics } from './topics'
import type { Knowledge, KnowledgeAction, KnowledgeImage, NamedRef } from './types'

/**
 * Lightweight in-memory search knowledge built only from public reads:
 * collections use overrideAccess:false, draft:false and explicit published/active filters.
 * Site Settings, About and Assistant settings go through their existing trusted DTO helpers,
 * so the notification recipient, SMTP data and logging switches never reach the index.
 *
 * Cache: per-process, TTL 60 s, bounded by per-collection limits. This is a short-lived
 * request-collapsing cache, not a persistent CMS cache: a publish/unpublish is reflected at the
 * latest after the TTL. See README → Asistan — Faz 9.
 */
export const KNOWLEDGE_TTL_MS = 60_000
const LIMIT = { projects: 300, services: 100, models: 300, showrooms: 100, faqs: 300, answers: 300 }
const publicRead = { overrideAccess: false, draft: false } as const
const published: Where = { _status: { equals: 'published' } }
const publishedActive: Where = { and: [published, { active: { equals: true } }] }
const order = ['displayOrder', '-createdAt', '-id']

let cached: { value: Knowledge; expires: number } | null = null
let inflight: Promise<Knowledge> | null = null

const image = (value: Parameters<typeof projectImage>[0]): KnowledgeImage | undefined => {
  const result = projectImage(value)
  return result ? { url: result.thumbnailUrl || result.url, alt: result.alt } : undefined
}
const named = (items: { slug: string; name: string }[]): NamedRef[] =>
  items.map(({ slug, name }) => ({ slug, name }))
const topics = new Set<string>(answerTopics.map(({ value }) => value))

async function build(): Promise<Knowledge> {
  const payload = await getPublicPayload()
  const [settings, about, config, projects, services, models, showrooms, projectCategories, modelCategories, cities, countries, faqs, answers] =
    await Promise.all([
      getPublicSiteSettings(),
      getAboutPage().catch(() => null),
      getAssistantConfig(),
      payload.find({
        collection: 'projects',
        ...publicRead,
        depth: 2,
        limit: LIMIT.projects,
        pagination: false,
        sort: order,
        where: published,
        select: { ...projectSummarySelect, description: true },
      }),
      payload.find({
        collection: 'services',
        ...publicRead,
        depth: 1,
        limit: LIMIT.services,
        pagination: false,
        sort: order,
        where: publishedActive,
        select: { title: true, slug: true, shortDescription: true, coverImage: true, description: true },
      }),
      payload.find({
        collection: 'design-models',
        ...publicRead,
        depth: 1,
        limit: LIMIT.models,
        pagination: false,
        sort: order,
        where: published,
        select: { title: true, slug: true, shortDescription: true, coverImage: true, categories: true, modelType: true },
        populate: { 'model-categories': { name: true, slug: true, active: true } },
      }),
      payload.find({
        collection: 'showrooms',
        ...publicRead,
        depth: 1,
        limit: LIMIT.showrooms,
        pagination: false,
        sort: order,
        where: published,
        select: { title: true, slug: true, shortDescription: true, coverImage: true, relatedProject: true },
      }),
      payload.find({ collection: 'project-categories', overrideAccess: false, depth: 0, pagination: false, limit: 0, where: { active: { equals: true } }, select: { name: true, slug: true } }),
      payload.find({ collection: 'model-categories', overrideAccess: false, depth: 0, pagination: false, limit: 0, where: { active: { equals: true } }, select: { name: true, slug: true } }),
      payload.find({ collection: 'cities', overrideAccess: false, depth: 1, pagination: false, limit: 0, select: { name: true, slug: true, country: true } }),
      payload.find({ collection: 'countries', overrideAccess: false, depth: 0, pagination: false, limit: 0, select: { name: true, slug: true } }),
      payload.find({
        collection: 'faqs',
        ...publicRead,
        depth: 0,
        limit: LIMIT.faqs,
        pagination: false,
        sort: order,
        where: publishedActive,
        select: { question: true, answer: true, category: true },
      }),
      payload.find({
        collection: 'assistant-answers',
        ...publicRead,
        depth: 0,
        limit: LIMIT.answers,
        pagination: false,
        sort: ['-priority', '-createdAt', '-id'],
        where: publishedActive,
        select: { title: true, topic: true, triggers: true, exampleQuestions: true, answer: true, actions: true, priority: true },
      }),
    ])
  const modelTypes: Record<string, string> = {
    concept: 'Konsept / tasarım örneği',
    render: 'Render',
    'production-example': 'Doğrulanmış üretim örneği',
  }
  return {
    settings: {
      companyName: settings.companyName,
      companyDescription: settings.companyDescription,
      email: settings.contactEmail,
      phone: settings.phone,
      whatsappHref: settings.whatsappHref,
      address: settings.address,
      city: settings.city,
      country: settings.country,
      mapsHref: settings.mapsHref,
      socials: settings.socials,
      quoteFormEnabled: settings.quoteFormEnabled,
      contactFormEnabled: settings.contactFormEnabled,
      privacyReady: Boolean(settings.privacyNoticeContent || settings.privacyNoticeUrl),
      privacyNoticeUrl: settings.privacyNoticeUrl,
      cookiePolicyReady: settings.cookiePolicy.ready,
      cookiePolicyUrl: settings.cookiePolicy.url,
    },
    about: about
      ? { heading: about.heading, subtitle: about.subtitle, summary: lexicalText(about.introduction, 320) || undefined }
      : undefined,
    assistant: { name: config.name, fallback: config.fallback, synonymGroups: config.synonymGroups },
    projects: projects.docs.map((doc) => {
      const card = projectCard(doc)
      const city = isPopulated(doc.city) ? doc.city : undefined
      const country = city && isPopulated(city.country) ? city.country : undefined
      return {
        slug: card.slug,
        title: card.title,
        description: card.description,
        categories: named(card.categories),
        city: city ? { slug: city.slug, name: city.name } : undefined,
        country: country ? { slug: country.slug, name: country.name } : undefined,
        featured: card.featured,
        image: card.coverImage,
        summary: lexicalText(doc.description, 400) || undefined,
      }
    }),
    services: services.docs.map((doc) => ({
      slug: doc.slug,
      title: doc.title,
      description: doc.shortDescription || undefined,
      image: image(doc.coverImage),
      summary: lexicalText(doc.description, 400) || undefined,
    })),
    models: models.docs.map((doc) => ({
      slug: doc.slug,
      title: doc.title,
      description: doc.shortDescription || undefined,
      categories: (doc.categories || []).filter(isPopulated).filter((c) => c.active).map(({ slug, name }) => ({ slug, name })),
      modelType: doc.modelType ? modelTypes[doc.modelType] : undefined,
      image: image(doc.coverImage),
    })),
    showrooms: showrooms.docs.map((doc) => ({
      slug: doc.slug,
      title: doc.title,
      description: doc.shortDescription || undefined,
      image: image(doc.coverImage),
      projectSlug:
        isPopulated(doc.relatedProject) && doc.relatedProject._status === 'published'
          ? doc.relatedProject.slug
          : undefined,
    })),
    projectCategories: named(projectCategories.docs),
    modelCategories: named(modelCategories.docs),
    cities: cities.docs.map((doc) => ({
      slug: doc.slug,
      name: doc.name,
      countrySlug: isPopulated(doc.country) ? doc.country.slug : undefined,
    })),
    countries: named(countries.docs),
    faqs: faqs.docs.map((doc) => ({
      id: String(doc.id),
      question: doc.question,
      answer: doc.answer,
      text: lexicalText(doc.answer, 800),
      category: doc.category || undefined,
    })),
    answers: answers.docs.map((doc) => ({
      id: String(doc.id),
      title: doc.title,
      topic: doc.topic && topics.has(doc.topic) ? doc.topic : 'general',
      triggers: (doc.triggers || []).map(({ phrase }) => phrase),
      examples: (doc.exampleQuestions || []).map(({ question }) => question),
      answer: doc.answer,
      text: lexicalText(doc.answer, 800),
      priority: doc.priority || 0,
      actions: (doc.actions || []).flatMap((action): KnowledgeAction[] => {
        if (action.kind === 'consent') return [{ kind: 'consent', label: action.label }]
        if (action.kind === 'settings') {
          const key = settingsLinkKeys.find((item) => item === action.settingsLink)
          return key ? [{ kind: 'settings', label: action.label, key }] : []
        }
        const href = safeInternalHref(action.route)
        return href ? [{ kind: 'route', label: action.label, href }] : []
      }),
    })),
  }
}

export async function getAssistantKnowledge(): Promise<Knowledge> {
  const now = Date.now()
  if (cached && cached.expires > now) return cached.value
  if (!inflight)
    inflight = build()
      .then((value) => {
        cached = { value, expires: Date.now() + KNOWLEDGE_TTL_MS }
        return value
      })
      .finally(() => {
        inflight = null
      })
  return inflight
}
