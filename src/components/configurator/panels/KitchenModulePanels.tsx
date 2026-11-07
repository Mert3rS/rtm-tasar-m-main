'use client'

import { sum, redistribute } from '@/lib/configurator/config'
import {
  ensureKitchenModules,
  kitchenGeometry,
  kitchenRow,
  setKitchenCount,
  setKitchenKind,
  setKitchenWidth,
} from '@/lib/configurator/kitchen'
import {
  kitchenKindNames,
  kitchenRowNames,
  type KitchenKind,
  type KitchenRowKey,
  type KitchenSelection,
} from '@/lib/configurator/kitchenSchema'
import { FieldGroup, NumberField, SelectField, Toggle } from './Fields'
import type { PanelProps } from './DesignPanels'

export function KitchenRowPicker({ config: c, kitchenSelection, onKitchenSelect }: PanelProps) {
  const selection = kitchenSelection ?? { row: 'lower', index: 0 }
  const rows: KitchenRowKey[] = [
    'lower',
    ...(c.o.ust ? ['upper' as const] : []),
    ...(c.k?.layout !== 'straight'
      ? ['returnLower' as const, ...(c.o.ust ? ['returnUpper' as const] : [])]
      : []),
  ]
  return (
    <div className="dc-kitchen-row-tabs" role="group" aria-label="Dolap sırası">
      {rows.map((row) => (
        <button
          key={row}
          type="button"
          aria-pressed={selection.row === row}
          onClick={() => onKitchenSelect?.({ row, index: 0 })}
        >
          {kitchenRowNames[row]}
        </button>
      ))}
    </div>
  )
}
function selectionFor(props: PanelProps): KitchenSelection {
  const selection = props.kitchenSelection ?? { row: 'lower', index: 0 }
  const row = kitchenRow(props.config, selection.row)
  return { row: selection.row, index: Math.min(selection.index, row.w.length - 1) }
}
export function KitchenSectionsPanel(props: PanelProps) {
  const { config: c, edit, onKitchenSelect } = props
  const selection = selectionFor(props),
    key = selection.row,
    row = kitchenRow(c, key)
  const total = sum(row.w)
  const disabledCount = row.lk.some(Boolean)
  return (
    <>
      <KitchenRowPicker {...props} />
      <FieldGroup title={kitchenRowNames[key]}>
        <p className="dc-hint">
          Sıraları bağımsız ölçülendirin. Kilitli modüller korunur; kalan alan diğer modüllere
          dağılır.
        </p>
        <div className="dc-kitchen-count">
          <button
            type="button"
            aria-label={`${kitchenRowNames[key]} modül azalt`}
            disabled={disabledCount || row.w.length <= 1}
            onClick={() => {
              edit((draft) => setKitchenCount(draft, key, row.w.length - 1))
              onKitchenSelect?.({ row: key, index: 0 })
            }}
          >
            −
          </button>
          <span>
            <strong>{row.w.length}</strong> modül <small>· {total} cm</small>
          </span>
          <button
            type="button"
            aria-label={`${kitchenRowNames[key]} modül artır`}
            disabled={disabledCount || row.w.length >= 8 || total < (row.w.length + 1) * 30}
            onClick={() => edit((draft) => setKitchenCount(draft, key, row.w.length + 1))}
          >
            +
          </button>
        </div>
        {disabledCount ? (
          <p className="dc-hint">Modül sayısını değiştirmek için genişlik kilitlerini açın.</p>
        ) : null}
        <div className="dc-kitchen-module-list">
          {row.w.map((width, index) => (
            <div className={selection.index === index ? 'is-active' : ''} key={index}>
              <button
                type="button"
                aria-pressed={selection.index === index}
                onClick={() => onKitchenSelect?.({ row: key, index })}
              >
                <span>
                  {String(index + 1).padStart(2, '0')}{' '}
                  <strong>{kitchenKindNames[row.t[index]]}</strong>
                </span>
                <small>{width} cm</small>
              </button>
              <button
                type="button"
                aria-label={`${kitchenRowNames[key]} ${index + 1}. modül kilidi`}
                aria-pressed={row.lk[index]}
                onClick={() =>
                  edit((draft) => {
                    ensureKitchenModules(draft)
                    const target = kitchenRow(draft, key)
                    target.lk[index] = !target.lk[index]
                  })
                }
              >
                {row.lk[index] ? 'Kilitli' : 'Kilitle'}
              </button>
            </div>
          ))}
        </div>
        <NumberField
          label={`${selection.index + 1}. modül genişliği`}
          value={row.w[selection.index]}
          min={30}
          max={Math.min(600, total)}
          slider
          disabled={row.lk[selection.index]}
          onChange={(value) => edit((draft) => setKitchenWidth(draft, key, selection.index, value))}
        />
        <div className="dc-kitchen-quick" role="group" aria-label="Hızlı genişlik">
          {[30, 40, 45, 50, 60, 80, 90, 100, 120].map((width) => (
            <button
              type="button"
              key={width}
              disabled={row.lk[selection.index]}
              aria-pressed={row.w[selection.index] === width}
              onClick={() => edit((draft) => setKitchenWidth(draft, key, selection.index, width))}
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
              ensureKitchenModules(draft)
              const target = kitchenRow(draft, key)
              const widths = redistribute(
                target.w.map((width, i) => (target.lk[i] ? width : 1)),
                target.lk,
                total,
                30,
              )
              if (key === 'lower') draft.r.main.w = widths
              else if (draft.k?.modules) draft.k.modules[key].w = widths
            })
          }
        >
          Kilitsiz modülleri eşitle ↔
        </button>
        {c.k?.layout !== 'straight' ? (
          <p className="dc-hint">
            Ana duvarın dönüş ucunda {c.d.d} cm kör köşe alanı ayrılır. Bu alana denk gelen modüller
            kısalabilir veya tamamen köşede kalabilir.
          </p>
        ) : null}
      </FieldGroup>
    </>
  )
}
export function KitchenInteriorPanel(props: PanelProps) {
  const { config: c, edit, onKitchenSelect } = props
  const selection = selectionFor(props),
    key = selection.row,
    row = kitchenRow(c, key)
  const isUpper = key === 'upper' || key === 'returnUpper'
  const kinds: KitchenKind[] = isUpper
    ? ['door', 'glass', 'open', 'hood']
    : ['door', 'drawers', 'oven', 'dishwasher', 'sink', 'open']
  const geometry = kitchenGeometry(c)
  const unit = [
    ...geometry.modules,
    ...geometry.upperModules,
    ...geometry.returnModules,
    ...geometry.returnUpperModules,
  ].find((item) => item.row === key && item.section === selection.index)
  return (
    <>
      <KitchenRowPicker {...props} />
      <FieldGroup title="Modülün işlevi">
        <div className="dc-kitchen-navigator">
          <button
            type="button"
            aria-label="Önceki mutfak modülü"
            onClick={() =>
              onKitchenSelect?.({
                row: key,
                index: (selection.index + row.w.length - 1) % row.w.length,
              })
            }
          >
            ←
          </button>
          <span>
            {kitchenRowNames[key]}
            <strong>
              {selection.index + 1}. modül · {row.w[selection.index]} cm
            </strong>
          </span>
          <button
            type="button"
            aria-label="Sonraki mutfak modülü"
            onClick={() =>
              onKitchenSelect?.({ row: key, index: (selection.index + 1) % row.w.length })
            }
          >
            →
          </button>
        </div>
        <div className="dc-kitchen-type-grid" role="group" aria-label="Mutfak modül tipi">
          {kinds.map((kind) => (
            <button
              type="button"
              key={kind}
              aria-pressed={row.t[selection.index] === kind}
              onClick={() => edit((draft) => setKitchenKind(draft, key, selection.index, kind))}
            >
              <span aria-hidden="true">
                {kind === 'drawers'
                  ? '☰'
                  : kind === 'open'
                    ? '⊞'
                    : kind === 'glass'
                      ? '◇'
                      : kind === 'oven'
                        ? '▣'
                        : kind === 'sink'
                          ? '▱'
                          : kind === 'hood'
                            ? '⌂'
                            : '▥'}
              </span>
              {kitchenKindNames[kind]}
            </button>
          ))}
        </div>
        {!isUpper ? (
          <Toggle
            label="Bu modülde ocak"
            checked={c.k?.modules?.hob?.row === key && c.k.modules.hob.index === selection.index}
            onChange={() =>
              edit((draft) => {
                const modules = ensureKitchenModules(draft)
                if (key !== 'lower' && key !== 'returnLower') return
                modules.hob =
                  modules.hob?.row === key && modules.hob.index === selection.index
                    ? null
                    : { row: key, index: selection.index }
                if (draft.k) draft.k.hob = true
              })
            }
          />
        ) : null}
        {isUpper && row.t[selection.index] === 'glass' ? (
          <SelectField
            label="Bu modülün camı"
            value={row.glass[selection.index]}
            values={[
              { value: 'seffaf', label: 'Şeffaf' },
              { value: 'fume', label: 'Füme' },
              { value: 'buzlu', label: 'Buzlu' },
              { value: 'yivli', label: 'Yivli' },
            ]}
            onChange={(value) =>
              edit((draft) => {
                ensureKitchenModules(draft)
                kitchenRow(draft, key).glass[selection.index] = value
              })
            }
          />
        ) : null}
        {!unit ? (
          <p className="dc-hint">
            Bu aks kör köşe alanında kalıyor. Yan modülü seçerek devam edebilirsiniz.
          </p>
        ) : null}
        {unit &&
        ['oven', 'sink', 'dishwasher'].includes(row.t[selection.index]) &&
        ![geometry.ovenUnit, geometry.sink, geometry.dishwasher].includes(unit) ? (
          <p className="dc-hint">
            Bu cihaz seçili ölçülere sığmıyor veya kapalı. Modülü büyütün; cihaz çizime ve teklife
            yalnızca sığdığında eklenir.
          </p>
        ) : null}
        <div className="dc-kitchen-quick" role="group" aria-label="Mutfak modülü seç">
          {row.w.map((_, index) => (
            <button
              type="button"
              key={index}
              aria-label={`${kitchenRowNames[key]} ${index + 1}. modül seç`}
              aria-pressed={selection.index === index}
              onClick={() => onKitchenSelect?.({ row: key, index })}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </FieldGroup>
    </>
  )
}
