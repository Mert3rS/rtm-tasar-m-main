import {
  baseHeight,
  newCell,
  optionName,
  palette,
  redistribute,
  resize,
  round,
  sum,
  type Config,
  type Options,
} from './config'
import {
  defaultWardrobe,
  wardrobeDoorNames,
  wardrobeLayoutNames,
  wardrobeMinimumHeight,
  type WardrobeOptions,
} from './wardrobeSchema'

export type WardrobeZone = {
  kind: 'rail' | 'shelves' | 'drawers' | 'trousers' | 'shoes'
  bottom: number
  height: number
  count: number
}
export type WardrobeUnit = {
  index: number
  x: number
  width: number
  bottom: number
  height: number
  zones: WardrobeZone[]
}
export function wardrobeMainHeight(c: Config) {
  return c.d.h - baseHeight(c) - (c.wardrobe?.loft ? c.wardrobe.loftHeight : 0)
}
export function wardrobeUnits(c: Config): WardrobeUnit[] {
  const wd = c.wardrobe
  if (!wd) return []
  const base = baseHeight(c),
    height = wardrobeMainHeight(c)
  let x = -c.d.w / 2
  return c.r.main.w.map((width, index) => {
    const center = x + width / 2
    x += width
    const zones: WardrobeZone[] = []
    const add = (kind: WardrobeZone['kind'], bottom: number, h: number, count = 1) =>
      zones.push({ kind, bottom, height: h, count })
    switch (wd.layouts[index]) {
      case 'long':
        add('shelves', base, 20, 0)
        add('rail', base + 20, height - 20)
        break
      case 'short':
        add('shelves', base, 30, 0)
        add('rail', base + 30, height - 60)
        add('shelves', base + height - 30, 30, 0)
        break
      case 'double':
        add('rail', base, height / 2)
        add('rail', base + height / 2, height / 2)
        break
      case 'drawers': {
        const drawers = wd.drawers[index] * 20
        add('drawers', base, drawers, wd.drawers[index])
        add('rail', base + drawers, height - drawers)
        break
      }
      case 'shelves':
        add('shelves', base, height, wd.shelves[index])
        break
      case 'trousers':
        add('trousers', base, 100)
        add('shelves', base + 100, height - 100, 2)
        break
      case 'shoes':
        add('shoes', base, height, wd.shelves[index])
        break
    }
    return { index, x: center, width, bottom: base, height, zones }
  })
}
export function assertWardrobeFits(c: Config) {
  const wd = c.wardrobe
  if (!wd) return
  const available = wardrobeMainHeight(c)
  const index = wd.layouts.findIndex(
    (layout, i) => available < wardrobeMinimumHeight(layout, wd.drawers[i]),
  )
  if (index >= 0)
    throw new Error(
      `${index + 1}. bölmedeki ${wardrobeLayoutNames[wd.layouts[index]].toLocaleLowerCase('tr-TR')} için en az ${wardrobeMinimumHeight(wd.layouts[index], wd.drawers[index])} cm net iç yükseklik gerekir. Üst depolamayı küçültün veya iç düzeni değiştirin.`,
    )
  if (c.r.main.w.some((width) => width < 45))
    throw new Error('Gardırop bölmeleri en az 45 cm olmalı.')
}
export function setWardrobeCount(c: Config, count: number) {
  const wd = c.wardrobe
  if (!wd) return
  if (c.r.main.lk.some(Boolean))
    throw new Error('Bölme sayısını değiştirmek için genişlik kilitlerini açın.')
  const widths = redistribute(Array(count).fill(1), Array(count).fill(false), c.d.w, 45)
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
  wd.layouts = Array.from({ length: count }, (_, i) => wd.layouts[i] ?? 'short')
  wd.doors = Array.from({ length: count }, (_, i) => wd.doors[i] ?? 'solid')
  wd.glass = Array.from({ length: count }, (_, i) => wd.glass[i] ?? 'fume')
  wd.shelves = Array.from({ length: count }, (_, i) => wd.shelves[i] ?? 4)
  wd.drawers = Array.from({ length: count }, (_, i) => wd.drawers[i] ?? 3)
  assertWardrobeFits(c)
}
export function setWardrobeWidth(c: Config, index: number, width: number) {
  if (c.r.main.lk[index]) throw new Error('Önce bölmenin genişlik kilidini açın.')
  const values = [...c.r.main.w]
  values[index] = width
  c.r.main.w = redistribute(
    values,
    c.r.main.lk.map((locked, i) => locked || i === index),
    c.d.w,
    45,
  )
}
export function setWardrobeLayout(
  c: Config,
  index: number,
  layout: WardrobeOptions['layouts'][number],
) {
  if (!c.wardrobe) return
  c.wardrobe.layouts[index] = layout
  assertWardrobeFits(c)
}
export function setWardrobeLoft(
  c: Config,
  enabled: boolean,
  height = c.wardrobe?.loftHeight ?? 40,
) {
  if (!c.wardrobe) return
  c.wardrobe.loft = enabled
  c.wardrobe.loftHeight = height
  assertWardrobeFits(c)
}
export function setWardrobeSystem(c: Config, system: 'mentese' | 'surgulu') {
  c.o.acilim = system
  if (system === 'surgulu') {
    if (c.d.d < 60) resize(c, 'd', 60)
    c.o.kulp = 'gomme'
  }
}
export function setSlidingCount(c: Config, count: number) {
  const wd = c.wardrobe
  if (!wd) return
  wd.slidingDoors = Array.from({ length: count }, (_, i) => wd.slidingDoors[i] ?? 'solid')
  wd.slidingGlass = Array.from({ length: count }, (_, i) => wd.slidingGlass[i] ?? 'fume')
}
export function wardrobeFocus(c: Config, selected: number) {
  const unit = wardrobeUnits(c)[selected]
  return unit
    ? {
        x: unit.x / 100,
        y: (unit.bottom + unit.height / 2) / 100,
        z: 0,
        width: Math.max(1.25, unit.width / 80),
        height: unit.height / 90,
      }
    : undefined
}
export function wardrobeSlidingPanels(c: Config) {
  const wd = c.wardrobe
  if (!wd) return []
  const count = wd.slidingDoors.length,
    width = c.d.w / 100
  const panelWidth = (width + (count - 1) * 0.025) / count,
    step = panelWidth - 0.025
  const left = -width / 2 + panelWidth / 2,
    right = width / 2 - panelWidth / 2
  return wd.slidingDoors.map((door, index) => {
    const x = left + index * step
    let edge = -c.d.w / 2
    const bay = c.r.main.w.findIndex((w) => {
      edge += w
      return x * 100 <= edge
    })
    return {
      index,
      door,
      glass: wd.slidingGlass[index],
      x,
      width: panelWidth,
      zOffset: -0.07 + index * 0.018,
      stackX: left,
      localX: index === 0 ? Math.min(right, x + step) : Math.max(left, x - step),
      bay: Math.max(0, bay),
    }
  })
}
export function wardrobeDetails(c: Config): [string, string][] {
  const wd = c.wardrobe
  if (!wd) return []
  return [
    [
      'Gardırop sistemi',
      `${c.o.acilim === 'surgulu' ? `${wd.slidingDoors.length} panelli sürgülü` : 'Menteşeli'} · ${wd.loft ? `${wd.loftHeight} cm üst depolama` : 'Üst depolama bölmesi yok'} · Net ana bölüm ${round(wardrobeMainHeight(c))} cm`,
    ],
    [
      'Gardırop bölmeleri',
      wardrobeUnits(c)
        .map(
          (unit) =>
            `${unit.index + 1}) ${round(unit.width)} cm · ${wardrobeLayoutNames[wd.layouts[unit.index]]}${wd.layouts[unit.index] === 'drawers' ? ` / ${wd.drawers[unit.index]} iç çekmece` : ['shelves', 'shoes'].includes(wd.layouts[unit.index]) ? ` / ${wd.shelves[unit.index]} raf` : ''}${c.o.acilim === 'mentese' ? ` / ${wardrobeDoorNames[wd.doors[unit.index]]}${wd.doors[unit.index] === 'glass' ? ` / ${optionName(wd.glass[unit.index])}` : ''}` : ''}`,
        )
        .join(' · '),
    ],
    ...(c.o.acilim === 'surgulu'
      ? [
          [
            'Sürgü panelleri',
            wd.slidingDoors
              .map(
                (door, index) =>
                  `${index + 1}) ${wardrobeDoorNames[door]}${door === 'glass' ? ` / ${optionName(wd.slidingGlass[index])}` : ''}`,
              )
              .join(' · '),
          ] satisfies [string, string],
        ]
      : []),
  ]
}
type WardrobeStyle = {
  id: string
  name: string
  detail: string
  options: Partial<Options>
  door?: 'mirror' | 'glass'
}
export const wardrobeStyles: WardrobeStyle[] = [
  {
    id: 'ivory',
    name: 'İnci fildişi',
    detail: 'Sade kapak · siyah uzun kulp',
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
    name: 'Meşe & kaşmir',
    detail: 'Sıcak ahşap · iki renk',
    options: {
      renk: 'mese',
      renk2: 'kasmir',
      iki: true,
      ral: '',
      malz: 'MDF-lam',
      yuzey: 'Dokulu',
      km: 'duz',
      govde: 'ahsap',
      kulp: 'kenar-profil',
      krenk: 'bronz',
    },
  },
  {
    id: 'mirror',
    name: 'Aynalı antrasit',
    detail: 'Süper mat · ayna vurgusu',
    options: {
      renk: 'antrasit',
      renk2: 'antrasit',
      iki: false,
      ral: '',
      malz: 'Lake',
      yuzey: 'Süper mat',
      km: 'duz',
      govde: 'antrasit',
      kulp: 'gomme',
      krenk: 'inox',
    },
    door: 'mirror',
  },
  {
    id: 'sage',
    name: 'Mat adaçayı',
    detail: 'Çerçeveli lake · bronz kulp',
    options: {
      renk: 'adacayi',
      renk2: 'krem',
      iki: false,
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
    id: 'glass',
    name: 'Işıklı vitrin',
    detail: 'Kaşmir · bronz çerçeve',
    options: {
      renk: 'kasmir',
      renk2: 'fildisi',
      iki: true,
      ral: '',
      malz: 'Lake',
      yuzey: 'Mat',
      km: 'duz',
      govde: 'ahsap',
      kulp: 'kenar-profil',
      krenk: 'bronz',
      camc: 'bronz',
    },
    door: 'glass',
  },
  {
    id: 'navy',
    name: 'Gece mavisi',
    detail: 'Düz kapak · ince profil',
    options: {
      renk: 'gece-mavisi',
      renk2: 'fildisi',
      iki: true,
      ral: '',
      malz: 'Lake',
      yuzey: 'Mat',
      km: 'duz',
      govde: 'beyaz',
      kulp: 'kenar-profil',
      krenk: 'inox',
    },
  },
]
export function applyWardrobeStyle(c: Config, id: string) {
  const style = wardrobeStyles.find((value) => value.id === id),
    wd = c.wardrobe
  if (!style || !wd) return
  Object.assign(c.o, style.options)
  if (c.o.acilim === 'surgulu' && !['gomme', 'kenar-profil', 'yok'].includes(c.o.kulp))
    c.o.kulp = 'gomme'
  if (style.door) {
    wd.doors[wd.doors.length - 1] = style.door
    wd.slidingDoors[wd.slidingDoors.length - 1] = style.door
    if (style.door === 'glass') c.o.led = Array.from(new Set([...c.o.led, 'ic']))
  }
}
export function applyWardrobePreset(c: Config, preset: 'reference' | 'compact' | 'showcase') {
  if (c.m !== 'gardirop') return
  const widths =
    preset === 'showcase' ? [75, 75, 75, 75] : preset === 'compact' ? [80, 80] : [100, 100]
  c.d = { w: sum(widths), h: 240, d: 60 }
  c.r.main = {
    w: widths,
    lk: widths.map(() => false),
    t: widths.map(() => 'kolon'),
    ay: widths.map(() => false),
    g: widths.map(() => ({ ...newCell(230), f: ['kapak'], ic: ['aski'] })),
  }
  c.wardrobe = defaultWardrobe()
  c.o.baza = 'b10'
  c.o.acilim = 'mentese'
  c.o.ust = false
  c.o.led = ['ic']
  setWardrobeCount(c, widths.length)
  c.wardrobe.layouts =
    preset === 'reference'
      ? ['short', 'short']
      : preset === 'compact'
        ? ['double', 'shelves']
        : ['long', 'double', 'drawers', 'shelves']
  applyWardrobeStyle(c, preset === 'showcase' ? 'glass' : 'ivory')
  assertWardrobeFits(c)
}
export function wardrobeStyleColors(c: Config) {
  return [palette[c.o.renk].name, ...(c.o.iki ? [palette[c.o.renk2].name] : [])].join(' / ')
}
