import {
  baseHeight,
  newCell,
  optionName,
  redistribute,
  resize,
  round,
  sum,
  syncKitchenRows,
  type Config,
} from './config'
import {
  createKitchenRow,
  kitchenKindNames,
  kitchenRowNames,
  type KitchenKind,
  type KitchenModules,
  type KitchenRow,
  type KitchenRowKey,
  type KitchenSelection,
} from './kitchenSchema'

export type KitchenOptions = NonNullable<Config['k']>
export const kitchenLayouts: { value: KitchenOptions['layout']; label: string; path: string }[] = [
  { value: 'straight', label: 'Düz mutfak', path: 'M5 10h30v8H5z' },
  { value: 'left', label: 'L · Sola dönüş', path: 'M5 7h30v7H12v19H5z' },
  { value: 'right', label: 'L · Sağa dönüş', path: 'M5 7h30v26h-7V14H5z' },
]
export type KitchenUnit = {
  x: number
  width: number
  section: number
  row: KitchenRowKey
  kind: KitchenKind
  glass: KitchenRow['glass'][number]
}
export function kitchenDefaults(): KitchenOptions {
  return {
    layout: 'straight',
    length: 240,
    upperHeight: 72,
    gap: 56,
    sink: true,
    hob: true,
    oven: true,
  }
}
export function kitchenHeight(c: Config) {
  return (
    c.d.h +
    (['yok', 'karar'].includes(c.o.tezgah) ? 0 : 4) +
    (c.o.ust && c.k ? c.k.gap + c.k.upperHeight : 0)
  )
}
function units(
  widths: number[],
  total: number,
  row: KitchenRowKey,
  kinds: KitchenKind[],
  glass: KitchenRow['glass'],
  start = 0,
  end = total,
): KitchenUnit[] {
  let offset = 0
  return widths.flatMap((width, section) => {
    const from = Math.max(start, offset),
      to = Math.min(end, offset + width)
    offset += width
    return to - from > 0.01
      ? [
          {
            x: (from + to) / 2 - total / 2,
            width: to - from,
            section,
            row,
            kind: kinds[section] ?? 'door',
            glass: glass[section] ?? 'fume',
          },
        ]
      : []
  })
}
/** All views and exports consume these same units, including clipped corner space. */
export function kitchenGeometry(c: Config) {
  const k = c.k ?? kitchenDefaults(),
    structure = k.modules
  const isL = k.layout !== 'straight'
  const clip = {
    start: isL && k.layout === 'left' ? c.d.d : 0,
    end: c.d.w - (isL && k.layout === 'right' ? c.d.d : 0),
  }
  const upperDepth = Math.min(35, c.d.d * 0.65)
  const modules = units(
    c.r.main.w,
    c.d.w,
    'lower',
    structure?.lower ?? c.r.main.g.map((g) => (g.f[0] === 'cekmece' ? 'drawers' : 'door')),
    [],
    clip.start,
    clip.end,
  )
  const upper = structure?.upper ?? createKitchenRow(c.r.main.w)
  const upperModules = c.o.ust
    ? units(upper.w, c.d.w, 'upper', upper.t, upper.glass, clip.start, clip.end)
    : []
  const returnWidth = isL ? k.length - c.d.d : 0
  const returnCount = isL ? (structure?.returnLower.w.length ?? Math.ceil(returnWidth / 60)) : 0
  const fallbackWidths = returnCount
    ? redistribute(Array(returnCount).fill(1), Array(returnCount).fill(false), returnWidth, 30)
    : []
  const returnRow = structure?.returnLower ?? createKitchenRow(fallbackWidths)
  const returnUpper = structure?.returnUpper ?? createKitchenRow(fallbackWidths)
  const returnModules = isL
    ? units(returnRow.w, returnWidth, 'returnLower', returnRow.t, returnRow.glass)
    : []
  const returnUpperModules =
    isL && c.o.ust
      ? units(returnUpper.w, returnWidth, 'returnUpper', returnUpper.t, returnUpper.glass)
      : []
  // In either L direction, return module 1 starts at the corner and the last ends at the free edge.
  if (k.layout === 'left')
    for (const unit of [...returnModules, ...returnUpperModules]) unit.x = -unit.x
  const allLower = [...modules, ...returnModules]
  const hasCounter = !['yok', 'karar'].includes(c.o.tezgah)
  const candidates = modules.filter((unit) => unit.width >= 50)
  const requestedHob = structure
    ? allLower.find(
        (unit) => unit.row === structure.hob?.row && unit.section === structure.hob?.index,
      )
    : candidates.length >= 2
      ? candidates[Math.min(1, candidates.length - 2)]
      : undefined
  const hob =
    hasCounter &&
    k.hob &&
    requestedHob &&
    requestedHob.width >= 50 &&
    !['sink', 'dishwasher'].includes(requestedHob.kind)
      ? requestedHob
      : undefined
  const requestedSink = structure
    ? allLower.find((unit) => unit.kind === 'sink')
    : [...candidates].reverse().find((unit) => unit !== hob)
  const sink =
    hasCounter && k.sink && requestedSink && requestedSink.width >= 50 ? requestedSink : undefined
  const requestedOven = structure ? allLower.find((unit) => unit.kind === 'oven') : hob
  const ovenUnit =
    k.oven && requestedOven && requestedOven.width >= 50 && c.d.h - baseHeight(c) >= 60
      ? requestedOven
      : undefined
  const dishwasher = allLower.find(
    (unit) => unit.kind === 'dishwasher' && unit.width >= 45 && c.d.h - baseHeight(c) >= 60,
  )
  if (!structure)
    upperModules.forEach((unit) => {
      if (hob && hob.row === 'lower' && unit.section === hob.section) unit.kind = 'hood'
    })
  for (const unit of allLower) {
    if (
      (unit.kind === 'sink' && unit !== sink) ||
      (unit.kind === 'oven' && unit !== ovenUnit) ||
      (unit.kind === 'dishwasher' && unit !== dishwasher)
    )
      unit.kind = 'door'
  }
  for (const unit of [...upperModules, ...returnUpperModules])
    if (unit.kind === 'hood' && unit.width < 50) unit.kind = 'door'
  return {
    modules,
    upperModules,
    returnModules,
    returnUpperModules,
    allLower,
    hob,
    sink,
    oven: Boolean(ovenUnit),
    ovenUnit,
    dishwasher,
    returnWidth,
    returnCount,
    upperDepth,
    base: baseHeight(c),
    height: kitchenHeight(c),
  }
}
export function ensureKitchenModules(c: Config): KitchenModules {
  if (!c.k) throw new Error('Önce mutfak yerleşimini seçin.')
  if (c.k.modules) return c.k.modules
  const g = kitchenGeometry(c)
  const count = Math.max(1, Math.ceil((c.k.length - c.d.d) / 60))
  const returnWidths = redistribute(
    Array(count).fill(1),
    Array(count).fill(false),
    c.k.length - c.d.d,
    30,
  )
  const lower: KitchenKind[] = c.r.main.g.map((cell) =>
    cell.f[0] === 'cekmece' ? 'drawers' : 'door',
  )
  if (g.sink) lower[g.sink.section] = 'sink'
  if (g.ovenUnit) lower[g.ovenUnit.section] = 'oven'
  const upper = createKitchenRow(c.r.main.w)
  if (g.hob) upper.t[g.hob.section] = 'hood'
  c.k.modules = {
    lower,
    upper,
    returnLower: createKitchenRow(returnWidths),
    returnUpper: createKitchenRow(returnWidths),
    hob: g.hob ? { row: 'lower', index: g.hob.section } : null,
  }
  return c.k.modules
}
export function kitchenRow(c: Config, key: KitchenRowKey): KitchenRow {
  const modules = c.k?.modules
  if (key === 'lower')
    return {
      w: c.r.main.w,
      lk: c.r.main.lk,
      t: modules?.lower ?? c.r.main.g.map((cell) => (cell.f[0] === 'cekmece' ? 'drawers' : 'door')),
      glass: c.r.main.w.map(() => 'fume'),
    }
  if (modules) return modules[key]
  if (key === 'upper') return createKitchenRow(c.r.main.w)
  const length = (c.k?.length ?? 240) - c.d.d,
    count = Math.max(1, Math.ceil(length / 60))
  return createKitchenRow(redistribute(Array(count).fill(1), Array(count).fill(false), length, 30))
}
export function setKitchenLength(c: Config, length: number) {
  if (!c.k) return
  c.k.length = length
  syncKitchenRows(c)
}
export function setKitchenCount(c: Config, key: KitchenRowKey, count: number) {
  const modules = ensureKitchenModules(c),
    current = kitchenRow(c, key)
  if (current.lk.some(Boolean))
    throw new Error('Bölme sayısını değiştirmek için genişlik kilitlerini açın.')
  const widths = redistribute(Array(count).fill(1), Array(count).fill(false), sum(current.w), 30)
  const row = createKitchenRow(
    widths,
    Array.from({ length: count }, (_, i) => current.t[i] ?? 'door'),
  )
  row.glass = Array.from({ length: count }, (_, i) => current.glass[i] ?? 'fume')
  if (key === 'lower') {
    c.r.main.w = row.w
    c.r.main.lk = row.lk
    c.r.main.t = widths.map(() => 'alt')
    c.r.main.ay = widths.map(() => false)
    c.r.main.g = Array.from(
      { length: count },
      (_, i) => c.r.main.g[i] ?? { ...newCell(c.d.h - baseHeight(c)), f: ['kapak'] },
    )
    modules.lower = row.t
  } else modules[key] = row
  if (modules.hob?.row === key && modules.hob.index >= count) modules.hob = null
}
export function setKitchenWidth(c: Config, key: KitchenRowKey, index: number, width: number) {
  ensureKitchenModules(c)
  const row = kitchenRow(c, key)
  if (row.lk[index]) throw new Error('Önce modülün genişlik kilidini açın.')
  const values = [...row.w]
  values[index] = width
  const result = redistribute(
    values,
    row.lk.map((locked, i) => locked || i === index),
    sum(row.w),
    30,
  )
  if (key === 'lower') c.r.main.w = result
  else if (c.k?.modules) c.k.modules[key].w = result
}
export function setKitchenKind(c: Config, key: KitchenRowKey, index: number, kind: KitchenKind) {
  const modules = ensureKitchenModules(c)
  if (kitchenRow(c, key).t[index] === kind) return
  if (['sink', 'oven', 'dishwasher'].includes(kind)) {
    modules.lower = modules.lower.map((value) => (value === kind ? 'door' : value))
    modules.returnLower.t = modules.returnLower.t.map((value) => (value === kind ? 'door' : value))
  }
  if (key === 'lower') {
    modules.lower[index] = kind
    if (kind === 'drawers') {
      const height = c.d.h - baseHeight(c)
      const heights = [round(height * 0.25), round(height * 0.375)]
      c.r.main.g[index] = {
        h: [...heights, round(height - sum(heights))],
        lk: [0, 0, 0],
        f: ['cekmece', 'cekmece', 'cekmece'],
        ic: ['bos', 'bos', 'bos'],
        rf: [0, 0, 0],
        ka: ['', '', ''],
      }
    } else
      c.r.main.g[index] = {
        ...newCell(c.d.h - baseHeight(c)),
        f: [kind === 'open' ? 'acik' : 'kapak'],
      }
  } else modules[key].t[index] = kind
  if (c.k) {
    if (kind === 'sink') c.k.sink = true
    if (kind === 'oven') c.k.oven = true
  }
  if (
    (kind === 'sink' || kind === 'dishwasher') &&
    modules.hob?.row === key &&
    modules.hob.index === index
  )
    modules.hob = null
}
export function kitchenSelectionUnit(c: Config, selection: KitchenSelection) {
  const g = kitchenGeometry(c)
  return [...g.modules, ...g.upperModules, ...g.returnModules, ...g.returnUpperModules].find(
    (unit) => unit.row === selection.row && unit.section === selection.index,
  )
}
export function normalizeKitchenSelection(
  c: Config,
  selection: KitchenSelection,
): KitchenSelection {
  let row = selection.row
  if (
    (row.startsWith('return') && c.k?.layout === 'straight') ||
    ((row === 'upper' || row === 'returnUpper') && !c.o.ust)
  )
    row = 'lower'
  return { row, index: Math.max(0, Math.min(selection.index, kitchenRow(c, row).w.length - 1)) }
}
export function kitchenCameraFocus(c: Config, selection: KitchenSelection) {
  const unit = kitchenSelectionUnit(c, selection)
  if (!unit || !c.k) return undefined
  const upper = unit.row === 'upper' || unit.row === 'returnUpper',
    returning = unit.row.startsWith('return')
  const depth = c.d.d / 100,
    upperDepth = Math.min(0.35, depth * 0.65),
    side = c.k.layout === 'left' ? -1 : 1
  const top = c.d.h / 100 + (['yok', 'karar'].includes(c.o.tezgah) ? 0 : 0.04)
  const y = upper ? top + c.k.gap / 100 + c.k.upperHeight / 200 : (c.d.h + baseHeight(c)) / 200
  const localZ = upper ? -(depth - upperDepth) / 2 : 0
  return {
    x: returning ? (side * (c.d.w / 100 - depth)) / 2 - side * localZ : unit.x / 100,
    y,
    z: returning ? depth / 2 + (c.k.length - c.d.d) / 200 + (side * unit.x) / 100 : localZ,
    width: Math.max(1.25, unit.width / 75),
    height: Math.max(1.1, (upper ? c.k.upperHeight : c.d.h) / 80),
  }
}
export function kitchenDescription(c: Config) {
  if (!c.k) return ''
  const k = c.k,
    g = kitchenGeometry(c)
  return [
    kitchenLayouts.find((layout) => layout.value === k.layout)?.label,
    `Ana duvar ${c.d.w} cm`,
    ...(k.layout !== 'straight'
      ? [`Dönüş duvarı ${k.length} cm (köşe dahil)`, `Dönüşte ${g.returnCount} modül`, 'Kör köşe']
      : []),
    `Alt dolap ${c.d.h} cm`,
    ...(c.o.ust
      ? [
          `Üst dolap ${k.upperHeight} cm`,
          `Tezgâh arası ${k.gap} cm`,
          `Toplam yükseklik ${kitchenHeight(c)} cm`,
        ]
      : ['Üst dolap yok']),
    ...(g.sink ? ['Evye ve batarya'] : []),
    ...(g.hob ? ['Ocak'] : []),
    ...(g.oven ? ['Ankastre fırın'] : []),
    ...(g.dishwasher ? ['Bulaşık makinesi'] : []),
    ...(g.upperModules.some((unit) => unit.kind === 'hood') ||
    g.returnUpperModules.some((unit) => unit.kind === 'hood')
      ? ['Davlumbaz']
      : []),
  ].join(' · ')
}
export function kitchenModuleDetails(c: Config): [string, string][] {
  const g = kitchenGeometry(c)
  const keys: KitchenRowKey[] = ['lower', 'upper', 'returnLower', 'returnUpper']
  return keys.flatMap((key) => {
    if (
      ((key === 'returnUpper' || key === 'upper') && !c.o.ust) ||
      (key.startsWith('return') && c.k?.layout === 'straight')
    )
      return []
    const list = [
      ...g.modules,
      ...g.upperModules,
      ...g.returnModules,
      ...g.returnUpperModules,
    ].filter((unit) => unit.row === key)
    return [
      [
        kitchenRowNames[key],
        list
          .map(
            (unit) =>
              `${unit.section + 1}) ${round(unit.width)} cm ${kitchenKindNames[unit.kind]}${unit.kind === 'glass' ? ` / ${optionName(unit.glass)}` : ''}${unit === g.hob ? ' / Ocak' : ''}`,
          )
          .join(' · '),
      ] satisfies [string, string],
    ]
  })
}
/** Explicit visitor choice; never imports company/CMS content. */
export function applyKitchenPreset(c: Config, preset: 'reference' | 'compact' | 'balanced') {
  if (c.m !== 'mutfak') return
  c.k ??= kitchenDefaults()
  const widths =
    preset === 'reference'
      ? [50, 60, 50, 80, 60]
      : preset === 'compact'
        ? [60, 60, 60, 60]
        : [60, 60, 60, 60, 60, 60]
  c.d.w = sum(widths)
  c.r.main = {
    w: widths,
    lk: widths.map(() => false),
    t: widths.map(() => 'alt'),
    ay: widths.map(() => false),
    g: widths.map(() => ({ ...newCell(c.d.h - baseHeight(c)), f: ['kapak'] })),
  }
  delete c.k.modules
  const modules = ensureKitchenModules(c)
  modules.lower = widths.map(() => 'door')
  setKitchenKind(c, 'lower', 0, 'drawers')
  setKitchenKind(c, 'lower', 1, 'oven')
  setKitchenKind(c, 'lower', widths.length - 2, 'sink')
  if (widths.length > 4) setKitchenKind(c, 'lower', widths.length - 1, 'dishwasher')
  modules.hob = { row: 'lower', index: 1 }
  modules.upper.t = widths.map((_, i) =>
    i === 1 ? 'hood' : i === 0 || i === widths.length - 1 ? 'glass' : 'door',
  )
  c.k.hob = true
  c.k.sink = true
  c.k.oven = true
  c.o.ust = true
  c.o.acilim = 'mentese'
  if (preset === 'reference') {
    c.o.renk = 'fildisi'
    c.o.ral = ''
    c.o.iki = false
    c.o.govde = 'beyaz'
    c.o.camc = 'bronz'
    c.o.malz = 'MDF-lam'
    c.o.yuzey = 'Mat'
    c.k.gap = 60
    c.r.main.lk = [false, true, false, true, true]
  }
  resize(c, 'h', c.d.h)
}
