import { EditableRegion } from '@/components/site/EditableRegion'
import Link from 'next/link'
import { getHomepageServices } from '@/lib/catalogData'
import { TextAnimate } from '@/components/site/TextAnimate'
import { ServiceShowcase } from './ServiceShowcase'
import type { HomepageCopy } from '@/lib/homepageContent'

export async function ServicesSection({ copy }: { copy: HomepageCopy }) {
  const services = await getHomepageServices()
  return (
    <section
      className="services-section section-space"
      id="hizmetler"
      aria-labelledby="services-heading"
    >
      <div className="site-shell">
        <EditableRegion as="div" className="workshop-section-heading services-heading" data-rtm-edit="site-settings" data-rtm-field="homepage__servicesHeading" data-rtm-label="Çalışma alanları başlığı">
          <div>
            <p className="eyebrow">03 / ÇALIŞMA ALANLARI</p>
            <h2 id="services-heading">
              <TextAnimate
                animation="slideUp"
                as="span"
                by="word"
                className="services-heading-lead"
                duration={0.52}
              >
                {copy.servicesHeading}
              </TextAnimate>{' '}
              <span>
                <TextAnimate
                  animation="blurInUp"
                  as="span"
                  by="character"
                  delay={0.1}
                  duration={0.46}
                  stagger={0.026}
                >
                  {copy.servicesEmphasis}
                </TextAnimate>
              </span>
            </h2>
          </div>
          <Link className="workshop-link section-archive-link" href="/hizmetler">
            Tüm hizmetler ↗
          </Link>
        </EditableRegion>
        {services.length ? (
          <ServiceShowcase services={services} />
        ) : (
          <p className="section-intro">Çalışma alanlarımız yayınlandığında burada yer alacak.</p>
        )}
      </div>
    </section>
  )
}
