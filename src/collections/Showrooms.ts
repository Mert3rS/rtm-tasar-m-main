import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'
import { slugField } from '../fields/slug'
import { photoGuideField } from '../fields/photoGuide'
import { preventShowroomWithScenesDelete } from '../hooks/validateShowroomScene'

export const Showrooms: CollectionConfig = {
  slug: 'showrooms',
  labels: { singular: 'Dijital showroom', plural: 'Dijital showroom’lar' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'relatedProject', 'featured', '_status'],
  },
  access: {
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
  },
  hooks: { beforeDelete: [preventShowroomWithScenesDelete] },
  fields: [
    photoGuideField('showrooms'),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Showroom',
          fields: [
            { name: 'title', type: 'text', required: true, label: 'Başlık' },
            slugField,
            {
              name: 'shortDescription',
              type: 'textarea',
              required: true,
              maxLength: 320,
              label: 'Kısa açıklama',
            },
            { name: 'description', type: 'richText', label: 'Showroom anlatımı' },
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Kapak görseli',
              admin: {
                description:
                  'Showroom arşivindeki normal kapak fotoğrafı. 360° turun içindeki görüntüyü değiştirmek için Showroom sahneleri → 360° panorama alanını kullanın.',
              },
            },
            {
              name: 'relatedProject',
              type: 'relationship',
              relationTo: 'projects',
              label: 'İlgili portföy projesi',
              admin: {
                description:
                  'Bu proje seçilip showroom yayınlandığında proje detayında 360° keşif alanı görünür. İlişki kurulmazsa alan gösterilmez.',
              },
            },
            { name: 'featured', type: 'checkbox', defaultValue: false, label: 'Öne çıkar' },
            {
              name: 'displayOrder',
              type: 'number',
              defaultValue: 0,
              index: true,
              label: 'Görünüm sırası',
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'seoTitle', type: 'text', maxLength: 70, label: 'SEO başlığı' },
            { name: 'seoDescription', type: 'textarea', maxLength: 180, label: 'SEO açıklaması' },
            { name: 'seoImage', type: 'upload', relationTo: 'media', label: 'Paylaşım görseli' },
          ],
        },
      ],
    },
  ],
  versions: { drafts: { autosave: false } },
}
