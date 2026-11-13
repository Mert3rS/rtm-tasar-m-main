import { EditableRegion } from '@/components/site/EditableRegion'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { ArrowIcon } from './ArrowIcon'
import { DesignCTAParticles } from './DesignCTAParticles'
import { TextAnimate } from './TextAnimate'

type DesignCTAProps = {
  className?: string
  description?: string
  eyebrow?: string
  heading: ReactNode
  headingId?: string
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
  typedLine?: string
  variant?: 'default' | 'compact'
}

export function DesignCTA({
  className,
  description = 'Fikrinizi paylaşın; mekânınız için doğru tasarım yönünü birlikte kuralım.',
  eyebrow = 'FİKİRDEN MEKÂNA / RTM TASARIM',
  heading,
  headingId = 'design-cta-heading',
  primaryHref = '/iletisim',
  primaryLabel = 'İletişime geçin',
  secondaryHref = '/projeler',
  secondaryLabel = 'Projeleri keşfet',
  typedLine,
  variant = 'default',
}: DesignCTAProps) {
  return (
    <section
      className={[
        'design-cta-section',
        variant === 'compact' ? 'design-cta-section--compact' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={headingId}
    >
      <div className="site-shell">
        <div className="design-cta">
          <DesignCTAParticles />
          <div className="design-cta-glow" aria-hidden="true" />
          <Link
            aria-hidden="true"
            className="design-cta-card-link"
            href={primaryHref}
            tabIndex={-1}
          />
          <div className="design-cta-content">
            <header className="design-cta-meta">
              <TextAnimate
                animation="fadeIn"
                as="p"
                by="character"
                className="eyebrow"
                duration={0.3}
                stagger={0.014}
              >
                {eyebrow}
              </TextAnimate>
              <BrandLogo className="design-cta-logo" decorative />
            </header>
            <EditableRegion as="div" className="design-cta-main" data-rtm-edit={headingId === 'closing-heading' ? 'site-settings' : undefined} data-rtm-field={headingId === 'closing-heading' ? 'homepage__ctaHeading' : undefined} data-rtm-label="İletişim çağrısı başlık ve açıklaması">
              {typedLine ? (
                <h2 id={headingId}>
                  <TextAnimate animation="slideUp" as="span" by="word" duration={0.56}>
                    {heading}
                  </TextAnimate>
                  <br />
                  <em>
                    <TextAnimate
                      animation="blurInUp"
                      as="span"
                      by="character"
                      className="design-cta-typing"
                      delay={0.12}
                      duration={0.48}
                      stagger={0.025}
                    >
                      {typedLine}
                    </TextAnimate>
                  </em>
                </h2>
              ) : (
                <TextAnimate
                  animation="blurInUp"
                  as="h2"
                  by="word"
                  duration={0.85}
                  id={headingId}
                >
                  {heading}
                </TextAnimate>
              )}
              <div className="design-cta-action">
                <TextAnimate
                  animation="fadeIn"
                  as="p"
                  by="word"
                  delay={0.18}
                  duration={0.72}
                >
                  {description}
                </TextAnimate>
                <div className="design-cta-links">
                  <Link className="design-cta-primary" href={primaryHref}>
                    <span>{primaryLabel}</span>
                    <i aria-hidden="true">
                      <ArrowIcon diagonal />
                    </i>
                  </Link>
                  <Link className="design-cta-secondary" href={secondaryHref}>
                    {secondaryLabel}
                    <ArrowIcon />
                  </Link>
                </div>
              </div>
            </EditableRegion>
            <footer className="design-cta-footer" aria-hidden="true">
              <span>INTERIOR</span>
              <i />
              <span>DESIGN</span>
              <i />
              <span>MODEL</span>
            </footer>
          </div>
        </div>
      </div>
    </section>
  )
}
