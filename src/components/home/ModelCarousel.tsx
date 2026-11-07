'use client'

import { useEffect, useMemo, useState } from 'react'
import { CatalogCard } from '@/components/catalog/CatalogCard'
import type { CatalogCardData } from '@/types/catalog'
import { useHomeMotion } from './HomeMotion'

const transitionDuration = 620

export function ModelCarousel({ models }: { models: CatalogCardData[] }) {
  const motion = useHomeMotion()
  const [offset, setOffset] = useState(0)
  const [moving, setMoving] = useState(false)
  const orderedModels = useMemo(
    () => [...models.slice(offset), ...models.slice(0, offset)],
    [models, offset],
  )

  useEffect(() => {
    if (!motion || models.length < 2) return
    let transitionTimer = 0
    const interval = window.setInterval(() => {
      setMoving(true)
      transitionTimer = window.setTimeout(() => {
        setOffset((current) => (current + 1) % models.length)
        setMoving(false)
      }, transitionDuration)
    }, 3000)
    return () => {
      window.clearInterval(interval)
      window.clearTimeout(transitionTimer)
    }
  }, [models.length, motion])

  return (
    <div className="home-model-carousel" aria-live="off">
      <div
        className="catalog-grid catalog-grid-three home-model-carousel-track"
        data-moving={moving || undefined}
        key={moving ? `moving-${offset}` : `resting-${offset}`}
      >
        {orderedModels.map((model, index) => (
          <CatalogCard key={model.id} item={model} index={(offset + index) % models.length} />
        ))}
      </div>
    </div>
  )
}
