import type { Project } from '@/payload-types'
import type { GlobeProject } from './globe'

export type CategorySummary = { id: number; name: string; slug: string }
export type ProjectImage = {
  url: string
  alt: string
  width: number
  height: number
  thumbnailUrl?: string
}
export type ProjectCardData = GlobeProject & {
  cityName?: string
  citySlug?: string
  countryName?: string
  countrySlug?: string
  categories: CategorySummary[]
  featured: boolean
}
export type ProjectDetailData = ProjectCardData & {
  numericId: number
  cityId?: number
  descriptionContent: Project['description']
  cover?: ProjectImage
  gallery: ProjectImage[]
  projectType?: string
  completionYear?: number
  locationDescription?: string
  clientName?: string
  projectArea?: number
  seoTitle?: string
  seoDescription?: string
  seoImage?: ProjectImage
}
export type PortfolioFilters = { category: string; country: string; city: string; page: number }
export type FilterOption = { id: number; slug: string; name: string; countryId?: number }
export type PortfolioOptions = {
  categories: FilterOption[]
  countries: FilterOption[]
  cities: FilterOption[]
}
export type PortfolioQuery = Record<string, string | string[] | undefined>
