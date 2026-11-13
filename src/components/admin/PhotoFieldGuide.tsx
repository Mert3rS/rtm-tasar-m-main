'use client'

import { useConfig, useFormFields } from '@payloadcms/ui'
import { useEffect, useRef, useState } from 'react'
import {
  PHOTO_PLACEMENTS,
  readPhotoPreview,
  readMediaId,
  type PhotoGuideKind,
  type PhotoPreview,
} from '@/lib/photoPlacements'
import { PhotoPlacementCards } from './PhotoPlacementCards'
import { focusPhotoField } from './photoFieldFocus'

export function PhotoFieldGuide({ kind }: { kind: PhotoGuideKind }) {
  const { config } = useConfig()
  const placements = PHOTO_PLACEMENTS[kind]
  const serialized = useFormFields(([fields]) =>
    JSON.stringify(
      placements.map((placement) => ({
        field: placement.field,
        ids: Object.entries(fields)
          .filter(([path]) =>
            placement.array
              ? new RegExp(`^${placement.field}\\.\\d+\\.image$`).test(path)
              : path === placement.field,
          )
          .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
          .map(([, state]) => readMediaId(state.value))
          .filter((value): value is number => value !== undefined),
      })),
    ),
  )
  const [images, setImages] = useState<Record<string, PhotoPreview>>({})
  const [failed, setFailed] = useState(false)
  const disposeFocus = useRef<(() => void) | null>(null)
  useEffect(() => () => disposeFocus.current?.(), [])
  const values: unknown = JSON.parse(serialized)
  const selections: Array<{ field: string; ids: number[] }> = Array.isArray(values)
    ? values.flatMap((value: unknown) => {
        if (
          !value ||
          typeof value !== 'object' ||
          !('field' in value) ||
          typeof value.field !== 'string' ||
          !('ids' in value) ||
          !Array.isArray(value.ids)
        )
          return []
        return [
          {
            field: value.field,
            ids: value.ids.filter((id: unknown): id is number => typeof id === 'number'),
          },
        ]
      })
    : []
  const ids = [...new Set(selections.flatMap((selection) => selection.ids.slice(0, 8)))].join(',')
  useEffect(() => {
    if (!ids) return
    const controller = new AbortController()
    const query = new URLSearchParams({
      'where[id][in]': ids,
      depth: '0',
      limit: '100',
      'select[url]': 'true',
      'select[alt]': 'true',
      'select[filename]': 'true', // Payload needs the filename to build its media URL.
    })
    async function load() {
      try {
        const response = await fetch(`${config.routes.api}/media?${query}`, {
          credentials: 'same-origin',
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Preview unavailable')
        const data: unknown = await response.json()
        if (!data || typeof data !== 'object' || !('docs' in data) || !Array.isArray(data.docs))
          throw new Error('Invalid preview')
        const next: Record<string, PhotoPreview> = {}
        for (const doc of data.docs) {
          const image = readPhotoPreview(doc)
          if (image && doc && typeof doc === 'object' && 'id' in doc && typeof doc.id === 'number')
            next[String(doc.id)] = image
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
  return (
    <details className="rtm-photo-manager" aria-label="Bu kaydın fotoğraf yerleşimi">
      <summary>Fotoğraf yerleşim rehberi · nerede görünür, nasıl seçilir?</summary>
      <h2>Bu fotoğraf sitede nerede görünecek?</h2>
      <p>
        Her kutu ayrı bir görsel alanıdır. Kutuyu seçip aşağıdaki ilgili yükleme alanına geçin.
        Albümde her satıra bir fotoğraf ekleyin; sürükleyerek sıralayın.
      </p>
      <PhotoPlacementCards
        placements={placements.map((placement) => {
          const selected = selections.find((value) => value.field === placement.field)?.ids || []
          return {
            ...placement,
            count: selected.length,
            images: selected.slice(0, 8).flatMap((id) => (images[id] ? [images[id]] : [])),
          }
        })}
        onSelect={(field) => {
          disposeFocus.current?.()
          disposeFocus.current = focusPhotoField(document, kind, field)
        }}
      />
      {failed ? (
        <p role="status">
          Küçük resimler yüklenemedi; seçimlerinizi native fotoğraf alanlarında kontrol
          edebilirsiniz.
        </p>
      ) : null}
      <p className="rtm-hero-photo-tip">
        {kind === 'site-settings'
          ? 'Kaydet ile değişiklik doğrudan uygulanır.'
          : 'Taslak kaydetmek fotoğrafı ziyaretçiye açmaz. Kontrol edip Yayınla ile siteye aktarın.'}{' '}
        Medya alanında yeni yükleme veya mevcut dosya seçimi yapabilirsiniz. Fotoğrafların
        alternatif metinlerini doldurun.
      </p>
    </details>
  )
}
