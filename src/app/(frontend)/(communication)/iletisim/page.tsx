import { PageIntro } from '@/components/site/PageIntro'
import { getPublicSiteSettings } from '@/lib/siteSettings'
import { portfolioMetadata } from '@/lib/seo'
import { ContactDetails } from '@/components/contact/ContactDetails'
import { InquirySection } from '@/components/contact/InquirySection'

export async function generateMetadata() {
  const settings = await getPublicSiteSettings()
  return portfolioMetadata({
    title: `İletişim | ${settings.companyName}`,
    description: settings.siteCopy.contactDescription,
    path: '/iletisim',
  })
}

export default async function ContactPage() {
  const settings = await getPublicSiteSettings()
  return (
    <main className="communication-page" id="main-content">
      <PageIntro
        number="06"
        eyebrow={settings.siteCopy.contactEyebrow}
        title={
          <>
            {settings.siteCopy.contactTitle}
            <br />
            {settings.siteCopy.contactTitleSecond}<span className="accent">.</span>
          </>
        }
        description={settings.siteCopy.contactDescription}
      />
      <div className="site-shell communication-grid">
        <aside className="communication-aside">
          <span className="micro-label contact-aside-kicker">
            Hayaliniz için hemen iletişime geçelim
          </span>
          <h2>{settings.companyName}</h2>
          {settings.companyDescription ? (
            <p className="section-intro">{settings.companyDescription}</p>
          ) : null}
          <ContactDetails settings={settings} />
          <div className="contact-side-note">
            <p>Yeni bir mekân mı düşünüyorsunuz?</p>
          </div>
        </aside>
        <InquirySection settings={settings} type="contact" projectContact />
      </div>
    </main>
  )
}
