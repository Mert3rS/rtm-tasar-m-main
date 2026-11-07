'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { GlobeCity } from '@/types/globe'
import { CityProjectPanel } from './CityProjectPanel'
import { GlobeErrorBoundary } from './GlobeErrorBoundary'

const GlobeCanvas = dynamic(() => import('./GlobeCanvas'), {
  loading: () => <GlobeLoadingState />,
  ssr: false,
})

function GlobeLoadingState() {
  return (
    <div className="globe-placeholder" role="status">
      <span className="loading-orbit" aria-hidden="true" />
      <span className="micro-label">Dünya hazırlanıyor</span>
    </div>
  )
}

function GlobeUnavailableState() {
  return (
    <div className="globe-placeholder globe-unavailable">
      <span className="loading-orbit" aria-hidden="true" />
      <p>3B görünüm bu cihazda kullanılamıyor.</p>
      <p className="muted text-sm">Şehirleri aşağıdaki listeden keşfedebilirsiniz.</p>
    </div>
  )
}

export function GlobeExperience({ cities }: { cities: GlobeCity[] }) {
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)
  const [webGlStatus, setWebGlStatus] = useState<'checking' | 'available' | 'unavailable'>(
    'checking',
  )
  const cityListRef = useRef<HTMLDivElement>(null)
  const selectedCity = cities.find((city) => city.id === selectedCityId) ?? null

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
        setWebGlStatus(context ? 'available' : 'unavailable')
        context?.getExtension('WEBGL_lose_context')?.loseContext()
      } catch {
        setWebGlStatus('unavailable')
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const selectCity = useCallback((id: string) => setSelectedCityId(id), [])
  function closePanel() {
    cityListRef.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')?.focus()
    setSelectedCityId(null)
  }
  const countryNames = Array.from(new Set(cities.map((city) => city.countryName)))

  return (
    <div className="globe-experience" aria-label="Etkileşimli proje coğrafyası">
      <div className="globe-stage">
        <div className="globe-annotation">
          <span className="status-dot" />
          <span>Farklı şehirler. Aynı tasarım anlayışı.</span>
        </div>
        <div aria-hidden="true" className="globe-orbit globe-orbit-one" />
        <div aria-hidden="true" className="globe-orbit globe-orbit-two" />
        {webGlStatus === 'checking' ? (
          <GlobeLoadingState />
        ) : webGlStatus === 'unavailable' ? (
          <GlobeUnavailableState />
        ) : (
          <GlobeErrorBoundary fallback={<GlobeUnavailableState />}>
            <GlobeCanvas
              cities={cities}
              onSelectCity={selectCity}
              selectedCityId={selectedCityId}
            />
          </GlobeErrorBoundary>
        )}
        <div className="globe-instructions">
          <span aria-hidden="true">↔</span> Keşfetmek için sürükleyin{' '}
          <span className="instruction-divider">/</span>{' '}
          <span className="zoom-instruction">Yakınlaştırmak için kaydırın</span>
        </div>
      </div>
      {cities.length ? (
        <div className="location-selector" ref={cityListRef}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="micro-label">Proje coğrafyamız</p>
            <span className="muted text-xs" title={countryNames.join(', ')}>
              {countryNames.join(' · ')}
            </span>
          </div>
          <ul aria-label="Proje şehirleri" className="city-list">
            {cities.map((city) => (
              <li key={city.id}>
                <button
                  aria-pressed={selectedCityId === city.id}
                  onClick={() => selectCity(city.id)}
                  type="button"
                >
                  <span className="status-dot" />
                  <span>{city.name}</span>
                  <span className="city-country">{city.countryCode}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="globe-empty">
          <span className="status-dot" />
          Proje coğrafyamız yakında burada.
          <span className="globe-empty-detail">Yeni mekânlara açılan bir bakış.</span>
        </p>
      )}
      <div
        aria-live="polite"
        className="city-panel-slot"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && selectedCity) closePanel()
        }}
      >
        {selectedCity ? (
          <CityProjectPanel city={selectedCity} key={selectedCity.id} onClose={closePanel} />
        ) : null}
      </div>
    </div>
  )
}
