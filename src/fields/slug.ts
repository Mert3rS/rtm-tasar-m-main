import type { TextField } from 'payload'

export const slugField: TextField = {
  name: 'slug',
  type: 'text',
  label: 'URL adı',
  index: true,
  required: true,
  unique: true,
  maxLength: 120,
  admin: {
    description: 'URL adı: küçük Latin harfleri, rakamlar ve aralarda tire (ör. ornek-mutfak).',
  },
  validate: (value) =>
    (typeof value === 'string' &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) &&
      value.length <= 120) ||
    'URL adı küçük Latin harfleri ve rakamlardan oluşmalı; kelimeleri tek tireyle ayırın.',
}
