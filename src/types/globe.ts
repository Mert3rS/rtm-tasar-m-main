export type GlobeProject = {
  id: string
  title: string
  slug: string
  description?: string
  coverImage?: {
    url: string
    alt: string
  }
}

export type GlobeCity = {
  id: string
  name: string
  slug?: string
  countryName: string
  countrySlug?: string
  countryCode: string
  lat: number
  lng: number
  projectCount: number
  projects: GlobeProject[]
}
