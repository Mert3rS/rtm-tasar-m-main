import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowIcon } from './ArrowIcon'
import { DesignCTAParticles } from './DesignCTAParticles'
import { TextAnimate } from './TextAnimate'
import { TypingAnimation } from './TypingAnimation'

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
  primaryHref = '/teklif-al',
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
              <span aria-hidden="true">RTM / 01</span>
            </header>
            <div className="design-cta-main">
              {typedLine ? (
                <h2 id={headingId}>
                  <TextAnimate animation="blurInUp" as="span" by="text" duration={0.85}>
                    {heading}
                  </TextAnimate>
                  <br />
                  <em>
                    <TypingAnimation
                      className="design-cta-typing"
                      delay={240}
                      typeSpeed={62}
                    >
                      {typedLine}
                    </TypingAnimation>
                  </em>
                </h2>
              ) : (
                <TextAnimate
                  animation="blurInUp"
                  as="h2"
                  by="text"
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
                  by="text"
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
            </div>
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
