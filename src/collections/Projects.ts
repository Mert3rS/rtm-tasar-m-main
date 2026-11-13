import type { CollectionConfig } from 'payload'

import { isAuthenticated } from '../access/isAuthenticated'
import { slugField } from '../fields/slug'
import { photoGuideField } from '../fields/photoGuide'

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
    description:
      'Proje kapağı, detay albümü ve paylaşım görseli ayrı alanlardır. Yerleşim rehberinden her fotoğrafın kullanıldığı alanları inceleyin. Taslak değişiklikler Yayınla ile siteye yansır.',
    defaultColumns: ['title', 'city', 'featured', '_status', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    photoGuideField('projects'),
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
      admin: {
        description:
          'Proje arşivi ve ana sayfanın seçili proje kartlarındaki kısa metin. Detay sayfasının uzun anlatımı için Proje anlatımı alanını kullanın.',
      },
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
      admin: {
        description:
          'Yalnızca proje detayındaki uzun açıklama. Kartların kısa metnini değiştirmez.',
      },
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
      admin: {
        description:
          'Proje arşivi ve detay kapağı; seçili projelerde ana sayfanın küre kartı ve kaydırmalı seçili işler fotoğrafı. Ana sayfa açılışında yalnızca bağımsız seçim yapılmamış konumlarda otomatik kaynak olabilir. Yatay, net bir fotoğraf seçin; kenarlar ekrana göre kırpılır.',
      },
    },
    {
      name: 'gallery',
      type: 'array',
      label: 'Proje galerisi',
      admin: {
        description:
          'Proje detayındaki fotoğraf albümü. Kapak ayrıca gösterilir; fotoğrafa tıklanınca büyük görüntü açılır. Satırları sürükleyerek sıralayın.',
      },
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
      admin: {
        description:
          'Yayınlanmış ilk dört seçili proje ana sayfada küre / seçili işler bölümlerine girer. Üst açılış fotoğrafları Site ayarlarından bağımsız seçilir; boş konumlarda yayınlanmış ilk dokuz geçerli kapak otomatik kaynak olabilir.',
      },
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
