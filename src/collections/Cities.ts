import type { CollectionConfig } from 'payload'

import { isAuthenticated } from '../access/isAuthenticated'

export const Cities: CollectionConfig = {
  slug: 'cities',
  labels: { singular: 'Şehir', plural: 'Şehirler' },
  access: {
    create: isAuthenticated,
    delete: isAuthenticated,
    read: () => true,
    update: isAuthenticated,
  },
  admin: {
    defaultColumns: ['name', 'country', 'latitude', 'longitude', 'updatedAt'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Şehir adı',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'URL adı',
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'country',
      type: 'relationship',
      label: 'Ülke',
      relationTo: 'countries',
      required: true,
    },
    {
      name: 'latitude',
      type: 'number',
      label: 'Enlem',
      max: 90,
      min: -90,
      required: true,
    },
    {
      name: 'longitude',
      type: 'number',
      label: 'Boylam',
      max: 180,
      min: -180,
      required: true,
    },
  ],
}
