import { EditableRegion } from '@/components/site/EditableRegion'
import Link from 'next/link'
import { getFeaturedModels } from '@/lib/catalogData'
import { TextAnimate } from '@/components/site/TextAnimate'
import { ModelCarousel } from './ModelCarousel'
import type { HomepageCopy } from '@/lib/homepageContent'

export async function ModelPreview({ copy }: { copy: HomepageCopy }) {
  const models = await getFeaturedModels()
  if (!models.length) return null
  return (
    <section className="section-space home-model-preview" aria-labelledby="models-preview-heading">
      <div className="site-shell">
        <EditableRegion as="div" className="section-heading" data-rtm-edit="site-settings" data-rtm-field="homepage__modelsHeading" data-rtm-label="Tasarım koleksiyonu başlığı">
          <div>
            <p className="eyebrow">04 / TASARIM KOLEKSİYONU</p>
            <h2 id="models-preview-heading">
              <TextAnimate animation="slideUp" as="span" by="word" duration={0.55}>
                {copy.modelsHeading}
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
                  {copy.modelsEmphasis}
                </TextAnimate>
              </em>
            </h2>
          </div>
          <Link className="text-link section-archive-link" href="/modeller">
            Tüm Modelleri Gör ↗
          </Link>
        </EditableRegion>
        <ModelCarousel models={models} />
      </div>
    </section>
  )
}
