import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'

// Private improvement list. Rows are written only by the trusted assistant endpoint when the
// admin enabled logging AND the visitor granted Analytics consent. Text is masked; no visitor id/IP.
export const AssistantUnanswered: CollectionConfig = {
  slug: 'assistant-unanswered',
  labels: { singular: 'Yanıtlanamayan soru', plural: 'Yanıtlanamayan sorular' },
  admin: {
    useAsTitle: 'question',
    group: 'Asistan',
    defaultColumns: ['question', 'count', 'lastSeenAt'],
    description:
      'Asistanın düşük güvenle yanıtladığı, maskelenmiş anonim sorular. Yeni Asistan cevabı veya SSS yazmak için kullanın. Süresi dolanlar otomatik silinir.',
  },
  access: {
    create: () => false,
    update: () => false,
    read: isAuthenticated,
    delete: isAuthenticated,
  },
  defaultSort: '-lastSeenAt',
  fields: [
    { name: 'question', type: 'text', required: true, maxLength: 500, label: 'Soru (maskeli)' },
    {
      name: 'normalized',
      type: 'text',
      required: true,
      unique: true,
      maxLength: 500,
      label: 'Normalize biçim',
      admin: { readOnly: true },
    },
    { name: 'count', type: 'number', required: true, defaultValue: 1, label: 'Tekrar sayısı' },
    { name: 'lastSeenAt', type: 'date', required: true, index: true, label: 'Son görülme' },
  ],
}
