import Link from 'next/link'
import { getFeaturedModels } from '@/lib/catalogData'
import { TextAnimate } from '@/components/site/TextAnimate'
import { ModelCarousel } from './ModelCarousel'

export async function ModelPreview() {
  const models = await getFeaturedModels()
  if (!models.length) return null
  return (
    <section className="section-space home-model-preview" aria-labelledby="models-preview-heading">
      <div className="site-shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow">04 / TASARIM KOLEKSİYONU</p>
            <h2 id="models-preview-heading">
              <TextAnimate animation="slideUp" as="span" by="word" duration={0.55}>
                Form. Doku.
              </TextAnimate>{' '}
              <em>
                <TextAnimate
                  animation="blurInUp"
                  as="span"
                  by="character"
                  delay={0.14}
                  duration={0.48}
                  stagger={0.024}
                >
                  Karakter.
                </TextAnimate>
              </em>
            </h2>
          </div>
          <Link className="text-link" href="/modeller">
            Tüm Modelleri Gör ↗
          </Link>
        </div>
        <ModelCarousel models={models} />
      </div>
    </section>
  )
}
