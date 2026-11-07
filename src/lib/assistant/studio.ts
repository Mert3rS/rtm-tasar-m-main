/**
 * Describes the site's own design studio (/tasarim-olustur) as implemented in
 * src/components/configurator. This is product documentation of the tool, not company content.
 */
import { products } from '@/lib/configurator/config'

export type ProductType = (typeof products)[number]

export const productInfo: Record<
  ProductType,
  { label: string; labelEn: string; concepts: string[]; space: string }
> = {
  mutfak: { label: 'Mutfak dolabı', labelEn: 'Kitchen cabinet', concepts: ['mutfak'], space: 'mutfak' },
  gardirop: { label: 'Gardırop', labelEn: 'Wardrobe', concepts: ['gardirop'], space: 'yatak' },
  portmanto: {
    label: 'Portmanto / vestiyer',
    labelEn: 'Hallway unit',
    concepts: ['vestiyer'],
    space: 'antre',
  },
  banyo: { label: 'Banyo dolabı', labelEn: 'Bathroom cabinet', concepts: ['banyo'], space: 'banyo' },
  tv: { label: 'TV ünitesi', labelEn: 'TV unit', concepts: ['tvunitesi'], space: 'salon' },
  ozel: { label: 'Özel ölçü', labelEn: 'Custom size', concepts: ['ozelolcu'], space: 'diger' },
}

export function productFromConcepts(concepts: Set<string>): ProductType | undefined {
  // Most specific first: "mutfak dolabı" is mapped to mutfak before the generic dolap→gardırop.
  for (const product of ['mutfak', 'banyo', 'portmanto', 'tv', 'ozel', 'gardirop'] as const) {
    if (productInfo[product].concepts.some((concept) => concepts.has(concept))) return product
  }
  return undefined
}

/** Guided "where do I start" spaces → studio product type. */
export const spaceProducts: Record<string, ProductType> = {
  mutfak: 'mutfak',
  yatak: 'gardirop',
  antre: 'portmanto',
  banyo: 'banyo',
  salon: 'tv',
  diger: 'ozel',
}

/** A chip that represents choosing a product (design flow or a space in the start flow). */
export function productFromFlow(flow: { id: string; step: string; value?: string } | undefined) {
  if (!flow?.value) return undefined
  if (flow.id === 'design' && flow.step === 'product')
    return (Object.keys(productInfo) as ProductType[]).find((item) => item === flow.value)
  if (flow.id === 'start' && flow.step === 'space') return spaceProducts[flow.value]
  return undefined
}

export function studioHref(product?: ProductType) {
  // The studio reads only #c= share links; product preselection is a URL hint handled client-side.
  return product ? `/tasarim-olustur?urun=${product}` : '/tasarim-olustur'
}

export const studioSteps = [
  'Ürün ve dış ölçüler',
  'Bölmeler',
  'Gözler ve iç düzen',
  'Kapak, malzeme ve renk',
  'Kulp ve donanım',
  'Özet ve gönderim',
]

/** Feature topics: concept → [Turkish answer, English answer]. */
export const studioFeatures: Record<string, [string, string]> = {
  olcu: [
    'İlk adımda genişlik, yükseklik ve derinliği santimetre olarak girersiniz. Sayı alanı ve kaydırıcı birlikte çalışır; ok tuşları 0,5 cm, Shift ile 10 cm değiştirir. Kilitlediğiniz ölçüler sonraki düzenlemelerde korunur.',
    'In the first step you enter width, height and depth in centimetres. Locked dimensions are kept in later edits.',
  ],
  bolme: [
    'Bölmeler adımında dolabı dikey kolonlara ayırırsınız. Sınırları sürükleyerek genişlikleri değiştirebilir, eşit dağıtabilir veya bir bölmeyi kilitleyebilirsiniz.',
    'In the sections step you split the unit into columns, drag their borders or distribute them equally.',
  ],
  icduzen: [
    'Her gözün iç düzenini raf, askı borusu, pantolonluk, ayakkabı rafı, sepet veya boş olarak seçebilirsiniz. İç düzen görünümüyle kapakların arkasını inceleyebilirsiniz.',
    'Each compartment can have shelves, a hanging rail, trouser rack, shoe rack, basket or stay empty.',
  ],
  kapak: [
    'Kapak adımında kapaklı, çekmeceli, açık, cam veya klapa gözler; akrilik, lake, laminat, ahşap kaplama ve MDF boyalı malzemeler, yüzey ve renk seçenekleri bulunur. Renkler ekranda temsilidir.',
    'Fronts can be doors, drawers, open, glass or flap; materials include acrylic, lacquer, laminate, veneer and painted MDF.',
  ],
  malzeme: [
    'Atölyede akrilik, lake, laminat, ahşap kaplama ve MDF boyalı malzemeleri mat, parlak, süper mat veya dokulu yüzeylerle deneyebilirsiniz. Sahnede akrilik/lake parlaklık farkı temsili olarak gösterilir.',
    'You can try acrylic, lacquer, laminate, veneer and painted MDF with matte, gloss or textured finishes.',
  ],
  kulp: [
    'Donanım adımında gola, çubuk, gömme, bas-aç, kenar profil veya kulpsuz seçenekler ile kulp rengi, baza, tezgâh ve LED tercihleri bulunur.',
    'The hardware step offers gola, bar, recessed, push-to-open, edge profile or handle-free options.',
  ],
  pdf: [
    'Tasarımınızı A4 yatay PDF (ön görünüş, kesit, ölçüler ve malzeme listesiyle) veya PNG olarak indirebilirsiniz. Dosyalar tarayıcınızda hazırlanır.',
    'You can download your design as an A4 PDF with views and dimensions, or as a PNG image.',
  ],
  paylas: [
    '“Bağlantıyı kopyala” tasarımınızı adres içinde (#c=…) taşır. Bağlantıyı açan kişi tasarımın bağımsız bir kopyasını görür; ortak düzenleme değildir. Göz etiketlerine kişisel bilgi yazmayın.',
    '“Copy link” stores your design inside the URL. Whoever opens it gets an independent copy.',
  ],
  insanolcegi: [
    'İnsan ölçeği düğmesi 180 cm boyunda sade bir siluet ve ölçü çizgisi gösterir; dolabın oranlarını gerçek boyla karşılaştırmanıza yardımcı olur.',
    'The human scale toggle shows a 180 cm silhouette next to your unit.',
  ],
  mekanrengi: [
    'Mekân düğmesiyle duvar ve zemin rengini, dokulu/düz zemini ve temsili eşyaları değiştirebilirsiniz. Bu tercihler yalnızca görüntü içindir; tasarım verisine eklenmez.',
    'The room button changes wall/floor colours and representative props for preview only.',
  ],
  gonder: [
    'Son adımda tasarımınızı teklif formuyla birlikte ekibimize iletebilirsiniz. Form; aydınlatma metni onaylandığında ve form açık olduğunda çalışır. Kişisel bilgileriniz tasarım bağlantısına yazılmaz.',
    'In the last step you can send your design with the quote form when the form is open.',
  ],
  cnc: [
    'Atölye bir fikir ve iletişim aracıdır; üretim/CNC çizimi veya donanım çakışma analizi değildir. Kesin ölçü ve uygulanabilirlik ekibimizle birlikte netleşir.',
    'The studio is an ideation tool; it is not a production/CNC drawing.',
  ],
}
