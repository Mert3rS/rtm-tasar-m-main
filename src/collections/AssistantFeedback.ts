import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'

// Anonymous aggregate 👍/👎 counters per answer topic; written atomically by the trusted endpoint
// only with Analytics consent. No message text, visitor id or IP.
export const AssistantFeedback: CollectionConfig = {
  slug: 'assistant-feedback',
  labels: { singular: 'Asistan geri bildirimi', plural: 'Asistan geri bildirimleri' },
  admin: {
    useAsTitle: 'answerKey',
    group: 'Asistan',
    defaultColumns: ['answerKey', 'helpful', 'notHelpful', 'updatedAt'],
    description: 'Cevap konusu bazında anonim toplam sayaçlar.',
  },
  access: {
    create: () => false,
    update: () => false,
    read: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    {
      name: 'answerKey',
      type: 'text',
      required: true,
      unique: true,
      maxLength: 80,
      label: 'Cevap anahtarı',
    },
    { name: 'helpful', type: 'number', required: true, defaultValue: 0, label: '👍' },
    { name: 'notHelpful', type: 'number', required: true, defaultValue: 0, label: '👎' },
  ],
}
