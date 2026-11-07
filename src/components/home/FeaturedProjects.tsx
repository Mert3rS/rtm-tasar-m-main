import Link from 'next/link'
import { ScrollProjects } from './ScrollProjects'
import type { ProjectCardData } from '@/types/portfolio'
import { TextAnimate } from '@/components/site/TextAnimate'

export function FeaturedProjects({ projects }: { projects: ProjectCardData[] }) {
  return (
    <section
      aria-labelledby="projects-heading"
      className="section-space featured-section"
      id="projeler"
    >
      <div className="site-shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 / SEÇİLİ İŞLER</p>
            <h2 id="projects-heading">
              <TextAnimate animation="slideUp" as="span" by="word" duration={0.52}>
                Yaşayan
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
                  mekânlar.
                </TextAnimate>
              </em>
            </h2>
          </div>
          <TextAnimate animation="fadeIn" as="p" by="line" className="section-intro" delay={0.16}>
            {'Her detayında tasarım,\nişçilik ve özgünlük.'}
          </TextAnimate>
        </div>
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
                rtm.
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
