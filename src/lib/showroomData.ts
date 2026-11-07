import 'server-only'
import { cache } from 'react'
import type { Showroom, ShowroomsSelect } from '@/payload-types'
import type { ShowroomCardData, ShowroomDetailData, TourScene } from '@/types/showroom'
import { getPublicPayload, isPopulated, projectImage } from './projectData'
import { managedMediaUrl, validPanorama } from './panoramaValidation'

const publicRead = { overrideAccess: false, draft: false } as const
const published = { _status: { equals: 'published' } }
const order = ['displayOrder', '-createdAt', '-id']
const cardSelect = {
  title: true,
  slug: true,
  shortDescription: true,
  coverImage: true,
  relatedProject: true,
} satisfies ShowroomsSelect

export function showroomHref(slug: string) {
  return `/showroom/${encodeURIComponent(slug)}`
}

function card(
  doc: Pick<
    Showroom,
    'id' | 'title' | 'slug' | 'shortDescription' | 'coverImage' | 'relatedProject'
  >,
): ShowroomCardData {
  const project =
    isPopulated(doc.relatedProject) && doc.relatedProject._status === 'published'
      ? doc.relatedProject
      : undefined
  return {
    id: doc.id,
    title: doc.title,
    slug: doc.slug,
    shortDescription: doc.shortDescription,
    cover: projectImage(doc.coverImage),
    relatedProject: project ? { title: project.title, slug: project.slug } : undefined,
  }
}

export async function getShowroomsPage(page = 1) {
  const payload = await getPublicPayload()
  const result = await payload.find({
    collection: 'showrooms',
    ...publicRead,
    depth: 1,
    select: cardSelect,
    limit: 8,
    page,
    sort: order,
    where: published,
  })
  return {
    showrooms: result.docs.map(card),
    totalPages: result.totalPages,
    totalDocs: result.totalDocs,
  }
}

export const getFeaturedShowroom = cache(async (): Promise<ShowroomCardData | null> => {
  const payload = await getPublicPayload()
  const result = await payload.find({
    collection: 'showrooms',
    ...publicRead,
    depth: 1,
    select: cardSelect,
    limit: 1,
    sort: ['-featured', ...order],
    where: published,
  })
  return result.docs[0] ? card(result.docs[0]) : null
})

export const getShowroomForProject = cache(async (id: number): Promise<ShowroomCardData | null> => {
  const payload = await getPublicPayload()
  const result = await payload.find({
    collection: 'showrooms',
    ...publicRead,
    depth: 1,
    select: cardSelect,
    limit: 1,
    sort: ['-featured', ...order],
    where: { and: [published, { relatedProject: { equals: id } }] },
  })
  return result.docs[0] ? card(result.docs[0]) : null
})

export const getShowroomBySlug = cache(async (slug: string): Promise<ShowroomDetailData | null> => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null
  const payload = await getPublicPayload()
  const result = await payload.find({
    collection: 'showrooms',
    ...publicRead,
    depth: 1,
    limit: 1,
    where: { and: [published, { slug: { equals: slug } }] },
    select: {
      ...cardSelect,
      description: true,
      seoTitle: true,
      seoDescription: true,
      seoImage: true,
    },
  })
  const doc = result.docs[0]
  if (!doc) return null
  const sceneResult = await payload.find({
    collection: 'showroom-scenes',
    ...publicRead,
    depth: 1,
    pagination: false,
    limit: 0,
    sort: order,
    where: { and: [published, { showroom: { equals: doc.id } }] },
    select: {
      title: true,
      sceneKey: true,
      panoramaImage: true,
      thumbnailImage: true,
      description: true,
      initialYaw: true,
      initialPitch: true,
      initialHfov: true,
      hotspots: true,
    },
    populate: { 'showroom-scenes': { title: true } },
  })
  const scenes: TourScene[] = []
  for (const scene of sceneResult.docs) {
    const media = isPopulated(scene.panoramaImage) ? scene.panoramaImage : undefined
    const image = projectImage(media)
    const url = image ? managedMediaUrl(image.url) : undefined
    if (!media || media.usage !== 'panorama' || !validPanorama(media) || !image || !url) continue
    const thumbnail =
      projectImage(scene.thumbnailImage) ||
      (image.thumbnailUrl ? { ...image, url: image.thumbnailUrl } : undefined)
    scenes.push({
      id: String(scene.id),
      title: scene.title,
      description: scene.description || undefined,
      panorama: { ...image, url },
      thumbnail,
      yaw: scene.initialYaw ?? 0,
      pitch: scene.initialPitch ?? 0,
      hfov: scene.initialHfov ?? 90,
      hotspots: (scene.hotspots || []).map((spot, index) => ({
        id: spot.id || `${scene.id}-${index}`,
        label: spot.label,
        type: spot.type,
        yaw: spot.yaw,
        pitch: spot.pitch,
        targetId:
          typeof spot.targetScene === 'number'
            ? String(spot.targetScene)
            : isPopulated(spot.targetScene)
              ? String(spot.targetScene.id)
              : undefined,
        informationText: spot.informationText || undefined,
      })),
    })
  }
  const visibleIds = new Set(scenes.map((scene) => scene.id))
  for (const scene of scenes)
    scene.hotspots = scene.hotspots.filter(
      (spot) =>
        Number.isFinite(spot.yaw) &&
        Number.isFinite(spot.pitch) &&
        (spot.type === 'info' || (spot.targetId !== undefined && visibleIds.has(spot.targetId))),
    )
  return {
    ...card(doc),
    description: doc.description,
    scenes,
    seoTitle: doc.seoTitle || undefined,
    seoDescription: doc.seoDescription || undefined,
    seoImage: projectImage(doc.seoImage),
  }
})
