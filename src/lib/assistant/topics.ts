/** Topics shared by built-in intents and admin answers (admin answer for a topic wins). */
export const answerTopics = [
  { value: 'general', label: 'Genel bilgi (malzeme, ölçü, bakım vb.)' },
  { value: 'pricing', label: 'Fiyat / ücret' },
  { value: 'delivery', label: 'Teslim / üretim süresi' },
  { value: 'warranty', label: 'Garanti' },
  { value: 'stock', label: 'Stok / üretim uygunluğu' },
  { value: 'hours', label: 'Çalışma saatleri / randevu' },
  { value: 'services', label: 'Hizmetler' },
  { value: 'projects', label: 'Projeler' },
  { value: 'models', label: 'Tasarım modelleri' },
  { value: 'showroom', label: 'Showroom / 360° tur' },
  { value: 'studio', label: 'Tasarım atölyesi' },
  { value: 'quote', label: 'Teklif süreci' },
  { value: 'contact', label: 'İletişim' },
  { value: 'about', label: 'Hakkımızda' },
  { value: 'privacy', label: 'Gizlilik / çerezler' },
] as const
export type AnswerTopic = (typeof answerTopics)[number]['value']
