import 'server-only'

import { connection } from 'next/server'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'
import config from '@/payload.config'
import type { Media, Project, ProjectsSelect } from '@/payload-types'
import type {
  ProjectCardData,
  ProjectDetailData,
  ProjectImage,
  PortfolioFilters,
  PortfolioOptions,
} from '@/types/portfolio'

export const PROJECT_PAGE_SIZE = 8
export const PROJECT_ORDER = ['displayOrder', '-createdAt', '-id']
export const publicProjectRead = { overrideAccess: false, draft: false } as const
export const publishedProjects: Where = { _status: { equals: 'published' } }
export const projectSummarySelect = {
  title: true,
  slug: true,
  shortDescription: true,
  city: true,
  coverImage: true,
  categories: true,
  featured: true,
  displayOrder: true,
} satisfies ProjectsSelect

export const getPublicPayload = cache(async () => {
  await connection()
  return getPayload({ config })
})

export function isPopulated<T extends { id: number }>(
  value: number | T | null | undefined,
): value is T {
  return typeof value === 'object' && value !== null
}

export function projectImage(value: number | Media | null | undefined): ProjectImage | undefined {
  if (!isPopulated(value) || !value.url || !value.alt) return undefined
  return {
    url: value.url,
    alt: value.alt,
    width: value.width || 1600,
    height: value.height || 1067,
    thumbnailUrl: value.sizes?.card?.url || undefined,
  }
}

export function projectCard(
  project: Pick<
    Project,
    'id' | 'title' | 'slug' | 'shortDescription' | 'coverImage' | 'city' | 'categories' | 'featured'
  >,
): ProjectCardData {
  const image = projectImage(project.coverImage)
  const city = isPopulated(project.city) ? project.city : undefined
  const country = city && isPopulated(city.country) ? city.country : undefined
  return {
    id: String(project.id),
    title: project.title,
    slug: project.slug,
    description: project.shortDescription || undefined,
    coverImage: image ? { url: image.thumbnailUrl || image.url, alt: image.alt } : undefined,
    cityName: city?.name,
    citySlug: city?.slug,
    countryName: country?.name,
    countrySlug: country?.slug,
    categories: (project.categories || [])
      .filter(isPopulated)
      .filter((category) => category.active)
      .map(({ id, name, slug }) => ({ id, name, slug })),
    featured: Boolean(project.featured),
  }
}

export const getPortfolioOptions = cache(async (): Promise<PortfolioOptions> => {
  const payload = await getPublicPayload()
  const [categories, countries, cities] = await Promise.all([
    payload.find({
      collection: 'project-categories',
      overrideAccess: false,
      depth: 0,
      pagination: false,
      limit: 0,
      sort: ['displayOrder', 'name', 'id'],
      where: { active: { equals: true } },
      select: { name: true, slug: true },
    }),
    payload.find({
      collection: 'countries',
      overrideAccess: false,
      depth: 0,
      pagination: false,
      limit: 0,
      sort: ['name', 'id'],
      select: { name: true, slug: true },
    }),
    payload.find({
      collection: 'cities',
      overrideAccess: false,
      depth: 0,
      pagination: false,
      limit: 0,
      sort: ['name', 'id'],
      select: { name: true, slug: true, country: true },
    }),
  ])
  return {
    categories: categories.docs.map(({ id, name, slug }) => ({ id, name, slug })),
    countries: countries.docs.map(({ id, name, slug }) => ({ id, name, slug })),
    cities: cities.docs.map(({ id, name, slug, country }) => ({
      id,
      name,
      slug,
      countryId:
        typeof country === 'number' ? country : isPopulated(country) ? country.id : undefined,
    })),
  }
})

export async function getPortfolioPage(filters: PortfolioFilters) {
  const payload = await getPublicPayload()
  const options = await getPortfolioOptions()
  const constraints: Where[] = [publishedProjects]
  const category = options.categories.find((item) => item.slug === filters.category)
  const country = options.countries.find((item) => item.slug === filters.country)
  const city = options.cities.find((item) => item.slug === filters.city)
  if (filters.category) constraints.push({ categories: { in: [category?.id ?? -1] } })
  if (filters.country) constraints.push({ 'city.country': { equals: country?.id ?? -1 } })
  if (filters.city) constraints.push({ city: { equals: city?.id ?? -1 } })
  const result = await payload.find({
    collection: 'projects',
    ...publicProjectRead,
    depth: 2,
    select: projectSummarySelect,
    limit: PROJECT_PAGE_SIZE,
    page: filters.page,
    sort: PROJECT_ORDER,
    where: { and: constraints },
  })
  return {
    projects: result.docs.map(projectCard),
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page || 1,
    options,
  }
}

export const getProjectBySlug = cache(async (slug: string): Promise<ProjectDetailData | null> => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null
  const payload = await getPublicPayload()
  const result = await payload.find({
    collection: 'projects',
    ...publicProjectRead,
    depth: 2,
    limit: 1,
    where: { and: [publishedProjects, { slug: { equals: slug } }] },
    select: {
      ...projectSummarySelect,
      description: true,
      gallery: true,
      projectType: true,
      completionYear: true,
      locationDescription: true,
      clientName: true,
      projectArea: true,
      seoTitle: true,
      seoDescription: true,
      seoImage: true,
    },
  })
  const project = result.docs[0]
  if (!project) return null
  return {
    ...projectCard(project),
    numericId: project.id,
    cityId: isPopulated(project.city)
      ? project.city.id
      : typeof project.city === 'number'
        ? project.city
        : undefined,
    descriptionContent: project.description,
    cover: projectImage(project.coverImage),
    gallery: (project.gallery || [])
      .map(({ image }) => projectImage(image))
      .filter((image) => image !== undefined),
    projectType: project.projectType || undefined,
    completionYear: project.completionYear ?? undefined,
    locationDescription: project.locationDescription || undefined,
    clientName: project.clientName || undefined,
    projectArea: project.projectArea ?? undefined,
    seoTitle: project.seoTitle || undefined,
    seoDescription: project.seoDescription || undefined,
    seoImage: projectImage(project.seoImage),
  }
})

export async function getRelatedProjects(project: ProjectDetailData): Promise<ProjectCardData[]> {
  const payload = await getPublicPayload()
  const results = new Map<number, ProjectCardData>()
  const priorities: Where[] = []
  if (project.categories.length)
    priorities.push({ categories: { in: project.categories.map(({ id }) => id) } })
  if (project.cityId !== undefined) priorities.push({ city: { equals: project.cityId } })
  priorities.push({})
  for (const priority of priorities) {
    const remaining = 3 - results.size
    if (!remaining) break
    const result = await payload.find({
      collection: 'projects',
      ...publicProjectRead,
      depth: 2,
      select: projectSummarySelect,
      limit: remaining,
      pagination: false,
      sort: PROJECT_ORDER,
      where: {
        and: [
          publishedProjects,
          { id: { not_in: [project.numericId, ...results.keys()] } },
          priority,
        ],
      },
    })
    for (const item of result.docs) results.set(item.id, projectCard(item))
  }
  return [...results.values()]
}
