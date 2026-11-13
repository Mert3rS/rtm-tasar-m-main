import { ArrowIcon } from '@/components/site/ArrowIcon'
import Link from 'next/link'
import Image from 'next/image'
import { getAboutPage } from '@/lib/aboutData'
import { TextAnimate } from '@/components/site/TextAnimate'

export async function AboutPreview() {
  const about = await getAboutPage()
  return (
    <section
      aria-labelledby="about-heading"
      className="section-space about-section"
      id="studio"
    >
      <div className="site-shell about-grid">
        <div
          className="about-study"
          data-reveal
          aria-label={about?.heroImage ? undefined : 'RTM Tasarım mimari çizgi çalışması'}
        >
          {about?.heroImage ? (
            <Image
              alt={about.heroImage.alt}
              src={about.heroImage.url}
              fill
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="object-cover"
            />
          ) : (
            <>
              <div className="study-frame" aria-hidden="true">
                <div className="study-door" />
                <div className="study-window" />
                <div className="study-plinth" />
                <span className="study-dimension study-dimension-horizontal" />
                <span className="study-dimension study-dimension-vertical" />
              </div>
            </>
          )}
          <div className="study-caption">
            <span className="micro-label">
              {about?.heroImage ? 'RTM Tasarım' : 'Çizgiden mekâna'}
            </span>
            <span className="micro-label">Stüdyo</span>
          </div>
        </div>
        <div className="about-copy">
          <p className="eyebrow">03 / Stüdyo</p>
          <TextAnimate
            animation="blurInUp"
            as="h2"
            by={about?.heading ? 'word' : 'text'}
            duration={0.62}
            id="about-heading"
          >
            {about?.heading || (
              <>
                RTM <em>Tasarım</em>
              </>
            )}
          </TextAnimate>
          <TextAnimate animation="fadeIn" as="p" by="text" className="about-statement" delay={0.16}>
            {about?.subtitle ||
              'Şirketimiz ve çalışma yaklaşımımız hakkında daha fazla bilgi edinin.'}
          </TextAnimate>
          <div className="about-rule" />
          <Link className="text-link" href="/hakkimizda">
            Bizi yakından tanıyın ↗
          </Link>
          <Link className="text-link mt-8" href="/iletisim">
            Projenizi Konuşalım
            <ArrowIcon diagonal />
          </Link>
        </div>
      </div>
    </section>
  )
}
