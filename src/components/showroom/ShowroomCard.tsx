import Image from 'next/image'
import Link from 'next/link'
import { showroomHref } from '@/lib/showroomData'
import type { ShowroomCardData } from '@/types/showroom'

export function ShowroomCard({ showroom }: { showroom: ShowroomCardData }) {
  return (
    <article className="showroom-card">
      <Link aria-label={`${showroom.title} — Showroom'u Keşfet`} href={showroomHref(showroom.slug)}>
        <div className="showroom-card-image relative">
          {showroom.cover ? (
            <Image
              alt={showroom.cover.alt}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 46vw, 90vw"
              src={showroom.cover.thumbnailUrl || showroom.cover.url}
            />
          ) : (
            <div className="showroom-card-placeholder" aria-hidden="true">
              <span>360°</span>
              <i />
            </div>
          )}
          <span className="showroom-card-badge micro-label">Dijital showroom / 360°</span>
        </div>
        <div className="showroom-card-caption">
          <h2>{showroom.title}</h2>
          <span className="micro-label accent">{"Showroom'u Keşfet ↗"}</span>
        </div>
      </Link>
      <p className="section-intro mt-4">{showroom.shortDescription}</p>
      {showroom.relatedProject ? (
        <p className="micro-label muted mt-5">İlgili proje / {showroom.relatedProject.title}</p>
      ) : null}
    </article>
  )
}
