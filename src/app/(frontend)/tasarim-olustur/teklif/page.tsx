import type { Metadata } from 'next'
import { DesignQuote } from '@/components/configurator/DesignQuote'
import { getPublicSiteSettings } from '@/lib/siteSettings'
import { productionSiteUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Tasarımınız için teklif isteyin | RTM Tasarım',
  robots: { index: false, follow: true },
}
export default async function DesignQuotePage() {
  return (
    <DesignQuote settings={await getPublicSiteSettings()} origin={productionSiteUrl()?.origin} />
  )
}
