import { DesignCTA } from '@/components/site/DesignCTA'
import { getPublicSiteSettings } from '@/lib/siteSettings'

export async function CorporateCTA({
  heading,
  label,
}: {
  heading?: string
  label?: string
}) {
  const { siteCopy } = await getPublicSiteSettings()
  return (
    <DesignCTA
      className="corporate-design-cta"
      description={siteCopy.corporateCtaDescription}
      eyebrow={siteCopy.corporateCtaEyebrow}
      heading={heading || siteCopy.corporateCtaHeading}
      headingId="corporate-cta-heading"
      primaryLabel={label || siteCopy.corporateCtaPrimary}
      secondaryLabel={siteCopy.corporateCtaSecondary}
      variant="compact"
    />
  )
}
