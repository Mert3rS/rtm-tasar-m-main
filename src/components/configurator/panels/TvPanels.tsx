'use client'

import { palette, redistribute, type Options } from '@/lib/configurator/config'
import {
  applyTvPreset,
  applyTvStyle,
  assertTvFits,
  normalizeTvSelection,
  setTvCount,
  setTvKind,
  setTvMount,
  setTvOption,
  setTvWidth,
  tvGeometry,
  tvStyles,
} from '@/lib/configurator/tv'
import {
  tvKindNames,
  tvLowerKinds,
  tvUpperKinds,
} from '@/lib/configurator/tvSchema'
import { DetailIcon } from '../StudioIcon'
import { FieldGroup, NumberField, SelectField, Toggle } from './Fields'
import type { PanelProps } from './DesignPanels'

const rowNames = { lower: 'Alt ünite', upper: 'Üst bölüm' }
function selectionFor(p: PanelProps) {
  return normalizeTvSelection(p.config, p.tvSelection ?? { row: 'lower', index: p.selected })
}
export function TvRowPicker(props: PanelProps) {
  const selection = selectionFor(props)
  return (
    <div className="dc-kitchen-row-tabs" role="group" aria-label="TV dolap sırası">
      {(['lower', 'upper'] as const).map((row) => (
        <button
          type="button"
          key={row}
          aria-pressed={row === selection.row}
          onClick={() => props.onTvSelect?.({ row, index: 0 })}
        >
          {rowNames[row]}
        </button>
      ))}
    </div>
  )
}
export function TvStartPanel({ config: c, edit, onTvSelect }: PanelProps) {
  const t = c.tvUnit,
    g = tvGeometry(c)
  return (
    <>
      <FieldGroup title="Yaşam alanınıza bir odak noktası">
        <div className="dc-kitchen-starts" role="group" aria-label="TV ünitesi başlangıçları">
          {(
            [
              {
                id: 'reference',
                name: 'Çerçeve 240',
                detail: 'Çıta panel · cam vitrin · gizli LED',
              },
              { id: 'minimal', name: 'Minimal 200', detail: 'Sade asma konsol · geniş TV paneli' },
              { id: 'cinema', name: 'Sinema 300', detail: '85 inç ekran · ceviz · ışıklı çerçeve' },
            ] as const
          ).map((preset) => (
            <button
              type="button"
              key={preset.id}
              onClick={() => {
                edit((draft) => applyTvPreset(draft, preset.id))
                onTvSelect?.({ row: 'lower', index: 0 })
              }}
            >
              <strong>{preset.name}</strong>
              <span>{preset.detail}</span>
            </button>
          ))}
        </div>
        <p className="dc-hint">
          Başlangıç seçimi ölçü ve bölmeleri yeniler. Geri al ile önceki düzene dönebilirsiniz.
        </p>
      </FieldGroup>
      {t ? (
        <FieldGroup title="Duvar kompozisyonu">
          <NumberField
            label="Üst bölüm yüksekliği"
            value={t.upperHeight}
            min={Math.max(90, Math.ceil(c.o.tv * 1.245 + 24))}
            max={230}
            onChange={(value) => edit((draft) => setTvOption(draft, 'upperHeight', value))}
          />
          <NumberField
            label="Üst bölüm derinliği"
            value={t.upperDepth}
            min={20}
            max={Math.min(40, c.d.d)}
            onChange={(value) => edit((draft) => setTvOption(draft, 'upperDepth', value))}
          />
          {c.o.baza === 'asma' ? (
            <NumberField
              label="TV alt ünitenin yerden açıklığı"
              value={t.floorGap}
              min={15}
              max={35}
              onChange={(value) => edit((draft) => setTvOption(draft, 'floorGap', value))}
            />
          ) : null}
          <p className="dc-hint">
            Alt ünite bitmiş yüksekliği üst tablasını içerir. Toplam üst kot {g.top} cm; TV alanı{' '}
            {g.area?.width} cm.
          </p>
        </FieldGroup>
      ) : (
        <p className="dc-hint">
          Mevcut özel düzeniniz korunuyor. Bir başlangıç seçerek gelişmiş TV seçeneklerini
          açabilirsiniz.
        </p>
      )}
    </>
  )
}
export function TvSectionsPanel(props: PanelProps) {
  const { config: c, edit, onTvSelect } = props,
    t = c.tvUnit,
    selection = selectionFor(props)
  if (!t) return null
  const row = selection.row === 'lower' ? c.r.main : t.upper,
    units = tvGeometry(c)[selection.row],
    unit = units[selection.index]
  const maxCount =
    selection.row === 'upper'
      ? Math.floor((c.d.w - (c.o.tv * 2.214 + 8)) / 30) + 1
      : Math.floor(c.d.w / 30)
  return (
    <>
      <TvRowPicker {...props} />
      <FieldGroup title={`${rowNames[selection.row]} · bağımsız ölçüler`}>
        <div className="dc-kitchen-count">
          <button
            type="button"
            aria-label={`${rowNames[selection.row]} TV bölme azalt`}
            disabled={row.lk.some(Boolean) || row.w.length <= 1}
            onClick={() => {
              edit((draft) => setTvCount(draft, selection.row, row.w.length - 1))
              onTvSelect?.({ row: selection.row, index: 0 })
            }}
          >
            −
          </button>
          <span>
            <strong>{row.w.length}</strong> bölme <small>· {c.d.w} cm</small>
          </span>
          <button
            type="button"
            aria-label={`${rowNames[selection.row]} TV bölme artır`}
            disabled={row.lk.some(Boolean) || row.w.length >= Math.min(8, maxCount)}
            onClick={() => edit((draft) => setTvCount(draft, selection.row, row.w.length + 1))}
          >
            +
          </button>
        </div>
        <div className="dc-kitchen-module-list">
          {units.map((item) => (
            <div key={item.index} className={selection.index === item.index ? 'is-active' : ''}>
              <button
                type="button"
                aria-pressed={selection.index === item.index}
                onClick={() => onTvSelect?.({ row: selection.row, index: item.index })}
              >
                <span>
                  {item.index + 1} <strong>{tvKindNames[item.kind]}</strong>
                </span>
                <small>{item.width} cm</small>
              </button>
              <button
                type="button"
                aria-label={`${rowNames[selection.row]} ${item.index + 1}. TV bölmesi kilidi`}
                aria-pressed={row.lk[item.index]}
                onClick={() =>
                  edit((draft) => {
                    const target = selection.row === 'lower' ? draft.r.main : draft.tvUnit?.upper
                    if (target) target.lk[item.index] = !target.lk[item.index]
                  })
                }
              >
                {row.lk[item.index] ? 'Kilitli' : 'Kilitle'}
              </button>
            </div>
          ))}
        </div>
        <NumberField
          label={`${rowNames[selection.row]} ${selection.index + 1}. bölme genişliği`}
          value={unit.width}
          min={unit.kind === 'tv' ? Math.ceil(c.o.tv * 2.214 + 8) : 30}
          max={c.d.w}
          disabled={row.lk[selection.index]}
          onChange={(value) => edit((draft) => setTvWidth(draft, selection, value))}
        />
        <div className="dc-kitchen-quick" role="group" aria-label="TV hızlı genişlik">
          {[30, 40, 45, 50, 60, 80, 90, 100, 120, 160, 180, 200, 220].map((value) => (
            <button
              type="button"
              key={value}
              disabled={
                row.lk[selection.index] || (unit.kind === 'tv' && value < c.o.tv * 2.214 + 8)
              }
              aria-pressed={unit.width === value}
              onClick={() => edit((draft) => setTvWidth(draft, selection, value))}
            >
              {value}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="dc-secondary"
          onClick={() =>
            edit((draft) => {
              const target = selection.row === 'lower' ? draft.r.main : draft.tvUnit?.upper
              if (target) {
                const locks = target.lk.map(
                  (locked, i) =>
                    locked || (selection.row === 'upper' && draft.tvUnit?.upper.t[i] === 'tv'),
                )
                target.w = redistribute(
                  target.w.map((width, i) => (locks[i] ? width : 1)),
                  locks,
                  draft.d.w,
                  30,
                )
              }
              assertTvFits(draft)
            })
          }
        >
          {selection.row === 'upper'
            ? 'TV alanını koruyarak depolamaları eşitle'
            : 'Kilitsiz bölmeleri eşitle'}{' '}
          ↔
        </button>
        <p className="dc-hint">
          Alt ve üst bölüm bağımsızdır. TV ekranı gerçek 16:9 ölçüyle çizilir; ekran ile yan
          bölmeler arasında boşluk bırakılır.
        </p>
      </FieldGroup>
    </>
  )
}
export function TvInteriorPanel(props: PanelProps) {
  const { config: c, edit, onTvSelect } = props,
    t = c.tvUnit,
    selection = selectionFor(props)
  if (!t) return null
  const units = tvGeometry(c)[selection.row],
    unit = units[selection.index],
    upper = selection.row === 'upper'
  return (
    <>
      <TvRowPicker {...props} />
      <FieldGroup title="Depolama, vitrin ve TV alanı">
        <div className="dc-kitchen-navigator">
          <button
            type="button"
            aria-label="Önceki TV bölmesi"
            onClick={() =>
              onTvSelect?.({
                row: selection.row,
                index: (selection.index + units.length - 1) % units.length,
              })
            }
          >
            ←
          </button>
          <span>
            {rowNames[selection.row]} · {selection.index + 1}. bölme · {unit.width} cm
            <strong>{tvKindNames[unit.kind]}</strong>
          </span>
          <button
            type="button"
            aria-label="Sonraki TV bölmesi"
            onClick={() =>
              onTvSelect?.({ row: selection.row, index: (selection.index + 1) % units.length })
            }
          >
            →
          </button>
        </div>
        <div
          className="dc-kitchen-type-grid dc-wardrobe-layouts"
          role="group"
          aria-label="TV iç düzeni"
        >
          {(upper ? tvUpperKinds : tvLowerKinds).map((kind) => (
            <button
              type="button"
              key={kind}
              aria-pressed={unit.kind === kind}
              disabled={
                (unit.kind === 'tv' && kind !== 'tv') ||
                (kind === 'tv' && unit.width < c.o.tv * 2.214 + 8)
              }
              onClick={() => edit((draft) => setTvKind(draft, selection, kind))}
            >
              <svg
                viewBox="0 0 32 40"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <rect x="3" y="2" width="26" height="36" />
                <path
                  d={
                    kind === 'tv'
                      ? 'M6 11h20v17H6zM11 32h10'
                      : kind === 'slats'
                        ? 'M8 2v36M13 2v36M18 2v36M23 2v36'
                        : kind === 'glass'
                          ? 'm8 8 16 20m-16-9 16 15'
                          : kind === 'drawers'
                            ? 'M3 15h26M3 27h26'
                            : kind === 'lift'
                              ? 'm6 18 10-10 10 10'
                              : 'M3 14h26M3 26h26'
                  }
                />
              </svg>
              <span>{tvKindNames[kind]}</span>
            </button>
          ))}
        </div>
        {unit.kind === 'drawers' ? (
          <SelectField
            label="TV çekmece sayısı"
            value={String(unit.drawers)}
            values={['2', '3']}
            onChange={(value) =>
              edit((draft) => {
                if (draft.tvUnit) draft.tvUnit.drawers[selection.index] = Number(value)
                assertTvFits(draft)
              })
            }
          />
        ) : null}
        {!['tv', 'slats', 'drawers'].includes(unit.kind) ? (
          <SelectField
            label="TV raf sayısı"
            value={String(unit.shelves)}
            values={upper ? ['1', '2', '3', '4', '5'] : ['0', '1', '2', '3']}
            onChange={(value) =>
              edit((draft) => {
                if (draft.tvUnit)
                  (upper ? draft.tvUnit.upper.shelves : draft.tvUnit.shelves)[selection.index] =
                    Number(value)
              })
            }
          />
        ) : null}
        {unit.kind === 'glass' ? (
          <SelectField
            label="TV vitrin camı"
            value={unit.glass}
            values={[
              { value: 'seffaf', label: 'Şeffaf' },
              { value: 'fume', label: 'Füme' },
              { value: 'buzlu', label: 'Buzlu' },
              { value: 'yivli', label: 'Yivli' },
            ]}
            onChange={(value) =>
              edit((draft) => {
                if (draft.tvUnit) draft.tvUnit.upper.glass[selection.index] = value
              })
            }
          />
        ) : null}
        {unit.kind === 'tv' ? (
          <p className="dc-hint">
            TV alanı korunur. Ekran boyutu, arka panel ve LED çerçeveyi Kulp ve detaylar adımında
            ayarlayabilirsiniz.
          </p>
        ) : null}
        <div className="dc-kitchen-quick" role="group" aria-label="TV bölmesi seç">
          {units.map((item) => (
            <button
              type="button"
              key={item.index}
              aria-label={`${rowNames[selection.row]} ${item.index + 1}. TV bölmesini seç`}
              aria-pressed={item.index === selection.index}
              onClick={() => onTvSelect?.({ row: selection.row, index: item.index })}
            >
              {item.index + 1}
              <small> · {item.width} cm</small>
            </button>
          ))}
        </div>
      </FieldGroup>
    </>
  )
}
export function TvStylePanel({ config: c, edit, onApply }: PanelProps & { onApply?: () => void }) {
  if (!c.tvUnit) return null
  return (
    <>
      <FieldGroup title="Hazır TV ünitesi kombinasyonları">
        <div className="dc-kitchen-styles">
          {tvStyles.map((style) => (
            <button
              type="button"
              key={style.id}
              aria-pressed={
                c.o.renk === style.options.renk &&
                c.o.kulp === style.options.kulp &&
                c.tvUnit?.backdrop === style.backdrop
              }
              onClick={() => {
                edit((draft) => applyTvStyle(draft, style.id))
                onApply?.()
              }}
            >
              <span className="dc-kitchen-style-swatches" aria-hidden="true">
                <i style={{ background: palette[style.options.renk ?? 'beyaz'].hex }} />
                <i style={{ background: palette[style.options.renk2 ?? 'mese'].hex }} />
              </span>
              <span>
                <strong>{style.name}</strong>
                <small>{style.detail}</small>
              </span>
            </button>
          ))}
        </div>
      </FieldGroup>
      {c.tvUnit.upper.t.includes('glass') ? (
        <FieldGroup title="Vitrin çerçevesi">
          <SelectField
            label="TV cam çerçevesi"
            value={c.o.camc}
            values={[
              { value: 'siyah', label: 'Siyah' },
              { value: 'bronz', label: 'Bronz' },
              { value: 'alu', label: 'Alüminyum' },
              { value: 'altin', label: 'Altın' },
            ]}
            onChange={(value) =>
              edit((draft) => {
                draft.o.camc = value
              })
            }
          />
          <p className="dc-hint">Cam türü ve raflar İç düzen adımında vitrin başına seçilir.</p>
        </FieldGroup>
      ) : null}
    </>
  )
}
export function TvDetailsPanel({ config: c, edit }: PanelProps) {
  const t = c.tvUnit,
    g = tvGeometry(c)
  if (!t) return null
  function option<K extends keyof Options>(key: K, value: Options[K]) {
    edit((draft) => {
      draft.o[key] = value
      assertTvFits(draft)
    })
  }
  return (
    <>
      <FieldGroup title="Ekran ve mimari çerçeve">
        <div className="dc-kitchen-quick" role="group" aria-label="TV ekran boyutu">
          {[55, 65, 75, 85].map((inches) => (
            <button
              type="button"
              key={inches}
              aria-pressed={c.o.tv === inches}
              disabled={
                !g.area || g.area.width < inches * 2.214 + 8 || t.upperHeight < inches * 1.245 + 24
              }
              onClick={() => option('tv', inches)}
            >
              {inches}″
            </button>
          ))}
        </div>
        <p className="dc-hint">
          Bu TV alanına en fazla {Math.floor(((g.area?.width ?? 0) - 8) / 2.214)} inç ekran sığar.
          Büyük ekran için TV alanını genişletin.
        </p>
        <Toggle
          label="TV arkası panel"
          checked={c.o.panel}
          onChange={() => option('panel', !c.o.panel)}
        />
        {c.o.panel ? (
          <SelectField
            label="TV arkası panel dokusu"
            value={t.backdrop}
            values={[
              { value: 'stone', label: 'Taş / mermer görünümü' },
              { value: 'plain', label: 'Düz mat panel' },
              { value: 'slats', label: 'Dikey çıtalı panel' },
            ]}
            onChange={(value) => edit((draft) => setTvOption(draft, 'backdrop', value))}
          />
        ) : null}
        <Toggle
          label="Gizli LED çerçeve"
          checked={t.frameLed}
          onChange={() => edit((draft) => setTvOption(draft, 'frameLed', !t.frameLed))}
        />
        <Toggle
          label="Soundbar alanı"
          checked={t.soundbar}
          onChange={() => edit((draft) => setTvOption(draft, 'soundbar', !t.soundbar))}
        />
        <Toggle
          label="Kablo kanalı"
          checked={t.cableChannel}
          onChange={() => edit((draft) => setTvOption(draft, 'cableChannel', !t.cableChannel))}
        />
      </FieldGroup>
      <FieldGroup title="Kulp ve montaj">
        <div className="dc-detail-options" role="group" aria-label="TV kulp modeli">
          {(
            [
              { value: 'bas-ac', label: 'Bas-aç' },
              { value: 'kenar-profil', label: 'Profil kulp' },
              { value: 'gomme', label: 'Gömme kulp' },
              { value: 'cubuk', label: 'Çubuk kulp' },
              { value: 'gola', label: 'Gizli kulp' },
              { value: 'dugme', label: 'Düğme kulp' },
              { value: 'yok', label: 'Kulpsuz' },
            ] as const
          ).map(({ value, label }) => (
            <button
              type="button"
              key={value}
              aria-pressed={c.o.kulp === value}
              onClick={() => option('kulp', value)}
            >
              <DetailIcon value={value} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <SelectField
          label="TV kulp rengi"
          value={c.o.krenk}
          values={[
            { value: 'siyah', label: 'Siyah mat' },
            { value: 'bronz', label: 'Bronz' },
            { value: 'inox', label: 'İnoks' },
            { value: 'altin', label: 'Altın' },
            { value: 'beyaz', label: 'Beyaz' },
          ]}
          onChange={(value) => option('krenk', value)}
        />
        <SelectField
          label="TV baza ve montaj"
          value={c.o.baza}
          values={[
            { value: 'asma', label: 'Duvara asma' },
            { value: 'b8', label: '8 cm baza' },
            { value: 'b10', label: '10 cm baza' },
            { value: 'b12', label: '12 cm baza' },
            { value: 'ayak', label: 'Metal ayak' },
            { value: 'b0', label: 'Bazasız' },
          ]}
          onChange={(value) => edit((draft) => setTvMount(draft, value))}
        />
      </FieldGroup>
      <FieldGroup title="Vitrin ve konsol aydınlatması">
        {(
          [
            { key: 'alt', label: 'Alt ünite altı LED' },
            { key: 'ic', label: 'Vitrin içi LED' },
            { key: 'raf', label: 'Raf altı LED' },
          ] as const
        ).map(({ key, label }) => (
          <Toggle
            key={key}
            label={label}
            checked={c.o.led.includes(key)}
            onChange={() =>
              option(
                'led',
                c.o.led.includes(key)
                  ? c.o.led.filter((value) => value !== key)
                  : [...c.o.led, key],
              )
            }
          />
        ))}
      </FieldGroup>
    </>
  )
}
