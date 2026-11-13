'use client'

import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'
import { TextAnimate } from '@/components/site/TextAnimate'
import type { ProjectImage } from '@/types/portfolio'
import { EditableRegion } from '@/components/site/EditableRegion'

export function ProjectGallery({
  images,
  title,
  heading,
  eyebrow = 'Mekândan detaylar',
  editor,
}: {
  images: ProjectImage[]
  title: string
  heading?: string
  eyebrow?: string
  editor?: { target: string; field: string }
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const lastTrigger = useRef<HTMLButtonElement | null>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const labelId = useId()
  const active = activeIndex === null ? null : images[activeIndex]
  const isOpen = activeIndex !== null

  useEffect(() => {
    if (!isOpen) return
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = oldOverflow
      lastTrigger.current?.focus({ preventScroll: true })
    }
    // Index changes update the existing modal; only opening/closing changes its lifecycle.
  }, [isOpen])

  function move(offset: number) {
    setActiveIndex((index) =>
      index === null ? null : (index + offset + images.length) % images.length,
    )
  }

  if (!images.length) return null
  return (
    <EditableRegion
      as="section"
      aria-labelledby="gallery-heading"
      className="site-shell project-gallery-section"
      data-rtm-edit={editor?.target}
      data-rtm-field={editor?.field}
      data-rtm-label={`${title} · Fotoğraf albümü`}
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <TextAnimate
            animation="blurInUp"
            as="h2"
            by={heading ? 'word' : 'text'}
            duration={0.58}
            id="gallery-heading"
          >
            {heading || (
              <>
                Projeye <em>yakından</em>
              </>
            )}
          </TextAnimate>
        </div>
        <TextAnimate animation="fadeIn" as="p" by="text" className="section-intro" delay={0.12}>
          Görselleri büyüterek inceleyin.
        </TextAnimate>
      </div>
      <div className="detail-gallery-grid">
        {images.map((image, index) => (
          <button
            aria-haspopup="dialog"
            aria-label={`${index + 1}. görseli büyüt: ${image.alt}`}
            className="gallery-image-button"
            key={`${image.url}-${index}`}
            onClick={(event) => {
              lastTrigger.current = event.currentTarget
              setActiveIndex(index)
            }}
            type="button"
          >
            <Image
              alt={image.alt}
              className="gallery-photo"
              width={image.width}
              height={image.height}
              sizes="(min-width: 1024px) 60vw, (min-width: 640px) 45vw, 90vw"
              src={image.url}
            />
            <span aria-hidden="true" className="gallery-enlarge">
              ↗
            </span>
          </button>
        ))}
      </div>
      {active ? (
        <dialog
          aria-labelledby={labelId}
          className="image-lightbox"
          onCancel={(event) => {
            event.preventDefault()
            setActiveIndex(null)
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setActiveIndex(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault()
              move(1)
            }
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              move(-1)
            }
          }}
          onTouchStart={(event) => {
            const touch = event.touches[0]
            touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null
          }}
          onTouchEnd={(event) => {
            const touch = event.changedTouches[0]
            const start = touchStart.current
            if (
              touch &&
              start &&
              Math.abs(touch.clientX - start.x) > 60 &&
              Math.abs(touch.clientX - start.x) > Math.abs(touch.clientY - start.y)
            )
              move(touch.clientX < start.x ? 1 : -1)
            touchStart.current = null
          }}
          ref={dialogRef}
        >
          <div className="lightbox-toolbar">
            <span id={labelId}>{title} / Fotoğraf galerisi</span>
            <button
              aria-label="Galeriyi kapat"
              autoFocus
              className="icon-button"
              onClick={() => setActiveIndex(null)}
              type="button"
            >
              ×
            </button>
          </div>
          <div className="lightbox-image-wrap">
            <Image alt={active.alt} className="object-contain" fill sizes="95vw" src={active.url} />
          </div>
          <div className="lightbox-footer">
            <button
              aria-label="Önceki görsel"
              className="icon-button"
              disabled={images.length < 2}
              onClick={() => move(-1)}
              type="button"
            >
              ←
            </button>
            <div aria-live="polite">
              <p>{active.alt}</p>
              <span>
                {(activeIndex ?? 0) + 1} / {images.length}
              </span>
            </div>
            <button
              aria-label="Sonraki görsel"
              className="icon-button"
              disabled={images.length < 2}
              onClick={() => move(1)}
              type="button"
            >
              →
            </button>
          </div>
        </dialog>
      ) : null}
    </EditableRegion>
  )
}
