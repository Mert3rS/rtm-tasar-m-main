import type { Metadata } from 'next'

/** Shared circular site/admin identity; versioned URLs refresh cached tab icons. */
export const brandIcons = {
  icon: [
    { url: '/brand/rtm-icon-32.png?v=round', type: 'image/png', sizes: '32x32' },
    { url: '/brand/rtm-icon-192.png?v=round', type: 'image/png', sizes: '192x192' },
    { url: '/brand/rtm-icon.svg?v=round', type: 'image/svg+xml', sizes: 'any' },
  ],
  shortcut: '/favicon.ico?v=round',
  apple: [{ url: '/brand/rtm-apple-icon.png?v=round', type: 'image/png', sizes: '180x180' }],
} satisfies NonNullable<Metadata['icons']>
