import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'
import { slugField } from '../fields/slug'

export const ProjectCategories: CollectionConfig = {
  slug: 'project-categories',
  labels: { singular: 'Proje kategorisi', plural: 'Proje kategorileri' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug', 'displayOrder', 'active'] },
  access: {
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
    read: ({ req }) => (req.user ? true : { active: { equals: true } }),
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Kategori adı' },
    slugField,
    { name: 'description', type: 'textarea', label: 'Açıklama' },
    { name: 'displayOrder', type: 'number', defaultValue: 0, index: true, label: 'Görünüm sırası' },
    { name: 'active', type: 'checkbox', defaultValue: true, index: true, label: 'Aktif' },
  ],
}
