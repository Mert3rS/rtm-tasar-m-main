import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'
import { activePublishedContent } from '../access/publishedContent'

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'Sık sorulan soru', plural: 'Sık sorulan sorular' },
  admin: {
    useAsTitle: 'question',
    group: 'Asistan',
    defaultColumns: ['question', 'category', 'displayOrder', 'active', '_status'],
    description:
      'Onaylı soru/cevaplar. Asistan bunları arar; /sss sayfasında yayınlanır. Otomatik içerik eklenmez.',
  },
  access: {
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
    read: activePublishedContent,
  },
  fields: [
    { name: 'question', type: 'text', required: true, maxLength: 300, label: 'Soru' },
    { name: 'answer', type: 'richText', required: true, label: 'Cevap' },
    { name: 'category', type: 'text', maxLength: 80, label: 'Kategori (isteğe bağlı)' },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      index: true,
      label: 'Görünüm sırası',
    },
    { name: 'active', type: 'checkbox', defaultValue: true, index: true, label: 'Aktif' },
  ],
  versions: { drafts: { autosave: false } },
}
