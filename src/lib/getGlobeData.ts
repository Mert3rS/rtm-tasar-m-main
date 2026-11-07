import 'server-only'

import { cache } from 'react'
import { connection } from 'next/server'
import type { City, Country } from '@/payload-types'
import type { GlobeCity, GlobeProject } from '@/types/globe'
import type { ProjectCardData } from '@/types/portfolio'
import {
  getPublicPayload,
  isPopulated,
  projectCard,
  projectImage,
  projectSummarySelect,
  publicProjectRead,
  publishedProjects,
  PROJECT_ORDER,
} from './projectData'

type CityGroup = { city: City; country: Country; projects: GlobeProject[] }

export const getHomepageData = cache(
  async (): Promise<{
    cities: GlobeCity[]
    projects: ProjectCardData[]
    heroImages: GlobeProject[]
  }> => {
    // Keep Next's request-time render signal outside the CMS error fallback.
    await connection()
    try {
      const payload = await getPublicPayload()
      const result = await payload.find({
        collection: 'projects',
        ...publicProjectRead,
        depth: 2,
        select: projectSummarySelect,
        pagination: false,
        limit: 0,
        sort: PROJECT_ORDER,
        where: publishedProjects,
      })
      const cityGroups = new Map<number, CityGroup>()
      for (const project of result.docs) {
        if (!isPopulated(project.city)) continue
        const city = project.city
        if (!isPopulated(city.country)) continue
        if (!Number.isFinite(city.latitude) || !Number.isFinite(city.longitude)) continue
        if (
          city.latitude < -90 ||
          city.latitude > 90 ||
          city.longitude < -180 ||
          city.longitude > 180
        )
          continue
        const existing = cityGroups.get(city.id)
        const card = projectCard(project)
        const globeProject: GlobeProject = {
          id: card.id,
          slug: card.slug,
          title: card.title,
          description: card.description,
          coverImage: card.coverImage,
        }
        if (existing) existing.projects.push(globeProject)
        else cityGroups.set(city.id, { city, country: city.country, projects: [globeProject] })
      }
      const cities = Array.from(cityGroups.values())
        .map(({ city, country, projects }) => ({
          id: String(city.id),
          name: city.name,
          slug: city.slug,
          countryName: country.name,
          countrySlug: country.slug,
          countryCode: country.code.toUpperCase(),
          lat: city.latitude,
          lng: city.longitude,
          projectCount: projects.length,
          projects,
        }))
        .sort((first, second) => first.name.localeCompare(second.name, 'tr'))
      return {
        cities,
        // Full-viewport photography needs originals; atlas/cards retain light thumbnails.
        // Both use this same access-checked, published query.
        heroImages: result.docs
          .flatMap((project) => {
            const image = projectImage(project.coverImage)
            return image
              ? [
                  {
                    id: String(project.id),
                    title: project.title,
                    slug: project.slug,
                    coverImage: { url: image.url, alt: image.alt },
                  },
                ]
              : []
          })
          .slice(0, 9),
        projects: result.docs
          .filter((project) => project.featured)
          .slice(0, 4)
          .map(projectCard),
      }
    } catch {
      console.error('Ana sayfa proje verisi alınamadı.')
      return { cities: [], projects: [], heroImages: [] }
    }
  },
)

export async function getGlobeData(): Promise<GlobeCity[]> {
  return (await getHomepageData()).cities
}
