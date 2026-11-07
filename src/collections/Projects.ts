import type { CollectionConfig } from 'payload'

import { isAuthenticated } from '../access/isAuthenticated'
import { slugField } from '../fields/slug'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: 'Proje', plural: 'Projeler' },
  access: {
    create: isAuthenticated,
    delete: isAuthenticated,
    read: ({ req }) => {
      if (req.user) return true

      return {
        _status: {
          equals: 'published',
        },
      }
    },
    update: isAuthenticated,
  },
  admin: {
    defaultColumns: ['title', 'city', 'featured', '_status', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Proje adı',
      required: true,
    },
    slugField,
    {
      name: 'shortDescription',
      type: 'textarea',
      label: 'Kısa açıklama',
      maxLength: 320,
      required: true,
    },
    {
      name: 'city',
      type: 'relationship',
      label: 'Şehir',
      relationTo: 'cities',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Proje anlatımı',
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'project-categories',
      hasMany: true,
      label: 'Kategoriler',
      admin: {
        description:
          'Aktif olmayan kategoriler public sayfalarda gösterilmez; mevcut proje ilişkileri korunur.',
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      label: 'Kapak görseli',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'gallery',
      type: 'array',
      label: 'Proje galerisi',
      fields: [
        {
          name: 'image',
          type: 'upload',
          label: 'Görsel',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Öne çıkar',
      defaultValue: false,
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      index: true,
      label: 'Görünüm sırası',
      admin: { description: 'Küçük değerler önce gösterilir. Eşitlikte yeni projeler önce gelir.' },
    },
    { name: 'projectType', type: 'text', label: 'Proje türü' },
    {
      name: 'completionYear',
      type: 'number',
      min: 1800,
      max: 2200,
      label: 'Tamamlanma yılı',
      validate: (value: number | number[] | null | undefined) =>
        value == null ||
        (typeof value === 'number' && Number.isInteger(value) && value >= 1800 && value <= 2200) ||
        'Tamamlanma yılı 1800–2200 arasında bir tam sayı olmalıdır.',
    },
    { name: 'locationDescription', type: 'text', label: 'Konum açıklaması' },
    {
      name: 'clientName',
      type: 'text',
      label: 'Müşteri adı',
      admin: { description: 'Yalnızca herkese açık paylaşımı onaylanmış müşteri adını girin.' },
    },
    { name: 'projectArea', type: 'number', min: 0, label: 'Proje alanı (m²)' },
    { name: 'seoTitle', type: 'text', maxLength: 70, label: 'SEO başlığı' },
    { name: 'seoDescription', type: 'textarea', maxLength: 180, label: 'SEO açıklaması' },
    { name: 'seoImage', type: 'upload', relationTo: 'media', label: 'Sosyal paylaşım görseli' },
  ],
  versions: {
    drafts: {
      autosave: false,
    },
  },
}
