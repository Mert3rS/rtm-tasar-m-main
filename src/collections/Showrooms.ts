import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'
import { slugField } from '../fields/slug'
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
            { name: 'coverImage', type: 'upload', relationTo: 'media', label: 'Kapak görseli' },
            {
              name: 'relatedProject',
              type: 'relationship',
              relationTo: 'projects',
              label: 'İlgili portföy projesi',
              admin: {
                description: 'Ziyaretçiye yalnızca yayınlanmış proje bağlantısı gösterilir.',
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
