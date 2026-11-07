import type { CollectionConfig } from 'payload'

// Infrastructure only: atomic counters in the existing PostgreSQL adapter, no raw IP/email stored.
export const FormRateLimits: CollectionConfig = {
  slug: 'form-rate-limits',
  admin: { hidden: true },
  access: { create: () => false, read: () => false, update: () => false, delete: () => false },
  timestamps: false,
  fields: [
    { name: 'bucket', type: 'text', required: true, unique: true },
    { name: 'count', type: 'number', required: true, defaultValue: 0 },
    { name: 'expiresAt', type: 'date', required: true, index: true },
  ],
}
