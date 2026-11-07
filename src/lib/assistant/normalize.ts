/**
 * Turkish-aware text normalisation for deterministic matching. No external NLP dependency.
 * - Locale lower-casing (İ→i, I→ı) followed by ASCII folding (ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u)
 * - Apostrophe suffixes are dropped ("Berlin'de" → "berlin")
 * - A small, dictionary-assisted suffix stripper with consonant softening
 */

const foldMap: Record<string, string> = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
  â: 'a',
  î: 'i',
  û: 'u',
}

export function lowerTr(value: string) {
  return value.normalize('NFC').toLocaleLowerCase('tr-TR')
}

export function fold(value: string) {
  return value
    .replace(/[çğıöşüâîû]/g, (char) => foldMap[char] || char)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/** Lower-cased, punctuation/emoji free, folded text with single spaces. */
export function normalizeText(value: string) {
  const lowered = lowerTr(value)
    // Keep "3d" / "360" etc.; drop the case suffix after apostrophes: istanbul'daki → istanbul
    .replace(/(\p{L})['’`´](\p{L}+)/gu, '$1')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  return fold(lowered).replace(/\s+/g, ' ').trim()
}

export function tokenize(value: string) {
  const text = normalizeText(value)
  return text ? text.split(' ') : []
}

export const stopwords = new Set([
  'acaba',
  'bir',
  'biraz',
  'mi',
  'mu',
  'misin',
  'misiniz',
  'musun',
  'musunuz',
  'midir',
  'mudur',
  've',
  'veya',
  'ya',
  'ile',
  'icin',
  'gibi',
  'bu',
  'su',
  'o',
  'bana',
  'beni',
  'ben',
  'biz',
  'siz',
  'sizin',
  'sizde',
  'sizinle',
  'size',
  'de',
  'da',
  'ki',
  'ne',
  'neler',
  'nedir',
  'hangi',
  'lutfen',
  'rica',
  'ederim',
  'peki',
  'ama',
  'fakat',
  'cok',
  'daha',
  'en',
  'her',
  'hic',
  'sey',
  'seyler',
  'var',
  'yok',
  'mevcut',
  'olan',
  'olarak',
  'oldu',
  'olur',
  'olabilir',
  'istiyorum',
  'isterim',
  'istiyoruz',
  'acaba',
  'hakkinda',
  'ilgili',
  'bilgi',
  'almak',
  'alabilir',
  'verir',
  'verebilir',
  'nasil',
  'nerede',
  'nereden',
  'nereye',
  'kadar',
  'ise',
  'yani',
  'simdi',
  'tamam',
  'merak',
  'ediyorum',
  // English
  'the',
  'a',
  'an',
  'is',
  'are',
  'do',
  'does',
  'you',
  'your',
  'i',
  'me',
  'my',
  'we',
  'to',
  'of',
  'in',
  'on',
  'for',
  'and',
  'or',
  'can',
  'could',
  'please',
  'have',
  'has',
  'what',
  'which',
  'any',
  'some',
  'about',
  'want',
  'would',
  'like',
  'with',
  'show',
  'tell',
])

// Longest first. Folded forms (ı→i, ü→u): a single list covers vowel-harmony variants.
const suffixes = [
  'lerinizden',
  'larinizdan',
  'lerimizden',
  'larimizdan',
  'leriniz',
  'lariniz',
  'lerimiz',
  'larimiz',
  'lerinde',
  'larinda',
  'lerine',
  'larina',
  'lerini',
  'larini',
  'leri',
  'lari',
  'inizda',
  'inizde',
  'unuzda',
  'unuzde',
  'iniz',
  'unuz',
  'imiz',
  'umuz',
  'ler',
  'lar',
  'daki',
  'deki',
  'taki',
  'teki',
  'dan',
  'den',
  'tan',
  'ten',
  'nin',
  'nun',
  'niz',
  'nuz',
  'miz',
  'muz',
  'yla',
  'yle',
  'da',
  'de',
  'ta',
  'te',
  'in',
  'un',
  'im',
  'um',
  'si',
  'su',
  'ya',
  'ye',
  'yi',
  'yu',
  'na',
  'ne',
  'ni',
  'nu',
  'm',
  'a',
  'e',
  'i',
  'u',
]

function soften(value: string) {
  const last = value.at(-1)
  if (last === 'b') return `${value.slice(0, -1)}p`
  if (last === 'g') return `${value.slice(0, -1)}k`
  if (last === 'd' && value.length > 3) return `${value.slice(0, -1)}t`
  return value
}

/**
 * Strips common inflection/possessive suffixes. When a lexicon is provided, stripping stops at
 * the first known base form, which keeps words like "proje" intact.
 */
export function stem(token: string, lexicon?: ReadonlySet<string>) {
  if (token.length < 4 || /\d/.test(token)) return token
  if (lexicon?.has(token)) return token
  if (lexicon?.has(soften(token))) return soften(token)
  let current = token
  let stripped = false
  for (let round = 0; round < 4; round += 1) {
    let changed = false
    // Prefer any suffix split that reaches a known base form ("duzeni" → "duzen", not "duze").
    if (lexicon)
      for (const suffix of suffixes) {
        if (!current.endsWith(suffix) || current.length - suffix.length < 3) continue
        const candidate = current.slice(0, -suffix.length)
        if (lexicon.has(candidate)) return candidate
        const softened = soften(candidate)
        if (lexicon.has(softened)) return softened
      }
    for (const suffix of suffixes) {
      if (!current.endsWith(suffix) || current.length - suffix.length < 3) continue
      const candidate = current.slice(0, -suffix.length)
      // Single vowels are ambiguous without a dictionary; strip only short of a 4+ letter stem.
      if (suffix.length === 1 && candidate.length < 4) continue
      current = candidate
      stripped = true
      changed = true
      break
    }
    if (!changed) break
  }
  return stripped ? soften(current) : current
}

export function levenshtein(a: string, b: string, max = 3) {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      const value = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost)
      current.push(value)
      rowMin = Math.min(rowMin, value)
    }
    if (rowMin > max) return max + 1
    previous = current
  }
  return previous[b.length]
}

/** Typo budget: ≤3 letters exact, 4–7 letters one edit, 8+ letters two edits. */
export function typoBudget(length: number) {
  return length <= 3 ? 0 : length <= 7 ? 1 : 2
}

export function fuzzyEqual(a: string, b: string) {
  if (a === b) return true
  const budget = typoBudget(Math.min(a.length, b.length))
  return budget > 0 && levenshtein(a, b, budget) <= budget
}
