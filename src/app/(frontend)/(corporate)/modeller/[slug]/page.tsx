import { notFound } from 'next/navigation'
import { CatalogDetail } from '@/components/catalog/CatalogDetail'
import {
  getModelBySlug,
  getRelatedModels,
  getSelectedProjects,
  getSelectedServices,
} from '@/lib/catalogData'
import { catalogHref } from '@/lib/catalogQuery'
import { portfolioMetadata } from '@/lib/seo'

type Props = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: Props) {
  const item = await getModelBySlug((await params).slug)
  if (!item) notFound()
  return portfolioMetadata({
    title: item.seoTitle || `${item.title} | RTM Tasarım`,
    description: item.seoDescription || item.shortDescription || `${item.title} — Tasarım modeli.`,
    image: item.seoImage || item.cover,
    path: catalogHref('model', item.slug),
  })
}
export default async function ModelPage({ params }: Props) {
  const item = await getModelBySlug((await params).slug)
  if (!item) notFound()
  const [projects, models, services] = await Promise.all([
    getSelectedProjects(item.relatedProjectIds),
    getRelatedModels(item),
    getSelectedServices(item.serviceIds),
  ])
  return <CatalogDetail item={item} projects={projects} models={models} services={services} />
}
