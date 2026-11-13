import { PageIntro } from '@/components/site/PageIntro'
import Image from 'next/image'
import { getAboutPage } from '@/lib/aboutData'
import { getSelectedProjects } from '@/lib/catalogData'
import { portfolioMetadata } from '@/lib/seo'
import { ProjectDescription } from '@/components/portfolio/ProjectDescription'
import { ProjectGallery } from '@/components/portfolio/ProjectGallery'
import { CorporateCTA } from '@/components/catalog/CorporateCTA'
import { RelatedProjects } from '@/components/catalog/RelatedProjects'

export async function generateMetadata() {
  const about = await getAboutPage()
  return portfolioMetadata({
    title: about?.seoTitle || 'Hakkımızda | RTM Tasarım',
    description:
      about?.seoDescription ||
      about?.subtitle ||
      'RTM Tasarım’ı, ekibimizi ve çalışma yaklaşımımızı tanıyın.',
    image: about?.seoImage || about?.heroImage,
    path: '/hakkimizda',
  })
}
export default async function AboutPage() {
  const about = await getAboutPage()
  const projects = await getSelectedProjects(about?.featuredProjectIds || [], 6)
  const title = about?.heading || 'Tasarımın Her Detayında Ustalık.'
  return (
    <main className="about-page corporate-detail-page" id="main-content" data-rtm-edit="about-page" data-rtm-label="Hakkımızda görselleri ve metinleri">
      <PageIntro
        number="05"
        eyebrow={about?.eyebrow || 'ATÖLYE / RTM TASARIM'}
        title={title}
        description={about?.subtitle}
      />
      {about?.heroImage ? (
        <div className="site-shell corporate-detail-cover">
          <Image
            alt={about.heroImage.alt}
            src={about.heroImage.url}
            data-rtm-edit="about-page" data-rtm-field="heroImage"
            data-rtm-label="Hakkımızda · Giriş fotoğrafı"
            width={about.heroImage.width}
            height={about.heroImage.height}
            loading="eager"
            sizes="(min-width: 1440px) 1328px, 94vw"
          />
        </div>
      ) : null}
      {about?.introduction ? (
        <section className="site-shell about-introduction" aria-label="Şirket tanıtımı">
          <ProjectDescription content={about.introduction} />
        </section>
      ) : null}
      {about && (about.storyContent || about.storyImage || about.storyHeading) ? (
        <section className="site-shell about-editorial-section" aria-labelledby="story-heading">
          <div className="about-editorial-copy">
            <p className="eyebrow">Hikâyemiz</p>
            <h2 id="story-heading">{about.storyHeading || 'Çizgiden mekâna.'}</h2>
            <ProjectDescription content={about.storyContent} />
          </div>
          {about.storyImage ? (
            <Image
              alt={about.storyImage.alt}
              src={about.storyImage.url}
              data-rtm-edit="about-page" data-rtm-field="storyImage"
              data-rtm-label="Hakkımızda · Şirket hikâyesi fotoğrafı"
              width={about.storyImage.width}
              height={about.storyImage.height}
              sizes="(min-width: 1024px) 45vw, 90vw"
            />
          ) : null}
        </section>
      ) : null}
      {about &&
      (about.expertiseItems.length || about.expertiseDescription || about.expertiseHeading) ? (
        <section className="about-values-section" aria-labelledby="expertise-heading">
          <div className="site-shell">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Uzmanlık</p>
                <h2 id="expertise-heading">
                  {about.expertiseHeading || 'Detayları birlikte düşünmek.'}
                </h2>
              </div>
              {about.expertiseDescription ? (
                <p className="section-intro">{about.expertiseDescription}</p>
              ) : null}
            </div>
            {about.expertiseItems.length ? (
              <div className="about-values-grid">
                {about.expertiseItems.map((item, index) => (
                  <article key={index}>
                    <span className="micro-label accent">{String(index + 1).padStart(2, '0')}</span>
                    <h3>{item.title}</h3>
                    {item.description ? <p>{item.description}</p> : null}
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
      {about &&
      (about.teamHeading ||
        about.teamDescription ||
        about.teamImage ||
        about.teamMembers.length) ? (
        <section className="site-shell about-team-section" aria-labelledby="team-heading">
          <div className="about-editorial-section">
            <div className="about-editorial-copy">
              <p className="eyebrow">Ekibimiz</p>
              <h2 id="team-heading">{about.teamHeading || 'Birlikte üretiyoruz.'}</h2>
              {about.teamDescription ? (
                <p className="section-intro">{about.teamDescription}</p>
              ) : null}
            </div>
            {about.teamImage ? (
              <Image
                alt={about.teamImage.alt}
                src={about.teamImage.url}
                data-rtm-edit="about-page" data-rtm-field="teamImage"
                data-rtm-label="Hakkımızda · Toplu ekip fotoğrafı"
                width={about.teamImage.width}
                height={about.teamImage.height}
                sizes="(min-width: 1024px) 45vw, 90vw"
              />
            ) : null}
          </div>
          {about.teamMembers.length ? (
            <div className="about-team-grid">
              {about.teamMembers.map((member, index) => (
                <article key={index}>
                  {member.image ? (
                    <Image
                      alt={member.image.alt}
                      src={member.image.url}
                      data-rtm-edit="about-page" data-rtm-field="teamMembers"
                      data-rtm-label={`${member.name} · Ekip portreleri`}
                      width={member.image.width}
                      height={member.image.height}
                      sizes="(min-width: 1024px) 25vw, 90vw"
                    />
                  ) : null}
                  <h3>{member.name}</h3>
                  {member.role ? <p className="micro-label muted">{member.role}</p> : null}
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
      {about && (about.processHeading || about.processDescription || about.processSteps.length) ? (
        <section className="site-shell about-process-section" aria-labelledby="process-heading">
          <div>
            <p className="eyebrow">Çalışma yaklaşımımız</p>
            <h2 id="process-heading">{about.processHeading || 'Fikirden son detaya.'}</h2>
            {about.processDescription ? (
              <p className="section-intro">{about.processDescription}</p>
            ) : null}
          </div>
          <ol className="about-process-list">
            {about.processSteps.map((step, index) => (
              <li key={index}>
                <span className="micro-label accent">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{step.title}</h3>
                  {step.description ? <p>{step.description}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {!about ? (
        <section className="site-shell about-content-pending">
          <p className="eyebrow">RTM Tasarım</p>
          <h2>Şirketimizi yakından tanıyın.</h2>
          <p className="section-intro">
            Şirketimiz, ekibimiz ve çalışma yaklaşımımız hakkında bilgiler yakında burada yer
            alacak.
          </p>
        </section>
      ) : null}
      {about?.gallery.length ? (
        <ProjectGallery
          editor={{ target: 'about-page', field: 'galleryImages' }}
          images={about.gallery}
          title={title}
          heading="Stüdyodan detaylar"
          eyebrow="Yakından bakın"
        />
      ) : null}
      <RelatedProjects projects={projects} />
      <CorporateCTA />
    </main>
  )
}
