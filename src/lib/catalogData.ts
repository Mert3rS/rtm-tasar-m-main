import 'server-only'
import { cache } from 'react'
import type {
  DesignModel,
  DesignModelsSelect,
  Media,
  Service,
  ServicesSelect,
} from '@/payload-types'
import type { Where } from 'payload'
import type { CatalogCardData, CatalogDetailData, ModelFilters } from '@/types/catalog'
import {
  getPublicPayload,
  isPopulated,
  projectCard,
  projectImage,
  projectSummarySelect,
} from './projectData'
import { validCatalogSlug } from './catalogQuery'

export const CATALOG_PAGE_SIZE = 8
const publicRead = { overrideAccess: false, draft: false } as const
const published: Where = { _status: { equals: 'published' } }
const availableServices: Where = { and: [published, { active: { equals: true } }] }
const order = ['displayOrder', '-createdAt', '-id']
const serviceSelect = {
  title: true,
  slug: true,
  shortDescription: true,
  coverImage: true,
} satisfies ServicesSelect
const modelSelect = {
  title: true,
  slug: true,
  shortDescription: true,
  coverImage: true,
  categories: true,
} satisfies DesignModelsSelect
const detailSelect = {
  description: true,
  galleryImages: true,
  relatedProjects: true,
  seoTitle: true,
  seoDescription: true,
  seoImage: true,
} as const
const modelTypes = {
  concept: 'Konsept / tasarım örneği',
  render: 'Render',
  'production-example': 'Doğrulanmış üretim örneği',
}

function ids(values: (number | { id: number } | null)[] | null | undefined) {
  return (values || []).flatMap((value) =>
    typeof value === 'number' ? [value] : value ? [value.id] : [],
  )
}
export function catalogImages(
  cover: number | Media | null | undefined,
  gallery: { image: number | Media }[] | null | undefined,
) {
  return [projectImage(cover), ...(gallery || []).map(({ image }) => projectImage(image))]
    .filter((image) => image !== undefined)
    .filter((image, index, all) => all.findIndex((other) => other.url === image.url) === index)
}
function serviceCard(
  doc: Pick<Service, 'id' | 'title' | 'slug' | 'shortDescription' | 'coverImage'>,
): CatalogCardData {
  return {
    id: doc.id,
    kind: 'service',
    title: doc.title,
    slug: doc.slug,
    shortDescription: doc.shortDescription || undefined,
    cover: projectImage(doc.coverImage),
    categories: [],
  }
}
function modelCard(
  doc: Pick<
    DesignModel,
    'id' | 'title' | 'slug' | 'shortDescription' | 'coverImage' | 'categories'
  >,
): CatalogCardData {
  return {
    id: doc.id,
    kind: 'model',
    title: doc.title,
    slug: doc.slug,
    shortDescription: doc.shortDescription || undefined,
    cover: projectImage(doc.coverImage),
    categories: (doc.categories || [])
      .filter(isPopulated)
      .filter((category) => category.active)
      .map(({ id, name, slug }) => ({ id, name, slug })),
  }
}

export const getModelCategories = cache(async () => {
  const payload = await getPublicPayload()
  const result = await payload.find({
    collection: 'model-categories',
    overrideAccess: false,
    depth: 0,
    pagination: false,
    limit: 0,
    sort: ['displayOrder', 'name', 'id'],
    where: { active: { equals: true } },
    select: { name: true, slug: true },
  })
  return result.docs.map(({ id, name, slug }) => ({ id, name, slug }))
})

export async function getModelsPage(filters: ModelFilters) {
  const [payload, categories] = await Promise.all([getPublicPayload(), getModelCategories()])
  const category = categories.find((item) => item.slug === filters.category)
  const result = await payload.find({
    collection: 'design-models',
    ...publicRead,
    depth: 1,
    select: modelSelect,
    limit: CATALOG_PAGE_SIZE,
    page: filters.page,
    sort: order,
    populate: { 'model-categories': { name: true, slug: true, active: true } },
    where: {
      and: [published, ...(filters.category ? [{ categories: { in: [category?.id ?? -1] } }] : [])],
    },
  })
  return {
    models: result.docs.map(modelCard),
    categories,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  }
}

export async function getServicesPage(page = 1) {
  const payload = await getPublicPayload()
  const result = await payload.find({
    collection: 'services',
    ...publicRead,
    depth: 1,
    select: serviceSelect,
    limit: CATALOG_PAGE_SIZE,
    page,
    sort: order,
    where: availableServices,
  })
  return {
    services: result.docs.map(serviceCard),
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  }
}
export const getHomepageServices = cache(async () => {
  const payload = await getPublicPayload()
  const result = await payload.find({
    collection: 'services',
    ...publicRead,
    depth: 1,
    select: serviceSelect,
    limit: 4,
    sort: ['-featured', ...order],
    where: availableServices,
  })
  return result.docs.map(serviceCard)
})
export const getFeaturedModels = cache(async () => {
  const payload = await getPublicPayload()
  const result = await payload.find({
    collection: 'design-models',
    ...publicRead,
    depth: 1,
    select: modelSelect,
    limit: 3,
    sort: order,
    where: { and: [published, { featured: { equals: true } }] },
  })
  return result.docs.map(modelCard)
})

export const getServiceBySlug = cache(async (slug: string): Promise<CatalogDetailData | null> => {
  if (!validCatalogSlug(slug)) return null
  const payload = await getPublicPayload()
  const result = await payload.find({
    collection: 'services',
    ...publicRead,
    depth: 1,
    limit: 1,
    where: { and: [availableServices, { slug: { equals: slug } }] },
    select: { ...serviceSelect, ...detailSelect, relatedModelCategories: true },
    populate: { projects: { slug: true }, 'model-categories': { active: true } },
  })
  const doc = result.docs[0]
  if (!doc) return null
  return {
    ...serviceCard(doc),
    description: doc.description,
    gallery: catalogImages(doc.coverImage, doc.galleryImages),
    relatedProjectIds: ids(doc.relatedProjects),
    modelCategoryIds: (doc.relatedModelCategories || [])
      .filter(isPopulated)
      .filter((item) => item.active)
      .map(({ id }) => id),
    serviceIds: [],
    seoTitle: doc.seoTitle || undefined,
    seoDescription: doc.seoDescription || undefined,
    seoImage: projectImage(doc.seoImage),
  }
})
export const getModelBySlug = cache(async (slug: string): Promise<CatalogDetailData | null> => {
  if (!validCatalogSlug(slug)) return null
  const payload = await getPublicPayload()
  const result = await payload.find({
    collection: 'design-models',
    ...publicRead,
    depth: 1,
    limit: 1,
    select: { ...modelSelect, ...detailSelect, relatedServices: true, modelType: true },
    populate: {
      projects: { slug: true },
      services: { slug: true },
      'model-categories': { name: true, slug: true, active: true },
    },
    where: { and: [published, { slug: { equals: slug } }] },
  })
  const doc = result.docs[0]
  if (!doc) return null
  return {
    ...modelCard(doc),
    description: doc.description,
    gallery: catalogImages(doc.coverImage, doc.galleryImages),
    relatedProjectIds: ids(doc.relatedProjects),
    serviceIds: ids(doc.relatedServices),
    modelCategoryIds: [],
    modelType: doc.modelType ? modelTypes[doc.modelType] : undefined,
    seoTitle: doc.seoTitle || undefined,
    seoDescription: doc.seoDescription || undefined,
    seoImage: projectImage(doc.seoImage),
  }
})

export async function getSelectedProjects(projectIds: number[], limit = 3) {
  if (!projectIds.length) return []
  const payload = await getPublicPayload()
  const result = await payload.find({
    collection: 'projects',
    ...publicRead,
    depth: 2,
    select: projectSummarySelect,
    limit,
    pagination: false,
    sort: order,
    where: { and: [published, { id: { in: projectIds } }] },
  })
  return result.docs.map(projectCard)
}
export async function getSelectedServices(serviceIds: number[]) {
  if (!serviceIds.length) return []
  const payload = await getPublicPayload()
  const result = await payload.find({
    collection: 'services',
    ...publicRead,
    depth: 1,
    select: serviceSelect,
    limit: 6,
    pagination: false,
    sort: order,
    where: { and: [availableServices, { id: { in: serviceIds } }] },
  })
  return result.docs.map(serviceCard)
}
export async function getServiceModels(service: CatalogDetailData) {
  const payload = await getPublicPayload()
  const relations: Where[] = [{ relatedServices: { contains: service.id } }]
  if (service.modelCategoryIds.length)
    relations.push({ categories: { in: service.modelCategoryIds } })
  const result = await payload.find({
    collection: 'design-models',
    ...publicRead,
    depth: 1,
    select: modelSelect,
    limit: 3,
    pagination: false,
    sort: order,
    where: { and: [published, { or: relations }] },
  })
  return result.docs.map(modelCard)
}
export async function getRelatedModels(model: CatalogDetailData) {
  const payload = await getPublicPayload()
  const base: Where[] = [published, { id: { not_equals: model.id } }]
  if (model.categories.length)
    base.push({ categories: { in: model.categories.map(({ id }) => id) } })
  const result = await payload.find({
    collection: 'design-models',
    ...publicRead,
    depth: 1,
    select: modelSelect,
    limit: 3,
    pagination: false,
    sort: order,
    where: { and: base },
  })
  return result.docs.map(modelCard)
}
