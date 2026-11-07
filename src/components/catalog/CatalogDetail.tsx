import Image from 'next/image'
import Link from 'next/link'
import type { CatalogCardData, CatalogDetailData } from '@/types/catalog'
import type { ProjectCardData } from '@/types/portfolio'
import { ProjectDescription } from '@/components/portfolio/ProjectDescription'
import { ProjectGallery } from '@/components/portfolio/ProjectGallery'
import { catalogHref } from '@/lib/catalogQuery'
import { CatalogCard } from './CatalogCard'
import { CorporateCTA } from './CorporateCTA'
import { RelatedProjects } from './RelatedProjects'
import { TrackInterest } from '@/components/personalization/TrackInterest'
import { InterestCards } from '@/components/personalization/InterestCards'
import { TextAnimate } from '@/components/site/TextAnimate'

export function CatalogDetail({
  item,
  projects,
  models,
  services = [],
}: {
  item: CatalogDetailData
  projects: ProjectCardData[]
  models: CatalogCardData[]
  services?: CatalogCardData[]
}) {
  const isModel = item.kind === 'model'
  return (
    <main id="main-content" className="corporate-detail-page">
      <TrackInterest
        k={item.kind}
        s={item.slug}
        l={item.title.slice(0, 80)}
        sig={
          isModel
            ? item.categories.slice(0, 4).map(({ slug, name }) => ({ t: 'modelCategory' as const, s: slug, l: name.slice(0, 80) }))
            : []
        }
      />
      <header className="site-shell corporate-heading">
        <Link className="text-link mb-10" href={isModel ? '/modeller' : '/hizmetler'}>
          ← {isModel ? 'Tüm modeller' : 'Tüm hizmetler'}
        </Link>
        <p className="eyebrow">{isModel ? 'Tasarım koleksiyonu' : 'Hizmetlerimiz'}</p>
        <TextAnimate animation="blurInUp" as="h1" by="word" duration={0.62}>
          {item.title}
        </TextAnimate>
        {item.categories.length ? (
          <p className="micro-label accent">
            {item.categories.map(({ name }) => name).join(' / ')}
          </p>
        ) : null}
        {item.shortDescription ? (
          <TextAnimate
            animation="fadeIn"
            as="p"
            by="text"
            className="section-intro mt-6"
            delay={0.14}
            duration={0.68}
          >
            {item.shortDescription}
          </TextAnimate>
        ) : null}
      </header>
      <div className="site-shell corporate-detail-cover">
        {item.cover ? (
          <Image
            alt={item.cover.alt}
            src={item.cover.url}
            width={item.cover.width}
            height={item.cover.height}
            sizes="(min-width: 1440px) 1328px, 94vw"
            loading="eager"
          />
        ) : (
          <div className="corporate-cover-empty">
            <span className="micro-label">Görsel hazırlanıyor</span>
          </div>
        )}
      </div>
      <section
        className="site-shell corporate-detail-copy"
        aria-label={isModel ? 'Model bilgileri' : 'Hizmet bilgileri'}
      >
        <div>
          <p className="eyebrow">{isModel ? 'Tasarım referansı' : 'Yaklaşımımız'}</p>
          {item.modelType ? <p className="corporate-model-type">{item.modelType}</p> : null}
          {isModel ? (
            <p className="section-intro">
              Tasarım modelleri kataloğu. Tamamlanmış uygulamalarımızı Projeler bölümünde
              inceleyebilirsiniz.
            </p>
          ) : null}
          {services.length ? (
            <div className="catalog-service-links">
              <span className="micro-label muted">İlgili hizmetler</span>
              {services.map((service) => (
                <Link
                  className="text-link"
                  key={service.id}
                  href={catalogHref('service', service.slug)}
                >
                  {service.title} ↗
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          {item.description ? (
            <ProjectDescription content={item.description} />
          ) : (
            <p className="section-intro">
              Ayrıntılı bilgi için projenizi bizimle paylaşabilirsiniz.
            </p>
          )}
          <Link href="/teklif-al" className="text-link mt-8">
            {isModel ? 'Bu Model İçin Bilgi Alın' : 'Projeniz İçin Teklif Alın'} ↗
          </Link>
        </div>
      </section>
      <ProjectGallery
        images={item.gallery}
        title={item.title}
        eyebrow={isModel ? 'Model detayları' : 'Hizmet görselleri'}
        heading={isModel ? 'Tasarıma yakından' : 'Detaylara yakından'}
      />
      <RelatedProjects projects={projects} />
      {models.length ? (
        <section
          className="site-shell corporate-related"
          aria-labelledby="corporate-models-heading"
        >
          <p className="eyebrow">Tasarım koleksiyonu</p>
          <h2 id="corporate-models-heading">
            {isModel ? 'Diğer Modeller' : 'İlgili Tasarım Modelleri'}
          </h2>
          <div className="catalog-grid catalog-grid-three">
            {models.map((model, index) => (
              <CatalogCard key={model.id} item={model} index={index} />
            ))}
          </div>
        </section>
      ) : null}
      <InterestCards variant="detail" exclude={{ type: item.kind, slug: item.slug }} />
      <CorporateCTA label={isModel ? 'Bu Model İçin Bilgi Alın' : 'Projeniz İçin Teklif Alın'} />
    </main>
  )
}
