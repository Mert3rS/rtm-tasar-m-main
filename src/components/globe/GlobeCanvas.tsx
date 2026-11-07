'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import { MeshPhongMaterial } from 'three'

import type { GlobeCity } from '@/types/globe'
import { useTheme } from '@/components/theme/ThemeProvider'
import { useHomeMotion } from '@/components/home/HomeMotion'

const INITIAL_VIEW = {
  altitude: 1.95,
  lat: 24,
  lng: 18,
}

type GlobeCanvasProps = {
  cities: GlobeCity[]
  onSelectCity: (cityId: string) => void
  selectedCityId: string | null
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#039;',
        '"': '&quot;',
      })[character] ?? character,
  )
}

function findCity(point: object, cities: GlobeCity[]) {
  const pointId = Reflect.get(point, 'id')
  if (typeof pointId !== 'string') return undefined

  return cities.find((city) => city.id === pointId)
}

export default function GlobeCanvas({ cities, onSelectCity, selectedCityId }: GlobeCanvasProps) {
  const { theme } = useTheme()
  const homeMotion = useHomeMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [dimensions, setDimensions] = useState({ height: 0, width: 0 })
  const [isReady, setIsReady] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const globeMaterial = useMemo(
    () =>
      new MeshPhongMaterial({
        color: '#a7aaa5',
        emissive: '#070909',
        emissiveIntensity: 0.38,
        shininess: 4,
      }),
    [],
  )

  useEffect(() => () => globeMaterial.dispose(), [globeMaterial])

  useEffect(() => {
    const tokens = getComputedStyle(document.documentElement)
    // three-globe may clear material.color when applying its globe texture.
    // The existing material and texture stay attached across theme changes.
    globeMaterial.color?.set(tokens.getPropertyValue('--earth-tint').trim())
    globeMaterial.emissive.set(tokens.getPropertyValue('--earth-emissive').trim())
  }, [globeMaterial, theme])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches)

    updateMotionPreference()
    mediaQuery.addEventListener('change', updateMotionPreference)

    return () => mediaQuery.removeEventListener('change', updateMotionPreference)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect()
      setDimensions({
        height: Math.max(1, Math.round(rect.height)),
        width: Math.max(1, Math.round(rect.width)),
      })
    }

    updateDimensions()
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (!isReady || !globeRef.current) return

    const globe = globeRef.current
    const controls = globe.controls()

    controls.enableDamping = !prefersReducedMotion && homeMotion
    controls.dampingFactor = 0.08
    controls.autoRotateSpeed = 0.34
    controls.enablePan = false
    controls.minDistance = globe.getGlobeRadius() * 2.4
    controls.maxDistance = globe.getGlobeRadius() * 4.5
    globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    controls.autoRotate = !selectedCityId && !prefersReducedMotion && homeMotion

    const stopAutomaticRotation = () => {
      controls.autoRotate = false
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
    }

    const scheduleAutomaticRotation = () => {
      if (selectedCityId || prefersReducedMotion || !homeMotion) return

      restartTimerRef.current = setTimeout(() => {
        controls.autoRotate = true
      }, 2600)
    }

    controls.addEventListener('start', stopAutomaticRotation)
    controls.addEventListener('end', scheduleAutomaticRotation)

    return () => {
      controls.removeEventListener('start', stopAutomaticRotation)
      controls.removeEventListener('end', scheduleAutomaticRotation)
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
    }
  }, [homeMotion, isReady, prefersReducedMotion, selectedCityId])

  useEffect(() => {
    if (!isReady || !globeRef.current) return

    const selectedCity = cities.find((city) => city.id === selectedCityId)

    globeRef.current.pointOfView(
      selectedCity
        ? {
            altitude: 1.55,
            lat: selectedCity.lat,
            lng: selectedCity.lng,
          }
        : INITIAL_VIEW,
      prefersReducedMotion || !homeMotion ? 0 : selectedCity ? 1400 : 1100,
    )
  }, [cities, homeMotion, isReady, prefersReducedMotion, selectedCityId])

  const handleGlobeReady = useCallback(() => {
    setIsReady(true)
  }, [])

  const handlePointClick = useCallback(
    (point: object) => {
      const city = findCity(point, cities)
      if (city) onSelectCity(city.id)
    },
    [cities, onSelectCity],
  )

  const pointLabel = useCallback(
    (point: object) => {
      const city = findCity(point, cities)
      if (!city) return ''

      return `<div class="globe-tooltip"><strong>${escapeHtml(city.name)}</strong><span>${escapeHtml(city.countryName)} · ${city.projectCount} proje</span></div>`
    },
    [cities],
  )

  return (
    <div
      ref={containerRef}
      aria-label="Projelerin bulunduğu şehirleri gösteren etkileşimli dünya küresi"
      className="globe-canvas w-full cursor-grab active:cursor-grabbing"
      role="img"
    >
      {dimensions.width > 0 && dimensions.height > 0 ? (
        <Globe
          ref={globeRef}
          animateIn={!prefersReducedMotion && homeMotion}
          atmosphereAltitude={theme === 'dark' ? 0.11 : 0.075}
          atmosphereColor={theme === 'dark' ? '#c39a63' : '#b4aa91'}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="/assets/globe/earth-blue-marble-2048.jpg"
          globeMaterial={globeMaterial}
          height={dimensions.height}
          onGlobeReady={handleGlobeReady}
          onPointClick={handlePointClick}
          pointAltitude={(point) => (findCity(point, cities)?.id === selectedCityId ? 0.12 : 0.075)}
          pointColor={(point) =>
            findCity(point, cities)?.id === selectedCityId ? '#f4d4a7' : '#c47f51'
          }
          pointLabel={pointLabel}
          pointLat="lat"
          pointLng="lng"
          pointRadius={(point) => (findCity(point, cities)?.id === selectedCityId ? 1.1 : 0.85)}
          pointResolution={18}
          pointsData={cities}
          pointsTransitionDuration={prefersReducedMotion || !homeMotion ? 0 : 650}
          showAtmosphere
          showGraticules={false}
          width={dimensions.width}
        />
      ) : null}
    </div>
  )
}
