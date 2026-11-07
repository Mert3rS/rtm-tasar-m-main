import {
  ValidationError,
  type CollectionBeforeValidateHook,
  type CollectionBeforeDeleteHook,
} from 'payload'
import sharp from 'sharp'
import type { Media } from '@/payload-types'
import { uploadLimitBytes, validPanorama } from '@/lib/panoramaValidation'

function invalid(message: string): never {
  throw new ValidationError({ collection: 'media', errors: [{ path: 'usage', message }] })
}

export const validateMedia: CollectionBeforeValidateHook<Media> = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data) return data
  const usage = data.usage || originalDoc?.usage || 'image'
  const edits = req.query?.uploadEdits
  const transformsOriginal =
    edits &&
    typeof edits === 'object' &&
    ('crop' in edits || 'widthInPixels' in edits || 'heightInPixels' in edits)
  if (usage === 'panorama' && transformsOriginal)
    invalid(
      '360° panoramanın orijinali kırpılamaz veya yeniden boyutlandırılamaz. Yeni tam 2:1 dosya yükleyin.',
    )
  const file = req.file
  let width = originalDoc?.width
  let height = originalDoc?.height
  let mimeType = originalDoc?.mimeType
  if (file) {
    if (file.size > uploadLimitBytes() || file.data.length > uploadLimitBytes())
      invalid('Dosya boyutu sunucunun yükleme sınırını aşıyor.')
    try {
      const metadata = await sharp(file.data, { limitInputPixels: 67_108_864 }).metadata()
      width = metadata.width
      height = metadata.height
      const mimeByFormat: Record<string, string> = {
        jpeg: 'image/jpeg',
        webp: 'image/webp',
        png: 'image/png',
        gif: 'image/gif',
        avif: 'image/avif',
        heif: 'image/avif',
        tiff: 'image/tiff',
        svg: 'image/svg+xml',
      }
      mimeType = metadata.format ? mimeByFormat[metadata.format] : undefined
      if (!mimeType || mimeType !== file.mimetype)
        invalid('Dosya içeriği belirtilen görsel türüyle uyuşmuyor.')
      if (
        usage === 'panorama' &&
        ((mimeType === 'image/jpeg' && !/\.jpe?g$/i.test(file.name)) ||
          (mimeType === 'image/webp' && !/\.webp$/i.test(file.name)))
      )
        invalid('Panoramanın dosya uzantısı gerçek JPEG/WebP içeriğiyle uyuşmuyor.')
    } catch (error) {
      if (error instanceof ValidationError) throw error
      invalid('Görsel okunamadı veya güvenli piksel sınırını aşıyor.')
    }
  }
  if (usage === 'image' && transformsOriginal) {
    // Payload has already calculated the dimensions of an explicitly requested photo edit.
    width = data.width
    height = data.height
  }
  if (usage === 'panorama' && !validPanorama({ width, height, mimeType }))
    invalid(
      'Panorama JPEG veya WebP olmalı; tam 2:1 oranında ve 1024–8192 piksel genişliğinde yüklenmelidir.',
    )
  if (originalDoc?.usage === 'panorama' && usage !== 'panorama') {
    for (const draft of [false, true]) {
      const references = await req.payload.find({
        collection: 'showroom-scenes',
        overrideAccess: true,
        draft,
        req,
        depth: 0,
        limit: 1,
        pagination: false,
        where: { panoramaImage: { equals: originalDoc.id } },
      })
      if (references.docs.length)
        invalid('Bu panorama bir showroom sahnesinde kullanılıyor; önce sahne ilişkisini kaldırın.')
    }
  }
  // File-derived fields cannot be spoofed through metadata-only API updates.
  return {
    ...data,
    usage,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(mimeType ? { mimeType } : {}),
  }
}

export const preventReferencedPanoramaDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  for (const draft of [false, true]) {
    const references = await req.payload.find({
      collection: 'showroom-scenes',
      overrideAccess: true,
      draft,
      req,
      depth: 0,
      limit: 1,
      pagination: false,
      where: { panoramaImage: { equals: id } },
    })
    if (references.docs.length)
      invalid('Bu medya bir showroom sahnesinde kullanılıyor; önce sahne ilişkisini kaldırın.')
  }
}
