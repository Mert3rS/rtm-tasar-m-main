import {
  baseHeight,
  newCell,
  optionName,
  redistribute,
  resize,
  round,
  sum,
  type Config,
  type Options,
} from './config'
import {
  defaultEntryway,
  entrywayFitError,
  entrywayFrontNames,
  entrywayLayoutNames,
  type EntrywayOptions,
} from './entrywaySchema'

export type EntrywayZone = {
  kind: 'shoes' | 'shelves' | 'hooks' | 'hanging' | 'drawers'
  bottom: number
  height: number
  count: number
}
export type EntrywayUnit = {
  index: number
  x: number
  width: number
  bottom: number
  top: number
  hookY: number
  seatBoardTop: number
  front: EntrywayOptions['fronts'][number]
  zones: EntrywayZone[]
}
export function entrywayUnits(c: Config): EntrywayUnit[] {
  const entry = c.entryway
  if (!entry) return []
  const base = baseHeight(c),
    top = c.d.h - (entry.upper ? entry.upperHeight : 0),
    available = top - base
  const seatBoardTop = entry.seatHeight - (entry.cushion ? 4 : 0)
  let edge = -c.d.w / 2
  return c.r.main.w.map((width, index) => {
    const x = edge + width / 2
    edge += width
    const zones: EntrywayZone[] = []
    const add = (kind: EntrywayZone['kind'], bottom: number, height: number, count = 0) =>
      zones.push({ kind, bottom, height, count })
    const layout = entry.layouts[index]
    if (layout === 'bench') {
      const shoeHeight = seatBoardTop - 3 - base
      add(
        entry.benchStorage[index] === 'drawer' ? 'drawers' : 'shoes',
        base,
        shoeHeight,
        entry.benchStorage[index] === 'drawer' || shoeHeight >= 32 ? 1 : 0,
      )
      add('hooks', entry.seatHeight + 5, top - entry.seatHeight - 5, entry.hooks[index])
    } else if (layout === 'hooks') {
      add('shelves', base, 28)
      add('hooks', base + 28, available - 28, entry.hooks[index])
    } else if (layout === 'hanging') {
      add('hanging', base, available - 25)
      add('shelves', top - 25, 25)
    } else if (layout === 'drawers') {
      const h = entry.drawers[index] * 18
      add('drawers', base, h, entry.drawers[index])
      add('shelves', base + h, available - h, 2)
    } else add(layout === 'shoes' ? 'shoes' : 'shelves', base, available, entry.shelves[index])
    const front = ['bench', 'hooks', 'shelves'].includes(layout) ? 'open' : entry.fronts[index]
    return {
      index,
      x,
      width,
      bottom: base,
      top,
      seatBoardTop,
      hookY: Math.min(175, top - 14),
      front,
      zones,
    }
  })
}
export function assertEntrywayFits(c: Config) {
  if (!c.entryway) return
  const error = entrywayFitError(c.entryway, c.d.h, baseHeight(c), c.d.d)
  if (error) throw new Error(error)
  if (c.r.main.w.some((width) => width < 40))
    throw new Error('Vestiyer bölmeleri en az 40 cm olmalı.')
}
export function setEntrywayCount(c: Config, count: number) {
  const entry = c.entryway
  if (!entry) return
  if (c.r.main.lk.some(Boolean))
    throw new Error('Bölme sayısını değiştirmek için genişlik kilitlerini açın.')
  const widths = redistribute(Array(count).fill(1), Array(count).fill(false), c.d.w, 40)
  c.r.main = {
    w: widths,
    lk: widths.map(() => false),
    t: widths.map(() => 'kolon'),
    ay: widths.map(() => false),
    g: Array.from(
      { length: count },
      (_, i) => c.r.main.g[i] ?? { ...newCell(c.d.h - baseHeight(c)), f: ['kapak'] },
    ),
  }
  entry.layouts = Array.from({ length: count }, (_, i) => entry.layouts[i] ?? 'closed')
  entry.fronts = Array.from({ length: count }, (_, i) => entry.fronts[i] ?? 'solid')
  entry.glass = Array.from({ length: count }, (_, i) => entry.glass[i] ?? 'fume')
  entry.shelves = Array.from({ length: count }, (_, i) => entry.shelves[i] ?? 4)
  entry.hooks = Array.from({ length: count }, (_, i) => entry.hooks[i] ?? 4)
  entry.drawers = Array.from({ length: count }, (_, i) => entry.drawers[i] ?? 3)
  entry.slats = Array.from({ length: count }, (_, i) => entry.slats[i] ?? false)
  entry.benchStorage = Array.from({ length: count }, (_, i) => entry.benchStorage[i] ?? 'open')
  assertEntrywayFits(c)
}
export function setEntrywayWidth(c: Config, index: number, width: number) {
  if (c.r.main.lk[index]) throw new Error('Önce bölmenin genişlik kilidini açın.')
  const widths = [...c.r.main.w]
  widths[index] = width
  c.r.main.w = redistribute(
    widths,
    c.r.main.lk.map((locked, i) => locked || i === index),
    c.d.w,
    40,
  )
}
export function setEntrywayLayout(
  c: Config,
  index: number,
  layout: EntrywayOptions['layouts'][number],
) {
  const entry = c.entryway
  if (!entry) return
  entry.layouts[index] = layout
  if (['bench', 'hooks', 'shelves'].includes(layout)) entry.fronts[index] = 'open'
  else if (entry.fronts[index] === 'open') entry.fronts[index] = 'solid'
  if (layout === 'hanging' && c.d.d < 60) resize(c, 'd', 60)
  assertEntrywayFits(c)
}
export function setEntrywayOption<K extends keyof EntrywayOptions>(
  c: Config,
  key: K,
  value: EntrywayOptions[K],
) {
  if (!c.entryway) return
  c.entryway[key] = value
  assertEntrywayFits(c)
}
export function entrywayFocus(c: Config, selected: number) {
  const unit = entrywayUnits(c)[selected]
  return unit
    ? {
        x: unit.x / 100,
        y: (unit.bottom + unit.top) / 200,
        z: 0,
        width: Math.max(1.25, unit.width / 80),
        height: (unit.top - unit.bottom) / 90,
      }
    : undefined
}
export function entrywayDetails(c: Config): [string, string][] {
  const entry = c.entryway
  if (!entry) return []
  const units = entrywayUnits(c)
  return [
    [
      'Vestiyer düzeni',
      `${units.length} bölme · ${entry.upper ? `${entry.upperHeight} cm üst depolama` : 'Üst bölüm yok'}${entry.layouts.includes('bench') ? ` · Oturma yüksekliği ${entry.seatHeight} cm · ${entry.cushion ? 'Minderli' : 'Mindersiz'}` : ''}`,
    ],
    [
      'Vestiyer bölmeleri',
      units
        .map(
          (unit) =>
            `${unit.index + 1}) ${round(unit.width)} cm ${entrywayLayoutNames[entry.layouts[unit.index]]} / ${entrywayFrontNames[unit.front]}${unit.front === 'glass' ? ` / ${optionName(entry.glass[unit.index])}` : ''}${['bench', 'hooks'].includes(entry.layouts[unit.index]) ? ` / ${entry.hooks[unit.index]} askı kancası${entry.slats[unit.index] ? ' / Dikey çıtalı arkalık' : ''}` : ''}${entry.layouts[unit.index] === 'bench' ? ` / Bank altı ${entry.benchStorage[unit.index] === 'drawer' ? 'çekmece' : 'açık ayakkabılık'}` : ''}${entry.layouts[unit.index] === 'drawers' ? ` / ${entry.drawers[unit.index]} çekmece` : ['shoes', 'closed', 'shelves'].includes(entry.layouts[unit.index]) ? ` / ${entry.shelves[unit.index]} raf` : ''}`,
        )
        .join(' · '),
    ],
    ...(entry.layouts.includes('bench') && entry.cushion
      ? [
          [
            'Minder rengi',
            { sand: 'Kum', stone: 'Taş', charcoal: 'Antrasit', olive: 'Adaçayı' }[
              entry.cushionColor
            ],
          ] satisfies [string, string],
        ]
      : []),
  ]
}
type EntrywayStyle = {
  id: string
  name: string
  detail: string
  options: Partial<Options>
  mirror?: boolean
}
export const entrywayStyles: EntrywayStyle[] = [
  {
    id: 'ivory',
    name: 'Sade fildişi',
    detail: 'Mat · ince siyah kulp',
    options: {
      renk: 'fildisi',
      renk2: 'fildisi',
      iki: false,
      ral: '',
      malz: 'MDF-lam',
      yuzey: 'Mat',
      km: 'duz',
      govde: 'beyaz',
      kulp: 'cubuk',
      krenk: 'siyah',
    },
  },
  {
    id: 'oak',
    name: 'Meşe & fildişi',
    detail: 'Sıcak çıtalar · sakin yüzeyler',
    options: {
      renk: 'fildisi',
      renk2: 'mese',
      iki: true,
      ral: '',
      malz: 'MDF-lam',
      yuzey: 'Mat',
      km: 'duz',
      govde: 'beyaz',
      kulp: 'kenar-profil',
      krenk: 'siyah',
    },
  },
  {
    id: 'cashmere',
    name: 'Kaşmir konfor',
    detail: 'Yumuşak ton · bronz detay',
    options: {
      renk: 'kasmir',
      renk2: 'ceviz',
      iki: true,
      ral: '',
      malz: 'Lake',
      yuzey: 'Süper mat',
      km: 'duz',
      govde: 'beyaz',
      kulp: 'gomme',
      krenk: 'bronz',
    },
  },
  {
    id: 'sage',
    name: 'Adaçayı & meşe',
    detail: 'Mat lake · doğal vurgu',
    options: {
      renk: 'adacayi',
      renk2: 'acik-mese',
      iki: true,
      ral: '',
      malz: 'Lake',
      yuzey: 'Mat',
      km: 'cerceveli',
      govde: 'beyaz',
      kulp: 'dugme',
      krenk: 'bronz',
    },
  },
  {
    id: 'mirror',
    name: 'Aynalı antrasit',
    detail: 'Koyu yüzey · ayna vurgusu',
    options: {
      renk: 'antrasit',
      renk2: 'mese',
      iki: true,
      ral: '',
      malz: 'Lake',
      yuzey: 'Süper mat',
      km: 'duz',
      govde: 'antrasit',
      kulp: 'kenar-profil',
      krenk: 'inox',
    },
    mirror: true,
  },
  {
    id: 'navy',
    name: 'Gece mavisi',
    detail: 'Derin renk · açık ahşap',
    options: {
      renk: 'gece-mavisi',
      renk2: 'acik-mese',
      iki: true,
      ral: '',
      malz: 'Lake',
      yuzey: 'Mat',
      km: 'duz',
      govde: 'beyaz',
      kulp: 'kenar-profil',
      krenk: 'bronz',
    },
  },
]
export function applyEntrywayStyle(c: Config, id: string) {
  const entry = c.entryway,
    style = entrywayStyles.find((style) => style.id === id)
  if (!entry || !style) return
  Object.assign(c.o, style.options)
  if (style.mirror) {
    const index = entry.layouts
      .map((layout, i) => (['closed', 'shoes', 'hanging', 'drawers'].includes(layout) ? i : -1))
      .reverse()
      .find((i) => i >= 0)
    if (index !== undefined) entry.fronts[index] = 'mirror'
  }
}
export function applyEntrywayPreset(c: Config, preset: 'reference' | 'compact' | 'family') {
  if (c.m !== 'portmanto') return
  const widths = preset === 'family' ? [60, 60, 60] : preset === 'compact' ? [40, 50] : [60, 60]
  c.d = { w: sum(widths), h: preset === 'family' ? 220 : 210, d: preset === 'family' ? 60 : 45 }
  c.o.baza = 'b10'
  c.o.acilim = 'mentese'
  c.o.ust = false
  c.o.led = ['ic']
  c.r.main = {
    w: widths,
    lk: widths.map(() => false),
    t: widths.map(() => 'kolon'),
    ay: widths.map(() => false),
    g: widths.map(() => ({ ...newCell(c.d.h - 10), f: ['kapak'] })),
  }
  c.entryway = defaultEntryway()
  setEntrywayCount(c, widths.length)
  c.r.main.w = widths
  c.entryway.layouts =
    preset === 'family'
      ? ['bench', 'hanging', 'shoes']
      : preset === 'compact'
        ? ['hooks', 'shoes']
        : ['bench', 'closed']
  c.entryway.fronts = widths.map((_, index) => (index === 0 ? 'open' : 'solid'))
  if (preset === 'reference') {
    c.entryway.cushion = false
    c.entryway.slats = widths.map(() => false)
    c.entryway.seatHeight = 48
  }
  applyEntrywayStyle(c, preset === 'reference' ? 'ivory' : 'oak')
  assertEntrywayFits(c)
}
