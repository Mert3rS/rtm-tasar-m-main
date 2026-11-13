import { activeHeroVariant } from '@/lib/heroVariant'
import { HeroPhotoGuideClient } from './HeroPhotoGuideClient'

export function HeroPhotoGuide() {
  return <HeroPhotoGuideClient variant={activeHeroVariant()} />
}
