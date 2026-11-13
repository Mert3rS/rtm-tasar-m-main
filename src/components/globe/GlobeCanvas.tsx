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

const ATLAS_VIEW = {
  altitude: 1.78,
  lat: 18,
  lng: 18,
}

const ATLAS_CAMERA_DURATION = 1500
const ATLAS_PIN_DELAY = 1450
const ATLAS_ROUTE_DURATION = 2200

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

type GlobeCanvasProps = {
  cities: GlobeCity[]
  onSelectCity: (cityId: string) => void
  selectedCityId: string | null
  variant?: 'default' | 'atlas'
}

type AtlasRoute = {
  endLat: number
  endLng: number
  id: string
  startLat: number
  startLng: number
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

export default function GlobeCanvas({
  cities,
  onSelectCity,
  selectedCityId,
  variant = 'default',
}: GlobeCanvasProps) {
  const { theme } = useTheme()
  const homeMotion = useHomeMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const previousAtlasCityRef = useRef<GlobeCity | undefined>(undefined)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [dimensions, setDimensions] = useState({ height: 0, width: 0 })
  const [isReady, setIsReady] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [atlasRoute, setAtlasRoute] = useState<AtlasRoute[]>([])
  const [visibleAtlasCityId, setVisibleAtlasCityId] = useState<string | null>(null)

  const globeMaterial = useMemo(
    () =>
      new MeshPhongMaterial({
        color: variant === 'atlas' ? '#ffffff' : '#a7aaa5',
        emissive: variant === 'atlas' ? '#071525' : '#070909',
        emissiveIntensity: variant === 'atlas' ? 0.1 : 0.38,
        shininess: variant === 'atlas' ? 6 : 4,
        specular: variant === 'atlas' ? '#9eb4c7' : '#111111',
      }),
    [variant],
  )

  useEffect(() => () => globeMaterial.dispose(), [globeMaterial])

  useEffect(() => {
    const tokens = getComputedStyle(document.documentElement)
    // three-globe may clear material.color when applying its globe texture.
    // The existing material and texture stay attached across theme changes.
    const earthTint = tokens.getPropertyValue('--earth-tint').trim()
    const earthEmissive = tokens.getPropertyValue('--earth-emissive').trim()
    if (variant === 'atlas') {
      globeMaterial.color?.set('#ffffff')
      globeMaterial.emissive.set('#071525')
    } else {
      if (earthTint) globeMaterial.color?.set(earthTint)
      if (earthEmissive) globeMaterial.emissive.set(earthEmissive)
    }
  }, [globeMaterial, theme, variant])

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
    controls.minDistance = globe.getGlobeRadius() * (variant === 'atlas' ? 1.55 : 2.4)
    controls.maxDistance = globe.getGlobeRadius() * (variant === 'atlas' ? 2.65 : 4.5)
    globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    controls.autoRotate = variant !== 'atlas' && !selectedCityId && !prefersReducedMotion && homeMotion

    const stopAutomaticRotation = () => {
      controls.autoRotate = false
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
    }

    const scheduleAutomaticRotation = () => {
      if (variant === 'atlas' || selectedCityId || prefersReducedMotion || !homeMotion) return

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
  }, [homeMotion, isReady, prefersReducedMotion, selectedCityId, variant])

  useEffect(() => {
    if (!isReady || !globeRef.current) return

    if (variant === 'atlas') {
      const nextCity = cities.find((city) => city.id === selectedCityId)
      if (!nextCity) return

      const previousCity = previousAtlasCityRef.current
      const reduced = prefersReducedMotion || !homeMotion
      previousAtlasCityRef.current = nextCity

      if (!previousCity || previousCity.id === nextCity.id) {
        const stateTimer = window.setTimeout(() => {
          setAtlasRoute([])
          setVisibleAtlasCityId(nextCity.id)
        }, 0)
        globeRef.current.pointOfView(
          {
            altitude: dimensions.width < 520 ? 2.05 : ATLAS_VIEW.altitude,
            lat: nextCity.lat,
            lng: nextCity.lng,
          },
          previousCity || reduced ? 0 : 1100,
        )
        return () => window.clearTimeout(stateTimer)
      }

      if (reduced) {
        const stateTimer = window.setTimeout(() => {
          setAtlasRoute([])
          setVisibleAtlasCityId(nextCity.id)
        }, 0)
        globeRef.current.pointOfView(
          {
            altitude: dimensions.width < 520 ? 2.05 : ATLAS_VIEW.altitude,
            lat: nextCity.lat,
            lng: nextCity.lng,
          },
          0,
        )
        return () => window.clearTimeout(stateTimer)
      }

      const startTimer = window.setTimeout(() => {
        setVisibleAtlasCityId(null)
        setAtlasRoute([
          {
            id: `${previousCity.id}-${nextCity.id}`,
            startLat: previousCity.lat,
            startLng: previousCity.lng,
            endLat: nextCity.lat,
            endLng: nextCity.lng,
          },
        ])
      }, 0)
      globeRef.current.pointOfView(
        {
          altitude: dimensions.width < 520 ? 2.05 : ATLAS_VIEW.altitude,
          lat: nextCity.lat,
          lng: nextCity.lng,
        },
        ATLAS_CAMERA_DURATION,
      )

      const pinTimer = window.setTimeout(() => {
        setVisibleAtlasCityId(nextCity.id)
      }, ATLAS_PIN_DELAY)
      const routeTimer = window.setTimeout(() => {
        setAtlasRoute([])
      }, ATLAS_ROUTE_DURATION)

      return () => {
        window.clearTimeout(startTimer)
        window.clearTimeout(pinTimer)
        window.clearTimeout(routeTimer)
      }
    }

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
  }, [cities, dimensions.width, homeMotion, isReady, prefersReducedMotion, selectedCityId, variant])

  const visibleAtlasCities = useMemo(
    () =>
      variant === 'atlas' && visibleAtlasCityId
        ? cities.filter((city) => city.id === visibleAtlasCityId)
        : [],
    [cities, variant, visibleAtlasCityId],
  )

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

  const atlasMarker = useCallback(
    (point: object) => {
      const city = findCity(point, cities)
      const marker = document.createElement('button')
      marker.type = 'button'
      marker.className = 'atlas-globe-location'

      if (!city) {
        marker.hidden = true
        return marker
      }

      if (city.id === selectedCityId) marker.classList.add('is-active')
      marker.setAttribute('aria-pressed', String(city.id === selectedCityId))
      marker.setAttribute(
        'aria-label',
        `${city.name}, ${city.countryName}: ${city.projectCount} proje`,
      )

      const icon = document.createElement('span')
      icon.className = 'atlas-globe-location-icon'
      icon.setAttribute('aria-hidden', 'true')

      const svg = document.createElementNS(SVG_NAMESPACE, 'svg')
      svg.setAttribute('viewBox', '0 0 32 40')
      svg.setAttribute('focusable', 'false')

      const pin = document.createElementNS(SVG_NAMESPACE, 'path')
      pin.setAttribute(
        'd',
        'M16 1.5C8.3 1.5 2 7.7 2 15.4c0 10.1 12.4 21.8 13 22.3a1.5 1.5 0 0 0 2 0c.6-.5 13-12.2 13-22.3C30 7.7 23.7 1.5 16 1.5Z',
      )
      const center = document.createElementNS(SVG_NAMESPACE, 'circle')
      center.setAttribute('cx', '16')
      center.setAttribute('cy', '15.5')
      center.setAttribute('r', '5')
      svg.append(pin, center)
      icon.append(svg)

      marker.append(icon)

      marker.addEventListener('click', (event) => {
        event.stopPropagation()
        onSelectCity(city.id)
      })

      return marker
    },
    [cities, onSelectCity, selectedCityId],
  )

  return (
    <div
      ref={containerRef}
      aria-label="Projelerin bulunduğu şehirleri gösteren etkileşimli dünya küresi"
      className="globe-canvas w-full cursor-grab active:cursor-grabbing"
      data-atlas-city={variant === 'atlas' ? visibleAtlasCityId || undefined : undefined}
      data-atlas-route={variant === 'atlas' && atlasRoute[0] ? atlasRoute[0].id : undefined}
      role="img"
    >
      {dimensions.width > 0 && dimensions.height > 0 ? (
        <Globe
          ref={globeRef}
          animateIn={!prefersReducedMotion && homeMotion}
          arcAltitudeAutoScale={0.28}
          arcColor={['#ffc08f', '#f07827']}
          arcDashAnimateTime={prefersReducedMotion || !homeMotion ? 0 : 1250}
          arcDashGap={0.08}
          arcDashLength={0.34}
          arcStroke={0.55}
          arcsData={variant === 'atlas' ? atlasRoute : []}
          arcsTransitionDuration={prefersReducedMotion || !homeMotion ? 0 : 260}
          atmosphereAltitude={variant === 'atlas' ? 0.11 : theme === 'dark' ? 0.11 : 0.075}
          atmosphereColor={variant === 'atlas' ? '#8cb9dc' : theme === 'dark' ? '#c39a63' : '#b4aa91'}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="/assets/globe/earth-blue-marble-2048.jpg"
          globeMaterial={globeMaterial}
          height={dimensions.height}
          htmlAltitude={0.025}
          htmlElement={atlasMarker}
          htmlElementsData={visibleAtlasCities}
          htmlLat="lat"
          htmlLng="lng"
          htmlTransitionDuration={prefersReducedMotion || !homeMotion ? 0 : 500}
          onGlobeReady={handleGlobeReady}
          onPointClick={handlePointClick}
          pointAltitude={(point) => (findCity(point, cities)?.id === selectedCityId ? 0.12 : 0.075)}
          pointColor={(point) =>
            findCity(point, cities)?.id === selectedCityId
              ? variant === 'atlas' ? '#f7f8f7' : '#f4d4a7'
              : variant === 'atlas' ? '#8e9494' : '#c47f51'
          }
          pointLabel={pointLabel}
          pointLat="lat"
          pointLng="lng"
          pointRadius={(point) => (findCity(point, cities)?.id === selectedCityId ? 1.1 : 0.85)}
          pointResolution={18}
          pointsData={variant === 'atlas' ? [] : cities}
          pointsTransitionDuration={prefersReducedMotion || !homeMotion ? 0 : 650}
          showAtmosphere
          showGraticules={false}
          width={dimensions.width}
        />
      ) : null}
    </div>
  )
}
