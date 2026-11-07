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

export default async function HomePage() {
  const { cities, projects, heroImages } = await getHomepageData()
  const featuredPhotos = projects.map((project) => ({
    ...project,
    coverImage:
      heroImages.find((image) => image.id === project.id)?.coverImage || project.coverImage,
  }))

  return (
    <>
      <main id="main-content" className="workshop-home">
        <HeroSection projects={heroImages} />
        <FeaturedAtlas cities={cities} projects={featuredPhotos} />
        <FeaturedProjects projects={featuredPhotos} />
        <InterestCards variant="home" />
        <ServicesSection />
        <ModelPreview />
        <DesignStudioTeaser />
        <ClosingSection />
      </main>
      <SiteFooter />
    </>
  )
}
