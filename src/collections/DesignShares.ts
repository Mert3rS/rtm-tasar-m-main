import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'
import { configSchema } from '../lib/configurator/config'

export const DesignShares: CollectionConfig = {
  slug: 'design-shares',
  labels: { singular: 'Tasarım bağlantısı', plural: 'Tasarım bağlantıları' },
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: {
    useAsTitle: 'shareKey',
    description:
      'Kişisel bilgi eklemeyin. Süresi dolan bağlantılar çözümlenmez; kayıtlar yönetici tarafından silinebilir.',
  },
  fields: [
    {
      name: 'shareKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Bağlantı anahtarı',
    },
    {
      name: 'design',
      type: 'json',
      label: 'Tasarım verisi',
      required: true,
      validate: (value) => configSchema.safeParse(value).success || 'Geçersiz v2 tasarım.',
    },
    { name: 'expiresAt', type: 'date', required: true, index: true, label: 'Geçerlilik sonu' },
  ],
}
