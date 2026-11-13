import 'server-only'

import { existsSync } from 'node:fs'
import path from 'node:path'
import type { HeroVariant } from './heroSequence'

export function activeHeroVariant(): HeroVariant {
  return process.env.RTM_HERO_EXPERIMENT === '1' &&
    existsSync(path.join(process.cwd(), 'public/assets/home/kitchen-assembly/ready.json'))
    ? 'assembly'
    : 'original'
}
