import { PageIntro } from '@/components/site/PageIntro'
import { getPublicSiteSettings } from '@/lib/siteSettings'
import { portfolioMetadata } from '@/lib/seo'

export async function generateMetadata() {
  const settings = await getPublicSiteSettings()
  return portfolioMetadata({
    title: `KVKK Aydınlatma Metni | ${settings.companyName}`,
    description: 'İletişim ve teklif formlarında işlenen kişisel verilere ilişkin aydınlatma metni.',
    path: '/kvkk-aydinlatma-metni',
  })
}

function NoticeContent({ content }: { content: string }) {
  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  return blocks.map((block, index) => {
    const [firstLine, ...rest] = block.split('\n')
    if (/^\d+\.\s/.test(firstLine) && rest.length) {
      return (
        <section key={`${firstLine}-${index}`}>
          <h2>{firstLine}</h2>
          <p>{rest.join('\n')}</p>
        </section>
      )
    }
    return (
      <p className={index === 0 ? 'policy-meta' : undefined} key={`${firstLine}-${index}`}>
        {block}
      </p>
    )
  })
}

export default async function PrivacyNoticePage() {
  const settings = await getPublicSiteSettings()
  return (
    <main id="main-content" className="policy-page privacy-policy-page">
      <PageIntro
        number="11"
        eyebrow="KİŞİSEL VERİLER"
        title={
          <>
            KVKK aydınlatma metni<span className="accent">.</span>
          </>
        }
        description="İletişim ve teklif formlarında paylaştığınız kişisel verilerin nasıl işlendiğini burada açıklıyoruz."
      />
      <div className="site-shell policy-body">
        {settings.privacyNoticeContent ? (
          <article className="privacy-policy-document">
            <NoticeContent content={settings.privacyNoticeContent} />
            <aside className="privacy-policy-contact" aria-label="KVKK iletişim bilgisi">
              <span className="micro-label">KVKK İLETİŞİMİ</span>
              <a href={`mailto:${settings.contactEmail || 'rtmtasarim@gmail.com'}`}>
                {settings.contactEmail || 'rtmtasarim@gmail.com'}
              </a>
            </aside>
          </article>
        ) : settings.privacyNoticeUrl ? (
          <p>
            <a
              className="text-link"
              href={settings.privacyNoticeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Onaylı KVKK aydınlatma metnini okuyun ↗
            </a>
          </p>
        ) : (
          <p className="policy-empty" role="note">
            Aydınlatma metni henüz yayınlanmadı. Metin yayınlanana kadar kişisel veri toplayan
            iletişim ve teklif formları gönderime kapalıdır.
          </p>
        )}
      </div>
    </main>
  )
}
