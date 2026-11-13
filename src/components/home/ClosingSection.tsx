import { DesignCTA } from '@/components/site/DesignCTA'
import type { HomepageCopy } from '@/lib/homepageContent'

export function ClosingSection({ copy }: { copy: HomepageCopy }) {
  return (
    <DesignCTA
      className="design-cta-section--after-hero"
      heading={copy.ctaHeading}
      headingId="closing-heading"
      typedLine={copy.ctaEmphasis}
      description={copy.ctaDescription}
    />
  )
}
