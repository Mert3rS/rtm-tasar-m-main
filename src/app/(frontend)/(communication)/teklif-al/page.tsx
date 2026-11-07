import { PageIntro } from '@/components/site/PageIntro'
import { getPublicSiteSettings } from '@/lib/siteSettings'
import { getPublicPayload } from '@/lib/projectData'
import { portfolioMetadata } from '@/lib/seo'
import { InquirySection } from '@/components/contact/InquirySection'
import { ContactDetails } from '@/components/contact/ContactDetails'

export async function generateMetadata() {
  const settings = await getPublicSiteSettings()
  return portfolioMetadata({
    title: `Teklif Talebi | ${settings.companyName}`,
    description: 'Mekânınızın ihtiyaçlarını paylaşın, projenizi birlikte değerlendirelim.',
    path: '/teklif-al',
  })
}

export default async function QuotePage() {
  const settings = await getPublicSiteSettings()
  const payload = await getPublicPayload()
  const categories = await payload.find({
    collection: 'project-categories',
    overrideAccess: false,
    depth: 0,
    pagination: false,
    limit: 0,
    sort: ['displayOrder', 'name'],
    select: { name: true },
    where: { active: { equals: true } },
  })
  return (
    <main className="communication-page quote-contact-page" id="main-content">
      <PageIntro
        number="07"
        eyebrow="İLETİŞİME GEÇİN"
        title={
          <>
            Projenizi
            <br />
            konuşalım<span className="accent">.</span>
          </>
        }
        description="Mekânınızın ihtiyaçlarını ve proje fikrinizi paylaşın. İlk görüşme için gerekli bilgileri form üzerinden iletebilirsiniz."
      />
      <div className="site-shell communication-grid quote-contact-grid">
        <aside className="communication-aside quote-contact-aside">
          <span className="micro-label accent">RTM TASARIM / İLETİŞİM</span>
          <h2>
            Önce sizi <em>dinleyelim.</em>
          </h2>
          <p className="section-intro">
            Mekânın konumu, kullanım amacı ve ihtiyaçlarınız ilk değerlendirmemizin başlangıç noktasıdır.
          </p>
          <ContactDetails settings={settings} />
          <ol className="quote-process">
            <li>
              <span>01</span> İhtiyaçlarınızı paylaşın
            </li>
            <li>
              <span>02</span> Projenizi değerlendirelim
            </li>
            <li>
              <span>03</span> Birlikte planlayalım
            </li>
          </ol>
        </aside>
        <InquirySection
          settings={settings}
          type="quote"
          categories={categories.docs.map(({ id, name }) => ({ id, name }))}
        />
      </div>
    </main>
  )
}
