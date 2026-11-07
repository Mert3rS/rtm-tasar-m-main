'use client'

import { baseHeight, palette, redistribute, resize, type Options } from '@/lib/configurator/config'
import {
  applyEntrywayPreset,
  applyEntrywayStyle,
  assertEntrywayFits,
  entrywayStyles,
  entrywayUnits,
  setEntrywayCount,
  setEntrywayLayout,
  setEntrywayOption,
  setEntrywayWidth,
} from '@/lib/configurator/entryway'
import {
  entrywayFrontNames,
  entrywayFronts,
  entrywayLayoutNames,
  entrywayLayouts,
} from '@/lib/configurator/entrywaySchema'
import { DetailIcon } from '../StudioIcon'
import { FieldGroup, NumberField, SelectField, Toggle } from './Fields'
import type { PanelProps } from './DesignPanels'

export function EntrywayStartPanel({ config: c, edit, onSelect }: PanelProps) {
  const entry = c.entryway
  return (
    <>
      <FieldGroup title="Antreye uygun bir başlangıç seçin">
        <div className="dc-kitchen-starts" role="group" aria-label="Vestiyer başlangıçları">
          {(
            [
              { id: 'reference', name: 'Antre 120', detail: 'Oturma + ayakkabı · kapalı depolama' },
              { id: 'compact', name: 'Kompakt 90', detail: 'Açık askılık · ayakkabılık' },
              { id: 'family', name: 'Aile 180', detail: 'Oturma · askı dolabı · ayakkabılık' },
            ] as const
          ).map((preset) => (
            <button
              type="button"
              key={preset.id}
              onClick={() => {
                edit((draft) => applyEntrywayPreset(draft, preset.id))
                onSelect(0, 0)
              }}
            >
              <strong>{preset.name}</strong>
              <span>{preset.detail}</span>
            </button>
          ))}
        </div>
        <p className="dc-hint">
          Başlangıç seçimi ölçü ve bölmeleri yeniler. Geri al ile önceki tasarıma dönebilirsiniz.
        </p>
      </FieldGroup>
      {entry ? (
        <>
          <FieldGroup title="Üst depolama">
            <Toggle
              label="Üst depolama bölümü"
              checked={entry.upper}
              onChange={() => edit((draft) => setEntrywayOption(draft, 'upper', !entry.upper))}
            />
            {entry.upper ? (
              <NumberField
                label="Üst bölüm yüksekliği"
                value={entry.upperHeight}
                min={25}
                max={50}
                onChange={(value) =>
                  edit((draft) => setEntrywayOption(draft, 'upperHeight', value))
                }
              />
            ) : null}
            <p className="dc-hint">Üst bölüm toplam dış yüksekliğin içindedir.</p>
          </FieldGroup>
          {entry.layouts.includes('bench') ? (
            <FieldGroup title="Oturma konforu">
              <NumberField
                label="Oturma yüksekliği"
                value={entry.seatHeight}
                min={40}
                max={55}
                onChange={(value) => edit((draft) => setEntrywayOption(draft, 'seatHeight', value))}
              />
              <Toggle
                label="Oturma minderi"
                checked={entry.cushion}
                onChange={() =>
                  edit((draft) => setEntrywayOption(draft, 'cushion', !entry.cushion))
                }
              />
              {entry.cushion ? (
                <SelectField
                  label="Minder rengi"
                  value={entry.cushionColor}
                  values={[
                    { value: 'sand', label: 'Kum' },
                    { value: 'stone', label: 'Taş' },
                    { value: 'charcoal', label: 'Antrasit' },
                    { value: 'olive', label: 'Adaçayı' },
                  ]}
                  onChange={(value) =>
                    edit((draft) => setEntrywayOption(draft, 'cushionColor', value))
                  }
                />
              ) : null}
              <p className="dc-hint">Oturma ölçüsü minder dahil bitmiş yüksekliktir.</p>
            </FieldGroup>
          ) : null}
        </>
      ) : (
        <p className="dc-hint">
          Mevcut özel düzeniniz korunuyor. Başlangıç seçerek gelişmiş vestiyer seçeneklerini
          açabilirsiniz.
        </p>
      )}
    </>
  )
}
export function EntrywaySectionsPanel({ config: c, edit, selected, onSelect }: PanelProps) {
  const entry = c.entryway,
    row = c.r.main
  if (!entry) return null
  return (
    <FieldGroup title="Bölmeleri girişinize göre düzenleyin">
      <div className="dc-kitchen-count">
        <button
          type="button"
          aria-label="Vestiyer bölme azalt"
          disabled={row.lk.some(Boolean) || row.w.length <= 1}
          onClick={() => {
            edit((draft) => setEntrywayCount(draft, row.w.length - 1))
            onSelect(0, 0)
          }}
        >
          −
        </button>
        <span>
          <strong>{row.w.length}</strong> bölme <small>· {c.d.w} cm</small>
        </span>
        <button
          type="button"
          aria-label="Vestiyer bölme artır"
          disabled={row.lk.some(Boolean) || row.w.length >= 8 || c.d.w < (row.w.length + 1) * 40}
          onClick={() => edit((draft) => setEntrywayCount(draft, row.w.length + 1))}
        >
          +
        </button>
      </div>
      <div className="dc-kitchen-module-list">
        {row.w.map((width, index) => (
          <div key={index} className={selected === index ? 'is-active' : ''}>
            <button
              type="button"
              aria-pressed={selected === index}
              onClick={() => onSelect(index, 0)}
            >
              <span>
                {index + 1} <strong>{entrywayLayoutNames[entry.layouts[index]]}</strong>
              </span>
              <small>{width} cm</small>
            </button>
            <button
              type="button"
              aria-label={`${index + 1}. vestiyer bölmesi kilidi`}
              aria-pressed={row.lk[index]}
              onClick={() =>
                edit((draft) => {
                  draft.r.main.lk[index] = !draft.r.main.lk[index]
                })
              }
            >
              {row.lk[index] ? 'Kilitli' : 'Kilitle'}
            </button>
          </div>
        ))}
      </div>
      <NumberField
        label={`${selected + 1}. bölme genişliği`}
        value={row.w[selected]}
        min={40}
        max={c.d.w}
        slider
        disabled={row.lk[selected]}
        onChange={(value) => edit((draft) => setEntrywayWidth(draft, selected, value))}
      />
      <div className="dc-kitchen-quick" role="group" aria-label="Vestiyer hızlı genişlik">
        {[40, 45, 50, 60, 80, 90, 100, 120].map((width) => (
          <button
            type="button"
            key={width}
            aria-pressed={row.w[selected] === width}
            disabled={row.lk[selected]}
            onClick={() => edit((draft) => setEntrywayWidth(draft, selected, width))}
          >
            {width}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="dc-secondary"
        onClick={() =>
          edit((draft) => {
            draft.r.main.w = redistribute(
              draft.r.main.w.map((width, index) => (draft.r.main.lk[index] ? width : 1)),
              draft.r.main.lk,
              draft.d.w,
              40,
            )
          })
        }
      >
        Kilitsiz bölmeleri eşitle ↔
      </button>
      <p className="dc-hint">Kilitli genişlikler korunur. Her bölme en az 40 cm olmalıdır.</p>
    </FieldGroup>
  )
}
export function EntrywayBayPicker({ config: c, selected, onSelect }: PanelProps) {
  return (
    <div className="dc-kitchen-quick" role="group" aria-label="Vestiyer bölmesi seç">
      {c.r.main.w.map((width, index) => (
        <button
          type="button"
          key={index}
          aria-label={`${index + 1}. vestiyer bölmesini seç`}
          aria-pressed={selected === index}
          onClick={() => onSelect(index, 0)}
        >
          {index + 1}
          <small> · {width} cm</small>
        </button>
      ))}
    </div>
  )
}
function EntrywayFrontFields({ config: c, edit, selected }: PanelProps) {
  const entry = c.entryway,
    unit = entrywayUnits(c)[selected]
  if (!entry || !unit) return null
  return ['bench', 'hooks', 'shelves'].includes(entry.layouts[selected]) ? (
    <p className="dc-hint">
      Bu açık düzenin önünde kapak bulunmaz. Ayna veya cam için kapalı depolama, ayakkabılık, askı
      dolabı ya da çekmeceli düzen seçin.
    </p>
  ) : (
    <>
      <div className="dc-kitchen-type-grid" role="group" aria-label="Vestiyer kapak tipi">
        {entrywayFronts.map((front) => (
          <button
            type="button"
            key={front}
            aria-pressed={entry.fronts[selected] === front}
            onClick={() =>
              edit((draft) => {
                if (draft.entryway) draft.entryway.fronts[selected] = front
              })
            }
          >
            {entrywayFrontNames[front]}
          </button>
        ))}
      </div>
      {entry.fronts[selected] === 'glass' ? (
        <SelectField
          label="Vestiyer cam tipi"
          value={entry.glass[selected]}
          values={[
            { value: 'seffaf', label: 'Şeffaf' },
            { value: 'fume', label: 'Füme' },
            { value: 'buzlu', label: 'Buzlu' },
            { value: 'yivli', label: 'Yivli' },
          ]}
          onChange={(value) =>
            edit((draft) => {
              if (draft.entryway) draft.entryway.glass[selected] = value
            })
          }
        />
      ) : null}
    </>
  )
}
export function EntrywayInteriorPanel(props: PanelProps) {
  const { config: c, edit, selected, onSelect } = props,
    entry = c.entryway
  if (!entry) return null
  const layout = entry.layouts[selected]
  return (
    <>
      <FieldGroup title="Girişte her şey yerli yerinde">
        <div className="dc-kitchen-navigator">
          <button
            type="button"
            aria-label="Önceki vestiyer bölmesi"
            onClick={() => onSelect((selected + c.r.main.w.length - 1) % c.r.main.w.length, 0)}
          >
            ←
          </button>
          <span>
            {selected + 1}. bölme · {c.r.main.w[selected]} cm
            <strong>{entrywayLayoutNames[layout]}</strong>
          </span>
          <button
            type="button"
            aria-label="Sonraki vestiyer bölmesi"
            onClick={() => onSelect((selected + 1) % c.r.main.w.length, 0)}
          >
            →
          </button>
        </div>
        <div
          className="dc-kitchen-type-grid dc-wardrobe-layouts"
          role="group"
          aria-label="Vestiyer iç düzeni"
        >
          {entrywayLayouts.map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={layout === value}
              onClick={() => edit((draft) => setEntrywayLayout(draft, selected, value))}
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
                    value === 'bench'
                      ? 'M3 29h26M8 15h16M10 13v4m6-4v4m6-4v4'
                      : value === 'hooks'
                        ? 'M7 12h18M10 10v4m6-4v4m6-4v4M3 32h26'
                        : value === 'hanging'
                          ? 'M5 10h22M3 30h26'
                          : value === 'drawers'
                            ? 'M3 23h26M3 28h26M3 33h26'
                            : 'M3 10h26M3 18h26M3 26h26M3 33h26'
                  }
                />
              </svg>
              <span>{entrywayLayoutNames[value]}</span>
            </button>
          ))}
        </div>
        {['bench', 'hooks'].includes(layout) ? (
          <>
            <SelectField
              label="Askı kancası sayısı"
              value={String(entry.hooks[selected])}
              values={['2', '3', '4', '5', '6']}
              onChange={(value) =>
                edit((draft) => {
                  if (draft.entryway) draft.entryway.hooks[selected] = Number(value)
                })
              }
            />
            <Toggle
              label="Dikey çıtalı arkalık"
              checked={entry.slats[selected]}
              onChange={() =>
                edit((draft) => {
                  if (draft.entryway)
                    draft.entryway.slats[selected] = !draft.entryway.slats[selected]
                })
              }
            />
          </>
        ) : null}
        {layout === 'bench' ? (
          <SelectField
            label="Bank altı düzeni"
            value={entry.benchStorage[selected]}
            values={[
              { value: 'open', label: 'Açık ayakkabılık' },
              { value: 'drawer', label: 'Çekmece' },
            ]}
            onChange={(value) =>
              edit((draft) => {
                if (draft.entryway) draft.entryway.benchStorage[selected] = value
              })
            }
          />
        ) : null}
        {['shoes', 'closed', 'shelves'].includes(layout) ? (
          <SelectField
            label="Vestiyer raf sayısı"
            value={String(entry.shelves[selected])}
            values={['2', '3', '4', '5', '6', '7']}
            onChange={(value) =>
              edit((draft) => {
                if (draft.entryway) draft.entryway.shelves[selected] = Number(value)
                assertEntrywayFits(draft)
              })
            }
          />
        ) : null}
        {layout === 'drawers' ? (
          <SelectField
            label="Vestiyer çekmece sayısı"
            value={String(entry.drawers[selected])}
            values={['2', '3', '4']}
            onChange={(value) =>
              edit((draft) => {
                if (draft.entryway) draft.entryway.drawers[selected] = Number(value)
                assertEntrywayFits(draft)
              })
            }
          />
        ) : null}
        {layout === 'hanging' ? (
          <p className="dc-hint">
            Askı dolabı seçimi derinliği en az 60 cm yapar; kancalı açık askılık daha sığ
            tutulabilir.
          </p>
        ) : null}
      </FieldGroup>
      <FieldGroup title="Bu bölmenin ön yüzü">
        <EntrywayFrontFields {...props} />
      </FieldGroup>
      <EntrywayBayPicker {...props} />
    </>
  )
}
export function EntrywayStylePanel(props: PanelProps & { onApply?: () => void }) {
  const { config: c, edit, onApply } = props,
    entry = c.entryway
  if (!entry) return null
  return (
    <>
      <FieldGroup title="Hazır vestiyer kombinasyonları">
        <div className="dc-kitchen-styles">
          {entrywayStyles.map((style) => (
            <button
              type="button"
              key={style.id}
              aria-pressed={
                c.o.renk === style.options.renk &&
                c.o.kulp === style.options.kulp &&
                c.o.iki === style.options.iki
              }
              onClick={() => {
                edit((draft) => applyEntrywayStyle(draft, style.id))
                onApply?.()
              }}
            >
              <span className="dc-kitchen-style-swatches" aria-hidden="true">
                <i style={{ background: palette[style.options.renk ?? 'fildisi'].hex }} />
                <i
                  style={{
                    background: palette[style.options.renk2 ?? style.options.renk ?? 'fildisi'].hex,
                  }}
                />
              </span>
              <span>
                <strong>{style.name}</strong>
                <small>{style.detail}</small>
              </span>
            </button>
          ))}
        </div>
      </FieldGroup>
      <FieldGroup title="Bölme bazında kapak seçimi">
        <EntrywayBayPicker {...props} />
        <EntrywayFrontFields {...props} />
        {entry.fronts.includes('glass') ? (
          <SelectField
            label="Vestiyer cam çerçevesi"
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
        ) : null}
        <p className="dc-hint">Ayna, cam, minder ve doku görünümü temsilîdir.</p>
      </FieldGroup>
    </>
  )
}
export function EntrywayDetailsPanel({ config: c, edit }: PanelProps) {
  function option<K extends keyof Options>(key: K, value: Options[K]) {
    edit((draft) => {
      draft.o[key] = value
    })
  }
  const handles: { value: Options['kulp']; label: string }[] = [
    { value: 'cubuk', label: 'Uzun çubuk' },
    { value: 'kenar-profil', label: 'Profil kulp' },
    { value: 'gomme', label: 'Gömme kulp' },
    { value: 'gola', label: 'Gizli kulp' },
    { value: 'bas-ac', label: 'Bas-aç' },
    { value: 'dugme', label: 'Düğme kulp' },
    { value: 'yok', label: 'Kulpsuz' },
  ]
  return (
    <>
      <FieldGroup title="Antreyi tamamlayan detaylar">
        <div className="dc-detail-options" role="group" aria-label="Vestiyer kulp modeli">
          {handles.map(({ value, label }) => (
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
          label="Kulp ve askı rengi"
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
        <SelectField
          label="Baza ve ayak"
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
              assertEntrywayFits(draft)
            })
          }
        />
        <Toggle
          label="Üst bitiş paneli"
          checked={c.o.panel}
          onChange={() => option('panel', !c.o.panel)}
        />
        <p className="dc-hint">
          Dış yükseklik baza dahil {c.d.h} cm · baza {baseHeight(c)} cm.
        </p>
      </FieldGroup>
      <FieldGroup title="İsteğe bağlı aydınlatma">
        {(
          [
            { key: 'ic', label: 'Dolap içi LED' },
            { key: 'alt', label: 'Bank altı LED' },
            { key: 'raf', label: 'Raf altı LED' },
            { key: 'ust', label: 'Üst bölüm LED' },
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
