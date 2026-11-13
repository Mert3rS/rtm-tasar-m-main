'use client'

import Image from 'next/image'
import { ImagePlus } from 'lucide-react'
import type { PhotoPlacementPreview } from '@/lib/photoPlacements'

export function PhotoPlacementCards({
  placements,
  onSelect,
}: {
  placements: PhotoPlacementPreview[]
  onSelect: (field: string, label: string) => void
}) {
  return (
    <div className="rtm-photo-placement-grid">
      {placements.map((placement) => (
        <article className="rtm-photo-placement" key={placement.field}>
          <header>
            <span className="rtm-photo-placement-type">
              {placement.panorama
                ? '360° TUR'
                : placement.array
                  ? 'SIRALI ALBÜM'
                  : placement.field === 'seoImage'
                    ? 'BAĞLANTI ÖNİZLEMESİ'
                    : 'TEK GÖRSEL'}
            </span>
            <h3>{placement.label}</h3>
          </header>
          <button
            type="button"
            className={`rtm-photo-placement-preview${placement.panorama ? ' rtm-photo-placement-preview--panorama' : ''}`}
            onClick={() => onSelect(placement.field, placement.label)}
            aria-label={`${placement.label} · fotoğraf seç veya yükle`}
          >
            {placement.images[0] ? (
              <Image
                src={placement.images[0].url}
                alt={placement.images[0].alt}
                fill
                sizes="(max-width: 700px) 85vw, 360px"
                unoptimized
              />
            ) : (
              <>
                <ImagePlus size={30} aria-hidden="true" />
                <span>Fotoğraf seç / yükle</span>
              </>
            )}
          </button>
          {placement.array ? (
            <p className="rtm-photo-placement-count">
              {placement.count} fotoğraf{placement.count > 8 ? ' · ilk 8 önizleme' : ''}
            </p>
          ) : null}
          {placement.images.length > 1 ? (
            <ol
              className="rtm-photo-placement-thumbnails"
              aria-label={`${placement.label} fotoğraf sırası`}
            >
              {placement.images.map((image, index) => (
                <li key={`${image.url}-${index}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(placement.field, placement.label)}
                    aria-label={`${placement.label} · ${index + 1}. fotoğrafın albümünü düzenle`}
                  >
                    <Image src={image.url} alt={image.alt} fill sizes="80px" unoptimized />
                    <span>{index + 1}</span>
                  </button>
                </li>
              ))}
            </ol>
          ) : null}
          <p>{placement.description}</p>
          <details>
            <summary>Nasıl fotoğraf seçmeliyim? Neleri etkiler?</summary>
            <p>
              <strong>Fotoğraf önerisi:</strong> {placement.advice}
            </p>
            <p>
              <strong>Yerleşim ve davranış:</strong> {placement.behavior}
            </p>
            {placement.tab ? (
              <p>
                <strong>Formdaki yeri:</strong> {placement.tab} sekmesi.
              </p>
            ) : null}
          </details>
          <button
            className="rtm-visual-button"
            type="button"
            onClick={() => onSelect(placement.field, placement.label)}
          >
            {placement.array ? 'Albümü aç · ekle / sırala' : 'Fotoğrafı seç / değiştir'}
          </button>
        </article>
      ))}
    </div>
  )
}
