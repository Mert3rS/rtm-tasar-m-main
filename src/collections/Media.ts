import type { CollectionConfig, SanitizedConfig } from 'payload'

import { isAuthenticated } from '../access/isAuthenticated'
import { validateMedia, preventReferencedPanoramaDelete } from '../hooks/validateMedia'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Medya', plural: 'Medya arşivi' },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'usage'],
    description:
      'Burası ortak fotoğraf kütüphanesidir. Yüklenen fotoğrafın sitede görünmesi için ilgili proje, hizmet, model veya sayfanın görsel alanında seçilmesi gerekir. Konum rehberi için Site içeriği ekranını açın.',
  },
  access: {
    create: isAuthenticated,
    delete: isAuthenticated,
    read: () => true,
    update: isAuthenticated,
  },
  hooks: { beforeValidate: [validateMedia], beforeDelete: [preventReferencedPanoramaDelete] },
  fields: [
    {
      name: 'usage',
      type: 'select',
      defaultValue: 'image',
      required: true,
      label: 'Görsel kullanımı',
      options: [
        { label: 'Fotoğraf / kapak', value: 'image' },
        { label: '360° panorama', value: 'panorama' },
      ],
      admin: {
        description:
          'Panorama yalnızca tam 360° equirectangular JPEG/WebP olmalıdır. Tam 2:1 oran, önerilen 4096×2048; normal fotoğraf seçmeyin. Orijinal dosya korunur.',
      },
    },
    {
      name: 'alt',
      type: 'text',
      label: 'Alternatif metin',
      required: true,
      admin: {
        description:
          'Fotoğrafta ne göründüğünü kısa ve anlaşılır biçimde yazın; örneğin mekânı ve belirgin malzemeyi belirtin. Dosya adı veya “görsel” yazmak yerine fotoğrafın içeriğini anlatın. Bu metin erişilebilirlikte ve medya seçiminde kullanılır.',
      },
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [{ name: 'card', width: 960, height: 720, fit: 'cover' }],
  },
}

/** Attach UI after sanitization: declaring a replacement text field would replace
 * Payload's native filename validator with the generic text validator. This changes
 * only admin presentation; access, validation, hooks and indexes stay native.
 * Applying it again is harmless and creates no fields or database writes.
 */
export function withMediaFilenameCell(config: SanitizedConfig): SanitizedConfig {
  const media = config.collections.find(({ slug }) => slug === 'media')
  const filename = media?.fields.find((field) => 'name' in field && field.name === 'filename')
  if (!filename || filename.type !== 'text' || !filename.admin) {
    throw new Error('Native media filename field is unavailable')
  }
  filename.admin.components = {
    ...filename.admin.components,
    Cell: '/components/admin/MediaFilenameCell#MediaFilenameCell',
  }
  // Also exclude saved column preferences without removing the stored timestamp.
  const updatedAt = media?.fields.find((field) => 'name' in field && field.name === 'updatedAt')
  if (updatedAt?.type === 'date') {
    updatedAt.admin = { ...updatedAt.admin, disableListColumn: true }
  }
  return config
}
