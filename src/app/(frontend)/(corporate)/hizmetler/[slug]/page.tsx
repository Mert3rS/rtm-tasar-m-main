import { notFound } from 'next/navigation'
import { CatalogDetail } from '@/components/catalog/CatalogDetail'
import { getServiceBySlug, getSelectedProjects, getServiceModels } from '@/lib/catalogData'
import { catalogHref } from '@/lib/catalogQuery'
import { portfolioMetadata } from '@/lib/seo'

type Props = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: Props) {
  const item = await getServiceBySlug((await params).slug)
  if (!item) notFound()
  return portfolioMetadata({
    title: item.seoTitle || `${item.title} | RTM Tasarım`,
    description:
      item.seoDescription || item.shortDescription || `${item.title} — RTM Tasarım hizmetleri.`,
    image: item.seoImage || item.cover,
    path: catalogHref('service', item.slug),
  })
}
export default async function ServicePage({ params }: Props) {
  const item = await getServiceBySlug((await params).slug)
  if (!item) notFound()
  const [projects, models] = await Promise.all([
    getSelectedProjects(item.relatedProjectIds),
    getServiceModels(item),
  ])
  return <CatalogDetail item={item} projects={projects} models={models} />
}
