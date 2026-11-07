'use client'

import Link from 'next/link'
import { useState } from 'react'
import { SiteDropdown } from '@/components/site/SiteDropdown'
import type {
  PortfolioFilters as Filters,
  PortfolioOptions,
} from '@/types/portfolio'

export function PortfolioFilters({
  filters,
  options,
}: {
  filters: Filters
  options: PortfolioOptions
}) {
  const [category, setCategory] = useState(filters.category)
  const [country, setCountry] = useState(filters.country)
  const [city, setCity] = useState(filters.city)
  const selectedCountry = options.countries.find((item) => item.slug === country)
  const cityOptions = selectedCountry
    ? options.cities.filter((item) => item.countryId === selectedCountry.id)
    : options.cities

  const handleCountrySelect = (nextCountry: string) => {
    const nextCountryOption = options.countries.find((item) => item.slug === nextCountry)
    const selectedCity = options.cities.find((item) => item.slug === city)

    setCountry(nextCountry)
    if (nextCountryOption && selectedCity?.countryId !== nextCountryOption.id) setCity('')
  }

  const dropdown = (
    label: string,
    name: string,
    value: string,
    items: PortfolioOptions['categories'],
    onValueChange: (nextValue: string) => void,
  ) => {
    const knownValue = items.some((item) => item.slug === value)
    return (
      <div className="filter-field">
        <label className="micro-label" htmlFor={`filter-${name}`}>
          {label}
        </label>
        <SiteDropdown
          id={`filter-${name}`}
          label={label}
          name={name}
          onValueChange={onValueChange}
          options={[
            { label: 'Tümü', value: '' },
            ...(value && !knownValue ? [{ label: 'Seçim bulunamadı', value }] : []),
            ...items.map((item) => ({ label: item.name, value: item.slug })),
          ]}
          value={value}
        />
      </div>
    )
  }

  return (
    <form action="/projeler" aria-label="Proje filtreleri" className="portfolio-filters" method="get">
      {dropdown('Kategori', 'kategori', category, options.categories, setCategory)}
      {dropdown('Ülke', 'ulke', country, options.countries, handleCountrySelect)}
      {dropdown('Şehir', 'sehir', city, cityOptions, setCity)}
      <div className="portfolio-filter-actions">
        <span aria-hidden="true" className="micro-label portfolio-filter-actions__label">İşlem</span>
        <button className="button-primary filter-submit" type="submit">
          Sonuçları göster<span aria-hidden="true">↗</span>
        </button>
        <Link className="filter-reset" href="/projeler">
          Filtreleri sıfırla
        </Link>
      </div>
    </form>
  )
}
