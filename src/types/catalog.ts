import type { Project } from '@/payload-types'
import type { ProjectImage } from './portfolio'

export type CatalogCategory = { id: number; name: string; slug: string }
export type CatalogCardData = {
  id: number
  kind: 'model' | 'service'
  title: string
  slug: string
  shortDescription?: string
  cover?: ProjectImage
  categories: CatalogCategory[]
}
export type CatalogDetailData = CatalogCardData & {
  description: Project['description']
  gallery: ProjectImage[]
  relatedProjectIds: number[]
  serviceIds: number[]
  modelCategoryIds: number[]
  modelType?: string
  seoTitle?: string
  seoDescription?: string
  seoImage?: ProjectImage
}
export type ModelFilters = { category: string; page: number }
