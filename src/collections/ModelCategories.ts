import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'
import { slugField } from '../fields/slug'

export const ModelCategories: CollectionConfig = {
  slug: 'model-categories',
  labels: { singular: 'Model kategorisi', plural: 'Model kategorileri' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'displayOrder', 'active'],
    description:
      'Tasarım kataloğuna aittir; tamamlanmış projelerin kategorilerinden ayrıdır. Örnek kategori otomatik eklenmez.',
  },
  access: {
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
    read: ({ req }) => (req.user ? true : { active: { equals: true } }),
  },
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 120, label: 'Kategori adı' },
    slugField,
    { name: 'description', type: 'textarea', maxLength: 600, label: 'Açıklama' },
    { name: 'displayOrder', type: 'number', defaultValue: 0, index: true, label: 'Görünüm sırası' },
    { name: 'active', type: 'checkbox', defaultValue: true, index: true, label: 'Aktif' },
  ],
}
