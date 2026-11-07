'use client'

import { baseHeight, palette, redistribute, resize, type Options } from '@/lib/configurator/config'
import {
  applyWardrobePreset,
  applyWardrobeStyle,
  assertWardrobeFits,
  setSlidingCount,
  setWardrobeCount,
  setWardrobeLayout,
  setWardrobeLoft,
  setWardrobeSystem,
  setWardrobeWidth,
  wardrobeMainHeight,
  wardrobeStyles,
} from '@/lib/configurator/wardrobe'
import {
  wardrobeDoorNames,
  wardrobeDoors,
  wardrobeLayoutNames,
  wardrobeLayouts,
  wardrobeMinimumHeight,
} from '@/lib/configurator/wardrobeSchema'
import { DetailIcon } from '../StudioIcon'
import { FieldGroup, NumberField, SelectField, Toggle } from './Fields'
import type { PanelProps } from './DesignPanels'

export function WardrobeStartPanel({ config: c, edit, onSelect }: PanelProps) {
  const wd = c.wardrobe
  return (
    <>
      <FieldGroup title="Gardırobunuza bir başlangıç seçin">
        <div className="dc-kitchen-starts" role="group" aria-label="Gardırop başlangıçları">
          {(
            [
              { id: 'reference', name: 'Çift 200', detail: 'İki geniş bölme · üst depolama' },
              { id: 'compact', name: 'Kompakt 160', detail: 'Çift askı · raf düzeni' },
              { id: 'showcase', name: 'Vitrinli 300', detail: 'Dört bölme · cam ve iç aydınlatma' },
            ] as const
          ).map((preset) => (
            <button
              type="button"
              key={preset.id}
              onClick={() => {
                edit((draft) => applyWardrobePreset(draft, preset.id))
                onSelect(0, 0)
              }}
            >
              <strong>{preset.name}</strong>
              <span>{preset.detail}</span>
            </button>
          ))}
        </div>
        <p className="dc-hint">
          Başlangıç seçimi ölçüleri ve iç düzeni yeniler. Geri al ile önceki tasarıma
          dönebilirsiniz.
        </p>
      </FieldGroup>
      {wd ? (
        <FieldGroup title="Üst depolama">
          <Toggle
            label="Üst depolama bölmesi"
            checked={wd.loft}
            onChange={() => edit((draft) => setWardrobeLoft(draft, !wd.loft))}
          />
          {wd.loft ? (
            <NumberField
              label="Üst depolama yüksekliği"
              value={wd.loftHeight}
              min={30}
              max={60}
              onChange={(value) => edit((draft) => setWardrobeLoft(draft, true, value))}
            />
          ) : null}
          <p className="dc-hint">
            Üst bölüm toplam gardırop yüksekliğinin içindedir. Ana bölümde {wardrobeMainHeight(c)}{' '}
            cm net iç yükseklik kalır.
          </p>
        </FieldGroup>
      ) : (
        <p className="dc-hint">
          Mevcut özel düzeniniz korunuyor. Başlangıç seçerek gelişmiş gardırop seçeneklerini
          açabilirsiniz.
        </p>
      )}
    </>
  )
}
export function WardrobeSectionsPanel({ config: c, edit, selected, onSelect }: PanelProps) {
  const wd = c.wardrobe
  if (!wd) return null
  const row = c.r.main,
    index = Math.min(selected, row.w.length - 1)
  return (
    <FieldGroup title="Bölmeleri mekânınıza göre ayarlayın">
      <div className="dc-kitchen-count">
        <button
          type="button"
          aria-label="Gardırop bölme azalt"
          disabled={row.lk.some(Boolean) || row.w.length <= 1}
          onClick={() => {
            edit((draft) => setWardrobeCount(draft, row.w.length - 1))
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
          aria-label="Gardırop bölme artır"
          disabled={row.lk.some(Boolean) || row.w.length >= 8 || c.d.w < (row.w.length + 1) * 45}
          onClick={() => edit((draft) => setWardrobeCount(draft, row.w.length + 1))}
        >
          +
        </button>
      </div>
      <div className="dc-kitchen-module-list">
        {row.w.map((width, s) => (
          <div key={s} className={s === index ? 'is-active' : ''}>
            <button type="button" aria-pressed={s === index} onClick={() => onSelect(s, 0)}>
              <span>
                {s + 1} <strong>{wardrobeLayoutNames[wd.layouts[s]]}</strong>
              </span>
              <small>{width} cm</small>
            </button>
            <button
              type="button"
              aria-label={`${s + 1}. gardırop bölmesi kilidi`}
              aria-pressed={row.lk[s]}
              onClick={() =>
                edit((draft) => {
                  draft.r.main.lk[s] = !draft.r.main.lk[s]
                })
              }
            >
              {row.lk[s] ? 'Kilitli' : 'Kilitle'}
            </button>
          </div>
        ))}
      </div>
      <NumberField
        label={`${index + 1}. bölme genişliği`}
        value={row.w[index]}
        min={45}
        max={c.d.w}
        slider
        disabled={row.lk[index]}
        onChange={(value) => edit((draft) => setWardrobeWidth(draft, index, value))}
      />
      <div className="dc-kitchen-quick" role="group" aria-label="Gardırop hızlı genişlik">
        {[45, 50, 60, 80, 90, 100, 120].map((width) => (
          <button
            type="button"
            key={width}
            aria-pressed={row.w[index] === width}
            disabled={row.lk[index]}
            onClick={() => edit((draft) => setWardrobeWidth(draft, index, width))}
          >
            {width}
          </button>
        ))}
      </div>
      <button
        className="dc-secondary"
        type="button"
        onClick={() =>
          edit((draft) => {
            draft.r.main.w = redistribute(
              draft.r.main.w.map((width, i) => (draft.r.main.lk[i] ? width : 1)),
              draft.r.main.lk,
              draft.d.w,
              45,
            )
          })
        }
      >
        Kilitsiz bölmeleri eşitle ↔
      </button>
      <p className="dc-hint">
        Kilitli ölçüler korunur. Her bölme en az 45 cm olmalıdır; geniş bölmelerde taşıyıcı ihtiyacı
        üretim öncesi değerlendirilir.
      </p>
    </FieldGroup>
  )
}
export function WardrobeBayPicker({ config: c, selected, onSelect }: PanelProps) {
  return (
    <div className="dc-kitchen-quick" role="group" aria-label="Gardırop bölmesi seç">
      {c.r.main.w.map((width, index) => (
        <button
          type="button"
          key={index}
          aria-label={`${index + 1}. gardırop bölmesini seç`}
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
function WardrobeDoorFields({ config: c, edit, selected }: PanelProps) {
  const wd = c.wardrobe
  if (!wd) return null
  return (
    <>
      <div className="dc-kitchen-type-grid" role="group" aria-label="Seçili gardırop kapak tipi">
        {wardrobeDoors.map((door) => (
          <button
            type="button"
            key={door}
            aria-pressed={wd.doors[selected] === door}
            onClick={() =>
              edit((draft) => {
                if (draft.wardrobe) draft.wardrobe.doors[selected] = door
              })
            }
          >
            {wardrobeDoorNames[door]}
          </button>
        ))}
      </div>
      {wd.doors[selected] === 'glass' ? (
        <SelectField
          label="Seçili bölmenin camı"
          value={wd.glass[selected]}
          values={[
            { value: 'seffaf', label: 'Şeffaf' },
            { value: 'fume', label: 'Füme' },
            { value: 'buzlu', label: 'Buzlu' },
            { value: 'yivli', label: 'Yivli' },
          ]}
          onChange={(value) =>
            edit((draft) => {
              if (draft.wardrobe) draft.wardrobe.glass[selected] = value
            })
          }
        />
      ) : null}
    </>
  )
}
export function WardrobeInteriorPanel(props: PanelProps) {
  const { config: c, edit, selected, onSelect } = props,
    wd = c.wardrobe
  if (!wd) return null
  const height = wardrobeMainHeight(c)
  return (
    <>
      <FieldGroup title="Her eşya için doğru alan">
        <div className="dc-kitchen-navigator">
          <button
            type="button"
            aria-label="Önceki gardırop bölmesi"
            onClick={() => onSelect((selected + c.r.main.w.length - 1) % c.r.main.w.length, 0)}
          >
            ←
          </button>
          <span>
            {selected + 1}. bölme · {c.r.main.w[selected]} cm
            <strong>{wardrobeLayoutNames[wd.layouts[selected]]}</strong>
          </span>
          <button
            type="button"
            aria-label="Sonraki gardırop bölmesi"
            onClick={() => onSelect((selected + 1) % c.r.main.w.length, 0)}
          >
            →
          </button>
        </div>
        <div
          className="dc-kitchen-type-grid dc-wardrobe-layouts"
          role="group"
          aria-label="Gardırop iç düzeni"
        >
          {wardrobeLayouts.map((layout) => (
            <button
              type="button"
              key={layout}
              aria-pressed={wd.layouts[selected] === layout}
              disabled={height < wardrobeMinimumHeight(layout, wd.drawers[selected])}
              onClick={() => edit((draft) => setWardrobeLayout(draft, selected, layout))}
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
                    layout === 'long'
                      ? 'M5 8h22M5 32h22'
                      : layout === 'double'
                        ? 'M5 8h22M5 24h22'
                        : layout === 'drawers'
                          ? 'M5 8h22M5 26h22M5 30h22M5 34h22'
                          : layout === 'short'
                            ? 'M5 7h22M5 12h22M5 31h22'
                            : 'M5 9h22M5 16h22M5 23h22M5 30h22'
                  }
                />
              </svg>
              <span>{wardrobeLayoutNames[layout]}</span>
            </button>
          ))}
        </div>
        <p className="dc-hint">
          Net iç yükseklik {height} cm. Pasif düzenler için üst depolamayı küçültebilir veya toplam
          yüksekliği artırabilirsiniz.
        </p>
        {wd.layouts[selected] === 'drawers' ? (
          <SelectField
            label="İç çekmece sayısı"
            value={String(wd.drawers[selected])}
            values={['2', '3', '4']}
            onChange={(value) =>
              edit((draft) => {
                if (draft.wardrobe) draft.wardrobe.drawers[selected] = Number(value)
                assertWardrobeFits(draft)
              })
            }
          />
        ) : null}
        {['shelves', 'shoes'].includes(wd.layouts[selected]) ? (
          <SelectField
            label="Raf sayısı"
            value={String(wd.shelves[selected])}
            values={['2', '3', '4', '5', '6', '7']}
            onChange={(value) =>
              edit((draft) => {
                if (draft.wardrobe) draft.wardrobe.shelves[selected] = Number(value)
              })
            }
          />
        ) : null}
      </FieldGroup>
      {c.o.acilim !== 'surgulu' ? (
        <FieldGroup title="Bu bölmenin kapağı">
          <WardrobeDoorFields {...props} />
          <p className="dc-hint">Seçim ana bölüm içindir; üst depolama kapakları standart kalır.</p>
        </FieldGroup>
      ) : (
        <p className="dc-hint">Sürgülü dış panelleri Kapak ve renk adımında düzenleyebilirsiniz.</p>
      )}
      <WardrobeBayPicker {...props} />
    </>
  )
}
export function WardrobeStylePanel(props: PanelProps & { onApply?: () => void }) {
  const { config: c, edit, onApply } = props,
    wd = c.wardrobe
  if (!wd) return null
  return (
    <>
      <FieldGroup title="Hazır gardırop kombinasyonları">
        <div className="dc-kitchen-styles">
          {wardrobeStyles.map((style) => (
            <button
              type="button"
              key={style.id}
              aria-pressed={
                c.o.renk === style.options.renk &&
                c.o.kulp === style.options.kulp &&
                c.o.iki === style.options.iki
              }
              onClick={() => {
                edit((draft) => applyWardrobeStyle(draft, style.id))
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
      <FieldGroup title="Kapak sistemi">
        <div className="dc-kitchen-row-tabs" role="group" aria-label="Gardırop kapak sistemi">
          {(['mentese', 'surgulu'] as const).map((system) => (
            <button
              type="button"
              key={system}
              aria-pressed={c.o.acilim === system}
              onClick={() => edit((draft) => setWardrobeSystem(draft, system))}
            >
              {system === 'mentese' ? 'Menteşeli' : 'Sürgülü'}
            </button>
          ))}
        </div>
        {c.o.acilim === 'surgulu' ? (
          <>
            <p className="dc-hint">
              Sürgülü seçiminde derinlik en az 60 cm ve kulp gömme olarak ayarlanır. Dış paneller iç
              bölmelerden bağımsızdır; üst depolama dahil tam boy çizilir.
            </p>
            <SelectField
              label="Sürgü paneli sayısı"
              value={String(wd.slidingDoors.length)}
              values={['2', '3', '4']}
              onChange={(value) => edit((draft) => setSlidingCount(draft, Number(value)))}
            />
            {wd.slidingDoors.map((door, index) => (
              <div className="dc-cell-card" key={index}>
                <SelectField
                  label={`${index + 1}. sürgü paneli`}
                  value={door}
                  values={[
                    { value: 'solid', label: 'Standart' },
                    { value: 'mirror', label: 'Aynalı' },
                    { value: 'glass', label: 'Cam' },
                  ]}
                  onChange={(value) =>
                    edit((draft) => {
                      if (draft.wardrobe) draft.wardrobe.slidingDoors[index] = value
                    })
                  }
                />
                {door === 'glass' ? (
                  <SelectField
                    label={`${index + 1}. sürgü camı`}
                    value={wd.slidingGlass[index]}
                    values={[
                      { value: 'seffaf', label: 'Şeffaf' },
                      { value: 'fume', label: 'Füme' },
                      { value: 'buzlu', label: 'Buzlu' },
                      { value: 'yivli', label: 'Yivli' },
                    ]}
                    onChange={(value) =>
                      edit((draft) => {
                        if (draft.wardrobe) draft.wardrobe.slidingGlass[index] = value
                      })
                    }
                  />
                ) : null}
              </div>
            ))}
          </>
        ) : (
          <>
            <WardrobeBayPicker {...props} />
            <WardrobeDoorFields {...props} />
          </>
        )}
        <p className="dc-hint">
          Ayna ve cam yansımaları temsilîdir. Ray, menteşe ve montaj boşlukları üretim öncesi
          doğrulanır.
        </p>
        {(c.o.acilim === 'surgulu' ? wd.slidingDoors : wd.doors).includes('glass') ? (
          <SelectField
            label="Gardırop cam çerçevesi"
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
      </FieldGroup>
    </>
  )
}
export function WardrobeDetailsPanel({ config: c, edit }: PanelProps) {
  function option<K extends keyof Options>(key: K, value: Options[K]) {
    edit((draft) => {
      draft.o[key] = value
    })
  }
  const handles: Options['kulp'][] =
    c.o.acilim === 'surgulu'
      ? ['gomme', 'kenar-profil', 'yok']
      : ['gola', 'bas-ac', 'cubuk', 'dugme', 'kenar-profil', 'gomme', 'yok']
  const names: Record<Options['kulp'], string> = {
    gola: 'Gizli kulp',
    'bas-ac': 'Bas-aç',
    cubuk: 'Uzun çubuk kulp',
    dugme: 'Düğme kulp',
    'kenar-profil': 'Profil kulp',
    gomme: 'Gömme kulp',
    yok: 'Kulpsuz',
  }
  return (
    <>
      <FieldGroup title="İnce detaylarla tamamlayın">
        <div className="dc-detail-options" role="group" aria-label="Gardırop kulp modeli">
          {handles.map((handle) => (
            <button
              type="button"
              key={handle}
              aria-pressed={c.o.kulp === handle}
              onClick={() => option('kulp', handle)}
            >
              <DetailIcon value={handle} />
              <span>{names[handle]}</span>
            </button>
          ))}
        </div>
        <SelectField
          label="Kulp rengi"
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
              assertWardrobeFits(draft)
            })
          }
        />
        <Toggle
          label="Üst bitiş paneli"
          checked={c.o.panel}
          onChange={() => option('panel', !c.o.panel)}
        />
        <p className="dc-hint">
          Baza dahil dış yükseklik {c.d.h} cm · baza {baseHeight(c)} cm.
        </p>
      </FieldGroup>
      <FieldGroup title="İsteğe bağlı aydınlatma">
        {(
          [
            { key: 'ic', label: 'Dikey iç LED' },
            { key: 'raf', label: 'Raf altı LED' },
            { key: 'ust', label: 'Üst iç aydınlatma' },
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
