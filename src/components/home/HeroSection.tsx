import type { GlobeProject } from '@/types/globe'
import { SpotlightHero } from './SpotlightHero'

export function HeroSection({ projects }: { projects: GlobeProject[] }) {
  return <SpotlightHero projects={projects} />
}
