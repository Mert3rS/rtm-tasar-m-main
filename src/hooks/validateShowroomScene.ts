import {
  ValidationError,
  type CollectionBeforeValidateHook,
  type CollectionBeforeDeleteHook,
} from 'payload'
import type { ShowroomScene } from '@/payload-types'
import { validPanorama } from '@/lib/panoramaValidation'

function idOf(value: number | { id: number } | null | undefined) {
  return typeof value === 'number' ? value : value?.id
}

function invalid(path: string, message: string): never {
  throw new ValidationError({ collection: 'showroom-scenes', errors: [{ path, message }] })
}

export const validateShowroomScene: CollectionBeforeValidateHook<ShowroomScene> = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data) return data
  const showroom = idOf(data.showroom ?? originalDoc?.showroom)
  if (!showroom) invalid('showroom', 'Her sahne bir showroom ile ilişkilendirilmelidir.')
  if (originalDoc?.id !== undefined && idOf(originalDoc.showroom) !== showroom)
    invalid(
      'showroom',
      'Mevcut sahne başka bir showroom’a taşınamaz. İlgili showroom içinde yeni sahne oluşturun.',
    )
  const parent = await req.payload.find({
    collection: 'showrooms',
    overrideAccess: true,
    req,
    depth: 0,
    limit: 1,
    pagination: false,
    where: { id: { equals: showroom } },
  })
  if (!parent.docs.length) invalid('showroom', 'Geçerli bir showroom seçin.')
  const sceneKey = data.sceneKey ?? originalDoc?.sceneKey
  if (sceneKey) {
    for (const draft of [false, true]) {
      const duplicate = await req.payload.find({
        collection: 'showroom-scenes',
        overrideAccess: true,
        draft,
        req,
        depth: 0,
        limit: 1,
        pagination: false,
        where: {
          and: [
            { showroom: { equals: showroom } },
            { sceneKey: { equals: sceneKey } },
            ...(originalDoc?.id !== undefined ? [{ id: { not_equals: originalDoc.id } }] : []),
          ],
        },
      })
      if (duplicate.docs.length)
        invalid('sceneKey', 'Bu showroom içinde sahne anahtarı zaten kullanılıyor.')
    }
  }
  const mediaId = idOf(data.panoramaImage ?? originalDoc?.panoramaImage)
  if (mediaId) {
    const media = await req.payload.findByID({
      collection: 'media',
      id: mediaId,
      overrideAccess: true,
      req,
      depth: 0,
      disableErrors: true,
    })
    if (!media || media.usage !== 'panorama' || !validPanorama(media))
      invalid('panoramaImage', 'Media’da panorama olarak doğrulanmış bir JPEG/WebP seçin.')
  }
  const hotspots = data.hotspots ?? originalDoc?.hotspots ?? []
  for (const [index, hotspot] of hotspots.entries()) {
    if (
      !Number.isFinite(hotspot.yaw) ||
      hotspot.yaw < -180 ||
      hotspot.yaw > 180 ||
      !Number.isFinite(hotspot.pitch) ||
      hotspot.pitch < -90 ||
      hotspot.pitch > 90
    )
      invalid(`hotspots.${index}.yaw`, 'Yaw -180…180, pitch -90…90 aralığında olmalıdır.')
    if (hotspot.type === 'scene') {
      const targetId = idOf(hotspot.targetScene)
      if (!targetId)
        invalid(`hotspots.${index}.targetScene`, 'Geçiş noktası için hedef sahne seçin.')
      const target = await req.payload.findByID({
        collection: 'showroom-scenes',
        id: targetId,
        overrideAccess: true,
        req,
        depth: 0,
        disableErrors: true,
      })
      if (!target || idOf(target.showroom) !== showroom)
        invalid(`hotspots.${index}.targetScene`, 'Hedef sahne aynı showroom’a ait olmalıdır.')
    }
    if (hotspot.type === 'info' && !hotspot.informationText?.trim())
      invalid(`hotspots.${index}.informationText`, 'Bilgi noktası için açıklama girin.')
  }
  return data
}

export const preventReferencedSceneDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  for (const draft of [false, true]) {
    const references = await req.payload.find({
      collection: 'showroom-scenes',
      overrideAccess: true,
      draft,
      req,
      depth: 0,
      limit: 1,
      pagination: false,
      where: { and: [{ 'hotspots.targetScene': { equals: id } }, { id: { not_equals: id } }] },
    })
    if (references.docs.length)
      invalid(
        'hotspots',
        'Başka bir sahne bu sahneye yönlendiriyor. Önce geçiş noktalarını kaldırıp kaynak sahneleri yayınlayın.',
      )
  }
}

export const preventShowroomWithScenesDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  for (const draft of [false, true]) {
    const scenes = await req.payload.find({
      collection: 'showroom-scenes',
      overrideAccess: true,
      draft,
      req,
      depth: 0,
      limit: 1,
      pagination: false,
      where: { showroom: { equals: id } },
    })
    if (scenes.docs.length)
      throw new ValidationError({
        collection: 'showrooms',
        errors: [{ path: 'title', message: 'Önce bu showroom’a bağlı sahneleri kaldırın.' }],
      })
  }
}
