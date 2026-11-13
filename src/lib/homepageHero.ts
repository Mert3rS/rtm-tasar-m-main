import type { GlobeProject } from '@/types/globe'
import { heroSlots } from './homepageContent'

// Column-major order matches the existing three animated gallery columns.
export const HERO_POSITIONS = [
  {
    key: 'topLeft',
    number: '02',
    label: 'Sol üst',
    description:
      'Kaydırınca açılan kolajın sol üst fotoğrafı. Mekânın genelini veya bir detayını seçin.',
  },
  {
    key: 'middleLeft',
    number: '05',
    label: 'Sol orta',
    description: 'Kolajın sol tarafında, ana fotoğrafın yanında görünür.',
  },
  {
    key: 'bottomLeft',
    number: '07',
    label: 'Sol alt',
    description: 'Kolajın alt sol fotoğrafı. Kenarlarda kırpılabilecek boşluk bırakın.',
  },
  {
    key: 'topCenter',
    number: '03',
    label: 'Orta üst',
    description: 'Ana fotoğrafın üstünde görünür. Merkez fotoğrafıyla uyumlu bir kare seçin.',
  },
  {
    key: 'center',
    number: '01',
    label: 'Merkez · ilk açılış',
    description:
      'Ziyaretçinin ilk gördüğü büyük fotoğraf. Kaydırınca küçülerek kolajın merkezinde kalır; ayrı bir ikinci fotoğraf değildir.',
  },
  {
    key: 'bottomCenter',
    number: '08',
    label: 'Orta alt',
    description: 'Ana fotoğrafın altında görünür. Animasyon sırasında alt kenardan açılır.',
  },
  {
    key: 'topRight',
    number: '04',
    label: 'Sağ üst',
    description: 'Kaydırınca açılan kolajın sağ üst fotoğrafı.',
  },
  {
    key: 'middleRight',
    number: '06',
    label: 'Sağ orta',
    description: 'Kolajın sağ tarafında, ana fotoğrafın yanında görünür.',
  },
  {
    key: 'bottomRight',
    number: '09',
    label: 'Sağ alt',
    description:
      'Kolajın alt sağ fotoğrafı. Farklı bir açı veya malzeme detayıyla bütünü tamamlayabilirsiniz.',
  },
] as const

export type HeroPositionKey = (typeof HERO_POSITIONS)[number]['key']
export type HeroImage = { url: string; alt: string }
export type HeroPhoto = {
  position: HeroPositionKey
  image?: HeroImage
  source: 'selected' | 'project' | 'empty'
}

export function resolveHeroPhotos(
  projects: GlobeProject[],
  selected: Partial<Record<HeroPositionKey, HeroImage | undefined>>,
): HeroPhoto[] {
  const fallback = heroSlots(projects.filter((project) => project.coverImage))
  return HERO_POSITIONS.map(({ key }, index) => {
    const image = selected[key] || fallback[index]?.coverImage
    return {
      position: key,
      image,
      source: selected[key] ? 'selected' : image ? 'project' : 'empty',
    }
  })
}
