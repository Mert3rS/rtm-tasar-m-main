import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'
import { activePublishedContent } from '../access/publishedContent'
import { safeInternalHref, settingsLinkKeys, settingsLinkLabels } from '../lib/assistant/links'
import { answerTopics } from '../lib/assistant/topics'

export const AssistantAnswers: CollectionConfig = {
  slug: 'assistant-answers',
  labels: { singular: 'Asistan cevabı', plural: 'Asistan cevapları' },
  admin: {
    useAsTitle: 'title',
    group: 'Asistan',
    defaultColumns: ['title', 'topic', 'priority', 'active', '_status'],
    description:
      'Asistanın aynen kullanacağı onaylı cevaplar. Aynı konudaki yerleşik davranıştan önceliklidir. Fiyat, süre, garanti gibi bilgileri yalnızca onaylıysa girin. Ziyaretçi yalnızca aktif ve yayınlanmış cevapları görür.',
  },
  access: {
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
    read: activePublishedContent,
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 160, label: 'Başlık' },
    {
      name: 'topic',
      type: 'select',
      label: 'Konu',
      defaultValue: 'general',
      options: answerTopics.map(({ value, label }) => ({ value, label })),
      admin: {
        description:
          'Yerleşik bir konuyu seçerseniz (ör. Fiyat), o konudaki soru geldiğinde bu cevap yerleşik yönlendirmenin yerine verilir.',
      },
    },
    {
      name: 'triggers',
      type: 'array',
      label: 'Tetikleyici kelimeler / ifadeler',
      maxRows: 30,
      labels: { singular: 'Tetikleyici', plural: 'Tetikleyiciler' },
      fields: [{ name: 'phrase', type: 'text', required: true, maxLength: 120, label: 'İfade' }],
    },
    {
      name: 'exampleQuestions',
      type: 'array',
      label: 'Örnek sorular',
      maxRows: 20,
      fields: [{ name: 'question', type: 'text', required: true, maxLength: 200, label: 'Soru' }],
    },
    { name: 'answer', type: 'richText', required: true, label: 'Cevap' },
    {
      name: 'actions',
      type: 'array',
      label: 'Aksiyon düğmeleri',
      maxRows: 4,
      fields: [
        { name: 'label', type: 'text', required: true, maxLength: 60, label: 'Düğme metni' },
        {
          name: 'kind',
          type: 'select',
          required: true,
          defaultValue: 'route',
          label: 'Hedef türü',
          options: [
            { label: 'Site içi sayfa', value: 'route' },
            { label: 'Site Ayarları bağlantısı', value: 'settings' },
            { label: 'Çerez tercihleri paneli', value: 'consent' },
          ],
        },
        {
          name: 'route',
          type: 'text',
          maxLength: 300,
          label: 'Site içi adres',
          admin: {
            condition: (_, sibling) => sibling?.kind === 'route',
            description: 'Örn. /teklif-al, /modeller?kategori=mutfak. Haricî adres kabul edilmez.',
          },
          validate: (value: string | null | undefined, { siblingData }: { siblingData: unknown }) => {
            const kind =
              siblingData && typeof siblingData === 'object' && 'kind' in siblingData
                ? siblingData.kind
                : undefined
            if (kind !== 'route') return true
            return Boolean(safeInternalHref(value)) || 'İzin verilen bir site içi adres girin.'
          },
        },
        {
          name: 'settingsLink',
          type: 'select',
          label: 'Site Ayarları bağlantısı',
          options: settingsLinkKeys.map((value) => ({ value, label: settingsLinkLabels[value] })),
          admin: {
            condition: (_, sibling) => sibling?.kind === 'settings',
            description: 'Bağlantı Site Ayarları’nda tanımlı değilse düğme gösterilmez.',
          },
        },
      ],
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 0,
      min: -100,
      max: 100,
      label: 'Öncelik',
      admin: { description: 'Benzer eşleşmelerde yüksek öncelikli cevap seçilir.' },
    },
    { name: 'active', type: 'checkbox', defaultValue: true, index: true, label: 'Aktif' },
  ],
  versions: { drafts: { autosave: false } },
}
