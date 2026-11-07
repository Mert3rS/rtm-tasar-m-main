import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'
import { publishedContent } from '../access/publishedContent'
import { slugField } from '../fields/slug'

export const DesignModels: CollectionConfig = {
  slug: 'design-models',
  labels: { singular: 'Tasarım modeli', plural: 'Tasarım modelleri' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'categories', 'modelType', 'featured', '_status'],
    description:
      'Tasarım/ürün referans kataloğudur; tamamlanmış müşteri projesi veya küre kaydı değildir. Yalnızca onaylı görsel ve sınıflandırma kullanın.',
  },
  access: {
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
    read: publishedContent,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Model',
          fields: [
            { name: 'title', type: 'text', required: true, maxLength: 160, label: 'Model adı' },
            slugField,
            { name: 'shortDescription', type: 'textarea', maxLength: 320, label: 'Kısa açıklama' },
            { name: 'description', type: 'richText', label: 'Model anlatımı' },
            { name: 'coverImage', type: 'upload', relationTo: 'media', label: 'Kapak görseli' },
            {
              name: 'galleryImages',
              type: 'array',
              maxRows: 30,
              label: 'Model galerisi',
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
              name: 'categories',
              type: 'relationship',
              relationTo: 'model-categories',
              hasMany: true,
              maxRows: 12,
              label: 'Model kategorileri',
            },
            {
              name: 'modelType',
              type: 'select',
              label: 'Referans sınıfı (isteğe bağlı)',
              admin: {
                description:
                  'Sadece müşteri kaynağıyla doğrulanan sınıfı seçin. Üretilmiş olduğuna dair kanıt yoksa üretim örneği seçmeyin.',
              },
              options: [
                { label: 'Konsept / tasarım örneği', value: 'concept' },
                { label: 'Render', value: 'render' },
                { label: 'Doğrulanmış üretim örneği', value: 'production-example' },
              ],
            },
            {
              name: 'featured',
              type: 'checkbox',
              defaultValue: false,
              index: true,
              label: 'Ana sayfada öne çıkar',
            },
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
          label: 'İlişkiler',
          fields: [
            {
              name: 'relatedServices',
              type: 'relationship',
              relationTo: 'services',
              hasMany: true,
              maxRows: 6,
              label: 'İlgili hizmetler',
            },
            {
              name: 'relatedProjects',
              type: 'relationship',
              relationTo: 'projects',
              hasMany: true,
              maxRows: 6,
              label: 'İlgili tamamlanmış projeler',
              admin: {
                description:
                  'İlişki eklemek modeli tamamlanmış proje yapmaz; yalnızca gerçekten ilgili onaylı projeleri seçin.',
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
