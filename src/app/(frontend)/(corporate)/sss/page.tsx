import { PageIntro } from '@/components/site/PageIntro'
import { ProjectDescription } from '@/components/portfolio/ProjectDescription'
import { getPublicPayload } from '@/lib/projectData'
import { portfolioMetadata } from '@/lib/seo'
import Link from 'next/link'

export async function generateMetadata() {
  return portfolioMetadata({
    title: 'Sık Sorulan Sorular | RTM Tasarım',
    description: 'Onaylı sık sorulan sorular ve cevapları.',
    path: '/sss',
  })
}

export default async function FaqPage() {
  const payload = await getPublicPayload()
  const result = await payload.find({
    collection: 'faqs',
    overrideAccess: false,
    draft: false,
    depth: 0,
    limit: 200,
    pagination: false,
    sort: ['displayOrder', '-createdAt', '-id'],
    where: { and: [{ _status: { equals: 'published' } }, { active: { equals: true } }] },
    select: { question: true, answer: true, category: true },
  })
  const groups = new Map<string, typeof result.docs>()
  for (const faq of result.docs) {
    const key = faq.category?.trim() || ''
    groups.set(key, [...(groups.get(key) || []), faq])
  }
  return (
    <main id="main-content" className="faq-page">
      <PageIntro
        number="11"
        eyebrow="SIK SORULANLAR"
        title={
          <>
            Merak edilenler<span className="accent">.</span>
          </>
        }
        description="Ekibimizin onayladığı cevaplar."
      />
      <div className="site-shell">
        {result.docs.length ? (
          [...groups].map(([category, faqs]) => (
            <section key={category || 'genel'} aria-label={category || 'Genel'}>
              {category ? <h2>{category}</h2> : null}
              <ul className="faq-list">
                {faqs.map((faq) => (
                  <li key={faq.id}>
                    <details>
                      <summary>{faq.question}</summary>
                      <ProjectDescription content={faq.answer} />
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ))
        ) : (
          <p className="policy-empty">
            Henüz yayınlanmış bir soru bulunmuyor. Sorunuz için <Link href="/iletisim">iletişim sayfamızı</Link> kullanabilirsiniz.
          </p>
        )}
      </div>
    </main>
  )
}
