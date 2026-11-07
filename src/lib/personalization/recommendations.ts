import 'server-only'
import type { RecommendationRequest } from './schema'
export { recommendationRequestSchema } from './schema'
import type { Where } from 'payload'
import { getPublicPayload, isPopulated, projectCard, projectImage, projectSummarySelect } from '../projectData'

export type RecommendationCard = {
  kind: 'project' | 'model' | 'service' | 'showroom'
  slug: string
  title: string
  href: string
  description?: string
  image?: { url: string; alt: string }
}

const publicRead = { overrideAccess: false, draft: false } as const
const published: Where = { _status: { equals: 'published' } }
const order = ['displayOrder', '-createdAt', '-id']

function image(value: Parameters<typeof projectImage>[0]) {
  const result = projectImage(value)
  return result ? { url: result.thumbnailUrl || result.url, alt: result.alt } : undefined
}

/**
 * Builds light cards from published/active content only. Interest input comes from the
 * visitor's browser; nothing is stored or logged here.
 */
export async function getRecommendations(input: RecommendationRequest): Promise<RecommendationCard[]> {
  const payload = await getPublicPayload()
  const viewed = (type: RecommendationCard['kind']) =>
    input.items.filter((item) => item.type === type).map((item) => item.slug)
  const [projectCategories, modelCategories, cities, countries] = await Promise.all([
    input.projectCategories.length
      ? payload.find({ collection: 'project-categories', overrideAccess: false, depth: 0, limit: 5, pagination: false, where: { and: [{ slug: { in: input.projectCategories } }, { active: { equals: true } }] }, select: { slug: true } })
      : null,
    input.modelCategories.length
      ? payload.find({ collection: 'model-categories', overrideAccess: false, depth: 0, limit: 5, pagination: false, where: { and: [{ slug: { in: input.modelCategories } }, { active: { equals: true } }] }, select: { slug: true } })
      : null,
    input.cities.length
      ? payload.find({ collection: 'cities', overrideAccess: false, depth: 0, limit: 5, pagination: false, where: { slug: { in: input.cities } }, select: { slug: true } })
      : null,
    input.countries.length
      ? payload.find({ collection: 'countries', overrideAccess: false, depth: 0, limit: 3, pagination: false, where: { slug: { in: input.countries } }, select: { slug: true } })
      : null,
  ])
  const ids = (result: { docs: { id: number }[] } | null) => result?.docs.map(({ id }) => id) || []
  const projectSignals: Where[] = []
  if (ids(projectCategories).length) projectSignals.push({ categories: { in: ids(projectCategories) } })
  if (ids(cities).length) projectSignals.push({ city: { in: ids(cities) } })
  if (ids(countries).length) projectSignals.push({ 'city.country': { in: ids(countries) } })
  if (viewed('project').length) projectSignals.push({ slug: { in: viewed('project') } })
  const modelSignals: Where[] = []
  if (ids(modelCategories).length) modelSignals.push({ categories: { in: ids(modelCategories) } })
  if (viewed('model').length) modelSignals.push({ slug: { in: viewed('model') } })
  const [projects, models, services, showrooms] = await Promise.all([
    projectSignals.length
      ? payload.find({ collection: 'projects', ...publicRead, depth: 2, limit: 8, pagination: false, sort: order, where: { and: [published, { or: projectSignals }] }, select: projectSummarySelect })
      : null,
    modelSignals.length
      ? payload.find({ collection: 'design-models', ...publicRead, depth: 1, limit: 8, pagination: false, sort: order, where: { and: [published, { or: modelSignals }] }, select: { title: true, slug: true, shortDescription: true, coverImage: true } })
      : null,
    viewed('service').length
      ? payload.find({ collection: 'services', ...publicRead, depth: 1, limit: 4, pagination: false, sort: order, where: { and: [published, { active: { equals: true } }, { slug: { in: viewed('service') } }] }, select: { title: true, slug: true, shortDescription: true, coverImage: true } })
      : null,
    viewed('showroom').length
      ? payload.find({ collection: 'showrooms', ...publicRead, depth: 1, limit: 4, pagination: false, sort: order, where: { and: [published, { slug: { in: viewed('showroom') } }] }, select: { title: true, slug: true, shortDescription: true, coverImage: true } })
      : null,
  ])
  const cards: RecommendationCard[] = [
    ...(projects?.docs || []).map((doc) => {
      const card = projectCard(doc)
      return { kind: 'project' as const, slug: card.slug, title: card.title, href: `/projeler/${card.slug}`, description: card.description, image: card.coverImage }
    }),
    ...(models?.docs || []).map((doc) => ({ kind: 'model' as const, slug: doc.slug, title: doc.title, href: `/modeller/${doc.slug}`, description: doc.shortDescription || undefined, image: image(doc.coverImage) })),
    ...(services?.docs || []).map((doc) => ({ kind: 'service' as const, slug: doc.slug, title: doc.title, href: `/hizmetler/${doc.slug}`, description: doc.shortDescription || undefined, image: image(doc.coverImage) })),
    ...(showrooms?.docs || []).map((doc) => ({ kind: 'showroom' as const, slug: doc.slug, title: doc.title, href: `/showroom/${doc.slug}`, description: doc.shortDescription || undefined, image: image(isPopulated(doc.coverImage) ? doc.coverImage : undefined) })),
  ].filter((card) => !(input.exclude && input.exclude.type === card.kind && input.exclude.slug === card.slug))
  // Unseen related items first, then items the visitor already looked at; interleave kinds.
  const seen = new Set(input.items.map((item) => `${item.type}:${item.slug}`))
  const unseen = cards.filter((card) => !seen.has(`${card.kind}:${card.slug}`))
  const revisits = cards.filter((card) => seen.has(`${card.kind}:${card.slug}`))
  const mixed: RecommendationCard[] = []
  const byKind = new Map<string, RecommendationCard[]>()
  for (const card of unseen) byKind.set(card.kind, [...(byKind.get(card.kind) || []), card])
  while (mixed.length < input.limit && [...byKind.values()].some((list) => list.length))
    for (const list of byKind.values()) {
      const next = list.shift()
      if (next && mixed.length < input.limit) mixed.push(next)
    }
  for (const card of revisits) if (mixed.length < input.limit) mixed.push(card)
  return mixed
}
