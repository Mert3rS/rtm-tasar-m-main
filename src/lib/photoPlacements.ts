export type PhotoGuideKind =
  | 'projects'
  | 'services'
  | 'design-models'
  | 'showrooms'
  | 'showroom-scenes'
  | 'about-page'
  | 'site-settings'

export type PhotoPlacement = {
  field: string
  label: string
  tab?: string
  description: string
  advice: string
  behavior: string
  array?: boolean
  panorama?: boolean
}

const coverAdvice =
  'Yatay ve net bir fotoğraf seçin; tercihen en az 1920 px genişlik. Kartlarda kenarlar kırpılır, önemli öğeleri merkeze yakın tutun. Fotoğrafta ne göründüğünü anlatan alternatif metin girin.'
const galleryAdvice =
  'Önce genel mekânı, sonra farklı açıları ve yakın detayları ekleyin. Her satır bir fotoğraftır; satırları sürükleyerek sırayı değiştirin. Her görsel için ayrı, anlamlı alternatif metin kullanın.'
const seo: PhotoPlacement = {
  field: 'seoImage',
  label: 'Sosyal paylaşım görseli',
  tab: 'SEO',
  description:
    'Sayfanın bağlantısı mesajlaşma veya sosyal medya uygulamalarında paylaşıldığında kullanılacak önizleme görseli. Sayfa içindeki kapak ya da galeriyi değiştirmez.',
  advice:
    'Yatay, tercihen 1200 × 630 px bir görsel seçin. Ana içeriği ortada tutun; platformlar kenarları farklı kırpabilir.',
  behavior:
    'Boşsa sayfanın kapağı kullanılır. Paylaşım uygulamaları eski önizlemeyi bir süre saklayabilir; kayıt yayınlandıktan sonra güncel bağlantıyla kontrol edin.',
}

export const PHOTO_PLACEMENTS: Record<PhotoGuideKind, PhotoPlacement[]> = {
  projects: [
    {
      field: 'coverImage',
      label: 'Proje kapağı · liste, detay ve ana sayfa',
      description:
        'Proje arşiv kartı ve detay sayfasının büyük üst fotoğrafı. Seçili ilk dört projede ana sayfanın küre kartı ve kaydırmalı Seçili işler bölümü de aynı kapağı kullanır. Hakkımızda ve ilgili proje kartlarında da bu fotoğraf gösterilir.',
      advice: coverAdvice,
      behavior:
        'Kapak değişimi bu projenin bütün kartlarını etkiler. Ana sayfa açılışındaki animasyon karelerini değiştirmez. Site ayarlarında yedek görsel seçilmediyse animasyon posteri de yüklenemediğinde otomatik yedek olabilir.',
    },
    {
      field: 'gallery',
      label: 'Proje detayı · fotoğraf albümü',
      array: true,
      description:
        'Proje detayında açılıp büyütülebilen fotoğraflar. Ana kapak albümün başına otomatik eklenir; aynı fotoğrafı tekrar eklemeniz gerekmez.',
      advice: galleryAdvice,
      behavior:
        'Kapak ve galeri arasındaki aynı fotoğraf tek slayt olarak gösterilir. Galeri sırasını değiştirmek arşiv kapağını değiştirmez.',
    },
    { ...seo, tab: undefined },
  ],
  services: [
    {
      field: 'coverImage',
      label: 'Hizmet kapağı · animasyon, liste ve detay',
      tab: 'Hizmet',
      description:
        'Ana sayfanın dönüşümlü hizmet alanındaki fotoğraf, hizmet listesi ve detayın üst kapağı aynı kaynaktır. Öncelikli hizmetler önce gelir; ana sayfada en fazla dört aktif ve yayınlanmış hizmet vardır.',
      advice: coverAdvice,
      behavior:
        'Bazı hizmetlerde sabit tanıtım videosu fotoğrafın üzerinde oynar; fotoğraf kapak/poster olarak kullanılır. Videoyu durdurunca son kare ekranda kalabilir. Fotoğrafı değiştirmek videoyu değiştirmez.',
    },
    {
      field: 'galleryImages',
      label: 'Hizmet detayı · fotoğraf albümü',
      tab: 'Hizmet',
      array: true,
      description:
        'Hizmet detayının Detaylara yakından albümü. Fotoğrafa dokununca büyütülür; ana sayfa hizmet görselini değiştirmez.',
      advice: galleryAdvice,
      behavior:
        'Satır sırası albüm sırasıdır. Galeriyi boş bırakmak detayda albümü gizler; kapak ayrı kalır.',
    },
    seo,
  ],
  'design-models': [
    {
      field: 'coverImage',
      label: 'Model kapağı · katalog ve ana sayfa karuseli',
      tab: 'Model',
      description:
        'Model katalog kartı, model detayı ve öne çıkarılmışsa ana sayfanın Tasarım koleksiyonu karuselinde görünür. Hizmet detayındaki ilgili model kartı da aynı kapağı kullanır.',
      advice: 'Modelin tamamını ve formunu anlaşılır gösterin. ' + coverAdvice,
      behavior:
        'Ana sayfada en fazla üç yayınlanmış, öne çıkarılmış model bulunur. Bu görsel tamamlanmış proje veya küre kaydı oluşturmaz.',
    },
    {
      field: 'galleryImages',
      label: 'Model detayı · fotoğraf albümü',
      tab: 'Model',
      array: true,
      description:
        'Model detayındaki Tasarıma yakından albümü. Farklı açılar, malzeme ve birleşim detayları burada sıralanır.',
      advice: galleryAdvice,
      behavior:
        'Galeriyi değiştirmek katalog kapağını değiştirmez. Onaylı render veya fotoğrafları kullanın; modelin üretildiğine dair doğrulanmamış bir iddia eklemeyin.',
    },
    seo,
  ],
  showrooms: [
    {
      field: 'coverImage',
      label: 'Showroom kartı · normal kapak fotoğrafı',
      tab: 'Showroom',
      description:
        'Showroom arşivindeki tanıtım kartıdır. Detay sayfasındaki 360° tur bu fotoğrafı kullanmaz; sahnenin panorama alanından gelir.',
      advice: coverAdvice,
      behavior:
        'Tur görüntüsünü değiştirmek için bağlı Showroom sahnelerini açın. Kapak boşsa kartta görselin hazırlandığını belirten boş durum görünür.',
    },
    seo,
  ],
  'showroom-scenes': [
    {
      field: 'panoramaImage',
      label: 'Turun içi · 360° panorama',
      panorama: true,
      description:
        'Sahne açıldığında etrafa bakılan tam 360° görüntü. Önce doğru showroom’u seçin; her mekân/bakış noktası için ayrı sahne oluşturun.',
      advice:
        'Media kullanımını 360° panorama seçin. Gerçek equirectangular JPEG/WebP, tam 2:1 oran ve 1024–8192 px genişlik gerekir; 4096 × 2048 px önerilir. Orijinali kırpmayın; normal fotoğrafı genişleterek panorama yapmayın.',
      behavior:
        'Önce başlangıç yatay/dikey açısını ve görüş açısını ayarlayın, sonra geçiş noktalarını kontrol edin. Hem showroom hem sahne yayınlanmış olmalıdır. En küçük sıradaki geçerli yayınlanmış sahne başlangıçtır.',
    },
    {
      field: 'thumbnailImage',
      label: 'Sahne seçimi · küçük önizleme',
      description:
        'Turun altındaki sahne seçim düğmesinde görünür. Panoramadan ayrı bir normal fotoğraftır.',
      advice:
        'Sahneyi uzaktan tanıtan yatay bir kare seçin; tercihen 640 × 360 px veya daha büyük. Küçük kutuda kırpılacağı için mekânı tanıtan öğeyi ortada tutun.',
      behavior:
        'Boş bırakılırsa sahne düğmesinde 360° yazısı görünür. Panorama dosyası küçük resim yerine otomatik kullanılmaz.',
    },
  ],
  'about-page': [
    {
      field: 'heroImage',
      label: '01 · Hakkımızda giriş fotoğrafı',
      tab: 'Giriş',
      description:
        'Hakkımızda sayfasının başındaki geniş fotoğraf. Ana sayfanın sinematik açılışından bağımsızdır.',
      advice: coverAdvice,
      behavior:
        'Boşsa giriş fotoğrafı gösterilmez. Paylaşım görseli boşsa sosyal paylaşım için de kaynak olur.',
    },
    {
      field: 'storyImage',
      label: '02 · Şirket hikâyesinin yanındaki fotoğraf',
      tab: 'Hikâye ve uzmanlık',
      description:
        'Şirket hikâyesi metninin yanında yer alır. Çalışma ortamı veya anlatımı destekleyen onaylı bir fotoğraf kullanın.',
      advice: coverAdvice,
      behavior:
        'Giriş fotoğrafını veya ekip bölümünü değiştirmez. Boşsa hikâye metni fotoğrafsız kalabilir.',
    },
    {
      field: 'teamImage',
      label: '03 · Ekibin toplu fotoğrafı',
      tab: 'Ekip',
      description:
        'Ekip tanıtımının yanındaki büyük fotoğraf. Alttaki kişisel portrelerden ayrı yönetilir.',
      advice:
        'Kişilerin yüzlerinin kenarlarda kesilmediği net bir toplu kare seçin. Yatay fotoğraf ve anlamlı alternatif metin önerilir.',
      behavior: 'Tek tek üye fotoğraflarını değiştirmek için Ekip üyeleri satırlarını düzenleyin.',
    },
    {
      field: 'teamMembers',
      label: '04 · Ekip üyelerinin portreleri',
      tab: 'Ekip',
      array: true,
      description:
        'Ekip bölümünde her kişinin adının ve görevinin üzerindeki kendi portresi. Her satır bir kişi; o kişinin Portre alanına doğru fotoğrafı seçin.',
      advice:
        'Benzer kadrajlı kare veya dikey portreler kullanın; yüzü merkeze yakın tutun. Fotoğrafı doğru ad ve görevle eşleştirin; satırları istediğiniz sıraya taşıyın.',
      behavior:
        'Portresi olmayan üyede ad ve görev gösterilmeye devam eder. Toplu ekip fotoğrafını değiştirmez.',
    },
    {
      field: 'galleryImages',
      label: '05 · Şirket fotoğraf albümü',
      tab: 'Yaklaşım ve görseller',
      array: true,
      description:
        'Hakkımızda sayfasının altındaki şirket albümü. Proje veya model detay galerisi değildir.',
      advice: galleryAdvice,
      behavior:
        'Seçili projelerin fotoğrafları ayrıca ilgili projenin kapağından gelir. Şirket galerisine eklemek proje kapağını değiştirmez.',
    },
    {
      ...seo,
      behavior:
        'Boşsa Hakkımızda giriş fotoğrafı kullanılır. Sayfa içindeki fotoğrafları değiştirmez; uygulamalar önceki paylaşım önizlemesini saklayabilir.',
    },
  ],
  'site-settings': [
    {
      field: 'logo',
      label: 'Kurumsal logo kaydı',
      tab: 'Şirket ve iletişim',
      description:
        'CMS’de tutulan isteğe bağlı kurumsal logo. Mevcut site başlığı ve footer uygulamanın sabit RTM marka çizimini kullanır.',
      advice: 'Yalnızca onaylı kurumsal dosyayı seçin. Bu alan ana sayfa fotoğraf alanı değildir.',
      behavior:
        'Buraya yükleme yapmak mevcut navigasyon veya footer logosunu değiştirmez. İletişim, teklif ve çerez sayfalarında ayrıca kapak fotoğrafı alanı yoktur.',
    },
  ],
}

export function photoPlacement(kind: string, field: string): PhotoPlacement | undefined {
  if (!Object.prototype.hasOwnProperty.call(PHOTO_PLACEMENTS, kind)) return undefined
  const entry = Object.entries(PHOTO_PLACEMENTS).find(([key]) => key === kind)
  return entry?.[1].find((placement) => placement.field === field.split('__')[0])
}

export type PhotoPreview = { url: string; alt: string }
export function readMediaId(value: unknown): number | undefined {
  const id = typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : value
  return typeof id === 'number' && Number.isSafeInteger(id) && id > 0 ? id : undefined
}
export type PhotoPlacementPreview = PhotoPlacement & { images: PhotoPreview[]; count: number }
export type PhotoDocument = {
  id: string
  target: string
  title: string
  status: string
  placements: PhotoPlacementPreview[]
}
export type PhotoSection = {
  page: string
  title: string
  description: string
  target: string
  documents: PhotoDocument[]
  error?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
export function readPhotoPreview(value: unknown): PhotoPreview | undefined {
  if (!isRecord(value) || typeof value.url !== 'string' || typeof value.alt !== 'string')
    return undefined
  return { url: value.url, alt: value.alt }
}

// Read only known media fields. Rich text, user data and private settings are never serialized.
export function photoDocument(
  kind: PhotoGuideKind,
  doc: unknown,
  title: string,
  target: string,
): PhotoDocument {
  const record = isRecord(doc) ? doc : {}
  return {
    id: target,
    target,
    title,
    status:
      kind === 'site-settings'
        ? 'Kaydet ile doğrudan uygulanır'
        : record.active === false
          ? 'Pasif kayıt · ziyaretçiye gösterilmez'
          : record._status === 'published'
            ? 'Yayınlanmış kayıt · değişiklik için Yayınla'
            : 'Son kayıt: taslak · yayınlanınca sitede görünür',
    placements: PHOTO_PLACEMENTS[kind].map((placement) => {
      const value = record[placement.field]
      const items =
        placement.array && Array.isArray(value)
          ? value.map((row: unknown) => (isRecord(row) ? row.image : undefined))
          : [value]
      const images = items.flatMap((item) => {
        const image = readPhotoPreview(item)
        return image ? [image] : []
      })
      return { ...placement, count: images.length, images: images.slice(0, 8) }
    }),
  }
}
