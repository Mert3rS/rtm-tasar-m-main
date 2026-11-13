import type { CollectionConfig, Where } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'
import { slugField } from '../fields/slug'
import { photoGuideField } from '../fields/photoGuide'
import { preventReferencedSceneDelete, validateShowroomScene } from '../hooks/validateShowroomScene'

export const ShowroomScenes: CollectionConfig = {
  slug: 'showroom-scenes',
  labels: { singular: 'Showroom sahnesi', plural: 'Showroom sahneleri' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'showroom', 'sceneKey', 'displayOrder', '_status'],
    description:
      'Önce showroom oluşturun; gerçek 360° panoramaları Media’ya yükleyin. Normal fotoğraflar panorama değildir.',
  },
  access: {
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
    read: ({ req }): boolean | Where =>
      req.user
        ? true
        : {
            and: [
              { _status: { equals: 'published' } },
              { 'showroom._status': { equals: 'published' } },
            ],
          },
  },
  indexes: [{ fields: ['showroom', 'sceneKey'], unique: true }],
  hooks: { beforeValidate: [validateShowroomScene], beforeDelete: [preventReferencedSceneDelete] },
  fields: [
    photoGuideField('showroom-scenes'),
    {
      name: 'showroom',
      type: 'relationship',
      relationTo: 'showrooms',
      required: true,
      index: true,
      label: 'Bağlı showroom',
    },
    { name: 'title', type: 'text', required: true, label: 'Sahne adı' },
    {
      ...slugField,
      name: 'sceneKey',
      unique: false,
      label: 'Sahne anahtarı',
      admin: { description: 'Bu showroom içinde benzersiz URL uyumlu anahtar; ör. giris, salon.' },
    },
    {
      name: 'panoramaImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      filterOptions: { usage: { equals: 'panorama' } },
      label: '360° panorama',
      admin: {
        description:
          'Media’da “360° panorama” seçin. Tam 2:1 JPEG/WebP, önerilen 4096×2048; en fazla 8192×4096. Sıradan fotoğraf yüklemeyin.',
      },
    },
    {
      name: 'thumbnailImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Küçük önizleme (isteğe bağlı)',
      admin: {
        description:
          'Turun altındaki sahne seçim düğmesinin normal fotoğrafı. Tercihen 640×360 px veya daha büyük yatay kare; boşsa 360° yazısı gösterilir. Turun asıl panoramasını değiştirmez.',
      },
    },
    { name: 'description', type: 'textarea', maxLength: 600, label: 'Sahne açıklaması' },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      index: true,
      label: 'Sahne sırası',
      admin: { description: 'En küçük sıradaki yayınlanmış geçerli sahne başlangıç sahnesidir.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'initialYaw',
          type: 'number',
          min: -180,
          max: 180,
          defaultValue: 0,
          label: 'Başlangıç yatay açı (yaw)',
        },
        {
          name: 'initialPitch',
          type: 'number',
          min: -90,
          max: 90,
          defaultValue: 0,
          label: 'Başlangıç dikey açı (pitch)',
        },
        {
          name: 'initialHfov',
          type: 'number',
          min: 50,
          max: 110,
          defaultValue: 90,
          label: 'Görüş açısı (zoom)',
          admin: { description: 'Küçük değer daha yakın görünüm sağlar.' },
        },
      ],
    },
    {
      name: 'hotspots',
      type: 'array',
      maxRows: 40,
      label: 'Geçiş ve bilgi noktaları',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          maxLength: 100,
          label: 'Erişilebilir etiket',
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'scene',
          options: [
            { label: 'Sahneye geçiş', value: 'scene' },
            { label: 'Bilgi', value: 'info' },
          ],
          label: 'Nokta türü',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'yaw',
              type: 'number',
              required: true,
              min: -180,
              max: 180,
              label: 'Yatay açı (yaw)',
            },
            {
              name: 'pitch',
              type: 'number',
              required: true,
              min: -90,
              max: 90,
              label: 'Dikey açı (pitch)',
            },
          ],
        },
        {
          name: 'targetScene',
          type: 'relationship',
          relationTo: 'showroom-scenes',
          label: 'Hedef sahne',
          admin: {
            condition: (_, siblingData) => siblingData.type === 'scene',
            description:
              'Aynı showroom’dan bir sahne seçin. Hedef yayınlanana kadar geçiş ziyaretçiden gizlenir.',
          },
        },
        {
          name: 'informationText',
          type: 'textarea',
          maxLength: 600,
          label: 'Bilgi metni',
          admin: { condition: (_, siblingData) => siblingData.type === 'info' },
        },
      ],
    },
  ],
  versions: { drafts: { autosave: false } },
}
