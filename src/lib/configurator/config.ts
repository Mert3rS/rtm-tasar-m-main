import { z } from 'zod'
import { kitchenModulesSchema, defaultKitchenModules } from './kitchenSchema'
import { wardrobeSchema, defaultWardrobe, wardrobeMinimumHeight } from './wardrobeSchema'
import { entrywaySchema, defaultEntryway, entrywayFitError } from './entrywaySchema'
import { bathroomSchema, defaultBathroom, bathroomFitError } from './bathroomSchema'
import { tvUnitSchema, defaultTvUnit, tvFitError } from './tvSchema'

const sizes = z.array(z.number().finite().min(5).max(600)).min(1).max(12)
export const fronts = ['kapak', 'cekmece', 'acik', 'cam', 'klapa', 'ayna'] as const
export const interiors = ['raf', 'aski', 'bos', 'pantolonluk', 'ayakkabi', 'sepet'] as const
export const products = ['mutfak', 'gardirop', 'portmanto', 'banyo', 'tv', 'ozel'] as const
const cellSchema = z
  .object({
    h: sizes,
    lk: z
      .array(z.union([z.literal(0), z.literal(1)]))
      .min(1)
      .max(12),
    f: z.array(z.enum(fronts)).min(1).max(12),
    ic: z.array(z.enum(interiors)).min(1).max(12),
    rf: z.array(z.number().int().min(-1).max(10)).min(1).max(12),
    ka: z
      .array(
        z
          .string()
          .max(80)
          .regex(/^[^<>\u0000-\u001f]*$/),
      )
      .min(1)
      .max(12),
  })
  .strict()
  .refine(
    (g) => [g.lk, g.f, g.ic, g.rf, g.ka].every((a) => a.length === g.h.length),
    'Göz dizileri tutarsız.',
  )
export const configSchema = z
  .object({
    v: z.literal(2),
    m: z.enum(products),
    // Optional so existing v2 links keep their original data and canonical share IDs.
    k: z
      .object({
        layout: z.enum(['straight', 'left', 'right']),
        length: z.number().finite().min(120).max(400),
        upperHeight: z.number().finite().min(40).max(100),
        gap: z.number().finite().min(45).max(80),
        sink: z.boolean(),
        hob: z.boolean(),
        oven: z.boolean(),
        modules: kitchenModulesSchema.optional(),
      })
      .strict()
      .optional(),
    wardrobe: wardrobeSchema.optional(),
    entryway: entrywaySchema.optional(),
    bathroom: bathroomSchema.optional(),
    tvUnit: tvUnitSchema.optional(),
    d: z
      .object({
        w: z.number().finite().min(30).max(600),
        h: z.number().finite().min(40).max(300),
        d: z.number().finite().min(20).max(100),
      })
      .strict(),
    r: z
      .object({
        main: z
          .object({
            w: sizes.max(8),
            lk: z.array(z.boolean()).min(1).max(8),
            t: z
              .array(z.enum(['kolon', 'ust', 'alt']))
              .min(1)
              .max(8),
            ay: z.array(z.boolean()).min(1).max(8),
            g: z.array(cellSchema).min(1).max(8),
          })
          .strict(),
      })
      .strict(),
    o: z
      .object({
        malz: z.enum([
          'Akrilik',
          'Lake',
          'Laminat',
          'Ahşap kaplama',
          'MDF boyalı',
          'MDF-lam',
          'Glossmax',
          'High gloss',
        ]),
        yuzey: z.enum(['Mat', 'Parlak', 'Süper mat', 'Dokulu']),
        km: z.enum(['duz', 'cerceveli', 'cizgili', 'fluted']),
        renk: z.string().max(30),
        iki: z.boolean(),
        renk2: z.string().max(30),
        ral: z
          .string()
          .max(12)
          .regex(/^(?:|(?:RAL\s*)?\d{4}|#[a-fA-F0-9]{6})$/),
        govde: z.enum(['kapak', 'beyaz', 'antrasit', 'ahsap']),
        kulp: z.enum(['gola', 'cubuk', 'gomme', 'bas-ac', 'kenar-profil', 'yok', 'dugme']),
        krenk: z.enum(['beyaz', 'siyah', 'inox', 'altin', 'bronz']),
        baza: z.enum(['b0', 'b8', 'b10', 'b12', 'ayak', 'asma']),
        tezgah: z.enum([
          'karar',
          'kuvars',
          'masif',
          'compact',
          'yok',
          'laminat',
          'porselen',
          'granit',
        ]),
        led: z.array(z.enum(['ic', 'alt', 'ust', 'raf', 'gola'])).max(5),
        acilim: z.enum(['mentese', 'surgulu', 'katlanir']),
        ust: z.boolean(),
        camc: z.enum(['siyah', 'alu', 'altin', 'bronz']),
        camt: z.enum(['seffaf', 'fume', 'buzlu', 'reflekte', 'yivli']),
        tv: z.number().int().min(32).max(98),
        panel: z.boolean(),
      })
      .strict(),
  })
  .strict()
  .superRefine((c, ctx) => {
    if (c.k && c.m !== 'mutfak')
      ctx.addIssue({
        code: 'custom',
        message: 'Mutfak yerleşimi yalnızca mutfakta kullanılabilir.',
      })
    if (c.k && c.k.layout !== 'straight' && (c.d.w < c.d.d + 120 || c.k.length < c.d.d + 60))
      ctx.addIssue({
        code: 'custom',
        message:
          'L mutfak için ana duvar en az derinlik + 120 cm, dönüş en az derinlik + 60 cm olmalı.',
      })
    if (c.k && c.d.h > 110)
      ctx.addIssue({
        code: 'custom',
        message: 'Mutfak alt dolap yüksekliği en fazla 110 cm olabilir.',
      })
    const r = c.r.main
    if (c.tvUnit) {
      if (c.m !== 'tv' || c.o.acilim !== 'mentese') ctx.addIssue({ code: 'custom', message: 'TV yerleşimi yalnızca TV ünitesinde ve menteşeli sistemde kullanılabilir.' })
      const error = tvFitError(c.tvUnit, r.w, c.d.h, c.d.d, baseHeight(c), c.o.tv)
      if (error) ctx.addIssue({ code: 'custom', message: error })
    }
    if (c.bathroom) {
      if (c.m !== 'banyo' || c.o.acilim !== 'mentese' || !['asma', 'b0', 'b8', 'b10', 'b12', 'ayak'].includes(c.o.baza))
        ctx.addIssue({ code: 'custom', message: 'Banyo yerleşimi yalnızca banyo dolabında ve menteşeli kapaklarda kullanılabilir.' })
      const error = bathroomFitError(c.bathroom, r.w, c.d.h, c.d.d, baseHeight(c), c.o.baza === 'asma')
      if (error) ctx.addIssue({ code: 'custom', message: error })
    }
    if (c.entryway) {
      if (c.m !== 'portmanto' || c.entryway.layouts.length !== r.w.length || r.w.some((width) => width < 40) || c.o.acilim !== 'mentese')
        ctx.addIssue({ code: 'custom', message: 'Vestiyer dizileri eşleşmeli; bölmeler en az 40 cm ve kapaklar menteşeli olmalı.' })
      const error = entrywayFitError(c.entryway, c.d.h, baseHeight(c), c.d.d)
      if (error) ctx.addIssue({ code: 'custom', message: error })
    }
    if (c.wardrobe) {
      const wardrobe = c.wardrobe
      const available = c.d.h - baseHeight(c) - (wardrobe.loft ? wardrobe.loftHeight : 0)
      if (
        c.m !== 'gardirop' ||
        wardrobe.layouts.length !== r.w.length ||
        r.w.some((width) => width < 45)
      )
        ctx.addIssue({
          code: 'custom',
          message: 'Gardırop bölmeleri en az 45 cm olmalı ve diziler eşleşmeli.',
        })
      if (
        wardrobe.layouts.some(
          (layout, index) => available < wardrobeMinimumHeight(layout, wardrobe.drawers[index]),
        )
      )
        ctx.addIssue({
          code: 'custom',
          message:
            'Seçili iç düzen için yükseklik yetersiz. Üst depolamayı veya iç düzeni değiştirin.',
        })
      if (c.o.acilim === 'katlanir' || (c.o.acilim === 'surgulu' && c.d.d < 60))
        ctx.addIssue({
          code: 'custom',
          message:
            'Sürgülü gardırop en az 60 cm derinlik ister; menteşeli veya sürgülü sistem seçin.',
        })
    }
    const modules = c.k?.modules
    if (modules && c.k) {
      const lowerKinds = ['door', 'drawers', 'oven', 'sink', 'dishwasher', 'open']
      const upperKinds = ['door', 'glass', 'open', 'hood']
      const rows = [modules.upper, modules.returnLower, modules.returnUpper]
      const lengths = [c.d.w, c.k.length - c.d.d, c.k.length - c.d.d]
      if (
        modules.lower.length !== r.w.length ||
        rows.some((row, i) => Math.abs(sum(row.w) - lengths[i]) > 0.011)
      )
        ctx.addIssue({ code: 'custom', message: 'Mutfak sıralarının ölçü toplamları tutarsız.' })
      if (
        modules.lower.some((kind) => !lowerKinds.includes(kind)) ||
        modules.returnLower.t.some((kind) => !lowerKinds.includes(kind)) ||
        [modules.upper, modules.returnUpper].some((row) =>
          row.t.some((kind) => !upperKinds.includes(kind)),
        )
      )
        ctx.addIssue({ code: 'custom', message: 'Modül tipi seçilen dolap sırasına uygun değil.' })
      const allLower = [...modules.lower, ...modules.returnLower.t]
      if (
        ['sink', 'oven', 'dishwasher'].some(
          (kind) => allLower.filter((value) => value === kind).length > 1,
        )
      )
        ctx.addIssue({ code: 'custom', message: 'Her cihaz için tek bir modül seçin.' })
      if (
        modules.hob &&
        modules.hob.index >=
          (modules.hob.row === 'lower' ? r.w.length : modules.returnLower.w.length)
      )
        ctx.addIssue({ code: 'custom', message: 'Ocak modülü bulunamadı.' })
    }
    if (![r.lk, r.t, r.ay, r.g].every((a) => a.length === r.w.length) || r.w.some((w) => w < 30))
      ctx.addIssue({ code: 'custom', message: 'Bölmeler tutarsız veya 30 cm altında.' })
    if (
      Math.abs(sum(r.w) - c.d.w) > 0.011 ||
      r.g.some((g) => Math.abs(sum(g.h) - (c.d.h - baseHeight(c))) > 0.011)
    )
      ctx.addIssue({ code: 'custom', message: 'Ölçü toplamları tutarsız.' })
    if (!Object.hasOwn(palette, c.o.renk) || !Object.hasOwn(palette, c.o.renk2))
      ctx.addIssue({ code: 'custom', message: 'Geçersiz renk.' })
    for (const key of ['w', 'h', 'd'] as const) {
      const [min, max] = limits[c.m][key]
      if (c.d[key] < min || c.d[key] > max)
        ctx.addIssue({ code: 'custom', message: 'Ürün ölçüsü sınır dışında.' })
    }
  })
export type Config = z.infer<typeof configSchema>
export type Cell = Config['r']['main']['g'][number]
export type Options = Config['o']
export const productNames: Record<Config['m'], string> = {
  mutfak: 'Mutfak dolabı',
  gardirop: 'Gardırop',
  portmanto: 'Portmanto / vestiyer',
  banyo: 'Banyo dolabı',
  tv: 'TV ünitesi',
  ozel: 'Özel ölçü',
}
export const frontNames: Record<Cell['f'][number], string> = {
  kapak: 'Kapak',
  cekmece: 'Çekmece',
  acik: 'Açık',
  cam: 'Cam kapak',
  klapa: 'Klapa',
  ayna: 'Aynalı kapak',
}
export const interiorNames: Record<Cell['ic'][number], string> = {
  raf: 'Raf',
  aski: 'Askı borusu',
  bos: 'Boş',
  pantolonluk: 'Pantolonluk',
  ayakkabi: 'Ayakkabılık',
  sepet: 'Tel sepet',
}
export const optionNames: Record<string, string> = {
  duz: 'Düz',
  cerceveli: 'Çerçeveli',
  cizgili: 'Çizgili',
  fluted: 'Fluted',
  kapak: 'Kapakla aynı',
  beyaz: 'Beyaz',
  antrasit: 'Antrasit',
  ahsap: 'Ahşap',
  gola: 'Gola',
  cubuk: 'Çubuk',
  gomme: 'Gömme',
  'bas-ac': 'Bas-aç',
  'kenar-profil': 'Kenar profil',
  yok: 'Yok',
  siyah: 'Siyah',
  inox: 'İnoks',
  altin: 'Altın',
  bronz: 'Bronz',
  b0: 'Bazasız',
  b8: '8 cm baza',
  b10: '10 cm baza',
  b12: '12 cm baza',
  ayak: '12 cm ayak',
  asma: 'Duvara asma',
  karar: 'Sonra belirlenecek',
  kuvars: 'Kuvars',
  masif: 'Masif',
  compact: 'Compact',
  laminat: 'Laminat',
  porselen: 'Porselen',
  granit: 'Granit / doğal taş',
  dugme: 'Düğme kulp',
  golaLed: 'Gola profil LED',
  ic: 'İç',
  alt: 'Alt',
  ust: 'Üst',
  raf: 'Raf altı',
  mentese: 'Menteşeli',
  surgulu: 'Sürgülü',
  katlanir: 'Katlanır',
  alu: 'Alüminyum',
  seffaf: 'Şeffaf',
  fume: 'Füme',
  buzlu: 'Buzlu',
  reflekte: 'Reflekte',
  yivli: 'Yivli cam',
}
export function optionName(value: string) {
  return Object.hasOwn(optionNames, value) ? optionNames[value] : value
}
export const palette: Record<string, { name: string; hex: string; wood?: boolean }> = {
  beyaz: { name: 'Beyaz', hex: '#f1eee6' },
  'kirik-beyaz': { name: 'Kırık beyaz', hex: '#e7ddcc' },
  kasmir: { name: 'Kaşmir', hex: '#b9ad9c' },
  bej: { name: 'Bej', hex: '#c8b48e' },
  gri: { name: 'Gri', hex: '#8e9190' },
  antrasit: { name: 'Antrasit', hex: '#45494b' },
  siyah: { name: 'Siyah', hex: '#242524' },
  adacayi: { name: 'Adaçayı yeşili', hex: '#88927c' },
  'gece-mavisi': { name: 'Gece mavisi', hex: '#283948' },
  ceviz: { name: 'Ceviz', hex: '#79513a', wood: true },
  mese: { name: 'Meşe', hex: '#b68c60', wood: true },
  krem: { name: 'Krem', hex: '#e6d6b9' },
  fildisi: { name: 'Fildişi', hex: '#eee8dc' },
  'gul-kurusu': { name: 'Gül kurusu', hex: '#b58d83' },
  vizon: { name: 'Vizon', hex: '#81766a' },
  haki: { name: 'Haki', hex: '#777d5c' },
  orman: { name: 'Orman yeşili', hex: '#344e43' },
  petrol: { name: 'Petrol mavisi', hex: '#23535d' },
  'acik-mese': { name: 'Açık meşe', hex: '#d6bc91', wood: true },
  'koyu-ceviz': { name: 'Koyu ceviz', hex: '#503a2c', wood: true },
}
export const sum = (a: number[]) => a.reduce((s, n) => s + n, 0)
export function baseHeight(c: Config) {
  return { b0: 0, b8: 8, b10: 10, b12: 12, ayak: 12, asma: 0 }[c.o.baza]
}
export const round = (n: number) => Math.round(n * 100) / 100
export function newCell(height: number): Cell {
  return { h: [height], lk: [0], f: ['acik'], ic: ['raf'], rf: [-1], ka: [''] }
}
export function defaultConfig(m: Config['m'] = 'ozel'): Config {
  const dims = {
    mutfak: [360, 88, 60],
    gardirop: [200, 240, 60],
    portmanto: [120, 210, 45],
    banyo: [100, 50, 52],
    tv: [240, 45, 40],
    ozel: [120, 200, 50],
  }[m]
  const [w, h, d] = dims
  const n = m === 'mutfak' ? 6 : m === 'tv' ? 4 : m === 'banyo' ? 1 : 2
  const g = Array.from({ length: n }, () => newCell(h - (m === 'banyo' || m === 'tv' ? 0 : 12)))
  if (m === 'ozel')
    g[0] = {
      h: [37, 55.5, 80.5, 15],
      lk: [0, 1, 1, 0],
      f: ['cekmece', 'cekmece', 'cekmece', 'cekmece'],
      ic: ['raf', 'raf', 'raf', 'raf'],
      rf: [-1, -1, -1, -1],
      ka: ['', '', '', ''],
    }
  if (m === 'gardirop' || m === 'portmanto') {
    g[0].ic = ['aski']
    g[0].f = ['kapak']
  }
  if (m === 'mutfak' || m === 'banyo' || m === 'tv')
    g.forEach((cell) => {
      cell.f = ['kapak']
    })
  if (m === 'mutfak') {
    g[0] = {
      h: [20, 28, 28],
      lk: [0, 0, 0],
      f: ['cekmece', 'cekmece', 'cekmece'],
      ic: ['bos', 'bos', 'bos'],
      rf: [0, 0, 0],
      ka: ['', '', ''],
    }
  }
  return {
    v: 2,
    m,
    ...(m === 'gardirop' ? { wardrobe: defaultWardrobe() } : {}),
    ...(m === 'portmanto' ? { entryway: defaultEntryway() } : {}),
    ...(m === 'banyo' ? { bathroom: defaultBathroom() } : {}),
    ...(m === 'tv' ? { tvUnit: defaultTvUnit() } : {}),
    ...(m === 'mutfak'
      ? {
          k: {
            layout: 'straight' as const,
            length: 240,
            upperHeight: 72,
            gap: 56,
            sink: true,
            hob: true,
            oven: true,
            modules: defaultKitchenModules(),
          },
        }
      : {}),
    d: { w, h, d },
    r: {
      main: {
        w: Array.from({ length: n }, () => w / n),
        lk: Array(n).fill(false),
        t: Array(n).fill(m === 'mutfak' ? 'alt' : 'kolon'),
        ay: Array(n).fill(false),
        g,
      },
    },
    o: {
      malz: m === 'tv' ? 'Lake' : m === 'gardirop' || m === 'portmanto' || m === 'banyo' ? 'MDF-lam' : 'Akrilik',
      yuzey: m === 'mutfak' ? 'Süper mat' : 'Mat',
      km: m === 'banyo' ? 'fluted' : 'duz',
      renk: m === 'tv' ? 'kasmir' : m === 'banyo' ? 'acik-mese' : m === 'gardirop' || m === 'portmanto' ? 'fildisi' : 'antrasit',
      iki: m === 'portmanto' || m === 'banyo' || m === 'tv',
      renk2: m === 'banyo' ? 'fildisi' : 'mese',
      ral: '',
      govde: m === 'gardirop' || m === 'portmanto' ? 'beyaz' : 'kapak',
      kulp: m === 'tv' ? 'bas-ac' : m === 'gardirop' || m === 'portmanto' ? 'cubuk' : 'gola',
      krenk: m === 'mutfak' || m === 'gardirop' || m === 'portmanto' || m === 'banyo' ? 'siyah' : 'beyaz',
      baza: m === 'banyo' || m === 'tv' ? 'asma' : 'b12',
      tezgah: m === 'banyo' ? 'porselen' : m === 'mutfak' ? 'kuvars' : 'karar',
      led: m === 'tv' ? ['alt', 'ic', 'raf'] : m === 'banyo' ? ['alt', 'ic'] : m === 'mutfak' ? ['alt'] : ['ic'],
      acilim: 'mentese',
      ust: m === 'mutfak' || m === 'banyo' || m === 'tv',
      camc: 'siyah',
      camt: 'seffaf',
      tv: 65,
      panel: true,
    },
  }
}
/** Locked dimensions remain exact. Impossible edits are rejected atomically by the store. */
export function redistribute(values: number[], locks: boolean[], total: number, minimum: number) {
  const free = values.flatMap((_, i) => (locks[i] ? [] : [i]))
  const locked = sum(values.filter((_, i) => locks[i]))
  if (!free.length) {
    if (Math.abs(sum(values) - total) > 0.01)
      throw new Error('Ölçüyü değiştirmek için bir kilidi açın.')
    return values
  }
  if (total - locked < free.length * minimum - 0.001)
    throw new Error('Kilitli ölçüler bu değişime izin vermiyor. Önce kilitleri açın.')
  const next = [...values]
  let remaining = round(total - locked)
  let pending = [...free]
  while (pending.length) {
    const weight = sum(pending.map((i) => values[i]))
    const small = pending.filter((i) => (remaining * values[i]) / weight < minimum)
    if (!small.length) {
      pending.forEach((i, j) => {
        next[i] =
          j === pending.length - 1
            ? remaining
            : round((remaining * values[i]) / sum(pending.slice(j).map((k) => values[k])))
        remaining = round(remaining - next[i])
      })
      break
    }
    small.forEach((i) => {
      next[i] = minimum
      remaining = round(remaining - minimum)
    })
    pending = pending.filter((i) => !small.includes(i))
  }
  return next
}
export function resize(c: Config, key: keyof Config['d'], value: number) {
  c.d[key] = value
  c.r.main.w = redistribute(c.r.main.w, c.r.main.lk, c.d.w, 30)
  c.r.main.g.forEach((g) => {
    g.h = redistribute(g.h, g.lk.map(Boolean), c.d.h - baseHeight(c), 5)
  })
  syncKitchenRows(c)
  if (c.bathroom) c.bathroom.upper.w = redistribute(c.bathroom.upper.w, c.bathroom.upper.lk, c.d.w, 30)
  if (c.tvUnit) c.tvUnit.upper.w = redistribute(c.tvUnit.upper.w, c.tvUnit.upper.lk, c.d.w, 30)
}
export function syncKitchenRows(c: Config) {
  const k = c.k
  if (!k?.modules) return
  const modules = k.modules
  modules.upper.w = redistribute(modules.upper.w, modules.upper.lk, c.d.w, 30)
  for (const row of [modules.returnLower, modules.returnUpper]) {
    const total = k.length - c.d.d
    if (total < row.w.length * 30 && !row.lk.some(Boolean)) {
      const count = Math.max(1, Math.floor(total / 30))
      row.w = row.w.slice(0, count)
      row.lk = row.lk.slice(0, count)
      row.t = row.t.slice(0, count)
      row.glass = row.glass.slice(0, count)
    }
    row.w = redistribute(row.w, row.lk, total, 30)
  }
  if (modules.hob?.row === 'returnLower' && modules.hob.index >= modules.returnLower.w.length)
    modules.hob = null
}
export function setWidth(c: Config, index: number, value: number) {
  const r = c.r.main
  if (r.lk[index]) throw new Error('Önce bölmenin kilidini açın.')
  const locks = r.lk.map((l, i) => l || i === index)
  const widths = [...r.w]
  widths[index] = value
  r.w = redistribute(widths, locks, c.d.w, 30)
}
export function setHeight(c: Config, section: number, index: number, value: number) {
  const g = c.r.main.g[section]
  if (g.lk[index]) throw new Error('Önce gözün kilidini açın.')
  const values = [...g.h]
  values[index] = value
  g.h = redistribute(
    values,
    g.lk.map((l, i) => Boolean(l) || i === index),
    c.d.h - baseHeight(c),
    5,
  )
}
export function encode(c: Config) {
  const bytes = new TextEncoder().encode(JSON.stringify(c))
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
export function decode(hash: string): Config {
  const raw = hash.replace(/^#?c=/, '')
  if (raw.length > 28000 || !/^[\w-]+$/.test(raw)) throw new Error('Geçersiz bağlantı.')
  const binary = atob(raw.replace(/-/g, '+').replace(/_/g, '/'))
  return configSchema.parse(
    JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(
        Uint8Array.from(binary, (c) => c.charCodeAt(0)),
      ),
    ),
  )
}
export function designUrl(c: Config) {
  return `${window.location.origin}/tasarim-olustur#c=${encode(c)}`
}
export const limits: Record<Config['m'], Record<keyof Config['d'], [number, number]>> = {
  gardirop: { w: [60, 400], h: [180, 280], d: [45, 65] },
  mutfak: { w: [60, 600], h: [60, 260], d: [40, 70] },
  portmanto: { w: [60, 300], h: [160, 280], d: [30, 65] },
  banyo: { w: [60, 240], h: [40, 220], d: [30, 60] },
  tv: { w: [60, 500], h: [40, 220], d: [25, 60] },
  ozel: { w: [30, 600], h: [40, 300], d: [20, 100] },
}
export const ralColors: Record<string, string> = {
  '9001': '#e9e0d2',
  '9003': '#ecece7',
  '9005': '#151619',
  '9010': '#f1ece1',
  '7016': '#383e42',
  '7035': '#c5c7c4',
  '1013': '#e3d9c6',
  '1019': '#a49582',
  '6003': '#50533c',
  '5008': '#293b44',
}
export function colorHex(o: Options) {
  return o.ral.startsWith('#')
    ? o.ral
    : ralColors[o.ral.replace(/RAL\s*/, '')] || palette[o.renk].hex
}
