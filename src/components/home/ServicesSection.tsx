import Link from 'next/link'
import { getHomepageServices } from '@/lib/catalogData'
import { TextAnimate } from '@/components/site/TextAnimate'
import { ServiceShowcase } from './ServiceShowcase'

export async function ServicesSection() {
  const services = await getHomepageServices()
  return (
    <section
      className="services-section section-space"
      id="hizmetler"
      aria-labelledby="services-heading"
    >
      <div className="site-shell">
        <div className="workshop-section-heading services-heading">
          <div>
            <p className="eyebrow">03 / ÇALIŞMA ALANLARI</p>
            <h2 id="services-heading">
              <TextAnimate animation="slideUp" as="span" by="word" duration={0.52}>
                Fikirden
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
                  mekâna.
                </TextAnimate>
              </span>
            </h2>
          </div>
          <Link className="workshop-link" href="/hizmetler">
            Tüm hizmetler ↗
          </Link>
        </div>
        {services.length ? (
          <ServiceShowcase services={services} />
        ) : (
          <p className="section-intro">Çalışma alanlarımız yayınlandığında burada yer alacak.</p>
        )}
      </div>
    </section>
  )
}
