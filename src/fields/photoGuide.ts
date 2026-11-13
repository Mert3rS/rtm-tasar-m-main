import type { Field } from 'payload'
import type { PhotoGuideKind } from '../lib/photoPlacements'

export const photoGuideField = (kind: PhotoGuideKind): Field => ({
  name: 'photoPlacementGuide',
  type: 'ui',
  admin: {
    components: {
      Field: { path: '/components/admin/PhotoFieldGuide#PhotoFieldGuide', clientProps: { kind } },
    },
  },
})
