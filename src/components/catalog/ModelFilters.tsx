'use client'

import Link from 'next/link'
import { SiteDropdown } from '@/components/site/SiteDropdown'

type Category = {
  id: number
  name: string
  slug: string
}

export function ModelFilters({
  categories,
  category,
  known,
}: {
  categories: Category[]
  category: string
  known: boolean
}) {
  return (
    <form
      action="/modeller"
      aria-label="Model filtreleri"
      className="catalog-filter"
      data-archive-reveal
      method="get"
    >
      <div className="catalog-filter-field">
        <label htmlFor="model-category">Kategori</label>
        <SiteDropdown
          defaultValue={category}
          id="model-category"
          label="Kategori"
          name="kategori"
          options={[
            { label: 'Tüm kategoriler', value: '' },
            ...(category && !known
              ? [{ label: 'Geçersiz / pasif kategori', value: category }]
              : []),
            ...categories.map((item) => ({ label: item.name, value: item.slug })),
          ]}
        />
      </div>
      <button className="button-primary" type="submit">
        Filtrele ↗
      </button>
      {category ? (
        <Link className="text-link" href="/modeller">
          Filtreleri sıfırla
        </Link>
      ) : null}
    </form>
  )
}
