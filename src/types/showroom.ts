import type { Showroom } from '@/payload-types'
import type { ProjectImage } from './portfolio'

export type TourHotspot = {
  id: string
  label: string
  type: 'scene' | 'info'
  yaw: number
  pitch: number
  targetId?: string
  informationText?: string
}
export type TourScene = {
  id: string
  title: string
  description?: string
  panorama: ProjectImage
  thumbnail?: ProjectImage
  yaw: number
  pitch: number
  hfov: number
  hotspots: TourHotspot[]
}
export type ShowroomCardData = {
  id: number
  title: string
  slug: string
  shortDescription: string
  cover?: ProjectImage
  relatedProject?: { title: string; slug: string }
}
export type ShowroomDetailData = ShowroomCardData & {
  description: Showroom['description']
  scenes: TourScene[]
  seoTitle?: string
  seoDescription?: string
  seoImage?: ProjectImage
}
export type PanoramaControls = {
  zoom: (delta: number) => void
  rotate: (delta: number) => void
  home: () => void
}
export type TourStatus = 'loading' | 'ready' | 'error'
