import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { resolveDesignShare } from '@/lib/designShares'
import { encode } from '@/lib/configurator/config'
import { portfolioMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const metadata = portfolioMetadata({
  title: 'Tasarım oluştur | RTM Tasarım Atölyesi',
  description: 'Ölçü, iç düzen ve malzeme seçimlerinizle mobilya ön tasarımınızı inceleyin.',
  path: '/tasarim-olustur',
  image: { url: '/design-share.png', alt: 'RTM Tasarım Atölyesi' },
})
export default async function SharedDesign({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const design = await resolveDesignShare(await getPayload({ config }), key)
  if (!design) notFound()
  redirect(`/tasarim-olustur#c=${encode(design)}`)
}
