import type { GlobalConfig, TextField } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'
import { phoneHref, safeHttpsUrl, validEmail, whatsappUrl } from '../lib/contactValidation'

const url = (name: string, label: string): TextField => ({
  name,
  label,
  type: 'text',
  maxLength: 2048,
  validate: (value) => !value || Boolean(safeHttpsUrl(value)) || 'Geçerli bir HTTPS adresi girin.',
})

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site ayarları',
  access: { read: isAuthenticated, update: isAuthenticated },
  fields: [
    {
      name: 'designShareRetentionDays',
      type: 'number',
      min: 1,
      max: 3650,
      defaultValue: 180,
      label: 'Tasarım bağlantısı saklama süresi (gün)',
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Şirket ve iletişim',
          fields: [
            { name: 'companyName', type: 'text', label: 'Şirket adı', maxLength: 120 },
            {
              name: 'companyDescription',
              type: 'textarea',
              label: 'Şirket açıklaması',
              maxLength: 600,
            },
            { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo (isteğe bağlı)' },
            { name: 'contactEmail', type: 'email', label: 'Public iletişim e-postası' },
            {
              name: 'phone',
              type: 'text',
              label: 'Telefon',
              maxLength: 35,
              validate: (value: string | null | undefined) =>
                !value || Boolean(phoneHref(value)) || 'Geçerli bir telefon numarası girin.',
            },
            {
              name: 'whatsappNumber',
              type: 'text',
              label: 'WhatsApp numarası',
              maxLength: 35,
              admin: {
                description:
                  'Ülke koduyla girin; örnek biçim +ülke kodu ve numara. Yerel 0 önekini kullanmayın.',
              },
              validate: (value: string | null | undefined) =>
                !value || Boolean(whatsappUrl(value)) || 'Ülke koduyla geçerli bir numara girin.',
            },
            { name: 'address', type: 'textarea', label: 'Adres', maxLength: 600 },
            { name: 'city', type: 'text', label: 'Şehir', maxLength: 120 },
            { name: 'country', type: 'text', label: 'Ülke', maxLength: 120 },
            url('googleMapsUrl', 'Harita bağlantısı'),
          ],
        },
        {
          label: 'Sosyal medya',
          fields: [
            url('instagramUrl', 'Instagram'),
            url('facebookUrl', 'Facebook'),
            url('linkedinUrl', 'LinkedIn'),
            url('youtubeUrl', 'YouTube'),
          ],
        },
        {
          label: 'Site ve formlar',
          fields: [
            {
              name: 'defaultSeoTitle',
              type: 'text',
              label: 'Varsayılan SEO başlığı',
              maxLength: 70,
            },
            {
              name: 'defaultSeoDescription',
              type: 'textarea',
              label: 'Varsayılan SEO açıklaması',
              maxLength: 180,
            },
            {
              name: 'contactFormEnabled',
              type: 'checkbox',
              defaultValue: true,
              label: 'İletişim formu açık',
            },
            {
              name: 'quoteFormEnabled',
              type: 'checkbox',
              defaultValue: true,
              label: 'Teklif formu açık',
            },
            {
              name: 'notificationRecipientEmail',
              type: 'email',
              label: 'Bildirim alıcısı (yalnızca admin)',
              admin: {
                description:
                  'SMTP yanında sunucudaki INQUIRY_NOTIFICATION_RECIPIENT_ALLOWLIST içinde de onaylı olmalıdır. Bu adres public DTO’ya aktarılmaz.',
              },
              validate: (value) =>
                !value || validEmail(value) || 'Geçerli bir e-posta adresi girin.',
            },
          ],
        },
        {
          label: 'Aydınlatma metni',
          fields: [
            {
              name: 'privacyNoticeContent',
              type: 'textarea',
              label: 'Onaylı KVKK aydınlatma metni',
              maxLength: 12000,
              admin: {
                description:
                  'Hukuk danışmanınızın onayladığı gerçek metni girin. Metin veya HTTPS bağlantısı olmadan formlar gönderime açılmaz.',
              },
            },
            url('privacyNoticeUrl', 'Onaylı aydınlatma metni bağlantısı'),
          ],
        },
        {
          label: 'Çerez politikası',
          description:
            'Hukuk danışmanınızın onayladığı çerez politikasını girin. Metin veya HTTPS bağlantısı ve politika sürümü olmadan isteğe bağlı çerez kategorileri (işlevsel, kişiselleştirme, analitik) kapalı kalır; banner yalnızca zorunlu çerezleri bildirir.',
          fields: [
            {
              name: 'cookiePolicyStatus',
              type: 'ui',
              admin: {
                components: {
                  Field: '/components/admin/CookiePolicyStatus#CookiePolicyStatus',
                },
              },
            },
            {
              name: 'cookiePolicyContent',
              type: 'richText',
              label: 'Onaylı çerez politikası metni',
            },
            url('cookiePolicyUrl', 'Onaylı çerez politikası bağlantısı'),
            {
              name: 'cookiePolicyVersion',
              type: 'text',
              label: 'Politika sürümü',
              maxLength: 32,
              admin: {
                description:
                  'Örn. 2026-11 veya 1.2. Sürümü değiştirdiğinizde bütün ziyaretçilere çerez tercihi yeniden sorulur. Harf, rakam, nokta, tire ve alt çizgi kullanın.',
              },
              validate: (value: string | null | undefined) =>
                !value ||
                (/^[A-Za-z0-9._-]{1,32}$/.test(value) && value !== 'unconfigured') ||
                'Yalnızca harf, rakam, nokta, tire ve alt çizgi kullanın.',
            },
            {
              name: 'cookiePolicyUpdatedAt',
              type: 'date',
              label: 'Son güncelleme tarihi',
              admin: { date: { pickerAppearance: 'dayOnly' } },
            },
            { name: 'consentBannerTitle', type: 'text', label: 'Banner başlığı', maxLength: 120 },
            {
              name: 'consentBannerDescription',
              type: 'textarea',
              label: 'Banner açıklaması',
              maxLength: 400,
            },
            {
              name: 'consentRecordRetentionDays',
              type: 'number',
              label: 'İzin kayıtlarının saklama süresi (gün)',
              defaultValue: 365,
              min: 30,
              max: 3650,
              admin: {
                description:
                  'Süresi dolan anonim izin kanıtları yeni kayıt sırasında silinir. Süreyi hukuk danışmanınızla belirleyin.',
              },
            },
          ],
        },
      ],
    },
  ],
}
