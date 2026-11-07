'use client'

import { baseHeight, palette, redistribute, resize, type Options } from '@/lib/configurator/config'
import {
  applyBathroomPreset,
  applyBathroomStyle,
  assertBathroomFits,
  basinNames,
  bathroomGeometry,
  bathroomStyles,
  normalizeBathroomSelection,
  setBathroomCount,
  setBathroomKind,
  setBathroomMount,
  setBathroomOption,
  setBathroomWidth,
} from '@/lib/configurator/bathroom'
import {
  bathroomKindNames,
  bathroomLowerKinds,
  bathroomUpperKinds,
  type BathroomSelection,
} from '@/lib/configurator/bathroomSchema'
import { DetailIcon } from '../StudioIcon'
import { FieldGroup, NumberField, SelectField, Toggle } from './Fields'
import type { PanelProps } from './DesignPanels'

function selectionFor(props: PanelProps) {
  return normalizeBathroomSelection(
    props.config,
    props.bathroomSelection ?? { row: 'lower', index: props.selected },
  )
}
const rowNames = { lower: 'Alt dolaplar', upper: 'Üst dolaplar' }
export function BathroomRowPicker(props: PanelProps) {
  const selection = selectionFor(props)
  return (
    <div className="dc-kitchen-row-tabs" role="group" aria-label="Banyo dolap sırası">
      {(
        [
          'lower',
          ...(props.config.bathroom?.upperEnabled ? ['upper' as const] : []),
        ] satisfies BathroomSelection['row'][]
      ).map((row) => (
        <button
          type="button"
          key={row}
          aria-pressed={selection.row === row}
          onClick={() => props.onBathroomSelect?.({ row, index: 0 })}
        >
          {rowNames[row]}
        </button>
      ))}
    </div>
  )
}
export function BathroomStartPanel({ config: c, edit, onBathroomSelect }: PanelProps) {
  const b = c.bathroom,
    g = bathroomGeometry(c)
  return (
    <>
      <FieldGroup title="Banyonuz için bir başlangıç">
        <div className="dc-kitchen-starts" role="group" aria-label="Banyo başlangıçları">
          {(
            [
              {
                id: 'reference',
                name: 'Denge 100',
                detail: 'Asma çekmeceler · oval lavabo · aynalı üst',
              },
              { id: 'compact', name: 'Kompakt 80', detail: 'Dar banyolar için sade ve kullanışlı' },
              {
                id: 'double',
                name: 'Çift lavabo 160',
                detail: 'İki çanak · ceviz detay · geniş depolama',
              },
            ] as const
          ).map((preset) => (
            <button
              type="button"
              key={preset.id}
              onClick={() => {
                edit((draft) => applyBathroomPreset(draft, preset.id))
                onBathroomSelect?.({ row: 'lower', index: 0 })
              }}
            >
              <strong>{preset.name}</strong>
              <span>{preset.detail}</span>
            </button>
          ))}
        </div>
        <p className="dc-hint">
          Başlangıç seçimi ölçüleri ve bölmeleri yeniler. Geri al ile önceki düzeni geri
          getirebilirsiniz.
        </p>
      </FieldGroup>
      {b ? (
        <>
          <FieldGroup title="Montaj ve lavabo">
            <SelectField
              label="Dolap montajı"
              value={c.o.baza === 'asma' ? 'floating' : 'floor'}
              values={[
                { value: 'floating', label: 'Duvara asma' },
                { value: 'floor', label: 'Zemine oturan' },
              ]}
              onChange={(value) => edit((draft) => setBathroomMount(draft, value === 'floating'))}
            />
            {c.o.baza === 'asma' ? (
              <NumberField
                label="Alt dolabın yerden açıklığı"
                value={b.floorGap}
                min={20}
                max={45}
                onChange={(value) => edit((draft) => setBathroomOption(draft, 'floorGap', value))}
              />
            ) : null}
            <SelectField
              label="Lavabo biçimi"
              value={b.basin}
              values={Object.entries(basinNames).map(([value, label]) => ({ value, label }))}
              onChange={(value) => {
                if (value === 'inset' || value === 'vessel' || value === 'round')
                  edit((draft) => setBathroomOption(draft, 'basin', value))
              }}
            />
            <p className="dc-hint">
              Tezgâh üst kotu {g.counter} cm · lavabo üst kotu{' '}
              {g.counter + (b.basin === 'inset' ? 0 : 12)} cm. Alt dolap yüksekliği 2 cm tezgâhı
              içerir.
            </p>
          </FieldGroup>
          <FieldGroup title="Ayna ve üst depolama">
            <Toggle
              label="Üst dolaplar"
              checked={b.upperEnabled}
              onChange={() =>
                edit((draft) => {
                  setBathroomOption(draft, 'upperEnabled', !b.upperEnabled)
                  draft.o.ust = !b.upperEnabled
                })
              }
            />
            {!b.upperEnabled ? (
              <SelectField
                label="Duvar aynası biçimi"
                value={b.mirrorShape}
                values={[
                  { value: 'capsule', label: 'Kapsül ayna' },
                  { value: 'round', label: 'Yuvarlak ayna' },
                  { value: 'rectangle', label: 'Dikdörtgen ayna' },
                ]}
                onChange={(value) =>
                  edit((draft) => setBathroomOption(draft, 'mirrorShape', value))
                }
              />
            ) : null}
            <NumberField
              label={b.upperEnabled ? 'Üst dolap yüksekliği' : 'Ayna alanı yüksekliği'}
              value={b.upperHeight}
              min={50}
              max={95}
              onChange={(value) => edit((draft) => setBathroomOption(draft, 'upperHeight', value))}
            />
            {b.upperEnabled ? (
              <NumberField
                label="Üst dolap derinliği"
                value={b.upperDepth}
                min={14}
                max={26}
                onChange={(value) => edit((draft) => setBathroomOption(draft, 'upperDepth', value))}
              />
            ) : null}
            <NumberField
              label="Tezgâh ile üst bölüm arası"
              value={b.gap}
              min={32}
              max={65}
              onChange={(value) => edit((draft) => setBathroomOption(draft, 'gap', value))}
            />
            <p className="dc-hint">
              Üst bölüm alt dolaptan bağımsızdır; toplam üst kot {g.top} cm.
            </p>
          </FieldGroup>
        </>
      ) : (
        <p className="dc-hint">
          Mevcut özel düzeniniz korunuyor. Bir başlangıç seçerek gelişmiş banyo seçeneklerini
          açabilirsiniz.
        </p>
      )}
    </>
  )
}
export function BathroomSectionsPanel(props: PanelProps) {
  const { config: c, edit, onBathroomSelect } = props,
    b = c.bathroom,
    selection = selectionFor(props)
  if (!b) return null
  const row = selection.row === 'lower' ? c.r.main : b.upper,
    units = bathroomGeometry(c)[selection.row],
    index = selection.index
  return (
    <>
      <BathroomRowPicker {...props} />
      <FieldGroup title={`${rowNames[selection.row]} · bağımsız ölçüler`}>
        <div className="dc-kitchen-count">
          <button
            type="button"
            aria-label={`${rowNames[selection.row]} banyo bölme azalt`}
            disabled={row.lk.some(Boolean) || row.w.length <= 1}
            onClick={() => {
              edit((draft) => setBathroomCount(draft, selection.row, row.w.length - 1))
              onBathroomSelect?.({ row: selection.row, index: 0 })
            }}
          >
            −
          </button>
          <span>
            <strong>{row.w.length}</strong> bölme <small>· {c.d.w} cm</small>
          </span>
          <button
            type="button"
            aria-label={`${rowNames[selection.row]} banyo bölme artır`}
            disabled={
              row.lk.some(Boolean) ||
              row.w.length >= (selection.row === 'lower' ? 8 : 6) ||
              c.d.w < (row.w.length + 1) * 30 + (selection.row === 'lower' ? 25 : 0)
            }
            onClick={() =>
              edit((draft) => setBathroomCount(draft, selection.row, row.w.length + 1))
            }
          >
            +
          </button>
        </div>
        <div className="dc-kitchen-module-list">
          {units.map((unit) => (
            <div key={unit.index} className={index === unit.index ? 'is-active' : ''}>
              <button
                type="button"
                aria-pressed={index === unit.index}
                onClick={() => onBathroomSelect?.({ row: selection.row, index: unit.index })}
              >
                <span>
                  {unit.index + 1} <strong>{bathroomKindNames[unit.kind]}</strong>
                </span>
                <small>{unit.width} cm</small>
              </button>
              <button
                type="button"
                aria-label={`${rowNames[selection.row]} ${unit.index + 1}. banyo bölmesi kilidi`}
                aria-pressed={row.lk[unit.index]}
                onClick={() =>
                  edit((draft) => {
                    const target = selection.row === 'lower' ? draft.r.main : draft.bathroom?.upper
                    if (target) target.lk[unit.index] = !target.lk[unit.index]
                  })
                }
              >
                {row.lk[unit.index] ? 'Kilitli' : 'Kilitle'}
              </button>
            </div>
          ))}
        </div>
        <NumberField
          label={`${rowNames[selection.row]} ${index + 1}. bölme genişliği`}
          value={row.w[index]}
          min={units[index].kind === 'sink' ? 55 : units[index].kind === 'washer' ? 60 : 30}
          max={Math.min(c.d.w, selection.row === 'upper' ? 180 : c.d.w)}
          disabled={row.lk[index]}
          onChange={(value) => edit((draft) => setBathroomWidth(draft, selection, value))}
        />
        <div className="dc-kitchen-quick" role="group" aria-label="Banyo hızlı genişlik">
          {[30, 40, 45, 50, 55, 60, 80, 90, 100, 120].map((value) => (
            <button
              type="button"
              key={value}
              disabled={
                row.lk[index] ||
                (units[index].kind === 'sink' && value < 55) ||
                (units[index].kind === 'washer' && value < 60)
              }
              aria-pressed={row.w[index] === value}
              onClick={() => edit((draft) => setBathroomWidth(draft, selection, value))}
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
              const target = selection.row === 'lower' ? draft.r.main : draft.bathroom?.upper
              if (target)
                target.w = redistribute(
                  target.w.map((width, i) => (target.lk[i] ? width : 1)),
                  target.lk,
                  draft.d.w,
                  30,
                )
              assertBathroomFits(draft)
            })
          }
        >
          Kilitsiz bölmeleri eşitle ↔
        </button>
        <p className="dc-hint">
          Alt ve üst sıra farklı bölme sayısına sahip olabilir. Kilitler ölçü değişiminde korunur.
          Lavabo için en az 55 cm alan bırakılır.
        </p>
      </FieldGroup>
    </>
  )
}
export function BathroomInteriorPanel(props: PanelProps) {
  const { config: c, edit, onBathroomSelect } = props,
    b = c.bathroom,
    selection = selectionFor(props)
  if (!b) return null
  const units = bathroomGeometry(c)[selection.row],
    unit = units[selection.index],
    upper = selection.row === 'upper'
  const kinds = upper ? bathroomUpperKinds : bathroomLowerKinds
  return (
    <>
      <BathroomRowPicker {...props} />
      <FieldGroup title="Her bölme ihtiyacınıza göre">
        <div className="dc-kitchen-navigator">
          <button
            type="button"
            aria-label="Önceki banyo bölmesi"
            onClick={() =>
              onBathroomSelect?.({
                row: selection.row,
                index: (selection.index + units.length - 1) % units.length,
              })
            }
          >
            ←
          </button>
          <span>
            {rowNames[selection.row]} · {selection.index + 1}. bölme · {unit.width} cm
            <strong>{bathroomKindNames[unit.kind]}</strong>
          </span>
          <button
            type="button"
            aria-label="Sonraki banyo bölmesi"
            onClick={() =>
              onBathroomSelect?.({
                row: selection.row,
                index: (selection.index + 1) % units.length,
              })
            }
          >
            →
          </button>
        </div>
        <div
          className="dc-kitchen-type-grid dc-wardrobe-layouts"
          role="group"
          aria-label="Banyo iç düzeni"
        >
          {kinds.map((kind) => (
            <button
              type="button"
              key={kind}
              disabled={
                !upper &&
                unit.kind === 'sink' &&
                kind !== 'sink' &&
                b.lower.filter((value) => value === 'sink').length === 1
              }
              aria-pressed={unit.kind === kind}
              onClick={() => edit((draft) => setBathroomKind(draft, selection, kind))}
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
                    kind === 'sink'
                      ? 'M5 7h22M9 7q7 12 14 0M16 5v-3M3 21h26'
                      : kind === 'drawers'
                        ? 'M3 14h26M3 26h26'
                        : kind === 'mirror' || kind === 'glass'
                          ? 'm9 10 13 15m-13-7 13 15'
                          : kind === 'washer'
                            ? 'M3 10h26M8 5h4M16 16a8 8 0 1 0 0 16 8 8 0 1 0 0-16'
                            : 'M3 14h26M3 26h26'
                  }
                />
              </svg>
              <span>{bathroomKindNames[kind]}</span>
            </button>
          ))}
        </div>
        {unit.kind === 'sink' ? (
          <>
            <SelectField
              label="Lavabo altı düzeni"
              value={b.sinkFront}
              values={[
                { value: 'drawers', label: 'Çekmeceli' },
                { value: 'doors', label: 'Kapaklı / tesisat boşluklu' },
              ]}
              onChange={(value) => edit((draft) => setBathroomOption(draft, 'sinkFront', value))}
            />
            <p className="dc-hint">
              Üst çekmecede tesisat boşluğu vardır. En az bir lavabo korunur; ek depolama için bölme
              ekleyin.
            </p>
          </>
        ) : null}
        {unit.kind === 'drawers' || (unit.kind === 'sink' && b.sinkFront === 'drawers') ? (
          <SelectField
            label="Banyo çekmece sayısı"
            value={String(unit.drawers)}
            values={['2', '3']}
            onChange={(value) =>
              edit((draft) => {
                if (draft.bathroom) draft.bathroom.drawers[selection.index] = Number(value)
                assertBathroomFits(draft)
              })
            }
          />
        ) : null}
        {upper || unit.kind === 'door' || unit.kind === 'open' ? (
          <SelectField
            label="Banyo raf sayısı"
            value={String(unit.shelves)}
            values={upper ? ['1', '2', '3', '4'] : ['1', '2', '3']}
            onChange={(value) =>
              edit((draft) => {
                if (draft.bathroom)
                  (upper ? draft.bathroom.upper.shelves : draft.bathroom.shelves)[selection.index] =
                    Number(value)
              })
            }
          />
        ) : null}
        {unit.kind === 'glass' ? (
          <SelectField
            label="Banyo cam tipi"
            value={unit.glass}
            values={[
              { value: 'seffaf', label: 'Şeffaf' },
              { value: 'fume', label: 'Füme' },
              { value: 'buzlu', label: 'Buzlu' },
              { value: 'yivli', label: 'Yivli' },
            ]}
            onChange={(value) =>
              edit((draft) => {
                if (draft.bathroom) draft.bathroom.upper.glass[selection.index] = value
              })
            }
          />
        ) : null}
        {unit.kind === 'washer' ? (
          <p className="dc-hint">
            Makine temsili ölçüdedir. Seçim zemine oturan, 88 cm yüksek ve en az 60 cm derin bir
            düzen uygular; gerçek cihaz ölçüsü üretim öncesi kontrol edilir.
          </p>
        ) : null}
        <div className="dc-kitchen-quick" role="group" aria-label="Banyo bölmesi seç">
          {units.map((item) => (
            <button
              type="button"
              key={item.index}
              aria-label={`${rowNames[selection.row]} ${item.index + 1}. banyo bölmesini seç`}
              aria-pressed={item.index === selection.index}
              onClick={() => onBathroomSelect?.({ row: selection.row, index: item.index })}
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
export function BathroomStylePanel({
  config: c,
  edit,
  onApply,
}: PanelProps & { onApply?: () => void }) {
  if (!c.bathroom) return null
  return (
    <>
      <FieldGroup title="Hazır banyo kombinasyonları">
        <div className="dc-kitchen-styles">
          {bathroomStyles.map((style) => (
            <button
              type="button"
              key={style.id}
              aria-pressed={
                c.o.renk === style.options.renk &&
                c.o.kulp === style.options.kulp &&
                c.o.km === style.options.km
              }
              onClick={() => {
                edit((draft) => applyBathroomStyle(draft, style.id))
                onApply?.()
              }}
            >
              <span className="dc-kitchen-style-swatches" aria-hidden="true">
                <i style={{ background: palette[style.options.renk ?? 'beyaz'].hex }} />
                <i style={{ background: palette[style.options.renk2 ?? 'fildisi'].hex }} />
              </span>
              <span>
                <strong>{style.name}</strong>
                <small>{style.detail}</small>
              </span>
            </button>
          ))}
        </div>
        <p className="dc-hint">
          Renk ve malzemeler görsel önizlemedir; ıslak hacme uygun yüzey ve kenar uygulaması üretim
          öncesinde belirlenir.
        </p>
      </FieldGroup>
      {c.bathroom.upper.t.includes('glass') ? (
        <FieldGroup title="Camlı üst dolap detayları">
          <SelectField
            label="Banyo cam çerçevesi"
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
          <p className="dc-hint">Cam tipi İç düzen adımında üst bölme başına seçilir.</p>
        </FieldGroup>
      ) : null}
    </>
  )
}
export function BathroomDetailsPanel({ config: c, edit }: PanelProps) {
  const b = c.bathroom
  if (!b) return null
  function option<K extends keyof Options>(key: K, value: Options[K]) {
    edit((draft) => {
      draft.o[key] = value
    })
  }
  return (
    <>
      <FieldGroup title="Kulp ve batarya">
        <div className="dc-detail-options" role="group" aria-label="Banyo kulp modeli">
          {(
            [
              { value: 'kenar-profil', label: 'Profil kulp' },
              { value: 'gomme', label: 'Gömme kulp' },
              { value: 'cubuk', label: 'Çubuk kulp' },
              { value: 'gola', label: 'Gizli kulp' },
              { value: 'bas-ac', label: 'Bas-aç' },
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
          label="Batarya ve kulp rengi"
          value={c.o.krenk}
          values={[
            { value: 'siyah', label: 'Siyah mat' },
            { value: 'inox', label: 'İnoks' },
            { value: 'bronz', label: 'Bronz' },
            { value: 'altin', label: 'Altın' },
            { value: 'beyaz', label: 'Beyaz' },
          ]}
          onChange={(value) => option('krenk', value)}
        />
      </FieldGroup>
      <FieldGroup title="Tezgâh ve tamamlayıcılar">
        <SelectField
          label="Banyo tezgâhı"
          value={c.o.tezgah}
          values={[
            { value: 'porselen', label: 'Porselen görünümü' },
            { value: 'kuvars', label: 'Kuvars görünümü' },
            { value: 'compact', label: 'Kompakt laminat' },
            { value: 'granit', label: 'Doğal taş görünümü' },
            { value: 'laminat', label: 'Laminat' },
            { value: 'karar', label: 'Karar vermedim' },
          ]}
          onChange={(value) => option('tezgah', value)}
        />
        {c.o.baza !== 'asma' ? (
          <SelectField
            label="Banyo baza ve ayak"
            value={c.o.baza}
            values={[
              { value: 'b0', label: 'Bazasız' },
              { value: 'b8', label: '8 cm baza' },
              { value: 'b10', label: '10 cm baza' },
              { value: 'b12', label: '12 cm baza' },
              { value: 'ayak', label: 'Metal ayak' },
            ]}
            onChange={(value) =>
              edit((draft) => {
                draft.o.baza = value
                resize(draft, 'h', draft.d.h)
                assertBathroomFits(draft)
              })
            }
          />
        ) : null}
        <Toggle
          label="Tezgâh arkası panel"
          checked={b.splashback}
          onChange={() => edit((draft) => setBathroomOption(draft, 'splashback', !b.splashback))}
        />
        <Toggle
          label="Yan havluluk"
          checked={b.towelRail}
          onChange={() => edit((draft) => setBathroomOption(draft, 'towelRail', !b.towelRail))}
        />
        <p className="dc-hint">
          {c.o.baza === 'asma'
            ? `Asma dolap · yerden ${b.floorGap} cm`
            : `Baza dahil alt yükseklik ${c.d.h} cm · baza ${baseHeight(c)} cm`}
        </p>
      </FieldGroup>
      <FieldGroup title="Banyoya özel aydınlatma">
        <Toggle
          label="Ayna çevresi LED"
          checked={b.mirrorLed}
          onChange={() => edit((draft) => setBathroomOption(draft, 'mirrorLed', !b.mirrorLed))}
        />
        {(
          [
            { key: 'alt', label: 'Alt dolap altı LED' },
            { key: 'ic', label: 'Üst dolap içi LED' },
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
