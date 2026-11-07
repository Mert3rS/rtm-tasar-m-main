import Image from 'next/image'
import Link from 'next/link'
import type { CatalogCardData } from '@/types/catalog'
import { catalogHref } from '@/lib/catalogQuery'

export function CatalogCard({ item, index = 0 }: { item: CatalogCardData; index?: number }) {
  return (
    <article className="catalog-card" data-reveal>
      <Link href={catalogHref(item.kind, item.slug)}>
        <div className="catalog-card-image">
          {item.cover ? (
            <Image
              alt={item.cover.alt}
              src={item.cover.thumbnailUrl || item.cover.url}
              fill
              sizes="(min-width: 1024px) 45vw, (min-width: 640px) 44vw, 90vw"
              className="object-cover"
            />
          ) : (
            <span className="catalog-image-empty micro-label">Görsel hazırlanıyor</span>
          )}
          <span className="catalog-card-number micro-label">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="catalog-card-arrow" aria-hidden="true">
            ↗
          </span>
        </div>
        <div className="catalog-card-caption">
          <h3>{item.title}</h3>
          <span className="micro-label accent">
            {item.kind === 'model' ? 'Modeli incele' : 'Hizmeti incele'} ↗
          </span>
        </div>
      </Link>
      {item.categories.length ? (
        <p className="catalog-card-categories">
          {item.categories.map(({ name }) => name).join(' / ')}
        </p>
      ) : null}
      {item.shortDescription ? (
        <p className="catalog-card-description">{item.shortDescription}</p>
      ) : null}
    </article>
  )
}
