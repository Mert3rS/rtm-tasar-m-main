'use client'

import { Floating3DParticles } from './Floating3DParticles'

export function DesignCTAParticles() {
  return (
    <Floating3DParticles
      className="design-cta-particles"
      color="var(--cta-particle)"
      depth={0.68}
      drift={0.28}
      opacity={0.22}
      quantity={520}
      size={3.8}
    />
  )
}
