import type { CollectionConfig } from 'payload'

import { isAuthenticated } from '../access/isAuthenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Kullanıcı', plural: 'Kullanıcılar' },
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    admin: ({ req: { user } }) => Boolean(user),
    create: async ({ req }) => {
      if (req.user) return true

      const users = await req.payload.find({
        collection: 'users',
        depth: 0,
        limit: 0,
        overrideAccess: true,
      })

      return users.totalDocs === 0
    },
    delete: isAuthenticated,
    read: isAuthenticated,
    update: isAuthenticated,
  },
  fields: [],
}
