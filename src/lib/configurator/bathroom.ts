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
  bathroomFitError,
  bathroomKindNames,
  defaultBathroom,
  defaultBathroomSideCabinet,
  bathroomSideSchema,
  type BathroomSideCabinet,
  type BathroomOptions,
  type BathroomSelection,
} from './bathroomSchema'

export type BathroomUnit = {
  row: BathroomSelection['row']
  index: number
  x: number
  width: number
  bottom: number
  height: number
  depth: number
  z: number
  kind: BathroomOptions['lower'][number] | BathroomOptions['upper']['t'][number]
  shelves: number
  drawers: number
  glass: BathroomOptions['upper']['glass'][number]
}
export function bathroomSideOptions(c: Config) {
  const raw = c.bathroom?.sideCabinet ?? defaultBathroomSideCabinet()
  return {
    ...raw,
    enabled: raw.enabled ?? Boolean(c.bathroom?.sideCabinet),
    side: raw.side ?? 'right',
    floorGap: raw.floorGap ?? (c.o.baza === 'asma' ? (c.bathroom?.floorGap ?? 35) : 0),
    alignment: raw.alignment ?? 'back',
    interior: raw.interior ?? { h: [raw.height], t: ['door'], shelves: [3], drawers: [2] },
  } satisfies BathroomSideCabinet
}
function editableSide(c: Config) {
  if (!c.bathroom) throw new Error('Önce bir banyo başlangıcı seçin.')
  const side = bathroomSideOptions(c)
  c.bathroom.sideCabinet = side
  return side
}
function saveSide(c: Config, value: BathroomSideCabinet) {
  if (c.bathroom) c.bathroom.sideCabinet = bathroomSideSchema.parse(value)
}
export function setBathroomSideOption<K extends keyof BathroomSideCabinet>(c: Config, key: K, value: BathroomSideCabinet[K]) {
  const side = editableSide(c)
  saveSide(c, { ...side, [key]: value })
}
function sideMinimum(kind: BathroomUnit['kind'], drawers: number, shelves: number) {
  return kind === 'drawers' ? drawers * 12 + 4 : Math.max(18, (shelves + 1) * 8 + 4)
}
function fitSideHeights(heights: number[], minimums: number[], total: number) {
  const remaining = total - sum(minimums)
  if (remaining < -0.011) throw new Error('Boy dolabı gözleri için yükseklik yetersiz. Göz veya raf sayısını azaltın.')
  const weights = heights.map((height, i) => Math.max(0, height - minimums[i]))
  const weight = sum(weights)
  const result = minimums.map((minimum, i) => round(minimum + Math.max(0, remaining) * (weight ? weights[i] / weight : 1 / heights.length)))
  result[result.length - 1] = round(total - sum(result.slice(0, -1)))
  return result
}
export function setBathroomSideDimension(c: Config, key: 'width' | 'height' | 'depth' | 'gap' | 'floorGap', value: number) {
  const side = editableSide(c)
  if (key === 'height') side.interior.h = fitSideHeights(side.interior.h, side.interior.t.map((kind, i) => sideMinimum(kind, side.interior.drawers[i], side.interior.shelves[i])), value)
  saveSide(c, { ...side, [key]: value })
}
export function setBathroomSideCount(c: Config, count: number) {
  if (!Number.isInteger(count) || count < 1 || count > 6) throw new Error('Boy dolabında 1–6 göz seçin.')
  const side = editableSide(c), old = side.interior
  const t = Array.from({ length: count }, (_, i) => old.t[i] ?? 'door')
  const shelves = t.map((_, i) => old.shelves[i] ?? 0)
  const drawers = t.map((_, i) => old.drawers[i] ?? 2)
  // New eyes have no shelves; existing shelf choices remain intact.
  const h = fitSideHeights(t.map(() => side.height / count), t.map((kind, i) => sideMinimum(kind, drawers[i], shelves[i])), side.height)
  saveSide(c, { ...side, interior: { h, t, shelves, drawers } })
}
export function setBathroomSideCellHeight(c: Config, index: number, height: number) {
  const side = editableSide(c), row = side.interior
  if (index < 0 || index >= row.h.length) throw new Error('Boy dolabı gözü bulunamadı.')
  const minimums = row.t.map((kind, i) => sideMinimum(kind, row.drawers[i], row.shelves[i]))
  if (height < minimums[index]) throw new Error('Bu gözde raf veya çekmece için yeterli yükseklik bırakın.')
  if (row.h.length === 1) {
    setBathroomSideDimension(c, 'height', height)
    return
  }
  const others = fitSideHeights(row.h.filter((_, i) => i !== index), minimums.filter((_, i) => i !== index), round(side.height - height))
  let next = 0
  row.h = row.h.map((_, i) => i === index ? height : others[next++])
  saveSide(c, side)
}
export function setBathroomSideCell(c: Config, index: number, patch: { kind?: 'door' | 'drawers' | 'open'; shelves?: number; drawers?: number }) {
  const side = editableSide(c), row = side.interior
  if (index < 0 || index >= row.h.length) throw new Error('Boy dolabı gözü bulunamadı.')
  if (patch.kind !== undefined) row.t[index] = patch.kind
  if (patch.shelves !== undefined) row.shelves[index] = patch.shelves
  if (patch.drawers !== undefined) row.drawers[index] = patch.drawers
  saveSide(c, side)
}
export function bathroomBasinSize(c: Config, unit: BathroomUnit) {
  const rounded = c.bathroom?.basin === 'round'
  const width = Math.min(rounded ? 40 : 54, unit.width - 12),
    depth = Math.min(rounded ? 40 : 34, c.d.d - 14)
  return { width: rounded ? Math.min(width, depth) : width, depth, z: 2 }
}
export function bathroomGeometry(c: Config) {
  const b = c.bathroom,
    offset = c.o.baza === 'asma' ? (b?.floorGap ?? 35) : 0
  const counter = offset + c.d.h,
    lower: BathroomUnit[] = [],
    upper: BathroomUnit[] = []
  if (b) {
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
        kind: b.lower[index],
        drawers: b.drawers[index],
        shelves: b.shelves[index],
        glass: 'fume',
      })
      edge += width
    })
    edge = -c.d.w / 2
    b.upper.w.forEach((width, index) => {
      upper.push({
        row: 'upper',
        index,
        x: edge + width / 2,
        width,
        bottom: counter + b.gap,
        height: b.upperHeight,
        depth: b.upperDepth,
        z: -c.d.d / 2 + b.upperDepth / 2,
        kind: b.upper.t[index],
        drawers: 0,
        shelves: b.upper.shelves[index],
        glass: b.upper.glass[index],
      })
      edge += width
    })
  }
  const sideOptions = bathroomSideOptions(c)
  const sideCabinet: BathroomUnit | undefined = b && sideOptions.enabled
    ? {
        row: 'side', index: 0, kind: 'door',
        x: (sideOptions.side === 'left' ? -1 : 1) * (c.d.w / 2 + sideOptions.gap + sideOptions.width / 2),
        width: sideOptions.width, height: sideOptions.height,
        depth: sideOptions.depth, bottom: sideOptions.floorGap,
        z: (sideOptions.alignment === 'front' ? 1 : -1) * (c.d.d - sideOptions.depth) / 2,
        shelves: 3, drawers: 0, glass: 'fume',
      }
    : undefined
  let bottom = sideOptions.floorGap
  const side: BathroomUnit[] = sideCabinet ? sideOptions.interior.h.map((height, index) => {
    const unit: BathroomUnit = { ...sideCabinet, index, bottom, height, kind: sideOptions.interior.t[index], shelves: sideOptions.interior.shelves[index], drawers: sideOptions.interior.drawers[index] }
    bottom += height
    return unit
  }) : []
  const extra = sideCabinet ? sideOptions.gap + sideOptions.width : 0
  const totalWidth = c.d.w + extra
  return {
    lower,
    upper,
    side,
    sideCabinet,
    totalWidth,
    centerX: (sideOptions.side === 'left' ? -extra : extra) / 2,
    left: -c.d.w / 2 - (sideOptions.side === 'left' ? extra : 0),
    offset,
    counter,
    top: Math.max(counter + (b?.gap ?? 0) + (b?.upperHeight ?? 0), sideCabinet ? sideCabinet.bottom + sideCabinet.height : 0),
    sinks: lower.filter((unit) => unit.kind === 'sink').map((unit) =>
      b?.sideCabinet && b.lower.filter((kind) => kind === 'sink').length === 1 ? { ...unit, x: 0 } : unit,
    ),
  }
}
export function normalizeBathroomSelection(
  c: Config,
  selection: BathroomSelection,
): BathroomSelection {
  const row = selection.row === 'side' && bathroomSideOptions(c).enabled ? 'side' : selection.row === 'upper' && c.bathroom?.upperEnabled ? 'upper' : 'lower'
  return {
    row,
    index: Math.max(
      0,
      Math.min(
        selection.index,
        (row === 'side' ? bathroomSideOptions(c).interior.h.length : row === 'lower' ? c.r.main.w.length : (c.bathroom?.upper.w.length ?? 1)) - 1,
      ),
    ),
  }
}
export function assertBathroomFits(c: Config) {
  if (!c.bathroom) return
  const error = bathroomFitError(
    c.bathroom,
    c.r.main.w,
    c.d.h,
    c.d.d,
    baseHeight(c),
    c.o.baza === 'asma',
  )
  if (error) throw new Error(error)
}
export function setBathroomCount(c: Config, row: BathroomSelection['row'], count: number) {
  if (row === 'side') return setBathroomSideCount(c, count)
  const b = c.bathroom
  if (!b) return
  const source = row === 'lower' ? c.r.main : b.upper
  if (source.lk.some(Boolean))
    throw new Error('Bölme sayısını değiştirmek için ölçü kilitlerini açın.')
  if (row === 'lower' && count < b.lower.filter((kind) => kind === 'sink').length)
    throw new Error('Önce kaldırılacak lavaboyu başka bir bölme tipine çevirin.')
  const minima = Array.from({ length: count }, (_, i) =>
    row === 'lower' && b.lower[i] === 'sink'
      ? 55
      : row === 'lower' && b.lower[i] === 'washer'
        ? 60
        : 30,
  )
  const remaining = c.d.w - sum(minima)
  if (remaining < 0) throw new Error('Yeni bölmeler için yeterli genişlik yok.')
  const w = minima.map((minimum) => round(minimum + remaining / count))
  w[w.length - 1] = round(c.d.w - sum(w.slice(0, -1)))
  if (row === 'lower') {
    c.r.main = {
      w,
      lk: w.map(() => false),
      t: w.map(() => 'alt'),
      ay: w.map(() => false),
      g: w.map(() => ({ ...newCell(c.d.h - baseHeight(c)), f: ['kapak'] })),
    }
    b.lower = w.map((_, i) => b.lower[i] ?? 'drawers')
    b.drawers = w.map((_, i) => b.drawers[i] ?? 2)
    b.shelves = w.map((_, i) => b.shelves[i] ?? 1)
    if (!b.lower.includes('sink')) b.lower[0] = 'sink'
  } else
    b.upper = {
      w,
      lk: w.map(() => false),
      t: w.map((_, i) => b.upper.t[i] ?? 'mirror'),
      glass: w.map((_, i) => b.upper.glass[i] ?? 'fume'),
      shelves: w.map((_, i) => b.upper.shelves[i] ?? 2),
    }
  assertBathroomFits(c)
}
export function setBathroomWidth(c: Config, selection: BathroomSelection, width: number) {
  if (selection.row === 'side') return setBathroomSideDimension(c, 'width', width)
  if (!c.bathroom) return
  const row = selection.row === 'lower' ? c.r.main : c.bathroom.upper
  if (row.lk[selection.index]) throw new Error('Önce bölme kilidini açın.')
  const values = [...row.w]
  values[selection.index] = width
  const minimums = values.map((_, i) =>
    selection.row === 'lower' && c.bathroom?.lower[i] === 'sink'
      ? 55
      : selection.row === 'lower' && c.bathroom?.lower[i] === 'washer'
        ? 60
        : 30,
  )
  row.w = redistribute(
    values,
    row.lk.map((locked, i) => locked || i === selection.index),
    c.d.w,
    30,
  )
  if (row.w.some((value, i) => value < minimums[i]))
    throw new Error('Seçili cihaz ve lavabo için diğer bölmelerde yeterli alan bırakın.')
  assertBathroomFits(c)
}
export function setBathroomKind(
  c: Config,
  selection: BathroomSelection,
  kind: BathroomUnit['kind'],
) {
  const b = c.bathroom
  if (!b) return
  if (selection.row === 'side') {
    if (kind === 'door' || kind === 'drawers' || kind === 'open') setBathroomSideCell(c, selection.index, { kind })
    return
  }
  if (selection.row === 'lower') {
    if (!['sink', 'drawers', 'door', 'open', 'washer'].includes(kind)) return
    if (
      kind === 'sink' ||
      kind === 'drawers' ||
      kind === 'door' ||
      kind === 'open' ||
      kind === 'washer'
    )
      b.lower[selection.index] = kind
    if (kind === 'washer') {
      c.o.baza = 'b0'
      resize(c, 'h', 88)
      resize(c, 'd', 60)
    }
  } else if (kind === 'mirror' || kind === 'door' || kind === 'glass' || kind === 'open')
    b.upper.t[selection.index] = kind
  assertBathroomFits(c)
}
export function setBathroomOption<K extends keyof BathroomOptions>(
  c: Config,
  key: K,
  value: BathroomOptions[K],
) {
  if (c.bathroom) {
    c.bathroom[key] = value
    assertBathroomFits(c)
  }
}
export function setBathroomMount(c: Config, floating: boolean) {
  c.o.baza = floating ? 'asma' : 'b10'
  resize(c, 'h', floating ? 50 : 85)
  assertBathroomFits(c)
}
export function bathroomFocus(c: Config, selection: BathroomSelection) {
  const g = bathroomGeometry(c),
    unit = g[selection.row][selection.index]
  return unit
    ? {
        x: unit.x / 100,
        y: (unit.bottom + unit.height / 2) / 100,
        z: unit.z / 100,
        width: Math.max(1.25, unit.width / 80),
        height: Math.max(1, unit.height / 80),
      }
    : undefined
}
export const basinNames = {
  inset: 'Tezgâha gömme lavabo',
  vessel: 'Tezgâh üstü oval lavabo',
  round: 'Tezgâh üstü yuvarlak lavabo',
}
export function bathroomDetails(c: Config): [string, string][] {
  const b = c.bathroom
  if (!b) return []
  const g = bathroomGeometry(c)
  return [
    [
      'Banyo yerleşimi',
      `${g.sinks.length} lavabo · ${c.o.baza === 'asma' ? `Asma dolap / yerden ${b.floorGap} cm` : 'Zemine oturan dolap'} · Tezgâh üst kotu ${round(g.counter)} cm · ${b.upperEnabled ? `${b.upper.w.length} üst dolap` : `${b.mirrorShape === 'round' ? 'Yuvarlak' : b.mirrorShape === 'capsule' ? 'Kapsül' : 'Dikdörtgen'} duvar aynası`}`,
    ],
    [
      'Lavabo',
      `${basinNames[b.basin]} · ${b.sinkFront === 'drawers' ? 'Lavabo altı çekmeceli' : 'Lavabo altı kapaklı'} · Batarya ${optionName(c.o.krenk)}`,
    ],
    [
      'Alt dolaplar',
      g.lower
        .map(
          (unit) =>
            `${unit.index + 1}) ${unit.width} cm ${bathroomKindNames[unit.kind]}${unit.kind === 'drawers' || (unit.kind === 'sink' && b.sinkFront === 'drawers') ? ` / ${unit.drawers} çekmece` : unit.kind === 'door' || unit.kind === 'open' ? ` / ${unit.shelves} raf` : ''}`,
        )
        .join(' · '),
    ],
    ...(b.upperEnabled
      ? ([
          [
            'Üst dolaplar',
            g.upper
              .map(
                (unit) =>
                  `${unit.index + 1}) ${unit.width} cm ${unit.kind === 'door' ? 'Kapaklı dolap' : unit.kind === 'open' ? 'Açık raf' : bathroomKindNames[unit.kind]} / ${unit.shelves} raf${unit.kind === 'glass' ? ` / ${optionName(unit.glass)}` : ''}`,
              )
              .join(' · '),
          ],
          [
            'Üst ölçüler',
            `Yükseklik ${b.upperHeight} cm / derinlik ${b.upperDepth} cm / tezgâh arası ${b.gap} cm · Toplam üst kot ${g.top} cm`,
          ],
        ] satisfies [string, string][])
      : []),
    ...(g.sideCabinet ? ([
      ['Boy dolabı', `${g.sideCabinet.width} × ${g.sideCabinet.height} × ${g.sideCabinet.depth} cm · ${bathroomSideOptions(c).side === 'left' ? 'Solda' : 'Sağda'} / ${b.sideCabinet?.gap} cm ara · Yerden ${g.sideCabinet.bottom} cm · ${bathroomSideOptions(c).alignment === 'front' ? 'Tezgâhın ön kenarına hizalı' : 'Duvara hizalı'} · Toplam yerleşim genişliği ${g.totalWidth} cm`],
      ['Boy dolabı gözleri', g.side.map((unit) => `${unit.index + 1}) ${unit.height} cm ${bathroomKindNames[unit.kind]} / ${unit.kind === 'drawers' ? `${unit.drawers} çekmece` : `${unit.shelves} raf`}`).join(' · ')],
      ['Boy dolabı malzemesi', `${b.sideCabinet?.finish?.malz ?? c.o.malz} · ${b.sideCabinet?.finish?.yuzey ?? c.o.yuzey} · ${palette[b.sideCabinet?.finish?.renk ?? c.o.renk].name}${b.sideCabinet?.finish?.ral ? ` / ${b.sideCabinet.finish.ral}` : ''}`],
    ] satisfies [string, string][]) : []),
    [
      'Banyo detayları',
      `${b.mirrorLed ? 'Ayna çevresi LED' : 'Ayna LED yok'} · ${b.splashback ? 'Tezgâh arkası panel' : 'Arka panel yok'} · ${b.towelRail ? 'Havluluk' : 'Havluluk yok'}`,
    ],
  ]
}
type BathroomStyle = { id: string; name: string; detail: string; options: Partial<Options> }
export const bathroomStyles: BathroomStyle[] = [
  {
    id: 'oak',
    name: 'Meşe & seramik',
    detail: 'Dikey doku · açık üst dolap',
    options: {
      renk: 'acik-mese',
      renk2: 'fildisi',
      iki: true,
      ral: '',
      malz: 'MDF-lam',
      yuzey: 'Mat',
      km: 'fluted',
      govde: 'kapak',
      kulp: 'kenar-profil',
      krenk: 'siyah',
      tezgah: 'porselen',
    },
  },
  {
    id: 'ivory',
    name: 'Sade fildişi',
    detail: 'Sakin yüzey · ince siyah detay',
    options: {
      renk: 'fildisi',
      renk2: 'fildisi',
      iki: false,
      ral: '',
      malz: 'Lake',
      yuzey: 'Mat',
      km: 'duz',
      govde: 'kapak',
      kulp: 'cubuk',
      krenk: 'siyah',
      tezgah: 'kuvars',
    },
  },
  {
    id: 'sage',
    name: 'Adaçayı spa',
    detail: 'Yumuşak yeşil · bronz batarya',
    options: {
      renk: 'adacayi',
      renk2: 'acik-mese',
      iki: true,
      ral: '',
      malz: 'Lake',
      yuzey: 'Süper mat',
      km: 'duz',
      govde: 'kapak',
      kulp: 'gomme',
      krenk: 'bronz',
      tezgah: 'porselen',
    },
  },
  {
    id: 'walnut',
    name: 'Ceviz & taş',
    detail: 'Sıcak ahşap · açık taş',
    options: {
      renk: 'ceviz',
      renk2: 'kasmir',
      iki: true,
      ral: '',
      malz: 'MDF-lam',
      yuzey: 'Mat',
      km: 'duz',
      govde: 'kapak',
      kulp: 'bas-ac',
      krenk: 'altin',
      tezgah: 'kuvars',
    },
  },
  {
    id: 'graphite',
    name: 'Antrasit zarafet',
    detail: 'Koyu yüzey · ince metal',
    options: {
      renk: 'antrasit',
      renk2: 'antrasit',
      iki: false,
      ral: '',
      malz: 'Lake',
      yuzey: 'Mat',
      km: 'fluted',
      govde: 'kapak',
      kulp: 'kenar-profil',
      krenk: 'inox',
      tezgah: 'compact',
    },
  },
  {
    id: 'cashmere',
    name: 'Kaşmir & bronz',
    detail: 'Mat lake · yumuşak ton',
    options: {
      renk: 'kasmir',
      renk2: 'fildisi',
      iki: true,
      ral: '',
      malz: 'Lake',
      yuzey: 'Süper mat',
      km: 'cerceveli',
      govde: 'kapak',
      kulp: 'dugme',
      krenk: 'bronz',
      tezgah: 'porselen',
    },
  },
]
export function applyBathroomStyle(c: Config, id: string) {
  const style = bathroomStyles.find((style) => style.id === id)
  if (c.bathroom && style) Object.assign(c.o, style.options)
}
export function applyBathroomPreset(c: Config, preset: 'reference' | 'compact' | 'double') {
  if (c.m !== 'banyo') return
  const widths = preset === 'double' ? [80, 80] : preset === 'compact' ? [80] : [68, 32]
  c.d = { w: sum(widths), h: 50, d: preset === 'compact' ? 45 : 52 }
  c.o.baza = 'asma'
  c.o.acilim = 'mentese'
  c.o.ust = true
  c.o.led = ['alt', 'ic']
  c.r.main = {
    w: widths,
    lk: widths.map(() => false),
    t: widths.map(() => 'alt'),
    ay: widths.map(() => false),
    g: widths.map(() => ({ ...newCell(c.d.h), f: ['kapak'] })),
  }
  c.bathroom = defaultBathroom()
  c.bathroom.lower = widths.map(() => 'sink')
  c.bathroom.drawers = widths.map(() => 2)
  c.bathroom.shelves = widths.map(() => 1)
  const upperWidths = preset === 'compact' ? [80] : preset === 'reference' ? [50, 50] : widths
  c.bathroom.upper = {
    w: upperWidths,
    lk: upperWidths.map(() => false),
    t: upperWidths.map((_, index) =>
      preset === 'reference' && index === upperWidths.length - 1 ? 'glass' : 'mirror',
    ),
    glass: upperWidths.map(() => 'fume'),
    shelves: upperWidths.map((_, index) =>
      preset === 'reference' && index === upperWidths.length - 1 ? 1 : 2,
    ),
  }
  if (preset === 'double') c.bathroom.basin = 'round'
  if (preset === 'compact') c.bathroom.basin = 'inset'
  c.o.camc = 'bronz'
  applyBathroomStyle(c, preset === 'reference' ? 'oak' : preset === 'double' ? 'walnut' : 'ivory')
  if (preset === 'reference') {
    c.bathroom.lower = ['sink', 'open']
    c.bathroom.sinkFront = 'doors'
    c.bathroom.upperEnabled = false
    c.bathroom.mirrorShape = 'round'
    c.bathroom.mirrorLed = false
    c.bathroom.splashback = false
    c.bathroom.towelRail = false
    c.bathroom.sideCabinet = { width: 42, height: 140, depth: 30, gap: 20 }
    Object.assign(c.o, { renk: 'antrasit', renk2: 'acik-mese', iki: false, km: 'duz', govde: 'ahsap', kulp: 'bas-ac', tezgah: 'laminat', led: [], ust: false })
  }
  assertBathroomFits(c)
}
