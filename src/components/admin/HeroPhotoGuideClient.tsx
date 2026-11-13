'use client'

import { useConfig, useFormFields } from '@payloadcms/ui'
import { useEffect, useRef, useState } from 'react'
import { HERO_POSITIONS, type HeroImage } from '@/lib/homepageHero'
import { HeroPhotoMap } from './HeroPhotoMap'
import type { HeroVariant } from '@/lib/heroSequence'
import { readMediaId } from '@/lib/photoPlacements'

export function HeroPhotoGuideClient({ variant }: { variant: HeroVariant }) {
  const { config } = useConfig()
  const ids = useFormFields(([fields]) =>
    HERO_POSITIONS.map(({ key }) => {
      const value: unknown = fields[`heroImages.${key}`]?.value
      return readMediaId(value) ?? null
    }).join(','),
  )
  const [images, setImages] = useState<Record<string, HeroImage>>({})
  const [failed, setFailed] = useState(false)
  const disposeFocus = useRef<(() => void) | null>(null)
  useEffect(() => () => disposeFocus.current?.(), [])
  useEffect(() => {
    const controller = new AbortController()
    const selected = ids.split(',').filter(Boolean)
    if (!selected.length) return
    const query = new URLSearchParams({
      'where[id][in]': selected.join(','),
      limit: '9',
      depth: '0',
      'select[url]': 'true',
      'select[alt]': 'true',
      'select[filename]': 'true', // Payload needs the filename to build its media URL.
    })
    async function load() {
      try {
        const response = await fetch(`${config.routes.api}/media?${query}`, {
          signal: controller.signal,
          credentials: 'same-origin',
        })
        if (!response.ok) throw new Error('Media preview unavailable')
        const data: unknown = await response.json()
        if (!data || typeof data !== 'object' || !('docs' in data) || !Array.isArray(data.docs))
          throw new Error('Invalid media preview')
        const next: Record<string, HeroImage> = {}
        for (const doc of data.docs) {
          if (
            doc &&
            typeof doc === 'object' &&
            'id' in doc &&
            typeof doc.id === 'number' &&
            'url' in doc &&
            typeof doc.url === 'string' &&
            'alt' in doc &&
            typeof doc.alt === 'string'
          )
            next[String(doc.id)] = { url: doc.url, alt: doc.alt }
        }
        setImages(next)
        setFailed(false)
      } catch {
        if (!controller.signal.aborted) setFailed(true)
      }
    }
    void load()
    return () => controller.abort()
  }, [ids, config.routes.api])

  const selected = ids.split(',')
  return (
    <>
      <HeroPhotoMap
        variant={variant}
        photos={HERO_POSITIONS.map(({ key }, index) => ({
          position: key,
          image: images[selected[index]],
          source: selected[index] ? 'selected' : 'empty',
        }))}
        onSelect={(position) => {
          disposeFocus.current?.()
          document.getElementById('field-heroImages')?.scrollIntoView({ block: 'start' })
          const focus = () => {
            const field = document.getElementById(`field-heroImages__${position}`)
            const control = field?.querySelector<HTMLElement>('button,input,[tabindex]')
            if (!field || !control) return false
            field.scrollIntoView({ block: 'center' })
            control.focus({ preventScroll: true })
            return true
          }
          if (focus()) return
          const observer = new MutationObserver(() => {
            if (focus()) observer.disconnect()
          })
          observer.observe(document.body, { childList: true, subtree: true })
          const timeout = window.setTimeout(() => observer.disconnect(), 10000)
          disposeFocus.current = () => {
            observer.disconnect()
            clearTimeout(timeout)
          }
        }}
      />
      {failed ? (
        <p role="status">
          Fotoğraf küçük resimleri yüklenemedi. Seçimleriniz aşağıdaki fotoğraf alanlarında korunur;
          sayfayı yenileyebilirsiniz.
        </p>
      ) : null}
    </>
  )
}
