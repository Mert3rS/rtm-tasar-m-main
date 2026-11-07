import 'server-only'
import { cache } from 'react'
import { getPublicPayload, projectImage } from './projectData'
import { catalogImages } from './catalogData'

export const getAboutPage = cache(async () => {
  const payload = await getPublicPayload()
  // Admin-only global: explicitly read the published snapshot and map approved public fields.
  // Elevation is restricted to this global; linked projects are re-queried with public access below the UI boundary.
  const doc = await payload.findGlobal({
    slug: 'about-page',
    overrideAccess: true,
    draft: false,
    depth: 1,
    select: {
      _status: true,
      eyebrow: true,
      heading: true,
      subtitle: true,
      introduction: true,
      heroImage: true,
      storyHeading: true,
      storyContent: true,
      storyImage: true,
      expertiseHeading: true,
      expertiseDescription: true,
      expertiseItems: true,
      teamHeading: true,
      teamDescription: true,
      teamImage: true,
      teamMembers: true,
      processHeading: true,
      processDescription: true,
      processSteps: true,
      galleryImages: true,
      featuredProjects: true,
      seoTitle: true,
      seoDescription: true,
      seoImage: true,
    },
    populate: { projects: { slug: true } },
  })
  if (doc._status !== 'published') return null
  return {
    eyebrow: doc.eyebrow || undefined,
    heading: doc.heading || undefined,
    subtitle: doc.subtitle || undefined,
    introduction: doc.introduction,
    heroImage: projectImage(doc.heroImage),
    storyHeading: doc.storyHeading || undefined,
    storyContent: doc.storyContent,
    storyImage: projectImage(doc.storyImage),
    expertiseHeading: doc.expertiseHeading || undefined,
    expertiseDescription: doc.expertiseDescription || undefined,
    expertiseItems: (doc.expertiseItems || []).map(({ title, description }) => ({
      title,
      description,
    })),
    teamHeading: doc.teamHeading || undefined,
    teamDescription: doc.teamDescription || undefined,
    teamImage: projectImage(doc.teamImage),
    teamMembers: (doc.teamMembers || []).map(({ name, role, image }) => ({
      name,
      role,
      image: projectImage(image),
    })),
    processHeading: doc.processHeading || undefined,
    processDescription: doc.processDescription || undefined,
    processSteps: (doc.processSteps || []).map(({ title, description }) => ({
      title,
      description,
    })),
    gallery: catalogImages(undefined, doc.galleryImages),
    featuredProjectIds: (doc.featuredProjects || []).map((project) =>
      typeof project === 'number' ? project : project.id,
    ),
    seoTitle: doc.seoTitle || undefined,
    seoDescription: doc.seoDescription || undefined,
    seoImage: projectImage(doc.seoImage),
  }
})
