import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'
import { activePublishedContent } from '../access/publishedContent'
import { slugField } from '../fields/slug'

export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: 'Hizmet', plural: 'Hizmetler' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'active', 'featured', 'displayOrder', '_status'],
    description:
      'Yalnızca onaylı gerçek hizmetlerinizi ekleyin. Ziyaretçi yalnızca aktif ve yayınlanmış kayıtları görür.',
  },
  access: {
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
    read: activePublishedContent,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hizmet',
          fields: [
            { name: 'title', type: 'text', required: true, maxLength: 160, label: 'Hizmet adı' },
            slugField,
            { name: 'shortDescription', type: 'textarea', maxLength: 320, label: 'Kısa açıklama' },
            { name: 'description', type: 'richText', label: 'Hizmet anlatımı' },
            { name: 'coverImage', type: 'upload', relationTo: 'media', label: 'Kapak görseli' },
            {
              name: 'galleryImages',
              type: 'array',
              maxRows: 30,
              label: 'Galeri',
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                  label: 'Görsel',
                },
              ],
            },
            {
              name: 'featured',
              type: 'checkbox',
              defaultValue: false,
              label: 'Ana sayfada öncelikli',
            },
            {
              name: 'displayOrder',
              type: 'number',
              defaultValue: 0,
              index: true,
              label: 'Görünüm sırası',
            },
            { name: 'active', type: 'checkbox', defaultValue: true, index: true, label: 'Aktif' },
          ],
        },
        {
          label: 'İlişkiler',
          fields: [
            {
              name: 'relatedProjects',
              type: 'relationship',
              relationTo: 'projects',
              hasMany: true,
              maxRows: 6,
              label: 'İlgili tamamlanmış projeler',
              admin: { description: 'Ziyaretçiye yalnızca yayınlanmış projeler gösterilir.' },
            },
            {
              name: 'relatedModelCategories',
              type: 'relationship',
              relationTo: 'model-categories',
              hasMany: true,
              maxRows: 12,
              label: 'İlgili model kategorileri',
              admin: {
                description:
                  'Bu aktif kategorilerdeki yayınlanmış tasarım modelleri hizmet detayında gösterilebilir.',
              },
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
