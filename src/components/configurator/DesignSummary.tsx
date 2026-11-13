'use client'

import {
  frontNames,
  interiorNames,
  optionName,
  palette,
  productNames,
  round,
  type Config,
} from '@/lib/configurator/config'
import { kitchenDescription, kitchenGeometry } from '@/lib/configurator/kitchen'
import { kitchenKindNames, kitchenRowNames, type KitchenSelection } from '@/lib/configurator/kitchenSchema'
import { tvDetails, tvGeometry } from '@/lib/configurator/tv'
import { tvKindNames, type TvSelection } from '@/lib/configurator/tvSchema'
import { bathroomDetails, bathroomGeometry } from '@/lib/configurator/bathroom'
import { bathroomKindNames, type BathroomSelection } from '@/lib/configurator/bathroomSchema'
import { entrywayDetails, entrywayUnits } from '@/lib/configurator/entryway'
import { entrywayFrontNames, entrywayLayoutNames } from '@/lib/configurator/entrywaySchema'
import { wardrobeDetails, wardrobeUnits } from '@/lib/configurator/wardrobe'
import { wardrobeDoorNames, wardrobeLayoutNames } from '@/lib/configurator/wardrobeSchema'

function TvSummary({ config: c, selection, onSelect }: { config: Config; selection?: TvSelection; onSelect?: (selection: TvSelection) => void }) {
  const g = tvGeometry(c)
  return <>{(['lower', 'upper'] as const).map((row) => <div className="dc-summary-section" key={row}><h3>{row === 'lower' ? 'Alt TV ünitesi' : 'Üst TV bölümleri'}</h3><p className="dc-summary-help">{g[row].length} bölme · Düzenlemek istediğiniz bölmeyi seçin.</p>{g[row].map((unit) => <button type="button" key={unit.index} aria-pressed={selection?.row === row && selection.index === unit.index} onClick={() => onSelect?.({ row, index: unit.index })}><span>{unit.index + 1}. bölme<small>{tvKindNames[unit.kind]}</small><small>Gövde yüksekliği {round(unit.height)} cm · Derinlik {unit.depth} cm{unit.kind === 'drawers' ? ` · ${unit.drawers} çekmece` : unit.kind === 'door' || unit.kind === 'glass' || unit.kind === 'open' ? ` · ${unit.shelves} raf` : ''}</small></span><span><strong>{unit.width} cm</strong><small>Genişlik</small></span></button>)}</div>)}</>
}

function BathroomSummary({ config: c, selection, onSelect }: { config: Config; selection?: BathroomSelection; onSelect?: (selection: BathroomSelection) => void }) {
  const g = bathroomGeometry(c)
  return <>
    {(['lower', ...(c.bathroom?.upperEnabled ? ['upper' as const] : [])] satisfies BathroomSelection['row'][]).map((row) => <div className="dc-summary-section" key={row}><h3>{row === 'lower' ? 'Alt banyo dolapları' : 'Üst banyo dolapları'}</h3>{g[row].map((unit) => <button type="button" key={unit.index} aria-pressed={selection?.row === row && selection.index === unit.index} onClick={() => onSelect?.({ row, index: unit.index })}><span>{unit.index + 1}. bölme<small>{bathroomKindNames[unit.kind]}</small></span><span>{unit.width} cm</span></button>)}</div>)}
    {g.sideCabinet ? <div className="dc-summary-section"><h3>{c.bathroom?.sideCabinet?.side === 'left' ? 'Sol boy dolabı' : 'Sağ boy dolabı'}</h3><p>{g.sideCabinet.width} × {g.sideCabinet.height} × {g.sideCabinet.depth} cm</p><small>Yerden {g.sideCabinet.bottom} cm · Toplam yerleşim {g.totalWidth} cm</small>{g.side.map((unit) => <button type="button" key={unit.index} aria-pressed={selection?.row === 'side' && selection.index === unit.index} onClick={() => onSelect?.({ row: 'side', index: unit.index })}><span>{unit.index + 1}. göz<small>{bathroomKindNames[unit.kind]}</small></span><span>{unit.height} cm</span></button>)}{c.bathroom?.sideCabinet?.finish ? <small>{c.bathroom.sideCabinet.finish.malz} · {c.bathroom.sideCabinet.finish.yuzey} · {palette[c.bathroom.sideCabinet.finish.renk].name}</small> : null}</div> : null}
  </>
}

function EntrywaySummary({ config: c, selected, onSelect }: { config: Config; selected: number; onSelect: (section: number, cell: number) => void }) {
  const entry = c.entryway
  if (!entry) return null
  return <><h3>Vestiyer bölmeleri</h3>{entrywayUnits(c).map((unit) => <div className="dc-summary-section" key={unit.index}><button type="button" aria-pressed={selected === unit.index} onClick={() => onSelect(unit.index, 0)} title={`Özet: ${unit.index + 1}. vestiyer bölmesi`}><span>{unit.index + 1}. bölme<small>{entrywayLayoutNames[entry.layouts[unit.index]]} · {entrywayFrontNames[unit.front]}</small></span><span>{unit.width} cm</span></button></div>)}</>
}

function WardrobeSummary({ config: c, selected, onSelect }: { config: Config; selected: number; onSelect: (section: number, cell: number) => void }) {
  const wd = c.wardrobe
  if (!wd) return null
  return <><h3>Gardırop bölmeleri</h3>{wardrobeUnits(c).map((unit) => <div className="dc-summary-section" key={unit.index}><button type="button" aria-pressed={selected === unit.index} onClick={() => onSelect(unit.index, 0)} title={`Özet: ${unit.index + 1}. gardırop bölmesi`}><span>{unit.index + 1}. bölme<small>{wardrobeLayoutNames[wd.layouts[unit.index]]}{c.o.acilim === 'mentese' ? ` · ${wardrobeDoorNames[wd.doors[unit.index]]}` : ''}</small></span><span>{unit.width} cm</span></button></div>)}</>
}

function KitchenSummary({ config, selection, onSelect }: { config: Config; selection?: KitchenSelection; onSelect?: (selection: KitchenSelection) => void }) {
  const g = kitchenGeometry(config)
  const groups = [{ key: 'lower', units: g.modules }, { key: 'upper', units: g.upperModules }, { key: 'returnLower', units: g.returnModules }, { key: 'returnUpper', units: g.returnUpperModules }] as const
  return <><h3>Mutfak modülleri</h3>{groups.map(({ key, units }) => units.length ? <div className="dc-summary-section" key={key}>
    <h4>{kitchenRowNames[key]} <span>{units.length} modül</span></h4>
    {units.map((unit) => <button key={unit.section} aria-pressed={selection?.row === key && selection.index === unit.section} title={`Özet: ${kitchenRowNames[key]} ${unit.section + 1}. modül`} onClick={() => onSelect?.({ row: key, index: unit.section })}><span>{unit.section + 1}. modül <small>{kitchenKindNames[unit.kind]}{unit.kind === 'glass' ? ` · ${optionName(unit.glass)}` : ''}</small></span><span>{round(unit.width)} cm</span></button>)}
  </div> : null)}</>
}

export function DesignSummary({
  config: c,
  selected,
  cell,
  onSelect,
  onStep,
  kitchenSelection,
  bathroomSelection,
  tvSelection,
  onTvSelect,
  onBathroomSelect,
  onKitchenSelect,
}: {
  config: Config
  selected: number
  cell: number
  onSelect: (section: number, cell: number) => void
  onStep: (step: number) => void
  tvSelection?: TvSelection
  onTvSelect?: (selection: TvSelection) => void
  bathroomSelection?: BathroomSelection
  onBathroomSelect?: (selection: BathroomSelection) => void
  kitchenSelection?: KitchenSelection
  onKitchenSelect?: (selection: KitchenSelection) => void
}) {
  const plan = c.k ? kitchenDescription(c) : c.tvUnit ? tvDetails(c)[0]?.[1] : c.bathroom ? bathroomDetails(c)[0]?.[1] : c.entryway ? entrywayDetails(c)[0]?.[1] : c.wardrobe ? wardrobeDetails(c)[0]?.[1] : undefined
  return (
    <div className="dc-design-summary">
      <div className="dc-summary-overview">
      <p className="dc-eyebrow">SİZE AİT BİR TASARIM</p>
      <h2>{productNames[c.m]}</h2>
      {plan ? <ul className="dc-summary-facts">{plan.split(' · ').map((fact, index) => <li key={index}>{fact}</li>)}</ul> : null}
      <button
        className="dc-summary-size"
        onClick={() => onStep(0)}
        title="Ürün ölçülerini düzenle"
      >
        <strong>
          {c.d.w} × {c.d.h} × {c.d.d}
          <small> cm</small>
        </strong>
        <span className="dc-summary-measures">
          <span><small>Genişlik</small><b>{c.d.w} cm</b></span>
          <span><small>{c.tvUnit || c.bathroom || c.k ? 'Alt dolap yüksekliği' : 'Yükseklik'}</small><b>{c.d.h} cm</b></span>
          <span><small>Derinlik</small><b>{c.d.d} cm</b></span>
        </span>
        <span>Ölçüleri düzenle →</span>
      </button>
      </div>
      <div className="dc-summary-cards">
      {c.tvUnit ? <TvSummary config={c} selection={tvSelection} onSelect={onTvSelect} /> : c.bathroom ? <BathroomSummary config={c} selection={bathroomSelection} onSelect={onBathroomSelect} /> : c.entryway ? <EntrywaySummary config={c} selected={selected} onSelect={onSelect} /> : c.wardrobe ? <WardrobeSummary config={c} selected={selected} onSelect={onSelect} /> : c.k?.modules ? <KitchenSummary config={c} selection={kitchenSelection} onSelect={onKitchenSelect} /> : <><h3>Bölmeler ve gözler</h3>
      <p className="dc-hint">Bir gözü seçerek sahnede inceleyin.</p>
      {c.r.main.g.map((g, s) => (
        <div className="dc-summary-section" key={s}>
          <h4>
            {String(s + 1).padStart(2, '0')} · Bölme{' '}
            <span>
              {round(c.r.main.w[s])} cm{c.r.main.lk[s] ? ' · Kilitli' : ''}
            </span>
          </h4>
          {g.h.map((h, i) => (
            <button
              key={i}
              aria-pressed={selected === s && cell === i}
              onClick={() => onSelect(s, i)}
              title={`Özet: ${s + 1}. bölme ${i + 1}. göz`}
            >
              <span>
                {i + 1}. göz{' '}
                <small>
                  {frontNames[g.f[i]]} · {interiorNames[g.ic[i]]}
                </small>
              </span>
              <span>
                {round(h)} cm{g.lk[i] ? ' · Kilitli' : ''}
              </span>
            </button>
          ))}
        </div>
      ))}</>}
      </div>
      <p className="dc-neutral-note">
        Bu araç üretim/CNC çizimi değildir. Ölçü ve donanım uygunluğu üretim öncesinde
        doğrulanmalıdır.
      </p>
    </div>
  )
}
