import path from 'node:path'
import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'

export const InquiryAttachments: CollectionConfig = {
  slug: 'inquiry-attachments',
  labels: { singular: 'Başvuru eki', plural: 'Başvuru ekleri' },
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  // Outside public/ and media/. Payload's file endpoint enforces the collection read access.
  upload: {
    staticDir: path.resolve('private-inquiry-attachments'),
    mimeTypes: ['image/jpeg'],
    disableLocalStorage: false,
  },
  admin: {
    description:
      'Kişisel veri içerir. Başvuruya bağlı dosyalar başvuruyla birlikte değerlendirilir; arşivleme silme değildir.',
  },
  indexes: [{ fields: ['submissionKey', 'slot'], unique: true }],
  fields: [
    {
      name: 'linkedAt',
      type: 'date',
      index: true,
      label: 'İlk başvuruya bağlanma',
      admin: { readOnly: true },
    },
    {
      name: 'slot',
      type: 'number',
      required: true,
      min: 0,
      max: 2,
      label: 'Ek sırası',
      admin: { hidden: true },
    },
    {
      name: 'handle',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Dosya anahtarı',
      admin: { hidden: true },
    },
    {
      name: 'submissionKey',
      type: 'text',
      required: true,
      index: true,
      label: 'Gönderim anahtarı',
      admin: { hidden: true },
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      index: true,
      label: 'Geçerlilik sonu',
      admin: { readOnly: true },
    },
  ],
}
