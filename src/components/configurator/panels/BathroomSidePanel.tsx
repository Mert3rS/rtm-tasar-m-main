'use client'

import { palette } from '@/lib/configurator/config'
import {
  bathroomGeometry,
  bathroomSideOptions,
  setBathroomSideCell,
  setBathroomSideCellHeight,
  setBathroomSideCount,
  setBathroomSideDimension,
  setBathroomSideOption,
} from '@/lib/configurator/bathroom'
import {
  bathroomKindNames,
  bathroomSideKinds,
  bathroomSideLimits,
  bathroomSideRecommended,
} from '@/lib/configurator/bathroomSchema'
import { materialSchema, surfaceSchema } from '@/lib/configurator/finishSchema'
import { MaterialSwatch } from '../MaterialSwatch'
import { FieldGroup, NumberField, SelectField, Toggle } from './Fields'
import type { PanelProps } from './DesignPanels'

export function BathroomSidePanel({
  config: c,
  edit,
  bathroomSelection,
  onBathroomSelect,
}: PanelProps) {
  const side = bathroomSideOptions(c),
    row = side.interior
  const index = Math.min(
    bathroomSelection?.row === 'side' ? bathroomSelection.index : 0,
    row.h.length - 1,
  )
  const finish = side.finish ?? c.o
  return (
    <>
      <FieldGroup title="Boy dolabı">
        <Toggle
          label="Boy dolabını göster"
          checked={side.enabled}
          onChange={() => edit((draft) => setBathroomSideOption(draft, 'enabled', !side.enabled))}
        />
        {side.enabled ? (
          <>
            {(['width', 'height', 'depth', 'floorGap', 'gap'] as const).map((key) => (
              <NumberField
                key={key}
                label={
                  {
                    width: 'Boy dolabı genişliği',
                    height: 'Boy dolabı yüksekliği',
                    depth: 'Boy dolabı derinliği',
                    floorGap: 'Boy dolabının yerden yüksekliği',
                    gap: 'Lavabo ünitesi ile arası',
                  }[key]
                }
                value={side[key]}
                min={bathroomSideLimits[key][0]}
                max={bathroomSideLimits[key][1]}
                recommended={bathroomSideRecommended[key]}
                onChange={(value) => edit((draft) => setBathroomSideDimension(draft, key, value))}
              />
            ))}
            <SelectField
              label="Boy dolabı konumu"
              value={side.side}
              values={[
                { value: 'right', label: 'Alt dolabın sağında' },
                { value: 'left', label: 'Alt dolabın solunda' },
              ]}
              onChange={(value) => edit((draft) => setBathroomSideOption(draft, 'side', value))}
            />
            <Toggle
              label="Tezgâhın ön kenarıyla hizala"
              checked={side.alignment === 'front'}
              onChange={() =>
                edit((draft) =>
                  setBathroomSideOption(
                    draft,
                    'alignment',
                    side.alignment === 'front' ? 'back' : 'front',
                  ),
                )
              }
            />
            <p className="dc-hint">
              Lavabo ünitesi {c.d.w} cm · boy dolabı ve ara ile toplam{' '}
              {bathroomGeometry(c).totalWidth} cm.
            </p>
          </>
        ) : (
          <p className="dc-hint">
            Boy dolabı ayarlarınız korunur; yeniden açarak devam edebilirsiniz.
          </p>
        )}
      </FieldGroup>
      {side.enabled ? (
        <>
          <FieldGroup title="Boy dolabı gözleri">
            <div className="dc-kitchen-count">
              <button
                type="button"
                aria-label="Boy dolabı göz azalt"
                disabled={row.h.length <= 1}
                onClick={() => {
                  edit((draft) => setBathroomSideCount(draft, row.h.length - 1))
                  onBathroomSelect?.({ row: 'side', index: 0 })
                }}
              >
                −
              </button>
              <span>
                <strong>{row.h.length}</strong> göz
              </span>
              <button
                type="button"
                aria-label="Boy dolabı göz artır"
                disabled={row.h.length >= 6}
                onClick={() => edit((draft) => setBathroomSideCount(draft, row.h.length + 1))}
              >
                +
              </button>
            </div>
            <div className="dc-kitchen-quick" role="group" aria-label="Boy dolabı gözü seç">
              {row.h.map((height, i) => (
                <button
                  type="button"
                  key={i}
                  aria-label={`${i + 1}. boy dolabı gözünü seç`}
                  aria-pressed={index === i}
                  onClick={() => onBathroomSelect?.({ row: 'side', index: i })}
                >
                  {i + 1}
                  <small> · {height} cm</small>
                </button>
              ))}
            </div>
            <SelectField
              label="Boy dolabı göz tipi"
              value={row.t[index]}
              values={bathroomSideKinds.map((kind) => ({
                value: kind,
                label: bathroomKindNames[kind],
              }))}
              onChange={(kind) => edit((draft) => setBathroomSideCell(draft, index, { kind }))}
            />
            <NumberField
              label={`${index + 1}. boy dolabı gözü yüksekliği`}
              value={row.h[index]}
              min={row.h.length === 1 ? 100 : 18}
              max={side.height}
              onChange={(value) => edit((draft) => setBathroomSideCellHeight(draft, index, value))}
            />
            {row.t[index] === 'drawers' ? (
              <SelectField
                label="Boy dolabı çekmece sayısı"
                value={String(row.drawers[index])}
                values={['2', '3']}
                onChange={(value) =>
                  edit((draft) => setBathroomSideCell(draft, index, { drawers: Number(value) }))
                }
              />
            ) : (
              <SelectField
                label="Boy dolabı raf sayısı"
                value={String(row.shelves[index])}
                values={['0', '1', '2', '3', '4']}
                onChange={(value) =>
                  edit((draft) => setBathroomSideCell(draft, index, { shelves: Number(value) }))
                }
              />
            )}
            <p className="dc-hint">
              Göz yükseklikleri dolap yüksekliğini paylaşır. Bir gözü değiştirdiğinizde diğer gözler
              kalan alana göre düzenlenir.
            </p>
          </FieldGroup>
          <FieldGroup title="Boy dolabı malzemesi ve rengi">
            <Toggle
              label="Alt dolapla aynı malzeme ve renk"
              checked={!side.finish}
              onChange={() =>
                edit((draft) =>
                  setBathroomSideOption(
                    draft,
                    'finish',
                    side.finish
                      ? undefined
                      : { malz: c.o.malz, yuzey: c.o.yuzey, renk: c.o.renk, ral: c.o.ral },
                  ),
                )
              }
            />
            {side.finish ? (
              <>
                <SelectField
                  label="Boy dolabı malzemesi"
                  value={finish.malz}
                  values={materialSchema.options}
                  onChange={(malz) =>
                    edit((draft) => setBathroomSideOption(draft, 'finish', { ...finish, malz }))
                  }
                />
                <SelectField
                  label="Boy dolabı yüzeyi"
                  value={finish.yuzey}
                  values={surfaceSchema.options}
                  onChange={(yuzey) =>
                    edit((draft) => setBathroomSideOption(draft, 'finish', { ...finish, yuzey }))
                  }
                />
                <div className="dc-swatches" role="group" aria-label="Boy dolabı renk paleti">
                  {Object.entries(palette).map(([key, color]) => (
                    <button
                      type="button"
                      key={key}
                      title={color.name}
                      aria-label={`Boy dolabı rengi: ${color.name}`}
                      aria-pressed={finish.renk === key}
                      className={finish.renk === key ? 'selected' : ''}
                      onClick={() =>
                        edit((draft) =>
                          setBathroomSideOption(draft, 'finish', {
                            malz: finish.malz,
                            yuzey: finish.yuzey,
                            renk: key,
                            ral: '',
                          }),
                        )
                      }
                    >
                      <MaterialSwatch color={key} glossy={finish.yuzey === 'Parlak'} />
                      <span>{color.name}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="dc-hint">
                Malzeme ve renk değişiklikleri alt dolapla birlikte uygulanır.
              </p>
            )}
          </FieldGroup>
        </>
      ) : null}
    </>
  )
}
