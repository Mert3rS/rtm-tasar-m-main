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
  defaultTvUnit,
  tvFitError,
  tvKindNames,
  type TvOptions,
  type TvSelection,
} from './tvSchema'

export type TvUnit = {
  row: TvSelection['row']
  index: number
  x: number
  width: number
  bottom: number
  height: number
  depth: number
  z: number
  kind: TvOptions['lower'][number] | TvOptions['upper']['t'][number]
  shelves: number
  drawers: number
  glass: TvOptions['upper']['glass'][number]
}
export function tvGeometry(c: Config) {
  const t = c.tvUnit,
    offset = c.o.baza === 'asma' ? (t?.floorGap ?? 20) : 0,
    counter = offset + c.d.h
  const lower: TvUnit[] = [],
    upper: TvUnit[] = []
  if (t) {
    let edge = -c.d.w / 2
    c.r.main.w.forEach((width, index) => {
      lower.push({
        row: 'lower',
        index,
        x: edge + width / 2,
        width,
        bottom: offset + baseHeight(c),
        height: c.d.h - baseHeight(c) - 2,
        depth: c.d.d,
        z: 0,
        kind: t.lower[index],
        drawers: t.drawers[index],
        shelves: t.shelves[index],
        glass: 'fume',
      })
      edge += width
    })
    edge = -c.d.w / 2
    t.upper.w.forEach((width, index) => {
      upper.push({
        row: 'upper',
        index,
        x: edge + width / 2,
        width,
        bottom: counter,
        height: t.upperHeight,
        depth: t.upperDepth,
        z: -c.d.d / 2 + t.upperDepth / 2,
        kind: t.upper.t[index],
        drawers: 0,
        shelves: t.upper.shelves[index],
        glass: t.upper.glass[index],
      })
      edge += width
    })
  }
  const area = upper.find((unit) => unit.kind === 'tv')
  return {
    lower,
    upper,
    offset,
    counter,
    top: counter + (t?.upperHeight ?? 0),
    area,
    screen: area
      ? {
          x: area.x,
          y: counter + area.height * 0.48,
          width: c.o.tv * 2.214,
          height: c.o.tv * 1.245,
        }
      : undefined,
  }
}
export function normalizeTvSelection(c: Config, selection: TvSelection): TvSelection {
  return {
    row: selection.row,
    index: Math.max(
      0,
      Math.min(
        selection.index,
        (selection.row === 'lower' ? c.r.main.w.length : (c.tvUnit?.upper.w.length ?? 1)) - 1,
      ),
    ),
  }
}
export function assertTvFits(c: Config) {
  if (c.tvUnit) {
    const error = tvFitError(c.tvUnit, c.r.main.w, c.d.h, c.d.d, baseHeight(c), c.o.tv)
    if (error) throw new Error(error)
  }
}
export function setTvCount(c: Config, row: TvSelection['row'], count: number) {
  const t = c.tvUnit
  if (!t) return
  const target = row === 'lower' ? c.r.main : t.upper
  if (target.lk.some(Boolean)) throw new Error('Bölme sayısı için önce ölçü kilitlerini açın.')
  if (row === 'lower') {
    const w = redistribute(Array(count).fill(1), Array(count).fill(false), c.d.w, 30)
    c.r.main = {
      w,
      lk: w.map(() => false),
      t: w.map(() => 'alt'),
      ay: w.map(() => false),
      g: w.map(() => ({ ...newCell(c.d.h - baseHeight(c)), f: ['kapak'] })),
    }
    t.lower = w.map((_, i) => t.lower[i] ?? 'door')
    t.drawers = w.map((_, i) => t.drawers[i] ?? 2)
    t.shelves = w.map((_, i) => t.shelves[i] ?? 1)
  } else {
    const tvIndex = count === 1 ? 0 : Math.min(Math.floor(count / 2), count - 1),
      minimum = c.o.tv * 2.214 + 8
    const remaining = c.d.w - minimum - (count - 1) * 30
    if (remaining < 0) throw new Error('TV ve yeni bölmeler için yeterli genişlik yok.')
    const w = Array.from({ length: count }, (_, i) =>
      round((i === tvIndex ? minimum : 30) + remaining / count),
    )
    w[count - 1] = round(c.d.w - sum(w.slice(0, -1)))
    t.upper = {
      w,
      lk: w.map(() => false),
      t: w.map((_, i) => (i === tvIndex ? 'tv' : i === 0 ? 'slats' : 'glass')),
      glass: w.map(() => 'fume'),
      shelves: w.map(() => 3),
    }
  }
  assertTvFits(c)
}
export function setTvWidth(c: Config, selection: TvSelection, width: number) {
  if (!c.tvUnit) return
  const target = selection.row === 'lower' ? c.r.main : c.tvUnit.upper
  if (target.lk[selection.index]) throw new Error('Önce bölme kilidini açın.')
  const values = [...target.w]
  values[selection.index] = width
  target.w = redistribute(
    values,
    target.lk.map((locked, i) => locked || i === selection.index),
    c.d.w,
    30,
  )
  assertTvFits(c)
}
export function setTvKind(c: Config, selection: TvSelection, kind: TvUnit['kind']) {
  const t = c.tvUnit
  if (!t) return
  if (selection.row === 'lower') {
    if (kind === 'door' || kind === 'drawers' || kind === 'lift' || kind === 'open')
      t.lower[selection.index] = kind
  } else if (
    kind === 'tv' ||
    kind === 'tower' ||
    kind === 'glass' ||
    kind === 'open' ||
    kind === 'slats'
  ) {
    if (kind === 'tv') {
      const previous = t.upper.t.indexOf('tv')
      if (previous !== selection.index) t.upper.t[previous] = t.upper.t[selection.index]
    }
    t.upper.t[selection.index] = kind
  }
  assertTvFits(c)
}
export function setTvOption<K extends keyof TvOptions>(c: Config, key: K, value: TvOptions[K]) {
  if (c.tvUnit) {
    c.tvUnit[key] = value
    assertTvFits(c)
  }
}
export function tvFocus(c: Config, selection: TvSelection) {
  const u = tvGeometry(c)[selection.row][selection.index]
  return u
    ? {
        x: u.x / 100,
        y: (u.bottom + u.height / 2) / 100,
        z: u.z / 100,
        width: Math.max(1.2, u.width / 80),
        height: Math.max(1, u.height / 80),
      }
    : undefined
}
export function tvDetails(c: Config): [string, string][] {
  const t = c.tvUnit,
    g = tvGeometry(c)
  if (!t) return []
  return [
    [
      'TV yerleşimi',
      `${c.o.tv} inç TV · ${g.area?.width} cm TV alanı · ${c.o.baza === 'asma' ? `Asma alt ünite / yerden ${t.floorGap} cm` : 'Zemine oturan alt ünite'} · Üst bölüm ${t.upperHeight} cm · Toplam üst kot ${g.top} cm`,
    ],
    [
      'Alt TV ünitesi',
      g.lower
        .map(
          (u) =>
            `${u.index + 1}) ${u.width} cm ${tvKindNames[u.kind]}${u.kind === 'drawers' ? ` / ${u.drawers} çekmece` : ` / ${u.shelves} raf`}`,
        )
        .join(' · '),
    ],
    [
      'Üst TV bölümleri',
      g.upper
        .map(
          (u) =>
            `${u.index + 1}) ${u.width} cm ${tvKindNames[u.kind]}${u.kind === 'glass' ? ` / ${optionName(u.glass)}` : ''}${['tower', 'glass', 'open'].includes(u.kind) ? ` / ${u.shelves} raf` : ''}`,
        )
        .join(' · '),
    ],
    [
      'TV detayları',
      `${c.o.panel ? `${t.backdrop === 'stone' ? 'Taş dokulu' : t.backdrop === 'slats' ? 'Çıtalı' : 'Düz'} TV arkası panel` : 'TV arkası panel yok'} · ${t.frameLed ? 'Gizli LED çerçeve' : 'Çerçeve LED yok'} · ${t.soundbar ? 'Soundbar alanı' : 'Soundbar yok'} · ${t.cableChannel ? 'Kablo kanalı' : 'Kablo kanalı yok'} · Üst derinlik ${t.upperDepth} cm`,
    ],
  ]
}
type TvStyle = {
  id: string
  name: string
  detail: string
  options: Partial<Options>
  backdrop: TvOptions['backdrop']
}
export const tvStyles: TvStyle[] = [
  {
    id: 'cashmere',
    name: 'Kaşmir & meşe',
    detail: 'Sıcak çıtalar · sakin taş panel',
    options: {
      renk: 'kasmir',
      renk2: 'mese',
      iki: true,
      ral: '',
      malz: 'Lake',
      yuzey: 'Mat',
      km: 'duz',
      govde: 'kapak',
      kulp: 'bas-ac',
      krenk: 'bronz',
    },
    backdrop: 'stone',
  },
  {
    id: 'walnut',
    name: 'Ceviz sinema',
    detail: 'Koyu ahşap · açık taş',
    options: {
      renk: 'ceviz',
      renk2: 'koyu-ceviz',
      iki: true,
      ral: '',
      malz: 'MDF-lam',
      yuzey: 'Mat',
      km: 'duz',
      govde: 'kapak',
      kulp: 'kenar-profil',
      krenk: 'siyah',
    },
    backdrop: 'stone',
  },
  {
    id: 'ivory',
    name: 'Sade fildişi',
    detail: 'Bütün yüzeylerde açık ton',
    options: {
      renk: 'fildisi',
      renk2: 'fildisi',
      iki: false,
      ral: '',
      malz: 'MDF-lam',
      yuzey: 'Mat',
      km: 'duz',
      govde: 'kapak',
      kulp: 'bas-ac',
      krenk: 'siyah',
    },
    backdrop: 'plain',
  },
  {
    id: 'graphite',
    name: 'Antrasit & meşe',
    detail: 'Mat koyu alt · doğal çıta',
    options: {
      renk: 'antrasit',
      renk2: 'acik-mese',
      iki: true,
      ral: '',
      malz: 'Lake',
      yuzey: 'Süper mat',
      km: 'duz',
      govde: 'kapak',
      kulp: 'gomme',
      krenk: 'siyah',
    },
    backdrop: 'slats',
  },
  {
    id: 'forest',
    name: 'Orman & ceviz',
    detail: 'Derin yeşil · bronz vitrin',
    options: {
      renk: 'orman',
      renk2: 'ceviz',
      iki: true,
      ral: '',
      malz: 'Lake',
      yuzey: 'Mat',
      km: 'duz',
      govde: 'kapak',
      kulp: 'kenar-profil',
      krenk: 'bronz',
    },
    backdrop: 'stone',
  },
  {
    id: 'sand',
    name: 'Kum minimal',
    detail: 'İnce düşey doku · açık panel',
    options: {
      renk: 'fildisi',
      renk2: 'acik-mese',
      iki: true,
      ral: '',
      malz: 'Lake',
      yuzey: 'Mat',
      km: 'fluted',
      govde: 'kapak',
      kulp: 'bas-ac',
      krenk: 'altin',
    },
    backdrop: 'plain',
  },
]
export function applyTvStyle(c: Config, id: string) {
  const style = tvStyles.find((style) => style.id === id)
  if (c.tvUnit && style) {
    Object.assign(c.o, style.options)
    c.tvUnit.backdrop = style.backdrop
  }
}
export function applyTvPreset(c: Config, preset: 'reference' | 'minimal' | 'cinema') {
  if (c.m !== 'tv') return
  const w =
    preset === 'cinema'
      ? [75, 75, 75, 75]
      : preset === 'minimal'
        ? [50, 50, 50, 50]
        : [60, 60, 60, 60]
  c.o.baza = 'asma'
  c.o.tv = preset === 'cinema' ? 85 : preset === 'minimal' ? 55 : 65
  c.o.acilim = 'mentese'
  c.o.led = ['alt', 'ic', 'raf']
  c.o.panel = true
  c.o.ust = true
  c.d = { w: sum(w), h: 45, d: 40 }
  c.tvUnit = defaultTvUnit()
  c.r.main = {
    w,
    lk: w.map(() => false),
    t: w.map(() => 'alt'),
    ay: w.map(() => false),
    g: w.map(() => ({ ...newCell(c.d.h), f: ['kapak'] })),
  }
  if (preset === 'minimal') {
    c.tvUnit.upper = { w: [200], lk: [false], t: ['tv'], glass: ['fume'], shelves: [3] }
    c.tvUnit.upperHeight = 130
  }
  if (preset === 'cinema') c.tvUnit.upper.w = [40, 220, 40]
  applyTvStyle(c, preset === 'cinema' ? 'walnut' : preset === 'minimal' ? 'sand' : 'cashmere')
  c.o.camc = 'bronz'
  assertTvFits(c)
}
export function setTvMount(c: Config, base: Options['baza']) {
  c.o.baza = base
  resize(c, 'h', c.d.h)
  assertTvFits(c)
}
