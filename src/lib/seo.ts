import 'server-only'
import type { Metadata } from 'next'
import { isIP } from 'node:net'

export function productionSiteUrl(): URL | undefined {
  const value = process.env.SITE_URL || process.env.NEXT_PUBLIC_SERVER_URL
  if (!value) return undefined
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase().replace(/\.$/, '')
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return undefined
    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      !host.includes('.') ||
      isIP(host.replace(/^\[|\]$/g, ''))
    )
      return undefined
    return new URL(url.origin)
  } catch {
    return undefined
  }
}

export function portfolioMetadata({
  title,
  description,
  path,
  image,
  noindex = false,
}: {
  title: string
  description: string
  path: string
  image?: { url: string; alt: string }
  noindex?: boolean
}): Metadata {
  const base = productionSiteUrl()
  let imageUrl: string | undefined
  if (image && base) {
    try {
      const url = new URL(image.url, base)
      if (
        url.protocol === 'https:' &&
        !url.username &&
        !url.password &&
        !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      )
        imageUrl = url.href
    } catch {
      /* Missing/invalid share images are simply omitted. */
    }
  }
  const canonical = base ? new URL(path, base).href : undefined
  return {
    title,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'tr_TR',
      siteName: 'RTM Tasarım',
      ...(canonical ? { url: canonical } : {}),
      ...(imageUrl ? { images: [{ url: imageUrl, alt: image?.alt }] } : {}),
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  }
}
