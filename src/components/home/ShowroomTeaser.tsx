import Image from 'next/image'
import Link from 'next/link'
import { getFeaturedShowroom, showroomHref } from '@/lib/showroomData'
import { ArrowIcon } from '@/components/site/ArrowIcon'
import { TextAnimate } from '@/components/site/TextAnimate'

export async function ShowroomTeaser() {
  const showroom = await getFeaturedShowroom()
  return (
    <section aria-labelledby="showroom-teaser-heading" className="showroom-teaser section-space">
      <div className={`site-shell showroom-teaser-grid ${showroom?.cover ? 'has-preview' : ''}`}>
        <div className="showroom-teaser-copy">
          <p className="eyebrow">Yeni bir bakış / Dijital showroom</p>
          <h2 id="showroom-teaser-heading">
            <TextAnimate animation="slideUp" as="span" by="word" duration={0.56}>
              Ekranın ötesine
            </TextAnimate>
            <br />
            <em>
              <TextAnimate
                animation="blurInUp"
                as="span"
                by="character"
                delay={0.12}
                duration={0.48}
                stagger={0.025}
              >
                adım atın.
              </TextAnimate>
            </em>
          </h2>
          <TextAnimate animation="fadeIn" as="p" by="text" className="section-intro" delay={0.18}>
            Dijital showroom deneyimimizle tasarımları yakından inceleyin.
          </TextAnimate>
          <Link className="button-primary" href="/showroom">
            {"Dijital Showroom'a Git"}
            <ArrowIcon diagonal />
          </Link>
        </div>
        {showroom?.cover ? (
          <Link
            aria-label={`${showroom.title} showroom'unu keşfedin`}
            className="showroom-teaser-image relative"
            href={showroomHref(showroom.slug)}
          >
            <Image
              alt={showroom.cover.alt}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 40vw, 90vw"
              src={showroom.cover.thumbnailUrl || showroom.cover.url}
            />
            <span className="showroom-cover-label">
              <span>360°</span>
              {showroom.title} ↗
            </span>
          </Link>
        ) : (
          <div aria-hidden="true" className="showroom-teaser-emblem">
            360<span>°</span>
            <i />
          </div>
        )}
      </div>
    </section>
  )
}
