/** Locally hosted frames: no third-party requests at runtime. */
export const FRAME_COUNT = 150
export const FRAME_PATH = '/assets/home/cinematic/desktop/frame_'
export const MOBILE_FRAME_COUNT = 100
export const MOBILE_FRAME_PATH = '/assets/home/cinematic/mobile/frame_'
export const SCROLL_HEIGHT_VH = 500
export const SMOOTHING = 0.12

export const HERO_CHAPTERS = [
  { number: '01', title: 'Mekân.', note: 'Yeni bir bakış.', start: 0.23, end: 0.41 },
  { number: '02', title: 'Malzeme.', note: 'Dokunun izinde.', start: 0.45, end: 0.63 },
  { number: '03', title: 'Detay.', note: 'Bütünü değiştiren.', start: 0.67, end: 0.85 },
]

export const HERO_FILM = {
  label: 'Konsept mutfak dönüşümü',
  author: '3B görselleştirme',
  href: '/assets/home/cinematic/kitchen-transformation.mp4',
  alt: 'Boş bir odanın açık gri dolaplar, mermer ada tezgâhı ve pirinç aydınlatmalarla adım adım mutfağa dönüşümü',
}

export type HeroVariant = 'original' | 'assembly'

export const ASSEMBLY_FILM = {
  label: 'Fotoğraf referanslı mutfak kurulumu',
  author: '3B canlandırma',
  href: '/assets/home/kitchen-assembly/kitchen-assembly.mp4',
  alt: 'Boş mutfak alanına gövdelerin, yeşil dolap kapaklarının, siyah tezgâhın, ahşap adanın ve aydınlatmaların sırayla yerleştiği 3B canlandırma',
}

export function heroFramePath(index: number, mobile = false, variant: HeroVariant = 'original') {
  const prefix =
    variant === 'assembly'
      ? `/assets/home/kitchen-assembly/${mobile ? 'mobile' : 'desktop'}/frame_`
      : mobile
        ? MOBILE_FRAME_PATH
        : FRAME_PATH
  return `${prefix}${String(index + 1).padStart(4, '0')}.${variant === 'assembly' ? 'jpg' : 'webp'}`
}
