import type { GlobalConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'

export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  label: 'Hakkımızda sayfası',
  access: { read: isAuthenticated, update: isAuthenticated },
  versions: { drafts: { autosave: false } },
  admin: {
    description:
      'Şirket/ekip bilgilerini onaylı kaynaklardan girin. Önerilen giriş metnini inceleyip yayınlayın. Yalnızca yayınlanmış içerik siteye ve ana sayfa tanıtımına aktarılır.',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Giriş',
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              maxLength: 100,
              defaultValue: 'Biz kimiz?',
              label: 'Üst başlık',
            },
            {
              name: 'heading',
              type: 'text',
              maxLength: 160,
              defaultValue: 'Tasarımın Her Detayında Ustalık.',
              label: 'Ana başlık',
            },
            {
              name: 'subtitle',
              type: 'textarea',
              maxLength: 500,
              label: 'Kısa tanıtım (ana sayfada da kullanılır)',
              admin: {
                description:
                  'Öneri: Tecrübeli usta kadromuz ve iç mimarımızla, tasarımdan uygulamaya mekânlarınıza değer katmak için çalışıyoruz. Gerçek şirket durumunuza göre düzenleyin.',
              },
            },
            { name: 'introduction', type: 'richText', label: 'Giriş anlatımı' },
            { name: 'heroImage', type: 'upload', relationTo: 'media', label: 'Giriş görseli' },
          ],
        },
        {
          label: 'Hikâye ve uzmanlık',
          fields: [
            {
              name: 'storyHeading',
              type: 'text',
              maxLength: 160,
              label: 'Şirket hikâyesi başlığı',
            },
            { name: 'storyContent', type: 'richText', label: 'Şirket hikâyesi' },
            { name: 'storyImage', type: 'upload', relationTo: 'media', label: 'Hikâye görseli' },
            { name: 'expertiseHeading', type: 'text', maxLength: 160, label: 'Uzmanlık başlığı' },
            {
              name: 'expertiseDescription',
              type: 'textarea',
              maxLength: 800,
              label: 'Uzmanlık açıklaması',
            },
            {
              name: 'expertiseItems',
              type: 'array',
              maxRows: 12,
              label: 'Uzmanlık alanları',
              fields: [
                { name: 'title', type: 'text', required: true, maxLength: 120, label: 'Başlık' },
                { name: 'description', type: 'textarea', maxLength: 500, label: 'Açıklama' },
              ],
            },
          ],
        },
        {
          label: 'Ekip',
          fields: [
            { name: 'teamHeading', type: 'text', maxLength: 160, label: 'Ekip başlığı' },
            { name: 'teamDescription', type: 'textarea', maxLength: 1200, label: 'Ekip tanıtımı' },
            { name: 'teamImage', type: 'upload', relationTo: 'media', label: 'Ekip görseli' },
            {
              name: 'teamMembers',
              type: 'array',
              maxRows: 20,
              label: 'Ekip üyeleri (isteğe bağlı)',
              fields: [
                { name: 'name', type: 'text', required: true, maxLength: 120, label: 'Ad soyad' },
                { name: 'role', type: 'text', maxLength: 120, label: 'Görev' },
                { name: 'image', type: 'upload', relationTo: 'media', label: 'Portre' },
              ],
            },
          ],
        },
        {
          label: 'Yaklaşım ve görseller',
          fields: [
            {
              name: 'processHeading',
              type: 'text',
              maxLength: 160,
              label: 'Çalışma yaklaşımı başlığı',
            },
            {
              name: 'processDescription',
              type: 'textarea',
              maxLength: 800,
              label: 'Yaklaşım açıklaması',
            },
            {
              name: 'processSteps',
              type: 'array',
              maxRows: 12,
              label: 'Süreç adımları',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                  maxLength: 120,
                  label: 'Adım başlığı',
                },
                { name: 'description', type: 'textarea', maxLength: 500, label: 'Adım açıklaması' },
              ],
            },
            {
              name: 'galleryImages',
              type: 'array',
              maxRows: 20,
              label: 'Şirket galerisi',
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                  label: 'Görsel',
                },
              ],
            },
            {
              name: 'featuredProjects',
              type: 'relationship',
              relationTo: 'projects',
              hasMany: true,
              maxRows: 6,
              label: 'Seçili tamamlanmış projeler',
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'seoTitle', type: 'text', maxLength: 70, label: 'SEO başlığı' },
            { name: 'seoDescription', type: 'textarea', maxLength: 180, label: 'SEO açıklaması' },
            { name: 'seoImage', type: 'upload', relationTo: 'media', label: 'Paylaşım görseli' },
          ],
        },
      ],
    },
  ],
}
