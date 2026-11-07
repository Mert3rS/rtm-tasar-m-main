import type { GlobalConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'

export const AssistantSettings: GlobalConfig = {
  slug: 'assistant-settings',
  label: 'Asistan ayarları',
  admin: {
    group: 'Asistan',
    description:
      'Site geneli otomatik asistan. Haricî yapay zekâ servisi kullanılmaz; cevaplar yayınlanmış CMS içeriğinden ve onaylı Asistan cevaplarından hazırlanır.',
  },
  access: { read: isAuthenticated, update: isAuthenticated },
  fields: [
    { name: 'enabled', type: 'checkbox', defaultValue: false, label: 'Asistan açık' },
    {
      name: 'displayName',
      type: 'text',
      maxLength: 60,
      label: 'Görünen ad',
      admin: { description: 'Boşsa "RTM Tasarım Yardımcısı" kullanılır.' },
    },
    {
      name: 'tagline',
      type: 'text',
      maxLength: 140,
      label: 'Başlatıcı alt satırı',
      admin: {
        description:
          'Sağ alttaki sohbet düğmesinde adın altında görünen kısa metin. Boşsa "Sorularınızı yanıtlayalım" kullanılır; 40 karakteri geçmemesi önerilir.',
      },
    },
    {
      name: 'welcomeMessage',
      type: 'textarea',
      maxLength: 400,
      label: 'Karşılama mesajı',
      admin: { description: 'Sohbet açılır açılmaz gösterilen ilk mesaj. Boşsa varsayılan karşılama kullanılır.' },
    },
    {
      name: 'quickQuestions',
      type: 'array',
      label: 'Hızlı soru düğmeleri',
      maxRows: 6,
      fields: [
        { name: 'label', type: 'text', required: true, maxLength: 48, label: 'Düğme metni' },
        {
          name: 'question',
          type: 'text',
          maxLength: 200,
          label: 'Gönderilecek soru (boşsa düğme metni)',
        },
      ],
    },
    {
      name: 'fallbackMessage',
      type: 'textarea',
      maxLength: 400,
      label: 'Anlaşılamadı mesajı',
    },
    {
      name: 'synonymGroups',
      type: 'array',
      label: 'Ek eş anlamlılar',
      maxRows: 60,
      admin: {
        description:
          'Her satıra aynı anlama gelen kelimeleri virgülle yazın. Örn: komodin, şifonyer, başucu dolabı',
      },
      fields: [{ name: 'words', type: 'text', required: true, maxLength: 240, label: 'Kelimeler' }],
    },
    {
      name: 'logUnanswered',
      type: 'checkbox',
      defaultValue: false,
      label: 'Yanıtlanamayan soruları kaydet',
      admin: {
        description:
          'Yalnızca ziyaretçi Analitik çerezlerine izin verdiyse, maskelenmiş ve anonim olarak kaydedilir.',
      },
    },
    {
      name: 'unansweredRetentionDays',
      type: 'number',
      defaultValue: 90,
      min: 7,
      max: 730,
      label: 'Yanıtlanamayan soruların saklama süresi (gün)',
    },
  ],
}
