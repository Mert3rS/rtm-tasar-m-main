'use client'

import { resize, type Config } from '@/lib/configurator/config'
import {
  kitchenDefaults,
  kitchenGeometry,
  kitchenLayouts,
  applyKitchenPreset,
  setKitchenLength,
  type KitchenOptions,
} from '@/lib/configurator/kitchen'
import { FieldGroup, NumberField, Toggle } from './Fields'

export function KitchenPanel({
  config: c,
  edit,
}: {
  config: Config
  edit: (fn: (c: Config) => void) => void
}) {
  const k = c.k ?? kitchenDefaults()
  function option<K extends keyof KitchenOptions>(key: K, value: KitchenOptions[K]) {
    edit((draft) => {
      if (!draft.k) {
        draft.k = kitchenDefaults()
        if (draft.d.h > 110) resize(draft, 'h', 88)
      }
      draft.k[key] = value
      if (key === 'length') setKitchenLength(draft, draft.k.length)
    })
  }
  const { hob, sink, oven } = kitchenGeometry(c)
  return (
    <>
      <FieldGroup title="Mutfak yerleşimi">
        <div className="dc-kitchen-starts" role="group" aria-label="Başlangıç düzenleri">
          <button
            type="button"
            onClick={() => edit((draft) => applyKitchenPreset(draft, 'reference'))}
          >
            <strong>Vitrinli 300</strong>
            <span>Cam, ankastre ve bulaşık makinesi</span>
          </button>
          <button
            type="button"
            onClick={() => edit((draft) => applyKitchenPreset(draft, 'compact'))}
          >
            <strong>Kompakt 240</strong>
            <span>Küçük mekânlar için dört modül</span>
          </button>
          <button
            type="button"
            onClick={() => edit((draft) => applyKitchenPreset(draft, 'balanced'))}
          >
            <strong>Dengeli 360</strong>
            <span>Geniş çalışma ve depolama alanı</span>
          </button>
        </div>
        <p className="dc-hint">
          Başlangıç düzeni ölçü ve modülleri değiştirir. Geri al ile önceki tasarıma dönebilirsiniz.
        </p>
        <p className="dc-hint">
          Duvarlarınıza uygun planı seçin. L yerleşimde dönüş uzunluğu köşeyi de içerir.
        </p>
        <div className="dc-kitchen-layouts">
          {kitchenLayouts.map(({ value, label, path }) => (
            <button
              key={value}
              type="button"
              aria-pressed={Boolean(c.k) && k.layout === value}
              onClick={() => option('layout', value)}
            >
              <svg viewBox="0 0 40 40" aria-hidden="true">
                <path d={path} />
              </svg>
              <span>{label}</span>
            </button>
          ))}
        </div>
        {c.k && k.layout !== 'straight' ? (
          <>
            <NumberField
              label="Dönüş duvarı uzunluğu"
              value={k.length}
              min={Math.max(120, c.d.d + 60)}
              max={400}
              slider
              onChange={(value) => option('length', value)}
            />
            <p className="dc-hint">
              Köşe sabittir; dönüşteki kapaklı modüller uzunluğa göre eşit dağılır. Ana duvardaki
              köşe alanı kör köşe olarak ayrılır.
            </p>
          </>
        ) : null}
      </FieldGroup>
      {c.k ? (
        <FieldGroup title="Üst dolap ve çalışma alanı">
          <Toggle
            label="Üst dolaplar"
            checked={c.o.ust}
            onChange={() =>
              edit((draft) => {
                draft.o.ust = !draft.o.ust
              })
            }
          />
          {c.o.ust ? (
            <>
              <NumberField
                label="Üst dolap yüksekliği"
                value={k.upperHeight}
                min={40}
                max={100}
                onChange={(value) => option('upperHeight', value)}
              />
              <NumberField
                label="Tezgâh arası yükseklik"
                value={k.gap}
                min={45}
                max={80}
                onChange={(value) => option('gap', value)}
              />
            </>
          ) : null}
          <Toggle
            label="Evye ve batarya"
            checked={k.sink}
            onChange={() => option('sink', !k.sink)}
          />
          <Toggle label="Ocak" checked={k.hob} onChange={() => option('hob', !k.hob)} />
          {k.hob ? (
            <Toggle
              label="Ankastre fırın"
              checked={k.oven}
              onChange={() => option('oven', !k.oven)}
            />
          ) : null}
          {(k.hob && !hob) || (k.sink && !sink) ? (
            <p className="dc-hint">
              Cihazlar için en az 50 cm genişliğinde ayrı modüller gerekir. Sığmayan cihaz çizime ve
              teklife eklenmez.
            </p>
          ) : null}
          {k.oven && k.hob && hob && !oven ? (
            <p className="dc-hint">Fırın için baza hariç en az 60 cm dolap yüksekliği gerekir.</p>
          ) : null}
          <p className="dc-hint">
            Cihazlar ve kör köşe yerleşim önizlemesidir. Üretim ölçüleri, tesisat ve cihaz uyumu
            teknik incelemede netleştirilir.
          </p>
        </FieldGroup>
      ) : null}
    </>
  )
}
