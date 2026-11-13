import { DesignStudioTeaser } from '@/components/home/DesignStudioTeaser'
import { FeaturedAtlas } from '@/components/home/FeaturedAtlas'
import { FeaturedProjects } from '@/components/home/FeaturedProjects'
import { HeroSection } from '@/components/home/HeroSection'
import { ServicesSection } from '@/components/home/ServicesSection'
import { SiteFooter } from '@/components/site/SiteFooter'
import { getHomepageData } from '@/lib/getGlobeData'
import { ModelPreview } from '@/components/home/ModelPreview'
import { ClosingSection } from '@/components/home/ClosingSection'
import { InterestCards } from '@/components/personalization/InterestCards'
import { getPublicSiteSettings } from '@/lib/siteSettings'
import { resolveHeroPhotos } from '@/lib/homepageHero'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ hero?: string | string[] }>
}) {
  const [{ cities, projects, heroImages }, settings, query] = await Promise.all([
    getHomepageData(),
    getPublicSiteSettings(),
    searchParams,
  ])
  const copy = settings.homepage
  const featuredPhotos = projects.map((project) => ({
    ...project,
    coverImage:
      heroImages.find((image) => image.id === project.id)?.coverImage || project.coverImage,
  }))

  return (
    <>
      <main id="main-content" className="workshop-home">
        <HeroSection
          photos={resolveHeroPhotos(heroImages, settings.heroImages)}
          copy={copy}
          original={query.hero === 'original'}
        />
        <ClosingSection copy={copy} />
        <FeaturedAtlas cities={cities} projects={featuredPhotos} copy={copy} />
        <FeaturedProjects projects={featuredPhotos} copy={copy} />
        <InterestCards variant="home" />
        <ServicesSection copy={copy} />
        <ModelPreview copy={copy} />
        <DesignStudioTeaser copy={copy} />
      </main>
      <SiteFooter />
    </>
  )
}
