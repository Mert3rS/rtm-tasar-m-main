import type { CollectionConfig } from 'payload'

import { isAuthenticated } from '../access/isAuthenticated'
import { validateMedia, preventReferencedPanoramaDelete } from '../hooks/validateMedia'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Medya', plural: 'Medya arşivi' },
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
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [{ name: 'card', width: 960, height: 720, fit: 'cover' }],
  },
}
