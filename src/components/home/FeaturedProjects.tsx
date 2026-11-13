import { EditableRegion } from '@/components/site/EditableRegion'
import Link from 'next/link'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { ScrollProjects } from './ScrollProjects'
import type { ProjectCardData } from '@/types/portfolio'
import { TextAnimate } from '@/components/site/TextAnimate'
import type { HomepageCopy } from '@/lib/homepageContent'

export function FeaturedProjects({
  projects,
  copy,
}: {
  projects: ProjectCardData[]
  copy: HomepageCopy
}) {
  return (
    <section
      aria-labelledby="projects-heading"
      className="section-space featured-section"
      id="projeler"
    >
      <div className="site-shell">
        <EditableRegion as="div" className="section-heading" data-rtm-edit="site-settings" data-rtm-field="homepage__projectsHeading" data-rtm-label="Seçili işler başlık ve açıklaması">
          <div>
            <p className="eyebrow">02 / SEÇİLİ İŞLER</p>
            <h2 id="projects-heading">
              <TextAnimate animation="slideUp" as="span" by="word" duration={0.52}>
                {copy.projectsHeading}
              </TextAnimate>{' '}
              <em>
                <TextAnimate
                  animation="blurInUp"
                  as="span"
                  by="character"
                  delay={0.1}
                  duration={0.46}
                  stagger={0.026}
                >
                  {copy.projectsEmphasis}
                </TextAnimate>
              </em>
            </h2>
          </div>
          <TextAnimate animation="fadeIn" as="p" by="line" className="section-intro" delay={0.16}>
            {copy.projectsDescription}
          </TextAnimate>
        </EditableRegion>
        {projects.length ? (
          <ScrollProjects projects={projects} />
        ) : (
          <div className="portfolio-empty">
            <div className="empty-plan" aria-hidden="true">
              <span />
              <span />
              <span />
              <i>RTM / PORTFÖY</i>
            </div>
            <div className="portfolio-empty-copy">
              <p className="micro-label accent">Yeni bir sayfa</p>
              <h3>
                Her mekânın
                <br />
                bir hikâyesi var.
              </h3>
              <p>Seçili projelerimizi çok yakında burada paylaşacağız.</p>
              <span className="empty-signature" aria-hidden="true">
                <BrandLogo className="brand-logo brand-logo--signature" decorative variant="mark" />
              </span>
            </div>
          </div>
        )}
        <div className="featured-archive-link">
          <Link className="text-link" href="/projeler">
            Tüm Projeleri Gör<span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
