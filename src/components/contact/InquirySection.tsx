import type { PublicSiteSettings } from '@/lib/siteSettings'
import { InquiryForm } from './InquiryForm'

export function InquirySection({
  settings,
  type,
  categories = [],
}: {
  settings: PublicSiteSettings
  type: 'contact' | 'quote'
  categories?: { id: number; name: string }[]
}) {
  const enabled = type === 'quote' ? settings.quoteFormEnabled : settings.contactFormEnabled
  const privacyReady = Boolean(settings.privacyNoticeContent || settings.privacyNoticeUrl)
  return (
    <div className="inquiry-section">
      <div className="inquiry-section-heading">
        <p className="eyebrow">{type === 'quote' ? 'Proje başvurusu' : 'Bir mesajla başlayalım'}</p>
        <h2>{type === 'quote' ? 'Her mekân bir fikirle başlar.' : 'Fikrinize yer açalım.'}</h2>
      </div>
      {privacyReady ? (
        <details className="privacy-notice" id="aydinlatma-metni">
          <summary>Kişisel verilerin işlenmesine ilişkin aydınlatma metni</summary>
          {settings.privacyNoticeContent ? <p>{settings.privacyNoticeContent}</p> : null}
          {settings.privacyNoticeUrl ? (
            <a
              className="text-link"
              href={settings.privacyNoticeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Aydınlatma metnini okuyun ↗
            </a>
          ) : null}
        </details>
      ) : null}
      {enabled && privacyReady ? (
        <InquiryForm type={type} categories={categories} />
      ) : (
        <>
          <div className="inquiry-preview-notice" role="status">
            <h3>Form önizlemesi</h3>
            <p>
              {privacyReady
                ? 'Form yönetim panelinden etkinleştirildiğinde gönderime açılacak.'
                : 'Formu aşağıda inceleyebilirsiniz. Onaylı aydınlatma metni yayınlandığında gönderime açılacak.'}
            </p>
          </div>
          <InquiryForm categories={categories} previewOnly type={type} />
        </>
      )}
    </div>
  )
}
