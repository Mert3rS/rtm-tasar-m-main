import type { CollectionConfig } from 'payload'

import { isAuthenticated } from '../access/isAuthenticated'

export const Countries: CollectionConfig = {
  slug: 'countries',
  labels: { singular: 'Ülke', plural: 'Ülkeler' },
  access: {
    create: isAuthenticated,
    delete: isAuthenticated,
    read: () => true,
    update: isAuthenticated,
  },
  admin: {
    defaultColumns: ['name', 'code', 'slug', 'updatedAt'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Ülke adı',
      required: true,
    },
    {
      name: 'code',
      type: 'text',
      label: 'Ülke kodu',
      admin: {
        description: 'ISO 3166-1 alpha-2 ülke kodu (ör. TR).',
      },
      maxLength: 2,
      minLength: 2,
      required: true,
      unique: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'URL adı',
      index: true,
      required: true,
      unique: true,
    },
  ],
}
