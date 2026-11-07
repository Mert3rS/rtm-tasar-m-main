import { DesignCTA } from '@/components/site/DesignCTA'

export function CorporateCTA({
  heading = 'Hayalinizdeki Mekânı Birlikte Tasarlayalım.',
  label = 'Projeniz İçin Teklif Alın',
}: {
  heading?: string
  label?: string
}) {
  return (
    <DesignCTA
      className="corporate-design-cta"
      eyebrow="BİRLİKTE BAŞLAYALIM / RTM TASARIM"
      heading={heading}
      headingId="corporate-cta-heading"
      primaryLabel={label}
      variant="compact"
    />
  )
}
