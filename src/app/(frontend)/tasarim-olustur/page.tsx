import { Configurator } from '@/components/configurator/Configurator'
import { portfolioMetadata, productionSiteUrl } from '@/lib/seo'

export const metadata = portfolioMetadata({
  title: 'Tasarım oluştur | RTM Tasarım Atölyesi',
  description:
    'Ölçü, iç düzen ve malzeme seçimlerinizi üç boyutlu inceleyin. Mobilya ön tasarımınızı hazırlayıp paylaşın.',
  path: '/tasarim-olustur',
  image: { url: '/design-share.png', alt: 'RTM Tasarım Atölyesi' },
})
export const dynamic = 'force-dynamic'
export default function DesignPage() {
  return <Configurator origin={productionSiteUrl()?.origin} />
}
