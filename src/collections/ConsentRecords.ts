import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'

// Anonymous consent proof. Written only by the trusted /api/consent handler; no IP or personal data.
export const ConsentRecords: CollectionConfig = {
  slug: 'consent-records',
  labels: { singular: 'İzin kaydı', plural: 'İzin kayıtları' },
  admin: {
    useAsTitle: 'consentId',
    group: 'Gizlilik',
    defaultColumns: ['consentId', 'policyVersion', 'source', 'decidedAt'],
    description:
      'Anonim izin kimliği, politika sürümü ve seçimler. Saklama süresi Site ayarları → Çerez politikası sekmesinden belirlenir.',
  },
  access: {
    create: () => false,
    update: () => false,
    delete: () => false,
    read: isAuthenticated,
  },
  defaultSort: '-decidedAt',
  fields: [
    { name: 'consentId', type: 'text', required: true, index: true, maxLength: 40, label: 'İzin kimliği' },
    { name: 'policyVersion', type: 'text', required: true, maxLength: 32, label: 'Politika sürümü' },
    { name: 'functional', type: 'checkbox', defaultValue: false, label: 'İşlevsel' },
    { name: 'personalization', type: 'checkbox', defaultValue: false, label: 'Kişiselleştirme' },
    { name: 'analytics', type: 'checkbox', defaultValue: false, label: 'Analitik' },
    { name: 'marketing', type: 'checkbox', defaultValue: false, label: 'Pazarlama' },
    {
      name: 'source',
      type: 'select',
      required: true,
      label: 'Kaynak',
      options: [
        { label: 'Banner', value: 'banner' },
        { label: 'Tercihler paneli', value: 'preferences' },
        { label: 'Geri alma', value: 'revoke' },
      ],
    },
    { name: 'decidedAt', type: 'date', required: true, index: true, label: 'Karar tarihi' },
  ],
}
