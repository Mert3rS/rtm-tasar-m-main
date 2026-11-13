import type { HeroPhoto } from '@/lib/homepageHero'
import { SpotlightHero } from './SpotlightHero'
import type { HomepageCopy } from '@/lib/homepageContent'
import './cinematic-hero.css'
import { activeHeroVariant } from '@/lib/heroVariant'

export function HeroSection({
  photos,
  copy,
  original = false,
}: {
  photos: HeroPhoto[]
  copy: HomepageCopy
  original?: boolean
}) {
  return <SpotlightHero photos={photos} copy={copy} variant={original ? 'original' : activeHeroVariant()} />
}
