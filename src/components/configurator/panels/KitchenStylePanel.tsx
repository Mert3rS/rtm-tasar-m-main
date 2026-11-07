'use client'

import { palette, type Config, type Options } from '@/lib/configurator/config'
import { ensureKitchenModules, kitchenRow, setKitchenKind } from '@/lib/configurator/kitchen'
import { kitchenRowNames } from '@/lib/configurator/kitchenSchema'
import { applyKitchenStyle, kitchenStyles } from '@/lib/configurator/kitchenStyles'
import { FieldGroup, SelectField } from './Fields'
import type { PanelProps } from './DesignPanels'

export function KitchenStylePresets({
  config: c,
  edit,
  onApply,
}: {
  config: Config
  edit: PanelProps['edit']
  onApply?: () => void
}) {
  return (
    <FieldGroup title="Hazır renk kombinasyonları">
      <p className="dc-hint">
        Bir başlangıç seçin; renkleri ve detayları sonra ayrı ayrı değiştirebilirsiniz.
      </p>
      <div className="dc-kitchen-styles">
        {kitchenStyles.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-pressed={
              c.o.renk === preset.options.renk &&
              c.o.renk2 === preset.options.renk2 &&
              c.o.kulp === preset.options.kulp &&
              c.o.iki === preset.options.iki
            }
            onClick={() => { edit((draft) => applyKitchenStyle(draft, preset.id)); onApply?.() }}
          >
            <span className="dc-kitchen-style-swatches" aria-hidden="true">
              <i style={{ background: palette[preset.options.renk ?? 'beyaz'].hex }} />
              <i
                style={{
                  background: palette[preset.options.renk2 ?? preset.options.renk ?? 'beyaz'].hex,
                }}
              />
            </span>
            <span>
              <strong>{preset.name}</strong>
              <small>{preset.detail}</small>
            </span>
          </button>
        ))}
      </div>
    </FieldGroup>
  )
}
export function KitchenGlassPanel(props: PanelProps) {
  const { config: c, edit, kitchenSelection, onKitchenSelect } = props
  const key =
    kitchenSelection?.row === 'returnUpper' && c.k?.layout !== 'straight' ? 'returnUpper' : 'upper'
  const row = kitchenRow(c, key)
  function option<K extends keyof Options>(key: K, value: Options[K]) {
    edit((draft) => {
      draft.o[key] = value
    })
  }
  return (
    <FieldGroup title="Cam vitrinler">
      {!c.o.ust ? (
        <p className="dc-hint">
          Cam vitrin tasarlamak için Ürün ve ölçü adımında üst dolapları açın.
        </p>
      ) : (
        <>
          <p className="dc-hint">
            Cam olacak üst modülleri seçin. Her vitrinin camını ayrı belirleyebilirsiniz.
          </p>
          {c.k?.layout !== 'straight' ? (
            <div className="dc-kitchen-row-tabs" role="group" aria-label="Vitrin sırası">
              {(['upper', 'returnUpper'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={key === value}
                  onClick={() => onKitchenSelect?.({ row: value, index: 0 })}
                >
                  {kitchenRowNames[value]}
                </button>
              ))}
            </div>
          ) : null}
          <div className="dc-kitchen-quick" role="group" aria-label="Cam olacak modüller">
            {row.t.map((kind, index) => (
              <button
                key={index}
                type="button"
                disabled={kind === 'hood'}
                aria-label={`${kitchenRowNames[key]} ${index + 1}. modül cam kapak`}
                aria-pressed={kind === 'glass'}
                onClick={() =>
                  edit((draft) =>
                    setKitchenKind(draft, key, index, kind === 'glass' ? 'door' : 'glass'),
                  )
                }
              >
                {index + 1}
              </button>
            ))}
          </div>
          <SelectField
            label="Cam çerçevesi"
            value={c.o.camc}
            values={[
              { value: 'siyah', label: 'Siyah' },
              { value: 'bronz', label: 'Bronz' },
              { value: 'alu', label: 'Doğal alüminyum' },
              { value: 'altin', label: 'Altın' },
            ]}
            onChange={(value) => option('camc', value)}
          />
          {row.t.map((kind, index) =>
            kind === 'glass' ? (
              <SelectField
                key={index}
                label={`${index + 1}. vitrin camı`}
                value={row.glass[index]}
                values={[
                  { value: 'seffaf', label: 'Şeffaf' },
                  { value: 'fume', label: 'Füme' },
                  { value: 'buzlu', label: 'Buzlu' },
                  { value: 'yivli', label: 'Yivli cam' },
                ]}
                onChange={(value) =>
                  edit((draft) => {
                    ensureKitchenModules(draft)
                    kitchenRow(draft, key).glass[index] = value
                  })
                }
              />
            ) : null,
          )}
        </>
      )}
    </FieldGroup>
  )
}
