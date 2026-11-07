import { fold, fuzzyEqual, lowerTr, normalizeText, stem, stopwords } from './normalize'

/**
 * Base synonym groups: the first item is the concept token used by intents and entity rules.
 * Admins can extend this list from Asistan ayarları → Ek eş anlamlılar.
 */
export const baseSynonymGroups: string[][] = [
  ['gardirop', 'gardırop', 'gardrop', 'gardorap', 'dolap', 'elbise dolabı', 'giysi dolabı', 'wardrobe', 'closet'],
  ['mutfak', 'mutfak dolabı', 'kitchen', 'cabinet'],
  ['vestiyer', 'portmanto', 'antre', 'hol', 'giriş dolabı', 'ayakkabılık', 'portmanteau', 'hallway', 'entryway'],
  ['banyo', 'banyo dolabı', 'lavabo dolabı', 'bathroom'],
  ['tvunitesi', 'tv ünitesi', 'tv', 'televizyon', 'televizyon ünitesi', 'tv sehpası', 'media unit'],
  ['ozelolcu', 'özel ölçü', 'ölçüye özel', 'kişiye özel', 'custom', 'bespoke'],
  ['fiyat', 'ücret', 'kaç para', 'kaça', 'maliyet', 'bütçe', 'fiyatı', 'fiyatlar', 'price', 'prices', 'cost', 'how much', 'pahalı', 'ucuz', 'indirim', 'kampanya', 'discount'],
  ['teklif', 'fiyat almak', 'fiyat teklifi', 'sipariş', 'sipariş vermek', 'quote', 'offer', 'estimate', 'başvuru'],
  ['iletisim', 'iletişim', 'telefon', 'ulaşmak', 'ulaşabilirim', 'adres', 'eposta', 'e posta', 'mail', 'numara', 'numaranız', 'whatsapp', 'contact', 'phone', 'email', 'address', 'reach', 'konum', 'ofis'],
  ['atolye', 'atölye', 'tasarım atölyesi', '3d', 'üç boyutlu', '3 boyutlu', 'tasarla', 'tasarlamak', 'kendim tasarlamak', 'konfigüratör', 'konfigurator', 'tasarım oluştur', 'tasarım aracı', 'configurator', 'design tool', 'tasarim olustur'],
  ['showroom', 'sanal tur', '360', 'sanal gezinti', 'virtual tour', 'tur', 'mağaza', 'sergi'],
  ['proje', 'projeler', 'iş', 'işler', 'referans', 'referanslar', 'uygulama', 'portfolyo', 'portföy', 'project', 'projects', 'portfolio', 'work', 'örnek iş', 'yaptığınız işler'],
  ['model', 'modeller', 'katalog', 'tasarım modeli', 'models', 'catalog', 'ürün', 'ürünler'],
  ['hizmet', 'hizmetler', 'servis', 'service', 'services', 'ne yapıyorsunuz', 'neler yapıyorsunuz'],
  ['hakkimizda', 'hakkınızda', 'firma', 'şirket', 'kimsiniz', 'about', 'company', 'hikaye', 'ekip'],
  ['teslim', 'teslimat', 'süre', 'ne zaman', 'kaç gün', 'kaç hafta', 'montaj süresi', 'üretim süresi', 'delivery', 'how long'],
  ['garanti', 'warranty', 'guarantee'],
  ['stok', 'stokta', 'hazır', 'stock', 'in stock'],
  ['randevu', 'çalışma saatleri', 'açık mısınız', 'kaçta', 'mesai', 'saat kaç', 'opening hours', 'appointment'],
  ['cerez', 'çerez', 'çerezler', 'cookie', 'cookies', 'kvkk', 'gizlilik', 'kişisel veri', 'aydınlatma metni', 'privacy'],
  ['selam', 'merhaba', 'selamlar', 'mrb', 'slm', 'günaydın', 'iyi akşamlar', 'iyi günler', 'hello', 'hi', 'hey'],
  ['tesekkur', 'teşekkür', 'teşekkürler', 'sağol', 'sağolun', 'eyvallah', 'thanks', 'thank you', 'tşk'],
  ['gorusuruz', 'görüşürüz', 'hoşçakal', 'hoşça kalın', 'bye', 'goodbye', 'iyi çalışmalar'],
  ['bot', 'robot', 'yapay zeka', 'insan mısın', 'gerçek kişi', 'sen kimsin', 'kimsin', 'who are you', 'are you a bot', 'chatbot'],
  ['malzeme', 'laminat', 'lake', 'akrilik', 'mdf', 'ahşap', 'kaplama', 'material', 'materials'],
  ['olcu', 'ölçü', 'ölçüler', 'ölçü almak', 'ebat', 'boyut', 'genişlik', 'yükseklik', 'derinlik', 'measure', 'dimensions'],
  ['bakim', 'bakım', 'temizlik', 'temizlemek', 'temizlenir', 'temizleme', 'temizlerim', 'care', 'cleaning'],
  ['bolme', 'bölme', 'bölmeler', 'kolon'],
  ['icduzen', 'iç düzen', 'düzen', 'düzeni', 'raf', 'askı', 'çekmece', 'pantolonluk', 'ayakkabı rafı', 'sepet', 'interior'],
  ['kapak', 'kapaklar', 'renk', 'renkler', 'yüzey', 'cam kapak', 'door', 'color', 'colour'],
  ['kulp', 'kulplar', 'tutamak', 'handle'],
  ['pdf', 'png', 'indir', 'indirmek', 'indiririm', 'indirir', 'indirebilir', 'indirme', 'çıktı', 'download', 'export'],
  ['paylas', 'paylaş', 'paylaşmak', 'bağlantı', 'link', 'share'],
  ['insanolcegi', 'insan ölçeği', 'insan figürü', 'siluet', 'boy'],
  ['mekanrengi', 'mekân rengi', 'mekan rengi', 'duvar rengi', 'zemin rengi', 'duvar', 'zemin'],
  ['cnc', 'üretim çizimi', 'teknik çizim', 'imalat'],
  ['gonder', 'gönder', 'göndermek', 'ilet', 'iletmek', 'submit', 'send'],
  ['nereden', 'başlamalıyım', 'nereden başlamalıyım', 'nasıl başlarım', 'başlamak', 'yardım', 'help', 'start'],
  ['ornek', 'örnek', 'örnekler', 'galeri', 'fotoğraf', 'görsel', 'examples'],
  ['oneri', 'öne çıkan', 'popüler', 'en iyi', 'favori', 'featured'],
  ['yatakodasi', 'yatak odası', 'bedroom'],
  ['salon', 'oturma odası', 'living room'],
  ['icmimari', 'iç mimari', 'iç mimarlık', 'interior design'],
]
/** Phrase → concept and token → concept maps, built for a set of groups. */
export type Phrase = { raw: string[]; stemmed: string[]; concept: string }
export type Vocabulary = {
  phrases: Phrase[]
  tokens: Map<string, string>
  lexicon: Set<string>
}

function surface(word: string) {
  return normalizeText(word)
}

export function buildVocabulary(extraGroups: string[][] = [], extraLexicon: string[] = []): Vocabulary {
  const tokens = new Map<string, string>()
  const pending: [string, string][] = []
  const lexicon = new Set<string>()
  const register = (group: string[], concept: string) => {
    for (const word of group) {
      const text = surface(word)
      if (!text) continue
      if (text.includes(' ')) pending.push([text, concept])
      else {
        lexicon.add(text)
        if (!tokens.has(text)) tokens.set(text, concept)
      }
    }
    lexicon.add(concept)
  }
  for (const group of baseSynonymGroups) register(group, group[0])
  for (const group of extraGroups) {
    const normalized = group.map(surface).filter(Boolean)
    if (normalized.length < 2) continue
    const known = normalized.map((word) => tokens.get(word)).find(Boolean)
    register(normalized, known || normalized[0].replace(/\s+/g, ''))
  }
  for (const word of extraLexicon)
    for (const token of surface(word).split(' ')) if (token && !stopwords.has(token)) lexicon.add(token)
  const phrases = pending
    .map(([text, concept]) => {
      const raw = text.split(' ')
      return { raw, stemmed: raw.map((token) => stem(token, lexicon)), concept }
    })
    .sort((a, b) => b.raw.length - a.raw.length || b.raw.join(' ').length - a.raw.join(' ').length)
  return { phrases, tokens, lexicon }
}

export const baseVocabulary = buildVocabulary()

export type Analysis = {
  /** Original message (trimmed), used only for casing heuristics. */
  raw: string
  /** Folded, normalised message. */
  text: string
  /** Every token stemmed (stopwords kept), for phrase checks such as "bu modelin" → "bu model". */
  stemText: string
  /** Content stems after stopword removal (before concept mapping). */
  stems: string[]
  /** Concept tokens recognised (synonyms + fuzzy). */
  concepts: Set<string>
  /** Stems not recognised as concepts (used for entity matching / search). */
  residual: string[]
  /** Concept token where recognised, otherwise the stem; used for similarity scoring. */
  terms: string[]
}

function sequenceAt(tokens: string[], start: number, phrase: string[]) {
  if (start + phrase.length > tokens.length) return false
  return phrase.every((word, offset) => tokens[start + offset] === word)
}

export function analyze(message: string, vocabulary: Vocabulary = baseVocabulary): Analysis {
  const text = normalizeText(message)
  const raw = text ? text.split(' ') : []
  const stemmed = raw.map((token) => stem(token, vocabulary.lexicon))
  const consumed = new Array<boolean>(raw.length).fill(false)
  const concepts = new Set<string>()
  const terms: string[] = []
  // Multi-word phrases first ("kac para" → fiyat, "ic duzeni" → icduzen); stopwords inside count.
  for (const phrase of vocabulary.phrases) {
    for (let index = 0; index < raw.length; index += 1) {
      if (consumed.slice(index, index + phrase.raw.length).some(Boolean)) continue
      if (!sequenceAt(raw, index, phrase.raw) && !sequenceAt(stemmed, index, phrase.stemmed)) continue
      for (let offset = 0; offset < phrase.raw.length; offset += 1) consumed[index + offset] = true
      concepts.add(phrase.concept)
      terms.push(phrase.concept)
    }
  }
  const stems: string[] = []
  const residual: string[] = []
  raw.forEach((token, index) => {
    if (consumed[index] || stopwords.has(token)) return
    const base = stemmed[index]
    if (stopwords.has(base)) return
    stems.push(base)
    const concept =
      vocabulary.tokens.get(token) || vocabulary.tokens.get(base) || fuzzyConcept(base, vocabulary)
    if (concept) {
      concepts.add(concept)
      terms.push(concept)
    } else {
      residual.push(base)
      terms.push(base)
    }
  })
  return { raw: message.trim(), text, stemText: stemmed.join(' '), stems, concepts, residual, terms }
}

function fuzzyConcept(token: string, vocabulary: Vocabulary) {
  if (token.length < 4) return undefined
  const candidates = [token]
  // "hizmetlerinz" / "modellerinz": typo inside a suffix chain; retry on the part before -ler/-lar.
  const plural = token.match(/^(.{3,}?)l[ae]r/)
  if (plural) candidates.push(plural[1])
  for (const candidate of candidates) {
    const exact = vocabulary.tokens.get(candidate)
    if (exact) return exact
    if (candidate.length < 4) continue
    for (const [word, concept] of vocabulary.tokens) {
      if (Math.abs(word.length - candidate.length) > 2) continue
      if (fuzzyEqual(candidate, word)) return concept
    }
  }
  return undefined
}

export function plainLower(value: string) {
  return fold(lowerTr(value))
}
