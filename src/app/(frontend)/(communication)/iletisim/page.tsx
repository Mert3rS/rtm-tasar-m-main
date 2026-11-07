import { PageIntro } from '@/components/site/PageIntro'
import Link from 'next/link'
import { getPublicSiteSettings } from '@/lib/siteSettings'
import { portfolioMetadata } from '@/lib/seo'
import { ContactDetails } from '@/components/contact/ContactDetails'
import { InquirySection } from '@/components/contact/InquirySection'

export async function generateMetadata() {
  const settings = await getPublicSiteSettings()
  return portfolioMetadata({
    title: `İletişim | ${settings.companyName}`,
    description: 'Projenizi ve fikirlerinizi bizimle paylaşın. Birlikte tasarlayalım.',
    path: '/iletisim',
  })
}

export default async function ContactPage() {
  const settings = await getPublicSiteSettings()
  return (
    <main className="communication-page" id="main-content">
      <PageIntro
        number="06"
        eyebrow="İLETİŞİM"
        title={
          <>
            Birlikte
            <br />
            tasarlayalım<span className="accent">.</span>
          </>
        }
        description="Projenizi ve fikirlerinizi bizimle paylaşın. İlk adımı birlikte atalım."
      />
      <div className="site-shell communication-grid">
        <aside className="communication-aside">
          <span className="micro-label accent">İletişimde kalalım</span>
          <h2>{settings.companyName}</h2>
          {settings.companyDescription ? (
            <p className="section-intro">{settings.companyDescription}</p>
          ) : null}
          <ContactDetails settings={settings} />
          <div className="contact-side-note">
            <p>Yeni bir mekân mı düşünüyorsunuz?</p>
            <Link className="text-link" href="/teklif-al">
              Projenizi Konuşalım ↗
            </Link>
          </div>
        </aside>
        <InquirySection settings={settings} type="contact" />
      </div>
    </main>
  )
}
